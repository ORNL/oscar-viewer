"use client";

/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import React, {useContext, useMemo, useState} from "react";
import {Box, ToggleButton, ToggleButtonGroup, Typography} from "@mui/material";
import {useSelector} from "react-redux";
import EventTable from "@/app/_components/event-table/EventTable";
import StatusTable from "@/app/_components/lane-view/StatusTable";
import {DataSourceContext} from "@/app/contexts/DataSourceContext";
import {convertToMap} from "@/app/utils/Utils";
import {RootState} from "@/lib/state/Store";
import {selectLaneMap} from "@/lib/state/OSCARLaneSlice";
import {StatusTableWidgetConfig} from "@/lib/layout/PageConfigTypes";
import {WidgetProps} from "@/app/_components/layout/WidgetTypes";
import {useResolvedLane} from "@/app/_components/layout/useResolvedLane";
import {useLanguage} from "@/app/contexts/LanguageContext";

/** Lane occupancy and fault log widget with `isWidgetMode` isolation. */
export default function StatusTableWidget({page, widget}: WidgetProps) {
    const config = widget.config as StatusTableWidgetConfig;
    const {t} = useLanguage();
    const lane = useResolvedLane(page, config.laneSource);
    const {laneMapRef} = useContext(DataSourceContext);
    const laneMapRaw = useSelector((state: RootState) => selectLaneMap(state));
    const effectiveLaneMap = useMemo(() => {
        const converted = convertToMap(laneMapRaw);
        return converted.size > 0 ? converted : (laneMapRef?.current ?? new Map());
    }, [laneMapRaw, laneMapRef]);

    const [view, setView] = useState<'occupancy' | 'fault'>(config.defaultView ?? 'occupancy');

    if (!lane) {
        return (
            <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%'}}>
                <Typography color="text.secondary">{t('noLaneSelected')}</Typography>
            </Box>
        );
    }

    const entry = effectiveLaneMap.get(lane) ?? laneMapRef.current?.get(lane);

    return (
        <Box sx={{display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0}}>
            <Box sx={{display: 'flex', justifyContent: 'center', pb: 1}}>
                <ToggleButtonGroup
                    size="small"
                    exclusive
                    value={view}
                    onChange={(_e, next) => next && setView(next)}
                >
                    <ToggleButton value="occupancy" disabled={view === 'occupancy'}>{t('occupancyTable')}</ToggleButton>
                    <ToggleButton value="fault" disabled={view === 'fault'}>{t('faultTable')}</ToggleButton>
                </ToggleButtonGroup>
            </Box>
            <Box sx={{flex: 1, minHeight: 0, display: view === 'occupancy' ? 'block' : 'none'}}>
                <EventTable
                    tableMode="lanelog"
                    laneMap={effectiveLaneMap}
                    viewLane
                    viewAdjudicated
                    currentLane={lane}
                    fillHeight
                    isWidgetMode
                />
            </Box>
            <Box sx={{flex: 1, minHeight: 0, display: view === 'fault' ? 'block' : 'none'}}>
                {entry && <StatusTable currentLane={lane} entry={entry}/>}
            </Box>
        </Box>
    );
}
