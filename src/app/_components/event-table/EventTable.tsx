"use client";

import {useCallback, useContext, useEffect, useMemo, useRef, useState} from "react";
import {Alert, Box, Button, Snackbar} from "@mui/material";
import {useSelector} from "react-redux";
import {
    DataGrid,
    GRID_CHECKBOX_SELECTION_FIELD,
    GridActionsCellItem,
    GridCellParams,
    gridClasses,
    GridColDef,
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
    setAdjudicatedEventId,
    setSelectedEvent,
} from "@/lib/state/EventDataSlice";
import {useLanguage} from "@/app/contexts/LanguageContext";
import {NotificationService, NotificationTemplates} from "../notifications/NotificationService";
import {formatOccupancyStatus, getDataGridLocaleText, getIntlLocale} from "@/app/utils/LocaleUtils";
import {DataSourceContext} from "@/app/contexts/DataSourceContext";
import CustomToolbar from "@/app/_components/CustomToolbar";
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
    deduplicateEvents,
    EventQueryPlan,
    fetchCollectionDataWithSignal,
    isAbortRequestError,
    useAbortableEventQueries,
} from "@/lib/data/oscar/EventTableRequests";

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
}

type QueryPlan = EventQueryPlan;

const PAGE_SIZE = 15;
const BULK_FETCH_SIZE = 250;
const REALTIME_ID_RESOLUTION_TIMEOUT_MS = 12_000;

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
}: TableProps) {
    const selectedRowId = useSelector(selectSelectedRowId);
    const adjudicatedEventId = useSelector(selectAdjudicatedEventId);
    const dispatch = useAppDispatch();
    const router = useRouter();
    const {activeViewKey, scopedHref} = useContext(DataSourceContext);
    const {language, t} = useLanguage();
    const locale = getIntlLocale(language);

    const stableLaneMap = useMemo(() => convertToMap(laneMap), [laneMap]);
    const [paginationModel, setPaginationModel] = useState({page: 0, pageSize: PAGE_SIZE});
    const [filterEpoch, setFilterEpoch] = useState(0);
    // Stamp the REST snapshot upper bound when discovered lanes hydrate (or when filters
    // are re-applied), rather than at empty initial mount before MQTT subscriptions exist.
    const pageLoadedTime = useMemo(
        () => new Date().toISOString(),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [stableLaneMap, filterEpoch],
    );
    const [filter, setFilter] = useState<EventFilterGroup>(() => createEventFilterGroup());
    const [filterDialogOpen, setFilterDialogOpen] = useState(false);
    const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
    const [bulkSelectionError, setBulkSelectionError] = useState(false);
    const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
    const [allFilteredSelected, setAllFilteredSelected] = useState(false);
    const [allFilteredTotal, setAllFilteredTotal] = useState(0);
    const [excludedKeys, setExcludedKeys] = useState<Set<string>>(new Set());
    const [postSelectionKeys, setPostSelectionKeys] = useState<Set<string>>(new Set());
    const allFilteredCutoffRef = useRef<string | null>(null);
    const eventCacheRef = useRef<Map<string, EventTableData>>(new Map());
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

    const queryPlans = useMemo<QueryPlan[]>(() => {
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

    const findLaneByDataStreamId = useCallback((datastreamId: string): LaneMapEntry | undefined =>
        Array.from(stableLaneMap.values()).find(lane => lane.datastreams.some((stream: any) => stream.properties.id === datastreamId)), [stableLaneMap]);

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

    const eventFromObservation = useCallback((observation: any, lane: LaneMapEntry, live: boolean): EventTableData => {
        const event = createEventFromOccupancyObservation(observation, lane, !live);
        eventCacheRef.current.set(eventSelectionKey(event), event);
        return event;
    }, []);

    const fetchPlanRows = useCallback(async (
        plan: QueryPlan,
        limit: number,
        offset: number,
        cutoff = pageLoadedTime,
        signal?: AbortSignal,
    ) => {
        const observationFilter = new ObservationFilter({
            dataStream: plan.datastreamIds,
            resultTime: `../${cutoff}`,
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
            return lane ? [eventFromObservation(observation, lane, false)] : [];
        });
    }, [eventFromObservation, findLaneByDataStreamId, pageLoadedTime]);

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
        fetchPlanRows,
    });

    const replaceRealtimeEventIdentity = useCallback((original: EventTableData, resolved: EventTableData) => {
        if (!resolved.occupancyObsId || resolved === original) return;

        const originalKey = eventSelectionKey(original);
        const resolvedKey = eventSelectionKey(resolved);
        if (eventCacheRef.current.get(originalKey) === original)
            eventCacheRef.current.delete(originalKey);
        eventCacheRef.current.set(resolvedKey, resolved);
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
    }, [dispatch, setRows]);

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
        if (tableMode === "alarmtable" && (event.status === "None" || event.adjudicatedIds?.length > 0)) return false;
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
                    resolveIdentityAndNotify(event, lane);
                    if (currentPageRef.current !== 0) return;
                    if (!rowPassesLocalFilters(event, lane)) return;
                    if (allFilteredCutoffRef.current && event.status !== "None" && !event.adjudicatedIds?.length) {
                        setPostSelectionKeys(previous => new Set(previous).add(eventSelectionKey(event)));
                    }
                    setRowCount(previous => previous + 1);
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
    }, [stableLaneMap, eventFromObservation, rowPassesLocalFilters, resolveIdentityAndNotify, cancelRealtimeResolutionJobs]);

    useEffect(() => {
        if (!adjudicatedEventId || tableMode !== "alarmtable") return;
        setRows(previous => previous.filter(row => row.id !== adjudicatedEventId));
        setRowCount(previous => Math.max(0, previous - 1));
        dispatch(setAdjudicatedEventId(null));
    }, [adjudicatedEventId, tableMode, dispatch]);

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

    const getLatestGB = async (event: EventTableData) => {
        for (const lane of stableLaneMap.values()) {
            const threshold = lane.datastreams
                .filter((stream: any) => isThresholdDataStream(stream))
                .find((stream: typeof DataStream) => stream.properties["system@id"] === event.rpmSystemId);
            if (threshold) dispatch(setLatestGB(await getObservations(event.startTime, event.endTime, threshold)));
        }
    };

    const previewEvent = (event: EventTableData, navigate = false) => {
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
        const cutoff = allFilteredCutoffRef.current ?? pageLoadedTime;
        const planRows = await runWithConcurrency(bulkQueryPlans, 4, async plan => {
            const count = await fetchPlanCount(plan, cutoff, true);
            const collected: EventTableData[] = [];
            for (let offset = 0; offset < count; offset += BULK_FETCH_SIZE)
                collected.push(...await fetchPlanRows(plan, BULK_FETCH_SIZE, offset, cutoff));
            return collected;
        });
        return deduplicateEvents(planRows.flat())
            .filter(event => !excludedKeys.has(eventSelectionKey(event)));
    }, [bulkQueryPlans, fetchPlanCount, fetchPlanRows, excludedKeys, pageLoadedTime]);

    const selectAllFilteredAlarms = async () => {
        const cutoff = pageLoadedTime;
        setLoading(true);
        try {
            const counts = await runWithConcurrency(bulkQueryPlans, 6, plan => fetchPlanCount(plan, cutoff, true));
            allFilteredCutoffRef.current = cutoff;
            setAllFilteredTotal(counts.reduce((sum, count) => sum + count, 0));
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
            setRows(previous => previous.filter(event => !successfulKeys.has(eventSelectionKey(event))));
            setRowCount(previous => Math.max(0, previous - successful.length));
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
        setSelectedKeys(new Set(failed.map(outcome => eventSelectionKey(outcome.event))));
        return {success: successful.length, failed: failed.length};
    };

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
                <Box component="span" sx={{fontWeight: 500, fontSize: "0.81rem", lineHeight: 1.2, whiteSpace: "nowrap"}}>
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
            renderCell: params => (
                <Box sx={{display: "flex", flexDirection: "column", justifyContent: "center", py: 0.5, minWidth: 0}}>
                    <Box component="span" sx={{fontWeight: 600, fontSize: "0.83rem", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis"}}>{params.row.laneId}</Box>
                    <Box component="span" sx={{fontSize: "0.71rem", color: "text.secondary", lineHeight: 1.15, overflow: "hidden", textOverflow: "ellipsis"}}>{params.row.parentNode}</Box>
                </Box>
            ),
        },
        {
            field: "occupancyCount",
            headerName: t("occupancyId"),
            minWidth: 78,
            flex: 0.58,
            renderHeader: () => renderCompactHeader(t("occupancyId")),
            renderCell: params => (
                <Box component="span" sx={{fontVariantNumeric: "tabular-nums", fontWeight: 600, fontSize: "0.83rem"}}>
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
                <Box component="span" sx={{fontVariantNumeric: "tabular-nums", fontWeight: 600, fontSize: "0.83rem"}}>
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
                <Box component="span" sx={{fontVariantNumeric: "tabular-nums", fontWeight: 600, fontSize: "0.83rem"}}>
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
    ], [formatAdjudicationCodeLabel, locale, renderCompactHeader, renderCompactTimestamp, t]);

    const getColumnList = () => columns
        .filter(column => viewAdjudicated || (column.field !== "adjudicatedIds" && column.field !== "adjudicationCode"))
        .map(column => column.field);

    const retryEventQueries = () => {
        void refreshCounts();
        void fetchPage(paginationModel.page);
    };

    return (
        <Box sx={{height: 800, width: "100%"}}>
            {(countQueryError || pageQueryError) && (
                <Alert
                    severity="error"
                    role="alert"
                    action={<Button color="inherit" size="small" onClick={retryEventQueries}>{t("retry")}</Button>}
                    sx={{mb: 1}}
                >
                    {t("eventQueryLoadFailed")}
                </Alert>
            )}
            <DataGrid
                localeText={getDataGridLocaleText(language)}
                rows={rows}
                getRowId={eventSelectionKey}
                columns={columns}
                columnHeaderHeight={48}
                rowHeight={48}
                loading={loading}
                paginationMode="server"
                filterMode="server"
                paginationModel={paginationModel}
                onPaginationModelChange={model => setPaginationModel(model)}
                rowCount={rowCount}
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
                        rowCount,
                        allFilteredSelected,
                        filterLabel: t("advancedFilters"),
                        selectAllFilteredLabel: t("selectAllFiltered"),
                        clearSelectionLabel: t("clearSelection"),
                        bulkAdjudicateLabel: t("bulkAdjudicateSelected", {count: selectedCount}),
                        onOpenFilters: () => setFilterDialogOpen(true),
                        onSelectAllFiltered: selectAllFilteredAlarms,
                        onClearSelection: clearSelection,
                        onBulkAdjudicate: () => setBulkDialogOpen(true),
                    },
                    columnsManagement: {getTogglableColumns: getColumnList},
                }}
                initialState={{
                    sorting: {sortModel: [{field: "status", sort: "asc"}]},
                    columns: {columnVisibilityModel: {adjudicatedIds: viewAdjudicated, adjudicationCode: false}},
                }}
                getCellClassName={(params: GridCellParams<any, any, string>) => {
                    if (params.value === "Gamma") return "highlightGamma";
                    if (params.value === "Neutron") return "highlightNeutron";
                    if (params.value === "Gamma & Neutron" || (params.value !== "None" && params.field === "status")) return "highlightGammaNeutron";
                    return "";
                }}
                getRowClassName={params => params.row.id === selectedRowId ? "preview-row" : ""}
                sx={{
                    [`.${gridClasses.row}.preview-row`]: {boxShadow: "inset 3px 0 0 #1976d2"},
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
