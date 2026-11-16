import {adjudicationCodeMarker} from "@/lib/data/oscar/adjudication/models/AdjudicationConstants";
import {
    countEventFilterRules,
    createEventFilterGroup,
    EventFilterField,
    EventFilterGroup,
    EventFilterLogic,
    EventFilterNode,
    EventFilterOperator,
    EventFilterRule,
    isRuleComplete,
    operatorsForEventFilterField,
} from "@/lib/data/oscar/EventFilter";
import {EventTableData} from "@/lib/data/oscar/TableHelpers";
import {
    FederatedVehicleSearchResult,
    normalizeVehicleId,
    summarizeVehiclePasses,
    VehicleSearchWindowPreset,
} from "@/lib/data/oscar/VehicleSearch";

export const SAVED_EVENT_QUERIES_STORAGE_KEY = "oscar.savedEventQueries.v1";
const LAST_FILTERED_CRITERIA_SESSION_KEY = "oscar.lastFilteredCriteria.v1";
export const MAX_SAVED_EVENT_QUERIES = 25;
export const MAX_BOOKMARK_NAME_LENGTH = 80;
export const FILTERED_SNAPSHOT_TTL_MS = 10 * 60 * 1000;

export type EventLogVehicleMatchMode = "contains" | "equals" | "startsWith";

export interface SavedVehicleSearchCriteria {
    query: string;
    matchMode: EventLogVehicleMatchMode;
    window: VehicleSearchWindowPreset;
}

export interface EventLogQueryCriteria {
    filter?: EventFilterGroup;
    vehicleSearch?: SavedVehicleSearchCriteria | null;
}

export interface SavedEventQueryBookmark {
    id: string;
    name: string;
    criteria: EventLogQueryCriteria;
    createdAt: string;
    updatedAt: string;
}

export interface CachedEventLogQuerySnapshot {
    cacheKey: string;
    viewKey: string;
    criteria: EventLogQueryCriteria;
    rows: EventTableData[];
    rowCount: number;
    page: number;
    pageLoadedTime: string;
    latestCutoff: string;
    bucketCounts?: number[] | null;
    vehicleSearchResult: FederatedVehicleSearchResult | null;
    cachedAtMs: number;
}

const VALID_FILTER_FIELDS = new Set<EventFilterField>([
    "node",
    "laneId",
    "occupancyCount",
    "startTime",
    "endTime",
    "maxGamma",
    "maxNeutron",
    "status",
    "adjudicatedIds",
    "adjudicationCode",
    "vehicleId",
]);

const VALID_MATCH_MODES = new Set<EventLogVehicleMatchMode>(["contains", "equals", "startsWith"]);
const VALID_WINDOWS = new Set<VehicleSearchWindowPreset>(["24h", "15d", "30d", "all"]);

let activeFilteredSnapshot: CachedEventLogQuerySnapshot | null = null;
const liveFilteredByView = new Map<string, boolean>();

function normalizeScopeKey(viewKey?: string | null): string {
    const trimmed = viewKey?.trim() ?? "";
    return trimmed.length > 0 ? trimmed : "all";
}

function sanitizeFilterGroup(rawNode: unknown, depth = 0): EventFilterGroup | null {
    if (depth > 5 || !rawNode || typeof rawNode !== "object") return null;
    const obj = rawNode as Record<string, unknown>;
    if (obj.kind !== "group" || !Array.isArray(obj.children)) return null;
    const logic: EventFilterLogic = obj.logic === "or" ? "or" : "and";
    const children: EventFilterNode[] = [];
    for (const child of obj.children) {
        if (!child || typeof child !== "object") continue;
        const rec = child as Record<string, unknown>;
        if (rec.kind === "group") {
            const sub = sanitizeFilterGroup(rec, depth + 1);
            if (sub && sub.children.length > 0) children.push(sub);
        } else if (rec.kind === "rule" && VALID_FILTER_FIELDS.has(rec.field as EventFilterField)) {
            const field = rec.field as EventFilterField;
            const allowedOps = operatorsForEventFilterField(field);
            const operator = allowedOps.includes(rec.operator as EventFilterOperator)
                ? (rec.operator as EventFilterOperator)
                : allowedOps[0];
            const rawVal = Array.isArray(rec.value)
                ? rec.value
                    .filter((item): item is string => typeof item === "string")
                    .slice(0, 64)
                    .map(item => item.slice(0, 256))
                : typeof rec.value === "string"
                    ? rec.value.slice(0, 256)
                    : "";
            const rule: EventFilterRule = {
                kind: "rule",
                id: typeof rec.id === "string" && rec.id.trim() ? rec.id.trim().slice(0, 64) : `r-${children.length}`,
                field,
                operator,
                value: rawVal,
                ...(typeof rec.value2 === "string" ? {value2: rec.value2.slice(0, 256)} : {}),
            };
            if (isRuleComplete(rule)) children.push(rule);
        }
    }
    return {
        kind: "group",
        id: typeof obj.id === "string" && obj.id.trim() ? obj.id.trim().slice(0, 64) : "g-root",
        logic,
        children,
    };
}

