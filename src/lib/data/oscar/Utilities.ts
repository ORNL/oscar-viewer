/*
 * Copyright (c) 2024.  Botts Innovative Research, Inc.
 * All Rights Reserved
 */

import DataStream from "osh-js/source/core/consysapi/datastream/DataStream";
import ControlStream from "osh-js/source/core/consysapi/controlstream/ControlStream";
import ConnectedSystemsApi from "osh-js/source/core/consysapi/ConnectedSystemsApi";
import {
    ADJ_DEF,
    ALARM_DEF, ASPECT_DAILY_FILE_DEF, CONFIG_DEF,
    CONNECTION_DEF, D5_RAD_STATUS_DEF, D5_RADIOMETRICS_REPORT_DEF, D5_SPECTRUM_BINS_DEF, DAILY_FILE_DEF, DOSE_DEF, DURATION_DEF, END_DEF, GAMMA_COUNT_DEF, HLS_VIDEO_DEF,
    LINEARSPEC_DEF, LOCATION_VECTOR_DEF, MOBILE_DETECTOR_SYSTEM_DEF, NATIONAL_DEF,
    NEUTRON_COUNT_DEF,
    OCCUPANCY_PILLAR_DEF, OCCUPANCY_STATUS_DEF, OCR_DEF, OGC_CONNECTION_DEF, RAPISCAN_DAILY_FILE_DEF, RASTER_IMAGE_DEF, N42_DEF, REPORT_DEF, SENSOR_LOCATION_DEF,
    SITE_DIAGRAM_DEF, SPEED_DEF, START_DEF,
    TAMPER_STATUS_DEF,
    THRESHOLD_DEF, VIDEO_FRAME_DEF, WEB_ID_DEF
} from "@/lib/data/Constants";

function getPropertyDefinitions(stream: typeof ConnectedSystemsApi, propertyName: "observedProperties" | "controlledProperties"): string[] {
    const properties = stream?.properties?.[propertyName];
    if (!Array.isArray(properties))
        return [];

    return properties
        .map((property: any) => property?.definition)
        .filter((definition: unknown): definition is string => typeof definition === "string");
}

function getObservedDefinitions(datastream: typeof DataStream): string[] {
    return getPropertyDefinitions(datastream, "observedProperties");
}

function getControlledDefinitions(controlStream: typeof ControlStream): string[] {
    return getPropertyDefinitions(controlStream, "controlledProperties");
}

function includesDefinition(definitions: string[], expected: string): boolean {
    return definitions.some((definition) => definition.includes(expected));
}

function hasDefinition(definitions: string[], expected: string): boolean {
    return definitions.some((definition) => definition === expected);
}


export function isLocationDataStream(datastream: typeof DataStream): boolean {
    const definitions = getObservedDefinitions(datastream);
    const outputName = datastream?.properties?.outputName;
    const streamName = datastream?.properties?.name;
    const normalizedNames = [outputName, streamName]
        .filter((name): name is string => typeof name === "string")
        .map((name) => name.replace(/[\s_-]/g, "").toLowerCase());

    return includesDefinition(definitions, SENSOR_LOCATION_DEF)
        || includesDefinition(definitions, LOCATION_VECTOR_DEF)
        // AbstractSensorModule's fixed-position output is guaranteed to use
        // the output name "sensorLocation". Some ConSys API responses omit
        // the nested vector definition from observedProperties, so retaining
        // this canonical-name fallback keeps fixed lane positions discoverable.
        || normalizedNames.includes("sensorlocation");
}

/**
 * GPS fix stream of a mobile detector (RS-350 backpack, Kromek D5): output name "location",
 * published at ~1 Hz. Deliberately excludes the fixed-position "sensorLocation" output, which
 * every module publishes once at startup and is therefore useless as a liveness signal.
 */
export function isMobileGpsDataStream(datastream: typeof DataStream): boolean {
    const outputName = datastream?.properties?.outputName;
    return typeof outputName === "string" && outputName.toLowerCase() === "location";
}

