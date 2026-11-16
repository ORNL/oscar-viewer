import React from "react";
import {configureStore} from "@reduxjs/toolkit";
import {Provider} from "react-redux";
import {AppRouterContext} from "next/dist/shared/lib/app-router-context.shared-runtime";
import {LanguageProvider} from "../../src/app/contexts/LanguageContext";
import {DataSourceContext} from "../../src/app/contexts/DataSourceContext";
import EventTable from "../../src/app/_components/event-table/EventTable";
import AdjudicationDetail from "../../src/app/_components/adjudication/AdjudicationDetail";
import VehiclePassComparisonDialog from "../../src/app/_components/vehicle/VehiclePassComparisonDialog";
import {ADJ_DEF, OCCUPANCY_PILLAR_DEF, REPORT_DEF} from "../../src/lib/data/Constants";
import {createEventFilterGroup, createEventFilterRule} from "../../src/lib/data/oscar/EventFilter";
import {EventTableData} from "../../src/lib/data/oscar/TableHelpers";
import {
    buildUpSetCoOccurrenceFromVehiclePasses,
    isSpectroscopicFilePath,
} from "../../src/lib/data/oscar/adjudication/IsotopeMapping";
import {
    clearSessionEventLogCachesForTests,
    getFilteredEventLogRestoreState,
    loadSavedEventQueries,
    markSessionCachedEventAdjudicated,
    saveEventQueryBookmark,
    setFilteredEventLogSnapshot,
} from "../../src/lib/data/oscar/SavedEventQueries";
import {
    FederatedVehicleSearchResult,
    isPassSpectroscopic,
    summarizeVehiclePasses,
    VehiclePassItem,
} from "../../src/lib/data/oscar/VehicleSearch";
import AppReducer from "../../src/lib/state/Slice";
import OSHReducer from "../../src/lib/state/OSHSlice";
import EventDataReducer from "../../src/lib/state/EventDataSlice";
import OSCARClientReducer from "../../src/lib/state/OSCARClientSlice";
import OSCARLaneReducer from "../../src/lib/state/OSCARLaneSlice";
import EventDetailsReducer from "../../src/lib/state/EventDetailsSlice";
import EventPreviewReducer from "../../src/lib/state/EventPreviewSlice";
import LaneViewReducer from "../../src/lib/state/LaneViewSlice";

function createTestStore(nodes: any[] = [], laneMap = new Map()) {
    return configureStore({
        reducer: {
            oscarClientSlice: OSCARClientReducer,
            appState: AppReducer,
            oshSlice: OSHReducer,
            eventLogSlice: EventDataReducer,
            laneSlice: OSCARLaneReducer,
            eventPreview: EventPreviewReducer,
            laneView: LaneViewReducer,
            eventDetails: EventDetailsReducer,
        },
        preloadedState: {
            oshSlice: {
                nodes,
                configNode: nodes[0] ?? null,
            } as any,
            laneSlice: {
                laneMap,
            } as any,
        },
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({serializableCheck: false}),
    });
}

function createFakeRouter(pushedHrefs: string[] = []): any {
    return {
        back: () => {},
        forward: () => {},
        refresh: () => {},
        push: (href: string) => {
            pushedHrefs.push(href);
        },
        replace: (href: string) => {
            pushedHrefs.push(href);
        },
        prefetch: () => Promise.resolve(),
    };
}

