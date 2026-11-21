/*
 * Copyright (c) 2026. Botts Innovative Research, Inc.
 * All Rights Reserved
 */

import { Locale } from "@/app/contexts/LanguageContext";
import {
    SandboxScenarioId,
    SandboxTrackId,
    SandboxVerificationSnapshot,
} from "@/lib/data/oscar/TrainingSandboxApi";

export interface TrainingInjectAction {
    scenario: SandboxScenarioId;
    label: string;
    laneSlot?: 1 | 2;
}

export interface TrainingLabDefinition {
    id: string;
    trackId: SandboxTrackId;
    badge: string;
    route: string;
    splitPaneAdmin?: boolean;
    videoGuideSlug: string;
    screenshotFile: string;
    screenshotCaption: string;
    title: string;
    durationEstimate: string;
    whyItMatters: string;
    steps: string[];
    injectActions?: TrainingInjectAction[];
    sampleFiles?: { fileName: string; buttonLabel: string }[];
    copySnippets?: { label: string; value: string }[];
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
}

export interface TrainingCoachUiStrings {
    sandboxBadge: string;
    sandboxBannerNote: string;
    coachButtonLabel: string;
    hideCoachLabel: string;
    quickInjectLabel: string;
    resetTrackLabel: string;
    certificateButtonLabel: string;
    traineeNamePlaceholder: string;
    watchVideoSummary: string;
    referenceImageSummary: string;
    stepsSummary: string;
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
    ttlRemainingLabel: (minutes: number) => string;
}

