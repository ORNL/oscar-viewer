import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Grid,
    Paper,
    Snackbar,
    SnackbarCloseReason,
    Stack,
    Typography
} from "@mui/material";
import ReportTypeSelect from "@/app/_components/reportgen/ReportTypeSelector";
import {Download, OpenInNew, TableView} from "@mui/icons-material";
import React, {useContext, useEffect, useId, useRef, useState} from "react";
import TimeRangeSelect from "@/app/_components/reportgen/TimeRangeSelector";
import NationalDatePicker from "@/app/_components/national/NationalDatePicker";
import {INode} from "@/lib/data/osh/Node";
import NodeSelect from "@/app/_components/reportgen/NodeSelector";
import LaneSelect from "@/app/_components/reportgen/LaneSelector";
import {
    fetchCommandStatuses,
    generateReportCommandJSON,
    ReportOutputFormat,
    sendCommand
} from "@/lib/data/oscar/OSCARCommands";
import EventTypeSelect from "@/app/_components/reportgen/EventTypeSelector";
import {useSelector} from "react-redux";
import {RootState} from "@/lib/state/Store";
import {selectNodes} from "@/lib/state/OSHSlice";
import {isReportControlStream} from "@/lib/data/oscar/Utilities";
import ControlStream from "osh-js/source/core/consysapi/controlstream/ControlStream";
import ControlStreamFilter from "osh-js/source/core/consysapi/controlstream/ControlStreamFilter";
import Command from "osh-js/source/core/consysapi/command/Command";
import CommandFilter from "osh-js/source/core/consysapi/command/CommandFilter";
import {useLanguage} from "@/app/contexts/LanguageContext";
import {DataSourceContext} from "@/app/contexts/DataSourceContext";
import {OperationalViewSelect, ReportScopeSelect} from "@/app/_components/reportgen/ReportScopeSelector";
import {
    emptyOperationalViewCatalog,
    OperationalViewCatalog,
} from "@/lib/data/oscar/OperationalView";
import {ReportScope, resolveReportScope} from "@/lib/data/oscar/ReportScope";

const EXTRACT_FORMAT_OPTIONS: ReadonlyArray<{ value: ReportOutputFormat; label: string }> = [
    { value: "PDF", label: "PDF" },
    { value: "CSV", label: "CSV" },
    { value: "JSON", label: "JSON" },
    { value: "XLSX", label: "Excel (.xlsx)" },
];

const MAX_PREVIEW_ROWS = 100;

interface ExtractPreviewTable {
    headers: string[];
    rows: string[][];
}

function detectReportFormatFromUrl(url: string | null | undefined): ReportOutputFormat {
    if (!url) return "PDF";
    const cleanPath = url.split("?")[0].split("#")[0].toLowerCase();
    if (cleanPath.endsWith(".csv")) return "CSV";
    if (cleanPath.endsWith(".json")) return "JSON";
    if (cleanPath.endsWith(".xlsx")) return "XLSX";
    return "PDF";
}

