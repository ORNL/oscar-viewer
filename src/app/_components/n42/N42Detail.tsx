import {Box, Button, Chip, Grid, IconButton, Paper, Stack, Typography} from "@mui/material";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import React, {useCallback, useContext, useEffect, useMemo, useState} from "react";
import {
    acquireSharedConnection,
    findRealtimeDataSourceForStream,
    LaneMapEntry,
} from "@/lib/data/oscar/LaneCollection";
import {N42_REPORT_DEF} from "@/lib/data/Constants";
import {EventType} from "osh-js/source/core/event/EventType";
import {EventTableData} from "@/lib/data/oscar/TableHelpers";
import {DataSourceContext} from "@/app/contexts/DataSourceContext";
import N42ChartPlayback from "@/app/_components/n42/N42ChartPlayback";
import {randomUUID} from "osh-js/source/core/utils/Utils";
import {useLanguage} from '@/app/contexts/LanguageContext';
import {removeRealtimeEventSubscription} from "@/lib/data/oscar/RealtimeEventNotification";
import {
    CanonicalIsotopeKey,
    N42AlarmReportItem,
    selectDeviceReportIsotopes,
    UpSetSourceCategory,
} from "@/lib/data/oscar/adjudication/IsotopeMapping";

export interface N42Report {
    samplingTime: string;
    duration: number;
    linearSpectrumCount: number;
    linearSpectrum: number[];
    compressedSpectrumCount: number;
    compressedSpectrum: number[];
    gammaGrossCount: number;
    neutronGrossCount: number;
    dose: string;
}

interface N42FileData {
    fileName: string;
    foregroundReports: N42Report[];
    backgroundReports: N42Report[];
    alarmReports: N42AlarmReportItem[];
}

const FILENAME = "fileName";
const OCCUPANCY_OBS_ID = "occupancyObsId";
const FOREGROUND_REPORTS = "foregroundReports";
const BACKGROUND_REPORTS = "backgroundReports";
const ALARM_REPORTS = "alarmReports";

