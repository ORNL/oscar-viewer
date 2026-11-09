import CurveLayer from "osh-js/source/core/ui/layer/CurveLayer";
import ObservationFilter from "osh-js/source/core/consysapi/observation/ObservationFilter";
import ConSysApi from "osh-js/source/core/datasource/consysapi/ConSysApi.datasource";

interface CurveLabels {
    time?: string;
    neutron?: string;
    gamma?: string;
    threshold?: string;
    gammaNSigma?: string;
}

const DETECTOR_COUNT = 4;
export const DETECTOR_COLORS = [
    '#f44336',
    '#ff9800',
    '#4caf50',
    '#2196f3',
    '#9c27b0',
    '#00acc1',
    '#795548',
    '#607d8b',
];

export const DETECTOR_DATASET_OPTIONS = {
    pointRadius: 0,
    pointHoverRadius: 4,
    pointHitRadius: 8,
};

export type DetectorPlotLayout = 'combined' | 'separate';
export const DETECTOR_PLOT_LAYOUT_STORAGE_KEY = 'oscar.detectorPlotLayout.v1';

export function getStoredDetectorPlotLayout(): DetectorPlotLayout {
    if (typeof window === 'undefined') return 'combined';
    try {
        const raw = window.localStorage.getItem(DETECTOR_PLOT_LAYOUT_STORAGE_KEY);
        return raw === 'separate' ? 'separate' : 'combined';
    } catch {
        return 'combined';
    }
}

export function setStoredDetectorPlotLayout(layout: DetectorPlotLayout): void {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(DETECTOR_PLOT_LAYOUT_STORAGE_KEY, layout);
    } catch {
        // Ignore storage write errors in restricted browsing contexts.
    }
}

export type DashboardWidgetId = 'laneStatus' | 'eventTable' | 'quickView';
export type DashboardWidgetVisibility = Record<DashboardWidgetId, boolean>;
export const DASHBOARD_WIDGETS_STORAGE_KEY = 'oscar.dashboardWidgets.v1';
export const DEFAULT_DASHBOARD_WIDGET_VISIBILITY: DashboardWidgetVisibility = {
    laneStatus: true,
    eventTable: true,
    quickView: true,
};

export function getStoredDashboardWidgetVisibility(): DashboardWidgetVisibility {
    if (typeof window === 'undefined') {
        return {...DEFAULT_DASHBOARD_WIDGET_VISIBILITY};
    }
    try {
        const raw = window.localStorage.getItem(DASHBOARD_WIDGETS_STORAGE_KEY);
        if (!raw) return {...DEFAULT_DASHBOARD_WIDGET_VISIBILITY};
        const parsed = JSON.parse(raw);
        return {
            laneStatus: typeof parsed?.laneStatus === 'boolean' ? parsed.laneStatus : true,
            eventTable: typeof parsed?.eventTable === 'boolean' ? parsed.eventTable : true,
            quickView: typeof parsed?.quickView === 'boolean' ? parsed.quickView : true,
        };
    } catch {
        return {...DEFAULT_DASHBOARD_WIDGET_VISIBILITY};
    }
}

export function setStoredDashboardWidgetVisibility(visibility: DashboardWidgetVisibility): void {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(DASHBOARD_WIDGETS_STORAGE_KEY, JSON.stringify(visibility));
    } catch {
        // Ignore storage write errors in restricted browsing contexts.
    }
}

export function sortTooltipByHighestCps(a: any, b: any): number {
    const aVal = typeof a?.parsed?.y === 'number' && Number.isFinite(a.parsed.y)
        ? a.parsed.y
        : Number.NEGATIVE_INFINITY;
    const bVal = typeof b?.parsed?.y === 'number' && Number.isFinite(b.parsed.y)
        ? b.parsed.y
        : Number.NEGATIVE_INFINITY;
    return bVal - aVal;
}

export const EVENT_CHART_MAX_VALUES = 1500;
export const LIVE_CHART_MAX_VALUES = 60;
const MULTI_CURVE_COALESCE_DELAY_MS = 16;

/**
 * Patches a ChartJsView instance so that:
 * 1. Every buffered CurveLayer series (`chartView.buffer[curveId]`) is flushed to
 *    its corresponding Chart.js dataset (`chartView.datasets[curveId].data`) before
 *    each chart update, preventing osh-js's shared `lastTimestamp` throttle from
 *    skipping simultaneous multi-detector updates.
 * 2. Rapid `chart.update('none')` calls from multi-detector curves or historical
 *    replay bursts are coalesced into at most one sort + canvas redraw per frame
 *    (16 ms), keeping 24/7 operator wallboards flat in CPU usage.
 * 3. When `sortPointsChronologically` is enabled, each dataset's points are sorted
 *    by timestamp (`a.x - b.x`) so historical replays render in chronological order.
 */
