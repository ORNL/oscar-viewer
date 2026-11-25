/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import ObservationFilter from "osh-js/source/core/consysapi/observation/ObservationFilter";
import {fetchCollectionDataWithSignal} from "@/lib/data/oscar/EventTableRequests";
import {LaneMapEntry} from "@/lib/data/oscar/LaneCollection";
import {isOccupancyDataStream} from "@/lib/data/oscar/Utilities";
import {AlarmStatsBucket, AlarmStatsWindow, MIN_STATS_REFRESH_SEC} from "@/lib/layout/PageConfigTypes";
import {LaneStreamName, LaneStreamRegistry} from "@/lib/data/oscar/streams/LaneStreamRegistry";
import {fetchAdjudicationWindow} from "./fetchAdjudicationWindow";
import {buildProfileIntervals, fetchObservationCount} from "./fetchObservationCounts";
import {
    AlarmStatsBucketRow,
    AlarmStatsLaneRow,
    AlarmStatsLaneSeries,
    AlarmStatsSeedMode,
    AlarmStatsSnapshot,
    AlarmStatsTotals,
    EMPTY_TOTALS,
    OBS_CAP,
    PAGE_SIZE,
    POOL,
    resolveBucketMs,
    WINDOW_SPAN_MS,
} from "./alarmStatsTypes";

export interface AlarmStatsParams {
    lanes: string[];
    window: AlarmStatsWindow;
    bucket: AlarmStatsBucket;
    needAdjudication: boolean;
    liveAppend: boolean;
    refreshSec: number;
    /**
     * `'observations'` paginates occupancy rows (`OBS_CAP` bound).
     * `'counts'` queries `/observations/count` with `phenomenonTime` over `<= 30` coarse intervals.
     */
    seedMode: AlarmStatsSeedMode;
}

export type AlarmStatsListener = (snapshot: AlarmStatsSnapshot) => void;

const OCC_STREAM: LaneStreamName[] = ['occRT'];
/** Batch live stream publications on a 5s cadence rather than per MQTT message. */
const PUBLISH_TICK_MS = 5_000;

interface LaneCounts {
    occupancies: number;
    alarms: number;
    adjudicated: number;
    adjSecondsSum: number;
    adjSecondsCount: number;
}

interface BucketAcc extends AlarmStatsBucketRow {
    perLane: Map<string, LaneCounts>;
    adjSamples: number[];
}

interface Accumulator {
    buckets: Map<number, BucketAcc>;
    occIndex: Map<string, { tMs: number; laneId: string; bucketKey: number }>;
    seen: Set<string>;
    fetchedCount: number;
    capped: boolean;
}

interface Entry {
    key: string;
    params: AlarmStatsParams;
    refs: Set<string>;
    listeners: Map<string, AlarmStatsListener>;
    acc: Accumulator;
    snapshot: AlarmStatsSnapshot;
    runId: number;
    abortController: AbortController | null;
    windowStartMs: number;
    windowEndMs: number;
    dataFloorMs: number | null;
    bucketMs: number;
    tickTimer: ReturnType<typeof setInterval> | null;
    refreshTimer: ReturnType<typeof setInterval> | null;
    liveBound: boolean;
    seeding: boolean;
}

interface ObservationCursor {
    laneId: string;
    collection: any;
    nextOffset: number;
    done: boolean;
    oldestMs: number | null;
    truncated: boolean;
}

function emptyAcc(): Accumulator {
    return {
        buckets: new Map(),
        occIndex: new Map(),
        seen: new Set(),
        fetchedCount: 0,
        capped: false,
    };
}

function blankBucket(t: number): BucketAcc {
    return {
        t,
        occupancies: 0,
        gammaAlarms: 0,
        neutronAlarms: 0,
        alarms: 0,
        adjudicated: 0,
        adjSecondsSum: 0,
        adjSecondsCount: 0,
        perLane: new Map(),
        adjSamples: [],
    };
}

function laneCounts(bucket: BucketAcc, laneId: string): LaneCounts {
    let c = bucket.perLane.get(laneId);
    if (!c) {
        c = {occupancies: 0, alarms: 0, adjudicated: 0, adjSecondsSum: 0, adjSecondsCount: 0};
        bucket.perLane.set(laneId, c);
    }
    return c;
}

