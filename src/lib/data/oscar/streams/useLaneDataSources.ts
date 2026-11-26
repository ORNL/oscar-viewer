/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import {useContext, useEffect, useMemo} from "react";
import {useSelector} from "react-redux";
import {DataSourceContext} from "@/app/contexts/DataSourceContext";
import {
    acquireSharedConnection,
    findRealtimeDataSourceForStream,
    LaneDSColl,
    LaneMapEntry,
} from "@/lib/data/oscar/LaneCollection";
import {
    isDailyFileDataStream,
    isGammaDataStream,
    isNeutronDataStream,
    isTamperDataStream,
    isThresholdDataStream,
} from "@/lib/data/oscar/Utilities";
import {selectLaneMap} from "@/lib/state/OSCARLaneSlice";
import {RootState} from "@/lib/state/Store";
import {convertToMap} from "@/app/utils/Utils";

export interface LaneDataSources {
    entry?: LaneMapEntry;
    collection: LaneDSColl | null;
    gamma?: any;
    neutron?: any;
    threshold?: any;
    tamper?: any;
}

/**
 * Resolve shared realtime datasources for a single lane in the active scoped view.
 * When `connect` is true, holds ref-counted connection leases while mounted and
 * releases them immediately on unmount or lane change.
 */
export function useLaneDataSources(laneName: string | undefined, connect = false): LaneDataSources {
    const {laneMapRef, laneMapReady, activeViewKey} = useContext(DataSourceContext) as any;
    const laneMapRaw = useSelector((state: RootState) => selectLaneMap(state));
    const reduxLaneMap = useMemo(() => convertToMap(laneMapRaw), [laneMapRaw]);

    const sources = useMemo<LaneDataSources>(() => {
        const activeMap: Map<string, LaneMapEntry> | undefined =
            reduxLaneMap.size > 0 ? reduxLaneMap : laneMapRef?.current;
        const entry: LaneMapEntry | undefined = laneName ? activeMap?.get(laneName) : undefined;
        if (!entry) return {collection: null};
        const collection = new LaneDSColl();
        const found: LaneDataSources = {entry, collection};
        for (const ds of entry.datastreams ?? []) {
            const rt = findRealtimeDataSourceForStream(entry, ds);
            if (!rt) continue;
            const share = () => {
                if (rt.properties?.mqttOpts) rt.properties.mqttOpts.shared = true;
            };
            if (isGammaDataStream(ds)) { share(); collection.addDS('gammaRT', rt); found.gamma = rt; }
            if (isNeutronDataStream(ds)) { share(); collection.addDS('neutronRT', rt); found.neutron = rt; }
            if (isTamperDataStream(ds)) { share(); collection.addDS('tamperRT', rt); found.tamper = rt; }
            if (isThresholdDataStream(ds)) { share(); collection.addDS('gammaTrshldRT', rt); found.threshold = rt; }
            if (isDailyFileDataStream(ds)) { share(); collection.addDS('dailyFileRT', rt); }
        }
        return found;
    }, [laneName, reduxLaneMap, laneMapRef, laneMapReady, activeViewKey]);

    useEffect(() => {
        if (!connect) return;
        const feeds = [sources.gamma, sources.neutron, sources.threshold].filter(Boolean);
        let active = true;
        const leases = feeds.map((source) => {
            const lease = acquireSharedConnection(source);
            void lease.ready.catch((error) => {
                if (active) console.warn("Unable to connect lane widget stream", error);
            });
            return lease;
        });
        return () => {
            active = false;
            leases.forEach((lease) => void lease.release().catch((error) =>
                console.warn("Unable to disconnect lane widget stream", error)));
        };
    }, [connect, sources]);

    return sources;
}
