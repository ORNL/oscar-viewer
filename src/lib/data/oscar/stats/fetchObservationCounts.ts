/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import {INode} from "@/lib/data/osh/Node";
import {BUCKET_MS, MAX_PROFILE_INTERVALS} from "./alarmStatsTypes";

export interface CountInterval {
    startMs: number;
    endMs: number;
}

/**
 * Build coarse time intervals for count-based profile seeding, capped strictly
 * at `MAX_PROFILE_INTERVALS` (`<= 30`) so a single widget never floods the server
 * with hundreds of sequential `/observations/count` queries.
 *
 * Day buckets (`'1d'`) align to local midnight via `Date` arithmetic so DST
 * transitions remain single calendar days. Sub-day buckets clamp to the most
 * recent `MAX_PROFILE_INTERVALS` intervals when a wider window is passed.
 */
export function buildProfileIntervals(
    bucketMs: number,
    windowStartMs: number,
    windowEndMs: number,
): CountInterval[] {
    const out: CountInterval[] = [];
    if (windowEndMs <= windowStartMs || bucketMs <= 0) return out;

    if (bucketMs === BUCKET_MS['1d']) {
        const first = new Date(windowStartMs);
        first.setHours(0, 0, 0, 0);
        if (first.getTime() < windowStartMs) first.setDate(first.getDate() + 1);

        const lastMidnight = new Date(windowEndMs);
        lastMidnight.setHours(0, 0, 0, 0);

        const d = new Date(first);
        while (d.getTime() < lastMidnight.getTime()) {
            const next = new Date(d);
            next.setDate(next.getDate() + 1);
            out.push({startMs: d.getTime(), endMs: Math.min(next.getTime(), lastMidnight.getTime())});
            d.setDate(d.getDate() + 1);
        }

        if (out.length === 0) {
            const midnight = new Date(windowStartMs);
            midnight.setHours(0, 0, 0, 0);
            midnight.setDate(midnight.getDate() + 1);
            const splitMs = midnight.getTime();
            if (splitMs >= windowEndMs) {
                out.push({startMs: windowStartMs, endMs: windowEndMs});
            } else {
                out.push({startMs: windowStartMs, endMs: splitMs});
                out.push({startMs: splitMs, endMs: windowEndMs});
            }
        }
        return out.length > MAX_PROFILE_INTERVALS ? out.slice(-MAX_PROFILE_INTERVALS) : out;
    }

    const clampedStartMs = Math.max(
        windowStartMs,
        windowEndMs - (MAX_PROFILE_INTERVALS - 1) * bucketMs,
    );
    for (let t = Math.floor(clampedStartMs / bucketMs) * bucketMs; t < windowEndMs; t += bucketMs) {
        const startMs = Math.max(t, clampedStartMs);
        const endMs = Math.min(t + bucketMs, windowEndMs);
        if (endMs > startMs) out.push({startMs, endMs});
    }
    return out.length > MAX_PROFILE_INTERVALS ? out.slice(-MAX_PROFILE_INTERVALS) : out;
}

/**
 * Execute a single `/observations/count` request bounded by `phenomenonTime`
 * (omitting `resultTime` so sealed 30-minute Parquet generations hit PostgreSQL
 * summary counters in `ArchiveCatalog` without DuckDB scans), carrying session
 * cookies (`credentials: "include"`) and an optional `AbortSignal`.
 */
export async function fetchObservationCount(
    node: INode,
    datastreamIds: string[],
    startIso: string,
    endIso: string,
    filter?: string,
    signal?: AbortSignal,
): Promise<number> {
    const params = new URLSearchParams({
        format: "application/om+json",
        dataStream: datastreamIds.join(","),
        phenomenonTime: `${startIso}/${endIso}`,
    });
    if (filter) params.set("filter", filter);

    const response = await fetch(`${node.getConnectedSystemsEndpoint(false)}/observations/count?${params}`, {
        method: 'GET',
        credentials: 'include',
        headers: {...node.getBasicAuthHeader()},
        mode: "cors",
        signal,
    });
    if (!response.ok) throw new Error(`count query failed: HTTP ${response.status}`);

    const json = await response.json();
    if (typeof json?.count !== 'number') throw new Error('count query returned no count field');
    return json.count;
}