function normalizeRefreshSec(raw: number | undefined): number {
    if (typeof raw !== 'number' || !Number.isFinite(raw) || raw <= 0) return 0;
    return Math.max(MIN_STATS_REFRESH_SEC, Math.round(raw));
}

async function readNextObservationPage(cursor: ObservationCursor, signal: AbortSignal): Promise<any[]> {
    if (cursor.done || signal.aborted) return [];
    const col = cursor.collection;
    if (typeof col?.url === "string" && typeof col?.filter?.toQueryString === "function") {
        const pageSize = typeof col.pageSize === "number" && col.pageSize > 0 ? col.pageSize : PAGE_SIZE;
        col.pageOffset = cursor.nextOffset;
        const page = await fetchCollectionDataWithSignal(col, signal);
        const items = Array.isArray(page) ? page : [];
        cursor.nextOffset += pageSize;
        if (items.length < pageSize) {
            cursor.done = true;
        }
        return items;
    }
    if (!col?.hasNext?.()) {
        cursor.done = true;
        return [];
    }
    const items = (await col.nextPage()) ?? [];
    if (!col.hasNext()) {
        cursor.done = true;
    }
    return items;
}

export function alarmStatsKey(p: AlarmStatsParams, viewKey = '__all__'): string {
    return [
        viewKey,
        [...p.lanes].sort().join(','),
        p.window,
        p.bucket,
        p.needAdjudication ? 'adj' : 'noadj',
        p.liveAppend ? 'live' : 'static',
        p.seedMode,
    ].join('|');
}

class AlarmStatsRegistryImpl {
    private entries = new Map<string, Entry>();
    private laneMap: Map<string, LaneMapEntry> = new Map();
    private activeViewKey = '__all__';

    /** Number of live registry entries (exposed for deterministic teardown verification). */
    activeEntryCount(): number {
        return this.entries.size;
    }

    /**
     * Synchronize the registry's lane map and active scoped view key.
     * Always replaces `this.laneMap` (including when empty) and tears down or
     * re-seeds entries on scope changes so stale view data never leaks.
     */
    setLaneMap(laneMap: Map<string, LaneMapEntry> | null | undefined, viewKey = '__all__') {
        const nextMap = laneMap ?? new Map<string, LaneMapEntry>();
        const normalizedView = viewKey || '__all__';
        const viewChanged = normalizedView !== this.activeViewKey;
        const emptied = this.laneMap.size > 0 && nextMap.size === 0;

        this.laneMap = nextMap;
        this.activeViewKey = normalizedView;

        if (viewChanged || emptied) {
            for (const entry of [...this.entries.values()]) {
                this.abortEntrySeed(entry);
                this.releaseLive(entry);
                entry.acc = emptyAcc();
                if (entry.refs.size === 0) {
                    this.evict(entry);
                } else if (nextMap.size === 0) {
                    entry.snapshot = this.buildSnapshot(entry);
                    this.publish(entry);
                } else {
                    this.startSeed(entry);
                }
            }
        }
    }

    /**
     * Subscribe a widget instance to the shared series for `params`.
     * Multiple widgets sharing identical parameters share a single seed and stream lease.
     */
    acquire(subscriberId: string, rawParams: AlarmStatsParams, listener: AlarmStatsListener): AlarmStatsSnapshot {
        const params: AlarmStatsParams = {
            ...rawParams,
            refreshSec: normalizeRefreshSec(rawParams.refreshSec),
        };
        const key = alarmStatsKey(params, this.activeViewKey);

        for (const [k, entry] of [...this.entries.entries()]) {
            if (k !== key) this.detach(entry, subscriberId);
        }

        const existing = this.entries.get(key);
        if (existing) {
            existing.refs.add(subscriberId);
            existing.listeners.set(subscriberId, listener);
            if (existing.params.refreshSec !== params.refreshSec) {
                existing.params = params;
                this.restartRefreshTimer(existing);
            }
            return existing.snapshot;
        }

        const entry = this.createEntry(key, params);
        entry.refs.add(subscriberId);
        entry.listeners.set(subscriberId, listener);
        this.entries.set(key, entry);
        this.startSeed(entry);
        this.startTimers(entry);
        return entry.snapshot;
    }

    release(subscriberId: string) {
        for (const entry of [...this.entries.values()]) {
            this.detach(entry, subscriberId);
        }
    }

