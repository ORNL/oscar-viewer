/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import {useContext, useMemo} from "react";
import {useSelector} from "react-redux";
import {DataSourceContext} from "@/app/contexts/DataSourceContext";
import {convertToMap} from "@/app/utils/Utils";
import {selectCurrentLane} from "@/lib/state/LaneViewSlice";
import {selectLaneMap} from "@/lib/state/OSCARLaneSlice";
import {RootState} from "@/lib/state/Store";
import {LaneSource, PageConfig} from "@/lib/layout/PageConfigTypes";

/**
 * Resolve the lane bound to a single-lane widget within the active scoped view:
 * explicit widget lane > page fixed lane > global `currentLane` > first in-scope lane.
 * Any lane outside the active scoped `laneMap` is filtered out so view switches
 * never retain out-of-scope lanes.
 */
export function useResolvedLane(page: PageConfig | undefined, laneSource: LaneSource | undefined): string | null {
    const globalCurrentLane = useSelector(selectCurrentLane);
    const {laneMapRef} = useContext(DataSourceContext);
    const laneMapRaw = useSelector((state: RootState) => selectLaneMap(state));
    const reduxLaneMap = useMemo(() => convertToMap(laneMapRaw), [laneMapRaw]);
    const activeLaneMap = reduxLaneMap.size > 0 ? reduxLaneMap : laneMapRef?.current;

    const filterInScope = (candidate: string | null | undefined, allowFirstFallback: boolean): string | null => {
        if (!activeLaneMap || activeLaneMap.size === 0) {
            return candidate || null;
        }
        if (candidate && activeLaneMap.has(candidate)) {
            return candidate;
        }
        if (allowFirstFallback) {
            const sorted = [...activeLaneMap.keys()].sort((a, b) =>
                a.localeCompare(b, undefined, {numeric: true})
            );
            return sorted[0] ?? null;
        }
        return null;
    };

    if (laneSource?.source === 'explicit') {
        if (!laneSource.lane) return null;
        return filterInScope(laneSource.lane, false);
    }

    const ctx = page?.laneContext;
    if (ctx?.mode === 'fixed' && ctx.lane) {
        return filterInScope(ctx.lane, true);
    }

    return filterInScope(globalCurrentLane, Boolean(globalCurrentLane));
}
