"use client";

import React from "react";
import {Box, Button, Chip, Stack, Typography} from "@mui/material";
import {useLanguage} from "@/app/contexts/LanguageContext";

export type SpectrumScaleMode = "log" | "linear";

export interface PreparedSpectrumData {
    cleanRaw: number[];
    plotValues: number[];
    zeroFloor: number;
    logMax: number;
}

function computeNiceLogCeiling(maxPositive: number, zeroFloor: number): number {
    const effectiveMax = Math.max(maxPositive, zeroFloor * 10);
    const exp = Math.floor(Math.log10(effectiveMax));
    const base = Math.pow(10, exp);
    const mantissa = effectiveMax / base;
    if (mantissa < 1.8) return 2 * base;
    if (mantissa < 4.5) return 5 * base;
    return 10 * base;
}

/**
 * Prepares channel counts for Chart.js linear or logarithmic Y-axis display.
 * Zero-count channels are mapped to a sub-unit baseline (0.5 for integer counts)
 * in logarithmic mode so 0-count channels render continuously and 1-count channels
 * remain clearly distinguishable above the baseline, while cleanRaw preserves
 * exact counts for tooltips.
 */
export function prepareSpectrumPlotData(
    rawCounts: number[],
    scaleMode: SpectrumScaleMode,
): PreparedSpectrumData {
    const cleanRaw = rawCounts.map(v =>
        typeof v === "number" && Number.isFinite(v) && v > 0 ? v : 0,
    );

    let minPositive = Number.POSITIVE_INFINITY;
    let maxPositive = 0;
    for (let i = 0; i < cleanRaw.length; i++) {
        const v = cleanRaw[i];
        if (v > 0) {
            if (v < minPositive) minPositive = v;
            if (v > maxPositive) maxPositive = v;
        }
    }

    let zeroFloor = 0.5;
    if (Number.isFinite(minPositive) && minPositive < 1) {
        const minExp = Math.floor(Math.log10(minPositive));
        zeroFloor = 0.5 * Math.pow(10, minExp);
    }

    const logMax = computeNiceLogCeiling(maxPositive, zeroFloor);
    const plotValues =
        scaleMode === "log"
            ? cleanRaw.map(v => (v > 0 ? v : zeroFloor))
            : cleanRaw;

    return {cleanRaw, plotValues, zeroFloor, logMax};
}

export function buildSpectrumYScaleOptions(params: {
    scaleMode: SpectrumScaleMode;
    zeroFloor: number;
    logMax: number;
    yAxisLabel: string;
}) {
    const {scaleMode, zeroFloor, logMax, yAxisLabel} = params;
    if (scaleMode === "linear") {
        return {
            type: "linear" as const,
            beginAtZero: true,
            title: {
                display: true,
                text: yAxisLabel,
            },
        };
    }

    return {
        type: "logarithmic" as const,
        min: zeroFloor,
        max: logMax,
        title: {
            display: true,
            text: yAxisLabel,
        },
        ticks: {
            callback: (value: number | string) => {
                const num = typeof value === "number" ? value : Number(value);
                if (!Number.isFinite(num) || num <= 0) return null;
                if (Math.abs(num - zeroFloor) / zeroFloor < 1e-4) {
                    return "0";
                }
                if (Math.abs(num - logMax) / logMax < 1e-4) {
                    return num >= 1 ? Math.round(num).toLocaleString() : String(num);
                }
                const exp = Math.floor(Math.log10(num) + 1e-9);
                const mantissa = +(num / Math.pow(10, exp)).toFixed(6);
                if (Math.abs(mantissa - 1) < 1e-4) {
                    return num >= 1 ? Math.round(num).toLocaleString() : String(num);
                }
                if (
                    logMax <= 100 &&
                    (Math.abs(mantissa - 2) < 1e-4 || Math.abs(mantissa - 5) < 1e-4)
                ) {
                    return num >= 1 ? Math.round(num).toLocaleString() : String(num);
                }
                return null;
            },
        },
    };
}

interface SpectrumScaleHeaderProps {
    title: string;
    chartId: string;
    scaleMode: SpectrumScaleMode;
    onScaleModeChange: (mode: SpectrumScaleMode) => void;
}

export function SpectrumScaleHeader({
    title,
    chartId,
    scaleMode,
    onScaleModeChange,
}: SpectrumScaleHeaderProps) {
    const {t} = useLanguage();
    const isLog = scaleMode === "log";

    return (
        <Stack
            direction={{xs: "column", sm: "row"}}
            alignItems={{xs: "flex-start", sm: "center"}}
            justifyContent="space-between"
            spacing={1}
            sx={{mb: 0.75, px: 0.5}}
            data-testid={`${chartId}-scale-header`}
        >
            <Box sx={{display: "flex", alignItems: "center", flexWrap: "wrap", gap: 0.75}}>
                <Chip
                    size="small"
                    color={isLog ? "primary" : "default"}
                    variant={isLog ? "filled" : "outlined"}
                    label={isLog ? t("countsLogBadge") : t("countsLinearBadge")}
                    sx={{fontWeight: 600}}
                />
                <Typography variant="caption" color="text.secondary">
                    {isLog ? t("spectrumScaleHintLog") : t("spectrumScaleHintLinear")}
                </Typography>
            </Box>

            <Stack
                direction="row"
                spacing={0.5}
                role="group"
                aria-label={`${title} — ${t("spectrumScaleControlGroup")}`}
            >
                <Button
                    type="button"
                    size="small"
                    variant={isLog ? "contained" : "outlined"}
                    aria-pressed={isLog}
                    aria-label={`${t("spectrumScaleLog")} — ${title}`}
                    data-testid={`${chartId}-scale-log`}
                    onClick={() => onScaleModeChange("log")}
                    sx={{
                        minBlockSize: "32px",
                        px: 1.5,
                        textTransform: "none",
                        fontWeight: isLog ? 700 : 500,
                        "@media (pointer: coarse)": {
                            minBlockSize: "44px",
                            minInlineSize: "44px",
                        },
                    }}
                >
                    {t("spectrumScaleLog")}
                </Button>
                <Button
                    type="button"
                    size="small"
                    variant={!isLog ? "contained" : "outlined"}
                    aria-pressed={!isLog}
                    aria-label={`${t("spectrumScaleLinear")} — ${title}`}
                    data-testid={`${chartId}-scale-linear`}
                    onClick={() => onScaleModeChange("linear")}
                    sx={{
                        minBlockSize: "32px",
                        px: 1.5,
                        textTransform: "none",
                        fontWeight: !isLog ? 700 : 500,
                        "@media (pointer: coarse)": {
                            minBlockSize: "44px",
                            minInlineSize: "44px",
                        },
                    }}
                >
                    {t("spectrumScaleLinear")}
                </Button>
            </Stack>
        </Stack>
    );
}
