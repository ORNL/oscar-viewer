"use client";

/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import {useCallback, useContext, useEffect, useMemo, useRef, useState} from "react";
import {useSelector} from "react-redux";
import {randomUUID} from "osh-js/source/core/utils/Utils";
import {DataSourceContext} from "@/app/contexts/DataSourceContext";
import {selectLaneMap} from "@/lib/state/OSCARLaneSlice";
import {RootState} from "@/lib/state/Store";
import {convertToMap} from "@/app/utils/Utils";
import {AlarmStatsBucket, AlarmStatsWindow, LaneSelection} from "@/lib/layout/PageConfigTypes";
import {resolveLaneSelection} from "@/lib/data/oscar/streams/LaneStreamRegistry";
import {AlarmStatsRegistry} from "./AlarmStatsRegistry";
import {
    AlarmStatsResult,
    AlarmStatsSeedMode,
    AlarmStatsSnapshot,
    EMPTY_TOTALS,
    resolveBucketMs,
    WINDOW_SPAN_MS,
} from "./alarmStatsTypes";

export interface UseAlarmStatsOptions {
    lanes: LaneSelection;
    window: AlarmStatsWindow;
    bucket: AlarmStatsBucket;
    /** Whether time-to-adjudicate command-status fetching is needed. */
    needAdjudication: boolean;
    liveAppend: boolean;
    refreshSec: number;
    /** `'counts'` queries `/observations/count` over coarse buckets; default `'observations'`. */
    seedMode?: AlarmStatsSeedMode;
    enabled?: boolean;
}

function idleSnapshot(window: AlarmStatsWindow, bucket: AlarmStatsBucket): AlarmStatsSnapshot {
    const end = Date.now();
    return {
        buckets: [],
        byLane: [],
        laneSeries: [],
        totals: {...EMPTY_TOTALS},
        adjSamplesSec: [],
        windowStartMs: end - (WINDOW_SPAN_MS[window] ?? WINDOW_SPAN_MS['24h']),
        windowEndMs: end,
        bucketMs: resolveBucketMs(window, bucket),
        loading: false,
        refreshing: false,
        capped: false,
        fetchedCount: 0,
        error: null,
    };
}

/**
 * Bind a widget instance to the shared `AlarmStatsRegistry` series for the
 * active scoped view and lane selection.
 */
export function useAlarmStats(opts: UseAlarmStatsOptions): AlarmStatsResult {
    const {
        lanes,
        window,
        bucket,
        needAdjudication,
        liveAppend,
        refreshSec,
        seedMode = 'observations',
        enabled = true,
    } = opts;

    const {laneMapRef, activeViewKey} = useContext(DataSourceContext);
    const laneMapRaw = useSelector((state: RootState) => selectLaneMap(state));
    const laneMap = useMemo(() => convertToMap(laneMapRaw), [laneMapRaw]);
    const effectiveLaneMap = laneMap.size > 0 ? laneMap : laneMapRef.current;

    const subscriberIdRef = useRef<string>(`alarm-stats-${randomUUID()}`);
    const [snapshot, setSnapshot] = useState<AlarmStatsSnapshot>(() => idleSnapshot(window, bucket));

    const laneIds = useMemo(
        () => resolveLaneSelection(lanes ?? {mode: 'all'}, effectiveLaneMap),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [JSON.stringify(lanes), effectiveLaneMap],
    );
    const laneKey = laneIds.join(',');

    useEffect(() => {
        const subscriberId = subscriberIdRef.current;
        const scopeKey = activeViewKey || '__all__';
        AlarmStatsRegistry.setLaneMap(effectiveLaneMap, scopeKey);

        if (!enabled || laneIds.length === 0) {
            AlarmStatsRegistry.release(subscriberId);
            setSnapshot(idleSnapshot(window, bucket));
            return;
        }

        const initial = AlarmStatsRegistry.acquire(
            subscriberId,
            {lanes: laneIds, window, bucket, needAdjudication, liveAppend, refreshSec, seedMode},
            setSnapshot,
        );
        setSnapshot(initial);

        return () => {
            AlarmStatsRegistry.release(subscriberId);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled, laneKey, window, bucket, needAdjudication, liveAppend, refreshSec, seedMode, effectiveLaneMap, activeViewKey]);

    const refresh = useCallback(() => {
        AlarmStatsRegistry.refresh(subscriberIdRef.current);
    }, []);

    return {...snapshot, laneCount: laneIds.length, refresh};
}
