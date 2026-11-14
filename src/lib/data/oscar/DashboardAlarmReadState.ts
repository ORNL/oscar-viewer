import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {INode} from "@/lib/data/osh/Node";
import {EventTableData} from "@/lib/data/oscar/TableHelpers";
import {EventFilterNode, isRuleComplete} from "@/lib/data/oscar/EventFilter";

export const DASHBOARD_READ_STATE_SCHEMA_VERSION = 1;
export const MAX_DASHBOARD_READ_KEYS_PER_LANE = 500;
export const MAX_DASHBOARD_READ_KEY_LENGTH = 256;
export const MAX_DASHBOARD_READ_STATE_BYTES = 512 * 1024;
export const DASHBOARD_READ_STATE_POLL_INTERVAL_MS = 10_000;
export const DASHBOARD_READ_STATE_FLUSH_DELAY_MS = 80;
export const UNREAD_COUNT_RECONCILIATION_CAP = 100;
export const MAX_UNREAD_RECONCILIATION_FETCH = 150;

const LOCAL_FALLBACK_STORAGE_PREFIX = "oscar.dashboardAlarmReadState.v1:";
const CONTROL_CHARS_RE = /[\u0000-\u001f\u007f-\u009f]+/g;

export type DashboardReadStateFetch = (
    input: RequestInfo | URL,
    init?: RequestInit,
) => Promise<Response>;

export type DashboardReadStateNode = Pick<
    INode,
    | "id"
    | "address"
    | "port"
    | "isSecure"
    | "isDefaultNode"
    | "oshPathRoot"
    | "bucketsEndpoint"
    | "getBasicAuthHeader"
>;

export interface DashboardLaneReadState {
    acknowledgedThroughMs: number;
    readKeys: string[];
    readKeySet: Set<string>;
}

export interface DashboardNodeReadState {
    revision: number;
    etag: string | null;
    lanes: Map<string, DashboardLaneReadState>;
}

export interface DashboardLaneUpdatePayload {
    acknowledgeAll?: boolean;
    acknowledgedThroughMs?: number;
    readKeys?: string[];
}

export interface DashboardReadStateResponse {
    schemaVersion: number;
    revision: number;
    updatedAt: string;
    lanes: Record<string, {
        acknowledgedThroughMs?: number;
        readKeys?: string[];
    }>;
}

export interface ScopedLaneTarget {
    nodeId: string;
    laneId: string;
    acknowledgedThroughMs?: number;
}

function sanitizePrintableToken(raw: unknown, maxLength: number): string {
    if (raw === null || raw === undefined) return "";
    const cleaned = String(raw).replace(CONTROL_CHARS_RE, "").trim();
    return cleaned.length > maxLength ? cleaned.slice(0, maxLength) : cleaned;
}

function normalizeConfiguredPath(path: string | undefined, fallback: string): string {
    const input = (path || fallback).replace(/\\/g, "/");
    const segments = input.split("/").filter(segment => segment && segment !== ".");
    if (segments.some(segment => segment === "..")) {
        throw new Error("Unsafe bucket endpoint path");
    }
    return `/${segments.map(segment => encodeURIComponent(segment)).join("/")}`;
}

function authenticationHeaders(node: DashboardReadStateNode): Record<string, string> {
    const supplied = node.getBasicAuthHeader?.();
    const authorization = supplied && typeof supplied.Authorization === "string"
        ? supplied.Authorization
        : undefined;
    return authorization ? {Authorization: authorization} : {};
}

export function buildDashboardAlarmReadStateUrl(
    node: DashboardReadStateNode,
    sinceRevision?: number,
): string {
    const root = normalizeConfiguredPath(node.oshPathRoot, "/sensorhub");
    const buckets = normalizeConfiguredPath(node.bucketsEndpoint, "/buckets");
    const relative = `${root}${buckets}/adjudication/dashboard-read-state`;
    const base = node.isDefaultNode
        ? relative
        : `${node.isSecure ? "https" : "http"}://${node.address}:${node.port}${relative}`;
    if (typeof sinceRevision === "number" && Number.isSafeInteger(sinceRevision) && sinceRevision >= 0) {
        return `${base}?sinceRevision=${sinceRevision}`;
    }
    return base;
}

