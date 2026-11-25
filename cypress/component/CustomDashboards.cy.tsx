/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import React from "react";
import {ThemeProvider} from "@mui/material";
import {Provider} from "react-redux";
import {configureStore} from "@reduxjs/toolkit";

import {LanguageProvider} from "../../src/app/contexts/LanguageContext";
import {DataSourceContext} from "../../src/app/contexts/DataSourceContext";
import {getTheme} from "../../src/app/style/theme";
import AddWidgetDialog from "../../src/app/_components/layout/AddWidgetDialog";
import ChartLane from "../../src/app/_components/lane-view/ChartLane";
import {readConfigFile} from "../../src/lib/layout/ConfigIO";
import {
    rehydratePageLayoutState,
    validateConfigJsonText,
    validateExportedConfig,
} from "../../src/lib/layout/ConfigValidation";
import {buildPageFromTemplate} from "../../src/lib/layout/DefaultPages";
import {
    buildDefaultWidgetConfig,
    MAX_CONFIG_FILE_BYTES,
    PAGE_CONFIG_SCHEMA_VERSION,
    PageConfig,
} from "../../src/lib/layout/PageConfigTypes";
import PageLayoutReducer, {
    addPage,
    addWidget,
    buildLayoutScopeKey,
    setActiveLayoutScope,
} from "../../src/lib/state/PageLayoutSlice";
import AppReducer from "../../src/lib/state/Slice";
import EventDataReducer from "../../src/lib/state/EventDataSlice";
import EventDetailsReducer from "../../src/lib/state/EventDetailsSlice";
import EventPreviewReducer from "../../src/lib/state/EventPreviewSlice";
import LaneViewReducer from "../../src/lib/state/LaneViewSlice";
import OSCARClientReducer from "../../src/lib/state/OSCARClientSlice";
import OSCARLaneReducer from "../../src/lib/state/OSCARLaneSlice";
import OSHReducer from "../../src/lib/state/OSHSlice";
import {AlarmStatsRegistry} from "../../src/lib/data/oscar/stats/AlarmStatsRegistry";
import {BUCKET_MS, MAX_PROFILE_INTERVALS} from "../../src/lib/data/oscar/stats/alarmStatsTypes";
import {
    buildProfileIntervals,
    fetchObservationCount,
} from "../../src/lib/data/oscar/stats/fetchObservationCounts";

function makeDashboardStore() {
    return configureStore({
        reducer: {
            appState: AppReducer,
            oshSlice: OSHReducer,
            laneSlice: OSCARLaneReducer,
            oscarClientSlice: OSCARClientReducer,
            eventDataSlice: EventDataReducer,
            eventPreviewSlice: EventPreviewSliceReducer(),
            laneViewSlice: LaneViewReducer,
            eventDetailsSlice: EventDetailsReducer,
            pageLayoutSlice: PageLayoutReducer,
        },
        middleware: (getDefault) => getDefault({serializableCheck: false}),
    });
}

function EventPreviewSliceReducer() {
    return EventPreviewReducer;
}

function validExportPayload(pageOverrides: Partial<PageConfig> = {}) {
    const basePage: PageConfig = {
        id: "page-test-1",
        title: "Gate Wallboard",
        icon: "grid",
        showInNav: true,
        widgets: [
            {
                id: "w-1",
                type: "system-status",
                config: {lanes: {mode: "all"}},
            },
        ],
        layouts: {
            lg: [{i: "w-1", x: 0, y: 0, w: 8, h: 6}],
        },
        ...pageOverrides,
    };
    return {
        kind: "oscar-viewer-pages",
        schemaVersion: PAGE_CONFIG_SCHEMA_VERSION,
        exportedAt: "2026-10-16T16:00:00.000Z",
        pages: [basePage],
    };
}

