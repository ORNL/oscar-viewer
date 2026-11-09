import {
    createGammaDetectorViewCurves,
    createGammaViewCurve,
    createNeutronDetectorViewCurves,
    DASHBOARD_WIDGETS_STORAGE_KEY,
    DEFAULT_DASHBOARD_WIDGET_VISIBILITY,
    destroyChartView,
    DETECTOR_DATASET_OPTIONS,
    DETECTOR_PLOT_LAYOUT_STORAGE_KEY,
    EVENT_CHART_MAX_VALUES,
    getObservations,
    getStoredDashboardWidgetVisibility,
    getStoredDetectorPlotLayout,
    LIVE_CHART_MAX_VALUES,
    patchChartViewMultiCurveSync,
    setStoredDashboardWidgetVisibility,
    setStoredDetectorPlotLayout,
    sortTooltipByHighestCps,
} from "../../src/app/utils/ChartUtils";

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
});
