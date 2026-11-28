/*
 * Copyright (c) 2026. Botts Innovative Research, Inc.
 * All Rights Reserved
 */

import { Locale } from "@/app/contexts/LanguageContext";
import type { PlatformIconKey } from "@/app/_components/common/PlatformIcons";
import {
    SandboxScenarioId,
    SandboxTrackId,
    SandboxVerificationSnapshot,
} from "@/lib/data/oscar/TrainingSandboxApi";

export interface TrainingInjectAction {
    scenario: SandboxScenarioId;
    label: string;
    labels?: Partial<Record<Locale, string>>;
    laneSlot?: 1 | 2;
}

export interface TrainingSampleFile {
    fileName: string;
    buttonLabel: string;
    buttonLabels?: Partial<Record<Locale, string>>;
}

export interface TrainingCopySnippet {
    label: string;
    labels?: Partial<Record<Locale, string>>;
    value: string;
}

export interface TrainingSpotlightTarget {
    id: string;
    selector: string;
    label: string;
    labels?: Partial<Record<Locale, string>>;
    iconKey?: PlatformIconKey;
}

export interface TrainingKeyTerm {
    term: string;
    meaning: string;
}

export interface TrainingLabLocalizedCopy {
    chipLabel: string;
    title: string;
    screenshotCaption: string;
    whyItMatters: string;
    steps: string[];
    keyTerms: TrainingKeyTerm[];
    commonPitfalls: string[];
    objectiveSummary: string;
}

export interface TrainingLabDefinition {
    id: string;
    trackId: SandboxTrackId;
    badge: string;
    chipLabel: string;
    route: string;
    pageIconKey?: PlatformIconKey;
    splitPaneAdmin?: boolean;
    videoGuideSlug: string;
    screenshotFile: string;
    screenshotCaption: string;
    title: string;
    durationEstimate: string;
    whyItMatters: string;
    steps: string[];
    keyTerms: TrainingKeyTerm[];
    commonPitfalls: string[];
    translations: Record<Locale, TrainingLabLocalizedCopy>;
    injectActions?: TrainingInjectAction[];
    sampleFiles?: TrainingSampleFile[];
    copySnippets?: TrainingCopySnippet[];
    spotlights?: TrainingSpotlightTarget[];
    spotlightSelector?: string;
    spotlightLabel?: string;
    objectiveSummary: string;
    isAutoVerified: (snap: SandboxVerificationSnapshot) => boolean;
}

export interface TrainingTrackDefinition {
    id: SandboxTrackId;
    shortLabel: Record<Locale, string>;
    title: Record<Locale, string>;
    subtitle: Record<Locale, string>;
    roleScope: Record<Locale, string>;
}

export interface TrainingCoachUiStrings {
    sandboxBadge: string;
    sandboxBannerNote: string;
    coachButtonLabel: string;
    walkthroughButtonLabel: string;
    walkthroughButtonHint: string;
    refresherBadge: string;
    refresherOrientationSummary: string;
    refresherSafeNote: string;
    practiceCardTitle: string;
    practiceIsolationBullet: string;
    practiceShutdownBullet: (ttlMinutes: number) => string;
    practiceSignInBullet: string;
    practiceRunningStatus: (durationText: string, timeText: string | null) => string;
    practiceStoppedStatus: (ttlMinutes: number) => string;
    launchPracticeBtn: (badgeLabel: string) => string;
    startingPracticeBtn: string;
    openPracticeBtn: (badgeLabel: string) => string;
    resetSandboxBtn: string;
    stopSandboxBtn: string;
    practiceBridgeHint: string;
    refresherSimulationNote: string;
    refresherAdminTabLabel: string;
    activeSandboxShutdownBanner: (durationText: string, timeText: string | null) => string;
    hideCoachLabel: string;
    quickInjectLabel: string;
    resetTrackLabel: string;
    certificateButtonLabel: string;
    traineeNamePlaceholder: string;
    watchVideoSummary: string;
    referenceImageSummary: string;
    stepsSummary: string;
    keyTermsSummary: string;
    commonPitfallsHeading: string;
    trackProgressLabel: (done: number, total: number) => string;
    overallProgressLabel: (done: number, total: number) => string;
    labBadgePrefix: string;
    nextLabLabel: (badge: string) => string;
    whyItMattersLabel: string;
    openPageLabel: string;
    openSplitAdminLabel: string;
    closeSplitAdminLabel: string;
    showMeWhereLabel: string;
    markCompleteLabel: string;
    verifiedBadgeLabel: string;
    completedBadgeLabel: string;
    pendingBadgeLabel: string;
    objectivePrefix: string;
    copiedNotice: string;
    certificateSuccessNotice: string;
    ttlRemainingLabel: (minutes: number) => string;
}