describe("opt-in custom dashboards: validation, caps, layout scoping, and scale-safe stats", () => {
    beforeEach(() => {
        localStorage.clear();
        localStorage.setItem("language", "en");
        AlarmStatsRegistry.evictAll();
    });

    afterEach(() => {
        AlarmStatsRegistry.evictAll();
    });

    it("enforces 512 KiB file size cap, layout bounds, refreshSec >= 60, widget caps, and strips route-hijack fields", () => {
        // 1. Oversized > 512 KiB rejected before parsing
        const oversizedText = "x".repeat(MAX_CONFIG_FILE_BYTES + 128);
        const textResult = validateConfigJsonText(oversizedText);
        expect(textResult.ok).to.equal(false);

        const oversizedFile = new File([oversizedText], "huge.json", {type: "application/json"});
        cy.wrap(
            readConfigFile(oversizedFile).then(
                () => "resolved",
                (err: Error) => err.message,
            ),
        ).should("include", "512 KiB");

        // 2. Out-of-bounds layout height h > 24 and width w > 12 rejected
        const badHeight = validateExportedConfig(
            validExportPayload({
                layouts: {lg: [{i: "w-1", x: 0, y: 0, w: 8, h: 25}]},
            }),
        );
        expect(badHeight.ok).to.equal(false);

        const badX = validateExportedConfig(
            validExportPayload({
                layouts: {lg: [{i: "w-1", x: 12, y: 0, w: 4, h: 6}]},
            }),
        );
        expect(badX.ok).to.equal(false);

        // 3. alarm-stats refreshSec < 60 (non-zero) rejected; 0 and >= 60 accepted
        const fastRefresh = validateExportedConfig(
            validExportPayload({
                widgets: [
                    {
                        id: "w-1",
                        type: "alarm-stats",
                        config: {
                            visualization: "rate-trend",
                            lanes: {mode: "all"},
                            refreshSec: 15,
                        },
                    },
                ],
            }),
        );
        expect(fastRefresh.ok).to.equal(false);

        const manualRefresh = validateExportedConfig(
            validExportPayload({
                widgets: [
                    {
                        id: "w-1",
                        type: "alarm-stats",
                        config: {
                            visualization: "rate-trend",
                            lanes: {mode: "all"},
                            refreshSec: 0,
                        },
                    },
                ],
            }),
        );
        expect(manualRefresh.ok).to.equal(true);

        // 4. Per-page cap: 5 video widgets rejected, 7 chart widgets rejected
        const fiveVideos = Array.from({length: 5}, (_, idx) => ({
            id: `v-${idx}`,
            type: "video" as const,
            config: {laneSource: {source: "page" as const}},
        }));
        const tooManyVideos = validateExportedConfig(
            validExportPayload({
                widgets: fiveVideos,
                layouts: {
                    lg: fiveVideos.map((v, idx) => ({i: v.id, x: 0, y: idx * 6, w: 4, h: 6})),
                },
            }),
        );
        expect(tooManyVideos.ok).to.equal(false);

        const sevenCharts = Array.from({length: 7}, (_, idx) => ({
            id: `c-${idx}`,
            type: "chart" as const,
            config: {laneSource: {source: "page" as const}},
        }));
        const tooManyCharts = validateExportedConfig(
            validExportPayload({
                widgets: sevenCharts,
                layouts: {
                    lg: sevenCharts.map((c, idx) => ({i: c.id, x: 0, y: idx * 5, w: 6, h: 5})),
                },
            }),
        );
        expect(tooManyCharts.ok).to.equal(false);

        // 5. Malformed LaneSelection rejected
        const badLanes = validateExportedConfig(
            validExportPayload({
                widgets: [
                    {
                        id: "w-1",
                        type: "system-status",
                        config: {lanes: {mode: "include", lanes: [123 as any]}},
                    },
                ],
            }),
        );
        expect(badLanes.ok).to.equal(false);

        // 6. Legacy seededRoute / mainRoute stripped on import and rehydrate
        const legacyPayload = validExportPayload({
            ...({seededRoute: "/", mainRoute: "/"} as any),
        });
        const validated = validateExportedConfig(legacyPayload);
        expect(validated.ok).to.equal(true);
        if (validated.ok) {
            expect(validated.value.pages[0]).not.to.have.property("seededRoute");
            expect(validated.value.pages[0]).not.to.have.property("mainRoute");
        }

        const rehydrated = rehydratePageLayoutState({
            schemaVersion: PAGE_CONFIG_SCHEMA_VERSION,
            pages: [legacyPayload.pages[0]],
        });
        expect(rehydrated.pages).to.have.length(1);
        expect(rehydrated.pages[0]).not.to.have.property("seededRoute");

        // Starter templates all pass strict validation
        for (const tpl of ["multi-lane-wallboard", "alarm-map-overview", "statistics-overview", "dashboard"]) {
            const built = buildPageFromTemplate(tpl, {id: `p-${tpl}`, title: tpl}, ["Lane 1", "Lane 2"]);
            expect(built).to.not.equal(undefined);
            const tplValidation = validateExportedConfig({
                kind: "oscar-viewer-pages",
                schemaVersion: PAGE_CONFIG_SCHEMA_VERSION,
                exportedAt: "2026-10-16T16:00:00.000Z",
                pages: [built!],
            });
            expect(tplValidation.ok, `template ${tpl} validation`).to.equal(true);
        }
    });

    it("disables video at 4/4 and chart at 6/6 in AddWidgetDialog and isolates layouts by operator + view scope", () => {
        const store = makeDashboardStore();
        store.dispatch(setActiveLayoutScope(buildLayoutScopeKey("operatorA", "north-gate")));

        const cappedPage: PageConfig = {
            id: "page-caps",
            title: "Capped Page",
            widgets: [],
            layouts: {lg: []},
        };
        store.dispatch(addPage(cappedPage));

        for (let i = 0; i < 5; i += 1) {
            store.dispatch(
                addWidget({
                    pageId: "page-caps",
                    widget: {id: `vid-${i}`, type: "video", config: buildDefaultWidgetConfig("video")},
                }),
            );
        }
        for (let i = 0; i < 7; i += 1) {
            store.dispatch(
                addWidget({
                    pageId: "page-caps",
                    widget: {id: `cht-${i}`, type: "chart", config: buildDefaultWidgetConfig("chart")},
                }),
            );
        }

        // Reducer enforces hard cap of 4 video + 6 chart = 10 widgets total
        expect(store.getState().pageLayoutSlice.pages[0].widgets).to.have.length(10);

        cy.mount(
            <Provider store={store}>
                <ThemeProvider theme={getTheme("light")}>
                    <LanguageProvider>
                        <AddWidgetDialog pageId="page-caps" open onClose={cy.stub()}/>
                    </LanguageProvider>
                </ThemeProvider>
            </Provider>,
        );

        cy.get('[data-testid="add-widget-video"]').should("be.disabled");
        cy.get('[data-testid="widget-cap-badge-video"]').should("contain.text", "4/4");
        cy.get('[data-testid="add-widget-chart"]').should("be.disabled");
        cy.get('[data-testid="widget-cap-badge-chart"]').should("contain.text", "6/6");
        cy.get('[data-testid="add-widget-map"]').should("not.be.disabled");

        // Switching to a different operator or operational view isolates custom dashboards
        cy.then(() => {
            store.dispatch(setActiveLayoutScope(buildLayoutScopeKey("operatorB", "south-gate")));
            expect(store.getState().pageLayoutSlice.pages).to.have.length(0);

            store.dispatch(setActiveLayoutScope(buildLayoutScopeKey("operatorA", "north-gate")));
            expect(store.getState().pageLayoutSlice.pages).to.have.length(1);
            expect(store.getState().pageLayoutSlice.pages[0].id).to.equal("page-caps");
        });
    });

    it("caps profile intervals to <= 30, queries /observations/count with phenomenonTime + credentials:include, and evicts immediately on release", () => {
        const endMs = Date.parse("2026-10-31T12:00:00.000Z");
        const start30d = endMs - 30 * 24 * 3_600_000;

        const hourlyIntervals = buildProfileIntervals(BUCKET_MS["1h"], start30d, endMs);
        expect(hourlyIntervals.length).to.be.at.most(MAX_PROFILE_INTERVALS);

        const dailyIntervals = buildProfileIntervals(BUCKET_MS["1d"], start30d, endMs);
        expect(dailyIntervals.length).to.be.at.most(MAX_PROFILE_INTERVALS);

        let capturedUrl = "";
        let capturedInit: RequestInit | undefined;
        cy.stub(window, "fetch").callsFake((input: RequestInfo | URL, init?: RequestInit) => {
            capturedUrl = String(input);
            capturedInit = init;
            return Promise.resolve(
                new Response(JSON.stringify({count: 17}), {
                    status: 200,
                    headers: {"Content-Type": "application/json"},
                }),
            );
        });

        const fakeNode: any = {
            id: "node-1",
            getConnectedSystemsEndpoint: () => "https://oscar.example/sensorhub/api",
            getBasicAuthHeader: () => ({}),
        };

        cy.wrap(
            fetchObservationCount(
                fakeNode,
                ["ds-occ-1", "ds-occ-2"],
                "2026-10-31T00:00:00.000Z",
                "2026-10-31T01:00:00.000Z",
            ),
        ).then((count) => {
            expect(count).to.equal(17);
            expect(capturedUrl).to.include("phenomenonTime=");
            expect(capturedUrl).not.to.include("resultTime=");
            expect(capturedInit?.credentials).to.equal("include");
        });

        // Verify immediate eviction (0 lingering entries) and empty-laneMap clearing
        const laneEntry: any = {
            laneName: "Lane 1",
            parentNode: fakeNode,
            datastreams: [
                {
                    properties: {
                        id: "ds-occ-1",
                        outputName: "occupancy",
                        observedProperties: [{definition: "http://www.opengis.net/def/rip/Occupancy"}],
                    },
                    searchObservations: cy.stub().resolves({
                        hasNext: () => false,
                        nextPage: () => Promise.resolve([]),
                    }),
                },
            ],
        };
        AlarmStatsRegistry.setLaneMap(new Map([["Lane 1", laneEntry]]), "north-gate");
        AlarmStatsRegistry.acquire(
            "sub-1",
            {
                lanes: ["Lane 1"],
                window: "1h",
                bucket: "auto",
                needAdjudication: false,
                liveAppend: false,
                refreshSec: 300,
                seedMode: "observations",
            },
            () => {},
        );
        expect(AlarmStatsRegistry.activeEntryCount()).to.equal(1);

        // Switching to an empty view replaces laneMap rather than retaining stale lanes
        AlarmStatsRegistry.setLaneMap(new Map(), "empty-gate");
        AlarmStatsRegistry.release("sub-1");
        expect(AlarmStatsRegistry.activeEntryCount()).to.equal(0);
    });

    it("assigns unique canvas container DOM IDs when multiple ChartLane widgets are mounted simultaneously", () => {
        const store = makeDashboardStore();
        const noopReady = () => {};

        cy.mount(
            <Provider store={store}>
                <DataSourceContext.Provider
                    value={{
                        laneMapRef: {current: new Map()},
                        laneMapReady: true,
                        readyLaneNames: new Set(),
                        activeViewKey: null,
                        viewError: null,
                        availableViews: [],
                        totalCatalogLaneCount: 0,
                        setActiveView: () => {},
                        refreshOperationalViews: async () => {},
                        scopedHref: (p: string) => p,
                        currentSession: null,
                    } as any}
                >
                    <ThemeProvider theme={getTheme("light")}>
                        <LanguageProvider>
                            <div>
                                <ChartLane
                                    instanceId="widget-chart-alpha"
                                    laneName="Lane 1"
                                    setChartReady={noopReady}
                                    datasources={{}}
                                />
                                <ChartLane
                                    instanceId="widget-chart-beta"
                                    laneName="Lane 1"
                                    setChartReady={noopReady}
                                    datasources={{}}
                                />
                            </div>
                        </LanguageProvider>
                    </ThemeProvider>
                </DataSourceContext.Provider>
            </Provider>,
        );

        cy.get("#chart-view-gamma-widget-chart-alpha").should("have.length", 1);
        cy.get("#chart-view-gamma-widget-chart-beta").should("have.length", 1);
        cy.get("#chart-view-neutron-widget-chart-alpha").should("have.length", 1);
        cy.get("#chart-view-neutron-widget-chart-beta").should("have.length", 1);
    });
});
