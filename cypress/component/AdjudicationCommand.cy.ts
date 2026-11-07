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

    it("encodes Adjudication Details output formats using the 5-field SWE report command schema", () => {
        expect(resolveEffectiveReportCommandType("ADJUDICATION_DETAILS", "PDF")).to.equal("ADJUDICATION_DETAILS");
        expect(resolveEffectiveReportCommandType("ADJUDICATION_DETAILS", "CSV")).to.equal("ADJUDICATION_DETAILS_CSV");
        expect(resolveEffectiveReportCommandType("ADJUDICATION_DETAILS", "JSON")).to.equal("ADJUDICATION_DETAILS_JSON");
        expect(resolveEffectiveReportCommandType("ADJUDICATION_DETAILS", "XLSX")).to.equal("ADJUDICATION_DETAILS_XLSX");
        expect(resolveEffectiveReportCommandType("ADJUDICATION", "XLSX")).to.equal("ADJUDICATION");

        const xlsxPayload = JSON.parse(
            generateReportCommandJSON(
                "2026-10-01T00:00:00Z",
                "2026-10-31T00:00:00Z",
                "ADJUDICATION_DETAILS",
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
        expect(xlsxPayload.parameters.reportType).to.equal("ADJUDICATION_DETAILS_XLSX");
    });
});
