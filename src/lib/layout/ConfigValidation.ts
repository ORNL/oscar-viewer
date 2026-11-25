/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import {
    AlarmStatsVisualization,
    ExportedConfig,
    KNOWN_ALARM_STATS_VISUALIZATIONS,
    KNOWN_WIDGET_TYPES,
    LAYOUT_BOUNDS,
    LayoutItem,
    LaneSelection,
    LaneSource,
    MAX_CHART_WIDGETS_PER_PAGE,
    MAX_CONFIG_FILE_BYTES,
    MAX_VIDEO_WIDGETS_PER_PAGE,
    MIN_STATS_REFRESH_SEC,
    PAGE_CONFIG_SCHEMA_VERSION,
    PageConfig,
    PageLayoutState,
    WidgetType,
} from './PageConfigTypes';
import {LEGACY_SEEDED_TITLES} from './DefaultPages';

export type ValidationResult =
    | { ok: true; value: ExportedConfig }
    | { ok: false; errors: string[] };

function isObject(v: unknown): v is Record<string, any> {
    return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isFiniteNumber(v: unknown): v is number {
    return typeof v === 'number' && Number.isFinite(v);
}

export function validateLaneSelection(raw: unknown, where: string, errors: string[]): raw is LaneSelection {
    if (!isObject(raw) || typeof raw.mode !== 'string') {
        errors.push(`${where}: invalid lane selection`);
        return false;
    }
    if (raw.mode === 'all') {
        return true;
    }
    if (raw.mode === 'include') {
        if (!Array.isArray(raw.lanes) || !raw.lanes.every((lane: unknown) => typeof lane === 'string')) {
            errors.push(`${where}: lane selection 'include' requires string[] 'lanes'`);
            return false;
        }
        return true;
    }
    errors.push(`${where}: unsupported lane selection mode '${raw.mode}'`);
    return false;
}

export function validateLaneSource(raw: unknown, where: string, errors: string[]): raw is LaneSource {
    if (!isObject(raw) || typeof raw.source !== 'string') {
        errors.push(`${where}: invalid laneSource`);
        return false;
    }
    if (raw.source === 'page') {
        return true;
    }
    if (raw.source === 'explicit') {
        if (typeof raw.lane !== 'string') {
            errors.push(`${where}: explicit laneSource requires string 'lane'`);
            return false;
        }
        return true;
    }
    errors.push(`${where}: unsupported laneSource '${raw.source}'`);
    return false;
}

function validateColumnSettings(raw: unknown, where: string, errors: string[]): boolean {
    if (!Array.isArray(raw)) {
        errors.push(`${where}: 'columns' must be an array`);
        return false;
    }
    for (const col of raw) {
        if (!isObject(col) || typeof col.key !== 'string' || typeof col.visible !== 'boolean') {
            errors.push(`${where}: malformed column setting entry`);
            return false;
        }
        if (col.width !== undefined && (!isFiniteNumber(col.width) || col.width <= 0)) {
            errors.push(`${where}: column '${col.key}' has invalid width`);
            return false;
        }
    }
    return true;
}

function validateWidgetSpecificConfig(
    type: WidgetType,
    config: Record<string, any>,
    where: string,
    errors: string[]
): boolean {
    switch (type) {
        case 'system-status':
        case 'map':
            return validateLaneSelection(config.lanes, where, errors);
        case 'event-table':
        case 'adjudication-table': {
            const colsOk = validateColumnSettings(config.columns, where, errors);
            if (!isObject(config.filters)) {
                errors.push(`${where}: missing 'filters' object`);
                return false;
            }
            const lanesOk = validateLaneSelection(config.filters.lanes, `${where}.filters`, errors);
            return colsOk && lanesOk;
        }
        case 'video':
        case 'chart':
        case 'lane-detail-status':
        case 'rs350-spectrum':
            return validateLaneSource(config.laneSource, where, errors);
        case 'status-table': {
            const laneOk = validateLaneSource(config.laneSource, where, errors);
            if (config.defaultView !== 'occupancy' && config.defaultView !== 'fault') {
                errors.push(`${where}: status-table defaultView must be 'occupancy' or 'fault'`);
                return false;
            }
            return laneOk;
        }
        case 'alarm-stats': {
            if (
                typeof config.visualization !== 'string' ||
                !KNOWN_ALARM_STATS_VISUALIZATIONS.includes(config.visualization as AlarmStatsVisualization)
            ) {
                errors.push(`${where}: invalid alarm-stats visualization '${String(config.visualization)}'`);
                return false;
            }
            const lanesOk = validateLaneSelection(config.lanes, where, errors);
            if (config.refreshSec !== undefined) {
                if (
                    !isFiniteNumber(config.refreshSec) ||
                    (config.refreshSec !== 0 && config.refreshSec < MIN_STATS_REFRESH_SEC)
                ) {
                    errors.push(
                        `${where}: refreshSec must be 0 (manual) or >= ${MIN_STATS_REFRESH_SEC} seconds`
                    );
                    return false;
                }
            }
            return lanesOk;
        }
        case 'national-stats':
        case 'quick-view':
        case 'state-of-health':
        case 'report-generator':
        case 'alarm-transfer':
        case 'event-details':
        case 'event-lookup':
            return true;
    }
}

export function validateLayoutItem(raw: unknown, where: string, errors: string[]): raw is LayoutItem {
    if (!isObject(raw)) {
        errors.push(`${where}: layout entry is not an object`);
        return false;
    }
    if (typeof raw.i !== 'string' || raw.i.length === 0) {
        errors.push(`${where}: layout entry is missing widget id 'i'`);
        return false;
    }
    for (const k of ['x', 'y', 'w', 'h'] as const) {
        if (!isFiniteNumber(raw[k])) {
            errors.push(`${where}: layout entry '${raw.i}' has non-numeric '${k}'`);
            return false;
        }
    }
    if (raw.w < LAYOUT_BOUNDS.minW || raw.w > LAYOUT_BOUNDS.maxW) {
        errors.push(
            `${where}: layout entry '${raw.i}' width w=${raw.w} outside [${LAYOUT_BOUNDS.minW}, ${LAYOUT_BOUNDS.maxW}]`
        );
        return false;
    }
    if (raw.h < LAYOUT_BOUNDS.minH || raw.h > LAYOUT_BOUNDS.maxH) {
        errors.push(
            `${where}: layout entry '${raw.i}' height h=${raw.h} outside [${LAYOUT_BOUNDS.minH}, ${LAYOUT_BOUNDS.maxH}]`
        );
        return false;
    }
    if (raw.x < LAYOUT_BOUNDS.minX || raw.x >= LAYOUT_BOUNDS.maxXExclusive) {
        errors.push(
            `${where}: layout entry '${raw.i}' x=${raw.x} outside [${LAYOUT_BOUNDS.minX}, ${LAYOUT_BOUNDS.maxXExclusive - 1}]`
        );
        return false;
    }
    if (raw.y < LAYOUT_BOUNDS.minY || raw.y > LAYOUT_BOUNDS.maxY) {
        errors.push(
            `${where}: layout entry '${raw.i}' y=${raw.y} outside [${LAYOUT_BOUNDS.minY}, ${LAYOUT_BOUNDS.maxY}]`
        );
        return false;
    }
    return true;
}

export function validatePageConfig(raw: unknown, where: string, errors: string[]): raw is PageConfig {
    if (!isObject(raw)) {
        errors.push(`${where}: page is not an object`);
        return false;
    }
    if (typeof raw.id !== 'string' || raw.id.length === 0) {
        errors.push(`${where}: page is missing 'id'`);
        return false;
    }
    if (typeof raw.title !== 'string' || raw.title.length === 0) {
        errors.push(`${where} (${raw.id}): page is missing 'title'`);
        return false;
    }
    if (!Array.isArray(raw.widgets)) {
        errors.push(`${where} (${raw.id}): 'widgets' is not an array`);
        return false;
    }

    let videoCount = 0;
    let chartCount = 0;

    for (const w of raw.widgets) {
        if (!isObject(w) || typeof w.id !== 'string' || w.id.length === 0 || typeof w.type !== 'string') {
            errors.push(`${where} (${raw.id}): widget entry malformed`);
            return false;
        }
        if (!KNOWN_WIDGET_TYPES.includes(w.type as WidgetType)) {
            errors.push(`${where} (${raw.id}): unknown widget type '${w.type}'`);
            return false;
        }
        if (!isObject(w.config)) {
            errors.push(`${where} (${raw.id}): widget '${w.id}' is missing 'config'`);
            return false;
        }
        if (w.type === 'video') videoCount += 1;
        if (w.type === 'chart') chartCount += 1;

        if (!validateWidgetSpecificConfig(w.type as WidgetType, w.config, `${where} (${raw.id}) widget '${w.id}'`, errors)) {
            return false;
        }
    }

    if (videoCount > MAX_VIDEO_WIDGETS_PER_PAGE) {
        errors.push(
            `${where} (${raw.id}): page contains ${videoCount} video widgets (maximum ${MAX_VIDEO_WIDGETS_PER_PAGE})`
        );
        return false;
    }
    if (chartCount > MAX_CHART_WIDGETS_PER_PAGE) {
        errors.push(
            `${where} (${raw.id}): page contains ${chartCount} chart widgets (maximum ${MAX_CHART_WIDGETS_PER_PAGE})`
        );
        return false;
    }

    if (raw.laneContext !== undefined) {
        if (
            !isObject(raw.laneContext) ||
            (raw.laneContext.mode !== 'global' &&
                !(raw.laneContext.mode === 'fixed' && typeof raw.laneContext.lane === 'string'))
        ) {
            errors.push(`${where} (${raw.id}): invalid 'laneContext'`);
            return false;
        }
    }

    if (!isObject(raw.layouts)) {
        errors.push(`${where} (${raw.id}): 'layouts' is not an object`);
        return false;
    }
    for (const [bp, items] of Object.entries(raw.layouts)) {
        if (!['lg', 'md', 'sm'].includes(bp)) continue;
        if (!Array.isArray(items)) {
            errors.push(`${where} (${raw.id}): layouts.${bp} is not an array`);
            return false;
        }
        for (const it of items) {
            if (!validateLayoutItem(it, `${where} (${raw.id}) layouts.${bp}`, errors)) return false;
        }
    }
    return true;
}

/**
 * Strip any route-hijacking fields (`mainRoute`, `seededRoute`, `mainPageRedirect`,
 * `redirectMainPage`) so imported or persisted pages can never override canonical routes.
 */
export function sanitizePageConfig(
    page: PageConfig & { seededRoute?: unknown; mainRoute?: unknown }
): PageConfig {
    const legacySeeded = typeof page.seededRoute === 'string' && page.seededRoute.length > 0;
    const cleanedLayouts: PageConfig['layouts'] = {};
    for (const bp of ['lg', 'md', 'sm'] as const) {
        const items = page.layouts?.[bp];
        if (Array.isArray(items)) {
            cleanedLayouts[bp] = items.map(({i, x, y, w, h}) => ({i, x, y, w, h}));
        }
    }
    return {
        id: page.id,
        title: legacySeeded ? (LEGACY_SEEDED_TITLES[page.title] ?? page.title) : page.title,
        ...(typeof page.icon === 'string' ? {icon: page.icon} : {}),
        ...(typeof page.templateId === 'string'
            ? {templateId: page.templateId}
            : legacySeeded
              ? {templateId: page.id}
              : {}),
        showInNav: page.showInNav !== false,
        ...(page.laneContext ? {laneContext: page.laneContext} : {}),
        widgets: page.widgets.map((w) => ({
            id: w.id,
            type: w.type,
            ...(typeof w.title === 'string' ? {title: w.title} : {}),
            config: w.config,
        })),
        layouts: cleanedLayouts,
    };
}

/** Validate raw JSON text against the 512 KiB limit and exported config schema. */
export function validateConfigJsonText(rawText: string): ValidationResult {
    const byteLength = new TextEncoder().encode(rawText).byteLength;
    if (byteLength > MAX_CONFIG_FILE_BYTES) {
        return {
            ok: false,
            errors: [`Configuration file exceeds maximum size of ${MAX_CONFIG_FILE_BYTES / 1024} KiB`],
        };
    }
    try {
        const parsed = JSON.parse(rawText);
        return validateExportedConfig(parsed);
    } catch {
        return {ok: false, errors: ['File is not valid JSON']};
    }
}

/** Validate a parsed JSON export payload. */
export function validateExportedConfig(raw: unknown): ValidationResult {
    const errors: string[] = [];
    if (!isObject(raw)) {
        return {ok: false, errors: ['File is not a JSON object']};
    }
    if (raw.kind !== 'oscar-viewer-pages') {
        return {ok: false, errors: [`Unrecognized file kind '${String(raw.kind)}' (expected 'oscar-viewer-pages')`]};
    }
    if (!isFiniteNumber(raw.schemaVersion) || raw.schemaVersion < 1) {
        return {ok: false, errors: ['Missing or invalid schemaVersion']};
    }
    if (raw.schemaVersion > PAGE_CONFIG_SCHEMA_VERSION) {
        return {
            ok: false,
            errors: [`File schemaVersion ${raw.schemaVersion} is newer than supported (${PAGE_CONFIG_SCHEMA_VERSION})`],
        };
    }
    if (!Array.isArray(raw.pages) || raw.pages.length === 0) {
        return {ok: false, errors: ['File contains no pages']};
    }
    raw.pages.forEach((p: unknown, idx: number) => validatePageConfig(p, `pages[${idx}]`, errors));
    if (errors.length > 0) return {ok: false, errors};

    const migratedPages = migratePages(raw.pages as PageConfig[], raw.schemaVersion);
    return {
        ok: true,
        value: {
            kind: 'oscar-viewer-pages',
            schemaVersion: PAGE_CONFIG_SCHEMA_VERSION,
            exportedAt: typeof raw.exportedAt === 'string' ? raw.exportedAt : new Date().toISOString(),
            pages: migratedPages,
        },
    };
}

/**
 * Normalize validated pages to the current schema version and strip any legacy
 * route-hijack properties.
 */
export function migratePages(pages: PageConfig[], _fromVersion: number): PageConfig[] {
    return pages.map((page) => sanitizePageConfig(page as PageConfig & Record<string, unknown>));
}

function normalizePersistedLegacyHeights(rawPage: unknown, fromVersion: number): unknown {
    if ((fromVersion !== 2 && fromVersion !== 3) || !isObject(rawPage) || !isObject(rawPage.layouts)) {
        return rawPage;
    }
    const scaledLayouts: Record<string, unknown> = {};
    for (const [bp, items] of Object.entries(rawPage.layouts)) {
        if (!Array.isArray(items)) {
            scaledLayouts[bp] = items;
            continue;
        }
        scaledLayouts[bp] = items.map((it) => {
            if (!isObject(it) || !isFiniteNumber(it.h) || !isFiniteNumber(it.y)) return it;
            return {
                ...it,
                y: Math.max(0, Math.min(LAYOUT_BOUNDS.maxY, Math.round(it.y / 3))),
                h: Math.max(LAYOUT_BOUNDS.minH, Math.min(LAYOUT_BOUNDS.maxH, Math.round(it.h / 3))),
            };
        });
    }
    return {...rawPage, layouts: scaledLayouts};
}

function sanitizePersistedPageArray(rawPages: unknown[], fromVersion: number, label: string): PageConfig[] {
    const errors: string[] = [];
    const valid: PageConfig[] = [];
    rawPages.forEach((rawPage, idx) => {
        const normalized = normalizePersistedLegacyHeights(rawPage, fromVersion);
        const pageErrors: string[] = [];
        if (validatePageConfig(normalized, `${label}[${idx}]`, pageErrors)) {
            valid.push(sanitizePageConfig(normalized as PageConfig & Record<string, unknown>));
        } else {
            errors.push(...pageErrors);
        }
    });
    if (errors.length > 0) {
        console.warn('[pageLayout] dropped invalid persisted pages:', errors);
    }
    return valid;
}

/**
 * Sanitize and migrate persisted `pageLayoutSlice` state on `REHYDRATE`.
 * Malformed pages or widgets are dropped rather than crashing startup, and
 * per-user/view `profiles` are validated independently.
 */
export function rehydratePageLayoutState(inbound: unknown): PageLayoutState {
    const fallback: PageLayoutState = {
        schemaVersion: PAGE_CONFIG_SCHEMA_VERSION,
        activeScopeKey: 'default|__all__',
        pages: [],
        profiles: {},
        removedSeededPageIds: [],
        editModePageId: null,
    };
    if (!isObject(inbound)) return fallback;

    const fromVersion = isFiniteNumber(inbound.schemaVersion) ? inbound.schemaVersion : 1;
    const activeScopeKey =
        typeof inbound.activeScopeKey === 'string' && inbound.activeScopeKey.length > 0
            ? inbound.activeScopeKey
            : 'default|__all__';

    const profiles: Record<string, PageConfig[]> = {};
    if (isObject(inbound.profiles)) {
        for (const [scopeKey, rawList] of Object.entries(inbound.profiles)) {
            if (Array.isArray(rawList)) {
                profiles[scopeKey] = sanitizePersistedPageArray(rawList, fromVersion, `profiles[${scopeKey}]`);
            }
        }
    }

    const activePages = Array.isArray(inbound.pages)
        ? sanitizePersistedPageArray(inbound.pages, fromVersion, 'persisted pages')
        : (profiles[activeScopeKey] ?? []);

    if (!(activeScopeKey in profiles) && activePages.length > 0) {
        profiles[activeScopeKey] = activePages;
    }

    return {
        schemaVersion: PAGE_CONFIG_SCHEMA_VERSION,
        activeScopeKey,
        pages: profiles[activeScopeKey] ?? activePages,
        profiles,
        removedSeededPageIds: [],
        editModePageId: null,
    };
}
