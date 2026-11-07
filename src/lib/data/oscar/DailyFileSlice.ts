import {INode} from "@/lib/data/osh/Node";

export const DAILY_FILE_SLICE_SCHEMA_VERSION = 1;
export const DEFAULT_DAILY_FILE_SLICE_LIMIT = 1000;
export const MAX_DAILY_FILE_SLICE_LIMIT = 1000;
export const MAX_DAILY_FILE_SLICE_BYTES = 512 * 1024;
export const MIDNIGHT_STRADDLE_GAP_THRESHOLD_MS = 1000;

export type DailyFileSliceFetch = (
    input: RequestInfo | URL,
    init?: RequestInit,
) => Promise<Response>;

export type DailyFileSliceNode = Pick<INode,
    "address" | "port" | "isSecure" | "isDefaultNode" | "oshPathRoot"
    | "bucketsEndpoint" | "getBasicAuthHeader">;

export interface DailyFileMessageItem {
    message: string;
    timestamp: string;
}

export interface DailyFileSliceResponse {
    schemaVersion: number;
    laneUid: string;
    startTime: string;
    endTime: string;
    truncated: boolean;
    items: DailyFileMessageItem[];
}

export interface DailyFileSliceRequest {
    node: DailyFileSliceNode;
    laneUid?: string;
    laneName?: string;
    startTime: string;
    endTime: string;
    limit?: number;
}

export type DailyFileSliceErrorCode = "http" | "invalid-request" | "invalid-response";

export class DailyFileSliceError extends Error {
    readonly code: DailyFileSliceErrorCode;
    readonly status?: number;

    constructor(code: DailyFileSliceErrorCode, message: string, status?: number) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = "DailyFileSliceError";
        this.code = code;
        this.status = status;
    }
}

const EXTENDED_SIGNED_YEAR_ISO_RE =
    /^[+-]\d{6,10}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,9})?Z$/;

function parseEpochMillis(isoTimestamp: string): number | null {
    if (typeof isoTimestamp !== "string" || !isoTimestamp.trim())
        return null;
    const parsed = Date.parse(isoTimestamp);
    return Number.isFinite(parsed) ? parsed : null;
}

function requireIsoTimestamp(value: unknown, field: string, errorCode: DailyFileSliceErrorCode): string {
    if (typeof value !== "string" || !value.trim() || value.length > 128)
        throw new DailyFileSliceError(errorCode, `${field} must be a non-empty ISO-8601 timestamp`);
    if (parseEpochMillis(value) === null && !EXTENDED_SIGNED_YEAR_ISO_RE.test(value))
        throw new DailyFileSliceError(errorCode, `${field} must be a valid ISO-8601 timestamp`);
    return value.trim();
}

function normalizeConfiguredPath(path: string | undefined, fallback: string): string {
    const input = (path || fallback).replace(/\\/g, "/");
    const segments = input.split("/").filter(segment => segment && segment !== ".");
    if (segments.some(segment => segment === "..")) {
        throw new DailyFileSliceError(
            "invalid-request",
            "The configured daily-file bucket endpoint is unsafe.",
        );
    }
    return `/${segments.map(segment => encodeURIComponent(segment)).join("/")}`;
}

function dailyFilesEndpoint(node: DailyFileSliceNode): string {
    const root = normalizeConfiguredPath(node.oshPathRoot, "/sensorhub");
    const buckets = normalizeConfiguredPath(node.bucketsEndpoint, "/buckets");
    const relative = `${root}${buckets}/dailyfiles`;
    if (node.isDefaultNode)
        return relative;
    const protocol = node.isSecure ? "https" : "http";
    return `${protocol}://${node.address}:${node.port}${relative}`;
}

function authenticationHeaders(node: DailyFileSliceNode): Record<string, string> {
    const supplied = node.getBasicAuthHeader?.();
    const authorization = supplied && typeof supplied.Authorization === "string"
        ? supplied.Authorization : undefined;
    return authorization ? {Authorization: authorization} : {};
}

