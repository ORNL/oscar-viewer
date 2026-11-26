/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import ControlStream from "osh-js/source/core/consysapi/controlstream/ControlStream";
import ControlStreamFilter from "osh-js/source/core/consysapi/controlstream/ControlStreamFilter";
import {fetchCollectionDataWithSignal} from "@/lib/data/oscar/EventTableRequests";
import {LaneMapEntry} from "@/lib/data/oscar/LaneCollection";
import {isAdjudicationControlStream} from "@/lib/data/oscar/Utilities";
import AdjudicationData from "@/lib/data/oscar/adjudication/Adjudication";
import {resolveAdjudicationCode} from "@/lib/data/oscar/adjudication/CustomAdjudicationCodes";
import {ADJ_PAGE_SIZE, POOL} from "./alarmStatsTypes";

export type AdjudicationByOccupancy = Map<string, AdjudicationData>;

/** Convert one COMPLETED adjudication command status into `AdjudicationData`. */
function parseAdjudicationStatus(status: any): AdjudicationData | null {
    const results = status?.results?.[0]?.data;
    if (!results?.occupancyObsId) return null;
    const data = new AdjudicationData(status.reportTime, "", results.occupancyObsId);
    data.setFeedback(results.feedback);
    data.setIsotopes(results.isotopes ?? []);
    data.setSecondaryInspectionStatus(results.secondaryInspectionStatus);
    data.setAdjudicationCode(resolveAdjudicationCode(results.adjudicationCode, []));
    data.setVehicleId(results.vehicleId ?? "");
    data.setFilePaths(results.filePaths ?? []);
    data.setTime(status.reportTime);
    data.setUser(results.username ?? "");
    return data;
}

/** Latest adjudication report wins for a given occupancy observation ID. */
export function applyAdjudication(map: AdjudicationByOccupancy, adj: AdjudicationData) {
    const key = adj.occupancyObsId;
    if (!key) return;
    const existing = map.get(key);
    if (!existing || new Date(adj.time).getTime() >= new Date(existing.time).getTime()) {
        map.set(key, adj);
    }
}

async function drainCollectionPages(
    collection: any,
    isCancelled: () => boolean,
    signal: AbortSignal | undefined,
    onItems: (items: any[]) => void,
) {
    if (typeof collection?.url === "string" && typeof collection?.filter?.toQueryString === "function") {
        let offset = typeof collection.pageOffset === "number" ? collection.pageOffset : 0;
        const pageSize = typeof collection.pageSize === "number" && collection.pageSize > 0
            ? collection.pageSize
            : ADJ_PAGE_SIZE;
        while (!isCancelled() && !signal?.aborted) {
            collection.pageOffset = offset;
            const page = await fetchCollectionDataWithSignal(collection, signal);
            const items = Array.isArray(page) ? page : [];
            onItems(items);
            if (items.length < pageSize) break;
            offset += pageSize;
        }
        return;
    }

    while (collection?.hasNext?.() && !isCancelled() && !signal?.aborted) {
        const page = await collection.nextPage();
        onItems(page ?? []);
    }
}

/**
 * Fetch COMPLETED adjudication command statuses for the given lanes within a
 * bounded `reportTime` window (`startIso/endIso`), capped at `POOL = 2`
 * concurrent requests and cancellable via `AbortSignal`.
 */
export async function fetchAdjudicationWindow(
    laneMap: Map<string, LaneMapEntry>,
    laneIds: string[],
    startIso: string,
    endIso: string,
    isCancelled: () => boolean,
    signal?: AbortSignal,
): Promise<AdjudicationByOccupancy> {
    const map: AdjudicationByOccupancy = new Map();

    async function drainLane(laneId: string) {
        if (isCancelled() || signal?.aborted) return;
        const entry = laneMap.get(laneId);
        if (!entry) return;

        const controlStream: typeof ControlStream | undefined =
            entry.controlStreams?.find((cs: any) => isAdjudicationControlStream(cs));
        if (!controlStream) return;

        try {
            const statuses = await controlStream.searchStatus(
                new ControlStreamFilter({
                    statusCode: "COMPLETED",
                    reportTime: `${startIso}/${endIso}`,
                }),
                ADJ_PAGE_SIZE,
            );
            await drainCollectionPages(statuses, isCancelled, signal, (page) => {
                for (const status of page) {
                    const adj = parseAdjudicationStatus(status);
                    if (adj) applyAdjudication(map, adj);
                }
            });
        } catch (err: any) {
            if (signal?.aborted || err?.name === "AbortError") return;
            console.warn(`[adjudication] status fetch failed for lane ${laneId}`, err);
        }
    }

    for (let i = 0; i < laneIds.length; i += POOL) {
        if (isCancelled() || signal?.aborted) return map;
        await Promise.all(laneIds.slice(i, i + POOL).map(drainLane));
    }

    return map;
}
