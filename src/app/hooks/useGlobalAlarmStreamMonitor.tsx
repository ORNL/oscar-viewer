"use client";

/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import {useEffect, useRef} from "react";
import {useSelector} from "react-redux";
import {EventType} from "osh-js/source/core/event/EventType";
import {RootState} from "@/lib/state/Store";
import {selectLaneMap} from "@/lib/state/OSCARLaneSlice";
import {setAlarmTrigger} from "@/lib/state/EventDataSlice";
import {useAppDispatch} from "@/lib/state/Hooks";
import {
    acquireSharedConnection,
    findRealtimeDataSourceForStream,
    LaneMapEntry,
    type SharedConnectionLease,
} from "@/lib/data/oscar/LaneCollection";
import {removeRealtimeEventSubscription} from "@/lib/data/oscar/RealtimeEventNotification";
import {
    isGammaDataStream,
    isMobileDetectorLane,
    isNeutronDataStream,
    isOccupancyDataStream,
} from "@/lib/data/oscar/Utilities";

const EMPTY_LANE_MAP = new Map<string, LaneMapEntry>();
let activeSingletonOwner: symbol | null = null;

/**
 * Subscribes once across the application to realtime Gamma, Neutron, and Mobile Detector
 * occupancy alarm streams so audible radiation alarms trigger on every route (including
 * /dashboards, /event-log, /map, and /health) without duplicating listeners when DashboardPage
 * is also mounted.
 */
export function useGlobalAlarmStreamMonitor(): void {
    const dispatch = useAppDispatch();
    const laneMap = useSelector((state: RootState) =>
        state?.laneSlice ? selectLaneMap(state) : EMPTY_LANE_MAP,
    );
    const ownerRef = useRef<symbol | null>(null);
    if (!ownerRef.current) {
        ownerRef.current = Symbol("global-alarm-stream-monitor");
    }

    useEffect(() => {
        const owner = ownerRef.current!;
        if (activeSingletonOwner !== null && activeSingletonOwner !== owner) {
            return;
        }
        activeSingletonOwner = owner;

        let active = true;
        const subscriptions: Array<{
            source: any;
            handler: (message: any) => void;
            lease: SharedConnectionLease;
        }> = [];
        const uniqueSources = new Set<any>();

        laneMap.forEach((lane, laneId) => {
            const mobileLane = isMobileDetectorLane(lane);
            (lane.datastreams ?? []).forEach((ds: any) => {
                const isGammaOrNeutron = isGammaDataStream(ds) || isNeutronDataStream(ds);
                const isMobileOccupancy = mobileLane && isOccupancyDataStream(ds);
                if (!isGammaOrNeutron && !isMobileOccupancy) {
                    return;
                }
                const rtDS = findRealtimeDataSourceForStream(lane, ds);
                if (!rtDS || uniqueSources.has(rtDS)) {
                    return;
                }
                uniqueSources.add(rtDS);

                if (rtDS.properties) {
                    rtDS.properties.startTime = new Date().toISOString();
                    rtDS.properties.endTime = "2055-01-01T08:13:25.845Z";
                }

                const handler = (message: any) => {
                    if (!active) return;
                    const data = message?.values?.[0]?.data;
                    const alarming = isMobileOccupancy
                        ? Boolean(data?.gammaAlarm || data?.neutronAlarm) && !(data?.adjudicatedIds?.length > 0)
                        : data?.alarmState === "Alarm";
                    if (alarming) {
                        dispatch(setAlarmTrigger(true));
                    }
                };
                rtDS.subscribe(handler, [EventType.DATA]);
                const lease = acquireSharedConnection(rtDS);
                subscriptions.push({source: rtDS, handler, lease});
                void lease.ready.catch((error) => {
                    if (active) {
                        console.warn(`Unable to connect global alarm stream for ${laneId}`, error);
                    }
                });
            });
        });

        return () => {
            active = false;
            if (activeSingletonOwner === owner) {
                activeSingletonOwner = null;
            }
            subscriptions.forEach(({source, handler, lease}) => {
                removeRealtimeEventSubscription(source, handler);
                void lease.release().catch((error) => {
                    console.warn("Unable to disconnect global alarm stream", error);
                });
            });
        };
    }, [dispatch, laneMap]);
}

export default function GlobalAlarmStreamMonitor(): null {
    useGlobalAlarmStreamMonitor();
    return null;
}
