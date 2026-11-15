"use client";

import React, {useCallback, useEffect, useRef, useState} from "react";
import {Box, Typography} from "@mui/material";
import Chart from "chart.js/auto";
import {EventType} from "osh-js/source/core/event/EventType";
import {useLanguage} from "@/app/contexts/LanguageContext";
import {removeRealtimeEventSubscription} from "@/lib/data/oscar/RealtimeEventNotification";
import {
    buildSpectrumYScaleOptions,
    prepareSpectrumPlotData,
    SpectrumScaleHeader,
    SpectrumScaleMode,
} from "@/app/_components/n42/SpectrumScaleControl";

interface ChartInterceptProps {
    laneName?: string;
    datasource: any;
    title: string;
    yCurve?: string;
    yValue?: string;
    chartId: string;
}

export default function N42Chart({
    datasource,
    title,
    yValue = "linearSpectrum",
    chartId,
}: ChartInterceptProps) {
    const {t} = useLanguage();
    const chartRef = useRef<Chart | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const rawCountsRef = useRef<number[]>([]);
    const latestSpectrumRef = useRef<number[] | null>(null);
    const lastScaleModeRef = useRef<SpectrumScaleMode>("log");

    const [hasData, setHasData] = useState(false);
    const [scaleMode, setScaleMode] = useState<SpectrumScaleMode>("log");

    const updateChart = useCallback(
        (spectrumData: number[]) => {
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
                                text: title,
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

    const updateChartRef = useRef(updateChart);
    updateChartRef.current = updateChart;

    useEffect(() => {
        if (!datasource) return;

        const handleData = (rec: any) => {
            const spectrum = rec?.values?.[0]?.data?.[yValue];
            if (spectrum && Array.isArray(spectrum)) {
                latestSpectrumRef.current = spectrum;
                updateChartRef.current(spectrum);
            }
        };

        datasource.subscribe(handleData, [EventType.DATA]);

        return () => {
            removeRealtimeEventSubscription(datasource, handleData);
        };
    }, [datasource, yValue]);

    useEffect(() => {
        if (latestSpectrumRef.current) {
            updateChart(latestSpectrumRef.current);
        }
    }, [updateChart]);

    useEffect(() => {
        return () => {
            if (chartRef.current) {
                chartRef.current.destroy();
                chartRef.current = null;
            }
        };
    }, []);

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
                        marginBottom: "50px",
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
                        width: "100%",
                        height: 400,
                        cursor: "pointer",
                        borderRadius: 1,
                        border: "1px solid",
                        borderColor: "divider",
                        p: 1,
                        transition: "border-color 0.15s ease",
                        "&:hover": {borderColor: "primary.main"},
                    }}
                >
                    <canvas ref={canvasRef} id={chartId} />
                </Box>
            </Box>
        </Box>
    );
}
