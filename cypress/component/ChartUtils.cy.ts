import ChartJsView from "osh-js/source/core/ui/view/chart/ChartJsView.js";
import annotationPlugin from "chartjs-plugin-annotation";
import {Chart, registerables} from "chart.js";
import {
    buildEventTimeScaleOptions,
    clampEventAnnotationTime,
    createGammaDetectorViewCurves,
    createGammaViewCurve,
    createNeutronDetectorViewCurves,
    createNeutronViewCurve,
    DASHBOARD_WIDGETS_STORAGE_KEY,
    DEFAULT_DASHBOARD_WIDGET_VISIBILITY,
    destroyChartView,
    DETECTOR_DATASET_OPTIONS,
    DETECTOR_PLOT_LAYOUT_STORAGE_KEY,
    EVENT_CHART_MAX_VALUES,
    expandEventSampleWindow,
    getEventChartBoundsMs,
    getObservations,
    getStoredDashboardWidgetVisibility,
    getStoredDetectorPlotLayout,
    LIVE_CHART_MAX_VALUES,
    patchChartViewMultiCurveSync,
    selectSafeTimeScaleUnit,
    setStoredDashboardWidgetVisibility,
    setStoredDetectorPlotLayout,
    sortTooltipByHighestCps,
} from "../../src/app/utils/ChartUtils";
import {getEventPreviewIdentityKey} from "../../src/app/_components/event-preview/EventPreview";
import {LaneMapEntry} from "../../src/lib/data/oscar/LaneCollection";
import {
    ALARM_DEF,
    GAMMA_COUNT_DEF,
    NEUTRON_COUNT_DEF,
    OCCUPANCY_PILLAR_DEF,
    OCR_DEF,
    THRESHOLD_DEF,
} from "../../src/lib/data/Constants";

Chart.register(...registerables, annotationPlugin);

