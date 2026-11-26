"use client";

/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import React, {useContext, useMemo} from "react";
import {useSelector} from "react-redux";
import LaneStatus from "@/app/_components/dashboard/LaneStatus";
import {DataSourceContext} from "@/app/contexts/DataSourceContext";
import {convertToMap} from "@/app/utils/Utils";
import {SystemStatusWidgetConfig} from "@/lib/layout/PageConfigTypes";
import {WidgetProps} from "@/app/_components/layout/WidgetTypes";
import {RootState} from "@/lib/state/Store";
import {selectLaneMap} from "@/lib/state/OSCARLaneSlice";
import {resolveLaneSelection} from "@/lib/data/oscar/streams/LaneStreamRegistry";

/** Hosts `LaneStatus` inside a custom dashboard tile without duplicate alarm stream subscriptions. */
export default function SystemStatusWidget({widget}: WidgetProps) {
    const config = widget.config as SystemStatusWidgetConfig;
    const {laneMapRef} = useContext(DataSourceContext);
    const laneMapRaw = useSelector((state: RootState) => selectLaneMap(state));
    const effectiveLaneMap = useMemo(() => {
        const converted = convertToMap(laneMapRaw);
        return converted.size > 0 ? converted : (laneMapRef?.current ?? new Map());
    }, [laneMapRaw, laneMapRef]);

    const selection = config.lanes ?? {mode: 'all' as const};
    const laneNames = useMemo(
        () => (selection.mode === 'all' ? undefined : resolveLaneSelection(selection, effectiveLaneMap)),
        [effectiveLaneMap, selection],
    );
    return <LaneStatus laneNames={laneNames} hideTitle subscribeAlarmStream={false}/>;
}
