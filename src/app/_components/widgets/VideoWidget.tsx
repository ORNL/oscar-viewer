"use client";

/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import React, {useContext} from "react";
import {Box, Typography} from "@mui/material";
import VideoMedia from "@/app/_components/lane-view/VideoMedia";
import {getUniqueVideoControlStreams} from "@/app/_components/lane-view/VideoStreamUtils";
import {DataSourceContext} from "@/app/contexts/DataSourceContext";
import {VideoWidgetConfig} from "@/lib/layout/PageConfigTypes";
import {WidgetProps} from "@/app/_components/layout/WidgetTypes";
import {useResolvedLane} from "@/app/_components/layout/useResolvedLane";
import {useLanguage} from "@/app/contexts/LanguageContext";

/** Live lane video widget (viewer leases, camera cycling, auto-retry) for a single lane. */
export default function VideoWidget({page, widget}: WidgetProps) {
    const config = widget.config as VideoWidgetConfig;
    const {t} = useLanguage();
    const lane = useResolvedLane(page, config.laneSource);
    const {laneMapRef, readyLaneNames} = useContext(DataSourceContext);
    const entry = lane && readyLaneNames.has(lane) ? laneMapRef?.current?.get(lane) : undefined;
    if (entry && getUniqueVideoControlStreams(entry).length === 0) {
        return (
            <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%'}}>
                <Typography color="text.secondary" data-testid="video-widget-no-video">{t('noVideoAvailable')}</Typography>
            </Box>
        );
    }
    if (!lane) {
        return (
            <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%'}}>
                <Typography color="text.secondary">{t('noLaneSelected')}</Typography>
            </Box>
        );
    }
    return (
        <Box sx={{height: '100%', overflow: 'hidden'}}>
            <VideoMedia key={`${widget.id}:${lane}`} currentLane={lane} fillHeight/>
        </Box>
    );
}
