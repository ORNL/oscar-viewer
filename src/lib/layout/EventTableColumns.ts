/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import {
    DEFAULT_EVENT_TABLE_COLUMNS,
    EventTableColumnSetting,
} from "./PageConfigTypes";

/**
 * Shared column-settings helpers for custom dashboard event and alarm tables.
 *
 * `EventTableWidgetConfig.columns` persists both column order (array position)
 * and visibility (`visible` flag). The config dialog, widget persistence
 * callback, and DataGrid column controls share these helpers to stay consistent.
 */

/**
 * Merge a saved widget column array with `DEFAULT_EVENT_TABLE_COLUMNS`:
 * obsolete column keys are dropped and newly introduced keys are appended
 * at their default visibility.
 */
export function resolveEventTableColumns(
    saved?: EventTableColumnSetting[],
): EventTableColumnSetting[] {
    const known = new Set<string>(DEFAULT_EVENT_TABLE_COLUMNS.map((c) => c.key));
    const base = (saved?.length ? saved : DEFAULT_EVENT_TABLE_COLUMNS).filter((c) => known.has(c.key));
    const seen = new Set<string>(base.map((c) => c.key));
    return [
        ...base.map((c) => ({...c})),
        ...DEFAULT_EVENT_TABLE_COLUMNS.filter((c) => !seen.has(c.key)).map((c) => ({...c})),
    ];
}

/** DataGrid visibility model derived from column settings. */
export function visibilityFromColumnSettings(settings: EventTableColumnSetting[]): Record<string, boolean> {
    return Object.fromEntries(resolveEventTableColumns(settings).map((c) => [c.key, c.visible]));
}

/**
 * Reorder (and size) grid column definitions by saved settings. Columns omitted
 * from settings (such as the row-action menu) remain at the end.
 */
export function applyColumnSettings<C extends {field: string; width?: number; flex?: number}>(
    columns: C[],
    settings: EventTableColumnSetting[],
): C[] {
    const byKey = new Map(settings.map((s, index) => [s.key as string, {s, index}]));
    const known = columns
        .filter((c) => byKey.has(c.field))
        .sort((a, b) => byKey.get(a.field)!.index - byKey.get(b.field)!.index)
        .map((c) => {
            const width = byKey.get(c.field)!.s.width;
            return width ? {...c, width, flex: undefined} : c;
        });
    return [...known, ...columns.filter((c) => !byKey.has(c.field))];
}

export function applyFieldOrder(
    settings: EventTableColumnSetting[],
    fields: string[],
): EventTableColumnSetting[] {
    const byKey = new Map<string, EventTableColumnSetting>(
        settings.map((s) => [s.key as string, s])
    );
    const queue = fields
        .map((f) => byKey.get(f))
        .filter((s): s is EventTableColumnSetting => s !== undefined);
    const moving = new Set<string>(queue.map((s) => s.key));
    let next = 0;
    return settings.map((s) => (moving.has(s.key) ? queue[next++] : s));
}

/** i18n keys for column labels matching `EventTable` headers. */
export const COLUMN_LABEL_KEYS: Record<string, string> = {
    laneId: 'laneId',
    occupancyCount: 'occupancyId',
    startTime: 'startTime',
    endTime: 'endTime',
    maxGamma: 'maxGamma',
    maxNeutron: 'maxNeutron',
    status: 'status',
    adjudicatedIds: 'adjudicated',
    adjudicationCode: 'adjudicationCode',
    vehicleId: 'vehicleId',
};