/**
 * Computes printable canonical read keys for an occupancy alarm row.
 * Emits both a deterministic temporal key (present on live MQTT events immediately on arrival)
 * and, when available, the durable observation key (`occupancyObsId`) so marking a live row read
 * survives `replaceRealtimeEventIdentity` and synchronizes across browsers.
 */
export function getDashboardAlarmReadKeys(
    event: Pick<EventTableData, "laneId" | "occupancyCount" | "startTime" | "endTime" | "occupancyObsId">,
): string[] {
    const laneToken = sanitizePrintableToken(event.laneId, 96);
    const occToken = sanitizePrintableToken(event.occupancyCount ?? "", 32);
    const startToken = sanitizePrintableToken(event.startTime, 48);
    const endToken = sanitizePrintableToken(event.endTime, 48);

    const keys: string[] = [];
    if (laneToken && (startToken || endToken)) {
        const temporal = `t:${laneToken}|${occToken}|${startToken}|${endToken}`
            .slice(0, MAX_DASHBOARD_READ_KEY_LENGTH);
        keys.push(temporal);
    }

    const obsToken = sanitizePrintableToken(
        event.occupancyObsId,
        MAX_DASHBOARD_READ_KEY_LENGTH - 2,
    );
    if (obsToken) {
        keys.push(`o:${obsToken}`);
    }
    return keys;
}

export function parseAlarmTimestampMs(
    event: Pick<EventTableData, "startTime" | "endTime">,
): number | null {
    const raw = event.endTime || event.startTime;
    if (!raw || typeof raw !== "string") return null;
    const ms = Date.parse(raw);
    return Number.isFinite(ms) ? ms : null;
}

export function isDashboardAlarmRead(
    event: Pick<
        EventTableData,
        "laneId" | "occupancyCount" | "startTime" | "endTime" | "occupancyObsId" | "status" | "adjudicatedIds"
    >,
    laneState: DashboardLaneReadState | undefined,
): boolean {
    if (event.status === "None" || (event.adjudicatedIds?.length ?? 0) > 0) {
        return true;
    }
    if (!laneState) {
        return false;
    }
    const alarmMs = parseAlarmTimestampMs(event);
    if (alarmMs !== null && laneState.acknowledgedThroughMs > 0 && alarmMs <= laneState.acknowledgedThroughMs) {
        return true;
    }
    if (laneState.readKeySet.size === 0) {
        return false;
    }
    const candidateKeys = getDashboardAlarmReadKeys(event);
    for (const key of candidateKeys) {
        if (laneState.readKeySet.has(key)) {
            return true;
        }
    }
    return false;
}

export interface PostWatermarkReadKeysSummary {
    hasPostWatermarkKeys: boolean;
    estimatedCount: number;
}

/**
 * Inspects whether a lane has individual `readKeys` newer than `max(acknowledgedThroughMs, minTimestampMs)`
 * without scanning stored observations. Splits `t:` keys from the right so custom lane names containing `|`
 * remain safe.
 */
