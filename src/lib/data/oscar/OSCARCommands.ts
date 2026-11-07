import {INode} from "@/lib/data/osh/Node";
import {AdjudicationCode} from "@/lib/data/oscar/adjudication/models/AdjudicationConstants";


export interface SendCommandOptions {
    signal?: AbortSignal;
}

export async function sendCommand(
    node: INode,
    controlStreamId: string,
    command: any,
    options: SendCommandOptions = {},
) {
    let ep = node.getConnectedSystemsEndpoint(false) + `/controlstreams/${controlStreamId}/commands`

    return await fetch(ep, {
        method: "POST",
        headers: {
            ...node.getBasicAuthHeader(),
            'Content-Type': 'application/json'
        },
        mode: 'cors',
        credentials: 'include',
        body: command,
        signal: options.signal,
    });
}


export class NationalGenerationCommand {
    startDateTime: string;
    endDateTime: string;

    constructor(endDateTime: string, startDateTime: string) {
        this.startDateTime = startDateTime;
        this.endDateTime = endDateTime;
    }

    getJsonString() {
        return JSON.stringify({
            "parameters": {
                "startDateTime": this.startDateTime,
                "endDateTime": this.endDateTime,
            }
        })
    }
}


export function generateNationalCommandJSON(startDateTime: string, endDateTime: string, laneUIDs?: string[]) {
    return JSON.stringify({
        "parameters": {
            "startDateTime": startDateTime != null ? startDateTime : null,
            "endDateTime": endDateTime != null ? endDateTime : null,
            "laneUID": laneUIDs?.length ? laneUIDs.join(";") : null,
        }
    })
}

export type ReportOutputFormat = "PDF" | "CSV" | "JSON" | "XLSX";

export function resolveEffectiveReportCommandType(
    reportType: string | null | undefined,
    reportFormat?: string | null,
): string | null {
    if (!reportType) {
        return null;
    }
    if (reportType === "ADJUDICATION_DETAILS") {
        const fmt = (reportFormat ?? "PDF").trim().toUpperCase();
        if (fmt === "CSV") return "ADJUDICATION_DETAILS_CSV";
        if (fmt === "JSON") return "ADJUDICATION_DETAILS_JSON";
        if (fmt === "XLSX") return "ADJUDICATION_DETAILS_XLSX";
        return "ADJUDICATION_DETAILS";
    }
    return reportType;
}

export async function fetchCommandStatuses(
    node: INode,
    controlStreamId: string,
    commandId: string,
    options: SendCommandOptions = {},
): Promise<any[]> {
    const ep =
        node.getConnectedSystemsEndpoint(false) +
        `/controlstreams/${encodeURIComponent(controlStreamId)}/commands/${encodeURIComponent(commandId)}/status?f=application%2Fjson`;

    const resp = await fetch(ep, {
        method: "GET",
        headers: {
            ...node.getBasicAuthHeader(),
            Accept: "application/json",
        },
        mode: "cors",
        credentials: "include",
        cache: "no-store",
        signal: options.signal,
    });
    if (!resp.ok) {
        return [];
    }
    const payload = await resp.json();
    if (Array.isArray(payload)) {
        return payload;
    }
    if (Array.isArray(payload?.items)) {
        return payload.items;
    }
    return payload ? [payload] : [];
}

export class ReportGenerationCommand {
    startDateTime: string;
    endDateTime: string;
    reportType: string;
    laneUID: string;
    eventId: string;
    reportFormat: string;

    constructor(
        startDateTime: string,
        endDateTime: string,
        reportType: string,
        laneUID: string,
        eventId: string,
        reportFormat: string = "PDF",
    ) {
        this.startDateTime = startDateTime;
        this.endDateTime = endDateTime;
        this.reportType = reportType;
        this.laneUID = laneUID;
        this.eventId = eventId;
        this.reportFormat = reportFormat;
    }

    getJsonString() {
        return JSON.stringify({
                "parameters": {
                    "reportType": resolveEffectiveReportCommandType(this.reportType, this.reportFormat),
                    "startDateTime": this.startDateTime,
                    "endDateTime": this.endDateTime,
                    "laneUID": this.laneUID,
                    "eventType": this.eventId
                }
            })
    }
}

export function generateReportCommandJSON(
    startDateTime: string,
    endDateTime: string,
    reportType: string | null,
    laneUID: string | null,
    eventType: string | null,
    reportFormat?: string | null,
) {
    return JSON.stringify({
        "parameters": {
            "reportType": resolveEffectiveReportCommandType(reportType, reportFormat),
            "startDateTime": startDateTime,
            "endDateTime": endDateTime,
            "laneUID": laneUID ?? "NONE",
            "eventType": eventType ?? "NONE"
        }
    })
}

export class AdjudicationCommand {
    feedback: string;
    adjudicationCode: number;
    isotopes: string;
    secondaryInspectionStatus: string;
    isotopesCount: number;
    filePathsCount: number;
    filePaths: string;
    occupancyObsId: string;
    vehicleId: string;


    constructor(feedback: string, adjudicationCode: number, isotopes: string, secondaryInspectionStatus: string, filePaths: string, occupancyObsId: string, vehicleId: string) {
        this.feedback = feedback;
        this.adjudicationCode = adjudicationCode;
        this.isotopes = isotopes;
        this.isotopesCount = isotopes.length;
        this.filePathsCount = filePaths.length;
        this.secondaryInspectionStatus = secondaryInspectionStatus;
        this.filePaths = filePaths;
        this.occupancyObsId = occupancyObsId;
        this.vehicleId = vehicleId;
    }

    getJsonString() {
        return JSON.stringify({
            "parameters": {
                "feedback": this.feedback,
                "adjudicationCode": this.adjudicationCode,
                "isotopesCount": this.isotopesCount,
                "isotopes": this.isotopes,
                "secondaryInspectionStatus": this.secondaryInspectionStatus,
                "filePathCount": this.filePathsCount,
                "filePaths": this.filePaths,
                "occupancyObsId": this.occupancyObsId,
                "vehicleId": this.vehicleId
            }
        })
    }
}

export function generateAdjudicationCommandJSON(feedback: string, adjudicationCode: AdjudicationCode, isotopes: string[], secondaryInspectionStatus: string, filePaths: string[], occupancyObsId: string, vehicleId: string) {

    return JSON.stringify({
        "parameters": {
            "feedback": feedback,
            "adjudicationCode": adjudicationCode.code,
            "isotopesCount": isotopes?.length ?? 0,
            "isotopes": isotopes ?? [],
            "secondaryInspectionStatus": secondaryInspectionStatus == "" ? "NONE" : secondaryInspectionStatus,
            "filePathCount": filePaths?.length ?? 0,
            "filePaths": filePaths ?? [],
            "occupancyObsId": occupancyObsId,
            "vehicleId": vehicleId ?? ""
        }
    })
}

export function generateHLSVideoCommandJSON(streamControl: boolean) {
    return JSON.stringify({
        "parameters": {
            "streamControl": streamControl ? "startStream" : "endStream"
        }
    })
}

export function generateManualTamperCommandJSON(tamperState: boolean) {
    return JSON.stringify({
        "parameters": tamperState
    });
}