    /** Immediately evict all entries, aborting in-flight seeds and releasing stream leases. */
    evictAll() {
        for (const entry of [...this.entries.values()]) {
            entry.refs.clear();
            entry.listeners.clear();
            this.evict(entry);
        }
    }

    /** Force a fresh seed for the entry bound to `subscriberId`. */
    refresh(subscriberId: string) {
        for (const entry of this.entries.values()) {
            if (entry.refs.has(subscriberId)) this.startSeed(entry, true);
        }
    }

    private detach(entry: Entry, subscriberId: string) {
        if (!entry.refs.has(subscriberId)) return;
        entry.refs.delete(subscriberId);
        entry.listeners.delete(subscriberId);
        if (entry.refs.size === 0) {
            this.evict(entry);
        }
    }

    private abortEntrySeed(entry: Entry) {
        if (entry.abortController) {
            entry.abortController.abort();
            entry.abortController = null;
        }
        entry.seeding = false;
        entry.runId++;
    }

    private releaseLive(entry: Entry) {
        if (entry.liveBound) {
            LaneStreamRegistry.release(`alarm-stats-${entry.key}`);
            entry.liveBound = false;
        }
    }

    private evict(entry: Entry) {
        if (entry.refs.size > 0) return;
        if (entry.tickTimer !== null) {
            clearInterval(entry.tickTimer);
            entry.tickTimer = null;
        }
        if (entry.refreshTimer !== null) {
            clearInterval(entry.refreshTimer);
            entry.refreshTimer = null;
        }
        this.abortEntrySeed(entry);
        this.releaseLive(entry);
        entry.acc = emptyAcc();
        this.entries.delete(entry.key);
    }

    private createEntry(key: string, params: AlarmStatsParams): Entry {
        const bucketMs = resolveBucketMs(params.window, params.bucket);
        const windowEndMs = Date.now();
        const windowStartMs = windowEndMs - (WINDOW_SPAN_MS[params.window] ?? WINDOW_SPAN_MS['24h']);
        const entry: Entry = {
            key,
            params,
            refs: new Set(),
            listeners: new Map(),
            acc: emptyAcc(),
            snapshot: {
                buckets: [],
                byLane: [],
                laneSeries: [],
                totals: {...EMPTY_TOTALS},
                adjSamplesSec: [],
                windowStartMs,
                windowEndMs,
                bucketMs,
                loading: true,
                refreshing: false,
                capped: false,
                fetchedCount: 0,
                error: null,
            },
            runId: 0,
            abortController: null,
            windowStartMs,
            windowEndMs,
            dataFloorMs: null,
            bucketMs,
            tickTimer: null,
            refreshTimer: null,
            liveBound: false,
            seeding: false,
        };
        if (params.seedMode !== 'counts') this.seedBucketRange(entry);
        return entry;
    }

    private seedBucketRange(entry: Entry) {
        const first = Math.floor(entry.windowStartMs / entry.bucketMs) * entry.bucketMs;
        const last = Math.floor(entry.windowEndMs / entry.bucketMs) * entry.bucketMs;
        for (let t = first; t <= last; t += entry.bucketMs) {
            if (!entry.acc.buckets.has(t)) entry.acc.buckets.set(t, blankBucket(t));
        }
    }

    private restartRefreshTimer(entry: Entry) {
        if (entry.refreshTimer !== null) {
            clearInterval(entry.refreshTimer);
            entry.refreshTimer = null;
        }
        const refreshSec = normalizeRefreshSec(entry.params.refreshSec);
        if (refreshSec >= MIN_STATS_REFRESH_SEC) {
            entry.refreshTimer = setInterval(() => this.startSeed(entry), refreshSec * 1000);
        }
    }

    private startTimers(entry: Entry) {
        if (entry.params.seedMode !== 'counts') {
            entry.tickTimer = setInterval(() => this.advanceWindow(entry), PUBLISH_TICK_MS);
        }
        this.restartRefreshTimer(entry);
    }

    // ---------------------------------------------------------------- seeding