export function inspectPostWatermarkReadKeys(
    laneState: DashboardLaneReadState | undefined,
    minTimestampMs = 0,
): PostWatermarkReadKeysSummary {
    if (!laneState || laneState.readKeys.length === 0) {
        return {hasPostWatermarkKeys: false, estimatedCount: 0};
    }
    const floorMs = Math.max(laneState.acknowledgedThroughMs, minTimestampMs);
    let temporalTotal = 0;
    let temporalAfterFloor = 0;
    let obsOnlyCount = 0;

    for (const key of laneState.readKeys) {
        if (key.startsWith("t:")) {
            temporalTotal += 1;
            const endPipe = key.lastIndexOf("|");
            const startPipe = endPipe > 2 ? key.lastIndexOf("|", endPipe - 1) : -1;
            const endRaw = endPipe > 2 ? key.slice(endPipe + 1) : "";
            const startRaw = startPipe >= 2 ? key.slice(startPipe + 1, endPipe) : "";
            const rawTs = endRaw || startRaw;
            const parsedMs = rawTs ? Date.parse(rawTs) : Number.NaN;
            if (!Number.isFinite(parsedMs) || parsedMs > floorMs) {
                temporalAfterFloor += 1;
            }
        } else if (key.startsWith("o:")) {
            obsOnlyCount += 1;
        }
    }

    if (temporalAfterFloor > 0) {
        return {hasPostWatermarkKeys: true, estimatedCount: temporalAfterFloor};
    }
    if (temporalTotal === 0 && obsOnlyCount > 0) {
        return {hasPostWatermarkKeys: true, estimatedCount: obsOnlyCount};
    }
    return {hasPostWatermarkKeys: false, estimatedCount: 0};
}

/**
 * Returns true if the active filter tree contains any complete rule that filters by row content
 * (e.g., status, gamma/neutron counts, timestamps, adjudication) rather than lane/node scope.
 */
export function hasRowContentFilter(node: EventFilterNode): boolean {
    if (node.kind === "rule") {
        if (!isRuleComplete(node)) return false;
        return node.field !== "node" && node.field !== "laneId";
    }
    return node.children.some(hasRowContentFilter);
}

function buildBoundedKeyList(keys: Iterable<string>): {readKeys: string[]; readKeySet: Set<string>} {
    const set = new Set<string>();
    for (const raw of keys) {
        const cleaned = sanitizePrintableToken(raw, MAX_DASHBOARD_READ_KEY_LENGTH);
        if (!cleaned) continue;
        if (set.has(cleaned)) {
            set.delete(cleaned);
        }
        set.add(cleaned);
        while (set.size > MAX_DASHBOARD_READ_KEYS_PER_LANE) {
            const oldest = set.values().next().value;
            if (oldest === undefined) break;
            set.delete(oldest);
        }
    }
    return {readKeys: Array.from(set), readKeySet: set};
}

export function parseDashboardReadStatePayload(
    raw: unknown,
    etagHeader: string | null = null,
): DashboardNodeReadState | null {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
    const obj = raw as Record<string, unknown>;
    if (obj.schemaVersion !== DASHBOARD_READ_STATE_SCHEMA_VERSION) return null;
    const revision = typeof obj.revision === "number" && Number.isFinite(obj.revision) && obj.revision >= 0
        ? Math.floor(obj.revision)
        : 0;
    const lanesMap = new Map<string, DashboardLaneReadState>();
    if (obj.lanes && typeof obj.lanes === "object" && !Array.isArray(obj.lanes)) {
        for (const [rawLaneId, rawLane] of Object.entries(obj.lanes as Record<string, unknown>)) {
            const laneId = sanitizePrintableToken(rawLaneId, 128);
            if (!laneId || !rawLane || typeof rawLane !== "object" || Array.isArray(rawLane)) continue;
            const entry = rawLane as Record<string, unknown>;
            const ackMs = typeof entry.acknowledgedThroughMs === "number"
                && Number.isFinite(entry.acknowledgedThroughMs)
                && entry.acknowledgedThroughMs > 0
                ? Math.floor(entry.acknowledgedThroughMs)
                : 0;
            const rawKeys = Array.isArray(entry.readKeys)
                ? entry.readKeys.filter((item): item is string => typeof item === "string")
                : [];
            const {readKeys, readKeySet} = buildBoundedKeyList(rawKeys);
            lanesMap.set(laneId, {
                acknowledgedThroughMs: ackMs,
                readKeys,
                readKeySet,
            });
        }
    }
    return {
        revision,
        etag: etagHeader ?? `"rev-${revision}"`,
        lanes: lanesMap,
    };
}

