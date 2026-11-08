import {INode} from "@/lib/data/osh/Node";
import {
    AdjudicationCode,
    AdjudicationCodes,
    EML_NON_THREAT_CODE,
    EXTENDED_OCCUPANCY_GAMMA_CODE,
} from "./models/AdjudicationConstants";

export const CUSTOM_CODES_DEFINITION = "urn:osh:def:property:CustomAdjudicationCodes";

export async function findCustomCodesStream(node: INode) {
    return node.fetchDataStreamWithObservedProperty(CUSTOM_CODES_DEFINITION);
}

export function parseCustomCodes(value: unknown): AdjudicationCode[] {
    if (!Array.isArray(value)) return [];
    const codes = new Map<number, AdjudicationCode>();
    for (const entry of value) {
        if (
            !Number.isInteger(entry?.code) ||
            entry.code <= 11 ||
            entry.code === EXTENDED_OCCUPANCY_GAMMA_CODE ||
            entry.code === EML_NON_THREAT_CODE ||
            entry.code > 2147483647 ||
            typeof entry.label !== "string" ||
            !entry.label.trim()
        ) continue;
        codes.set(entry.code, {code: entry.code, label: entry.label, group: "Custom"});
    }
    return [...codes.values()];
}

/** Only offer a bulk code when its meaning agrees on every target node. */
export function commonCustomCodes(nodeCodes: AdjudicationCode[][]): AdjudicationCode[] {
    if (!nodeCodes.length) return [];
    return nodeCodes[0].filter(code => nodeCodes.every(codes =>
        codes.some(candidate => candidate.code === code.code && candidate.label === code.label)));
}

/** Offer every configured custom code across visible nodes when filtering Event Log rows. */
export function unionCustomCodes(nodeCodes: AdjudicationCode[][]): AdjudicationCode[] {
    const merged = new Map<number, AdjudicationCode>();
    for (const codes of nodeCodes) {
        for (const entry of codes) {
            if (!merged.has(entry.code)) {
                merged.set(entry.code, entry);
            }
        }
    }
    return [...merged.values()].sort((left, right) => left.code - right.code);
}

export function resolveAdjudicationCode(code: number, customCodes: AdjudicationCode[]): AdjudicationCode {
    return AdjudicationCodes.codes.find(entry => entry.code === code)
        ?? customCodes.find(entry => entry.code === code)
        ?? {code, label: `Code ${code}`, group: "Custom"};
}
