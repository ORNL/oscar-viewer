import {Dispatch, MutableRefObject, SetStateAction, useCallback, useEffect, useRef, useState} from "react";

import {runWithConcurrency} from "@/lib/data/oscar/BulkAdjudication";
import {eventSelectionKey} from "@/lib/data/oscar/EventFilter";
import {LaneMapEntry} from "@/lib/data/oscar/LaneCollection";
import {EventTableData, sortEventsByAlarmPriority} from "@/lib/data/oscar/TableHelpers";

export interface EventQueryPlan {
    key: string;
    node: LaneMapEntry["parentNode"];
    datastreamIds: string[];
    filter: string;
}

export interface CountFetchOptions {
    signal?: AbortSignal;
    lowPriority?: boolean;
}

export const deduplicateEvents = (events: EventTableData[]): EventTableData[] => {
    const result = new Map<string, EventTableData>();
    events.forEach(event => result.set(eventSelectionKey(event), event));
    return Array.from(result.values());
};

export function isAbortRequestError(error: unknown): boolean {
    if (!error) return false;
    if (typeof DOMException !== "undefined" && error instanceof DOMException && error.name === "AbortError") {
        return true;
    }
    return typeof error === "object" && "name" in error && (error as {name?: unknown}).name === "AbortError";
}

export async function fetchCollectionDataWithSignal(collection: any, signal?: AbortSignal): Promise<any[]> {
    if (!signal || typeof collection?.url !== "string" || typeof collection?.filter?.toQueryString !== "function") {
        return collection.fetchData();
    }
    const queryString = `${collection.filter.toQueryString()}&offset=${collection.pageOffset}&limit=${collection.pageSize}`;
    const fullUrl = `${collection.url}?${queryString}`;
    const response = await fetch(fullUrl, {
        method: "GET",
        credentials: "include",
        headers: collection.headers ?? {},
        signal,
    });
    if (!response.ok) {
        const err = new Error(`Got ${response.status} response from ${fullUrl}`) as Error & {response?: Response};
        err.response = response;
        throw err;
    }
    const payload = collection.responseFormat === "arraybuffer"
        ? await response.arrayBuffer()
        : await response.json();
    return collection.parseResponse(payload);
}

export async function fetchObservationPlanCount(
    plan: EventQueryPlan,
    cutoff: string,
    strict = false,
    options?: CountFetchOptions,
): Promise<number> {
    const params = new URLSearchParams({
        resultTime: `../${cutoff}`,
        format: "application/om+json",
        dataStream: plan.datastreamIds.join(","),
    });
    if (plan.filter) params.set("filter", plan.filter);
    try {
        const requestInit: RequestInit = {
            headers: {...plan.node.getBasicAuthHeader(), "Content-Type": "sml+json"},
            credentials: "include",
            signal: options?.signal,
            ...(options?.lowPriority ? ({priority: "low"} as RequestInit) : {}),
        };
        const response = await fetch(`${plan.node.getConnectedSystemsEndpoint(false)}/observations/count?${params}`, requestInit);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return Number((await response.json()).count) || 0;
    } catch (error) {
        if (options?.signal?.aborted || isAbortRequestError(error)) {
            if (strict) throw error;
            return 0;
        }
        console.error("Error fetching filtered event count", error);
        if (strict) throw error;
        return 0;
    }
}

export interface UseAbortableEventQueriesArgs {
    queryPlans: EventQueryPlan[];
    pageQueryPlans: EventQueryPlan[];
    page: number;
    pageSize: number;
    pageLoadedTime: string;
    fetchPlanRows: (
        plan: EventQueryPlan,
        limit: number,
        offset: number,
        cutoff?: string,
        signal?: AbortSignal,
    ) => Promise<EventTableData[]>;
}

export interface UseAbortableEventQueriesResult {
    rows: EventTableData[];
    setRows: Dispatch<SetStateAction<EventTableData[]>>;
    rowCount: number;
    setRowCount: Dispatch<SetStateAction<number>>;
    loading: boolean;
    setLoading: Dispatch<SetStateAction<boolean>>;
    countQueryError: boolean;
    pageQueryError: boolean;
    currentPageRef: MutableRefObject<number>;
    fetchPlanCount: (
        plan: EventQueryPlan,
        cutoff?: string,
        strict?: boolean,
        options?: CountFetchOptions,
    ) => Promise<number>;
    refreshCounts: (cutoffOverride?: string) => Promise<void>;
    fetchPage: (targetPage: number, cutoffOverride?: string) => Promise<void>;
}

