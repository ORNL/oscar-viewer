"use client";

import * as React from "react";
import {
    Alert,
    Box,
    Button,
    Chip,
    Divider,
    IconButton,
    LinearProgress,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import GpsFixedRoundedIcon from "@mui/icons-material/GpsFixedRounded";
import LaunchRoundedIcon from "@mui/icons-material/LaunchRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import SplitscreenRoundedIcon from "@mui/icons-material/SplitscreenRounded";
import { useLanguage } from "@/app/contexts/LanguageContext";
import { getVideoGuideBySlug } from "@/lib/data/oscar/VideoGuidesCatalog";
import {
    buildSandboxSampleDownloadUrl,
    CompletedLabSubmission,
    downloadTrainingCertificatePdf,
    injectSandboxScenario,
    SandboxActiveStatus,
    SandboxScenarioId,
    SandboxTrackId,
    SandboxVerificationSnapshot,
    stageSandboxTrack,
} from "@/lib/data/oscar/TrainingSandboxApi";
import {
    TRAINING_COACH_UI,
    TRAINING_LABS,
    TRAINING_TRACKS,
    TrainingLabDefinition,
} from "@/lib/data/oscar/TrainingCurriculum";
import "./TrainingCoachDock.css";

const EMPTY_VERIFICATION: SandboxVerificationSnapshot = {
    configuredLaneCount: 0,
    onlineLaneCount: 0,
    lanesWithCameraCount: 0,
    lanesWithOcrCount: 0,
    operationalViewCount: 0,
    totalOccupancies: 0,
    gammaAlarmCount: 0,
    neutronAlarmCount: 0,
    emlCode9999Count: 0,
    extendedCode9998Count: 0,
    activeFaultOrTamper: false,
    operatorAdjudicatedCount: 0,
    adjudicatedWithEvidenceCount: 0,
    adjudicatedWithVehicleIdCount: 0,
    multiPassVehicleCount: 0,
    generatedReportCount: 0,
    offlineMapActive: false,
    policyPackActive: false,
    cargoUffEnabled: false,
    cargoUffIndexedCount: 0,
};

const STORAGE_KEY_MANUAL_LABS = "oscar.sandbox.manualCompletedLabs.v1";

function renderInlineCode(text: string): React.ReactNode {
    if (!text || !text.includes("`")) return text;
    const parts = text.split(/(`[^`]+`)/g);
    return parts.map((part, idx) => {
        if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
            return (
                <code key={idx} className="oscar-coach-code">
                    {part.slice(1, -1)}
                </code>
            );
        }
        return <React.Fragment key={idx}>{part}</React.Fragment>;
    });
}

export interface TrainingCoachDockProps {
    status: SandboxActiveStatus;
    onStatusUpdated: (next: SandboxActiveStatus) => void;
    onRefreshRequested: () => void;
    onNavigateRoute: (route: string) => void;
    splitAdminOpen: boolean;
    onToggleSplitAdmin: (open: boolean) => void;
    onMinimize: () => void;
}

export default function TrainingCoachDock({
    status,
    onStatusUpdated,
    onRefreshRequested,
    onNavigateRoute,
    splitAdminOpen,
    onToggleSplitAdmin,
    onMinimize,
}: TrainingCoachDockProps) {
    const { language: locale } = useLanguage();
    const ui = TRAINING_COACH_UI[locale] ?? TRAINING_COACH_UI.en;
    const verification = status.verification ?? EMPTY_VERIFICATION;

    const [selectedTrack, setSelectedTrack] = React.useState<SandboxTrackId>(
        status.activeTrack ?? "operator",
    );
    const trackLabs = React.useMemo(
        () => TRAINING_LABS.filter((lab) => lab.trackId === selectedTrack),
        [selectedTrack],
    );
    const [selectedLabId, setSelectedLabId] = React.useState<string>("op-1");
    const [manualCompletedIds, setManualCompletedIds] = React.useState<string[]>([]);
    const [busyAction, setBusyAction] = React.useState<boolean>(false);
    const [feedbackBanner, setFeedbackBanner] = React.useState<{
        severity: "success" | "info" | "error";
        text: string;
    } | null>(null);
    const [traineeName, setTraineeName] = React.useState<string>("");
    const [liveAnnouncement, setLiveAnnouncement] = React.useState<string>("");
    const previouslyVerifiedRef = React.useRef<Set<string>>(new Set());

    React.useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            const saved = window.sessionStorage.getItem(STORAGE_KEY_MANUAL_LABS);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
                    setManualCompletedIds(parsed.filter((x) => typeof x === "string"));
                }
            }
        } catch {
            // Ignore storage errors in restricted browsing modes
        }
    }, []);

    React.useEffect(() => {
        if (status.activeTrack && status.activeTrack !== selectedTrack) {
            setSelectedTrack(status.activeTrack);
        }
    }, [status.activeTrack]);

    React.useEffect(() => {
        if (!trackLabs.some((l) => l.id === selectedLabId) && trackLabs.length > 0) {
            setSelectedLabId(trackLabs[0].id);
        }
    }, [trackLabs, selectedLabId]);

    // Polite screen-reader announcement when any lab objective transitions to Auto-Verified
    React.useEffect(() => {
        for (const lab of TRAINING_LABS) {
            const nowVerified = lab.isAutoVerified(verification);
            if (nowVerified && !previouslyVerifiedRef.current.has(lab.id)) {
                previouslyVerifiedRef.current.add(lab.id);
                setLiveAnnouncement(`${ui.verifiedBadgeLabel}: ${lab.badge} ${lab.title}`);
            }
        }
    }, [verification, ui.verifiedBadgeLabel]);

    const activeLab: TrainingLabDefinition =
        trackLabs.find((l) => l.id === selectedLabId) ?? trackLabs[0] ?? TRAINING_LABS[0];
    const activeTrackDef =
        TRAINING_TRACKS.find((t) => t.id === selectedTrack) ?? TRAINING_TRACKS[0];
    const videoGuide = getVideoGuideBySlug(activeLab.videoGuideSlug);

    const isLabVerified = (lab: TrainingLabDefinition): boolean => lab.isAutoVerified(verification);
    const isLabDone = (lab: TrainingLabDefinition): boolean =>
        isLabVerified(lab) || manualCompletedIds.includes(lab.id);

    const completedInTrackCount = trackLabs.filter(isLabDone).length;

    const handleSelectTrack = async (trackId: SandboxTrackId) => {
        setSelectedTrack(trackId);
        const firstLab = TRAINING_LABS.find((l) => l.trackId === trackId);
        if (firstLab) {
            setSelectedLabId(firstLab.id);
            if (!firstLab.splitPaneAdmin && splitAdminOpen) {
                onToggleSplitAdmin(false);
            }
        }
        if (status.activeTrack !== trackId) {
            setBusyAction(true);
            setFeedbackBanner(null);
            try {
                const updated = await stageSandboxTrack(trackId);
                onStatusUpdated(updated);
                setFeedbackBanner({
                    severity: "success",
                    text: updated.stageStatusMessage ?? `Staged ${trackId} environment.`,
                });
            } catch (err: any) {
                setFeedbackBanner({
                    severity: "error",
                    text: err?.message ?? "Unable to stage training track.",
                });
            } finally {
                setBusyAction(false);
            }
        }
    };

    const handleRestageCurrentTrack = async () => {
        setBusyAction(true);
        setFeedbackBanner(null);
        try {
            const updated = await stageSandboxTrack(selectedTrack);
            onStatusUpdated(updated);
            setFeedbackBanner({
                severity: "success",
                text: updated.stageStatusMessage ?? "Track environment reset.",
            });
        } catch (err: any) {
            setFeedbackBanner({
                severity: "error",
                text: err?.message ?? "Unable to reset track.",
            });
        } finally {
            setBusyAction(false);
        }
    };

    const handleInject = async (scenario: SandboxScenarioId, laneSlot: 1 | 2 = 1) => {
        setBusyAction(true);
        setFeedbackBanner(null);
        try {
            const res = await injectSandboxScenario(scenario, laneSlot);
            setFeedbackBanner({ severity: "info", text: res.message });
            setTimeout(() => onRefreshRequested(), 1_600);
        } catch (err: any) {
            setFeedbackBanner({
                severity: "error",
                text: err?.message ?? "Practice event injection failed.",
            });
        } finally {
            setBusyAction(false);
        }
    };

    const handleToggleManualDone = (labId: string) => {
        setManualCompletedIds((prev) => {
            const next = prev.includes(labId) ? prev.filter((x) => x !== labId) : [...prev, labId];
            if (typeof window !== "undefined") {
                try {
                    window.sessionStorage.setItem(STORAGE_KEY_MANUAL_LABS, JSON.stringify(next));
                } catch {
                    // Ignore storage quota errors
                }
            }
            return next;
        });
    };

    const handleSpotlight = (selector?: string) => {
        if (!selector || typeof document === "undefined") return;
        const target = document.querySelector<HTMLElement>(selector);
        if (!target) {
            setFeedbackBanner({
                severity: "info",
                text: "Open the target page first so the highlighted control is visible on screen.",
            });
            return;
        }
        target.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
        target.setAttribute("data-oscar-coach-spotlight", "true");
        setTimeout(() => {
            target.removeAttribute("data-oscar-coach-spotlight");
        }, 3_500);
    };

    const handleCopy = async (value: string) => {
        try {
            await navigator.clipboard.writeText(value);
            setFeedbackBanner({ severity: "success", text: `${ui.copiedNotice}: ${value}` });
        } catch {
            setFeedbackBanner({ severity: "info", text: value });
        }
    };

    const handleDownloadCertificate = async () => {
        setBusyAction(true);
        setFeedbackBanner(null);
        try {
            const submissions: CompletedLabSubmission[] = TRAINING_LABS.filter(isLabDone).map((lab) => ({
                trackId: lab.trackId,
                labId: lab.badge,
                title: lab.title,
                status: isLabVerified(lab) ? "verified" : "completed",
            }));
            await downloadTrainingCertificatePdf(traineeName, submissions);
            setFeedbackBanner({
                severity: "success",
                text: "Downloaded 1-page PDF Training Completion Record.",
            });
        } catch (err: any) {
            setFeedbackBanner({
                severity: "error",
                text: err?.message ?? "Failed generating PDF completion record.",
            });
        } finally {
            setBusyAction(false);
        }
    };

    return (
        <aside
            className="oscar-training-coach-aside"
            aria-label={ui.coachButtonLabel}
            data-testid="training-coach-dock"
        >
            <div className="oscar-sr-only" role="status" aria-live="polite">
                {liveAnnouncement}
            </div>

            {/* Header */}
            <Box
                sx={{
                    px: 1.75,
                    py: 1.25,
                    bgcolor: "#0f172a",
                    color: "#f8fafc",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 1,
                    minInlineSize: 0,
                }}
            >
                <Stack direction="row" spacing={1} alignItems="center" sx={{ minInlineSize: 0 }}>
                    <SchoolRoundedIcon sx={{ color: "#fbbf24", flexShrink: 0 }} fontSize="small" />
                    <Typography variant="subtitle2" fontWeight={700} noWrap>
                        {ui.coachButtonLabel}
                    </Typography>
                    <Chip
                        size="small"
                        label={`${completedInTrackCount}/${trackLabs.length}`}
                        sx={{
                            height: 20,
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            bgcolor: "rgba(251, 191, 36, 0.2)",
                            color: "#fde68a",
                        }}
                    />
                </Stack>
                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexShrink: 0 }}>
                    <Tooltip title={ui.resetTrackLabel}>
                        <span>
                            <IconButton
                                size="small"
                                sx={{ color: "#e2e8f0" }}
                                aria-label={ui.resetTrackLabel}
                                disabled={busyAction}
                                onClick={handleRestageCurrentTrack}
                                data-testid="training-coach-restage-track"
                            >
                                <RefreshRoundedIcon fontSize="small" />
                            </IconButton>
                        </span>
                    </Tooltip>
                    <Tooltip title={ui.hideCoachLabel}>
                        <IconButton
                            size="small"
                            sx={{ color: "#e2e8f0" }}
                            aria-label={ui.hideCoachLabel}
                            onClick={onMinimize}
                            data-testid="training-coach-minimize"
                        >
                            <CloseRoundedIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Stack>
            </Box>

            {(busyAction || status.stagingInProgress) && <LinearProgress color="warning" />}

            {/* Scrollable Body (overscroll-behavior: contain; scrollbar-gutter: stable) */}
            <div className="oscar-training-coach-scroll">
                {/* Role Track Switcher */}
                <Stack direction="row" spacing={0.75} sx={{ mb: 1.25, minInlineSize: 0 }}>
                    {TRAINING_TRACKS.map((track) => {
                        const selected = track.id === selectedTrack;
                        return (
                            <Button
                                key={track.id}
                                variant={selected ? "contained" : "outlined"}
                                size="small"
                                color={selected ? "primary" : "inherit"}
                                disabled={busyAction}
                                onClick={() => handleSelectTrack(track.id)}
                                data-testid={`training-track-btn-${track.id}`}
                                sx={{
                                    flex: "1 1 0%",
                                    minInlineSize: 0,
                                    textTransform: "none",
                                    fontSize: "0.76rem",
                                    px: 0.75,
                                    py: 0.5,
                                    fontWeight: selected ? 700 : 500,
                                }}
                            >
                                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {track.shortLabel[locale] ?? track.shortLabel.en}
                                </span>
                            </Button>
                        );
                    })}
                </Stack>

                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.25, lineHeight: 1.35 }}>
                    {renderInlineCode(activeTrackDef.subtitle[locale] ?? activeTrackDef.subtitle.en)}
                </Typography>

                {/* Lab Pills within Track */}
                <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" sx={{ mb: 1.5 }}>
                    {trackLabs.map((lab) => {
                        const active = lab.id === activeLab.id;
                        const verified = isLabVerified(lab);
                        const done = isLabDone(lab);
                        return (
                            <Chip
                                key={lab.id}
                                clickable
                                size="small"
                                icon={done ? <CheckCircleRoundedIcon fontSize="small" /> : undefined}
                                label={`${lab.badge} ${lab.title.split(" ")[0].replace(/[,:;]+$/, "")}`}
                                color={active ? "primary" : verified ? "success" : done ? "info" : "default"}
                                variant={active ? "filled" : "outlined"}
                                onClick={() => {
                                    setSelectedLabId(lab.id);
                                    if (!lab.splitPaneAdmin && splitAdminOpen) {
                                        onToggleSplitAdmin(false);
                                    }
                                }}
                                data-testid={`training-lab-chip-${lab.id}`}
                                sx={{ fontWeight: active ? 700 : 500 }}
                            />
                        );
                    })}
                </Stack>

                {feedbackBanner && (
                    <Alert
                        severity={feedbackBanner.severity}
                        onClose={() => setFeedbackBanner(null)}
                        sx={{ mb: 1.25, py: 0.25, "& .MuiAlert-message": { fontSize: "0.78rem" } }}
                    >
                        {feedbackBanner.text}
                    </Alert>
                )}

                {/* Active Lab Header Card */}
                <Box
                    sx={{
                        p: 1.25,
                        mb: 1.25,
                        borderRadius: 2,
                        bgcolor: "#ffffff",
                        border: "1px solid #cbd5e1",
                        minInlineSize: 0,
                    }}
                >
                    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                        <Chip
                            size="small"
                            label={`Lab ${activeLab.badge} · ${activeLab.durationEstimate}`}
                            sx={{ fontWeight: 700, bgcolor: "#e0f2fe", color: "#0369a1", height: 22 }}
                        />
                        <Chip
                            size="small"
                            icon={isLabDone(activeLab) ? <CheckCircleRoundedIcon fontSize="small" /> : undefined}
                            label={
                                isLabVerified(activeLab)
                                    ? ui.verifiedBadgeLabel
                                    : isLabDone(activeLab)
                                        ? ui.completedBadgeLabel
                                        : ui.pendingBadgeLabel
                            }
                            color={isLabVerified(activeLab) ? "success" : isLabDone(activeLab) ? "info" : "warning"}
                            variant={isLabDone(activeLab) ? "filled" : "outlined"}
                            data-testid="training-active-lab-status"
                            sx={{ height: 22, fontWeight: 600 }}
                        />
                    </Stack>

                    <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.28, mb: 0.75 }}>
                        {renderInlineCode(activeLab.title)}
                    </Typography>

                    <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
                        {activeLab.splitPaneAdmin ? (
                            <Button
                                size="small"
                                variant={splitAdminOpen ? "outlined" : "contained"}
                                color="secondary"
                                startIcon={<SplitscreenRoundedIcon fontSize="small" />}
                                onClick={() => onToggleSplitAdmin(!splitAdminOpen)}
                                data-testid="training-toggle-split-admin"
                                sx={{ textTransform: "none" }}
                            >
                                {splitAdminOpen ? ui.closeSplitAdminLabel : ui.openSplitAdminLabel}
                            </Button>
                        ) : (
                            <Button
                                size="small"
                                variant="contained"
                                startIcon={<LaunchRoundedIcon fontSize="small" />}
                                onClick={() => {
                                    if (splitAdminOpen) onToggleSplitAdmin(false);
                                    onNavigateRoute(activeLab.route);
                                }}
                                data-testid="training-open-lab-page"
                                sx={{ textTransform: "none" }}
                            >
                                {ui.openPageLabel} ({activeLab.route})
                            </Button>
                        )}
                        {activeLab.spotlightSelector && (
                            <Button
                                size="small"
                                variant="outlined"
                                startIcon={<GpsFixedRoundedIcon fontSize="small" />}
                                onClick={() => handleSpotlight(activeLab.spotlightSelector)}
                                data-testid="training-spotlight-btn"
                                sx={{ textTransform: "none" }}
                            >
                                {activeLab.spotlightLabel ?? ui.showMeWhereLabel}
                            </Button>
                        )}
                    </Stack>
                </Box>

                {/* Non-Exclusive Accordion 1: Hands-On Steps & Practice Controls (open by default) */}
                <details className="oscar-coach-accordion" open>
                    <summary className="oscar-coach-summary">
                        <span>{ui.stepsSummary}</span>
                    </summary>
                    <div className="oscar-coach-accordion-body">
                        <Box component="ol" sx={{ m: 0, pl: 2.25, mb: 1.25 }}>
                            {activeLab.steps.map((step, idx) => (
                                <Typography
                                    key={idx}
                                    component="li"
                                    variant="body2"
                                    sx={{ fontSize: "0.82rem", mb: 0.75, lineHeight: 1.42 }}
                                >
                                    {renderInlineCode(step)}
                                </Typography>
                            ))}
                        </Box>

                        {activeLab.injectActions && activeLab.injectActions.length > 0 && (
                            <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" sx={{ mb: 1 }}>
                                {activeLab.injectActions.map((act) => (
                                    <Button
                                        key={act.scenario}
                                        size="small"
                                        variant="contained"
                                        color="warning"
                                        disabled={busyAction}
                                        startIcon={<PlayArrowRoundedIcon fontSize="small" />}
                                        onClick={() => handleInject(act.scenario, act.laneSlot ?? 1)}
                                        data-testid={`training-inject-${act.scenario}`}
                                        sx={{ textTransform: "none", fontSize: "0.76rem" }}
                                    >
                                        {act.label}
                                    </Button>
                                ))}
                            </Stack>
                        )}

                        {activeLab.sampleFiles && activeLab.sampleFiles.length > 0 && (
                            <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" sx={{ mb: 1 }}>
                                {activeLab.sampleFiles.map((sample) => (
                                    <Button
                                        key={sample.fileName}
                                        component="a"
                                        href={buildSandboxSampleDownloadUrl(sample.fileName)}
                                        download={sample.fileName}
                                        size="small"
                                        variant="outlined"
                                        startIcon={<DownloadRoundedIcon fontSize="small" />}
                                        data-testid={`training-sample-${sample.fileName}`}
                                        sx={{ textTransform: "none", fontSize: "0.76rem" }}
                                    >
                                        {sample.buttonLabel}
                                    </Button>
                                ))}
                            </Stack>
                        )}

                        {activeLab.copySnippets && activeLab.copySnippets.length > 0 && (
                            <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" sx={{ mb: 1 }}>
                                {activeLab.copySnippets.map((snip) => (
                                    <Button
                                        key={snip.label}
                                        size="small"
                                        variant="outlined"
                                        color="inherit"
                                        startIcon={<ContentCopyRoundedIcon fontSize="small" />}
                                        onClick={() => handleCopy(snip.value)}
                                        sx={{ textTransform: "none", fontSize: "0.74rem" }}
                                    >
                                        <span>{snip.label}:&nbsp;</span>
                                        <code className="oscar-coach-code">{snip.value}</code>
                                    </Button>
                                ))}
                            </Stack>
                        )}

                        <Box
                            sx={{
                                mt: 1,
                                p: 1,
                                borderRadius: 1.5,
                                bgcolor: isLabVerified(activeLab) ? "#ecfdf5" : "#f8fafc",
                                border: "1px solid",
                                borderColor: isLabVerified(activeLab) ? "#6ee7b7" : "#e2e8f0",
                            }}
                        >
                            <Typography variant="caption" sx={{ display: "block", fontWeight: 600, color: "#334155" }}>
                                {ui.objectivePrefix} {renderInlineCode(activeLab.objectiveSummary)}
                            </Typography>
                            {!isLabVerified(activeLab) && (
                                <Button
                                    size="small"
                                    variant="text"
                                    onClick={() => handleToggleManualDone(activeLab.id)}
                                    data-testid="training-manual-complete-btn"
                                    sx={{ mt: 0.5, p: 0, textTransform: "none", fontSize: "0.76rem" }}
                                >
                                    {manualCompletedIds.includes(activeLab.id) ? "✓ " : ""}
                                    {ui.markCompleteLabel}
                                </Button>
                            )}
                        </Box>
                    </div>
                </details>

                {/* Non-Exclusive Accordion 2: Bite-Sized 1080p Video Guide + Closed Captions */}
                {videoGuide && (
                    <details className="oscar-coach-accordion">
                        <summary className="oscar-coach-summary">
                            <span>
                                {ui.watchVideoSummary} · #{videoGuide.badge} ({videoGuide.durationLabel})
                            </span>
                        </summary>
                        <div className="oscar-coach-accordion-body">
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.75 }}>
                                {videoGuide.titles[locale] ?? videoGuide.titles.en}
                            </Typography>
                            <video
                                key={videoGuide.slug}
                                className="oscar-coach-video"
                                width={1920}
                                height={1080}
                                controls
                                preload="none"
                                playsInline
                                data-testid="training-coach-video"
                            >
                                <source src={videoGuide.mp4Url} type="video/mp4" />
                                <track
                                    kind="captions"
                                    srcLang="en"
                                    label="English"
                                    src={videoGuide.vttUrl}
                                    default
                                />
                            </video>
                        </div>
                    </details>
                )}

                {/* Non-Exclusive Accordion 3: Annotated 1920x1080 Reference Screenshot & Operational Why */}
                <details className="oscar-coach-accordion">
                    <summary className="oscar-coach-summary">
                        <span>{ui.referenceImageSummary}</span>
                    </summary>
                    <div className="oscar-coach-accordion-body">
                        <Typography variant="body2" sx={{ fontSize: "0.8rem", mb: 1, lineHeight: 1.4 }}>
                            <strong>{ui.whyItMattersLabel}</strong> {renderInlineCode(activeLab.whyItMatters)}
                        </Typography>
                        <img
                            className="oscar-coach-screenshot"
                            src={`/manual-screenshots/${activeLab.screenshotFile}`}
                            alt={activeLab.screenshotCaption}
                            width={1920}
                            height={1080}
                            loading="lazy"
                            decoding="async"
                            data-testid="training-coach-screenshot"
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                            {activeLab.screenshotCaption}
                        </Typography>
                    </div>
                </details>

                <Divider sx={{ my: 1.5 }} />

                {/* 1-Page PDF Training Completion Record */}
                <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: "#ffffff", border: "1px solid #cbd5e1" }}>
                    <TextField
                        size="small"
                        fullWidth
                        label={ui.traineeNamePlaceholder}
                        value={traineeName}
                        onChange={(e) => setTraineeName(e.target.value)}
                        inputProps={{ maxLength: 80, "data-testid": "training-trainee-name-input" }}
                        sx={{ mb: 1 }}
                    />
                    <Button
                        fullWidth
                        size="small"
                        variant="outlined"
                        startIcon={<DownloadRoundedIcon fontSize="small" />}
                        disabled={busyAction}
                        onClick={handleDownloadCertificate}
                        data-testid="training-download-certificate-btn"
                        sx={{ textTransform: "none", fontWeight: 600 }}
                    >
                        {ui.certificateButtonLabel}
                    </Button>
                </Box>
            </div>
        </aside>
    );
}
