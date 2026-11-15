"use client";

import React, {useCallback, useEffect, useRef, useState} from "react";
import Chart from "chart.js/auto";
import DataStream from "osh-js/source/core/consysapi/datastream/DataStream.js";
import ObservationFilter from "osh-js/source/core/consysapi/observation/ObservationFilter";
import {Box, Typography} from "@mui/material";
import {useLanguage} from "@/app/contexts/LanguageContext";
import {
    buildSpectrumYScaleOptions,
    prepareSpectrumPlotData,
    SpectrumScaleHeader,
    SpectrumScaleMode,
} from "@/app/_components/n42/SpectrumScaleControl";

interface ChartInterceptProps {
    laneName?: string;
    datastream: typeof DataStream;
    title: string;
    yCurve?: string;
    yValue?: string;
    chartId: string;
    startTime?: string;
    endTime?: string;
    currentTime?: number;
}

export default function Rs350ChartPlayback({
    datastream,
    title,
    yValue = "linearSpectrum",
    chartId,
    startTime = "2026-02-24T20:44:06Z",
    endTime = "2026-02-24T20:44:25Z",
    currentTime,
}: ChartInterceptProps) {
    const {t} = useLanguage();
    const chartRef = useRef<Chart | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const rawCountsRef = useRef<number[]>([]);
    const lastScaleModeRef = useRef<SpectrumScaleMode>("log");

    const [spectrumFrames, setSpectrumFrames] = useState<number[][]>([]);
    const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
    const [hasData, setHasData] = useState(false);
    const [scaleMode, setScaleMode] = useState<SpectrumScaleMode>("log");

    const updateChart = useCallback(
        (spectrumData: number[], frameIndex: number, totalFrames: number) => {
            if (!canvasRef.current) return;

            const {cleanRaw, plotValues, zeroFloor, logMax} = prepareSpectrumPlotData(
                spectrumData,
                scaleMode,
            );
            rawCountsRef.current = cleanRaw;

            const channels = cleanRaw.map((_, index) => index);
            const yAxisLabel =
                scaleMode === "log" ? t("countsLogAxis") : t("countsLinearAxis");
            const yScaleOptions = buildSpectrumYScaleOptions({
                scaleMode,
                zeroFloor,
                logMax,
                yAxisLabel,
            });

            setHasData(true);

            if (chartRef.current && lastScaleModeRef.current !== scaleMode) {
                chartRef.current.destroy();
                chartRef.current = null;
            }
            lastScaleModeRef.current = scaleMode;

            if (chartRef.current) {
                chartRef.current.data.labels = channels;
                chartRef.current.data.datasets[0].data = plotValues;
                chartRef.current.data.datasets[0].label = title;
                if (chartRef.current.options.plugins?.title) {
                    chartRef.current.options.plugins.title.text = t("frameProgress", {
                        title,
                        frame: frameIndex + 1,
                        total: totalFrames,
                    });
                }
                const xScale = chartRef.current.options.scales?.x as any;
                if (xScale?.title) xScale.title.text = t("channel");
                if (chartRef.current.options.scales) {
                    chartRef.current.options.scales.y = yScaleOptions as any;
                }
                chartRef.current.update("none");
            } else {
                chartRef.current = new Chart(canvasRef.current, {
                    type: "line",
                    data: {
                        labels: channels,
                        datasets: [
                            {
                                label: title,
                                data: plotValues,
                                borderColor: "#366cf4",
                                backgroundColor: "rgba(109, 162, 231, 0.45)",
                                borderWidth: 1.25,
                                fill: true,
                                pointRadius: 0,
                                tension: 0.1,
                            },
                        ],
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        animation: false,
                        plugins: {
                            title: {
                                display: true,
                                text: t("frameProgress", {
                                    title,
                                    frame: frameIndex + 1,
                                    total: totalFrames,
                                }),
                                font: {
                                    size: 14,
                                    weight: "bold",
                                },
                            },
                            legend: {
                                display: true,
                                position: "bottom",
                            },
                            tooltip: {
                                callbacks: {
                                    title: (items: any[]) => {
                                        if (!items?.length) return "";
                                        return `${t("channel")}: ${items[0].dataIndex}`;
                                    },
                                    label: (ctx: any) => {
                                        const exactVal =
                                            rawCountsRef.current[ctx.dataIndex] ?? 0;
                                        return `${t("counts")}: ${exactVal.toLocaleString()}`;
                                    },
                                },
                            },
                        },
                        scales: {
                            x: {
                                title: {
                                    display: true,
                                    text: t("channel"),
                                },
                                ticks: {
                                    maxTicksLimit: 20,
                                },
                            },
                            y: yScaleOptions as any,
                        },
                    },
                });
            }
        },
        [scaleMode, t, title],
    );

    // need to have the chart move through each array just as it would the video frames
    useEffect(() => {
        if (!datastream) return;

        const fetchSpectrumData = async () => {
            const initialResColl = await datastream.searchObservations(
                new ObservationFilter({resultTime: `${startTime}/${endTime}`}),
                1000,
            );

            const frames: number[][] = [];
            while (initialResColl.hasNext()) {
                const resArray = await initialResColl.nextPage();
                const res = resArray
                    .map((item: any) => item.result?.[yValue])
                    .filter((s: any) => Array.isArray(s) && s.length > 0);
                frames.push(...res);
            }
            setSpectrumFrames(frames);
        };

        fetchSpectrumData();

        return () => {
            if (chartRef.current) {
                chartRef.current.destroy();
                chartRef.current = null;
            }
        };
    }, [datastream, startTime, endTime, yValue]);

    useEffect(() => {
        if (spectrumFrames.length > 0 && spectrumFrames[currentFrameIndex]) {
            updateChart(
                spectrumFrames[currentFrameIndex],
                currentFrameIndex,
                spectrumFrames.length,
            );
        }
    }, [currentFrameIndex, spectrumFrames, updateChart]);

    useEffect(() => {
        if (currentTime == undefined || spectrumFrames.length === 0) return;

        const frameIndex = getFrameIndex(currentTime);
        if (frameIndex !== currentFrameIndex) {
            setCurrentFrameIndex(frameIndex);
        }
    }, [currentTime, spectrumFrames]);

    function getFrameIndex(currTimeMs: number) {
        if (spectrumFrames.length === 0) return 0;

        const start = new Date(startTime).getTime();
        const end = new Date(endTime).getTime();
        const totalDuration = end - start;

        const progress = Math.max(
            0,
            Math.min(1, (currTimeMs - start) / totalDuration),
        );
        const frameIndex = Math.floor(progress * spectrumFrames.length);
        return Math.min(frameIndex, spectrumFrames.length - 1);
    }

    return (
        <Box sx={{width: "100%"}} data-testid={`${chartId}-root`}>
            {!hasData && (
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "85%",
                        minHeight: 50,
                        p: 2,
                    }}
                >
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                        {title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {t("noDataAvailable")}
                    </Typography>
                </Box>
            )}
            <Box sx={{display: hasData ? "block" : "none", width: "100%"}}>
                <SpectrumScaleHeader
                    title={title}
                    chartId={chartId}
                    scaleMode={scaleMode}
                    onScaleModeChange={setScaleMode}
                />
                <Box
                    onClick={() =>
                        setScaleMode(prev => (prev === "log" ? "linear" : "log"))
                    }
                    data-testid={`${chartId}-canvas-wrapper`}
                    data-scale-mode={scaleMode}
                    sx={{
                        position: "relative",
                        height: 400,
                        width: "100%",
                        cursor: "pointer",
                        borderRadius: 1,
                        border: "1px solid",
                        borderColor: "divider",
                        p: 1,
                        transition: "border-color 0.15s ease",
                        "&:hover": {borderColor: "primary.main"},
                    }}
                >
                    <canvas ref={canvasRef} id={chartId}></canvas>
                </Box>
            </Box>
        </Box>
    );
}
