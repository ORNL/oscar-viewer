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
    minTimestampMs?: number;
}

export const ACTIVE_ALARM_WINDOW_DAYS = 15;
export const ACTIVE_ALARM_WINDOW_MS = ACTIVE_ALARM_WINDOW_DAYS * 24 * 60 * 60 * 1000;

export type AlarmTimeWindowPreset = "15m" | "1h" | "24h" | "15d";

export const ALARM_TIME_WINDOW_PRESET_MS: Record<AlarmTimeWindowPreset, number> = {
    "15m": 15 * 60 * 1000,
    "1h": 60 * 60 * 1000,
    "24h": 24 * 60 * 60 * 1000,
    "15d": ACTIVE_ALARM_WINDOW_MS,
};

export function computeActiveAlarmWindowStartIso(
    cutoffIso: string,
    windowMs = ACTIVE_ALARM_WINDOW_MS,
): string | undefined {
    const cutoffMs = Date.parse(cutoffIso);
    if (!Number.isFinite(cutoffMs)) return undefined;
    return new Date(cutoffMs - windowMs).toISOString();
}

export function computeActiveAlarmPhenomenonTime(
    cutoffIso: string,
    windowMs = ACTIVE_ALARM_WINDOW_MS,
    minTimestampMs?: number,
): string | undefined {
    const cutoffMs = Date.parse(cutoffIso);
    if (!Number.isFinite(cutoffMs)) return undefined;
    const windowStartMs = cutoffMs - windowMs;
    const watermarkFloorMs = typeof minTimestampMs === "number"
        && Number.isFinite(minTimestampMs)
        && minTimestampMs > 0
        ? Math.max(0, minTimestampMs - 60_000)
        : 0;
    const startMs = Math.max(windowStartMs, watermarkFloorMs);
    return `${new Date(startMs).toISOString()}/..`;
}

export interface CountFetchOptions {
    signal?: AbortSignal;
    lowPriority?: boolean;
    phenomenonTime?: string;
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
    if (options?.phenomenonTime) params.set("phenomenonTime", options.phenomenonTime);
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
    phenomenonTimeForCutoff?: (cutoff: string, plan?: EventQueryPlan) => string | undefined;
    rowFilter?: (row: EventTableData) => boolean;
    extraFetchRows?: number;
    filterModeActive?: boolean;
    /**
     * True when `pageQueryPlans` partitions the total query strictly in priority
     * order into pairwise-disjoint buckets (e.g. non-RS350 Gamma&Neutron -> Neutron -> Gamma -> None),
     * enabling O(pageSize) offset/limit slicing on page >= 1 instead of fetching `(page + 1) * pageSize`
     * rows from every priority bucket.
     */
    disjointPriorityPlans?: boolean;
    pageChangeDebounceMs?: number;
    fetchPlanRows: (
        plan: EventQueryPlan,
        limit: number,
        offset: number,
        cutoff?: string,
        signal?: AbortSignal,
    ) => Promise<EventTableData[]>;
}

const DEFAULT_PAGE_CHANGE_DEBOUNCE_MS = 120;

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
    fetchPage: (targetPage: number, cutoffOverride?: string, minExtraRows?: number) => Promise<void>;
}

