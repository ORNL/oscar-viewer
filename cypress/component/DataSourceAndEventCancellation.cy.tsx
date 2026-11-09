import React, {useCallback, useContext, useMemo, useState} from "react";
import {configureStore, Middleware} from "@reduxjs/toolkit";
import {Provider} from "react-redux";
import ObservationFilter from "osh-js/source/core/sweapi/observation/ObservationFilter";

import DataSourceProvider, {DataSourceContext} from "../../src/app/contexts/DataSourceContext";
import {statusTableEventFromObservation} from "../../src/app/_components/lane-view/StatusTable";
import {
    EventQueryPlan,
    fetchCollectionDataWithSignal,
    isAbortRequestError,
    useAbortableEventQueries,
} from "../../src/lib/data/oscar/EventTableRequests";
import {EventTableData} from "../../src/lib/data/oscar/TableHelpers";
import oshReducer from "../../src/lib/state/OSHSlice";
import laneReducer, {setLaneMap} from "../../src/lib/state/OSCARLaneSlice";
import {Node} from "../../src/lib/data/osh/Node";

function ProviderStatusProbe() {
    const ctx = useContext(DataSourceContext);
    return (
        <div>
            <span data-testid="ready">{String(ctx?.laneMapReady ?? false)}</span>
            <span data-testid="lanes">{Array.from(ctx?.readyLaneNames ?? []).join(",")}</span>
        </div>
    );
}

