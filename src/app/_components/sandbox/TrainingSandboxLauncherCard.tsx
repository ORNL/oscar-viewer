"use client";

import * as React from "react";
import {
    Alert,
    Box,
    Button,
    Chip,
    LinearProgress,
    Paper,
    Stack,
    Typography,
} from "@mui/material";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import StopCircleOutlinedIcon from "@mui/icons-material/StopCircleOutlined";
import { Locale } from "@/app/contexts/LanguageContext";
import {
    fetchSandboxActiveStatus,
    fetchSandboxHostStatus,
    SandboxHostStatus,
    submitSandboxHostAction,
} from "@/lib/data/oscar/TrainingSandboxApi";

interface LauncherCopy {
    title: string;
    badge: string;
    desc: string;
    safetyNote: string;
    insideSandboxAlert: string;
    launchBtn: string;
    openSandboxBtn: string;
    resetBtn: string;
    stopBtn: string;
    copyLinuxBtn: string;
    copyWindowsBtn: string;
    bridgeNote: string;
    copiedMsg: string;
}

const LAUNCHER_COPY: Record<Locale, LauncherCopy> = {
    en: {
        title: "Hands-On Training Sandbox & Guided Academy (`oscar-sandbox`)",
        badge: "Zero Production Impact",
        desc: "Practice setting up lanes in SensorHub Admin, importing CSVs, triaging detector faults, inspecting 16-bit WCO UFF cargo radiographs, uploading .n42 spectra, and adjudicating alarms against a built-in loopback Rapiscan + RTSP micro-emulator — with 100% zero writes to production PostgreSQL, Parquet cold archives, or config.json.",
        safetyNote: "Isolation guarantee: runs in an ephemeral `:8444` Compose stack (`archive.enabled = false`) and is completely wiped (`down -v`) on stop or TTL expiry.",
        insideSandboxAlert: "Active session: You are currently inside the ephemeral Hands-On Training Sandbox. Click 'Training Coach' in the top bar to switch tracks, inject practice events, or download your 1-page PDF Completion Record.",
        launchBtn: "Launch Sandbox (:8444)",
        openSandboxBtn: "Open Training Sandbox (:8444)",
        resetBtn: "Reset Sandbox",
        stopBtn: "Stop & Flush",
        copyLinuxBtn: "Copy Linux Start Command",
        copyWindowsBtn: "Copy Windows Start Command",
        bridgeNote: "Optional 1-click browser launch for Administrators: enable the host watcher once with",
        copiedMsg: "Copied command:",
    },
    es: {
        title: "Entorno práctico de formación y academia guiada (`oscar-sandbox`)",
        badge: "Cero impacto en producción",
        desc: "Practique la configuración de carriles en SensorHub Admin, importación CSV, triaje de fallos, radiografías WCO UFF de 16 bits, espectros .n42 y adjudicación de alarmas con un microemulador local Rapiscan + RTSP — sin escribir jamás en PostgreSQL de producción, archivos Parquet ni config.json.",
        safetyNote: "Aislamiento garantizado: se ejecuta en una pila efímera `:8444` (`archive.enabled = false`) y se purga por completo (`down -v`) al detenerlo o expirar el TTL.",
        insideSandboxAlert: "Sesión activa: está dentro del entorno efímero de práctica. Pulse 'Guía de Práctica' en la barra superior para cambiar de bloque o inyectar eventos.",
        launchBtn: "Iniciar entorno (:8444)",
        openSandboxBtn: "Abrir entorno (:8444)",
        resetBtn: "Reiniciar entorno",
        stopBtn: "Detener y purgar",
        copyLinuxBtn: "Copiar comando Linux",
        copyWindowsBtn: "Copiar comando Windows",
        bridgeNote: "Inicio opcional en 1 clic desde el navegador para administradores:",
        copiedMsg: "Comando copiado:",
    },
    fr: {
        title: "Bac à sable de formation pratique et académie guidée (`oscar-sandbox`)",
        badge: "Zéro impact en production",
        desc: "Entraînez-vous à configurer des voies dans SensorHub Admin, importer un CSV, trier les défauts, inspecter des radiographies UFF 16 bits, charger des spectres .n42 et adjudiquer des alarmes sur un micro-émulateur local Rapiscan + RTSP — sans aucune écriture dans PostgreSQL de production, les archives Parquet ou config.json.",
        safetyNote: "Isolation garantie : tourne sur une pile éphémère `:8444` (`archive.enabled = false`) et est intégralement purgé (`down -v`) à l’arrêt ou à l’expiration du TTL.",
        insideSandboxAlert: "Session active : vous êtes dans le bac à sable éphémère de formation. Cliquez sur « Coach Formation » en haut pour choisir un parcours ou injecter des événements.",
        launchBtn: "Lancer le bac à sable (:8444)",
        openSandboxBtn: "Ouvrir le bac à sable (:8444)",
        resetBtn: "Réinitialiser",
        stopBtn: "Arrêter et purger",
        copyLinuxBtn: "Copier la commande Linux",
        copyWindowsBtn: "Copier la commande Windows",
        bridgeNote: "Lancement optionnel en 1 clic depuis le navigateur pour les administrateurs :",
        copiedMsg: "Commande copiée :",
    },
    el: {
        title: "Πρακτικό περιβάλλον εκπαίδευσης & καθοδηγούμενη ακαδημία (`oscar-sandbox`)",
        badge: "Μηδενική επίδραση στην παραγωγή",
        desc: "Εξασκηθείτε στη ρύθμιση λωρίδων στο SensorHub Admin, εισαγωγή CSV, διαλογή σφαλμάτων, επιθεώρηση ακτινογραφιών WCO UFF 16-bit, φάσματα .n42 και αξιολόγηση συναγερμών με τοπικό μικρο-εξομοιωτή Rapiscan + RTSP — χωρίς καμία εγγραφή στην παραγωγική PostgreSQL, στα αρχεία Parquet ή στο config.json.",
        safetyNote: "Εγγύηση απομόνωσης: εκτελείται σε προσωρινή στοίβα `:8444` (`archive.enabled = false`) και διαγράφεται πλήρως (`down -v`) κατά τον τερματισμό.",
        insideSandboxAlert: "Ενεργή συνεδρία: βρίσκεστε στο προσωρινό περιβάλλον εκπαίδευσης. Πατήστε «Οδηγός Εκπαίδευσης» στην επάνω γραμμή.",
        launchBtn: "Εκκίνηση περιβάλλοντος (:8444)",
        openSandboxBtn: "Άνοιγμα περιβάλλοντος (:8444)",
        resetBtn: "Επαναφορά",
        stopBtn: "Τερματισμός & εκκαθάριση",
        copyLinuxBtn: "Αντιγραφή εντολής Linux",
        copyWindowsBtn: "Αντιγραφή εντολής Windows",
        bridgeNote: "Προαιρετική εκκίνηση με 1 κλικ από τον φυλλομετρητή για διαχειριστές:",
        copiedMsg: "Αντιγράφηκε:",
    },
};

