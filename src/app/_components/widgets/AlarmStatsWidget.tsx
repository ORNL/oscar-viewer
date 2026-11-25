"use client";

/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import React, {useMemo} from "react";
import {Box, CircularProgress, LinearProgress, Typography, useTheme} from "@mui/material";
import {AlarmStatsWidgetConfig, MIN_STATS_REFRESH_SEC} from "@/lib/layout/PageConfigTypes";
import {WidgetProps} from "@/app/_components/layout/WidgetTypes";
import {useLanguage} from "@/app/contexts/LanguageContext";
import {useAlarmStats} from "@/lib/data/oscar/stats/useAlarmStats";
import AlarmStatsChart from "./alarm-stats/AlarmStatsChart";
import AlarmStatsKpiRow from "./alarm-stats/AlarmStatsKpiRow";
import {
    buildAdjHistogramSpec,
    buildAdjTrendSpec,
    buildAlarmRateSpec,
    buildLaneComparisonSpec,
    buildLaneStackSpec,
    buildRateTrendSpec,
    buildTimeProfileSpec,
} from "./alarm-stats/chartSpecs";

function Centered({children, color = "text.secondary"}: { children: React.ReactNode; color?: string }) {
    return (
        <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', p: 1}}>
            <Typography variant="body2" color={color} align="center">{children}</Typography>
        </Box>
    );
}

export default function AlarmStatsWidget({widget}: WidgetProps) {
    const config = (widget.config ?? {}) as AlarmStatsWidgetConfig;
    const visualization = config.visualization ?? 'rate-trend';
    const {t} = useLanguage();
    const theme = useTheme();

    const showAdjTrend = config.showAdjMeanTrend ?? true;
    const laneMode = config.laneCompareMode ?? 'both';
    const laneMetric = config.laneCompareMetric ?? 'alarmRate';

    const needAdjudication =
        visualization === 'adjudication-time' ||
        (visualization === 'lane-comparison' &&
            (laneMode !== 'bars' || ['adjudicatedPct', 'meanAdjTime'].includes(laneMetric)));

    const isProfile = visualization === 'time-profile';
    const profileAxis = config.profileAxis ?? 'hourOfDay';

    const rawWindow = config.window ?? '24h';
    const window = !isProfile
        ? (rawWindow === '30d' ? '7d' : rawWindow)
        : (profileAxis === 'hourOfDay' && (rawWindow === '7d' || rawWindow === '30d') ? '24h' : rawWindow);

    const seedMode = isProfile ? ('counts' as const) : ('observations' as const);
    const bucket = isProfile ? (profileAxis === 'dayOfWeek' ? '1d' : '1h') : (config.bucket ?? 'auto');
    const rawRefresh = config.refreshSec ?? 300;
    const refreshSec = rawRefresh <= 0 ? 0 : Math.max(MIN_STATS_REFRESH_SEC, rawRefresh);

    const stats = useAlarmStats({
        lanes: config.lanes ?? {mode: 'all'},
        window,
        bucket,
        needAdjudication,
        liveAppend: isProfile ? false : (config.liveAppend ?? true),
        refreshSec,
        seedMode,
    });

    const specs = useMemo(() => {
        switch (visualization) {
            case 'adjudication-time':
                return {
                    primary: buildAdjHistogramSpec(stats, theme, t),
                    secondary: showAdjTrend ? buildAdjTrendSpec(stats, theme, t) : null,
                };
            case 'lane-comparison':
                return {
                    primary: laneMode === 'kpis' ? null : buildLaneComparisonSpec(stats, config, theme, t),
                    secondary: null,
                };
            case 'lane-stack':
                return {primary: buildLaneStackSpec(stats, config, theme, t), secondary: null};
            case 'time-profile':
                return {primary: buildTimeProfileSpec(stats, config, theme, t), secondary: null};
            case 'rate-trend':
            default:
                return {
                    primary: buildRateTrendSpec(stats, config, theme, t),
                    secondary: (config.showAlarmRate ?? true) ? buildAlarmRateSpec(stats, theme, t) : null,
                };
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visualization, stats.buckets, theme.palette.mode, JSON.stringify(config), t]);

    if (stats.loading) {
        return (
            <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%'}}>
                <CircularProgress size={24}/>
            </Box>
        );
    }

    if (stats.error) return <Centered color="error">{t('statsFetchFailed')}</Centered>;
    if (stats.laneCount === 0) return <Centered>{t('noLanesSelected')}</Centered>;
    if (stats.totals.occupancies === 0) return <Centered>{t('noStatsInWindow')}</Centered>;

    const showKpis = visualization === 'lane-comparison' && laneMode !== 'bars';
    const primaryFlex = visualization === 'rate-trend' ? 4 : 3;

    return (
        <Box sx={{height: '100%', width: '100%', display: 'flex', flexDirection: 'column', minHeight: 0}}>
            <Box sx={{height: 2, flexShrink: 0}}>
                {stats.refreshing && <LinearProgress sx={{height: 2}}/>}
            </Box>

            {showKpis && <AlarmStatsKpiRow totals={stats.totals}/>}

            {specs.primary && (
                <Box sx={{
                    flex: specs.secondary ? `${primaryFlex} 1 0` : '1 1 0',
                    minHeight: 0,
                    display: 'flex',
                    flexDirection: 'column',
                }}>
                    <AlarmStatsChart spec={specs.primary}/>
                </Box>
            )}

            {specs.secondary && (
                <Box sx={{flex: '2 1 0', minHeight: 0, display: 'flex', flexDirection: 'column'}}>
                    <AlarmStatsChart spec={specs.secondary}/>
                </Box>
            )}

            {stats.capped && (
                <Typography variant="caption" color="text.secondary" noWrap sx={{flexShrink: 0, px: 0.5}}>
                    {`${t('alarmStatsCapped')} ${stats.fetchedCount.toLocaleString()} ${t('occupancies').toLowerCase()}`}
                </Typography>
            )}
        </Box>
    );
}
