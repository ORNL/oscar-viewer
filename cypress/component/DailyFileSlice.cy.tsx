import React from "react";
import {LanguageProvider} from "../../src/app/contexts/LanguageContext";
import {DataSourceContext} from "../../src/app/contexts/DataSourceContext";
import DailyFileTable from "../../src/app/_components/event-preview/DailyFileTable";
import {DAILY_FILE_DEF} from "../../src/lib/data/Constants";
import {LaneMapEntry} from "../../src/lib/data/oscar/LaneCollection";
import {
    buildDailyFileSliceUrl,
    DailyFileSliceError,
    DailyFileSliceFetch,
    DailyFileSliceResponse,
    fetchDailyFileSlice,
    MAX_DAILY_FILE_SLICE_BYTES,
    mergeDailyFileItems,
    shouldFetchDailyFileSlice,
} from "../../src/lib/data/oscar/DailyFileSlice";

const LANE_NAME = "Lane01";
const LANE_UID = "urn:osh:system:lane:lane-01";

const defaultNode = {
    address: "oscar.example",
    port: 8443,
    isSecure: true,
    isDefaultNode: true,
    oshPathRoot: "/sensorhub",
    bucketsEndpoint: "/buckets",
    getBasicAuthHeader: () => ({Authorization: "Basic dGVzdDp0ZXN0"}),
} as any;

const remoteNode = {
    address: "192.0.2.10",
    port: 8282,
    isSecure: false,
    isDefaultNode: false,
    oshPathRoot: "/sensorhub",
    bucketsEndpoint: "/buckets",
    getBasicAuthHeader: () => ({Authorization: "Basic cmVtb3RlOnRlc3Q="}),
} as any;

function sliceJsonResponse(payload: unknown, status = 200): Response {
    return new Response(JSON.stringify(payload), {
        status,
        headers: {"Content-Type": "application/json"},
    });
}

function createDailyFileDatastream(observations: Array<{rpmMessage: string; resultTime: string}>) {
    return {
        properties: {
            observedProperties: [{definition: DAILY_FILE_DEF}],
        },
        searchObservations: cy.stub().callsFake(() => {
            let consumed = false;
            return Promise.resolve({
                hasNext: () => !consumed && observations.length > 0,
                nextPage: () => {
                    consumed = true;
                    return Promise.resolve(observations.map(obs => ({
                        result: {rpmMessage: obs.rpmMessage},
                        resultTime: obs.resultTime,
                    })));
                },
            });
        }),
    } as any;
}

function mountDailyFileTable(
    hotObservations: Array<{rpmMessage: string; resultTime: string}>,
    startTime: string,
    endTime: string,
    fetchImpl: DailyFileSliceFetch,
) {
    const entry = new LaneMapEntry(defaultNode);
    entry.setLaneName(LANE_NAME);
    entry.setLaneSystem({
        properties: {
            id: "sys-lane-01",
            properties: {uid: LANE_UID},
        },
    } as any);
    entry.addDataStream(createDailyFileDatastream(hotObservations));

    const laneMap = new Map<string, LaneMapEntry>([[LANE_NAME, entry]]);
    const laneMapRef = {current: laneMap};
    const event = {
        id: "evt-1",
        laneId: LANE_NAME,
        startTime,
        endTime,
    } as any;

    return cy.mount(
        <LanguageProvider>
            <DataSourceContext.Provider value={{
                laneMapRef,
                laneMapReady: true,
                readyLaneNames: new Set([LANE_NAME]),
                activeViewKey: null,
                viewError: null,
                scopedHref: (p: string) => p,
            }}>
                <DailyFileTable event={event} fetchImpl={fetchImpl} />
            </DataSourceContext.Provider>
        </LanguageProvider>,
    );
}