describe("DataSourceProvider lane-map deduplication and EventTable request cancellation", () => {
    beforeEach(() => {
        localStorage.clear();
        localStorage.setItem("language", "en");
    });

    it("dispatches populated setLaneMap once when incremental discovery already published the final snapshot", () => {
        const node = new Node({
            name: "Local Node",
            address: "localhost",
            port: 8181,
            oshPathRoot: "/sensorhub",
            csAPIEndpoint: "/api",
            auth: {username: "", password: ""},
            authenticationMode: "session",
            isSecure: false,
            isDefaultNode: true,
        });
        const laneEntry: any = {
            parentNode: node,
            laneName: "Lane 1",
            setLaneName(name: string) {
                this.laneName = name;
            },
            addDefaultConSysApis: cy.stub(),
        };
        cy.stub(node, "fetchLaneSystemsAndSubsystems").resolves(new Map([["Lane 1", laneEntry]]));
        cy.stub(node, "fetchDataStreams").resolves();
        cy.stub(node, "fetchLaneControlStreams").resolves();

        const laneMapSizes: number[] = [];
        const spyMiddleware: Middleware = () => (next) => (action: any) => {
            if (action?.type === setLaneMap.type) {
                laneMapSizes.push(action.payload.size);
            }
            return next(action);
        };
        const store = configureStore({
            reducer: {
                oshSlice: oshReducer,
                laneSlice: laneReducer,
            },
            preloadedState: {
                oshSlice: {nodes: [node], configNode: node},
            },
            middleware: (getDefault) => getDefault({serializableCheck: false, immutableCheck: false}).concat(spyMiddleware),
        });

        cy.mount(
            <Provider store={store as any}>
                <DataSourceProvider>
                    <ProviderStatusProbe />
                </DataSourceProvider>
            </Provider>,
        );

        cy.get('[data-testid="ready"]').should("have.text", "true");
        cy.get('[data-testid="lanes"]').should("have.text", "Lane 1");
        cy.then(() => {
            // One initial reset (size 0) + exactly one populated publish (size 1).
            expect(laneMapSizes).to.deep.equal([0, 1]);
        });
    });

    it("publishes an empty final snapshot when no node returns lanes", () => {
        const node = new Node({
            name: "Empty Node",
            address: "localhost",
            port: 8181,
            oshPathRoot: "/sensorhub",
            csAPIEndpoint: "/api",
            auth: {username: "", password: ""},
            authenticationMode: "session",
            isSecure: false,
            isDefaultNode: true,
        });
        cy.stub(node, "fetchLaneSystemsAndSubsystems").resolves(new Map());
        cy.stub(node, "fetchDataStreams").resolves();
        cy.stub(node, "fetchLaneControlStreams").resolves();

        const laneMapSizes: number[] = [];
        const spyMiddleware: Middleware = () => (next) => (action: any) => {
            if (action?.type === setLaneMap.type) {
                laneMapSizes.push(action.payload.size);
            }
            return next(action);
        };
        const store = configureStore({
            reducer: {
                oshSlice: oshReducer,
                laneSlice: laneReducer,
            },
            preloadedState: {
                oshSlice: {nodes: [node], configNode: node},
            },
            middleware: (getDefault) => getDefault({serializableCheck: false, immutableCheck: false}).concat(spyMiddleware),
        });

        cy.mount(
            <Provider store={store as any}>
                <DataSourceProvider>
                    <ProviderStatusProbe />
                </DataSourceProvider>
            </Provider>,
        );

        cy.get('[data-testid="ready"]').should("have.text", "true");
        cy.get('[data-testid="lanes"]').should("have.text", "");
        cy.then(() => {
            expect(laneMapSizes).to.deep.equal([0, 0]);
        });
    });

    it("forwards AbortSignal and parses arraybuffer/json payloads in fetchCollectionDataWithSignal", async () => {
        const encoded = new TextEncoder().encode('[{"id":"obs-1"}]').buffer;
        const fetchCalls: Array<{url: string; init?: RequestInit}> = [];
        const originalFetch = window.fetch;
        window.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
            fetchCalls.push({url: String(input), init});
            return new Response(encoded, {status: 200});
        }) as typeof window.fetch;

        try {
            const controller = new AbortController();
            const parsed = await fetchCollectionDataWithSignal({
                url: "https://node.example/sensorhub/api/observations",
                headers: {Authorization: "Basic dGVzdA=="},
                filter: {toQueryString: () => "dataStream=ds-1&order=desc"},
                pageOffset: 0,
                pageSize: 15,
                responseFormat: "arraybuffer",
                parseResponse: async (buf: ArrayBuffer) => JSON.parse(new TextDecoder().decode(buf)),
            }, controller.signal);

            expect(parsed).to.deep.equal([{id: "obs-1"}]);
            expect(fetchCalls).to.have.length(1);
            expect(fetchCalls[0].url).to.equal(
                "https://node.example/sensorhub/api/observations?dataStream=ds-1&order=desc&offset=0&limit=15",
            );
            expect(fetchCalls[0].init?.signal).to.equal(controller.signal);

            const fallbackStub = cy.stub().resolves([{id: "fallback"}]);
            const fallbackResult = await fetchCollectionDataWithSignal({fetchData: fallbackStub});
            expect(fallbackResult).to.deep.equal([{id: "fallback"}]);
            expect(fallbackStub).to.have.been.calledOnce;
            expect(isAbortRequestError(new DOMException("Aborted", "AbortError"))).to.equal(true);
            expect(isAbortRequestError(new Error("HTTP 500"))).to.equal(false);
        } finally {
            window.fetch = originalFetch;
        }
    });

    it("deprioritizes background count fetches, aborts stale in-flight queries on filter/unmount without errors, and keeps interactive bulk counts at default priority", () => {
        const recordedCalls: Array<{url: string; signal?: AbortSignal | null; priority?: string}> = [];
        const pendingAborts: string[] = [];

        cy.window().then((win) => {
            cy.stub(win, "fetch").callsFake((input: RequestInfo | URL, init?: RequestInit) => {
                const url = String(input);
                const priority = (init as {priority?: string} | undefined)?.priority;
                recordedCalls.push({url, signal: init?.signal, priority});

                if (url.includes("dataStream=occ-lane-1")) {
                    return new Promise<Response>((_resolve, reject) => {
                        init?.signal?.addEventListener("abort", () => {
                            pendingAborts.push(url);
                            reject(new DOMException("Aborted", "AbortError"));
                        });
                    });
                }

                if (url.includes("/observations/count?")) {
                    return Promise.resolve(new Response(JSON.stringify({count: 2}), {
                        status: 200,
                        headers: {"Content-Type": "application/json"},
                    }));
                }

                return Promise.resolve(new Response(JSON.stringify([{
                    id: "obs-lane-2",
                    laneName: "Lane 2",
                    startTime: "2026-11-04T11:59:58.000Z",
                    endTime: "2026-11-04T12:00:00.000Z",
                    maxGamma: 1200,
                    maxNeutron: 5,
                }]), {
                    status: 200,
                    headers: {"Content-Type": "application/json"},
                }));
            });
        });

        const fakeNode: any = {
            id: "node-1",
            name: "Local Node",
            getConnectedSystemsEndpoint: () => "https://node.example/sensorhub/api",
            getBasicAuthHeader: () => ({}),
            getObservationsApi: async () => ({
                searchObservations: async (obsFilter: any, pageSize: number, pageOffset: number) => ({
                    url: "https://node.example/sensorhub/api/observations",
                    headers: {},
                    filter: obsFilter,
                    pageOffset,
                    pageSize,
                    responseFormat: "json",
                    parseResponse: async (items: any[]) => items,
                    fetchData: async () => [],
                }),
            }),
        };

        function QueryHookConsumer({streamId, cutoff}: {streamId: string; cutoff: string}) {
            const queryPlans = useMemo<EventQueryPlan[]>(() => [{
                key: `plan-${streamId}`,
                node: fakeNode,
                datastreamIds: [streamId],
                filter: "gammaAlarm=true OR neutronAlarm=true",
            }], [streamId]);
            const pageQueryPlans = useMemo<EventQueryPlan[]>(() => [
                {...queryPlans[0], key: `${streamId}-p1`, filter: "gammaAlarm=true AND neutronAlarm=true"},
                {...queryPlans[0], key: `${streamId}-p2`, filter: "gammaAlarm=false AND neutronAlarm=true"},
                {...queryPlans[0], key: `${streamId}-p3`, filter: "gammaAlarm=true AND neutronAlarm=false"},
            ], [queryPlans, streamId]);

            const fetchPlanRows = useCallback(async (
                plan: EventQueryPlan,
                limit: number,
                offset: number,
                planCutoff = cutoff,
                signal?: AbortSignal,
            ) => {
                const observationFilter = new ObservationFilter({
                    dataStream: plan.datastreamIds,
                    resultTime: `../${planCutoff}`,
                    filter: encodeURIComponent(plan.filter),
                    order: "desc",
                });
                const api = await plan.node.getObservationsApi();
                const collection = await api.searchObservations(observationFilter, limit, offset);
                const items = await fetchCollectionDataWithSignal(collection, signal);
                return items.map((item: any, idx: number) => {
                    const row = new EventTableData(
                        idx + 1,
                        item.laneName,
                        42,
                        item.startTime,
                        item.endTime,
                        item.maxGamma,
                        item.maxNeutron,
                        "Gamma",
                        [],
                        "Local Node",
                        item.id,
                    );
                    row.setDataStreamId(streamId);
                    return row;
                });
            }, [cutoff, streamId]);

            const {
                rows,
                rowCount,
                countQueryError,
                pageQueryError,
                fetchPlanCount,
            } = useAbortableEventQueries({
                queryPlans,
                pageQueryPlans,
                page: 0,
                pageSize: 15,
                pageLoadedTime: cutoff,
                fetchPlanRows,
            });
            const [bulkCount, setBulkCount] = useState<number | null>(null);

            return (
                <div>
                    <span data-testid="rows">{rows.map((r) => r.laneId).join(",")}</span>
                    <span data-testid="count">{String(rowCount)}</span>
                    <span data-testid="errors">{String(countQueryError || pageQueryError)}</span>
                    <span data-testid="bulk-count">{String(bulkCount ?? "")}</span>
                    <button
                        data-testid="select-all-filtered"
                        onClick={() => void fetchPlanCount(queryPlans[0], cutoff, true).then(setBulkCount)}
                    >
                        Select all filtered
                    </button>
                </div>
            );
        }

        function Harness() {
            const [mode, setMode] = useState<"occ-lane-1" | "occ-lane-2" | "unmounted">("occ-lane-1");
            return (
                <div>
                    <button data-testid="switch-lane" onClick={() => setMode("occ-lane-2")}>Switch lane</button>
                    <button data-testid="unmount" onClick={() => setMode("unmounted")}>Unmount</button>
                    {mode !== "unmounted" && (
                        <QueryHookConsumer streamId={mode} cutoff="2026-11-04T12:00:00.000Z" />
                    )}
                </div>
            );
        }

        cy.mount(<Harness />);

        cy.wrap(null).should(() => {
            const lane1Calls = recordedCalls.filter((c) => c.url.includes("dataStream=occ-lane-1"));
            expect(lane1Calls).to.have.length(4);
        });

        cy.get('[data-testid="switch-lane"]').click();

        cy.get('[data-testid="rows"]').should("have.text", "Lane 2");
        cy.get('[data-testid="count"]').should("have.text", "2");
        cy.get('[data-testid="errors"]').should("have.text", "false");

        cy.then(() => {
            // All 4 initial in-flight Lane 1 fetches (1 count + 3 priority page queries) aborted cleanly.
            expect(pendingAborts).to.have.length(4);

            const bgCountCalls = recordedCalls.filter((c) => c.url.includes("/observations/count?"));
            expect(bgCountCalls.length).to.equal(2);
            bgCountCalls.forEach((call) => {
                expect(call.priority).to.equal("low");
                expect(call.signal).to.exist;
            });
        });

        // Interactive bulk selection runs fetchPlanCount without lowPriority (default browser priority).
        cy.get('[data-testid="select-all-filtered"]').click();
        cy.get('[data-testid="bulk-count"]').should("have.text", "2");
        cy.then(() => {
            const countCalls = recordedCalls.filter((c) => c.url.includes("/observations/count?"));
            expect(countCalls[countCalls.length - 1].priority).to.equal(undefined);
        });
    });

    it("refetches Page 0 when returning from Page 1+ and supports cutoffOverride for 24/7/365 sessions", () => {
        const fetchedPages: Array<{offset: number; cutoff: string}> = [];
        const fakeNode: any = {
            id: "node-1",
            name: "Local Node",
            getConnectedSystemsEndpoint: () => "https://node.example/sensorhub/api",
            getBasicAuthHeader: () => ({}),
        };

        cy.window().then((win) => {
            cy.stub(win, "fetch").callsFake(() =>
                Promise.resolve(new Response(JSON.stringify({count: 20}), {
                    status: 200,
                    headers: {"Content-Type": "application/json"},
                })),
            );
        });

        function PaginationConsumer() {
            const [page, setPage] = useState(0);
            const queryPlans = useMemo<EventQueryPlan[]>(() => [{
                key: "plan-1",
                node: fakeNode,
                datastreamIds: ["occ-1"],
                filter: "gammaAlarm=true",
            }], []);

            const fetchPlanRows = useCallback(async (
                _plan: EventQueryPlan,
                _limit: number,
                offset: number,
                cutoff = "2026-11-01T00:00:00.000Z",
            ) => {
                fetchedPages.push({offset, cutoff});
                return [
                    new EventTableData(
                        offset + 1,
                        `Lane-Offset-${offset}`,
                        {
                            occupancyCount: 1,
                            startTime: cutoff,
                            endTime: cutoff,
                            maxGamma: 500,
                            maxNeutron: 0,
                            gammaAlarm: true,
                            neutronAlarm: false,
                            adjudicatedIds: [],
                        },
                        `obs-${offset}`,
                        "foi-1",
                        "Local Node",
                        false,
                    ),
                ];
            }, []);

            const {rows, fetchPage, refreshCounts} = useAbortableEventQueries({
                queryPlans,
                pageQueryPlans: queryPlans,
                page,
                pageSize: 15,
                pageLoadedTime: "2026-11-01T00:00:00.000Z",
                fetchPlanRows,
            });

            return (
                <div>
                    <span data-testid="page-rows">{rows.map((r) => r.laneId).join(",")}</span>
                    <button data-testid="to-page-1" onClick={() => setPage(1)}>Page 1</button>
                    <button data-testid="to-page-0" onClick={() => setPage(0)}>Page 0</button>
                    <button
                        data-testid="refresh-fresh-cutoff"
                        onClick={() => {
                            void refreshCounts("2026-12-31T23:59:59.000Z");
                            void fetchPage(0, "2026-12-31T23:59:59.000Z");
                        }}
                    >
                        Refresh with cutoff
                    </button>
                </div>
            );
        }

        cy.mount(<PaginationConsumer />);
        cy.get('[data-testid="page-rows"]').should("have.text", "Lane-Offset-0");
        cy.then(() => {
            expect(fetchedPages).to.have.length(1);
            expect(fetchedPages[0]).to.deep.equal({offset: 0, cutoff: "2026-11-01T00:00:00.000Z"});
        });

        cy.get('[data-testid="to-page-1"]').click();
        cy.get('[data-testid="page-rows"]').should("have.text", "Lane-Offset-15");

        cy.get('[data-testid="to-page-0"]').click();
        cy.get('[data-testid="page-rows"]').should("have.text", "Lane-Offset-0");
        cy.then(() => {
            expect(fetchedPages).to.have.length(3);
            expect(fetchedPages[2]).to.deep.equal({offset: 0, cutoff: "2026-11-01T00:00:00.000Z"});
        });

        cy.get('[data-testid="refresh-fresh-cutoff"]').click();
        cy.then(() => {
            expect(fetchedPages[fetchedPages.length - 1]).to.deep.equal({
                offset: 0,
                cutoff: "2026-12-31T23:59:59.000Z",
            });
        });
    });

    it("parses live and historical StatusTable fault and tamper observations with valid ISO timestamps", () => {
        const liveGammaFault = statusTableEventFromObservation(
            {alarmState: "Fault - Gamma High", samplingTime: "2026-11-09T01:02:03.456Z"},
            "Lane03",
            true,
        );
        expect(liveGammaFault).to.not.equal(undefined);
        expect(liveGammaFault?.laneId).to.equal("Lane03");
        expect(liveGammaFault?.status).to.equal("Fault - Gamma High");
        expect(liveGammaFault?.timestamp).to.equal("2026-11-09T01:02:03.456Z");
        expect(Number.isNaN(new Date(liveGammaFault!.timestamp).getTime())).to.equal(false);

        const liveTamper = statusTableEventFromObservation(
            {tamperStatus: true, samplingtime: "2026-11-09T01:05:00.000Z"},
            "Lane03",
            true,
        );
        expect(liveTamper?.status).to.equal("Tamper");
        expect(liveTamper?.timestamp).to.equal("2026-11-09T01:05:00.000Z");

        for (const nonFault of ["Scan", "Background", "Alarm", "Clear"]) {
            expect(
                statusTableEventFromObservation({alarmState: nonFault, samplingTime: "2026-11-09T01:00:00Z"}, "Lane03", true),
            ).to.equal(undefined);
        }

        const historicalFault = statusTableEventFromObservation(
            {
                properties: {
                    resultTime: "2026-11-09T00:55:00.000Z",
                    result: {alarmState: "Fault - Neutron High"},
                },
            },
            "Lane03",
            false,
        );
        expect(historicalFault?.status).to.equal("Fault - Neutron High");
        expect(historicalFault?.timestamp).to.equal("2026-11-09T00:55:00.000Z");
    });
});