export function useAbortableEventQueries({
    queryPlans,
    pageQueryPlans,
    page,
    pageSize,
    pageLoadedTime,
    fetchPlanRows,
}: UseAbortableEventQueriesArgs): UseAbortableEventQueriesResult {
    const [rows, setRows] = useState<EventTableData[]>([]);
    const [rowCount, setRowCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [countQueryError, setCountQueryError] = useState(false);
    const [pageQueryError, setPageQueryError] = useState(false);
    const currentPageRef = useRef(0);
    const previousPageRef = useRef(page);
    const countRequestRef = useRef(0);
    const pageRequestRef = useRef(0);
    const countAbortRef = useRef<AbortController | null>(null);
    const pageAbortRef = useRef<AbortController | null>(null);

    useEffect(() => () => {
        countAbortRef.current?.abort();
        pageAbortRef.current?.abort();
    }, []);

    const fetchPlanCount = useCallback(
        (
            plan: EventQueryPlan,
            cutoff = pageLoadedTime,
            strict = false,
            options?: CountFetchOptions,
        ) => fetchObservationPlanCount(plan, cutoff, strict, options),
        [pageLoadedTime],
    );

    const refreshCounts = useCallback(async (cutoffOverride?: string) => {
        const effectiveCutoff = cutoffOverride ?? pageLoadedTime;
        countAbortRef.current?.abort();
        const requestId = ++countRequestRef.current;
        if (queryPlans.length === 0) {
            countAbortRef.current = null;
            setRowCount(0);
            setCountQueryError(false);
            return;
        }
        const controller = new AbortController();
        countAbortRef.current = controller;
        try {
            const counts = await runWithConcurrency(
                queryPlans,
                6,
                plan => fetchPlanCount(plan, effectiveCutoff, true, {
                    signal: controller.signal,
                    lowPriority: true,
                }),
            );
            if (controller.signal.aborted || requestId !== countRequestRef.current) return;
            setRowCount(counts.reduce((sum, count) => sum + count, 0));
            setCountQueryError(false);
        } catch (error) {
            if (controller.signal.aborted || isAbortRequestError(error) || requestId !== countRequestRef.current) return;
            console.error("Error fetching filtered event counts", error);
            setCountQueryError(true);
        } finally {
            if (countAbortRef.current === controller) {
                countAbortRef.current = null;
            }
        }
    }, [queryPlans, fetchPlanCount, pageLoadedTime]);

    const fetchPage = useCallback(async (targetPage: number, cutoffOverride?: string) => {
        const effectiveCutoff = cutoffOverride ?? pageLoadedTime;
        pageAbortRef.current?.abort();
        const requestId = ++pageRequestRef.current;
        if (pageQueryPlans.length === 0) {
            pageAbortRef.current = null;
            setRows([]);
            setLoading(false);
            setPageQueryError(false);
            return;
        }
        const controller = new AbortController();
        pageAbortRef.current = controller;
        setLoading(true);
        try {
            if (pageQueryPlans.length === 1) {
                const pageRows = await fetchPlanRows(
                    pageQueryPlans[0],
                    pageSize,
                    targetPage * pageSize,
                    effectiveCutoff,
                    controller.signal,
                );
                if (controller.signal.aborted || requestId !== pageRequestRef.current) return;
                setRows(deduplicateEvents(pageRows));
                currentPageRef.current = targetPage;
                setPageQueryError(false);
                return;
            }
            const required = (targetPage + 1) * pageSize;
            const results = await runWithConcurrency(
                pageQueryPlans,
                6,
                plan => fetchPlanRows(plan, required, 0, effectiveCutoff, controller.signal),
            );
            if (controller.signal.aborted || requestId !== pageRequestRef.current) return;
            const merged = deduplicateEvents(results.flat())
                .sort(sortEventsByAlarmPriority);
            setRows(merged.slice(targetPage * pageSize, required));
            currentPageRef.current = targetPage;
            setPageQueryError(false);
        } catch (error) {
            if (controller.signal.aborted || isAbortRequestError(error) || requestId !== pageRequestRef.current) return;
            console.error("Error fetching filtered events", error);
            setRows([]);
            setPageQueryError(true);
        } finally {
            if (pageAbortRef.current === controller) {
                pageAbortRef.current = null;
            }
            if (!controller.signal.aborted && requestId === pageRequestRef.current) {
                setLoading(false);
            }
        }
    }, [pageQueryPlans, pageSize, fetchPlanRows, pageLoadedTime]);

    useEffect(() => {
        previousPageRef.current = 0;
        void refreshCounts();
        void fetchPage(0);
    }, [refreshCounts, fetchPage]);

    useEffect(() => {
        const previousPage = previousPageRef.current;
        previousPageRef.current = page;
        currentPageRef.current = page;
        if (page > 0 || previousPage !== 0) {
            void fetchPage(page);
        }
    }, [page, fetchPage]);

    return {
        rows,
        setRows,
        rowCount,
        setRowCount,
        loading,
        setLoading,
        countQueryError,
        pageQueryError,
        currentPageRef,
        fetchPlanCount,
        refreshCounts,
        fetchPage,
    };
}
