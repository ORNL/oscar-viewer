/*
 * Copyright (c) 2026. Botts Innovative Research, Inc.
 * All Rights Reserved
 */

import { TrainingLabDefinition } from "@/lib/data/oscar/training/types";

export const SUPERVISOR_TRAINING_LABS: readonly TrainingLabDefinition[] = [
    {
        id: "sup-1",
        trackId: "supervisor",
        badge: "2.1",
        chipLabel: "Views & Multi-Pass",
        route: "/event-log",
        pageIconKey: "scoped-view",
        videoGuideSlug: "10-operational-views-scoping",
        screenshotFile: "35-vehicle-pass-comparison.png",
        screenshotCaption: "Scoped View workstation filter and Multi-Pass Vehicle Comparison correlating passes across North Gate and South Gate.",
        title: "Operational Views (`north-gate` / `south-gate`) & Multi-Pass Correlation",
        durationEstimate: "4 min",
        whyItMatters:
            "Shift supervisors scope gatehouse consoles to assigned gates (`?view=north-gate`) using the top-bar Scoped View {{icon:scoped-view}} selector while correlating repeat, re-scan, or re-routed passes of the same container or plate across the entire facility.",
        steps: [
            "Use the top-bar Scoped View {{icon:scoped-view}} dropdown to switch between All Lanes, `north-gate` (`DemoLane01`), and `south-gate` (`DemoLane02`) — notice how Dashboard, Events, Status of Health, Map, and Reports all stay fail-closed to your active view.",
            "Open Events {{icon:events}} (`/event-log`), paste container `SCFU8572724` into the Vehicle / Container search bar, inspect the 30-day `Related Vehicle Passes` banner, and click `Compare Passes` to view primary and confirmation passes side by side (including count profiles, EML decisions, and isotopes).",
            "Create a reusable shift bookmark in `Saved Queries` (for example, `Alarms Only` or `Code 1 Real Alarms`) so incoming shifts can audit priority events in 1 click.",
        ],
        keyTerms: [
            {
                term: "Fail-Closed Operational View (`?view=<key>`)",
                meaning: "If an account or kiosk URL requests an unauthorized or unknown view key, OSCAR shows zero lanes instead of leaking unrestricted site data.",
            },
            {
                term: "Normalized Vehicle / Container ID",
                meaning: "Spaces, hyphens, and letter case are normalized (`scfu 857272-4` -> `SCFU8572724`) so primary, re-scan, and secondary passes always correlate.",
            },
            {
                term: "Multi-Pass Vehicle Comparison",
                meaning: "Side-by-side timeline correlating repeat passes of a vehicle across lanes or sites, plus direct launch into `VEHICLE_INCIDENT` report generation.",
            },
        ],
        commonPitfalls: [
            "Cannot see `DemoLane02` when searching a vehicle: check if the top-bar Scoped View is pinned to `north-gate`; switch to `All Lanes` to inspect cross-gate transits.",
            "Remember to copy the `?view=<key>` URL when bookmarking a dedicated gatehouse booth screen.",
        ],
        translations: {
            en: {
                chipLabel: "Views & Multi-Pass",
                title: "Operational Views (`north-gate` / `south-gate`) & Multi-Pass Correlation",
                screenshotCaption: "Scoped View workstation filter and Multi-Pass Vehicle Comparison correlating passes across North Gate and South Gate.",
                whyItMatters:
                    "Shift supervisors scope gatehouse consoles to assigned gates (`?view=north-gate`) using the top-bar Scoped View {{icon:scoped-view}} selector while correlating repeat, re-scan, or re-routed passes of the same container or plate across the entire facility.",
                steps: [
                    "Use the top-bar Scoped View {{icon:scoped-view}} dropdown to switch between All Lanes, `north-gate` (`DemoLane01`), and `south-gate` (`DemoLane02`) — notice how Dashboard, Events, Status of Health, Map, and Reports all stay fail-closed to your active view.",
                    "Open Events {{icon:events}} (`/event-log`), paste container `SCFU8572724` into the Vehicle / Container search bar, inspect the 30-day `Related Vehicle Passes` banner, and click `Compare Passes` to view primary and confirmation passes side by side (including count profiles, EML decisions, and isotopes).",
                    "Create a reusable shift bookmark in `Saved Queries` (for example, `Alarms Only` or `Code 1 Real Alarms`) so incoming shifts can audit priority events in 1 click.",
                ],
                keyTerms: [
                    {
                        term: "Fail-Closed Operational View (`?view=<key>`)",
                        meaning: "If an account or kiosk URL requests an unauthorized or unknown view key, OSCAR shows zero lanes instead of leaking unrestricted site data.",
                    },
                    {
                        term: "Normalized Vehicle / Container ID",
                        meaning: "Spaces, hyphens, and letter case are normalized (`scfu 857272-4` -> `SCFU8572724`) so primary, re-scan, and secondary passes always correlate.",
                    },
                    {
                        term: "Multi-Pass Vehicle Comparison",
                        meaning: "Side-by-side timeline correlating repeat passes of a vehicle across lanes or sites, plus direct launch into `VEHICLE_INCIDENT` report generation.",
                    },
                ],
                commonPitfalls: [
                    "Cannot see `DemoLane02` when searching a vehicle: check if the top-bar Scoped View is pinned to `north-gate`; switch to `All Lanes` to inspect cross-gate transits.",
                    "Remember to copy the `?view=<key>` URL when bookmarking a dedicated gatehouse booth screen.",
                ],
                objectiveSummary: "2 Operational Views active with correlated multi-pass container history (`operationalViewCount >= 2 && multiPassVehicleCount >= 1`).",
            },
            es: {
                chipLabel: "Vistas y multipasada",
                title: "Vistas operativas (`north-gate` / `south-gate`) y correlación multipasada",
                screenshotCaption: "Selector de Vista operativa y Comparación multipasada correlacionando pasos entre Puerta Norte y Puerta Sur.",
                whyItMatters:
                    "Los supervisores delimitan cada estación a sus carriles (`?view=north-gate`) con Vista operativa {{icon:scoped-view}} mientras correlacionan reescaneos o desvíos del mismo contenedor en toda la instalación.",
                steps: [
                    "Use el selector superior Vista operativa {{icon:scoped-view}} para alternar entre Todos los carriles, `north-gate` (`DemoLane01`) y `south-gate` (`DemoLane02`).",
                    "Abra Eventos {{icon:events}} (`/event-log`), busque `SCFU8572724`, revise el aviso de 30 días `Pasadas relacionadas del vehículo` y pulse `Comparar pasadas` para contrastar perfiles, decisiones EML e isótopos.",
                    "Guarde un filtro reutilizable en `Consultas guardadas` (p. ej. `Solo alarmas` o `Código 1`) para agilizar el relevo de turno.",
                ],
                keyTerms: [
                    {
                        term: "Vista operativa fail-closed (`?view=<clave>`)",
                        meaning: "Si se solicita una vista no autorizada o inválida, OSCAR oculta los carriles en lugar de exponer todo el sitio.",
                    },
                    {
                        term: "ID normalizado de vehículo/contenedor",
                        meaning: "Ignora espacios, guiones y mayúsculas (`scfu 857272-4` -> `SCFU8572724`) para correlacionar siempre todas las pasadas.",
                    },
                    {
                        term: "Comparación multipasada",
                        meaning: "Línea temporal lado a lado de todas las pasadas del mismo vehículo y acceso directo al informe `VEHICLE_INCIDENT`.",
                    },
                ],
                commonPitfalls: [
                    "Si no ve `DemoLane02`, verifique que la Vista operativa superior no esté fija en `north-gate`.",
                    "Copie la URL con `?view=<clave>` al fijar accesos directos en cabinas de garita.",
                ],
                objectiveSummary: "2 Vistas operativas activas con historial multipasada correlacionado (`operationalViewCount >= 2 && multiPassVehicleCount >= 1`).",
            },
            fr: {
                chipLabel: "Vues & multi-passages",
                title: "Vues opérationnelles (`north-gate` / `south-gate`) et corrélation multi-passages",
                screenshotCaption: "Filtre Vue opérationnelle et Comparaison multi-passages corrélant les transits entre Porte Nord et Porte Sud.",
                whyItMatters:
                    "Les superviseurs restreignent les écrans à leurs portiques (`?view=north-gate`) via Vue opérationnelle {{icon:scoped-view}} tout en rapprochant les passages répétés d’un même conteneur sur l’ensemble du site.",
                steps: [
                    "Utilisez le menu Vue opérationnelle {{icon:scoped-view}} en haut pour basculer entre Toutes les voies, `north-gate` (`DemoLane01`) et `south-gate` (`DemoLane02`).",
                    "Ouvrez Événements {{icon:events}} (`/event-log`), recherchez `SCFU8572724`, consultez le bandeau 30 jours `Passages liés` et ouvrez `Comparer les passages` pour examiner profils, EML et isotopes côte à côte.",
                    "Enregistrez un filtre réutilisable dans `Requêtes enregistrées` (ex. `Alarmes uniquement` ou `Code 1`) pour la relève de poste.",
                ],
                keyTerms: [
                    {
                        term: "Vue opérationnelle sécurisée (`?view=<clé>`)",
                        meaning: "En cas de clé non autorisée ou inconnue, OSCAR n’affiche aucune voie (fail-closed) au lieu d’exposer tout le site.",
                    },
                    {
                        term: "ID véhicule/conteneur normalisé",
                        meaning: "Espaces, tirets et casse sont normalisés (`scfu 857272-4` -> `SCFU8572724`) pour garantir la corrélation.",
                    },
                    {
                        term: "Comparaison multi-passages",
                        meaning: "Chronologie côte à côte des passages primaires et secondaires avec lancement direct du rapport `VEHICLE_INCIDENT`.",
                    },
                ],
                commonPitfalls: [
                    "Si `DemoLane02` n’apparaît pas, vérifiez que le menu Vue opérationnelle n’est pas verrouillé sur `north-gate`.",
                    "Conservez le paramètre `?view=<clé>` dans les favoris de postes dédiés.",
                ],
                objectiveSummary: "2 Vues opérationnelles actives avec historique multi-passages corrélé (`operationalViewCount >= 2 && multiPassVehicleCount >= 1`).",
            },
            el: {
                chipLabel: "Προβολές & πολλαπλές",
                title: "Λειτουργικές προβολές (`north-gate` / `south-gate`) & συσχέτιση πολλαπλών διελεύσεων",
                screenshotCaption: "Φίλτρο Λειτουργικής προβολής και Σύγκριση πολλαπλών διελεύσεων μεταξύ Βόρειας και Νότιας Πύλης.",
                whyItMatters:
                    "Οι επόπτες εστιάζουν τους σταθμούς σε συγκεκριμένες πύλες (`?view=north-gate`) μέσω της Λειτουργικής προβολής {{icon:scoped-view}} ενώ συσχετίζουν επαναλαμβανόμενες διελεύσεις του ίδιου κοντέινερ σε όλη την εγκατάσταση.",
                steps: [
                    "Χρησιμοποιήστε τη Λειτουργική προβολή {{icon:scoped-view}} επάνω για εναλλαγή μεταξύ Όλων των λωρίδων, `north-gate` (`DemoLane01`) και `south-gate` (`DemoLane02`).",
                    "Ανοίξτε τα Συμβάντα {{icon:events}} (`/event-log`), αναζητήστε `SCFU8572724`, ελέγξτε την ειδοποίηση 30 ημερών σχετικών διελεύσεων και πατήστε `Σύγκριση διελεύσεων`.",
                    "Αποθηκεύστε ένα φίλτρο στις `Αποθηκευμένες αναζητήσεις` (π.χ. `Μόνο συναγερμοί` ή `Κωδικός 1`) για ταχεία παράδοση βάρδιας.",
                ],
                keyTerms: [
                    {
                        term: "Ασφαλής Λειτουργική προβολή (`?view=<κλειδί>`)",
                        meaning: "Αν ζητηθεί μη εξουσιοδοτημένη προβολή, το OSCAR κλείνει με ασφάλεια (μηδέν λωρίδες) χωρίς διαρροή δεδομένων.",
                    },
                    {
                        term: "Κανονικοποιημένο ID οχήματος/κοντέινερ",
                        meaning: "Κενά, παύλες και πεζά/κεφαλαία κανονικοποιούνται (`scfu 857272-4` -> `SCFU8572724`).",
                    },
                    {
                        term: "Σύγκριση πολλαπλών διελεύσεων",
                        meaning: "Παράλληλη σύγκριση αρχικών και επαναληπτικών διελεύσεων με άμεση δημιουργία αναφοράς `VEHICLE_INCIDENT`.",
                    },
                ],
                commonPitfalls: [
                    "Αν δεν εμφανίζεται η `DemoLane02`, βεβαιωθείτε ότι η επάνω Λειτουργική προβολή δεν είναι κλειδωμένη στο `north-gate`.",
                    "Διατηρήστε το `?view=<κλειδί>` στους σελιδοδείκτες σταθμών πύλης.",
                ],
                objectiveSummary: "2 ενεργές Λειτουργικές προβολές με συσχετισμένο ιστορικό πολλαπλών διελεύσεων (`operationalViewCount >= 2 && multiPassVehicleCount >= 1`).",
            },
        },
        copySnippets: [
            {
                label: "Copy Multi-Pass Container",
                labels: {
                    es: "Copiar contenedor multipasada",
                    fr: "Copier conteneur multi-passages",
                    el: "Αντιγραφή κοντέινερ πολλαπλών διελεύσεων",
                },
                value: "SCFU8572724",
            },
        ],
        spotlights: [
            {
                id: "scoped-view",
                selector: '[data-testid="navbar-scoped-view-select"], [data-testid="navbar-scoped-view-badge"]',
                label: "Highlight Scoped View Selector",
                iconKey: "scoped-view",
            },
            {
                id: "events",
                selector: '[data-testid="nav-item-events"]',
                label: "Highlight Events Icon",
                iconKey: "events",
            },
        ],
        spotlightSelector: '[data-testid="navbar-scoped-view-select"]',
        spotlightLabel: "Highlight Scoped View Selector",
        objectiveSummary: "2 Operational Views active with correlated multi-pass container history (`operationalViewCount >= 2 && multiPassVehicleCount >= 1`).",
        isAutoVerified: (v) => v.operationalViewCount >= 2 && v.multiPassVehicleCount >= 1,
    },
    {
        id: "sup-audit",
        trackId: "supervisor",
        badge: "2.2",
        chipLabel: "Audit & Holds",
        route: "/event-log",
        pageIconKey: "events",
        videoGuideSlug: "13-event-details-adjudication-and-daily-file",
        screenshotFile: "28-event-details-summary.png",
        screenshotCaption: "Events log nested query filters, bulk adjudication controls, Event Details spectroscopy/Daily File inspection, and media retention metadata.",
        title: "Deep Event Auditing, Bulk Adjudication, Spectroscopy & Legal Holds",
        durationEstimate: "4 min",
        whyItMatters:
            "Supervisors perform quality assurance across thousands of passes — auditing EML `Code 9999` and Extended Occupancy `Code 9998` auto-dispositions, clearing routine clusters with Bulk Adjudication, inspecting raw Daily File & `.n42` evidence, and protecting critical incidents with Legal Holds.",
        steps: [
            "In Events {{icon:events}} (`/event-log`), open the filter bar and build a multi-condition filter (for example, `Adjudication Code = 9999` to audit benign EML releases, or `Adjudication Code = 1` to review confirmed SNM alarms across the seeded `DemoLane01` / `DemoLane02` dataset).",
            "Select checkboxes on multiple alarm rows to preview `Bulk Adjudication` (used for routine authorized-test sweeps or repeat non-threat convoys — NEVER bulk-clear an uninvestigated Neutron alarm).",
            "Open an Event Details page to inspect the raw RPM Daily File slice, `.n42` spectroscopy view (Log vs. Linear toggle), and understand OSCAR's evidentiary retention: 5 JPEG frames are kept for 30 days, midpoint `frame-03.jpg` + OCR crops remain for up to 365 days, and any critical incident can be frozen indefinitely from automated pruning using a **Legal Hold** (`oscar.sh archive hold` — preserved even across disk-pressure cleanup).",
        ],
        keyTerms: [
            {
                term: "Bulk Adjudication",
                meaning: "Applies one verified disposition code and shift note across multiple selected alarms at once (audited individually per occupancy).",
            },
            {
                term: "Adjudication Code Filtering",
                meaning: "Filters the full multi-year database by `Code 1–11`, custom `101+`, `Code 9999` (EML Non-Threat), `Code 9998` (Extended Occupancy), or `Unadjudicated`.",
            },
            {
                term: "Legal Hold (`archive hold`)",
                meaning: "Administrator/supervisor evidentiary lock pinning a date range or event's Parquet generations, midpoint keyframes, and OCR crops against automated pruning.",
            },
        ],
        commonPitfalls: [
            "Expecting all 5 JPEG frames on a 60-day-old alarm: after 30 days, OSCAR prunes frames 1, 2, 4, and 5 to preserve disk capacity while keeping the midpoint keyframe (`frame-03.jpg`) and all radiation/OCR/spectrum records.",
            "Remember that human adjudications are append-only audit trails — submitting a supervisor review adds a timestamped revision without erasing the original operator entry.",
        ],
        translations: {
            en: {
                chipLabel: "Audit & Holds",
                title: "Deep Event Auditing, Bulk Adjudication, Spectroscopy & Legal Holds",
                screenshotCaption: "Events log nested query filters, bulk adjudication controls, Event Details spectroscopy/Daily File inspection, and media retention metadata.",
                whyItMatters:
                    "Supervisors perform quality assurance across thousands of passes — auditing EML `Code 9999` and Extended Occupancy `Code 9998` auto-dispositions, clearing routine clusters with Bulk Adjudication, inspecting raw Daily File & `.n42` evidence, and protecting critical incidents with Legal Holds.",
                steps: [
                    "In Events {{icon:events}} (`/event-log`), open the filter bar and build a multi-condition filter (for example, `Adjudication Code = 9999` to audit benign EML releases, or `Adjudication Code = 1` to review confirmed SNM alarms across the seeded `DemoLane01` / `DemoLane02` dataset).",
                    "Select checkboxes on multiple alarm rows to preview `Bulk Adjudication` (used for routine authorized-test sweeps or repeat non-threat convoys — NEVER bulk-clear an uninvestigated Neutron alarm).",
                    "Open an Event Details page to inspect the raw RPM Daily File slice, `.n42` spectroscopy view (Log vs. Linear toggle), and understand OSCAR's evidentiary retention: 5 JPEG frames are kept for 30 days, midpoint `frame-03.jpg` + OCR crops remain for up to 365 days, and any critical incident can be frozen indefinitely from automated pruning using a **Legal Hold** (`oscar.sh archive hold` — preserved even across disk-pressure cleanup).",
                ],
                keyTerms: [
                    {
                        term: "Bulk Adjudication",
                        meaning: "Applies one verified disposition code and shift note across multiple selected alarms at once (audited individually per occupancy).",
                    },
                    {
                        term: "Adjudication Code Filtering",
                        meaning: "Filters the full multi-year database by `Code 1–11`, custom `101+`, `Code 9999` (EML Non-Threat), `Code 9998` (Extended Occupancy), or `Unadjudicated`.",
                    },
                    {
                        term: "Legal Hold (`archive hold`)",
                        meaning: "Administrator/supervisor evidentiary lock pinning a date range or event's Parquet generations, midpoint keyframes, and OCR crops against automated pruning.",
                    },
                ],
                commonPitfalls: [
                    "Expecting all 5 JPEG frames on a 60-day-old alarm: after 30 days, OSCAR prunes frames 1, 2, 4, and 5 to preserve disk capacity while keeping the midpoint keyframe (`frame-03.jpg`) and all radiation/OCR/spectrum records.",
                    "Remember that human adjudications are append-only audit trails — submitting a supervisor review adds a timestamped revision without erasing the original operator entry.",
                ],
                objectiveSummary: "Review Events filtering, Daily File / spectroscopy audit details, and retention rules (`totalOccupancies >= 3`).",
            },
            es: {
                chipLabel: "Auditoría y retención",
                title: "Auditoría avanzada, adjudicación masiva, espectroscopia y retención legal",
                screenshotCaption: "Filtros compuestos de Eventos, adjudicación masiva, inspección del archivo diario/espectros y política de retención.",
                whyItMatters:
                    "Los supervisores auditan las auto-adjudicaciones `Código 9999` y `9998`, resuelven lotes rutinarios con Adjudicación masiva, verifican evidencia espectral/archivo diario y protegen incidentes críticos con Retenciones legales.",
                steps: [
                    "En Eventos {{icon:events}} (`/event-log`), cree un filtro por Código de adjudicación (p. ej. `9999` para auditar liberaciones EML o `1` para revisar alarmas SNM confirmadas).",
                    "Marque varias filas de alarma para revisar la `Adjudicación masiva` (útil en pruebas autorizadas o convoyes repetidos; NUNCA cierre en lote una alarma de neutrones sin investigar).",
                    "Abra Detalles del evento para revisar el archivo diario RPM, el espectro `.n42` (escala Log/Lineal) y la retención probatoria: 5 JPEG durante 30 días, fotograma central `frame-03.jpg` + recortes OCR hasta 365 días, y bloqueo indefinido mediante **Retención legal** (`oscar.sh archive hold`).",
                ],
                keyTerms: [
                    {
                        term: "Adjudicación masiva",
                        meaning: "Aplica un código de disposición y nota verificada a múltiples alarmas seleccionadas dejando registro individual.",
                    },
                    {
                        term: "Filtro por Código de adjudicación",
                        meaning: "Filtra todo el histórico por `1–11`, personalizados `101+`, `9999`, `9998` o `Sin adjudicar`.",
                    },
                    {
                        term: "Retención legal (`archive hold`)",
                        meaning: "Bloqueo probatorio que protege particiones Parquet, fotogramas y recortes OCR contra cualquier depuración automática.",
                    },
                ],
                commonPitfalls: [
                    "En alarmas con más de 30 días solo queda el fotograma central `frame-03.jpg` (junto con todos los conteos, espectros y notas).",
                    "Las adjudicaciones son de solo adición: una revisión de supervisor añade una entrada fechada sin borrar el registro original.",
                ],
                objectiveSummary: "Revisar filtros compuestos, detalles probatorios y retención legal en `/event-log` (`totalOccupancies >= 3`).",
            },
            fr: {
                chipLabel: "Audit & gels",
                title: "Audit approfondi, adjudication en masse, spectroscopie et gels juridiques",
                screenshotCaption: "Filtres combinés Événements, adjudication en masse, fichier quotidien/spectroscopie et politique de conservation.",
                whyItMatters:
                    "Les superviseurs contrôlent la qualité des auto-adjudications `Code 9999` / `9998`, traitent les lots routiniers en Adjudication en masse, vérifient les preuves brutes et verrouillent les dossiers sensibles par Gel juridique.",
                steps: [
                    "Dans Événements {{icon:events}} (`/event-log`), filtrez par Code d’adjudication (ex. `9999` pour auditer EML ou `1` pour contrôler les alarmes SNM confirmées).",
                    "Cochez plusieurs lignes d’alarme pour explorer `Adjudication en masse` (réservé aux campagnes d’essais autorisées ; ne jamais clôturer en bloc une alarme Neutrons non investiguée).",
                    "Ouvrez les Détails d’un événement pour consulter le fichier quotidien RPM, le spectre `.n42` (Log/Linéaire) et la rétention : 5 JPEG pendant 30 jours, `frame-03.jpg` + vignettes OCR jusqu’à 365 jours, et gel illimité via **Gel juridique** (`oscar.sh archive hold`).",
                ],
                keyTerms: [
                    {
                        term: "Adjudication en masse",
                        meaning: "Applique un code vérifié et une note à plusieurs alarmes sélectionnées avec traçabilité individuelle.",
                    },
                    {
                        term: "Filtre par Code d’adjudication",
                        meaning: "Filtre l’historique complet par `1–11`, codes d’agence `101+`, `9999`, `9998` ou `Non adjugé`.",
                    },
                    {
                        term: "Gel juridique (`archive hold`)",
                        meaning: "Verrou probatoire empêchant la purge automatique des archives Parquet, images et vignettes OCR d’un dossier.",
                    },
                ],
                commonPitfalls: [
                    "Au-delà de 30 jours, seule l’image médiane `frame-03.jpg` est conservée (toutes les mesures et spectres restent complets).",
                    "L’historique d’adjudication est immuable : une révision superviseur s’ajoute sans effacer l’entrée initiale.",
                ],
                objectiveSummary: "Vérifier les filtres d’audit, les détails probatoires et la rétention dans `/event-log` (`totalOccupancies >= 3`).",
            },
            el: {
                chipLabel: "Έλεγχος & δέσμευση",
                title: "Εις βάθος έλεγχος συμβάντων, μαζική αξιολόγηση, φασματοσκοπία & νομική δέσμευση",
                screenshotCaption: "Σύνθετα φίλτρα Συμβάντων, μαζική αξιολόγηση, ημερήσιο αρχείο/φάσματα και πολιτική διατήρησης.",
                whyItMatters:
                    "Οι επόπτες ελέγχουν τις αυτόματες διαθέσεις `Κωδικός 9999` και `9998`, εκκαθαρίζουν ομάδες δοκιμών με Μαζική αξιολόγηση, επαληθεύουν ακατέργαστα δεδομένα και κλειδώνουν κρίσιμα περιστατικά με Νομική δέσμευση.",
                steps: [
                    "Στα Συμβάντα {{icon:events}} (`/event-log`), εφαρμόστε φίλτρο Κωδικού αξιολόγησης (π.χ. `9999` για έλεγχο EML ή `1` για επιβεβαιωμένους συναγερμούς SNM).",
                    "Επιλέξτε πολλαπλές γραμμές συναγερμού για προεπισκόπηση της `Μαζικής αξιολόγησης` (μόνο για εγκεκριμένες δοκιμές — ΠΟΤΕ μαζικό κλείσιμο ανεξέταστου συναγερμού νετρονίων).",
                    "Ανοίξτε Λεπτομέρειες συμβάντος για έλεγχο του ημερήσιου αρχείου RPM, του φάσματος `.n42` (Log/Linear) και της διατήρησης: 5 JPEG για 30 ημέρες, `frame-03.jpg` + OCR έως 365 ημέρες, και απεριόριστη προστασία με **Νομική δέσμευση** (`oscar.sh archive hold`).",
                ],
                keyTerms: [
                    {
                        term: "Μαζική αξιολόγηση",
                        meaning: "Εφαρμόζει έναν επαληθευμένο κωδικό και σημείωση σε επιλεγμένους συναγερμούς με ατομικό ίχνος ελέγχου.",
                    },
                    {
                        term: "Φιλτράρισμα Κωδικού αξιολόγησης",
                        meaning: "Αναζητά σε όλο το ιστορικό με `1–11`, `101+`, `9999`, `9998` ή `Μη αξιολογημένα`.",
                    },
                    {
                        term: "Νομική δέσμευση (`archive hold`)",
                        meaning: "Κλείδωμα αποδεικτικών στοιχείων που εξαιρεί γενιές Parquet, καρέ και περικοπές OCR από αυτόματη διαγραφή.",
                    },
                ],
                commonPitfalls: [
                    "Μετά από 30 ημέρες διατηρείται το κεντρικό καρέ `frame-03.jpg` (όλες οι μετρήσεις και φάσματα παραμένουν άθικτα).",
                    "Οι αξιολογήσεις είναι μόνο προσθήκης: η αναθεώρηση επόπτη προστίθεται χωρίς να διαγράφει την αρχική καταχώριση.",
                ],
                objectiveSummary: "Εξέταση σύνθετων φίλτρων ελέγχου, ημερήσιου αρχείου και κανόνων διατήρησης (`/event-log`, `totalOccupancies >= 3`).",
            },
        },
        spotlights: [
            {
                id: "events",
                selector: '[data-testid="nav-item-events"]',
                label: "Highlight Events Icon",
                iconKey: "events",
            },
        ],
        spotlightSelector: '[data-testid="nav-item-events"]',
        spotlightLabel: "Highlight Events Icon",
        objectiveSummary: "Review Events filtering, Daily File / spectroscopy audit details, and retention rules (`totalOccupancies >= 3`).",
        isAutoVerified: (v) => v.totalOccupancies >= 3,
    },
    {
        id: "sup-2",
        trackId: "supervisor",
        badge: "2.3",
        chipLabel: "6 Reports & UpSet",
        route: "/report",
        pageIconKey: "report",
        videoGuideSlug: "16-national-statistics-and-reports",
        screenshotFile: "40-upset-category-filters-and-other-snm.png",
        screenshotCaption: "Adjudication Report UpSet co-occurrence plot with crimson SNM highlighting and multi-format PDF/CSV/JSON/XLSX export.",
        title: "All 6 Report Types, 3 Scopes & UpSet SNM Co-Occurrence Analytics",
        durationEstimate: "5 min",
        whyItMatters:
            "Report Generator {{icon:report}} (`/report`, three-bar chart icon) turns raw radiation portal activity into executive briefings, shift audits, and multi-pass incident packages across 6 specialized report types, 3 lane scopes, and 4 export formats.",
        steps: [
            "Open Report Generator {{icon:report}} (`/report`) and know when to choose each of the **6 report types**: (1) `RDS_SITE` — executive site KPIs, alarm/EML (`9998`/`9999`) rates, faults, and storage health; (2) `LANE` — per-lane KPIs and daily trends; (3) `EVENT` — daily time-series of occupancies, alarms, or State of Health; (4) `ADJUDICATION` — `ALL_LANES` UpSet Alarm & Source-Category Co-Occurrence plot (crimson SNM bars + `Other SNM` roll-up) and disposition/isotope totals; (5) `ADJUDICATION_DETAILS` — line-by-line audit table of every adjudication; (6) `VEHICLE_INCIDENT` — consolidated multi-pass dossier for one Vehicle / Container ID.",
            "Choose a **Scope** (`Entire Node`, `Operational View`, or `Specific Lanes`) and generate an `ADJUDICATION` PDF report. Inspect the inline preview: confirm the `ALL_LANES` UpSet SNM co-occurrence chart (populated from our seeded `U-235 + Cs-137`, `Pu`, and `Tc-99m` alarms) and the sandbox watermark.",
            "Switch Export Format to **Excel (`.xlsx`)**, **CSV (`.csv`)**, or **JSON (`.json`)**, OR generate a `VEHICLE_INCIDENT` report for `SCFU8572724` to see a complete multi-pass incident package.",
        ],
        keyTerms: [
            {
                term: "UpSet SNM Co-Occurrence Chart",
                meaning: "Visualizes single and overlapping isotope categories (`SNM`, `Industrial`, `Medical`, `NORM`) with crimson SNM bars and an exact-sum `Other SNM` bucket.",
            },
            {
                term: "3 Report Scopes",
                meaning: "`Entire Node` (all authorized lanes), `Operational View` (e.g. `north-gate` only), or `Specific Lanes` (custom lane subset).",
            },
            {
                term: "4 Export Formats (`PDF`, `CSV`, `JSON`, `.xlsx`)",
                meaning: "Formatted executive `PDF`, spreadsheet-ready `CSV` and multi-tab Excel `.xlsx`, and machine-readable `JSON`.",
            },
        ],
        commonPitfalls: [
            "Re-running a report with the exact same parameters overwrites the previous cached file with fresh data — download or rename if you want to archive point-in-time snapshots.",
            "Using `ADJUDICATION` when you actually need every individual operator note and username: pick `ADJUDICATION_DETAILS` for line-by-line audit rows.",
        ],
        translations: {
            en: {
                chipLabel: "6 Reports & UpSet",
                title: "All 6 Report Types, 3 Scopes & UpSet SNM Co-Occurrence Analytics",
                screenshotCaption: "Adjudication Report UpSet co-occurrence plot with crimson SNM highlighting and multi-format PDF/CSV/JSON/XLSX export.",
                whyItMatters:
                    "Report Generator {{icon:report}} (`/report`, three-bar chart icon) turns raw radiation portal activity into executive briefings, shift audits, and multi-pass incident packages across 6 specialized report types, 3 lane scopes, and 4 export formats.",
                steps: [
                    "Open Report Generator {{icon:report}} (`/report`) and know when to choose each of the **6 report types**: (1) `RDS_SITE` — executive site KPIs, alarm/EML (`9998`/`9999`) rates, faults, and storage health; (2) `LANE` — per-lane KPIs and daily trends; (3) `EVENT` — daily time-series of occupancies, alarms, or State of Health; (4) `ADJUDICATION` — `ALL_LANES` UpSet Alarm & Source-Category Co-Occurrence plot (crimson SNM bars + `Other SNM` roll-up) and disposition/isotope totals; (5) `ADJUDICATION_DETAILS` — line-by-line audit table of every adjudication; (6) `VEHICLE_INCIDENT` — consolidated multi-pass dossier for one Vehicle / Container ID.",
                    "Choose a **Scope** (`Entire Node`, `Operational View`, or `Specific Lanes`) and generate an `ADJUDICATION` PDF report. Inspect the inline preview: confirm the `ALL_LANES` UpSet SNM co-occurrence chart (populated from our seeded `U-235 + Cs-137`, `Pu`, and `Tc-99m` alarms) and the sandbox watermark.",
                    "Switch Export Format to **Excel (`.xlsx`)**, **CSV (`.csv`)**, or **JSON (`.json`)**, OR generate a `VEHICLE_INCIDENT` report for `SCFU8572724` to see a complete multi-pass incident package.",
                ],
                keyTerms: [
                    {
                        term: "UpSet SNM Co-Occurrence Chart",
                        meaning: "Visualizes single and overlapping isotope categories (`SNM`, `Industrial`, `Medical`, `NORM`) with crimson SNM bars and an exact-sum `Other SNM` bucket.",
                    },
                    {
                        term: "3 Report Scopes",
                        meaning: "`Entire Node` (all authorized lanes), `Operational View` (e.g. `north-gate` only), or `Specific Lanes` (custom lane subset).",
                    },
                    {
                        term: "4 Export Formats (`PDF`, `CSV`, `JSON`, `.xlsx`)",
                        meaning: "Formatted executive `PDF`, spreadsheet-ready `CSV` and multi-tab Excel `.xlsx`, and machine-readable `JSON`.",
                    },
                ],
                commonPitfalls: [
                    "Re-running a report with the exact same parameters overwrites the previous cached file with fresh data — download or rename if you want to archive point-in-time snapshots.",
                    "Using `ADJUDICATION` when you actually need every individual operator note and username: pick `ADJUDICATION_DETAILS` for line-by-line audit rows.",
                ],
                objectiveSummary: "Generate at least 1 report in `/report` (`generatedReportCount >= 1`).",
            },
            es: {
                chipLabel: "6 informes y UpSet",
                title: "Los 6 tipos de informes, 3 alcances y análisis UpSet SNM",
                screenshotCaption: "Gráfico UpSet de coocurrencia en Informe de adjudicación con resaltado SNM y exportación PDF/CSV/JSON/XLSX.",
                whyItMatters:
                    "Generador de informes {{icon:report}} (`/report`) convierte la operación del portal en informes ejecutivos, auditorías y expedientes multipasada con 6 tipos de informe, 3 alcances y 4 formatos.",
                steps: [
                    "Abra Generador de informes {{icon:report}} (`/report`) y domine los **6 tipos**: (1) `RDS_SITE` — resumen ejecutivo del sitio, tasas `9998`/`9999`, fallos y disco; (2) `LANE` — KPIs y tendencia por carril; (3) `EVENT` — series diarias de pasos, alarmas o salud; (4) `ADJUDICATION` — gráfico UpSet `ALL_LANES` (barras carmesí SNM + `Other SNM`) y tablas de disposición/isótopos; (5) `ADJUDICATION_DETAILS` — auditoría fila por fila con usuario y notas; (6) `VEHICLE_INCIDENT` — expediente consolidado de un vehículo/contenedor.",
                    "Seleccione un **Alcance** (`Nodo completo`, `Vista operativa` o `Carriles específicos`) y genere un informe `ADJUDICATION` en PDF para inspeccionar el gráfico UpSet SNM y la marca de agua del entorno.",
                    "Pruebe también **Excel (`.xlsx`)**, **CSV**, **JSON** o un informe `VEHICLE_INCIDENT` para `SCFU8572724`.",
                ],
                keyTerms: [
                    {
                        term: "Gráfico UpSet de coocurrencia SNM",
                        meaning: "Muestra categorías de isótopos individuales y combinadas (`SNM`, `Industrial`, `Médico`, `NORM`) con barras SNM en carmesí.",
                    },
                    {
                        term: "3 alcances de informe",
                        meaning: "`Nodo completo`, `Vista operativa` (p. ej. solo `north-gate`) o `Carriles específicos`.",
                    },
                    {
                        term: "4 formatos (`PDF`, `CSV`, `JSON`, `.xlsx`)",
                        meaning: "Documento ejecutivo `PDF`, hojas `CSV` y Excel multihoja `.xlsx`, más carga estructurada `JSON`.",
                    },
                ],
                commonPitfalls: [
                    "Volver a generar un informe con los mismos parámetros reemplaza el archivo anterior con datos actualizados.",
                    "Para revisar cada nota individual y usuario operador, use `ADJUDICATION_DETAILS` en lugar del resumen `ADJUDICATION`.",
                ],
                objectiveSummary: "Generar al menos 1 informe en `/report` (`generatedReportCount >= 1`).",
            },
            fr: {
                chipLabel: "6 rapports & UpSet",
                title: "Les 6 types de rapports, 3 périmètres et analytique UpSet SNM",
                screenshotCaption: "Graphique UpSet de co-occurrence dans le rapport d’adjudication avec mise en avant SNM et exports PDF/CSV/JSON/XLSX.",
                whyItMatters:
                    "Générateur de rapports {{icon:report}} (`/report`) produit bilans de direction, audits et dossiers multi-passages selon 6 types de rapports, 3 périmètres et 4 formats.",
                steps: [
                    "Ouvrez Générateur de rapports {{icon:report}} (`/report`) et distinguez les **6 types** : (1) `RDS_SITE` — synthèse exécutive du site, taux `9998`/`9999`, défauts et stockage ; (2) `LANE` — KPI par voie ; (3) `EVENT` — séries quotidiennes ; (4) `ADJUDICATION` — graphique UpSet `ALL_LANES` (barres cramoisies SNM + `Other SNM`) et totaux ; (5) `ADJUDICATION_DETAILS` — audit ligne par ligne (opérateur, notes) ; (6) `VEHICLE_INCIDENT` — dossier consolidé d’un véhicule/conteneur.",
                    "Choisissez un **Périmètre** (`Nœud complet`, `Vue opérationnelle` ou `Voies spécifiques`) et générez un PDF `ADJUDICATION` pour inspecter l’aperçu UpSet SNM et le filigrane bac à sable.",
                    "Testez également **Excel (`.xlsx`)**, **CSV**, **JSON** ou un rapport `VEHICLE_INCIDENT` pour `SCFU8572724`.",
                ],
                keyTerms: [
                    {
                        term: "Graphique UpSet SNM",
                        meaning: "Visualise les catégories isotopiques simples et croisées (`SNM`, `Industriel`, `Médical`, `NORM`) avec barres SNM cramoisies.",
                    },
                    {
                        term: "3 périmètres de rapport",
                        meaning: "`Nœud complet`, `Vue opérationnelle` (ex. `north-gate`) ou `Voies spécifiques`.",
                    },
                    {
                        term: "4 formats (`PDF`, `CSV`, `JSON`, `.xlsx`)",
                        meaning: "`PDF` exécutif, `CSV` universel, classeur Excel `.xlsx` multi-onglets et `JSON` structuré.",
                    },
                ],
                commonPitfalls: [
                    "Relancer un rapport avec des paramètres identiques remplace le fichier précédent par des données fraîches.",
                    "Utilisez `ADJUDICATION_DETAILS` (et non `ADJUDICATION`) lorsque vous avez besoin de chaque note et nom d’opérateur.",
                ],
                objectiveSummary: "Générer au moins 1 rapport dans `/report` (`generatedReportCount >= 1`).",
            },
            el: {
                chipLabel: "6 αναφορές & UpSet",
                title: "Οι 6 τύποι αναφορών, 3 εμβέλειες & ανάλυση UpSet SNM",
                screenshotCaption: "Γράφημα συνύπαρξης UpSet στην Αναφορά αξιολόγησης με επισήμανση SNM και εξαγωγή PDF/CSV/JSON/XLSX.",
                whyItMatters:
                    "Η Γεννήτρια αναφορών {{icon:report}} (`/report`) παράγει επιτελικές συνόψεις, ελέγχους βάρδιας και φακέλους πολλαπλών διελεύσεων σε 6 τύπους, 3 εμβέλειες και 4 μορφές.",
                steps: [
                    "Ανοίξτε τη Γεννήτρια αναφορών {{icon:report}} (`/report`) και γνωρίστε τους **6 τύπους**: (1) `RDS_SITE` — επιτελικοί δείκτες σταθμού, ποσοστά `9998`/`9999`, βλάβες και αποθήκευση· (2) `LANE` — δείκτες ανά λωρίδα· (3) `EVENT` — ημερήσιες χρονοσειρές· (4) `ADJUDICATION` — γράφημα UpSet `ALL_LANES` (κόκκινες στήλες SNM + `Other SNM`)· (5) `ADJUDICATION_DETAILS` — αναλυτικός πίνακας ελέγχου ανά εγγραφή· (6) `VEHICLE_INCIDENT` — ενιαίος φάκελος οχήματος/κοντέινερ.",
                    "Επιλέξτε **Εμβέλεια** (`Ολόκληρος κόμβος`, `Λειτουργική προβολή` ή `Επιλεγμένες λωρίδες`) και δημιουργήστε ένα PDF `ADJUDICATION` για να δείτε το γράφημα UpSet SNM.",
                    "Δοκιμάστε εξαγωγή σε **Excel (`.xlsx`)**, **CSV**, **JSON** ή δημιουργήστε `VEHICLE_INCIDENT` για `SCFU8572724`.",
                ],
                keyTerms: [
                    {
                        term: "Γράφημα συνύπαρξης UpSet SNM",
                        meaning: "Απεικονίζει μεμονωμένες και συνδυασμένες κατηγορίες ισοτόπων (`SNM`, `Βιομηχανικά`, `Ιατρικά`, `NORM`) με κόκκινη επισήμανση SNM.",
                    },
                    {
                        term: "3 εμβέλειες αναφοράς",
                        meaning: "`Ολόκληρος κόμβος`, `Λειτουργική προβολή` ή `Επιλεγμένες λωρίδες`.",
                    },
                    {
                        term: "4 μορφές (`PDF`, `CSV`, `JSON`, `.xlsx`)",
                        meaning: "Εκτυπώσιμο `PDF`, `CSV`, βιβλίο Excel `.xlsx` πολλών φύλλων και δομημένο `JSON`.",
                    },
                ],
                commonPitfalls: [
                    "Η εκ νέου δημιουργία με τις ίδιες παραμέτρους αντικαθιστά το προηγούμενο αρχείο με ενημερωμένα δεδομένα.",
                    "Επιλέξτε `ADJUDICATION_DETAILS` όταν χρειάζεστε κάθε μεμονωμένο σχόλιο και όνομα χειριστή.",
                ],
                objectiveSummary: "Δημιουργία τουλάχιστον 1 αναφοράς στο `/report` (`generatedReportCount >= 1`).",
            },
        },
        copySnippets: [
            {
                label: "Copy Incident Vehicle ID",
                labels: {
                    es: "Copiar ID de vehículo",
                    fr: "Copier l’ID véhicule",
                    el: "Αντιγραφή ID οχήματος",
                },
                value: "SCFU8572724",
            },
        ],
        spotlights: [
            {
                id: "report",
                selector: '[data-testid="nav-item-report"]',
                label: "Highlight Report Generator Icon",
                iconKey: "report",
            },
            {
                id: "events",
                selector: '[data-testid="nav-item-events"]',
                label: "Highlight Events Icon",
                iconKey: "events",
            },
        ],
        spotlightSelector: '[data-testid="nav-item-report"]',
        spotlightLabel: "Highlight Report Generator Icon",
        objectiveSummary: "Generate at least 1 report in `/report` (`generatedReportCount >= 1`).",
        isAutoVerified: (v) => v.generatedReportCount >= 1,
    },
    {
        id: "sup-federation",
        trackId: "supervisor",
        badge: "2.4",
        chipLabel: "Federation",
        route: "/servers",
        pageIconKey: "servers",
        videoGuideSlug: "20-multi-node-federation-vehicle-search-and-report",
        screenshotFile: "41-multi-node-vehicle-search.png",
        screenshotCaption: "Multi-site OSCAR federation via Servers (/servers) powering cross-port vehicle search, linked adjudication, and unified multi-node Vehicle Incident Reports.",
        title: "Multi-Node Federation & Cross-Site Vehicle Investigation",
        durationEstimate: "4 min",
        whyItMatters:
            "When a flagged container leaves one port and arrives at another, Supervisors connect federated OSCAR nodes in Servers {{icon:servers}} (`/servers`, cloud icon) using least-privilege `oscar_fed_...` tokens to search vehicles across sites, compare transits, and record linked adjudications.",
        steps: [
            "Open Servers {{icon:servers}} (`/servers`, the cloud icon in the left navigation bar) to see how remote OSCAR sites connect: click `Add Server`, enable `HTTPS (port 443)`, choose `Authentication Method: Federation Service Token`, and paste an `oscar_fed_...` token minted on the remote site under Users & Access {{icon:users}} -> Federation Tokens (never share human admin passwords!).",
            "Know token permissions: `Viewer` tokens allow read-only National View (`/national-view`) KPIs and cross-site vehicle searches in Events {{icon:events}} (`/event-log`); `Operator` tokens also let regional analysts submit remote or **Linked Adjudications** when resolving a multi-site transit.",
            "In Events {{icon:events}} (`/event-log`), searching a Container or License Plate automatically queries BOTH local and connected federated nodes and merges matches into `Multi-Pass Vehicle Comparison` and a single multi-node `VEHICLE_INCIDENT` report in Report Generator {{icon:report}}.",
        ],
        keyTerms: [
            {
                term: "Federation Service Token (`oscar_fed_...`)",
                meaning: "Revocable Bearer/MQTT credential scoped to `Viewer` or `Operator` role for secure site-to-site linking without exposing human passwords.",
            },
            {
                term: "Linked Adjudication",
                meaning: "Records a unified disposition across correlated passes (for example, primary port alarm linked to secondary confirmation pass at another gate or node).",
            },
            {
                term: "Multi-Node `VEHICLE_INCIDENT` Report",
                meaning: "Single PDF/Excel/CSV/JSON incident package combining passes, waveforms, EML results, OCR, and adjudications across all federated nodes.",
            },
        ],
        commonPitfalls: [
            "Remote site shows unreachable when adding a server on a private enterprise PKI: ask an Administrator to upload the remote site's CA certificate in `/extensions` -> Trusted Enterprise CAs.",
            "Never mint an `Administrator` token for federation — `Viewer` (monitoring/search) or `Operator` (remote adjudication) is always sufficient.",
        ],
        translations: {
            en: {
                chipLabel: "Federation",
                title: "Multi-Node Federation & Cross-Site Vehicle Investigation",
                screenshotCaption: "Multi-site OSCAR federation via Servers (/servers) powering cross-port vehicle search, linked adjudication, and unified multi-node Vehicle Incident Reports.",
                whyItMatters:
                    "When a flagged container leaves one port and arrives at another, Supervisors connect federated OSCAR nodes in Servers {{icon:servers}} (`/servers`, cloud icon) using least-privilege `oscar_fed_...` tokens to search vehicles across sites, compare transits, and record linked adjudications.",
                steps: [
                    "Open Servers {{icon:servers}} (`/servers`, the cloud icon in the left navigation bar) to see how remote OSCAR sites connect: click `Add Server`, enable `HTTPS (port 443)`, choose `Authentication Method: Federation Service Token`, and paste an `oscar_fed_...` token minted on the remote site under Users & Access {{icon:users}} -> Federation Tokens (never share human admin passwords!).",
                    "Know token permissions: `Viewer` tokens allow read-only National View (`/national-view`) KPIs and cross-site vehicle searches in Events {{icon:events}} (`/event-log`); `Operator` tokens also let regional analysts submit remote or **Linked Adjudications** when resolving a multi-site transit.",
                    "In Events {{icon:events}} (`/event-log`), searching a Container or License Plate automatically queries BOTH local and connected federated nodes and merges matches into `Multi-Pass Vehicle Comparison` and a single multi-node `VEHICLE_INCIDENT` report in Report Generator {{icon:report}}.",
                ],
                keyTerms: [
                    {
                        term: "Federation Service Token (`oscar_fed_...`)",
                        meaning: "Revocable Bearer/MQTT credential scoped to `Viewer` or `Operator` role for secure site-to-site linking without exposing human passwords.",
                    },
                    {
                        term: "Linked Adjudication",
                        meaning: "Records a unified disposition across correlated passes (for example, primary port alarm linked to secondary confirmation pass at another gate or node).",
                    },
                    {
                        term: "Multi-Node `VEHICLE_INCIDENT` Report",
                        meaning: "Single PDF/Excel/CSV/JSON incident package combining passes, waveforms, EML results, OCR, and adjudications across all federated nodes.",
                    },
                ],
                commonPitfalls: [
                    "Remote site shows unreachable when adding a server on a private enterprise PKI: ask an Administrator to upload the remote site's CA certificate in `/extensions` -> Trusted Enterprise CAs.",
                    "Never mint an `Administrator` token for federation — `Viewer` (monitoring/search) or `Operator` (remote adjudication) is always sufficient.",
                ],
                objectiveSummary: "Review Servers (`/servers`) federation setup and cross-site vehicle correlation workflow (`onlineLaneCount >= 2`).",
            },
            es: {
                chipLabel: "Federación",
                title: "Federación multinodo e investigación de vehículos entre sedes",
                screenshotCaption: "Federación multisitio en Servidores (/servers) para búsqueda de vehículos entre puertos, adjudicación vinculada e informes multinodo.",
                whyItMatters:
                    "Cuando un contenedor señalado cruza varios puertos, los supervisores conectan nodos remotos en Servidores {{icon:servers}} (`/servers`) con tokens `oscar_fed_...` de privilegio mínimo para rastrear pasadas y emitir adjudicaciones vinculadas.",
                steps: [
                    "Abra Servidores {{icon:servers}} (`/servers`) para revisar la conexión remota: pulse `Añadir servidor`, active `HTTPS (443)`, elija `Token de servicio de federación` y pegue un token `oscar_fed_...` emitido en el sitio remoto bajo Usuarios y acceso {{icon:users}}.",
                    "Distinga roles del token: `Visor` permite Vista Nacional (`/national-view`) y búsqueda multisitio en Eventos {{icon:events}}; `Operador` además permite enviar **Adjudicaciones vinculadas**.",
                    "Al buscar un contenedor o matrícula en Eventos {{icon:events}}, OSCAR consulta simultáneamente nodos locales y federados y genera un único informe multinodo `VEHICLE_INCIDENT` en Informes {{icon:report}}.",
                ],
                keyTerms: [
                    {
                        term: "Token de federación (`oscar_fed_...`)",
                        meaning: "Credencial Bearer/MQTT revocable con rol `Visor` u `Operador` sin compartir contraseñas humanas.",
                    },
                    {
                        term: "Adjudicación vinculada",
                        meaning: "Registra una disposición unificada entre pasadas correlacionadas de distintos carriles o sitios.",
                    },
                    {
                        term: "Informe multinodo `VEHICLE_INCIDENT`",
                        meaning: "Paquete único que combina pasadas, trazas, EML, OCR y adjudicaciones de todos los nodos federados.",
                    },
                ],
                commonPitfalls: [
                    "Si un sitio remoto usa una CA corporativa privada, el administrador debe cargarla en `/extensions` -> Certificados CA confiables.",
                    "Use siempre tokens `Visor` u `Operador` (nunca contraseñas de administrador).",
                ],
                objectiveSummary: "Revisar la configuración de Servidores (`/servers`) y el flujo de investigación multinodo (`onlineLaneCount >= 2`).",
            },
            fr: {
                chipLabel: "Fédération",
                title: "Fédération multi-nœuds et enquête véhicule inter-sites",
                screenshotCaption: "Fédération multi-sites dans Serveurs (/servers) permettant la recherche inter-ports, l’adjudication liée et les rapports unifiés.",
                whyItMatters:
                    "Lorsqu’un conteneur signalé transite entre plusieurs ports, les superviseurs relient les sites distants dans Serveurs {{icon:servers}} (`/servers`) via jetons `oscar_fed_...` à moindre privilège.",
                steps: [
                    "Ouvrez Serveurs {{icon:servers}} (`/servers`) : cliquez sur `Ajouter un serveur`, cochez `HTTPS (443)`, sélectionnez `Jeton de service de fédération` et collez le jeton `oscar_fed_...` généré sur le site distant dans Utilisateurs et accès {{icon:users}}.",
                    "Distinguez les droits : un jeton `Observateur` active Vue Nationale (`/national-view`) et la recherche inter-sites ; un jeton `Opérateur` autorise aussi les **Adjudications liées**.",
                    "Dans Événements {{icon:events}} (`/event-log`), toute recherche de véhicule interroge à la fois le nœud local et les nœuds fédérés et alimente un rapport unifié `VEHICLE_INCIDENT` dans Rapports {{icon:report}}.",
                ],
                keyTerms: [
                    {
                        term: "Jeton de fédération (`oscar_fed_...`)",
                        meaning: "Identifiant Bearer/MQTT révocable (`Observateur` ou `Opérateur`) évitant tout partage de mot de passe humain.",
                    },
                    {
                        term: "Adjudication liée",
                        meaning: "Consigne une décision unifiée sur des passages corrélés entre plusieurs portiques ou sites.",
                    },
                    {
                        term: "Rapport multi-nœuds `VEHICLE_INCIDENT`",
                        meaning: "Dossier unique consolidant passages, courbes, EML, OCR et adjudications sur tous les nœuds fédérés.",
                    },
                ],
                commonPitfalls: [
                    "Site distant inaccessible derrière une AC privée : demandez à l’administrateur d’importer le certificat AC dans `/extensions`.",
                    "Ne partagez jamais un compte administrateur pour fédérer deux sites.",
                ],
                objectiveSummary: "Examiner la fédération Serveurs (`/servers`) et la recherche inter-sites (`onlineLaneCount >= 2`).",
            },
            el: {
                chipLabel: "Ομοσπονδία",
                title: "Ομοσπονδοποίηση κόμβων & διασταθμική διερεύνηση οχημάτων",
                screenshotCaption: "Ομοσπονδοποίηση πολλών σταθμών στους Κόμβους (/servers) για αναζήτηση οχημάτων, συνδεδεμένη αξιολόγηση και ενιαίες αναφορές.",
                whyItMatters:
                    "Όταν ένα επισημασμένο κοντέινερ μετακινείται μεταξύ λιμένων, οι επόπτες συνδέουν απομακρυσμένους κόμβους στους Κόμβους {{icon:servers}} (`/servers`) με διακριτικά `oscar_fed_...` ελάχιστων δικαιωμάτων.",
                steps: [
                    "Ανοίξτε τους Κόμβους {{icon:servers}} (`/servers`): πατήστε `Προσθήκη διακομιστή`, ενεργοποιήστε `HTTPS (443)`, επιλέξτε `Διακριτικό ομοσπονδίας` και επικολλήστε `oscar_fed_...` από τους Χρήστες & Πρόσβαση {{icon:users}} του απομακρυσμένου σταθμού.",
                    "Διαφορές δικαιωμάτων: το `Θεατής` ενεργοποιεί Εθνική προβολή (`/national-view`) και αναζήτηση μεταξύ σταθμών· το `Χειριστής` επιτρέπει και **Συνδεδεμένες αξιολογήσεις**.",
                    "Στα Συμβάντα {{icon:events}} (`/event-log`), η αναζήτηση οχήματος ερωτά τοπικούς και ομόσπονδους κόμβους και παράγει ενιαία αναφορά `VEHICLE_INCIDENT` στις Αναφορές {{icon:report}}.",
                ],
                keyTerms: [
                    {
                        term: "Διακριτικό ομοσπονδίας (`oscar_fed_...`)",
                        meaning: "Ανακλητό διαπιστευτήριο Bearer/MQTT (`Θεατής` ή `Χειριστής`) χωρίς κοινή χρήση κωδικών διαχειριστή.",
                    },
                    {
                        term: "Συνδεδεμένη αξιολόγηση",
                        meaning: "Ενιαία απόφαση για συσχετισμένες διελεύσεις του ίδιου οχήματος σε διαφορετικές πύλες ή σταθμούς.",
                    },
                    {
                        term: "Πολυκομβική αναφορά `VEHICLE_INCIDENT`",
                        meaning: "Ενιαίο αρχείο με όλες τις διελεύσεις, καμπύλες, EML, OCR και αξιολογήσεις από όλους τους κόμβους.",
                    },
                ],
                commonPitfalls: [
                    "Αν απομακρυσμένος σταθμός χρησιμοποιεί ιδιωτική CA, ο διαχειριστής την ανεβάζει στις `/extensions`.",
                    "Χρησιμοποιείτε πάντα διακριτικό `Θεατής` ή `Χειριστής` αντί προσωπικού κωδικού.",
                ],
                objectiveSummary: "Έλεγχος ομοσπονδοποίησης στους Κόμβους (`/servers`) και διασταθμικής αναζήτησης (`onlineLaneCount >= 2`).",
            },
        },
        spotlights: [
            {
                id: "servers",
                selector: '[data-testid="nav-item-servers"]',
                label: "Highlight Nodes (Cloud) Icon",
                iconKey: "servers",
            },
            {
                id: "events",
                selector: '[data-testid="nav-item-events"]',
                label: "Highlight Events Icon",
                iconKey: "events",
            },
        ],
        spotlightSelector: '[data-testid="nav-item-servers"]',
        spotlightLabel: "Highlight Nodes (Cloud) Icon",
        objectiveSummary: "Review Servers (`/servers`) federation setup and cross-site vehicle correlation workflow (`onlineLaneCount >= 2`).",
        isAutoVerified: (v) => v.onlineLaneCount >= 2,
    },
    {
        id: "sup-3",
        trackId: "supervisor",
        badge: "2.5",
        chipLabel: "National & Support",
        route: "/national-view",
        pageIconKey: "national",
        videoGuideSlug: "18-operator-help-and-support-bundle",
        screenshotFile: "34-viewer-help-support-bundle.png",
        screenshotCaption: "National node overview and 1-click secret-redacted Support Bundle export inside Help (?).",
        title: "National Node Summary & Secret-Redacted Support Bundles",
        durationEstimate: "3 min",
        whyItMatters:
            "Supervisors monitor cross-site KPIs in National {{icon:national}} (connected-nodes icon) and, whenever a technical or sensor anomaly needs escalation, export a 1-click diagnostic `.zip` from Help {{icon:help}} (`?`) with all passwords, tokens, cookies, and RTSP credentials automatically scrubbed (`[REDACTED]`).",
        steps: [
            "Open National {{icon:national}} (`/national-view`, the connected-nodes network icon in the left navigation bar) to compare occupancies, gamma/neutron alarms, and faults across local and federated nodes over selectable time windows.",
            "Click the top-right Help {{icon:help}} button (the circled `?` icon), open the `Manual & Video Guides` tab, and click `Export Support Bundle` to download a combined browser Flight Recorder (last 400 UI/network events) + server diagnostic `.zip`.",
            "Know the offline fallback: if the OSCAR web server cannot be reached at all, an administrator can run `sudo bash oscar.sh support-bundle` (Ubuntu) or `.\\oscar.bat support-bundle` (Windows) directly on the host — it scrubs secrets identically.",
        ],
        keyTerms: [
            {
                term: "Browser Flight Recorder",
                meaning: "Rolling in-memory log of the last 400 console/network/UI events automatically bundled inside the Support Bundle `.zip`.",
            },
            {
                term: "Automatic Secret Redaction (`[REDACTED]`)",
                meaning: "Every password, Bearer/federation token, session cookie, RTSP URI password, and TLS private key is stripped before the `.zip` is written.",
            },
        ],
        commonPitfalls: [
            "Never email raw screenshots of `.env` or `secrets/` when opening a support ticket — always attach the redacted Support Bundle `.zip` instead.",
        ],
        translations: {
            en: {
                chipLabel: "National & Support",
                title: "National Node Summary & Secret-Redacted Support Bundles",
                screenshotCaption: "National node overview and 1-click secret-redacted Support Bundle export inside Help (?).",
                whyItMatters:
                    "Supervisors monitor cross-site KPIs in National {{icon:national}} (connected-nodes icon) and, whenever a technical or sensor anomaly needs escalation, export a 1-click diagnostic `.zip` from Help {{icon:help}} (`?`) with all passwords, tokens, cookies, and RTSP credentials automatically scrubbed (`[REDACTED]`).",
                steps: [
                    "Open National {{icon:national}} (`/national-view`, the connected-nodes network icon in the left navigation bar) to compare occupancies, gamma/neutron alarms, and faults across local and federated nodes over selectable time windows.",
                    "Click the top-right Help {{icon:help}} button (the circled `?` icon), open the `Manual & Video Guides` tab, and click `Export Support Bundle` to download a combined browser Flight Recorder (last 400 UI/network events) + server diagnostic `.zip`.",
                    "Know the offline fallback: if the OSCAR web server cannot be reached at all, an administrator can run `sudo bash oscar.sh support-bundle` (Ubuntu) or `.\\oscar.bat support-bundle` (Windows) directly on the host — it scrubs secrets identically.",
                ],
                keyTerms: [
                    {
                        term: "Browser Flight Recorder",
                        meaning: "Rolling in-memory log of the last 400 console/network/UI events automatically bundled inside the Support Bundle `.zip`.",
                    },
                    {
                        term: "Automatic Secret Redaction (`[REDACTED]`)",
                        meaning: "Every password, Bearer/federation token, session cookie, RTSP URI password, and TLS private key is stripped before the `.zip` is written.",
                    },
                ],
                commonPitfalls: [
                    "Never email raw screenshots of `.env` or `secrets/` when opening a support ticket — always attach the redacted Support Bundle `.zip` instead.",
                ],
                objectiveSummary: "Supervisor 2-lane node healthy (`onlineLaneCount >= 2`).",
            },
            es: {
                chipLabel: "Nacional y soporte",
                title: "Resumen Nacional y paquetes de soporte sin secretos",
                screenshotCaption: "Resumen multinodo Nacional y exportación en 1 clic de paquete de soporte redactado en Ayuda (?).",
                whyItMatters:
                    "Los supervisores comparan sedes en Nacional {{icon:national}} y, ante cualquier anomalía técnica, descargan desde Ayuda {{icon:help}} (`?`) un `.zip` de diagnóstico con contraseñas, tokens y credenciales RTSP censurados automáticamente (`[REDACTED]`).",
                steps: [
                    "Abra Nacional {{icon:national}} (`/national-view`) para comparar ocupaciones, alarmas gamma/neutrones y fallos entre nodos locales y federados.",
                    "Pulse Ayuda {{icon:help}} (`?`), abra `Manual y videoguías` y pulse `Exportar paquete de soporte` para descargar la grabadora del navegador (últimos 400 eventos) + registros del servidor.",
                    "Si el servidor web no responde, un administrador puede ejecutar `sudo bash oscar.sh support-bundle` o `.\\oscar.bat support-bundle` localmente con el mismo borrado de secretos.",
                ],
                keyTerms: [
                    {
                        term: "Grabadora de diagnóstico del navegador",
                        meaning: "Registro en memoria de los últimos 400 eventos de interfaz y red incluido automáticamente en el paquete `.zip`.",
                    },
                    {
                        term: "Censura automática (`[REDACTED]`)",
                        meaning: "Elimina contraseñas, tokens, cookies, credenciales RTSP y claves privadas antes de crear el `.zip`.",
                    },
                ],
                commonPitfalls: [
                    "Nunca envíe archivos `.env` ni capturas de `secrets/` al soporte técnico; adjunte siempre el paquete `.zip` redactado.",
                ],
                objectiveSummary: "Nodo supervisor de 2 carriles saludable (`onlineLaneCount >= 2`).",
            },
            fr: {
                chipLabel: "National & support",
                title: "Synthèse Nationale et archives de support expurgées",
                screenshotCaption: "Vue Nationale multi-nœuds et export en 1 clic d’archive de support masquée depuis Aide (?).",
                whyItMatters:
                    "Les superviseurs comparent les sites dans National {{icon:national}} et exportent en 1 clic depuis Aide {{icon:help}} (`?`) un diagnostic `.zip` dont mots de passe, jetons et identifiants RTSP sont automatiquement masqués (`[REDACTED]`).",
                steps: [
                    "Ouvrez National {{icon:national}} (`/national-view`) pour comparer passages, alarmes gamma/neutrons et défauts entre nœuds locaux et fédérés.",
                    "Cliquez sur Aide {{icon:help}} (`?`), onglet `Manuel et guides vidéo`, puis `Exporter le dossier de support` pour combiner l’enregistreur navigateur (400 derniers événements) et les journaux serveur.",
                    "En cas d’indisponibilité du serveur web, un administrateur peut exécuter `sudo bash oscar.sh support-bundle` ou `.\\oscar.bat support-bundle` sur l’hôte.",
                ],
                keyTerms: [
                    {
                        term: "Enregistreur de diagnostic navigateur",
                        meaning: "Journal circulaire des 400 derniers événements UI/réseau joint automatiquement à l’archive `.zip`.",
                    },
                    {
                        term: "Masquage automatique (`[REDACTED]`)",
                        meaning: "Supprime mots de passe, jetons, cookies, identifiants RTSP et clés TLS avant l’écriture du `.zip`.",
                    },
                ],
                commonPitfalls: [
                    "Ne transmettez jamais `.env` ni `secrets/` au support ; envoyez uniquement l’archive `.zip` expurgée.",
                ],
                objectiveSummary: "Nœud superviseur à 2 voies sain (`onlineLaneCount >= 2`).",
            },
            el: {
                chipLabel: "Εθνική & υποστήριξη",
                title: "Εθνική σύνοψη κόμβων & πακέτα υποστήριξης με απόκρυψη μυστικών",
                screenshotCaption: "Εθνική επισκόπηση κόμβων και εξαγωγή πακέτου υποστήριξης με 1 κλικ από τη Βοήθεια (?).",
                whyItMatters:
                    "Οι επόπτες συγκρίνουν σταθμούς στην Εθνική προβολή {{icon:national}} και εξάγουν από τη Βοήθεια {{icon:help}} (`?`) διαγνωστικό `.zip` με αυτόματη απόκρυψη κωδικών, διακριτικών και RTSP (`[REDACTED]`).",
                steps: [
                    "Ανοίξτε την Εθνική προβολή {{icon:national}} (`/national-view`) για σύγκριση διελεύσεων, συναγερμών και σφαλμάτων σε τοπικούς και ομόσπονδους κόμβους.",
                    "Πατήστε Βοήθεια {{icon:help}} (`?`), καρτέλα `Εγχειρίδιο & Βιντεοοδηγοί` και `Εξαγωγή πακέτου υποστήριξης` για συνδυασμένο `.zip` καταγραφέα φυλλομετρητή (400 συμβάντα) + διακομιστή.",
                    "Αν ο διακομιστής δεν αποκρίνεται, ο διαχειριστής εκτελεί `sudo bash oscar.sh support-bundle` ή `.\\oscar.bat support-bundle` τοπικά.",
                ],
                keyTerms: [
                    {
                        term: "Καταγραφέας διαγνωστικών φυλλομετρητή",
                        meaning: "Κυκλικό ιστορικό των τελευταίων 400 συμβάντων διεπαφής/δικτύου που περιλαμβάνεται στο `.zip`.",
                    },
                    {
                        term: "Αυτόματη απόκρυψη (`[REDACTED]`)",
                        meaning: "Αφαιρεί κωδικούς, διακριτικά, cookies, RTSP και ιδιωτικά κλειδιά TLS πριν τη δημιουργία του `.zip`.",
                    },
                ],
                commonPitfalls: [
                    "Μην αποστέλλετε ποτέ ακατέργαστα αρχεία `.env` ή `secrets/` — στέλνετε μόνο το φιλτραρισμένο `.zip` υποστήριξης.",
                ],
                objectiveSummary: "Υγιής κόμβος επόπτη 2 λωρίδων (`onlineLaneCount >= 2`).",
            },
        },
        spotlights: [
            {
                id: "national",
                selector: '[data-testid="nav-item-national"]',
                label: "Highlight National Icon",
                iconKey: "national",
            },
            {
                id: "help",
                selector: '[data-testid="navbar-help-button"]',
                label: "Highlight Help (?) Icon",
                iconKey: "help",
            },
            {
                id: "servers",
                selector: '[data-testid="nav-item-servers"]',
                label: "Highlight Nodes (Cloud) Icon",
                iconKey: "servers",
            },
        ],
        spotlightSelector: '[data-testid="nav-item-national"]',
        spotlightLabel: "Highlight National Icon",
        objectiveSummary: "Supervisor 2-lane node healthy (`onlineLaneCount >= 2`).",
        isAutoVerified: (v) => v.onlineLaneCount >= 2,
    },
];
