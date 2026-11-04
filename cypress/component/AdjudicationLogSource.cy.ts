import {
    fetchOccupancyAdjudicationStatuses,
    formatAdjudicationAttachmentLabel,
    formatAdjudicationAttachmentLabels,
    mergeAdjudicationLogs,
    waitForAdjudicationLogSource,
} from "../../src/app/_components/adjudication/AdjudicationLog";
import AdjudicationData from "../../src/lib/data/oscar/adjudication/Adjudication";
import {AdjudicationCodes} from "../../src/lib/data/oscar/adjudication/models/AdjudicationConstants";
import {ADJ_DEF} from "../../src/lib/data/Constants";

describe("adjudication log source discovery", () => {
    it("waits for the lane map to hydrate after an Event Details reload", () => {
        const stream = {
            properties: {
                id: "adjudication-control",
                name: "Adjudication Control",
                "system@id": "lane-system-id",
                controlledProperties: [{definition: ADJ_DEF}],
            },
        } as any;
        const lane = {
            controlStreams: [stream],
            systems: [],
            parentNode: {fetchNodeControlStreams: cy.stub().resolves([])},
        } as any;
        const laneMapRef = {current: new Map<string, any>()};

        const sourcePromise = waitForAdjudicationLogSource(
            laneMapRef,
            "Lane50",
            {attempts: 10, delayMs: 5},
        );
        setTimeout(() => laneMapRef.current.set("Lane50", lane), 10);

        cy.wrap(sourcePromise).then((source) => {
            expect(source?.lane).to.equal(lane);
            expect(source?.controlStream).to.equal(stream);
        });
    });

    it("falls back to node control-stream discovery while lane controls hydrate", () => {
        const stream = {
            properties: {
                id: "adjudication-control",
                name: "Adjudication Control",
                "system@id": "lane-system-id",
                controlledProperties: [{definition: ADJ_DEF}],
            },
        } as any;
        const lane = {
            controlStreams: [],
            systems: [{properties: {id: "lane-system-id"}}],
            parentNode: {fetchNodeControlStreams: cy.stub().resolves([stream])},
        } as any;
        const laneMapRef = {current: new Map([["Lane50", lane]])};

        cy.wrap(waitForAdjudicationLogSource(
            laneMapRef,
            "Lane50",
            {attempts: 2, delayMs: 1},
        )).then((source) => {
            expect(source?.lane).to.equal(lane);
            expect(source?.controlStream).to.equal(stream);
            expect(lane.parentNode.fetchNodeControlStreams).to.have.been.calledOnce;
        });
    });

    it("deduplicates concurrent WebSocket and REST adjudication log entries", () => {
        const makeEntry = (id: string, feedback: string) => {
            const entry = new AdjudicationData("2026-04-20T21:44:22.400865Z", "44", "0jd46");
            entry.id = id;
            entry.setAdjudicationCode(AdjudicationCodes.getCodeObjByIndex(2));
            entry.setFeedback(feedback);
            entry.setIsotopes(["Neutron"]);
            entry.setSecondaryInspectionStatus("COMPLETED");
            entry.setVehicleId("SH453");
            entry.setUser("admin");
            return entry;
        };

        const wsEntry = makeEntry("ws-uuid", "Initial note");
        const restDuplicate = makeEntry("0hhg", "Initial note");
        const distinctSecond = makeEntry("0hhi", "Follow-up note");

        const merged = mergeAdjudicationLogs([wsEntry], [restDuplicate, distinctSecond]);
        expect(merged).to.have.length(2);
        expect(merged[0].id).to.equal("ws-uuid");
        expect(merged[0].feedback).to.equal("Initial note");
        expect(merged[1].id).to.equal("0hhi");
        expect(merged[1].feedback).to.equal("Follow-up note");
    });

    it("deduplicates MQTT nanosecond reportTime and PostgreSQL microsecond reportTime for the same command", () => {
        const mqttEntry = new AdjudicationData("2026-10-28T10:27:47.488129341Z", "44", "0jm85qgf");
        mqttEntry.id = "02fc";
        mqttEntry.commandId = "02fc";
        mqttEntry.setAdjudicationCode(AdjudicationCodes.getCodeObjByIndex(11));
        mqttEntry.setFeedback("Vvvhhh");
        mqttEntry.setIsotopes(["Plutonium"]);
        mqttEntry.setSecondaryInspectionStatus("COMPLETED");
        mqttEntry.setVehicleId("Hvvcvb");
        mqttEntry.setUser("admin");

        const restEntry = new AdjudicationData("2026-10-28T10:27:47.488129Z", "44", "0jm85qgf");
        restEntry.id = "02fd";
        restEntry.commandId = "02fc";
        restEntry.setAdjudicationCode(AdjudicationCodes.getCodeObjByIndex(11));
        restEntry.setFeedback("Vvvhhh");
        restEntry.setIsotopes(["Plutonium"]);
        restEntry.setSecondaryInspectionStatus("COMPLETED");
        restEntry.setVehicleId("Hvvcvb");
        restEntry.setUser("admin");

        const merged = mergeAdjudicationLogs([mqttEntry], [restEntry]);
        expect(merged).to.have.length(1);
        expect(merged[0].id).to.equal("02fc");
        expect(merged[0].commandId).to.equal("02fc");
        expect(merged[0].feedback).to.equal("Vvvhhh");
    });

    it("formats Linux forward-slash, Windows backslash, and duplicate-basename attachment link labels", () => {
        expect(formatAdjudicationAttachmentLabel("adjudication/evidence-01.txt")).to.equal("evidence-01.txt");
        expect(formatAdjudicationAttachmentLabel("/adjudication/evidence-01.txt")).to.equal("evidence-01.txt");
        expect(formatAdjudicationAttachmentLabel("adjudication\\evidence-01.txt")).to.equal("evidence-01.txt");
        expect(formatAdjudicationAttachmentLabel("\\adjudication\\evidence-01.txt")).to.equal("evidence-01.txt");
        expect(formatAdjudicationAttachmentLabel("standalone.n42")).to.equal("standalone.n42");

        expect(formatAdjudicationAttachmentLabels([
            "/bucket/uploads/spectrum.n42",
            "/bucket/webid/spectrum.n42",
        ])).to.deep.equal([
            "uploads/spectrum.n42",
            "webid/spectrum.n42",
        ]);
    });

    it("fetches zero control-stream status pages when occupancy result.adjudicatedIds is empty", () => {
        const requestedUrls: string[] = [];
        const searchStatus = cy.stub();
        const fetchStub = cy.stub().callsFake(async (url: string) => {
            requestedUrls.push(url);
            return new Response(JSON.stringify({
                id: "obs-empty",
                result: {occupancyCount: 12, adjudicatedIds: []},
            }), {status: 200, headers: {"Content-Type": "application/om+json"}});
        });

        const source = {
            lane: {
                parentNode: {
                    getConnectedSystemsEndpoint: () => "https://oscar.example.test/sensorhub/api",
                    getBasicAuthHeader: () => ({}),
                },
            },
            controlStream: {properties: {id: "cs-lane1"}, searchStatus},
        } as any;

        cy.wrap(fetchOccupancyAdjudicationStatuses({
            event: {occupancyObsId: "obs-empty", occupancyCount: "12"},
            source,
            fetchImpl: fetchStub as any,
        })).then((entries) => {
            expect(entries).to.deep.equal([]);
            expect(requestedUrls).to.deep.equal([
                "https://oscar.example.test/sensorhub/api/observations/obs-empty",
            ]);
            expect(searchStatus).not.to.have.been.called;
        });
    });

    it("resolves adjudicatedIds in O(k) via per-command status endpoints without scanning full control-stream history", () => {
        const requestedUrls: string[] = [];
        const searchStatus = cy.stub();
        const fetchStub = cy.stub().callsFake(async (url: string) => {
            requestedUrls.push(url);
            if (url.endsWith("/observations/obs-44")) {
                return new Response(JSON.stringify({
                    id: "obs-44",
                    result: {occupancyCount: 44, adjudicatedIds: ["cmd-1", "cmd-2"]},
                }), {status: 200});
            }
            if (url.includes("/commands/cmd-1/status?")) {
                return new Response(JSON.stringify({
                    items: [{
                        id: "status-1",
                        "command@id": "cmd-1",
                        reportTime: "2026-11-04T12:00:00Z",
                        statusCode: "COMPLETED",
                        results: [{
                            data: {
                                occupancyObsId: "obs-44",
                                adjudicationCode: 2,
                                feedback: "First note",
                                isotopes: ["Cs-137"],
                                secondaryInspectionStatus: "NONE",
                                vehicleId: "TRK-01",
                                filePaths: [],
                                username: "operator1",
                            },
                        }],
                    }],
                }), {status: 200});
            }
            if (url.includes("/commands/cmd-2/status?")) {
                return new Response(JSON.stringify({
                    items: [{
                        id: "status-2",
                        "command@id": "cmd-2",
                        reportTime: "2026-11-04T12:05:00Z",
                        statusCode: "COMPLETED",
                        results: [{
                            data: {
                                occupancyObsId: "obs-44",
                                adjudicationCode: 3,
                                feedback: "Second note",
                                isotopes: ["Co-60"],
                                secondaryInspectionStatus: "COMPLETED",
                                vehicleId: "TRK-01",
                                filePaths: ["/adjudication/report.pdf"],
                                username: "supervisor1",
                            },
                        }],
                    }],
                }), {status: 200});
            }
            return new Response("Not Found", {status: 404});
        });

        const source = {
            lane: {
                parentNode: {
                    getConnectedSystemsEndpoint: () => "https://oscar.example.test/sensorhub/api",
                    getBasicAuthHeader: () => ({}),
                },
            },
            controlStream: {properties: {id: "cs-lane1"}, searchStatus},
        } as any;

        cy.wrap(fetchOccupancyAdjudicationStatuses({
            event: {occupancyObsId: "obs-44", occupancyCount: "44"},
            source,
            fetchImpl: fetchStub as any,
        })).then((entries: any[]) => {
            expect(entries).to.have.length(2);
            expect(entries[0].commandId).to.equal("cmd-1");
            expect(entries[0].feedback).to.equal("First note");
            expect(entries[1].commandId).to.equal("cmd-2");
            expect(entries[1].feedback).to.equal("Second note");
            expect(searchStatus).not.to.have.been.called;
            expect(requestedUrls).to.have.length(3);
        });
    });

    it("aborts in-flight adjudication status fetches immediately when AbortSignal fires", () => {
        const controller = new AbortController();
        let capturedSignal: AbortSignal | undefined;
        const searchStatus = cy.stub();
        const fetchStub = cy.stub().callsFake((_url: string, init?: RequestInit) => {
            capturedSignal = init?.signal ?? undefined;
            return new Promise<Response>((_resolve, reject) => {
                init?.signal?.addEventListener("abort", () => {
                    const abortErr = new DOMException("The operation was aborted.", "AbortError");
                    reject(abortErr);
                });
            });
        });

        const source = {
            lane: {
                parentNode: {
                    getConnectedSystemsEndpoint: () => "https://oscar.example.test/sensorhub/api",
                    getBasicAuthHeader: () => ({}),
                },
            },
            controlStream: {properties: {id: "cs-lane1"}, searchStatus},
        } as any;

        const pending = fetchOccupancyAdjudicationStatuses({
            event: {occupancyObsId: "obs-abort", occupancyCount: "9"},
            source,
            signal: controller.signal,
            fetchImpl: fetchStub as any,
        });
        setTimeout(() => controller.abort(), 5);

        cy.wrap(pending).then((entries) => {
            expect(entries).to.deep.equal([]);
            expect(capturedSignal?.aborted).to.equal(true);
            expect(searchStatus).not.to.have.been.called;
        });
    });

    it("falls back to controlStream.searchStatus when occupancy observation lookup is unavailable", () => {
        let called = false;
        const searchStatus = cy.stub().resolves({
            hasNext: () => !called,
            nextPage: async () => {
                called = true;
                return [{
                    id: "fallback-status-1",
                    "command@id": "cmd-fallback",
                    reportTime: "2026-11-04T12:10:00Z",
                    results: [{
                        data: {
                            occupancyObsId: "obs-legacy",
                            adjudicationCode: 1,
                            feedback: "Fallback note",
                            isotopes: [],
                            secondaryInspectionStatus: "NONE",
                            vehicleId: "VAN-9",
                            filePaths: [],
                            username: "admin",
                        },
                    }],
                }];
            },
        });

        const source = {
            lane: {parentNode: {}},
            controlStream: {properties: {id: "cs-legacy"}, searchStatus},
        } as any;

        cy.wrap(fetchOccupancyAdjudicationStatuses({
            event: {occupancyObsId: "obs-legacy", occupancyCount: "7"},
            source,
        })).then((entries: any[]) => {
            expect(searchStatus).to.have.been.calledOnce;
            expect(entries).to.have.length(1);
            expect(entries[0].commandId).to.equal("cmd-fallback");
            expect(entries[0].feedback).to.equal("Fallback note");
        });
    });
});
