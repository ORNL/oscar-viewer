/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import {
    buildDefaultWidgetConfig,
    DEFAULT_ALARM_TABLE_COLUMNS,
    DEFAULT_EVENT_TABLE_COLUMNS,
    LayoutItem,
    PageConfig,
    RGL_COLS,
    RGLBreakpoint,
    WIDGET_SIZES,
    WidgetInstance,
    WidgetType,
} from './PageConfigTypes';

function widget(id: string, type: WidgetType, config: WidgetInstance['config']): WidgetInstance {
    return {id, type, config};
}

function item(i: string, type: WidgetType, x: number, y: number, w: number, h: number): LayoutItem {
    const {minSize} = WIDGET_SIZES[type];
    return {i, x, y, w, h, minW: minSize.w, minH: minSize.h};
}

/**
 * Stack widgets vertically full-width for narrower breakpoints while keeping
 * each widget's `lg` row height (`1 <= h <= 24`).
 */
function stacked(bp: RGLBreakpoint, entries: { i: string; type: WidgetType; h: number }[]): LayoutItem[] {
    const cols = RGL_COLS[bp];
    let y = 0;
    return entries.map((e) => {
        const it = item(e.i, e.type, 0, y, cols, e.h);
        y += e.h;
        return it;
    });
}

export interface StarterTemplateMeta {
    id: PageTemplateId;
    titleKey: string;
    descriptionKey: string;
    icon: string;
}

/**
 * Starter templates offered in the Custom Dashboards workspace (`/dashboards`)
 * and in the Add Page dialog. Canonical ORNL routes remain untouched; templates
 * only initialize opt-in custom dashboard pages.
 */