/** Kromek D5 1 Hz radiometric status report (live alarm-active booleans). */
export function isD5RadiometricStatusDataStream(datastream: typeof DataStream): boolean {
    const outputName = String(datastream?.properties?.outputName ?? "").toLowerCase();
    return outputName === "kromekserialradiometricstatusreport"
        || includesDefinition(getObservedDefinitions(datastream), D5_RAD_STATUS_DEF);
}

/** Kromek D5 1 Hz 4,096-channel spectrum report (KromekDetectorRadiometricsV1Report). */
export function isD5SpectrumDataStream(datastream: typeof DataStream): boolean {
    const definitions = getObservedDefinitions(datastream);
    const outputName = String(datastream?.properties?.outputName ?? "").toLowerCase();
    return outputName === "kromekdetectorradiometricsv1report"
        || includesDefinition(definitions, D5_RADIOMETRICS_REPORT_DEF)
        || includesDefinition(definitions, D5_SPECTRUM_BINS_DEF);
}

function getSystemDefinition(system: any): string {
    const candidate =
        system?.properties?.properties?.featureType
        ?? system?.properties?.featureType
        ?? system?.properties?.properties?.definition
        ?? system?.properties?.definition
        ?? system?.definition;
    return typeof candidate === "string" ? candidate.trim() : "";
}

function getSystemUidValue(system: any): string {
    const uid = system?.properties?.properties?.uid ?? system?.properties?.uid ?? system?.uid;
    return typeof uid === "string" ? uid.trim() : "";
}

function getSystemNameValue(system: any): string {
    const name = system?.properties?.properties?.name ?? system?.properties?.name ?? system?.name;
    return typeof name === "string" ? name.trim() : "";
}

function getSystemKeywords(system: any): string[] {
    const raw = system?.properties?.keywords ?? system?.properties?.properties?.keywords ?? system?.keywords;
    if (!Array.isArray(raw)) return [];
    return raw.filter((item: unknown): item is string => typeof item === "string").map((item) => item.trim());
}

export interface LaneSystemInspectionTarget {
    laneSystem?: any;
    systems?: any[];
    datastreams?: any[];
    isRS350Backpack?: boolean;
}

/**
 * Identifies whether a lane entry represents a mobile detector (RS-350 backpack, Kromek D5 walker)
 * rather than a fixed portal lane:
 * 1. Explicit MobileDetectorSystem definition ("http://sensorml.com/ont/swe/system/MobileDetectorLane")
 *    or mobile keyword always identifies a mobile detector lane.
 * 2. Otherwise, a lane with a "location" GPS datastream is treated as mobile ONLY when it has zero
 *    camera subsystems/video streams, zero portal WebRelay/threshold keywords, and zero portal
 *    gross-count/tamper streams — ensuring fixed RS-350 or D5 portals are never misclassified as walkers.
 */
export function isMobileDetectorLane(lane: LaneSystemInspectionTarget | null | undefined): boolean {
    if (!lane) return false;
    const allSystems = [lane.laneSystem, ...(lane.systems ?? [])].filter(Boolean);
    const allStreams = lane.datastreams ?? [];

    for (const sys of allSystems) {
        if (getSystemDefinition(sys) === MOBILE_DETECTOR_SYSTEM_DEF) {
            return true;
        }
        const keywords = getSystemKeywords(sys);
        if (keywords.some((kw) => kw.toLowerCase() === "oscar:mobile-detector:true")) {
            return true;
        }
    }

    const hasMobileGps = allStreams.some((ds) => isMobileGpsDataStream(ds));
    if (!hasMobileGps) {
        return false;
    }

    const hasCameraSubsystem = allSystems.some((sys) => {
        const uid = getSystemUidValue(sys).toLowerCase();
        const name = getSystemNameValue(sys).toLowerCase();
        return uid.includes(":ffmpeg:") || name.includes("camera");
    });
    if (hasCameraSubsystem) {
        return false;
    }

    const hasPortalKeywords = allSystems.some((sys) =>
        getSystemKeywords(sys).some((kw) => {
            const lower = kw.toLowerCase();
            return lower.startsWith("oscar:extended-occupancy-threshold-min:")
                || lower === "oscar:webrelay-enabled:true";
        }),
    );
    if (hasPortalKeywords) {
        return false;
    }

    const hasPortalStreams = allStreams.some(
        (ds) =>
            isVideoDataStream(ds)
            || isGammaDataStream(ds)
            || isNeutronDataStream(ds)
            || isTamperDataStream(ds),
    );
    return !hasPortalStreams;
}