export function patchChartViewMultiCurveSync(chartView: any, sortPointsChronologically = false): void {
    if (!chartView?.chart?.update) return;
    if (typeof chartView.refreshRate !== 'number' || !Number.isFinite(chartView.refreshRate)) {
        chartView.refreshRate = 0;
    }
    if (!chartView.datasetOptions || typeof chartView.datasetOptions !== 'object') {
        chartView.datasetOptions = {};
    }

    const originalUpdate = chartView.chart.update.bind(chartView.chart);
    let coalesceTimer: ReturnType<typeof setTimeout> | null = null;
    let destroyed = false;

    const syncBuffersAndSort = (shouldSort: boolean) => {
        if (chartView.buffer && chartView.datasets) {
            for (const bufferKey of Object.keys(chartView.buffer)) {
                if (chartView.datasets[bufferKey]) {
                    chartView.datasets[bufferKey].data = chartView.buffer[bufferKey];
                }
            }
        }
        if (shouldSort && Array.isArray(chartView.chart?.data?.datasets)) {
            for (const dataset of chartView.chart.data.datasets) {
                if (dataset.data?.length > 1) {
                    dataset.data.sort((a: any, b: any) => a.x - b.x);
                }
            }
        }
    };

    chartView.chart.update = (mode?: any) => {
        if (destroyed) return;

        if (mode === 'none') {
            syncBuffersAndSort(false);
            if (coalesceTimer !== null) return;
            coalesceTimer = setTimeout(() => {
                coalesceTimer = null;
                if (destroyed) return;
                syncBuffersAndSort(sortPointsChronologically);
                originalUpdate('none');
            }, MULTI_CURVE_COALESCE_DELAY_MS);
            return;
        }

        if (coalesceTimer !== null) {
            clearTimeout(coalesceTimer);
            coalesceTimer = null;
        }
        syncBuffersAndSort(sortPointsChronologically);
        originalUpdate(mode);
    };

    const originalDestroy = typeof chartView.destroy === 'function'
        ? chartView.destroy.bind(chartView)
        : null;
    chartView.destroy = () => {
        destroyed = true;
        if (coalesceTimer !== null) {
            clearTimeout(coalesceTimer);
            coalesceTimer = null;
        }
        originalDestroy?.();
    };
}

export function destroyChartView(chartView: any): void {
    if (!chartView) return;
    chartView.destroy?.();
    chartView.chart?.destroy?.();
}

function asFiniteNumber(value: unknown): number | undefined {
    if (value === null || value === undefined || value === '')
        return undefined;

    const number = Number(value);
    return Number.isFinite(number) ? number : undefined;
}

function sumCountFields(record: any, fieldNames: string[]): number | undefined {
    const values = fieldNames
        .map(fieldName => asFiniteNumber(record?.[fieldName]))
        .filter((value): value is number => value !== undefined);

    return values.length > 0 ? values.reduce((sum, value) => sum + value, 0) : undefined;
}

function createDetectorViewCurves(
    datasource: { id: string },
    fieldPrefix: string,
    grossFieldPrefix: string,
    label: string,
    labels: CurveLabels,
    maxValues: number = EVENT_CHART_MAX_VALUES,
) {
    if (!datasource) return [];

    return Array.from({length: DETECTOR_COUNT}, (_, index) => {
        const detector = index + 1;
        const color = DETECTOR_COLORS[index % DETECTOR_COLORS.length];

        return new CurveLayer({
            dataSourceIds: [datasource.id],
            getValues: (rec: any) => {
                return {
                    x: rec.timestamp,
                    y: asFiniteNumber(rec?.[`${fieldPrefix}${detector}`])
                        ?? asFiniteNumber(rec?.[`${grossFieldPrefix}${detector}`])
                }
            },
            name: `${label} ${detector}`,
            xLabel: labels.time ?? 'Time',
            yLabel: 'CPS',
            borderWidth: 1.5,
            backgroundColor: color,
            lineColor: color,
            visible: true,
            hidden: false,
            maxValues,
        });
    });
}

export function getGammaGrossCount(record: any): number | undefined {
    return asFiniteNumber(record?.gammaGrossCount)
        ?? sumCountFields(record, ['gammaCount1', 'gammaCount2', 'gammaCount3', 'gammaCount4'])
        ?? sumCountFields(record, [
            'gammaGrossCount1',
            'gammaGrossCount2',
            'gammaGrossCount3',
            'gammaGrossCount4'
        ]);
}

export function createGammaDetectorViewCurves(
    gammaDatasource: { id: string; },
    labels: CurveLabels = {},
    maxValues: number = EVENT_CHART_MAX_VALUES,
) {
    return createDetectorViewCurves(
        gammaDatasource,
        'gammaCount',
        'gammaGrossCount',
        labels.gamma ?? 'Gamma',
        labels,
        maxValues,
    );
}

export function getNeutronGrossCount(record: any): number | undefined {
    return asFiniteNumber(record?.neutronGrossCount)
        ?? sumCountFields(record, ['neutronCount1', 'neutronCount2', 'neutronCount3', 'neutronCount4'])
        ?? sumCountFields(record, [
            'neutronGrossCount1',
            'neutronGrossCount2',
            'neutronGrossCount3',
            'neutronGrossCount4'
        ]);
}

