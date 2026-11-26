"use client";

/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import React, {useEffect, useState} from "react";
import {Box, Chip, Divider, Grid, Paper, Stack, Typography} from "@mui/material";
import DirectionsWalkRoundedIcon from "@mui/icons-material/DirectionsWalkRounded";
import GpsFixedRoundedIcon from "@mui/icons-material/GpsFixedRounded";
import GpsOffRoundedIcon from "@mui/icons-material/GpsOffRounded";
import SensorsRoundedIcon from "@mui/icons-material/SensorsRounded";
import {EventType} from "osh-js/source/core/event/EventType";
import {
    acquireSharedConnection,
    findRealtimeDataSourceForStream,
    LaneMapEntry,
    type SharedConnectionLease,
} from "@/lib/data/oscar/LaneCollection";
import {removeRealtimeEventSubscription} from "@/lib/data/oscar/RealtimeEventNotification";
import {
    isD5RadiometricStatusDataStream,
    isD5SpectrumDataStream,
    isForegroundDataStream,
    isKromekD5Lane,
    isMobileDetectorLane,
    isMobileGpsDataStream,
} from "@/lib/data/oscar/Utilities";
import {toLaneMapLocation, toLaneMapLocationFromSystem} from "@/app/_components/maps/MapUtils";
import N42Chart from "@/app/_components/n42/N42Chart";
import VideoMedia from "@/app/_components/lane-view/VideoMedia";
import {getUniqueVideoControlStreams} from "@/app/_components/lane-view/VideoStreamUtils";
import EventTable from "@/app/_components/event-table/EventTable";
import {useLanguage} from "@/app/contexts/LanguageContext";

interface TelemetrySnapshot {
    doseRateUsvH: number | null;
    gammaCounts: number | null;
    neutronCounts: number | null;
    alarmActive: boolean;
    lat: number | null;
    lon: number | null;
    lastDataAt: number | null;
}

