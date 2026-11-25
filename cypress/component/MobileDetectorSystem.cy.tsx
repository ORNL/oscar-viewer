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
import LaneStatusItem from "../../src/app/_components/dashboard/LaneStatusItem";
import {MobileDetectorSummaryCard} from "../../src/app/_components/lane-view/MobileDetectorView";
import {
    buildMobileAlarmPopupHtml,
    escapeHtml,
    walkerIconHtml,
} from "../../src/app/_components/maps/MapUtils";
import {
    D5_RAD_STATUS_DEF,
    D5_RADIOMETRICS_REPORT_DEF,
    D5_SPECTRUM_BINS_DEF,
    DOSE_DEF,
    DURATION_DEF,
    GAMMA_COUNT_DEF,
    LINEARSPEC_DEF,
    MOBILE_DETECTOR_SYSTEM_DEF,
} from "../../src/lib/data/Constants";
import {
    isD5SpectrumDataStream,
    isKromekD5Lane,
    isMobileDetectorLane,
    isSpectroscopicDetectorLane,
} from "../../src/lib/data/oscar/Utilities";
import {
    useLaneHealth,
    type FaultHealth,
    type LaneHealthRow,
} from "../../src/lib/data/oscar/useLaneHealth";
import AppReducer from "../../src/lib/state/Slice";
import EventDataReducer from "../../src/lib/state/EventDataSlice";
import EventDetailsReducer from "../../src/lib/state/EventDetailsSlice";
import EventPreviewReducer from "../../src/lib/state/EventPreviewSlice";
import LaneViewReducer from "../../src/lib/state/LaneViewSlice";
import OSCARClientReducer from "../../src/lib/state/OSCARClientSlice";
import OSCARLaneReducer from "../../src/lib/state/OSCARLaneSlice";
import OSHReducer from "../../src/lib/state/OSHSlice";
import PageLayoutReducer from "../../src/lib/state/PageLayoutSlice";

const CLEAR_FAULTS: FaultHealth = {
    gammaHigh: "clear",
    gammaLow: "clear",
    neutronHigh: "clear",
    tamper: "clear",
};

function makeTestStore() {
    return configureStore({
        reducer: {
            appState: AppReducer,
            oshSlice: OSHReducer,
            laneSlice: OSCARLaneReducer,
            oscarClientSlice: OSCARClientReducer,
            eventDataSlice: EventDataReducer,
            eventPreviewSlice: EventPreviewReducer,
            laneViewSlice: LaneViewReducer,
            eventDetailsSlice: EventDetailsReducer,
            pageLayoutSlice: PageLayoutReducer,
        },
        middleware: (getDefault) => getDefault({serializableCheck: false}),
    });
}

function makeFakeRealtimeSource() {
    const handlers = new Set<(msg: any) => void>();
    return {
        properties: {mqttOpts: {}},
        subscribe(fn: (msg: any) => void) {
            handlers.add(fn);
        },
        unsubscribe(fn: (msg: any) => void) {
            handlers.delete(fn);
        },
        connect: () => Promise.resolve(),
        disconnect: () => Promise.resolve(),
        isConnected: () => true,
        emit(data: any) {
            const payload = {values: [{data, timestamp: Date.now()}]};
            handlers.forEach((fn) => fn(payload));
        },
    };
}

function LaneHealthHarness() {
    const {lanes, refreshLaneHealth} = useLaneHealth();
    return (
        <div>
            <button
                type="button"
                data-testid="trigger-health-refresh"
                onClick={() => void refreshLaneHealth()}
            >
                Refresh
            </button>
            {lanes.map((row) => (
                <div
                    key={row.laneName}
                    data-testid={`health-row-${row.laneName}`}
                    data-rpm-state={row.rpm.state}
                    data-mobile={String(Boolean(row.mobile))}
                    data-monitored-faults={(row.monitoredFaults ?? []).join(",")}
                >
                    {row.rpm.state}
                </div>
            ))}
        </div>
    );
}

