"use client"

import React, {useCallback, useContext, useEffect, useMemo, useRef, useState} from "react";
import {useRouter} from "next/navigation";
import {
    acquireSharedConnection,
    findRealtimeDataSourceForStream,
    LaneDSColl,
    LaneMapEntry,
    type SharedConnectionLease,
} from "@/lib/data/oscar/LaneCollection";
import LeafletView from "osh-js/source/core/ui/view/map/LeafletView";
import {useSelector} from "react-redux";
import {RootState} from "@/lib/state/Store";
import Box from "@mui/material/Box";
import '../../style/map.css';
import {DataSourceContext} from "@/app/contexts/DataSourceContext";
import {selectLaneMap} from "@/lib/state/OSCARLaneSlice";
import "leaflet/dist/leaflet.css"
import {
    isBackgroundDataStream,
    isConnectionDataStream,
    isD5RadiometricStatusDataStream,
    isD5SpectrumDataStream,
    isForegroundDataStream,
    isGammaDataStream,
    isLocationDataStream,
    isMobileDetectorLane,
    isMobileGpsDataStream,
    isNeutronDataStream,
    isOccupancyDataStream,
    isSiteDiagramPathDataStream,
    isTamperDataStream,
} from "@/lib/data/oscar/Utilities";
import {buildEventDetailsHref} from "@/lib/data/oscar/EventLookup";
import {fetchCollectionDataWithSignal, isAbortRequestError} from "@/lib/data/oscar/EventTableRequests";
import {setCurrentLane} from "@/lib/state/LaneViewSlice";
import {useAppDispatch} from "@/lib/state/Hooks";
import L from "leaflet";
import {selectNodes} from "@/lib/state/OSHSlice";
import {INode} from "@/lib/data/osh/Node";
import ObservationFilter from "osh-js/source/core/consysapi/observation/ObservationFilter";
import DataStreamFilter from "osh-js/source/core/consysapi/datastream/DataStreamFilter.js";
import {useLanguage} from '@/app/contexts/LanguageContext';
import {EventType} from "osh-js/source/core/event/EventType";
import {removeRealtimeEventSubscription} from "@/lib/data/oscar/RealtimeEventNotification";
import {
    buildLaneExtentSignature,
    buildMobileAlarmPopupHtml,
    buildSiteDiagramUrl,
    escapeHtml,
    LANE_EXTENT_FIT_OPTIONS,
    LANE_MARKER_ICON_ANCHOR,
    LANE_MARKER_ICON_SIZE,
    LANE_MARKER_PANE,
    LANE_MARKER_PANE_Z_INDEX,
    LANE_SILENCE_THRESHOLD_MS,
    LaneMapLocation,
    MOBILE_ALARM_COLOR,
    MOBILE_ALARM_FLASH_MS,
    MOBILE_ALARM_QUERY_LIMIT,
    MOBILE_ALARM_REFRESH_MS,
    MOBILE_SWEEP_MS,
    mobileAlarmPosition,
    OSM_TILE_URL,
    resolveLaneMapLocation,
    SITE_DIAGRAM_FIT_OPTIONS,
    SITE_DIAGRAM_PANE,
    SITE_DIAGRAM_PANE_Z_INDEX,
    SiteDiagramBounds,
    startOfLocalDayIso,
    toLaneMapLocation,
    toLaneMapLocationFromSystem,
    toLeafletLaneExtentBounds,
    toLeafletSiteDiagramBounds,
    UNADJUDICATED_ALARM_FILTER,
    walkerIconHtml,
    walkerState,
} from "@/app/_components/maps/MapUtils";
import {fetchActiveOfflineMapInfo} from "@/lib/data/oscar/RuntimeExtensionsApi";
import {createLeafletPmTilesLayer, isValidOfflineMapBounds} from "@/app/_components/maps/PmTilesLayerFactory";

interface LaneMarkerState {
    laneName: string;
    location: LaneMapLocation;
    status: string;
    /** Mobile detector lane: drawn as a walker that follows live GPS fixes. */
    mobile?: boolean;
    /** Initial fix used for lane-extent fitting so moving walkers do not reset pan/zoom. */
    fitLocation?: LaneMapLocation;
    /** Browser arrival timestamp of the walker's latest fix or live detector heartbeat. */
    lastFixAt?: number;
    /** Active alarm flash expiration timestamp. */
    alarmUntil?: number;
}

const fitLocationOf = (marker: LaneMarkerState) => marker.fitLocation ?? marker.location;

export interface MapComponentProps {
    /** Unique DOM container ID when multiple maps mount on a custom dashboard. */
    containerId?: string;
    /** CSS height of the map container. */
    height?: string;
    /** Optional subset of lane names selected in a widget configuration. */
    allowedLaneNames?: string[];
    showMobileUnits?: boolean;
    showAlarmMarkers?: boolean;
    alarmTimeWindow?: "today" | "1h" | "8h" | "24h";
}

function resolveAlarmWindowStartIso(windowMode: "today" | "1h" | "8h" | "24h" = "today"): string {
    const now = Date.now();
    if (windowMode === "1h") return new Date(now - 60 * 60_000).toISOString();
    if (windowMode === "8h") return new Date(now - 8 * 60 * 60_000).toISOString();
    if (windowMode === "24h") return new Date(now - 24 * 60 * 60_000).toISOString();
    return startOfLocalDayIso();
}

