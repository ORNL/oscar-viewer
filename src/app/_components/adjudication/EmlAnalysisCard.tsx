"use client";

import React, {useContext, useEffect, useMemo, useState} from "react";
import {Box, Chip, Grid, Paper, Stack, Typography} from "@mui/material";
import {EventTableData} from "@/lib/data/oscar/TableHelpers";
import {DataSourceContext} from "@/app/contexts/DataSourceContext";
import AdjudicationData from "@/lib/data/oscar/adjudication/Adjudication";
import {
    EmlMetadataSummary,
    hasEmlNonThreatMarker,
    isEmlAutomatedAdjudication,
    parseAdjudicationFeedbackWithEmlMetadata,
} from "@/lib/data/oscar/adjudication/EmlMetadata";
import {isEmlAnalysisDataStream, isEmlContextualDataStream} from "@/lib/data/oscar/Utilities";
import {useLanguage} from "@/app/contexts/LanguageContext";

function formatPercent(value: unknown): string | null {
    const num = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(num)) return null;
    return `${(num * 100).toFixed(1)}%`;
}

function parseObservationTimestampMs(obs: any): number {
    const raw = obs?.resultTime ?? obs?.phenomenonTime ?? obs?.properties?.resultTime ?? obs?.properties?.phenomenonTime;
    const ms = raw ? Date.parse(String(raw)) : Number.NaN;
    return Number.isFinite(ms) ? ms : 0;
}

function pickClosestObservation(items: any[], targetMs: number): any | null {
    if (!Array.isArray(items) || items.length === 0) return null;
    let best = items[0];
    let bestDelta = Math.abs(parseObservationTimestampMs(best) - targetMs);
    for (let i = 1; i < items.length; i++) {
        const delta = Math.abs(parseObservationTimestampMs(items[i]) - targetMs);
        if (delta < bestDelta) {
            best = items[i];
            bestDelta = delta;
        }
    }
    return best;
}

