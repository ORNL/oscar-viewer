"use client";

/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import React, {useContext, useMemo} from "react";
import {useSelector} from "react-redux";
import MapComponent from "@/app/_components/maps/MapComponent";
import {DataSourceContext} from "@/app/contexts/DataSourceContext";
import {convertToMap} from "@/app/utils/Utils";
import {WidgetProps} from "@/app/_components/layout/WidgetTypes";
import {resolveLaneSelection} from "@/lib/data/oscar/streams/LaneStreamRegistry";
import {MapWidgetConfig} from "@/lib/layout/PageConfigTypes";
import {selectLaneMap} from "@/lib/state/OSCARLaneSlice";
import {RootState} from "@/lib/state/Store";

/** Hosts `MapComponent` with a unique Leaflet container ID and widget-scoped lane/mobile options. */
export default function MapWidget({widget}: WidgetProps) {
    const config = (widget.config ?? {}) as MapWidgetConfig;
    const {laneMapRef} = useContext(DataSourceContext);
    const laneMapRaw = useSelector((state: RootState) => selectLaneMap(state));
    const effectiveLaneMap = useMemo(() => {
        const converted = convertToMap(laneMapRaw);
        return converted.size > 0 ? converted : (laneMapRef?.current ?? new Map());
    }, [laneMapRaw, laneMapRef]);

    const selection = config.lanes ?? {mode: 'all' as const};
    const allowedLaneNames = useMemo(
        () => (selection.mode === 'all' ? undefined : resolveLaneSelection(selection, effectiveLaneMap)),
        [effectiveLaneMap, selection],
    );

    return (
        <MapComponent
            containerId={`map-widget-${widget.id}`}
            height="100%"
            allowedLaneNames={allowedLaneNames}
            showMobileUnits={config.showMobileUnits ?? true}
            showAlarmMarkers={config.showAlarmMarkers ?? true}
            alarmTimeWindow={config.alarmTimeWindow ?? 'today'}
        />
    );
}