function buildTemplatePages(): PageConfig[] {
    // --- Multi-Lane Wallboard (4 video + 4 chart + lane status strip, within caps) ---
    const wallStatus = widget('wallboard-system-status', 'system-status', {lanes: {mode: 'all'}});
    const wallVideos = [1, 2, 3, 4].map((idx) =>
        widget(`wallboard-video-${idx}`, 'video', {laneSource: {source: 'page'}})
    );
    const wallCharts = [1, 2, 3, 4].map((idx) =>
        widget(`wallboard-chart-${idx}`, 'chart', {laneSource: {source: 'page'}})
    );
    const multiLaneWallboard: PageConfig = {
        id: 'multi-lane-wallboard',
        title: 'multiLaneWallboard',
        icon: 'video',
        showInNav: true,
        laneContext: {mode: 'global'},
        widgets: [wallStatus, ...wallVideos, ...wallCharts],
        layouts: {
            lg: [
                item(wallStatus.id, 'system-status', 0, 0, 12, 5),
                ...wallVideos.map((v, idx) => item(v.id, 'video', idx * 3, 5, 3, 7)),
                ...wallCharts.map((c, idx) => item(c.id, 'chart', idx * 3, 12, 3, 6)),
            ],
            md: stacked('md', [
                {i: wallStatus.id, type: 'system-status', h: 5},
                ...wallVideos.map((v) => ({i: v.id, type: 'video' as WidgetType, h: 7})),
                ...wallCharts.map((c) => ({i: c.id, type: 'chart' as WidgetType, h: 6})),
            ]),
            sm: stacked('sm', [
                {i: wallStatus.id, type: 'system-status', h: 5},
                ...wallVideos.map((v) => ({i: v.id, type: 'video' as WidgetType, h: 6})),
                ...wallCharts.map((c) => ({i: c.id, type: 'chart' as WidgetType, h: 6})),
            ]),
        },
    };

    // --- Alarm & Map Overview (status + live map + quick view + alarm table) ---
    const overviewStatus = widget('overview-system-status', 'system-status', {lanes: {mode: 'all'}});
    const overviewMap = widget('overview-map', 'map', buildDefaultWidgetConfig('map'));
    const overviewQuickView = widget('overview-quick-view', 'quick-view', {});
    const overviewAlarms = widget('overview-alarm-table', 'adjudication-table', {
        columns: DEFAULT_ALARM_TABLE_COLUMNS.map((c) => ({...c})),
        filters: {lanes: {mode: 'all'}, adjudicated: 'any'},
    });
    const alarmMapOverview: PageConfig = {
        id: 'alarm-map-overview',
        title: 'alarmMapOverview',
        icon: 'map',
        showInNav: true,
        widgets: [overviewStatus, overviewMap, overviewQuickView, overviewAlarms],
        layouts: {
            lg: [
                item(overviewStatus.id, 'system-status', 0, 0, 8, 5),
                item(overviewMap.id, 'map', 0, 5, 8, 9),
                item(overviewQuickView.id, 'quick-view', 8, 0, 4, 14),
                item(overviewAlarms.id, 'adjudication-table', 0, 14, 12, 10),
            ],
            md: stacked('md', [
                {i: overviewStatus.id, type: 'system-status', h: 5},
                {i: overviewMap.id, type: 'map', h: 9},
                {i: overviewQuickView.id, type: 'quick-view', h: 12},
                {i: overviewAlarms.id, type: 'adjudication-table', h: 10},
            ]),
            sm: stacked('sm', [
                {i: overviewStatus.id, type: 'system-status', h: 5},
                {i: overviewMap.id, type: 'map', h: 8},
                {i: overviewQuickView.id, type: 'quick-view', h: 12},
                {i: overviewAlarms.id, type: 'adjudication-table', h: 10},
            ]),
        },
    };

    // --- Statistics Overview (4 alarm-stats cards at 300s cadence) ---
    const baseStats = buildDefaultWidgetConfig('alarm-stats');
    const statsRate = widget('stats-rate-trend', 'alarm-stats', {
        ...(baseStats as Record<string, unknown>),
        visualization: 'rate-trend',
        lanes: {mode: 'all'},
        refreshSec: 300,
    } as WidgetInstance['config']);
    const statsCompare = widget('stats-lane-comparison', 'alarm-stats', {
        ...(baseStats as Record<string, unknown>),
        visualization: 'lane-comparison',
        lanes: {mode: 'all'},
        refreshSec: 300,
    } as WidgetInstance['config']);
    const statsAdjTime = widget('stats-adjudication-time', 'alarm-stats', {
        ...(baseStats as Record<string, unknown>),
        visualization: 'adjudication-time',
        lanes: {mode: 'all'},
        refreshSec: 300,
    } as WidgetInstance['config']);
    const statsProfile = widget('stats-time-profile', 'alarm-stats', {
        ...(baseStats as Record<string, unknown>),
        visualization: 'time-profile',
        lanes: {mode: 'all'},
        refreshSec: 300,
    } as WidgetInstance['config']);
    const statisticsOverview: PageConfig = {
        id: 'statistics-overview',
        title: 'statisticsOverview',
        icon: 'chart',
        showInNav: true,
        widgets: [statsRate, statsCompare, statsAdjTime, statsProfile],
        layouts: {
            lg: [
                item(statsRate.id, 'alarm-stats', 0, 0, 6, 8),
                item(statsCompare.id, 'alarm-stats', 6, 0, 6, 8),
                item(statsAdjTime.id, 'alarm-stats', 0, 8, 6, 8),
                item(statsProfile.id, 'alarm-stats', 6, 8, 6, 8),
            ],
            md: stacked('md', [
                {i: statsRate.id, type: 'alarm-stats', h: 8},
                {i: statsCompare.id, type: 'alarm-stats', h: 8},
                {i: statsAdjTime.id, type: 'alarm-stats', h: 8},
                {i: statsProfile.id, type: 'alarm-stats', h: 8},
            ]),
            sm: stacked('sm', [
                {i: statsRate.id, type: 'alarm-stats', h: 8},
                {i: statsCompare.id, type: 'alarm-stats', h: 8},
                {i: statsAdjTime.id, type: 'alarm-stats', h: 8},
                {i: statsProfile.id, type: 'alarm-stats', h: 8},
            ]),
        },
    };

    // --- Dashboard template: lane status grid + alarm table + quick view ---
    const dashStatus = widget('dashboard-system-status', 'system-status', {lanes: {mode: 'all'}});
    const dashAlarms = widget('dashboard-alarm-table', 'adjudication-table', {
        columns: DEFAULT_ALARM_TABLE_COLUMNS.map((c) => ({...c})),
        filters: {lanes: {mode: 'all'}, adjudicated: 'any'},
    });
    const dashQuickView = widget('dashboard-quick-view', 'quick-view', {});

    const dashboard: PageConfig = {
        id: 'dashboard',
        title: 'dashboard',
        icon: 'dashboard',
        showInNav: true,
        widgets: [dashStatus, dashAlarms, dashQuickView],
        layouts: {
            lg: [
                item(dashStatus.id, 'system-status', 0, 0, 8, 6),
                item(dashAlarms.id, 'adjudication-table', 0, 6, 8, 10),
                item(dashQuickView.id, 'quick-view', 8, 0, 4, 16),
            ],
            md: stacked('md', [
                {i: dashStatus.id, type: 'system-status', h: 6},
                {i: dashAlarms.id, type: 'adjudication-table', h: 10},
                {i: dashQuickView.id, type: 'quick-view', h: 12},
            ]),
            sm: stacked('sm', [
                {i: dashStatus.id, type: 'system-status', h: 6},
                {i: dashAlarms.id, type: 'adjudication-table', h: 10},
                {i: dashQuickView.id, type: 'quick-view', h: 12},
            ]),
        },
    };

    // --- Event Log template: lookup + full-width event table ---
    const eventTable = widget('event-log-table', 'event-table', {
        columns: DEFAULT_EVENT_TABLE_COLUMNS.map((c) => ({...c})),
        filters: {lanes: {mode: 'all'}, adjudicated: 'any'},
    });
    const eventLookup = widget('event-log-lookup', 'event-lookup', {});
    const eventLog: PageConfig = {
        id: 'event-log',
        title: 'events',
        icon: 'warning',
        showInNav: true,
        widgets: [eventLookup, eventTable],
        layouts: {
            lg: [
                item(eventLookup.id, 'event-lookup', 0, 0, 6, 4),
                item(eventTable.id, 'event-table', 0, 4, 12, 14),
            ],
            md: stacked('md', [
                {i: eventLookup.id, type: 'event-lookup', h: 4},
                {i: eventTable.id, type: 'event-table', h: 14},
            ]),
            sm: stacked('sm', [
                {i: eventLookup.id, type: 'event-lookup', h: 4},
                {i: eventTable.id, type: 'event-table', h: 14},
            ]),
        },
    };

    // --- Map template: full-page map ---
    const mapWidget = widget('map-main', 'map', buildDefaultWidgetConfig('map'));
    const map: PageConfig = {
        id: 'map',
        title: 'map',
        icon: 'map',
        showInNav: true,
        widgets: [mapWidget],
        layouts: {
            lg: [item(mapWidget.id, 'map', 0, 0, 12, 14)],
            md: [item(mapWidget.id, 'map', 0, 0, 8, 14)],
            sm: [item(mapWidget.id, 'map', 0, 0, 4, 12)],
        },
    };

    // --- National View template: stats table ---
    const nationalStats = widget('national-view-stats', 'national-stats', {});
    const nationalView: PageConfig = {
        id: 'national-view',
        title: 'national',
        icon: 'mediation',
        showInNav: true,
        widgets: [nationalStats],
        layouts: {
            lg: [item(nationalStats.id, 'national-stats', 0, 0, 12, 14)],
            md: [item(nationalStats.id, 'national-stats', 0, 0, 8, 14)],
            sm: [item(nationalStats.id, 'national-stats', 0, 0, 4, 14)],
        },
    };

    // --- Lane View template: status strip, video, chart, occupancy/fault log ---
    const laneStatus = widget('lane-view-status', 'lane-detail-status', {laneSource: {source: 'page'}});
    const laneVideo = widget('lane-view-video', 'video', {laneSource: {source: 'page'}});
    const laneChart = widget('lane-view-gamma-chart', 'chart', {laneSource: {source: 'page'}});
    const laneTable = widget('lane-view-status-table', 'status-table', {
        laneSource: {source: 'page'},
        defaultView: 'occupancy',
    });
    const laneView: PageConfig = {
        id: 'lane-view',
        title: 'laneView',
        icon: 'lane',
        showInNav: true,
        laneContext: {mode: 'global'},
        widgets: [laneStatus, laneVideo, laneChart, laneTable],
        layouts: {
            lg: [
                item(laneStatus.id, 'lane-detail-status', 0, 0, 12, 4),
                item(laneVideo.id, 'video', 0, 4, 6, 8),
                item(laneChart.id, 'chart', 6, 4, 6, 8),
                item(laneTable.id, 'status-table', 0, 12, 12, 9),
            ],
            md: stacked('md', [
                {i: laneStatus.id, type: 'lane-detail-status', h: 4},
                {i: laneVideo.id, type: 'video', h: 8},
                {i: laneChart.id, type: 'chart', h: 8},
                {i: laneTable.id, type: 'status-table', h: 9},
            ]),
            sm: stacked('sm', [
                {i: laneStatus.id, type: 'lane-detail-status', h: 4},
                {i: laneVideo.id, type: 'video', h: 7},
                {i: laneChart.id, type: 'chart', h: 8},
                {i: laneTable.id, type: 'status-table', h: 9},
            ]),
        },
    };

    // --- Single-view page templates ---
    const singleView = (id: string, title: string, icon: string, type: WidgetType, h: number): PageConfig => {
        const w = widget(`${id}-main`, type, {});
        return {
            id,
            title,
            icon,
            showInNav: true,
            widgets: [w],
            layouts: {
                lg: [item(w.id, type, 0, 0, 12, h)],
                md: [item(w.id, type, 0, 0, 8, h)],
                sm: [item(w.id, type, 0, 0, 4, h)],
            },
        };
    };
    const stateOfHealth = singleView('state-of-health', 'stateOfHealth', 'health', 'state-of-health', 16);
    const reportGenerator = singleView('report-generator', 'reportGenerator', 'report', 'report-generator', 18);
    const alarmTransfer = singleView('alarm-transfer', 'alarmTransfer', 'transfer', 'alarm-transfer', 16);

    return [
        multiLaneWallboard,
        alarmMapOverview,
        statisticsOverview,
        dashboard,
        laneView,
        map,
        nationalView,
        eventLog,
        stateOfHealth,
        reportGenerator,
        alarmTransfer,
    ];
}

