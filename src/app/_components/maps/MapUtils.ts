import {INode} from "@/lib/data/osh/Node";

// OSM's tile policy requires this exact hostname. Do not restore Leaflet's
// historical a/b/c subdomains; OSM may return policy-block tiles for them.
export const OSM_TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
export const SITE_DIAGRAM_PANE = "site-diagram";
export const LANE_MARKER_PANE = "lane-markers";

// Leaflet renders tiles at 200, ordinary image overlays at 400, and markers at
// 600. Keeping site diagrams at 450 makes them the top raster layer without
// hiding lane markers or their popups.
export const SITE_DIAGRAM_PANE_Z_INDEX = 450;
export const LANE_MARKER_PANE_Z_INDEX = 650;

// Zero padding and fractional zoom make the initial viewport the tightest
// possible fit for the coordinates supplied when the diagram was uploaded.
export const SITE_DIAGRAM_FIT_OPTIONS = {
    animate: false,
    padding: [0, 0] as [number, number],
};

export const LANE_MARKER_ICON_SIZE: [number, number] = [24, 24];
export const LANE_MARKER_ICON_ANCHOR: [number, number] = [12, 12];

// Keep padding to the 12px marker radius plus 2px clearance so outermost lane
// icons are never clipped by the map border while maximizing fractional zoom.
export const LANE_EXTENT_FIT_OPTIONS = {
    animate: false,
    padding: [14, 14] as [number, number],
    maxZoom: 18,
};

export type SiteDiagramBounds = [
    [latitude: number, longitude: number],
    [latitude: number, longitude: number]
];

interface GeographicPoint {
    lat: number;
    lon: number;
}

interface SiteBoundingBox {
    lowerLeftBound: GeographicPoint;
    upperRightBound: GeographicPoint;
}

export interface LaneMapLocation {
    lat: number;
    lon: number;
    alt: number;
}

type SiteDiagramNode = Pick<INode,
    "address" | "port" | "isSecure" | "oshPathRoot" | "bucketsEndpoint">;

function normalizeUrlPath(path: string, fallback: string): string {
    const normalized = (path || fallback).replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
    return normalized ? `/${normalized}` : "";
}