function buildAttachmentDownloadUrl(url: string): string {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}download=1`;
}

function parseRfc4180Csv(text: string, maxRows: number): string[][] {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = "";
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (inQuotes) {
            if (ch === '"') {
                if (i + 1 < text.length && text[i + 1] === '"') {
                    currentCell += '"';
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                currentCell += ch;
            }
        } else if (ch === '"') {
            inQuotes = true;
        } else if (ch === ",") {
            currentRow.push(currentCell);
            currentCell = "";
        } else if (ch === "\r" || ch === "\n") {
            if (ch === "\r" && i + 1 < text.length && text[i + 1] === "\n") {
                i++;
            }
            currentRow.push(currentCell);
            currentCell = "";
            if (currentRow.length > 1 || currentRow[0] !== "") {
                rows.push(currentRow);
                if (rows.length >= maxRows + 1) {
                    return rows;
                }
            }
            currentRow = [];
        } else {
            currentCell += ch;
        }
    }

    if (currentCell.length > 0 || currentRow.length > 0) {
        currentRow.push(currentCell);
        if (currentRow.length > 1 || currentRow[0] !== "") {
            rows.push(currentRow);
        }
    }
    return rows.slice(0, maxRows + 1);
}

function parseCsvPreview(text: string): ExtractPreviewTable {
    const parsed = parseRfc4180Csv(text, MAX_PREVIEW_ROWS);
    if (parsed.length === 0) {
        return { headers: [], rows: [] };
    }
    const rawHeaders = parsed[0];
    const dataRows = parsed.slice(1);
    const findIdx = (name: string) => rawHeaders.findIndex((h) => h.trim().toLowerCase() === name.toLowerCase());

    const laneIdx = findIdx("Lane Name") >= 0 ? findIdx("Lane Name") : 0;
    const seqIdx = findIdx("Sequence #");
    const timeIdx = findIdx("Time (UTC)");
    const codeIdx = findIdx("Adjudication Code");
    const dispIdx = findIdx("Disposition");
    const isoIdx = findIdx("Isotopes");
    const secIdx = findIdx("Secondary Inspection");
    const occIdx = findIdx("Occupancy Obs ID");
    const summaryIdx = findIdx("Summary") >= 0 ? findIdx("Summary") : findIdx("Operator Notes");

    if (timeIdx >= 0 && dispIdx >= 0) {
        return {
            headers: ["Record", "Time (UTC)", "Disposition", "Isotopes", "Secondary", "Occupancy ID", "Summary"],
            rows: dataRows.map((r, idx) => [
                `${r[laneIdx] || "Lane"} #${(seqIdx >= 0 && r[seqIdx]) ? r[seqIdx] : idx + 1}`,
                r[timeIdx] ?? "",
                codeIdx >= 0 && r[codeIdx] ? `${r[codeIdx]}: ${r[dispIdx] ?? ""}` : (r[dispIdx] ?? ""),
                isoIdx >= 0 ? (r[isoIdx] ?? "") : "",
                secIdx >= 0 ? (r[secIdx] ?? "") : "",
                occIdx >= 0 ? (r[occIdx] ?? "") : "",
                summaryIdx >= 0 ? (r[summaryIdx] ?? "") : "",
            ]),
        };
    }

    const colLimit = Math.min(rawHeaders.length, 7);
    return {
        headers: rawHeaders.slice(0, colLimit),
        rows: dataRows.map((r) => r.slice(0, colLimit)),
    };
}

function parseJsonPreview(text: string): ExtractPreviewTable {
    const parsed = JSON.parse(text);
    const records: any[] = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.records)
            ? parsed.records
            : [];

    return {
        headers: ["Record", "Time (UTC)", "Disposition", "Isotopes", "Secondary", "Occupancy ID", "Summary"],
        rows: records.slice(0, MAX_PREVIEW_ROWS).map((rec, idx) => [
            `${rec?.laneName || rec?.laneUid || "Lane"} #${rec?.sequenceNumber ?? idx + 1}`,
            String(rec?.timeUtc ?? ""),
            rec?.adjudicationCode !== undefined
                ? `${rec.adjudicationCode}: ${rec?.dispositionLabel ?? ""}`
                : String(rec?.dispositionLabel ?? ""),
            Array.isArray(rec?.isotopes) ? rec.isotopes.join(", ") : String(rec?.isotopes ?? ""),
            String(rec?.secondaryInspectionStatus ?? ""),
            String(rec?.occupancyObsId || rec?.vehicleId || ""),
            String(rec?.summary || rec?.operatorNotes || "").replace(/\s+/g, " ").trim(),
        ]),
    };
}

