"use client";

import {useCallback, useContext, useEffect, useMemo, useRef, useState} from "react";
import {Alert, Box, Button, Snackbar, Tooltip} from "@mui/material";
import {useSelector} from "react-redux";
import {
    DataGrid,
    GRID_CHECKBOX_SELECTION_FIELD,
    GridActionsCellItem,
    GridCellParams,
    gridClasses,
    GridColDef,
    GridColumnVisibilityModel,
    GridRowParams,
    GridRowSelectionModel,
} from "@mui/x-data-grid";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import DataStream from "osh-js/source/core/sweapi/datastream/DataStream.js";
import ObservationFilter from "osh-js/source/core/sweapi/observation/ObservationFilter";
import Observations from "osh-js/source/core/consysapi/observation/Observations";
import {EventType} from "osh-js/source/core/event/EventType";
import {useRouter} from "next/navigation";

import {
    acquireSharedConnection,
    findRealtimeDataSourceForStream,
    LaneMapEntry,
    type SharedConnectionLease,
} from "@/lib/data/oscar/LaneCollection";
import {EventTableData, sortEventsByAlarmPriority} from "@/lib/data/oscar/TableHelpers";
import {
    adjudicationCodeMarker,
    AdjudicationCodes,
} from "@/lib/data/oscar/adjudication/models/AdjudicationConstants";
import {
    extractLatestAdjudicationCode,
    hasEmlNonThreatMarker,
} from "@/lib/data/oscar/adjudication/EmlMetadata";
import {useCustomAdjudicationCodes} from "@/app/hooks/useCustomAdjudicationCodes";
import {isOccupancyDataStream, isThresholdDataStream} from "@/lib/data/oscar/Utilities";
import {convertToMap} from "@/app/utils/Utils";
import {OCCUPANCY_PILLAR_DEF} from "@/lib/data/Constants";
import {getObservations} from "@/app/utils/ChartUtils";
import {useAppDispatch} from "@/lib/state/Hooks";
import {
    selectSelectedRowId,
    setEventPreview,
    setLatestGB,
    setSelectedRowId,
} from "@/lib/state/EventPreviewSlice";
import {
    selectAdjudicatedEventId,
    selectDashboardAcknowledgeNonce,
    selectDashboardUnreadOnly,
    setAdjudicatedEventId,
    setDashboardUnreadAlarmCount,
    setDashboardUnreadAlarmSummary,
    setDashboardUnreadOnly,
    setSelectedEvent,
    toggleDashboardUnreadOnly,
} from "@/lib/state/EventDataSlice";
import {
    DashboardReadStateFetch,
    hasRowContentFilter,
    inspectPostWatermarkReadKeys,
    MAX_UNREAD_RECONCILIATION_FETCH,
    parseAlarmTimestampMs,
    ScopedLaneTarget,
    UNREAD_COUNT_RECONCILIATION_CAP,
    useDashboardAlarmReadState,
} from "@/lib/data/oscar/DashboardAlarmReadState";
import {useLanguage} from "@/app/contexts/LanguageContext";
import {NotificationService, NotificationTemplates} from "../notifications/NotificationService";
import {formatOccupancyStatus, getDataGridLocaleText, getIntlLocale} from "@/app/utils/LocaleUtils";
import {DataSourceContext} from "@/app/contexts/DataSourceContext";
import CustomToolbar, {ToolbarTimeWindowOption} from "@/app/_components/CustomToolbar";
import NestedEventFilterDialog from "@/app/_components/event-table/NestedEventFilterDialog";
import BulkAdjudicationDialog, {BulkAdjudicationSummary} from "@/app/_components/event-table/BulkAdjudicationDialog";
import {
    combineServerFilters,
    compileEventFilterForLane,
    countEventFilterRules,
    createEventFilterGroup,
    EventFilterGroup,
    eventMatchesFilter,
    eventSelectionKey,
} from "@/lib/data/oscar/EventFilter";
import {
    adjudicateEvents,
    BulkAdjudicationOutcome,
    BulkAdjudicationValues,
    runWithConcurrency,
} from "@/lib/data/oscar/BulkAdjudication";
import {
    buildEventDetailsHref,
    createEventFromOccupancyObservation,
} from "@/lib/data/oscar/EventLookup";
import {
    removeRealtimeEventSubscription,
    resolveRealtimeEventForNotification,
    type RealtimeEventHandler,
} from "@/lib/data/oscar/RealtimeEventNotification";
import {
    ACTIVE_ALARM_WINDOW_MS,
    ALARM_TIME_WINDOW_PRESET_MS,
    AlarmTimeWindowPreset,
    computeActiveAlarmPhenomenonTime,
    deduplicateEvents,
    EventQueryPlan,
    fetchCollectionDataWithSignal,
    isAbortRequestError,
    useAbortableEventQueries,
} from "@/lib/data/oscar/EventTableRequests";
import {formatIso6346} from "@/lib/data/oscar/adjudication/Iso6346";
import {useVehicleOcrMap} from "@/app/_components/event-table/useVehicleOcrMap";

export {fetchCollectionDataWithSignal, isAbortRequestError};

interface TableProps {
    tableMode: "eventlog" | "alarmtable" | "lanelog";
    viewSecondary?: boolean;
    currentLane?: string;
    viewMenu?: boolean;
    viewLane?: boolean;
    viewAdjudicated?: boolean;
    laneMap: Map<string, LaneMapEntry>;
    setEvents?: unknown;
    readStateFetch?: DashboardReadStateFetch;
}

type QueryPlan = EventQueryPlan;

const PAGE_SIZE = 15;
const BULK_FETCH_SIZE = 5000;
const REALTIME_ID_RESOLUTION_TIMEOUT_MS = 12_000;
const MAX_EVENT_CACHE_ENTRIES = 1000;

const EVENT_PRIORITY_FILTERS = [
    "gammaAlarm=true AND neutronAlarm=true",
    "gammaAlarm=false AND neutronAlarm=true",
    "gammaAlarm=true AND neutronAlarm=false",
    "gammaAlarm=false AND neutronAlarm=false",
];

