import React, {useState} from "react";
import {configureStore} from "@reduxjs/toolkit";
import {Provider} from "react-redux";
import {AppRouterContext} from "next/dist/shared/lib/app-router-context.shared-runtime";
import {LanguageProvider} from "../../src/app/contexts/LanguageContext";
import {DataSourceContext} from "../../src/app/contexts/DataSourceContext";
import UpSetPlot from "../../src/app/_components/common/UpSetPlot";
import EventTable from "../../src/app/_components/event-table/EventTable";
import N42ChartPlayback from "../../src/app/_components/n42/N42ChartPlayback";
import {prepareSpectrumPlotData} from "../../src/app/_components/n42/SpectrumScaleControl";
import WebIdAnalysisResult from "../../src/lib/data/oscar/adjudication/WebId";
import {EventTableData} from "../../src/lib/data/oscar/TableHelpers";
import {adjudicationCodeMarker} from "../../src/lib/data/oscar/adjudication/models/AdjudicationConstants";
import {OCCUPANCY_PILLAR_DEF} from "../../src/lib/data/Constants";
import eventDataReducer from "../../src/lib/state/EventDataSlice";
import oscarClientReducer from "../../src/lib/state/OSCARClientSlice";
import eventPreviewReducer from "../../src/lib/state/EventPreviewSlice";
import {
    buildUpSetCoOccurrenceFromEvents,
    mapNuclideToCanonicalIsotope,
    parseN42AlarmReportNuclides,
    selectDeviceReportIsotopes,
    selectHighestConfidenceWebIdResult,
    suggestAdjudicationCodeForCategory,
    UpSetCoOccurrencePayload,
} from "../../src/lib/data/oscar/adjudication/IsotopeMapping";

function InteractiveUpSetHarness({data}: {data: UpSetCoOccurrencePayload}) {
    const [selectedMask, setSelectedMask] = useState<number | null>(null);
    return (
        <LanguageProvider>
            <UpSetPlot
                data={data}
                selectedMask={selectedMask}
                onSelectIntersection={col => setSelectedMask(col?.mask ?? null)}
                testId="cypress-upset-plot"
            />
        </LanguageProvider>
    );
}

