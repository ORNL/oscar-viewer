import React, {useState} from "react";
import AdjudicationSelect from "../../src/app/_components/adjudication/AdjudicationSelect";
import DataRow from "../../src/app/_components/event-details/DataRow";
import {LanguageProvider, useLanguage} from "../../src/app/contexts/LanguageContext";
import {formatOccupancyStatus} from "../../src/app/utils/LocaleUtils";
import {AdjudicationCodes} from "../../src/lib/data/oscar/adjudication/models/AdjudicationConstants";

function StatusAndTermsHarness() {
    const {t} = useLanguage();
    return (
        <div>
            <span data-cy="status-gn">{formatOccupancyStatus("Gamma & Neutron", t)}</span>
            <span data-cy="status-gamma">{formatOccupancyStatus("Gamma", t)}</span>
            <span data-cy="status-neutron">{formatOccupancyStatus("Neutron", t)}</span>
            <span data-cy="status-none">{formatOccupancyStatus("None", t)}</span>
            <span data-cy="lane-id">{t("laneId")}</span>
            <span data-cy="occupancy-id">{t("occupancyId")}</span>
            <span data-cy="detector-1">{`${t("detector")} 1`}</span>
            <span data-cy="bulk-adj">{t("bulkAdjudication")}</span>
            <span data-cy="current-occ">{t("currentOccupancy")}</span>
            <span data-cy="adjudicated">{t("adjudicated")}</span>
            <span data-cy="lanes-faults">{t("lanesWithFaults")}</span>
        </div>
    );
}

function CustomCodeHarness() {
    const [code, setCode] = useState(AdjudicationCodes.codes[0]);
    const fakeNode: any = {
        id: "node-1",
        getConnectedSystemsEndpoint: () => "https://node-1/api",
        createRealtimeObservationSource: () => ({
            subscribe: () => {},
            connect: async () => {},
            reset: async () => {},
        }),
        fetchDataStreamWithObservedProperty: async () => ({
            searchObservations: async () => ({
                nextPage: async () => [{result: {codes: [{code: 42, label: "Local review"}]}}],
            }),
        }),
    };
    return (
        <LanguageProvider>
            <AdjudicationSelect adjCode={code} onSelect={setCode} nodes={[fakeNode]}/>
        </LanguageProvider>
    );
}

describe("i18n domain terminology, status localization, and compact headers", () => {
    it("localizes occupancy statuses and compact RPM terms in Greek", () => {
        localStorage.setItem("language", "el");
        cy.mount(<LanguageProvider><StatusAndTermsHarness/></LanguageProvider>);
        cy.get('[data-cy="status-gn"]').should("have.text", "Γάμμα και νετρόνια");
        cy.get('[data-cy="status-gamma"]').should("have.text", "Γάμμα");
        cy.get('[data-cy="status-neutron"]').should("have.text", "Νετρόνια");
        cy.get('[data-cy="status-none"]').should("have.text", "Κανένα");
        cy.get('[data-cy="lane-id"]').should("have.text", "Λωρίδα");
        cy.get('[data-cy="occupancy-id"]').should("have.text", "Διέλευση");
        cy.get('[data-cy="detector-1"]').should("have.text", "Ανιχνευτής 1");
        cy.get('[data-cy="bulk-adj"]').should("have.text", "Μαζική αξιολόγηση");
        cy.get('[data-cy="current-occ"]').should("have.text", "Τρέχουσα διέλευση");
    });

    it("localizes occupancy statuses and domain terms in Spanish and French", () => {
        localStorage.setItem("language", "es");
        cy.mount(<LanguageProvider><StatusAndTermsHarness/></LanguageProvider>);
        cy.get('[data-cy="status-none"]').should("have.text", "Ninguno");
        cy.get('[data-cy="lane-id"]').should("have.text", "ID carril");
        cy.get('[data-cy="lanes-faults"]').should("have.text", "Carriles con fallos");

        cy.then(() => localStorage.setItem("language", "fr"));
        cy.mount(<LanguageProvider><StatusAndTermsHarness/></LanguageProvider>);
        cy.get('[data-cy="status-none"]').should("have.text", "Aucun");
        cy.get('[data-cy="adjudicated"]').should("have.text", "Adjugé");
        cy.get('[data-cy="lane-id"]').should("have.text", "ID voie");
    });

    it("formats custom disposition codes in the active locale", () => {
        localStorage.setItem("language", "el");
        cy.mount(<CustomCodeHarness/>);
        cy.get('[role="combobox"]').click();
        cy.contains('[role="option"]', "Κωδικός 42: Local review").should("exist");
    });

    it("renders single-line Event Details summary headers without wrapping", () => {
        localStorage.setItem("language", "el");
        const sampleEvent: any = {
            id: 1,
            laneId: "Lane01",
            occupancyCount: "101",
            occupancyObsId: "00000000-0000-4000-8000-000000000001",
            startTime: "2026-01-01T00:00:00Z",
            endTime: "2026-01-01T00:00:05Z",
            maxGamma: 120,
            maxNeutron: 4,
            status: "Gamma",
            adjudicatedIds: [],
            secondaryInspection: "COMPLETED",
        };
        cy.mount(<LanguageProvider><DataRow eventData={sampleEvent} nodeId="node-1"/></LanguageProvider>);
        cy.contains("th", "Λωρίδα").should("have.css", "white-space", "nowrap");
        cy.contains("td", "Γάμμα").should("exist");
    });
});