/** True when a lane is backed by a Kromek D5 spectroscopic detector. */
export function isKromekD5Lane(lane: LaneSystemInspectionTarget | null | undefined): boolean {
    if (!lane) return false;
    const allSystems = [lane.laneSystem, ...(lane.systems ?? [])].filter(Boolean);
    if (allSystems.some((sys) => getSystemUidValue(sys).toLowerCase().includes("kromek:d5"))) {
        return true;
    }
    return (lane.datastreams ?? []).some(
        (ds) => isD5RadiometricStatusDataStream(ds) || isD5SpectrumDataStream(ds),
    );
}

/** True when a lane is backed by a spectroscopic detector (RS-350 or Kromek D5) without Rapiscan/Aspect gross-count streams. */
export function isSpectroscopicDetectorLane(lane: LaneSystemInspectionTarget | null | undefined): boolean {
    if (!lane) return false;
    if (lane.isRS350Backpack || isKromekD5Lane(lane)) {
        return true;
    }
    const allSystems = [lane.laneSystem, ...(lane.systems ?? [])].filter(Boolean);
    if (allSystems.some((sys) => getSystemUidValue(sys).toLowerCase().includes("rsi:rs350"))) {
        return true;
    }
    return (lane.datastreams ?? []).some((ds) => isForegroundDataStream(ds) || isBackgroundDataStream(ds));
}

export function isVideoDataStream(datastream: typeof DataStream): boolean {
    const definitions = getObservedDefinitions(datastream);
    return includesDefinition(definitions, RASTER_IMAGE_DEF)
        || includesDefinition(definitions, VIDEO_FRAME_DEF);
}

export function isGammaDataStream(datastream: typeof DataStream): boolean {
    const definitions = getObservedDefinitions(datastream);
    return hasDefinition(definitions, ALARM_DEF)
        && includesDefinition(definitions, GAMMA_COUNT_DEF);
}

export function isNeutronDataStream(datastream: typeof DataStream): boolean {
    const definitions = getObservedDefinitions(datastream);
    return hasDefinition(definitions, ALARM_DEF)
        && includesDefinition(definitions, NEUTRON_COUNT_DEF);
}

export function isTamperDataStream(datastream: typeof DataStream): boolean {
    return includesDefinition(getObservedDefinitions(datastream), TAMPER_STATUS_DEF);
}

export function isOccupancyDataStream(datastream: typeof DataStream): boolean {
    return includesDefinition(getObservedDefinitions(datastream), OCCUPANCY_PILLAR_DEF);
}

export function isOccupancyStatusDataStream(datastream: typeof DataStream): boolean {
    const definitions = getObservedDefinitions(datastream);
    const outputName = datastream?.properties?.outputName;
    return hasDefinition(definitions, OCCUPANCY_STATUS_DEF)
        || (typeof outputName === "string" && outputName.toLowerCase() === "occupancystatus");
}

export function isConnectionDataStream(datastream: typeof DataStream): boolean {
    const definitions = getObservedDefinitions(datastream);
    return hasDefinition(definitions, CONNECTION_DEF)
        || hasDefinition(definitions, OGC_CONNECTION_DEF);
}

export function isSpeedDataStream(datastream: typeof DataStream): boolean {
    return includesDefinition(getObservedDefinitions(datastream), SPEED_DEF);
}

export function isForegroundDataStream(datastream: typeof DataStream): boolean {
    const definitions = getObservedDefinitions(datastream);
    return includesDefinition(definitions, DURATION_DEF)
        && includesDefinition(definitions, LINEARSPEC_DEF)
        && includesDefinition(definitions, DOSE_DEF);
}
export function isBackgroundDataStream(datastream: typeof DataStream): boolean {
    const definitions = getObservedDefinitions(datastream);
    return includesDefinition(definitions, DURATION_DEF)
        && includesDefinition(definitions, LINEARSPEC_DEF)
        && !includesDefinition(definitions, DOSE_DEF);
}