export function createNeutronDetectorViewCurves(
    neutronDatasource: { id: string; },
    labels: CurveLabels = {},
    maxValues: number = EVENT_CHART_MAX_VALUES,
) {
    return createDetectorViewCurves(
        neutronDatasource,
        'neutronCount',
        'neutronGrossCount',
        labels.neutron ?? 'Neutron',
        labels,
        maxValues,
    );
}

export function createNeutronViewCurve(
    neutronDatasource: { id: string; },
    labels: CurveLabels = {},
    maxValues: number = EVENT_CHART_MAX_VALUES,
) {
    if (!neutronDatasource) return null;

    let nCurve = new CurveLayer({
        dataSourceIds: [neutronDatasource.id],
        getValues: (rec: any) => {
            return {x: rec.timestamp, y: getNeutronGrossCount(rec)}
        },
        name: labels.neutron ?? 'Neutron',
        maxValues,
        borderWidth: 1.5,
        lineColor: '#29b6f6',
        backgroundColor: '#29b6f6',
        xLabel: labels.time ?? 'Time',
        yLabel: 'CPS',
        visible: true,
        hidden: false
    });

    return nCurve;
}

export function createThresholdViewCurve(
    thresholdDatasource: { id: string; },
    labels: CurveLabels = {},
    maxValues: number = EVENT_CHART_MAX_VALUES,
) {
    if (!thresholdDatasource) return null;

    let thresholdCurve = new CurveLayer({
        dataSourceIds: [thresholdDatasource.id],
        getValues: (rec: any) =>{
            return {x: rec.timestamp, y: rec.threshold}
        } ,
        name: labels.threshold ?? "Threshold",
        backgroundColor: "rgba(194, 160, 201, 0.3)",
        lineColor: '#9b27b0',
        borderWidth: 1.5,
        visible: true,
        hidden: false,
        xLabel: labels.time ?? 'Time',
        yLabel: 'CPS',
        order: 2,
        fill: 1,
        maxValues,
    });

    return thresholdCurve;
}
export function createGammaViewCurve(
    gammaDatasource: { id: string; },
    labels: CurveLabels = {},
    maxValues: number = EVENT_CHART_MAX_VALUES,
) {
    if (!gammaDatasource) return null;

    let gCurve = new CurveLayer({
        dataSourceIds: [gammaDatasource.id],
        getValues: (rec: any) => {
            return ({ x: rec.timestamp, y: getGammaGrossCount(rec)})
        },
        name: labels.gamma ?? "Gamma",
        xLabel: labels.time ?? 'Time',
        yLabel: 'CPS',
        borderWidth: 1.5,
        backgroundColor: "rgba(245, 166, 160, 0.1)",
        lineColor: "#f44336",
        visible: true,
        order: 1,
        fill: 1,
        maxValues,
    });

    return gCurve;
}

// get latest gamma background from threshold datasource to calc nsigma for chart
export function createNSigmaCalcViewCurve(gammaDatasource: typeof ConSysApi, latestGB: number, labels: CurveLabels = {}) {
    if (!gammaDatasource) {
        return null;
    }

    let nCurve = new CurveLayer({
        dataSourceIds: [gammaDatasource.id],
        getValues: (rec: any) => {
            if (latestGB != null) {
                const gammaGrossCount = getGammaGrossCount(rec);
                if (gammaGrossCount !== undefined) {
                    let nSigmaValue: number = (gammaGrossCount - latestGB) / Math.sqrt(latestGB)
                    return {x: rec.timestamp, y: nSigmaValue}
                }
            }
            return {x: rec.timestamp, y: undefined}
        },
        name: labels.gammaNSigma ?? "Gamma Nσ",
        borderWidth: 1.5,
        backgroundColor: "rgba(245, 166, 160, 0.1)",
        lineColor: "#f44336",
        xLabel: labels.time ?? 'Time',
        yLabel: 'Nσ',
        visible: true,
        hidden: false,
        fill: 1,
        order: 0,
        maxValues: 1500,
    });

    return nCurve;
}

export async function getObservations(startTime: any, endTime: any, datastream: any){

    let lastestGammaBackground: number;

    let res = await datastream.searchObservations(new ObservationFilter({phenomenonTime: `${startTime}/${endTime}`}), 1);

    let newObs = await res.nextPage();

    (newObs ?? []).map((ob: any) =>{
        const lastGB = ob?.result?.latestGammaBackground;

        if(lastGB != null)
            lastestGammaBackground = lastGB;
    })
    return lastestGammaBackground;
}

export  function createThreshSigmaViewCurve(thresholdDatasource: { id: string; }, labels: CurveLabels = {}) {
    if (!thresholdDatasource) return null;

    let gCurve = new CurveLayer({
        dataSourceIds: [thresholdDatasource.id],
        getValues: (rec: any) => {
            return { x: rec.timestamp, y: rec.nSigma}
        },
        name: labels.threshold ?? "Threshold",
        xLabel: labels.time ?? 'Time',
        yLabel: 'Nσ',
        borderWidth: 1.5,
        backgroundColor: "rgba(194, 160, 201, 0.3)",
        lineColor: '#9b27b0',
        visible: true,
        hidden: false,
        order: 1,
        fill: 1,
        maxValues: 1500,
    });
    return gCurve;
}
