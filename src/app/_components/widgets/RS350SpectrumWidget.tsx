"use client";

/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import React, {useContext, useMemo} from "react";
import {useSelector} from "react-redux";
import {Box, CircularProgress, Typography} from "@mui/material";
import RS350BackpackView from "@/app/_components/lane-view/RS350BackpackView";
import KromekD5LaneView from "@/app/_components/lane-view/MobileDetectorView";
import {DataSourceContext} from "@/app/contexts/DataSourceContext";
import {convertToMap} from "@/app/utils/Utils";
import {isKromekD5Lane} from "@/lib/data/oscar/Utilities";
import {RS350SpectrumWidgetConfig} from "@/lib/layout/PageConfigTypes";
import {WidgetProps} from "@/app/_components/layout/WidgetTypes";
import {useResolvedLane} from "@/app/_components/layout/useResolvedLane";
import {useLanguage} from "@/app/contexts/LanguageContext";
import {RootState} from "@/lib/state/Store";
import {selectLaneMap} from "@/lib/state/OSCARLaneSlice";

function Centered({children}: {children: React.ReactNode}) {
    return (
        <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', p: 2, textAlign: 'center'}}>
            {children}
        </Box>
    );
}

/**
 * Spectroscopic lane view widget supporting both RS-350 (fixed or backpack)
 * and Kromek D5 RIID detector lanes.
 */
export default function RS350SpectrumWidget({page, widget}: WidgetProps) {
    const config = widget.config as RS350SpectrumWidgetConfig;
    const {t} = useLanguage();
    const lane = useResolvedLane(page, config.laneSource);
    const laneMapRaw = useSelector((state: RootState) => selectLaneMap(state));
    const {laneMapRef, readyLaneNames} = useContext(DataSourceContext);

    const effectiveLaneMap = useMemo(() => {
        const converted = convertToMap(laneMapRaw);
        return converted.size > 0 ? converted : (laneMapRef?.current ?? new Map());
    }, [laneMapRaw, laneMapRef]);

    if (!lane) return <Centered><Typography color="text.secondary">{t('noLaneSelected')}</Typography></Centered>;
    const entry = readyLaneNames.has(lane) ? (laneMapRef.current?.get(lane) ?? effectiveLaneMap.get(lane)) : undefined;
    if (!entry) return <Centered><CircularProgress size={24}/></Centered>;

    const isD5 = isKromekD5Lane(entry);
    if (!entry.isRS350Backpack && !isD5) {
        return (
            <Centered>
                <Typography color="text.secondary" data-testid="rs350-spectrum-not-rs350">
                    {t('rs350SpectrumOnly', {lane})}
                </Typography>
            </Centered>
        );
    }
    return (
        <Box data-testid="rs350-spectrum-widget" sx={{height: '100%', overflowY: 'auto', minInlineSize: 0, px: 1}}>
            {isD5 ? (
                <KromekD5LaneView
                    key={`${widget.id}:${lane}`}
                    instanceId={widget.id}
                    entry={entry}
                    currentLane={lane}
                    laneMap={effectiveLaneMap}
                />
            ) : (
                <RS350BackpackView
                    key={`${widget.id}:${lane}`}
                    instanceId={widget.id}
                    entry={entry}
                    currentLane={lane}
                    laneMap={effectiveLaneMap}
                />
            )}
        </Box>
    );
}
