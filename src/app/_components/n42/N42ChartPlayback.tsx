"use client";

import React, {useCallback, useEffect, useRef, useState} from "react";
import {Box, Typography} from "@mui/material";
import Chart from "chart.js/auto";
import {N42Report} from "@/app/_components/n42/N42Detail";
import {useLanguage} from "@/app/contexts/LanguageContext";
import {
    buildSpectrumYScaleOptions,
    prepareSpectrumPlotData,
    SpectrumScaleHeader,
    SpectrumScaleMode,
} from "@/app/_components/n42/SpectrumScaleControl";

interface N42ChartPlaybackProps {
    reports: N42Report[];
    title: string;
    yValue?: string;
    chartId: string;
}

export default function N42ChartPlayback({
    reports,
    title,
    yValue = "linearSpectrum",
    chartId,
}: N42ChartPlaybackProps) {
    const {t} = useLanguage();
    const chartRef = useRef<Chart | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const rawCountsRef = useRef<number[]>([]);
    const lastScaleModeRef = useRef<SpectrumScaleMode>("log");
    const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
    const [scaleMode, setScaleMode] = useState<SpectrumScaleMode>("log");

    const spectrumFrames = React.useMemo(() => {
        return reports
            .map((r: any) => r[yValue])
            .filter((s: any) => Array.isArray(s) && s.length > 0);
    }, [reports, yValue]);

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
                                font: {size: 14, weight: "bold"},
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
                                title: {display: true, text: t("channel")},
                                ticks: {maxTicksLimit: 20},
                            },
                            y: yScaleOptions as any,
                        },
                    },
                });
            }
        },
        [scaleMode, t, title],
    );

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
        if (spectrumFrames.length <= 1) return;

        const duration = reports[currentFrameIndex]?.duration ?? 0.2;
        const intervalMs = Math.max(duration * 1000, 100);

        const timeout = setTimeout(() => {
            setCurrentFrameIndex(prev => (prev + 1) % spectrumFrames.length);
        }, intervalMs);

        return () => clearTimeout(timeout);
    }, [currentFrameIndex, spectrumFrames, reports]);

    useEffect(() => {
        return () => {
            if (chartRef.current) {
                chartRef.current.destroy();
                chartRef.current = null;
            }
        };
    }, []);

    if (spectrumFrames.length === 0) {
        return (
            <Box
                sx={{
                    height: 400,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <Typography color="text.secondary">
                    {t("noSpectrumData", {spectrum: t(yValue)})}
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{width: "100%"}} data-testid={`${chartId}-root`}>
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
    );
}