export const TRAINING_COACH_UI: Record<Locale, TrainingCoachUiStrings> = {
    en: {
        sandboxBadge: "TRAINING SANDBOX",
        sandboxBannerNote: "Practice Data Only · Zero Production DB / Parquet Impact · Flushed on Exit",
        coachButtonLabel: "Training Coach",
        hideCoachLabel: "Minimize Coach",
        quickInjectLabel: "Inject Event",
        resetTrackLabel: "Re-Stage Track",
        certificateButtonLabel: "Download Completion PDF",
        traineeNamePlaceholder: "Trainee name for PDF record (optional)",
        watchVideoSummary: "Watch Bite-Sized Video Guide (1080p + Captions)",
        referenceImageSummary: "Annotated Reference Screenshot & Why It Matters",
        stepsSummary: "Hands-On Guided Steps & Practice Controls",
        whyItMattersLabel: "Operational Why:",
        openPageLabel: "Go to Lab Page",
        openSplitAdminLabel: "Open Split-Pane SensorHub Admin",
        closeSplitAdminLabel: "Return to Viewer Page",
        showMeWhereLabel: "Highlight Control on Screen",
        markCompleteLabel: "Mark Step Completed",
        verifiedBadgeLabel: "Auto-Verified",
        completedBadgeLabel: "Completed",
        pendingBadgeLabel: "In Progress",
        objectivePrefix: "Outcome Check:",
        copiedNotice: "Copied to clipboard",
        ttlRemainingLabel: (m) => `${m}m left`,
    },
    es: {
        sandboxBadge: "ENTORNO DE PRÁCTICA",
        sandboxBannerNote: "Solo datos de entrenamiento · Cero impacto en BD / Parquet real · Se borra al salir",
        coachButtonLabel: "Guía de Práctica",
        hideCoachLabel: "Minimizar guía",
        quickInjectLabel: "Inyectar evento",
        resetTrackLabel: "Reiniciar bloque",
        certificateButtonLabel: "Descargar PDF de finalización",
        traineeNamePlaceholder: "Nombre del operador para el PDF (opcional)",
        watchVideoSummary: "Ver videoguía breve (1080p + subtítulos)",
        referenceImageSummary: "Captura de referencia y relevancia operativa",
        stepsSummary: "Pasos prácticos guiados y controles",
        whyItMattersLabel: "Por qué importa:",
        openPageLabel: "Ir a la página del ejercicio",
        openSplitAdminLabel: "Abrir SensorHub Admin en vista dividida",
        closeSplitAdminLabel: "Volver a OSCAR Viewer",
        showMeWhereLabel: "Resaltar control en pantalla",
        markCompleteLabel: "Marcar ejercicio completado",
        verifiedBadgeLabel: "Verificado automáticamente",
        completedBadgeLabel: "Completado",
        pendingBadgeLabel: "En curso",
        objectivePrefix: "Verificación:",
        copiedNotice: "Copiado al portapapeles",
        ttlRemainingLabel: (m) => `${m} min restantes`,
    },
    fr: {
        sandboxBadge: "BAC À SABLE DE FORMATION",
        sandboxBannerNote: "Données d’exercice uniquement · Zéro impact BD / Parquet réel · Purgé à la fermeture",
        coachButtonLabel: "Coach Formation",
        hideCoachLabel: "Réduire le coach",
        quickInjectLabel: "Injecter un événement",
        resetTrackLabel: "Réinitialiser le parcours",
        certificateButtonLabel: "Télécharger le PDF de réussite",
        traineeNamePlaceholder: "Nom du stagiaire pour le PDF (facultatif)",
        watchVideoSummary: "Voir le guide vidéo court (1080p + sous-titres)",
        referenceImageSummary: "Capture de référence et intérêt opérationnel",
        stepsSummary: "Étapes pratiques guidées et commandes",
        whyItMattersLabel: "Pourquoi c’est essentiel :",
        openPageLabel: "Ouvrir la page de l’atelier",
        openSplitAdminLabel: "Ouvrir SensorHub Admin en vue partagée",
        closeSplitAdminLabel: "Revenir à OSCAR Viewer",
        showMeWhereLabel: "Mettre en évidence à l’écran",
        markCompleteLabel: "Marquer comme terminé",
        verifiedBadgeLabel: "Auto-vérifié",
        completedBadgeLabel: "Terminé",
        pendingBadgeLabel: "En cours",
        objectivePrefix: "Objectif vérifié :",
        copiedNotice: "Copié dans le presse-papiers",
        ttlRemainingLabel: (m) => `${m} min restantes`,
    },
    el: {
        sandboxBadge: "ΠΕΡΙΒΑΛΛΟΝ ΕΚΠΑΙΔΕΥΣΗΣ",
        sandboxBannerNote: "Μόνο δεδομένα εξάσκησης · Μηδενική επίδραση σε ΒΔ / Parquet · Διαγράφεται στην έξοδο",
        coachButtonLabel: "Οδηγός Εκπαίδευσης",
        hideCoachLabel: "Ελαχιστοποίηση οδηγού",
        quickInjectLabel: "Έγχυση συμβάντος",
        resetTrackLabel: "Επαναφορά ενότητας",
        certificateButtonLabel: "Λήψη PDF ολοκλήρωσης",
        traineeNamePlaceholder: "Ονοματεπώνυμο εκπαιδευόμενου για PDF (προαιρετικό)",
        watchVideoSummary: "Προβολή σύντομου βιντεοοδηγού (1080p + υπότιτλοι)",
        referenceImageSummary: "Εικόνα αναφοράς & επιχειρησιακή σημασία",
        stepsSummary: "Καθοδηγούμενα πρακτικά βήματα & ενέργειες",
        whyItMattersLabel: "Επιχειρησιακή σημασία:",
        openPageLabel: "Μετάβαση στη σελίδα άσκησης",
        openSplitAdminLabel: "Άνοιγμα SensorHub Admin σε διπλή προβολή",
        closeSplitAdminLabel: "Επιστροφή στο OSCAR Viewer",
        showMeWhereLabel: "Επισήμανση στοιχείου στην οθόνη",
        markCompleteLabel: "Σήμανση ως ολοκληρωμένο",
        verifiedBadgeLabel: "Αυτόματη επαλήθευση",
        completedBadgeLabel: "Ολοκληρώθηκε",
        pendingBadgeLabel: "Σε εξέλιξη",
        objectivePrefix: "Έλεγχος στόχου:",
        copiedNotice: "Αντιγράφηκε στο πρόχειρο",
        ttlRemainingLabel: (m) => `${m} λεπ. ακόμη`,
    },
};