/** Template identifiers offered when creating a custom dashboard, in display order. */
export const PAGE_TEMPLATE_IDS = [
    'multi-lane-wallboard',
    'alarm-map-overview',
    'statistics-overview',
    'dashboard',
    'lane-view',
    'map',
    'national-view',
    'event-log',
    'state-of-health',
    'report-generator',
    'alarm-transfer',
] as const;
export type PageTemplateId = typeof PAGE_TEMPLATE_IDS[number];

/** Featured starter cards rendered on `/dashboards` when starting a custom workspace. */
export const STARTER_GALLERY_TEMPLATES: readonly StarterTemplateMeta[] = [
    {
        id: 'multi-lane-wallboard',
        titleKey: 'multiLaneWallboard',
        descriptionKey: 'multiLaneWallboardDesc',
        icon: 'video',
    },
    {
        id: 'alarm-map-overview',
        titleKey: 'alarmMapOverview',
        descriptionKey: 'alarmMapOverviewDesc',
        icon: 'map',
    },
    {
        id: 'statistics-overview',
        titleKey: 'statisticsOverview',
        descriptionKey: 'statisticsOverviewDesc',
        icon: 'chart',
    },
    {
        id: 'dashboard',
        titleKey: 'dashboard',
        descriptionKey: 'dashboardTemplateDesc',
        icon: 'dashboard',
    },
];

