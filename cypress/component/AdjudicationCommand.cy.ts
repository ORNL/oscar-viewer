import {
    generateAdjudicationCommandJSON,
    generateReportCommandJSON,
    resolveEffectiveReportCommandType
} from "../../src/lib/data/oscar/OSCARCommands";

describe("adjudication command", () => {
    it("includes the vehicle ID entered during dashboard adjudication", () => {
        const command = generateAdjudicationCommandJSON(
            "inspection complete",
            {code: 9, label: "Authorized activity", group: "Test/Maintenance"} as any,
            [],
            "NONE",
            [],
            "occupancy-observation-1",
            "TRUCK-204",
        );

        expect(JSON.parse(command).parameters.vehicleId).to.equal("TRUCK-204");
    });

    it("encodes PDF, CSV, JSON, and XLSX output formats across all 5 report types using the 5-field SWE report command schema", () => {
        const reportTypes = [
            "RDS_SITE",
            "LANE",
            "EVENT",
            "ADJUDICATION",
            "ADJUDICATION_DETAILS",
        ];

        for (const type of reportTypes) {
            expect(resolveEffectiveReportCommandType(type, "PDF")).to.equal(type);
            expect(resolveEffectiveReportCommandType(type, "CSV")).to.equal(`${type}_CSV`);
            expect(resolveEffectiveReportCommandType(type, "JSON")).to.equal(`${type}_JSON`);
            expect(resolveEffectiveReportCommandType(type, "XLSX")).to.equal(`${type}_XLSX`);
        }

        const xlsxPayload = JSON.parse(
            generateReportCommandJSON(
                "2026-10-01T00:00:00Z",
                "2026-10-31T00:00:00Z",
                "ADJUDICATION",
                "urn:ornl:oscar:lane:1",
                null,
                "XLSX",
            )
        );
        expect(Object.keys(xlsxPayload.parameters)).to.deep.equal([
            "reportType",
            "startDateTime",
            "endDateTime",
            "laneUID",
            "eventType",
        ]);
        expect(xlsxPayload.parameters.reportType).to.equal("ADJUDICATION_XLSX");
    });
});
