/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

/**
 * Colorblind-safe categorical palette for multi-series alarm-stats charts.
 * Series past the eighth slot fold into `OTHER_COLOR`.
 */
export const CATEGORICAL_LIGHT = [
    '#2a78d6',
    '#eb6834',
    '#1baf7a',
    '#eda100',
    '#e87ba4',
    '#008300',
    '#4a3aa7',
    '#e34948',
];

export const CATEGORICAL_DARK = [
    '#3987e5',
    '#d95926',
    '#199e70',
    '#c98500',
    '#d55181',
    '#008300',
    '#9085e9',
    '#e66767',
];

export const OTHER_COLOR = '#898781';

export const MAX_LANE_SERIES = 7;

export function categoricalPalette(mode: 'light' | 'dark'): string[] {
    return mode === 'dark' ? CATEGORICAL_DARK : CATEGORICAL_LIGHT;
}

/** Deterministic lane-to-color mapping keyed by alphabetical lane order. */
export function buildLaneColorMap(allLaneIds: string[], mode: 'light' | 'dark'): Map<string, string> {
    const palette = categoricalPalette(mode);
    const ordered = [...allLaneIds].sort((a, b) => a.localeCompare(b, undefined, {numeric: true}));
    const map = new Map<string, string>();
    ordered.forEach((laneId, i) => {
        map.set(laneId, i < palette.length ? palette[i] : OTHER_COLOR);
    });
    return map;
}
