"use client";

import * as React from 'react';
import {
    Alert,
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    LinearProgress,
    Paper,
    Stack,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tabs,
    Typography,
} from '@mui/material';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import { Locale, useLanguage } from '@/app/contexts/LanguageContext';
import {
    exportSupportBundle,
    SupportBundleExportResult,
    SupportBundleNode,
    SupportClientStateSummary,
} from '@/lib/data/oscar/SupportDiagnostics';

interface HelpSectionItem {
    title: string;
    summary: string;
}

interface GlossaryEntry {
    term: string;
    meaning: string;
}

interface LocalizedHelpContent {
    dialogTitle: string;
    dialogSubtitle: string;
    tabs: {
        pages: string;
        reports: string;
        glossary: string;
        links: string;
    };
    pagesIntro: string;
    pages: HelpSectionItem[];
    reportsIntro: string;
    reports: HelpSectionItem[];
    formatsTitle: string;
    formats: HelpSectionItem[];
    glossaryIntro: string;
    glossaryTermHeader: string;
    glossaryMeaningHeader: string;
    glossary: GlossaryEntry[];
    linksIntro: string;
    adminLinkLabel: string;
    adminLinkDesc: string;
    videoGuidesLinkLabel: string;
    videoGuidesLinkDesc: string;
    supportBundleTitle: string;
    supportBundleDesc: string;
    supportBundlePrivacyNote: string;
    supportBundleButtonLabel: string;
    supportBundleCombinedSuccess: (fileName: string) => string;
    supportBundleClientFallback: (fileName: string) => string;
    supportBundleUnexpectedError: string;
    closeLabel: string;
}

