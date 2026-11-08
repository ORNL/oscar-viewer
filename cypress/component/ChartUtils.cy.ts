import {
    createGammaDetectorViewCurves,
    createNeutronDetectorViewCurves,
    DASHBOARD_WIDGETS_STORAGE_KEY,
    DEFAULT_DASHBOARD_WIDGET_VISIBILITY,
    DETECTOR_DATASET_OPTIONS,
    DETECTOR_PLOT_LAYOUT_STORAGE_KEY,
    getObservations,
    getStoredDashboardWidgetVisibility,
    getStoredDetectorPlotLayout,
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
        const neutronCurves = createNeutronDetectorViewCurves({id: "neutron-ds"}, {neutron: "Neutron", time: "Time"});
        expect(gammaCurves).to.have.length(4);
        expect(neutronCurves).to.have.length(4);

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

        expect(fakeChartView.datasets["curve-1"].data.map((pt: any) => pt.x)).to.deep.equal([100, 200]);
        expect(fakeChartView.datasets["curve-2"].data.map((pt: any) => pt.x)).to.deep.equal([100, 200]);
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