function mergePendingIntoNodeState(
    base: DashboardNodeReadState | undefined,
    updates: Map<string, DashboardLaneUpdatePayload>,
    optimisticNowMs: number,
): DashboardNodeReadState {
    const nextLanes = new Map<string, DashboardLaneReadState>();
    if (base) {
        for (const [laneId, laneState] of base.lanes.entries()) {
            nextLanes.set(laneId, laneState);
        }
    }

    for (const [rawLaneId, update] of updates.entries()) {
        const laneId = sanitizePrintableToken(rawLaneId, 128);
        if (!laneId) continue;
        const previous = nextLanes.get(laneId);
        let ackMs = previous?.acknowledgedThroughMs ?? 0;
        let existingKeys = previous?.readKeys ?? [];

        if (update.acknowledgeAll) {
            const candidate = Math.max(
                optimisticNowMs,
                typeof update.acknowledgedThroughMs === "number" && Number.isFinite(update.acknowledgedThroughMs)
                    ? Math.floor(update.acknowledgedThroughMs)
                    : 0,
            );
            ackMs = Math.max(ackMs, candidate);
            existingKeys = [];
        } else if (typeof update.acknowledgedThroughMs === "number" && Number.isFinite(update.acknowledgedThroughMs)) {
            ackMs = Math.max(ackMs, Math.floor(update.acknowledgedThroughMs));
        }

        const combinedKeys = update.readKeys && update.readKeys.length > 0
            ? [...existingKeys, ...update.readKeys]
            : existingKeys;
        const {readKeys, readKeySet} = buildBoundedKeyList(combinedKeys);
        nextLanes.set(laneId, {
            acknowledgedThroughMs: ackMs,
            readKeys,
            readKeySet,
        });
    }

    return {
        revision: base?.revision ?? 0,
        etag: base?.etag ?? null,
        lanes: nextLanes,
    };
}

function coalesceLaneUpdate(
    existing: DashboardLaneUpdatePayload | undefined,
    incoming: DashboardLaneUpdatePayload,
): DashboardLaneUpdatePayload {
    const ackAll = Boolean(existing?.acknowledgeAll || incoming.acknowledgeAll);
    const ackMsCandidates = [
        existing?.acknowledgedThroughMs,
        incoming.acknowledgedThroughMs,
    ].filter((value): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0);
    const ackMs = ackMsCandidates.length > 0 ? Math.max(...ackMsCandidates) : undefined;

    const baseKeys = incoming.acknowledgeAll ? [] : (existing?.readKeys ?? []);
    const mergedKeys = incoming.readKeys && incoming.readKeys.length > 0
        ? buildBoundedKeyList([...baseKeys, ...incoming.readKeys]).readKeys
        : baseKeys;

    const result: DashboardLaneUpdatePayload = {};
    if (ackAll) result.acknowledgeAll = true;
    if (ackMs !== undefined) result.acknowledgedThroughMs = Math.floor(ackMs);
    if (mergedKeys.length > 0) result.readKeys = mergedKeys;
    return result;
}

function readLocalFallbackState(nodeId: string): DashboardNodeReadState | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = window.localStorage.getItem(`${LOCAL_FALLBACK_STORAGE_PREFIX}${nodeId}`);
        if (!raw) return null;
        return parseDashboardReadStatePayload(JSON.parse(raw));
    } catch {
        return null;
    }
}

