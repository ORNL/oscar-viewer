import React from "react";
import {LanguageProvider} from "../../src/app/contexts/LanguageContext";
import UsersAccessManager from "../../src/app/_components/users/UsersAccessManager";
import {
    extractFederationServiceUser,
    parseBulkUserRoster,
} from "../../src/lib/data/oscar/AuthSessionApi";

describe("Users, Passkeys & Access Control Console", () => {
    beforeEach(() => {
        window.localStorage.clear();
        window.localStorage.setItem("language", "en");
    });

    it("parses Federation Service Token MQTT usernames and bulk CSV/TSV user rosters deterministically", () => {
        expect(extractFederationServiceUser("oscar_fed_9a8b7c6d5e_SuperSecretTokenValue")).to.equal("svc-fed-9a8b7c6d5e");
        expect(extractFederationServiceUser("  oscar_fed_abc123def4_Secret99  ")).to.equal("svc-fed-abc123def4");
        expect(extractFederationServiceUser("not_a_fed_token")).to.equal(null);
        expect(extractFederationServiceUser("")).to.equal(null);

        const parsed = parseBulkUserRoster(
            "username,role,display_name,views\n" +
            "maria.gatehouse,operator,,north-gate|truck-portal\n" +
            "sam.auditor\tSam Compliance\tauditor\tall\n",
        );
        expect(parsed).to.have.length(2);
        expect(parsed[0].username).to.equal("maria.gatehouse");
        expect(parsed[0].displayName).to.equal("Maria Gatehouse");
        expect(parsed[0].role).to.equal("operator");
        expect(parsed[0].allowedViews).to.deep.equal(["north-gate", "truck-portal"]);
        // Column-swap auto-detection: Full Name in col 2 + "auditor" in col 3 -> viewer
        expect(parsed[1].username).to.equal("sam.auditor");
        expect(parsed[1].displayName).to.equal("Sam Compliance");
        expect(parsed[1].role).to.equal("viewer");
        expect(parsed[1].allowedViews).to.deep.equal([]);
    });

    it("shows self-service Passkey & password management only (no admin tabs) for an Operator scoped to gates", () => {
        let passkeys = [
            {
                id: "cGtfeXViaWtleV8wMQ",
                name: "Gatehouse YubiKey 5C",
                aaguid: "2fc0579f-8113-47ea-b116-bb5a8db9202a",
                authenticatorLabel: "YubiKey 5 Series",
                backupEligible: false,
                backupState: false,
                createdAt: 1731800000000,
                lastUsedAt: 1731850000000,
            },
        ];

        cy.intercept({method: "GET", pathname: "/sensorhub/session"}, {
            statusCode: 200,
            body: {
                username: "gate.operator",
                displayName: "Maria Gatehouse",
                primaryRole: "operator",
                roles: ["operator"],
                isAdmin: false,
                canAdjudicate: true,
                isReadOnly: false,
                allowedViews: ["north-gate", "truck-portal"],
                mustChangePassword: false,
                passkeyUserId: "dXNlcl9tYXJpYQ",
                passkeyCount: passkeys.length,
                authSource: "passkey",
                keepSignedIn: true,
                idleTimeoutSeconds: 0,
                absoluteTimeoutSeconds: 0,
                rpId: "oscar.local",
                rpIdSupported: true,
            },
        }).as("getSession");

        cy.intercept({method: "GET", pathname: "/sensorhub/session/account/passkeys"}, (req) => {
            req.reply({
                statusCode: 200,
                body: {
                    rpId: "oscar.local",
                    rpIdSupported: true,
                    passkeyUserId: "dXNlcl9tYXJpYQ",
                    acceptedCredentialIds: passkeys.map((p) => p.id),
                    passkeys,
                },
            });
        }).as("getPasskeys");

        cy.intercept("DELETE", "/sensorhub/session/account/passkeys/*", (req) => {
            passkeys = [];
            req.reply({
                statusCode: 200,
                body: {
                    rpId: "oscar.local",
                    rpIdSupported: true,
                    passkeyUserId: "dXNlcl9tYXJpYQ",
                    acceptedCredentialIds: [],
                    passkeys: [],
                },
            });
        }).as("deletePasskey");

        cy.mount(
            <LanguageProvider>
                <UsersAccessManager />
            </LanguageProvider>,
        );

        cy.wait(["@getSession", "@getPasskeys"]);
        cy.contains("Maria Gatehouse (@gate.operator)").should("be.visible");
        cy.contains("Stays signed in until you click Log Out").should("be.visible");
        cy.contains("Assigned Operational Views: north-gate, truck-portal").should("be.visible");

        // Operator should only see 1 tab (My Account & Passkeys), not Users & Roles
        cy.get('[role="tab"]').should("have.length", 1);

        // Existing hardware passkey should be listed and removable
        cy.contains("Gatehouse YubiKey 5C").should("be.visible");
        cy.contains("YubiKey 5 Series").should("be.visible");
        cy.contains("button", "Remove").click();
        cy.contains("Remove Passkey?").should("be.visible");
        cy.get('[role="dialog"]').contains("button", "Remove").click();
        cy.wait("@deletePasskey");
        cy.contains("No passkeys registered yet").should("be.visible");
    });

    it("enables Administrators to provision scoped users with temporary passwords and mint Federation Service Tokens", () => {
        const users: any[] = [
            {
                username: "admin",
                displayName: "Primary Supervisor",
                role: "admin",
                roles: ["admin"],
                enabled: true,
                mustChangePassword: false,
                allowedViews: [],
                authSource: "local",
                passkeyCount: 1,
                activeSessions: 1,
                createdAt: 1731700000000,
                lastLoginAt: 1731850000000,
            },
        ];
        const federationTokens: any[] = [];

        cy.intercept({method: "GET", pathname: "/sensorhub/session"}, {
            statusCode: 200,
            body: {
                username: "admin",
                displayName: "Primary Supervisor",
                primaryRole: "admin",
                roles: ["admin"],
                isAdmin: true,
                canAdjudicate: true,
                isReadOnly: false,
                allowedViews: [],
                mustChangePassword: false,
                passkeyUserId: "YWRtaW5fdXNlcjAx",
                passkeyCount: 1,
                authSource: "local",
                keepSignedIn: true,
                idleTimeoutSeconds: 0,
                absoluteTimeoutSeconds: 0,
                rpId: "oscar.local",
                rpIdSupported: true,
            },
        }).as("getAdminSession");

        cy.intercept({method: "GET", pathname: "/sensorhub/session/account/passkeys"}, {
            statusCode: 200,
            body: {
                rpId: "oscar.local",
                rpIdSupported: true,
                passkeyUserId: "YWRtaW5fdXNlcjAx",
                acceptedCredentialIds: [],
                passkeys: [],
            },
        });

        cy.intercept({method: "GET", pathname: "/sensorhub/session/admin/overview"}, (req) => {
            req.reply({
                statusCode: 200,
                body: {
                    users,
                    federationTokens,
                    policy: {
                        idleTimeoutSeconds: 0,
                        absoluteTimeoutSeconds: 0,
                        persistSessions: true,
                        allowKeepSignedIn: true,
                        persistentCookieMaxAgeSeconds: 31536000,
                        sameSite: "Lax",
                        secureCookie: true,
                        webAuthnRpId: "",
                        effectiveRpId: "oscar.local",
                        rpIdSupported: true,
                        oidcEnabled: false,
                        oidcProviderName: "Organization SSO",
                        oidcIssuerUrl: "",
                        oidcClientId: "",
                        oidcHasClientSecret: false,
                        oidcScopes: "openid profile email groups",
                        oidcAdminGroup: "oscar-admins",
                        oidcOperatorGroup: "oscar-operators",
                        oidcDefaultRole: "viewer",
                        trustedTunnelSsoEnabled: false,
                        trustedTunnelUserHeader: "X-Octelium-User",
                        trustedTunnelHasSharedSecret: false,
                        trustedTunnelAutoProvisionViewer: false,
                    },
                    recovery: {
                        bootstrapPasswordScrubbed: true,
                        identityStorePersisted: true,
                        includedInBackupArchive: "oscar-state.tar.gz + deployment-secrets.tar.gz.enc",
                    },
                },
            });
        }).as("getOverview");

        cy.intercept({method: "POST", pathname: "/sensorhub/session/admin/users"}, (req) => {
            const body = req.body;
            const created = {
                username: body.username,
                displayName: body.displayName,
                role: body.role,
                roles: [body.role],
                enabled: true,
                mustChangePassword: true,
                allowedViews: body.allowedViews || [],
                authSource: "local",
                passkeyCount: 0,
                activeSessions: 0,
                createdAt: 1731860000000,
                lastLoginAt: 0,
            };
            users.push(created);
            req.reply({
                statusCode: 200,
                body: {
                    user: created,
                    temporaryPassword: "ABCD-EFGH-JKLM-2345",
                },
            });
        }).as("createUser");

        cy.intercept({method: "POST", pathname: "/sensorhub/session/admin/federation-tokens"}, (req) => {
            const body = req.body;
            const rec = {
                id: "fed_hq_01",
                serviceUserId: "svc-fed-9a8b7c6d5e",
                label: body.label,
                role: body.role,
                enabled: true,
                tokenPrefix: "oscar_fed_9a8b7c6d5e...",
                createdAt: 1731860000000,
                expiresAt: 0,
                lastUsedAt: 0,
                createdBy: "admin",
            };
            federationTokens.push(rec);
            req.reply({
                statusCode: 200,
                body: {
                    token: "oscar_fed_9a8b7c6d5e_OneTimeRawFederationSecretValue",
                    record: rec,
                },
            });
        }).as("createFedToken");

        cy.intercept({method: "POST", pathname: "/sensorhub/session/admin/users/bulk"}, (req) => {
            const enrolled = (req.body.users || []).map((u: any, i: number) => {
                const created = {
                    username: u.username,
                    displayName: u.displayName || u.username,
                    role: u.role,
                    roles: [u.role],
                    enabled: true,
                    mustChangePassword: true,
                    allowedViews: u.allowedViews || [],
                    authSource: "local",
                    passkeyCount: 0,
                    activeSessions: 0,
                    createdAt: 1731860000000 + i,
                    lastLoginAt: 0,
                };
                users.push(created);
                return {
                    user: created,
                    createdNew: true,
                    temporaryPassword: `BULK-CODE-000${i + 1}-XYZW`,
                    inviteToken: `oscar_inv_a1b2c3d4e${i}_BulkInviteSecretToken`,
                    inviteExpiresAt: 1732464800000,
                };
            });
            req.reply({
                statusCode: 200,
                body: {
                    createdCount: enrolled.length,
                    reissuedCount: 0,
                    skippedCount: 0,
                    enrolled,
                    errors: [],
                },
            });
        }).as("bulkEnroll");

        cy.mount(
            <LanguageProvider>
                <UsersAccessManager />
            </LanguageProvider>,
        );

        cy.wait(["@getAdminSession", "@getOverview"]);
        cy.get('[role="tab"]').should("have.length", 5);

        // Open Users & Roles tab and add a scoped Operator with auto-generated temporary password
        cy.contains('[role="tab"]', "Users & Roles").click();
        cy.get('[data-testid="add-user-button"]').click();
        cy.get('[role="dialog"]').within(() => {
            cy.contains("label", "User").parent().find("input").type("shift.lead");
            cy.contains("label", "Full Name / Label").parent().find("input").type("Shift Lead East");
            cy.contains("label", "Restrict to Operational Views").parent().find("input").type("east-gate");
            cy.contains("button", "Save").click();
        });

        cy.wait("@createUser");
        cy.contains("One-Time Temporary Password Ready (shift.lead)").should("be.visible");
        cy.contains("ABCD-EFGH-JKLM-2345").should("be.visible");
        cy.contains("Shift Lead East").should("be.visible");
        cy.contains("east-gate").should("be.visible");

        // Bulk Enroll 2 users via CSV list and verify QR Code + Startup Text Message Pack
        cy.get('[data-testid="bulk-enroll-button"]').click();
        cy.get('[data-testid="bulk-roster-textarea"]').type(
            "username,role,display_name,views\n" +
            "nora.north,operator,Nora North,north-gate\n" +
            "victor.view,viewer,Victor Auditor,\n",
        );
        cy.contains("Preview: 2 ready to enroll").should("be.visible");
        cy.get('[data-testid="bulk-enroll-submit-btn"]').click();
        cy.wait("@bulkEnroll");

        cy.get('[data-testid="onboarding-pack-dialog"]').should("be.visible");
        cy.get('[data-testid="invite-qr-nora.north"]')
            .should("be.visible")
            .and("have.attr", "src")
            .and("include", "data:image/png;base64,");
        cy.get('[data-testid="startup-message-nora.north"]')
            .should("contain.text", "/login/enroll?token=oscar_inv_a1b2c3d4e0_BulkInviteSecretToken")
            .and("contain.text", "BULK-CODE-0001-XYZW");
        cy.get('[data-testid="onboarding-pack-dialog"]').contains("button", "Done").click();

        // Open Federation Tokens tab and mint a read-only National View token
        cy.contains('[role="tab"]', "Federation Tokens").click();
        cy.contains("label", "Remote Organization / Node Label").parent().find("input").type("Regional HQ National View");
        cy.contains("button", "Create Federation Token").click();

        cy.wait("@createFedToken");
        cy.contains("oscar_fed_9a8b7c6d5e_OneTimeRawFederationSecretValue").should("be.visible");
        cy.contains("Regional HQ National View").should("be.visible");

        // Open Backup & Hardware Recovery tab
        cy.contains('[role="tab"]', "Backup & Hardware Recovery").click();
        cy.contains("Download Emergency Recovery Checklist (.txt)").should("be.visible");
    });
});