function makePassItem(overrides: Partial<VehiclePassItem> & {occupancyObsId: string; occupancyCount: number}): VehiclePassItem {
    const startTime = overrides.startTime ?? "2026-11-16T08:00:00Z";
    const endTime = overrides.endTime ?? "2026-11-16T08:00:06Z";
    const gammaAlarm = overrides.gammaAlarm ?? true;
    const neutronAlarm = overrides.neutronAlarm ?? false;
    const eventRow = new EventTableData(
        overrides.occupancyCount,
        overrides.laneName ?? "Lane01",
        {
            occupancyCount: String(overrides.occupancyCount),
            startTime,
            endTime,
            samplingTime: endTime,
            gammaAlarm,
            neutronAlarm,
            maxGamma: overrides.maxGammaCount ?? 2200,
            maxNeutron: overrides.maxNeutronCount ?? 10,
            adjudicatedIds: (overrides.adjudications?.length ?? 0) > 0 ? ["code:3"] : [],
            videoPaths: [],
        },
        overrides.occupancyObsId,
        "foi-1",
        overrides.nodeName ?? "Primary Node",
        false,
    );
    return {
        compositeKey: `node-1\u001flane-1\u001f${overrides.occupancyObsId}`,
        nodeId: "node-1",
        nodeName: "Primary Node",
        node: null,
        laneEntry: null,
        federatedRemote: false,
        laneUid: "urn:osh:system:lane:lane-01",
        laneName: "Lane01",
        datastreamId: "ds-occ-1",
        systemType: "Gross-Counting",
        startTime,
        endTime,
        samplingTime: endTime,
        durationSeconds: 6,
        gammaAlarm,
        neutronAlarm,
        alarmCategoryCode: "",
        alarmStatusLabel: gammaAlarm && neutronAlarm ? "Gamma + Neutron Alarm" : gammaAlarm ? "Gamma Alarm" : "Clear",
        emlAutoReleased: false,
        maxGammaCount: 2200,
        maxNeutronCount: 10,
        neutronBackground: 1.5,
        vehicleId: "MSCU 123456 5",
        normalizedVehicleId: "MSCU1234565",
        vehicleIdSource: "both",
        ocr: null,
        eml: null,
        confirmedIsotopes: [],
        videoPaths: [],
        webIdAnalyses: [],
        adjudications: [],
        radiationProfile: [],
        eventRow,
        ...overrides,
    };
}