describe("daily-file cold slice fallback", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it("builds same-origin and remote slice URLs while rejecting unsafe paths", () => {
        const localUrl = buildDailyFileSliceUrl({
            node: defaultNode,
            laneUid: LANE_UID,
            laneName: LANE_NAME,
            startTime: "2026-10-26T01:31:15Z",
            endTime: "2026-10-26T01:31:20Z",
        });
        expect(localUrl).to.include("/sensorhub/buckets/dailyfiles/dailyfile-slice?");
        expect(localUrl).to.include("laneUid=urn%3Aosh%3Asystem%3Alane%3Alane-01");
        expect(localUrl).to.include("laneName=Lane01");

        const remoteUrl = buildDailyFileSliceUrl({
            node: remoteNode,
            laneUid: LANE_UID,
            startTime: "2026-10-26T01:31:15Z",
            endTime: "2026-10-26T01:31:20Z",
            limit: 250,
        });
        expect(remoteUrl.startsWith("http://192.0.2.10:8282/sensorhub/buckets/dailyfiles/dailyfile-slice?"))
            .to.equal(true);
        expect(remoteUrl).to.include("limit=250");

        let caught: unknown = null;
        try {
            buildDailyFileSliceUrl({
                node: {...defaultNode, bucketsEndpoint: "/buckets/.."},
                laneUid: LANE_UID,
                startTime: "2026-10-26T01:31:15Z",
                endTime: "2026-10-26T01:31:20Z",
            });
        } catch (err) {
            caught = err;
        }
        expect(caught).to.be.instanceOf(DailyFileSliceError);
        expect((caught as DailyFileSliceError).code).to.equal("invalid-request");
    });

    it("detects midnight-straddle prefix gaps and deduplicates merged records chronologically", () => {
        expect(shouldFetchDailyFileSlice([], "2026-10-26T01:00:00Z")).to.equal(true);
        expect(shouldFetchDailyFileSlice([
            {message: "GS,1", timestamp: "2026-10-26T01:00:00.250Z"},
        ], "2026-10-26T01:00:00.000Z")).to.equal(false);
        expect(shouldFetchDailyFileSlice([
            {message: "GA,day2", timestamp: "2026-10-26T00:00:00.100Z"},
        ], "2026-10-25T23:59:58.000Z")).to.equal(true);

        const merged = mergeDailyFileItems(
            [
                {message: "GA,day2", timestamp: "2026-10-26T00:00:00.100Z"},
                {message: "GX,end", timestamp: "2026-10-26T00:00:01.100Z"},
            ],
            [
                {message: "GS,day1", timestamp: "2026-10-25T23:59:58.100Z"},
                {message: "GA,day1", timestamp: "2026-10-25T23:59:59.100Z"},
                {message: "GA,day2", timestamp: "2026-10-26T00:00:00.100Z"},
            ],
        );
        expect(merged).to.deep.equal([
            "GS,day1,2026-10-25T23:59:58.100Z",
            "GA,day1,2026-10-25T23:59:59.100Z",
            "GA,day2,2026-10-26T00:00:00.100Z",
            "GX,end,2026-10-26T00:00:01.100Z",
        ]);
    });

    it("cancels oversized slice responses at the transport limit and treats 404 as unavailable", () => {
        let streamCancelled = false;
        const oversizedStream = new ReadableStream<Uint8Array>({
            start(controller) {
                controller.enqueue(new Uint8Array(MAX_DAILY_FILE_SLICE_BYTES));
                controller.enqueue(new Uint8Array([0x7b]));
            },
            cancel() {
                streamCancelled = true;
            },
        });

        const oversizedFetch: DailyFileSliceFetch = () =>
            Promise.resolve(new Response(oversizedStream, {
                status: 200,
                headers: {"Content-Type": "application/json"},
            }));

        return fetchDailyFileSlice({
            node: defaultNode,
            laneUid: LANE_UID,
            startTime: "2026-10-26T01:00:00Z",
            endTime: "2026-10-26T01:00:05Z",
        }, oversizedFetch).then(
            () => { throw new Error("Expected oversized slice body to fail"); },
            error => {
                expect(error).to.be.instanceOf(DailyFileSliceError);
                expect((error as DailyFileSliceError).code).to.equal("invalid-response");
                expect(streamCancelled).to.equal(true);
                return fetchDailyFileSlice({
                    node: defaultNode,
                    laneUid: LANE_UID,
                    startTime: "2026-10-26T01:00:00Z",
                    endTime: "2026-10-26T01:00:05Z",
                }, () => Promise.resolve(new Response("", {status: 404})));
            },
        ).then(notFoundResult => {
            expect(notFoundResult).to.equal(null);
        });
    });

    it("skips the cold slice fetch when hot observations already cover the occupancy start", () => {
        const fetchStub = cy.stub().resolves(sliceJsonResponse({}, 500));
        mountDailyFileTable(
            [
                {rpmMessage: "GS,0012,0014,0011,0013", resultTime: "2026-10-26T14:00:00.100Z"},
                {rpmMessage: "GX,0011,0013,0010,0012", resultTime: "2026-10-26T14:00:02.100Z"},
            ],
            "2026-10-26T14:00:00.000Z",
            "2026-10-26T14:00:03.000Z",
            fetchStub as unknown as DailyFileSliceFetch,
        );

        cy.contains("pre", "GS,0012,0014,0011,0013,2026-10-26T14:00:00.100Z").should("be.visible");
        cy.contains("pre", "GX,0011,0013,0010,0012,2026-10-26T14:00:02.100Z")
            .should("be.visible")
            .then(() => {
                expect(fetchStub.callCount).to.equal(0);
            });
    });

    it("loads purged historical occupancies and merges midnight-straddling windows from the cold slice", () => {
        const slicePayload: DailyFileSliceResponse = {
            schemaVersion: 1,
            laneUid: LANE_UID,
            startTime: "2026-10-25T23:59:58.000Z",
            endTime: "2026-10-26T00:00:02.000Z",
            truncated: false,
            items: [
                {message: "GS,day1-purged-start", timestamp: "2026-10-25T23:59:58.120Z"},
                {message: "GA,day1-purged-peak", timestamp: "2026-10-25T23:59:59.120Z"},
                {message: "GA,day2-hot-cont", timestamp: "2026-10-26T00:00:00.120Z"},
            ],
        };
        const fetchStub = cy.stub().callsFake((input: RequestInfo | URL, init?: RequestInit) => {
            expect(String(input)).to.include("/sensorhub/buckets/dailyfiles/dailyfile-slice?");
            expect(init?.credentials).to.equal("include");
            expect(init?.cache).to.equal("no-store");
            return Promise.resolve(sliceJsonResponse(slicePayload));
        });

        mountDailyFileTable(
            [
                {rpmMessage: "GA,day2-hot-cont", resultTime: "2026-10-26T00:00:00.120Z"},
                {rpmMessage: "GX,day2-hot-end", resultTime: "2026-10-26T00:00:01.120Z"},
            ],
            "2026-10-25T23:59:58.000Z",
            "2026-10-26T00:00:02.000Z",
            fetchStub as unknown as DailyFileSliceFetch,
        );

        cy.contains("pre", "GS,day1-purged-start,2026-10-25T23:59:58.120Z").should("be.visible");
        cy.contains("pre", "GX,day2-hot-end,2026-10-26T00:00:01.120Z")
            .should("be.visible")
            .then(($pre) => {
                const lines = $pre.text().trim().split("\n");
                expect(lines).to.deep.equal([
                    "GS,day1-purged-start,2026-10-25T23:59:58.120Z",
                    "GA,day1-purged-peak,2026-10-25T23:59:59.120Z",
                    "GA,day2-hot-cont,2026-10-26T00:00:00.120Z",
                    "GX,day2-hot-end,2026-10-26T00:00:01.120Z",
                ]);
                expect(fetchStub.callCount).to.equal(1);
            });
    });
});