export function MobileDetectorSummaryCard({
    entry,
    currentLane,
}: {
    entry: LaneMapEntry;
    currentLane: string;
}) {
    const {t} = useLanguage();
    const [telemetry, setTelemetry] = useState<TelemetrySnapshot>(() => {
        const seeded = toLaneMapLocationFromSystem(entry?.laneSystem);
        return {
            doseRateUsvH: null,
            gammaCounts: null,
            neutronCounts: null,
            alarmActive: false,
            lat: seeded?.lat ?? null,
            lon: seeded?.lon ?? null,
            lastDataAt: null,
        };
    });

    useEffect(() => {
        let active = true;
        const subscriptions: Array<{
            source: any;
            handler: (msg: any) => void;
            lease: SharedConnectionLease;
        }> = [];

        const attach = (ds: any, onData: (data: any) => void) => {
            const rt = findRealtimeDataSourceForStream(entry, ds);
            if (!rt) return;
            if (rt.properties?.mqttOpts) rt.properties.mqttOpts.shared = true;
            const handler = (msg: any) => {
                if (!active) return;
                const data = msg?.values?.[0]?.data;
                if (data) onData(data);
            };
            rt.subscribe(handler, [EventType.DATA]);
            const lease = acquireSharedConnection(rt);
            subscriptions.push({source: rt, handler, lease});
            void lease.ready.catch(() => {});
        };

        (entry.datastreams ?? []).forEach((ds: any) => {
            if (isMobileGpsDataStream(ds)) {
                attach(ds, (data) => {
                    const fix = toLaneMapLocation(data);
                    if (!fix || (fix.lat === 0 && fix.lon === 0)) return;
                    setTelemetry((prev) => ({
                        ...prev,
                        lat: fix.lat,
                        lon: fix.lon,
                        lastDataAt: Date.now(),
                    }));
                });
            } else if (isD5SpectrumDataStream(ds)) {
                attach(ds, (data) => {
                    setTelemetry((prev) => ({
                        ...prev,
                        doseRateUsvH: typeof data.doseRate === "number" ? data.doseRate : prev.doseRateUsvH,
                        gammaCounts: typeof data.gammaCounts === "number" ? data.gammaCounts : prev.gammaCounts,
                        neutronCounts: typeof data.neutronCounts === "number" ? data.neutronCounts : prev.neutronCounts,
                        lastDataAt: Date.now(),
                    }));
                });
            } else if (isD5RadiometricStatusDataStream(ds)) {
                attach(ds, (data) => {
                    const alarm = Boolean(
                        data.doseAlarmActive || data.gammaCpsAlarmActive || data.neutronCpsAlarmActive,
                    );
                    setTelemetry((prev) => ({
                        ...prev,
                        alarmActive: alarm,
                        lastDataAt: Date.now(),
                    }));
                });
            } else if (isForegroundDataStream(ds)) {
                attach(ds, (data) => {
                    setTelemetry((prev) => ({
                        ...prev,
                        doseRateUsvH: typeof data.dose === "number" ? data.dose : prev.doseRateUsvH,
                        neutronCounts: typeof data.neutronCounts === "number" ? data.neutronCounts : prev.neutronCounts,
                        lastDataAt: Date.now(),
                    }));
                });
            }
        });

        return () => {
            active = false;
            subscriptions.forEach(({source, handler, lease}) => {
                removeRealtimeEventSubscription(source, handler);
                void lease.release().catch(() => {});
            });
        };
    }, [entry]);

    const hasValidGps = telemetry.lat != null && telemetry.lon != null
        && !(Math.abs(telemetry.lat) < 1e-6 && Math.abs(telemetry.lon) < 1e-6);
    const detectorModel = isKromekD5Lane(entry) ? "Kromek D5" : "RS-350";

    return (
        <Paper
            variant="outlined"
            data-testid="mobile-detector-summary-card"
            sx={{p: 2.5, height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 2}}
        >
            <Stack spacing={1.5}>
                <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" flexWrap="wrap">
                    <Stack direction="row" spacing={1} alignItems="center">
                        <DirectionsWalkRoundedIcon color="primary"/>
                        <Typography variant="subtitle1" fontWeight={700}>
                            {currentLane} · {detectorModel}
                        </Typography>
                    </Stack>
                    <Chip
                        size="small"
                        color={telemetry.alarmActive ? "error" : telemetry.lastDataAt ? "success" : "default"}
                        icon={<SensorsRoundedIcon/>}
                        label={telemetry.alarmActive ? t("status.alarm") : telemetry.lastDataAt ? t("online") : t("waiting")}
                        data-testid="mobile-detector-live-status-chip"
                    />
                </Stack>
                <Divider/>
                <Grid container spacing={1.5}>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="caption" color="text.secondary">
                            {t("gpsLocation")}
                        </Typography>
                        <Stack direction="row" spacing={0.75} alignItems="center" sx={{mt: 0.25}}>
                            {hasValidGps ? (
                                <>
                                    <GpsFixedRoundedIcon fontSize="small" color="success"/>
                                    <Typography variant="body2" sx={{fontFamily: "monospace"}} data-testid="mobile-detector-gps-value">
                                        {telemetry.lat!.toFixed(5)}, {telemetry.lon!.toFixed(5)}
                                    </Typography>
                                </>
                            ) : (
                                <>
                                    <GpsOffRoundedIcon fontSize="small" color="disabled"/>
                                    <Typography variant="body2" color="text.secondary" data-testid="mobile-detector-gps-indoor">
                                        {t("mobileGpsUnavailable")}
                                    </Typography>
                                </>
                            )}
                        </Stack>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="caption" color="text.secondary">
                            {t("lastUpdate")}
                        </Typography>
                        <Typography variant="body2" sx={{mt: 0.25}}>
                            {telemetry.lastDataAt ? new Date(telemetry.lastDataAt).toLocaleTimeString() : t("waitingForTelemetry")}
                        </Typography>
                    </Grid>
                    {telemetry.doseRateUsvH != null && (
                        <Grid item xs={6} sm={4}>
                            <Typography variant="caption" color="text.secondary">
                                {t("estimatedDose")}
                            </Typography>
                            <Typography variant="body2" fontWeight={600}>
                                {telemetry.doseRateUsvH.toFixed(3)} µSv/h
                            </Typography>
                        </Grid>
                    )}
                    {telemetry.gammaCounts != null && (
                        <Grid item xs={6} sm={4}>
                            <Typography variant="caption" color="text.secondary">
                                {t("gamma")}
                            </Typography>
                            <Typography variant="body2" fontWeight={600}>
                                {telemetry.gammaCounts.toLocaleString()} {t("counts")}
                            </Typography>
                        </Grid>
                    )}
                    {telemetry.neutronCounts != null && (
                        <Grid item xs={6} sm={4}>
                            <Typography variant="caption" color="text.secondary">
                                {t("neutron")}
                            </Typography>
                            <Typography variant="body2" fontWeight={600}>
                                {telemetry.neutronCounts.toLocaleString()} {t("counts")}
                            </Typography>
                        </Grid>
                    )}
                </Grid>
            </Stack>
            <Typography variant="caption" color="text.secondary">
                {t("mobileFaultsNotMonitored")}
            </Typography>
        </Paper>
    );
}