const HELP_CONTENT: Record<Locale, LocalizedHelpContent> = {
    en: {
        dialogTitle: 'OSCAR 3.11.0 Operator Quick Guide & Glossary',
        dialogSubtitle: 'Plain-language reference for console workflows, multi-format reports, and radiation portal terminology.',
        tabs: {
            pages: 'Console Pages',
            reports: 'Reports & Exports',
            glossary: 'Key Terms Explained',
            links: 'Manual & Video Guides',
        },
        pagesIntro: 'Use the left navigation drawer to switch between OSCAR operator views:',
        pages: [
            {
                title: 'Dashboard (`/`)',
                summary: 'Real-time lane status grid, site map, live alarm feed, Customize Dashboard layout control, and quick adjudication preview drawer. Unread Dashboard alarms appear in bold with an indicator dot and are shared per lane across workstations; use the ephemeral Unread only toggle (in the banner or toolbar) or quick time-window presets (`15m`, `1h`, `24h`, `15d`) to focus the active queue, click an alarm row, Acknowledge Selected, or Acknowledge All (scoped to the active Operational View, time window, and filters) to mark read, and optionally enable Unread alarm banner (with full watermark-scoped counts and `100+` cap) or Latching alarm audio in Settings.',
            },
            {
                title: 'Events (`/event-log`)',
                summary: 'Searchable historical log of all occupancies, alarms, and faults. Filter by Event UUID, lane, time window, Adjudication Code (`Code 9998: Extended Occupancy Gamma Alarm`, `Code 9999: EML Non-Threat`, built-in `1–11`, and custom codes), or nested AND/OR rules, or select multiple alarms for bulk adjudication.',
            },
            {
                title: 'Status of Health (`/health`)',
                summary: 'Live connection state (Online, Offline, Waiting) for every RPM and camera, plus Gamma High/Low, Neutron High, Tamper, and Extended Occupancy (`Fault - Extended Occupancy` + `Code 9998` gamma-only auto-adjudication) fault indicators.',
            },
            {
                title: 'Map (`/map`)',
                summary: 'Full-screen georeferenced site diagram or tile map with live color-coded lane markers.',
            },
            {
                title: 'National (`/national-view`)',
                summary: 'Multi-node summary grid comparing occupancies, gamma/neutron alarms, and faults across local and federated OSCAR nodes.',
            },
            {
                title: 'Report Generator (`/report`)',
                summary: 'On-demand report generation across Entire Node, Operational View, or Specific Lanes in PDF, CSV, JSON, and Excel (.xlsx) formats.',
            },
            {
                title: 'Alarm Transfer (`/alarm-transfer`)',
                summary: 'Air-gapped QR code and `.oscar-alarm.json` export/import for sharing verified compact alarm summaries and count curves offline.',
            },
            {
                title: 'Nodes (`/servers`)',
                summary: 'Configure federated remote OSCAR nodes using secure session cookies or memory-only Basic credentials.',
            },
        ],
        reportsIntro: 'Every report request generates a fresh file and overwrites any earlier file with the same parameters:',
        reports: [
            {
                title: 'RDS Site Report (`RDS_SITE`)',
                summary: 'Executive site KPI summary, alarm and automated disposition rates (`Code 9998: Extended Occupancy Gamma Alarm`, `Code 9999: EML Non-Threat`, and `Operator Review Required`), fault totals, storage capacity, and per-lane summary table.',
            },
            {
                title: 'Lane Report (`LANE`)',
                summary: 'Per-lane operational KPIs, alarm and automated disposition (`9998`/`9999`) rates, fault breakdown, and daily time-series activity for the selected scope.',
            },
            {
                title: 'Event Report (`EVENT`)',
                summary: 'Daily time-series charts and tables for Alarms & Occupancies, Alarms Only, or State of Health (`Gamma High`, `Gamma Low`, `Neutron High`, `Tamper`).',
            },
            {
                title: 'Adjudication Report (`ADJUDICATION`)',
                summary: 'Starts with the summed All Selected Lanes (`ALL_LANES`) Disposition and Isotope Results tables across all selected lanes, followed by individual Disposition and Isotope Results tables for each lane.',
            },
            {
                title: 'Adjudication Details Extract (`ADJUDICATION_DETAILS`)',
                summary: 'Complete line-by-line audit table of every submitted adjudication (Submission Time, Lane, Username, Occupancy Count, Code, Feedback, Secondary Inspection, Isotopes, Vehicle ID, File Paths, Occupancy ID).',
            },
        ],
        formatsTitle: 'Supported Export Formats',
        formats: [
            {
                title: 'PDF (`.pdf`)',
                summary: 'Formatted executive document with KPI cards, charts, and styled tables rendered directly in the browser preview.',
            },
            {
                title: 'CSV (`.csv`)',
                summary: 'Universal comma-separated text with metadata headers and section tables; previews inline and opens in any spreadsheet or script.',
            },
            {
                title: 'JSON (`.json`)',
                summary: 'Structured machine-readable payload containing report metadata, sections, headers, and typed rows.',
            },
            {
                title: 'Excel (`.xlsx`)',
                summary: 'Multi-worksheet OpenXML workbook with a Metadata sheet and dedicated formatted sheets for each report section.',
            },
        ],
        glossaryIntro: 'Plain-language definitions of technical terms used across OSCAR:',
        glossaryTermHeader: 'Term / Acronym',
        glossaryMeaningHeader: 'Plain-Language Meaning',
        glossary: [
            {
                term: 'Occupancy',
                meaning: 'One complete passage of a vehicle, container, or pedestrian through a detection lane between entry (`GS`) and exit (`GX`).',
            },
            {
                term: 'CPS (Counts Per Second)',
                meaning: 'Raw radiation detector count rate measured each sampling interval during background or occupancy.',
            },
            {
                term: 'NSIGMA (N-Sigma)',
                meaning: 'Number of standard deviations (σ) that the gamma count rate rises above recent background; used to trigger gamma alarms consistently.',
            },
            {
                term: 'NORM',
                meaning: 'Naturally Occurring Radioactive Material — benign cargo containing natural isotopes (such as potassium-40 in fertilizer, kitty litter, or ceramics, or thorium/uranium in granite).',
            },
            {
                term: 'EML & Code 9999',
                meaning: 'Enhanced Machine Learning — Rapiscan algorithm comparing gamma energy windows to distinguish benign NORM cargo from threat sources. Non-threat NORM alarms are auto-adjudicated as `Code 9999: EML Non-Threat`.',
            },
            {
                term: 'Extended Occupancy (`Fault - Extended Occupancy`) & Code 9998',
                meaning: 'When a vehicle occupies a lane for at least its configured threshold (`extendedOccupancyThresholdMinutes`, default 1 min), OSCAR publishes `Fault - Extended Occupancy`. If it completes with a gamma-only alarm (no neutron alarm), OSCAR suppresses it from the live Dashboard queue and auto-adjudicates it as `Code 9998: Extended Occupancy Gamma Alarm`. Neutron alarms are never auto-adjudicated.',
            },
            {
                term: 'WebID & DRF',
                meaning: 'WebID is the Sandia Full Spectrum isotope identification service for uploaded spectra (`N42`/SPC). The DRF (Detector Response Function) specifies the detector model and geometry.',
            },
            {
                term: 'Daily File Codes (`GB`, `GS`, `GA`, `NS`, `GX`, `SG1`–`SG3`, `SN1`–`SN2`)',
                meaning: 'Raw RPM daily CSV record codes: `GB`/`NB` = gamma/neutron background, `GS` = occupancy start, `GC`/`NC` = count profile, `GA`/`NA`/`NS` = gamma/neutron alarm, `GX` = occupancy end, `TT`/`TC` = tamper fault/clear, `SG1`–`SG3`/`SN1`–`SN2` = daily gamma/neutron setup parameters (auto-synced to `config.json`).',
            },
            {
                term: 'Event UUID',
                meaning: 'Globally unique identifier assigned to each occupancy event for exact searching, QR transfer, and cross-referencing.',
            },
            {
                term: 'Operational View (`?view=<key>`)',
                meaning: 'Named workstation filter (such as `north-gate`) that scopes Dashboard, Events, Status of Health, and Reports to assigned lanes.',
            },
            {
                term: 'Retained 5-Frame Media',
                meaning: 'Five evenly spaced JPEG snapshots (`frame-01.jpg`–`frame-05.jpg`) extracted from each alarm clip. After 30 days, secondary frames are pruned while the midpoint keyframe (`frame-03.jpg`) is kept.',
            },
            {
                term: 'Parquet Cold Tier (`PARQUET_PRIMARY`)',
                meaning: 'Default storage mode where completed 30-minute PostgreSQL staging partitions are exported to ZSTD-compressed Apache Parquet files for compact long-term retention.',
            },
            {
                term: 'Container & License Plate OCR (`ocrConfig`)',
                meaning: 'Optional per-lane asynchronous background OCR (disabled by default). When enabled on a lane, OSCAR samples occupancy frames as CPU/heap resources allow, auto-fills ISO 6346 check-digit-verified container codes (or high-confidence plates) into untouched Vehicle ID fields, and displays click-to-apply suggestion chips with crop thumbnails.',
            },
        ],
        linksIntro: 'Open the full administrator manual in SensorHub Admin or watch the bite-sized how-to video guides:',
        adminLinkLabel: 'Open SensorHub Admin & In-UI Operator Manual (`/sensorhub/admin`)',
        adminLinkDesc: 'Requires administrator sign-in. Select OSCAR Service or any sensor module and open its README tab for the localized manual.',
        videoGuidesLinkLabel: 'Open OSCAR How-To Video Guides (`ORNL/oscar-video-guides`)',
        videoGuidesLinkDesc: '16 bite-sized (< 2 min) narrated/captioned screen recordings covering certificate trust, lane setup, adjudication, EML, health monitoring, and multi-format reports.',
        supportBundleTitle: 'Troubleshooting & Support Bundle (`.zip`)',
        supportBundleDesc: 'Downloads a single diagnostic `.zip` combining recent browser console/network diagnostics with OSCAR server logs, module states, and JVM/storage health. If the server cannot be reached or fails to start, run `./oscar.sh support-bundle` (Linux) or `oscar.bat support-bundle` (Windows) on the host.',
        supportBundlePrivacyNote: 'Privacy & security: collected only to diagnose technical issues; passwords, tokens, session cookies, RTSP credentials, and private keys are automatically scrubbed.',
        supportBundleButtonLabel: 'Export Support Bundle',
        supportBundleCombinedSuccess: (fileName: string) => `Downloaded ${fileName} (client + server diagnostics, secrets redacted).`,
        supportBundleClientFallback: (fileName: string) => `Server bundle unreachable; downloaded client diagnostics (${fileName}). Run ./oscar.sh support-bundle or oscar.bat support-bundle on the server for host/container logs.`,
        supportBundleUnexpectedError: 'Unable to export the browser support bundle. Run ./oscar.sh support-bundle or oscar.bat support-bundle on the server.',
        closeLabel: 'Close',
    },
    es: {
        dialogTitle: 'Guía rápida y glosario del operador de OSCAR 3.11.0',
        dialogSubtitle: 'Referencia en lenguaje claro para flujos de consola, informes multiformato y terminología de pórticos de radiación.',
        tabs: {
            pages: 'Páginas de consola',
            reports: 'Informes y formatos',
            glossary: 'Términos explicados',
            links: 'Manual y videoguías',
        },
        pagesIntro: 'Use el menú lateral izquierdo para cambiar entre las vistas operativas de OSCAR:',
        pages: [
            {
                title: 'Panel (`/`)',
                summary: 'Cuadrícula en tiempo real del estado de carriles, mapa del sitio, flujo de alarmas, control Personalizar panel y adjudicación rápida. Las alarmas no leídas se muestran en negrita con punto indicador (compartidas por carril entre estaciones); use el conmutador efímero Solo no leídas o las ventanas temporales rápidas (`15m`, `1h`, `24h`, `15d`) en la barra de herramientas, pulse una fila, Reconocer seleccionadas o Reconocer todas para marcarlas como leídas, y active opcionalmente el aviso visual (con recuento completo y límite `100+`) o el audio continuo en Configuración.',
            },
            {
                title: 'Eventos (`/event-log`)',
                summary: 'Registro histórico de ocupaciones, alarmas y fallos con búsqueda por UUID, filtros por Código de adjudicación (`Código 9998`, `Código 9999`, `1–11` y personalizados) y adjudicación masiva.',
            },
            {
                title: 'Estado de salud (`/health`)',
                summary: 'Estado en vivo de conexión (En línea, Sin conexión, Esperando) de cada RPM y cámara, e indicadores de fallos, manipulación y ocupación prolongada (`Fault - Extended Occupancy` + `Código 9998`).',
            },
            {
                title: 'Mapa (`/map`)',
                summary: 'Plano georreferenciado del sitio o mapa de teselas a pantalla completa con marcadores de carril en vivo.',
            },
            {
                title: 'Nacional (`/national-view`)',
                summary: 'Resumen multinodo de ocupaciones, alarmas gamma/neutrones y fallos en nodos locales y federados.',
            },
            {
                title: 'Generador de informes (`/report`)',
                summary: 'Generación de informes por Nodo completo, Vista operativa o Carriles específicos en formatos PDF, CSV, JSON y Excel (.xlsx).',
            },
            {
                title: 'Transferencia de alarmas (`/alarm-transfer`)',
                summary: 'Exportación e importación de códigos QR y archivos `.oscar-alarm.json` para entornos aislados sin conexión.',
            },
            {
                title: 'Nodos (`/servers`)',
                summary: 'Configuración de nodos OSCAR remotos federados mediante sesión segura o credenciales Basic en memoria.',
            },
        ],
        reportsIntro: 'Cada solicitud genera un archivo nuevo y sobrescribe cualquier archivo previo con los mismos parámetros:',
        reports: [
            {
                title: 'Informe del sitio RDS (`RDS_SITE`)',
                summary: 'Resumen ejecutivo del sitio, tasas de alarma y supresión EML (`Código 9999` frente a `Revisión de operador`), fallos, almacenamiento y tabla por carril.',
            },
            {
                title: 'Informe de carril (`LANE`)',
                summary: 'Indicadores operativos por carril, tasas de alarmas y EML, desglose de fallos y actividad diaria.',
            },
            {
                title: 'Informe de eventos (`EVENT`)',
                summary: 'Gráficos y tablas diarias de Alarmas y ocupaciones, Solo alarmas o Estado de salud.',
            },
            {
                title: 'Informe de adjudicación (`ADJUDICATION`)',
                summary: 'Comienza con las tablas sumadas de Todos los carriles seleccionados (`ALL_LANES`) (Disposición e Isótopos), seguidas del desglose individual de cada carril.',
            },
            {
                title: 'Extracto detallado de adjudicación (`ADJUDICATION_DETAILS`)',
                summary: 'Tabla de auditoría línea por línea de cada adjudicación enviada (hora, carril, usuario, conteo, código, notas, inspección secundaria, isótopos, vehículo, archivos e ID de ocupación).',
            },
        ],
        formatsTitle: 'Formatos de exportación compatibles',
        formats: [
            {
                title: 'PDF (`.pdf`)',
                summary: 'Documento ejecutivo con tarjetas KPI, gráficos y tablas con estilo visualizado directamente en el navegador.',
            },
            {
                title: 'CSV (`.csv`)',
                summary: 'Texto separado por comas con encabezados de metadatos y vista previa tabular integrada.',
            },
            {
                title: 'JSON (`.json`)',
                summary: 'Estructura legible por máquina con metadatos, secciones, encabezados y filas tipadas.',
            },
            {
                title: 'Excel (`.xlsx`)',
                summary: 'Libro OpenXML con múltiples hojas de cálculo para metadatos y cada sección del informe.',
            },
        ],
        glossaryIntro: 'Definiciones en lenguaje claro de los términos técnicos utilizados en OSCAR:',
        glossaryTermHeader: 'Término / Sigla',
        glossaryMeaningHeader: 'Significado en lenguaje claro',
        glossary: [
            {
                term: 'Ocupación (Occupancy)',
                meaning: 'Un paso completo de un vehículo, contenedor o peatón por un carril entre el inicio (`GS`) y el fin (`GX`).',
            },
            {
                term: 'CPS (Conteos por segundo)',
                meaning: 'Tasa bruta de conteo del detector de radiación medida en cada intervalo de muestreo.',
            },
            {
                term: 'NSIGMA (N-Sigma)',
                meaning: 'Número de desviaciones estándar (σ) que el conteo gamma supera al promedio reciente de fondo.',
            },
            {
                term: 'NORM',
                meaning: 'Material radiactivo de origen natural: carga benigna con isótopos naturales (fertilizantes, arena para gatos, cerámica, granito).',
            },
            {
                term: 'EML y Código 9999',
                meaning: 'Aprendizaje automático mejorado (Enhanced Machine Learning) en pórticos Rapiscan para distinguir carga NORM benigna de amenazas. Las alarmas NORM no amenazantes se auto-adjudican como `Código 9999: EML sin amenaza`.',
            },
            {
                term: 'Ocupación prolongada (`Fault - Extended Occupancy`) y Código 9998',
                meaning: 'Cuando un vehículo ocupa un carril al menos su umbral configurado (`extendedOccupancyThresholdMinutes`, predeterminado 1 min), OSCAR publica `Fault - Extended Occupancy`. Si finaliza con alarma solo gamma (sin alarma de neutrones), se suprime del panel y se auto-adjudica como `Código 9998: Alarma gamma de ocupación prolongada`.',
            },
            {
                term: 'WebID y DRF',
                meaning: 'Servicio Sandia Full Spectrum para identificar isótopos en espectros. La DRF indica el modelo y geometría del detector.',
            },
            {
                term: 'Códigos de archivo diario (`GB`, `GS`, `GA`, `NS`, `GX`, `SG1`–`SG3`, `SN1`–`SN2`)',
                meaning: '`GB`/`NB` = fondo gamma/neutrones, `GS` = inicio de ocupación, `GC`/`NC` = conteos, `GA`/`NA`/`NS` = alarma, `GX` = fin de ocupación, `TT`/`TC` = manipulación, `SG1`–`SG3`/`SN1`–`SN2` = parámetros diarios sincronizados en `config.json`.',
            },
            {
                term: 'UUID de evento',
                meaning: 'Identificador único global asignado a cada evento de ocupación para búsqueda exacta y transferencia QR.',
            },
            {
                term: 'Vista operativa (`?view=<clave>`)',
                meaning: 'Filtro con nombre que limita la consola a los carriles asignados a esa estación de trabajo.',
            },
            {
                term: 'Medios retenidos de 5 fotogramas',
                meaning: 'Cinco instantáneas JPEG (`frame-01.jpg`–`frame-05.jpg`) por alarma. Tras 30 días se conservan el fotograma central (`frame-03.jpg`) y se depuran los secundarios.',
            },
            {
                term: 'Nivel frío Parquet (`PARQUET_PRIMARY`)',
                meaning: 'Modo predeterminado donde las particiones de 30 minutos de PostgreSQL se exportan a archivos Apache Parquet comprimidos con ZSTD.',
            },
            {
                term: 'OCR de contenedores y matrículas (`ocrConfig`)',
                meaning: 'OCR asíncrono en segundo plano opcional por carril (desactivado de forma predeterminada). Cuando se activa en un carril, muestrea fotogramas según lo permitan los recursos de CPU y memoria, completa automáticamente contenedores ISO 6346 con dígito de control válido (o matrículas de alta confianza) en el campo Vehículo si no se ha editado y muestra sugerencias clicables con recorte de evidencia.',
            },
        ],
        linksIntro: 'Abra el manual completo de administración o consulte las videoguías prácticas:',
        adminLinkLabel: 'Abrir administración de SensorHub y manual integrado (`/sensorhub/admin`)',
        adminLinkDesc: 'Requiere cuenta de administrador. Seleccione el Servicio OSCAR o cualquier módulo y abra la pestaña README.',
        videoGuidesLinkLabel: 'Abrir videoguías prácticas de OSCAR (`ORNL/oscar-video-guides`)',
        videoGuidesLinkDesc: '16 vídeos cortos (< 2 min) con subtítulos sobre certificados, carriles, adjudicación, EML, estado de salud e informes.',
        supportBundleTitle: 'Diagnóstico y paquete de soporte (`.zip`)',
        supportBundleDesc: 'Descarga un archivo `.zip` de diagnóstico que combina eventos recientes del navegador con registros del servidor OSCAR, estado de módulos y salud de JVM/almacenamiento. Si el servidor no responde o no arranca, ejecute `./oscar.sh support-bundle` (Linux) u `oscar.bat support-bundle` (Windows) en el servidor.',
        supportBundlePrivacyNote: 'Privacidad y seguridad: se recopila únicamente para diagnosticar incidencias técnicas; contraseñas, tokens, cookies de sesión, credenciales RTSP y claves privadas se redactan automáticamente.',
        supportBundleButtonLabel: 'Exportar paquete de soporte',
        supportBundleCombinedSuccess: (fileName: string) => `Se descargó ${fileName} (diagnóstico de cliente y servidor con secretos redactados).`,
        supportBundleClientFallback: (fileName: string) => `Servidor no disponible; se descargó el diagnóstico del navegador (${fileName}). Ejecute ./oscar.sh support-bundle u oscar.bat support-bundle en el servidor.`,
        supportBundleUnexpectedError: 'No se pudo exportar el paquete de soporte del navegador. Ejecute ./oscar.sh support-bundle u oscar.bat support-bundle en el servidor.',
        closeLabel: 'Cerrar',
    },
    fr: {
        dialogTitle: 'Guide rapide opérateur et glossaire OSCAR 3.11.0',
        dialogSubtitle: 'Référence en langage clair pour les flux de console, les rapports multiformats et la terminologie des portiques.',
        tabs: {
            pages: 'Pages de la console',
            reports: 'Rapports et exports',
            glossary: 'Termes expliqués',
            links: 'Manuel et guides vidéo',
        },
        pagesIntro: 'Utilisez le tiroir de navigation gauche pour basculer entre les vues OSCAR :',
        pages: [
            {
                title: 'Tableau de bord (`/`)',
                summary: 'Grille d’état des voies en temps réel, carte du site, flux d’alarmes en direct, personnalisation des cartes et tiroir d’adjudication rapide. Les alarmes non lues s’affichent en gras avec un point indicateur (état partagé par voie entre les postes) ; utilisez le filtre temporaire Non lues uniquement ou les fenêtres temporelles rapides (`15m`, `1h`, `24h`, `15j`), cliquez sur une ligne, Acquitter la sélection ou Tout acquitter pour marquer comme lu, et activez en option le bandeau (avec décompte complet et plafond `100+`) ou l’audio continu dans Paramètres.',
            },
            {
                title: 'Événements (`/event-log`)',
                summary: 'Journal historique consultable des occupations, alarmes et défauts avec recherche par UUID, filtres par Code d’adjudication (`Code 9998`, `Code 9999`, `1–11` et personnalisés) et adjudication groupée.',
            },
            {
                title: 'État de santé (`/health`)',
                summary: 'État de connexion en direct (En ligne, Hors ligne, En attente) des RPM et caméras, et indicateurs de défauts, sabotage et occupation prolongée (`Fault - Extended Occupancy` + `Code 9998`).',
            },
            {
                title: 'Carte (`/map`)',
                summary: 'Plan du site géoréférencé ou carte plein écran avec marqueurs de voies en direct.',
            },
            {
                title: 'National (`/national-view`)',
                summary: 'Synthèse multi-nœuds comparant occupations, alarmes gamma/neutrons et défauts.',
            },
            {
                title: 'Générateur de rapports (`/report`)',
                summary: 'Génération de rapports à la demande (Nœud entier, Vue opérationnelle ou Voies spécifiques) en PDF, CSV, JSON et Excel (.xlsx).',
            },
            {
                title: 'Transfert d’alarme (`/alarm-transfer`)',
                summary: 'Exportation et importation hors ligne par code QR et fichier `.oscar-alarm.json`.',
            },
            {
                title: 'Nœuds (`/servers`)',
                summary: 'Configuration des nœuds OSCAR distants fédérés par session sécurisée ou identifiants Basic en mémoire.',
            },
        ],
        reportsIntro: 'Chaque demande génère un nouveau fichier et remplace tout rapport antérieur portant les mêmes paramètres :',
        reports: [
            {
                title: 'Rapport de site RDS (`RDS_SITE`)',
                summary: 'Synthèse exécutive du site, taux d’alarme et de suppression EML (`Code 9999` vs `Examen opérateur`), défauts, stockage et tableau par voie.',
            },
            {
                title: 'Rapport de voie (`LANE`)',
                summary: 'Indicateurs opérationnels par voie, taux d’alarmes et EML, défauts et activité quotidienne.',
            },
            {
                title: 'Rapport d’événements (`EVENT`)',
                summary: 'Graphiques et tableaux quotidiens pour Alarmes et occupations, Alarmes seules ou État de santé.',
            },
            {
                title: 'Rapport d’adjudication (`ADJUDICATION`)',
                summary: 'Commence par les tableaux cumulés Toutes les voies sélectionnées (`ALL_LANES`) (Disposition et Isotopes), suivis du détail par voie.',
            },
            {
                title: 'Extraction détaillée des adjudications (`ADJUDICATION_DETAILS`)',
                summary: 'Tableau d’audit ligne par ligne de chaque décision soumise (heure, voie, utilisateur, compteur, code, notes, inspection secondaire, isotopes, véhicule, fichiers et ID d’occupation).',
            },
        ],
        formatsTitle: 'Formats d’exportation pris en charge',
        formats: [
            {
                title: 'PDF (`.pdf`)',
                summary: 'Document exécutif mis en forme avec cartes KPI, graphiques et tableaux affiché directement dans le navigateur.',
            },
            {
                title: 'CSV (`.csv`)',
                summary: 'Texte séparé par des virgules avec en-têtes de métadonnées et aperçu tabulaire intégré.',
            },
            {
                title: 'JSON (`.json`)',
                summary: 'Charge utile structurée lisible par machine contenant métadonnées, sections, en-têtes et lignes.',
            },
            {
                title: 'Excel (`.xlsx`)',
                summary: 'Classeur OpenXML multi-feuilles avec feuille de métadonnées et feuilles dédiées par section.',
            },
        ],
        glossaryIntro: 'Définitions en langage clair des termes techniques utilisés dans OSCAR :',
        glossaryTermHeader: 'Terme / Acronyme',
        glossaryMeaningHeader: 'Signification en langage clair',
        glossary: [
            {
                term: 'Occupation (Occupancy)',
                meaning: 'Passage complet d’un véhicule, conteneur ou piéton dans une voie entre l’entrée (`GS`) et la sortie (`GX`).',
            },
            {
                term: 'CPS (Coups par seconde)',
                meaning: 'Taux de comptage brut du détecteur mesuré à chaque intervalle d’échantillonnage.',
            },
            {
                term: 'NSIGMA (N-Sigma)',
                meaning: 'Nombre d’écarts-types (σ) dont le taux gamma dépasse la moyenne récente du bruit de fond.',
            },
            {
                term: 'NORM',
                meaning: 'Matière radioactive d’origine naturelle : fret bénin contenant des isotopes naturels (engrais, litière, céramique, granit).',
            },
            {
                term: 'EML et Code 9999',
                meaning: 'Apprentissage automatique amélioré (Enhanced Machine Learning) — algorithme Rapiscan comparant les fenêtres d’énergie gamma pour distinguer le fret NORM bénin des menaces. Les alarmes non menaçantes sont auto-adjugées en `Code 9999 : EML sans menace`.',
            },
            {
                term: 'Occupation prolongée (`Fault - Extended Occupancy`) et Code 9998',
                meaning: 'Lorsqu’un véhicule occupe une voie au moins pendant son seuil configuré (`extendedOccupancyThresholdMinutes`, défaut 1 min), OSCAR publie `Fault - Extended Occupancy`. Si elle se termine par une alarme gamma seule (sans alarme neutron), elle est masquée du tableau de bord et auto-adjugée en `Code 9998 : Alarme gamma d’occupation prolongée`.',
            },
            {
                term: 'WebID et DRF',
                meaning: 'Service Sandia Full Spectrum d’identification isotopique. La DRF précise le modèle et la géométrie du détecteur.',
            },
            {
                term: 'Codes de fichier quotidien (`GB`, `GS`, `GA`, `NS`, `GX`, `SG1`–`SG3`, `SN1`–`SN2`)',
                meaning: '`GB`/`NB` = fond gamma/neutrons, `GS` = début d’occupation, `GC`/`NC` = comptages, `GA`/`NA`/`NS` = alarme, `GX` = fin d’occupation, `TT`/`TC` = sabotage, `SG1`–`SG3`/`SN1`–`SN2` = paramètres quotidiens synchronisés dans `config.json`.',
            },
            {
                term: 'UUID d’événement',
                meaning: 'Identifiant unique global attribué à chaque occupation pour la recherche exacte et le transfert QR.',
            },
            {
                term: 'Vue opérationnelle (`?view=<clé>`)',
                meaning: 'Filtre nommé limitant la console aux voies affectées à ce poste de travail.',
            },
            {
                term: 'Médias conservés à 5 images',
                meaning: 'Cinq instantanés JPEG (`frame-01.jpg`–`frame-05.jpg`) extraits par alarme. Après 30 jours, l’image centrale (`frame-03.jpg`) est conservée.',
            },
            {
                term: 'Niveau froid Parquet (`PARQUET_PRIMARY`)',
                meaning: 'Mode par défaut où les partitions PostgreSQL de 30 minutes sont exportées en fichiers Apache Parquet compressés ZSTD.',
            },
            {
                term: 'OCR conteneurs et plaques (`ocrConfig`)',
                meaning: 'OCR asynchrone en arrière-plan optionnel par voie (désactivé par défaut). Lorsqu’il est activé sur une voie, OSCAR analyse les images selon la disponibilité CPU/mémoire, préremplit les codes conteneur ISO 6346 à chiffre de contrôle valide (ou plaques à haute confiance) dans le champ Véhicule non modifié et affiche des suggestions cliquables avec vignette.',
            },
        ],
        linksIntro: 'Ouvrez le manuel complet d’administration ou consultez les guides vidéo pratiques :',
        adminLinkLabel: 'Ouvrir l’administration SensorHub et le manuel intégré (`/sensorhub/admin`)',
        adminLinkDesc: 'Connexion administrateur requise. Sélectionnez le Service OSCAR ou un module et ouvrez l’onglet README.',
        videoGuidesLinkLabel: 'Ouvrir les guides vidéo pratiques OSCAR (`ORNL/oscar-video-guides`)',
        videoGuidesLinkDesc: '16 courtes vidéos (< 2 min) sous-titrées couvrant certificats, voies, adjudication, EML, état de santé et rapports.',
        supportBundleTitle: 'Dépannage et archive d’assistance (`.zip`)',
        supportBundleDesc: 'Télécharge une archive `.zip` réunissant les diagnostics récents du navigateur et les journaux du serveur OSCAR, l’état des modules et la santé JVM/stockage. Si le serveur est injoignable ou ne démarre pas, exécutez `./oscar.sh support-bundle` (Linux) ou `oscar.bat support-bundle` (Windows) sur l’hôte.',
        supportBundlePrivacyNote: 'Confidentialité et sécurité : collecté uniquement pour le diagnostic technique ; mots de passe, jetons, cookies de session, identifiants RTSP et clés privées sont automatiquement masqués.',
        supportBundleButtonLabel: 'Exporter l’archive d’assistance',
        supportBundleCombinedSuccess: (fileName: string) => `${fileName} téléchargé (diagnostics client + serveur, secrets masqués).`,
        supportBundleClientFallback: (fileName: string) => `Serveur injoignable ; diagnostics navigateur téléchargés (${fileName}). Exécutez ./oscar.sh support-bundle ou oscar.bat support-bundle sur le serveur.`,
        supportBundleUnexpectedError: 'Impossible d’exporter l’archive d’assistance du navigateur. Exécutez ./oscar.sh support-bundle ou oscar.bat support-bundle sur le serveur.',
        closeLabel: 'Fermer',
    },
    el: {
        dialogTitle: 'Γρήγορος οδηγός χειριστή & γλωσσάριο OSCAR 3.11.0',
        dialogSubtitle: 'Αναφορά σε απλή γλώσσα για τις ροές εργασίας κονσόλας, τις αναφορές πολλαπλών μορφών και την ορολογία πυλών ακτινοβολίας.',
        tabs: {
            pages: 'Σελίδες κονσόλας',
            reports: 'Αναφορές & εξαγωγές',
            glossary: 'Επεξήγηση όρων',
            links: 'Εγχειρίδιο & βίντεο',
        },
        pagesIntro: 'Χρησιμοποιήστε το αριστερό μενού πλοήγησης για εναλλαγή μεταξύ των προβολών του OSCAR:',
        pages: [
            {
                title: 'Πίνακας ελέγχου (`/`)',
                summary: 'Πλέγμα κατάστασης λωρίδων σε πραγματικό χρόνο, χάρτης εγκατάστασης, ροή συναγερμών, προσαρμογή καρτών και γρήγορη αξιολόγηση. Οι μη αναγνωσμένοι συναγερμοί εμφανίζονται με έντονη γραφή και κουκκίδα ένδειξης (κοινόχρηστοι ανά λωρίδα μεταξύ σταθμών)· χρησιμοποιήστε το προσωρινό φίλτρο Μόνο μη αναγνωσμένοι ή τα γρήγορα χρονικά παράθυρα (`15λ`, `1ώ`, `24ώ`, `15η`), επιλέξτε γραμμή, Επιβεβαίωση επιλεγμένων ή Επιβεβαίωση όλων για επισήμανση ως αναγνωσμένων, και ενεργοποιήστε προαιρετικά την ειδοποίηση (με πλήρη καταμέτρηση και όριο `100+`) ή τον συνεχή ήχο στις Ρυθμίσεις.',
            },
            {
                title: 'Συμβάντα (`/event-log`)',
                summary: 'Ιστορικό διελεύσεων, συναγερμών και βλαβών με αναζήτηση UUID, φίλτρα Κωδικού αξιολόγησης (`Κωδικός 9998`, `Κωδικός 9999`, `1–11` και προσαρμοσμένοι) και μαζική αξιολόγηση.',
            },
            {
                title: 'Κατάσταση υγείας (`/health`)',
                summary: 'Ζωντανή κατάσταση σύνδεσης (Σε σύνδεση, Εκτός σύνδεσης, Αναμονή) για κάθε RPM και κάμερα, καθώς και ενδείξεις βλαβών, παραβίασης και παρατεταμένης διέλευσης (`Fault - Extended Occupancy` + `Κωδικός 9998`).',
            },
            {
                title: 'Χάρτης (`/map`)',
                summary: 'Γεωαναφερθέν διάγραμμα εγκατάστασης ή χάρτης πλήρους οθόνης με ζωντανούς δείκτες λωρίδων.',
            },
            {
                title: 'Εθνική προβολή (`/national-view`)',
                summary: 'Συγκεντρωτικός πίνακας πολλαπλών κόμβων για διελεύσεις, συναγερμούς γάμμα/νετρονίων και βλάβες.',
            },
            {
                title: 'Δημιουργία αναφορών (`/report`)',
                summary: 'Δημιουργία αναφορών ανά Ολόκληρο κόμβο, Λειτουργική προβολή ή Συγκεκριμένες λωρίδες σε μορφές PDF, CSV, JSON και Excel (.xlsx).',
            },
            {
                title: 'Μεταφορά συναγερμού (`/alarm-transfer`)',
                summary: 'Εξαγωγή και εισαγωγή κωδικών QR και αρχείων `.oscar-alarm.json` για απομονωμένα περιβάλλοντα χωρίς δίκτυο.',
            },
            {
                title: 'Κόμβοι (`/servers`)',
                summary: 'Διαμόρφωση απομακρυσμένων ομοσπονδιακών κόμβων OSCAR με ασφαλή συνεδρία ή διαπιστευτήρια Basic στη μνήμη.',
            },
        ],
        reportsIntro: 'Κάθε αίτημα δημιουργεί νέο αρχείο και αντικαθιστά τυχόν προηγούμενο αρχείο με τις ίδιες παραμέτρους:',
        reports: [
            {
                title: 'Αναφορά εγκατάστασης RDS (`RDS_SITE`)',
                summary: 'Συνοπτικοί δείκτες εγκατάστασης, ποσοστά συναγερμών και καταστολής EML (`Κωδικός 9999` έναντι `Έλεγχος χειριστή`), βλάβες, χωρητικότητα δίσκου και πίνακας ανά λωρίδα.',
            },
            {
                title: 'Αναφορά λωρίδας (`LANE`)',
                summary: 'Λειτουργικοί δείκτες ανά λωρίδα, ποσοστά συναγερμών/EML, βλάβες και ημερήσια δραστηριότητα.',
            },
            {
                title: 'Αναφορά συμβάντων (`EVENT`)',
                summary: 'Ημερήσια γραφήματα και πίνακες για Συναγερμούς & διελεύσεις, Μόνο συναγερμούς ή Κατάσταση υγείας.',
            },
            {
                title: 'Αναφορά αξιολόγησης (`ADJUDICATION`)',
                summary: 'Ξεκινά με τους αθροιστικούς πίνακες Όλες οι επιλεγμένες λωρίδες (`ALL_LANES`) (Διάθεση και Αποτελέσματα ισοτόπων), ακολουθούμενους από την ανάλυση κάθε επιμέρους λωρίδας.',
            },
            {
                title: 'Αναλυτική εξαγωγή αξιολογήσεων (`ADJUDICATION_DETAILS`)',
                summary: 'Πίνακας ελέγχου γραμμή προς γραμμή για κάθε υποβληθείσα αξιολόγηση (ώρα, λωρίδα, χρήστης, αριθμός διέλευσης, κωδικός, σχόλια, δευτερεύων έλεγχος, ισότοπα, όχημα, αρχεία και ID διέλευσης).',
            },
        ],
        formatsTitle: 'Υποστηριζόμενες μορφές εξαγωγής',
        formats: [
            {
                title: 'PDF (`.pdf`)',
                summary: 'Μορφοποιημένο έγγραφο με κάρτες δεικτών, γραφήματα και πίνακες που προβάλλεται απευθείας στον περιηγητή.',
            },
            {
                title: 'CSV (`.csv`)',
                summary: 'Κείμενο διαχωρισμένο με κόμματα με κεφαλίδες μεταδεδομένων και ενσωματωμένη προεπισκόπηση πίνακα.',
            },
            {
                title: 'JSON (`.json`)',
                summary: 'Δομημένο αρχείο αναγνώσιμο από μηχανή με μεταδεδομένα, ενότητες, κεφαλίδες και γραμμές.',
            },
            {
                title: 'Excel (`.xlsx`)',
                summary: 'Βιβλίο εργασίας OpenXML πολλαπλών φύλλων για μεταδεδομένα και κάθε ενότητα αναφοράς.',
            },
        ],
        glossaryIntro: 'Ορισμοί σε απλή γλώσσα των τεχνικών όρων που χρησιμοποιούνται στο OSCAR:',
        glossaryTermHeader: 'Όρος / Ακρωνύμιο',
        glossaryMeaningHeader: 'Σημασία σε απλή γλώσσα',
        glossary: [
            {
                term: 'Διέλευση (Occupancy)',
                meaning: 'Μία πλήρης διέλευση οχήματος, εμπορευματοκιβωτίου ή πεζού από λωρίδα ανίχνευσης μεταξύ εισόδου (`GS`) και εξόδου (`GX`).',
            },
            {
                term: 'CPS (Μετρήσεις ανά δευτερόλεπτο)',
                meaning: 'Ακατέργαστος ρυθμός καταμέτρησης του ανιχνευτή ακτινοβολίας σε κάθε διάστημα δειγματοληψίας.',
            },
            {
                term: 'NSIGMA (N-Sigma)',
                meaning: 'Αριθμός τυπικών αποκλίσεων (σ) κατά τον οποίο ο ρυθμός γάμμα υπερβαίνει τον πρόσφατο μέσο όρο υποβάθρου.',
            },
            {
                term: 'NORM',
                meaning: 'Φυσικώς απαντώμενο ραδιενεργό υλικό — ακίνδυνο φορτίο με φυσικά ισότοπα (λιπάσματα, άμμος υγιεινής, κεραμικά, γρανίτης).',
            },
            {
                term: 'EML & Κωδικός 9999',
                meaning: 'Ενισχυμένη μηχανική μάθηση (Enhanced Machine Learning) — αλγόριθμος Rapiscan που συγκρίνει ενεργειακά παράθυρα γάμμα για διάκριση ακίνδυνου φορτίου NORM από απειλές. Οι μη απειλητικοί συναγερμοί αξιολογούνται αυτόματα ως `Κωδ. 9999: EML μη απειλή`.',
            },
            {
                term: 'Παρατεταμένη διέλευση (`Fault - Extended Occupancy`) & Κωδικός 9998',
                meaning: 'Όταν ένα όχημα παραμένει σε λωρίδα τουλάχιστον για το ρυθμισμένο όριο (`extendedOccupancyThresholdMinutes`, προεπιλογή 1 λεπτό), το OSCAR δημοσιεύει `Fault - Extended Occupancy`. Αν ολοκληρωθεί με συναγερμό μόνο γάμμα (χωρίς συναγερμό νετρονίων), αποκρύπτεται από τον πίνακα και αξιολογείται αυτόματα ως `Κωδικός 9998: Συναγερμός γάμμα παρατεταμένης διέλευσης`.',
            },
            {
                term: 'WebID & DRF',
                meaning: 'Υπηρεσία Sandia Full Spectrum για ταυτοποίηση ισοτόπων από φάσματα. Το DRF καθορίζει το μοντέλο και τη γεωμετρία του ανιχνευτή.',
            },
            {
                term: 'Κωδικοί ημερήσιου αρχείου (`GB`, `GS`, `GA`, `NS`, `GX`, `SG1`–`SG3`, `SN1`–`SN2`)',
                meaning: '`GB`/`NB` = υπόβαθρο γάμμα/νετρονίων, `GS` = έναρξη διέλευσης, `GC`/`NC` = μετρήσεις, `GA`/`NA`/`NS` = συναγερμός, `GX` = λήξη διέλευσης, `TT`/`TC` = παραβίαση, `SG1`–`SG3`/`SN1`–`SN2` = ημερήσιες παράμετροι που συγχρονίζονται στο `config.json`.',
            },
            {
                term: 'UUID συμβάντος',
                meaning: 'Παγκοσμίως μοναδικό αναγνωριστικό για κάθε διέλευση για ακριβή αναζήτηση και μεταφορά QR.',
            },
            {
                term: 'Λειτουργική προβολή (`?view=<κλειδί>`)',
                meaning: 'Επώνυμο φίλτρο που περιορίζει την κονσόλα στις λωρίδες που έχουν ανατεθεί στον σταθμό εργασίας.',
            },
            {
                term: 'Διατηρούμενα πολυμέσα 5 καρέ',
                meaning: 'Πέντε στιγμιότυπα JPEG (`frame-01.jpg`–`frame-05.jpg`) ανά συναγερμό. Μετά από 30 ημέρες διατηρείται το κεντρικό καρέ (`frame-03.jpg`).',
            },
            {
                term: 'Ψυχρό επίπεδο Parquet (`PARQUET_PRIMARY`)',
                meaning: 'Προεπιλεγμένη λειτουργία όπου τα τμήματα 30 λεπτών της PostgreSQL εξάγονται σε αρχεία Apache Parquet συμπιεσμένα με ZSTD.',
            },
            {
                term: 'OCR εμπορευματοκιβωτίων & πινακίδων (`ocrConfig`)',
                meaning: 'Προαιρετικό ασύγχρονο OCR παρασκηνίου ανά λωρίδα (απενεργοποιημένο από προεπιλογή). Όταν ενεργοποιηθεί σε λωρίδα, αναλύει καρέ ανάλογα με τους διαθέσιμους πόρους CPU/μνήμης, συμπληρώνει αυτόματα έγκυρους κωδικούς ISO 6346 (ή πινακίδες υψηλής εμπιστοσύνης) στο πεδίο Οχήματος εφόσον δεν έχει τροποποιηθεί και εμφανίζει επιλέξιμες προτάσεις με μικρογραφία.',
            },
        ],
        linksIntro: 'Ανοίξτε το πλήρες εγχειρίδιο διαχειριστή ή παρακολουθήστε τους σύντομους βιντεοοδηγούς:',
        adminLinkLabel: 'Άνοιγμα διαχείρισης SensorHub & ενσωματωμένου εγχειριδίου (`/sensorhub/admin`)',
        adminLinkDesc: 'Απαιτείται σύνδεση διαχειριστή. Επιλέξτε την Υπηρεσία OSCAR ή οποιαδήποτε μονάδα και ανοίξτε την καρτέλα README.',
        videoGuidesLinkLabel: 'Άνοιγμα βιντεοοδηγών εργασιών OSCAR (`ORNL/oscar-video-guides`)',
        videoGuidesLinkDesc: '16 σύντομα βίντεο (< 2 λεπ.) με υπότιτλους για πιστοποιητικά, λωρίδες, αξιολόγηση, EML, κατάσταση υγείας και αναφορές.',
        supportBundleTitle: 'Αντιμετώπιση προβλημάτων & πακέτο υποστήριξης (`.zip`)',
        supportBundleDesc: 'Λήψη ενιαίου διαγνωστικού αρχείου `.zip` που συνδυάζει συμβάντα του περιηγητή με αρχεία καταγραφής διακομιστή OSCAR, κατάσταση μονάδων και υγεία JVM/αποθήκευσης. Εάν ο διακομιστής δεν αποκρίνεται ή δεν εκκινεί, εκτελέστε `./oscar.sh support-bundle` (Linux) ή `oscar.bat support-bundle` (Windows) στον κεντρικό υπολογιστή.',
        supportBundlePrivacyNote: 'Απόρρητο & ασφάλεια: συλλέγονται αποκλειστικά για τεχνική διάγνωση· κωδικοί, διακριτικά, cookies συνεδρίας, διαπιστευτήρια RTSP και ιδιωτικά κλειδιά αφαιρούνται αυτόματα.',
        supportBundleButtonLabel: 'Εξαγωγή πακέτου υποστήριξης',
        supportBundleCombinedSuccess: (fileName: string) => `Ελήφθη το ${fileName} (διαγνωστικά πελάτη + διακομιστή, με απόκρυψη μυστικών).`,
        supportBundleClientFallback: (fileName: string) => `Ο διακομιστής δεν είναι προσβάσιμος· ελήφθησαν τα διαγνωστικά περιηγητή (${fileName}). Εκτελέστε ./oscar.sh support-bundle ή oscar.bat support-bundle στον διακομιστή.`,
        supportBundleUnexpectedError: 'Αδυναμία εξαγωγής πακέτου υποστήριξης περιηγητή. Εκτελέστε ./oscar.sh support-bundle ή oscar.bat support-bundle στον διακομιστή.',
        closeLabel: 'Κλείσιμο',
    },
};

