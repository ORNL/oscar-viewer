import React from "react";
import {strFromU8, strToU8, unzipSync, zipSync} from "fflate";
import {LanguageProvider} from "../../src/app/contexts/LanguageContext";
import HelpDialog from "../../src/app/_components/HelpDialog";
import {
    clearSupportDiagnosticEventsForTesting,
    getSupportDiagnosticEventsSnapshot,
    installSupportDiagnosticsRecorder,
    MAX_SUPPORT_DIAGNOSTIC_EVENTS,
    recordSupportDiagnosticEvent,
    redactSupportText,
    SupportBundleExportResult,
} from "../../src/lib/data/oscar/SupportDiagnostics";

describe("Troubleshooting Support Bundle diagnostics & HelpDialog export", () => {
    beforeEach(() => {
        window.localStorage.clear();
        window.localStorage.setItem("language", "en");
        clearSupportDiagnosticEventsForTesting();
        installSupportDiagnosticsRecorder();
    });

    it("scrubs secrets at capture time and enforces the 400-event ring buffer cap", () => {
        const counter = {count: 0};
        const sanitized = redactSupportText(
            "Camera error rtsp://cam_user:CamSecret99@192.168.1.25:554/stream1?token=QuerySecret123 " +
            "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.SecretPayload " +
            "Cookie: OSCAR_SESSION=sess_secret_value_12345 token=StandaloneToken987 operator=alice.smith@ornl.gov",
            counter,
        );
        expect(sanitized).not.to.include("CamSecret99");
        expect(sanitized).not.to.include("QuerySecret123");
        expect(sanitized).not.to.include("SecretPayload");
        expect(sanitized).not.to.include("sess_secret_value_12345");
        expect(sanitized).not.to.include("StandaloneToken987");
        expect(sanitized).not.to.include("alice.smith@ornl.gov");
        expect(sanitized).to.include("rtsp://[REDACTED]@192.168.1.25:554/stream1?token=[REDACTED]");
        expect(sanitized).to.include("a***@ornl.gov");
        expect(counter.count).to.be.greaterThan(4);

        for (let i = 0; i < MAX_SUPPORT_DIAGNOSTIC_EVENTS + 25; i++) {
            recordSupportDiagnosticEvent({
                category: "app",
                level: "info",
                message: `Event #${i}`,
                details: {
                    password: "ShouldNeverRemainInMemory",
                    index: i,
                },
            });
        }

        const snapshot = getSupportDiagnosticEventsSnapshot();
        expect(snapshot.events).to.have.length(MAX_SUPPORT_DIAGNOSTIC_EVENTS);
        expect(snapshot.events[0].message).to.equal("Event #25");
        expect(snapshot.events[MAX_SUPPORT_DIAGNOSTIC_EVENTS - 1].message).to.equal(
            `Event #${MAX_SUPPORT_DIAGNOSTIC_EVENTS + 24}`,
        );
        expect(JSON.stringify(snapshot.events)).not.to.include("ShouldNeverRemainInMemory");
    });

    it("merges client flight-recorder diagnostics with backend support ZIP via HelpDialog", () => {
        console.error(
            "Simulated stream failure on rtsp://admin:StreamSecret77@10.0.0.12:554/live",
            {apiKey: "TopSecretKey888"},
        );

        const fakeBackendZip = zipSync({
            "summary.json": strToU8(JSON.stringify({
                schemaVersion: 1,
                bundleSource: "backend",
                oscarVersion: "3.11.0",
                nodeId: "default",
                logs: {errorLineCount: 2, warnLineCount: 1},
            })),
            "redaction-report.json": strToU8(JSON.stringify({
                schemaVersion: 1,
                counts: {totalRedactions: 5},
            })),
            "backend/oscar.log": strToU8("2026-11-13 22:00:00.000 ERROR Lane50 - Simulated backend log\n"),
            "backend/modules.json": strToU8(JSON.stringify({schemaVersion: 1, modules: []})),
        });

        let exportedResult: SupportBundleExportResult | null = null;
        let releaseBackendResponse: (() => void) | null = null;
        const mockFetch: typeof fetch = async () => {
            await new Promise<void>(resolve => {
                releaseBackendResponse = resolve;
            });
            const bodyCopy = new Uint8Array(fakeBackendZip.byteLength);
            bodyCopy.set(fakeBackendZip);
            return new Response(bodyCopy, {
                status: 200,
                headers: {"Content-Type": "application/zip"},
            });
        };

        cy.mount(
            <LanguageProvider>
                <HelpDialog
                    open
                    onClose={() => {}}
                    stateSummary={{
                        configuredNodeCount: 1,
                        activeViewKey: "north-gate",
                        unreadAlarmCount: 3,
                        authenticatedUserPresent: true,
                    }}
                    fetchImpl={mockFetch}
                    skipBrowserDownload
                    onBundleExported={(res) => {
                        exportedResult = res;
                    }}
                />
            </LanguageProvider>,
        );

        cy.get('[data-testid="help-export-support-bundle"]').should("be.visible").click();
        cy.get('[data-testid="help-support-bundle-progress"]')
            .should("be.visible")
            .and("have.attr", "role", "progressbar")
            .then(() => {
                releaseBackendResponse?.();
            });

        cy.get('[data-testid="help-support-bundle-status"]')
            .should("contain.text", "client + server diagnostics, secrets redacted")
            .then(() => {
                expect(exportedResult).to.not.equal(null);
                const result = exportedResult!;
                expect(result.bundleSource).to.equal("combined");
                expect(result.backendIncluded).to.equal(true);
                expect(result.fileName).to.match(/^oscar-support-\d{8}T\d{6}Z\.zip$/);

                const entries = unzipSync(result.zipBytes);
                expect(Object.keys(entries)).to.include.members([
                    "summary.json",
                    "redaction-report.json",
                    "client/client-diagnostics.json",
                    "backend/oscar.log",
                    "backend/modules.json",
                ]);

                const fullText = Object.values(entries).map(bytes => strFromU8(bytes)).join("\n");
                expect(fullText).not.to.include("StreamSecret77");
                expect(fullText).not.to.include("TopSecretKey888");
                expect(fullText).to.include("Simulated backend log");

                const summary = JSON.parse(strFromU8(entries["summary.json"]));
                expect(summary.bundleSource).to.equal("combined");
                expect(summary.backendIncluded).to.equal(true);
                expect(summary.client.errorCount).to.be.greaterThan(0);

                const clientDiag = JSON.parse(strFromU8(entries["client/client-diagnostics.json"]));
                expect(clientDiag.stateSummary.activeViewKey).to.equal("north-gate");
                expect(clientDiag.stateSummary.unreadAlarmCount).to.equal(3);
            });
    });

    it("falls back cleanly to client-only support ZIP with host CLI instructions when backend returns 502", () => {
        recordSupportDiagnosticEvent({
            category: "network",
            level: "error",
            message: "HTTP 502 on GET /sensorhub/api/systems (18 ms)",
        });

        let exportedResult: SupportBundleExportResult | null = null;
        const failingFetch: typeof fetch = async () =>
            new Response("Bad Gateway", {status: 502, statusText: "Bad Gateway"});

        cy.mount(
            <LanguageProvider>
                <HelpDialog
                    open
                    onClose={() => {}}
                    fetchImpl={failingFetch}
                    skipBrowserDownload
                    onBundleExported={(res) => {
                        exportedResult = res;
                    }}
                />
            </LanguageProvider>,
        );

        cy.contains('[role="tab"]', "Manual & Video Guides").click();
        cy.get('[data-testid="help-card-export-support-bundle"]').should("be.visible").click();

        cy.get('[data-testid="help-support-bundle-status"]')
            .should("contain.text", "./oscar.sh support-bundle")
            .and("contain.text", "oscar.bat support-bundle")
            .then(() => {
                expect(exportedResult).to.not.equal(null);
                const result = exportedResult!;
                expect(result.bundleSource).to.equal("client-only");
                expect(result.backendIncluded).to.equal(false);
                expect(result.fileName).to.match(/^oscar-client-support-\d{8}T\d{6}Z\.zip$/);

                const entries = unzipSync(result.zipBytes);
                const summary = JSON.parse(strFromU8(entries["summary.json"]));
                expect(summary.bundleSource).to.equal("client-only");
                expect(summary.backendFetchError).to.include("HTTP 502");
                expect(summary.serverCliFallback.linux).to.equal("./oscar.sh support-bundle");
                expect(summary.serverCliFallback.windows).to.equal("oscar.bat support-bundle");
            });
    });
});