export function useAbortableEventQueries({
    queryPlans,
    pageQueryPlans,
    page,
    pageSize,
    pageLoadedTime,
    phenomenonTimeForCutoff,
    rowFilter,
    extraFetchRows = 0,
    filterModeActive = false,
    disjointPriorityPlans = false,
    pageChangeDebounceMs = DEFAULT_PAGE_CHANGE_DEBOUNCE_MS,
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
    const pageDebounceTimerRef = useRef<number | null>(null);
    const bucketCountsCacheRef = useRef<{key: string; counts: number[]} | null>(null);
    const rowFilterRef = useRef(rowFilter);
    const extraFetchRowsRef = useRef(extraFetchRows);
    rowFilterRef.current = rowFilter;
    extraFetchRowsRef.current = extraFetchRows;

    const clearPendingPageDebounce = useCallback(() => {
        if (pageDebounceTimerRef.current !== null && typeof window !== "undefined") {
            window.clearTimeout(pageDebounceTimerRef.current);
            pageDebounceTimerRef.current = null;
        }
    }, []);

    useEffect(() => () => {
        clearPendingPageDebounce();
        countAbortRef.current?.abort();
        pageAbortRef.current?.abort();
    }, [clearPendingPageDebounce]);

    const fetchPlanCount = useCallback(
        (
            plan: EventQueryPlan,
            cutoff = pageLoadedTime,
            strict = false,
            options?: CountFetchOptions,
        ) => {
            const phenomenonTime = options?.phenomenonTime ?? phenomenonTimeForCutoff?.(cutoff, plan);
            const mergedOptions = phenomenonTime && options?.phenomenonTime === undefined
                ? {...options, phenomenonTime}
                : options;
            return fetchObservationPlanCount(plan, cutoff, strict, mergedOptions);
        },
        [pageLoadedTime, phenomenonTimeForCutoff],
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

    const fetchPage = useCallback(async (targetPage: number, cutoffOverride?: string, minExtraRows = 0) => {
        clearPendingPageDebounce();
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
            if (pageQueryPlans.length === 1 && !filterModeActive) {
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
            if (disjointPriorityPlans && !filterModeActive && targetPage >= 1 && pageQueryPlans.length > 1) {
                const cacheKey = `${effectiveCutoff}\u001e${pageQueryPlans
                    .map(plan => `${plan.key}\u001f${plan.datastreamIds.join(",")}\u001f${plan.filter}`)
                    .join("\u001d")}`;
                let bucketCounts = bucketCountsCacheRef.current?.key === cacheKey
                    ? bucketCountsCacheRef.current.counts
                    : null;
                if (!bucketCounts) {
                    try {
                        const fetchedCounts = await runWithConcurrency(
                            pageQueryPlans,
                            6,
                            plan => fetchPlanCount(plan, effectiveCutoff, true, {
                                signal: controller.signal,
                            }),
                        );
                        if (controller.signal.aborted || requestId !== pageRequestRef.current) return;
                        bucketCounts = fetchedCounts;
                        bucketCountsCacheRef.current = {key: cacheKey, counts: fetchedCounts};
                    } catch (countErr) {
                        if (controller.signal.aborted || isAbortRequestError(countErr) || requestId !== pageRequestRef.current) {
                            return;
                        }
                        bucketCounts = null;
                    }
                }
                if (bucketCounts) {
                    const winStart = targetPage * pageSize;
                    const winEnd = winStart + pageSize;
                    const slicePlans: Array<{plan: EventQueryPlan; offset: number; limit: number}> = [];
                    let prefix = 0;
                    for (let i = 0; i < pageQueryPlans.length; i++) {
                        const bucketCount = Math.max(0, bucketCounts[i] ?? 0);
                        const bucketStart = prefix;
                        const bucketEnd = prefix + bucketCount;
                        prefix = bucketEnd;
                        const overlapStart = Math.max(winStart, bucketStart);
                        const overlapEnd = Math.min(winEnd, bucketEnd);
                        if (overlapStart < overlapEnd) {
                            slicePlans.push({
                                plan: pageQueryPlans[i],
                                offset: overlapStart - bucketStart,
                                limit: overlapEnd - overlapStart,
                            });
                        }
                    }
                    if (slicePlans.length === 0) {
                        if (controller.signal.aborted || requestId !== pageRequestRef.current) return;
                        setRows([]);
                        currentPageRef.current = targetPage;
                        setPageQueryError(false);
                        return;
                    }
                    const sliceResults = await runWithConcurrency(
                        slicePlans,
                        6,
                        slice => fetchPlanRows(
                            slice.plan,
                            slice.limit,
                            slice.offset,
                            effectiveCutoff,
                            controller.signal,
                        ),
                    );
                    if (controller.signal.aborted || requestId !== pageRequestRef.current) return;
                    setRows(deduplicateEvents(sliceResults.flat()).slice(0, pageSize));
                    currentPageRef.current = targetPage;
                    setPageQueryError(false);
                    return;
                }
            }
            const required = (targetPage + 1) * pageSize;
            const requestedExtra = Math.max(extraFetchRowsRef.current || 0, minExtraRows || 0);
            const boundedExtra = filterModeActive
                ? Math.max(0, Math.min(requestedExtra, 50))
                : 0;
            const fetchLimit = required + boundedExtra;
            const results = await runWithConcurrency(
                pageQueryPlans,
                6,
                plan => fetchPlanRows(plan, fetchLimit, 0, effectiveCutoff, controller.signal),
            );
            if (controller.signal.aborted || requestId !== pageRequestRef.current) return;
            const deduped = deduplicateEvents(results.flat());
            const activeRowFilter = filterModeActive ? rowFilterRef.current : undefined;
            const filtered = activeRowFilter ? deduped.filter(activeRowFilter) : deduped;
            const merged = filtered.sort(sortEventsByAlarmPriority);
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
    }, [
        clearPendingPageDebounce,
        disjointPriorityPlans,
        fetchPlanCount,
        fetchPlanRows,
        filterModeActive,
        pageLoadedTime,
        pageQueryPlans,
        pageSize,
    ]);

    useEffect(() => {
        clearPendingPageDebounce();
        bucketCountsCacheRef.current = null;
        previousPageRef.current = 0;
        void refreshCounts();
        void fetchPage(0);
    }, [clearPendingPageDebounce, refreshCounts, fetchPage]);

    useEffect(() => {
        const previousPage = previousPageRef.current;
        previousPageRef.current = page;
        currentPageRef.current = page;
        if (page > 0 || previousPage !== 0) {
            clearPendingPageDebounce();
            pageAbortRef.current?.abort();
            pageAbortRef.current = null;
            ++pageRequestRef.current;
            if (pageQueryPlans.length === 0) {
                setRows([]);
                setLoading(false);
                return;
            }
            if (pageChangeDebounceMs <= 0 || typeof window === "undefined") {
                void fetchPage(page);
                return;
            }
            setLoading(true);
            pageDebounceTimerRef.current = window.setTimeout(() => {
                pageDebounceTimerRef.current = null;
                void fetchPage(page);
            }, pageChangeDebounceMs);
        }
        return () => {
            clearPendingPageDebounce();
        };
    }, [page, fetchPage, clearPendingPageDebounce, pageChangeDebounceMs, pageQueryPlans.length]);

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