const touchSafeButtonSx = {
    minInlineSize: 24,
    minBlockSize: 24,
    '@media (pointer: coarse)': {
        minInlineSize: 44,
        minBlockSize: 44,
    },
} as const;

export default function HelpDialog({
    open,
    onClose,
    nodes,
    stateSummary,
    fetchImpl,
    skipBrowserDownload,
    onBundleExported,
}: {
    open: boolean;
    onClose: () => void;
    nodes?: readonly SupportBundleNode[];
    stateSummary?: SupportClientStateSummary;
    fetchImpl?: typeof fetch;
    skipBrowserDownload?: boolean;
    onBundleExported?: (result: SupportBundleExportResult) => void;
}) {
    const { language } = useLanguage();
    const content = HELP_CONTENT[language] || HELP_CONTENT.en;
    const [tabIndex, setTabIndex] = React.useState(0);
    const [exporting, setExporting] = React.useState(false);
    const [exportOutcome, setExportOutcome] = React.useState<{
        severity: 'success' | 'warning' | 'error';
        message: string;
    } | null>(null);

    React.useEffect(() => {
        if (!open) {
            setExportOutcome(null);
            setExporting(false);
        }
    }, [open]);

    const handleExportSupportBundle = React.useCallback(async () => {
        if (exporting) return;
        setExporting(true);
        setExportOutcome(null);
        try {
            const result = await exportSupportBundle({
                nodes,
                stateSummary,
                fetchImpl,
                skipBrowserDownload,
            });
            onBundleExported?.(result);
            if (result.backendIncluded) {
                setExportOutcome({
                    severity: 'success',
                    message: content.supportBundleCombinedSuccess(result.fileName),
                });
            } else {
                setExportOutcome({
                    severity: 'warning',
                    message: content.supportBundleClientFallback(result.fileName),
                });
            }
        } catch {
            setExportOutcome({
                severity: 'error',
                message: content.supportBundleUnexpectedError,
            });
        } finally {
            setExporting(false);
        }
    }, [content, exporting, fetchImpl, nodes, onBundleExported, skipBrowserDownload, stateSummary]);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            aria-labelledby="oscar-operator-help-title"
        >
            <DialogTitle id="oscar-operator-help-title" sx={{ pb: 1 }}>
                <Typography variant="h6" component="div" fontWeight={700}>
                    {content.dialogTitle}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {content.dialogSubtitle}
                </Typography>
            </DialogTitle>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
                <Tabs
                    value={tabIndex}
                    onChange={(_event, nextValue: number) => setTabIndex(nextValue)}
                    variant="scrollable"
                    scrollButtons="auto"
                >
                    <Tab label={content.tabs.pages} />
                    <Tab label={content.tabs.reports} />
                    <Tab label={content.tabs.glossary} />
                    <Tab label={content.tabs.links} />
                </Tabs>
            </Box>
            <DialogContent dividers sx={{ minHeight: 380 }}>
                {tabIndex === 0 && (
                    <Stack spacing={1.5}>
                        <Typography variant="body2" color="text.secondary">
                            {content.pagesIntro}
                        </Typography>
                        {content.pages.map((item) => (
                            <Paper key={item.title} variant="outlined" sx={{ p: 1.5 }}>
                                <Typography variant="subtitle2" fontWeight={700}>
                                    {item.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                    {item.summary}
                                </Typography>
                            </Paper>
                        ))}
                    </Stack>
                )}

                {tabIndex === 1 && (
                    <Stack spacing={2}>
                        <Typography variant="body2" color="text.secondary">
                            {content.reportsIntro}
                        </Typography>
                        <Stack spacing={1.25}>
                            {content.reports.map((item) => (
                                <Paper key={item.title} variant="outlined" sx={{ p: 1.5 }}>
                                    <Typography variant="subtitle2" fontWeight={700}>
                                        {item.title}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                        {item.summary}
                                    </Typography>
                                </Paper>
                            ))}
                        </Stack>
                        <Divider />
                        <Typography variant="subtitle1" fontWeight={700}>
                            {content.formatsTitle}
                        </Typography>
                        <Stack direction="row" flexWrap="wrap" gap={1.25}>
                            {content.formats.map((format) => (
                                <Paper
                                    key={format.title}
                                    variant="outlined"
                                    sx={{ p: 1.5, flex: '1 1 220px' }}
                                >
                                    <Chip label={format.title} size="small" color="primary" sx={{ mb: 0.75 }} />
                                    <Typography variant="body2" color="text.secondary">
                                        {format.summary}
                                    </Typography>
                                </Paper>
                            ))}
                        </Stack>
                    </Stack>
                )}

                {tabIndex === 2 && (
                    <Stack spacing={1.5}>
                        <Typography variant="body2" color="text.secondary">
                            {content.glossaryIntro}
                        </Typography>
                        <TableContainer component={Paper} variant="outlined">
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700, width: '32%' }}>
                                            {content.glossaryTermHeader}
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>
                                            {content.glossaryMeaningHeader}
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {content.glossary.map((entry) => (
                                        <TableRow key={entry.term} hover>
                                            <TableCell sx={{ fontWeight: 600, verticalAlign: 'top' }}>
                                                {entry.term}
                                            </TableCell>
                                            <TableCell>{entry.meaning}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Stack>
                )}

                {tabIndex === 3 && (
                    <Stack spacing={2}>
                        <Typography variant="body2" color="text.secondary">
                            {content.linksIntro}
                        </Typography>
                        <Paper variant="outlined" sx={{ p: 2 }}>
                            <Stack spacing={1} alignItems="flex-start">
                                <Typography variant="subtitle2" fontWeight={700}>
                                    {content.adminLinkLabel}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {content.adminLinkDesc}
                                </Typography>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    endIcon={<OpenInNewRoundedIcon fontSize="small" />}
                                    component="a"
                                    href="/sensorhub/admin"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    /sensorhub/admin
                                </Button>
                            </Stack>
                        </Paper>
                        <Paper variant="outlined" sx={{ p: 2 }}>
                            <Stack spacing={1} alignItems="flex-start">
                                <Typography variant="subtitle2" fontWeight={700}>
                                    {content.videoGuidesLinkLabel}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {content.videoGuidesLinkDesc}
                                </Typography>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    endIcon={<OpenInNewRoundedIcon fontSize="small" />}
                                    component="a"
                                    href="https://github.com/ORNL/oscar-video-guides"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    sx={touchSafeButtonSx}
                                >
                                    ORNL/oscar-video-guides
                                </Button>
                            </Stack>
                        </Paper>
                        <Paper variant="outlined" sx={{ p: 2 }} data-testid="help-support-bundle-card">
                            <Stack spacing={1} alignItems="flex-start">
                                <Typography variant="subtitle2" fontWeight={700}>
                                    {content.supportBundleTitle}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {content.supportBundleDesc}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {content.supportBundlePrivacyNote}
                                </Typography>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<DownloadRoundedIcon fontSize="small" />}
                                    disabled={exporting}
                                    onClick={handleExportSupportBundle}
                                    data-testid="help-card-export-support-bundle"
                                    sx={touchSafeButtonSx}
                                >
                                    {content.supportBundleButtonLabel}
                                </Button>
                            </Stack>
                        </Paper>
                    </Stack>
                )}
            </DialogContent>
            {exporting && (
                <LinearProgress
                    data-testid="help-support-bundle-progress"
                    sx={{ minHeight: 4, flexShrink: 0 }}
                />
            )}
            <Box
                aria-live="polite"
                aria-atomic="true"
                data-testid="help-support-bundle-status"
                sx={{ px: 3, pt: exportOutcome ? 1.5 : 0 }}
            >
                {exportOutcome && (
                    <Alert
                        severity={exportOutcome.severity}
                        role={exportOutcome.severity === 'error' ? 'alert' : 'status'}
                        onClose={() => setExportOutcome(null)}
                    >
                        {exportOutcome.message}
                    </Alert>
                )}
            </Box>
            <DialogActions
                sx={{
                    px: 3,
                    py: 1.5,
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 1.5,
                }}
            >
                <Stack spacing={0.25} alignItems="flex-start" sx={{ flex: '1 1 280px' }}>
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<DownloadRoundedIcon fontSize="small" />}
                        disabled={exporting}
                        onClick={handleExportSupportBundle}
                        data-testid="help-export-support-bundle"
                        sx={touchSafeButtonSx}
                    >
                        {content.supportBundleButtonLabel}
                    </Button>
                    <Typography variant="caption" color="text.secondary">
                        {content.supportBundlePrivacyNote}
                    </Typography>
                </Stack>
                <Button onClick={onClose} variant="contained" sx={touchSafeButtonSx}>
                    {content.closeLabel}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