function writeLocalFallbackState(nodeId: string, state: DashboardNodeReadState): void {
    if (typeof window === "undefined") return;
    try {
        const lanesObj: Record<string, {acknowledgedThroughMs: number; readKeys: string[]}> = {};
        for (const [laneId, laneState] of state.lanes.entries()) {
            lanesObj[laneId] = {
                acknowledgedThroughMs: laneState.acknowledgedThroughMs,
                readKeys: laneState.readKeys,
            };
        }
        const serialized = JSON.stringify({
            schemaVersion: DASHBOARD_READ_STATE_SCHEMA_VERSION,
            revision: state.revision,
            updatedAt: new Date().toISOString(),
            lanes: lanesObj,
        });
        window.localStorage.setItem(`${LOCAL_FALLBACK_STORAGE_PREFIX}${nodeId}`, serialized);
    } catch {
        // Ignore storage quota / private-mode restrictions.
    }
}

export interface UseDashboardAlarmReadStateResult {
    nodeStates: ReadonlyMap<string, DashboardNodeReadState>;
    getLaneReadState: (nodeId: string | undefined, laneId: string) => DashboardLaneReadState | undefined;
    isEventRead: (event: EventTableData, nodeId: string | undefined) => boolean;
    markEventsRead: (
        events: readonly EventTableData[],
        resolveNodeId: (event: EventTableData) => string | undefined,
    ) => void;
    acknowledgeLanes: (targets: readonly ScopedLaneTarget[]) => void;
    refreshReadState: () => Promise<void>;
}

/**
 * Synchronizes site-shared per-lane Dashboard alarm read state with negligible overhead.
 *
 * Strictly inert (`enabled === false`) outside the Dashboard unadjudicated alarm table.
 */
