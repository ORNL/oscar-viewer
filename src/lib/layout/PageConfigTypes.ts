/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

/**
 * Schema for opt-in custom dashboard pages hosted under `/dashboards`.
 * Persisted via redux-persist (`pageLayoutSlice`) and exported/imported as JSON files.
 * Lane and system references are stored as plain strings only — never `LaneMapEntry`
 * or live datasource instances.
 */

export const PAGE_CONFIG_SCHEMA_VERSION = 4;

export const MAX_CONFIG_FILE_BYTES = 512 * 1024;
export const MIN_STATS_REFRESH_SEC = 60;
export const MAX_VIDEO_WIDGETS_PER_PAGE = 4;
export const MAX_CHART_WIDGETS_PER_PAGE = 6;

export type WidgetType =
    | 'system-status'
    | 'map'
    | 'event-table'
    | 'adjudication-table'
    | 'video'
    | 'chart'
    | 'national-stats'
    | 'lane-detail-status'
    | 'status-table'
    | 'quick-view'
    | 'alarm-stats'
    | 'state-of-health'
    | 'report-generator'
    | 'alarm-transfer'
    | 'event-details'
    | 'event-lookup'
    | 'rs350-spectrum';

export const WIDGET_INSTANCE_CAPS: Partial<Record<WidgetType, number>> = {
    video: MAX_VIDEO_WIDGETS_PER_PAGE,
    chart: MAX_CHART_WIDGETS_PER_PAGE,
};

export const LAYOUT_BOUNDS = {
    minW: 1,
    maxW: 12,
    minH: 1,
    maxH: 24,
    minX: 0,
    maxXExclusive: 12,
    minY: 0,
    maxY: 1000,
} as const;

export type RGLBreakpoint = 'lg' | 'md' | 'sm';

export const RGL_BREAKPOINTS: Record<RGLBreakpoint, number> = {lg: 1200, md: 900, sm: 0};
export const RGL_COLS: Record<RGLBreakpoint, number> = {lg: 12, md: 8, sm: 4};

/**
 * Row height in pixels (48px grid steps including the 8px margin).
 * Every widget default/min height and starter template fits within `1 <= h <= 24`.
 */
export const RGL_ROW_HEIGHT = 40;

/** RGL-native layout entry; `i` is the `WidgetInstance` id. */
export interface LayoutItem {
    i: string;
    x: number;
    y: number;
    w: number;
    h: number;
    minW?: number;
    minH?: number;
    static?: boolean;
}

/** Lane filter selection for multi-lane widgets. */
export type LaneSelection =
    | { mode: 'all' }
    | { mode: 'include'; lanes: string[] };

/** Lane resolution strategy for single-lane widgets. */
export type LaneSource =
    | { source: 'page' }
    | { source: 'explicit'; lane: string };

export type EventTableColumnKey =
    | 'laneId'
    | 'occupancyCount'
    | 'startTime'
    | 'endTime'
    | 'maxGamma'
    | 'maxNeutron'
    | 'status'
    | 'adjudicatedIds'
    | 'adjudicationCode'
    | 'vehicleId';

export interface EventTableColumnSetting {
    key: EventTableColumnKey;
    visible: boolean;
    /**
     * Explicit column width in pixels after manual resize. When omitted,
     * the column flexes proportionally across available grid width.
     */
    width?: number;
}

export interface EventTableFilters {
    lanes: LaneSelection;
    /** Alarm statuses to include; undefined/empty means all statuses. */
    status?: string[];
    adjudicated?: 'any' | 'yes' | 'no';
    dateRange?: { start?: string; end?: string };
}

export interface SystemStatusWidgetConfig {
    lanes: LaneSelection;
}

export type MapAlarmWindow = 'today' | '1h' | '8h' | '24h';

export interface MapWidgetConfig {
    lanes: LaneSelection;
    /** Live-track mobile detectors (RS-350 backpack / Kromek D5). Default true. */
    showMobileUnits?: boolean;
    /** Breadcrumb trail behind each mobile detector. Default true. */
    showTrail?: boolean;
    /** Trail length in fixes (~1/s). Default 300. */
    trailLength?: number;
    /** Markers where mobile alarms occurred, colored by adjudication. Default true. */
    showAlarmMarkers?: boolean;
    /** Historical mobile-alarm window. Default 'today'. */
    alarmTimeWindow?: MapAlarmWindow;
}