function countPagesInParsedLayout(parsed: unknown): number {
    if (!parsed) return 0;
    if (Array.isArray(parsed)) {
        return parsed.filter((item) => item && typeof item === "object").length;
    }
    if (typeof parsed === "object") {
        const obj = parsed as Record<string, unknown>;
        if (Array.isArray(obj.pages)) {
            const count = obj.pages.filter((p) => p && typeof p === "object").length;
            if (count >= 1) return count;
        }
        if (obj.profiles && typeof obj.profiles === "object") {
            for (const profilePages of Object.values(obj.profiles as Record<string, unknown>)) {
                if (Array.isArray(profilePages)) {
                    const count = profilePages.filter((p) => p && typeof p === "object").length;
                    if (count >= 1) return count;
                }
            }
        }
    }
    return 0;
}

export function hasSavedCustomDashboardLayout(): boolean {
    if (typeof window === "undefined") return false;
    try {
        const storage = window.localStorage;
        if (!storage) return false;
        for (let i = 0; i < storage.length; i += 1) {
            const key = storage.key(i);
            if (!key || !key.startsWith("oscar.pageLayouts")) continue;
            const raw = storage.getItem(key);
            if (!raw || !raw.trim()) continue;
            if (countPagesInParsedLayout(JSON.parse(raw)) >= 1) {
                return true;
            }
        }
        const persistedRoot = storage.getItem("persist:root");
        if (persistedRoot) {
            const rootObj = JSON.parse(persistedRoot) as Record<string, unknown>;
            const rawSlice = rootObj?.pageLayoutSlice;
            const sliceObj = typeof rawSlice === "string" ? JSON.parse(rawSlice) : rawSlice;
            if (countPagesInParsedLayout(sliceObj) >= 1) {
                return true;
            }
        }
    } catch {
        return false;
    }
    return false;
}

export function getLocalizedTrainingLab(
    lab: TrainingLabDefinition,
    locale: Locale,
): TrainingLabDefinition {
    const localized = lab.translations?.[locale] ?? lab.translations?.en;
    if (!localized) {
        return lab;
    }
    return {
        ...lab,
        chipLabel: localized.chipLabel,
        title: localized.title,
        screenshotCaption: localized.screenshotCaption,
        whyItMatters: localized.whyItMatters,
        steps: localized.steps,
        keyTerms: localized.keyTerms,
        commonPitfalls: localized.commonPitfalls,
        objectiveSummary: localized.objectiveSummary,
        injectActions: lab.injectActions?.map((act) => ({
            ...act,
            label: act.labels?.[locale] ?? act.label,
        })),
        sampleFiles: lab.sampleFiles?.map((sample) => ({
            ...sample,
            buttonLabel: sample.buttonLabels?.[locale] ?? sample.buttonLabel,
        })),
        copySnippets: lab.copySnippets?.map((snip) => ({
            ...snip,
            label: snip.labels?.[locale] ?? snip.label,
        })),
        spotlights: lab.spotlights?.map((sp) => ({
            ...sp,
            label: sp.labels?.[locale] ?? sp.label,
        })),
    };
}