    private startSeed(entry: Entry, supersedeInFlight = false) {
        if (entry.seeding && !supersedeInFlight) return;
        if (entry.abortController) {
            entry.abortController.abort();
            entry.abortController = null;
        }
        const controller = new AbortController();
        entry.abortController = controller;
        const runId = ++entry.runId;
        entry.seeding = true;

        const isFirst = entry.snapshot.loading;
        entry.snapshot = {...entry.snapshot, loading: isFirst, refreshing: !isFirst, error: null};
        this.publish(entry);

        this.runSeed(entry, runId, controller.signal)
            .catch((err: any) => {
                if (controller.signal.aborted || err?.name === 'AbortError' || entry.runId !== runId) {
                    return;
                }
                console.error('[alarm-stats] seed failed', err);
                entry.snapshot = {
                    ...entry.snapshot,
                    loading: false,
                    refreshing: false,
                    error: String(err?.message ?? err),
                };
                this.publish(entry);
            })
            .finally(() => {
                if (entry.runId === runId) {
                    entry.seeding = false;
                    if (entry.abortController === controller) {
                        entry.abortController = null;
                    }
                }
            });
    }

    private async runSeed(entry: Entry, runId: number, signal: AbortSignal) {
        if (entry.params.seedMode === 'counts') return this.runCountSeed(entry, runId, signal);
        const cancelled = () => entry.runId !== runId || signal.aborted;
        const laneMap = this.laneMap;

        const windowEndMs = Date.now();
        const windowStartMs = windowEndMs - (WINDOW_SPAN_MS[entry.params.window] ?? WINDOW_SPAN_MS['24h']);
        const startIso = new Date(windowStartMs).toISOString();
        const endIso = new Date(windowEndMs).toISOString();

        const acc = emptyAcc();

        const targets: { laneId: string; ds: any }[] = [];
        for (const laneId of entry.params.lanes) {
            const laneEntry = laneMap.get(laneId);
            if (!laneEntry) continue;
            for (const ds of laneEntry.datastreams ?? []) {
                if (isOccupancyDataStream(ds)) targets.push({laneId, ds});
            }
        }

        if (targets.length === 0) {
            if (cancelled()) return;
            this.commit(entry, acc, windowStartMs, windowEndMs);
            return;
        }

        const cursors: ObservationCursor[] = [];
        for (let i = 0; i < targets.length; i += POOL) {
            if (cancelled()) return;
            const opened = await Promise.all(targets.slice(i, i + POOL).map(async ({laneId, ds}) => {
                try {
                    const collection = await ds.searchObservations(
                        new ObservationFilter({phenomenonTime: `${startIso}/${endIso}`, order: 'desc'}),
                        PAGE_SIZE,
                    );
                    const cursor: ObservationCursor = {
                        laneId,
                        collection,
                        nextOffset: 0,
                        done: false,
                        oldestMs: null as number | null,
                        truncated: false,
                    };
                    return cursor;
                } catch (err: any) {
                    if (signal.aborted || err?.name === 'AbortError') return null;
                    console.warn(`[alarm-stats] failed to open observations for lane ${laneId}`, err);
                    return null;
                }
            }));
            for (const c of opened) if (c) cursors.push(c);
        }

        let active = cursors.filter((c) => !c.done);
        while (active.length > 0 && acc.fetchedCount < OBS_CAP) {
            if (cancelled()) return;
            const round = active.slice();
            for (let i = 0; i < round.length && acc.fetchedCount < OBS_CAP; i += POOL) {
                if (cancelled()) return;
                const pages = await Promise.all(round.slice(i, i + POOL).map(async (c) => {
                    try {
                        const items = await readNextObservationPage(c, signal);
                        return {cursor: c, items};
                    } catch (err: any) {
                        if (signal.aborted || err?.name === 'AbortError') {
                            return {cursor: c, items: []};
                        }
                        console.warn(`[alarm-stats] page fetch failed for lane ${c.laneId}`, err);
                        c.done = true;
                        return {cursor: c, items: []};
                    }
                }));
                for (const {cursor, items} of pages) {
                    for (const obs of items ?? []) {
                        if (acc.fetchedCount >= OBS_CAP) {
                            acc.capped = true;
                            break;
                        }
                        const tMs = this.foldObservation(entry, acc, cursor.laneId, obs);
                        if (tMs != null && (cursor.oldestMs == null || tMs < cursor.oldestMs)) {
                            cursor.oldestMs = tMs;
                        }
                    }
                }
            }
            active = active.filter((c) => !c.done);
        }
        for (const c of cursors) c.truncated = !c.done;
        if (acc.fetchedCount >= OBS_CAP && active.length > 0) acc.capped = true;

        const truncatedFloors = cursors
            .filter((c) => c.truncated && c.oldestMs != null)
            .map((c) => c.oldestMs as number);
        const effectiveStartMs = truncatedFloors.length > 0
            ? Math.max(windowStartMs, ...truncatedFloors)
            : windowStartMs;
        acc.capped = acc.capped && effectiveStartMs > windowStartMs;

        if (entry.params.needAdjudication && acc.occIndex.size > 0) {
            if (cancelled()) return;
            const adjMap = await fetchAdjudicationWindow(
                laneMap,
                entry.params.lanes,
                startIso,
                new Date().toISOString(),
                cancelled,
                signal,
            );
            if (cancelled()) return;
            this.foldAdjudications(acc, adjMap);
        }

        if (cancelled()) return;
        this.commit(entry, acc, effectiveStartMs, windowEndMs);
    }