export default function MapComponent({
    containerId = "mapcontainer",
    height = "100vh",
    allowedLaneNames,
    showMobileUnits = true,
    showAlarmMarkers = true,
    alarmTimeWindow = "today",
}: MapComponentProps = {}) {
    const {language, t} = useLanguage();
    const router = useRouter();
    const mapcontainer: string = containerId;
    const rawLaneMap = useSelector((state: RootState) => selectLaneMap(state));
    const laneMap = useMemo(() => {
        if (!allowedLaneNames) return rawLaneMap;
        const allowed = new Set(allowedLaneNames);
        const filtered = new Map<string, LaneMapEntry>();
        rawLaneMap.forEach((entry, key) => {
            if (allowed.has(key)) filtered.set(key, entry);
        });
        return filtered;
    }, [allowedLaneNames, rawLaneMap]);
    const leafletViewRef = useRef<typeof LeafletView | null>(null);
    const osmLayerRef = useRef<L.TileLayer | null>(null);
    const esriLayerRef = useRef<L.TileLayer | null>(null);
    const offlinePmLayerRef = useRef<L.Layer | null>(null);
    const offlineBoundsRef = useRef<L.LatLngBounds | null>(null);
    const siteDiagramLayersRef = useRef<Map<string, L.ImageOverlay>>(new Map());
    const siteDiagramBoundsRef = useRef<L.LatLngBounds | null>(null);
    const laneMarkerLayersRef = useRef<Map<string, L.Marker>>(new Map());
    const locationListRef = useRef<LaneMarkerState[]>([]);
    const hasUserAdjustedViewRef = useRef(false);
    const isProgrammaticViewChangeRef = useRef(false);
    const previousLanguageRef = useRef(language);
    const {activeViewKey, laneMapReady, scopedHref} = useContext(DataSourceContext);
    const dispatch = useAppDispatch();

    const nodes = useSelector((state: RootState) => selectNodes(state));

    const [isInit, setIsInit] = useState(false);
    const [dataSourcesByLane, setDataSourcesByLane] = useState<Map<string, LaneDSColl>>(new Map<string, LaneDSColl>());
    const [locationList, setLocationList] = useState<LaneMarkerState[]>([]);
    const [sweepTick, setSweepTick] = useState(0);
    const mobileAlarmMarkersRef = useRef<Map<string, L.CircleMarker>>(new Map());
    const refreshMobileAlarmsRef = useRef<() => void>(() => {});
    const pendingAlarmRefreshTimerRef = useRef<number | null>(null);
    const mobileLaneSetRef = useRef<Set<string>>(new Set());

    locationListRef.current = locationList;

    const laneExtentSignature = useMemo(
        () => buildLaneExtentSignature(locationList.map((marker) => ({
            laneName: marker.laneName,
            location: fitLocationOf(marker),
        }))),
        [locationList],
    );

    const fitMapToActiveExtent = useCallback((resetUserAdjustment = false) => {
        const view = leafletViewRef.current;
        if (!view?.map)
            return;

        if (resetUserAdjustment)
            hasUserAdjustedViewRef.current = false;

        const laneBoundsCoords = toLeafletLaneExtentBounds(
            locationListRef.current.map(fitLocationOf),
        );

        if (laneBoundsCoords) {
            isProgrammaticViewChangeRef.current = true;
            try {
                view.map.invalidateSize({pan: false, animate: false});
                view.map.fitBounds(L.latLngBounds(laneBoundsCoords), LANE_EXTENT_FIT_OPTIONS);
            } finally {
                isProgrammaticViewChangeRef.current = false;
            }
            return;
        }

        if (siteDiagramBoundsRef.current?.isValid()) {
            isProgrammaticViewChangeRef.current = true;
            try {
                view.map.invalidateSize({pan: false, animate: false});
                view.map.fitBounds(siteDiagramBoundsRef.current, SITE_DIAGRAM_FIT_OPTIONS);
            } finally {
                isProgrammaticViewChangeRef.current = false;
            }
            return;
        }

        if (offlineBoundsRef.current?.isValid()) {
            isProgrammaticViewChangeRef.current = true;
            try {
                view.map.invalidateSize({pan: false, animate: false});
                view.map.fitBounds(offlineBoundsRef.current, {animate: false});
            } finally {
                isProgrammaticViewChangeRef.current = false;
            }
        }
    }, []);

    useEffect(() => {
        if (laneMap.size === 0 && !laneMapReady)
            return;

        if (laneMap.size === 0) {
            setDataSourcesByLane(new Map());
            setLocationList([]);
            return;
        }

        let cancelled = false;
        const laneDSMap = new Map<string, LaneDSColl>();
        const nextMobileSet = new Set<string>();
        const locationSources: Array<{
            laneName: string;
            dataStream: any | null;
            systemLocation: LaneMapLocation | null;
            mobile: boolean;
        }> = [];
        const seededAt = Date.now();

        for (const [laneName, lane] of laneMap.entries()) {
            const mobile = isMobileDetectorLane(lane);
            if (mobile && !showMobileUnits) {
                continue;
            }
            if (mobile) {
                nextMobileSet.add(laneName);
            }
            const laneDSColl = new LaneDSColl();
            laneDSMap.set(laneName, laneDSColl);

            const laneSystemId = lane.laneSystem?.properties?.id;
            const locationStreams: any[] = [];

            lane.datastreams.forEach((dataStream) => {
                const realtimeSource = findRealtimeDataSourceForStream(lane, dataStream);

                if (isLocationDataStream(dataStream))
                    locationStreams.push(dataStream);
                if (realtimeSource && isGammaDataStream(dataStream))
                    laneDSColl.addDS('gammaRT', realtimeSource);
                if (realtimeSource && isNeutronDataStream(dataStream))
                    laneDSColl.addDS('neutronRT', realtimeSource);
                if (realtimeSource && isTamperDataStream(dataStream))
                    laneDSColl.addDS('tamperRT', realtimeSource);
                if (realtimeSource && isConnectionDataStream(dataStream))
                    laneDSColl.addDS('connectionRT', realtimeSource);
                if (realtimeSource && isMobileGpsDataStream(dataStream))
                    laneDSColl.addDS('locRT', realtimeSource);
                if (realtimeSource && isOccupancyDataStream(dataStream))
                    laneDSColl.addDS('occRT', realtimeSource);
                if (
                    realtimeSource
                    && (
                        isForegroundDataStream(dataStream)
                        || isBackgroundDataStream(dataStream)
                        || isD5RadiometricStatusDataStream(dataStream)
                        || isD5SpectrumDataStream(dataStream)
                    )
                ) {
                    laneDSColl.addDS('foregroundRT', realtimeSource);
                }
            });

            const gpsStream = mobile
                ? (lane.datastreams.find((dataStream) => isMobileGpsDataStream(dataStream)) ?? null)
                : null;
            const laneLocationStream = gpsStream ?? locationStreams.find((dataStream) =>
                dataStream?.properties?.["system@id"] === laneSystemId) ?? locationStreams[0] ?? null;
            locationSources.push({
                laneName,
                dataStream: laneLocationStream,
                systemLocation: toLaneMapLocationFromSystem(lane.laneSystem),
                mobile,
            });
        }
        mobileLaneSetRef.current = nextMobileSet;
        setDataSourcesByLane(laneDSMap);

        // Seed lane markers immediately from the lane system GeoJSON geometry
        // so the map fits the active lane extent on the first render frame
        // without waiting for per-lane latest observation queries to settle.
        setLocationList((current) => {
            const currentByLane = new Map(current.map((item) => [item.laneName, item]));
            return locationSources
                .map(({laneName, systemLocation, mobile}) => {
                    const existing = currentByLane.get(laneName);
                    const location = (mobile && existing?.location) || systemLocation || existing?.location || null;
                    if (!location)
                        return null;
                    return {
                        laneName,
                        location,
                        status: existing?.status ?? 'None',
                        ...(mobile ? {
                            mobile: true,
                            fitLocation: existing?.fitLocation ?? location,
                            lastFixAt: existing?.lastFixAt ?? seededAt,
                            alarmUntil: existing?.alarmUntil,
                        } : {}),
                    } as LaneMarkerState;
                })
                .filter((marker): marker is LaneMarkerState => marker !== null);
        });

        const loadLatestLocations = async () => {
            const markers = await Promise.all(locationSources.map(async ({laneName, dataStream, systemLocation, mobile}) => {
                if (!dataStream) {
                    if (!systemLocation)
                        console.warn(`No configured location is available for lane ${laneName}`);
                    return systemLocation
                        ? {laneName, location: systemLocation, status: 'None', ...(mobile ? {mobile: true} : {})} as LaneMarkerState
                        : null;
                }

                try {
                    const observations = await dataStream.searchObservations(
                        new ObservationFilter({resultTime: "latest"}), 1);
                    const results = await observations.nextPage();
                    const location = resolveLaneMapLocation(results[0]?.result, systemLocation);
                    if (!location) {
                        console.warn(`No valid latest location is available for lane ${laneName}`);
                        return null;
                    }
                    return {laneName, location, status: 'None', ...(mobile ? {mobile: true} : {})} as LaneMarkerState;
                } catch (error) {
                    console.error(`Unable to load the latest location for lane ${laneName}`, error);
                    return systemLocation
                        ? {laneName, location: systemLocation, status: 'None', ...(mobile ? {mobile: true} : {})} as LaneMarkerState
                        : null;
                }
            }));

            if (cancelled) return;
            setLocationList((current) => markers
                .filter((marker): marker is LaneMarkerState => marker !== null)
                .map((marker) => {
                    const existing = current.find((item) => item.laneName === marker.laneName);
                    if (!marker.mobile)
                        return {...marker, status: existing?.status ?? marker.status};
                    const liveFixArrived = existing?.lastFixAt != null && existing.lastFixAt > seededAt;
                    const location = liveFixArrived ? existing!.location : marker.location;
                    return {
                        ...marker,
                        location,
                        status: existing?.status ?? marker.status,
                        fitLocation: marker.location,
                        lastFixAt: existing?.lastFixAt ?? seededAt,
                        alarmUntil: existing?.alarmUntil,
                    };
                }));
        };

        void loadLatestLocations();
        return () => {
            cancelled = true;
        };
    }, [laneMap, laneMapReady, showMobileUnits]);


    const addSubscriptionCallbacks = useCallback(() => {
        let active = true;
        const subscriptions: Array<{
            source: any;
            handler: (message: any) => void;
            lease: SharedConnectionLease;
        }> = [];

        const subscribe = (
            sources: any[],
            handler: (message: any) => void,
        ) => {
            sources.forEach((source) => {
                source.subscribe(handler, [EventType.DATA]);
                const lease = acquireSharedConnection(source);
                subscriptions.push({source, handler, lease});
                void lease.ready.catch((error) => {
                    if (active)
                        console.warn("Unable to connect map status stream", error);
                });
            });
        };

        const subscribedAt = Date.now();
        for (const [laneName, laneDSColl] of dataSourcesByLane.entries()) {
            const msgLaneName = laneName;
            const isMobileLane = mobileLaneSetRef.current.has(msgLaneName);
            if (!isMobileLane && laneDSColl.gammaRT.length + laneDSColl.neutronRT.length > 0)
                deviceMessageAtRef.current.set(msgLaneName, subscribedAt);
            const noteDeviceMessage = () => deviceMessageAtRef.current.set(msgLaneName, Date.now());

            subscribe(laneDSColl.connectionRT, (message: any) => {
                const data = message.values?.[0]?.data;
                const connected = data?.isConnected ?? data?.connection;
                if (!active || typeof connected !== "boolean") return;
                updateLaneMarker(msgLaneName, (marker) => {
                    if (!connected)
                        return marker.status === 'Alarm' ? marker : {...marker, status: 'Offline'};
                    return marker.status === 'Offline' && !isLaneSilent(msgLaneName, marker, Date.now())
                        ? {...marker, status: 'None'}
                        : marker;
                });
            });

            subscribe(laneDSColl.gammaRT, (message: any) => {
                noteDeviceMessage();
                const alarmstate = message.values?.[0]?.data?.alarmState;
                if (active && alarmstate !== undefined)
                    updateLocationList(msgLaneName, alarmstate);
            });
            subscribe(laneDSColl.neutronRT, (message: any) => {
                noteDeviceMessage();
                const alarmstate = message.values?.[0]?.data?.alarmState;
                if (active && alarmstate !== undefined)
                    updateLocationList(msgLaneName, alarmstate);
            });

            if (isMobileLane) {
                subscribe(laneDSColl.locRT, (message: any) => {
                    const location = toLaneMapLocation(message.values?.[0]?.data);
                    if (!active || !location || (location.lat === 0 && location.lon === 0)) return;
                    updateLaneMarker(msgLaneName, (marker) => ({
                        ...marker,
                        location,
                        fitLocation: marker.fitLocation ?? location,
                        lastFixAt: Date.now(),
                        status: marker.status === 'Offline' ? 'None' : marker.status,
                    }));
                });
                subscribe(laneDSColl.foregroundRT, () => {
                    if (!active) return;
                    updateLaneMarker(msgLaneName, (marker) => ({
                        ...marker,
                        lastFixAt: Date.now(),
                        status: marker.status === 'Offline' ? 'None' : marker.status,
                    }));
                });
                subscribe(laneDSColl.occRT, (message: any) => {
                    const data = message.values?.[0]?.data;
                    if (!active || !(data?.gammaAlarm || data?.neutronAlarm)) return;
                    updateLaneMarker(msgLaneName, (marker) => ({
                        ...marker,
                        lastFixAt: Date.now(),
                        alarmUntil: Date.now() + MOBILE_ALARM_FLASH_MS,
                    }));
                    if (pendingAlarmRefreshTimerRef.current !== null) {
                        window.clearTimeout(pendingAlarmRefreshTimerRef.current);
                    }
                    pendingAlarmRefreshTimerRef.current = window.setTimeout(() => {
                        pendingAlarmRefreshTimerRef.current = null;
                        if (active) refreshMobileAlarmsRef.current();
                    }, 2_000);
                });
            }
            subscribe(laneDSColl.tamperRT, (message: any) => {
                const tamperState = message.values?.[0]?.data?.tamperStatus;
                if (active && tamperState)
                    updateLocationList(msgLaneName, 'Tamper');
            });
        }

        return () => {
            active = false;
            if (pendingAlarmRefreshTimerRef.current !== null) {
                window.clearTimeout(pendingAlarmRefreshTimerRef.current);
                pendingAlarmRefreshTimerRef.current = null;
            }
            subscriptions.forEach(({source, handler, lease}) => {
                removeRealtimeEventSubscription(source, handler);
                void lease.release().catch((error) => {
                    console.warn("Unable to disconnect map status stream", error);
                });
            });
        };
    }, [dataSourcesByLane]);

    useEffect(() => {
        if (dataSourcesByLane.size === 0) return;
        return addSubscriptionCallbacks();
    }, [addSubscriptionCallbacks, dataSourcesByLane]);

    // Silence sweep: transitions markers whose device streams have stopped publishing.
    useEffect(() => {
        if (dataSourcesByLane.size === 0) return;
        const sweep = () => {
            const now = Date.now();
            setLocationList((current) => {
                let changed = false;
                const next = current.map((marker) => {
                    if (marker.mobile || marker.status === 'Alarm' || marker.status === 'Offline'
                        || !isLaneSilent(marker.laneName, marker, now))
                        return marker;
                    changed = true;
                    return {...marker, status: 'Offline'};
                });
                return changed ? next : current;
            });
            setSweepTick((tick) => tick + 1);
        };
        const timer = window.setInterval(sweep, MOBILE_SWEEP_MS);
        const onVisible = () => { if (document.visibilityState === 'visible') sweep(); };
        document.addEventListener('visibilitychange', onVisible);
        return () => {
            window.clearInterval(timer);
            document.removeEventListener('visibilitychange', onVisible);
        };
    }, [dataSourcesByLane]);

    // Batched unadjudicated mobile alarms per node, bounded by phenomenonTime and resultTime.
    useEffect(() => {
        const view = leafletViewRef.current;
        const markers = mobileAlarmMarkersRef.current;
        if (!view?.map || !isInit || !showMobileUnits || !showAlarmMarkers) {
            refreshMobileAlarmsRef.current = () => {};
            markers.forEach((marker) => marker.remove());
            markers.clear();
            return;
        }
        const mobileLanes = Array.from(laneMap.values()).filter((lane) => isMobileDetectorLane(lane));
        if (mobileLanes.length === 0) {
            refreshMobileAlarmsRef.current = () => {};
            markers.forEach((marker) => marker.remove());
            markers.clear();
            return;
        }

        let cancelled = false;
        let inFlight = false;
        let activeAbortController: AbortController | null = null;

        const refresh = async () => {
            if (inFlight || cancelled) return;
            inFlight = true;
            const controller = new AbortController();
            activeAbortController = controller;
            try {
                const seen = new Set<string>();
                const windowStart = resolveAlarmWindowStartIso(alarmTimeWindow);
                const nowIso = new Date().toISOString();

                const byNode = new Map<string, {
                    node: INode;
                    occupancyIds: string[];
                    laneByStreamId: Map<string, LaneMapEntry>;
                    laneNames: string[];
                }>();
                for (const lane of mobileLanes) {
                    const nodeId = lane.parentNode?.id;
                    if (!nodeId) continue;
                    const occStreams = lane.datastreams.filter((ds) => isOccupancyDataStream(ds));
                    if (occStreams.length === 0) continue;
                    let group = byNode.get(nodeId);
                    if (!group) {
                        group = {
                            node: lane.parentNode,
                            occupancyIds: [],
                            laneByStreamId: new Map(),
                            laneNames: [],
                        };
                        byNode.set(nodeId, group);
                    }
                    group.laneNames.push(lane.laneName);
                    for (const ds of occStreams) {
                        const streamId = ds?.properties?.id;
                        if (typeof streamId === "string" && streamId.length > 0) {
                            group.occupancyIds.push(streamId);
                            group.laneByStreamId.set(streamId, lane);
                        }
                    }
                }

                await Promise.all(Array.from(byNode.values()).map(async ({node, occupancyIds, laneByStreamId, laneNames}) => {
                    if (occupancyIds.length === 0) return;
                    try {
                        const api = await node.getObservationsApi();
                        const collection = await api.searchObservations(new ObservationFilter({
                            dataStream: occupancyIds,
                            phenomenonTime: `${windowStart}/${nowIso}`,
                            resultTime: `${windowStart}/${nowIso}`,
                            filter: encodeURIComponent(UNADJUDICATED_ALARM_FILTER),
                            order: "desc",
                        }), MOBILE_ALARM_QUERY_LIMIT);
                        const observations = typeof collection?.fetchData === "function"
                            ? await fetchCollectionDataWithSignal(collection, controller.signal)
                            : await collection.nextPage();
                        if (cancelled || controller.signal.aborted) return;
                        (observations ?? []).forEach((observation: any) => {
                            const obsId = observation?.properties?.id ?? observation?.id;
                            const streamId = observation?.properties?.["datastream@id"] ?? observation?.["datastream@id"];
                            const lane = (typeof streamId === "string" ? laneByStreamId.get(streamId) : undefined)
                                ?? (laneByStreamId.size === 1 ? Array.from(laneByStreamId.values())[0] : undefined);
                            if (!lane) return;
                            const result = observation?.properties?.result ?? observation?.result;
                            const position = mobileAlarmPosition(result);
                            if (!obsId || !position) return;
                            const key = `${lane.laneName}\u001f${obsId}`;
                            seen.add(key);
                            if (markers.has(key)) return;
                            const kind = t('status.alarm');
                            const href = scopedHref(buildEventDetailsHref(obsId, lane.parentNode?.id));
                            const when = result?.startTime ? new Date(result.startTime).toLocaleString() : '';
                            const marker = L.circleMarker([position.lat, position.lon], {
                                className: 'mobile-alarm-marker',
                                radius: 7,
                                weight: 2,
                                color: MOBILE_ALARM_COLOR,
                                fillColor: MOBILE_ALARM_COLOR,
                                fillOpacity: 0.15,
                                pane: LANE_MARKER_PANE,
                            }).addTo(view.map);
                            marker.bindPopup(
                                buildMobileAlarmPopupHtml({
                                    laneName: lane.laneName,
                                    kind,
                                    when,
                                    href,
                                    viewEventLabel: t('viewEvent'),
                                }),
                            );
                            marker.getElement()?.setAttribute('data-occ-obs', obsId);
                            markers.set(key, marker);
                        });
                    } catch (error) {
                        if (cancelled || controller.signal.aborted || isAbortRequestError(error)) return;
                        console.warn(`Unable to load mobile alarms for node ${node.name}`, error);
                        markers.forEach((_marker, key) => {
                            if (laneNames.some((ln) => key.startsWith(`${ln}\u001f`))) {
                                seen.add(key);
                            }
                        });
                    }
                }));
                if (cancelled || controller.signal.aborted) return;
                markers.forEach((marker, key) => {
                    if (!seen.has(key)) {
                        marker.remove();
                        markers.delete(key);
                    }
                });
            } finally {
                if (activeAbortController === controller) {
                    activeAbortController = null;
                }
                inFlight = false;
            }
        };
        refreshMobileAlarmsRef.current = () => { void refresh(); };
        void refresh();
        const timer = window.setInterval(() => { void refresh(); }, MOBILE_ALARM_REFRESH_MS);
        const onVisible = () => { if (document.visibilityState === 'visible') void refresh(); };
        document.addEventListener('visibilitychange', onVisible);
        return () => {
            cancelled = true;
            activeAbortController?.abort();
            activeAbortController = null;
            window.clearInterval(timer);
            document.removeEventListener('visibilitychange', onVisible);
            refreshMobileAlarmsRef.current = () => {};
            markers.forEach((marker) => marker.remove());
            markers.clear();
        };
    }, [alarmTimeWindow, isInit, laneMap, scopedHref, showAlarmMarkers, showMobileUnits, t]);

    useEffect(() => {
        if (!leafletViewRef.current && !isInit) {
            // define base layers

            const osmLayer = L.tileLayer(OSM_TILE_URL, {
                attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                minZoom: 1,
                maxZoom: 22,
                maxNativeZoom: 19,
                referrerPolicy: "strict-origin-when-cross-origin",
            });
            const esriLayer = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
                attribution: '&copy; <a href="https://www.esri.com/">Esri</a>, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
                maxZoom: 22,
                maxNativeZoom: 19,
                referrerPolicy: "strict-origin-when-cross-origin"
            });

            let view = new LeafletView({
                container: mapcontainer,
                destroyAfterMutation: false,
                layers: [],
                imageOverlays: [],
                autoZoomOnFirstMarker: false,
                baseLayers:{
                    [t('osmStreets')]: osmLayer,
                    [t('esriSatellite')]: esriLayer
                },
                overlayLayers: {},
                defaultLayer: osmLayer
            });
            view.map.options.zoomSnap = 0;
            view.map.options.zoomDelta = 0.5;
            const markUserAdjustedView = () => {
                if (!isProgrammaticViewChangeRef.current)
                    hasUserAdjustedViewRef.current = true;
            };
            view.map.on("dragstart", markUserAdjustedView);
            view.map.on("zoomstart", markUserAdjustedView);
            view.map.on("popupopen", (evt: any) => {
                const popupEl: HTMLElement | undefined = evt?.popup?.getElement?.();
                if (!popupEl) return;
                popupEl.querySelectorAll<HTMLButtonElement>(".popup-button[data-nav-href]").forEach((btn) => {
                    btn.onclick = (clickEvt) => {
                        clickEvt.preventDefault();
                        const dest = btn.getAttribute("data-nav-href");
                        if (dest) router.push(dest);
                    };
                });
            });

            const siteDiagramPane = view.map.createPane(SITE_DIAGRAM_PANE);
            siteDiagramPane.style.zIndex = String(SITE_DIAGRAM_PANE_Z_INDEX);
            siteDiagramPane.style.pointerEvents = "none";
            const laneMarkerPane = view.map.createPane(LANE_MARKER_PANE);
            laneMarkerPane.style.zIndex = String(LANE_MARKER_PANE_Z_INDEX);

            // LeafletView accepts a default layer, but explicitly enforce OSM
            // here so an empty map never depends on the layer-control state.
            if (!view.map.hasLayer(osmLayer))
                osmLayer.addTo(view.map);

            osmLayerRef.current = osmLayer;
            esriLayerRef.current = esriLayer;

            hasUserAdjustedViewRef.current = false;
            leafletViewRef.current = view;
            setIsInit(true);
        }

        return () =>{
            if(isInit && leafletViewRef.current != null){
                siteDiagramLayersRef.current.clear();
                siteDiagramBoundsRef.current = null;
                offlineBoundsRef.current = null;
                offlinePmLayerRef.current = null;
                osmLayerRef.current = null;
                esriLayerRef.current = null;
                laneMarkerLayersRef.current.clear();
                leafletViewRef.current.destroy();
                leafletViewRef.current = undefined;
            }
        }
    }, [isInit]);

    useEffect(() => {
        const view = leafletViewRef.current;
        if (!view?.map || !isInit) return;
        let cancelled = false;

        void (async () => {
            const activeMap = await fetchActiveOfflineMapInfo();
            if (cancelled || leafletViewRef.current !== view || !activeMap.active) {
                return;
            }
            const pmLayer = createLeafletPmTilesLayer(activeMap, language);
            if (!pmLayer) {
                return;
            }
            offlinePmLayerRef.current = pmLayer;
            if (isValidOfflineMapBounds(activeMap.bounds)) {
                offlineBoundsRef.current = L.latLngBounds(activeMap.bounds);
            }

            if (activeMap.defaultBasemap) {
                if (osmLayerRef.current && view.map.hasLayer(osmLayerRef.current)) {
                    view.map.removeLayer(osmLayerRef.current);
                }
                pmLayer.addTo(view.map);
            }

            // Replace LeafletView's anonymous base-layer control so operators can toggle
            // seamlessly between the Offline PMTiles pack, OSM Streets, and Esri Satellite.
            const existingCtrlEl = view.map.getContainer()?.querySelector('.leaflet-control-layers');
            if (existingCtrlEl && existingCtrlEl.parentElement) {
                existingCtrlEl.parentElement.removeChild(existingCtrlEl);
            }
            const offlineLabel = `Offline: ${activeMap.displayName || activeMap.fileName || 'PMTiles'}`;
            const baseLayers: Record<string, L.Layer> = {
                [offlineLabel]: pmLayer,
            };
            if (osmLayerRef.current) baseLayers[t('osmStreets')] = osmLayerRef.current;
            if (esriLayerRef.current) baseLayers[t('esriSatellite')] = esriLayerRef.current;
            L.control.layers(baseLayers, {}).addTo(view.map);

            if (!hasUserAdjustedViewRef.current
                && locationListRef.current.length === 0
                && !siteDiagramBoundsRef.current?.isValid()
                && offlineBoundsRef.current?.isValid()) {
                fitMapToActiveExtent(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [fitMapToActiveExtent, isInit, language, t]);

    useEffect(() => {
        if (previousLanguageRef.current === language) return;
        previousLanguageRef.current = language;

        if (leafletViewRef.current) {
            siteDiagramLayersRef.current.clear();
            siteDiagramBoundsRef.current = null;
            laneMarkerLayersRef.current.clear();
            leafletViewRef.current.destroy();
            leafletViewRef.current = null;
            setIsInit(false);
        }
    }, [language]);

    useEffect(() => {
        const view = leafletViewRef.current;
        if (!view || !isInit) return;

        const renderedLaneNames = new Set<string>();
        const now = Date.now();
        locationList.forEach((laneMarker) => {
            const {laneName, location, status} = laneMarker;
            renderedLaneNames.add(laneName);
            let markerIcon: L.Icon | L.DivIcon;
            if (laneMarker.mobile) {
                const state = walkerState(laneMarker.lastFixAt, laneMarker.alarmUntil, status === 'Offline', now);
                const title = state === 'offline' && laneMarker.lastFixAt != null
                    ? `${laneName} — ${t('mobileNoDataSince', {time: new Date(laneMarker.lastFixAt).toLocaleTimeString()})}`
                    : laneName;
                markerIcon = L.divIcon({
                    className: 'mobile-unit-marker',
                    iconSize: [30, 30],
                    iconAnchor: [15, 15],
                    popupAnchor: [0, -14],
                    html: walkerIconHtml(state, title),
                });
            } else {
                markerIcon = L.icon({
                    iconUrl: getMarkerIcon(status),
                    iconSize: LANE_MARKER_ICON_SIZE,
                    iconAnchor: LANE_MARKER_ICON_ANCHOR,
                });
            }
            let marker = laneMarkerLayersRef.current.get(laneName);

            if (!marker) {
                marker = L.marker([location.lat, location.lon], {
                    icon: markerIcon,
                    pane: LANE_MARKER_PANE,
                    zIndexOffset: 1000,
                    title: laneName,
                    alt: laneName,
                }).addTo(view.map);
                marker.bindTooltip(`<div class='popup-text-lane'>${escapeHtml(laneName)}</div>`, {
                    direction: 'center',
                    offset: L.point(-5, -15),
                });
                marker.on('click', () => dispatch(setCurrentLane(laneName)));
                laneMarkerLayersRef.current.set(laneName, marker);
            } else {
                marker.setLatLng([location.lat, location.lon]);
                marker.setIcon(markerIcon);
            }

            if (marker.getPopup())
                marker.setPopupContent(getContent(status));
            else
                marker.bindPopup(getContent(status), {offset: L.point(-5, -15)});
        });

        laneMarkerLayersRef.current.forEach((marker, laneName) => {
            if (!renderedLaneNames.has(laneName)) {
                view.map.removeLayer(marker);
                laneMarkerLayersRef.current.delete(laneName);
            }
        });
    }, [locationList, isInit, language, t, sweepTick]);

    useEffect(() => {
        if (!isInit || !laneExtentSignature)
            return;

        fitMapToActiveExtent(true);
        const frameId = window.requestAnimationFrame(() => {
            fitMapToActiveExtent(false);
        });

        return () => {
            window.cancelAnimationFrame(frameId);
        };
    }, [activeViewKey, fitMapToActiveExtent, isInit, laneExtentSignature]);

    useEffect(() => {
        const view = leafletViewRef.current;
        if (!view?.map || !isInit || typeof ResizeObserver === "undefined")
            return;

        const containerElement = document.getElementById(mapcontainer);
        if (!containerElement)
            return;

        let resizeFrameId: number | null = null;
        const observer = new ResizeObserver(() => {
            if (resizeFrameId !== null)
                window.cancelAnimationFrame(resizeFrameId);
            resizeFrameId = window.requestAnimationFrame(() => {
                if (leafletViewRef.current !== view)
                    return;
                if (!hasUserAdjustedViewRef.current) {
                    fitMapToActiveExtent(false);
                } else {
                    isProgrammaticViewChangeRef.current = true;
                    try {
                        view.map.invalidateSize({pan: false, animate: false});
                    } finally {
                        isProgrammaticViewChangeRef.current = false;
                    }
                }
            });
        });
        observer.observe(containerElement);

        return () => {
            observer.disconnect();
            if (resizeFrameId !== null)
                window.cancelAnimationFrame(resizeFrameId);
        };
    }, [fitMapToActiveExtent, isInit]);

    useEffect(() => {
        const view = leafletViewRef.current;
        if (!view || !isInit || !laneMapReady) {
            return;
        }

        let cancelled = false;
        let fitFrameId: number | null = null;

        type LoadedSiteDiagram = {
            node: INode,
            path: string,
            bounds: SiteDiagramBounds,
        };

        const loadSiteDiagram = async (node: INode): Promise<LoadedSiteDiagram | null> => {
            const oscarSystem = node.getOscarServiceSystem();
            if (!oscarSystem)
                return null;

            const oscarSystemDatastreams = [];
            const dataStreamsCol = await oscarSystem.searchDataStreams(
                new DataStreamFilter({validTime: "latest"}), 10);
            while (dataStreamsCol.hasNext()) {
                const datastreamResults = await dataStreamsCol.nextPage();
                oscarSystemDatastreams.push(...datastreamResults);
            }

            const siteDiagramStream = oscarSystemDatastreams.find(isSiteDiagramPathDataStream);
            if (!siteDiagramStream)
                return null;

            const observations = await siteDiagramStream.searchObservations(
                new ObservationFilter({resultTime: "latest"}), 1);
            const results = await observations.nextPage();
            const siteDiagram = results[0]?.result;
            if (!siteDiagram?.siteDiagramPath)
                return null;

            const bounds = toLeafletSiteDiagramBounds(siteDiagram.siteBoundingBox);
            if (!bounds) {
                console.warn(`Invalid site diagram bounds for ${node.name}`, siteDiagram.siteBoundingBox);
                return null;
            }

            const path = buildSiteDiagramUrl(siteDiagram.siteDiagramPath, node);
            node.setSiteMapPath(path);
            node.setLowerLeftBox(bounds[0]);
            node.setUpperRightBox(bounds[1]);
            return {node, path, bounds};
        };

        const renderSiteDiagrams = async () => {
            const diagramResults: Array<LoadedSiteDiagram | null> = await Promise.all(
                (nodes as INode[]).map(async (node: INode) => {
                    try {
                        return await loadSiteDiagram(node);
                    } catch (error) {
                        console.error(`Unable to load the site diagram for ${node.name}`, error);
                        return null;
                    }
                }));
            const diagrams: LoadedSiteDiagram[] = diagramResults.filter(
                (diagram): diagram is LoadedSiteDiagram => diagram !== null);

            if (cancelled || leafletViewRef.current !== view)
                return;

            siteDiagramLayersRef.current.forEach((layer) => view.map.removeLayer(layer));
            siteDiagramLayersRef.current.clear();

            const combinedBounds = L.latLngBounds([]);
            diagrams.forEach(({node, path, bounds}: LoadedSiteDiagram) => {
                const leafletBounds = L.latLngBounds(bounds);
                const overlay = view.addImageOverlay(path, leafletBounds, {
                    opacity: 0.85,
                    interactive: false,
                    pane: SITE_DIAGRAM_PANE,
                    alt: t('siteMapForNode', {name: node.name, id: node.id}),
                }) as L.ImageOverlay;

                overlay.on("load", () => overlay.bringToFront());
                overlay.on("error", () => console.error(`Unable to render the site diagram for ${node.name}: ${path}`));
                overlay.bringToFront();
                siteDiagramLayersRef.current.set(node.id, overlay);
                combinedBounds.extend(leafletBounds);
            });

            siteDiagramBoundsRef.current = diagrams.length > 0 ? combinedBounds : null;

            if (diagrams.length > 0) {
                view.autoZoomOnFirstMarker = false;
                // Fit to the active lane extent when lane locations exist, or
                // fall back to the uploaded site diagram extent when no lane
                // coordinates are available.
                fitFrameId = window.requestAnimationFrame(() => {
                    if (cancelled || leafletViewRef.current !== view)
                        return;

                    fitMapToActiveExtent(false);
                });
            }
        };

        void renderSiteDiagrams();
        return () => {
            cancelled = true;
            if (fitFrameId !== null)
                window.cancelAnimationFrame(fitFrameId);
        };
    }, [fitMapToActiveExtent, isInit, laneMap, laneMapReady, nodes, language]);

    const deviceMessageAtRef = useRef<Map<string, number>>(new Map());

    const isLaneSilent = (laneName: string, marker: LaneMarkerState, now: number): boolean => {
        if (marker.mobile)
            return walkerState(marker.lastFixAt, undefined, false, now) === 'offline';
        const last = deviceMessageAtRef.current.get(laneName);
        return last != null && now - last > LANE_SILENCE_THRESHOLD_MS;
    };

    const updateLaneMarker = (laneName: string, updater: (marker: LaneMarkerState) => LaneMarkerState) => {
        setLocationList((prevState) => {
            let changed = false;
            const next = prevState.map((data) => {
                if (data.laneName !== laneName) return data;
                const updated = updater(data);
                changed ||= updated !== data;
                return updated;
            });
            return changed ? next : prevState;
        });
    };

    const updateLocationList = (laneName: string, newStatus: string) =>
        updateLaneMarker(laneName, (marker) =>
            marker.status === newStatus ? marker : {...marker, status: newStatus});

    function getMarkerIcon(status: string) {
        const normalizedStatus = typeof status === 'string' ? status : '';
        if (normalizedStatus === 'Alarm') return '/alarm.svg';
        if (normalizedStatus.includes('Fault')) return '/fault.svg';
        if (normalizedStatus === 'Offline') return '/offline.svg';
        return '/default.svg';
    }

    /***************content in popup************/
    function getContent(status: string) {
        const normalizedStatus = typeof status === 'string' && status ? status : 'None';
        const statusKey = normalizedStatus.toLowerCase().replace(/[ -]/g, '');
        const safeStatus = escapeHtml(t('statusValue', {status: t(`status.${statusKey}`)}));
        const safeHref = escapeHtml(scopedHref('/lane-view'));
        const safeLabel = escapeHtml(t('viewLane'));

        return (
            `<div id='popup-data-layer' class='point-popup'><hr/>
                <h3 class='popup-text-status'>${safeStatus}</h3>
                <button data-nav-href="${safeHref}" class="popup-button" type="button">${safeLabel}</button>
            </div>`
        );
    }

    return (
        <Box
            id={mapcontainer}
            sx={{width: '100%', height}}
        />
    );
}