export function sanitizeQueryCriteria(raw: unknown): EventLogQueryCriteria | null {
    if (!raw || typeof raw !== "object") return null;
    const rec = raw as Record<string, unknown>;
    const group = sanitizeFilterGroup(rec.filter);
    const hasRules = Boolean(group && countEventFilterRules(group) > 0);

    let vehicleSearch: SavedVehicleSearchCriteria | null = null;
    if (rec.vehicleSearch && typeof rec.vehicleSearch === "object") {
        const vs = rec.vehicleSearch as Record<string, unknown>;
        const query = typeof vs.query === "string" ? vs.query.trim().slice(0, 128) : "";
        if (normalizeVehicleId(query).length > 0) {
            vehicleSearch = {
                query,
                matchMode: VALID_MATCH_MODES.has(vs.matchMode as EventLogVehicleMatchMode)
                    ? (vs.matchMode as EventLogVehicleMatchMode)
                    : "contains",
                window: VALID_WINDOWS.has(vs.window as VehicleSearchWindowPreset)
                    ? (vs.window as VehicleSearchWindowPreset)
                    : "30d",
            };
        }
    }

    if (!hasRules && !vehicleSearch) return null;
    return {
        ...(hasRules && group ? {filter: group} : {}),
        ...(vehicleSearch ? {vehicleSearch} : {}),
    };
}

export function hasActiveEventLogCriteria(criteria: EventLogQueryCriteria | null | undefined): boolean {
    if (!criteria) return false;
    return (criteria.filter ? countEventFilterRules(criteria.filter) > 0 : false)
        || Boolean(criteria.vehicleSearch && normalizeVehicleId(criteria.vehicleSearch.query).length > 0);
}

export function summarizeEventLogQuery(
    criteria: EventLogQueryCriteria,
    t?: (key: string, params?: Record<string, string | number>) => string,
): string {
    const parts: string[] = [];
    if (criteria.vehicleSearch?.query) {
        parts.push(`${t ? t("vehicleId") : "Vehicle ID"}: ${criteria.vehicleSearch.query} (${criteria.vehicleSearch.window})`);
    }
    const ruleCount = criteria.filter ? countEventFilterRules(criteria.filter) : 0;
    if (ruleCount > 0) {
        parts.push(
            t
                ? t("savedQueryConditionsSummary", {count: ruleCount})
                : `${ruleCount} ${ruleCount === 1 ? "filter" : "filters"}`,
        );
    }
    return parts.join(" · ") || (t ? t("savedQueryCustomLabel") : "Filtered Query");
}

export function setCurrentEventLogFilteredFlag(viewKey: string | null | undefined, active: boolean): void {
    const scope = normalizeScopeKey(viewKey);
    if (active) {
        liveFilteredByView.set(scope, true);
    } else {
        liveFilteredByView.delete(scope);
    }
}

export function isCurrentEventLogFiltered(viewKey: string | null | undefined): boolean {
    return liveFilteredByView.get(normalizeScopeKey(viewKey)) === true;
}

