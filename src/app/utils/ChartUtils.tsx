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

export interface EventChartBoundsMs {
    minMs: number;
    maxMs: number;
}

export type SafeTimeScaleUnit = 'second' | 'minute' | 'hour' | 'day' | false;

/**
 * Expands an occupancy `[startTime, endTime]` window to whole-second boundaries plus padding so
 * 1 Hz RPM count/threshold samples emitted on whole seconds just before sub-second occupancy
 * start times (for example `16:57:36.000Z` for an occupancy starting at `16:57:36.501Z`) are
 * retained in historical event detail and preview queries.
 */
export function expandEventSampleWindow(
    startTime: unknown,
    endTime: unknown,
    padBeforeMs = 1000,
    padAfterMs = 1000,
): {startTime: string; endTime: string} {
    const rawStart = typeof startTime === 'string' ? startTime : String(startTime ?? '');
    const rawEnd = typeof endTime === 'string' ? endTime : String(endTime ?? '');
    const startMs = Date.parse(rawStart);
    const endMs = Date.parse(rawEnd);
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) {
        return {startTime: rawStart, endTime: rawEnd};
    }
    const lowMs = Math.min(startMs, endMs);
    const highMs = Math.max(startMs, endMs);
    const expandedStartMs = Math.max(0, Math.floor(lowMs / 1000) * 1000 - Math.max(0, padBeforeMs));
    const expandedEndMs = Math.max(
        expandedStartMs + 1000,
        Math.ceil(highMs / 1000) * 1000 + Math.max(0, padAfterMs),
    );
    return {
        startTime: new Date(expandedStartMs).toISOString(),
        endTime: new Date(expandedEndMs).toISOString(),
    };
}

/**
 * Computes finite epoch-millisecond bounds for an event chart's X axis so empty datastreams never
 * cause Chart.js TimeScale to default its upper bound to `Date.now()`.
 */
export function getEventChartBoundsMs(
    startTime: unknown,
    endTime: unknown,
    padBeforeMs = 1000,
    padAfterMs = 1000,
): EventChartBoundsMs | null {
    const startMs = typeof startTime === 'number'
        ? startTime
        : Date.parse(typeof startTime === 'string' ? startTime : String(startTime ?? ''));
    const endMs = typeof endTime === 'number'
        ? endTime
        : Date.parse(typeof endTime === 'string' ? endTime : String(endTime ?? ''));

    if (Number.isFinite(startMs) && Number.isFinite(endMs)) {
        const lowMs = Math.min(startMs, endMs);
        const highMs = Math.max(startMs, endMs);
        const minMs = Math.max(0, Math.floor(lowMs / 1000) * 1000 - Math.max(0, padBeforeMs));
        const maxMs = Math.max(
            minMs + 1000,
            Math.ceil(highMs / 1000) * 1000 + Math.max(0, padAfterMs),
        );
        return {minMs, maxMs};
    }

    const anchorMs = Number.isFinite(startMs) ? startMs : (Number.isFinite(endMs) ? endMs : NaN);
    if (Number.isFinite(anchorMs)) {
        const minMs = Math.max(0, Math.floor(anchorMs / 1000) * 1000 - Math.max(0, padBeforeMs));
        return {minMs, maxMs: minMs + 10_000};
    }

    return null;
}

/**
 * Selects a Chart.js TimeScale unit guaranteed to stay far below Chart.js's `100,000 * stepSize`
 * tick generation cap, overriding `osh-js` ChartJsView's hardcoded `time.unit = 'second'`.
 */
export function selectSafeTimeScaleUnit(spanMs: number): SafeTimeScaleUnit {
    if (!Number.isFinite(spanMs) || spanMs < 0) return false;
    if (spanMs <= 300_000) return 'second';       // <= 5 minutes (<= 300 ticks)
    if (spanMs <= 18_000_000) return 'minute';    // <= 5 hours (<= 300 ticks)
    if (spanMs <= 604_800_000) return 'hour';     // <= 7 days (<= 168 ticks)
    if (spanMs <= 31_536_000_000) return 'day';   // <= 365 days (<= 365 ticks)
    return false;
}

