/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import {AlarmStatsBucket, AlarmStatsWindow} from "@/lib/layout/PageConfigTypes";

/** One time bucket aggregated across all selected lanes. */
export interface AlarmStatsBucketRow {
    /** Bucket start, epoch ms, wall-clock aligned. */
    t: number;
    occupancies: number;
    gammaAlarms: number;
    neutronAlarms: number;
    /** `gammaAlarm || neutronAlarm` — an occupancy counts once regardless of alarm channel. */
    alarms: number;
    adjudicated: number;
    adjSecondsSum: number;
    adjSecondsCount: number;
}

/** Per-lane counts per bucket, index-aligned with `buckets`. */
export interface AlarmStatsLaneSeries {
    laneId: string;
    occupancies: number[];
    alarms: number[];
}

/** Per-lane totals across the active window. */
export interface AlarmStatsLaneRow {
    /** `laneMap` key (lane display name) — never a raw system UID. */
    laneId: string;
    occupancies: number;
    alarms: number;
    adjudicated: number;
    adjSecondsSum: number;
    adjSecondsCount: number;
}

export interface AlarmStatsTotals {
    occupancies: number;
    alarms: number;
    adjudicated: number;
    /** 0..1; null when zero occupancies occurred in the window. */
    alarmRate: number | null;
    adjudicatedRate: number | null;
    meanAdjSeconds: number | null;
}

export interface AlarmStatsSnapshot {
    /** Ascending by `t`, dense (zero-filled for observation-seeded series). */
    buckets: AlarmStatsBucketRow[];
    byLane: AlarmStatsLaneRow[];
    /** Per-lane counts per bucket for the stacked-by-lane view. */
    laneSeries: AlarmStatsLaneSeries[];
    totals: AlarmStatsTotals;
    /** Individual time-to-adjudicate samples in seconds for histogram binning. */
    adjSamplesSec: number[];
    windowStartMs: number;
    windowEndMs: number;
    bucketMs: number;
    /** True only during initial seed; background re-seeds set `refreshing`. */
    loading: boolean;
    refreshing: boolean;
    /** `OBS_CAP` was reached — only the most recent `fetchedCount` observations are represented. */
    capped: boolean;
    fetchedCount: number;
    error: string | null;
}

/**
 * Window seeding mode:
 * - `'observations'`: paginate occupancy observations (per-lane series, adjudication join, live append) bounded by `OBS_CAP`.
 * - `'counts'`: query `/observations/count` with `phenomenonTime` per coarse interval (`<= MAX_PROFILE_INTERVALS`).
 */
export type AlarmStatsSeedMode = 'observations' | 'counts';

export interface AlarmStatsResult extends AlarmStatsSnapshot {
    /** Number of lanes resolved from the active selection; 0 indicates empty selection. */
    laneCount: number;
    refresh: () => void;
}

export const WINDOW_SPAN_MS: Record<AlarmStatsWindow, number> = {
    '1h': 60 * 60 * 1000,
    '8h': 8 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
};

export const BUCKET_MS: Record<Exclude<AlarmStatsBucket, 'auto'>, number> = {
    '1m': 60 * 1000,
    '5m': 5 * 60 * 1000,
    '15m': 15 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '6h': 6 * 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000,
};

export const AUTO_BUCKET_MS: Record<AlarmStatsWindow, number> = {
    '1h': BUCKET_MS['1m'],
    '8h': BUCKET_MS['5m'],
    '24h': BUCKET_MS['15m'],
    '7d': BUCKET_MS['1h'],
    '30d': BUCKET_MS['6h'],
};

export function resolveBucketMs(window: AlarmStatsWindow, bucket: AlarmStatsBucket): number {
    if (bucket === 'auto' || !bucket) return AUTO_BUCKET_MS[window] ?? AUTO_BUCKET_MS['24h'];
    return BUCKET_MS[bucket] ?? AUTO_BUCKET_MS[window] ?? AUTO_BUCKET_MS['24h'];
}

/** Histogram bin upper edges in seconds. */
export const ADJ_DEFAULT_BINS: number[] = [30, 60, 120, 300, 600, 1800, 3600, Infinity];

/** Maximum observations pulled per seed across all selected lanes. */
export const OBS_CAP = 20_000;
/** Observations requested per datastream page. */
export const PAGE_SIZE = 1000;
/** Maximum concurrent HTTP requests per stats seed (aligned with server DuckDB concurrency cap of 2). */
export const POOL = 2;
/** Adjudication command statuses requested per page. */
export const ADJ_PAGE_SIZE = 1000;
/** Zero retention delay on unmount: timers, leases, and in-flight requests release immediately. */
export const CACHE_TTL_MS = 0;
/** Hard cap on coarse intervals issued per `time-profile` count seed. */
export const MAX_PROFILE_INTERVALS = 30;

export const EMPTY_TOTALS: AlarmStatsTotals = {
    occupancies: 0,
    alarms: 0,
    adjudicated: 0,
    alarmRate: null,
    adjudicatedRate: null,
    meanAdjSeconds: null,
};