export function setFilteredEventLogSnapshot(
    viewKey: string | null | undefined,
    snapshot: Omit<CachedEventLogQuerySnapshot, "cacheKey" | "viewKey" | "cachedAtMs">,
): void {
    const scope = normalizeScopeKey(viewKey);
    const cleanCriteria = sanitizeQueryCriteria(snapshot.criteria);
    if (!cleanCriteria) return;
    activeFilteredSnapshot = {
        ...snapshot,
        cacheKey: `${scope}:page:${snapshot.page}`,
        criteria: cleanCriteria,
        viewKey: scope,
        cachedAtMs: Date.now(),
    };
    if (typeof window !== "undefined") {
        try {
            window.sessionStorage.setItem(
                LAST_FILTERED_CRITERIA_SESSION_KEY,
                JSON.stringify({viewKey: scope, criteria: cleanCriteria, updatedAtMs: Date.now()}),
            );
        } catch {
            // Ignore private-mode storage restrictions
        }
    }
}

export function clearFilteredEventLogSnapshot(viewKey?: string | null): void {
    const scope = viewKey !== undefined ? normalizeScopeKey(viewKey) : null;
    if (!scope || activeFilteredSnapshot?.viewKey === scope) {
        activeFilteredSnapshot = null;
    }
    if (typeof window !== "undefined") {
        try {
            window.sessionStorage.removeItem(LAST_FILTERED_CRITERIA_SESSION_KEY);
        } catch {
            // Ignore storage errors
        }
    }
}

function readSessionFallbackCriteria(viewKey: string | null | undefined): EventLogQueryCriteria | null {
    if (typeof window === "undefined") return null;
    const scope = normalizeScopeKey(viewKey);
    try {
        const raw = window.sessionStorage.getItem(LAST_FILTERED_CRITERIA_SESSION_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        if (parsed.viewKey !== scope) return null;
        if (typeof parsed.updatedAtMs === "number" && Date.now() - parsed.updatedAtMs > FILTERED_SNAPSHOT_TTL_MS * 3) {
            window.sessionStorage.removeItem(LAST_FILTERED_CRITERIA_SESSION_KEY);
            return null;
        }
        return sanitizeQueryCriteria(parsed.criteria);
    } catch {
        return null;
    }
}

export function hasFilteredEventLogReturnState(viewKey: string | null | undefined): boolean {
    const scope = normalizeScopeKey(viewKey);
    if (activeFilteredSnapshot && activeFilteredSnapshot.viewKey === scope) {
        if (Date.now() - activeFilteredSnapshot.cachedAtMs <= FILTERED_SNAPSHOT_TTL_MS) {
            return true;
        }
        activeFilteredSnapshot = null;
    }
    return readSessionFallbackCriteria(scope) !== null;
}

export function getFilteredEventLogRestoreState(viewKey: string | null | undefined): {
    criteria: EventLogQueryCriteria;
    snapshot: CachedEventLogQuerySnapshot | null;
} | null {
    const scope = normalizeScopeKey(viewKey);
    if (activeFilteredSnapshot && activeFilteredSnapshot.viewKey === scope) {
        if (Date.now() - activeFilteredSnapshot.cachedAtMs <= FILTERED_SNAPSHOT_TTL_MS) {
            return {criteria: activeFilteredSnapshot.criteria, snapshot: activeFilteredSnapshot};
        }
        activeFilteredSnapshot = null;
    }
    const fallback = readSessionFallbackCriteria(scope);
    return fallback ? {criteria: fallback, snapshot: null} : null;
}

export function markSessionCachedEventAdjudicated(
    occupancyObsId: string | null | undefined,
    adjudicationCode?: number | null,
): void {
    const trimmedId = occupancyObsId?.trim() ?? "";
    if (!trimmedId || !activeFilteredSnapshot) return;
    const markers = [
        "adjudicated",
        ...(typeof adjudicationCode === "number" && adjudicationCode > 0
            ? [adjudicationCodeMarker(adjudicationCode)]
            : []),
    ];

    let mutatedRows = false;
    const nextRows = activeFilteredSnapshot.rows.map(row => {
        if (row.occupancyObsId !== trimmedId) return row;
        mutatedRows = true;
        const cloned = row.clone();
        cloned.adjudicatedIds = markers;
        if (typeof adjudicationCode === "number" && adjudicationCode > 0) {
            cloned.adjudicatedCode = adjudicationCode;
        }
        return cloned;
    });

    let nextVehicleResult = activeFilteredSnapshot.vehicleSearchResult;
    if (nextVehicleResult && nextVehicleResult.passes.some(p => p.occupancyObsId === trimmedId)) {
        const updatedPasses = nextVehicleResult.passes.map(pass => {
            if (pass.occupancyObsId !== trimmedId) return pass;
            const clonedRow = pass.eventRow.clone();
            clonedRow.adjudicatedIds = markers;
            if (typeof adjudicationCode === "number" && adjudicationCode > 0) {
                clonedRow.adjudicatedCode = adjudicationCode;
            }
            return {...pass, eventRow: clonedRow};
        });
        nextVehicleResult = {
            ...nextVehicleResult,
            passes: updatedPasses,
            summary: summarizeVehiclePasses(updatedPasses),
        };
    }

    if (mutatedRows || nextVehicleResult !== activeFilteredSnapshot.vehicleSearchResult) {
        activeFilteredSnapshot = {
            ...activeFilteredSnapshot,
            rows: mutatedRows ? nextRows : activeFilteredSnapshot.rows,
            vehicleSearchResult: nextVehicleResult,
        };
    }
}

export function clearSessionEventLogCachesForTests(): void {
    activeFilteredSnapshot = null;
    liveFilteredByView.clear();
    if (typeof window !== "undefined") {
        try {
            window.sessionStorage.removeItem(LAST_FILTERED_CRITERIA_SESSION_KEY);
        } catch {
            // Ignore storage errors
        }
    }
}

export function loadSavedEventQueries(): SavedEventQueryBookmark[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = window.localStorage.getItem(SAVED_EVENT_QUERIES_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        const valid: SavedEventQueryBookmark[] = [];
        for (const item of parsed) {
            if (!item || typeof item !== "object") continue;
            const rec = item as Record<string, unknown>;
            const id = typeof rec.id === "string" ? rec.id.trim().slice(0, 64) : "";
            const name = typeof rec.name === "string" ? rec.name.trim().slice(0, MAX_BOOKMARK_NAME_LENGTH) : "";
            const criteria = sanitizeQueryCriteria(rec.criteria);
            if (!id || !name || !criteria) continue;
            valid.push({
                id,
                name,
                criteria,
                createdAt: typeof rec.createdAt === "string" ? rec.createdAt : new Date().toISOString(),
                updatedAt: typeof rec.updatedAt === "string" ? rec.updatedAt : new Date().toISOString(),
            });
            if (valid.length >= MAX_SAVED_EVENT_QUERIES) break;
        }
        return valid;
    } catch {
        return [];
    }
}

function persistSavedEventQueries(bookmarks: readonly SavedEventQueryBookmark[]): void {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(
            SAVED_EVENT_QUERIES_STORAGE_KEY,
            JSON.stringify(bookmarks.slice(0, MAX_SAVED_EVENT_QUERIES)),
        );
    } catch {
        // Ignore quota / private-mode storage failures
    }
}