export interface EventTableWidgetConfig {
    /** Column order matches array order. */
    columns: EventTableColumnSetting[];
    filters: EventTableFilters;
}

export type AdjudicationTableWidgetConfig = EventTableWidgetConfig;

export interface VideoWidgetConfig {
    laneSource: LaneSource;
    /** Control stream id when the lane exposes more than one video stream. */
    streamId?: string;
}

export interface ChartWidgetConfig {
    laneSource: LaneSource;
    /** Optional legacy channel selector retained for backward config compatibility. */
    channel?: 'gamma' | 'neutron';
    showThreshold?: boolean;
}

export interface NationalStatsWidgetConfig {
    defaultTimeRange?: string;
}

export interface LaneDetailStatusWidgetConfig {
    laneSource: LaneSource;
}

export interface StatusTableWidgetConfig {
    laneSource: LaneSource;
    defaultView: 'occupancy' | 'fault';
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface QuickViewWidgetConfig {
}

/**
 * Embedded full-view widgets (State of Health, Report Generator, Alarm Transfer,
 * Event Lookup, and Event Details) require no custom configuration object.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface PageViewWidgetConfig {
}

/** Spectroscopic lane view (RS-350 / Kromek D5) for a single selected lane. */
export interface RS350SpectrumWidgetConfig {
    laneSource: LaneSource;
}

export type AlarmStatsVisualization =
    | 'rate-trend'
    | 'adjudication-time'
    | 'lane-comparison'
    | 'lane-stack'
    | 'time-profile';

/** '30d' is offered for time-profile day-of-week comparisons. */
export type AlarmStatsWindow = '1h' | '8h' | '24h' | '7d' | '30d';
export type AlarmStatsBucket = 'auto' | '1m' | '5m' | '15m' | '1h' | '6h' | '1d';
export type LaneCompareMetric =
    | 'occupancies'
    | 'alarms'
    | 'alarmRate'
    | 'adjudicatedPct'
    | 'meanAdjTime';

export const KNOWN_ALARM_STATS_VISUALIZATIONS: readonly AlarmStatsVisualization[] = [
    'rate-trend',
    'adjudication-time',
    'lane-comparison',
    'lane-stack',
    'time-profile',
];

/**
 * Only `visualization` and `lanes` are required; optional fields fall back to
 * safe defaults at read time (`??`). `refreshSec` must be `0` (manual) or `>= 60`.
 */
export interface AlarmStatsWidgetConfig {
    visualization: AlarmStatsVisualization;
    lanes: LaneSelection;
    /** History window seeded over REST. Default '24h'. */
    window?: AlarmStatsWindow;
    /** Bucket width; 'auto' derives from the window. Default 'auto'. */
    bucket?: AlarmStatsBucket;

    // rate-trend
    showOccupancies?: boolean;
    showAlarms?: boolean;
    /** Alarm rate % on a right-hand axis. */
    showAlarmRate?: boolean;
    trendStyle?: 'line' | 'area';

    // adjudication-time
    showAdjMeanTrend?: boolean;

    // lane-comparison
    laneCompareMode?: 'bars' | 'kpis' | 'both';
    laneCompareMetric?: LaneCompareMetric;
    laneCompareTopN?: number;

    // lane-stack (alarms over time, stacked by lane)
    laneStackMetric?: 'alarms' | 'occupancies';
    /** Lanes drawn individually; remaining lanes fold into "Other" (clamped to 7). */
    laneStackTopN?: number;

    // time-profile (hour-of-day / day-of-week)
    profileAxis?: 'hourOfDay' | 'dayOfWeek';
    /** Normalize counts to mean per hour/weekday rather than raw totals. Default true. */
    profileNormalize?: boolean;

