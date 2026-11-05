import {EML_NON_THREAT_CODE, EML_NON_THREAT_MARKER} from "./models/AdjudicationConstants";

export const EML_METADATA_PREFIX = "EML_METADATA:";

export interface EmlMetadataSummary {
    adjudicatedBy?: string;
    disposition?: string;
    dispositionCode?: number;
    emlVersion?: string;
    modelId?: string;
    primaryThreshold?: number;
    result?: string;
    fallback?: boolean;
    releaseProbability?: number;
    investigateProbability?: number;
    ernieGammaAlert?: boolean;
    ernieNeutronAlert?: boolean;
    rpmResult?: string;
    rpmGammaAlert?: boolean;
    rpmNeutronAlert?: boolean;
    rpmScanError?: boolean;
    vehicleClass?: number;
    vehicleLength?: number;
    portId?: string;
    laneId?: number;
    segmentId?: number;
    sourceCount?: number;
    overallSourceType?: string;
    probabilityNORM?: number;
    probabilityNonEmitting?: number;
    probabilityThreat?: number;
    yellowLightMessage?: string;
}

export function hasEmlNonThreatMarker(adjudicatedIds?: readonly unknown[] | null): boolean {
    if (!Array.isArray(adjudicatedIds)) return false;
    return adjudicatedIds.some(value => String(value ?? "").trim() === EML_NON_THREAT_MARKER);
}

export function isSyntheticAdjudicationMarker(id: string): boolean {
    const trimmed = String(id ?? "").trim();
    return trimmed === EML_NON_THREAT_MARKER || trimmed === "bulk-adjudicated";
}

export function parseAdjudicationFeedbackWithEmlMetadata(rawFeedback: unknown): {
    summaryText: string;
    emlMetadata: EmlMetadataSummary | null;
} {
    const text = typeof rawFeedback === "string" ? rawFeedback : String(rawFeedback ?? "");
    const markerIndex = text.indexOf(EML_METADATA_PREFIX);
    if (markerIndex < 0) {
        return {summaryText: text, emlMetadata: null};
    }

    const summaryText = text.slice(0, markerIndex).trim();
    const jsonSlice = text.slice(markerIndex + EML_METADATA_PREFIX.length).trim();
    try {
        const parsed = JSON.parse(jsonSlice);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            return {
                summaryText: summaryText || text,
                emlMetadata: parsed as EmlMetadataSummary,
            };
        }
    } catch {
        // Keep raw feedback intact if embedded JSON was truncated or modified.
    }
    return {summaryText: summaryText || text, emlMetadata: null};
}

export function isEmlAutomatedAdjudication(entry: {
    adjudicationCode?: {code?: number} | null;
    username?: string | null;
    feedback?: string | null;
}): boolean {
    if (entry?.adjudicationCode?.code === EML_NON_THREAT_CODE) return true;
    if (String(entry?.username ?? "").trim().toUpperCase() === "EML") return true;
    return parseAdjudicationFeedbackWithEmlMetadata(entry?.feedback).emlMetadata !== null;
}