export function saveEventQueryBookmark(
    rawName: string,
    rawCriteria: EventLogQueryCriteria,
): SavedEventQueryBookmark[] {
    const trimmedName = rawName.trim().slice(0, MAX_BOOKMARK_NAME_LENGTH);
    const criteria = sanitizeQueryCriteria(rawCriteria);
    if (!trimmedName || !criteria) {
        return loadSavedEventQueries();
    }
    const nowIso = new Date().toISOString();
    const existing = loadSavedEventQueries();
    const matchIndex = existing.findIndex(
        item => item.name.toLocaleLowerCase() === trimmedName.toLocaleLowerCase(),
    );

    const next: SavedEventQueryBookmark[] = matchIndex >= 0
        ? [
            {...existing[matchIndex], name: trimmedName, criteria, updatedAt: nowIso},
            ...existing.filter((_, idx) => idx !== matchIndex),
        ]
        : [
            {
                id: typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
                    ? crypto.randomUUID()
                    : `sq-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                name: trimmedName,
                criteria,
                createdAt: nowIso,
                updatedAt: nowIso,
            },
            ...existing,
        ].slice(0, MAX_SAVED_EVENT_QUERIES);

    persistSavedEventQueries(next);
    return next;
}

export function deleteSavedEventQueryBookmark(id: string): SavedEventQueryBookmark[] {
    const next = loadSavedEventQueries().filter(item => item.id !== id);
    persistSavedEventQueries(next);
    return next;
}

export function emptyFilterGroup(): EventFilterGroup {
    return createEventFilterGroup();
}
