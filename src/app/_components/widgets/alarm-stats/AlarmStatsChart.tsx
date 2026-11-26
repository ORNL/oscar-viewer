"use client";

/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import React, {useEffect, useRef} from "react";
import Chart from "chart.js/auto";
import {Box} from "@mui/material";

interface Props {
    /** Full Chart.js config (`{type, data, options}`) from `chartSpecs`. */
    spec: any;
}

/**
 * Canvas host for `AlarmStatsWidget` charts: manages Chart.js lifecycle,
 * ResizeObserver reflow inside `react-grid-layout`, and in-place data updates.
 */
export default function AlarmStatsChart({spec}: Props) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const chartRef = useRef<Chart | null>(null);
    const typeRef = useRef<string | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !spec) return;

        if (chartRef.current && typeRef.current === spec.type) {
            const chart = chartRef.current;
            chart.data = spec.data;
            chart.options = spec.options;
            chart.update('none');
            return;
        }

        chartRef.current?.destroy();
        chartRef.current = new Chart(canvas, spec);
        typeRef.current = spec.type;
    }, [spec]);

    useEffect(() => () => {
        chartRef.current?.destroy();
        chartRef.current = null;
    }, []);

    useEffect(() => {
        const el = containerRef.current;
        if (!el || typeof ResizeObserver === 'undefined') return;
        const ro = new ResizeObserver(() => chartRef.current?.resize());
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    return (
        <Box ref={containerRef} sx={{flex: 1, minHeight: 0, minWidth: 0, position: 'relative', width: '100%'}}>
            <canvas ref={canvasRef}/>
        </Box>
    );
}