export function buildSiteDiagramUrl(path: string, node: SiteDiagramNode): string {
    if (/^https?:\/\//i.test(path))
        return path;

    const protocol = node.isSecure ? "https" : "http";
    const rootPath = normalizeUrlPath(node.oshPathRoot, "/sensorhub");
    const bucketPath = normalizeUrlPath(node.bucketsEndpoint, "/buckets");
    const bucketPathWithoutLeadingSlash = bucketPath.substring(1);
    let resourcePath = path.replace(/\\/g, "/").replace(/^\/+/, "");

    // Accept either the relative value published by the service
    // (sitemap/file.png) or a value that already includes the bucket endpoint.
    if (resourcePath === bucketPathWithoutLeadingSlash)
        resourcePath = "";
    else if (resourcePath.startsWith(`${bucketPathWithoutLeadingSlash}/`))
        resourcePath = resourcePath.substring(bucketPathWithoutLeadingSlash.length + 1);

    const resourceSuffix = resourcePath ? `/${resourcePath}` : "";
    return `${protocol}://${node.address}:${node.port}${rootPath}${bucketPath}${resourceSuffix}`;
}

export function toLeafletSiteDiagramBounds(siteBoundingBox: SiteBoundingBox): SiteDiagramBounds | null {
    const lowerLeft = siteBoundingBox?.lowerLeftBound;
    const upperRight = siteBoundingBox?.upperRightBound;
    const coordinates = [lowerLeft?.lat, lowerLeft?.lon, upperRight?.lat, upperRight?.lon];

    if (!coordinates.every(Number.isFinite))
        return null;

    if (Math.abs(lowerLeft.lat) > 90 || Math.abs(upperRight.lat) > 90 ||
        Math.abs(lowerLeft.lon) > 180 || Math.abs(upperRight.lon) > 180)
        return null;

    if (lowerLeft.lat >= upperRight.lat || lowerLeft.lon >= upperRight.lon)
        return null;

    return [
        [lowerLeft.lat, lowerLeft.lon],
        [upperRight.lat, upperRight.lon],
    ];
}

export function toLaneMapLocation(result: unknown): LaneMapLocation | null {
    const location = (result as {location?: {lat?: unknown; lon?: unknown; alt?: unknown}})?.location;
    const lat = location?.lat;
    const lon = location?.lon;
    const alt = location?.alt ?? 0;

    if (typeof lat !== "number" || typeof lon !== "number" || typeof alt !== "number" ||
        !Number.isFinite(lat) || !Number.isFinite(lon) || !Number.isFinite(alt))
        return null;

    if (Math.abs(lat) > 90 || Math.abs(lon) > 180)
        return null;

    return {lat, lon, alt};
}

export function toLaneMapLocationFromSystem(system: unknown): LaneMapLocation | null {
    const rawSystem = system as {
        geometry?: unknown;
        properties?: {
            geometry?: unknown;
            properties?: {geometry?: unknown};
        };
    };
    const geometryCandidates = [
        rawSystem?.geometry,
        rawSystem?.properties?.geometry,
        rawSystem?.properties?.properties?.geometry,
    ];

    for (const candidate of geometryCandidates) {
        const geometry = candidate as {type?: unknown; coordinates?: unknown};
        if (geometry?.type !== "Point" || !Array.isArray(geometry.coordinates))
            continue;

        // GeoJSON point coordinates are ordered longitude, latitude, altitude.
        const [lon, lat, rawAlt = 0] = geometry.coordinates;
        const alt = rawAlt ?? 0;
        if (typeof lat !== "number" || typeof lon !== "number" || typeof alt !== "number" ||
            !Number.isFinite(lat) || !Number.isFinite(lon) || !Number.isFinite(alt))
            continue;
        if (Math.abs(lat) > 90 || Math.abs(lon) > 180)
            continue;

        return {lat, lon, alt};
    }

    return null;
}

export function isValidGeographicCoordinate(lat: unknown, lon: unknown): boolean {
    return typeof lat === "number" &&
        typeof lon === "number" &&
        Number.isFinite(lat) &&
        Number.isFinite(lon) &&
        Math.abs(lat) <= 90 &&
        Math.abs(lon) <= 180;
}

export function isUnconfiguredNullIsland(location: Pick<LaneMapLocation, "lat" | "lon">): boolean {
    return Math.abs(location.lat) < 1e-6 && Math.abs(location.lon) < 1e-6;
}

export function resolveLaneMapLocation(
    observationResult: unknown,
    systemLocation: LaneMapLocation | null,
): LaneMapLocation | null {
    const observationLocation = toLaneMapLocation(observationResult);
    if (!observationLocation)
        return systemLocation;

    if (isUnconfiguredNullIsland(observationLocation) &&
        systemLocation &&
        !isUnconfiguredNullIsland(systemLocation)) {
        return systemLocation;
    }

    return observationLocation;
}

export function toLeafletLaneExtentBounds(
    locations: ReadonlyArray<Pick<LaneMapLocation, "lat" | "lon">>,
): SiteDiagramBounds | null {
    const validLocations = locations.filter((location) =>
        isValidGeographicCoordinate(location?.lat, location?.lon));
    if (validLocations.length === 0)
        return null;

    const configuredLocations = validLocations.filter((location) =>
        !isUnconfiguredNullIsland(location));
    const effectiveLocations = configuredLocations.length > 0
        ? configuredLocations
        : validLocations;

    let minLat = effectiveLocations[0].lat;
    let maxLat = effectiveLocations[0].lat;
    let minLon = effectiveLocations[0].lon;
    let maxLon = effectiveLocations[0].lon;

    for (const location of effectiveLocations) {
        if (location.lat < minLat)
            minLat = location.lat;
        if (location.lat > maxLat)
            maxLat = location.lat;
        if (location.lon < minLon)
            minLon = location.lon;
        if (location.lon > maxLon)
            maxLon = location.lon;
    }

    return [
        [minLat, minLon],
        [maxLat, maxLon],
    ];
}

export function buildLaneExtentSignature(
    markers: ReadonlyArray<{laneName: string; location: Pick<LaneMapLocation, "lat" | "lon">}>,
): string {
    if (markers.length === 0)
        return "";

    return [...markers]
        .filter(({location}) => isValidGeographicCoordinate(location?.lat, location?.lon))
        .sort((a, b) => a.laneName.localeCompare(b.laneName))
        .map(({laneName, location}) => `${laneName}:${location.lat.toFixed(6)},${location.lon.toFixed(6)}`)
        .join("|");
}
