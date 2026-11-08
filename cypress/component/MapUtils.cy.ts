import {
    buildLaneExtentSignature,
    buildSiteDiagramUrl,
    LANE_EXTENT_FIT_OPTIONS,
    LANE_MARKER_PANE_Z_INDEX,
    OSM_TILE_URL,
    resolveLaneMapLocation,
    SITE_DIAGRAM_FIT_OPTIONS,
    SITE_DIAGRAM_PANE_Z_INDEX,
    toLaneMapLocation,
    toLaneMapLocationFromSystem,
    toLeafletLaneExtentBounds,
    toLeafletSiteDiagramBounds,
} from "../../src/app/_components/maps/MapUtils";
import {isLocationDataStream} from "../../src/lib/data/oscar/Utilities";

describe("map configuration", () => {
    const node = {
        address: "oscar.example",
        port: 8443,
        isSecure: true,
        oshPathRoot: "/sensorhub/",
        bucketsEndpoint: "/files/",
    };

    it("uses the standard HTTPS OpenStreetMap tile service by default", () => {
        expect(OSM_TILE_URL).to.equal("https://tile.openstreetmap.org/{z}/{x}/{y}.png");
        expect(OSM_TILE_URL).not.to.include("{s}");
    });

    it("builds site diagram URLs from the node bucket endpoint", () => {
        expect(buildSiteDiagramUrl("sitemap/site plan.png", node))
            .to.equal("https://oscar.example:8443/sensorhub/files/sitemap/site plan.png");
        expect(buildSiteDiagramUrl("files\\sitemap\\site-plan.png", node))
            .to.equal("https://oscar.example:8443/sensorhub/files/sitemap/site-plan.png");
    });

    it("preserves absolute site diagram URLs", () => {
        const absoluteUrl = "https://cdn.example/site-map.png";
        expect(buildSiteDiagramUrl(absoluteUrl, node)).to.equal(absoluteUrl);
    });

    it("converts semantic latitude and longitude to Leaflet bounds", () => {
        expect(toLeafletSiteDiagramBounds({
            lowerLeftBound: {lat: 35.9, lon: -84.4},
            upperRightBound: {lat: 36.1, lon: -84.1},
        })).to.deep.equal([
            [35.9, -84.4],
            [36.1, -84.1],
        ]);
    });

    it("rejects invalid or inverted site diagram bounds", () => {
        expect(toLeafletSiteDiagramBounds({
            lowerLeftBound: {lat: 36.1, lon: -84.4},
            upperRightBound: {lat: 35.9, lon: -84.1},
        })).to.equal(null);
        expect(toLeafletSiteDiagramBounds({
            lowerLeftBound: {lat: 35.9, lon: -184.4},
            upperRightBound: {lat: 36.1, lon: -84.1},
        })).to.equal(null);
    });

    it("keeps diagrams above base tiles while leaving markers visible", () => {
        expect(SITE_DIAGRAM_PANE_Z_INDEX).to.be.greaterThan(200);
        expect(SITE_DIAGRAM_PANE_Z_INDEX).to.be.lessThan(LANE_MARKER_PANE_Z_INDEX);
    });

    it("reads the latest lane location record used by the dashboard marker", () => {
        expect(toLaneMapLocation({location: {lat: 35.8855, lon: -84.2115, alt: 12}}))
            .to.deep.equal({lat: 35.8855, lon: -84.2115, alt: 12});
        expect(toLaneMapLocation({location: {lat: 95, lon: -84.2115, alt: 12}}))
            .to.equal(null);
        expect(toLaneMapLocation({location: {lat: 35.8855, lon: undefined}}))
            .to.equal(null);
    });

    it("recognizes the canonical fixed-position output when property metadata is incomplete", () => {
        expect(isLocationDataStream({
            properties: {outputName: "sensorLocation", observedProperties: []},
        } as any)).to.equal(true);
        expect(isLocationDataStream({
            properties: {name: "Sensor Location", observedProperties: []},
        } as any)).to.equal(true);
    });

    it("uses the lane system GeoJSON point when no location observation is available", () => {
        expect(toLaneMapLocationFromSystem({
            properties: {
                geometry: {
                    type: "Point",
                    coordinates: [-84.2115, 35.8855, 12],
                },
            },
        })).to.deep.equal({lat: 35.8855, lon: -84.2115, alt: 12});
        expect(toLaneMapLocationFromSystem({
            properties: {geometry: {type: "LineString", coordinates: []}},
        })).to.equal(null);
    });

    it("fits the initial map viewport tightly to the uploaded diagram extent", () => {
        expect(SITE_DIAGRAM_FIT_OPTIONS).to.deep.equal({
            animate: false,
            padding: [0, 0],
        });
    });

    it("computes tight lane extent bounds for 4, 25, or 50 lanes and operational views", () => {
        const fourLanes = [
            {lat: 35.89, lon: -84.19},
            {lat: 35.883, lon: -84.19},
            {lat: 35.876, lon: -84.188},
            {lat: 35.87, lon: -84.186},
        ];
        expect(toLeafletLaneExtentBounds(fourLanes)).to.deep.equal([
            [35.87, -84.19],
            [35.89, -84.186],
        ]);

        const fiftyLanes = Array.from({length: 50}, (_, idx) => ({
            lat: 35.87 + (idx % 5) * 0.005,
            lon: -84.19 + Math.floor(idx / 5) * 0.006,
        }));
        expect(toLeafletLaneExtentBounds(fiftyLanes)).to.deep.equal([
            [35.87, -84.19],
            [35.89, -84.136],
        ]);

        expect(LANE_EXTENT_FIT_OPTIONS).to.deep.equal({
            animate: false,
            padding: [14, 14],
            maxZoom: 18,
        });
    });

    it("excludes unconfigured (0, 0) coordinates when valid lane locations exist", () => {
        expect(toLeafletLaneExtentBounds([
            {lat: 0, lon: 0},
            {lat: 35.87, lon: -84.19},
            {lat: 35.89, lon: -84.18},
        ])).to.deep.equal([
            [35.87, -84.19],
            [35.89, -84.18],
        ]);

        expect(resolveLaneMapLocation(
            {location: {lat: 0, lon: 0, alt: 0}},
            {lat: 35.8855, lon: -84.2115, alt: 12},
        )).to.deep.equal({lat: 35.8855, lon: -84.2115, alt: 12});
    });

    it("builds a deterministic lane extent signature unaffected by status changes", () => {
        const initial = buildLaneExtentSignature([
            {laneName: "Lane02", location: {lat: 35.883, lon: -84.19}},
            {laneName: "Lane01", location: {lat: 35.89, lon: -84.19}},
        ]);
        const reordered = buildLaneExtentSignature([
            {laneName: "Lane01", location: {lat: 35.89, lon: -84.19}},
            {laneName: "Lane02", location: {lat: 35.883, lon: -84.19}},
        ]);
        expect(initial).to.equal(reordered);
        expect(initial).to.equal("Lane01:35.890000,-84.190000|Lane02:35.883000,-84.190000");
    });
});