export function isRs350DataStream(datastream: typeof DataStream): boolean {
    return isForegroundDataStream(datastream);
}
export function isThresholdDataStream(datastream: typeof DataStream): boolean {
    return includesDefinition(getObservedDefinitions(datastream), THRESHOLD_DEF);
}

export function isConfigurationDataStream(datastream: typeof DataStream): boolean {
    return includesDefinition(getObservedDefinitions(datastream), CONFIG_DEF);
}

export function isSiteDiagramPathDataStream(datastream: typeof DataStream): boolean {
    return includesDefinition(getObservedDefinitions(datastream), SITE_DIAGRAM_DEF);
}


export function isReportControlStream(controlStream: typeof ControlStream): boolean {
    return includesDefinition(getControlledDefinitions(controlStream), REPORT_DEF);
}
export function isNationalControlStream(controlStream: typeof ControlStream): boolean {
    const definitions = getControlledDefinitions(controlStream);
    return includesDefinition(definitions, START_DEF)
        && includesDefinition(definitions, END_DEF)
        // Report generation also has start/end fields. Excluding its explicit
        // discriminator keeps statistics discovery stable as optional
        // statistics parameters are added over time.
        && !includesDefinition(definitions, REPORT_DEF);
}

export function isAdjudicationControlStream(controlStream: typeof ControlStream): boolean {
    return includesDefinition(getControlledDefinitions(controlStream), ADJ_DEF);
}

export function isTamperControlStream(controlStream: typeof ControlStream): boolean {
    return includesDefinition(getControlledDefinitions(controlStream), TAMPER_STATUS_DEF);
}

export function isWebIdAnalysisDataStream(datastream: typeof DataStream): boolean {
    return includesDefinition(getObservedDefinitions(datastream), WEB_ID_DEF);
}

export function isEmlAnalysisDataStream(datastream: typeof DataStream): boolean {
    const definitions = getObservedDefinitions(datastream);
    const outputName = String(datastream?.properties?.outputName ?? "").toLowerCase();
    return outputName === "emlanalysis"
        || includesDefinition(definitions, "EMLAnalysis")
        || includesDefinition(definitions, "EMLResult");
}

export function isEmlContextualDataStream(datastream: typeof DataStream): boolean {
    const definitions = getObservedDefinitions(datastream);
    const outputName = String(datastream?.properties?.outputName ?? "").toLowerCase();
    return outputName === "emlcontextual"
        || includesDefinition(definitions, "EMLContext")
        || includesDefinition(definitions, "EMLVersionID");
}

export function isHLSVideoControlStream(controlStream: typeof ControlStream): boolean {
    return includesDefinition(getControlledDefinitions(controlStream), HLS_VIDEO_DEF);
}

export function isDailyFileDataStream(datastream: typeof DataStream): boolean {
    const definitions = getObservedDefinitions(datastream);
    return includesDefinition(definitions, DAILY_FILE_DEF)
        || includesDefinition(definitions, RAPISCAN_DAILY_FILE_DEF)
        || includesDefinition(definitions, ASPECT_DAILY_FILE_DEF);
}

export function isVehicleOcrDataStream(datastream: typeof DataStream): boolean {
    const definitions = getObservedDefinitions(datastream);
    const outputName = String(datastream?.properties?.outputName ?? "").toLowerCase();
    return outputName === "vehicleocr"
        || includesDefinition(definitions, OCR_DEF);
}

export function isAdjudicationDataStream(datastream: typeof DataStream): boolean {
    const definitions = getObservedDefinitions(datastream);
    const outputName = String(datastream?.properties?.outputName ?? "").toLowerCase();
    return outputName === "adjudication"
        || includesDefinition(definitions, ADJ_DEF);
}


export function hasDefinitionProperties(stream: typeof ConnectedSystemsApi){
    return getObservedDefinitions(stream as typeof DataStream).length > 0
        || getControlledDefinitions(stream as typeof ControlStream).length > 0;
}
