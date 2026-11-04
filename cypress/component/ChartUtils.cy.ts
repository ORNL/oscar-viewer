import {getObservations} from "../../src/app/utils/ChartUtils";

describe("ChartUtils gammaThreshold background lookup", () => {
    it("queries cold-tiered gammaThreshold observations by phenomenonTime instead of resultTime", () => {
        let capturedFilter: any;
        let capturedPageSize: number | undefined;
        const datastream = {
            searchObservations: cy.stub().callsFake((filter: any, pageSize: number) => {
                capturedFilter = filter;
                capturedPageSize = pageSize;
                return Promise.resolve({
                    nextPage: () => Promise.resolve([
                        {result: {latestGammaBackground: 126.0}},
                    ]),
                });
            }),
        };

        cy.wrap(getObservations(
            "2026-11-04T01:04:36.85Z",
            "2026-11-04T01:04:45.883Z",
            datastream,
        )).then((latestGb) => {
            expect(latestGb).to.equal(126.0);
            expect(capturedPageSize).to.equal(1);
            expect(capturedFilter?.props?.phenomenonTime).to.equal(
                "2026-11-04T01:04:36.85Z/2026-11-04T01:04:45.883Z",
            );
            expect(capturedFilter?.props?.resultTime).to.equal(undefined);
            expect(capturedFilter.toQueryString()).to.include(
                "phenomenonTime=2026-11-04T01:04:36.85Z/2026-11-04T01:04:45.883Z",
            );
            expect(capturedFilter.toQueryString()).to.not.include("resultTime=");
        });
    });
});