export default function ReportGeneratorView() {
    const {t} = useLanguage();
    const formatIdPrefix = useId();
    const extractCaptionId = useId();
    const {activeViewKey, laneMapReady, viewError} = useContext(DataSourceContext);
    const [isGenerating, setIsGenerating] = useState(false);

    const [selectedReportType, setSelectedReportType] = useState<string | null>("");
    const [selectedReportFormat, setSelectedReportFormat] = useState<ReportOutputFormat>("PDF");
    const [selectedTimeRange, setSelectedTimeRange] = useState<string | null>("");
    const [customStartTime, setCustomStartTime] = useState<string | null>("");
    const [customEndTime, setCustomEndTime] = useState<string | null>("");
    const [selectedNode, setSelectedNode] = useState<INode | null>(null);
    const [selectedLaneUID, setSelectedLaneUID] = useState<string[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
    const [selectedScope, setSelectedScope] = useState<ReportScope>(activeViewKey ? "OPERATIONAL_VIEW" : "NODE");
    const [selectedOperationalView, setSelectedOperationalView] = useState(activeViewKey ?? "");
    const [operationalViewCatalog, setOperationalViewCatalog] = useState<OperationalViewCatalog>(emptyOperationalViewCatalog());
    const [isLoadingOperationalViews, setIsLoadingOperationalViews] = useState(false);
    const [operationalViewLoadFailed, setOperationalViewLoadFailed] = useState(false);
    const nodes = useSelector((state: RootState) => selectNodes(state));

    const [openSnack, setOpenSnack] = useState(false);
    const [snackMessage, setSnackMessage] = useState<string>();
    const [severity, setSeverity] = useState<"success" | "error">("success");
    const [generatedURL, setGeneratedURL] = useState<string | null>("");
    const [commandStatus, setCommandStatus] = useState<string | null>(null);
    const [extractPreview, setExtractPreview] = useState<ExtractPreviewTable | null>(null);

    const activeTrackerCleanupRef = useRef<(() => void) | null>(null);

    const stopActiveTracker = () => {
        if (activeTrackerCleanupRef.current) {
            activeTrackerCleanupRef.current();
            activeTrackerCleanupRef.current = null;
        }
    };

    useEffect(() => {
        return () => {
            stopActiveTracker();
        };
    }, []);

    useEffect(() => {
        let cancelled = false;
        if (!selectedNode) {
            setOperationalViewCatalog(emptyOperationalViewCatalog());
            setOperationalViewLoadFailed(false);
            return;
        }

        setIsLoadingOperationalViews(true);
        setOperationalViewLoadFailed(false);
        selectedNode.fetchOperationalViewCatalog()
            .then((catalog) => {
                if (!cancelled)
                    setOperationalViewCatalog(catalog);
            })
            .catch((error) => {
                console.error(`Unable to load operational views for ${selectedNode.name}`, error);
                if (!cancelled) {
                    setOperationalViewCatalog(emptyOperationalViewCatalog());
                    setOperationalViewLoadFailed(true);
                }
            })
            .finally(() => {
                if (!cancelled)
                    setIsLoadingOperationalViews(false);
            });

        return () => {
            cancelled = true;
        };
    }, [selectedNode]);

    useEffect(() => {
        const fmt = detectReportFormatFromUrl(generatedURL);
        if (!generatedURL || (fmt !== "CSV" && fmt !== "JSON")) {
            setExtractPreview(null);
            return;
        }

        const controller = new AbortController();
        fetch(generatedURL, {
            method: "GET",
            headers: selectedNode ? { ...selectedNode.getBasicAuthHeader() } : {},
            mode: "cors",
            credentials: "include",
            cache: "no-store",
            signal: controller.signal,
        })
            .then(async (resp) => {
                if (!resp.ok) return null;
                const text = await resp.text();
                return fmt === "JSON" ? parseJsonPreview(text) : parseCsvPreview(text);
            })
            .then((table) => {
                if (!controller.signal.aborted) {
                    setExtractPreview(table);
                }
            })
            .catch(() => {
                if (!controller.signal.aborted) {
                    setExtractPreview(null);
                }
            });

        return () => {
            controller.abort();
        };
    }, [generatedURL, selectedNode]);

    const handleGenerateReport = async () => {
        if (viewError)
            return;

        if (selectedTimeRange === "custom" && (!customStartTime || !customEndTime)) {
            setSnackMessage(t("selectCustomDates"));
            setSeverity("error");
            setOpenSnack(true);
            return;
        }

        const resolvedScope = resolveReportScope(
            selectedScope,
            selectedReportType,
            selectedOperationalView,
            selectedLaneUID,
            operationalViewCatalog,
        );
        if (resolvedScope.error) {
            if (resolvedScope.error === "view-required")
                setSnackMessage(t("selectOperationalViewForReport"));
            else if (resolvedScope.error === "empty-view")
                setSnackMessage(t("operationalViewEmpty", {view: selectedOperationalView}));
            else if (resolvedScope.error === "lanes-required")
                setSnackMessage(t("selectLaneForReport"));
            else
                setSnackMessage(t("reportScopeUnavailable"));
            setSeverity("error");
            setOpenSnack(true);
            return;
        }

        const {startTime, endTime} = getTimeRange(selectedTimeRange ?? "");
        let isStreamingStatus = false;

        try {
            if (!selectedNode) return;
            const nodeSnapshot = selectedNode;
            const effectiveLaneUIDs = resolvedScope.laneUIDs;

            stopActiveTracker();
            setGeneratedURL("");
            setExtractPreview(null);
            setIsGenerating(true);

            let streams: typeof ControlStream[] = [];
            if (nodeSnapshot.oscarServiceSystem != null) {
                const query = await nodeSnapshot.oscarServiceSystem.searchControlStreams(
                    new ControlStreamFilter({ validTime: "latest" }),
                    100
                );
                const results = await query.nextPage();
                if (results?.length > 0) {
                    streams = results;
                }
            } else {
                streams = await nodeSnapshot.fetchNodeControlStreams();
            }

            const controlStream = streams.find((stream: typeof ControlStream) => isReportControlStream(stream));
            if (!controlStream) {
                console.error("no report control streams");
                return;
            }

            const effectiveFormat: ReportOutputFormat =
                selectedReportType === "ADJUDICATION_DETAILS" ? selectedReportFormat : "PDF";

            const response = await sendCommand(
                nodeSnapshot,
                controlStream.properties.id,
                generateReportCommandJSON(
                    startTime,
                    endTime,
                    selectedReportType,
                    effectiveLaneUIDs.length > 0 ? effectiveLaneUIDs.join(",") : null,
                    selectedEvent,
                    effectiveFormat,
                )
            );

            const buildBucketReportUrl = (reportPath: string) => {
                const isTls = nodeSnapshot.isSecure ? "https://" : "http://";
                return `${isTls}${nodeSnapshot.address}:${nodeSnapshot.port}${nodeSnapshot.oshPathRoot}/buckets/${reportPath}`;
            };

            if (response.status === 200) {
                const json = await response.json();

                if (json.statusCode === "PENDING") {
                    const commandId = json["command@id"];
                    const controlStreamId = controlStream.properties.id;
                    isStreamingStatus = true;
                    setCommandStatus("PENDING");

                    let settled = false;
                    const pollAbort = new AbortController();
                    let pollIntervalId: ReturnType<typeof setInterval> | null = null;

                    const cleanupTracker = () => {
                        settled = true;
                        pollAbort.abort();
                        if (pollIntervalId !== null) {
                            clearInterval(pollIntervalId);
                            pollIntervalId = null;
                        }
                        if (typeof document !== "undefined") {
                            document.removeEventListener("visibilitychange", handleVisibilityRefresh);
                        }
                    };

                    const processStatusItems = (items: any[]) => {
                        if (settled || !Array.isArray(items)) return;
                        for (const message of items) {
                            const statusCode = message?.statusCode;
                            if (statusCode === "ACCEPTED" || statusCode === "COMPLETED") {
                                const reportPath = message?.results?.[0]?.data?.reportPath;
                                cleanupTracker();
                                activeTrackerCleanupRef.current = null;
                                if (reportPath) {
                                    setGeneratedURL(buildBucketReportUrl(reportPath));
                                }
                                setSnackMessage(t("reportCreated"));
                                setSeverity("success");
                                setOpenSnack(true);
                                setIsGenerating(false);
                                setCommandStatus(null);
                                return;
                            }
                            if (statusCode === "FAILED" || statusCode === "REJECTED" || statusCode === "CANCELED") {
                                cleanupTracker();
                                activeTrackerCleanupRef.current = null;
                                setSnackMessage(t("reportGenerationFailed"));
                                setSeverity("error");
                                setOpenSnack(true);
                                setIsGenerating(false);
                                setCommandStatus(null);
                                return;
                            }
                            if (statusCode) {
                                setCommandStatus(statusCode);
                            }
                        }
                    };

                    const pollStatusOnce = () => {
                        if (settled || !commandId) return;
                        fetchCommandStatuses(nodeSnapshot, controlStreamId, commandId, { signal: pollAbort.signal })
                            .then((items) => {
                                processStatusItems(items);
                            })
                            .catch(() => {
                                // Ignore transient network errors while WebSocket / next poll continues.
                            });
                    };

                    function handleVisibilityRefresh() {
                        if (typeof document !== "undefined" && document.visibilityState === "visible") {
                            pollStatusOnce();
                        }
                    }

                    activeTrackerCleanupRef.current = cleanupTracker;
                    pollIntervalId = setInterval(pollStatusOnce, 2500);
                    if (typeof document !== "undefined") {
                        document.addEventListener("visibilitychange", handleVisibilityRefresh);
                    }

                    const networkProperties = {
                        endpointUrl: `${nodeSnapshot.address}:${nodeSnapshot.port}${nodeSnapshot.oshPathRoot}${nodeSnapshot.csAPIEndpoint}`,
                        tls: nodeSnapshot.isSecure,
                        streamProtocol: "ws",
                        connectorOpts: nodeSnapshot.authenticationMode === "basic" ? {
                            username: nodeSnapshot.auth.username,
                            password: nodeSnapshot.auth.password
                        } : {}
                    };

                    const properties = {
                        id: commandId,
                        "controlstream@id": controlStreamId,
                        "system@id": controlStream.properties["system@id"]
                    };

                    const command = new Command(properties, networkProperties);
                    command.getSchema = async () => {
                        return controlStream.getSchema(new ControlStreamFilter({}));
                    };

                    command.streamStatus(new CommandFilter({ format: "application/json" }), (data: any) => {
                        const messages = Array.isArray(data) ? data : [data];
                        processStatusItems(messages);
                    });

                    pollStatusOnce();

                    setSnackMessage(t("reportBeingGenerated"));
                    setSeverity("success");
                    setOpenSnack(true);
                    return;
                } else if (json.statusCode === "ACCEPTED") {
                    const reportPath = json?.results?.[0]?.data?.reportPath;
                    if (reportPath) {
                        setGeneratedURL(buildBucketReportUrl(reportPath));
                    }
                    setSnackMessage(t("reportCreated"));
                    setSeverity("success");
                }
            } else {
                setSnackMessage(t("reportRequestFailed"));
                setSeverity("error");
            }
        } catch (error) {
            setSnackMessage(t("reportRequestFailed"));
            setSeverity("error");
        } finally {
            setOpenSnack(true);
            if (!isStreamingStatus) {
                setIsGenerating(false);
            }
        }
    };

    const handleLaneSelect = (value: string[]) => {
        setSelectedLaneUID(value);
    };

    const handleEventTypeSelect = (value: any) => {
        setSelectedEvent(value);
    };

    const handleNodeSelect = (value: any) => {
        const node = nodes.find((candidate: INode) => candidate.id == value);
        setSelectedNode(node ?? null);
        setSelectedScope(activeViewKey ? "OPERATIONAL_VIEW" : "NODE");
        setSelectedOperationalView(activeViewKey ?? "");
        setSelectedLaneUID([]);
    };

    const handleScopeSelect = (scope: ReportScope) => {
        setSelectedScope(scope);
        if (scope === "OPERATIONAL_VIEW" && !selectedOperationalView && activeViewKey)
            setSelectedOperationalView(activeViewKey);
    };

    const handleTimeRange = (value: string) => {
        setSelectedTimeRange(value);
    };

    const handleReportTypeSelect = (value: string) => {
        setSelectedReportType(value);
        if (value !== "ADJUDICATION_DETAILS") {
            setSelectedReportFormat("PDF");
        }
    };

    const handleCloseSnack = (event: React.SyntheticEvent | Event, reason?: SnackbarCloseReason) => {
        if (reason === "clickaway")
            return;
        setOpenSnack(false);
    };

    const resetForm = () => {
        stopActiveTracker();
        setIsGenerating(false);
        setCommandStatus(null);
        setGeneratedURL("");
        setExtractPreview(null);
        setSelectedEvent(null);
        setSelectedReportType("");
        setSelectedReportFormat("PDF");
        setSelectedTimeRange("");
        setSelectedNode(null);
        setSelectedLaneUID([]);
        setSelectedScope(activeViewKey ? "OPERATIONAL_VIEW" : "NODE");
        setSelectedOperationalView(activeViewKey ?? "");
        setOperationalViewCatalog(emptyOperationalViewCatalog());
        setOperationalViewLoadFailed(false);
        setCustomEndTime("");
        setCustomStartTime("");
    };

    const getTimeRange = (timeRange: string): { startTime: string; endTime: string } => {
        const now = new Date();
        let startTime: string;
        let endTime: string = now.toISOString();

        switch (timeRange) {
            case "last24Hrs":
                startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
                break;
            case "last7days":
                startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
                break;
            case "last30days":
                startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
                break;
            case "thisMonth":
                startTime = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
                break;
            case "custom":
                startTime = customStartTime ?? now.toISOString();
                endTime = customEndTime ?? now.toISOString();
                break;
            default:
                startTime = now.toISOString();
        }
        return {startTime, endTime};
    };

    const handleCustomStartTime = (value: string) => {
        setCustomStartTime(value);
    };
    const handleCustomEndTime = (value: string) => {
        setCustomEndTime(value);
    };

    const generatedFormat = detectReportFormatFromUrl(generatedURL);
    const downloadURL = generatedURL ? buildAttachmentDownloadUrl(generatedURL) : "";

    const extractLabelCssVars = (extractPreview?.headers ?? []).reduce<Record<string, string>>((acc, header, idx) => {
        acc[`--label-${idx + 1}`] = JSON.stringify(header);
        return acc;
    }, {});

    return (
        <Box>
            <Grid container spacing={4}>
                <Grid item xs={12} md={5}>
                    <Typography variant="h5" align="center" gutterBottom sx={{ textWrap: "balance" }}>
                        {t("generateAReport")}
                    </Typography>

                    <Stack spacing={3}>
                        <NodeSelect onSelect={handleNodeSelect} node={selectedNode?.id} />

                        {selectedNode && (
                            <>
                                <ReportScopeSelect scope={selectedScope} onSelect={handleScopeSelect}/>

                                {selectedScope === "OPERATIONAL_VIEW" && (
                                    <OperationalViewSelect
                                        catalog={operationalViewCatalog}
                                        value={selectedOperationalView}
                                        loading={isLoadingOperationalViews}
                                        onSelect={setSelectedOperationalView}
                                    />
                                )}

                                {selectedScope === "LANES" && (
                                    <LaneSelect
                                        onSelect={handleLaneSelect}
                                        lane={selectedLaneUID}
                                        selectedNode={selectedNode}
                                        laneOptions={operationalViewCatalog.lanes}
                                    />
                                )}

                                {isLoadingOperationalViews && (
                                    <Typography variant="body2" color="text.secondary">
                                        {t("loadingOperationalViews")}
                                    </Typography>
                                )}

                                {operationalViewLoadFailed && (
                                    <Alert severity="error">{t("operationalViewLoadFailed")}</Alert>
                                )}

                                <ReportTypeSelect onSelect={handleReportTypeSelect} report={selectedReportType} />

                                {selectedReportType === "ADJUDICATION_DETAILS" && (
                                    <Box
                                        component="fieldset"
                                        sx={{
                                            border: "1px solid",
                                            borderColor: "divider",
                                            borderRadius: 2,
                                            px: 1.5,
                                            py: 1,
                                            m: 0,
                                        }}
                                    >
                                        <Box
                                            component="legend"
                                            sx={{
                                                px: 0.75,
                                                fontSize: "0.875rem",
                                                fontWeight: 600,
                                                color: "text.secondary",
                                            }}
                                        >
                                            {t("reportFormat")}
                                        </Box>
                                        <Box
                                            sx={{
                                                display: "grid",
                                                gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                                                gap: 1,
                                            }}
                                        >
                                            {EXTRACT_FORMAT_OPTIONS.map((option) => {
                                                const inputId = `${formatIdPrefix}-${option.value.toLowerCase()}`;
                                                const checked = selectedReportFormat === option.value;
                                                return (
                                                    <Box
                                                        key={option.value}
                                                        component="label"
                                                        htmlFor={inputId}
                                                        sx={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: 1,
                                                            px: 1.25,
                                                            py: 0.75,
                                                            minBlockSize: "48px",
                                                            "@media (pointer: coarse)": {
                                                                minBlockSize: "52px",
                                                            },
                                                            fontSize: "1rem",
                                                            borderRadius: 1.5,
                                                            border: "1px solid",
                                                            borderColor: checked ? "primary.main" : "divider",
                                                            bgcolor: checked ? "action.selected" : "transparent",
                                                            cursor: "pointer",
                                                            userSelect: "none",
                                                            "&:focus-within": {
                                                                outline: "3px solid",
                                                                outlineColor: "primary.main",
                                                                outlineOffset: "2px",
                                                            },
                                                        }}
                                                    >
                                                        <Box
                                                            component="input"
                                                            type="radio"
                                                            id={inputId}
                                                            name="reportFormat"
                                                            value={option.value}
                                                            checked={checked}
                                                            onChange={() => setSelectedReportFormat(option.value)}
                                                            sx={{
                                                                accentColor: "primary.main",
                                                                inlineSize: "1.125rem",
                                                                blockSize: "1.125rem",
                                                                m: 0,
                                                                cursor: "pointer",
                                                                "&:focus-visible": {
                                                                    outline: "none",
                                                                },
                                                            }}
                                                        />
                                                        <span>{option.label}</span>
                                                    </Box>
                                                );
                                            })}
                                        </Box>
                                    </Box>
                                )}

                                {selectedReportType == "EVENT" && (
                                    <EventTypeSelect onSelect={handleEventTypeSelect} event={selectedEvent} />
                                )}

                                <TimeRangeSelect onSelect={handleTimeRange} timeRange={selectedTimeRange} />

                                {selectedTimeRange === "custom" && (
                                    <NationalDatePicker onCustomStartChange={handleCustomStartTime} onCustomEndChange={handleCustomEndTime}/>
                                )}
                            </>
                        )}

                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                            <Button
                                variant="contained"
                                size="large"
                                fullWidth
                                startIcon={<Download/>}
                                onClick={handleGenerateReport}
                                disabled={isGenerating || isLoadingOperationalViews || !selectedReportType || !selectedTimeRange || !selectedNode || Boolean(viewError) || (Boolean(activeViewKey) && !laneMapReady)}
                                sx={{
                                    minBlockSize: "48px",
                                    "@media (pointer: coarse)": { minBlockSize: "52px" },
                                }}
                            >
                                {isGenerating ? t("generatingReport") : t("generateReport")}
                            </Button>

                            {selectedNode && (
                                <Button
                                    variant="outlined"
                                    size="large"
                                    onClick={resetForm}
                                    disabled={isGenerating}
                                    sx={{
                                        flexShrink: 0,
                                        minBlockSize: "48px",
                                        "@media (pointer: coarse)": { minBlockSize: "52px" },
                                    }}
                                >
                                    {t("reset")}
                                </Button>
                            )}
                        </Stack>

                        {commandStatus && (
                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1, mt: 1 }}>
                                <CircularProgress size={20} aria-label={t("generatingReport")} />
                                <Typography variant="body2" color="text.secondary">
                                    {t("statusValue", {status: commandStatus})}
                                </Typography>
                            </Box>
                        )}
                    </Stack>
                </Grid>

                <Grid item xs={12} md={7}>
                    <Paper elevation={3} sx={{ padding: 2, height: "100%" }}>
                        <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={1}
                            alignItems={{ xs: "stretch", sm: "center" }}
                            justifyContent="space-between"
                            sx={{ mb: 1.5, minInlineSize: 0 }}
                        >
                            <Typography variant="h5" sx={{ textWrap: "balance", minInlineSize: 0 }}>
                                {t("generatedReport")}
                            </Typography>
                            {generatedURL && (
                                <Stack direction="row" spacing={1} sx={{ flexShrink: 0, flexWrap: "wrap" }}>
                                    {generatedFormat !== "XLSX" && (
                                        <Button
                                            component="a"
                                            href={generatedURL}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            variant="outlined"
                                            size="small"
                                            startIcon={<OpenInNew/>}
                                            data-testid="open-generated-report"
                                            sx={{
                                                minBlockSize: "40px",
                                                "@media (pointer: coarse)": { minBlockSize: "48px" },
                                            }}
                                        >
                                            {`${t("openReport")} (${generatedFormat})`}
                                        </Button>
                                    )}
                                    <Button
                                        component="a"
                                        href={downloadURL}
                                        download
                                        variant="contained"
                                        size="small"
                                        startIcon={<Download/>}
                                        data-testid="download-generated-report"
                                        sx={{
                                            minBlockSize: "40px",
                                            "@media (pointer: coarse)": { minBlockSize: "48px" },
                                        }}
                                    >
                                        {`${t("downloadReport")} (${generatedFormat})`}
                                    </Button>
                                </Stack>
                            )}
                        </Stack>

                        {generatedURL ? (
                            generatedFormat === "PDF" ? (
                                <Box
                                    sx={{
                                        height: { xs: "min(520px, 68dvh)", md: "800px" },
                                        border: "1px solid",
                                        borderColor: "divider",
                                        borderRadius: 2,
                                        overflow: "clip",
                                    }}
                                >
                                    <iframe
                                        title={t("generatedReport")}
                                        width="100%"
                                        height="100%"
                                        src={generatedURL}
                                        style={{ border: "none", display: "block" }}
                                    />
                                </Box>
                            ) : generatedFormat === "XLSX" ? (
                                <Box
                                    sx={{
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: 2,
                                        py: 6,
                                        px: 3,
                                        textAlign: "center",
                                        border: "1px solid",
                                        borderColor: "divider",
                                        borderRadius: 2,
                                    }}
                                >
                                    <TableView color="primary" sx={{ fontSize: 48 }} aria-hidden="true" />
                                    <Typography variant="body1">
                                        {t("excelWorkbookReady")}
                                    </Typography>
                                </Box>
                            ) : (
                                <Box
                                    tabIndex={0}
                                    role="region"
                                    aria-labelledby={extractCaptionId}
                                    sx={{
                                        overflow: "auto",
                                        maxInlineSize: "100%",
                                        maxBlockSize: "min(620px, 72dvh)",
                                        containerType: "inline-size",
                                        border: "1px solid",
                                        borderColor: "divider",
                                        borderRadius: 2,
                                        "& table": {
                                            inlineSize: "100%",
                                            borderCollapse: "separate",
                                            borderSpacing: 0,
                                            fontSize: "0.875rem",
                                        },
                                        "& caption": {
                                            textAlign: "start",
                                            fontWeight: 600,
                                            p: 1.25,
                                            borderBlockEnd: "1px solid",
                                            borderColor: "divider",
                                        },
                                        "& thead": {
                                            position: "sticky",
                                            insetBlockStart: 0,
                                            zIndex: 2,
                                            bgcolor: "background.paper",
                                        },
                                        "& th, & td": {
                                            p: 1,
                                            textAlign: "start",
                                            verticalAlign: "top",
                                            borderBlockEnd: "1px solid",
                                            borderColor: "divider",
                                        },
                                        "& thead th": {
                                            fontWeight: 700,
                                            bgcolor: "action.hover",
                                            whiteSpace: "nowrap",
                                        },
                                        "& tbody th": {
                                            position: "sticky",
                                            insetInlineStart: 0,
                                            zIndex: 1,
                                            fontWeight: 600,
                                            bgcolor: "background.paper",
                                            whiteSpace: "nowrap",
                                        },
                                        "@container (width < 600px)": {
                                            "& table, & thead, & tbody, & tr, & th, & td": {
                                                display: "block",
                                            },
                                            "& thead": {
                                                display: "none",
                                            },
                                            "& tr": {
                                                marginBlockEnd: "1rem",
                                                border: "1px solid",
                                                borderColor: "divider",
                                                borderRadius: 1,
                                            },
                                            "& tbody th": {
                                                position: "sticky",
                                                insetBlockStart: 0,
                                                zIndex: 2,
                                                bgcolor: "action.hover",
                                                whiteSpace: "normal",
                                            },
                                            "& td:nth-of-type(1)::before": {
                                                content: 'var(--label-2) ": "',
                                                fontWeight: 600,
                                            },
                                            "& td:nth-of-type(2)::before": {
                                                content: 'var(--label-3) ": "',
                                                fontWeight: 600,
                                            },
                                            "& td:nth-of-type(3)::before": {
                                                content: 'var(--label-4) ": "',
                                                fontWeight: 600,
                                            },
                                            "& td:nth-of-type(4)::before": {
                                                content: 'var(--label-5) ": "',
                                                fontWeight: 600,
                                            },
                                            "& td:nth-of-type(5)::before": {
                                                content: 'var(--label-6) ": "',
                                                fontWeight: 600,
                                            },
                                            "& td:nth-of-type(6)::before": {
                                                content: 'var(--label-7) ": "',
                                                fontWeight: 600,
                                            },
                                        },
                                    }}
                                >
                                    <table style={extractLabelCssVars as React.CSSProperties}>
                                        <caption id={extractCaptionId}>
                                            {t("extractPreviewCaption", { count: extractPreview?.rows.length ?? 0 })}
                                        </caption>
                                        {extractPreview && extractPreview.headers.length > 0 && (
                                            <thead>
                                                <tr>
                                                    {extractPreview.headers.map((header) => (
                                                        <th key={header} scope="col">{header}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                        )}
                                        <tbody>
                                            {extractPreview && extractPreview.rows.length > 0 ? (
                                                extractPreview.rows.map((row, rowIdx) => (
                                                    <tr key={`${row[0] ?? "row"}-${rowIdx}`}>
                                                        <th scope="row">{row[0] ?? ""}</th>
                                                        {row.slice(1).map((cell, cellIdx) => (
                                                            <td key={cellIdx}>{cell}</td>
                                                        ))}
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={Math.max(extractPreview?.headers.length ?? 1, 1)}>
                                                        {t("extractPreviewEmpty")}
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </Box>
                            )
                        ) : (
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    textAlign: "center",
                                }}
                            >
                                <Typography variant="body1">
                                    {t("generateReportPrompt")}
                                </Typography>
                            </Box>
                        )}
                    </Paper>
                </Grid>
            </Grid>

            <Snackbar
                open={openSnack}
                autoHideDuration={5000}
                onClose={handleCloseSnack}
                anchorOrigin={{vertical: "top", horizontal: "center"}}
            >
                <Alert severity={severity} onClose={handleCloseSnack}>
                    {snackMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
}