    /**
     * Count-based profile seed: queries `/observations/count` with `phenomenonTime`
     * over `<= 30` coarse intervals at `POOL = 2` without issuing per-lane
     * `searchObservations` retention probes.
     */
    private async runCountSeed(entry: Entry, runId: number, signal: AbortSignal) {
        const cancelled = () => entry.runId !== runId || signal.aborted;
        const laneMap = this.laneMap;

        const windowEndMs = Date.now();
        const windowStartMs = windowEndMs - (WINDOW_SPAN_MS[entry.params.window] ?? WINDOW_SPAN_MS['24h']);

        const acc = emptyAcc();

        const byNode = new Map<string, { node: any; dsIds: string[] }>();
        for (const laneId of entry.params.lanes) {
            const laneEntry = laneMap.get(laneId);
            if (!laneEntry?.parentNode) continue;
            const occDs = (laneEntry.datastreams ?? []).filter((ds: any) => isOccupancyDataStream(ds));
            if (occDs.length === 0) continue;
            const group = byNode.get(laneEntry.parentNode.id) ?? {node: laneEntry.parentNode, dsIds: []};
            group.dsIds.push(...occDs.map((ds: any) => ds.properties.id));
            byNode.set(laneEntry.parentNode.id, group);
        }

        if (byNode.size === 0) {
            if (cancelled()) return;
            this.commit(entry, acc, windowStartMs, windowEndMs);
            return;
        }

        const intervals = buildProfileIntervals(entry.bucketMs, windowStartMs, windowEndMs);
        const effectiveStartMs = intervals.length > 0 ? intervals[0].startMs : windowStartMs;
        let ok = 0;

        for (let i = 0; i < intervals.length; i += POOL) {
            if (cancelled()) return;
            await Promise.all(intervals.slice(i, i + POOL).map(async (iv) => {
                if (cancelled()) return;
                const startIso = new Date(iv.startMs).toISOString();
                const endIso = new Date(iv.endMs).toISOString();
                try {
                    let occupancies = 0;
                    let alarms = 0;
                    for (const {node, dsIds} of byNode.values()) {
                        occupancies += await fetchObservationCount(node, dsIds, startIso, endIso, undefined, signal);
                        alarms += await fetchObservationCount(
                            node,
                            dsIds,
                            startIso,
                            endIso,
                            'gammaAlarm=true OR neutronAlarm=true',
                            signal,
                        );
                    }
                    const bucket = blankBucket(iv.startMs);
                    bucket.occupancies = occupancies;
                    bucket.alarms = alarms;
                    acc.buckets.set(iv.startMs, bucket);
                    acc.fetchedCount += occupancies;
                    ok++;
                } catch (err: any) {
                    if (signal.aborted || err?.name === 'AbortError') return;
                    console.warn(`[alarm-stats] count seed failed for ${startIso}/${endIso}`, err);
                }
            }));
        }

        if (cancelled()) return;
        if (ok === 0 && intervals.length > 0) {
            throw new Error('all observation count queries failed');
        }
        this.commit(entry, acc, effectiveStartMs, windowEndMs);
    }