export const TRAINING_TRACKS: readonly TrainingTrackDefinition[] = [
    {
        id: "operator",
        shortLabel: {
            en: "1 · Operator",
            es: "1 · Operador",
            fr: "1 · Opérateur",
            el: "1 · Χειριστής",
        },
        title: {
            en: "Track 1 — Gatehouse Operator",
            es: "Bloque 1 — Operador de garita",
            fr: "Parcours 1 — Opérateur de guérite",
            el: "Ενότητα 1 — Χειριστής πύλης",
        },
        subtitle: {
            en: "Pre-wires DemoLane01 online with live RTSP video, Container OCR, EML, and Cargo NII samples so you can practice real-time monitoring, fault triage, spectroscopy, and alarm adjudication.",
            es: "Preconfigura DemoLane01 en línea con vídeo RTSP, OCR de contenedores, EML y muestras NII para practicar monitoreo, fallos, espectroscopía y adjudicación.",
            fr: "Préconfigure DemoLane01 en ligne avec vidéo RTSP, OCR conteneur, EML et échantillons NII pour pratiquer la surveillance, le tri des défauts et l’adjudication.",
            el: "Προετοιμάζει τη λωρίδα DemoLane01 σε σύνδεση με ζωντανό βίντεο RTSP, OCR εμπορευματοκιβωτίων, EML και δείγματα NII για πρακτική εξάσκηση.",
        },
    },
    {
        id: "supervisor",
        shortLabel: {
            en: "2 · Supervisor",
            es: "2 · Supervisor",
            fr: "2 · Superviseur",
            el: "2 · Επόπτης",
        },
        title: {
            en: "Track 2 — Shift Supervisor & Analyst",
            es: "Bloque 2 — Supervisor de turno y analista",
            fr: "Parcours 2 — Superviseur et analyste",
            el: "Ενότητα 2 — Επόπτης βάρδιας & αναλυτής",
        },
        subtitle: {
            en: "Seeds 2 Operational View lanes (`north-gate`, `south-gate`) with multi-category SNM, Medical, NORM, and multi-pass container history for UpSet analytics and multi-format reports.",
            es: "Prepara 2 carriles con vistas operativas (`north-gate`, `south-gate`) e historial multicategoría SNM/Médico/NORM para análisis UpSet e informes multiformato.",
            fr: "Prépare 2 voies (`north-gate`, `south-gate`) avec un historique multi-catégories SNM/Médical/NORM pour l’analyse UpSet et les rapports multi-formats.",
            el: "Προετοιμάζει 2 λωρίδες (`north-gate`, `south-gate`) με ιστορικό πολλαπλών κατηγοριών SNM/Ιατρικών/NORM για γραφήματα UpSet και αναφορές.",
        },
    },
    {
        id: "administrator",
        shortLabel: {
            en: "3 · Administrator",
            es: "3 · Administrador",
            fr: "3 · Administrateur",
            el: "3 · Διαχειριστής",
        },
        title: {
            en: "Track 3 — System Administrator (Blank Slate)",
            es: "Bloque 3 — Administrador del sistema (desde cero)",
            fr: "Parcours 3 — Administrateur système (page blanche)",
            el: "Ενότητα 3 — Διαχειριστής συστήματος (από το μηδέν)",
        },
        subtitle: {
            en: "Starts with 0 configured lanes while loopback Rapiscan (`127.0.0.1:10099`) and RTSP (`127.0.0.1:8554/tutorial-cam`) run locally so you can practice SensorHub Admin lane setup, CSV import, RBAC/Passkeys, and Runtime Extensions.",
            es: "Inicia con 0 carriles mientras el emulador Rapiscan (`127.0.0.1:10099`) y RTSP (`127.0.0.1:8554/tutorial-cam`) corren localmente para practicar alta manual, CSV, Passkeys y Extensiones.",
            fr: "Démarre avec 0 voie configurée tandis que Rapiscan (`127.0.0.1:10099`) et RTSP (`127.0.0.1:8554/tutorial-cam`) tournent localement pour pratiquer la configuration Admin, l’import CSV, les Passkeys et les Extensions.",
            el: "Ξεκινά με 0 λωρίδες ενώ οι τοπικοί εξομοιωτές Rapiscan (`127.0.0.1:10099`) και RTSP (`127.0.0.1:8554/tutorial-cam`) λειτουργούν για εξάσκηση στο SensorHub Admin, CSV, Passkeys & Επεκτάσεις.",
        },
    },
];

