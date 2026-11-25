"use client";

/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import React, {useContext, useMemo} from "react";
import {useSelector} from "react-redux";
import {Box} from "@mui/material";
import EventTable from "@/app/_components/event-table/EventTable";
import {DataSourceContext} from "@/app/contexts/DataSourceContext";
import {convertToMap} from "@/app/utils/Utils";
import {RootState} from "@/lib/state/Store";
import {selectLaneMap} from "@/lib/state/OSCARLaneSlice";
import {EventTableColumnSetting, EventTableWidgetConfig} from "@/lib/layout/PageConfigTypes";
import {updateWidgetConfig} from "@/lib/state/PageLayoutSlice";
import {useAppDispatch} from "@/lib/state/Hooks";
import {WidgetProps} from "@/app/_components/layout/WidgetTypes";
import {resolveLaneSelection} from "@/lib/data/oscar/streams/LaneStreamRegistry";
import {LaneMapEntry} from "@/lib/data/oscar/LaneCollection";

/**
 * Hosts `EventTable` inside a custom dashboard tile with `isWidgetMode` enabled
 * so widget state never overwrites global Dashboard unread badge counts or route caches.
 */
export function ConfigurableEventTable({page, widget, adjudicationMode}: WidgetProps & { adjudicationMode?: boolean }) {
    const config = widget.config as EventTableWidgetConfig;
    const {laneMapRef} = useContext(DataSourceContext);
    const laneMapRaw = useSelector((state: RootState) => selectLaneMap(state));
    const dispatch = useAppDispatch();

    const baseLaneMap = useMemo<Map<string, LaneMapEntry>>(() => {
        const converted = convertToMap(laneMapRaw);
        return converted.size > 0 ? converted : (laneMapRef?.current ?? new Map());
    }, [laneMapRaw, laneMapRef]);

    const lanes = config.filters?.lanes ?? {mode: 'all' as const};
    const scopedLaneMap = useMemo(() => {
        if (lanes.mode === 'all') return baseLaneMap;
        const keep = new Set(resolveLaneSelection(lanes, baseLaneMap));
        return new Map([...baseLaneMap].filter(([name]) => keep.has(name)));
    }, [baseLaneMap, lanes]);

    const handleColumnSettingsChange = (columns: EventTableColumnSetting[]) => {
        dispatch(updateWidgetConfig({pageId: page.id, widgetId: widget.id, config: {...config, columns}}));
    };

    return (
        <Box sx={{height: '100%', overflow: 'auto'}}>
            <EventTable
                tableMode={adjudicationMode ? 'alarmtable' : 'eventlog'}
                laneMap={scopedLaneMap}
                viewLane={!adjudicationMode}
                viewAdjudicated={!adjudicationMode}
                columnSettings={config.columns}
                onColumnSettingsChange={handleColumnSettingsChange}
                fillHeight
                isWidgetMode
            />
        </Box>
    );
}

export default function EventTableWidget(props: WidgetProps) {
    return <ConfigurableEventTable {...props}/>;
}