export function useDashboardAlarmReadState(
    nodes: readonly DashboardReadStateNode[],
    enabled: boolean,
    fetchImpl?: DashboardReadStateFetch,
): UseDashboardAlarmReadStateResult {
    const [nodeStates, setNodeStates] = useState<Map<string, DashboardNodeReadState>>(() => new Map());
    const nodeStatesRef = useRef<Map<string, DashboardNodeReadState>>(nodeStates);
    const pendingByNodeRef = useRef<Map<string, Map<string, DashboardLaneUpdatePayload>>>(new Map());
    const flushTimersRef = useRef<Map<string, number>>(new Map());
    const inFlightFlushRef = useRef<Set<string>>(new Set());
    const unsupportedNodesRef = useRef<Set<string>>(new Set());
    const mountedRef = useRef<boolean>(true);

    const effectiveFetch: DashboardReadStateFetch = useMemo(
        () => fetchImpl ?? ((input, init) => fetch(input, init)),
        [fetchImpl],
    );

    const uniqueNodes = useMemo(() => {
        const byId = new Map<string, DashboardReadStateNode>();
        for (const node of nodes) {
            if (node?.id && !byId.has(node.id)) {
                byId.set(node.id, node);
            }
        }
        return Array.from(byId.values());
    }, [nodes]);

    const nodesByIdRef = useRef<Map<string, DashboardReadStateNode>>(new Map());
    useEffect(() => {
        const next = new Map<string, DashboardReadStateNode>();
        for (const node of uniqueNodes) {
            next.set(node.id, node);
        }
        nodesByIdRef.current = next;
    }, [uniqueNodes]);

    const updateNodeStateMap = useCallback(
        (updater: (previous: Map<string, DashboardNodeReadState>) => Map<string, DashboardNodeReadState>) => {
            const next = updater(nodeStatesRef.current);
            if (next === nodeStatesRef.current) {
                return;
            }
            nodeStatesRef.current = next;
            setNodeStates(next);
        },
        [],
    );

    const fetchNodeReadState = useCallback(
        async (node: DashboardReadStateNode, signal?: AbortSignal): Promise<void> => {
            if (unsupportedNodesRef.current.has(node.id)) return;

            const existing = nodeStatesRef.current.get(node.id);
            const hasAuthoritativeRevision = existing !== undefined && existing.etag !== null;
            const url = buildDashboardAlarmReadStateUrl(
                node,
                hasAuthoritativeRevision ? existing.revision : undefined,
            );
            const headers: Record<string, string> = {
                ...authenticationHeaders(node),
                Accept: "application/json",
            };
            if (hasAuthoritativeRevision && existing.etag) {
                headers["If-None-Match"] = existing.etag;
            }

            try {
                const response = await effectiveFetch(url, {
                    method: "GET",
                    credentials: "include",
                    cache: "no-store",
                    headers,
                    signal,
                });
                if (response.status === 304) {
                    return;
                }
                if (response.status === 404) {
                    unsupportedNodesRef.current.add(node.id);
                    return;
                }
                if (!response.ok) {
                    return;
                }
                const text = await response.text();
                if (text.length > MAX_DASHBOARD_READ_STATE_BYTES) {
                    return;
                }
                const parsed = parseDashboardReadStatePayload(
                    JSON.parse(text),
                    response.headers.get("ETag"),
                );
                if (!parsed || !mountedRef.current) return;

                writeLocalFallbackState(node.id, parsed);
                const pending = pendingByNodeRef.current.get(node.id);
                const reconciled = pending && pending.size > 0
                    ? mergePendingIntoNodeState(parsed, pending, Date.now())
                    : parsed;

                updateNodeStateMap(previous => {
                    const current = previous.get(node.id);
                    if (
                        current
                        && current.etag === reconciled.etag
                        && current.revision === reconciled.revision
                        && (!pending || pending.size === 0)
                    ) {
                        return previous;
                    }
                    const next = new Map(previous);
                    next.set(node.id, reconciled);
                    return next;
                });
            } catch {
                // Network errors leave local optimistic / cached state intact until next poll or reconnect.
            }
        },
        [effectiveFetch, updateNodeStateMap],
    );

    const flushNodeUpdates = useCallback(
        async (nodeId: string): Promise<void> => {
            const timer = flushTimersRef.current.get(nodeId);
            if (timer !== undefined) {
                window.clearTimeout(timer);
                flushTimersRef.current.delete(nodeId);
            }
            if (inFlightFlushRef.current.has(nodeId)) {
                return;
            }
            const queued = pendingByNodeRef.current.get(nodeId);
            if (!queued || queued.size === 0) {
                return;
            }
            const node = nodesByIdRef.current.get(nodeId);
            if (!node || unsupportedNodesRef.current.has(nodeId)) {
                pendingByNodeRef.current.delete(nodeId);
                return;
            }

            // Drain a snapshot of currently queued updates; if new updates arrive while POST is in flight,
            // they accumulate into a fresh Map and trigger an immediate follow-up flush.
            pendingByNodeRef.current.delete(nodeId);
            const lanesBody: Record<string, DashboardLaneUpdatePayload> = {};
            for (const [laneId, payload] of queued.entries()) {
                lanesBody[laneId] = payload;
            }

            inFlightFlushRef.current.add(nodeId);
            try {
                const response = await effectiveFetch(buildDashboardAlarmReadStateUrl(node), {
                    method: "POST",
                    credentials: "include",
                    cache: "no-store",
                    headers: {
                        ...authenticationHeaders(node),
                        Accept: "application/json",
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({lanes: lanesBody}),
                });
                if (response.status === 404) {
                    unsupportedNodesRef.current.add(nodeId);
                    return;
                }
                if (!response.ok) {
                    return;
                }
                const text = await response.text();
                if (text.length > MAX_DASHBOARD_READ_STATE_BYTES) return;
                const parsed = parseDashboardReadStatePayload(
                    JSON.parse(text),
                    response.headers.get("ETag"),
                );
                if (!parsed || !mountedRef.current) return;

                writeLocalFallbackState(nodeId, parsed);
                const newerPending = pendingByNodeRef.current.get(nodeId);
                const reconciled = newerPending && newerPending.size > 0
                    ? mergePendingIntoNodeState(parsed, newerPending, Date.now())
                    : parsed;

                updateNodeStateMap(previous => {
                    const next = new Map(previous);
                    next.set(nodeId, reconciled);
                    return next;
                });
            } catch {
                // Retain local optimistic state and fallback mirror if offline.
            } finally {
                inFlightFlushRef.current.delete(nodeId);
                const remaining = pendingByNodeRef.current.get(nodeId);
                if (mountedRef.current && remaining && remaining.size > 0) {
                    const nextTimer = window.setTimeout(() => {
                        void flushNodeUpdates(nodeId);
                    }, DASHBOARD_READ_STATE_FLUSH_DELAY_MS);
                    flushTimersRef.current.set(nodeId, nextTimer);
                }
            }
        },
        [effectiveFetch, updateNodeStateMap],
    );

    const enqueueNodeUpdates = useCallback(
        (nodeId: string, laneUpdates: Map<string, DashboardLaneUpdatePayload>, optimisticNowMs: number) => {
            if (!nodeId || laneUpdates.size === 0) return;

            let nodeQueue = pendingByNodeRef.current.get(nodeId);
            if (!nodeQueue) {
                nodeQueue = new Map();
                pendingByNodeRef.current.set(nodeId, nodeQueue);
            }
            for (const [laneId, incoming] of laneUpdates.entries()) {
                nodeQueue.set(laneId, coalesceLaneUpdate(nodeQueue.get(laneId), incoming));
            }

            updateNodeStateMap(previous => {
                const merged = mergePendingIntoNodeState(previous.get(nodeId), laneUpdates, optimisticNowMs);
                writeLocalFallbackState(nodeId, merged);
                const next = new Map(previous);
                next.set(nodeId, merged);
                return next;
            });

            if (!flushTimersRef.current.has(nodeId) && !inFlightFlushRef.current.has(nodeId)) {
                const timer = window.setTimeout(() => {
                    void flushNodeUpdates(nodeId);
                }, DASHBOARD_READ_STATE_FLUSH_DELAY_MS);
                flushTimersRef.current.set(nodeId, timer);
            }
        },
        [flushNodeUpdates, updateNodeStateMap],
    );

    const refreshReadState = useCallback(async (): Promise<void> => {
        if (!enabled || uniqueNodes.length === 0) return;
        await Promise.all(uniqueNodes.map(node => fetchNodeReadState(node)));
    }, [enabled, fetchNodeReadState, uniqueNodes]);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            for (const timer of flushTimersRef.current.values()) {
                window.clearTimeout(timer);
            }
            flushTimersRef.current.clear();
        };
    }, []);

    useEffect(() => {
        if (!enabled || uniqueNodes.length === 0) return;

        // Hydrate any local mirror synchronously before the first network response arrives
        // (preserving etag: null so the initial GET always fetches authoritative server state).
        updateNodeStateMap(previous => {
            let changed = false;
            const next = new Map(previous);
            for (const node of uniqueNodes) {
                if (!next.has(node.id)) {
                    const cached = readLocalFallbackState(node.id);
                    if (cached) {
                        next.set(node.id, {...cached, etag: null});
                        changed = true;
                    }
                }
            }
            return changed ? next : previous;
        });

        const controller = new AbortController();
        void Promise.all(uniqueNodes.map(node => fetchNodeReadState(node, controller.signal)));

        const pollIfVisible = () => {
            if (typeof document !== "undefined" && document.visibilityState === "hidden") {
                return;
            }
            void Promise.all(uniqueNodes.map(node => fetchNodeReadState(node, controller.signal)));
        };

        const intervalId = window.setInterval(pollIfVisible, DASHBOARD_READ_STATE_POLL_INTERVAL_MS);
        const onVisibilityChange = () => {
            if (typeof document === "undefined" || document.visibilityState === "visible") {
                pollIfVisible();
            }
        };
        window.addEventListener("focus", pollIfVisible);
        document.addEventListener("visibilitychange", onVisibilityChange);

        return () => {
            controller.abort();
            window.clearInterval(intervalId);
            window.removeEventListener("focus", pollIfVisible);
            document.removeEventListener("visibilitychange", onVisibilityChange);
        };
    }, [enabled, fetchNodeReadState, uniqueNodes, updateNodeStateMap]);

    const getLaneReadState = useCallback(
        (nodeId: string | undefined, laneId: string): DashboardLaneReadState | undefined => {
            if (!enabled || !nodeId || !laneId) return undefined;
            return nodeStates.get(nodeId)?.lanes.get(laneId);
        },
        [enabled, nodeStates],
    );

    const isEventRead = useCallback(
        (event: EventTableData, nodeId: string | undefined): boolean => {
            if (!enabled) return true;
            if (!nodeId) return false;
            const laneState = (nodeStatesRef.current.get(nodeId) ?? nodeStates.get(nodeId))?.lanes.get(event.laneId);
            return isDashboardAlarmRead(event, laneState);
        },
        [enabled, nodeStates],
    );

    const markEventsRead = useCallback(
        (
            events: readonly EventTableData[],
            resolveNodeId: (event: EventTableData) => string | undefined,
        ) => {
            if (!enabled || events.length === 0) return;
            const grouped = new Map<string, Map<string, string[]>>();

            for (const event of events) {
                const nodeId = resolveNodeId(event);
                if (!nodeId || !event.laneId) continue;
                const keys = getDashboardAlarmReadKeys(event);
                if (keys.length === 0) continue;

                // Skip queueing a network mutation if all keys for this event are already marked read.
                const existingLane = nodeStatesRef.current.get(nodeId)?.lanes.get(event.laneId);
                if (
                    existingLane
                    && keys.every(key => existingLane.readKeySet.has(key))
                ) {
                    continue;
                }

                let byLane = grouped.get(nodeId);
                if (!byLane) {
                    byLane = new Map();
                    grouped.set(nodeId, byLane);
                }
                const list = byLane.get(event.laneId) ?? [];
                list.push(...keys);
                byLane.set(event.laneId, list);
            }

            const nowMs = Date.now();
            for (const [nodeId, byLane] of grouped.entries()) {
                const updates = new Map<string, DashboardLaneUpdatePayload>();
                for (const [laneId, keys] of byLane.entries()) {
                    updates.set(laneId, {readKeys: buildBoundedKeyList(keys).readKeys});
                }
                enqueueNodeUpdates(nodeId, updates, nowMs);
            }
        },
        [enabled, enqueueNodeUpdates],
    );

    const acknowledgeLanes = useCallback(
        (targets: readonly ScopedLaneTarget[]) => {
            if (!enabled || targets.length === 0) return;
            const nowMs = Date.now();
            const grouped = new Map<string, Map<string, DashboardLaneUpdatePayload>>();

            for (const target of targets) {
                if (!target.nodeId || !target.laneId) continue;
                let byLane = grouped.get(target.nodeId);
                if (!byLane) {
                    byLane = new Map();
                    grouped.set(target.nodeId, byLane);
                }
                const watermark = typeof target.acknowledgedThroughMs === "number"
                    && Number.isFinite(target.acknowledgedThroughMs)
                    ? Math.max(nowMs, Math.floor(target.acknowledgedThroughMs))
                    : nowMs;
                byLane.set(target.laneId, coalesceLaneUpdate(byLane.get(target.laneId), {
                    acknowledgeAll: true,
                    acknowledgedThroughMs: watermark,
                }));
            }

            for (const [nodeId, updates] of grouped.entries()) {
                enqueueNodeUpdates(nodeId, updates, nowMs);
            }
        },
        [enabled, enqueueNodeUpdates],
    );

    return {
        nodeStates,
        getLaneReadState,
        isEventRead,
        markEventsRead,
        acknowledgeLanes,
        refreshReadState,
    };
}
