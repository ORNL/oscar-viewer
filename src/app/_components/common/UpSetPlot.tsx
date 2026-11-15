"use client";

import React, {useId, useMemo} from "react";
import {Box, Button, Chip, Stack, Typography, useTheme} from "@mui/material";
import {useLanguage} from "@/app/contexts/LanguageContext";
import {
    UpSetCoOccurrencePayload,
    UpSetIntersectionItem,
} from "@/lib/data/oscar/adjudication/IsotopeMapping";

const SNM_HIGHLIGHT_HEX = "#DC2626";

function computeNiceIntegerStep(maxVal: number, intervals: number): number {
    const safeIntervals = Math.max(1, intervals);
    const effectiveMax = Math.max(0, maxVal);
    if (effectiveMax === 0) return 1;
    const rawStep = Math.ceil((effectiveMax * 1.1) / safeIntervals);
    if (rawStep <= 1) return 1;
    const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const norm = rawStep / mag;
    let step: number;
    if (norm <= 1) step = mag;
    else if (norm <= 1.5 && mag >= 10) step = (mag / 10) * 15;
    else if (norm <= 2) step = mag * 2;
    else if (norm <= 2.5 && mag >= 10) step = (mag / 10) * 25;
    else if (norm <= 3 && mag >= 10) step = mag * 3;
    else if (norm <= 5) step = mag * 5;
    else step = mag * 10;
    step = Math.max(1, Math.round(step));
    if (step * safeIntervals <= effectiveMax) {
        return step * 2;
    }
    return step;
}

export interface UpSetPlotProps {
    data: UpSetCoOccurrencePayload | null | undefined;
    title?: string;
    maxIntersections?: number;
    selectedMask?: number | null;
    onSelectIntersection?: (intersection: UpSetIntersectionItem | null) => void;
    testId?: string;
}

/**
 * Accessible vector SVG UpSet intersection chart + paired semantic data table.
 * Models Lex et al. / Python upsetplot with SNM subsets highlighted in crimson (#DC2626)
 * plus a non-color concentric halo ring so SNM alarms remain distinguishable without color alone.
 */
