import React from "react";
import {LanguageProvider} from "../../src/app/contexts/LanguageContext";
import GatewayTlsStatusBanner from "../../src/app/_components/health/GatewayTlsStatusBanner";
import type {GatewayTlsStatus} from "../../src/lib/data/oscar/GatewayTlsApi";

function mountBanner(status: GatewayTlsStatus | null) {
    cy.mount(
        <LanguageProvider>
            <GatewayTlsStatusBanner status={status}/>
        </LanguageProvider>,
    );
}

describe("GatewayTlsStatusBanner", () => {
    it("renders nothing when healthy (> 60 days) or unavailable", () => {
        mountBanner({available: true, status: "OK", daysRemaining: 365, notAfter: "2027-11-27T00:00:00Z"});
        cy.get("[data-testid='gateway-tls-expiry-banner']").should("not.exist");

        mountBanner({available: false, status: "UNAVAILABLE"});
        cy.get("[data-testid='gateway-tls-expiry-banner']").should("not.exist");

        mountBanner(null);
        cy.get("[data-testid='gateway-tls-expiry-banner']").should("not.exist");
    });

    it("renders a warning alert when certificate expires within 60 days", () => {
        mountBanner({
            available: true,
            status: "WARNING",
            daysRemaining: 42,
            notAfter: "2027-01-08T00:00:00Z",
            selfSigned: true,
        });
        cy.get("[data-testid='gateway-tls-expiry-banner']")
            .should("be.visible")
            .and("contain.text", "HTTPS gateway certificate expiring soon")
            .and("contain.text", "42 days");
    });

    it("renders a critical error alert when certificate is within 14 days or expired", () => {
        mountBanner({
            available: true,
            status: "CRITICAL",
            daysRemaining: 5,
            notAfter: "2026-12-02T00:00:00Z",
        });
        cy.get("[data-testid='gateway-tls-expiry-banner']")
            .should("be.visible")
            .and("contain.text", "requires immediate renewal")
            .and("contain.text", "5 days");

        mountBanner({
            available: true,
            status: "EXPIRED",
            daysRemaining: -2,
            notAfter: "2026-11-25T00:00:00Z",
        });
        cy.get("[data-testid='gateway-tls-expiry-banner']")
            .should("be.visible")
            .and("contain.text", "requires immediate renewal")
            .and("contain.text", "expired on");
    });
});