describe("ChartUtils gammaThreshold background lookup", () => {
    it("queries cold-tiered gammaThreshold observations by phenomenonTime instead of resultTime", () => {
        let capturedFilter: any;
        let capturedPageSize: number | undefined;
        const datastream = {
            searchObservations: cy.stub().callsFake((filter: any, pageSize: number) => {
                capturedFilter = filter;
                capturedPageSize = pageSize;
                return Promise.resolve({
                    nextPage: () => Promise.resolve([
                        {result: {latestGammaBackground: 126.0}},
                    ]),
                });
            }),
        };

        cy.wrap(getObservations(
            "2026-11-04T01:04:36.85Z",
            "2026-11-04T01:04:45.883Z",
            datastream,
        )).then((latestGb) => {
            expect(latestGb).to.equal(126.0);
            expect(capturedPageSize).to.equal(1);
            expect(capturedFilter?.props?.phenomenonTime).to.equal(
                "2026-11-04T01:04:36.85Z/2026-11-04T01:04:45.883Z",
            );
            expect(capturedFilter?.props?.resultTime).to.equal(undefined);
            expect(capturedFilter.toQueryString()).to.include(
                "phenomenonTime=2026-11-04T01:04:36.85Z/2026-11-04T01:04:45.883Z",
            );
            expect(capturedFilter.toQueryString()).to.not.include("resultTime=");
        });
    });

    it("combines non-summed gamma and neutron detector curves with clean lines, highest-CPS tooltip sorting, and separate accessibility layout persistence", () => {
        window.localStorage.removeItem(DETECTOR_PLOT_LAYOUT_STORAGE_KEY);
        expect(getStoredDetectorPlotLayout()).to.equal("combined");
        setStoredDetectorPlotLayout("separate");
        expect(getStoredDetectorPlotLayout()).to.equal("separate");
        setStoredDetectorPlotLayout("combined");
        expect(getStoredDetectorPlotLayout()).to.equal("combined");

        expect(DETECTOR_DATASET_OPTIONS.pointRadius).to.equal(0);

        const gammaCurves = createGammaDetectorViewCurves({id: "gamma-ds"}, {gamma: "Gamma", time: "Time"});
        const liveGammaCurves = createGammaDetectorViewCurves({id: "gamma-ds"}, {gamma: "Gamma", time: "Time"}, LIVE_CHART_MAX_VALUES);
        const liveTotalGammaCurve = createGammaViewCurve({id: "gamma-ds"}, {gamma: "Gamma", time: "Time"}, LIVE_CHART_MAX_VALUES);
        const neutronCurves = createNeutronDetectorViewCurves({id: "neutron-ds"}, {neutron: "Neutron", time: "Time"});
        expect(gammaCurves).to.have.length(4);
        expect(neutronCurves).to.have.length(4);
        expect(gammaCurves[0].properties.maxValues).to.equal(EVENT_CHART_MAX_VALUES);
        expect(liveGammaCurves[0].properties.maxValues).to.equal(LIVE_CHART_MAX_VALUES);
        expect(liveTotalGammaCurve?.properties.maxValues).to.equal(LIVE_CHART_MAX_VALUES);

        const items = [
            {dataset: {label: "Gamma 1"}, parsed: {y: 120}},
            {dataset: {label: "Gamma 2"}, parsed: {y: 480}},
            {dataset: {label: "Gamma 3"}, parsed: {y: 310}},
            {dataset: {label: "Gamma 4"}, parsed: {y: 95}},
        ];
        items.sort(sortTooltipByHighestCps);
        expect(items.map((item) => item.dataset.label)).to.deep.equal([
            "Gamma 2",
            "Gamma 3",
            "Gamma 1",
            "Gamma 4",
        ]);

        const fakeChartView: any = {
            buffer: {
                "curve-1": [{x: 200, y: 10}, {x: 100, y: 20}],
                "curve-2": [{x: 200, y: 30}, {x: 100, y: 40}],
            },
            datasets: {
                "curve-1": {data: []},
                "curve-2": {data: []},
            },
            chart: {
                data: {
                    datasets: [],
                },
                update: cy.stub(),
            },
        };
        fakeChartView.chart.data.datasets = [
            fakeChartView.datasets["curve-1"],
            fakeChartView.datasets["curve-2"],
        ];

        patchChartViewMultiCurveSync(fakeChartView, true);
        fakeChartView.chart.update();

        expect(fakeChartView.refreshRate).to.equal(0);
        expect(fakeChartView.datasetOptions).to.deep.equal({});
        expect(fakeChartView.datasets["curve-1"].data.map((pt: any) => pt.x)).to.deep.equal([100, 200]);
        expect(fakeChartView.datasets["curve-2"].data.map((pt: any) => pt.x)).to.deep.equal([100, 200]);
    });

    it("coalesces burst chart.update('none') calls per frame and cancels pending timers on destroyChartView", () => {
        const updateStub = cy.stub();
        const chartDestroyStub = cy.stub();
        const viewDestroyStub = cy.stub();
        const fakeChartView: any = {
            buffer: {
                "curve-1": [{x: 300, y: 15}, {x: 100, y: 25}],
                "curve-2": [{x: 300, y: 35}, {x: 100, y: 45}],
            },
            datasets: {
                "curve-1": {data: []},
                "curve-2": {data: []},
            },
            destroy: viewDestroyStub,
            chart: {
                data: {
                    datasets: [],
                },
                update: updateStub,
                destroy: chartDestroyStub,
            },
        };
        fakeChartView.chart.data.datasets = [
            fakeChartView.datasets["curve-1"],
            fakeChartView.datasets["curve-2"],
        ];

        patchChartViewMultiCurveSync(fakeChartView, true);

        // Four rapid update('none') calls in the same tick coalesce into one underlying Chart.js render.
        fakeChartView.chart.update("none");
        fakeChartView.chart.update("none");
        fakeChartView.chart.update("none");
        fakeChartView.chart.update("none");
        expect(updateStub.callCount).to.equal(0);

        cy.wait(30).then(() => {
            expect(updateStub.callCount).to.equal(1);
            expect(fakeChartView.datasets["curve-1"].data.map((pt: any) => pt.x)).to.deep.equal([100, 300]);

            // Destroying the view while a coalesced update is pending cancels the timer.
            fakeChartView.chart.update("none");
            destroyChartView(fakeChartView);
            expect(viewDestroyStub.callCount).to.equal(1);
            expect(chartDestroyStub.callCount).to.equal(1);
        });

        cy.wait(30).then(() => {
            expect(updateStub.callCount).to.equal(1);
        });
    });

    it("persists customizable dashboard widget visibility in localStorage", () => {
        window.localStorage.removeItem(DASHBOARD_WIDGETS_STORAGE_KEY);
        expect(getStoredDashboardWidgetVisibility()).to.deep.equal(DEFAULT_DASHBOARD_WIDGET_VISIBILITY);

        setStoredDashboardWidgetVisibility({
            laneStatus: false,
            eventTable: true,
            quickView: true,
        });
        expect(getStoredDashboardWidgetVisibility()).to.deep.equal({
            laneStatus: false,
            eventTable: true,
            quickView: true,
        });

        setStoredDashboardWidgetVisibility(DEFAULT_DASHBOARD_WIDGET_VISIBILITY);
        expect(getStoredDashboardWidgetVisibility()).to.deep.equal(DEFAULT_DASHBOARD_WIDGET_VISIBILITY);
    });

    it("expands sub-second occupancy sample windows to whole seconds and recovers boundary gammaThreshold samples", () => {
        const expanded = expandEventSampleWindow(
            "2026-11-13T16:57:36.501Z",
            "2026-11-13T16:57:37.505Z",
        );
        expect(expanded).to.deep.equal({
            startTime: "2026-11-13T16:57:35.000Z",
            endTime: "2026-11-13T16:57:39.000Z",
        });

        const calls: string[] = [];
        const datastream = {
            searchObservations: cy.stub().callsFake((filter: any) => {
                calls.push(filter?.props?.phenomenonTime);
                const hasBoundarySample = filter?.props?.phenomenonTime?.startsWith("2026-11-13T16:57:35.000Z/");
                return Promise.resolve({
                    nextPage: () => Promise.resolve(
                        hasBoundarySample ? [{result: {latestGammaBackground: 132.5}}] : [],
                    ),
                });
            }),
        };

        cy.wrap(getObservations(
            "2026-11-13T16:57:36.501Z",
            "2026-11-13T16:57:37.505Z",
            datastream,
        )).then((latestGb) => {
            expect(latestGb).to.equal(132.5);
            expect(calls).to.deep.equal([
                "2026-11-13T16:57:36.501Z/2026-11-13T16:57:37.505Z",
                "2026-11-13T16:57:35.000Z/2026-11-13T16:57:39.000Z",
            ]);
        });
    });

    it("prevents Chart.js TimeScale crashes on >28h-old occupancies with empty datasets when video annotations update", () => {
        const startTime = "2026-11-13T16:57:36.501Z";
        const endTime = "2026-11-13T16:57:37.505Z";
        const bounds = getEventChartBoundsMs(startTime, endTime);
        expect(bounds).to.deep.equal({
            minMs: Date.parse("2026-11-13T16:57:35.000Z"),
            maxMs: Date.parse("2026-11-13T16:57:39.000Z"),
        });

        expect(selectSafeTimeScaleUnit(4_000)).to.equal("second");
        expect(selectSafeTimeScaleUnit(900_000)).to.equal("minute");
        expect(selectSafeTimeScaleUnit(102_530_000)).to.equal("hour");
        expect(selectSafeTimeScaleUnit(3_000_000_000)).to.equal("day");

        const container = document.createElement("div");
        container.id = "test-empty-historical-neutron-chart";
        container.style.width = "640px";
        container.style.height = "260px";
        document.body.appendChild(container);

        const curve = createNeutronViewCurve({id: "empty-neutron-ds"}, {neutron: "Neutron", time: "Time"});
        const view = new ChartJsView({
            container: container.id,
            layers: [curve],
            css: "chart-view-event-detail",
            type: "line",
            destroyAfterMutation: false,
            refreshRate: 0,
            datasetOptions: DETECTOR_DATASET_OPTIONS,
            options: {
                scales: {
                    x: buildEventTimeScaleOptions(startTime, endTime, "Time", {padding: 5}),
                    y: {type: "linear", position: "left", ticks: {stepSize: 1}},
                },
            },
        });
        patchChartViewMultiCurveSync(view, true);

        try {
            // Exact timestamp from the Lane50 0ihu553b crash (startTime + 87 ms while Date.now() is >28.4h later).
            const clamped = clampEventAnnotationTime(1794589056588, bounds);
            expect(clamped?.getTime()).to.equal(1794589056588);

            view.chart.options.plugins.annotation = {
                annotations: {
                    verticalLine: {
                        type: "line",
                        xMin: clamped,
                        xMax: clamped,
                        borderColor: "yellow",
                        borderWidth: 4,
                    },
                },
            };
            expect(() => view.chart.update()).to.not.throw();
            expect(view.chart.scales.x.min).to.equal(Date.parse("2026-11-13T16:57:35.000Z"));
            expect(view.chart.scales.x.max).to.equal(Date.parse("2026-11-13T16:57:39.000Z"));

            // Out-of-range or non-finite video timestamps are clamped/ignored safely.
            expect(clampEventAnnotationTime(NaN, bounds)).to.equal(null);
            expect(clampEventAnnotationTime(1794691586000, bounds)?.getTime()).to.equal(bounds!.maxMs);
        } finally {
            destroyChartView(view);
            container.remove();
        }
    });

    it("promotes single-sample detector datasets to visible markers and self-heals TimeScale overflow", () => {
        let shouldThrowOnce = true;
        const updateCalls: Array<{unit: any; mode: any}> = [];
        const fakeChartView: any = {
            datasetOptions: DETECTOR_DATASET_OPTIONS,
            buffer: {
                "curve-1": [{x: 1794589056000, y: 7}],
            },
            datasets: {
                "curve-1": {data: [], pointRadius: 0},
            },
            chart: {
                options: {
                    scales: {x: {time: {unit: "second"}, min: 1, max: 999999999999}},
                    plugins: {annotation: {annotations: {verticalLine: {type: "line"}}}},
                },
                data: {datasets: []},
                update(mode?: any) {
                    updateCalls.push({unit: this.options.scales.x.time.unit, mode});
                    if (shouldThrowOnce) {
                        shouldThrowOnce = false;
                        throw new Error("1794589056588 and 1794691586000 are too far apart with stepSize of 1 second");
                    }
                },
            },
        };
        fakeChartView.chart.data.datasets = [fakeChartView.datasets["curve-1"]];

        patchChartViewMultiCurveSync(fakeChartView, true);
        expect(() => fakeChartView.chart.update()).to.not.throw();
        expect(fakeChartView.datasets["curve-1"].pointRadius).to.equal(4);
        expect(updateCalls).to.deep.equal([
            {unit: "second", mode: undefined},
            {unit: false, mode: undefined},
        ]);

        fakeChartView.buffer["curve-1"] = [
            {x: 1794589056000, y: 7},
            {x: 1794589057000, y: 2},
        ];
        fakeChartView.chart.update();
        expect(fakeChartView.datasets["curve-1"].pointRadius).to.equal(0);
    });

    it("deduplicates lane streams, skips non-chart datastreams in getDatastreamsForEventDetail, and distinguishes repeated occupancyCount previews", () => {
        const fakeNode: any = {
            id: "node-1",
            csAPIEndpoint: "/api",
            authenticationMode: "session",
            auth: {username: "", password: ""},
        };
        const lane = new LaneMapEntry(fakeNode);
        const createdIds: string[] = [];
        cy.stub(lane, "createBatchConSysApiFromDataStream").callsFake(
            (ds: any, startTime: string, endTime: string) => {
                createdIds.push(`${ds.properties.id}:${startTime}->${endTime}`);
                return {id: `batch-${ds.properties.id}`} as any;
            },
        );

        const mkStream = (id: string, definitions: string[]) => ({
            properties: {
                id,
                name: id,
                observedProperties: definitions.map((definition) => ({definition})),
            },
            networkProperties: {endpointUrl: "localhost:8181/sensorhub/api", tls: false},
        }) as any;

        lane.addDataStream(mkStream("occ-1", [OCCUPANCY_PILLAR_DEF]));
        lane.addDataStream(mkStream("gamma-1", [ALARM_DEF, GAMMA_COUNT_DEF]));
        lane.addDataStream(mkStream("gamma-1", [ALARM_DEF, GAMMA_COUNT_DEF])); // duplicate ID ignored
        lane.addDataStream(mkStream("neutron-1", [ALARM_DEF, NEUTRON_COUNT_DEF]));
        lane.addDataStream(mkStream("thresh-1", [THRESHOLD_DEF]));
        lane.addDataStream(mkStream("ocr-1", [OCR_DEF]));

        expect(lane.datastreams).to.have.length(5);

        cy.wrap(lane.getDatastreamsForEventDetail(
            "2026-11-13T16:57:36.501Z",
            "2026-11-13T16:57:37.505Z",
        )).then((dsMap: any) => {
            expect(createdIds).to.deep.equal([
                "gamma-1:2026-11-13T16:57:35.000Z->2026-11-13T16:57:39.000Z",
                "neutron-1:2026-11-13T16:57:35.000Z->2026-11-13T16:57:39.000Z",
                "thresh-1:2026-11-13T16:57:35.000Z->2026-11-13T16:57:39.000Z",
            ]);
            expect(dsMap.get("gamma")).to.have.length(1);
            expect(dsMap.get("neutron")).to.have.length(1);
            expect(dsMap.get("gammaTrshld")).to.have.length(1);
            expect(dsMap.get("occ")).to.have.length(0);
        });

        // Two distinct Lane50 alarms sharing occupancyCount = "1" produce distinct preview keys,
        // while live (.530Z) and REST (.53Z) representations of the same alarm produce the identical key.
        const gammaLive = {
            laneId: "Lane50",
            occupancyCount: "1",
            startTime: "2026-11-14T20:55:55.530Z",
            endTime: "2026-11-14T20:56:04.491Z",
        };
        const gammaRest = {
            laneId: "Lane50",
            occupancyCount: "1",
            startTime: "2026-11-14T20:55:55.53Z",
            endTime: "2026-11-14T20:56:04.491Z",
        };
        const olderGammaSameCount = {
            laneId: "Lane50",
            occupancyCount: "1",
            startTime: "2026-11-13T21:16:37.547Z",
            endTime: "2026-11-13T21:16:38.550Z",
        };
        expect(getEventPreviewIdentityKey(gammaLive)).to.equal(getEventPreviewIdentityKey(gammaRest));
        expect(getEventPreviewIdentityKey(gammaRest)).to.not.equal(getEventPreviewIdentityKey(olderGammaSameCount));
    });
});