export default function TrainingSandboxLauncherCard({ locale }: { locale: Locale }) {
    const copy = LAUNCHER_COPY[locale] ?? LAUNCHER_COPY.en;
    const [insideSandbox, setInsideSandbox] = React.useState(false);
    const [hostStatus, setHostStatus] = React.useState<SandboxHostStatus | null>(null);
    const [busy, setBusy] = React.useState(false);
    const [notice, setNotice] = React.useState<{ severity: "success" | "info" | "error"; text: string } | null>(null);

    React.useEffect(() => {
        const controller = new AbortController();
        fetchSandboxActiveStatus(controller.signal)
            .then((active) => setInsideSandbox(Boolean(active.sandboxMode)))
            .catch(() => {});
        fetchSandboxHostStatus(controller.signal)
            .then((st) => {
                if (st) setHostStatus(st);
            })
            .catch(() => {});
        return () => controller.abort();
    }, []);

    const linuxStart = hostStatus?.linuxStartCommand ?? "sudo bash oscar.sh sandbox start --port 8444";
    const winStart = hostStatus?.windowsStartCommand ?? ".\\oscar.bat sandbox start --port 8444";
    const sandboxPort = hostStatus?.httpsPort ?? 8444;

    const sandboxUrl = React.useMemo(() => {
        if (typeof window === "undefined") return `https://localhost:${sandboxPort}`;
        return `https://${window.location.hostname}:${sandboxPort}`;
    }, [sandboxPort]);

    const handleCopyCmd = async (cmd: string) => {
        try {
            await navigator.clipboard.writeText(cmd);
            setNotice({ severity: "success", text: `${copy.copiedMsg} ${cmd}` });
        } catch {
            setNotice({ severity: "info", text: cmd });
        }
    };

    const handleHostAction = async (action: "start" | "stop" | "reset") => {
        setBusy(true);
        setNotice(null);
        try {
            const next = await submitSandboxHostAction(action, sandboxPort, hostStatus?.ttlMinutes ?? 120);
            setHostStatus(next);
            setNotice({
                severity: "success",
                text: next.activeJob?.message ?? `Submitted '${action}' to host sandbox agent.`,
            });
        } catch (err: any) {
            setNotice({
                severity: "error",
                text: err?.message ?? "Host sandbox request failed.",
            });
        } finally {
            setBusy(false);
        }
    };

    return (
        <Paper
            variant="outlined"
            sx={{ p: 2, borderColor: "#f59e0b", bgcolor: "rgba(251, 191, 36, 0.04)" }}
            data-testid="help-training-sandbox-card"
        >
            <Stack spacing={1.25}>
                <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
                    <SchoolRoundedIcon color="warning" fontSize="small" />
                    <Typography variant="subtitle2" fontWeight={700}>
                        {copy.title}
                    </Typography>
                    <Chip size="small" color="warning" label={copy.badge} sx={{ fontWeight: 700, height: 22 }} />
                </Stack>

                <Typography variant="body2" color="text.secondary">
                    {copy.desc}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                    {copy.safetyNote}
                </Typography>

                {busy && <LinearProgress color="warning" />}

                {insideSandbox ? (
                    <Alert severity="success" data-testid="help-sandbox-active-alert">
                        {copy.insideSandboxAlert}
                    </Alert>
                ) : (
                    <>
                        {hostStatus?.agentActive && (
                            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                                {!hostStatus.sandboxRunning ? (
                                    <Button
                                        size="small"
                                        variant="contained"
                                        color="warning"
                                        disabled={busy}
                                        startIcon={<PlayArrowRoundedIcon fontSize="small" />}
                                        onClick={() => handleHostAction("start")}
                                        data-testid="help-sandbox-launch-btn"
                                    >
                                        {copy.launchBtn}
                                    </Button>
                                ) : (
                                    <>
                                        <Button
                                            component="a"
                                            href={sandboxUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            size="small"
                                            variant="contained"
                                            color="success"
                                            endIcon={<OpenInNewRoundedIcon fontSize="small" />}
                                            data-testid="help-sandbox-open-btn"
                                        >
                                            {copy.openSandboxBtn}
                                        </Button>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            disabled={busy}
                                            startIcon={<RestartAltRoundedIcon fontSize="small" />}
                                            onClick={() => handleHostAction("reset")}
                                            data-testid="help-sandbox-reset-btn"
                                        >
                                            {copy.resetBtn}
                                        </Button>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            color="error"
                                            disabled={busy}
                                            startIcon={<StopCircleOutlinedIcon fontSize="small" />}
                                            onClick={() => handleHostAction("stop")}
                                            data-testid="help-sandbox-stop-btn"
                                        >
                                            {copy.stopBtn}
                                        </Button>
                                    </>
                                )}
                            </Stack>
                        )}

                        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                            <Button
                                size="small"
                                variant="outlined"
                                startIcon={<ContentCopyRoundedIcon fontSize="small" />}
                                onClick={() => handleCopyCmd(linuxStart)}
                                data-testid="help-sandbox-copy-linux-btn"
                                sx={{ textTransform: "none" }}
                            >
                                {copy.copyLinuxBtn}: <code>{linuxStart}</code>
                            </Button>
                            <Button
                                size="small"
                                variant="outlined"
                                startIcon={<ContentCopyRoundedIcon fontSize="small" />}
                                onClick={() => handleCopyCmd(winStart)}
                                data-testid="help-sandbox-copy-windows-btn"
                                sx={{ textTransform: "none" }}
                            >
                                {copy.copyWindowsBtn}: <code>{winStart}</code>
                            </Button>
                        </Stack>

                        {hostStatus && !hostStatus.agentActive && (
                            <Typography variant="caption" color="text.secondary">
                                {copy.bridgeNote} <code>{hostStatus.linuxEnableBridgeCommand}</code> /{" "}
                                <code>{hostStatus.windowsEnableBridgeCommand}</code>
                            </Typography>
                        )}
                    </>
                )}

                {notice && (
                    <Alert severity={notice.severity} onClose={() => setNotice(null)}>
                        {notice.text}
                    </Alert>
                )}
            </Stack>
        </Paper>
    );
}
