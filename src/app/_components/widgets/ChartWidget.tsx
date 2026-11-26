"use client";

/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import React, {useState} from "react";
import {Box, Typography} from "@mui/material";
import ChartLane from "@/app/_components/lane-view/ChartLane";
import {ChartWidgetConfig} from "@/lib/layout/PageConfigTypes";
import {WidgetProps} from "@/app/_components/layout/WidgetTypes";
import {useResolvedLane} from "@/app/_components/layout/useResolvedLane";
import {useLanguage} from "@/app/contexts/LanguageContext";
import {useLaneDataSources} from "@/lib/data/oscar/streams/useLaneDataSources";

/** Hosts `ChartLane` with a unique `instanceId` so multiple chart widgets never collide on DOM IDs. */
export default function ChartWidget({page, widget}: WidgetProps) {
    const config = widget.config as ChartWidgetConfig;
    const {t} = useLanguage();
    const lane = useResolvedLane(page, config.laneSource);
    const {gamma, neutron, threshold} = useLaneDataSources(lane ?? undefined, true);
    const [, setChartReady] = useState(false);

    if (!lane) {
        return (
            <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%'}}>
                <Typography color="text.secondary">{t('noLaneSelected')}</Typography>
            </Box>
        );
    }
    return (
        <Box sx={{height: '100%', overflow: 'auto'}}>
            <ChartLane
                key={`${widget.id}:${lane}`}
                instanceId={widget.id}
                laneName={lane}
                setChartReady={setChartReady}
                datasources={{gamma, neutron, threshold}}
            />
        </Box>
    );
}
