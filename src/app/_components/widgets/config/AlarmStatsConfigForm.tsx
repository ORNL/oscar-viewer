"use client";

/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import React from "react";
import {
    Checkbox,
    Divider,
    FormControl,
    FormControlLabel,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    Switch,
    TextField,
} from "@mui/material";
import LaneSelectionField from "./LaneSelectionField";
import {
    AlarmStatsBucket,
    AlarmStatsVisualization,
    AlarmStatsWidgetConfig,
    AlarmStatsWindow,
    LaneCompareMetric,
    MIN_STATS_REFRESH_SEC,
} from "@/lib/layout/PageConfigTypes";
import {WidgetConfigFormProps} from "@/app/_components/layout/WidgetTypes";
import {useLanguage} from "@/app/contexts/LanguageContext";

const VISUALIZATIONS: { value: AlarmStatsVisualization; labelKey: string }[] = [
    {value: 'rate-trend', labelKey: 'vizRateTrend'},
    {value: 'lane-stack', labelKey: 'vizLaneStack'},
    {value: 'time-profile', labelKey: 'vizTimeProfile'},
    {value: 'adjudication-time', labelKey: 'vizAdjudicationTime'},
    {value: 'lane-comparison', labelKey: 'vizLaneComparison'},
];

const WINDOWS: { value: AlarmStatsWindow; labelKey: string }[] = [
    {value: '1h', labelKey: 'alarmWindow_1h'},
    {value: '8h', labelKey: 'alarmWindow_8h'},
    {value: '24h', labelKey: 'alarmWindow_24h'},
    {value: '7d', labelKey: 'alarmWindow_7d'},
    {value: '30d', labelKey: 'alarmWindow_30d'},
];

const BUCKETS: { value: AlarmStatsBucket; labelKey: string }[] = [
    {value: 'auto', labelKey: 'bucketAuto'},
    {value: '1m', labelKey: 'bucket_1m'},
    {value: '5m', labelKey: 'bucket_5m'},
    {value: '15m', labelKey: 'bucket_15m'},
    {value: '1h', labelKey: 'bucket_1h'},
    {value: '6h', labelKey: 'bucket_6h'},
    {value: '1d', labelKey: 'bucket_1d'},
];

const LANE_METRICS: LaneCompareMetric[] = [
    'alarmRate', 'occupancies', 'alarms', 'adjudicatedPct', 'meanAdjTime',
];