describe("Multi-Pass UpSet Plot, Spectroscopic Secondary Auto-Pretoggle, and Zero-Slowdown Query Bookmarks", () => {
    beforeEach(() => {
        cy.viewport(1280, 900);
        window.localStorage.clear();
        window.localStorage.setItem("language", "en");
        clearSessionEventLogCachesForTests();
        window.history.replaceState(window.history.state, "", window.location.pathname);
    });

    it("renders Multi-Pass Vehicle History UpSet plot above pass list with interactive filtering and spectroscopic secondary counts", () => {
        expect(isSpectroscopicFilePath("/buckets/adjudication/scan-i131.spe")).to.equal(true);
        expect(isSpectroscopicFilePath("sample_fg.n42.xml")).to.equal(true);
        expect(isSpectroscopicFilePath("foreground-123e4567-e89b.txt")).to.equal(true);
        expect(isSpectroscopicFilePath("nimo-evidence-123456.txt")).to.equal(false);

        const pass1 = makePassItem({
            occupancyObsId: "obs-p1",
            occupancyCount: 101,
            laneName: "Lane01",
            startTime: "2026-11-16T08:00:00Z",
            endTime: "2026-11-16T08:00:05Z",
            gammaAlarm: true,
            neutronAlarm: false,
        });
        const pass2 = makePassItem({
            occupancyObsId: "obs-p2",
            occupancyCount: 102,
            laneName: "Lane02",
            startTime: "2026-11-16T08:12:00Z",
            endTime: "2026-11-16T08:12:08Z",
            gammaAlarm: true,
            neutronAlarm: false,
            confirmedIsotopes: ["Iodine131"],
            adjudications: [
                {
                    timeUtc: "2026-11-16T08:13:00Z",
                    username: "inspector",
                    adjudicationCode: 3,
                    dispositionLabel: "Code 3: Medical Isotope Found",
                    dispositionGroup: "Innocent Alarm",
                    secondaryInspectionStatus: "COMPLETED",
                    vehicleId: "MSCU 123456 5",
                    summary: "RIID spectrum confirmed I-131",
                    isotopes: ["Iodine131"],
                    filePaths: ["/buckets/adjudication/riid-i131.spe"],
                },
            ],
        });

        expect(isPassSpectroscopic(pass1)).to.equal(false);
        expect(isPassSpectroscopic(pass2)).to.equal(true);

        const summary = summarizeVehiclePasses([pass1, pass2]);
        expect(summary.spectroscopicPasses).to.equal(1);

        const upSetPayload = buildUpSetCoOccurrenceFromVehiclePasses([pass1, pass2]);
        expect(upSetPayload.totalOccupancies).to.equal(2);
        expect(upSetPayload.intersections).to.have.length(2);

        const initialResult: FederatedVehicleSearchResult = {
            rawVehicleId: "MSCU 123456 5",
            normalizedVehicleId: "MSCU1234565",
            formattedVehicleId: "MSCU 123456 5",
            matchMode: "equals",
            passes: [pass1, pass2],
            summary,
            truncated: false,
            unreachableNodes: [],
        };

        let networkFetchCalls = 0;
        const zeroFetchStub: typeof fetch = (async () => {
            networkFetchCalls += 1;
            return new Response("{}", {status: 404});
        }) as typeof fetch;

        const store = createTestStore();
        cy.mount(
            <Provider store={store}>
                <AppRouterContext.Provider value={createFakeRouter()}>
                    <LanguageProvider>
                        <DataSourceContext.Provider
                            value={{
                                laneMapRef: {current: new Map()},
                                laneMapReady: true,
                                readyLaneNames: new Set(),
                                activeViewKey: null,
                                scopedHref: (h: string) => h,
                            } as any}
                        >
                            <VehiclePassComparisonDialog
                                open
                                onClose={() => {}}
                                vehicleId="MSCU 123456 5"
                                matchMode="equals"
                                laneMap={new Map()}
                                initialResult={initialResult}
                                fetchImpl={zeroFetchStub}
                            />
                        </DataSourceContext.Provider>
                    </LanguageProvider>
                </AppRouterContext.Provider>
            </Provider>,
        );

        cy.get('[data-testid="vehicle-history-upset-plot"]').scrollIntoView().should("be.visible");
        cy.get('[data-testid="vehicle-pass-table-region"]').scrollIntoView().should("be.visible");
        // Verify UpSet plot sits directly above the pass table in DOM order
        cy.get('[data-testid="vehicle-pass-comparison-dialog"]').then(($dlg) => {
            const plotEl = $dlg.find('[data-testid="vehicle-history-upset-plot"]')[0];
            const tableEl = $dlg.find('[data-testid="vehicle-pass-table-region"]')[0];
            expect(plotEl.compareDocumentPosition(tableEl) & Node.DOCUMENT_POSITION_FOLLOWING).to.not.equal(0);
            // Zero vehicle-search network calls occurred because UpSet computed from initialResult.passes
            expect(networkFetchCalls).to.be.at.most(2); // at most retained-media thumbnail probes
        });

        cy.get('[data-testid="vehicle-pass-table-region"] tbody tr').should("have.length", 2);
        // Click "Gamma + Medical" subset filter pill inside UpSet plot -> filters table to Pass #2 while keeping "#2"
        cy.contains('[data-testid="vehicle-history-upset-plot"] button', "Gamma + Medical").click();
        cy.get('[data-testid="vehicle-pass-table-region"] tbody tr').should("have.length", 1);
        cy.get('[data-testid="vehicle-pass-row-2"]').should("contain.text", "#2").and("contain.text", "Lane02");
    });

    it("auto-pretoggles Secondary Inspection to Completed when spectroscopic files are attached and respects manual overrides", () => {
        const fakeNode = {
            id: "node-1",
            name: "Node 1",
            address: "127.0.0.1",
            port: 8282,
            isSecure: false,
            isDefaultNode: true,
            oshPathRoot: "/sensorhub",
            bucketsEndpoint: "/buckets",
            getConnectedSystemsEndpoint: () => "http://127.0.0.1:8282/sensorhub/api",
            getBasicAuthHeader: () => ({}),
            fetchNodeControlStreams: async () => [
                {properties: {id: "cs-adj-1", controlledProperties: [{definition: ADJ_DEF}]}},
            ],
            fetchDataStreamWithObservedProperty: async () => null,
            createRealtimeObservationSource: () => ({
                subscribe: () => {},
                connect: async () => {},
                disconnect: async () => {},
            }),
        };
        const laneEntry: any = {
            laneName: "Lane01",
            parentNode: fakeNode,
            datastreams: [],
            controlStreams: [{properties: {id: "cs-adj-1", controlledProperties: [{definition: ADJ_DEF}]}}],
            systems: [],
            laneSystem: {properties: {properties: {uid: "urn:osh:system:lane:lane-01"}}},
            findDataStreamByObsProperty: () => null,
            lookupSystemIdFromDataStreamId: () => "sys-lane-01",
        };
        const laneMap = new Map([["Lane01", laneEntry]]);
        const store = createTestStore([fakeNode], laneMap);
        const event = new EventTableData(
            1,
            "Lane01",
            {
                occupancyCount: "501",
                startTime: "2026-11-16T09:00:00Z",
                endTime: "2026-11-16T09:00:05Z",
                gammaAlarm: true,
                neutronAlarm: false,
                maxGamma: 1850,
                maxNeutron: 8,
                adjudicatedIds: [],
                videoPaths: [],
            },
            "obs-501",
            "foi-1",
            "Node 1",
            false,
        );

        cy.mount(
            <Provider store={store}>
                <AppRouterContext.Provider value={createFakeRouter()}>
                    <LanguageProvider>
                        <DataSourceContext.Provider
                            value={{
                                laneMapRef: {current: laneMap},
                                laneMapReady: true,
                                readyLaneNames: new Set(["Lane01"]),
                                activeViewKey: null,
                                scopedHref: (h: string) => h,
                            } as any}
                        >
                            <AdjudicationDetail
                                event={event}
                                ocrInitialResults={[]}
                                ocrFetchImpl={(async () => new Response("{}", {status: 404})) as typeof fetch}
                            />
                        </DataSourceContext.Provider>
                    </LanguageProvider>
                </AppRouterContext.Provider>
            </Provider>,
        );

        // Initially empty (not pretoggled)
        cy.get('[data-testid="secondary-inspection-select"]').should("not.contain.text", "Completed");

        // Uploading a plain .txt note alone does NOT pretoggle Completed
        cy.get('[data-testid="adjudication-file-input"]').selectFile(
            {
                contents: Cypress.Buffer.from("operator note"),
                fileName: "operator-note.txt",
                mimeType: "text/plain",
            },
            {force: true},
        );
        cy.get('[data-testid="secondary-inspection-select"]').should("not.contain.text", "Completed");

        // Uploading a .spe spectroscopic file immediately pretoggles Secondary Inspection -> Completed
        cy.get('[data-testid="adjudication-file-input"]').selectFile(
            {
                contents: Cypress.Buffer.from("$SPEC_ID:\n secondary sample\n"),
                fileName: "secondary-sample.spe",
                mimeType: "text/plain",
            },
            {force: true},
        );
        cy.get('[data-testid="secondary-inspection-select"]').should("contain.text", "Completed");

        // Deleting the .spe file before manual override reverts Secondary Inspection cleanly
        cy.findByRole
            ? cy.get('button[aria-label="Delete secondary-sample.spe"]').click()
            : cy.get('button[aria-label="Delete secondary-sample.spe"]').click();
        cy.get('[data-testid="secondary-inspection-select"]').should("not.contain.text", "Completed");

        // Re-uploading .n42 pretoggles Completed again, and manual selection of Requested sticks
        cy.get('[data-testid="adjudication-file-input"]').selectFile(
            {
                contents: Cypress.Buffer.from("<RadInstrumentData/>"),
                fileName: "secondary-sample.n42",
                mimeType: "application/xml",
            },
            {force: true},
        );
        cy.get('[data-testid="secondary-inspection-select"]').should("contain.text", "Completed");
        cy.get('[data-testid="secondary-inspection-select"] [role="combobox"]').trigger("mousedown", {button: 0, force: true});
        cy.contains('[role="option"]', "Requested").click();
        cy.get('[data-testid="secondary-inspection-select"]').should("contain.text", "Requested");
        cy.get('button[aria-label="Delete secondary-sample.n42"]').click();
        cy.get('[data-testid="secondary-inspection-select"]').should("contain.text", "Requested");
    });

    it("saves plain-JSON query bookmarks in the toolbar popover, sets fromFiltered=1 on drill-down, and restores the single-slot snapshot with zero server round-trips", () => {
        const filterGroup = createEventFilterGroup("and");
        const laneRule = createEventFilterRule("laneId");
        laneRule.operator = "equals";
        laneRule.value = "Lane04";
        filterGroup.children.push(laneRule);

        const criteria = {filter: filterGroup};
        const saved = saveEventQueryBookmark("Lane 04 Watch", criteria);
        expect(saved).to.have.length(1);
        expect(loadSavedEventQueries()[0].name).to.equal("Lane 04 Watch");

        const cachedRow = new EventTableData(
            401,
            "Lane04",
            {
                occupancyCount: "401",
                startTime: "2026-11-16T09:10:00Z",
                endTime: "2026-11-16T09:10:05Z",
                gammaAlarm: true,
                neutronAlarm: false,
                maxGamma: 2450,
                maxNeutron: 9,
                adjudicatedIds: [],
                videoPaths: [],
            },
            "obs-lane04-401",
            "foi-4",
            "Primary Node",
            false,
        );

        setFilteredEventLogSnapshot(null, {
            criteria,
            rows: [cachedRow],
            rowCount: 327,
            page: 0,
            pageLoadedTime: "2026-11-16T09:15:00.000Z",
            latestCutoff: "2026-11-16T09:15:00.000Z",
            bucketCounts: null,
            vehicleSearchResult: null,
        });

        // Mark adjudicated in single-slot snapshot and verify in-place update
        markSessionCachedEventAdjudicated("obs-lane04-401", 3);
        const warmAfterAdj = getFilteredEventLogRestoreState(null);
        expect(warmAfterAdj?.snapshot?.rows[0].adjudicatedIds).to.include("code:3");

        let observationSearchCalls = 0;
        let countFetchCalls = 0;
        cy.intercept("GET", "**/observations/count*", (req) => {
            countFetchCalls += 1;
            req.reply({statusCode: 200, body: {count: 1}});
        });

        const fakeNode: any = {
            id: "node-1",
            name: "Primary Node",
            address: "127.0.0.1",
            port: 8282,
            isSecure: false,
            isDefaultNode: true,
            oshPathRoot: "/sensorhub",
            bucketsEndpoint: "/buckets",
            getConnectedSystemsEndpoint: () => "http://127.0.0.1:8282/sensorhub/api",
            getBasicAuthHeader: () => ({}),
            fetchNodeControlStreams: async () => [
                {properties: {id: "cs-rep-1", controlledProperties: [{definition: REPORT_DEF}]}},
            ],
            getObservationsApi: async () => ({
                searchObservations: async () => {
                    observationSearchCalls += 1;
                    return {
                        fetchData: async () => [],
                        nextPage: async () => [],
                    };
                },
            }),
        };

        const occStream = {
            properties: {
                id: "ds-occ-lane04",
                "system@id": "sys-lane04",
                observedProperties: [{definition: OCCUPANCY_PILLAR_DEF}],
            },
        };
        const laneEntry: any = {
            laneName: "Lane04",
            parentNode: fakeNode,
            isRS350Backpack: false,
            datastreams: [occStream],
            controlStreams: [],
            systems: [],
            findDataStreamByObsProperty: () => null,
            lookupSystemIdFromDataStreamId: () => "sys-lane04",
        };
        const laneMap = new Map([["Lane04", laneEntry]]);
        const pushedHrefs: string[] = [];
        const store = createTestStore([fakeNode], laneMap);

        cy.mount(
            <Provider store={store}>
                <AppRouterContext.Provider value={createFakeRouter(pushedHrefs)}>
                    <LanguageProvider>
                        <DataSourceContext.Provider
                            value={{
                                laneMapRef: {current: laneMap},
                                laneMapReady: true,
                                readyLaneNames: new Set(["Lane04"]),
                                activeViewKey: null,
                                scopedHref: (h: string) => h,
                            } as any}
                        >
                            <EventTable
                                tableMode="eventlog"
                                viewLane
                                viewAdjudicated
                                laneMap={laneMap}
                                restoreFiltered
                            />
                        </DataSourceContext.Provider>
                    </LanguageProvider>
                </AppRouterContext.Provider>
            </Provider>,
        );

        // Cached row renders immediately with Adjudicated = Yes and ZERO server count/observation fetches!
        cy.contains(".MuiDataGrid-row", "Lane04")
            .should("be.visible")
            .and("contain.text", "401")
            .and("contain.text", "Yes")
            .then(() => {
                expect(observationSearchCalls).to.equal(0);
                expect(countFetchCalls).to.equal(0);
            });

        // Double-clicking the row navigates to /event-details with fromFiltered=1 (clean readable URL)
        cy.contains(".MuiDataGrid-row", "Lane04").dblclick();
        cy.wrap(null).then(() => {
            expect(pushedHrefs).to.have.length(1);
            expect(pushedHrefs[0]).to.include("eventId=obs-lane04-401");
            expect(pushedHrefs[0]).to.include("fromFiltered=1");
        });

        // Opening the toolbar Saved Queries popover reveals the saved bookmark and allows deleting it
        cy.get('[data-testid="saved-queries-btn"]').click();
        cy.get('[data-testid="saved-query-bookmark-btn"]').should("contain.text", "Lane 04 Watch");
        cy.get('[data-testid="delete-saved-query-btn"]').click();
        cy.get('[data-testid="saved-query-bookmark-btn"]').should("not.exist");
        cy.then(() => {
            expect(loadSavedEventQueries()).to.have.length(0);
        });
    });
});