export default function UpSetPlot({
    data,
    title,
    maxIntersections = 16,
    selectedMask = null,
    onSelectIntersection,
    testId = "upset-cooccurrence-plot",
}: UpSetPlotProps) {
    const {t, language} = useLanguage();
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";

    const svgTitleId = useId();
    const svgDescId = useId();
    const tableCaptionId = useId();

    const intFmt = useMemo(() => new Intl.NumberFormat(language || "en-US"), [language]);

    if (!data || !Array.isArray(data.intersections) || data.intersections.length === 0 || data.totalOccupancies <= 0) {
        return null;
    }

    // Order rows bottom-up so the largest set (e.g. Gamma) sits directly above the horizontal Occupancies axis
    const displaySets = [...data.sets].reverse();
    const rowCount = displaySets.length;
    const shownCols = data.intersections.slice(0, Math.max(1, maxIntersections));
    const colCount = shownCols.length;

    const svgWidth = Math.max(680, 290 + colCount * 36);
    const headerH = 26;
    const interPlotH = 132;
    const rowH = 22;
    const matrixH = rowCount * rowH;
    const bottomAxisH = 38;
    const svgHeight = headerH + interPlotH + 14 + matrixH + bottomAxisH;

    const leftCountPad = 48;
    const totalsBarLeftX = leftCountPad;
    const totalsBarW = 124;
    const totalsZeroX = totalsBarLeftX + totalsBarW;
    const labelZoneW = 78;
    const matrixLeftX = totalsZeroX + labelZoneW + 46;
    const matrixRightX = svgWidth - 18;
    const matrixW = Math.max(160, matrixRightX - matrixLeftX);

    const interTopY = headerH + 14;
    const interBaseY = interTopY + interPlotH - 18;
    const barDrawH = interBaseY - interTopY;
    const matrixTopY = interBaseY + 10;
    const matrixBottomY = matrixTopY + matrixH;

    const maxInterCount = Math.max(1, ...shownCols.map((c) => c.count));
    const yIntervals = 4;
    const yStep = computeNiceIntegerStep(maxInterCount, yIntervals);
    const yAxisMax = Math.max(1, yStep * yIntervals);

    const maxSetCount = Math.max(1, ...displaySets.map((s) => s.count));
    const xStep = computeNiceIntegerStep(maxSetCount, 2);
    const xAxisMax = Math.max(1, xStep * 2);

    const slotW = matrixW / Math.max(1, colCount);
    const vBarW = Math.min(22, Math.max(8, slotW * 0.54));
    const dotRadius = Math.min(5.2, Math.max(3.4, slotW * 0.18));
    const inactiveRadius = Math.max(2.6, dotRadius * 0.76);

    const inkPrimary = isDark ? "#F1F5F9" : "#111827";
    const inkSecondary = isDark ? "#CBD5E1" : "#334155";
    const axisStroke = isDark ? "#94A3B8" : "#475569";
    const zebraFill = isDark ? "rgba(148, 163, 184, 0.12)" : "#F1F5F9";
    const inactiveDotFill = isDark ? "rgba(148, 163, 184, 0.32)" : "#CBD5E1";
    const selectedColFill = isDark ? "rgba(56, 189, 248, 0.16)" : "rgba(2, 132, 199, 0.10)";

    const effectiveTitle = title || t("upSetChartTitle");
    const topCombination = shownCols[0];
    const snmSubsetCount = data.intersections
        .filter((i) => i.snmPresent)
        .reduce((acc, i) => acc + i.count, 0);

    return (
        <Box
            component="figure"
            data-testid={testId}
            sx={{
                m: 0,
                p: 2,
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "background.paper",
            }}
        >
            <Stack
                component="figcaption"
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                alignItems={{ xs: "flex-start", sm: "center" }}
                justifyContent="space-between"
                sx={{ mb: 1.5 }}
            >
                <Box>
                    <Typography variant="subtitle1" fontWeight={700}>
                        {effectiveTitle}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {t("upSetChartSummary", {
                            combinations: data.intersections.length,
                            occupancies: intFmt.format(data.totalOccupancies),
                        })}
                    </Typography>
                </Box>
                <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
                    <Stack direction="row" spacing={0.75} alignItems="center">
                        <Box
                            aria-hidden="true"
                            sx={{
                                width: 10,
                                height: 10,
                                borderRadius: "50%",
                                bgcolor: inkPrimary,
                            }}
                        />
                        <Typography variant="caption" color="text.secondary">
                            {t("upSetStandardLegend")}
                        </Typography>
                    </Stack>
                    <Stack direction="row" spacing={0.75} alignItems="center">
                        <Box
                            aria-hidden="true"
                            sx={{
                                width: 12,
                                height: 12,
                                borderRadius: "50%",
                                bgcolor: SNM_HIGHLIGHT_HEX,
                                outline: `2px solid ${SNM_HIGHLIGHT_HEX}`,
                                outlineOffset: "2px",
                            }}
                        />
                        <Typography variant="caption" sx={{ color: SNM_HIGHLIGHT_HEX, fontWeight: 700 }}>
                            {t("upSetSnmLegend")}
                        </Typography>
                    </Stack>
                    {selectedMask != null && onSelectIntersection && (
                        <Chip
                            size="small"
                            color="info"
                            onDelete={() => onSelectIntersection(null)}
                            label={t("upSetActiveSubsetFilter")}
                            data-testid="upset-clear-filter-chip"
                        />
                    )}
                </Stack>
            </Stack>

            <Box sx={{ width: "100%", overflowX: "auto" }}>
                <svg
                    role="img"
                    aria-labelledby={`${svgTitleId} ${svgDescId}`}
                    viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                    style={{
                        width: "100%",
                        minWidth: "620px",
                        height: "auto",
                        display: "block",
                        fontFamily: theme.typography.fontFamily,
                    }}
                >
                    <title id={svgTitleId}>{effectiveTitle}</title>
                    <desc id={svgDescId}>
                        {t("upSetAccessibleDescription", {
                            occupancies: intFmt.format(data.totalOccupancies),
                            topLabel: topCombination?.label ?? "",
                            topCount: intFmt.format(topCombination?.count ?? 0),
                            snmCount: intFmt.format(snmSubsetCount),
                        })}
                    </desc>

                    {/* Top-right vertical Y axis ("Occupancies") */}
                    <line
                        x1={matrixLeftX}
                        y1={interTopY}
                        x2={matrixLeftX}
                        y2={interBaseY}
                        stroke={axisStroke}
                        strokeWidth={1.1}
                    />
                    <line
                        x1={matrixLeftX}
                        y1={interBaseY}
                        x2={matrixRightX}
                        y2={interBaseY}
                        stroke={axisStroke}
                        strokeWidth={1.1}
                    />
                    {Array.from({ length: yIntervals + 1 }, (_, idx) => {
                        const val = idx * yStep;
                        const ty = interBaseY - barDrawH * (val / yAxisMax);
                        return (
                            <g key={`ytick-${val}`}>
                                <line
                                    x1={matrixLeftX - 4}
                                    y1={ty}
                                    x2={matrixLeftX}
                                    y2={ty}
                                    stroke={axisStroke}
                                    strokeWidth={1}
                                />
                                <text
                                    x={matrixLeftX - 7}
                                    y={ty + 3.5}
                                    textAnchor="end"
                                    fontSize="10.5"
                                    fill={inkSecondary}
                                >
                                    {intFmt.format(val)}
                                </text>
                            </g>
                        );
                    })}
                    <text
                        transform={`translate(${matrixLeftX - 36}, ${interTopY + barDrawH / 2}) rotate(-90)`}
                        textAnchor="middle"
                        fontSize="11.5"
                        fill={inkSecondary}
                    >
                        {t("occupancies")}
                    </text>

                    {/* Set rows: zebra bands + right-to-left set totals + set labels */}
                    {displaySets.map((setItem, r) => {
                        const rowTop = matrixTopY + r * rowH;
                        const rowCenterY = rowTop + rowH / 2;
                        const isSnmRow = Boolean(setItem.snm || setItem.name === "SNM");
                        const frac = Math.min(1, setItem.count / xAxisMax);
                        const hBarW = setItem.count > 0 ? Math.max(2.5, frac * totalsBarW) : 0;
                        const hBarH = rowH * 0.56;
                        const barFill = isSnmRow ? SNM_HIGHLIGHT_HEX : inkPrimary;

                        return (
                            <g key={`set-row-${setItem.name}`}>
                                {r % 2 === 0 && (
                                    <rect
                                        x={totalsZeroX + 4}
                                        y={rowTop}
                                        width={matrixRightX - (totalsZeroX + 4)}
                                        height={rowH}
                                        fill={zebraFill}
                                        rx={2}
                                    />
                                )}
                                {hBarW > 0 && (
                                    <rect
                                        x={totalsZeroX - hBarW}
                                        y={rowCenterY - hBarH / 2}
                                        width={hBarW}
                                        height={hBarH}
                                        fill={barFill}
                                        rx={1.5}
                                    />
                                )}
                                <text
                                    x={Math.max(4, totalsZeroX - hBarW - 5)}
                                    y={rowCenterY + 3.8}
                                    textAnchor="end"
                                    fontSize="10.5"
                                    fontWeight={isSnmRow ? 700 : 400}
                                    fill={isSnmRow ? SNM_HIGHLIGHT_HEX : inkSecondary}
                                >
                                    {intFmt.format(setItem.count)}
                                </text>
                                <text
                                    x={totalsZeroX + labelZoneW - 4}
                                    y={rowCenterY + 4}
                                    textAnchor="end"
                                    fontSize="11.5"
                                    fontWeight={isSnmRow ? 700 : 500}
                                    fill={isSnmRow ? SNM_HIGHLIGHT_HEX : inkPrimary}
                                >
                                    {setItem.name}
                                </text>
                            </g>
                        );
                    })}

                    {/* Bottom-left horizontal set-size axis ("Occupancies") */}
                    <line
                        x1={totalsBarLeftX}
                        y1={matrixBottomY}
                        x2={totalsZeroX}
                        y2={matrixBottomY}
                        stroke={axisStroke}
                        strokeWidth={1.1}
                    />
                    <line
                        x1={totalsZeroX}
                        y1={matrixTopY}
                        x2={totalsZeroX}
                        y2={matrixBottomY}
                        stroke={axisStroke}
                        strokeWidth={1.1}
                    />
                    {[0, 1, 2].map((tx) => {
                        const val = tx * xStep;
                        const px = totalsZeroX - totalsBarW * (val / xAxisMax);
                        return (
                            <g key={`xtick-${val}`}>
                                <line
                                    x1={px}
                                    y1={matrixBottomY}
                                    x2={px}
                                    y2={matrixBottomY + 4}
                                    stroke={axisStroke}
                                    strokeWidth={1}
                                />
                                <text
                                    x={px}
                                    y={matrixBottomY + 15}
                                    textAnchor="middle"
                                    fontSize="10"
                                    fill={inkSecondary}
                                >
                                    {intFmt.format(val)}
                                </text>
                            </g>
                        );
                    })}
                    <text
                        x={totalsBarLeftX + totalsBarW / 2}
                        y={matrixBottomY + 30}
                        textAnchor="middle"
                        fontSize="11.5"
                        fill={inkSecondary}
                    >
                        {t("occupancies")}
                    </text>

                    {/* Intersection columns: vertical bars + connected dot matrix */}
                    {shownCols.map((col, c) => {
                        const colCenterX = matrixLeftX + (c + 0.5) * slotW;
                        const activeColor = col.snmPresent ? SNM_HIGHLIGHT_HEX : inkPrimary;
                        const vFrac = Math.min(1, col.count / yAxisMax);
                        const vBarH = col.count > 0 ? Math.max(2.5, vFrac * barDrawH) : 0;
                        const isSelected = selectedMask != null && col.mask === selectedMask;

                        const memberSets = Array.isArray(col.sets)
                            ? col.sets
                            : Array.isArray(col.activeSets)
                                ? col.activeSets
                                : [];
                        let firstActive = -1;
                        let lastActive = -1;
                        const activeRowFlags = displaySets.map((s, r) => {
                            const active = memberSets.includes(s.name);
                            if (active) {
                                if (firstActive < 0) firstActive = r;
                                lastActive = r;
                            }
                            return active;
                        });

                        return (
                            <g
                                key={`inter-col-${col.mask ?? col.label}`}
                                data-testid={`upset-col-${col.label.replace(/\s+\+\s+/g, "-")}`}
                                data-snm={col.snmPresent ? "true" : "false"}
                                style={{ cursor: onSelectIntersection ? "pointer" : "default" }}
                                onClick={
                                    onSelectIntersection
                                        ? () => onSelectIntersection(isSelected ? null : col)
                                        : undefined
                                }
                            >
                                {isSelected && (
                                    <rect
                                        x={colCenterX - slotW / 2 + 1}
                                        y={interTopY - 6}
                                        width={Math.max(8, slotW - 2)}
                                        height={matrixBottomY - interTopY + 8}
                                        fill={selectedColFill}
                                        rx={4}
                                    />
                                )}
                                {vBarH > 0 && (
                                    <rect
                                        x={colCenterX - vBarW / 2}
                                        y={interBaseY - vBarH}
                                        width={vBarW}
                                        height={vBarH}
                                        fill={activeColor}
                                        rx={1.5}
                                    />
                                )}
                                <text
                                    x={colCenterX}
                                    y={interBaseY - vBarH - 5}
                                    textAnchor="middle"
                                    fontSize={colCount > 14 ? "9.5" : "10.5"}
                                    fontWeight={col.snmPresent || isSelected ? 700 : 500}
                                    fill={activeColor}
                                >
                                    {intFmt.format(col.count)}
                                </text>

                                {displaySets.map((s, r) => {
                                    if (activeRowFlags[r]) return null;
                                    const ry = matrixTopY + r * rowH + rowH / 2;
                                    return (
                                        <circle
                                            key={`inactive-${s.name}-${c}`}
                                            cx={colCenterX}
                                            cy={ry}
                                            r={inactiveRadius}
                                            fill={inactiveDotFill}
                                        />
                                    );
                                })}

                                {firstActive >= 0 && lastActive > firstActive && (
                                    <line
                                        x1={colCenterX}
                                        y1={matrixTopY + firstActive * rowH + rowH / 2}
                                        x2={colCenterX}
                                        y2={matrixTopY + lastActive * rowH + rowH / 2}
                                        stroke={activeColor}
                                        strokeWidth={2.4}
                                    />
                                )}

                                {displaySets.map((s, r) => {
                                    if (!activeRowFlags[r]) return null;
                                    const ry = matrixTopY + r * rowH + rowH / 2;
                                    return (
                                        <g key={`active-${s.name}-${c}`}>
                                            <circle
                                                cx={colCenterX}
                                                cy={ry}
                                                r={dotRadius}
                                                fill={activeColor}
                                            />
                                            {col.snmPresent && (
                                                <circle
                                                    cx={colCenterX}
                                                    cy={ry}
                                                    r={dotRadius + 2.4}
                                                    fill="none"
                                                    stroke={SNM_HIGHLIGHT_HEX}
                                                    strokeWidth={1.35}
                                                />
                                            )}
                                        </g>
                                    );
                                })}
                            </g>
                        );
                    })}
                </svg>
            </Box>

            {onSelectIntersection && (
                <Stack
                    role="group"
                    direction="row"
                    spacing={0.75}
                    useFlexGap
                    flexWrap="wrap"
                    sx={{ mt: 1 }}
                    aria-label={t("upSetFilterButtonsLabel")}
                >
                    {shownCols.map((col) => {
                        const isSelected = selectedMask != null && col.mask === selectedMask;
                        return (
                            <Button
                                key={`subset-btn-${col.mask ?? col.label}`}
                                type="button"
                                size="small"
                                variant={isSelected ? "contained" : "outlined"}
                                color={col.snmPresent ? "error" : "primary"}
                                aria-pressed={isSelected}
                                onClick={() => onSelectIntersection(isSelected ? null : col)}
                                sx={{
                                    minBlockSize: "36px",
                                    "@media (pointer: coarse)": { minBlockSize: "44px" },
                                    textTransform: "none",
                                    fontSize: "0.75rem",
                                }}
                            >
                                {`${col.label} (${intFmt.format(col.count)})`}
                            </Button>
                        );
                    })}
                </Stack>
            )}

            {/* Paired accessible semantic data table for screen readers and keyboard inspection */}
            <Box
                component="details"
                data-testid="upset-accessible-table-details"
                sx={{
                    mt: 1.5,
                    "& > summary": {
                        cursor: "pointer",
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        color: "text.secondary",
                        py: 0.5,
                        userSelect: "none",
                    },
                }}
            >
                <summary>{t("upSetTableToggle")}</summary>
                <Box
                    sx={{
                        mt: 1,
                        overflowX: "auto",
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 1.5,
                        "& table": {
                            inlineSize: "100%",
                            borderCollapse: "collapse",
                            fontSize: "0.8125rem",
                        },
                        "& caption": {
                            textAlign: "start",
                            fontWeight: 600,
                            p: 1,
                            borderBlockEnd: "1px solid",
                            borderColor: "divider",
                        },
                        "& th, & td": {
                            p: 0.875,
                            textAlign: "start",
                            borderBlockEnd: "1px solid",
                            borderColor: "divider",
                        },
                        "& thead th": {
                            bgcolor: "action.hover",
                            fontWeight: 700,
                        },
                    }}
                >
                    <table>
                        <caption id={tableCaptionId}>
                            {t("upSetTableCaption", {
                                count: data.intersections.length,
                                occupancies: intFmt.format(data.totalOccupancies),
                            })}
                        </caption>
                        <thead>
                            <tr>
                                <th scope="col">{t("upSetColumnCombination")}</th>
                                <th scope="col">{t("occupancies")}</th>
                                <th scope="col">{t("upSetColumnShare")}</th>
                                <th scope="col">{t("upSetColumnSnm")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.intersections.map((inter) => {
                                const share = inter.percentPct != null
                                    ? inter.percentPct
                                    : Math.round((inter.count / Math.max(1, data.totalOccupancies)) * 10000) / 100;
                                return (
                                    <tr key={`row-${inter.mask ?? inter.label}`}>
                                        <th scope="row">{inter.label}</th>
                                        <td>{intFmt.format(inter.count)}</td>
                                        <td>{`${share.toFixed(2)}%`}</td>
                                        <td>{inter.snmPresent ? t("yes") : t("no")}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </Box>
            </Box>
        </Box>
    );
}
