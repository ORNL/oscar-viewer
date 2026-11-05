import {INode} from "@/lib/data/osh/Node";
import {runAbortableWithTimeout} from "@/app/_components/lane-view/VideoStreamUtils";

export const HLS_VIEWER_ID_HEADER = "X-OSCAR-HLS-Viewer";
export const HLS_VIEWER_STATE_HEADER = "X-OSCAR-HLS-Viewer-State";

type LiveVideoNode = Pick<INode,
    "address" | "port" | "isSecure" | "isDefaultNode" | "oshPathRoot" | "bucketsEndpoint">;

type HlsViewerNode = LiveVideoNode & {
    getBasicAuthHeader?: () => { Authorization?: string };
};

function normalizeConfiguredPath(path: string, fallback: string): string {
    const normalized = normalizeResourcePath(path || fallback);
    return normalized ? `/${normalized}` : "";
}

function fullyDecodePath(path: string): string | null {
    let decoded = path;
    for (let pass = 0; pass < 16; pass++) {
        let next: string;
        try {
            next = decodeURIComponent(decoded);
        } catch {
            return null;
        }
        if (next === decoded)
            return decoded;
        decoded = next;
    }

    // Reject pathological nesting rather than letting a downstream server's
    // additional decoding turn it into a path separator or dot segment.
    return null;
}

function normalizeResourcePath(path: string): string {
    const decoded = fullyDecodePath(path);
    if (decoded === null)
        return "";

    const segments: string[] = [];
    decoded.replace(/\\/g, "/").split("/").forEach((segment) => {
        if (!segment || segment === ".")
            return;
        if (segment === "..") {
            segments.pop();
            return;
        }
        // Encode every accepted segment after canonicalization so encoded
        // slashes and dots cannot regain structural meaning in the browser.
        segments.push(encodeURIComponent(segment));
    });
    return segments.join("/");
}

/**
 * Builds the URL used for a live HLS playlist.
 *
 * Stream paths are service data rather than trusted navigation targets, so an
 * absolute path returned by a command is reduced to its path/query and rebuilt
 * against the configured node. The local/default node deliberately uses a
 * relative URL so authentication remains same-origin and a configured hostname
 * cannot accidentally bypass the reverse proxy.
 */
export function buildLiveVideoUrl(videoSource: string, node: LiveVideoNode): string {
    const rootPath = normalizeConfiguredPath(node.oshPathRoot, "/sensorhub");
    const bucketPath = normalizeConfiguredPath(node.bucketsEndpoint, "/buckets");

    let source = videoSource.trim();
    if (/^https?:\/\//i.test(source)) {
        try {
            const parsed = new URL(source);
            source = `${parsed.pathname}${parsed.search}`;
        } catch {
            // Rebuild malformed values against the node below instead of
            // allowing them to become an external navigation target.
        }
    }

    const suffixIndex = source.search(/[?#]/);
    const suffix = suffixIndex >= 0 ? source.substring(suffixIndex) : "";
    let resourcePath = normalizeResourcePath(
        suffixIndex >= 0 ? source.substring(0, suffixIndex) : source,
    );

    const rootWithoutSlash = rootPath.substring(1);
    const bucketWithoutSlash = bucketPath.substring(1);
    const fullPrefix = [rootWithoutSlash, bucketWithoutSlash].filter(Boolean).join("/");
    for (const prefix of [fullPrefix, bucketWithoutSlash].filter(Boolean)) {
        if (resourcePath === prefix) {
            resourcePath = "";
            break;
        }
        if (resourcePath.startsWith(`${prefix}/`)) {
            resourcePath = resourcePath.substring(prefix.length + 1);
            break;
        }
    }

    const resourceSuffix = resourcePath ? `/${resourcePath}` : "";
    const relativeUrl = `${rootPath}${bucketPath}${resourceSuffix}${suffix}`;
    if (node.isDefaultNode)
        return relativeUrl;

    const protocol = node.isSecure ? "https" : "http";
    return `${protocol}://${node.address}:${node.port}${relativeUrl}`;
}

export function createHlsViewerId(): string {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }
    return `viewer-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function sendHlsViewerState(
    videoSource: string | null | undefined,
    node: HlsViewerNode | null | undefined,
    viewerId: string | null | undefined,
    state: "closing" | "heartbeat",
    timeoutMs = 2_000,
): Promise<void> {
    if (!videoSource || !node || !viewerId || typeof fetch !== "function") {
        return;
    }

    const url = buildLiveVideoUrl(videoSource, node);
    const headers: Record<string, string> = {
        "Cache-Control": "no-cache",
        [HLS_VIEWER_ID_HEADER]: viewerId,
        [HLS_VIEWER_STATE_HEADER]: state,
    };
    const authHeader = node.getBasicAuthHeader?.()?.Authorization;
    if (authHeader) {
        headers.Authorization = authHeader;
    }

    const controller = new AbortController();
    try {
        await runAbortableWithTimeout(controller, timeoutMs, (signal) =>
            fetch(url, {
                method: "GET",
                headers,
                credentials: "include",
                cache: "no-store",
                keepalive: state === "closing",
                signal,
            }),
        );
    } catch {
        // Best-effort lease update; server-side TTL and command sequencing remain authoritative.
    }
}