/** Default English titles for legacy v1/v2 seeded pages migrated into custom dashboards. */
export const LEGACY_SEEDED_TITLES: Record<string, string> = {
    dashboard: 'Dashboard',
    events: 'Events',
    map: 'Map',
    national: 'National',
    laneView: 'Lane view',
};

/** Build a deep-cloned custom dashboard instance from a named template. */
export function buildPageFromTemplate(
    templateId: string,
    page: { id: string; title: string; icon?: string },
    availableLanes?: string[],
): PageConfig | undefined {
    const template = buildTemplatePages().find((p) => p.id === templateId);
    if (!template) return undefined;
    const clonedWidgets: WidgetInstance[] = JSON.parse(JSON.stringify(template.widgets));
    if (templateId === 'multi-lane-wallboard' && availableLanes && availableLanes.length > 0) {
        let videoIdx = 0;
        let chartIdx = 0;
        for (const w of clonedWidgets) {
            if (w.type === 'video' && videoIdx < availableLanes.length) {
                w.config = {laneSource: {source: 'explicit', lane: availableLanes[videoIdx++]}};
            } else if (w.type === 'chart' && chartIdx < availableLanes.length) {
                w.config = {laneSource: {source: 'explicit', lane: availableLanes[chartIdx++]}};
            }
        }
    }
    const clonedLayouts: PageConfig['layouts'] = JSON.parse(JSON.stringify(template.layouts));
    return {
        id: page.id,
        title: page.title,
        icon: page.icon ?? template.icon,
        showInNav: true,
        templateId,
        laneContext: template.laneContext ? {...template.laneContext} : undefined,
        widgets: clonedWidgets,
        layouts: clonedLayouts,
    };
}

/** Look up the template's own i18n title key. */
export function templateTitleKey(templateId: string): string | undefined {
    return buildTemplatePages().find((p) => p.id === templateId)?.title;
}
