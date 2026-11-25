"use client";

/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import React from "react";
import {Box, Typography} from "@mui/material";
import LaneStatusDetail from "@/app/_components/lane-view/LaneStatus";
import DailyFileMessage from "@/app/_components/lane-view/DailyFileMessage";
import {LaneDetailStatusWidgetConfig} from "@/lib/layout/PageConfigTypes";
import {WidgetProps} from "@/app/_components/layout/WidgetTypes";
import {useResolvedLane} from "@/app/_components/layout/useResolvedLane";
import {useLanguage} from "@/app/contexts/LanguageContext";
import {useLaneDataSources} from "@/lib/data/oscar/streams/useLaneDataSources";

export default function LaneDetailStatusWidget({page, widget}: WidgetProps) {
    const config = widget.config as LaneDetailStatusWidgetConfig;
    const {t} = useLanguage();
    const lane = useResolvedLane(page, config.laneSource);
    const {collection} = useLaneDataSources(lane ?? undefined);
    if (!lane || !collection) {
        return (
            <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%'}}>
                <Typography color="text.secondary">{t('noLaneSelected')}</Typography>
            </Box>
        );
    }
    return (
        <Box sx={{height: '100%', overflowY: 'auto', minInlineSize: 0}}>
            <LaneStatusDetail key={lane} dataSourcesByLane={collection}/>
            <DailyFileMessage key={`${lane}:daily`} dataSourcesByLane={collection}/>
        </Box>
    );
}