async function readBoundedResponseBody(
    response: Response,
    maximumBytes: number,
): Promise<ArrayBuffer> {
    const contentLength = response.headers.get("Content-Length");
    if (contentLength !== null) {
        const normalized = contentLength.trim();
        if (!/^\d+$/.test(normalized) || !Number.isSafeInteger(Number(normalized))) {
            throw new DailyFileSliceError(
                "invalid-response",
                "Daily-file slice response has an invalid Content-Length header.",
            );
        }
        if (Number(normalized) > maximumBytes) {
            throw new DailyFileSliceError(
                "invalid-response",
                "Daily-file slice response exceeds its transfer-size limit.",
            );
        }
    }
    if (!response.body) {
        throw new DailyFileSliceError(
            "invalid-response",
            "Daily-file slice response has no readable body.",
        );
    }

    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    try {
        while (true) {
            const {done, value} = await reader.read();
            if (done)
                break;
            total += value.byteLength;
            if (total > maximumBytes) {
                await reader.cancel().catch((): void => undefined);
                throw new DailyFileSliceError(
                    "invalid-response",
                    "Daily-file slice response exceeds its transfer-size limit.",
                );
            }
            chunks.push(value);
        }
    } finally {
        reader.releaseLock();
    }

    const buffer = new ArrayBuffer(total);
    const output = new Uint8Array(buffer);
    let offset = 0;
    for (const chunk of chunks) {
        output.set(chunk, offset);
        offset += chunk.byteLength;
    }
    return buffer;
}

export function buildDailyFileSliceUrl(request: DailyFileSliceRequest): string {
    const startTime = requireIsoTimestamp(request.startTime, "startTime", "invalid-request");
    const endTime = requireIsoTimestamp(request.endTime, "endTime", "invalid-request");
    const laneUid = typeof request.laneUid === "string" ? request.laneUid.trim() : "";
    const laneName = typeof request.laneName === "string" ? request.laneName.trim() : "";
    if (!laneUid && !laneName) {
        throw new DailyFileSliceError(
            "invalid-request",
            "laneUid or laneName is required for a daily-file slice request",
        );
    }
    const limit = request.limit ?? DEFAULT_DAILY_FILE_SLICE_LIMIT;
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > MAX_DAILY_FILE_SLICE_LIMIT) {
        throw new DailyFileSliceError(
            "invalid-request",
            `limit must be an integer between 1 and ${MAX_DAILY_FILE_SLICE_LIMIT}`,
        );
    }

    const params = new URLSearchParams();
    params.set("startTime", startTime);
    params.set("endTime", endTime);
    if (laneUid)
        params.set("laneUid", laneUid);
    if (laneName)
        params.set("laneName", laneName);
    params.set("limit", String(limit));

    return `${dailyFilesEndpoint(request.node)}/dailyfile-slice?${params.toString()}`;
}

export function parseDailyFileSliceResponse(value: unknown): DailyFileSliceResponse {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw new DailyFileSliceError(
            "invalid-response",
            "Daily-file slice response must be a JSON object",
        );
    }
    const payload = value as Record<string, unknown>;
    if (payload.schemaVersion !== DAILY_FILE_SLICE_SCHEMA_VERSION) {
        throw new DailyFileSliceError(
            "invalid-response",
            "Unsupported daily-file slice schemaVersion",
        );
    }
    if (typeof payload.laneUid !== "string" || !payload.laneUid.trim() || payload.laneUid.length > 512) {
        throw new DailyFileSliceError(
            "invalid-response",
            "Daily-file slice response is missing a valid laneUid",
        );
    }
    const startTime = requireIsoTimestamp(payload.startTime, "response.startTime", "invalid-response");
    const endTime = requireIsoTimestamp(payload.endTime, "response.endTime", "invalid-response");
    if (typeof payload.truncated !== "boolean") {
        throw new DailyFileSliceError(
            "invalid-response",
            "Daily-file slice response truncated flag must be boolean",
        );
    }
    if (!Array.isArray(payload.items) || payload.items.length > MAX_DAILY_FILE_SLICE_LIMIT) {
        throw new DailyFileSliceError(
            "invalid-response",
            `Daily-file slice items must be an array of at most ${MAX_DAILY_FILE_SLICE_LIMIT} entries`,
        );
    }

    const items: DailyFileMessageItem[] = [];
    for (let i = 0; i < payload.items.length; i++) {
        const rawItem = payload.items[i];
        if (!rawItem || typeof rawItem !== "object" || Array.isArray(rawItem)) {
            throw new DailyFileSliceError(
                "invalid-response",
                `Daily-file slice items[${i}] must be an object`,
            );
        }
        const entry = rawItem as Record<string, unknown>;
        if (typeof entry.message !== "string" || entry.message.length > MAX_DAILY_FILE_SLICE_BYTES) {
            throw new DailyFileSliceError(
                "invalid-response",
                `Daily-file slice items[${i}].message must be bounded text`,
            );
        }
        const timestamp = requireIsoTimestamp(
            entry.timestamp,
            `items[${i}].timestamp`,
            "invalid-response",
        );
        if (entry.message.length > 0)
            items.push({message: entry.message, timestamp});
    }

    return {
        schemaVersion: DAILY_FILE_SLICE_SCHEMA_VERSION,
        laneUid: payload.laneUid,
        startTime,
        endTime,
        truncated: payload.truncated,
        items,
    };
}