export default function EmlAnalysisCard(props: {
    event: EventTableData;
    adjudications?: AdjudicationData[];
    fetchImpl?: typeof fetch;
}) {
    const {t} = useLanguage();
    const laneMapRef = useContext(DataSourceContext).laneMapRef;
    const [streamMetadata, setStreamMetadata] = useState<EmlMetadataSummary | null>(null);

    const loggedMetadata = useMemo<EmlMetadataSummary | null>(() => {
        const list = props.adjudications ?? [];
        for (const item of list) {
            const parsed = parseAdjudicationFeedbackWithEmlMetadata(item?.feedback).emlMetadata;
            if (parsed) return parsed;
        }
        return null;
    }, [props.adjudications]);

    const autoAdjudicated = useMemo(() => {
        if (hasEmlNonThreatMarker(props.event?.adjudicatedIds)) return true;
        return (props.adjudications ?? []).some(entry => isEmlAutomatedAdjudication(entry));
    }, [props.adjudications, props.event?.adjudicatedIds]);

    useEffect(() => {
        setStreamMetadata(null);
        if (!props.event?.laneId || !props.event?.startTime || !props.event?.endTime) return;

        const lane = laneMapRef.current.get(props.event.laneId);
        const restNode = lane?.parentNode;
        if (!lane || typeof restNode?.getConnectedSystemsEndpoint !== "function") return;

        const analysisStream = (lane.datastreams ?? []).find((ds: any) => isEmlAnalysisDataStream(ds));
        if (!analysisStream?.properties?.id) return;
        const contextualStream = (lane.datastreams ?? []).find((ds: any) => isEmlContextualDataStream(ds));

        const startMs = Date.parse(props.event.startTime);
        const endMs = Date.parse(props.event.endTime);
        if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) return;

        const windowStart = new Date(startMs - 2_000).toISOString();
        const windowEnd = new Date(endMs + 5_000).toISOString();
        const controller = new AbortController();
        const fetchFn = props.fetchImpl ?? fetch;

        (async () => {
            const endpoint = String(restNode.getConnectedSystemsEndpoint(false)).replace(/\/+$/, "");
            const authHeaders = typeof restNode.getBasicAuthHeader === "function"
                ? (restNode.getBasicAuthHeader() ?? {})
                : {};
            const queryStream = async (dsId: string) => {
                const url = `${endpoint}/observations?dataStream=${encodeURIComponent(dsId)}` +
                    `&resultTime=${encodeURIComponent(`${windowStart}/${windowEnd}`)}` +
                    `&format=application/om%2Bjson&limit=20`;
                const res = await fetchFn(url, {
                    method: "GET",
                    credentials: "include",
                    headers: {Accept: "application/om+json", ...authHeaders},
                    signal: controller.signal,
                });
                if (!res.ok) return [];
                const payload = await res.json();
                return Array.isArray(payload?.items) ? payload.items : [];
            };

            const [analysisItems, contextItems] = await Promise.all([
                queryStream(String(analysisStream.properties.id)),
                contextualStream?.properties?.id ? queryStream(String(contextualStream.properties.id)) : Promise.resolve([]),
            ]);
            if (controller.signal.aborted || analysisItems.length === 0) return;

            const bestAnalysis = pickClosestObservation(analysisItems, endMs);
            const analysisResult = bestAnalysis?.properties?.result ?? bestAnalysis?.result;
            if (!analysisResult || typeof analysisResult !== "object") return;

            const bestContext = pickClosestObservation(contextItems, endMs);
            const contextResult = bestContext?.properties?.result ?? bestContext?.result;

            setStreamMetadata({
                emlVersion: contextResult?.versionId ? String(contextResult.versionId) : undefined,
                modelId: contextResult?.modelId
                    ? String(contextResult.modelId)
                    : (analysisResult.overallClassifierUsed ? String(analysisResult.overallClassifierUsed) : undefined),
                primaryThreshold: typeof contextResult?.thresholds === "number" ? contextResult.thresholds : undefined,
                result: analysisResult.result ? String(analysisResult.result) : undefined,
                releaseProbability: typeof analysisResult.releaseProbability === "number"
                    ? analysisResult.releaseProbability
                    : undefined,
                investigateProbability: typeof analysisResult.investigativeProbability === "number"
                    ? analysisResult.investigativeProbability
                    : (typeof analysisResult.investigateProbability === "number"
                        ? analysisResult.investigateProbability
                        : undefined),
                ernieGammaAlert: typeof analysisResult.gammaAlert === "boolean" ? analysisResult.gammaAlert : undefined,
                ernieNeutronAlert: typeof analysisResult.neutronAlert === "boolean" ? analysisResult.neutronAlert : undefined,
                vehicleClass: typeof analysisResult.vehicleClass === "number" ? analysisResult.vehicleClass : undefined,
                vehicleLength: typeof analysisResult.vehicleLength === "number" ? analysisResult.vehicleLength : undefined,
                sourceCount: typeof analysisResult.sourceCount === "number" ? analysisResult.sourceCount : undefined,
                overallSourceType: analysisResult.overallSourceType ? String(analysisResult.overallSourceType) : undefined,
                probabilityNORM: typeof analysisResult.overallProbabilityNORM === "number"
                    ? analysisResult.overallProbabilityNORM
                    : undefined,
                probabilityNonEmitting: typeof analysisResult.overallProbabilityNonEmitting === "number"
                    ? analysisResult.overallProbabilityNonEmitting
                    : undefined,
                probabilityThreat: typeof analysisResult.overallProbabilityThreat === "number"
                    ? analysisResult.overallProbabilityThreat
                    : undefined,
                yellowLightMessage: analysisResult.yellowLightMessage ? String(analysisResult.yellowLightMessage) : undefined,
            });
        })().catch(() => {
            // Silently ignore unavailable optional EML streams.
        });

        return () => controller.abort();
    }, [laneMapRef, props.event?.endTime, props.event?.laneId, props.event?.startTime, props.fetchImpl]);

    const summary = useMemo<EmlMetadataSummary | null>(() => {
        if (!loggedMetadata && !streamMetadata && !autoAdjudicated) return null;
        return {
            ...(streamMetadata ?? {}),
            ...(loggedMetadata ?? {}),
        };
    }, [autoAdjudicated, loggedMetadata, streamMetadata]);

    if (!summary) return null;

    const decisionUpper = String(summary.result ?? (autoAdjudicated ? "RELEASE" : "")).toUpperCase();
    const isRelease = decisionUpper === "RELEASE";
    const isInvestigate = decisionUpper === "INVESTIGATE";
    const decisionLabel = isRelease
        ? t("emlDecisionRelease")
        : isInvestigate
            ? t("emlDecisionInvestigate")
            : (decisionUpper || t("emlNonThreat"));

    const releasePct = formatPercent(summary.releaseProbability);
    const investigatePct = formatPercent(summary.investigateProbability);
    const normPct = formatPercent(summary.probabilityNORM);
    const nonEmitPct = formatPercent(summary.probabilityNonEmitting);
    const threatPct = formatPercent(summary.probabilityThreat);
    const hasSourceProbs = normPct !== null && nonEmitPct !== null && threatPct !== null;

    const modelText = [
        summary.modelId,
        summary.emlVersion ? `v${String(summary.emlVersion).replace(/^v/i, "")}` : null,
    ].filter(Boolean).join(" · ");

    return (
        <Paper
            variant="outlined"
            sx={{p: 1.5, minWidth: 0}}
            data-testid="eml-analysis-card"
        >
            <Stack spacing={1.25} sx={{minWidth: 0}}>
                <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    flexWrap="wrap"
                    useFlexGap
                >
                    <Typography variant="h6" sx={{mr: 0.5}}>
                        {t("emlAnalysisTitle")}
                    </Typography>
                    <Chip
                        size="small"
                        color={isRelease ? "success" : isInvestigate ? "error" : "default"}
                        label={decisionLabel}
                        data-testid="eml-decision-chip"
                    />
                    {autoAdjudicated && (
                        <Chip
                            size="small"
                            variant="outlined"
                            color="success"
                            label={t("emlAutoAdjudicatedBadge")}
                            data-testid="eml-auto-adjudicated-chip"
                        />
                    )}
                </Stack>

                <Grid container spacing={1.5} sx={{width: "100%", m: 0}}>
                    {releasePct !== null && (
                        <Grid item xs={6} sm={4} md={3} sx={{minWidth: 0}}>
                            <Typography variant="caption" color="text.secondary" display="block">
                                {t("emlReleaseProb")}
                            </Typography>
                            <Typography variant="body2" fontWeight={600}>
                                {releasePct}
                            </Typography>
                        </Grid>
                    )}
                    {investigatePct !== null && (
                        <Grid item xs={6} sm={4} md={3} sx={{minWidth: 0}}>
                            <Typography variant="caption" color="text.secondary" display="block">
                                {t("emlInvestigateProb")}
                            </Typography>
                            <Typography variant="body2" fontWeight={600}>
                                {investigatePct}
                            </Typography>
                        </Grid>
                    )}
                    {typeof summary.primaryThreshold === "number" && Number.isFinite(summary.primaryThreshold) && (
                        <Grid item xs={6} sm={4} md={3} sx={{minWidth: 0}}>
                            <Typography variant="caption" color="text.secondary" display="block">
                                {t("emlPrimaryThreshold")}
                            </Typography>
                            <Typography variant="body2" fontWeight={600}>
                                {summary.primaryThreshold}
                            </Typography>
                        </Grid>
                    )}
                    {modelText && (
                        <Grid item xs={12} sm={6} md={3} sx={{minWidth: 0}}>
                            <Typography variant="caption" color="text.secondary" display="block">
                                {t("emlModelAndVersion")}
                            </Typography>
                            <Typography variant="body2" sx={{overflowWrap: "anywhere"}}>
                                {modelText}
                            </Typography>
                        </Grid>
                    )}
                    {(summary.overallSourceType || hasSourceProbs) && (
                        <Grid item xs={12} md={8} sx={{minWidth: 0}}>
                            <Typography variant="caption" color="text.secondary" display="block">
                                {t("emlOverallSource")}
                            </Typography>
                            <Box sx={{minWidth: 0}}>
                                {summary.overallSourceType && (
                                    <Typography component="span" variant="body2" fontWeight={600} sx={{mr: 1}}>
                                        {summary.overallSourceType}
                                    </Typography>
                                )}
                                {hasSourceProbs && (
                                    <Typography component="span" variant="body2" color="text.secondary" sx={{overflowWrap: "anywhere"}}>
                                        ({t("emlSourceProbabilities", {
                                            norm: normPct,
                                            nonEmitting: nonEmitPct,
                                            threat: threatPct,
                                        })})
                                    </Typography>
                                )}
                            </Box>
                        </Grid>
                    )}
                    {typeof summary.vehicleLength === "number" && summary.vehicleLength > 0 && (
                        <Grid item xs={12} md={4} sx={{minWidth: 0}}>
                            <Typography variant="caption" color="text.secondary" display="block">
                                {t("emlVehicleMetrics")}
                            </Typography>
                            <Typography variant="body2">
                                {t("emlVehicleProfileValue", {
                                    vehicleClass: summary.vehicleClass ?? 0,
                                    length: summary.vehicleLength.toFixed(2),
                                })}
                            </Typography>
                        </Grid>
                    )}
                </Grid>
            </Stack>
        </Paper>
    );
}