export const TRAINING_LABS: readonly TrainingLabDefinition[] = [
    // ==================== TRACK 1: GATEHOUSE OPERATOR ====================
    {
        id: "op-1",
        trackId: "operator",
        badge: "1.1",
        route: "/health",
        videoGuideSlug: "15-status-of-health-and-site-map",
        screenshotFile: "18-viewer-dashboard.png",
        screenshotCaption: "Live Dashboard & Status of Health showing Online RPM/camera tiles and fault badges.",
        title: "Live Lane Monitoring, Status of Health & Fault Triage",
        durationEstimate: "3 min",
        whyItMatters:
            "Before trusting clean portal passes, operators must confirm both the RPM and lane camera are Online with zero active Gamma High/Low or Tamper faults.",
        steps: [
            "Open Status of Health (/health) or Dashboard (/) and confirm DemoLane01 shows Online for both the Rapiscan RPM and camera.",
            "Click 'Inject Gamma High Fault' or 'Inject Tamper Alarm' below and watch the lane health indicator immediately flag the detector fault.",
            "Click 'Clear Faults' to restore normal background (`GB` / `TC`) and click 'Inject Clean Vehicle Pass' to observe a non-alarm occupancy.",
        ],
        injectActions: [
            { scenario: "fault_gamma_high", label: "Inject Gamma High Fault" },
            { scenario: "fault_tamper", label: "Inject Tamper Alarm" },
            { scenario: "clear_faults", label: "Clear Faults" },
            { scenario: "clean_pass", label: "Inject Clean Pass" },
        ],
        spotlightSelector: '[data-testid="navbar-help-button"]',
        spotlightLabel: "Highlight Help (?) Button",
        objectiveSummary: "At least 1 lane online and 1 occupancy recorded (`onlineLaneCount >= 1 && totalOccupancies >= 1`).",
        isAutoVerified: (v) => v.onlineLaneCount >= 1 && v.totalOccupancies >= 1,
    },
    {
        id: "op-2",
        trackId: "operator",
        badge: "1.2",
        route: "/",
        videoGuideSlug: "09-dashboard-monitoring-and-quick-adjudication",
        screenshotFile: "26-dashboard-adjudication.png",
        screenshotCaption: "Dashboard quick-preview drawer with 5 retained JPEG keyframes, count profile, and disposition selector.",
        title: "Priority Alarm Queue & 5-Frame Alarm Adjudication",
        durationEstimate: "4 min",
        whyItMatters:
            "Every un-suppressed Gamma or Neutron alarm stays bold in the shared Gatehouse queue until an operator reviews the radiation profile, retained 5-JPEG frames, and records an auditable disposition code.",
        steps: [
            "Click 'Inject Gamma Alarm' below if you want a fresh localized point-source gamma spike on DemoLane01.",
            "On Dashboard (/) or Events (/event-log), click the bold alarm row to inspect its gamma count curve above the NSIGMA threshold and its retained camera snapshots.",
            "Select a Disposition Code (for example Code 9: Authorized Test, Maintenance, or Training Activity), set Secondary Inspection Status, enter operator notes, and click Submit Adjudication.",
        ],
        injectActions: [
            { scenario: "gamma_alarm", label: "Inject Gamma Alarm" },
        ],
        objectiveSummary: "Submit at least 1 human operator adjudication (`operatorAdjudicatedCount >= 1`).",
        isAutoVerified: (v) => v.operatorAdjudicatedCount >= 1,
    },
    {
        id: "op-3",
        trackId: "operator",
        badge: "1.3",
        route: "/event-log",
        videoGuideSlug: "12-event-log-filtering-and-adjudication-codes",
        screenshotFile: "27-event-list.png",
        screenshotCaption: "Events log filtering across Code 9999 (EML Non-Threat), Code 9998 (Extended Occupancy), and active Neutron alarms.",
        title: "NORM (Code 9999), Extended Occupancy (Code 9998) & Neutron Safety",
        durationEstimate: "4 min",
        whyItMatters:
            "OSCAR reduces nuisance workload by auto-releasing spatially uniform NORM cargo (`Code 9999`) and stalled gamma-only holds (`Code 9998`), while strictly refusing to auto-release any Neutron alarm.",
        steps: [
            "Click 'Inject Distributed NORM (Code 9999)' to stream a balanced 4-panel cargo profile; verify in Events (/event-log) that EML auto-adjudicates it as Code 9999: EML Non-Threat.",
            "Click 'Inject Extended Occupancy (Code 9998)' (takes ~10s in sandbox mode) to watch Fault - Extended Occupancy trigger and auto-adjudicate gamma-only exit as Code 9998.",
            "Click 'Inject Neutron Alarm' and confirm that Neutron triggers NEVER auto-release and immediately demand human secondary inspection.",
        ],
        injectActions: [
            { scenario: "norm_eml", label: "Inject Distributed NORM (Code 9999)" },
            { scenario: "extended_occupancy", label: "Inject Extended Hold (Code 9998)" },
            { scenario: "neutron_alarm", label: "Inject Neutron Alarm" },
        ],
        objectiveSummary: "Observe at least 1 automated `Code 9999` or `Code 9998` disposition (`emlCode9999Count >= 1 || extendedCode9998Count >= 1`).",
        isAutoVerified: (v) => v.emlCode9999Count >= 1 || v.extendedCode9998Count >= 1,
    },
    {
        id: "op-4",
        trackId: "operator",
        badge: "1.4",
        route: "/event-log",
        videoGuideSlug: "17-vehicle-ocr-and-adjudication",
        screenshotFile: "29-event-details-adjudication.png",
        screenshotCaption: "Event Details adjudication workflow with ISO 6346 Container OCR chip, .n42 spectrum upload, and QR export.",
        title: "Container OCR, Secondary Spectroscopy (.n42) & QR Transfer",
        durationEstimate: "5 min",
        whyItMatters:
            "Attaching the handheld RIID `.n42` spectrum and verified ISO 6346 container ID ties physical secondary inspection evidence permanently to the portal occupancy.",
        steps: [
            "Click 'Download Practice Cs-137/Co-60 (.n42)' below to save a synthetic secondary-inspection gamma spectrum to your computer.",
            "Open any alarm's Event Details page from Events (/event-log), inspect the Vehicle / Container ID field (or click an OCR suggestion chip), upload `sample-cs137-co60.n42`, select Cs-137 / Co-60, and submit.",
            "Optional: Click 'Share / Export QR' on the event (or open /alarm-transfer) — notice sandbox QR exports carry an explicit TRAINING SANDBOX — NON-OPERATIONAL watermark.",
        ],
        sampleFiles: [
            { fileName: "sample-cs137-co60.n42", buttonLabel: "Download Practice Spectrum (.n42)" },
        ],
        copySnippets: [
            { label: "Copy Container ID", value: "MSCU5285725" },
        ],
        objectiveSummary: "Record an adjudication with isotope/spectrum evidence or a normalized Vehicle/Container ID.",
        isAutoVerified: (v) => v.adjudicatedWithEvidenceCount >= 1 || v.adjudicatedWithVehicleIdCount >= 1,
    },
    {
        id: "op-5",
        trackId: "operator",
        badge: "1.5",
        route: "/event-log",
        videoGuideSlug: "27-cargo-uff-smb-and-xray-inspection",
        screenshotFile: "49-cargo-uff-16bit-xray-inspector.png",
        screenshotCaption: "16-bit WCO UFF 3.0 cargo radiograph inspector with window/level LUT controls, HEMD effective-Z material bands, and aligned RPM count strip.",
        title: "16-Bit WCO UFF Cargo X-Ray & HEMD Material Inspection",
        durationEstimate: "4 min",
        whyItMatters:
            "Correlating dual-energy cargo X-ray High-Z shielding anomalies (`Z_eff > 72`) with the RPM gamma/neutron count profile pinpoints shielded sources inside dense cargo pallets.",
        steps: [
            "In Events (/event-log), paste the sandbox UFF UUID (`31130001-5285-4725-8001-000000000001`) or container `MSCU5285725` into the search bar, OR open an Event Details page and click Browse Cargo NII Share / Upload `.uff`.",
            "Open the 16-bit X-Ray Inspector, adjust Window/Level contrast, toggle the HEMD High-Z material overlay (`Organic`, `Inorganic`, `Metallic`, `High-Z Shielding`), and inspect the forward pallet anomaly.",
            "You can also download `sample-cargo-uff3.uff` below to test direct client-side `.uff` file upload.",
        ],
        sampleFiles: [
            { fileName: "sample-cargo-uff3.uff", buttonLabel: "Download Practice Cargo Scan (.uff)" },
        ],
        copySnippets: [
            { label: "Copy UFF Scan UUID", value: "31130001-5285-4725-8001-000000000001" },
        ],
        objectiveSummary: "Sandbox Cargo NII index active with practice `.uff` packages (`cargoUffEnabled && cargoUffIndexedCount >= 1`).",
        isAutoVerified: (v) => v.cargoUffEnabled && v.cargoUffIndexedCount >= 1,
    },

    // ==================== TRACK 2: SUPERVISOR & ANALYST ====================
    {
        id: "sup-1",
        trackId: "supervisor",
        badge: "2.1",
        route: "/event-log",
        videoGuideSlug: "10-operational-views-scoping",
        screenshotFile: "35-vehicle-pass-comparison.png",
        screenshotCaption: "Scoped View workstation filter and Multi-Pass Vehicle Comparison correlating passes across North Gate and South Gate.",
        title: "Operational Views (`north-gate` / `south-gate`) & Multi-Pass Correlation",
        durationEstimate: "4 min",
        whyItMatters:
            "Shift supervisors scope gatehouse screens to specific portals (`?view=north-gate`) while correlating repeat or re-scan passes of the same container across all lanes.",
        steps: [
            "Use the top-bar Scoped View dropdown to switch between All Lanes, `north-gate` (DemoLane01), and `south-gate` (DemoLane02).",
            "Open Events (/event-log), search for container `MSCU5285725`, and open Multi-Pass Vehicle Comparison to compare the primary and confirmation passes side by side.",
            "Save a reusable filter in Saved Queries (for example, Alarms Only or Code 1 Real Alarms) for one-click shift handoff.",
        ],
        copySnippets: [
            { label: "Copy Multi-Pass Container", value: "MSCU5285725" },
        ],
        spotlightSelector: '[data-testid="navbar-scoped-view-select"]',
        spotlightLabel: "Highlight Scoped View Selector",
        objectiveSummary: "2 Operational Views active with correlated multi-pass container history (`operationalViewCount >= 2 && multiPassVehicleCount >= 1`).",
        isAutoVerified: (v) => v.operationalViewCount >= 2 && v.multiPassVehicleCount >= 1,
    },
    {
        id: "sup-2",
        trackId: "supervisor",
        badge: "2.2",
        route: "/report",
        videoGuideSlug: "16-national-statistics-and-reports",
        screenshotFile: "40-upset-category-filters-and-other-snm.png",
        screenshotCaption: "Adjudication Report UpSet co-occurrence plot with crimson SNM highlighting and multi-format PDF/CSV/JSON/XLSX export.",
        title: "UpSet SNM Co-Occurrence Analytics & 6-Type Multi-Format Reports",
        durationEstimate: "4 min",
        whyItMatters:
            "Supervisors audit alarm rates, EML suppression (`Code 9999`), and Special Nuclear Material (`SNM`) isotope intersections across PDF, CSV, JSON, and Excel workbooks.",
        steps: [
            "Open Report Generator (/report) and select Adjudication Report (`ADJUDICATION`) or RDS Site Report (`RDS_SITE`).",
            "Generate a PDF report and inspect the inline preview: verify the `TRAINING SANDBOX — NON-OPERATIONAL` header/footer watermark and the UpSet Alarm & Source-Category Co-Occurrence chart.",
            "Switch format to Excel (`.xlsx`), CSV, or JSON (or run a `VEHICLE_INCIDENT` report for `MSCU5285725`) to verify structured exports.",
        ],
        copySnippets: [
            { label: "Copy Incident Vehicle ID", value: "MSCU5285725" },
        ],
        objectiveSummary: "Generate at least 1 report in `/report` (`generatedReportCount >= 1`).",
        isAutoVerified: (v) => v.generatedReportCount >= 1,
    },
    {
        id: "sup-3",
        trackId: "supervisor",
        badge: "2.3",
        route: "/national-view",
        videoGuideSlug: "18-operator-help-and-support-bundle",
        screenshotFile: "34-viewer-help-support-bundle.png",
        screenshotCaption: "National node overview and 1-click secret-redacted Support Bundle export inside Help (?).",
        title: "National Node Summary & Secret-Redacted Support Bundles",
        durationEstimate: "3 min",
        whyItMatters:
            "When escalating field anomalies, supervisors export a single `.zip` diagnostic bundle with all passwords, tokens, cookies, and RTSP credentials automatically scrubbed.",
        steps: [
            "Open National (/national-view) to review aggregated occupancies, gamma/neutron alarms, and faults across time windows.",
            "Click the top-right Help (`?`) button, open the 'Manual & Video Guides' tab, and click 'Export Support Bundle' to download a redacted diagnostic `.zip`.",
        ],
        spotlightSelector: '[data-testid="navbar-help-button"]',
        spotlightLabel: "Highlight Help (?) Button",
        objectiveSummary: "Supervisor 2-lane node healthy (`onlineLaneCount >= 2`).",
        isAutoVerified: (v) => v.onlineLaneCount >= 2,
    },

    // ==================== TRACK 3: SYSTEM ADMINISTRATOR ====================
    {
        id: "adm-1",
        trackId: "administrator",
        badge: "3.1",
        route: "/",
        splitPaneAdmin: true,
        videoGuideSlug: "06-admin-manual-lane-and-site-diagram",
        screenshotFile: "25-lane-options-filled.png",
        screenshotCaption: "SensorHub Admin Lane System configuration with Rapiscan RPM and Custom RTSP camera options.",
        title: "Manual Lane, Rapiscan RPM & Loopback RTSP Camera Setup",
        durationEstimate: "6 min",
        whyItMatters:
            "Starting from 0 lanes in this sandbox lets administrators practice adding a Lane System in SensorHub Admin without touching production sensors or `config.json`.",
        steps: [
            "Click 'Open Split-Pane SensorHub Admin' below to open `/sensorhub/admin` right beside this Training Coach.",
            "Right-click the Systems pane -> Add Module -> Lane System (`DemoLane01`, UID `tutorial-lane-01`, Auto-Start checked). Under Lane Options, add Initial RPM Config (`Rapiscan`, Host `127.0.0.1`, Port `10099`, EML enabled) and Initial Camera Config (`Custom`, Host `127.0.0.1:8554`, Stream Path `/tutorial-cam`).",
            "Click Apply Changes and Start the module — this Coach will automatically verify as soon as your new lane comes Online!",
        ],
        copySnippets: [
            { label: "Copy RPM Host", value: "127.0.0.1" },
            { label: "Copy RPM Port", value: "10099" },
            { label: "Copy Camera Host", value: "127.0.0.1:8554" },
            { label: "Copy Stream Path", value: "/tutorial-cam" },
        ],
        objectiveSummary: "Configure and start at least 1 online Lane System (`configuredLaneCount >= 1 && onlineLaneCount >= 1`).",
        isAutoVerified: (v) => v.configuredLaneCount >= 1 && v.onlineLaneCount >= 1,
    },
    {
        id: "adm-2",
        trackId: "administrator",
        badge: "3.2",
        route: "/",
        splitPaneAdmin: true,
        videoGuideSlug: "05-admin-lane-spreadsheet-sync",
        screenshotFile: "16-csv-upload-success.png",
        screenshotCaption: "Bulk multi-lane CSV configuration import inside SensorHub Admin -> Services -> OSCAR Service.",
        title: "1-Click Bulk Lane Spreadsheet Import (`tutorial-1-lane.csv`)",
        durationEstimate: "3 min",
        whyItMatters:
            "At multi-lane ports of entry, importing a validated `config.csv` provisions RPMs, RTSP cameras, coordinates, and `OperationalViews` in seconds.",
        steps: [
            "Click 'Download 1-Lane Tutorial CSV' below to save `tutorial-1-lane.csv` (pre-targeted at loopback `127.0.0.1:10099` and `127.0.0.1:8554/tutorial-cam` with `archiveEnabled=false`).",
            "Open Split-Pane SensorHub Admin -> Services -> OSCAR Service, upload `tutorial-1-lane.csv` under Lane Configuration Spreadsheet, and click Apply.",
            "Return to OSCAR Viewer (`Return to Viewer Page`) and confirm `DemoLane01` is online and streaming live video!",
        ],
        sampleFiles: [
            { fileName: "tutorial-1-lane.csv", buttonLabel: "Download 1-Lane Tutorial CSV" },
        ],
        objectiveSummary: "At least 1 lane provisioned and started (`configuredLaneCount >= 1 && onlineLaneCount >= 1`).",
        isAutoVerified: (v) => v.configuredLaneCount >= 1 && v.onlineLaneCount >= 1,
    },
    {
        id: "adm-3",
        trackId: "administrator",
        badge: "3.3",
        route: "/users",
        videoGuideSlug: "19-viewer-users-passkeys-and-access",
        screenshotFile: "36-users-and-passkeys.png",
        screenshotCaption: "Users & Access self-service WebAuthn Passkeys, role scoping, bulk QR enrollment invites, and Federation Tokens.",
        title: "Users, RBAC View Scoping, QR Enrollment & Offline Passkeys",
        durationEstimate: "4 min",
        whyItMatters:
            "Administrators enroll operators via 1-tap QR codes or temporary passwords, scope accounts to specific `OperationalViews` (`north-gate`), and mint scoped `oscar_fed_...` tokens.",
        steps: [
            "Open Users & Access (/users) and explore creating a practice Operator account scoped to `north-gate`, or test Bulk CSV/Paste User Enrollment to preview printable QR onboarding invites.",
            "Inspect the Federation Tokens section (`oscar_fed_...`) and the Backup & Hardware Replacement readiness checklist — everything created here lives strictly in disposable sandbox memory/volumes.",
            "Click 'Mark Step Completed' below once you have explored account, Passkey, and token workflows.",
        ],
        objectiveSummary: "Review RBAC roles, QR enrollment invites, and Passkey / Federation Token controls in `/users`.",
        isAutoVerified: () => false,
    },
    {
        id: "adm-4",
        trackId: "administrator",
        badge: "3.4",
        route: "/extensions",
        videoGuideSlug: "25-pluggable-runtime-extensions-and-pmtiles",
        screenshotFile: "46-runtime-extensions-hub.png",
        screenshotCaption: "Runtime Extensions hub for air-gapped .pmtiles basemaps, custom policy packs, OCR/spectroscopy packs, and Cargo NII shares.",
        title: "Runtime Extensions (`.pmtiles` Maps, Policy Packs & Cargo NII)",
        durationEstimate: "5 min",
        whyItMatters:
            "Runtime Extensions let sites hot-swap regional `.pmtiles` basemaps, agency disposition codes (`Code 101+`), and read-only Cargo UFF shares without modifying shipped OSCAR defaults.",
        steps: [
            "Download `sample-regional-map.pmtiles` and `sample-policy-pack.json` using the buttons below.",
            "In Runtime Extensions (/extensions), upload `sample-regional-map.pmtiles` under Offline Regional Basemaps (then check `/map`), OR upload `sample-policy-pack.json` under Adjudication Policy Packs (`Code 101` & `Code 102`).",
            "Optional: Under Cargo NII (WCO UFF), test Local Directory mode using path `/var/lib/oscar/sandbox-tutorial/uff-share`, and visit `/usb-backups` to review the zero-downtime USB NVMe backup workflow.",
        ],
        sampleFiles: [
            { fileName: "sample-regional-map.pmtiles", buttonLabel: "Download Practice Map (.pmtiles)" },
            { fileName: "sample-policy-pack.json", buttonLabel: "Download Policy Pack (.json)" },
        ],
        copySnippets: [
            { label: "Copy Sandbox UFF Path", value: "/var/lib/oscar/sandbox-tutorial/uff-share" },
        ],
        objectiveSummary: "Activate an offline `.pmtiles` basemap, Policy Pack, or Cargo NII share in `/extensions`.",
        isAutoVerified: (v) => v.offlineMapActive || v.policyPackActive || v.cargoUffEnabled,
    },
];