    private foldObservation(entry: Entry, acc: Accumulator, laneId: string, obs: any): number | null {
        const p = obs?.properties ?? obs;
        const r = p?.result;
        if (!r) return null;

        const tMs = Date.parse(p.phenomenonTime ?? r.endTime ?? r.startTime);
        if (!Number.isFinite(tMs)) return null;

        const dedupeKey = `${laneId}|${r.occupancyCount}|${r.startTime}|${r.endTime}`;
        if (acc.seen.has(dedupeKey)) return tMs;
        acc.seen.add(dedupeKey);

        acc.fetchedCount++;

        const bucketKey = Math.floor(tMs / entry.bucketMs) * entry.bucketMs;
        let bucket = acc.buckets.get(bucketKey);
        if (!bucket) {
            bucket = blankBucket(bucketKey);
            acc.buckets.set(bucketKey, bucket);
        }
        const lane = laneCounts(bucket, laneId);

        const gamma = !!r.gammaAlarm;
        const neutron = !!r.neutronAlarm;

        bucket.occupancies++;
        lane.occupancies++;
        if (gamma) bucket.gammaAlarms++;
        if (neutron) bucket.neutronAlarms++;
        if (gamma || neutron) {
            bucket.alarms++;
            lane.alarms++;
        }

        if (entry.params.needAdjudication) {
            const obsId = obs?.id ?? p?.id;
            if (obsId) acc.occIndex.set(String(obsId), {tMs, laneId, bucketKey});
        }
        return tMs;
    }

    private foldAdjudications(acc: Accumulator, adjMap: Map<string, any>) {
        for (const [obsId, adj] of adjMap) {
            const occ = acc.occIndex.get(obsId);
            if (!occ) continue;
            const bucket = acc.buckets.get(occ.bucketKey);
            if (!bucket) continue;
            const lane = laneCounts(bucket, occ.laneId);

            bucket.adjudicated++;
            lane.adjudicated++;

            const seconds = (Date.parse(adj.time) - occ.tMs) / 1000;
            if (!Number.isFinite(seconds) || seconds < 0) continue;

            bucket.adjSamples.push(seconds);
            bucket.adjSecondsSum += seconds;
            bucket.adjSecondsCount++;
            lane.adjSecondsSum += seconds;
            lane.adjSecondsCount++;
        }
    }

    private commit(entry: Entry, acc: Accumulator, windowStartMs: number, windowEndMs: number) {
        entry.acc = acc;
        entry.windowStartMs = windowStartMs;
        entry.windowEndMs = windowEndMs;
        entry.dataFloorMs = acc.capped ? windowStartMs : null;
        if (entry.params.seedMode !== 'counts') {
            this.seedBucketRange(entry);
            this.pruneBuckets(entry);
            this.bindLive(entry);
        }
        entry.snapshot = this.buildSnapshot(entry);
        this.publish(entry);
    }

    // ------------------------------------------------------------ live append

    private bindLive(entry: Entry) {
        if (entry.params.seedMode === 'counts') return;
        if (!entry.params.liveAppend || entry.liveBound) return;
        const laneMap = this.laneMap;
        if (!laneMap || laneMap.size === 0) return;

        LaneStreamRegistry.acquire(
            `alarm-stats-${entry.key}`,
            laneMap,
            entry.params.lanes,
            OCC_STREAM,
            (laneId, _stream, message) => this.onLive(entry, laneId, message),
        );
        entry.liveBound = true;
    }

    private onLive(entry: Entry, laneId: string, message: any) {
        const floor = Math.floor(entry.windowStartMs / entry.bucketMs) * entry.bucketMs;

        for (const v of message?.values ?? []) {
            const d = v?.data;
            if (!d) continue;

            const tMs = Date.parse(d.endTime ?? d.startTime) || v.timestamp || d.timestamp || Date.now();
            if (!Number.isFinite(tMs)) continue;

            const dedupeKey = `${laneId}|${d.occupancyCount}|${d.startTime}|${d.endTime}`;
            if (entry.acc.seen.has(dedupeKey)) continue;
            entry.acc.seen.add(dedupeKey);

            const bucketKey = Math.floor(tMs / entry.bucketMs) * entry.bucketMs;
            if (bucketKey < floor) continue;

            let bucket = entry.acc.buckets.get(bucketKey);
            if (!bucket) {
                bucket = blankBucket(bucketKey);
                entry.acc.buckets.set(bucketKey, bucket);
            }
            const lane = laneCounts(bucket, laneId);

            entry.acc.fetchedCount++;
            bucket.occupancies++;
            lane.occupancies++;
            if (d.gammaAlarm) bucket.gammaAlarms++;
            if (d.neutronAlarm) bucket.neutronAlarms++;
            if (d.gammaAlarm || d.neutronAlarm) {
                bucket.alarms++;
                lane.alarms++;
            }
        }
    }

    // --------------------------------------------------------- window sliding

