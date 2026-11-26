/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import {
    ExportedConfig,
    MAX_CONFIG_FILE_BYTES,
    PAGE_CONFIG_SCHEMA_VERSION,
    PageConfig,
} from "./PageConfigTypes";
import {sanitizePageConfig} from "./ConfigValidation";

/**
 * Download custom dashboard pages as a JSON file using a standard Blob anchor.
 * Any legacy route-hijack fields are stripped prior to serialization.
 */
export function exportPagesToFile(pages: PageConfig[], filename: string) {
    const payload: ExportedConfig = {
        kind: 'oscar-viewer-pages',
        schemaVersion: PAGE_CONFIG_SCHEMA_VERSION,
        exportedAt: new Date().toISOString(),
        pages: pages.map((page) => sanitizePageConfig(page)),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename.endsWith('.json') ? filename : `${filename}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
}

/**
 * Read and parse a JSON dashboard configuration file selected via `<input type="file">`.
 * Rejects files exceeding `MAX_CONFIG_FILE_BYTES` (512 KiB) before parsing.
 */
export function readConfigFile(file: File): Promise<unknown> {
    if (file.size > MAX_CONFIG_FILE_BYTES) {
        return Promise.reject(
            new Error(`Configuration file exceeds maximum size of ${MAX_CONFIG_FILE_BYTES / 1024} KiB`)
        );
    }
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const rawText = String(reader.result ?? '');
                const byteLength = new TextEncoder().encode(rawText).byteLength;
                if (byteLength > MAX_CONFIG_FILE_BYTES) {
                    reject(
                        new Error(`Configuration file exceeds maximum size of ${MAX_CONFIG_FILE_BYTES / 1024} KiB`)
                    );
                    return;
                }
                resolve(JSON.parse(rawText));
            } catch {
                reject(new Error('File is not valid JSON'));
            }
        };
        reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
        reader.readAsText(file);
    });
}
