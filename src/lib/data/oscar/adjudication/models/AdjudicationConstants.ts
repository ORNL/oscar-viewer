/*
 * Copyright (c) 2024.  Botts Innovative Research, Inc.
 * All Rights Reserved
 */

export interface AdjudicationCode {
    code: number;
    label: string;
    group: string;
}

export const EXTENDED_OCCUPANCY_GAMMA_CODE = 9998;
export const EXTENDED_OCCUPANCY_GAMMA_MARKER = "extended-occupancy-gamma";
export const EML_NON_THREAT_CODE = 9999;
export const EML_NON_THREAT_MARKER = "eml-non-threat";
export const ADJUDICATION_CODE_MARKER_PREFIX = "code:";

export function adjudicationCodeMarker(code: number): string {
    const normalized = Math.trunc(code);
    if (!Number.isFinite(normalized) || normalized < 0) {
        throw new Error(`Invalid adjudication code: ${code}`);
    }
    return `${ADJUDICATION_CODE_MARKER_PREFIX}${normalized}`;
}

export class AdjudicationCodes {
    static codes: AdjudicationCode[] = [
        {code: 0, label: "", group: ""},
        {code: 1, label: "Code 1: Contraband Found", group: "Real Alarm"},
        {code: 2, label: "Code 2: Other", group: "Real Alarm"},
        {code: 3, label: "Code 3: Medical Isotope Found", group: "Innocent Alarm"},
        {code: 4, label: "Code 4: NORM Found", group: "Innocent Alarm"},
        {code: 5, label: "Code 5: Declared Shipment of Radioactive Material", group: "Innocent Alarm"},
        {code: 6, label: "Code 6: Physical Inspection Negative", group: "False Alarm"},
        {code: 7, label: "Code 7: RIID/ASP Indicates Background Only", group: "False Alarm"},
        {code: 8, label: "Code 8: Other", group: "False Alarm"},
        {code: 9, label: "Code 9: Authorized Test, Maintenance, or Training Activity", group: "Test/Maintenance"},
        {code: 10, label: "Code 10: Unauthorized Activity", group: "Tamper/Fault"},
        {code: 11, label: "Code 11: Other", group: "Other"},
        {code: EXTENDED_OCCUPANCY_GAMMA_CODE, label: "Code 9998: Extended Occupancy Gamma Alarm", group: "Automated"},
        {code: EML_NON_THREAT_CODE, label: "Code 9999: EML Non-Threat", group: "Automated"},
    ]

    constructor() {
    }

    static getGroupCodes(group: string): AdjudicationCode[] {
        return this.codes.filter(code => code.group === group);
    }

    static getCodeObjByIndex(index: number): AdjudicationCode {
        return this.codes.find(code => code.code === index) || this.codes[0];
    }

    static getCodeObjByLabel(label: string): AdjudicationCode {
        return this.codes.find(code => code.label === label) || this.codes[0];
    }
}