    /** Append live occupancies from occupancy streams. Default true. */
    liveAppend?: boolean;
    /** Re-seed cadence in seconds; 0 = manual refresh only, otherwise >= 60. Default 300. */
    refreshSec?: number;
}

export type WidgetConfig =
    | SystemStatusWidgetConfig
    | MapWidgetConfig
    | EventTableWidgetConfig
    | AdjudicationTableWidgetConfig
    | VideoWidgetConfig
    | ChartWidgetConfig
    | NationalStatsWidgetConfig
    | LaneDetailStatusWidgetConfig
    | StatusTableWidgetConfig
    | QuickViewWidgetConfig
    | AlarmStatsWidgetConfig
    | PageViewWidgetConfig
    | RS350SpectrumWidgetConfig;

export interface WidgetInstance {
    /** Unique per page; doubles as the RGL layout key. */
    id: string;
    type: WidgetType;
    /** Optional title override; default title resolves from the widget registry i18n key. */
    title?: string;
    config: WidgetConfig;
}

export type PageLaneContext =
    | { mode: 'global' }
    | { mode: 'fixed'; lane: string };

export interface PageConfig {
    /** Custom dashboard identifier (UUID or template slug). */
    id: string;
    /** Display title for the custom dashboard. */
    title: string;
    /** Key into the curated `PAGE_ICONS` map. */
    icon?: string;
    /** Template identifier used by "Reset to default". */
    templateId?: string;
    /** Show dashboard shortcut in the navigation drawer under Custom Dashboards. */
    showInNav?: boolean;
    /** Page-level lane parameter for widgets configured with `laneSource: {source: 'page'}`. */
    laneContext?: PageLaneContext;
    widgets: WidgetInstance[];
    layouts: Partial<Record<RGLBreakpoint, LayoutItem[]>>;
}

export interface PageLayoutState {
    schemaVersion: number;
    /** Active `(username, viewKey)` scope key for isolating dashboards per operator/view. */
    activeScopeKey?: string;
    /** Custom dashboards for the active scope; array order controls navigation order. */
    pages: PageConfig[];
    /** Per-scope dashboard map (`scopeKey -> PageConfig[]`). */
    profiles?: Record<string, PageConfig[]>;
    /** Retained for backward redux-persist state compatibility. */
    removedSeededPageIds: string[];
    /** Dashboard id currently in edit mode; transient. */
    editModePageId: string | null;
}

/** On-disk JSON file format for export/import. */
export interface ExportedConfig {
    kind: 'oscar-viewer-pages';
    schemaVersion: number;
    exportedAt: string;
    pages: PageConfig[];
}

/**
 * Default/min widget sizes in grid units (lg 12-col basis, 40px rows / 48px steps).
 * Every dimension satisfies `1 <= w <= 12` and `1 <= h <= 24`.
 */
export const WIDGET_SIZES: Record<WidgetType, { defaultSize: { w: number; h: number }; minSize: { w: number; h: number } }> = {
    'system-status': {defaultSize: {w: 8, h: 6}, minSize: {w: 2, h: 3}},
    'map': {defaultSize: {w: 6, h: 10}, minSize: {w: 3, h: 5}},
    'event-table': {defaultSize: {w: 12, h: 10}, minSize: {w: 4, h: 5}},
    'adjudication-table': {defaultSize: {w: 12, h: 10}, minSize: {w: 4, h: 5}},
    'video': {defaultSize: {w: 4, h: 8}, minSize: {w: 2, h: 4}},
    'chart': {defaultSize: {w: 6, h: 6}, minSize: {w: 3, h: 4}},
    'national-stats': {defaultSize: {w: 12, h: 11}, minSize: {w: 6, h: 6}},
    'lane-detail-status': {defaultSize: {w: 12, h: 4}, minSize: {w: 4, h: 3}},
    'status-table': {defaultSize: {w: 12, h: 10}, minSize: {w: 4, h: 5}},
    'quick-view': {defaultSize: {w: 4, h: 16}, minSize: {w: 3, h: 7}},
    'alarm-stats': {defaultSize: {w: 6, h: 8}, minSize: {w: 3, h: 5}},
    'state-of-health': {defaultSize: {w: 12, h: 16}, minSize: {w: 6, h: 7}},
    'report-generator': {defaultSize: {w: 12, h: 18}, minSize: {w: 6, h: 8}},
    'alarm-transfer': {defaultSize: {w: 12, h: 16}, minSize: {w: 4, h: 7}},
    'event-details': {defaultSize: {w: 12, h: 20}, minSize: {w: 6, h: 10}},
    'event-lookup': {defaultSize: {w: 6, h: 4}, minSize: {w: 3, h: 3}},
    'rs350-spectrum': {defaultSize: {w: 12, h: 16}, minSize: {w: 6, h: 7}},
};

/**
 * Exhaustive widget-type list derived directly from `WIDGET_SIZES` so type additions
 * stay synchronized with config validation.
 */
export const KNOWN_WIDGET_TYPES: WidgetType[] = Object.keys(WIDGET_SIZES) as WidgetType[];

/** Default `EventTable` columns in canonical field order and visibility. */
export const DEFAULT_EVENT_TABLE_COLUMNS: EventTableColumnSetting[] = [
    {key: 'laneId', visible: true},
    {key: 'occupancyCount', visible: true},
    {key: 'startTime', visible: true},
    {key: 'endTime', visible: true},
    {key: 'maxGamma', visible: true},
    {key: 'maxNeutron', visible: true},
    {key: 'status', visible: true},
    {key: 'adjudicatedIds', visible: true},
    {key: 'adjudicationCode', visible: false},
    {key: 'vehicleId', visible: false},
];

/** Default alarm-table columns (`adjudicatedIds` off by default to avoid eager row subqueries). */
export const DEFAULT_ALARM_TABLE_COLUMNS: EventTableColumnSetting[] = DEFAULT_EVENT_TABLE_COLUMNS.map((col) =>
    col.key === 'adjudicatedIds' ? {...col, visible: false} : {...col}
);

export const KNOWN_EVENT_TABLE_COLUMN_KEYS: ReadonlySet<string> = new Set(
    DEFAULT_EVENT_TABLE_COLUMNS.map((c) => c.key)
);

/** Build a fresh default config for a newly added widget of the given type. */
export function buildDefaultWidgetConfig(type: WidgetType): WidgetConfig {
    switch (type) {
        case 'system-status':
            return {lanes: {mode: 'all'}};
        case 'map':
            return {
                lanes: {mode: 'all'},
                showMobileUnits: true,
                showTrail: true,
                trailLength: 300,
                showAlarmMarkers: true,
                alarmTimeWindow: 'today',
            };
        case 'event-table':
            return {
                columns: DEFAULT_EVENT_TABLE_COLUMNS.map((c) => ({...c})),
                filters: {lanes: {mode: 'all'}, adjudicated: 'any'},
            };
        case 'adjudication-table':
            return {
                columns: DEFAULT_ALARM_TABLE_COLUMNS.map((c) => ({...c})),
                filters: {lanes: {mode: 'all'}, adjudicated: 'any'},
            };
        case 'video':
            return {laneSource: {source: 'page'}};
        case 'chart':
            return {laneSource: {source: 'page'}};
        case 'national-stats':
            return {};
        case 'lane-detail-status':
            return {laneSource: {source: 'page'}};
        case 'status-table':
            return {laneSource: {source: 'page'}, defaultView: 'occupancy'};
        case 'quick-view':
        case 'state-of-health':
        case 'report-generator':
        case 'alarm-transfer':
        case 'event-details':
        case 'event-lookup':
            return {};
        case 'rs350-spectrum':
            return {laneSource: {source: 'page'}};
        case 'alarm-stats':
            return {
                visualization: 'rate-trend',
                lanes: {mode: 'all'},
                window: '24h',
                bucket: 'auto',
                showOccupancies: true,
                showAlarms: true,
                showAlarmRate: true,
                trendStyle: 'area',
                showAdjMeanTrend: true,
                laneCompareMode: 'both',
                laneCompareMetric: 'alarmRate',
                laneCompareTopN: 15,
                laneStackMetric: 'alarms',
                laneStackTopN: 7,
                profileAxis: 'hourOfDay',
                profileNormalize: true,
                liveAppend: true,
                refreshSec: 300,
            };
    }
}