export default function AlarmStatsConfigForm({draft, onChange}: WidgetConfigFormProps) {
    const config = draft as AlarmStatsWidgetConfig;
    const {t} = useLanguage();

    const visualization = config.visualization ?? 'rate-trend';
    const set = (patch: Partial<AlarmStatsWidgetConfig>) => onChange({...config, ...patch});

    const isProfile = visualization === 'time-profile';
    const profileAxis = config.profileAxis ?? 'hourOfDay';
    const windows = !isProfile
        ? WINDOWS.filter((w) => w.value !== '30d')
        : profileAxis === 'hourOfDay'
            ? WINDOWS.filter((w) => w.value === '1h' || w.value === '8h' || w.value === '24h')
            : WINDOWS;

    const currentWindow = windows.some((w) => w.value === (config.window ?? '24h'))
        ? (config.window ?? '24h')
        : '24h';

    const setVisualization = (next: AlarmStatsVisualization) => {
        const leavingProfile = next !== 'time-profile' && config.window === '30d';
        const enteringHourProfile =
            next === 'time-profile' &&
            (config.profileAxis ?? 'hourOfDay') === 'hourOfDay' &&
            (config.window === '7d' || config.window === '30d');
        set({
            visualization: next,
            ...(leavingProfile ? {window: '7d' as AlarmStatsWindow} : {}),
            ...(enteringHourProfile ? {window: '24h' as AlarmStatsWindow} : {}),
        });
    };

    const handleRefreshChange = (rawVal: string) => {
        const parsed = Number(rawVal);
        if (!Number.isFinite(parsed) || parsed <= 0) {
            set({refreshSec: 0});
            return;
        }
        set({refreshSec: Math.max(MIN_STATS_REFRESH_SEC, Math.round(parsed))});
    };

    return (
        <Stack spacing={2}>
            <FormControl size="small" fullWidth>
                <InputLabel id="alarm-stats-viz-label">{t('visualization')}</InputLabel>
                <Select
                    labelId="alarm-stats-viz-label"
                    label={t('visualization')}
                    value={visualization}
                    onChange={(e) => setVisualization(e.target.value as AlarmStatsVisualization)}
                >
                    {VISUALIZATIONS.map((v) => (
                        <MenuItem key={v.value} value={v.value}>{t(v.labelKey)}</MenuItem>
                    ))}
                </Select>
            </FormControl>

            <LaneSelectionField
                value={config.lanes ?? {mode: 'all'}}
                onChange={(lanes) => set({lanes})}
            />

            <FormControl size="small" fullWidth>
                <InputLabel id="alarm-stats-window-label">{t('statsWindow')}</InputLabel>
                <Select
                    labelId="alarm-stats-window-label"
                    label={t('statsWindow')}
                    value={currentWindow}
                    onChange={(e) => set({window: e.target.value as AlarmStatsWindow})}
                >
                    {windows.map((w) => (
                        <MenuItem key={w.value} value={w.value}>{t(w.labelKey)}</MenuItem>
                    ))}
                </Select>
            </FormControl>

            {visualization !== 'lane-comparison' && visualization !== 'time-profile' && (
                <FormControl size="small" fullWidth>
                    <InputLabel id="alarm-stats-bucket-label">{t('bucketSize')}</InputLabel>
                    <Select
                        labelId="alarm-stats-bucket-label"
                        label={t('bucketSize')}
                        value={config.bucket ?? 'auto'}
                        onChange={(e) => set({bucket: e.target.value as AlarmStatsBucket})}
                    >
                        {BUCKETS.map((b) => (
                            <MenuItem key={b.value} value={b.value}>{t(b.labelKey)}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            )}

            <Divider/>

            {visualization === 'rate-trend' && (
                <Stack>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={config.showOccupancies ?? true}
                                onChange={(e) => set({showOccupancies: e.target.checked})}
                            />
                        }
                        label={t('showOccupancies')}
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={config.showAlarms ?? true}
                                onChange={(e) => set({showAlarms: e.target.checked})}
                            />
                        }
                        label={t('showAlarms')}
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={config.showAlarmRate ?? true}
                                onChange={(e) => set({showAlarmRate: e.target.checked})}
                            />
                        }
                        label={t('showAlarmRate')}
                    />
                    <FormControlLabel
                        control={
                            <Switch
                                checked={(config.trendStyle ?? 'area') === 'area'}
                                onChange={(e) => set({trendStyle: e.target.checked ? 'area' : 'line'})}
                            />
                        }
                        label={t('trendStyleArea')}
                    />
                </Stack>
            )}

            {visualization === 'lane-stack' && (
                <Stack spacing={2}>
                    <FormControl size="small" fullWidth>
                        <InputLabel id="alarm-stats-stack-metric-label">{t('laneStackMetric')}</InputLabel>
                        <Select
                            labelId="alarm-stats-stack-metric-label"
                            label={t('laneStackMetric')}
                            value={config.laneStackMetric ?? 'alarms'}
                            onChange={(e) => set({laneStackMetric: e.target.value as 'alarms' | 'occupancies'})}
                        >
                            <MenuItem value="alarms">{t('alarms')}</MenuItem>
                            <MenuItem value="occupancies">{t('occupancies')}</MenuItem>
                        </Select>
                    </FormControl>
                    <TextField
                        size="small"
                        type="number"
                        fullWidth
                        label={t('laneStackTopN')}
                        value={config.laneStackTopN ?? 7}
                        onChange={(e) => set({
                            laneStackTopN: Math.min(7, Math.max(1, Number(e.target.value) || 1)),
                        })}
                        helperText={t('laneStackTopNHelp')}
                    />
                </Stack>
            )}

            {visualization === 'time-profile' && (
                <Stack spacing={2}>
                    <FormControl size="small" fullWidth>
                        <InputLabel id="alarm-stats-profile-axis-label">{t('profileAxis')}</InputLabel>
                        <Select
                            labelId="alarm-stats-profile-axis-label"
                            label={t('profileAxis')}
                            value={profileAxis}
                            onChange={(e) => {
                                const nextAxis = e.target.value as 'hourOfDay' | 'dayOfWeek';
                                const clampWin =
                                    nextAxis === 'hourOfDay' && (config.window === '7d' || config.window === '30d');
                                set({
                                    profileAxis: nextAxis,
                                    ...(clampWin ? {window: '24h' as AlarmStatsWindow} : {}),
                                });
                            }}
                        >
                            <MenuItem value="hourOfDay">{t('hourOfDay')}</MenuItem>
                            <MenuItem value="dayOfWeek">{t('dayOfWeek')}</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={config.profileNormalize ?? true}
                                onChange={(e) => set({profileNormalize: e.target.checked})}
                            />
                        }
                        label={t('profileNormalize')}
                    />
                </Stack>
            )}

            {visualization === 'adjudication-time' && (
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={config.showAdjMeanTrend ?? true}
                            onChange={(e) => set({showAdjMeanTrend: e.target.checked})}
                        />
                    }
                    label={t('showAdjMeanTrend')}
                />
            )}

            {visualization === 'lane-comparison' && (
                <Stack spacing={2}>
                    <FormControl size="small" fullWidth>
                        <InputLabel id="alarm-stats-lane-mode-label">{t('laneCompareMode')}</InputLabel>
                        <Select
                            labelId="alarm-stats-lane-mode-label"
                            label={t('laneCompareMode')}
                            value={config.laneCompareMode ?? 'both'}
                            onChange={(e) => set({laneCompareMode: e.target.value as 'bars' | 'kpis' | 'both'})}
                        >
                            <MenuItem value="both">{t('laneCompareBoth')}</MenuItem>
                            <MenuItem value="bars">{t('laneCompareBars')}</MenuItem>
                            <MenuItem value="kpis">{t('laneCompareKpis')}</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl size="small" fullWidth disabled={(config.laneCompareMode ?? 'both') === 'kpis'}>
                        <InputLabel id="alarm-stats-lane-metric-label">{t('laneCompareMetric')}</InputLabel>
                        <Select
                            labelId="alarm-stats-lane-metric-label"
                            label={t('laneCompareMetric')}
                            value={config.laneCompareMetric ?? 'alarmRate'}
                            onChange={(e) => set({laneCompareMetric: e.target.value as LaneCompareMetric})}
                        >
                            {LANE_METRICS.map((m) => (
                                <MenuItem key={m} value={m}>{t(`laneMetric_${m}`)}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <TextField
                        size="small"
                        type="number"
                        fullWidth
                        label={t('laneCompareTopN')}
                        value={config.laneCompareTopN ?? 15}
                        disabled={(config.laneCompareMode ?? 'both') === 'kpis'}
                        onChange={(e) => set({laneCompareTopN: Math.max(1, Number(e.target.value) || 1)})}
                    />
                </Stack>
            )}

            <Divider/>

            {!isProfile && (
                <FormControlLabel
                    control={
                        <Switch
                            checked={config.liveAppend ?? true}
                            onChange={(e) => set({liveAppend: e.target.checked})}
                        />
                    }
                    label={t('liveAppend')}
                />
            )}
            <TextField
                size="small"
                type="number"
                fullWidth
                label={t('refreshInterval')}
                value={config.refreshSec ?? 300}
                inputProps={{min: 0, step: 60}}
                onChange={(e) => handleRefreshChange(e.target.value)}
                helperText={t('refreshIntervalHelp')}
            />
        </Stack>
    );
}
