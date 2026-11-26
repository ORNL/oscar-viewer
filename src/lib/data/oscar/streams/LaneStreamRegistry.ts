/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import {EventType} from "osh-js/source/core/event/EventType";
import {
    acquireSharedConnection,
    findRealtimeDataSourceForStream,
    LaneMapEntry,
    type SharedConnectionLease,
} from "@/lib/data/oscar/LaneCollection";
import {removeRealtimeEventSubscription} from "@/lib/data/oscar/RealtimeEventNotification";
import {
    isConnectionDataStream,
    isD5RadiometricStatusDataStream,
    isGammaDataStream,
    isMobileGpsDataStream,
    isNeutronDataStream,
    isOccupancyDataStream,
    isTamperDataStream,
    isThresholdDataStream,
    isVehicleOcrDataStream,
} from "@/lib/data/oscar/Utilities";
import {LaneSelection} from "@/lib/layout/PageConfigTypes";

export type LaneStreamName =
    | 'connectionRT'
    | 'gammaRT'
    | 'neutronRT'
    | 'tamperRT'
    | 'gammaTrshldRT'
    | 'occRT'
    | 'locRT'
    | 'radStatusRT'
    | 'vehicleOcrRT';

export type LaneStreamHandler = (laneId: string, stream: LaneStreamName, message: any) => void;

const STREAM_MATCHERS: Record<LaneStreamName, (datastream: any) => boolean> = {
    connectionRT: isConnectionDataStream,
    gammaRT: isGammaDataStream,
    neutronRT: isNeutronDataStream,
    tamperRT: isTamperDataStream,
    gammaTrshldRT: isThresholdDataStream,
    occRT: isOccupancyDataStream,
    locRT: isMobileGpsDataStream,
    radStatusRT: isD5RadiometricStatusDataStream,
    vehicleOcrRT: isVehicleOcrDataStream,
};

interface Binding {
    source: any;
    handler: (message: any) => void;
    lease: SharedConnectionLease;
}

/**
 * Ref-counted handler bundles over shared realtime datasources for multi-lane widgets.
 */
class LaneStreamRegistryImpl {
    private bundles = new Map<string, Binding[]>();

    activeBundleCount(): number {
        return this.bundles.size;
    }

    /** Register a handler bundle for the given lanes/streams; acquiring with an existing id replaces it. */
    acquire(
        bundleId: string,
        laneMap: Map<string, LaneMapEntry>,
        laneIds: string[],
        streams: LaneStreamName[],
        handler: LaneStreamHandler,
    ) {
        this.release(bundleId);
        const bindings: Binding[] = [];
        for (const laneId of laneIds) {
            const lane = laneMap.get(laneId);
            if (!lane) continue;
            for (const datastream of lane.datastreams ?? []) {
                for (const stream of streams) {
                    if (!STREAM_MATCHERS[stream](datastream)) continue;
                    const source = findRealtimeDataSourceForStream(lane, datastream);
                    if (!source) continue;
                    if (source.properties?.mqttOpts) {
                        source.properties.mqttOpts.shared = true;
                    }
                    const bound = (message: any) => {
                        try {
                            handler(laneId, stream, message);
                        } catch (e) {
                            console.error(`[LaneStreamRegistry] handler error for ${laneId}/${stream}:`, e);
                        }
                    };
                    source.subscribe(bound, [EventType.DATA]);
                    const lease = acquireSharedConnection(source);
                    void lease.ready.catch((e) =>
                        console.warn(`[LaneStreamRegistry] connect failed for ${laneId}/${stream}:`, e)
                    );
                    bindings.push({source, handler: bound, lease});
                }
            }
        }
        this.bundles.set(bundleId, bindings);
    }

    /** Detach a bundle's handlers and release its shared connection leases immediately. */
    release(bundleId: string) {
        const bindings = this.bundles.get(bundleId);
        if (!bindings) return;
        this.bundles.delete(bundleId);
        for (const {source, handler, lease} of bindings) {
            removeRealtimeEventSubscription(source, handler);
            void lease.release().catch((e) =>
                console.warn("[LaneStreamRegistry] disconnect failed:", e)
            );
        }
    }

    /** Release all registered bundles. */
    releaseAll() {
        for (const bundleId of [...this.bundles.keys()]) {
            this.release(bundleId);
        }
    }
}

export const LaneStreamRegistry = new LaneStreamRegistryImpl();

export function resolveLaneSelection(
    selection: LaneSelection | undefined,
    laneMap: Map<string, LaneMapEntry> | null | undefined,
): string[] {
    if (!laneMap || laneMap.size === 0) return [];
    if (!selection || selection.mode === 'all') return [...laneMap.keys()];
    if (selection.mode === 'include' && Array.isArray(selection.lanes)) {
        return selection.lanes.filter((l) => typeof l === 'string' && laneMap.has(l));
    }
    return [];
}