/**
 * Dedicated lane view for Kromek D5 detectors (mobile walkers and camera-equipped portals):
 * renders the live 4,096-channel spectrumBins chart alongside either live camera video (when
 * cameras are attached) or the mobile detector status/GPS summary card, plus occupancy history.
 */
export default function KromekD5LaneView({
    entry,
    currentLane,
    laneMap,
    instanceId,
}: {
    entry: LaneMapEntry;
    currentLane: string;
    laneMap: Map<string, LaneMapEntry>;
    instanceId?: string;
}) {
    const {t} = useLanguage();
    const [spectrumSource, setSpectrumSource] = useState<any>(undefined);

    useEffect(() => {
        const ds = (entry.datastreams ?? []).find((candidate: any) => isD5SpectrumDataStream(candidate));
        const rt = ds ? findRealtimeDataSourceForStream(entry, ds) : undefined;
        if (rt?.properties?.mqttOpts) {
            rt.properties.mqttOpts.shared = true;
        }
        setSpectrumSource(rt);
    }, [entry]);

    useEffect(() => {
        if (!spectrumSource) return;
        const lease = acquireSharedConnection(spectrumSource);
        void lease.ready.catch((error) => {
            console.warn("Unable to connect Kromek D5 spectrum stream", error);
        });
        return () => {
            void lease.release().catch((error) => {
                console.warn("Unable to disconnect Kromek D5 spectrum stream", error);
            });
        };
    }, [spectrumSource, currentLane]);

    const hasCameras = !isMobileDetectorLane(entry) && getUniqueVideoControlStreams(entry).length > 0;

    return (
        <>
            <Grid container spacing={2} sx={{width: "100%", mt: 1}} data-testid="kromek-d5-lane-view">
                <Grid item xs={12}>
                    <Paper variant="outlined" sx={{width: "100%", p: 2, overflow: "hidden"}}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={7}>
                                <N42Chart
                                    laneName={currentLane}
                                    datasource={spectrumSource}
                                    title={t("d5RealtimeSpectrum")}
                                    yCurve={t("counts")}
                                    yValue="spectrumBins"
                                    chartId={`chart-d5-spectrum-${instanceId ?? currentLane}`}
                                />
                            </Grid>
                            <Grid item xs={12} md={5}>
                                {hasCameras ? (
                                    <VideoMedia currentLane={currentLane}/>
                                ) : (
                                    <MobileDetectorSummaryCard entry={entry} currentLane={currentLane}/>
                                )}
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>
            </Grid>

            <Grid container spacing={2} sx={{width: "100%", mt: 1}}>
                <Grid item xs={12}>
                    <Paper variant="outlined" sx={{width: "100%", p: 2}}>
                        <Box sx={{width: "100%", height: {xs: 400, sm: 500, md: 600, lg: 800}}}>
                            <EventTable
                                tableMode="lanelog"
                                laneMap={laneMap}
                                viewLane
                                viewAdjudicated
                                currentLane={currentLane}
                            />
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </>
    );
}
