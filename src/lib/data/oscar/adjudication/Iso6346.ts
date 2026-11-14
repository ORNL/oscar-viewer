/*
 * Copyright (c) 2026.  Oak Ridge National Laboratory
 * All Rights Reserved
 */

const ISO_6346_PATTERN = /^[A-Z]{3}[UJZR][0-9]{7}$/;

const LETTER_WEIGHTS: Record<string, number> = {
    A: 10, B: 12, C: 13, D: 14, E: 15, F: 16, G: 17, H: 18, I: 19,
    J: 20, K: 21, L: 23, M: 24, N: 25, O: 26, P: 27, Q: 28, R: 29,
    S: 30, T: 31, U: 32, V: 34, W: 35, X: 36, Y: 37, Z: 38,
};

function normalizeContainerCode(raw: string): string {
    return String(raw ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function computeIso6346CheckDigit(code10: string): number | null {
    const cleaned = normalizeContainerCode(code10);
    if (cleaned.length < 10 || !/^[A-Z]{3}[UJZR][0-9]{6}/.test(cleaned)) {
        return null;
    }
    let sum = 0;
    for (let i = 0; i < 10; i++) {
        const ch = cleaned[i];
        const val = i < 4 ? LETTER_WEIGHTS[ch] : Number(ch);
        if (val === undefined || Number.isNaN(val)) {
            return null;
        }
        sum += val * (1 << i);
    }
    return (sum % 11) % 10;
}

export function isValidIso6346(raw: string): boolean {
    const cleaned = normalizeContainerCode(raw);
    if (!ISO_6346_PATTERN.test(cleaned)) {
        return false;
    }
    const expected = computeIso6346CheckDigit(cleaned.slice(0, 10));
    return expected !== null && expected === Number(cleaned[10]);
}

export function formatIso6346(raw: string): string {
    const cleaned = normalizeContainerCode(raw);
    if (!ISO_6346_PATTERN.test(cleaned)) {
        return String(raw ?? "").trim();
    }
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 10)} ${cleaned.slice(10)}`;
}
