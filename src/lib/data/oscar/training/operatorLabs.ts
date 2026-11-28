/*
 * Copyright (c) 2026. Botts Innovative Research, Inc.
 * All Rights Reserved
 */

import {
    hasSavedCustomDashboardLayout,
    TrainingLabDefinition,
} from "@/lib/data/oscar/training/types";

export const OPERATOR_TRAINING_LABS: readonly TrainingLabDefinition[] = [
    {
        id: "op-0",
        trackId: "operator",
        badge: "1.1",
        chipLabel: "Orientation",
        route: "/",
        pageIconKey: "dashboard",
        videoGuideSlug: "08-viewer-signin-language-and-nodes",
        screenshotFile: "18-viewer-dashboard.png",
        screenshotCaption: "OSCAR Viewer console layout showing the left navigation bar, top-bar Scoped View, Settings, Language, Help (?), and live Gatehouse Dashboard.",
        title: "OSCAR Fundamentals, Roles, Navigation & Shift Ergonomics",
        durationEstimate: "4 min",
        whyItMatters:
            "This walkthrough is designed so you can operate OSCAR safely without reading the full manual first. Understanding the difference between Dashboard {{icon:dashboard}} (active unadjudicated alarms only) and Events {{icon:events}} (complete occupancy history), plus how your role and shift alerts work, prevents missed alarms from minute one.",
        steps: [
            "Know your three OSCAR console roles: `Viewer` (read-only dashboards, events, maps, and reports), `Operator` (everything Viewer has plus alarm adjudication, spectrum/X-ray upload, and QR alarm transfer), and `Administrator` (full lane, user, extension, backup, and update control). If a top-bar Scoped View {{icon:scoped-view}} (`?view=<key>`) is assigned, your screens show only your assigned lanes.",
            "Learn the two core monitoring views: Dashboard {{icon:dashboard}} (`/`, four-tile grid icon) ONLY shows active, unadjudicated actionable alarms sorted by priority (`Gamma-Neutron` > `Neutron` > `Gamma`), while Events {{icon:events}} (`/event-log`, warning-triangle `!` icon) records EVERY occupancy — including Clean Passes, `Code 9999` NORM auto-releases, and `Code 9998` extended holds.",
            "Open Settings {{icon:settings}} (top-right gear icon) to configure Unread alarm banner, Latching alarm audio, Light/Dark theme, and Language {{icon:language}} (`English`, `Español`, `Français`, `Ελληνικά`). Then open Users & Access {{icon:users}} (`/users`, top-right account icon) anytime to register a personal offline Passkey (Windows Hello, Touch ID, Face ID, or YubiKey) or change your own password.",
        ],
        keyTerms: [
            {
                term: "Occupancy",
                meaning: "One complete passage of a vehicle, container, or pedestrian through a portal between entry (`GS`) and exit (`GX`).",
            },
            {
                term: "Alarm Priority (`Gamma-Neutron > Neutron > Gamma`)",
                meaning: "Combined Gamma-Neutron and Neutron alarms always rank above Gamma-only alarms and NEVER auto-clear.",
            },
            {
                term: "Adjudication",
                meaning: "The permanent, auditable record of an operator's investigation, disposition code, secondary inspection status, isotopes, and notes.",
            },
            {
                term: "Scoped View (`?view=<key>`)",
                meaning: "A named workstation filter (such as `north-gate`) that narrows Dashboard, Events, Health, Map, and Reports to assigned lanes.",
            },
        ],
        commonPitfalls: [
            "Dashboard (`/`) looks empty even though traffic is flowing: routine Clean Passes and benign `Code 9999` NORM passes intentionally stay off Dashboard so operators focus on actionable alarms. Open Events (`/event-log`) to see all traffic.",
            "Missing lanes on screen: check the top-bar Scoped View selector — your workstation or account (`allowedViews`) may be scoped to a single gate.",
        ],
        translations: {
            en: {
                chipLabel: "Orientation",
                title: "OSCAR Fundamentals, Roles, Navigation & Shift Ergonomics",
                screenshotCaption: "OSCAR Viewer console layout showing the left navigation bar, top-bar Scoped View, Settings, Language, Help (?), and live Gatehouse Dashboard.",
                whyItMatters:
                    "This walkthrough is designed so you can operate OSCAR safely without reading the full manual first. Understanding the difference between Dashboard {{icon:dashboard}} (active unadjudicated alarms only) and Events {{icon:events}} (complete occupancy history), plus how your role and shift alerts work, prevents missed alarms from minute one.",
                steps: [
                    "Know your three OSCAR console roles: `Viewer` (read-only dashboards, events, maps, and reports), `Operator` (everything Viewer has plus alarm adjudication, spectrum/X-ray upload, and QR alarm transfer), and `Administrator` (full lane, user, extension, backup, and update control). If a top-bar Scoped View {{icon:scoped-view}} (`?view=<key>`) is assigned, your screens show only your assigned lanes.",
                    "Learn the two core monitoring views: Dashboard {{icon:dashboard}} (`/`, four-tile grid icon) ONLY shows active, unadjudicated actionable alarms sorted by priority (`Gamma-Neutron` > `Neutron` > `Gamma`), while Events {{icon:events}} (`/event-log`, warning-triangle `!` icon) records EVERY occupancy — including Clean Passes, `Code 9999` NORM auto-releases, and `Code 9998` extended holds.",
                    "Open Settings {{icon:settings}} (top-right gear icon) to configure Unread alarm banner, Latching alarm audio, Light/Dark theme, and Language {{icon:language}} (`English`, `Español`, `Français`, `Ελληνικά`). Then open Users & Access {{icon:users}} (`/users`, top-right account icon) anytime to register a personal offline Passkey (Windows Hello, Touch ID, Face ID, or YubiKey) or change your own password.",
                ],
                keyTerms: [
                    {
                        term: "Occupancy",
                        meaning: "One complete passage of a vehicle, container, or pedestrian through a portal between entry (`GS`) and exit (`GX`).",
                    },
                    {
                        term: "Alarm Priority (`Gamma-Neutron > Neutron > Gamma`)",
                        meaning: "Combined Gamma-Neutron and Neutron alarms always rank above Gamma-only alarms and NEVER auto-clear.",
                    },
                    {
                        term: "Adjudication",
                        meaning: "The permanent, auditable record of an operator's investigation, disposition code, secondary inspection status, isotopes, and notes.",
                    },
                    {
                        term: "Scoped View (`?view=<key>`)",
                        meaning: "A named workstation filter (such as `north-gate`) that narrows Dashboard, Events, Health, Map, and Reports to assigned lanes.",
                    },
                ],
                commonPitfalls: [
                    "Dashboard (`/`) looks empty even though traffic is flowing: routine Clean Passes and benign `Code 9999` NORM passes intentionally stay off Dashboard so operators focus on actionable alarms. Open Events (`/event-log`) to see all traffic.",
                    "Missing lanes on screen: check the top-bar Scoped View selector — your workstation or account (`allowedViews`) may be scoped to a single gate.",
                ],
                objectiveSummary: "Review console navigation, role permissions, Settings alerts, and confirm at least 1 online lane (`onlineLaneCount >= 1`).",
            },
            es: {
                chipLabel: "Orientación",
                title: "Fundamentos de OSCAR, roles, navegación y configuración de turno",
                screenshotCaption: "Diseño de OSCAR Viewer con la barra lateral, Vista operativa superior, Configuración, Idioma, Ayuda (?) y Panel en vivo.",
                whyItMatters:
                    "Este recorrido está diseñado para que pueda operar OSCAR con seguridad sin necesidad de leer todo el manual. Distinguir entre Panel {{icon:dashboard}} (solo alarmas activas sin adjudicar) y Eventos {{icon:events}} (historial completo de pasos) evita pasar por alto alarmas desde el primer minuto.",
                steps: [
                    "Conozca los tres roles de OSCAR: `Visor` (solo lectura de paneles, eventos, mapas e informes), `Operador` (todo lo del Visor más adjudicación de alarmas, carga de espectros/rayos X y transferencia QR) y `Administrador` (control completo de carriles, usuarios, extensiones, copias y actualizaciones). Si hay una Vista operativa {{icon:scoped-view}} (`?view=<clave>`), las pantallas muestran solo sus carriles asignados.",
                    "Distinga las dos vistas principales: Panel {{icon:dashboard}} (`/`, cuadrícula de 4 mosaicos) SOLO muestra alarmas activas pendientes ordenadas por prioridad (`Gamma-Neutrones` > `Neutrones` > `Gamma`), mientras que Eventos {{icon:events}} (`/event-log`, triángulo `!`) registra TODAS las ocupaciones, incluidos pasos limpios y auto-adjudicaciones `Código 9999` y `9998`.",
                    "Abra Configuración {{icon:settings}} (engranaje superior derecho) para ajustar el aviso visual de no leídas, audio continuo, tema claro/oscuro e Idioma {{icon:language}} (`English`, `Español`, `Français`, `Ελληνικά`). En Usuarios y acceso {{icon:users}} (`/users`) puede registrar su propia llave Passkey sin conexión o cambiar su contraseña local.",
                ],
                keyTerms: [
                    {
                        term: "Ocupación (Occupancy)",
                        meaning: "Paso completo de un vehículo, contenedor o peatón por un pórtico entre entrada (`GS`) y salida (`GX`).",
                    },
                    {
                        term: "Prioridad (`Gamma-Neutrones > Neutrones > Gamma`)",
                        meaning: "Las alarmas con neutrones siempre prevalecen sobre las solo gamma y NUNCA se liberan automáticamente.",
                    },
                    {
                        term: "Adjudicación",
                        meaning: "Registro permanente y auditable de la investigación, código de disposición, inspección secundaria, isótopos y notas.",
                    },
                    {
                        term: "Vista operativa (`?view=<clave>`)",
                        meaning: "Filtro por nombre (como `north-gate`) que limita Panel, Eventos, Salud, Mapa e Informes a los carriles asignados.",
                    },
                ],
                commonPitfalls: [
                    "El Panel (`/`) aparece vacío pese al tráfico: los pasos limpios y las cargas NORM benignas (`Código 9999`) no saturan el Panel a propósito; consulte Eventos (`/event-log`) para ver todo el historial.",
                    "Faltan carriles en pantalla: compruebe el selector Vista operativa en la barra superior (`allowedViews`).",
                ],
                objectiveSummary: "Revisar navegación, roles y alertas en Configuración y confirmar al menos 1 carril en línea (`onlineLaneCount >= 1`).",
            },
            fr: {
                chipLabel: "Prise en main",
                title: "Fondamentaux OSCAR, rôles, navigation et réglages de poste",
                screenshotCaption: "Interface OSCAR Viewer : barre latérale, Vue opérationnelle, Paramètres, Langue, Aide (?) et Tableau de bord en direct.",
                whyItMatters:
                    "Ce parcours vous permet de maîtriser OSCAR sans lire l’intégralité du manuel. Distinguer le Tableau de bord {{icon:dashboard}} (alarmes actives non adjugées uniquement) des Événements {{icon:events}} (historique complet de tous les passages) évite toute confusion dès la première prise de poste.",
                steps: [
                    "Identifiez les trois rôles OSCAR : `Observateur` (lecture seule des tableaux, événements, cartes et rapports), `Opérateur` (adjudication d’alarmes, spectres/rayons X et transfert QR) et `Administrateur` (gestion des voies, utilisateurs, extensions, sauvegardes et mises à jour). Une Vue opérationnelle {{icon:scoped-view}} (`?view=<clé>`) filtre l’écran sur vos voies assignées.",
                    "Comparez les deux vues centrales : Tableau de bord {{icon:dashboard}} (`/`, grille à 4 tuiles) affiche UNIQUEMENT les alarmes actives à traiter par priorité (`Gamma-Neutrons` > `Neutrons` > `Gamma`), tandis qu’Événements {{icon:events}} (`/event-log`, triangle `!`) conserve TOUS les passages, y compris les passages propres et les auto-adjudications `Code 9999` / `9998`.",
                    "Ouvrez Paramètres {{icon:settings}} (engrenage en haut à droite) pour régler la bannière d’alarmes non lues, l’alarme sonore persistante, le thème clair/sombre et la Langue {{icon:language}}. Dans Utilisateurs et accès {{icon:users}} (`/users`), vous pouvez enregistrer votre propre Passkey hors ligne ou changer votre mot de passe.",
                ],
                keyTerms: [
                    {
                        term: "Occupation (Passage)",
                        meaning: "Traversée complète d’un véhicule, conteneur ou piéton dans un portique entre entrée (`GS`) et sortie (`GX`).",
                    },
                    {
                        term: "Priorité (`Gamma-Neutrons > Neutrons > Gamma`)",
                        meaning: "Les alarmes neutrons passent toujours devant les alarmes gamma seules et ne sont JAMAIS libérées automatiquement.",
                    },
                    {
                        term: "Adjudication",
                        meaning: "Trace permanente et vérifiable de l’examen opérateur : code de disposition, inspection secondaire, isotopes et notes.",
                    },
                    {
                        term: "Vue opérationnelle (`?view=<clé>`)",
                        meaning: "Filtre nommé (ex. `north-gate`) restreignant Tableau de bord, Événements, Santé, Carte et Rapports aux voies assignées.",
                    },
                ],
                commonPitfalls: [
                    "Le Tableau de bord (`/`) reste vide alors que des véhicules passent : les passages sans alarme et les charges NORM `Code 9999` n’apparaissent volontairement pas sur le Tableau de bord. Ouvrez Événements (`/event-log`).",
                    "Des voies n’apparaissent pas : vérifiez le sélecteur Vue opérationnelle en haut (`allowedViews`).",
                ],
                objectiveSummary: "Comprendre les rôles, la navigation et les alertes Paramètres et confirmer au moins 1 voie en ligne (`onlineLaneCount >= 1`).",
            },
            el: {
                chipLabel: "Εισαγωγή",
                title: "Βασικές αρχές OSCAR, ρόλοι, πλοήγηση & ρυθμίσεις βάρδιας",
                screenshotCaption: "Διάταξη OSCAR Viewer με αριστερή πλοήγηση, Λειτουργική προβολή, Ρυθμίσεις, Γλώσσα, Βοήθεια (?) και Πίνακα ελέγχου.",
                whyItMatters:
                    "Αυτή η καθοδήγηση σάς επιτρέπει να χειρίζεστε το OSCAR με ασφάλεια ακόμη και χωρίς να διαβάσετε όλο το εγχειρίδιο. Η διαφορά μεταξύ Πίνακα ελέγχου {{icon:dashboard}} (μόνο ενεργοί εκκρεμείς συναγερμοί) και Συμβάντων {{icon:events}} (πλήρες ιστορικό διελεύσεων) είναι θεμελιώδης από το πρώτο λεπτό.",
                steps: [
                    "Γνωρίστε τους τρεις ρόλους: `Θεατής` (μόνο ανάγνωση πινάκων, συμβάντων, χαρτών και αναφορών), `Χειριστής` (επιπλέον αξιολόγηση συναγερμών, φάσματα/ακτινογραφίες και μεταφορά QR) και `Διαχειριστής` (πλήρης διαχείριση λωρίδων, χρηστών, επεκτάσεων, αντιγράφων και ενημερώσεων). Η Λειτουργική προβολή {{icon:scoped-view}} (`?view=<κλειδί>`) περιορίζει τις οθόνες στις ανατεθειμένες λωρίδες.",
                    "Ξεχωρίστε τις δύο κύριες όψεις: ο Πίνακας ελέγχου {{icon:dashboard}} (`/`) εμφανίζει ΜΟΝΟ ενεργούς μη αξιολογημένους συναγερμούς κατά προτεραιότητα (`Γάμμα-Νετρόνια` > `Νετρόνια` > `Γάμμα`), ενώ τα Συμβάντα {{icon:events}} (`/event-log`) καταγράφουν ΚΑΘΕ διέλευση — συμπεριλαμβανομένων καθαρών διελεύσεων και αυτόματων `Κωδικών 9999 / 9998`.",
                    "Ανοίξτε τις Ρυθμίσεις {{icon:settings}} (γρανάζι επάνω δεξιά) για το πλαίσιο μη αναγνωσμένων συναγερμών, τον συνεχή ήχο συναγερμού, το θέμα και τη Γλώσσα {{icon:language}}. Στους Χρήστες & Πρόσβαση {{icon:users}} (`/users`) μπορείτε να προσθέσετε προσωπικό Passkey εκτός δικτύου ή να αλλάξετε τον κωδικό σας.",
                ],
                keyTerms: [
                    {
                        term: "Διέλευση (Occupancy)",
                        meaning: "Μία πλήρης διέλευση οχήματος, εμπορευματοκιβωτίου ή πεζού από πύλη μεταξύ εισόδου (`GS`) και εξόδου (`GX`).",
                    },
                    {
                        term: "Προτεραιότητα (`Γάμμα-Νετρόνια > Νετρόνια > Γάμμα`)",
                        meaning: "Οι συναγερμοί νετρονίων προηγούνται πάντα και ΔΕΝ εκκαθαρίζονται ποτέ αυτόματα.",
                    },
                    {
                        term: "Αξιολόγηση (Adjudication)",
                        meaning: "Μόνιμο, ελεγχόμενο αρχείο της διερεύνησης χειριστή με κωδικό διάθεσης, δευτερογενή έλεγχο, ισότοπα και σημειώσεις.",
                    },
                    {
                        term: "Λειτουργική προβολή (`?view=<κλειδί>`)",
                        meaning: "Επώνυμο φίλτρο (όπως `north-gate`) που εστιάζει όλες τις σελίδες στις ανατεθειμένες λωρίδες.",
                    },
                ],
                commonPitfalls: [
                    "Ο Πίνακας ελέγχου (`/`) φαίνεται κενός ενώ περνούν οχήματα: οι καθαρές διελεύσεις και τα καλοήθη `Κωδικός 9999` NORM μένουν σκόπιμα εκτός Πίνακα. Ανοίξτε τα Συμβάντα (`/event-log`).",
                    "Λείπουν λωρίδες από την οθόνη: ελέγξτε την επάνω Λειτουργική προβολή (`allowedViews`).",
                ],
                objectiveSummary: "Κατανόηση ρόλων, πλοήγησης και ρυθμίσεων ειδοποιήσεων με τουλάχιστον 1 ενεργή λωρίδα (`onlineLaneCount >= 1`).",
            },
        },
        spotlights: [
            {
                id: "dashboard",
                selector: '[data-testid="nav-item-dashboard"]',
                label: "Highlight Dashboard Icon",
                iconKey: "dashboard",
            },
            {
                id: "events",
                selector: '[data-testid="nav-item-events"]',
                label: "Highlight Events Icon",
                iconKey: "events",
            },
            {
                id: "settings",
                selector: '[data-testid="navbar-settings-button"]',
                label: "Highlight Settings Gear Icon",
                iconKey: "settings",
            },
            {
                id: "users",
                selector: '[data-testid="nav-item-users"], [data-testid="navbar-user-account-btn"]',
                label: "Highlight Users & Access Icon",
                iconKey: "users",
            },
        ],
        spotlightSelector: '[data-testid="nav-item-dashboard"]',
        spotlightLabel: "Highlight Dashboard Icon",
        objectiveSummary: "Review console navigation, role permissions, Settings alerts, and confirm at least 1 online lane (`onlineLaneCount >= 1`).",
        isAutoVerified: (v) => v.onlineLaneCount >= 1,
    },
    {
        id: "op-1",
        trackId: "operator",
        badge: "1.2",
        chipLabel: "Health & Faults",
        route: "/health",
        pageIconKey: "health",
        videoGuideSlug: "15-status-of-health-and-site-map",
        screenshotFile: "18-viewer-dashboard.png",
        screenshotCaption: "Live Dashboard & Status of Health showing Online RPM/camera tiles and active detector fault indicators.",
        title: "Live Lane Monitoring, Status of Health & Fault Triage",
        durationEstimate: "3 min",
        whyItMatters:
            "Before trusting clean portal passes, operators must check Status of Health {{icon:health}} (the heart-pulse monitor icon) and Dashboard {{icon:dashboard}} (the four-tile grid icon) to confirm both the RPM and lane camera are Online with zero active Gamma High/Low, Neutron High, or Tamper faults.",
        steps: [
            "Open Status of Health {{icon:health}} (`/health`, the heart-pulse monitor icon in the left navigation bar) or Dashboard {{icon:dashboard}} (`/`, the four-tile grid icon) and confirm `DemoLane01` shows Online for both the Rapiscan RPM and camera — or click Help {{icon:help}} (the circled `?` icon in the top-right bar) anytime for quick reference.",
            "Click 'Inject Gamma High Fault' or 'Inject Tamper Alarm' below and watch Status of Health {{icon:health}} immediately flag the red detector fault badge (and understand that a faulted lane CANNOT safely clear vehicles until inspected or cleared).",
            "Click 'Clear Faults' to restore normal background (`GB` / `TC`), then click 'Inject Clean Pass' to stream a ~4s non-alarm vehicle pass and verify it appears at row #1 of Events {{icon:events}} (`/event-log`) with Status `None` (without interrupting the Dashboard alarm queue).",
        ],
        keyTerms: [
            {
                term: "Gamma High / Gamma Low (`GH` / `GL`)",
                meaning: "Background gamma rate rose above or dropped below safe operating limits (sensor drift, shielding obstruction, or failing PMT).",
            },
            {
                term: "Neutron High (`NH`)",
                meaning: "Abnormally elevated neutron background indicating electronic noise or an unshielded source near the portal.",
            },
            {
                term: "Tamper (`TT` / `TC`)",
                meaning: "Cabinet door opened or enclosure switch triggered (`TT`); `TC` clears the tamper once secured and acknowledged.",
            },
            {
                term: "Waiting vs. Offline",
                meaning: "`Waiting` means the lane is connecting or awaiting its first frame; `Offline` means the TCP/RTSP link dropped and needs attention.",
            },
        ],
        commonPitfalls: [
            "Injecting 'Clean Pass' opens Events (`/event-log`) instead of Dashboard (`/`): that is expected because routine non-alarm passages never clutter the active Dashboard alarm queue.",
            "Seeing `Fault - Extended Occupancy` on a healthy lane: a truck parked or crept inside the portal beyond `extendedOccupancyThresholdMinutes` (default 1 min); it clears automatically once the lane empties.",
        ],
        translations: {
            en: {
                chipLabel: "Health & Faults",
                title: "Live Lane Monitoring, Status of Health & Fault Triage",
                screenshotCaption: "Live Dashboard & Status of Health showing Online RPM/camera tiles and active detector fault indicators.",
                whyItMatters:
                    "Before trusting clean portal passes, operators must check Status of Health {{icon:health}} (the heart-pulse monitor icon) and Dashboard {{icon:dashboard}} (the four-tile grid icon) to confirm both the RPM and lane camera are Online with zero active Gamma High/Low, Neutron High, or Tamper faults.",
                steps: [
                    "Open Status of Health {{icon:health}} (`/health`, the heart-pulse monitor icon in the left navigation bar) or Dashboard {{icon:dashboard}} (`/`, the four-tile grid icon) and confirm `DemoLane01` shows Online for both the Rapiscan RPM and camera — or click Help {{icon:help}} (the circled `?` icon in the top-right bar) anytime for quick reference.",
                    "Click 'Inject Gamma High Fault' or 'Inject Tamper Alarm' below and watch Status of Health {{icon:health}} immediately flag the red detector fault badge (and understand that a faulted lane CANNOT safely clear vehicles until inspected or cleared).",
                    "Click 'Clear Faults' to restore normal background (`GB` / `TC`), then click 'Inject Clean Pass' to stream a ~4s non-alarm vehicle pass and verify it appears at row #1 of Events {{icon:events}} (`/event-log`) with Status `None` (without interrupting the Dashboard alarm queue).",
                ],
                keyTerms: [
                    {
                        term: "Gamma High / Gamma Low (`GH` / `GL`)",
                        meaning: "Background gamma rate rose above or dropped below safe operating limits (sensor drift, shielding obstruction, or failing PMT).",
                    },
                    {
                        term: "Neutron High (`NH`)",
                        meaning: "Abnormally elevated neutron background indicating electronic noise or an unshielded source near the portal.",
                    },
                    {
                        term: "Tamper (`TT` / `TC`)",
                        meaning: "Cabinet door opened or enclosure switch triggered (`TT`); `TC` clears the tamper once secured and acknowledged.",
                    },
                    {
                        term: "Waiting vs. Offline",
                        meaning: "`Waiting` means the lane is connecting or awaiting its first frame; `Offline` means the TCP/RTSP link dropped and needs attention.",
                    },
                ],
                commonPitfalls: [
                    "Injecting 'Clean Pass' opens Events (`/event-log`) instead of Dashboard (`/`): that is expected because routine non-alarm passages never clutter the active Dashboard alarm queue.",
                    "Seeing `Fault - Extended Occupancy` on a healthy lane: a truck parked or crept inside the portal beyond `extendedOccupancyThresholdMinutes` (default 1 min); it clears automatically once the lane empties.",
                ],
                objectiveSummary: "At least 1 lane online and 1 occupancy recorded (`onlineLaneCount >= 1 && totalOccupancies >= 1`).",
            },
            es: {
                chipLabel: "Salud y fallos",
                title: "Monitoreo en vivo, Estado de salud y triaje de fallos",
                screenshotCaption: "Panel y Estado de salud mostrando RPM/cámaras En línea e indicadores de fallos del detector.",
                whyItMatters:
                    "Antes de confiar en pasos limpios, debe comprobar Estado de salud {{icon:health}} (monitor de pulso cardíaco) y Panel {{icon:dashboard}} (cuadrícula de 4 mosaicos) para confirmar que tanto el RPM como la cámara están En línea y sin fallos activos.",
                steps: [
                    "Abra Estado de salud {{icon:health}} (`/health`) o Panel {{icon:dashboard}} (`/`) y confirme que `DemoLane01` aparece En línea para el RPM y la cámara — o abra Ayuda {{icon:help}} (`?`) en cualquier momento.",
                    "Pulse 'Inyectar fallo Gamma Alto' o 'Inyectar alarma de manipulación' abajo y observe cómo Estado de salud {{icon:health}} marca al instante la insignia roja (un carril con fallo NO debe liberar vehículos sin revisión).",
                    "Pulse 'Limpiar fallos' para restablecer el fondo normal (`GB` / `TC`) y luego 'Inyectar paso limpio' (~4 s) para comprobar que aparece en la fila 1 de Eventos {{icon:events}} (`/event-log`) con estado `Ninguno`.",
                ],
                keyTerms: [
                    {
                        term: "Gamma Alto / Bajo (`GH` / `GL`)",
                        meaning: "El fondo gamma superó o cayó por debajo de los límites seguros (deriva del sensor, obstrucción o fallo del detector).",
                    },
                    {
                        term: "Neutrones Alto (`NH`)",
                        meaning: "Fondo de neutrones anormalmente elevado por ruido electrónico o una fuente cercana al pórtico.",
                    },
                    {
                        term: "Manipulación (`TT` / `TC`)",
                        meaning: "Apertura de gabinete o interruptor de seguridad (`TT`); `TC` indica cierre y restablecimiento.",
                    },
                    {
                        term: "Esperando frente a Sin conexión",
                        meaning: "`Esperando` indica conexión inicial en curso; `Sin conexión` indica corte real del enlace TCP o RTSP.",
                    },
                ],
                commonPitfalls: [
                    "'Inyectar paso limpio' abre Eventos (`/event-log`) y no Panel (`/`): el tráfico normal nunca interrumpe la cola de alarmas del Panel.",
                    "`Fault - Extended Occupancy` en un carril sano significa que un vehículo permaneció detenido demasiado tiempo dentro del pórtico; se despeja al salir.",
                ],
                objectiveSummary: "Al menos 1 carril en línea y 1 ocupación registrada (`onlineLaneCount >= 1 && totalOccupancies >= 1`).",
            },
            fr: {
                chipLabel: "Santé & défauts",
                title: "Surveillance en direct, État de santé et tri des défauts",
                screenshotCaption: "Tableau de bord et État de santé affichant les RPM/caméras En ligne et les badges de défauts actifs.",
                whyItMatters:
                    "Avant de valider des passages sans alarme, l’opérateur vérifie État de santé {{icon:health}} (moniteur de pouls) et Tableau de bord {{icon:dashboard}} (grille 4 tuiles) pour confirmer que le RPM et la caméra sont En ligne sans défaut Gamma/Neutrons ni sabotage.",
                steps: [
                    "Ouvrez État de santé {{icon:health}} (`/health`) ou Tableau de bord {{icon:dashboard}} (`/`) et vérifiez que `DemoLane01` est En ligne pour le RPM et la caméra — cliquez sur Aide {{icon:help}} (`?`) à tout moment.",
                    "Cliquez sur « Injecter défaut Gamma haut » ou « Injecter alarme sabotage » ci-dessous et observez le badge rouge apparaître immédiatement dans État de santé {{icon:health}} (une voie en défaut ne doit pas libérer de véhicules sans vérification).",
                    "Cliquez sur « Effacer les défauts » pour rétablir le bruit de fond (`GB` / `TC`), puis « Injecter passage propre » (~4 s) et vérifiez la ligne n° 1 d’Événements {{icon:events}} (`/event-log`) sans perturber le Tableau de bord.",
                ],
                keyTerms: [
                    {
                        term: "Gamma haut / bas (`GH` / `GL`)",
                        meaning: "Bruit de fond gamma hors plage de sécurité (dérive capteur, blindage ou défaut détecteur).",
                    },
                    {
                        term: "Neutrons haut (`NH`)",
                        meaning: "Bruit de fond neutrons anormalement élevé (parasite électronique ou source à proximité).",
                    },
                    {
                        term: "Sabotage (`TT` / `TC`)",
                        meaning: "Ouverture d’armoire ou contacteur déclenché (`TT`) ; `TC` indique le retour à la normale.",
                    },
                    {
                        term: "En attente vs Hors ligne",
                        meaning: "`En attente` signale une initialisation en cours ; `Hors ligne` signale une coupure TCP ou RTSP.",
                    },
                ],
                commonPitfalls: [
                    "« Injecter passage propre » ouvre Événements (`/event-log`) plutôt que Tableau de bord (`/`) : les passages sans alarme ne remplissent jamais la file d’alarmes.",
                    "`Fault - Extended Occupancy` sur une voie saine indique un véhicule immobilisé trop longtemps dans le portique ; il disparaît dès la sortie.",
                ],
                objectiveSummary: "Au moins 1 voie en ligne et 1 passage enregistré (`onlineLaneCount >= 1 && totalOccupancies >= 1`).",
            },
            el: {
                chipLabel: "Υγεία & βλάβες",
                title: "Ζωντανή παρακολούθηση, Κατάσταση υγείας & διαλογή σφαλμάτων",
                screenshotCaption: "Πίνακας ελέγχου και Κατάσταση υγείας με συνδεδεμένες πύλες RPM/κάμερες και ενδείξεις σφαλμάτων.",
                whyItMatters:
                    "Πριν εμπιστευτείτε καθαρές διελεύσεις, ελέγξτε την Κατάσταση υγείας {{icon:health}} (παλμογράφος) και τον Πίνακα ελέγχου {{icon:dashboard}} για να επιβεβαιώσετε ότι RPM και κάμερα είναι Σε σύνδεση χωρίς ενεργά σφάλματα ή παραβίαση.",
                steps: [
                    "Ανοίξτε την Κατάσταση υγείας {{icon:health}} (`/health`) ή τον Πίνακα ελέγχου {{icon:dashboard}} (`/`) και βεβαιωθείτε ότι η `DemoLane01` είναι Σε σύνδεση — πατήστε Βοήθεια {{icon:help}} (`?`) όποτε χρειαστεί.",
                    "Πατήστε «Έγχυση σφάλματος Gamma High» ή «Έγχυση συναγερμού παραβίασης» παρακάτω και παρατηρήστε την άμεση κόκκινη ένδειξη στην Κατάσταση υγείας {{icon:health}} (μία λωρίδα με σφάλμα δεν πρέπει να εκκαθαρίζει οχήματα χωρίς έλεγχο).",
                    "Πατήστε «Εκκαθάριση σφαλμάτων» για επαναφορά υποβάθρου (`GB` / `TC`) και έπειτα «Έγχυση καθαρής διέλευσης» (~4 δευτ.) και επιβεβαιώστε την εγγραφή στη γραμμή 1 των Συμβάντων {{icon:events}} (`/event-log`).",
                ],
                keyTerms: [
                    {
                        term: "Gamma High / Low (`GH` / `GL`)",
                        meaning: "Ο ρυθμός υποβάθρου γάμμα βγήκε εκτός ασφαλών ορίων (απόκλιση αισθητήρα, θωράκιση ή βλάβη).",
                    },
                    {
                        term: "Neutron High (`NH`)",
                        meaning: "Ασυνήθιστα υψηλό υπόβαθρο νετρονίων λόγω ηλεκτρονικού θορύβου ή κοντινής πηγής.",
                    },
                    {
                        term: "Παραβίαση (`TT` / `TC`)",
                        meaning: "Άνοιγμα καμπίνας ή ενεργοποίηση αισθητήρα ασφαλείας (`TT`)· το `TC` επαναφέρει την κατάσταση.",
                    },
                    {
                        term: "Αναμονή έναντι Εκτός σύνδεσης",
                        meaning: "`Αναμονή` σημαίνει αρχική σύνδεση· `Εκτός σύνδεσης` σημαίνει διακοπή TCP ή RTSP.",
                    },
                ],
                commonPitfalls: [
                    "Η «Καθαρή διέλευση» ανοίγει τα Συμβάντα (`/event-log`) αντί του Πίνακα ελέγχου (`/`): οι κανονικές διελεύσεις δεν γεμίζουν τη λίστα συναγερμών.",
                    "Το `Fault - Extended Occupancy` εμφανίζεται όταν όχημα μείνει σταθμευμένο εντός της πύλης· καθαρίζει μόλις εξέλθει.",
                ],
                objectiveSummary: "Τουλάχιστον 1 λωρίδα σε σύνδεση και 1 καταγεγραμμένη διέλευση (`onlineLaneCount >= 1 && totalOccupancies >= 1`).",
            },
        },
        injectActions: [
            {
                scenario: "fault_gamma_high",
                label: "Inject Gamma High Fault",
                labels: {
                    es: "Inyectar fallo Gamma Alto",
                    fr: "Injecter défaut Gamma haut",
                    el: "Έγχυση σφάλματος Gamma High",
                },
            },
            {
                scenario: "fault_tamper",
                label: "Inject Tamper Alarm",
                labels: {
                    es: "Inyectar alarma de manipulación",
                    fr: "Injecter alarme sabotage",
                    el: "Έγχυση συναγερμού παραβίασης",
                },
            },
            {
                scenario: "clear_faults",
                label: "Clear Faults",
                labels: {
                    es: "Limpiar fallos",
                    fr: "Effacer les défauts",
                    el: "Εκκαθάριση σφαλμάτων",
                },
            },
            {
                scenario: "clean_pass",
                label: "Inject Clean Pass",
                labels: {
                    es: "Inyectar paso limpio",
                    fr: "Injecter passage propre",
                    el: "Έγχυση καθαρής διέλευσης",
                },
            },
        ],
        spotlights: [
            {
                id: "health",
                selector: '[data-testid="nav-item-health"]',
                label: "Highlight Status of Health Icon",
                iconKey: "health",
            },
            {
                id: "dashboard",
                selector: '[data-testid="nav-item-dashboard"]',
                label: "Highlight Dashboard Icon",
                iconKey: "dashboard",
            },
            {
                id: "help",
                selector: '[data-testid="navbar-help-button"]',
                label: "Highlight Help (?) Icon",
                iconKey: "help",
            },
        ],
        spotlightSelector: '[data-testid="nav-item-health"]',
        spotlightLabel: "Highlight Status of Health Icon",
        objectiveSummary: "At least 1 lane online and 1 occupancy recorded (`onlineLaneCount >= 1 && totalOccupancies >= 1`).",
        isAutoVerified: (v) => v.onlineLaneCount >= 1 && v.totalOccupancies >= 1,
    },
    {
        id: "op-lane-map",
        trackId: "operator",
        badge: "1.3",
        chipLabel: "Live Lane & Map",
        route: "/lane-view",
        pageIconKey: "map",
        videoGuideSlug: "11-live-lane-video-and-charts",
        screenshotFile: "57-mobile-detector-map-and-lane-view.png",
        screenshotCaption: "Live Lane View waveforms and camera feed paired with georeferenced fixed lanes and roving Mobile Detector GPS trails on Map (/map).",
        title: "Live Lane Waveforms, Accessibility Plots, Site Map & Mobile Patrols",
        durationEstimate: "4 min",
        whyItMatters:
            "When investigating an active pass or tracking roving radiation walkers (`RS-350` / `Kromek D5`), Lane View (`/lane-view`) lets you inspect synchronized 1 Hz gamma/neutron curves, live HLS camera feeds, and raw Daily File lines, while Map {{icon:map}} (`/map`) shows every fixed portal and mobile GPS trail at a glance.",
        steps: [
            "Open Lane View (`/lane-view`, or click any lane tile on Dashboard {{icon:dashboard}}) and inject a live Gamma Alarm below so you can watch the 1 Hz Gamma/Neutron count-rate curves spike above the NSIGMA threshold alongside the live HLS camera stream.",
            "Toggle `Show Individual Detectors` to see which pillar panel (`G1–G4` / `N1–N2`) saw the highest count (useful for pinpointing source location on the truck), and test `Separate Plots (Accessibility)` when you prefer stacked single-axis charts instead of overlaid curves. Scroll down to read live raw Daily File lines (`GB`, `GS`, `GA`, `GX`).",
            "Open Map {{icon:map}} (`/map`, the map-pin icon in the left navigation bar) to inspect georeferenced portal pins (color-coded green/red/orange by live state), switch offline `.pmtiles` or uploaded Site Diagram layers, and click any roving Mobile Detector patrol (`RS-350` / `Kromek D5`) to follow its GPS breadcrumb trail, hotspot markers, and 1,024-channel gamma spectrum in `/lane-view`.",
        ],
        keyTerms: [
            {
                term: "CPS & NSIGMA (N-Sigma)",
                meaning: "`CPS` is raw Counts Per Second; `NSIGMA` measures how many standard deviations above recent background the gamma rate rose.",
            },
            {
                term: "Daily File Codes (`GB`, `GS`, `GC`, `GA`, `NS`, `GX`)",
                meaning: "`GB` = gamma background, `GS` = occupancy start, `GC` = gamma counts, `GA`/`NS` = gamma/neutron alarm, `GX` = occupancy exit.",
            },
            {
                term: "Separate Plots (Accessibility)",
                meaning: "Splits combined multi-detector traces into stacked, high-contrast charts so operators with color-vision differences read every spike effortlessly.",
            },
            {
                term: "Mobile Detector Patrol (`RS-350` / `Kromek D5`)",
                meaning: "Roving backpack or handheld unit publishing live GPS trails on `/map` and 1,024-channel spectra + dose rate in `/lane-view` (with `Indoor / GPS unavailable` fallback).",
            },
        ],
        commonPitfalls: [
            "Camera pane appears black for 1–2 seconds when first opening `/lane-view`: HLS streams warm up from the nearest 1 s keyframe; wait briefly rather than refreshing the browser.",
            "Mobile patrol shows `Indoor / GPS unavailable`: the detector is still streaming live radiation counts and 1,024-channel spectra even without satellite lock.",
        ],
        translations: {
            en: {
                chipLabel: "Live Lane & Map",
                title: "Live Lane Waveforms, Accessibility Plots, Site Map & Mobile Patrols",
                screenshotCaption: "Live Lane View waveforms and camera feed paired with georeferenced fixed lanes and roving Mobile Detector GPS trails on Map (/map).",
                whyItMatters:
                    "When investigating an active pass or tracking roving radiation walkers (`RS-350` / `Kromek D5`), Lane View (`/lane-view`) lets you inspect synchronized 1 Hz gamma/neutron curves, live HLS camera feeds, and raw Daily File lines, while Map {{icon:map}} (`/map`) shows every fixed portal and mobile GPS trail at a glance.",
                steps: [
                    "Open Lane View (`/lane-view`, or click any lane tile on Dashboard {{icon:dashboard}}) and inject a live Gamma Alarm below so you can watch the 1 Hz Gamma/Neutron count-rate curves spike above the NSIGMA threshold alongside the live HLS camera stream.",
                    "Toggle `Show Individual Detectors` to see which pillar panel (`G1–G4` / `N1–N2`) saw the highest count (useful for pinpointing source location on the truck), and test `Separate Plots (Accessibility)` when you prefer stacked single-axis charts instead of overlaid curves. Scroll down to read live raw Daily File lines (`GB`, `GS`, `GA`, `GX`).",
                    "Open Map {{icon:map}} (`/map`, the map-pin icon in the left navigation bar) to inspect georeferenced portal pins (color-coded green/red/orange by live state), switch offline `.pmtiles` or uploaded Site Diagram layers, and click any roving Mobile Detector patrol (`RS-350` / `Kromek D5`) to follow its GPS breadcrumb trail, hotspot markers, and 1,024-channel gamma spectrum in `/lane-view`.",
                ],
                keyTerms: [
                    {
                        term: "CPS & NSIGMA (N-Sigma)",
                        meaning: "`CPS` is raw Counts Per Second; `NSIGMA` measures how many standard deviations above recent background the gamma rate rose.",
                    },
                    {
                        term: "Daily File Codes (`GB`, `GS`, `GC`, `GA`, `NS`, `GX`)",
                        meaning: "`GB` = gamma background, `GS` = occupancy start, `GC` = gamma counts, `GA`/`NS` = gamma/neutron alarm, `GX` = occupancy exit.",
                    },
                    {
                        term: "Separate Plots (Accessibility)",
                        meaning: "Splits combined multi-detector traces into stacked, high-contrast charts so operators with color-vision differences read every spike effortlessly.",
                    },
                    {
                        term: "Mobile Detector Patrol (`RS-350` / `Kromek D5`)",
                        meaning: "Roving backpack or handheld unit publishing live GPS trails on `/map` and 1,024-channel spectra + dose rate in `/lane-view` (with `Indoor / GPS unavailable` fallback).",
                    },
                ],
                commonPitfalls: [
                    "Camera pane appears black for 1–2 seconds when first opening `/lane-view`: HLS streams warm up from the nearest 1 s keyframe; wait briefly rather than refreshing the browser.",
                    "Mobile patrol shows `Indoor / GPS unavailable`: the detector is still streaming live radiation counts and 1,024-channel spectra even without satellite lock.",
                ],
                objectiveSummary: "Inspect live 1 Hz waveforms, camera stream, and site/patrol positions across `/lane-view` and `/map` (`onlineLaneCount >= 1`).",
            },
            es: {
                chipLabel: "Carril y mapa",
                title: "Curvas en vivo, gráficos accesibles, Mapa del sitio y patrullas móviles",
                screenshotCaption: "Vista de carril con curvas en vivo y vídeo junto a carriles fijos y rutas GPS de detectores móviles en Mapa (/map).",
                whyItMatters:
                    "Para examinar un paso activo o seguir patrullas móviles (`RS-350` / `Kromek D5`), Vista de carril (`/lane-view`) muestra trazas gamma/neutrones a 1 Hz, vídeo HLS en vivo y líneas del archivo diario, mientras Mapa {{icon:map}} (`/map`) muestra todos los pórticos y trazas GPS.",
                steps: [
                    "Abra Vista de carril (`/lane-view` o pulse cualquier carril en Panel {{icon:dashboard}}) e inyecte abajo una Alarma Gamma para ver en vivo el pico gamma/neutrones sobre el umbral NSIGMA junto al vídeo HLS.",
                    "Active `Mostrar detectores individuales` para identificar qué panel (`G1–G4` / `N1–N2`) registró el pico más alto y pruebe `Gráficos separados (Accesibilidad)` para trazas apiladas de alto contraste. Revise abajo las líneas del archivo diario (`GB`, `GS`, `GA`, `GX`).",
                    "Abra Mapa {{icon:map}} (`/map`) para ver marcadores georreferenciados en vivo, cambiar entre capas `.pmtiles` sin conexión o plano del sitio, y seguir patrullas móviles (`RS-350` / `Kromek D5`) con su rastro GPS y espectro de 1.024 canales en `/lane-view`.",
                ],
                keyTerms: [
                    {
                        term: "CPS y NSIGMA",
                        meaning: "`CPS` son conteos por segundo; `NSIGMA` mide cuántas desviaciones estándar supera la lectura al fondo reciente.",
                    },
                    {
                        term: "Códigos de archivo diario (`GB`, `GS`, `GA`, `NS`, `GX`)",
                        meaning: "`GB` = fondo, `GS` = inicio de ocupación, `GA`/`NS` = alarma gamma/neutrones, `GX` = salida.",
                    },
                    {
                        term: "Gráficos separados (Accesibilidad)",
                        meaning: "Separa las trazas de cada detector en gráficos individuales apilados de alto contraste.",
                    },
                    {
                        term: "Patrulla móvil (`RS-350` / `Kromek D5`)",
                        meaning: "Unidad portátil con ruta GPS en vivo en `/map` y espectro de 1.024 canales en `/lane-view` (aun en interiores sin GPS).",
                    },
                ],
                commonPitfalls: [
                    "El vídeo tarda 1–2 segundos en aparecer al abrir `/lane-view`: el flujo HLS se engancha al siguiente fotograma clave de 1 s; no hace falta recargar.",
                    "Si una patrulla indica `Interior / GPS no disponible`, sigue transmitiendo conteos y espectro de 1.024 canales con normalidad.",
                ],
                objectiveSummary: "Inspeccionar curvas en vivo de 1 Hz, vídeo y posiciones en `/lane-view` y `/map` (`onlineLaneCount >= 1`).",
            },
            fr: {
                chipLabel: "Voie & carte",
                title: "Courbes en direct, graphiques accessibles, Carte et patrouilles mobiles",
                screenshotCaption: "Vue de voie en direct avec courbes et vidéo associée aux portiques fixes et traces GPS mobiles sur Carte (/map).",
                whyItMatters:
                    "Pour analyser un passage en cours ou suivre des patrouilles mobiles (`RS-350` / `Kromek D5`), Vue de voie (`/lane-view`) affiche les courbes gamma/neutrons à 1 Hz, le flux HLS et le fichier quotidien brut, tandis que Carte {{icon:map}} (`/map`) présente tous les portiques et traces GPS.",
                steps: [
                    "Ouvrez Vue de voie (`/lane-view` ou cliquez sur une tuile du Tableau de bord {{icon:dashboard}}) puis injectez une Alarme Gamma ci-dessous pour observer le pic au-dessus du seuil NSIGMA avec la vidéo HLS en direct.",
                    "Activez `Afficher les détecteurs individuels` pour repérer le panneau (`G1–G4` / `N1–N2`) le plus sollicité et testez `Graphiques séparés (Accessibilité)` pour des courbes empilées à fort contraste. Parcourez les lignes brutes (`GB`, `GS`, `GA`, `GX`).",
                    "Ouvrez Carte {{icon:map}} (`/map`) pour consulter les marqueurs géoréférencés, basculer entre fond hors ligne `.pmtiles` et plan de site, et cliquer sur une patrouille mobile (`RS-350` / `Kromek D5`) pour voir sa trace GPS et son spectre 1 024 canaux.",
                ],
                keyTerms: [
                    {
                        term: "CPS & NSIGMA",
                        meaning: "`CPS` = coups par seconde ; `NSIGMA` = nombre d’écarts-types au-dessus du bruit de fond récent.",
                    },
                    {
                        term: "Codes du fichier quotidien (`GB`, `GS`, `GA`, `NS`, `GX`)",
                        meaning: "`GB` = fond, `GS` = entrée, `GA`/`NS` = alarme gamma/neutrons, `GX` = sortie.",
                    },
                    {
                        term: "Graphiques séparés (Accessibilité)",
                        meaning: "Sépare les courbes superposées en graphiques empilés lisibles pour les déficiences visuelles des couleurs.",
                    },
                    {
                        term: "Patrouille mobile (`RS-350` / `Kromek D5`)",
                        meaning: "Détecteur portable diffusant sa trace GPS sur `/map` et un spectre 1 024 canaux dans `/lane-view` (avec mode intérieur sans GPS).",
                    },
                ],
                commonPitfalls: [
                    "Écran vidéo noir 1 à 2 s à l’ouverture de `/lane-view` : le flux HLS démarre sur l’image-clé suivante ; attendez un instant sans recharger.",
                    "Statut `Intérieur / GPS indisponible` sur une patrouille : les mesures radiologiques et le spectre 1 024 canaux restent actifs.",
                ],
                objectiveSummary: "Explorer les courbes 1 Hz, la vidéo en direct et la carte dans `/lane-view` et `/map` (`onlineLaneCount >= 1`).",
            },
            el: {
                chipLabel: "Λωρίδα & χάρτης",
                title: "Ζωντανές καμπύλες, γραφήματα προσβασιμότητας, Χάρτης & κινητές περίπολοι",
                screenshotCaption: "Ζωντανές καμπύλες και βίντεο Προβολής λωρίδας με σταθερές πύλες και ίχνη GPS κινητών ανιχνευτών στον Χάρτη (/map).",
                whyItMatters:
                    "Για εξέταση ενεργής διέλευσης ή παρακολούθηση κινητών περιπόλων (`RS-350` / `Kromek D5`), η Προβολή λωρίδας (`/lane-view`) δείχνει καμπύλες 1 Hz, ζωντανό βίντεο HLS και ακατέργαστο ημερήσιο αρχείο, ενώ ο Χάρτης {{icon:map}} (`/map`) παρουσιάζει όλες τις πύλες και διαδρομές GPS.",
                steps: [
                    "Ανοίξτε την Προβολή λωρίδας (`/lane-view` ή πατήστε κάρτα λωρίδας στον Πίνακα {{icon:dashboard}}) και εγχύστε έναν Συναγερμό Gamma παρακάτω για να δείτε ζωντανά την αιχμή πάνω από το όριο NSIGMA μαζί με το βίντεο HLS.",
                    "Ενεργοποιήστε `Εμφάνιση μεμονωμένων ανιχνευτών` για να δείτε ποιος πίνακας (`G1–G4` / `N1–N2`) είχε τη μέγιστη ένδειξη και δοκιμάστε `Ξεχωριστά γραφήματα (Προσβασιμότητα)` για στοιβαγμένες καμπύλες. Δείτε κάτω τις γραμμές ημερήσιου αρχείου (`GB`, `GS`, `GA`, `GX`).",
                    "Ανοίξτε τον Χάρτη {{icon:map}} (`/map`) για γεωαναφερθέντες δείκτες πυλών, εναλλαγή χαρτών `.pmtiles` ή διαγράμματος εγκατάστασης και παρακολούθηση κινητών ανιχνευτών (`RS-350` / `Kromek D5`) με ίχνος GPS και φάσμα 1.024 καναλιών.",
                ],
                keyTerms: [
                    {
                        term: "CPS & NSIGMA",
                        meaning: "`CPS` = μετρήσεις ανά δευτερόλεπτο· `NSIGMA` = τυπικές αποκλίσεις πάνω από το πρόσφατο υπόβαθρο.",
                    },
                    {
                        term: "Κωδικοί ημερήσιου αρχείου (`GB`, `GS`, `GA`, `NS`, `GX`)",
                        meaning: "`GB` = υπόβαθρο, `GS` = είσοδος, `GA`/`NS` = συναγερμός γάμμα/νετρονίων, `GX` = έξοδος.",
                    },
                    {
                        term: "Ξεχωριστά γραφήματα (Προσβασιμότητα)",
                        meaning: "Διαχωρίζει τις καμπύλες ανιχνευτών σε ξεχωριστά γραφήματα υψηλής αντίθεσης.",
                    },
                    {
                        term: "Κινητή περίπολος (`RS-350` / `Kromek D5`)",
                        meaning: "Φορητή μονάδα με ίχνος GPS στον `/map` και φάσμα 1.024 καναλιών στην `/lane-view` (λειτουργεί και σε εσωτερικό χώρο χωρίς GPS).",
                    },
                ],
                commonPitfalls: [
                    "Το βίντεο εμφανίζεται μαύρο για 1–2 δευτ. στην αρχή: το HLS ξεκινά από το επόμενο βασικό καρέ· περιμένετε στιγμιαία χωρίς ανανέωση.",
                    "Η ένδειξη `Εσωτερικός χώρος / GPS μη διαθέσιμο` δεν διακόπτει τη ροή ακτινοβολίας ή το φάσμα 1.024 καναλιών.",
                ],
                objectiveSummary: "Επιθεώρηση καμπυλών 1 Hz, βίντεο και θέσεων χάρτη σε `/lane-view` και `/map` (`onlineLaneCount >= 1`).",
            },
        },
        injectActions: [
            {
                scenario: "gamma_alarm",
                label: "Inject Live Gamma Spike",
                labels: {
                    es: "Inyectar pico Gamma en vivo",
                    fr: "Injecter pic Gamma en direct",
                    el: "Έγχυση ζωντανής αιχμής Gamma",
                },
            },
        ],
        spotlights: [
            {
                id: "map",
                selector: '[data-testid="nav-item-map"]',
                label: "Highlight Map Icon",
                iconKey: "map",
            },
            {
                id: "dashboard",
                selector: '[data-testid="nav-item-dashboard"]',
                label: "Highlight Dashboard Icon",
                iconKey: "dashboard",
            },
        ],
        spotlightSelector: '[data-testid="nav-item-map"]',
        spotlightLabel: "Highlight Map Icon",
        objectiveSummary: "Inspect live 1 Hz waveforms, camera stream, and site/patrol positions across `/lane-view` and `/map` (`onlineLaneCount >= 1`).",
        isAutoVerified: (v) => v.onlineLaneCount >= 1,
    },
    {
        id: "op-2",
        trackId: "operator",
        badge: "1.4",
        chipLabel: "Alarm Queue",
        route: "/",
        pageIconKey: "dashboard",
        videoGuideSlug: "09-dashboard-monitoring-and-quick-adjudication",
        screenshotFile: "26-dashboard-adjudication.png",
        screenshotCaption: "Dashboard quick-preview drawer with 5 retained JPEG keyframes, count profile, shared unread status, and disposition selector.",
        title: "Priority Alarm Queue, Shared Read State & Disposition Codes (1–11)",
        durationEstimate: "5 min",
        whyItMatters:
            "Every un-suppressed Gamma or Neutron alarm stays bold with a shared unread dot across all gatehouse booths on Dashboard {{icon:dashboard}} until an operator reviews the count profile, 5 retained camera frames, and submits an auditable Disposition Code.",
        steps: [
            "Click 'Inject Gamma Alarm' below if you need a fresh point-source alarm on `DemoLane01`. On Dashboard {{icon:dashboard}} (`/`), explore the shared queue controls: time presets (`15m`, `1h`, `24h`, `15d`), `Unread only` toggle, `Acknowledge Selected` / `Acknowledge All` (which marks alarms read across booths without adjudicating them), and Settings {{icon:settings}} audio/banner toggles.",
            "Click the bold alarm row to open the quick-review drawer (or open full Event Details). Inspect the gamma count curve above the NSIGMA threshold and cycle through all 5 evenly spaced retained JPEG camera frames (`frame-01.jpg`–`frame-05.jpg`).",
            "Pick the right Disposition Code — built-in codes: `1` Real Alarm / Threat, `2` Industrial Source, `3` Medical Isotope, `4` NORM Cargo, `5` False / Innocent Alarm, `6` Shielded / Suspicious, `7` Unresolved, `8` Other, `9` Authorized Test / Training, `10` Equipment Malfunction, `11` Unknown (plus automated `9998`/`9999`). Set Secondary Inspection (`None`, `Requested`, or `Completed`), enter clear shift notes, and click Submit Adjudication.",
        ],
        keyTerms: [
            {
                term: "Shared Read / Unread State",
                meaning: "Marking an alarm Read (`Acknowledge`) updates across all workstations watching that lane, but the alarm stays in the Dashboard queue until actually adjudicated.",
            },
            {
                term: "Secondary Inspection Status",
                meaning: "`None` (cleared at primary), `Requested` (vehicle diverted to secondary bay for handheld RIID/X-ray), or `Completed` (secondary findings attached).",
            },
            {
                term: "Retained 5-Frame Media",
                meaning: "5 evenly spaced JPEG keyframes captured from the alarm clip; after 30 days secondary frames prune while midpoint `frame-03.jpg` stays archived.",
            },
            {
                term: "Disposition Codes (`1–11` + `101+`)",
                meaning: "Standardized legal/operational classification recorded on every adjudicated alarm; sites can add custom agency codes (`101+`) via Policy Packs.",
            },
        ],
        commonPitfalls: [
            "Confusing `Acknowledge` with `Adjudicate`: `Acknowledge` only clears the bold unread dot and silences the unread banner/chime — you MUST still submit an Adjudication to resolve the alarm.",
            "Leaving `Secondary Inspection` as `Requested` after the vehicle clears: remember to reopen the event and update it to `Completed` with isotopes/notes so reports stay accurate.",
        ],
        translations: {
            en: {
                chipLabel: "Alarm Queue",
                title: "Priority Alarm Queue, Shared Read State & Disposition Codes (1–11)",
                screenshotCaption: "Dashboard quick-preview drawer with 5 retained JPEG keyframes, count profile, shared unread status, and disposition selector.",
                whyItMatters:
                    "Every un-suppressed Gamma or Neutron alarm stays bold with a shared unread dot across all gatehouse booths on Dashboard {{icon:dashboard}} until an operator reviews the count profile, 5 retained camera frames, and submits an auditable Disposition Code.",
                steps: [
                    "Click 'Inject Gamma Alarm' below if you need a fresh point-source alarm on `DemoLane01`. On Dashboard {{icon:dashboard}} (`/`), explore the shared queue controls: time presets (`15m`, `1h`, `24h`, `15d`), `Unread only` toggle, `Acknowledge Selected` / `Acknowledge All` (which marks alarms read across booths without adjudicating them), and Settings {{icon:settings}} audio/banner toggles.",
                    "Click the bold alarm row to open the quick-review drawer (or open full Event Details). Inspect the gamma count curve above the NSIGMA threshold and cycle through all 5 evenly spaced retained JPEG camera frames (`frame-01.jpg`–`frame-05.jpg`).",
                    "Pick the right Disposition Code — built-in codes: `1` Real Alarm / Threat, `2` Industrial Source, `3` Medical Isotope, `4` NORM Cargo, `5` False / Innocent Alarm, `6` Shielded / Suspicious, `7` Unresolved, `8` Other, `9` Authorized Test / Training, `10` Equipment Malfunction, `11` Unknown (plus automated `9998`/`9999`). Set Secondary Inspection (`None`, `Requested`, or `Completed`), enter clear shift notes, and click Submit Adjudication.",
                ],
                keyTerms: [
                    {
                        term: "Shared Read / Unread State",
                        meaning: "Marking an alarm Read (`Acknowledge`) updates across all workstations watching that lane, but the alarm stays in the Dashboard queue until actually adjudicated.",
                    },
                    {
                        term: "Secondary Inspection Status",
                        meaning: "`None` (cleared at primary), `Requested` (vehicle diverted to secondary bay for handheld RIID/X-ray), or `Completed` (secondary findings attached).",
                    },
                    {
                        term: "Retained 5-Frame Media",
                        meaning: "5 evenly spaced JPEG keyframes captured from the alarm clip; after 30 days secondary frames prune while midpoint `frame-03.jpg` stays archived.",
                    },
                    {
                        term: "Disposition Codes (`1–11` + `101+`)",
                        meaning: "Standardized legal/operational classification recorded on every adjudicated alarm; sites can add custom agency codes (`101+`) via Policy Packs.",
                    },
                ],
                commonPitfalls: [
                    "Confusing `Acknowledge` with `Adjudicate`: `Acknowledge` only clears the bold unread dot and silences the unread banner/chime — you MUST still submit an Adjudication to resolve the alarm.",
                    "Leaving `Secondary Inspection` as `Requested` after the vehicle clears: remember to reopen the event and update it to `Completed` with isotopes/notes so reports stay accurate.",
                ],
                objectiveSummary: "Submit at least 1 human operator adjudication (`operatorAdjudicatedCount >= 1`).",
            },
            es: {
                chipLabel: "Cola de alarmas",
                title: "Cola prioritaria, estado leído compartido y Códigos de disposición (1–11)",
                screenshotCaption: "Panel rápido de adjudicación con los 5 fotogramas JPEG retenidos, perfil de conteo y selector de disposición.",
                whyItMatters:
                    "Toda alarma gamma o de neutrones no suprimida permanece en negrita y con punto no leído compartido entre estaciones en Panel {{icon:dashboard}} hasta que un operador revise la curva, los 5 fotogramas y envíe un Código de disposición auditable.",
                steps: [
                    "Pulse 'Inyectar Alarma Gamma' abajo si necesita una alarma nueva en `DemoLane01`. En Panel {{icon:dashboard}} (`/`), pruebe ventanas rápidas (`15m`, `1h`, `24h`, `15d`), `Solo no leídas`, `Reconocer seleccionadas / todas` (marca como leída entre estaciones sin adjudicar) y alertas en Configuración {{icon:settings}}.",
                    "Pulse la fila en negrita para abrir el panel rápido (o Detalles del evento). Revise la curva gamma sobre NSIGMA y recorra los 5 fotogramas JPEG retenidos (`frame-01.jpg`–`frame-05.jpg`).",
                    "Seleccione el Código de disposición correcto (`1` Amenaza real, `2` Industrial, `3` Médico, `4` NORM, `5` Falsa/Inocente, `6` Blindado/Sospechoso, `7` Sin resolver, `8` Otro, `9` Prueba/Formación autorizada, `10` Fallo de equipo, `11` Desconocido), defina Inspección secundaria (`Ninguna`, `Solicitada`, `Completada`), agregue notas y pulse Enviar adjudicación.",
                ],
                keyTerms: [
                    {
                        term: "Estado leído/no leído compartido",
                        meaning: "`Reconocer` quita el punto no leído y el aviso en todas las estaciones del carril, pero la alarma sigue pendiente hasta ser adjudicada.",
                    },
                    {
                        term: "Estado de inspección secundaria",
                        meaning: "`Ninguna` (liberado en primaria), `Solicitada` (desviado a bahía secundaria) o `Completada` (hallazgos adjuntos).",
                    },
                    {
                        term: "5 fotogramas retenidos",
                        meaning: "5 instantáneas JPEG del clip de alarma; a los 30 días se conservan el fotograma central (`frame-03.jpg`) y se depuran los secundarios.",
                    },
                    {
                        term: "Códigos de disposición (`1–11` y `101+`)",
                        meaning: "Clasificación estandarizada para auditoría; los administradores pueden añadir códigos propios (`101+`) mediante paquetes de política.",
                    },
                ],
                commonPitfalls: [
                    "Confundir `Reconocer` con `Adjudicar`: reconocer solo silencia la alerta visual/sonora; siempre debe enviar la adjudicación final.",
                    "Olvidar pasar `Inspección secundaria` de `Solicitada` a `Completada` cuando el vehículo termina el control secundario.",
                ],
                objectiveSummary: "Enviar al menos 1 adjudicación manual de operador (`operatorAdjudicatedCount >= 1`).",
            },
            fr: {
                chipLabel: "File d’alarmes",
                title: "File prioritaire, état lu partagé et Codes de disposition (1–11)",
                screenshotCaption: "Volet d’adjudication rapide avec les 5 images JPEG conservées, la courbe de comptage et le sélecteur de disposition.",
                whyItMatters:
                    "Chaque alarme Gamma ou Neutrons non supprimée reste en gras avec un point non lu partagé entre tous les postes sur Tableau de bord {{icon:dashboard}} jusqu’à l’examen de la courbe, des 5 images et l’envoi d’un Code de disposition.",
                steps: [
                    "Cliquez sur « Injecter Alarme Gamma » ci-dessous pour générer une alarme sur `DemoLane01`. Sur Tableau de bord {{icon:dashboard}} (`/`), explorez les plages rapides (`15m`, `1h`, `24h`, `15d`), `Non lues uniquement`, `Acquitter la sélection / Tout acquitter` (marque comme lu entre postes sans adjuger) et Paramètres {{icon:settings}}.",
                    "Cliquez sur la ligne en gras pour ouvrir le volet rapide (ou Détails de l’événement). Examinez la courbe gamma au-dessus du seuil NSIGMA et les 5 images JPEG conservées (`frame-01.jpg`–`frame-05.jpg`).",
                    "Choisissez le Code de disposition (`1` Alarme réelle/Menace, `2` Industriel, `3` Médical, `4` NORM, `5` Fausse/Innocente, `6` Blindé/Suspect, `7` Non résolu, `8` Autre, `9` Test/Formation autorisé, `10` Panne matériel, `11` Inconnu), réglez Inspection secondaire (`Aucune`, `Demandée`, `Terminée`), saisissez vos notes et soumettez.",
                ],
                keyTerms: [
                    {
                        term: "État lu / non lu partagé",
                        meaning: "`Acquitter` efface le point non lu et le signal sonore sur tous les postes de la voie, mais l’alarme reste ouverte tant qu’elle n’est pas adjugée.",
                    },
                    {
                        term: "Statut d’inspection secondaire",
                        meaning: "`Aucune` (libéré en primaire), `Demandée` (envoyé en zone secondaire) ou `Terminée` (résultats enregistrés).",
                    },
                    {
                        term: "5 images JPEG conservées",
                        meaning: "5 clichés espacés issus du clip d’alarme ; après 30 jours seule l’image médiane (`frame-03.jpg`) est archivée à long terme.",
                    },
                    {
                        term: "Codes de disposition (`1–11` et `101+`)",
                        meaning: "Classification réglementaire enregistrée sur chaque alarme ; des codes d’agence (`101+`) peuvent être ajoutés via Extensions.",
                    },
                ],
                commonPitfalls: [
                    "Confondre `Acquitter` et `Adjuger` : l’acquittement ne résout pas l’alarme, seule l’adjudication la clôture.",
                    "Laisser `Inspection secondaire` sur `Demandée` après la fin du contrôle : mettez-la à jour sur `Terminée` avec les isotopes.",
                ],
                objectiveSummary: "Soumettre au moins 1 adjudication humaine d’opérateur (`operatorAdjudicatedCount >= 1`).",
            },
            el: {
                chipLabel: "Συναγερμοί",
                title: "Ουρά προτεραιότητας, κοινή κατάσταση ανάγνωσης & Κωδικοί διάθεσης (1–11)",
                screenshotCaption: "Πλαίσιο ταχείας αξιολόγησης στον Πίνακα ελέγχου με 5 διατηρούμενα καρέ JPEG, καμπύλη μετρήσεων και επιλογή κωδικού.",
                whyItMatters:
                    "Κάθε ενεργός συναγερμός Γάμμα ή Νετρονίων παραμένει με έντονα γράμματα και κοινή ένδειξη μη ανάγνωσης σε όλους τους σταθμούς του Πίνακα {{icon:dashboard}} έως ότου αξιολογηθεί με Κωδικό διάθεσης.",
                steps: [
                    "Πατήστε «Έγχυση Συναγερμού Gamma» παρακάτω αν θέλετε νέο συναγερμό στη `DemoLane01`. Στον Πίνακα {{icon:dashboard}} (`/`), δοκιμάστε τα χρονικά φίλτρα (`15m`, `1h`, `24h`, `15d`), `Μόνο μη αναγνωσμένα`, `Αναγνώριση επιλεγμένων / όλων` (σημειώνει ανάγνωση χωρίς αξιολόγηση) και τις Ρυθμίσεις {{icon:settings}}.",
                    "Πατήστε τη γραμμή συναγερμού για γρήγορη επισκόπηση (ή πλήρεις Λεπτομέρειες συμβάντος). Ελέγξτε την καμπύλη γάμμα πάνω από το όριο NSIGMA και τα 5 διατηρούμενα καρέ JPEG (`frame-01.jpg`–`frame-05.jpg`).",
                    "Επιλέξτε τον κατάλληλο Κωδικό διάθεσης (`1` Πραγματικός συναγερμός/Απειλή, `2` Βιομηχανική πηγή, `3` Ιατρικό, `4` NORM, `5` Ψευδής/Αθώος, `6` Θωρακισμένο/Ύποπτο, `7` Ανεπίλυτο, `8` Άλλο, `9` Εγκεκριμένη δοκιμή/εκπαίδευση, `10` Βλάβη εξοπλισμού, `11` Άγνωστο), ορίστε Δευτερογενή έλεγχο (`Κανένας`, `Ζητήθηκε`, `Ολοκληρώθηκε`), γράψτε σημειώσεις και υποβάλετε.",
                ],
                keyTerms: [
                    {
                        term: "Κοινή κατάσταση ανάγνωσης",
                        meaning: "Η `Αναγνώριση` σβήνει την ένδειξη μη ανάγνωσης και τον ήχο σε όλους τους σταθμούς, αλλά ο συναγερμός κλείνει μόνο με Αξιολόγηση.",
                    },
                    {
                        term: "Δευτερογενής έλεγχος",
                        meaning: "`Κανένας` (εκκαθάριση στην πύλη), `Ζητήθηκε` (εκτροπή σε δευτερογενή έλεγχο) ή `Ολοκληρώθηκε` (επισυναπτόμενα ευρήματα).",
                    },
                    {
                        term: "5 διατηρούμενα καρέ JPEG",
                        meaning: "5 στιγμιότυπα από το βίντεο συναγερμού· μετά από 30 ημέρες διατηρείται το μεσαίο καρέ (`frame-03.jpg`).",
                    },
                    {
                        term: "Κωδικοί διάθεσης (`1–11` & `101+`)",
                        meaning: "Τυποποιημένη κατάταξη ελέγχου· οι διαχειριστές μπορούν να προσθέσουν επιπλέον κωδικούς υπηρεσίας (`101+`).",
                    },
                ],
                commonPitfalls: [
                    "Σύγχυση μεταξύ `Αναγνώρισης` και `Αξιολόγησης`: η αναγνώριση μόνο σιγεί την ειδοποίηση — απαιτείται πάντα υποβολή Αξιολόγησης.",
                    "Μην αφήνετε τον Δευτερογενή έλεγχο στο `Ζητήθηκε` μόλις ολοκληρωθεί η μέτρηση — ενημερώστε τον σε `Ολοκληρώθηκε`.",
                ],
                objectiveSummary: "Υποβολή τουλάχιστον 1 ανθρώπινης αξιολόγησης χειριστή (`operatorAdjudicatedCount >= 1`).",
            },
        },
        injectActions: [
            {
                scenario: "gamma_alarm",
                label: "Inject Gamma Alarm",
                labels: {
                    es: "Inyectar Alarma Gamma",
                    fr: "Injecter Alarme Gamma",
                    el: "Έγχυση Συναγερμού Gamma",
                },
            },
        ],
        spotlights: [
            {
                id: "dashboard",
                selector: '[data-testid="nav-item-dashboard"]',
                label: "Highlight Dashboard Icon",
                iconKey: "dashboard",
            },
            {
                id: "events",
                selector: '[data-testid="nav-item-events"]',
                label: "Highlight Events Icon",
                iconKey: "events",
            },
            {
                id: "settings",
                selector: '[data-testid="navbar-settings-button"]',
                label: "Highlight Settings Gear Icon",
                iconKey: "settings",
            },
        ],
        spotlightSelector: '[data-testid="nav-item-dashboard"]',
        spotlightLabel: "Highlight Dashboard Icon",
        objectiveSummary: "Submit at least 1 human operator adjudication (`operatorAdjudicatedCount >= 1`).",
        isAutoVerified: (v) => v.operatorAdjudicatedCount >= 1,
    },
    {
        id: "op-3",
        trackId: "operator",
        badge: "1.5",
        chipLabel: "EML & Neutron",
        route: "/event-log",
        pageIconKey: "events",
        videoGuideSlug: "12-event-log-filtering-and-adjudication-codes",
        screenshotFile: "27-event-list.png",
        screenshotCaption: "Events log filtering across Code 9999 (EML Non-Threat), Code 9998 (Extended Occupancy), and active Neutron alarms.",
        title: "NORM (Code 9999), Extended Occupancy (Code 9998) & Neutron Safety",
        durationEstimate: "4 min",
        whyItMatters:
            "OSCAR reduces nuisance alarm fatigue by auto-releasing spatially uniform benign NORM cargo (`Code 9999`) and stalled gamma-only holds (`Code 9998`), while strictly enforcing the nuclear safety rule that NO Neutron alarm is ever auto-released.",
        steps: [
            "Click 'Inject Distributed NORM (Code 9999)' (~4s transit): the Coach opens Events {{icon:events}} (`/event-log`) where Enhanced Machine Learning (EML) auto-adjudicates the pass at `t = 0` as `Code 9999: EML Non-Threat` — intentionally suppressed from the Dashboard {{icon:dashboard}} active alarm queue!",
            "Click 'Inject Extended Hold (Code 9998)' (~10s stalled vehicle hold): `Fault - Extended Occupancy` triggers at 8s (default 1 min in production) and OSCAR auto-adjudicates the gamma-only exit as `Code 9998: Extended Occupancy Gamma Alarm` in Events {{icon:events}}.",
            "Click 'Inject Neutron Alarm' (~4s transit) and confirm in BOTH Events {{icon:events}} and Dashboard {{icon:dashboard}} that Neutron alarms NEVER auto-release (even during NORM or extended holds) and immediately demand human secondary inspection.",
        ],
        keyTerms: [
            {
                term: "NORM",
                meaning: "Naturally Occurring Radioactive Material — benign bulk cargo such as fertilizer (K-40), kitty litter, ceramic tiles, or granite.",
            },
            {
                term: "EML & `Code 9999`",
                meaning: "Enhanced Machine Learning algorithm comparing gamma energy/panel profiles to auto-release uniform NORM cargo while escalating point-source threats.",
            },
            {
                term: "Extended Occupancy & `Code 9998`",
                meaning: "When a vehicle stops inside a portal beyond the threshold and produces a gamma-only alarm, OSCAR logs `Fault - Extended Occupancy` and auto-clears gamma as `Code 9998`.",
            },
            {
                term: "Neutron Safety Interlock",
                meaning: "Any Neutron trigger bypasses both `Code 9999` and `Code 9998` suppression because neutrons strongly indicate Special Nuclear Material (SNM).",
            },
        ],
        commonPitfalls: [
            "Thinking EML `Code 9999` or `Code 9998` vanished: they are NEVER deleted — they are logged permanently in Events (`/event-log`) and included in every site/lane/adjudication report for supervisor audit.",
            "Override rule: an operator or supervisor can always open a `Code 9999` or `Code 9998` event in `/event-log` and submit a manual human adjudication if field intelligence warrants it.",
        ],
        translations: {
            en: {
                chipLabel: "EML & Neutron",
                title: "NORM (Code 9999), Extended Occupancy (Code 9998) & Neutron Safety",
                screenshotCaption: "Events log filtering across Code 9999 (EML Non-Threat), Code 9998 (Extended Occupancy), and active Neutron alarms.",
                whyItMatters:
                    "OSCAR reduces nuisance alarm fatigue by auto-releasing spatially uniform benign NORM cargo (`Code 9999`) and stalled gamma-only holds (`Code 9998`), while strictly enforcing the nuclear safety rule that NO Neutron alarm is ever auto-released.",
                steps: [
                    "Click 'Inject Distributed NORM (Code 9999)' (~4s transit): the Coach opens Events {{icon:events}} (`/event-log`) where Enhanced Machine Learning (EML) auto-adjudicates the pass at `t = 0` as `Code 9999: EML Non-Threat` — intentionally suppressed from the Dashboard {{icon:dashboard}} active alarm queue!",
                    "Click 'Inject Extended Hold (Code 9998)' (~10s stalled vehicle hold): `Fault - Extended Occupancy` triggers at 8s (default 1 min in production) and OSCAR auto-adjudicates the gamma-only exit as `Code 9998: Extended Occupancy Gamma Alarm` in Events {{icon:events}}.",
                    "Click 'Inject Neutron Alarm' (~4s transit) and confirm in BOTH Events {{icon:events}} and Dashboard {{icon:dashboard}} that Neutron alarms NEVER auto-release (even during NORM or extended holds) and immediately demand human secondary inspection.",
                ],
                keyTerms: [
                    {
                        term: "NORM",
                        meaning: "Naturally Occurring Radioactive Material — benign bulk cargo such as fertilizer (K-40), kitty litter, ceramic tiles, or granite.",
                    },
                    {
                        term: "EML & `Code 9999`",
                        meaning: "Enhanced Machine Learning algorithm comparing gamma energy/panel profiles to auto-release uniform NORM cargo while escalating point-source threats.",
                    },
                    {
                        term: "Extended Occupancy & `Code 9998`",
                        meaning: "When a vehicle stops inside a portal beyond the threshold and produces a gamma-only alarm, OSCAR logs `Fault - Extended Occupancy` and auto-clears gamma as `Code 9998`.",
                    },
                    {
                        term: "Neutron Safety Interlock",
                        meaning: "Any Neutron trigger bypasses both `Code 9999` and `Code 9998` suppression because neutrons strongly indicate Special Nuclear Material (SNM).",
                    },
                ],
                commonPitfalls: [
                    "Thinking EML `Code 9999` or `Code 9998` vanished: they are NEVER deleted — they are logged permanently in Events (`/event-log`) and included in every site/lane/adjudication report for supervisor audit.",
                    "Override rule: an operator or supervisor can always open a `Code 9999` or `Code 9998` event in `/event-log` and submit a manual human adjudication if field intelligence warrants it.",
                ],
                objectiveSummary: "Observe at least 1 automated `Code 9999` or `Code 9998` disposition (`emlCode9999Count >= 1 || extendedCode9998Count >= 1`).",
            },
            es: {
                chipLabel: "EML y neutrones",
                title: "NORM (Código 9999), Ocupación prolongada (Código 9998) y seguridad de neutrones",
                screenshotCaption: "Registro de eventos filtrando Código 9999 (EML sin amenaza), Código 9998 (Ocupación prolongada) y alarmas de neutrones.",
                whyItMatters:
                    "OSCAR reduce las falsas alarmas liberando automáticamente carga NORM uniforme (`Código 9999`) y retenciones prolongadas solo gamma (`Código 9998`), mientras garantiza que NINGUNA alarma de neutrones se libere automáticamente.",
                steps: [
                    "Pulse 'Inyectar NORM distribuido (Código 9999)' (~4 s): el Coach abre Eventos {{icon:events}} (`/event-log`) donde EML auto-adjudica el paso como `Código 9999: EML sin amenaza`, manteniéndolo fuera de la cola del Panel {{icon:dashboard}}.",
                    "Pulse 'Inyectar retención prolongada (Código 9998)' (~10 s): a los 8 s aparece `Fault - Extended Occupancy` y al salir OSCAR registra `Código 9998: Alarma gamma de ocupación prolongada` en Eventos {{icon:events}}.",
                    "Pulse 'Inyectar Alarma de Neutrones' (~4 s) y verifique en Eventos {{icon:events}} y Panel {{icon:dashboard}} que los neutrones NUNCA se auto-liberan y exigen inspección secundaria humana inmediata.",
                ],
                keyTerms: [
                    {
                        term: "NORM",
                        meaning: "Material radiactivo de origen natural en cargas benignas (fertilizantes con K-40, arena para gatos, cerámica, granito).",
                    },
                    {
                        term: "EML y `Código 9999`",
                        meaning: "Aprendizaje automático mejorado que distingue carga NORM uniforme de fuentes puntuales amenazantes.",
                    },
                    {
                        term: "Ocupación prolongada y `Código 9998`",
                        meaning: "Si un vehículo se detiene demasiado dentro del pórtico con alarma solo gamma, se registra fallo y auto-cierre `Código 9998`.",
                    },
                    {
                        term: "Bloqueo de seguridad de neutrones",
                        meaning: "Cualquier disparo de neutrones anula `Código 9999` y `9998` por su vínculo con Material Nuclear Especial (SNM).",
                    },
                ],
                commonPitfalls: [
                    "Los eventos `Código 9999` y `9998` NO se eliminan: quedan archivados permanentemente en Eventos (`/event-log`) y en todos los informes.",
                    "Cualquier operador o supervisor puede abrir un evento `9999` o `9998` y registrar una adjudicación manual si procede.",
                ],
                objectiveSummary: "Observar al menos 1 disposición automática `Código 9999` o `9998` (`emlCode9999Count >= 1 || extendedCode9998Count >= 1`).",
            },
            fr: {
                chipLabel: "EML & neutrons",
                title: "NORM (Code 9999), Occupation prolongée (Code 9998) et sûreté neutrons",
                screenshotCaption: "Journal des événements filtrant Code 9999 (EML sans menace), Code 9998 (Occupation prolongée) et alarmes neutrons.",
                whyItMatters:
                    "OSCAR réduit la fatigue d’alarme en libérant automatiquement le fret NORM homogène (`Code 9999`) et les arrêts prolongés gamma uniquement (`Code 9998`), tout en interdisant strictement l’auto-libération de toute alarme Neutrons.",
                steps: [
                    "Cliquez sur « Injecter NORM distribué (Code 9999) » (~4 s) : le Coach ouvre Événements {{icon:events}} (`/event-log`) où EML auto-adjuge le passage en `Code 9999 : EML Non-Threat`, volontairement absent du Tableau de bord {{icon:dashboard}}.",
                    "Cliquez sur « Injecter arrêt prolongé (Code 9998) » (~10 s) : `Fault - Extended Occupancy` se déclenche à 8 s puis OSCAR enregistre `Code 9998` à la sortie dans Événements {{icon:events}}.",
                    "Cliquez sur « Injecter Alarme Neutrons » (~4 s) et vérifiez dans Événements {{icon:events}} et Tableau de bord {{icon:dashboard}} qu’une alarme Neutrons ne s’efface JAMAIS automatiquement et impose une inspection secondaire.",
                ],
                keyTerms: [
                    {
                        term: "NORM",
                        meaning: "Matière radioactive d’origine naturelle (engrais K-40, litière, céramique, granit).",
                    },
                    {
                        term: "EML & `Code 9999`",
                        meaning: "Algorithme comparant les profils gamma pour distinguer un fret NORM uniforme d’une source ponctuelle.",
                    },
                    {
                        term: "Occupation prolongée & `Code 9998`",
                        meaning: "Arrêt prolongé dans le portique avec alarme gamma seule : signalé en défaut puis auto-classé `Code 9998`.",
                    },
                    {
                        term: "Verrou de sûreté neutrons",
                        meaning: "Tout déclenchement neutrons contourne `Code 9999` et `9998` en raison du risque de matière nucléaire spéciale (SNM).",
                    },
                ],
                commonPitfalls: [
                    "Les événements `9999` et `9998` ne disparaissent pas : ils sont conservés dans Événements (`/event-log`) et comptabilisés dans les rapports.",
                    "Un opérateur ou superviseur peut toujours ouvrir un `9999` ou `9998` et enregistrer une adjudication manuelle prioritaire.",
                ],
                objectiveSummary: "Observer au moins 1 disposition automatique `Code 9999` ou `9998` (`emlCode9999Count >= 1 || extendedCode9998Count >= 1`).",
            },
            el: {
                chipLabel: "EML & νετρόνια",
                title: "NORM (Κωδικός 9999), Παρατεταμένη διέλευση (Κωδικός 9998) & ασφάλεια νετρονίων",
                screenshotCaption: "Ιστορικό συμβάντων με Κωδικό 9999 (EML χωρίς απειλή), Κωδικό 9998 (Παρατεταμένη διέλευση) και ενεργούς συναγερμούς νετρονίων.",
                whyItMatters:
                    "Το OSCAR μειώνει τους ενοχλητικούς συναγερμούς αποδεσμεύοντας αυτόματα ομοιόμορφο φορτίο NORM (`Κωδικός 9999`) και παρατεταμένες στάσεις μόνο γάμμα (`Κωδικός 9998`), ενώ απαγορεύει αυστηρά την αυτόματη αποδέσμευση οποιουδήποτε συναγερμού Νετρονίων.",
                steps: [
                    "Πατήστε «Έγχυση NORM (Κωδικός 9999)» (~4 δευτ.): ο Οδηγός ανοίγει τα Συμβάντα {{icon:events}} (`/event-log`) όπου το EML καταχωρίζει αυτόματα `Κωδικός 9999: EML Non-Threat`, κρατώντας τον εκτός Πίνακα {{icon:dashboard}}.",
                    "Πατήστε «Έγχυση παρατεταμένης στάσης (Κωδικός 9998)» (~10 δευτ.): στα 8 δευτ. εμφανίζεται `Fault - Extended Occupancy` και στην έξοδο καταγράφεται `Κωδικός 9998` στα Συμβάντα {{icon:events}}.",
                    "Πατήστε «Έγχυση Συναγερμού Νετρονίων» (~4 δευτ.) και επιβεβαιώστε σε Συμβάντα {{icon:events}} και Πίνακα {{icon:dashboard}} ότι τα νετρόνια ΔΕΝ εκκαθαρίζονται ποτέ αυτόματα και απαιτούν άμεσο δευτερογενή έλεγχο.",
                ],
                keyTerms: [
                    {
                        term: "NORM",
                        meaning: "Φυσικά απαντώμενο ραδιενεργό υλικό σε αθώα φορτία (λιπάσματα K-40, κεραμικά, γρανίτης).",
                    },
                    {
                        term: "EML & `Κωδικός 9999`",
                        meaning: "Ενισχυμένη Μηχανική Μάθηση που διακρίνει ομοιόμορφο NORM από σημειακές απειλές.",
                    },
                    {
                        term: "Παρατεταμένη διέλευση & `Κωδικός 9998`",
                        meaning: "Όταν όχημα ακινητοποιηθεί στην πύλη με συναγερμό μόνο γάμμα, καταγράφεται σφάλμα και αυτόματο κλείσιμο `9998`.",
                    },
                    {
                        term: "Δικλείδα ασφαλείας νετρονίων",
                        meaning: "Κάθε συναγερμός νετρονίων παρακάμπτει τους κωδικούς `9999` και `9998` λόγω πιθανού ειδικού πυρηνικού υλικού (SNM).",
                    },
                ],
                commonPitfalls: [
                    "Τα συμβάντα `9999` και `9998` δεν διαγράφονται: παραμένουν μόνιμα στα Συμβάντα (`/event-log`) και σε όλες τις αναφορές.",
                    "Χειριστές και επόπτες μπορούν πάντα να υποβάλουν χειροκίνητη αξιολόγηση πάνω σε οποιοδήποτε `9999` ή `9998`.",
                ],
                objectiveSummary: "Παρατήρηση τουλάχιστον 1 αυτόματης διάθεσης `Κωδικός 9999` ή `9998` (`emlCode9999Count >= 1 || extendedCode9998Count >= 1`).",
            },
        },
        injectActions: [
            {
                scenario: "norm_eml",
                label: "Inject Distributed NORM (Code 9999)",
                labels: {
                    es: "Inyectar NORM distribuido (Código 9999)",
                    fr: "Injecter NORM distribué (Code 9999)",
                    el: "Έγχυση NORM (Κωδικός 9999)",
                },
            },
            {
                scenario: "extended_occupancy",
                label: "Inject Extended Hold (Code 9998)",
                labels: {
                    es: "Inyectar retención prolongada (Código 9998)",
                    fr: "Injecter arrêt prolongé (Code 9998)",
                    el: "Έγχυση παρατεταμένης στάσης (Κωδικός 9998)",
                },
            },
            {
                scenario: "neutron_alarm",
                label: "Inject Neutron Alarm",
                labels: {
                    es: "Inyectar Alarma de Neutrones",
                    fr: "Injecter Alarme Neutrons",
                    el: "Έγχυση Συναγερμού Νετρονίων",
                },
            },
        ],
        spotlights: [
            {
                id: "events",
                selector: '[data-testid="nav-item-events"]',
                label: "Highlight Events Icon",
                iconKey: "events",
            },
            {
                id: "health",
                selector: '[data-testid="nav-item-health"]',
                label: "Highlight Status of Health Icon",
                iconKey: "health",
            },
        ],
        spotlightSelector: '[data-testid="nav-item-events"]',
        spotlightLabel: "Highlight Events Icon",
        objectiveSummary: "Observe at least 1 automated `Code 9999` or `Code 9998` disposition (`emlCode9999Count >= 1 || extendedCode9998Count >= 1`).",
        isAutoVerified: (v) => v.emlCode9999Count >= 1 || v.extendedCode9998Count >= 1,
    },
    {
        id: "op-4",
        trackId: "operator",
        badge: "1.6",
        chipLabel: "OCR, .n42 & QR",
        route: "/event-log",
        pageIconKey: "alarm-transfer",
        videoGuideSlug: "17-vehicle-ocr-and-adjudication",
        screenshotFile: "29-event-details-adjudication.png",
        screenshotCaption: "Event Details adjudication workflow with ISO 6346 Container OCR suggestion chip, .n42 spectrum upload, and air-gapped QR export.",
        title: "Container OCR, Secondary Spectroscopy (`.n42`) & Offline QR Transfer",
        durationEstimate: "5 min",
        whyItMatters:
            "Attaching a handheld RIID `.n42` spectrum and verified ISO 6346 container ID permanently binds secondary inspection proof to the occupancy, while Alarm Transfer {{icon:alarm-transfer}} (`/alarm-transfer`) moves signed alarm packets safely onto air-gapped inspection booths.",
        steps: [
            "Click 'Download Practice Spectrum (.n42)' below to save a synthetic secondary-inspection gamma spectrum (`Cs-137` + `Co-60`) to your workstation.",
            "Open any alarm's Event Details page from Events {{icon:events}} (`/event-log`), check the Vehicle / Container ID field (click any OCR suggestion chip with crop thumbnail or paste `SCFU8572724`), upload `sample-cs137-co60.n42` (notice Log vs. Linear display and automatic local fallback if cloud WebID is offline), tag `Cs-137` / `Co-60`, and submit.",
            "Click 'Share / Export QR' {{icon:qr}} on the event (or copy its exact Event UUID link), then open Alarm Transfer {{icon:alarm-transfer}} (`/alarm-transfer`, QR-scanner frame icon) to see how air-gapped booths scan the QR code or import a `.oscar-alarm.json` / PNG bundle and verify its cryptographic integrity offline.",
        ],
        keyTerms: [
            {
                term: "ISO 6346 Container ID & OCR Chips",
                meaning: "11-character shipping container code (`4 letters + 6 digits + check digit`, e.g. `SCFU8572724`). Valid check-digit reads auto-fill untouched fields; lower-confidence reads appear as clickable crop chips.",
            },
            {
                term: "RIID & ANSI `.n42` Spectrum",
                meaning: "Radioisotope Identification Device output file recording gamma energy channels so OSCAR/WebID can identify specific isotopes (`Cs-137`, `Co-60`, `U-235`, `Tc-99m`).",
            },
            {
                term: "WebID & Local Offline Fallback",
                meaning: "Full-spectrum isotope analysis using Sandia WebID when reachable, falling back seamlessly to local peak/library matching on air-gapped sites.",
            },
            {
                term: "Alarm Transfer (`/alarm-transfer`)",
                meaning: "Offline QR code and `.oscar-alarm.json` transfer workflow carrying verified count curves and Event UUIDs between disconnected networks.",
            },
        ],
        commonPitfalls: [
            "OCR did not overwrite a Vehicle ID you already typed: by design, OSCAR NEVER overwrites a human-edited Vehicle ID — it keeps extra candidates as clickable suggestion chips.",
            "On air-gapped booths without a webcam, use `Upload QR PNG` or `Import .oscar-alarm.json` in `/alarm-transfer` instead of camera scanning.",
        ],
        translations: {
            en: {
                chipLabel: "OCR, .n42 & QR",
                title: "Container OCR, Secondary Spectroscopy (`.n42`) & Offline QR Transfer",
                screenshotCaption: "Event Details adjudication workflow with ISO 6346 Container OCR suggestion chip, .n42 spectrum upload, and air-gapped QR export.",
                whyItMatters:
                    "Attaching a handheld RIID `.n42` spectrum and verified ISO 6346 container ID permanently binds secondary inspection proof to the occupancy, while Alarm Transfer {{icon:alarm-transfer}} (`/alarm-transfer`) moves signed alarm packets safely onto air-gapped inspection booths.",
                steps: [
                    "Click 'Download Practice Spectrum (.n42)' below to save a synthetic secondary-inspection gamma spectrum (`Cs-137` + `Co-60`) to your workstation.",
                    "Open any alarm's Event Details page from Events {{icon:events}} (`/event-log`), check the Vehicle / Container ID field (click any OCR suggestion chip with crop thumbnail or paste `SCFU8572724`), upload `sample-cs137-co60.n42` (notice Log vs. Linear display and automatic local fallback if cloud WebID is offline), tag `Cs-137` / `Co-60`, and submit.",
                    "Click 'Share / Export QR' {{icon:qr}} on the event (or copy its exact Event UUID link), then open Alarm Transfer {{icon:alarm-transfer}} (`/alarm-transfer`, QR-scanner frame icon) to see how air-gapped booths scan the QR code or import a `.oscar-alarm.json` / PNG bundle and verify its cryptographic integrity offline.",
                ],
                keyTerms: [
                    {
                        term: "ISO 6346 Container ID & OCR Chips",
                        meaning: "11-character shipping container code (`4 letters + 6 digits + check digit`, e.g. `SCFU8572724`). Valid check-digit reads auto-fill untouched fields; lower-confidence reads appear as clickable crop chips.",
                    },
                    {
                        term: "RIID & ANSI `.n42` Spectrum",
                        meaning: "Radioisotope Identification Device output file recording gamma energy channels so OSCAR/WebID can identify specific isotopes (`Cs-137`, `Co-60`, `U-235`, `Tc-99m`).",
                    },
                    {
                        term: "WebID & Local Offline Fallback",
                        meaning: "Full-spectrum isotope analysis using Sandia WebID when reachable, falling back seamlessly to local peak/library matching on air-gapped sites.",
                    },
                    {
                        term: "Alarm Transfer (`/alarm-transfer`)",
                        meaning: "Offline QR code and `.oscar-alarm.json` transfer workflow carrying verified count curves and Event UUIDs between disconnected networks.",
                    },
                ],
                commonPitfalls: [
                    "OCR did not overwrite a Vehicle ID you already typed: by design, OSCAR NEVER overwrites a human-edited Vehicle ID — it keeps extra candidates as clickable suggestion chips.",
                    "On air-gapped booths without a webcam, use `Upload QR PNG` or `Import .oscar-alarm.json` in `/alarm-transfer` instead of camera scanning.",
                ],
                objectiveSummary: "Record an adjudication with isotope/spectrum evidence or a normalized Vehicle/Container ID.",
            },
            es: {
                chipLabel: "OCR, .n42 y QR",
                title: "OCR de contenedores, espectroscopia secundaria (`.n42`) y transferencia QR",
                screenshotCaption: "Adjudicación en Detalles del evento con sugerencia OCR ISO 6346, carga de espectro .n42 y exportación QR sin conexión.",
                whyItMatters:
                    "Adjuntar el espectro `.n42` del RIID portátil y el contenedor ISO 6346 verificado vincula la prueba secundaria a la ocupación, mientras Transferencia de alarmas {{icon:alarm-transfer}} (`/alarm-transfer`) traslada resúmenes firmados a cabinas aisladas.",
                steps: [
                    "Pulse 'Descargar espectro de práctica (.n42)' abajo para guardar un espectro gamma sintético (`Cs-137` + `Co-60`).",
                    "Abra Detalles del evento desde Eventos {{icon:events}} (`/event-log`), verifique el ID de vehículo/contenedor (pulse un chip OCR o pegue `SCFU8572724`), cargue `sample-cs137-co60.n42` (pruebe escala Log/Lineal y el respaldo local sin WebID), seleccione `Cs-137` / `Co-60` y envíe.",
                    "Pulse 'Compartir / Exportar QR' {{icon:qr}} y abra Transferencia de alarmas {{icon:alarm-transfer}} (`/alarm-transfer`) para ver cómo las cabinas aisladas escanean el QR o importan PNG / `.oscar-alarm.json` sin conexión.",
                ],
                keyTerms: [
                    {
                        term: "Contenedor ISO 6346 y chips OCR",
                        meaning: "Código de 11 caracteres con dígito de control (`SCFU8572724`); los válidos rellenan campos sin editar y los demás aparecen como chips clicables.",
                    },
                    {
                        term: "RIID y espectro ANSI `.n42`",
                        meaning: "Archivo del identificador portátil de radioisótopos con canales de energía para identificar isótopos (`Cs-137`, `Co-60`, `U-235`, `Tc-99m`).",
                    },
                    {
                        term: "WebID y respaldo local",
                        meaning: "Identificación espectral completa vía WebID cuando hay red, con respaldo automático local en sitios aislados.",
                    },
                    {
                        term: "Transferencia de alarmas (`/alarm-transfer`)",
                        meaning: "Intercambio fuera de línea por QR o `.oscar-alarm.json` con verificación criptográfica de curvas y UUID.",
                    },
                ],
                commonPitfalls: [
                    "El OCR nunca sobrescribe un ID que ya haya escrito un operador; solo ofrece sugerencias adicionales clicables.",
                    "En estaciones sin cámara web, use la importación de archivo PNG o `.oscar-alarm.json` en `/alarm-transfer`.",
                ],
                objectiveSummary: "Registrar una adjudicación con espectro/isótopos o un ID normalizado de vehículo/contenedor.",
            },
            fr: {
                chipLabel: "OCR, .n42 & QR",
                title: "OCR conteneurs, spectroscopie secondaire (`.n42`) et transfert QR hors ligne",
                screenshotCaption: "Adjudication détaillée avec puce OCR ISO 6346, téléversement de spectre .n42 et export QR hors ligne.",
                whyItMatters:
                    "Joindre le spectre RIID `.n42` et le code conteneur ISO 6346 relie durablement la preuve d’inspection secondaire au passage, tandis que Transfert d’alarme {{icon:alarm-transfer}} (`/alarm-transfer`) transfère des paquets signés vers des postes isolés.",
                steps: [
                    "Cliquez sur « Télécharger spectre d’exercice (.n42) » ci-dessous pour enregistrer un spectre gamma synthétique (`Cs-137` + `Co-60`).",
                    "Ouvrez les Détails d’une alarme depuis Événements {{icon:events}} (`/event-log`), vérifiez l’ID véhicule/conteneur (cliquez sur une puce OCR ou collez `SCFU8572724`), importez `sample-cs137-co60.n42` (observez l’échelle Log/Linéaire et le repli local hors ligne), taguez `Cs-137` / `Co-60` et soumettez.",
                    "Cliquez sur « Partager / Exporter QR » {{icon:qr}} puis ouvrez Transfert d’alarme {{icon:alarm-transfer}} (`/alarm-transfer`) pour voir la lecture QR ou l’import PNG / `.oscar-alarm.json` hors réseau.",
                ],
                keyTerms: [
                    {
                        term: "Conteneur ISO 6346 et puces OCR",
                        meaning: "Code de 11 caractères avec chiffre de contrôle (`SCFU8572724`) ; les lectures valides préremplissent le champ non modifié.",
                    },
                    {
                        term: "RIID et spectre ANSI `.n42`",
                        meaning: "Fichier issu d’un identificateur portable enregistrant les canaux d’énergie gamma pour identifier les isotopes.",
                    },
                    {
                        term: "WebID et repli local hors ligne",
                        meaning: "Analyse spectrale via Sandia WebID si accessible, avec repli local transparent en site isolé.",
                    },
                    {
                        term: "Transfert d’alarme (`/alarm-transfer`)",
                        meaning: "Échange hors ligne par QR ou `.oscar-alarm.json` incluant courbes de comptage et intégrité cryptographique.",
                    },
                ],
                commonPitfalls: [
                    "L’OCR n’écrase jamais un ID déjà saisi manuellement par l’opérateur : il reste proposé sous forme de puce cliquable.",
                    "Sans webcam sur un poste isolé, importez directement le PNG du QR ou le fichier `.oscar-alarm.json` dans `/alarm-transfer`.",
                ],
                objectiveSummary: "Enregistrer une adjudication avec preuve isotopique/spectrale ou ID véhicule/conteneur normalisé.",
            },
            el: {
                chipLabel: "OCR, .n42 & QR",
                title: "OCR εμπορευματοκιβωτίων, φασματοσκοπία (`.n42`) & μεταφορά QR εκτός δικτύου",
                screenshotCaption: "Αξιολόγηση στις Λεπτομέρειες συμβάντος με πρόταση OCR ISO 6346, μεταφόρτωση φάσματος .n42 και εξαγωγή QR.",
                whyItMatters:
                    "Η επισύναψη φάσματος `.n42` και επαληθευμένου κωδικού ISO 6346 συνδέει μόνιμα τα στοιχεία δευτερογενούς ελέγχου με τη διέλευση, ενώ η Μεταφορά συναγερμού {{icon:alarm-transfer}} (`/alarm-transfer`) μεταφέρει υπογεγραμμένα πακέτα σε απομονωμένους σταθμούς.",
                steps: [
                    "Πατήστε «Λήψη δείγματος φάσματος (.n42)» παρακάτω για αποθήκευση συνθετικού φάσματος γάμμα (`Cs-137` + `Co-60`).",
                    "Ανοίξτε Λεπτομέρειες συμβάντος από τα Συμβάντα {{icon:events}} (`/event-log`), ελέγξτε το πεδίο ID οχήματος/εμπορευματοκιβωτίου (πατήστε πρόταση OCR ή επικολλήστε `SCFU8572724`), μεταφορτώστε το `sample-cs137-co60.n42` (δείτε Log/Linear και τοπική εναλλακτική WebID), επιλέξτε `Cs-137` / `Co-60` και υποβάλετε.",
                    "Πατήστε «Κοινοποίηση / Εξαγωγή QR» {{icon:qr}} και ανοίξτε τη Μεταφορά συναγερμού {{icon:alarm-transfer}} (`/alarm-transfer`) για σάρωση QR ή εισαγωγή PNG / `.oscar-alarm.json` εκτός σύνδεσης.",
                ],
                keyTerms: [
                    {
                        term: "Κωδικός ISO 6346 & προτάσεις OCR",
                        meaning: "Κωδικός 11 χαρακτήρων με ψηφίο ελέγχου (`SCFU8572724`)· τα έγκυρα συμπληρώνουν αυτόματα κενά πεδία.",
                    },
                    {
                        term: "RIID & φάσμα ANSI `.n42`",
                        meaning: "Αρχείο φορητού φασματόμετρου για ταυτοποίηση ραδιοϊσοτόπων (`Cs-137`, `Co-60`, `U-235`, `Tc-99m`).",
                    },
                    {
                        term: "WebID & τοπική εναλλακτική",
                        meaning: "Πλήρης ανάλυση φάσματος μέσω WebID με αυτόματη τοπική αντιστοίχιση σε απομονωμένες εγκαταστάσεις.",
                    },
                    {
                        term: "Μεταφορά συναγερμού (`/alarm-transfer`)",
                        meaning: "Ανταλλαγή QR ή `.oscar-alarm.json` εκτός δικτύου με επαλήθευση ακεραιότητας.",
                    },
                ],
                commonPitfalls: [
                    "Το OCR δεν αντικαθιστά ποτέ ID που έχει ήδη πληκτρολογήσει ο χειριστής — το εμφανίζει ως επιλέξιμη πρόταση.",
                    "Χωρίς κάμερα σε απομονωμένο σταθμό, χρησιμοποιήστε εισαγωγή PNG ή `.oscar-alarm.json` στο `/alarm-transfer`.",
                ],
                objectiveSummary: "Καταχώριση αξιολόγησης με φάσμα/ισότοπα ή κανονικοποιημένο ID οχήματος/εμπορευματοκιβωτίου.",
            },
        },
        sampleFiles: [
            {
                fileName: "sample-cs137-co60.n42",
                buttonLabel: "Download Practice Spectrum (.n42)",
                buttonLabels: {
                    es: "Descargar espectro de práctica (.n42)",
                    fr: "Télécharger spectre d’exercice (.n42)",
                    el: "Λήψη δείγματος φάσματος (.n42)",
                },
            },
        ],
        copySnippets: [
            {
                label: "Copy Container ID",
                labels: {
                    es: "Copiar ID de contenedor",
                    fr: "Copier l’ID conteneur",
                    el: "Αντιγραφή ID κοντέινερ",
                },
                value: "SCFU8572724",
            },
        ],
        spotlights: [
            {
                id: "events",
                selector: '[data-testid="nav-item-events"]',
                label: "Highlight Events Icon",
                iconKey: "events",
            },
            {
                id: "alarm-transfer",
                selector: '[data-testid="nav-item-alarm-transfer"]',
                label: "Highlight Alarm Transfer QR Icon",
                iconKey: "alarm-transfer",
            },
        ],
        spotlightSelector: '[data-testid="nav-item-events"]',
        spotlightLabel: "Highlight Events Icon",
        objectiveSummary: "Record an adjudication with isotope/spectrum evidence or a normalized Vehicle/Container ID.",
        isAutoVerified: (v) => v.adjudicatedWithEvidenceCount >= 1 || v.adjudicatedWithVehicleIdCount >= 1,
    },
    {
        id: "op-5",
        trackId: "operator",
        badge: "1.7",
        chipLabel: "Cargo X-Ray",
        route: "/event-log",
        pageIconKey: "uff",
        videoGuideSlug: "27-cargo-uff-smb-and-xray-inspection",
        screenshotFile: "49-cargo-uff-16bit-xray-inspector.png",
        screenshotCaption: "16-bit WCO UFF 3.0 cargo radiograph inspector with window/level LUT controls, HEMD effective-Z material bands, and aligned RPM count strip.",
        title: "16-Bit WCO UFF Cargo X-Ray & HEMD Material Inspection",
        durationEstimate: "4 min",
        whyItMatters:
            "Correlating dual-energy cargo X-ray High-Z shielding anomalies (`Z_eff > 72`) via the Cargo X-Ray inspector {{icon:uff}} (stacked-layers icon) with the aligned RPM gamma/neutron count profile pinpoints dense lead/uranium shielding hidden inside ordinary cargo pallets.",
        steps: [
            "Open Events {{icon:events}} (`/event-log`) and paste the sandbox UFF UUID (`dfb985c4-eb26-41ab-938b-ad2a1f5966d4`) or container `SCFU8572724` into the search bar to reveal the Open Cargo X-Ray {{icon:uff}} button — OR open an Event Details page and click `Browse Cargo NII Share` / `Upload .uff`.",
            "Inside the 16-bit X-Ray Inspector {{icon:uff}}, adjust Window/Level contrast to see through dense steel, toggle the HEMD High-Z material overlay (`Organic`, `Intermediate`, `Inorganic`, `High-Z Shielding`), and compare the localized dense anomaly against the synchronized RPM radiation count strip.",
            "Click `Link to Adjudication` (zero-download reference linking on SMB shares) — or download `sample-cargo-uff3.uff` below to practice direct offline `.uff` inspection.",
        ],
        keyTerms: [
            {
                term: "WCO UFF 2.0 / 3.0 (`.uff`)",
                meaning: "World Customs Organization Unified File Format package exported by cargo X-ray scanners containing 16-bit radiographs, manifest data, and scan metadata.",
            },
            {
                term: "HEMD & `Z_eff > 72` (High-Z)",
                meaning: "High-Energy Material Discrimination separating organic (`orange`), intermediate (`green`), steel/inorganic (`blue`), and very dense High-Z shielding (`lead/uranium/tungsten`).",
            },
            {
                term: "Window / Level (16-Bit LUT)",
                meaning: "Interactive brightness/contrast window across all 65,536 X-ray intensity levels so dense cargo areas reveal hidden objects without clipping.",
            },
            {
                term: "Fuzzy 1-Char Container Correlation",
                meaning: "Matches scanner container reads to portal OCR even when one character is misread (`0`/`O`, `1`/`I`, `8`/`B`).",
            },
        ],
        commonPitfalls: [
            "Not seeing Cargo NII buttons on a production site: SMB share integration is disabled by default until an Administrator enables it in `/extensions` — operators can still upload local `.uff` files manually inside Event Details anytime.",
            "Linking a scan from an SMB share does NOT duplicate gigabytes of X-ray archives into OSCAR: OSCAR stores a lightweight `.uffref.json` pointer.",
        ],
        translations: {
            en: {
                chipLabel: "Cargo X-Ray",
                title: "16-Bit WCO UFF Cargo X-Ray & HEMD Material Inspection",
                screenshotCaption: "16-bit WCO UFF 3.0 cargo radiograph inspector with window/level LUT controls, HEMD effective-Z material bands, and aligned RPM count strip.",
                whyItMatters:
                    "Correlating dual-energy cargo X-ray High-Z shielding anomalies (`Z_eff > 72`) via the Cargo X-Ray inspector {{icon:uff}} (stacked-layers icon) with the aligned RPM gamma/neutron count profile pinpoints dense lead/uranium shielding hidden inside ordinary cargo pallets.",
                steps: [
                    "Open Events {{icon:events}} (`/event-log`) and paste the sandbox UFF UUID (`dfb985c4-eb26-41ab-938b-ad2a1f5966d4`) or container `SCFU8572724` into the search bar to reveal the Open Cargo X-Ray {{icon:uff}} button — OR open an Event Details page and click `Browse Cargo NII Share` / `Upload .uff`.",
                    "Inside the 16-bit X-Ray Inspector {{icon:uff}}, adjust Window/Level contrast to see through dense steel, toggle the HEMD High-Z material overlay (`Organic`, `Intermediate`, `Inorganic`, `High-Z Shielding`), and compare the localized dense anomaly against the synchronized RPM radiation count strip.",
                    "Click `Link to Adjudication` (zero-download reference linking on SMB shares) — or download `sample-cargo-uff3.uff` below to practice direct offline `.uff` inspection.",
                ],
                keyTerms: [
                    {
                        term: "WCO UFF 2.0 / 3.0 (`.uff`)",
                        meaning: "World Customs Organization Unified File Format package exported by cargo X-ray scanners containing 16-bit radiographs, manifest data, and scan metadata.",
                    },
                    {
                        term: "HEMD & `Z_eff > 72` (High-Z)",
                        meaning: "High-Energy Material Discrimination separating organic (`orange`), intermediate (`green`), steel/inorganic (`blue`), and very dense High-Z shielding (`lead/uranium/tungsten`).",
                    },
                    {
                        term: "Window / Level (16-Bit LUT)",
                        meaning: "Interactive brightness/contrast window across all 65,536 X-ray intensity levels so dense cargo areas reveal hidden objects without clipping.",
                    },
                    {
                        term: "Fuzzy 1-Char Container Correlation",
                        meaning: "Matches scanner container reads to portal OCR even when one character is misread (`0`/`O`, `1`/`I`, `8`/`B`).",
                    },
                ],
                commonPitfalls: [
                    "Not seeing Cargo NII buttons on a production site: SMB share integration is disabled by default until an Administrator enables it in `/extensions` — operators can still upload local `.uff` files manually inside Event Details anytime.",
                    "Linking a scan from an SMB share does NOT duplicate gigabytes of X-ray archives into OSCAR: OSCAR stores a lightweight `.uffref.json` pointer.",
                ],
                objectiveSummary: "Sandbox Cargo NII index active with practice `.uff` packages (`cargoUffEnabled && cargoUffIndexedCount >= 1`).",
            },
            es: {
                chipLabel: "Rayos X UFF",
                title: "Inspección de rayos X de carga WCO UFF 16 bits y discriminación HEMD",
                screenshotCaption: "Inspector de radiografía de carga WCO UFF 3.0 de 16 bits con ventana/nivel, bandas de material HEMD y tira RPM alineada.",
                whyItMatters:
                    "Correlacionar anomalías de blindaje de alto número atómico (`Z_eff > 72`) en el inspector de rayos X {{icon:uff}} con el perfil gamma/neutrones del RPM localiza fuentes blindadas dentro de carga densa.",
                steps: [
                    "Abra Eventos {{icon:events}} (`/event-log`) y pegue el UUID UFF (`dfb985c4-eb26-41ab-938b-ad2a1f5966d4`) o el contenedor `SCFU8572724` en la búsqueda para mostrar Abrir rayos X de carga {{icon:uff}}, o entre en Detalles del evento.",
                    "En el inspector de 16 bits {{icon:uff}}, ajuste Ventana/Nivel para atravesar acero denso, active la superposición HEMD (`Orgánico`, `Intermedio`, `Inorgánico`, `Blindaje High-Z`) y compárela con la franja de conteos RPM.",
                    "Vincule el escaneo a la adjudicación sin duplicar archivos SMB, o descargue `sample-cargo-uff3.uff` abajo para probar la carga local directa.",
                ],
                keyTerms: [
                    {
                        term: "WCO UFF 2.0 / 3.0 (`.uff`)",
                        meaning: "Formato unificado de la OMA generado por escáneres de rayos X de carga con radiografías de 16 bits y metadatos.",
                    },
                    {
                        term: "HEMD y `Z_eff > 72` (High-Z)",
                        meaning: "Discriminación de materiales de alta energía que separa orgánico, intermedio, acero y blindaje muy denso (plomo/uranio).",
                    },
                    {
                        term: "Ventana / Nivel (16 bits)",
                        meaning: "Ajuste interactivo de contraste sobre 65.536 niveles de intensidad para ver zonas oscuras sin saturar.",
                    },
                    {
                        term: "Correlación OCR difusa (1 carácter)",
                        meaning: "Asocia lecturas del escáner y del pórtico aun si un carácter se leyó distinto (`0`/`O`, `8`/`B`).",
                    },
                ],
                commonPitfalls: [
                    "Si no ve botones de Carga NII en producción, el administrador debe habilitar el recurso SMB en `/extensions` (la carga manual de `.uff` locales siempre funciona).",
                    "Vincular desde SMB guarda una referencia ligera `.uffref.json` sin copiar gigabytes al servidor OSCAR.",
                ],
                objectiveSummary: "Índice de Carga NII activo con paquetes `.uff` de práctica (`cargoUffEnabled && cargoUffIndexedCount >= 1`).",
            },
            fr: {
                chipLabel: "Rayons X UFF",
                title: "Inspection rayons X fret WCO UFF 16 bits et matériaux HEMD",
                screenshotCaption: "Inspecteur radiographique WCO UFF 3.0 16 bits avec réglages fenêtre/niveau, bandes HEMD et bande RPM alignée.",
                whyItMatters:
                    "Corréler les anomalies de blindage dense (`Z_eff > 72`) dans l’inspecteur rayons X {{icon:uff}} avec le profil gamma/neutrons du RPM permet de repérer des sources blindées dissimulées dans le fret.",
                steps: [
                    "Ouvrez Événements {{icon:events}} (`/event-log`) et collez l’UUID UFF (`dfb985c4-eb26-41ab-938b-ad2a1f5966d4`) ou `SCFU8572724` dans la recherche pour afficher Ouvrir rayons X fret {{icon:uff}}, ou ouvrez les Détails d’un événement.",
                    "Dans l’inspecteur 16 bits {{icon:uff}}, réglez Fenêtre/Niveau, activez la surcouche HEMD (`Organique`, `Intermédiaire`, `Inorganique`, `Blindage High-Z`) et comparez avec la bande synchronisée RPM.",
                    "Liez le scan à l’adjudication (lien léger sans copie du partage SMB) ou téléchargez `sample-cargo-uff3.uff` ci-dessous pour tester un chargement local.",
                ],
                keyTerms: [
                    {
                        term: "WCO UFF 2.0 / 3.0 (`.uff`)",
                        meaning: "Format unifié de l’OMD produit par les scanners rayons X fret contenant radiographies 16 bits et métadonnées.",
                    },
                    {
                        term: "HEMD & `Z_eff > 72` (High-Z)",
                        meaning: "Discrimination matériaux haute énergie distinguant organique, intermédiaire, acier et blindages lourds (plomb/uranium).",
                    },
                    {
                        term: "Fenêtre / Niveau (16 bits)",
                        meaning: "Réglage dynamique du contraste sur 65 536 niveaux pour révéler les objets cachés dans les zones denses.",
                    },
                    {
                        term: "Corrélation OCR tolérante (1 caractère)",
                        meaning: "Rapproche les lectures scanner et portique même avec 1 caractère divergent (`0`/`O`, `8`/`B`).",
                    },
                ],
                commonPitfalls: [
                    "Boutons fret NII absents en production : le partage SMB est désactivé par défaut jusqu’à activation dans `/extensions` (l’import manuel d’un `.uff` reste toujours disponible).",
                    "Le lien SMB crée un léger pointeur `.uffref.json` sans dupliquer les archives radiographiques sur OSCAR.",
                ],
                objectiveSummary: "Index fret NII actif avec archives `.uff` d’exercice (`cargoUffEnabled && cargoUffIndexedCount >= 1`).",
            },
            el: {
                chipLabel: "Ακτινογραφία UFF",
                title: "Επιθεώρηση ακτινογραφιών φορτίου 16-bit WCO UFF & υλικών HEMD",
                screenshotCaption: "Επιθεωρητής ακτινογραφιών WCO UFF 3.0 16-bit με έλεγχο αντίθεσης, ζώνες υλικών HEMD και συγχρονισμένη λωρίδα RPM.",
                whyItMatters:
                    "Η συσχέτιση ανωμαλιών βαριάς θωράκισης (`Z_eff > 72`) στον επιθεωρητή ακτινογραφιών {{icon:uff}} με την καμπύλη γάμμα/νετρονίων του RPM εντοπίζει θωρακισμένες πηγές μέσα σε πυκνό φορτίο.",
                steps: [
                    "Ανοίξτε τα Συμβάντα {{icon:events}} (`/event-log`) και επικολλήστε το UUID UFF (`dfb985c4-eb26-41ab-938b-ad2a1f5966d4`) ή το κοντέινερ `SCFU8572724` για να εμφανιστεί το Άνοιγμα Ακτινογραφίας {{icon:uff}}, ή ανοίξτε Λεπτομέρειες συμβάντος.",
                    "Στον επιθεωρητή 16-bit {{icon:uff}}, ρυθμίστε Window/Level, ενεργοποιήστε την επικάλυψη HEMD (`Οργανικά`, `Ενδιάμεσα`, `Ανόργανα`, `Θωράκιση High-Z`) και συγκρίνετε με τη συγχρονισμένη λωρίδα RPM.",
                    "Συνδέστε τη σάρωση στην αξιολόγηση (χωρίς αντιγραφή του αρχείου SMB) ή κατεβάστε το `sample-cargo-uff3.uff` παρακάτω για τοπική δοκιμή.",
                ],
                keyTerms: [
                    {
                        term: "WCO UFF 2.0 / 3.0 (`.uff`)",
                        meaning: "Ενιαία μορφή αρχείων Παγκόσμιου Οργανισμού Τελωνείων από σαρωτές φορτίου με ακτινογραφίες 16-bit.",
                    },
                    {
                        term: "HEMD & `Z_eff > 72` (High-Z)",
                        meaning: "Διαχωρισμός υλικών υψηλής ενέργειας (οργανικά, ενδιάμεσα, χάλυβας και βαριά θωράκιση μολύβδου/ουρανίου).",
                    },
                    {
                        term: "Window / Level (16-bit)",
                        meaning: "Δυναμική ρύθμιση αντίθεσης σε 65.536 στάθμες ώστε να διακρίνονται αντικείμενα σε πυκνές περιοχές.",
                    },
                    {
                        term: "Ασαφής συσχέτιση OCR (1 χαρακτήρας)",
                        meaning: "Ταιριάζει αναγνώσεις σαρωτή και πύλης ακόμη και με 1 διαφορετικό χαρακτήρα (`0`/`O`, `8`/`B`).",
                    },
                ],
                commonPitfalls: [
                    "Αν δεν φαίνονται κουμπιά Cargo NII στην παραγωγή, ο διαχειριστής πρέπει να ενεργοποιήσει το SMB στις `/extensions` (η τοπική μεταφόρτωση `.uff` λειτουργεί πάντα).",
                    "Η σύνδεση από SMB αποθηκεύει μόνο ελαφρύ δείκτη `.uffref.json` χωρίς διπλοεγγραφή αρχείων.",
                ],
                objectiveSummary: "Ενεργό ευρετήριο Cargo NII με δείγματα `.uff` (`cargoUffEnabled && cargoUffIndexedCount >= 1`).",
            },
        },
        sampleFiles: [
            {
                fileName: "sample-cargo-uff3.uff",
                buttonLabel: "Download Practice Cargo Scan (.uff)",
                buttonLabels: {
                    es: "Descargar escaneo de carga (.uff)",
                    fr: "Télécharger scan fret (.uff)",
                    el: "Λήψη δείγματος ακτινογραφίας (.uff)",
                },
            },
        ],
        copySnippets: [
            {
                label: "Copy UFF Scan UUID",
                labels: {
                    es: "Copiar UUID UFF",
                    fr: "Copier l’UUID UFF",
                    el: "Αντιγραφή UUID UFF",
                },
                value: "dfb985c4-eb26-41ab-938b-ad2a1f5966d4",
            },
        ],
        spotlights: [
            {
                id: "events",
                selector: '[data-testid="nav-item-events"]',
                label: "Highlight Events Icon",
                iconKey: "events",
            },
            {
                id: "uff",
                selector: '[data-testid="event-log-open-uff-btn"], [data-testid="vehicle-id-search-bar"]',
                label: "Highlight Cargo UFF Search / X-Ray Control",
                labels: {
                    es: "Resaltar búsqueda / botón de rayos X UFF",
                    fr: "Mettre en évidence la recherche / bouton rayons X UFF",
                    el: "Επισήμανση αναζήτησης / κουμπιού ακτινογραφίας UFF",
                },
                iconKey: "uff",
            },
        ],
        spotlightSelector: '[data-testid="nav-item-events"]',
        spotlightLabel: "Highlight Events Icon",
        objectiveSummary: "Sandbox Cargo NII index active with practice `.uff` packages (`cargoUffEnabled && cargoUffIndexedCount >= 1`).",
        isAutoVerified: (v) => v.cargoUffEnabled && v.cargoUffIndexedCount >= 1,
    },
    {
        id: "op-custom-dashboards",
        trackId: "operator",
        badge: "1.8",
        chipLabel: "Custom Boards",
        route: "/dashboards",
        pageIconKey: "dashboard",
        videoGuideSlug: "32-custom-widget-dashboards",
        screenshotFile: "56-custom-dashboards-workspace.png",
        screenshotCaption: "Custom Dashboards (/dashboards) workspace with starter template gallery, 12-column widget grid, per-page stream caps, and JSON export/import.",
        title: "Build, Customize & Share Custom Widget Dashboards",
        durationEstimate: "4 min",
        whyItMatters:
            "Operators can assemble personal or view-scoped wallboards in Custom Dashboards (`/dashboards`) without altering the built-in Gatehouse Dashboard {{icon:dashboard}}, while automatic guardrails (`<= 4` live video streams and `<= 6` live charts per page) protect browser stability across 50-lane portals.",
        steps: [
            "Open Custom Dashboards (`/dashboards` from the left navigation drawer) and pick a starter template such as `Multi-Lane Wallboard` or `Alarm & Map Overview`.",
            "Click `Edit Layout`, open `Add Widget`, and add or configure a widget while observing the per-page `<= 4` live-video (`4/4`) and `<= 6` live-chart (`6/6`) guardrails.",
            "Click `Done` to lock the layout (auto-saved per operator and Operational View) and open `Import / Export` to export a validated JSON layout (`<= 512 KiB`) for shift sharing.",
        ],
        keyTerms: [
            {
                term: "12-Column Widget Grid",
                meaning: "Drag-and-resize canvas letting operators combine lane cameras, count-rate charts, alarm queues, maps, and statistics cards.",
            },
            {
                term: "Stream Cap Guardrails (`4` Video / `6` Charts)",
                meaning: "Automatic per-page limits keeping multi-lane browser memory and CPU smooth on 50-lane deployments.",
            },
            {
                term: "JSON Layout Sharing (`<= 512 KiB`)",
                meaning: "Validated portable layout file so a lead operator can share an approved gatehouse wallboard across booths.",
            },
        ],
        commonPitfalls: [
            "Cannot add a 5th live video tile on one page: create a second Custom Dashboard tab/page instead — the `4` video / `6` chart guardrail prevents browser tab crashes.",
            "Built-in Dashboard (`/`) stays unchanged even if you experiment freely in `/dashboards`.",
        ],
        translations: {
            en: {
                chipLabel: "Custom Boards",
                title: "Build, Customize & Share Custom Widget Dashboards",
                screenshotCaption: "Custom Dashboards (/dashboards) workspace with starter template gallery, 12-column widget grid, per-page stream caps, and JSON export/import.",
                whyItMatters:
                    "Operators can assemble personal or view-scoped wallboards in Custom Dashboards (`/dashboards`) without altering the built-in Gatehouse Dashboard {{icon:dashboard}}, while automatic guardrails (`<= 4` live video streams and `<= 6` live charts per page) protect browser stability across 50-lane portals.",
                steps: [
                    "Open Custom Dashboards (`/dashboards` from the left navigation drawer) and pick a starter template such as `Multi-Lane Wallboard` or `Alarm & Map Overview`.",
                    "Click `Edit Layout`, open `Add Widget`, and add or configure a widget while observing the per-page `<= 4` live-video (`4/4`) and `<= 6` live-chart (`6/6`) guardrails.",
                    "Click `Done` to lock the layout (auto-saved per operator and Operational View) and open `Import / Export` to export a validated JSON layout (`<= 512 KiB`) for shift sharing.",
                ],
                keyTerms: [
                    {
                        term: "12-Column Widget Grid",
                        meaning: "Drag-and-resize canvas letting operators combine lane cameras, count-rate charts, alarm queues, maps, and statistics cards.",
                    },
                    {
                        term: "Stream Cap Guardrails (`4` Video / `6` Charts)",
                        meaning: "Automatic per-page limits keeping multi-lane browser memory and CPU smooth on 50-lane deployments.",
                    },
                    {
                        term: "JSON Layout Sharing (`<= 512 KiB`)",
                        meaning: "Validated portable layout file so a lead operator can share an approved gatehouse wallboard across booths.",
                    },
                ],
                commonPitfalls: [
                    "Cannot add a 5th live video tile on one page: create a second Custom Dashboard tab/page instead — the `4` video / `6` chart guardrail prevents browser tab crashes.",
                    "Built-in Dashboard (`/`) stays unchanged even if you experiment freely in `/dashboards`.",
                ],
                objectiveSummary: "Save at least 1 custom dashboard page in `/dashboards` (`oscar.pageLayouts*` / persisted layout `>= 1` page).",
            },
            es: {
                chipLabel: "Paneles propios",
                title: "Crear, personalizar y compartir paneles de widgets a medida",
                screenshotCaption: "Espacio de trabajo de Paneles personalizados (/dashboards) con galería de plantillas, cuadrícula de 12 columnas, límites de flujos en vivo y exportación/importación JSON.",
                whyItMatters:
                    "Los operadores pueden armar murales por usuario y Vista operativa en Paneles personalizados (`/dashboards`) sin alterar el Panel principal {{icon:dashboard}}, mientras los límites automáticos (`<= 4` vídeos y `<= 6` gráficos en vivo por página) protegen el rendimiento en portales de 50 carriles.",
                steps: [
                    "Abra Paneles personalizados (`/dashboards` en el menú lateral izquierdo) y elija una plantilla rápida como `Multi-Lane Wallboard` o `Alarm & Map Overview`.",
                    "Active `Editar diseño`, abra `Añadir widget` y agregue o configure un widget observando los límites de `<= 4` vídeos en vivo (`4/4`) y `<= 6` gráficos en vivo (`6/6`).",
                    "Pulse `Listo` para guardar el diseño y abra `Importar / Exportar` para descargar el archivo JSON validado (`<= 512 KiB`).",
                ],
                keyTerms: [
                    {
                        term: "Cuadrícula de 12 columnas",
                        meaning: "Lienzo arrastrable y redimensionable para combinar cámaras, curvas, cola de alarmas, mapa y estadísticas.",
                    },
                    {
                        term: "Límites de protección (`4` vídeos / `6` gráficos)",
                        meaning: "Tope automático por página que protege la estabilidad del navegador en instalaciones de 50 carriles.",
                    },
                    {
                        term: "Intercambio JSON (`<= 512 KiB`)",
                        meaning: "Archivo validado para compartir un mural aprobado entre estaciones de turno.",
                    },
                ],
                commonPitfalls: [
                    "No puede añadir un 5.º vídeo en la misma página: cree una segunda pestaña de Panel personalizado.",
                    "El Panel integrado (`/`) nunca se ve afectado por los cambios en `/dashboards`.",
                ],
                objectiveSummary: "Guardar al menos 1 página de panel personalizado en `/dashboards`.",
            },
            fr: {
                chipLabel: "Tableaux perso",
                title: "Créer, personnaliser et partager des tableaux de bord à widgets sur mesure",
                screenshotCaption: "Espace Tableaux de bord personnalisés (/dashboards) avec galerie de modèles, grille à 12 colonnes, plafonds de flux en direct et export/import JSON.",
                whyItMatters:
                    "Les opérateurs composent des murs d’écran dédiés par compte et Vue opérationnelle dans Tableaux de bord personnalisés (`/dashboards`) sans modifier le Tableau de bord principal {{icon:dashboard}}, avec des plafonds automatiques (`<= 4` vidéos et `<= 6` graphiques en direct par page) garantissant la stabilité sur 50 voies.",
                steps: [
                    "Ouvrez Tableaux de bord personnalisés (`/dashboards` dans le menu latéral gauche) et choisissez un modèle tel que `Multi-Lane Wallboard` ou `Alarm & Map Overview`.",
                    "Cliquez sur `Modifier la disposition`, ouvrez `Ajouter un widget` et configurez un widget tout en vérifiant les plafonds `<= 4` vidéos (`4/4`) et `<= 6` graphiques (`6/6`).",
                    "Verrouillez la mise en page enregistrée automatiquement et ouvrez `Importer / Exporter` pour exporter le fichier JSON validé (`<= 512 KiB`).",
                ],
                keyTerms: [
                    {
                        term: "Grille à 12 colonnes",
                        meaning: "Zone redimensionnable pour assembler caméras, courbes, file d’alarmes, carte et statistiques.",
                    },
                    {
                        term: "Garde-fous (`4` vidéos / `6` graphiques)",
                        meaning: "Plafond par page protégeant la mémoire du navigateur sur les portails 50 voies.",
                    },
                    {
                        term: "Partage JSON (`<= 512 KiB`)",
                        meaning: "Fichier validé permettant de diffuser une disposition approuvée entre postes.",
                    },
                ],
                commonPitfalls: [
                    "Impossible d’ajouter une 5e vidéo sur la même page : créez un second onglet dans `/dashboards`.",
                    "Le Tableau de bord intégré (`/`) reste toujours intact.",
                ],
                objectiveSummary: "Enregistrer au moins 1 page de tableau de bord personnalisé dans `/dashboards`.",
            },
            el: {
                chipLabel: "Προσαρμοσμένοι",
                title: "Δημιουργία, προσαρμογή & κοινή χρήση προσαρμοσμένων πινάκων widgets",
                screenshotCaption: "Χώρος εργασίας Προσαρμοσμένων πινάκων (/dashboards) με συλλογή προτύπων, πλέγμα 12 στηλών, όρια ζωντανών ροών και εξαγωγή/εισαγωγή JSON.",
                whyItMatters:
                    "Οι χειριστές συνθέτουν εξειδικευμένους πίνακες ανά λογαριασμό και Λειτουργική προβολή στους Προσαρμοσμένους πίνακες (`/dashboards`) χωρίς αλλοίωση του κύριου Πίνακα ελέγχου {{icon:dashboard}}, ενώ τα όρια (`<= 4` ζωντανά βίντεο και `<= 6` ζωντανά γραφήματα ανά σελίδα) διασφαλίζουν σταθερότητα σε εγκαταστάσεις 50 λωρίδων.",
                steps: [
                    "Ανοίξτε τους Προσαρμοσμένους πίνακες (`/dashboards` από το αριστερό μενού) και επιλέξτε πρότυπο όπως `Multi-Lane Wallboard` ή `Alarm & Map Overview`.",
                    "Ενεργοποιήστε την επεξεργασία διάταξης, ανοίξτε την προσθήκη widget και ρυθμίστε ένα widget ελέγχοντας τα όρια `<= 4` ζωντανών βίντεο (`4/4`) και `<= 6` ζωντανών γραφημάτων (`6/6`).",
                    "Αποθηκεύστε τη διάταξη και ανοίξτε `Import / Export` για εξαγωγή επικυρωμένου αρχείου JSON (`<= 512 KiB`).",
                ],
                keyTerms: [
                    {
                        term: "Πλέγμα 12 στηλών",
                        meaning: "Ευέλικτη διάταξη για συνδυασμό καμερών, καμπυλών, συναγερμών, χάρτη και στατιστικών.",
                    },
                    {
                        term: "Όρια ασφαλείας (`4` βίντεο / `6` γραφήματα)",
                        meaning: "Αυτόματος περιορισμός ανά σελίδα για σταθερότητα φυλλομετρητή σε 50 λωρίδες.",
                    },
                    {
                        term: "Κοινή χρήση JSON (`<= 512 KiB`)",
                        meaning: "Επικυρωμένο αρχείο διάταξης για αντιγραφή σε άλλους σταθμούς βάρδιας.",
                    },
                ],
                commonPitfalls: [
                    "Δεν προστίθεται 5ο ζωντανό βίντεο στην ίδια σελίδα: δημιουργήστε δεύτερη καρτέλα στον `/dashboards`.",
                    "Ο κύριος Πίνακας ελέγχου (`/`) παραμένει πάντα αμετάβλητος.",
                ],
                objectiveSummary: "Αποθήκευση τουλάχιστον 1 σελίδας προσαρμοσμένου πίνακα στο `/dashboards`.",
            },
        },
        spotlights: [
            {
                id: "custom-dashboards-nav",
                selector: '[data-testid="nav-item-custom-dashboards"], [data-testid="custom-dashboards-page"]',
                label: "Highlight Custom Dashboards",
                labels: {
                    es: "Resaltar Paneles personalizados",
                    fr: "Mettre en évidence Tableaux personnalisés",
                    el: "Επισήμανση Προσαρμοσμένων πινάκων",
                },
                iconKey: "dashboard",
            },
            {
                id: "starter-templates",
                selector: '[data-testid="starter-template-multi-lane-wallboard"], [data-testid="starter-template-alarm-map-overview"], [data-testid="dashboards-templates-button"]',
                label: "Highlight Starter Templates",
                labels: {
                    es: "Resaltar plantillas rápidas",
                    fr: "Mettre en évidence les modèles",
                    el: "Επισήμανση προτύπων",
                },
            },
            {
                id: "dashboard-host",
                selector: '[data-testid="custom-dashboard-host"], [data-testid="dashboards-import-export-button"]',
                label: "Highlight Widget Grid & Export",
                labels: {
                    es: "Resaltar cuadrícula y exportación",
                    fr: "Mettre en évidence la grille et l’export",
                    el: "Επισήμανση πλέγματος & εξαγωγής",
                },
            },
        ],
        spotlightSelector: '[data-testid="starter-template-multi-lane-wallboard"], [data-testid="custom-dashboard-host"], [data-testid="custom-dashboards-page"]',
        spotlightLabel: "Highlight Custom Dashboards Workspace",
        objectiveSummary: "Save at least 1 custom dashboard page in `/dashboards` (`oscar.pageLayouts*` / persisted layout `>= 1` page).",
        isAutoVerified: () => hasSavedCustomDashboardLayout(),
    },
];