export function buildEventTimeScaleOptions(
    startTime: unknown,
    endTime: unknown,
    titleText: string,
    titleExtra: Record<string, any> = {},
): Record<string, any> {
    const bounds = getEventChartBoundsMs(startTime, endTime);
    const unit = bounds ? selectSafeTimeScaleUnit(bounds.maxMs - bounds.minMs) : false;
    return {
        type: 'time',
        ...(bounds ? {min: bounds.minMs, max: bounds.maxMs} : {}),
        time: {
            unit,
            minUnit: 'second',
        },
        title: {
            display: true,
            text: titleText,
            ...titleExtra,
        },
    };
}

export function clampEventAnnotationTime(
    currentTime: unknown,
    bounds: EventChartBoundsMs | null,
): Date | null {
    if (currentTime === null || currentTime === undefined || currentTime === '') {
        return null;
    }
    const ms = currentTime instanceof Date
        ? currentTime.getTime()
        : typeof currentTime === 'number'
            ? currentTime
            : Date.parse(String(currentTime));
    if (!Number.isFinite(ms)) {
        return null;
    }
    if (!bounds) {
        return new Date(ms);
    }
    const clampedMs = Math.min(bounds.maxMs, Math.max(bounds.minMs, ms));
    return new Date(clampedMs);
}

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
 * 4. Single-sample datasets on `pointRadius: 0` detector charts promote `pointRadius`
 *    to `4` so 1-second occupancies remain visible, and any Chart.js TimeScale range
 *    overflow self-heals by switching `scales.x.time.unit` to `false` (auto-unit).
 */
export function patchChartViewMultiCurveSync(chartView: any, sortPointsChronologically = false): void {
    if (!chartView?.chart?.update) return;
    if (typeof chartView.refreshRate !== 'number' || !Number.isFinite(chartView.refreshRate)) {
        chartView.refreshRate = 0;
    }
    if (!chartView.datasetOptions || typeof chartView.datasetOptions !== 'object') {
        chartView.datasetOptions = {};
    }

    const hideMultiPointMarkers = chartView.datasetOptions?.pointRadius === 0;
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
        if (Array.isArray(chartView.chart?.data?.datasets)) {
            for (const dataset of chartView.chart.data.datasets) {
                if (shouldSort && dataset.data?.length > 1) {
                    dataset.data.sort((a: any, b: any) => a.x - b.x);
                }
                if (hideMultiPointMarkers) {
                    dataset.pointRadius = dataset.data?.length === 1 ? 4 : 0;
                }
            }
        }
    };

    const safeOriginalUpdate = (mode?: any) => {
        try {
            originalUpdate(mode);
        } catch (error) {
            const xScale = chartView.chart?.options?.scales?.x;
            if (xScale?.time && xScale.time.unit !== false) {
                console.warn('Chart TimeScale update overflowed fixed unit; falling back to auto unit:', error);
                xScale.time.unit = false;
                delete xScale.min;
                delete xScale.max;
                if (chartView.chart?.options?.plugins?.annotation) {
                    chartView.chart.options.plugins.annotation = {annotations: {}};
                }
                try {
                    originalUpdate(mode);
                    return;
                } catch (retryError) {
                    console.warn('Chart update retry failed:', retryError);
                    return;
                }
            }
            console.warn('Chart update failed:', error);
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
                safeOriginalUpdate('none');
            }, MULTI_CURVE_COALESCE_DELAY_MS);
            return;
        }

        if (coalesceTimer !== null) {
            clearTimeout(coalesceTimer);
            coalesceTimer = null;
        }
        syncBuffersAndSort(sortPointsChronologically);
        safeOriginalUpdate(mode);
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

    let lastestGammaBackground: number | undefined;

    let res = await datastream.searchObservations(new ObservationFilter({phenomenonTime: `${startTime}/${endTime}`}), 1);

    let newObs = (await res.nextPage()) ?? [];
    if (newObs.length === 0) {
        const expanded = expandEventSampleWindow(startTime, endTime);
        if (expanded.startTime !== String(startTime ?? '') || expanded.endTime !== String(endTime ?? '')) {
            const fallbackRes = await datastream.searchObservations(
                new ObservationFilter({phenomenonTime: `${expanded.startTime}/${expanded.endTime}`}),
                1,
            );
            newObs = (await fallbackRes.nextPage()) ?? [];
        }
    }

    newObs.map((ob: any) =>{
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