    private advanceWindow(entry: Entry) {
        entry.windowEndMs = Date.now();
        const span = WINDOW_SPAN_MS[entry.params.window] ?? WINDOW_SPAN_MS['24h'];
        const rawStart = entry.windowEndMs - span;
        entry.windowStartMs = entry.dataFloorMs != null
            ? Math.max(rawStart, entry.dataFloorMs)
            : rawStart;
        this.seedBucketRange(entry);
        this.pruneBuckets(entry);
        const next = this.buildSnapshot(entry);
        entry.snapshot = {
            ...next,
            loading: entry.snapshot.loading,
            refreshing: entry.snapshot.refreshing,
            error: entry.snapshot.error,
        };
        this.publish(entry);
    }

    private pruneBuckets(entry: Entry) {
        const floor = Math.floor(entry.windowStartMs / entry.bucketMs) * entry.bucketMs;
        for (const [t, bucket] of entry.acc.buckets) {
            if (t >= floor) continue;
            entry.acc.buckets.delete(t);
            entry.acc.fetchedCount = Math.max(0, entry.acc.fetchedCount - bucket.occupancies);
        }
        if (entry.acc.seen.size > OBS_CAP * 2) entry.acc.seen.clear();
    }

    // ------------------------------------------------------------- publishing

    private buildSnapshot(entry: Entry): AlarmStatsSnapshot {
        const buckets = [...entry.acc.buckets.values()].sort((a, b) => a.t - b.t);

        const laneAgg = new Map<string, AlarmStatsLaneRow>();
        const adjSamples: number[] = [];
        let occupancies = 0;
        let alarms = 0;
        let adjudicated = 0;
        let adjSum = 0;
        let adjCount = 0;

        const seriesAgg = new Map<string, AlarmStatsLaneSeries>();
        const laneSeriesFor = (laneId: string): AlarmStatsLaneSeries => {
            let s = seriesAgg.get(laneId);
            if (!s) {
                s = {
                    laneId,
                    occupancies: new Array(buckets.length).fill(0),
                    alarms: new Array(buckets.length).fill(0),
                };
                seriesAgg.set(laneId, s);
            }
            return s;
        };

        for (let i = 0; i < buckets.length; i++) {
            const b = buckets[i];
            occupancies += b.occupancies;
            alarms += b.alarms;
            adjudicated += b.adjudicated;
            adjSum += b.adjSecondsSum;
            adjCount += b.adjSecondsCount;
            if (b.adjSamples.length) adjSamples.push(...b.adjSamples);

            for (const [laneId, c] of b.perLane) {
                let row = laneAgg.get(laneId);
                if (!row) {
                    row = {laneId, occupancies: 0, alarms: 0, adjudicated: 0, adjSecondsSum: 0, adjSecondsCount: 0};
                    laneAgg.set(laneId, row);
                }
                row.occupancies += c.occupancies;
                row.alarms += c.alarms;
                row.adjudicated += c.adjudicated;
                row.adjSecondsSum += c.adjSecondsSum;
                row.adjSecondsCount += c.adjSecondsCount;

                const s = laneSeriesFor(laneId);
                s.occupancies[i] = c.occupancies;
                s.alarms[i] = c.alarms;
            }
        }

        const totals: AlarmStatsTotals = {
            occupancies,
            alarms,
            adjudicated,
            alarmRate: occupancies > 0 ? alarms / occupancies : null,
            adjudicatedRate: occupancies > 0 ? adjudicated / occupancies : null,
            meanAdjSeconds: adjCount > 0 ? adjSum / adjCount : null,
        };

        return {
            buckets: buckets.map(({perLane: _pl, adjSamples: _s, ...row}) => row),
            byLane: [...laneAgg.values()],
            laneSeries: [...seriesAgg.values()],
            totals,
            adjSamplesSec: adjSamples,
            windowStartMs: entry.windowStartMs,
            windowEndMs: entry.windowEndMs,
            bucketMs: entry.bucketMs,
            loading: false,
            refreshing: false,
            capped: entry.acc.capped,
            fetchedCount: entry.acc.fetchedCount,
            error: null,
        };
    }

    private publish(entry: Entry) {
        for (const listener of entry.listeners.values()) {
            try {
                listener(entry.snapshot);
            } catch (e) {
                console.error('[alarm-stats] listener error', e);
            }
        }
    }
}

export const AlarmStatsRegistry = new AlarmStatsRegistryImpl();