export default function EventTable({
    tableMode,
    viewAdjudicated = false,
    laneMap,
    currentLane,
    readStateFetch,
}: TableProps) {
    const isAlarmTable = tableMode === "alarmtable";
    const selectedRowId = useSelector(selectSelectedRowId);
    const adjudicatedEventId = useSelector(selectAdjudicatedEventId);
    const dashboardAcknowledgeNonce = useSelector(selectDashboardAcknowledgeNonce);
    const unreadOnly = useSelector(selectDashboardUnreadOnly);
    const effectiveUnreadOnly = isAlarmTable && unreadOnly;
    const lastHandledAckNonceRef = useRef(dashboardAcknowledgeNonce);
    const [ackStatusMessage, setAckStatusMessage] = useState("");
    const [timeWindowPreset, setTimeWindowPreset] = useState<AlarmTimeWindowPreset>("15d");
    const activeAlarmWindowMs = isAlarmTable
        ? ALARM_TIME_WINDOW_PRESET_MS[timeWindowPreset]
        : ACTIVE_ALARM_WINDOW_MS;
    const [unreadReconcileEpoch, setUnreadReconcileEpoch] = useState(0);
    const [scopedUnreadSummary, setScopedUnreadSummary] = useState<{count: number; capped: boolean}>({
        count: 0,
        capped: false,
    });
    const [scopedUnreadReady, setScopedUnreadReady] = useState(false);
    const dispatch = useAppDispatch();
    const router = useRouter();
    const {activeViewKey, scopedHref} = useContext(DataSourceContext);
    const {language, t} = useLanguage();
    const locale = getIntlLocale(language);

    const stableLaneMap = useMemo(() => convertToMap(laneMap), [laneMap]);
    const [paginationModel, setPaginationModel] = useState({page: 0, pageSize: PAGE_SIZE});
    const [columnVisibilityModel, setColumnVisibilityModel] = useState<GridColumnVisibilityModel>(() => ({
        adjudicatedIds: viewAdjudicated,
        adjudicationCode: false,
        vehicleId: false,
    }));
    const [syncedViewAdjudicated, setSyncedViewAdjudicated] = useState(viewAdjudicated);
    if (syncedViewAdjudicated !== viewAdjudicated) {
        setSyncedViewAdjudicated(viewAdjudicated);
        setColumnVisibilityModel(previous => ({...previous, adjudicatedIds: viewAdjudicated}));
    }
    const wantsVehicleIdColumn = Boolean(columnVisibilityModel.vehicleId);
    const [filterEpoch, setFilterEpoch] = useState(0);
    const [filter, setFilter] = useState<EventFilterGroup>(() => createEventFilterGroup());
    const [filterDialogOpen, setFilterDialogOpen] = useState(false);
    const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
    const [bulkSelectionError, setBulkSelectionError] = useState(false);
    const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
    const [allFilteredSelected, setAllFilteredSelected] = useState(false);
    const [allFilteredTotal, setAllFilteredTotal] = useState(0);
    const [excludedKeys, setExcludedKeys] = useState<Set<string>>(new Set());
    const [postSelectionKeys, setPostSelectionKeys] = useState<Set<string>>(new Set());

    const [syncedUnreadOnly, setSyncedUnreadOnly] = useState(effectiveUnreadOnly);
    if (syncedUnreadOnly !== effectiveUnreadOnly) {
        setSyncedUnreadOnly(effectiveUnreadOnly);
        if (paginationModel.page !== 0) {
            setPaginationModel(previous => ({...previous, page: 0}));
        }
        setFilterEpoch(previous => previous + 1);
        setSelectedKeys(new Set());
        setExcludedKeys(new Set());
        setPostSelectionKeys(new Set());
        setAllFilteredSelected(false);
        setAllFilteredTotal(0);
    }

    const latestCutoffRef = useRef<string>(new Date().toISOString());
    // Stamp the REST snapshot upper bound when discovered lanes hydrate (or when filters
    // are re-applied), rather than at empty initial mount before MQTT subscriptions exist.
    const pageLoadedTime = useMemo(
        () => {
            const now = new Date().toISOString();
            latestCutoffRef.current = now;
            return now;
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [stableLaneMap, filterEpoch],
    );
    const allFilteredCutoffRef = useRef<string | null>(null);
    const eventCacheRef = useRef<Map<string, EventTableData>>(new Map());
    const selectedKeysRef = useRef<Set<string>>(selectedKeys);
    const selectedRowIdRef = useRef(selectedRowId);
    const realtimeResolutionJobsRef = useRef<Set<{
        controller: AbortController;
        cancelledByCleanup: boolean;
        timeout: number;
    }>>(new Set());
    const failedBulkRef = useRef<EventTableData[]>([]);

    const nodeOptions = useMemo(() => Array.from(new Set(Array.from(stableLaneMap.values()).map(lane => lane.parentNode.name))).sort(), [stableLaneMap]);
    const laneOptions = useMemo(() => Array.from(new Set(Array.from(stableLaneMap.values()).map(lane => lane.laneName))).sort(), [stableLaneMap]);

    const customCodeNodes = useMemo(() => {
        if (!viewAdjudicated && !filterDialogOpen) return [];
        const unique = new Map<string, any>();
        for (const lane of stableLaneMap.values()) {
            const node = lane.parentNode as any;
            if (
                node?.id &&
                typeof node.getConnectedSystemsEndpoint === "function" &&
                typeof node.fetchDataStreamWithObservedProperty === "function" &&
                typeof node.createRealtimeObservationSource === "function"
            ) {
                unique.set(node.id, node);
            }
        }
        return Array.from(unique.values());
    }, [filterDialogOpen, stableLaneMap, viewAdjudicated]);
    const {codes: customAdjudicationCodes} = useCustomAdjudicationCodes(customCodeNodes, {mode: "union"});

    const formatAdjudicationCodeLabel = useCallback((code: number): string => {
        const builtIn = AdjudicationCodes.codes.find(entry => entry.code === code && entry.code > 0);
        if (builtIn) return t(`adjudicationCode.${builtIn.code}`);
        const custom = customAdjudicationCodes.find(entry => entry.code === code);
        if (custom) return t("customAdjudicationCodeLabel", {code: custom.code, label: custom.label});
        return t("customAdjudicationCodeLabel", {code, label: `${code}`});
    }, [customAdjudicationCodes, t]);

    const adjudicationCodeOptions = useMemo(() => [
        ...AdjudicationCodes.codes
            .filter(entry => entry.code > 0)
            .map(entry => ({
                value: String(entry.code),
                label: t(`adjudicationCode.${entry.code}`),
            })),
        ...customAdjudicationCodes.map(entry => ({
            value: String(entry.code),
            label: t("customAdjudicationCodeLabel", {code: entry.code, label: entry.label}),
        })),
    ], [customAdjudicationCodes, t]);

    const baseServerFilter = useMemo(() => {
        if (tableMode === "alarmtable")
            return "(gammaAlarm=true OR neutronAlarm=true) AND adjudicatedIdsCount=0";
        return "";
    }, [tableMode]);

    useEffect(() => {
        allFilteredCutoffRef.current = null;
        failedBulkRef.current = [];
    }, [syncedUnreadOnly]);

    const laneByDataStreamId = useMemo(() => {
        const index = new Map<string, LaneMapEntry>();
        for (const lane of stableLaneMap.values()) {
            for (const stream of lane.datastreams as any[]) {
                const streamId = stream?.properties?.id;
                if (typeof streamId === "string" && streamId.length > 0 && !index.has(streamId)) {
                    index.set(streamId, lane);
                }
            }
        }
        return index;
    }, [stableLaneMap]);

    const findLaneByDataStreamId = useCallback(
        (datastreamId: string): LaneMapEntry | undefined => laneByDataStreamId.get(datastreamId),
        [laneByDataStreamId],
    );

    const readStateNodes = useMemo(() => {
        if (!isAlarmTable) return [];
        const unique = new Map<string, any>();
        for (const lane of stableLaneMap.values()) {
            const node = lane.parentNode as any;
            if (node?.id && !unique.has(node.id)) {
                unique.set(node.id, node);
            }
        }
        return Array.from(unique.values());
    }, [isAlarmTable, stableLaneMap]);

    const {
        nodeStates,
        getLaneReadState,
        isEventRead,
        markEventsRead,
        acknowledgeLanes,
    } = useDashboardAlarmReadState(readStateNodes, isAlarmTable, readStateFetch);

    const resolveEventNodeId = useCallback(
        (event: EventTableData): string | undefined =>
            findLaneByDataStreamId(event.dataStreamId)?.parentNode.id
            ?? stableLaneMap.get(event.laneId)?.parentNode.id,
        [findLaneByDataStreamId, stableLaneMap],
    );

    const isRowUnread = useCallback(
        (row: EventTableData): boolean => {
            if (!isAlarmTable) return false;
            if (row.status === "None" || (row.adjudicatedIds?.length ?? 0) > 0) return false;
            return !isEventRead(row, resolveEventNodeId(row));
        },
        [isAlarmTable, isEventRead, resolveEventNodeId],
    );

    const isEventReadRef = useRef(isEventRead);
    const markEventsReadRef = useRef(markEventsRead);
    const isRowUnreadRef = useRef(isRowUnread);
    const activeAlarmWindowMsRef = useRef(activeAlarmWindowMs);
    const effectiveUnreadOnlyRef = useRef(effectiveUnreadOnly);
    isEventReadRef.current = isEventRead;
    markEventsReadRef.current = markEventsRead;
    isRowUnreadRef.current = isRowUnread;
    activeAlarmWindowMsRef.current = activeAlarmWindowMs;
    effectiveUnreadOnlyRef.current = effectiveUnreadOnly;

    const laneWatermarksSignature = useMemo(() => {
        if (!isAlarmTable) return "";
        const parts: string[] = [];
        for (const lane of stableLaneMap.values()) {
            const ackMs = nodeStates.get(lane.parentNode.id)?.lanes.get(lane.laneName)?.acknowledgedThroughMs ?? 0;
            if (ackMs > 0) {
                parts.push(`${lane.parentNode.id}\u001f${lane.laneName}\u001f${ackMs}`);
            }
        }
        parts.sort();
        return parts.join("\u001e");
    }, [isAlarmTable, nodeStates, stableLaneMap]);

    const laneWatermarksByKey = useMemo(() => {
        const map = new Map<string, number>();
        if (!laneWatermarksSignature) return map;
        for (const entry of laneWatermarksSignature.split("\u001e")) {
            const sep = entry.lastIndexOf("\u001f");
            if (sep <= 0) continue;
            const key = entry.slice(0, sep);
            const ackMs = Number(entry.slice(sep + 1));
            if (Number.isFinite(ackMs) && ackMs > 0) {
                map.set(key, ackMs);
            }
        }
        return map;
    }, [laneWatermarksSignature]);

    const readKeysSignature = useMemo(() => {
        if (!isAlarmTable) return "";
        const parts: string[] = [];
        for (const lane of stableLaneMap.values()) {
            const laneState = nodeStates.get(lane.parentNode.id)?.lanes.get(lane.laneName);
            if (laneState && laneState.readKeys.length > 0) {
                parts.push(
                    `${lane.parentNode.id}\u001f${lane.laneName}\u001f${laneState.readKeys.length}\u001f${laneState.readKeys[laneState.readKeys.length - 1]}`,
                );
            }
        }
        parts.sort();
        return parts.join("\u001e");
    }, [isAlarmTable, nodeStates, stableLaneMap]);

    const baseQueryPlans = useMemo<QueryPlan[]>(() => {
        const grouped = new Map<string, QueryPlan>();
        for (const lane of stableLaneMap.values()) {
            if (tableMode === "lanelog" && currentLane && lane.laneName !== currentLane) continue;
            const compiled = compileEventFilterForLane(filter, {
                nodeId: lane.parentNode.id,
                nodeName: lane.parentNode.name,
                laneId: lane.laneName,
            });
            if (compiled === false) continue;
            const serverFilter = combineServerFilters(baseServerFilter, compiled || "");
            const groupKey = `${lane.parentNode.id}\u001f${serverFilter}`;
            let plan = grouped.get(groupKey);
            if (!plan) {
                plan = {key: groupKey, node: lane.parentNode, datastreamIds: [], filter: serverFilter};
                grouped.set(groupKey, plan);
            }
            lane.datastreams
                .filter((stream: typeof DataStream) => isOccupancyDataStream(stream))
                .forEach((stream: typeof DataStream) => plan!.datastreamIds.push(stream.properties.id));
        }
        return Array.from(grouped.values())
            .map(plan => ({...plan, datastreamIds: Array.from(new Set(plan.datastreamIds))}))
            .filter(plan => plan.datastreamIds.length > 0);
    }, [stableLaneMap, tableMode, currentLane, filter, baseServerFilter]);

    const unreadScopePlanBundle = useMemo<{plans: QueryPlan[]; hasPositiveWatermark: boolean}>(() => {
        if (!isAlarmTable) return {plans: [], hasPositiveWatermark: false};
        const cutoffMs = Date.parse(pageLoadedTime);
        const windowStartMs = Number.isFinite(cutoffMs) ? Math.max(0, cutoffMs - activeAlarmWindowMs) : 0;
        const grouped = new Map<string, QueryPlan>();
        let hasPositiveWatermark = false;

        for (const lane of stableLaneMap.values()) {
            const compiled = compileEventFilterForLane(filter, {
                nodeId: lane.parentNode.id,
                nodeName: lane.parentNode.name,
                laneId: lane.laneName,
            });
            if (compiled === false) continue;

            const rawAckMs = laneWatermarksByKey.get(`${lane.parentNode.id}\u001f${lane.laneName}`) ?? 0;
            const effectiveAckMs = rawAckMs > 0 && (windowStartMs <= 0 || rawAckMs >= Math.max(0, windowStartMs - 60_000))
                ? rawAckMs
                : 0;
            if (effectiveAckMs > 0) {
                hasPositiveWatermark = true;
            }
            const watermarkFilter = effectiveAckMs > 0
                ? `endTime>'${new Date(effectiveAckMs).toISOString()}'`
                : "";
            const serverFilter = combineServerFilters(baseServerFilter, compiled || "", watermarkFilter);
            const groupKey = `${lane.parentNode.id}\u001f${serverFilter}\u001f${effectiveAckMs}`;
            let plan = grouped.get(groupKey);
            if (!plan) {
                plan = {
                    key: groupKey,
                    node: lane.parentNode,
                    datastreamIds: [],
                    filter: serverFilter,
                    ...(effectiveAckMs > 0 ? {minTimestampMs: effectiveAckMs} : {}),
                };
                grouped.set(groupKey, plan);
            }
            lane.datastreams
                .filter((stream: typeof DataStream) => isOccupancyDataStream(stream))
                .forEach((stream: typeof DataStream) => plan!.datastreamIds.push(stream.properties.id));
        }

        const plans = Array.from(grouped.values())
            .map(plan => ({...plan, datastreamIds: Array.from(new Set(plan.datastreamIds))}))
            .filter(plan => plan.datastreamIds.length > 0);
        return {plans, hasPositiveWatermark};
    }, [activeAlarmWindowMs, baseServerFilter, filter, isAlarmTable, laneWatermarksByKey, pageLoadedTime, stableLaneMap]);

    const postWatermarkReadKeysSummary = useMemo(() => {
        if (!isAlarmTable) return {hasPostWatermarkKeys: false, totalEstimatedCount: 0};
        const cutoffMs = Date.parse(pageLoadedTime);
        const windowStartMs = Number.isFinite(cutoffMs) ? Math.max(0, cutoffMs - activeAlarmWindowMs) : 0;
        let hasPostWatermarkKeys = false;
        let totalEstimatedCount = 0;

        for (const lane of stableLaneMap.values()) {
            const compiled = compileEventFilterForLane(filter, {
                nodeId: lane.parentNode.id,
                nodeName: lane.parentNode.name,
                laneId: lane.laneName,
            });
            if (compiled === false) continue;
            const summary = inspectPostWatermarkReadKeys(
                getLaneReadState(lane.parentNode.id, lane.laneName),
                windowStartMs,
            );
            if (summary.hasPostWatermarkKeys) {
                hasPostWatermarkKeys = true;
                totalEstimatedCount += summary.estimatedCount;
            }
        }
        return {hasPostWatermarkKeys, totalEstimatedCount};
    }, [activeAlarmWindowMs, filter, getLaneReadState, isAlarmTable, pageLoadedTime, stableLaneMap]);

    const queryPlans = effectiveUnreadOnly ? unreadScopePlanBundle.plans : baseQueryPlans;

    const pageQueryPlans = useMemo<QueryPlan[]>(() => {
        const priorities = tableMode === "alarmtable"
            ? EVENT_PRIORITY_FILTERS.slice(0, 3)
            : EVENT_PRIORITY_FILTERS;
        return queryPlans.flatMap(plan => priorities.map(priorityFilter => ({
            ...plan,
            key: `${plan.key}\u001f${priorityFilter}`,
            filter: combineServerFilters(plan.filter, priorityFilter),
        })));
    }, [queryPlans, tableMode]);

    const bulkQueryPlans = useMemo<QueryPlan[]>(() => queryPlans.map(plan => ({
        ...plan,
        key: `${plan.key}\u001fbulk-eligible`,
        filter: combineServerFilters(plan.filter, "gammaAlarm=true OR neutronAlarm=true", "adjudicatedIdsCount=0"),
    })), [queryPlans]);

    const phenomenonTimeForCutoff = useCallback(
        (cutoff: string, plan?: QueryPlan): string | undefined =>
            tableMode === "alarmtable"
                ? computeActiveAlarmPhenomenonTime(cutoff, activeAlarmWindowMs, plan?.minTimestampMs)
                : undefined,
        [activeAlarmWindowMs, tableMode],
    );

    const notificationServiceRef = useRef<NotificationService | null>(null);
    useEffect(() => {
        if (!notificationServiceRef.current) notificationServiceRef.current = new NotificationService();
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.ready.then(registration => notificationServiceRef.current?.init(registration));
        }
    }, []);

    useEffect(() => {
        selectedRowIdRef.current = selectedRowId;
    }, [selectedRowId]);

    useEffect(() => {
        selectedKeysRef.current = selectedKeys;
    }, [selectedKeys]);

    const advanceSnapshotCutoff = useCallback((candidateTime?: string): string => {
        const nowIso = new Date().toISOString();
        let next = latestCutoffRef.current > nowIso ? latestCutoffRef.current : nowIso;
        if (candidateTime && candidateTime > next) {
            next = candidateTime;
        }
        latestCutoffRef.current = next;
        return next;
    }, []);

    const cacheEventBounded = useCallback((key: string, event: EventTableData) => {
        eventCacheRef.current.delete(key);
        eventCacheRef.current.set(key, event);
        if (eventCacheRef.current.size > MAX_EVENT_CACHE_ENTRIES) {
            for (const candidateKey of eventCacheRef.current.keys()) {
                if (!selectedKeysRef.current.has(candidateKey)) {
                    eventCacheRef.current.delete(candidateKey);
                    if (eventCacheRef.current.size <= MAX_EVENT_CACHE_ENTRIES) break;
                }
            }
        }
    }, []);

    const cancelRealtimeResolutionJobs = useCallback(() => {
        realtimeResolutionJobsRef.current.forEach(job => {
            job.cancelledByCleanup = true;
            window.clearTimeout(job.timeout);
            job.controller.abort();
        });
        realtimeResolutionJobsRef.current.clear();
    }, []);

    useEffect(() => () => cancelRealtimeResolutionJobs(), [cancelRealtimeResolutionJobs]);

    const sendNotification = useCallback(async (event: EventTableData, nodeId: string): Promise<void> => {
        if (event.status === "None" || !notificationServiceRef.current?.isReady()) return;
        try {
            await notificationServiceRef.current.showNotification(NotificationTemplates.newAlarm(event, {
                title: t("newAlarmTitle", {status: t(event.status === "Gamma & Neutron" ? "gammaAndNeutron" : event.status.toLowerCase())}),
                body: t("newAlarmBody", {lane: event.laneId, occupancyId: event.occupancyCount ?? ""}),
                viewAlarm: t("viewAlarm"),
                events: t("events"),
                dismiss: t("dismiss"),
            }, activeViewKey, nodeId));
        } catch (error) {
            console.error("Unable to show alarm notification", error);
        }
    }, [t, activeViewKey]);

    const eventFromObservation = useCallback((observation: any, lane: LaneMapEntry, live: boolean, cacheRow = true): EventTableData => {
        const event = createEventFromOccupancyObservation(observation, lane, !live);
        if (cacheRow) {
            cacheEventBounded(eventSelectionKey(event), event);
        }
        return event;
    }, [cacheEventBounded]);

    const fetchPlanRows = useCallback(async (
        plan: QueryPlan,
        limit: number,
        offset: number,
        cutoff = pageLoadedTime,
        signal?: AbortSignal,
        cacheRows = true,
    ) => {
        const effectiveCutoff = cutoff === pageLoadedTime && latestCutoffRef.current > cutoff
            ? latestCutoffRef.current
            : cutoff;
        const phenomenonTime = phenomenonTimeForCutoff(effectiveCutoff, plan);
        const observationFilter = new ObservationFilter({
            dataStream: plan.datastreamIds,
            ...(phenomenonTime ? {phenomenonTime} : {}),
            resultTime: `../${effectiveCutoff}`,
            filter: plan.filter ? encodeURIComponent(plan.filter) : undefined,
            order: "desc",
        });
        const api: typeof Observations = await plan.node.getObservationsApi();
        const collection = await api.searchObservations(observationFilter, limit, offset);
        if (signal?.aborted) {
            throw new DOMException("Aborted", "AbortError");
        }
        const observations = await fetchCollectionDataWithSignal(collection, signal);
        return observations.flatMap((observation: any) => {
            const lane = findLaneByDataStreamId(observation.properties["datastream@id"]);
            return lane ? [eventFromObservation(observation, lane, false, cacheRows)] : [];
        });
    }, [eventFromObservation, findLaneByDataStreamId, pageLoadedTime, phenomenonTimeForCutoff]);

    const {
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
    } = useAbortableEventQueries({
        queryPlans,
        pageQueryPlans,
        page: paginationModel.page,
        pageSize: PAGE_SIZE,
        pageLoadedTime,
        phenomenonTimeForCutoff,
        rowFilter: isRowUnread,
        extraFetchRows: effectiveUnreadOnly ? postWatermarkReadKeysSummary.totalEstimatedCount : 0,
        filterModeActive: effectiveUnreadOnly,
        fetchPlanRows,
    });

    const replaceRealtimeEventIdentity = useCallback((original: EventTableData, resolved: EventTableData) => {
        if (!resolved.occupancyObsId || resolved === original) return;

        const originalKey = eventSelectionKey(original);
        const resolvedKey = eventSelectionKey(resolved);
        if (eventCacheRef.current.get(originalKey) === original)
            eventCacheRef.current.delete(originalKey);
        cacheEventBounded(resolvedKey, resolved);
        setRows(previous => deduplicateEvents(previous.map(row => row === original ? resolved : row)));

        const replaceKey = (previous: Set<string>) => {
            if (!previous.has(originalKey)) return previous;
            const next = new Set(previous);
            next.delete(originalKey);
            next.add(resolvedKey);
            return next;
        };
        setSelectedKeys(replaceKey);
        setExcludedKeys(replaceKey);
        setPostSelectionKeys(replaceKey);

        if (selectedRowIdRef.current === original.id) {
            dispatch(setEventPreview({isOpen: true, eventData: resolved}));
            dispatch(setSelectedEvent(resolved));
        }

        if (isAlarmTable && isEventReadRef.current(original, resolveEventNodeId(original))) {
            markEventsReadRef.current([resolved], resolveEventNodeId);
        }
    }, [cacheEventBounded, dispatch, isAlarmTable, resolveEventNodeId, setRows]);

    const resolveIdentityAndNotify = useCallback((event: EventTableData, lane: LaneMapEntry) => {
        if (event.status === "None" || (event.adjudicatedIds?.length ?? 0) > 0) return;

        // Alarm delivery is immediate. Until the durable observation exists,
        // the honest action opens Events; a successful resolution replaces
        // this notification with the direct Event Details action.
        const fallbackDelivery = sendNotification(event, lane.parentNode.id);

        const controller = new AbortController();
        const job = {
            controller,
            cancelledByCleanup: false,
            timeout: window.setTimeout(() => controller.abort(), REALTIME_ID_RESOLUTION_TIMEOUT_MS),
        };
        realtimeResolutionJobsRef.current.add(job);

        void resolveRealtimeEventForNotification(event, lane, controller.signal)
            .then(async resolved => {
                if (job.cancelledByCleanup) return;
                if (!resolved.occupancyObsId || resolved === event) return;
                replaceRealtimeEventIdentity(event, resolved);
                if ((resolved.adjudicatedIds?.length ?? 0) > 0) return;
                await fallbackDelivery;
                if (job.cancelledByCleanup) return;
                await sendNotification(resolved, lane.parentNode.id);
            })
            .catch(error => {
                if (job.cancelledByCleanup) return;
                console.error("Unable to resolve realtime event identity before notification", error);
            })
            .finally(() => {
                window.clearTimeout(job.timeout);
                realtimeResolutionJobsRef.current.delete(job);
            });
    }, [replaceRealtimeEventIdentity, sendNotification]);

    const rowPassesLocalFilters = useCallback((event: EventTableData, lane: LaneMapEntry): boolean => {
        if (tableMode === "alarmtable") {
            if (event.status === "None" || event.adjudicatedIds?.length > 0) return false;
            const endTimeMs = Date.parse(event.endTime || event.startTime);
            const cutoffMs = Date.parse(latestCutoffRef.current);
            if (
                Number.isFinite(endTimeMs)
                && Number.isFinite(cutoffMs)
                && endTimeMs < cutoffMs - activeAlarmWindowMsRef.current
            ) {
                return false;
            }
            if (effectiveUnreadOnlyRef.current && isEventReadRef.current(event, lane.parentNode.id)) {
                return false;
            }
        }
        if (tableMode === "lanelog" && currentLane && event.laneId !== currentLane) return false;
        return eventMatchesFilter(filter, event, {
            nodeId: lane.parentNode.id,
            nodeName: lane.parentNode.name,
            laneId: lane.laneName,
        });
    }, [tableMode, currentLane, filter]);

    useEffect(() => {
        if (stableLaneMap.size === 0) return;
        let active = true;
        const subscriptions: Array<{
            source: any;
            handler: RealtimeEventHandler;
            lease: SharedConnectionLease;
        }> = [];
        for (const lane of stableLaneMap.values()) {
            const occupancyStream: typeof DataStream = lane.findDataStreamByObsProperty(OCCUPANCY_PILLAR_DEF);
            if (!occupancyStream) continue;
            const source = findRealtimeDataSourceForStream(lane, occupancyStream);
            if (!source) continue;
            const handleMessage = (message: any) => {
                if (!active) return;
                try {
                    const event = eventFromObservation(message.values?.[0]?.data || message, lane, true);
                    event.setDataStreamId(occupancyStream.properties.id);
                    event.setRPMSystemId(occupancyStream.properties["system@id"]);
                    advanceSnapshotCutoff(event.endTime);
                    resolveIdentityAndNotify(event, lane);
                    const isLiveAlarm = isAlarmTable
                        && event.status !== "None"
                        && !event.adjudicatedIds?.length
                        && !isEventReadRef.current(event, lane.parentNode.id);
                    if (isLiveAlarm) {
                        const eventMs = parseAlarmTimestampMs(event);
                        const cutoffMs = Date.parse(latestCutoffRef.current);
                        const inActiveWindow = eventMs === null
                            || !Number.isFinite(cutoffMs)
                            || eventMs >= cutoffMs - activeAlarmWindowMsRef.current;
                        const matchesFilter = eventMatchesFilter(filter, event, {
                            nodeId: lane.parentNode.id,
                            nodeName: lane.parentNode.name,
                            laneId: lane.laneName,
                        });
                        if (inActiveWindow && matchesFilter) {
                            setScopedUnreadSummary(previous => (
                                previous.capped ? previous : {count: previous.count + 1, capped: false}
                            ));
                        }
                    }
                    if (!rowPassesLocalFilters(event, lane)) return;
                    if (allFilteredCutoffRef.current && event.status !== "None" && !event.adjudicatedIds?.length) {
                        setPostSelectionKeys(previous => new Set(previous).add(eventSelectionKey(event)));
                    }
                    setRowCount(previous => previous + 1);
                    if (currentPageRef.current !== 0) return;
                    setRows(previous => deduplicateEvents([event, ...previous])
                        .sort(sortEventsByAlarmPriority)
                        .slice(0, PAGE_SIZE));
                } catch (error) {
                    console.error("Error processing live occupancy event", error);
                }
            };
            source.subscribe(handleMessage, [EventType.DATA]);
            const lease = acquireSharedConnection(source);
            subscriptions.push({source, handler: handleMessage, lease});
            void lease.ready.catch((error) => {
                console.error("Error connecting occupancy source", error);
            });
        }
        return () => {
            active = false;
            cancelRealtimeResolutionJobs();
            subscriptions.forEach(({source, handler, lease}) => {
                removeRealtimeEventSubscription(source, handler);
                void lease.release().catch((error) => {
                    console.error("Error disconnecting occupancy source", error);
                });
            });
        };
    }, [
        stableLaneMap,
        eventFromObservation,
        rowPassesLocalFilters,
        resolveIdentityAndNotify,
        cancelRealtimeResolutionJobs,
        advanceSnapshotCutoff,
        currentPageRef,
        filter,
        isAlarmTable,
        setRowCount,
        setRows,
    ]);

    useEffect(() => {
        if (!adjudicatedEventId || tableMode !== "alarmtable") return;
        setRows(previous => previous.filter(row => row.id !== adjudicatedEventId));
        setRowCount(previous => Math.max(0, previous - 1));
        setUnreadReconcileEpoch(previous => previous + 1);
        dispatch(setAdjudicatedEventId(null));
        const cutoff = advanceSnapshotCutoff();
        void refreshCounts(cutoff);
        void fetchPage(currentPageRef.current, cutoff);
    }, [adjudicatedEventId, tableMode, dispatch, advanceSnapshotCutoff, refreshCounts, fetchPage, currentPageRef, setRowCount, setRows]);

    useEffect(() => {
        if (stableLaneMap.size === 0) return;
        const reconcileAfterReconnect = () => {
            const cutoff = advanceSnapshotCutoff();
            setUnreadReconcileEpoch(previous => previous + 1);
            void refreshCounts(cutoff);
            if (currentPageRef.current === 0) {
                void fetchPage(0, cutoff);
            }
        };
        window.addEventListener("online", reconcileAfterReconnect);
        return () => {
            window.removeEventListener("online", reconcileAfterReconnect);
        };
    }, [stableLaneMap.size, advanceSnapshotCutoff, refreshCounts, fetchPage, currentPageRef]);

    const clearSelection = useCallback(() => {
        setSelectedKeys(new Set());
        setExcludedKeys(new Set());
        setPostSelectionKeys(new Set());
        setAllFilteredSelected(false);
        setAllFilteredTotal(0);
        allFilteredCutoffRef.current = null;
        failedBulkRef.current = [];
    }, []);

    const applyFilter = (next: EventFilterGroup) => {
        setFilter(next);
        setFilterDialogOpen(false);
        setPaginationModel(previous => ({...previous, page: 0}));
        setFilterEpoch(previous => previous + 1);
        clearSelection();
    };

    const handleSelectTimeWindowPreset = useCallback((nextPreset: AlarmTimeWindowPreset) => {
        if (nextPreset === timeWindowPreset) return;
        setTimeWindowPreset(nextPreset);
        setPaginationModel(previous => (previous.page === 0 ? previous : {...previous, page: 0}));
        setFilterEpoch(previous => previous + 1);
        clearSelection();
    }, [clearSelection, timeWindowPreset]);

    const handleToggleUnreadOnly = useCallback(() => {
        dispatch(toggleDashboardUnreadOnly());
    }, [dispatch]);

    const timeWindowOptions = useMemo<ToolbarTimeWindowOption[]>(
        () => [
            {value: "15m", label: t("timeWindow15m")},
            {value: "1h", label: t("timeWindow1h")},
            {value: "24h", label: t("timeWindow24h")},
            {value: "15d", label: t("timeWindow15d")},
        ],
        [t],
    );

    const visibleSelectionModel = useMemo<GridRowSelectionModel>(() => rows
        .filter(row => row.status !== "None" && !row.adjudicatedIds?.length)
        .filter(row => allFilteredSelected
            ? !excludedKeys.has(eventSelectionKey(row)) && !postSelectionKeys.has(eventSelectionKey(row))
            : selectedKeys.has(eventSelectionKey(row)))
        .map(eventSelectionKey), [rows, allFilteredSelected, excludedKeys, postSelectionKeys, selectedKeys]);

    const handleSelectionChange = (model: GridRowSelectionModel) => {
        const visible = new Set(model.map(String));
        if (allFilteredSelected) {
            setExcludedKeys(previous => {
                const next = new Set(previous);
                rows.filter(row => row.status !== "None" && !row.adjudicatedIds?.length).forEach(row => {
                    const key = eventSelectionKey(row);
                    if (visible.has(key)) next.delete(key); else next.add(key);
                });
                return next;
            });
        } else {
            setSelectedKeys(previous => {
                const next = new Set(previous);
                rows.filter(row => row.status !== "None" && !row.adjudicatedIds?.length).forEach(row => {
                    const key = eventSelectionKey(row);
                    if (visible.has(key)) next.add(key); else next.delete(key);
                });
                return next;
            });
        }
    };

    const selectedCount = allFilteredSelected ? Math.max(0, allFilteredTotal - excludedKeys.size) : selectedKeys.size;

    const unreadVisibleCount = useMemo(
        () => (isAlarmTable ? rows.reduce((sum, row) => sum + (isRowUnread(row) ? 1 : 0), 0) : 0),
        [isAlarmTable, rows, isRowUnread],
    );

    const canUseZeroQueryTotalCount = isAlarmTable
        && !effectiveUnreadOnly
        && !unreadScopePlanBundle.hasPositiveWatermark
        && !postWatermarkReadKeysSummary.hasPostWatermarkKeys;

    const canUseZeroQueryPage0VisibleCount = isAlarmTable
        && !loading
        && paginationModel.page === 0
        && rowCount <= PAGE_SIZE
        && rows.length <= rowCount
        && (
            effectiveUnreadOnly
            || rows.length === rowCount
        );

    const canUseZeroQueryUnreadOnlyCount = isAlarmTable
        && effectiveUnreadOnly
        && !postWatermarkReadKeysSummary.hasPostWatermarkKeys;

    const canUseZeroQueryPage0VisibleCountRef = useRef(canUseZeroQueryPage0VisibleCount);
    canUseZeroQueryPage0VisibleCountRef.current = canUseZeroQueryPage0VisibleCount;

    useEffect(() => {
        if (!canUseZeroQueryPage0VisibleCount) return;
        setScopedUnreadSummary({count: unreadVisibleCount, capped: false});
        setScopedUnreadReady(true);
    }, [canUseZeroQueryPage0VisibleCount, unreadVisibleCount]);

    useEffect(() => {
        if (!isAlarmTable) return;
        if (canUseZeroQueryTotalCount || canUseZeroQueryUnreadOnlyCount) {
            setScopedUnreadReady(false);
            return;
        }
        if (canUseZeroQueryPage0VisibleCountRef.current) {
            return;
        }
        if (unreadScopePlanBundle.plans.length === 0) {
            setScopedUnreadSummary({count: 0, capped: false});
            setScopedUnreadReady(true);
            return;
        }

        const controller = new AbortController();
        const effectiveCutoff = latestCutoffRef.current > pageLoadedTime
            ? latestCutoffRef.current
            : pageLoadedTime;

        void (async () => {
            try {
                const planCounts = await runWithConcurrency(
                    unreadScopePlanBundle.plans,
                    6,
                    plan => fetchPlanCount(plan, effectiveCutoff, true, {
                        signal: controller.signal,
                        lowPriority: true,
                    }),
                );
                if (controller.signal.aborted) return;
                const serverPostWatermarkCount = planCounts.reduce((sum, count) => sum + count, 0);

                if (!postWatermarkReadKeysSummary.hasPostWatermarkKeys || serverPostWatermarkCount === 0) {
                    setScopedUnreadSummary({count: serverPostWatermarkCount, capped: false});
                    setScopedUnreadReady(true);
                    return;
                }

                const fetchLimitPerPlan = Math.min(serverPostWatermarkCount, MAX_UNREAD_RECONCILIATION_FETCH);
                const sampledByPlan = await runWithConcurrency(
                    unreadScopePlanBundle.plans,
                    6,
                    async (plan, index) => {
                        const planCount = planCounts[index] ?? 0;
                        if (planCount <= 0) return [];
                        return fetchPlanRows(
                            plan,
                            Math.min(planCount, fetchLimitPerPlan),
                            0,
                            effectiveCutoff,
                            controller.signal,
                            false,
                        );
                    },
                );
                if (controller.signal.aborted) return;

                const sampledEvents = deduplicateEvents(sampledByPlan.flat());
                const unreadInSample = sampledEvents.reduce(
                    (sum, event) => sum + (isRowUnreadRef.current(event) ? 1 : 0),
                    0,
                );

                if (serverPostWatermarkCount <= MAX_UNREAD_RECONCILIATION_FETCH) {
                    setScopedUnreadSummary({count: unreadInSample, capped: false});
                    setScopedUnreadReady(true);
                    return;
                }

                if (unreadInSample > UNREAD_COUNT_RECONCILIATION_CAP) {
                    setScopedUnreadSummary({count: UNREAD_COUNT_RECONCILIATION_CAP, capped: true});
                    setScopedUnreadReady(true);
                    return;
                }

                const unseenCount = Math.max(0, serverPostWatermarkCount - sampledEvents.length);
                const estimatedUnread = Math.max(
                    unreadInSample,
                    serverPostWatermarkCount - postWatermarkReadKeysSummary.totalEstimatedCount,
                );
                if (
                    estimatedUnread > UNREAD_COUNT_RECONCILIATION_CAP
                    || unreadInSample + unseenCount > UNREAD_COUNT_RECONCILIATION_CAP
                ) {
                    setScopedUnreadSummary({count: UNREAD_COUNT_RECONCILIATION_CAP, capped: true});
                } else {
                    setScopedUnreadSummary({count: estimatedUnread, capped: false});
                }
                setScopedUnreadReady(true);
            } catch (error) {
                if (controller.signal.aborted || isAbortRequestError(error)) return;
                console.error("Unable to reconcile unread dashboard alarm count", error);
            }
        })();

        return () => {
            controller.abort();
        };
    }, [
        canUseZeroQueryTotalCount,
        canUseZeroQueryUnreadOnlyCount,
        fetchPlanCount,
        fetchPlanRows,
        isAlarmTable,
        pageLoadedTime,
        postWatermarkReadKeysSummary,
        readKeysSignature,
        unreadReconcileEpoch,
        unreadScopePlanBundle,
    ]);

    const effectiveUnreadSummary = useMemo<{count: number; capped: boolean}>(() => {
        if (!isAlarmTable) return {count: 0, capped: false};
        if (canUseZeroQueryTotalCount) {
            return {count: rowCount, capped: false};
        }
        if (canUseZeroQueryPage0VisibleCount) {
            return {count: unreadVisibleCount, capped: false};
        }
        if (canUseZeroQueryUnreadOnlyCount) {
            return {count: rowCount, capped: false};
        }
        if (scopedUnreadReady) {
            return scopedUnreadSummary;
        }
        return {count: unreadVisibleCount, capped: false};
    }, [
        canUseZeroQueryPage0VisibleCount,
        canUseZeroQueryTotalCount,
        canUseZeroQueryUnreadOnlyCount,
        isAlarmTable,
        rowCount,
        scopedUnreadReady,
        scopedUnreadSummary,
        unreadVisibleCount,
    ]);

    const effectiveRowCount = useMemo(() => {
        if (!effectiveUnreadOnly) return rowCount;
        if (!postWatermarkReadKeysSummary.hasPostWatermarkKeys) return rowCount;
        if (!loading && paginationModel.page === 0 && rowCount <= PAGE_SIZE && rows.length <= rowCount) {
            return rows.length;
        }
        const estimated = scopedUnreadReady
            ? (scopedUnreadSummary.capped
                ? Math.max(0, rowCount - postWatermarkReadKeysSummary.totalEstimatedCount)
                : scopedUnreadSummary.count)
            : Math.max(0, rowCount - postWatermarkReadKeysSummary.totalEstimatedCount);
        return Math.max(rows.length, estimated);
    }, [
        effectiveUnreadOnly,
        loading,
        paginationModel.page,
        postWatermarkReadKeysSummary,
        rowCount,
        rows.length,
        scopedUnreadReady,
        scopedUnreadSummary,
    ]);

    useEffect(() => {
        if (!isAlarmTable) return;
        dispatch(setDashboardUnreadAlarmSummary(effectiveUnreadSummary));
    }, [isAlarmTable, effectiveUnreadSummary, dispatch]);

    useEffect(() => {
        if (!isAlarmTable) return;
        return () => {
            dispatch(setDashboardUnreadAlarmCount(0));
            dispatch(setDashboardUnreadOnly(false));
        };
    }, [isAlarmTable, dispatch]);

    const getLatestGB = async (event: EventTableData) => {
        for (const lane of stableLaneMap.values()) {
            const threshold = lane.datastreams
                .filter((stream: any) => isThresholdDataStream(stream))
                .find((stream: typeof DataStream) => stream.properties["system@id"] === event.rpmSystemId);
            if (threshold) dispatch(setLatestGB(await getObservations(event.startTime, event.endTime, threshold)));
        }
    };

    const previewEvent = (event: EventTableData, navigate = false) => {
        if (isAlarmTable) {
            const wasUnread = isRowUnread(event);
            markEventsRead([event], resolveEventNodeId);
            if (wasUnread) {
                setScopedUnreadSummary({
                    count: effectiveUnreadSummary.capped
                        ? effectiveUnreadSummary.count
                        : Math.max(0, effectiveUnreadSummary.count - 1),
                    capped: effectiveUnreadSummary.capped,
                });
                setScopedUnreadReady(true);
            }
        }
        dispatch(setEventPreview({isOpen: true, eventData: event}));
        dispatch(setSelectedRowId(event.id));
        dispatch(setSelectedEvent(event));
        getLatestGB(event);
        if (navigate) {
            const lane = stableLaneMap.get(event.laneId);
            const href = event.occupancyObsId
                ? buildEventDetailsHref(event.occupancyObsId, lane?.parentNode.id)
                : "/event-details";
            router.push(scopedHref(href));
        }
    };

    const enumerateAllFiltered = useCallback(async (): Promise<EventTableData[]> => {
        const cutoff = allFilteredCutoffRef.current ?? advanceSnapshotCutoff();
        const planRows = await runWithConcurrency(bulkQueryPlans, 4, async plan => {
            const count = await fetchPlanCount(plan, cutoff, true);
            const collected: EventTableData[] = [];
            for (let offset = 0; offset < count; offset += BULK_FETCH_SIZE)
                collected.push(...await fetchPlanRows(plan, BULK_FETCH_SIZE, offset, cutoff, undefined, false));
            return collected;
        });
        return deduplicateEvents(planRows.flat())
            .filter(event => !effectiveUnreadOnly || isRowUnread(event))
            .filter(event => !excludedKeys.has(eventSelectionKey(event)));
    }, [bulkQueryPlans, fetchPlanCount, fetchPlanRows, effectiveUnreadOnly, isRowUnread, excludedKeys, advanceSnapshotCutoff]);

    const computeScopedAcknowledgeTargets = useCallback((): ScopedLaneTarget[] => {
        let maxVisibleMs = Date.now();
        for (const row of rows) {
            const ms = parseAlarmTimestampMs(row);
            if (ms !== null && ms > maxVisibleMs) {
                maxVisibleMs = ms;
            }
        }
        const targets: ScopedLaneTarget[] = [];
        for (const lane of stableLaneMap.values()) {
            const compiled = compileEventFilterForLane(filter, {
                nodeId: lane.parentNode.id,
                nodeName: lane.parentNode.name,
                laneId: lane.laneName,
            });
            if (compiled === false) continue;
            targets.push({
                nodeId: lane.parentNode.id,
                laneId: lane.laneName,
                acknowledgedThroughMs: maxVisibleMs,
            });
        }
        return targets;
    }, [filter, rows, stableLaneMap]);

    const acknowledgeAllScopedAlarms = useCallback(async () => {
        if (!isAlarmTable) return;
        const useLaneWatermarkAcknowledge = !hasRowContentFilter(filter) && timeWindowPreset === "15d";
        if (useLaneWatermarkAcknowledge) {
            const targets = computeScopedAcknowledgeTargets();
            advanceSnapshotCutoff();
            acknowledgeLanes(targets);
            setScopedUnreadSummary({count: 0, capped: false});
            setScopedUnreadReady(true);
            if (effectiveUnreadOnly) {
                setRows([]);
            }
            clearSelection();
            setAckStatusMessage(t("acknowledgedAllScopedStatus"));
            return;
        }
        setLoading(true);
        try {
            const matching = await enumerateAllFiltered();
            markEventsRead(matching, resolveEventNodeId);
            setScopedUnreadSummary({count: 0, capped: false});
            setScopedUnreadReady(true);
            if (effectiveUnreadOnly) {
                setRows([]);
                void fetchPage(
                    0,
                    advanceSnapshotCutoff(),
                    postWatermarkReadKeysSummary.totalEstimatedCount + matching.length,
                );
            }
            clearSelection();
            setAckStatusMessage(t("acknowledgedAlarmsStatus", {count: matching.length}));
        } catch (error) {
            console.error("Unable to acknowledge filtered alarms", error);
            setBulkSelectionError(true);
        } finally {
            setLoading(false);
        }
    }, [
        acknowledgeLanes,
        advanceSnapshotCutoff,
        clearSelection,
        computeScopedAcknowledgeTargets,
        effectiveUnreadOnly,
        enumerateAllFiltered,
        fetchPage,
        filter,
        isAlarmTable,
        markEventsRead,
        postWatermarkReadKeysSummary.totalEstimatedCount,
        resolveEventNodeId,
        setLoading,
        setRows,
        t,
        timeWindowPreset,
    ]);

    const acknowledgeSelectedAlarms = useCallback(async () => {
        if (!isAlarmTable) return;
        if (allFilteredSelected && excludedKeys.size === 0) {
            await acknowledgeAllScopedAlarms();
            return;
        }
        if (allFilteredSelected) {
            setLoading(true);
            try {
                const matching = await enumerateAllFiltered();
                const newlyReadCount = matching.filter(isRowUnread).length;
                markEventsRead(matching, resolveEventNodeId);
                if (newlyReadCount > 0) {
                    setScopedUnreadSummary({
                        count: effectiveUnreadSummary.capped
                            ? effectiveUnreadSummary.count
                            : Math.max(0, effectiveUnreadSummary.count - newlyReadCount),
                        capped: effectiveUnreadSummary.capped,
                    });
                    setScopedUnreadReady(true);
                }
                if (effectiveUnreadOnly) {
                    setRows(previous => previous.filter(row => excludedKeys.has(eventSelectionKey(row))));
                    void fetchPage(
                        currentPageRef.current,
                        advanceSnapshotCutoff(),
                        postWatermarkReadKeysSummary.totalEstimatedCount + newlyReadCount,
                    );
                }
                clearSelection();
                setAckStatusMessage(t("acknowledgedAlarmsStatus", {count: matching.length}));
            } catch (error) {
                console.error("Unable to acknowledge selected filtered alarms", error);
                setBulkSelectionError(true);
            } finally {
                setLoading(false);
            }
            return;
        }
        const rowsByKey = new Map(rows.map(row => [eventSelectionKey(row), row]));
        const selectedEvents = Array.from(selectedKeys).flatMap(key => {
            const event = eventCacheRef.current.get(key) ?? rowsByKey.get(key);
            return event ? [event] : [];
        });
        const newlyReadCount = selectedEvents.filter(isRowUnread).length;
        markEventsRead(selectedEvents, resolveEventNodeId);
        if (newlyReadCount > 0) {
            setScopedUnreadSummary({
                count: effectiveUnreadSummary.capped
                    ? effectiveUnreadSummary.count
                    : Math.max(0, effectiveUnreadSummary.count - newlyReadCount),
                capped: effectiveUnreadSummary.capped,
            });
            setScopedUnreadReady(true);
        }
        if (effectiveUnreadOnly && selectedEvents.length > 0) {
            const acknowledgedKeySet = new Set(selectedKeys);
            setRows(previous => previous.filter(row => !acknowledgedKeySet.has(eventSelectionKey(row))));
            void fetchPage(
                currentPageRef.current,
                advanceSnapshotCutoff(),
                postWatermarkReadKeysSummary.totalEstimatedCount + newlyReadCount,
            );
        }
        clearSelection();
        setAckStatusMessage(t("acknowledgedAlarmsStatus", {count: selectedEvents.length}));
    }, [
        acknowledgeAllScopedAlarms,
        advanceSnapshotCutoff,
        allFilteredSelected,
        clearSelection,
        currentPageRef,
        effectiveUnreadOnly,
        effectiveUnreadSummary,
        enumerateAllFiltered,
        excludedKeys,
        fetchPage,
        isAlarmTable,
        isRowUnread,
        markEventsRead,
        postWatermarkReadKeysSummary.totalEstimatedCount,
        resolveEventNodeId,
        rows,
        selectedKeys,
        setLoading,
        setRows,
        t,
    ]);

    useEffect(() => {
        if (dashboardAcknowledgeNonce === lastHandledAckNonceRef.current) return;
        lastHandledAckNonceRef.current = dashboardAcknowledgeNonce;
        if (!isAlarmTable) return;
        void acknowledgeAllScopedAlarms();
    }, [dashboardAcknowledgeNonce, isAlarmTable, acknowledgeAllScopedAlarms]);

    const selectAllFilteredAlarms = async () => {
        const cutoff = advanceSnapshotCutoff();
        setLoading(true);
        try {
            const counts = await runWithConcurrency(bulkQueryPlans, 6, plan => fetchPlanCount(plan, cutoff, true));
            let total = counts.reduce((sum, count) => sum + count, 0);
            if (
                effectiveUnreadOnly
                && postWatermarkReadKeysSummary.hasPostWatermarkKeys
                && total > 0
                && total <= BULK_FETCH_SIZE
            ) {
                const planRows = await runWithConcurrency(bulkQueryPlans, 4, async (plan, index) => {
                    const count = counts[index] ?? 0;
                    if (count <= 0) return [];
                    return fetchPlanRows(plan, count, 0, cutoff, undefined, false);
                });
                total = deduplicateEvents(planRows.flat()).filter(isRowUnread).length;
            }
            allFilteredCutoffRef.current = cutoff;
            setAllFilteredTotal(total);
            setAllFilteredSelected(true);
            setSelectedKeys(new Set());
            setExcludedKeys(new Set());
            setPostSelectionKeys(new Set());
        } catch (error) {
            console.error("Unable to select all filtered alarms", error);
            clearSelection();
            setBulkSelectionError(true);
        } finally {
            setLoading(false);
        }
    };

    const handleBulkSubmit = async (
        values: BulkAdjudicationValues,
        retryFailures: boolean,
        onProgress: (complete: number, total: number) => void,
    ): Promise<BulkAdjudicationSummary> => {
        let events: EventTableData[];
        if (retryFailures) {
            events = failedBulkRef.current;
        } else if (allFilteredSelected) {
            events = await enumerateAllFiltered();
        } else {
            events = Array.from(selectedKeys).flatMap(key => {
                const event = eventCacheRef.current.get(key);
                return event ? [event] : [];
            });
            if (events.length !== selectedKeys.size)
                throw new Error("One or more selected events are no longer available");
        }
        const outcomes: BulkAdjudicationOutcome[] = await adjudicateEvents(events, stableLaneMap, values, onProgress);
        const successful = outcomes.filter(outcome => outcome.ok);
        const failed = outcomes.filter(outcome => !outcome.ok);
        failedBulkRef.current = failed.map(outcome => outcome.event);
        const successfulKeys = new Set(successful.map(outcome => eventSelectionKey(outcome.event)));
        if (tableMode === "alarmtable") {
            if (successful.length > 0) {
                markEventsRead(successful.map(outcome => outcome.event), resolveEventNodeId);
            }
            setRows(previous => previous.filter(event => !successfulKeys.has(eventSelectionKey(event))));
            setRowCount(previous => Math.max(0, previous - successful.length));
            if (successful.length > 0) {
                const cutoff = advanceSnapshotCutoff();
                setUnreadReconcileEpoch(previous => previous + 1);
                void refreshCounts(cutoff);
                void fetchPage(currentPageRef.current, cutoff);
            }
        } else {
            setRows(previous => previous.map(event => {
                if (successfulKeys.has(eventSelectionKey(event))) {
                    event.adjudicatedIds = [
                        "bulk-adjudicated",
                        adjudicationCodeMarker(values.adjudicationCode.code),
                    ];
                }
                return event;
            }));
        }
        setAllFilteredSelected(false);
        setAllFilteredTotal(0);
        allFilteredCutoffRef.current = null;
        setExcludedKeys(new Set());
        setPostSelectionKeys(new Set());
        const failedSelectionKeys = new Set<string>();
        for (const outcome of failed) {
            const key = eventSelectionKey(outcome.event);
            failedSelectionKeys.add(key);
            if (failedSelectionKeys.size <= MAX_EVENT_CACHE_ENTRIES) {
                cacheEventBounded(key, outcome.event);
            }
        }
        setSelectedKeys(failedSelectionKeys);
        return {success: successful.length, failed: failed.length};
    };

    const visibleOcrLanes = useMemo<LaneMapEntry[]>(() => {
        if (!wantsVehicleIdColumn) return [];
        const result: LaneMapEntry[] = [];
        for (const lane of stableLaneMap.values()) {
            if (tableMode === "lanelog" && currentLane && lane.laneName !== currentLane) continue;
            result.push(lane);
        }
        return result;
    }, [currentLane, stableLaneMap, tableMode, wantsVehicleIdColumn]);

    const ocrWindowStartIso = useMemo(() => {
        if (!wantsVehicleIdColumn) return pageLoadedTime;
        let earliestMs = Number.POSITIVE_INFINITY;
        for (const row of rows) {
            const ms = Date.parse(row.startTime || row.endTime);
            if (Number.isFinite(ms) && ms < earliestMs) {
                earliestMs = ms;
            }
        }
        if (Number.isFinite(earliestMs)) {
            const bucketedMs = Math.floor(Math.max(0, earliestMs - 60_000) / 900_000) * 900_000;
            return new Date(bucketedMs).toISOString();
        }
        const fallbackBaseMs = Date.parse(pageLoadedTime);
        const baseMs = Number.isFinite(fallbackBaseMs) ? fallbackBaseMs : Date.now();
        return new Date(Math.max(0, baseMs - 86_400_000)).toISOString();
    }, [pageLoadedTime, rows, wantsVehicleIdColumn]);

    const {ocrByObsId, adjudicatedVehicleIdByObsId} = useVehicleOcrMap({
        enabled: wantsVehicleIdColumn,
        lanes: visibleOcrLanes,
        windowStartIso: ocrWindowStartIso,
    });

    const pendingQuietResolutionIdsRef = useRef<Set<string>>(new Set());
    useEffect(() => {
        if (!wantsVehicleIdColumn || rows.length === 0) return;
        const unresolved = rows.filter(
            row => !row.occupancyObsId && !pendingQuietResolutionIdsRef.current.has(eventSelectionKey(row)),
        );
        if (unresolved.length === 0) return;
        const controller = new AbortController();
        let active = true;
        for (const row of unresolved) {
            const lane = findLaneByDataStreamId(row.dataStreamId) ?? stableLaneMap.get(row.laneId);
            if (!lane) continue;
            const rowKey = eventSelectionKey(row);
            pendingQuietResolutionIdsRef.current.add(rowKey);
            void resolveRealtimeEventForNotification(row, lane, controller.signal)
                .then(resolved => {
                    if (!active || controller.signal.aborted) return;
                    if (resolved.occupancyObsId && resolved !== row) {
                        replaceRealtimeEventIdentity(row, resolved);
                    }
                })
                .catch((): void => {})
                .finally(() => {
                    pendingQuietResolutionIdsRef.current.delete(rowKey);
                });
        }
        return () => {
            active = false;
            controller.abort();
        };
    }, [findLaneByDataStreamId, replaceRealtimeEventIdentity, rows, stableLaneMap, wantsVehicleIdColumn]);

    const displayRows = useMemo<EventTableData[]>(() => {
        if (!wantsVehicleIdColumn) return rows;
        if (ocrByObsId.size === 0 && adjudicatedVehicleIdByObsId.size === 0) return rows;
        let changed = false;
        const mapped = rows.map(row => {
            const obsId = row.occupancyObsId;
            if (!obsId) return row;
            const adjVehicleId = adjudicatedVehicleIdByObsId.get(obsId);
            if (adjVehicleId) {
                if (row.vehicleId === adjVehicleId && !row.vehicleIdFromOcr) return row;
                changed = true;
                const clone = row.clone();
                clone.setVehicleId(adjVehicleId, false);
                return clone;
            }
            const ocrCandidate = ocrByObsId.get(obsId);
            if (ocrCandidate?.value) {
                const formatted = ocrCandidate.kind === "container" && ocrCandidate.isoChecksumValid
                    ? formatIso6346(ocrCandidate.value)
                    : ocrCandidate.value;
                if (row.vehicleId === formatted && row.vehicleIdFromOcr) return row;
                changed = true;
                const clone = row.clone();
                clone.setVehicleId(formatted, true);
                return clone;
            }
            return row;
        });
        return changed ? mapped : rows;
    }, [adjudicatedVehicleIdByObsId, ocrByObsId, rows, wantsVehicleIdColumn]);

    const renderCompactHeader = useCallback((label: string) => {
        const unitMatch = label.match(/^(.*?)\s*(\([^)]+\))$/);
        if (unitMatch) {
            return (
                <Box sx={{display: "flex", flexDirection: "column", lineHeight: 1.15, py: 0.25, minWidth: 0}}>
                    <Box component="span" sx={{fontWeight: 600, fontSize: "0.78rem", whiteSpace: "nowrap"}}>{unitMatch[1]}</Box>
                    <Box component="span" sx={{fontSize: "0.68rem", color: "text.secondary", fontWeight: 500, whiteSpace: "nowrap"}}>{unitMatch[2]}</Box>
                </Box>
            );
        }
        return (
            <Box
                component="span"
                sx={{
                    fontWeight: 600,
                    fontSize: "0.78rem",
                    lineHeight: 1.15,
                    whiteSpace: "normal",
                    wordBreak: "normal",
                    overflowWrap: "normal",
                }}
            >
                {label}
            </Box>
        );
    }, []);

    const renderCompactTimestamp = useCallback((rawValue: unknown) => {
        if (!rawValue) return null;
        const date = rawValue instanceof Date ? rawValue : new Date(String(rawValue));
        if (Number.isNaN(date.getTime())) return String(rawValue);
        return (
            <Box sx={{display: "flex", flexDirection: "column", justifyContent: "center", py: 0.25, minWidth: 0, fontVariantNumeric: "tabular-nums"}}>
                <Box component="span" className="alarm-cell-primary" sx={{fontWeight: 500, fontSize: "0.81rem", lineHeight: 1.2, whiteSpace: "nowrap"}}>
                    {date.toLocaleTimeString(locale)}
                </Box>
                <Box component="span" sx={{fontSize: "0.71rem", color: "text.secondary", lineHeight: 1.15, whiteSpace: "nowrap"}}>
                    {date.toLocaleDateString(locale)}
                </Box>
            </Box>
        );
    }, [locale]);

    const columns = useMemo<GridColDef<EventTableData>[]>(() => [
        {
            field: "laneId",
            headerName: t("laneId"),
            minWidth: 76,
            flex: 0.7,
            renderHeader: () => renderCompactHeader(t("laneId")),
            renderCell: params => {
                const unread = isRowUnread(params.row);
                return (
                    <Box sx={{display: "flex", flexDirection: "column", justifyContent: "center", py: 0.5, minWidth: 0}}>
                        <Box sx={{display: "flex", alignItems: "center", gap: 0.65, minWidth: 0}}>
                            {unread && (
                                <>
                                    <Box
                                        component="span"
                                        className="unread-alarm-dot"
                                        aria-hidden="true"
                                        sx={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: "50%",
                                            bgcolor: "primary.main",
                                            border: "1px solid transparent",
                                            flexShrink: 0,
                                        }}
                                    />
                                    <Box component="span" className="visually-hidden">
                                        {`${t("unreadAlarm")} `}
                                    </Box>
                                </>
                            )}
                            <Box component="span" className="alarm-cell-primary" sx={{fontWeight: 600, fontSize: "0.83rem", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis"}}>
                                {params.row.laneId}
                            </Box>
                        </Box>
                        <Box component="span" sx={{fontSize: "0.71rem", color: "text.secondary", lineHeight: 1.15, overflow: "hidden", textOverflow: "ellipsis"}}>{params.row.parentNode}</Box>
                    </Box>
                );
            },
        },
        {
            field: "occupancyCount",
            headerName: t("occupancyId"),
            minWidth: 78,
            flex: 0.58,
            renderHeader: () => renderCompactHeader(t("occupancyId")),
            renderCell: params => (
                <Box component="span" className="alarm-cell-primary" sx={{fontVariantNumeric: "tabular-nums", fontWeight: 600, fontSize: "0.83rem"}}>
                    {params.value}
                </Box>
            ),
        },
        {
            field: "startTime",
            headerName: t("startTime"),
            minWidth: 88,
            flex: 0.78,
            type: "dateTime",
            renderHeader: () => renderCompactHeader(t("startTime")),
            valueGetter: value => new Date(value),
            valueFormatter: value => new Date(value).toLocaleString(locale),
            renderCell: params => renderCompactTimestamp(params.value ?? params.row.startTime),
        },
        {
            field: "endTime",
            headerName: t("endTime"),
            minWidth: 88,
            flex: 0.78,
            type: "dateTime",
            renderHeader: () => renderCompactHeader(t("endTime")),
            valueGetter: value => new Date(value),
            valueFormatter: value => new Date(value).toLocaleString(locale),
            renderCell: params => renderCompactTimestamp(params.value ?? params.row.endTime),
        },
        {
            field: "maxGamma",
            headerName: t("maxGamma"),
            minWidth: 90,
            flex: 0.68,
            renderHeader: () => renderCompactHeader(t("maxGamma")),
            renderCell: params => (
                <Box component="span" className="alarm-cell-primary" sx={{fontVariantNumeric: "tabular-nums", fontWeight: 600, fontSize: "0.83rem"}}>
                    {params.value}
                </Box>
            ),
        },
        {
            field: "maxNeutron",
            headerName: t("maxNeutron"),
            minWidth: 96,
            flex: 0.72,
            renderHeader: () => renderCompactHeader(t("maxNeutron")),
            renderCell: params => (
                <Box component="span" className="alarm-cell-primary" sx={{fontVariantNumeric: "tabular-nums", fontWeight: 600, fontSize: "0.83rem"}}>
                    {params.value}
                </Box>
            ),
        },
        {
            field: "status",
            headerName: t("status"),
            minWidth: 126,
            flex: 0.98,
            renderHeader: () => renderCompactHeader(t("status")),
            valueFormatter: (value: string) => formatOccupancyStatus(value, t),
            renderCell: params => {
                const rawStatus = String(params.value ?? "None");
                const isGamma = rawStatus === "Gamma";
                const isNeutron = rawStatus === "Neutron";
                const isGammaNeutron = rawStatus === "Gamma & Neutron" || (rawStatus !== "None" && !isGamma && !isNeutron);
                return (
                    <Box
                        component="span"
                        className="status-pill"
                        sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            px: 1.15,
                            py: 0.35,
                            borderRadius: "999px",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            lineHeight: 1.2,
                            letterSpacing: "0.01em",
                            whiteSpace: "nowrap",
                            maxWidth: "100%",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            ...(isGamma && {
                                bgcolor: "error.main",
                                color: "error.contrastText",
                            }),
                            ...(isNeutron && {
                                bgcolor: "info.main",
                                color: "info.contrastText",
                            }),
                            ...(isGammaNeutron && {
                                bgcolor: "secondary.main",
                                color: "secondary.contrastText",
                            }),
                            ...(!isGamma && !isNeutron && !isGammaNeutron && {
                                bgcolor: "action.hover",
                                color: "text.secondary",
                                border: "1px solid",
                                borderColor: "divider",
                            }),
                        }}
                    >
                        {params.formattedValue ?? formatOccupancyStatus(rawStatus, t)}
                    </Box>
                );
            },
            sortComparator: (_left, _right, leftCellParams, rightCellParams) =>
                sortEventsByAlarmPriority(
                    leftCellParams.api.getRow(leftCellParams.id),
                    rightCellParams.api.getRow(rightCellParams.id),
                ),
        },
        {
            field: "adjudicatedIds",
            headerName: t("adjudicated"),
            minWidth: 86,
            flex: 0.65,
            renderHeader: () => renderCompactHeader(t("adjudicated")),
            valueFormatter: (value: any) => hasEmlNonThreatMarker(value)
                ? t("emlNonThreat")
                : (value?.length > 0 ? t("yes") : t("no")),
            renderCell: params => {
                const isEml = hasEmlNonThreatMarker(params.value);
                const isYes = !isEml && (params.value?.length ?? 0) > 0;
                return (
                    <Box
                        component="span"
                        sx={{
                            fontSize: "0.8rem",
                            fontWeight: isEml || isYes ? 600 : 400,
                            color: isEml ? "info.main" : isYes ? "success.main" : "text.secondary",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                        }}
                    >
                        {params.formattedValue}
                    </Box>
                );
            },
        },
        {
            field: "adjudicationCode",
            headerName: t("adjudicationCode"),
            minWidth: 132,
            flex: 1.05,
            renderHeader: () => renderCompactHeader(t("adjudicationCode")),
            valueGetter: (_value, row) => extractLatestAdjudicationCode(row.adjudicatedIds),
            valueFormatter: (value: number | null) => value === null || value === undefined ? "—" : formatAdjudicationCodeLabel(value),
        },
        {
            field: "vehicleId",
            headerName: t("vehicleId"),
            minWidth: 124,
            flex: 0.9,
            sortable: false,
            filterable: false,
            renderHeader: () => renderCompactHeader(t("vehicleId")),
            valueGetter: (_value, row) => row.vehicleId ?? "",
            renderCell: params => {
                const value = params.row.vehicleId;
                if (!value) {
                    return (
                        <Box component="span" sx={{color: "text.secondary", fontSize: "0.8rem"}}>
                            —
                        </Box>
                    );
                }
                if (params.row.vehicleIdFromOcr) {
                    const label = `${value} (${t("ocrShort")})`;
                    return (
                        <Tooltip title={t("ocrTablePendingHint")} arrow enterTouchDelay={0}>
                            <Box
                                component="span"
                                sx={{
                                    fontFamily: "monospace",
                                    fontStyle: "italic",
                                    fontSize: "0.8rem",
                                    color: "text.secondary",
                                    minInlineSize: 0,
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                }}
                            >
                                {label}
                            </Box>
                        </Tooltip>
                    );
                }
                return (
                    <Box
                        component="span"
                        sx={{
                            fontFamily: "monospace",
                            fontWeight: 600,
                            fontSize: "0.8rem",
                            minInlineSize: 0,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                        }}
                    >
                        {value}
                    </Box>
                );
            },
        },
        {
            field: "Menu",
            headerName: "",
            type: "actions",
            width: 40,
            minWidth: 40,
            maxWidth: 40,
            sortable: false,
            filterable: false,
            disableColumnMenu: true,
            getActions: params => [<GridActionsCellItem key="details" icon={<VisibilityRoundedIcon />} label={t("details")} onClick={() => previewEvent(params.row, true)} showInMenu />],
        },
    ], [formatAdjudicationCodeLabel, isRowUnread, locale, renderCompactHeader, renderCompactTimestamp, t]);

    const getColumnList = () => columns
        .filter(column => viewAdjudicated || (column.field !== "adjudicatedIds" && column.field !== "adjudicationCode"))
        .map(column => column.field);

    const retryEventQueries = () => {
        const cutoff = advanceSnapshotCutoff();
        setUnreadReconcileEpoch(previous => previous + 1);
        void refreshCounts(cutoff);
        void fetchPage(paginationModel.page, cutoff);
    };

    return (
        <Box sx={{height: 800, width: "100%"}}>
            {isAlarmTable && (
                <Box
                    role="status"
                    aria-live="polite"
                    aria-atomic="true"
                    className="visually-hidden"
                    data-testid="alarm-acknowledge-status"
                >
                    {ackStatusMessage}
                </Box>
            )}
            {(countQueryError || pageQueryError) && (
                <Alert
                    severity="error"
                    role="alert"
                    action={<Button type="button" color="inherit" size="small" onClick={retryEventQueries}>{t("retry")}</Button>}
                    sx={{mb: 1}}
                >
                    {t("eventQueryLoadFailed")}
                </Alert>
            )}
            <DataGrid
                localeText={getDataGridLocaleText(language)}
                rows={displayRows}
                getRowId={eventSelectionKey}
                columns={columns}
                columnVisibilityModel={columnVisibilityModel}
                onColumnVisibilityModelChange={setColumnVisibilityModel}
                columnHeaderHeight={48}
                rowHeight={48}
                loading={loading}
                paginationMode="server"
                filterMode="server"
                paginationModel={paginationModel}
                onPaginationModelChange={model => setPaginationModel(model)}
                rowCount={effectiveRowCount}
                pageSizeOptions={[PAGE_SIZE]}
                checkboxSelection
                isRowSelectable={params => params.row.status !== "None" && !params.row.adjudicatedIds?.length}
                disableRowSelectionOnClick
                keepNonExistentRowsSelected
                rowSelectionModel={visibleSelectionModel}
                onRowSelectionModelChange={handleSelectionChange}
                onRowClick={(params, event) => {
                    const cell = (event.target as HTMLElement).closest("[data-field]");
                    const field = cell?.getAttribute("data-field");
                    if (field !== GRID_CHECKBOX_SELECTION_FIELD && field !== "Menu") previewEvent(params.row);
                }}
                onRowDoubleClick={(params: GridRowParams<EventTableData>) => previewEvent(params.row, true)}
                slots={{toolbar: CustomToolbar}}
                slotProps={{
                    toolbar: {
                        activeFilterCount: countEventFilterRules(filter),
                        selectedCount,
                        rowCount: effectiveRowCount,
                        allFilteredSelected,
                        filterLabel: t("advancedFilters"),
                        selectAllFilteredLabel: t("selectAllFiltered"),
                        clearSelectionLabel: t("clearSelection"),
                        bulkAdjudicateLabel: t("bulkAdjudicateSelected", {count: selectedCount}),
                        acknowledgeSelectedLabel: t("acknowledgeSelected", {count: selectedCount}),
                        acknowledgeAllLabel: t("acknowledgeAll"),
                        onOpenFilters: () => setFilterDialogOpen(true),
                        onSelectAllFiltered: selectAllFilteredAlarms,
                        onClearSelection: clearSelection,
                        onBulkAdjudicate: () => setBulkDialogOpen(true),
                        ...(isAlarmTable
                            ? {
                                unreadOnly: effectiveUnreadOnly,
                                unreadOnlyLabel: t("unreadOnly"),
                                onToggleUnreadOnly: handleToggleUnreadOnly,
                                timeWindowPreset,
                                timeWindowOptions,
                                timeWindowGroupLabel: t("alarmTimeWindow"),
                                onSelectTimeWindowPreset: handleSelectTimeWindowPreset,
                                onAcknowledgeSelected: () => {
                                    void acknowledgeSelectedAlarms();
                                },
                                onAcknowledgeAll: () => {
                                    void acknowledgeAllScopedAlarms();
                                },
                            }
                            : {}),
                    },
                    columnsManagement: {getTogglableColumns: getColumnList},
                }}
                initialState={{
                    sorting: {sortModel: [{field: "status", sort: "asc"}]},
                }}
                getCellClassName={(params: GridCellParams<any, any, string>) => {
                    if (params.value === "Gamma") return "highlightGamma";
                    if (params.value === "Neutron") return "highlightNeutron";
                    if (params.value === "Gamma & Neutron" || (params.value !== "None" && params.field === "status")) return "highlightGammaNeutron";
                    return "";
                }}
                getRowClassName={params => {
                    const classes: string[] = [];
                    if (params.row.id === selectedRowId) classes.push("preview-row");
                    if (isAlarmTable) {
                        classes.push(isRowUnread(params.row) ? "unread-alarm-row" : "read-alarm-row");
                    }
                    return classes.join(" ");
                }}
                sx={{
                    [`.${gridClasses.row}.preview-row`]: {
                        boxShadow: "inset 3px 0 0 #1976d2",
                        "@media (forced-colors: active)": {
                            outline: "2px solid Highlight",
                            outlineOffset: "-2px",
                        },
                    },
                    [`.${gridClasses.row}.unread-alarm-row`]: {
                        fontWeight: 700,
                    },
                    [`.${gridClasses.row}.unread-alarm-row .alarm-cell-primary`]: {
                        fontWeight: 700,
                    },
                    [`.${gridClasses.row}.read-alarm-row`]: {
                        fontWeight: 400,
                    },
                    [`.${gridClasses.row}.read-alarm-row .alarm-cell-primary`]: {
                        fontWeight: 400,
                    },
                    [`& .unread-alarm-dot`]: {
                        "@media (forced-colors: active)": {
                            backgroundColor: "Highlight",
                            borderColor: "Highlight",
                        },
                    },
                    [`& .${gridClasses.columnHeader}, & .${gridClasses.cell}`]: {px: 0.75},
                    [`& .${gridClasses.cell}`]: {display: "flex", alignItems: "center"},
                    [`& .${gridClasses.columnHeaderTitleContainer}`]: {flex: 1, minWidth: 0, overflow: "visible"},
                    [`& .${gridClasses.columnHeaderTitleContainerContent}`]: {overflow: "visible", minWidth: 0},
                    [`& .${gridClasses.menuIcon}`]: {
                        display: "none",
                        width: 0,
                        mr: 0,
                    },
                    [`& .${gridClasses.columnHeader}:hover .${gridClasses.menuIcon}, & .${gridClasses.menuOpen}`]: {
                        display: "flex",
                        width: "auto",
                        visibility: "visible",
                    },
                    [`& .${gridClasses.iconButtonContainer}`]: {
                        display: "none",
                        width: 0,
                    },
                    [`& .${gridClasses.columnHeader}:hover .${gridClasses.iconButtonContainer}, & .${gridClasses.columnHeader}--sorted .${gridClasses.iconButtonContainer}`]: {
                        display: "flex",
                        width: "auto",
                        visibility: "visible",
                    },
                    [`& .${gridClasses.actionsCell}`]: {
                        gridGap: 0,
                    },
                    [`& [data-field="Menu"]`]: {
                        px: 0,
                        justifyContent: "center",
                        overflow: "hidden",
                    },
                    [`& .${gridClasses.cellCheckbox}, & .${gridClasses.columnHeaderCheckbox}`]: {
                        px: 0.5,
                    },
                    border: "none",
                }}
            />
            <NestedEventFilterDialog
                open={filterDialogOpen}
                filter={filter}
                nodeOptions={nodeOptions}
                laneOptions={laneOptions}
                adjudicationCodeOptions={adjudicationCodeOptions}
                t={t}
                onClose={() => setFilterDialogOpen(false)}
                onApply={applyFilter}
            />
            <BulkAdjudicationDialog
                nodes={allFilteredSelected ? bulkQueryPlans.map(plan => plan.node) :
                    Array.from(selectedKeys).flatMap(key => {
                        const event = eventCacheRef.current.get(key);
                        const lane = event && findLaneByDataStreamId(event.dataStreamId);
                        return lane ? [lane.parentNode] : [];
                    })}
                open={bulkDialogOpen}
                count={selectedCount}
                allFiltered={allFilteredSelected}
                t={t}
                onClose={() => setBulkDialogOpen(false)}
                onSubmit={handleBulkSubmit}
            />
            <Snackbar open={bulkSelectionError} autoHideDuration={6000} onClose={() => setBulkSelectionError(false)}>
                <Alert severity="error" onClose={() => setBulkSelectionError(false)}>{t("bulkSelectionLoadFailed")}</Alert>
            </Snackbar>
        </Box>
    );
}