/**
 * Fetches a bounded slice of published daily-file CSV records for an occupancy window.
 * Returns null when the node responds with 404 (such as an older backend without the slice API).
 */
export async function fetchDailyFileSlice(
    request: DailyFileSliceRequest,
    fetchImpl: DailyFileSliceFetch = fetch,
    signal?: AbortSignal,
): Promise<DailyFileSliceResponse | null> {
    const url = buildDailyFileSliceUrl(request);
    const response = await fetchImpl(url, {
        credentials: "include",
        cache: "no-store",
        headers: {
            ...authenticationHeaders(request.node),
            Accept: "application/json",
        },
        signal,
    });
    if (response.status === 404)
        return null;
    if (!response.ok) {
        throw new DailyFileSliceError(
            "http",
            `Daily-file slice lookup returned HTTP ${response.status}`,
            response.status,
        );
    }

    let payload: unknown;
    try {
        const body = await readBoundedResponseBody(response, MAX_DAILY_FILE_SLICE_BYTES);
        payload = JSON.parse(new TextDecoder("utf-8", {fatal: true}).decode(body));
    } catch (error) {
        if (error instanceof DailyFileSliceError)
            throw error;
        throw new DailyFileSliceError(
            "invalid-response",
            "Daily-file slice body is not bounded UTF-8 JSON",
        );
    }
    return parseDailyFileSliceResponse(payload);
}

/**
 * Determines whether the cold daily-file slice endpoint should be queried.
 * Triggers when hot PostgreSQL observations are empty or when a midnight-straddling
 * occupancy is missing its leading prefix because the earlier day was purged.
 */
export function shouldFetchDailyFileSlice(
    hotItems: readonly DailyFileMessageItem[],
    startTime: string,
): boolean {
    if (hotItems.length === 0)
        return true;
    const startMs = parseEpochMillis(startTime);
    if (startMs === null)
        return false;
    let firstHotMs = Number.POSITIVE_INFINITY;
    for (const item of hotItems) {
        const ms = parseEpochMillis(item.timestamp);
        if (ms !== null && ms < firstHotMs)
            firstHotMs = ms;
    }
    if (!Number.isFinite(firstHotMs))
        return true;
    return firstHotMs - startMs > MIDNIGHT_STRADDLE_GAP_THRESHOLD_MS;
}

/**
 * Merges hot ConSys observations and cold daily-file slice items chronologically,
 * deduplicating identical (timestamp, message) pairs while preserving exact server
 * ISO-8601 timestamps and deterministic arrival order on millisecond ties.
 */
export function mergeDailyFileItems(
    hotItems: readonly DailyFileMessageItem[],
    sliceItems: readonly DailyFileMessageItem[],
    limit = DEFAULT_DAILY_FILE_SLICE_LIMIT,
): string[] {
    const seen = new Set<string>();
    const combined: Array<{item: DailyFileMessageItem; epochMs: number; order: number}> = [];
    let order = 0;

    const appendUnique = (items: readonly DailyFileMessageItem[]) => {
        for (const item of items) {
            if (!item.message || !item.timestamp)
                continue;
            const key = `${item.timestamp}\u0000${item.message}`;
            if (seen.has(key))
                continue;
            seen.add(key);
            const parsed = parseEpochMillis(item.timestamp);
            combined.push({
                item,
                epochMs: parsed ?? Number.MAX_SAFE_INTEGER,
                order: order++,
            });
        }
    };

    // Seed from sliceItems first only if ordering needs cold prefix before hot suffix?
    // Sorting by epochMs places earlier days first regardless, while inserting hotItems
    // first ensures hot records win deduplication and same-millisecond tie-breaking.
    appendUnique(hotItems);
    appendUnique(sliceItems);

    combined.sort((left, right) => {
        if (left.epochMs !== right.epochMs)
            return left.epochMs - right.epochMs;
        return left.order - right.order;
    });

    const capped = combined.slice(0, Math.max(0, limit));
    return capped.map(entry => `${entry.item.message},${entry.item.timestamp}`);
}