describe("mobile detector identification, indoor liveness, and RS-350 status clarity", () => {
    beforeEach(() => {
        localStorage.clear();
        localStorage.setItem("language", "en");
    });

    it("distinguishes mobile walkers from fixed RS-350 portals and Rapiscan RPM portals", () => {
        const explicitMobileEntry: any = {
            laneName: "Mobile Unit 1",
            isRS350Backpack: true,
            laneSystem: {
                properties: {
                    properties: {
                        uid: "urn:osh:system:lane:mobile-01",
                        definition: MOBILE_DETECTOR_SYSTEM_DEF,
                    },
                },
            },
            systems: [],
            datastreams: [
                {
                    properties: {
                        id: "ds-fg",
                        outputName: "foregroundReport",
                        observedProperties: [
                            {definition: DURATION_DEF},
                            {definition: LINEARSPEC_DEF},
                            {definition: DOSE_DEF},
                        ],
                    },
                },
            ],
            controlStreams: [],
        };

        const gpsWalkerFallbackEntry: any = {
            laneName: "Walker D5",
            isRS350Backpack: false,
            laneSystem: {
                properties: {
                    properties: {
                        uid: "urn:osh:system:lane:walker-d5",
                    },
                },
            },
            systems: [],
            datastreams: [
                {
                    properties: {
                        id: "ds-loc",
                        outputName: "location",
                        observedProperties: [{definition: "http://www.opengis.net/def/property/OGC/0/SensorLocation"}],
                    },
                },
                {
                    properties: {
                        id: "ds-d5-spec",
                        outputName: "spectrum",
                        observedProperties: [{definition: D5_SPECTRUM_BINS_DEF}],
                    },
                },
            ],
            controlStreams: [],
        };

        const fixedRs350PortalWithCamera: any = {
            laneName: "Portal RS350",
            isRS350Backpack: true,
            laneSystem: {
                properties: {
                    properties: {
                        uid: "urn:osh:system:lane:portal-rs350",
                    },
                },
            },
            systems: [
                {
                    properties: {
                        properties: {
                            uid: "urn:osh:sensor:ffmpeg:cam-01",
                            name: "Lane Camera",
                        },
                    },
                },
            ],
            datastreams: [
                {
                    properties: {
                        id: "ds-loc",
                        outputName: "location",
                        observedProperties: [],
                    },
                },
                {
                    properties: {
                        id: "ds-fg",
                        outputName: "foregroundReport",
                        observedProperties: [
                            {definition: DURATION_DEF},
                            {definition: LINEARSPEC_DEF},
                            {definition: DOSE_DEF},
                        ],
                    },
                },
            ],
            controlStreams: [{properties: {id: "cs-video", controlledProperties: [{definition: "video"}]}}],
        };

        const rapiscanPortalEntry: any = {
            laneName: "Portal Lane 1",
            isRS350Backpack: false,
            laneSystem: {
                properties: {
                    properties: {
                        uid: "urn:osh:system:lane:portal-01",
                    },
                },
            },
            systems: [],
            datastreams: [
                {
                    properties: {
                        id: "ds-gamma",
                        outputName: "gammaCounts",
                        observedProperties: [{definition: GAMMA_COUNT_DEF}],
                    },
                },
            ],
            controlStreams: [],
        };

        expect(isMobileDetectorLane(explicitMobileEntry)).to.equal(true);
        expect(isMobileDetectorLane(gpsWalkerFallbackEntry)).to.equal(true);
        expect(isKromekD5Lane(gpsWalkerFallbackEntry)).to.equal(true);
        expect(isD5SpectrumDataStream(gpsWalkerFallbackEntry.datastreams[1])).to.equal(true);

        // Fixed RS-350 with camera is NEVER misclassified as mobile, yet remains spectroscopic
        expect(isMobileDetectorLane(fixedRs350PortalWithCamera)).to.equal(false);
        expect(isSpectroscopicDetectorLane(fixedRs350PortalWithCamera)).to.equal(true);

        // Standard Rapiscan RPM portal is neither mobile nor spectroscopic
        expect(isMobileDetectorLane(rapiscanPortalEntry)).to.equal(false);
        expect(isSpectroscopicDetectorLane(rapiscanPortalEntry)).to.equal(false);
    });

    it("preserves unknown liveness on empty observation reconciliation and marks indoor walkers online via radiometric heartbeats", () => {
        let currentObservations: any[] = [];
        const fgDatastream: any = {
            properties: {
                id: "ds-indoor-fg",
                "system@id": "rpm-indoor",
                outputName: "foregroundReport",
                observedProperties: [
                    {definition: DURATION_DEF},
                    {definition: LINEARSPEC_DEF},
                    {definition: DOSE_DEF},
                ],
            },
        };

        const indoorEntry: any = {
            laneName: "Indoor Backpack",
            isRS350Backpack: true,
            parentNode: {
                id: "node-indoor",
                name: "Test Node",
                getConnectedSystemsEndpoint: () => "https://example.invalid/sensorhub/api",
                getBasicAuthHeader: () => ({}),
                getObservationsApi: () => ({
                    searchObservations: () =>
                        Promise.resolve({
                            nextPage: () => Promise.resolve(currentObservations),
                        }),
                }),
            },
            laneSystem: {
                properties: {
                    id: "sys-indoor",
                    properties: {
                        uid: "urn:osh:system:lane:indoor-01",
                        definition: MOBILE_DETECTOR_SYSTEM_DEF,
                    },
                },
            },
            systems: [
                {
                    properties: {
                        id: "rpm-indoor",
                        properties: {
                            uid: "urn:osh:sensor:rs350:indoor-01",
                            name: "RS-350 Backpack",
                        },
                    },
                },
            ],
            datastreams: [fgDatastream],
            datasourcesRealtime: [],
            controlStreams: [],
        };

        const map = new Map<string, any>([["Indoor Backpack", indoorEntry]]);
        const store = makeTestStore();
        cy.mount(
            <Provider store={store}>
                <DataSourceContext.Provider value={{laneMapRef: {current: map}, laneMapReady: true} as any}>
                    <LaneHealthHarness/>
                </DataSourceContext.Provider>
            </Provider>,
        );

        // Empty observation reconciliation keeps state as "unknown" (Waiting), never premature "offline"
        cy.get('[data-testid="health-row-Indoor Backpack"]')
            .should("have.attr", "data-rpm-state", "unknown")
            .and("have.attr", "data-mobile", "true")
            .and("have.attr", "data-monitored-faults", "");

        // Returning an indoor foregroundReport heartbeat with zero GPS fixes transitions state to "online"
        cy.then(() => {
            currentObservations = [
                {
                    properties: {
                        "datastream@id": "ds-indoor-fg",
                        phenomenonTime: new Date().toISOString(),
                        resultTime: new Date().toISOString(),
                        result: {dose: 0.085, neutronCounts: 1},
                    },
                },
            ];
        });
        cy.get('[data-testid="trigger-health-refresh"]').click();

        cy.get('[data-testid="health-row-Indoor Backpack"]')
            .should("have.attr", "data-rpm-state", "online");
    });

    it("renders mobile fault suppression on walkers and suppresses non-existent Rapiscan fault chips on fixed RS-350 portals (#44)", () => {
        const unknownFaults: FaultHealth = {
            gammaHigh: "unknown",
            gammaLow: "unknown",
            neutronHigh: "unknown",
            tamper: "unknown",
        };
        const baseRow: LaneHealthRow = {
            laneName: "Mobile 1",
            nodeName: "Test Node",
            rpm: {id: "rpm-1", label: "RS-350", state: "online"},
            cameras: [],
            faults: unknownFaults,
            monitoredFaults: [],
            mobile: true,
            occupancyState: "clear",
            occupancyStartedAt: null,
            lastUpdatedAt: Date.now(),
            occupancyDuration: 0,
            extendedOccupancy: "unknown",
            hasFault: false,
            hasOfflineComponent: false,
            hasUnknownTelemetry: false,
        };

        cy.mount(
            <ThemeProvider theme={getTheme("light")}>
                <LanguageProvider>
                    <div>
                        <LaneStatusItem health={baseRow} onSelect={cy.stub()} onClearTamper={cy.stub()}/>
                        <LaneStatusItem
                            health={{
                                ...baseRow,
                                laneName: "Fixed RS350",
                                mobile: false,
                                monitoredFaults: [],
                                extendedOccupancy: "active",
                            }}
                            onSelect={cy.stub()}
                            onClearTamper={cy.stub()}
                        />
                        <LaneStatusItem
                            health={{
                                ...baseRow,
                                laneName: "Rapiscan 1",
                                mobile: false,
                                monitoredFaults: undefined,
                            }}
                            onSelect={cy.stub()}
                            onClearTamper={cy.stub()}
                        />
                    </div>
                </LanguageProvider>
            </ThemeProvider>,
        );

        // Mobile walker omits all portal fault and extendedOccupancy badges even when telemetry is unknown
        cy.get('[data-testid="lane-health-Mobile 1-gamma-high"]').should("not.exist");
        cy.get('[data-testid="lane-health-Mobile 1-extended-occupancy"]').should("not.exist");

        // Fixed spectroscopic RS-350 omits Rapiscan fault badges while retaining extended-occupancy
        cy.get('[data-testid="lane-health-Fixed RS350-gamma-high"]').should("not.exist");
        cy.get('[data-testid="lane-health-Fixed RS350-tamper"]').should("not.exist");
        cy.get('[data-testid="lane-health-Fixed RS350-extended-occupancy"]')
            .should("exist")
            .and("have.attr", "data-state", "active");

        // Standard Rapiscan portal retains all 4 fault badges + extended-occupancy
        cy.get('[data-testid="lane-health-Rapiscan 1-gamma-high"]').should("exist");
        cy.get('[data-testid="lane-health-Rapiscan 1-gamma-low"]').should("exist");
        cy.get('[data-testid="lane-health-Rapiscan 1-neutron-high"]').should("exist");
        cy.get('[data-testid="lane-health-Rapiscan 1-tamper"]').should("exist");
        cy.get('[data-testid="lane-health-Rapiscan 1-extended-occupancy"]').should("exist");
    });

    it("HTML-escapes untrusted strings in mobile alarm popups and walker markers without inline onclick handlers", () => {
        const xssLane = `<img src=x onerror="alert(1)">`;
        const popupHtml = buildMobileAlarmPopupHtml(
            {
                obsId: `obs-"1'`,
                laneName: xssLane,
                timestamp: "2026-10-16T16:00:00Z",
                status: "Gamma",
                location: {lat: 35.9, lon: -84.3},
                adjudication: {
                    code: `Code <script>evil()</script>`,
                    isotopes: [`Cs-137"><svg onload=alert(2)>`],
                    secondaryInspectionStatus: "NONE",
                    time: "2026-10-16T16:01:00Z",
                },
            },
            {
                eventHref: `/event-details?eventId=obs-%221%27"><script>`,
                viewEventLabel: `VIEW <EVENT>`,
                adjudicatedLabel: "Adjudicated",
                unadjudicatedLabel: "Unadjudicated",
            },
        );

        expect(popupHtml).not.to.include("<script>");
        expect(popupHtml).not.to.include("<img");
        expect(popupHtml).not.to.include("onclick=");
        expect(popupHtml).not.to.include("onClick=");
        expect(popupHtml).to.include("data-nav-href=");
        expect(popupHtml).to.include(escapeHtml(xssLane));

        const iconMarkup = walkerIconHtml(xssLane, "alarm", "Stale <tag>");
        expect(iconMarkup).not.to.include("<img");
        expect(iconMarkup).not.to.include("<tag>");
        expect(iconMarkup).to.include(escapeHtml(xssLane));
    });

    it("renders MobileDetectorSummaryCard indoor GPS fallback and updates live D5 telemetry", () => {
        const radSource = makeFakeRealtimeSource();
        const specSource = makeFakeRealtimeSource();
        const d5Entry: any = {
            laneName: "D5 Walker 2",
            isRS350Backpack: false,
            laneSystem: {
                properties: {
                    properties: {
                        uid: "urn:osh:system:lane:d5-02",
                        definition: MOBILE_DETECTOR_SYSTEM_DEF,
                    },
                },
            },
            systems: [],
            datastreams: [
                {
                    properties: {
                        id: "ds-d5-rad",
                        outputName: "kromekSerialRadiometricStatusReport",
                        observedProperties: [{definition: D5_RAD_STATUS_DEF}],
                    },
                },
                {
                    properties: {
                        id: "ds-d5-spec",
                        outputName: "spectrum",
                        observedProperties: [{definition: D5_SPECTRUM_BINS_DEF}],
                    },
                },
            ],
            datasourcesRealtime: [
                {
                    properties: {resource: "/datastreams/ds-d5-rad/observations", mqttOpts: {}},
                    subscribe: radSource.subscribe.bind(radSource),
                    unsubscribe: radSource.unsubscribe.bind(radSource),
                    connect: radSource.connect,
                    disconnect: radSource.disconnect,
                    isConnected: radSource.isConnected,
                },
                {
                    properties: {resource: "/datastreams/ds-d5-spec/observations", mqttOpts: {}},
                    subscribe: specSource.subscribe.bind(specSource),
                    unsubscribe: specSource.unsubscribe.bind(specSource),
                    connect: specSource.connect,
                    disconnect: specSource.disconnect,
                    isConnected: specSource.isConnected,
                },
            ],
            controlStreams: [],
        };

        const store = makeTestStore();
        cy.mount(
            <Provider store={store}>
                <ThemeProvider theme={getTheme("light")}>
                    <LanguageProvider>
                        <MobileDetectorSummaryCard entry={d5Entry} currentLane="D5 Walker 2"/>
                    </LanguageProvider>
                </ThemeProvider>
            </Provider>,
        );

        cy.get('[data-testid="mobile-detector-gps-indoor"]').should("contain.text", "Indoor / GPS unavailable");
        cy.get('[data-testid="mobile-detector-live-status-chip"]').should("contain.text", "Waiting");

        cy.then(() => {
            specSource.emit({doseRate: 0.42, gammaCounts: 320, neutronCounts: 2});
            radSource.emit({gammaCpsAlarmActive: true});
        });

        cy.get('[data-testid="mobile-detector-live-status-chip"]').should("contain.text", "Alarm");
        cy.contains("0.420 µSv/h").should("exist");
    });
});