describe("Spectroscopic Isotope Mapping & UpSet Co-Occurrence Plotting", () => {
    it("maps vendor RIID and Sandia WebID nuclide strings to canonical IsotopeSelect values", () => {
        expect(mapNuclideToCanonicalIsotope("I-131")).to.equal("Iodine131");
        expect(mapNuclideToCanonicalIsotope("I131")).to.equal("Iodine131");
        expect(mapNuclideToCanonicalIsotope("K-40")).to.equal("Potassium");
        expect(mapNuclideToCanonicalIsotope("Tc-99m")).to.equal("Technetium");
        expect(mapNuclideToCanonicalIsotope("Cs-137")).to.equal("Cesium137");
        expect(mapNuclideToCanonicalIsotope("Co-60")).to.equal("Cobalt60");
        expect(mapNuclideToCanonicalIsotope("Co-57")).to.equal("Cobalt57");
        expect(mapNuclideToCanonicalIsotope("U-235")).to.equal("Uranium235");
        expect(mapNuclideToCanonicalIsotope("HEU")).to.equal("Uranium235");
        expect(mapNuclideToCanonicalIsotope("WGPu")).to.equal("Plutonium");
        expect(mapNuclideToCanonicalIsotope("Pu-239")).to.equal("Plutonium");
        expect(mapNuclideToCanonicalIsotope("Th-232")).to.equal("Thorium");
        expect(mapNuclideToCanonicalIsotope("Ra-226")).to.equal("Radium");
        expect(mapNuclideToCanonicalIsotope("Cf-252")).to.equal("Californium");
        expect(mapNuclideToCanonicalIsotope("F-18")).to.equal("Fluorine");
        expect(mapNuclideToCanonicalIsotope("Background")).to.equal(null);
        expect(mapNuclideToCanonicalIsotope("No Source Found")).to.equal(null);
    });

    it("selects highest-confidence Sandia WebID isotopes across letter and numeric confidences", () => {
        const lowResult = new WebIdAnalysisResult("2026-11-15T10:00:00Z", {
            occupancyObsId: "obs-1",
            isotopes: [{name: "Ba-133", type: "Industrial", confidence: 2.1, confidenceStr: "L", countRate: 12}],
            isotopeString: "Ba-133",
            numIsotopes: 1,
        });
        const highResult = new WebIdAnalysisResult("2026-11-15T10:01:00Z", {
            occupancyObsId: "obs-1",
            isotopes: [
                {name: "I-131", type: "Medical", confidence: 9.4, confidenceStr: "H", countRate: 410},
                {name: "Cs-137", type: "Industrial", confidence: 1.8, confidenceStr: "P", countRate: 9},
            ],
            isotopeString: "I-131 + Cs-137",
            numIsotopes: 2,
        });

        const picked = selectHighestConfidenceWebIdResult([lowResult, highResult]);
        expect(picked.bestResult?.id).to.equal(highResult.id);
        expect(picked.canonicalIsotopes).to.deep.equal(["Iodine131"]);
        expect(picked.dominantCategory).to.equal("Medical");
        expect(suggestAdjudicationCodeForCategory(picked.dominantCategory, picked.canonicalIsotopes.length > 0)).to.equal(3);
    });

    it("parses N42Output device alarmReports and distinguishes nuisance background reports", () => {
        const medicalAlarms = [
            {
                duration: "PT60S",
                alarmCategoryCode: "Isotope",
                alarmDescription: "Isotope: I-131 (Medical, Confidence: 10.0)",
            },
        ];
        const parsed = parseN42AlarmReportNuclides(medicalAlarms);
        expect(parsed).to.have.length(1);
        expect(parsed[0].canonicalIsotope).to.equal("Iodine131");
        expect(parsed[0].category).to.equal("Medical");

        const deviceSelection = selectDeviceReportIsotopes(medicalAlarms);
        expect(deviceSelection.canonicalIsotopes).to.deep.equal(["Iodine131"]);
        expect(deviceSelection.dominantCategory).to.equal("Medical");

        const nuisanceSelection = selectDeviceReportIsotopes([
            {duration: "PT30S", alarmCategoryCode: "Background", alarmDescription: "Background Only"},
        ]);
        expect(nuisanceSelection.canonicalIsotopes).to.deep.equal([]);
        expect(suggestAdjudicationCodeForCategory(nuisanceSelection.dominantCategory, false)).to.equal(7);
    });

    it("builds 7-set UpSet co-occurrence payload from EventTableData and renders accessible SVG + table", () => {
        const mkEvent = (id: number, gammaAlarm: boolean, neutronAlarm: boolean, code?: number) => {
            return new EventTableData(
                id,
                "Lane 1",
                {
                    occupancyCount: id,
                    startTime: "2026-11-15T12:00:00Z",
                    endTime: "2026-11-15T12:00:05Z",
                    maxGamma: gammaAlarm ? 4500 : 120,
                    maxNeutron: neutronAlarm ? 28 : 1,
                    gammaAlarm,
                    neutronAlarm,
                    adjudicatedIds: code ? [adjudicationCodeMarker(code)] : [],
                    videoPaths: [],
                },
                `obs-${id}`,
                "foi-1",
                "TestNode",
                false,
            );
        };

        const events = [
            mkEvent(1, true, false, 4),
            mkEvent(2, true, false, 4),
            mkEvent(3, true, false, 4),
            mkEvent(4, true, false, 3),
            mkEvent(5, true, false, 3),
            mkEvent(6, true, true, 1),
            mkEvent(7, false, true, undefined),
            mkEvent(8, false, false, undefined), // non-alarming occupancy ignored
        ];

        const payload = buildUpSetCoOccurrenceFromEvents(events);
        expect(payload.totalOccupancies).to.equal(7);
        expect(payload.sets).to.have.length(7);
        expect(payload.intersections[0].count).to.equal(3);
        expect(payload.intersections.some(i => i.snmPresent && i.count === 1)).to.equal(true);

        cy.mount(<InteractiveUpSetHarness data={payload} />);
        cy.get('[data-testid="cypress-upset-plot"]').should("be.visible");
        cy.get('[data-testid="cypress-upset-plot"] svg[role="img"]').should("exist");
        // Verify SNM-present subset is highlighted in #DC2626
        cy.get('[data-testid="cypress-upset-plot"] svg rect[fill="#DC2626"]').should("have.length.at.least", 1);

        // Verify interactive subset toggle updates aria-pressed and shows clear chip
        cy.get('[data-testid="cypress-upset-plot"] button[aria-pressed="false"]').first().click();
        cy.get('[data-testid="cypress-upset-plot"] button[aria-pressed="true"]').should("have.length", 1);
        cy.get('[data-testid="upset-clear-filter-chip"]').should("be.visible");

        // Verify accessible semantic data table
        cy.get('[data-testid="upset-accessible-table-details"] > summary').click();
        cy.get('[data-testid="upset-accessible-table-details"] table caption').should("contain.text", "7");
        cy.get('[data-testid="upset-accessible-table-details"] tbody tr').should("have.length", payload.intersections.length);
    });

    it("renders backend report JSON upSetCoOccurrence payloads that provide activeSets", () => {
        const backendJsonPayload: UpSetCoOccurrencePayload = {
            totalOccupancies: 4,
            sets: [
                {name: "Gamma", count: 4, snm: false},
                {name: "Medical", count: 3, snm: false},
                {name: "SNM", count: 1, snm: true},
                {name: "NORM", count: 0, snm: false},
                {name: "Unknown", count: 0, snm: false},
                {name: "Industrial", count: 0, snm: false},
                {name: "Neutron", count: 0, snm: false},
            ],
            intersections: [
                {
                    activeSets: ["Gamma", "Medical"],
                    label: "Gamma + Medical",
                    count: 3,
                    percentPct: 75,
                    snmPresent: false,
                },
                {
                    activeSets: ["Gamma", "SNM"],
                    label: "Gamma + SNM",
                    count: 1,
                    percentPct: 25,
                    snmPresent: true,
                },
            ],
        };

        cy.mount(
            <LanguageProvider>
                <UpSetPlot data={backendJsonPayload} testId="report-json-upset-plot" />
            </LanguageProvider>,
        );
        cy.get('[data-testid="report-json-upset-plot"]').should("be.visible");
        cy.get('[data-testid="report-json-upset-plot"] svg[role="img"]').should("exist");
        cy.get('[data-testid="upset-col-Gamma-Medical"] line').should("have.length", 1);
        cy.get('[data-testid="upset-col-Gamma-SNM"][data-snm="true"] rect[fill="#DC2626"]').should("have.length", 1);
    });

    it("renders spectrogram counts in Log scale by default and toggles to Linear via chart click or buttons", () => {
        const rawSpectrum = [0, 1, 5, 42, 380, 2950, 0, 8];
        const logPrepared = prepareSpectrumPlotData(rawSpectrum, "log");
        expect(logPrepared.zeroFloor).to.equal(0.5);
        expect(logPrepared.plotValues[0]).to.equal(0.5);
        expect(logPrepared.plotValues[1]).to.equal(1);
        expect(logPrepared.plotValues[5]).to.equal(2950);
        expect(logPrepared.cleanRaw[0]).to.equal(0);

        const linearPrepared = prepareSpectrumPlotData(rawSpectrum, "linear");
        expect(linearPrepared.plotValues[0]).to.equal(0);
        expect(linearPrepared.plotValues[5]).to.equal(2950);

        cy.mount(
            <LanguageProvider>
                <N42ChartPlayback
                    reports={[
                        {
                            duration: 30,
                            linearSpectrum: rawSpectrum,
                        },
                    ]}
                    title="Foreground Spectrum"
                    chartId="cypress-n42-spectrum"
                    yValue="linearSpectrum"
                />
            </LanguageProvider>,
        );

        cy.get('[data-testid="cypress-n42-spectrum-canvas-wrapper"]')
            .should("be.visible")
            .and("have.attr", "data-scale-mode", "log");
        cy.get('[data-testid="cypress-n42-spectrum-scale-log"]').should("have.attr", "aria-pressed", "true");
        cy.get('[data-testid="cypress-n42-spectrum-scale-linear"]').should("have.attr", "aria-pressed", "false");
        cy.get('[data-testid="cypress-n42-spectrum-scale-header"]')
            .should("contain.text", "Counts: Log Scale")
            .and("contain.text", "Click chart to switch to Linear");

        // Clicking directly on the spectrogram canvas switches to Linear scale
        cy.get("#cypress-n42-spectrum").click();
        cy.get('[data-testid="cypress-n42-spectrum-canvas-wrapper"]').should("have.attr", "data-scale-mode", "linear");
        cy.get('[data-testid="cypress-n42-spectrum-scale-linear"]').should("have.attr", "aria-pressed", "true");
        cy.get('[data-testid="cypress-n42-spectrum-scale-log"]').should("have.attr", "aria-pressed", "false");
        cy.get('[data-testid="cypress-n42-spectrum-scale-header"]')
            .should("contain.text", "Counts: Linear Scale")
            .and("contain.text", "Click chart to switch to Log");

        // Clicking the Log button switches back to Log scale
        cy.get('[data-testid="cypress-n42-spectrum-scale-log"]').click();
        cy.get('[data-testid="cypress-n42-spectrum-canvas-wrapper"]').should("have.attr", "data-scale-mode", "log");
        cy.get('[data-testid="cypress-n42-spectrum-scale-log"]').should("have.attr", "aria-pressed", "true");
    });

    it("keeps the Events page UpSet section collapsed with zero extra fetches on load and summarizes all filtered alarms when expanded", () => {
        window.localStorage.setItem("language", "en");
        const searchCalls: Array<{limit: number; offset: number; filter: string}> = [];

        // Create 25 alarming occupancies (20 Gamma+NORM, 5 Gamma+SNM) + 5 non-alarming Clear occupancies = 30 total.
        const allObs = Array.from({length: 30}, (_, idx) => {
            const seq = 1000 + (30 - idx);
            const ts = new Date(Date.parse("2026-11-15T12:00:00Z") - idx * 60_000).toISOString();
            const isClear = idx >= 25;
            const isSnm = idx >= 20 && idx < 25; // Put all 5 SNM rows on Page 2 (indices 20..24) so Page 1's 15 rows wouldn't even see them!
            return {
                id: `obs-upset-${seq}`,
                properties: {
                    id: `obs-upset-${seq}`,
                    "datastream@id": "ds-occ-upset",
                    "foi@id": "foi-lane1",
                    resultTime: ts,
                    phenomenonTime: ts,
                },
                result: {
                    occupancyCount: String(seq),
                    startTime: ts,
                    endTime: ts,
                    maxGammaBackground: 100,
                    maxGamma: isClear ? 90 : 4200,
                    maxNeutron: isSnm ? 30 : 1,
                    gammaAlarm: !isClear,
                    neutronAlarm: isSnm,
                    adjudicatedIds: isClear ? [] : [adjudicationCodeMarker(isSnm ? 1 : 4)],
                    videoPaths: [],
                },
            };
        });

        const matchesFilter = (obs: any, filterStr: string) => {
            const r = obs.result;
            if (!filterStr) return true;
            if (filterStr.includes("gammaAlarm=true AND neutronAlarm=true")) return r.gammaAlarm && r.neutronAlarm;
            if (filterStr.includes("gammaAlarm=false AND neutronAlarm=true")) return !r.gammaAlarm && r.neutronAlarm;
            if (filterStr.includes("gammaAlarm=true AND neutronAlarm=false")) return r.gammaAlarm && !r.neutronAlarm;
            if (filterStr.includes("gammaAlarm=false AND neutronAlarm=false")) return !r.gammaAlarm && !r.neutronAlarm;
            if (filterStr.includes("gammaAlarm=true OR neutronAlarm=true")) return r.gammaAlarm || r.neutronAlarm;
            return true;
        };

        cy.window().then((win) => {
            const origFetch = win.fetch.bind(win);
            cy.stub(win, "fetch").callsFake((input: RequestInfo | URL, init?: RequestInit) => {
                const url = String(input);
                if (url.includes("/observations/count?")) {
                    const filterParam = new URL(url).searchParams.get("filter") ?? "";
                    const count = allObs.filter(o => matchesFilter(o, filterParam)).length;
                    return Promise.resolve(new Response(JSON.stringify({count}), {
                        status: 200,
                        headers: {"Content-Type": "application/json"},
                    }));
                }
                return origFetch(input, init);
            });
        });

        const fakeNode: any = {
            id: "node-upset-eventlog",
            name: "GateNode",
            address: "127.0.0.1",
            port: 8282,
            isSecure: false,
            isDefaultNode: true,
            oshPathRoot: "/sensorhub",
            bucketsEndpoint: "/buckets",
            getConnectedSystemsEndpoint: () => "https://node.example/sensorhub/api",
            getBasicAuthHeader: () => ({}),
            getObservationsApi: async () => ({
                searchObservations: async (obsFilter: any, limit = 15, offset = 0) => {
                    const filterStr = decodeURIComponent(obsFilter?.props?.filter ?? "");
                    searchCalls.push({limit, offset, filter: filterStr});
                    const matched = allObs.filter(o => matchesFilter(o, filterStr)).slice(offset, offset + limit);
                    return {
                        fetchData: async () => matched,
                    };
                },
            }),
        };

        const laneMap = new Map<string, any>([
            ["Lane 1", {
                laneName: "Lane 1",
                parentNode: fakeNode,
                isRS350Backpack: false,
                datastreams: [{
                    properties: {
                        id: "ds-occ-upset",
                        "system@id": "sys-lane1",
                        observedProperties: [{definition: OCCUPANCY_PILLAR_DEF}],
                    },
                }],
                datastreamSourceMap: new Map(),
                findDataStreamByObsProperty: () => null,
                lookupSystemIdFromDataStreamId: () => "sys-lane1",
            }],
        ]);

        const store = configureStore({
            reducer: {
                eventLogSlice: eventDataReducer,
                oscarClientSlice: oscarClientReducer,
                eventPreview: eventPreviewReducer,
            },
            middleware: getDefault => getDefault({serializableCheck: false}),
        });

        const mockRouter: any = {
            push: cy.stub(),
            replace: cy.stub(),
            prefetch: cy.stub(),
            back: cy.stub(),
            forward: cy.stub(),
            refresh: cy.stub(),
        };

        cy.mount(
            <AppRouterContext.Provider value={mockRouter}>
                <Provider store={store}>
                    <LanguageProvider>
                        <DataSourceContext.Provider value={{
                            laneMapRef: {current: laneMap},
                            activeViewKey: null,
                            viewError: null,
                            scopedHref: (href: string) => href,
                        } as any}>
                            <EventTable tableMode="eventlog" laneMap={laneMap} />
                        </DataSourceContext.Provider>
                    </LanguageProvider>
                </Provider>
            </AppRouterContext.Provider>,
        );

        // 1. Starts collapsed on page load: UpSet SVG is not mounted and no 500-row batch fetch has fired.
        cy.get('[data-testid="event-log-upset-section"]').should("exist").and("not.have.attr", "open");
        cy.get('[data-testid="event-log-upset-plot"]').should("not.exist");
        cy.contains(".MuiDataGrid-row", "1030").should("exist");
        cy.then(() => {
            expect(searchCalls.some(c => c.limit > 15)).to.equal(false);
        });

        // 2. Clicking the summary expands <details>, fetches ALL 25 alarms across pages (including the 5 SNM rows on Page 2!), and renders UpSetPlot.
        cy.get('[data-testid="event-log-upset-summary"]').click();
        cy.get('[data-testid="event-log-upset-section"]').should("have.attr", "open");
        cy.get('[data-testid="event-log-upset-plot"]').should("be.visible");
        cy.get('[data-testid="event-log-upset-plot"] svg rect[fill="#DC2626"]').should("have.length.at.least", 1);
        cy.get('[data-testid="upset-accessible-table-details"] > summary').click();
        cy.get('[data-testid="upset-accessible-table-details"] table caption').should("contain.text", "25");

        // 3. Clicking the SNM intersection bar filters the DataGrid across the full filter set (showing the 5 SNM rows from Page 2!).
        cy.contains('[data-testid="event-log-upset-plot"] button', "SNM").click();
        cy.contains(".MuiDataGrid-row", "1010").should("exist");
        cy.contains(".MuiDataGrid-row", "1030").should("not.exist");
    });
});