export default function N42Detail(props: {
    event: EventTableData;
    occupancyObsIdOverride?: string;
    refreshNonce?: number;
    onApplyDeviceIsotopes?: (isotopes: CanonicalIsotopeKey[], category: UpSetSourceCategory | null) => void;
    onDeviceIsotopesChange?: (isotopes: CanonicalIsotopeKey[], category: UpSetSourceCategory | null) => void;
}) {
    const {t} = useLanguage();
    const laneMapRef = useContext(DataSourceContext).laneMapRef;
    const [fileDataMap, setFileDataMap] = useState<Map<string, N42FileData>>(new Map());
    const [currentPage, setCurrentPage] = useState(0);

    const targetOccupancyObsId = props.occupancyObsIdOverride || props.event.occupancyObsId;
    const currentLaneId = props.event.laneId;

    useEffect(() => {
        setFileDataMap(new Map());
        setCurrentPage(0);
    }, [targetOccupancyObsId, currentLaneId]);

    const fetchN42 = useCallback(async() => {
        if (!targetOccupancyObsId) {
            return;
        }

        const currLaneEntry: LaneMapEntry = laneMapRef.current.get(currentLaneId);
        if (!currLaneEntry) {
            console.warn("Cannot load N42 data: lane entry is unavailable:", currentLaneId);
            return;
        }

        const n42Stream = currLaneEntry.findDataStreamByObsProperty(N42_REPORT_DEF);
        if (!n42Stream) {
            console.warn("No N42 datastream found for this lane");
            return;
        }

        const matched = new Map<string, N42FileData>();
        let query = await n42Stream.searchObservations(undefined, 100);
        let pagesRead = 0;

        while (query.hasNext() && pagesRead < 25) {
            pagesRead += 1;
            const obsCollection = await query.nextPage();

            for (const obs of obsCollection) {
                const data = obs.result;
                if (!data) continue;

                if (data[OCCUPANCY_OBS_ID] !== targetOccupancyObsId) continue;

                const foreground: N42Report[] = data[FOREGROUND_REPORTS] ?? [];
                const background: N42Report[] = data[BACKGROUND_REPORTS] ?? [];
                const alarms: N42AlarmReportItem[] = data[ALARM_REPORTS] ?? [];
                if (foreground.length === 0 && background.length === 0 && alarms.length === 0) continue;

                const msgFileName: string | undefined = data[FILENAME];
                const key = msgFileName && msgFileName.length > 0 ? msgFileName : randomUUID();

                matched.set(key, {
                    fileName: msgFileName ?? "",
                    foregroundReports: foreground,
                    backgroundReports: background,
                    alarmReports: alarms,
                });
            }
        }

        if (matched.size > 0) {
            setFileDataMap(prev => {
                const next = new Map(prev);
                matched.forEach((val, key) => next.set(key, val));
                return next;
            });
        }
    }, [targetOccupancyObsId, currentLaneId, laneMapRef]);

    useEffect(() => {
        if (props.event && targetOccupancyObsId) void fetchN42();
    }, [props.event, targetOccupancyObsId, props.refreshNonce, fetchN42]);

    useEffect(() => {
        if (!targetOccupancyObsId) {
            return;
        }

        const currLaneEntry: LaneMapEntry = laneMapRef.current.get(currentLaneId);
        if (!currLaneEntry) {
            console.warn("Cannot subscribe to N42 data: lane entry is unavailable:", currentLaneId);
            return;
        }

        const n42Stream = currLaneEntry.findDataStreamByObsProperty(N42_REPORT_DEF);
        if (!n42Stream) {
            console.warn("No N42 datastream found for this lane");
            return;
        }

        const n42Source = findRealtimeDataSourceForStream(currLaneEntry, n42Stream);
        if (!n42Source) {
            console.warn("No N42 data source found for this lane");
            return;
        }

        const handleObservations = (msg: any) => {
            const data = msg.values?.[0]?.data;
            if (!data) return;

            if (data[OCCUPANCY_OBS_ID] !== targetOccupancyObsId) return;

            const foreground: N42Report[] = data[FOREGROUND_REPORTS] ?? [];
            const background: N42Report[] = data[BACKGROUND_REPORTS] ?? [];
            const alarms: N42AlarmReportItem[] = data[ALARM_REPORTS] ?? [];
            if (foreground.length === 0 && background.length === 0 && alarms.length === 0) return;

            const msgFileName: string | undefined = data[FILENAME];
            const key = msgFileName && msgFileName.length > 0 ? msgFileName : randomUUID();

            setFileDataMap(prev => {
                const next = new Map(prev);
                next.set(key, {
                    fileName: msgFileName ?? "",
                    foregroundReports: foreground,
                    backgroundReports: background,
                    alarmReports: alarms,
                });
                return next;
            });
        };

        n42Source.subscribe(handleObservations, [EventType.DATA]);
        const lease = acquireSharedConnection(n42Source);
        void lease.ready.catch((err) => {
            console.error("Error connecting n42 source:", err);
        });

        return () => {
            removeRealtimeEventSubscription(n42Source, handleObservations);
            void lease.release().catch((error) => {
                console.error("Error disconnecting n42 source:", error);
            });
        };
    }, [targetOccupancyObsId, currentLaneId, laneMapRef]);

    const fileEntries = useMemo(() => Array.from(fileDataMap.values()), [fileDataMap]);

    const combinedAlarmReports = useMemo(
        () => fileEntries.flatMap((entry) => entry.alarmReports ?? []),
        [fileEntries],
    );
    const allDeviceSelection = useMemo(
        () => selectDeviceReportIsotopes(combinedAlarmReports),
        [combinedAlarmReports],
    );

    useEffect(() => {
        if (!props.onDeviceIsotopesChange) return;
        props.onDeviceIsotopesChange(allDeviceSelection.canonicalIsotopes, allDeviceSelection.dominantCategory);
    }, [allDeviceSelection.canonicalIsotopes, allDeviceSelection.dominantCategory, props.onDeviceIsotopesChange]);

    if (fileEntries.length === 0) {
        return null;
    }

    const safePage = Math.min(currentPage, fileEntries.length - 1);
    const activeFile = fileEntries[safePage];
    const activeDeviceSelection = selectDeviceReportIsotopes(activeFile.alarmReports);
    const effectiveDeviceSelection = activeDeviceSelection.canonicalIsotopes.length > 0
        ? activeDeviceSelection
        : allDeviceSelection;

    const handlePrevPage = () => {
        setCurrentPage(prev => (prev > 0 ? prev - 1 : 0));
    };

    const handleNextPage = () => {
        setCurrentPage(prev => (prev < fileEntries.length - 1 ? prev + 1 : prev));
    };

    return (
        <Grid container spacing={2} sx={{width: '100%'}} data-testid="n42-report-section">
            <Grid item xs={12}>
                <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                    <IconButton aria-label={t('previousReport')} onClick={handlePrevPage} disabled={safePage === 0}>
                        <NavigateBeforeIcon/>
                    </IconButton>
                    <Box sx={{textAlign: 'center'}}>
                        <Typography variant="h5">{t('n42Report')}</Typography>
                        <Typography variant="subtitle1" data-testid="n42-active-filename">{activeFile.fileName}</Typography>
                        {fileEntries.length > 1 && (
                            <Typography variant="caption">
                                {safePage + 1} / {fileEntries.length}
                            </Typography>
                        )}
                    </Box>
                    <IconButton aria-label={t('nextReport')} onClick={handleNextPage} disabled={safePage >= fileEntries.length - 1}>
                        <NavigateNextIcon/>
                    </IconButton>
                </Box>
            </Grid>

            {(activeFile.alarmReports.length > 0 || effectiveDeviceSelection.matches.length > 0) && (
                <Grid item xs={12}>
                    <Paper
                        variant="outlined"
                        data-testid="n42-device-alarm-summary"
                        sx={{ p: 1.5, bgcolor: "action.hover" }}
                    >
                        <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={1.5}
                            alignItems={{ xs: "flex-start", sm: "center" }}
                            justifyContent="space-between"
                        >
                            <Stack spacing={0.75}>
                                <Typography variant="subtitle2" fontWeight={700}>
                                    {t("n42DeviceIdentifiedResults")}
                                </Typography>
                                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
                                    {effectiveDeviceSelection.matches.length > 0
                                        ? effectiveDeviceSelection.matches.map((match) => (
                                            <Chip
                                                key={`${match.canonicalIsotope}-${match.rawName}`}
                                                size="small"
                                                color={match.category === "SNM" ? "error" : "info"}
                                                variant={match.category === "SNM" ? "filled" : "outlined"}
                                                data-testid={`n42-nuclide-chip-${match.canonicalIsotope}`}
                                                label={
                                                    match.category
                                                        ? `${match.rawName} · ${match.category}`
                                                        : match.rawName
                                                }
                                            />
                                        ))
                                        : activeFile.alarmReports.map((al, idx) => (
                                            <Chip
                                                key={`alarm-${idx}`}
                                                size="small"
                                                variant="outlined"
                                                label={`${al.alarmCategoryCode || "Alarm"}${al.alarmDescription ? `: ${al.alarmDescription}` : ""}`}
                                            />
                                        ))}
                                </Stack>
                            </Stack>
                            {props.onApplyDeviceIsotopes && effectiveDeviceSelection.canonicalIsotopes.length > 0 && (
                                <Button
                                    type="button"
                                    size="small"
                                    variant="outlined"
                                    color="info"
                                    data-testid="apply-n42-device-isotopes"
                                    onClick={() =>
                                        props.onApplyDeviceIsotopes?.(
                                            effectiveDeviceSelection.canonicalIsotopes,
                                            effectiveDeviceSelection.dominantCategory,
                                        )
                                    }
                                    sx={{ whiteSpace: "nowrap" }}
                                >
                                    {t("useDeviceResult")}
                                </Button>
                            )}
                        </Stack>
                    </Paper>
                </Grid>
            )}

            <Grid item xs={12}>
                <Grid container direction="row" marginTop={1} spacing={4}>
                    {activeFile.foregroundReports.length > 0 && (
                        <Grid item xs={12} md={activeFile.backgroundReports.length > 0 ? 6 : 12}>
                            <N42ChartPlayback
                                reports={activeFile.foregroundReports}
                                title={t('foregroundSpectrum')}
                                chartId={`n42-chart-foreground-${safePage}`}
                                yValue={"linearSpectrum"}
                            />
                        </Grid>
                    )}

                    {activeFile.backgroundReports.length > 0 && (
                        <Grid item xs={12} md={activeFile.foregroundReports.length > 0 ? 6 : 12}>
                            <N42ChartPlayback
                                reports={activeFile.backgroundReports}
                                title={t('backgroundSpectrum')}
                                chartId={`n42-chart-background-${safePage}`}
                                yValue={"linearSpectrum"}
                            />
                        </Grid>
                    )}
                </Grid>
            </Grid>
        </Grid>
    );
}
