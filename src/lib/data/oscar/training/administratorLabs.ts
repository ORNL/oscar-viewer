/*
 * Copyright (c) 2026. Botts Innovative Research, Inc.
 * All Rights Reserved
 */

import { TrainingLabDefinition } from "@/lib/data/oscar/training/types";

export const ADMINISTRATOR_TRAINING_LABS: readonly TrainingLabDefinition[] = [
    {
        id: "adm-1",
        trackId: "administrator",
        badge: "3.1",
        chipLabel: "Manual Lane",
        route: "/",
        pageIconKey: "split-admin",
        splitPaneAdmin: true,
        videoGuideSlug: "06-admin-manual-lane-and-site-diagram",
        screenshotFile: "25-lane-options-filled.png",
        screenshotCaption: "SensorHub Admin Lane System configuration with Rapiscan RPM, Custom RTSP camera options, coordinates, and Site Diagram setup.",
        title: "Manual Lane, Rapiscan RPM, Site Diagram & Loopback RTSP Setup",
        durationEstimate: "6 min",
        whyItMatters:
            "Starting from 0 configured lanes in Track 3 lets administrators safely practice adding a fixed portal `Lane System` and uploading a georeferenced Site Diagram inside Split-Pane SensorHub Admin {{icon:split-admin}} without ever risking production sensors or `config.json`.",
        steps: [
            "Click 'Open Split-Pane SensorHub Admin' {{icon:split-admin}} above to open `/sensorhub/admin` side by side with this Coach.",
            "Right-click the `Systems` pane -> `Add Module` -> `Lane System` (`DemoLane01`, UID `tutorial-lane-01`, check `Auto-Start`). Set latitude/longitude under Location (for Map {{icon:map}}), then under `Lane Options` add Initial RPM Config (`Rapiscan`, Host `127.0.0.1`, Port `10099`, EML enabled) and Initial Camera Config (`Custom`, Host `127.0.0.1:8554`, Stream Path `/tutorial-cam`).",
            "Click `Apply Changes` and `Start` the module, then verify in Status of Health {{icon:health}} (`/health`) that `DemoLane01` comes Online! (In production, you can also upload a georeferenced aerial Site Diagram image under `Services -> OSCAR Service -> Site Diagram` with corner coordinates.)",
        ],
        keyTerms: [
            {
                term: "SensorHub Admin (`/sensorhub/admin`)",
                meaning: "Administrator configuration console for adding/starting Lane Systems, Mobile Detectors, OSCAR Service retention/EML, and bulk CSV imports.",
            },
            {
                term: "Unique ID (`uniqueID`) & `Auto-Start`",
                meaning: "Stable machine identifier (`tutorial-lane-01`) keeping historical observations tied to the same lane across restarts; `Auto-Start` brings the lane online on reboot.",
            },
            {
                term: "Georeferenced Site Diagram",
                meaning: "Optional aerial PNG/JPEG overlay with North/South/East/West bounds displayed on `/map` when tile maps or `.pmtiles` lack site-level detail.",
            },
        ],
        commonPitfalls: [
            "Forgetting to check `Auto-Start` or click `Start` after `Apply Changes`: the lane stays saved in `config.json` as stopped until started.",
            "In real deployments, configure lane cameras to `1080p` @ `15 fps` with `1 s` keyframe interval (GOP = 15) for smooth HLS playback and crisp 5-JPEG/OCR captures.",
        ],
        translations: {
            en: {
                chipLabel: "Manual Lane",
                title: "Manual Lane, Rapiscan RPM, Site Diagram & Loopback RTSP Setup",
                screenshotCaption: "SensorHub Admin Lane System configuration with Rapiscan RPM, Custom RTSP camera options, coordinates, and Site Diagram setup.",
                whyItMatters:
                    "Starting from 0 configured lanes in Track 3 lets administrators safely practice adding a fixed portal `Lane System` and uploading a georeferenced Site Diagram inside Split-Pane SensorHub Admin {{icon:split-admin}} without ever risking production sensors or `config.json`.",
                steps: [
                    "Click 'Open Split-Pane SensorHub Admin' {{icon:split-admin}} above to open `/sensorhub/admin` side by side with this Coach.",
                    "Right-click the `Systems` pane -> `Add Module` -> `Lane System` (`DemoLane01`, UID `tutorial-lane-01`, check `Auto-Start`). Set latitude/longitude under Location (for Map {{icon:map}}), then under `Lane Options` add Initial RPM Config (`Rapiscan`, Host `127.0.0.1`, Port `10099`, EML enabled) and Initial Camera Config (`Custom`, Host `127.0.0.1:8554`, Stream Path `/tutorial-cam`).",
                    "Click `Apply Changes` and `Start` the module, then verify in Status of Health {{icon:health}} (`/health`) that `DemoLane01` comes Online! (In production, you can also upload a georeferenced aerial Site Diagram image under `Services -> OSCAR Service -> Site Diagram` with corner coordinates.)",
                ],
                keyTerms: [
                    {
                        term: "SensorHub Admin (`/sensorhub/admin`)",
                        meaning: "Administrator configuration console for adding/starting Lane Systems, Mobile Detectors, OSCAR Service retention/EML, and bulk CSV imports.",
                    },
                    {
                        term: "Unique ID (`uniqueID`) & `Auto-Start`",
                        meaning: "Stable machine identifier (`tutorial-lane-01`) keeping historical observations tied to the same lane across restarts; `Auto-Start` brings the lane online on reboot.",
                    },
                    {
                        term: "Georeferenced Site Diagram",
                        meaning: "Optional aerial PNG/JPEG overlay with North/South/East/West bounds displayed on `/map` when tile maps or `.pmtiles` lack site-level detail.",
                    },
                ],
                commonPitfalls: [
                    "Forgetting to check `Auto-Start` or click `Start` after `Apply Changes`: the lane stays saved in `config.json` as stopped until started.",
                    "In real deployments, configure lane cameras to `1080p` @ `15 fps` with `1 s` keyframe interval (GOP = 15) for smooth HLS playback and crisp 5-JPEG/OCR captures.",
                ],
                objectiveSummary: "Configure and start at least 1 online Lane System (`configuredLaneCount >= 1 && onlineLaneCount >= 1`).",
            },
            es: {
                chipLabel: "Carril manual",
                title: "Alta manual de carril, RPM Rapiscan, plano del sitio y cámara RTSP",
                screenshotCaption: "Configuración de Lane System en SensorHub Admin con RPM Rapiscan, cámara RTSP, coordenadas y plano del sitio.",
                whyItMatters:
                    "Empezar con 0 carriles en el Bloque 3 permite practicar el alta de un `Lane System` y plano del sitio en SensorHub Admin en vista dividida {{icon:split-admin}} sin tocar jamás sensores reales ni `config.json`.",
                steps: [
                    "Pulse 'Abrir SensorHub Admin en vista dividida' {{icon:split-admin}} arriba para mostrar `/sensorhub/admin` junto a esta guía.",
                    "Haga clic derecho en `Systems` -> `Add Module` -> `Lane System` (`DemoLane01`, UID `tutorial-lane-01`, marque `Auto-Start`). Defina latitud/longitud, añada Initial RPM Config (`Rapiscan`, Host `127.0.0.1`, Puerto `10099`, EML activo) e Initial Camera Config (`Custom`, Host `127.0.0.1:8554`, Ruta `/tutorial-cam`).",
                    "Pulse `Apply Changes` y `Start`, luego confirme en Estado de salud {{icon:health}} (`/health`) que `DemoLane01` pasa a En línea (en producción también puede subir un plano georreferenciado en `OSCAR Service -> Site Diagram`).",
                ],
                keyTerms: [
                    {
                        term: "SensorHub Admin (`/sensorhub/admin`)",
                        meaning: "Consola administrativa para crear carriles, detectores móviles, retención/EML e importaciones CSV.",
                    },
                    {
                        term: "`uniqueID` y `Auto-Start`",
                        meaning: "Identificador estable que conserva el historial del carril tras reinicios; `Auto-Start` lo inicia automáticamente.",
                    },
                    {
                        term: "Plano georreferenciado del sitio",
                        meaning: "Imagen aérea PNG/JPEG con límites cardinales mostrada en `/map` cuando no bastan mapas base.",
                    },
                ],
                commonPitfalls: [
                    "Olvidar marcar `Auto-Start` o pulsar `Start` tras `Apply Changes`: el carril queda detenido.",
                    "En producción, ajuste cámaras a `1080p` @ `15 fps` con intervalo clave de `1 s` (GOP = 15).",
                ],
                objectiveSummary: "Configurar e iniciar al menos 1 Lane System en línea (`configuredLaneCount >= 1 && onlineLaneCount >= 1`).",
            },
            fr: {
                chipLabel: "Voie manuelle",
                title: "Création manuelle d’une voie, RPM Rapiscan, plan de site et caméra RTSP",
                screenshotCaption: "Configuration Lane System dans SensorHub Admin avec RPM Rapiscan, caméra RTSP, coordonnées et plan de site.",
                whyItMatters:
                    "Démarrer à 0 voie dans le Parcours 3 permet de pratiquer l’ajout d’un `Lane System` dans SensorHub Admin en vue partagée {{icon:split-admin}} sans toucher aux capteurs réels ni à `config.json`.",
                steps: [
                    "Cliquez sur « Ouvrir SensorHub Admin en vue partagée » {{icon:split-admin}} ci-dessus pour afficher `/sensorhub/admin` à côté du Coach.",
                    "Clic droit sur `Systems` -> `Add Module` -> `Lane System` (`DemoLane01`, UID `tutorial-lane-01`, cochez `Auto-Start`). Saisissez les coordonnées, puis ajoutez Initial RPM Config (`Rapiscan`, Hôte `127.0.0.1`, Port `10099`, EML actif) et Initial Camera Config (`Custom`, Hôte `127.0.0.1:8554`, Chemin `/tutorial-cam`).",
                    "Cliquez sur `Apply Changes` puis `Start` et vérifiez dans État de santé {{icon:health}} (`/health`) que `DemoLane01` passe En ligne.",
                ],
                keyTerms: [
                    {
                        term: "SensorHub Admin (`/sensorhub/admin`)",
                        meaning: "Console d’administration des voies, détecteurs mobiles, rétention/EML et imports CSV.",
                    },
                    {
                        term: "`uniqueID` & `Auto-Start`",
                        meaning: "Identifiant stable préservant l’historique de la voie ; `Auto-Start` relance automatiquement au démarrage.",
                    },
                    {
                        term: "Plan du site géoréférencé",
                        meaning: "Image aérienne PNG/JPEG calibrée par coordonnées cardinales pour `/map`.",
                    },
                ],
                commonPitfalls: [
                    "Oublier `Auto-Start` ou `Start` après `Apply Changes` : la voie reste enregistrée à l’arrêt.",
                    "En production, réglez les caméras sur `1080p` @ `15 ips` et GOP `1 s` (15 images).",
                ],
                objectiveSummary: "Configurer et démarrer au moins 1 Lane System en ligne (`configuredLaneCount >= 1 && onlineLaneCount >= 1`).",
            },
            el: {
                chipLabel: "Χειροκίνητη λωρίδα",
                title: "Χειροκίνητη ρύθμιση λωρίδας, Rapiscan RPM, διαγράμματος & κάμερας RTSP",
                screenshotCaption: "Ρύθμιση Lane System στο SensorHub Admin με Rapiscan RPM, κάμερα RTSP, συντεταγμένες και διάγραμμα.",
                whyItMatters:
                    "Ξεκινώντας από 0 λωρίδες στην Ενότητα 3 εξασκείστε με ασφάλεια στη δημιουργία `Lane System` στο SensorHub Admin {{icon:split-admin}} χωρίς επαφή με παραγωγικούς αισθητήρες ή `config.json`.",
                steps: [
                    "Πατήστε «Άνοιγμα SensorHub Admin σε διπλή προβολή» {{icon:split-admin}} επάνω για να ανοίξει το `/sensorhub/admin` δίπλα στον Οδηγό.",
                    "Δεξί κλικ στο `Systems` -> `Add Module` -> `Lane System` (`DemoLane01`, UID `tutorial-lane-01`, `Auto-Start` ενεργό). Ορίστε συντεταγμένες, Initial RPM Config (`Rapiscan`, Host `127.0.0.1`, Port `10099`, EML ενεργό) και Initial Camera Config (`Custom`, Host `127.0.0.1:8554`, Path `/tutorial-cam`).",
                    "Πατήστε `Apply Changes` και `Start`, έπειτα επιβεβαιώστε στην Κατάσταση υγείας {{icon:health}} (`/health`) ότι η `DemoLane01` είναι Σε σύνδεση.",
                ],
                keyTerms: [
                    {
                        term: "SensorHub Admin (`/sensorhub/admin`)",
                        meaning: "Κονσόλα διαχείρισης για λωρίδες, κινητούς ανιχνευτές, διατήρηση/EML και μαζική εισαγωγή CSV.",
                    },
                    {
                        term: "`uniqueID` & `Auto-Start`",
                        meaning: "Σταθερό αναγνωριστικό που διατηρεί το ιστορικό της λωρίδας· το `Auto-Start` εκκινεί αυτόματα.",
                    },
                    {
                        term: "Γεωαναφερθέν διάγραμμα",
                        meaning: "Αεροφωτογραφία PNG/JPEG με όρια συντεταγμένων που προβάλλεται στον `/map`.",
                    },
                ],
                commonPitfalls: [
                    "Αν ξεχάσετε `Auto-Start` ή `Start` μετά το `Apply Changes`, η λωρίδα μένει σταματημένη.",
                    "Στην παραγωγή ρυθμίστε κάμερες σε `1080p` @ `15 fps` με GOP `1 s` (15 καρέ).",
                ],
                objectiveSummary: "Ρύθμιση και εκκίνηση τουλάχιστον 1 ενεργού Lane System (`configuredLaneCount >= 1 && onlineLaneCount >= 1`).",
            },
        },
        copySnippets: [
            { label: "Copy RPM Host", labels: { es: "Copiar Host RPM", fr: "Copier Hôte RPM", el: "Αντιγραφή Host RPM" }, value: "127.0.0.1" },
            { label: "Copy RPM Port", labels: { es: "Copiar Puerto RPM", fr: "Copier Port RPM", el: "Αντιγραφή Θύρας RPM" }, value: "10099" },
            { label: "Copy Camera Host", labels: { es: "Copiar Host Cámara", fr: "Copier Hôte Caméra", el: "Αντιγραφή Host Κάμερας" }, value: "127.0.0.1:8554" },
            { label: "Copy Stream Path", labels: { es: "Copiar Ruta RTSP", fr: "Copier Chemin RTSP", el: "Αντιγραφή Διαδρομής RTSP" }, value: "/tutorial-cam" },
        ],
        spotlights: [
            {
                id: "split-admin",
                selector: '[data-testid="training-toggle-split-admin"], [data-testid="training-refresher-admin-link"]',
                label: "Highlight Split-Pane Admin Button",
                iconKey: "split-admin",
            },
            {
                id: "health",
                selector: '[data-testid="nav-item-health"]',
                label: "Highlight Status of Health Icon",
                iconKey: "health",
            },
        ],
        spotlightSelector: '[data-testid="training-toggle-split-admin"], [data-testid="training-refresher-admin-link"]',
        spotlightLabel: "Highlight Split-Pane Admin Button",
        objectiveSummary: "Configure and start at least 1 online Lane System (`configuredLaneCount >= 1 && onlineLaneCount >= 1`).",
        isAutoVerified: (v) => v.configuredLaneCount >= 1 && v.onlineLaneCount >= 1,
    },
    {
        id: "adm-2",
        trackId: "administrator",
        badge: "3.2",
        chipLabel: "Bulk CSV Sync",
        route: "/",
        pageIconKey: "split-admin",
        splitPaneAdmin: true,
        videoGuideSlug: "05-admin-lane-spreadsheet-sync",
        screenshotFile: "16-csv-upload-success.png",
        screenshotCaption: "Bulk multi-lane CSV configuration import inside SensorHub Admin -> Services -> OSCAR Service.",
        title: "1-Click Bulk Lane Spreadsheet Import (`config.csv`)",
        durationEstimate: "3 min",
        whyItMatters:
            "At multi-lane ports of entry (up to 50 lanes), importing a validated `config.csv` in SensorHub Admin {{icon:split-admin}} provisions RPMs, RTSP cameras, coordinates, EML flags, OCR settings, and `OperationalViews` in seconds — and exports cleanly as an auditable backup spreadsheet.",
        steps: [
            "Click 'Download 1-Lane Tutorial CSV' below to save `tutorial-1-lane.csv` (pre-targeted at loopback `127.0.0.1:10099` and `127.0.0.1:8554/tutorial-cam` with `archiveEnabled=false`).",
            "Open Split-Pane SensorHub Admin {{icon:split-admin}} -> `Services -> OSCAR Service`, upload `tutorial-1-lane.csv` under `Lane Configuration Spreadsheet`, and click `Apply`.",
            "Click `Return to Viewer Page`, open Dashboard {{icon:dashboard}} (`/`), and confirm `DemoLane01` is online and streaming live video — in production you can also click `Download Current config.csv` anytime to export and edit all lanes offline in Excel.",
        ],
        keyTerms: [
            {
                term: "`config.csv` Lane Spreadsheet",
                meaning: "Idempotent multi-lane spreadsheet defining RPM IP/port, camera RTSP URLs, lat/lon coordinates, `OperationalViews`, EML, OCR, and WebRelay settings.",
            },
            {
                term: "`OperationalViews` CSV Column",
                meaning: "Semicolon-separated view keys (e.g. `north-gate;cargo-inbound`) assigning each lane to gatehouse workstation filters automatically.",
            },
        ],
        commonPitfalls: [
            "Editing `config.csv` in Excel and accidentally stripping leading zeros or corrupting UTF-8: save as `CSV UTF-8 (Comma delimited)` before uploading.",
            "Re-importing `config.csv` updates existing lanes in place without losing historical observations as long as `uniqueID` stays unchanged.",
        ],
        translations: {
            en: {
                chipLabel: "Bulk CSV Sync",
                title: "1-Click Bulk Lane Spreadsheet Import (`config.csv`)",
                screenshotCaption: "Bulk multi-lane CSV configuration import inside SensorHub Admin -> Services -> OSCAR Service.",
                whyItMatters:
                    "At multi-lane ports of entry (up to 50 lanes), importing a validated `config.csv` in SensorHub Admin {{icon:split-admin}} provisions RPMs, RTSP cameras, coordinates, EML flags, OCR settings, and `OperationalViews` in seconds — and exports cleanly as an auditable backup spreadsheet.",
                steps: [
                    "Click 'Download 1-Lane Tutorial CSV' below to save `tutorial-1-lane.csv` (pre-targeted at loopback `127.0.0.1:10099` and `127.0.0.1:8554/tutorial-cam` with `archiveEnabled=false`).",
                    "Open Split-Pane SensorHub Admin {{icon:split-admin}} -> `Services -> OSCAR Service`, upload `tutorial-1-lane.csv` under `Lane Configuration Spreadsheet`, and click `Apply`.",
                    "Click `Return to Viewer Page`, open Dashboard {{icon:dashboard}} (`/`), and confirm `DemoLane01` is online and streaming live video — in production you can also click `Download Current config.csv` anytime to export and edit all lanes offline in Excel.",
                ],
                keyTerms: [
                    {
                        term: "`config.csv` Lane Spreadsheet",
                        meaning: "Idempotent multi-lane spreadsheet defining RPM IP/port, camera RTSP URLs, lat/lon coordinates, `OperationalViews`, EML, OCR, and WebRelay settings.",
                    },
                    {
                        term: "`OperationalViews` CSV Column",
                        meaning: "Semicolon-separated view keys (e.g. `north-gate;cargo-inbound`) assigning each lane to gatehouse workstation filters automatically.",
                    },
                ],
                commonPitfalls: [
                    "Editing `config.csv` in Excel and accidentally stripping leading zeros or corrupting UTF-8: save as `CSV UTF-8 (Comma delimited)` before uploading.",
                    "Re-importing `config.csv` updates existing lanes in place without losing historical observations as long as `uniqueID` stays unchanged.",
                ],
                objectiveSummary: "At least 1 lane provisioned and started (`configuredLaneCount >= 1 && onlineLaneCount >= 1`).",
            },
            es: {
                chipLabel: "Importar CSV",
                title: "Importación masiva de carriles por hoja de cálculo (`config.csv`)",
                screenshotCaption: "Importación masiva CSV de carriles dentro de SensorHub Admin -> Services -> OSCAR Service.",
                whyItMatters:
                    "En puertos con hasta 50 carriles, subir un `config.csv` validado en SensorHub Admin {{icon:split-admin}} aprovisiona RPM, cámaras RTSP, coordenadas, EML, OCR y `OperationalViews` en segundos.",
                steps: [
                    "Pulse 'Descargar CSV de 1 carril' abajo para guardar `tutorial-1-lane.csv`.",
                    "Abra SensorHub Admin en vista dividida {{icon:split-admin}} -> `Services -> OSCAR Service`, cargue `tutorial-1-lane.csv` en `Lane Configuration Spreadsheet` y pulse `Apply`.",
                    "Vuelva a OSCAR Viewer en Panel {{icon:dashboard}} (`/`) y confirme que `DemoLane01` está en línea y transmitiendo vídeo.",
                ],
                keyTerms: [
                    {
                        term: "Hoja de carriles `config.csv`",
                        meaning: "Archivo idempotente que define RPM, RTSP, coordenadas, `OperationalViews`, EML, OCR y WebRelay.",
                    },
                    {
                        term: "Columna `OperationalViews`",
                        meaning: "Claves separadas por punto y coma (p. ej. `north-gate;cargo`) para asignar cada carril a filtros de cabina.",
                    },
                ],
                commonPitfalls: [
                    "Al editar en Excel, guarde siempre como `CSV UTF-8 (delimitado por comas)`.",
                    "Mantenga intacto el `uniqueID` al reimportar para conservar el historial del carril.",
                ],
                objectiveSummary: "Al menos 1 carril aprovisionado e iniciado (`configuredLaneCount >= 1 && onlineLaneCount >= 1`).",
            },
            fr: {
                chipLabel: "Import CSV",
                title: "Importation en masse des voies par tableur (`config.csv`)",
                screenshotCaption: "Importation CSV multivoie dans SensorHub Admin -> Services -> OSCAR Service.",
                whyItMatters:
                    "Sur les ports jusqu’à 50 voies, importer un `config.csv` validé dans SensorHub Admin {{icon:split-admin}} provisionne RPM, caméras RTSP, coordonnées, EML, OCR et `OperationalViews` en quelques secondes.",
                steps: [
                    "Cliquez sur « Télécharger CSV d’exercice (1 voie) » ci-dessous pour obtenir `tutorial-1-lane.csv`.",
                    "Ouvrez SensorHub Admin en vue partagée {{icon:split-admin}} -> `Services -> OSCAR Service`, importez `tutorial-1-lane.csv` sous `Lane Configuration Spreadsheet` puis cliquez sur `Apply`.",
                    "Revenez dans OSCAR Viewer sur Tableau de bord {{icon:dashboard}} (`/`) et vérifiez que `DemoLane01` est en ligne.",
                ],
                keyTerms: [
                    {
                        term: "Tableur `config.csv`",
                        meaning: "Feuille idempotente décrivant RPM, RTSP, coordonnées, `OperationalViews`, EML, OCR et WebRelay.",
                    },
                    {
                        term: "Colonne `OperationalViews`",
                        meaning: "Clés séparées par point-virgule (ex. `north-gate;fret`) affectant chaque voie aux filtres de poste.",
                    },
                ],
                commonPitfalls: [
                    "Dans Excel, enregistrez toujours au format `CSV UTF-8 (délimité par des virgules)`.",
                    "Ne modifiez pas `uniqueID` lors d’une réimportation pour conserver l’historique.",
                ],
                objectiveSummary: "Au moins 1 voie provisionnée et démarrée (`configuredLaneCount >= 1 && onlineLaneCount >= 1`).",
            },
            el: {
                chipLabel: "Εισαγωγή CSV",
                title: "Μαζική εισαγωγή λωρίδων με φύλλο CSV (`config.csv`)",
                screenshotCaption: "Μαζική εισαγωγή CSV πολλαπλών λωρίδων στο SensorHub Admin -> Services -> OSCAR Service.",
                whyItMatters:
                    "Σε εγκαταστάσεις έως 50 λωρίδων, ένα επικυρωμένο `config.csv` στο SensorHub Admin {{icon:split-admin}} ρυθμίζει RPM, κάμερες RTSP, συντεταγμένες, EML, OCR και `OperationalViews` σε δευτερόλεπτα.",
                steps: [
                    "Πατήστε «Λήψη CSV εξάσκησης (1 λωρίδα)» παρακάτω για να αποθηκεύσετε το `tutorial-1-lane.csv`.",
                    "Ανοίξτε SensorHub Admin σε διπλή προβολή {{icon:split-admin}} -> `Services -> OSCAR Service`, μεταφορτώστε το `tutorial-1-lane.csv` και πατήστε `Apply`.",
                    "Επιστρέψτε στο OSCAR Viewer στον Πίνακα {{icon:dashboard}} (`/`) και επιβεβαιώστε ότι η `DemoLane01` είναι σε σύνδεση.",
                ],
                keyTerms: [
                    {
                        term: "Φύλλο `config.csv`",
                        meaning: "Αρχείο πολλαπλών λωρίδων με RPM, RTSP, συντεταγμένες, `OperationalViews`, EML, OCR και WebRelay.",
                    },
                    {
                        term: "Στήλη `OperationalViews`",
                        meaning: "Κλειδιά διαχωρισμένα με ερωτηματικό (`north-gate;cargo`) για ανάθεση λωρίδων σε σταθμούς.",
                    },
                ],
                commonPitfalls: [
                    "Κατά την επεξεργασία στο Excel αποθηκεύστε πάντα ως `CSV UTF-8`.",
                    "Διατηρήστε αμετάβλητο το `uniqueID` για να μην αποσυνδεθεί το ιστορικό λωρίδας.",
                ],
                objectiveSummary: "Τουλάχιστον 1 λωρίδα διαμορφωμένη και σε λειτουργία (`configuredLaneCount >= 1 && onlineLaneCount >= 1`).",
            },
        },
        sampleFiles: [
            {
                fileName: "tutorial-1-lane.csv",
                buttonLabel: "Download 1-Lane Tutorial CSV",
                buttonLabels: {
                    es: "Descargar CSV de 1 carril",
                    fr: "Télécharger CSV d’exercice (1 voie)",
                    el: "Λήψη CSV εξάσκησης (1 λωρίδα)",
                },
            },
        ],
        spotlights: [
            {
                id: "split-admin",
                selector: '[data-testid="training-toggle-split-admin"], [data-testid="training-refresher-admin-link"]',
                label: "Highlight Split-Pane Admin Button",
                iconKey: "split-admin",
            },
            {
                id: "dashboard",
                selector: '[data-testid="nav-item-dashboard"]',
                label: "Highlight Dashboard Icon",
                iconKey: "dashboard",
            },
        ],
        spotlightSelector: '[data-testid="training-toggle-split-admin"], [data-testid="training-refresher-admin-link"]',
        spotlightLabel: "Highlight Split-Pane Admin Button",
        objectiveSummary: "At least 1 lane provisioned and started (`configuredLaneCount >= 1 && onlineLaneCount >= 1`).",
        isAutoVerified: (v) => v.configuredLaneCount >= 1 && v.onlineLaneCount >= 1,
    },
    {
        id: "adm-eml-ocr",
        trackId: "administrator",
        badge: "3.3",
        chipLabel: "EML, OCR & Proxy",
        route: "/",
        pageIconKey: "split-admin",
        splitPaneAdmin: true,
        videoGuideSlug: "07-admin-eml-plugin-setup",
        screenshotFile: "33-lane-vehicle-ocr.png",
        screenshotCaption: "SensorHub Admin EML plugin upload, per-lane Vehicle OCR configuration, Extended Occupancy threshold, and CAS RPM Edge Proxy architecture.",
        title: "EML Plugins, Per-Lane OCR, Extended Occupancy & CAS RPM Proxy",
        durationEstimate: "5 min",
        whyItMatters:
            "Administrators control three major operational multipliers inside SensorHub Admin {{icon:split-admin}} and the host CLI: uploading licensed EML `.jar` plugins (`Code 9999`), right-sizing per-lane Container/Plate OCR, and deploying `oscar-rpm-proxy` when sharing single-client Rapiscan ports with an existing CAS.",
        steps: [
            "Open Split-Pane SensorHub Admin {{icon:split-admin}} -> `Services -> OSCAR Service` to review: (a) **External EML Plugin `.jar` Upload** (drop in a licensed Rapiscan VM-250 or custom `EmlAlarmAssessmentAlgorithm` `.jar` without rebuilding OSCAR), (b) **Custom Disposition Codes**, and (c) **5-JPEG Media Retention & Storage-Pressure Thresholds (`75% / 85% / 92%`)**.",
            "Open your lane under `Systems -> DemoLane01` and inspect: (a) `extendedOccupancyThresholdMinutes` (default `1` min -> `Code 9998` gamma-only auto-clear), and (b) `OCR Config` (`enabled`, `alarmsOnly`, `framesPerVideo = 4`). Sizing rule: Windows 11 WSL 2 sustains `<= 6` 100%-OCR lanes cleanly, while bare-metal Ubuntu 24.04 scales to all `50` lanes (`1080p` @ `15 fps`, `1 s` GOP).",
            "Know **Side-by-Side CAS Operation (`oscar-rpm-proxy`)**: Rapiscan RPM TCP ports accept only 1 client. If a port still runs a legacy Central Alarm Station (CAS) alongside OSCAR, run `sudo bash oscar.sh rpm-proxy` (Ubuntu) or `.\\oscar.bat rpm-proxy` (Windows) — it fans out `1–50` RPM streams at `< 1 ms` latency, keeps CAS connected across OSCAR upgrades, and propagates physical disconnects in `<= 4.0 s`.",
        ],
        keyTerms: [
            {
                term: "External EML Plugin (`.jar`)",
                meaning: "Hot-loaded JAR implementing `EmlAlarmAssessmentAlgorithm` uploaded in OSCAR Service (persisted in `/var/lib/oscar/eml-plugin/` across upgrades).",
            },
            {
                term: "`ocrConfig` (`alarmsOnly` vs. All Passes)",
                meaning: "Asynchronous PP-OCRv3 container/plate engine; `alarmsOnly = true` saves CPU on high-traffic sites, while `false` captures OCR on every pass and deletes clean clips immediately.",
            },
            {
                term: "CAS RPM Edge Proxy (`oscar-rpm-proxy`)",
                meaning: "Standalone TCP fan-out proxy sharing a single physical Rapiscan portal stream with both OSCAR and an existing CAS (`Port-Mapped` or Ubuntu `Transparent Virtual-IP :1600`).",
            },
        ],
        commonPitfalls: [
            "Turning on `100%` OCR across 20+ lanes on a small Windows WSL 2 workstation causes frame drops — set `alarmsOnly = true` or deploy on bare-metal Ubuntu 24.04.",
            "Connecting BOTH a legacy CAS and OSCAR directly to a single Rapiscan port causes continuous TCP disconnects; always put `oscar-rpm-proxy` in front.",
        ],
        translations: {
            en: {
                chipLabel: "EML, OCR & Proxy",
                title: "EML Plugins, Per-Lane OCR, Extended Occupancy & CAS RPM Proxy",
                screenshotCaption: "SensorHub Admin EML plugin upload, per-lane Vehicle OCR configuration, Extended Occupancy threshold, and CAS RPM Edge Proxy architecture.",
                whyItMatters:
                    "Administrators control three major operational multipliers inside SensorHub Admin {{icon:split-admin}} and the host CLI: uploading licensed EML `.jar` plugins (`Code 9999`), right-sizing per-lane Container/Plate OCR, and deploying `oscar-rpm-proxy` when sharing single-client Rapiscan ports with an existing CAS.",
                steps: [
                    "Open Split-Pane SensorHub Admin {{icon:split-admin}} -> `Services -> OSCAR Service` to review: (a) **External EML Plugin `.jar` Upload** (drop in a licensed Rapiscan VM-250 or custom `EmlAlarmAssessmentAlgorithm` `.jar` without rebuilding OSCAR), (b) **Custom Disposition Codes**, and (c) **5-JPEG Media Retention & Storage-Pressure Thresholds (`75% / 85% / 92%`)**.",
                    "Open your lane under `Systems -> DemoLane01` and inspect: (a) `extendedOccupancyThresholdMinutes` (default `1` min -> `Code 9998` gamma-only auto-clear), and (b) `OCR Config` (`enabled`, `alarmsOnly`, `framesPerVideo = 4`). Sizing rule: Windows 11 WSL 2 sustains `<= 6` 100%-OCR lanes cleanly, while bare-metal Ubuntu 24.04 scales to all `50` lanes (`1080p` @ `15 fps`, `1 s` GOP).",
                    "Know **Side-by-Side CAS Operation (`oscar-rpm-proxy`)**: Rapiscan RPM TCP ports accept only 1 client. If a port still runs a legacy Central Alarm Station (CAS) alongside OSCAR, run `sudo bash oscar.sh rpm-proxy` (Ubuntu) or `.\\oscar.bat rpm-proxy` (Windows) — it fans out `1–50` RPM streams at `< 1 ms` latency, keeps CAS connected across OSCAR upgrades, and propagates physical disconnects in `<= 4.0 s`.",
                ],
                keyTerms: [
                    {
                        term: "External EML Plugin (`.jar`)",
                        meaning: "Hot-loaded JAR implementing `EmlAlarmAssessmentAlgorithm` uploaded in OSCAR Service (persisted in `/var/lib/oscar/eml-plugin/` across upgrades).",
                    },
                    {
                        term: "`ocrConfig` (`alarmsOnly` vs. All Passes)",
                        meaning: "Asynchronous PP-OCRv3 container/plate engine; `alarmsOnly = true` saves CPU on high-traffic sites, while `false` captures OCR on every pass and deletes clean clips immediately.",
                    },
                    {
                        term: "CAS RPM Edge Proxy (`oscar-rpm-proxy`)",
                        meaning: "Standalone TCP fan-out proxy sharing a single physical Rapiscan portal stream with both OSCAR and an existing CAS (`Port-Mapped` or Ubuntu `Transparent Virtual-IP :1600`).",
                    },
                ],
                commonPitfalls: [
                    "Turning on `100%` OCR across 20+ lanes on a small Windows WSL 2 workstation causes frame drops — set `alarmsOnly = true` or deploy on bare-metal Ubuntu 24.04.",
                    "Connecting BOTH a legacy CAS and OSCAR directly to a single Rapiscan port causes continuous TCP disconnects; always put `oscar-rpm-proxy` in front.",
                ],
                objectiveSummary: "Configure at least 1 lane with OCR or review EML/OCR/RPM-Proxy settings (`lanesWithOcrCount >= 1 || onlineLaneCount >= 1`).",
            },
            es: {
                chipLabel: "EML, OCR y Proxy",
                title: "Complementos EML, OCR por carril, Ocupación prolongada y Proxy RPM CAS",
                screenshotCaption: "Carga de complemento EML, configuración OCR por carril, umbral de ocupación prolongada y arquitectura RPM Edge Proxy.",
                whyItMatters:
                    "Los administradores gestionan en SensorHub Admin {{icon:split-admin}} tres capacidades clave: subir complementos EML `.jar` (`Código 9999`), dimensionar el OCR por carril y usar `oscar-rpm-proxy` para convivir con un CAS existente.",
                steps: [
                    "Abra SensorHub Admin {{icon:split-admin}} -> `Services -> OSCAR Service` para revisar la carga de `.jar` EML externo, códigos personalizados y umbrales de almacenamiento (`75% / 85% / 92%`).",
                    "En `Systems -> DemoLane01`, revise `extendedOccupancyThresholdMinutes` (`1` min predeterminado) y `OCR Config` (`enabled`, `alarmsOnly`, `framesPerVideo = 4`). Regla de capacidad: Windows 11 WSL 2 admite `<= 6` carriles con 100% OCR; Ubuntu 24.04 escala hasta `50` carriles.",
                    "Para operación paralela con un CAS existente (los puertos TCP Rapiscan solo aceptan 1 cliente), despliegue `sudo bash oscar.sh rpm-proxy` o `.\\oscar.bat rpm-proxy` (`< 1 ms`, desconexión real propagada en `<= 4.0 s`).",
                ],
                keyTerms: [
                    {
                        term: "Complemento EML externo (`.jar`)",
                        meaning: "Archivo JAR persistente entre actualizaciones para evaluación automática `Código 9999`.",
                    },
                    {
                        term: "`ocrConfig` (`alarmsOnly` frente a todos los pasos)",
                        meaning: "Motor PP-OCRv3 asíncrono de contenedores/matrículas; `alarmsOnly = true` ahorra CPU en hosts pequeños.",
                    },
                    {
                        term: "Proxy RPM Edge (`oscar-rpm-proxy`)",
                        meaning: "Duplicador TCP aislado que alimenta simultáneamente a OSCAR y a un CAS legado sin desconectar al CAS al actualizar.",
                    },
                ],
                commonPitfalls: [
                    "Activar 100% OCR en más de 6 carriles bajo Windows WSL 2 puede saturar CPU; use `alarmsOnly = true` o servidor Ubuntu dedicado.",
                    "Nunca conecte OSCAR y un CAS simultáneamente al mismo puerto Rapiscan sin `oscar-rpm-proxy`.",
                ],
                objectiveSummary: "Revisar ajustes EML/OCR/RPM-Proxy y tener al menos 1 carril en línea (`lanesWithOcrCount >= 1 || onlineLaneCount >= 1`).",
            },
            fr: {
                chipLabel: "EML, OCR & Proxy",
                title: "Modules EML, OCR par voie, Occupation prolongée et Proxy RPM CAS",
                screenshotCaption: "Import du module EML, réglage OCR véhicule par voie, seuil d’occupation prolongée et proxy RPM CAS.",
                whyItMatters:
                    "Les administrateurs pilotent dans SensorHub Admin {{icon:split-admin}} l’import de modules EML `.jar` (`Code 9999`), le dimensionnement OCR par voie et le proxy `oscar-rpm-proxy` pour coexister avec un CAS existant.",
                steps: [
                    "Ouvrez SensorHub Admin {{icon:split-admin}} -> `Services -> OSCAR Service` pour voir l’import `.jar` EML externe, les codes personnalisés et les seuils disque (`75% / 85% / 92%`).",
                    "Dans `Systems -> DemoLane01`, examinez `extendedOccupancyThresholdMinutes` (`1` min par défaut) et `OCR Config` (`enabled`, `alarmsOnly`, `framesPerVideo = 4`). Dimensionnement : `<= 6` voies OCR 100 % sous Windows 11 WSL 2, jusqu’à `50` voies sur Ubuntu 24.04 bare-metal.",
                    "Pour fonctionner en parallèle d’un CAS (port TCP Rapiscan mono-client), exécutez `sudo bash oscar.sh rpm-proxy` ou `.\\oscar.bat rpm-proxy` (`< 1 ms`, coupure physique propagée en `<= 4,0 s`).",
                ],
                keyTerms: [
                    {
                        term: "Module EML externe (`.jar`)",
                        meaning: "Archive JAR chargée à chaud dans OSCAR Service et conservée lors des mises à niveau.",
                    },
                    {
                        term: "`ocrConfig` (`alarmsOnly` vs tous passages)",
                        meaning: "Moteur OCR asynchrone PP-OCRv3 ; `alarmsOnly = true` réduit la charge CPU sur petits serveurs.",
                    },
                    {
                        term: "Proxy RPM Edge (`oscar-rpm-proxy`)",
                        meaning: "Répartiteur TCP isolé alimentant OSCAR et le CAS historique sans interrompre le CAS pendant les mises à jour.",
                    },
                ],
                commonPitfalls: [
                    "Activer l’OCR 100 % sur plus de 6 voies sous Windows WSL 2 sature le CPU : utilisez `alarmsOnly = true` ou Ubuntu dédié.",
                    "Ne connectez jamais directement un CAS et OSCAR au même port Rapiscan sans `oscar-rpm-proxy`.",
                ],
                objectiveSummary: "Vérifier EML/OCR/Proxy et disposer d’au moins 1 voie en ligne (`lanesWithOcrCount >= 1 || onlineLaneCount >= 1`).",
            },
            el: {
                chipLabel: "EML, OCR & Proxy",
                title: "Πρόσθετα EML, OCR ανά λωρίδα, Παρατεταμένη διέλευση & CAS RPM Proxy",
                screenshotCaption: "Μεταφόρτωση προσθέτου EML, ρύθμιση OCR ανά λωρίδα, όριο παρατεταμένης διέλευσης και αρχιτεκτονική RPM Proxy.",
                whyItMatters:
                    "Οι διαχειριστές ελέγχουν στο SensorHub Admin {{icon:split-admin}} τα αδειοδοτημένα πρόσθετα EML `.jar` (`Κωδικός 9999`), το OCR ανά λωρίδα και το `oscar-rpm-proxy` για παράλληλη λειτουργία με υφιστάμενο CAS.",
                steps: [
                    "Ανοίξτε SensorHub Admin {{icon:split-admin}} -> `Services -> OSCAR Service` για μεταφόρτωση `.jar` EML, προσαρμοσμένους κωδικούς και όρια δίσκου (`75% / 85% / 92%`).",
                    "Στο `Systems -> DemoLane01`, ελέγξτε `extendedOccupancyThresholdMinutes` (`1` λεπτό) και `OCR Config` (`enabled`, `alarmsOnly`, `framesPerVideo = 4`). Όριο κλιμάκωσης: `<= 6` λωρίδες 100% OCR σε Windows 11 WSL 2 έναντι `50` σε Ubuntu 24.04.",
                    "Για συνύπαρξη με υπάρχον CAS (η θύρα TCP Rapiscan δέχεται 1 πελάτη), χρησιμοποιήστε `sudo bash oscar.sh rpm-proxy` ή `.\\oscar.bat rpm-proxy` (`< 1 ms`, μετάδοση διακοπής σε `<= 4,0 s`).",
                ],
                keyTerms: [
                    {
                        term: "Εξωτερικό πρόσθετο EML (`.jar`)",
                        meaning: "Αρχείο JAR που διατηρείται αυτόματα σε αναβαθμίσεις για αυτόματη αξιολόγηση `Κωδικός 9999`.",
                    },
                    {
                        term: "`ocrConfig` (`alarmsOnly` έναντι όλων)",
                        meaning: "Ασύγχρονη μηχανή OCR κοντέινερ/πινακίδων· το `alarmsOnly = true` εξοικονομεί CPU.",
                    },
                    {
                        term: "CAS RPM Edge Proxy (`oscar-rpm-proxy`)",
                        meaning: "Ανεξάρτητος διανομέας TCP που τροφοδοτεί ταυτόχρονα OSCAR και παλαιό CAS χωρίς διακοπές.",
                    },
                ],
                commonPitfalls: [
                    "Πάνω από 6 λωρίδες 100% OCR σε Windows WSL 2 υπερφορτώνουν τη CPU — επιλέξτε `alarmsOnly = true` ή Ubuntu bare-metal.",
                    "Μην συνδέετε ταυτόχρονα CAS και OSCAR απευθείας στην ίδια θύρα Rapiscan χωρίς `oscar-rpm-proxy`.",
                ],
                objectiveSummary: "Έλεγχος ρυθμίσεων EML/OCR/Proxy με τουλάχιστον 1 ενεργή λωρίδα (`lanesWithOcrCount >= 1 || onlineLaneCount >= 1`).",
            },
        },
        copySnippets: [
            { label: "Ubuntu RPM Proxy", labels: { es: "Proxy RPM Ubuntu", fr: "Proxy RPM Ubuntu", el: "Proxy RPM Ubuntu" }, value: "sudo bash oscar.sh rpm-proxy" },
            { label: "Windows RPM Proxy", labels: { es: "Proxy RPM Windows", fr: "Proxy RPM Windows", el: "Proxy RPM Windows" }, value: ".\\oscar.bat rpm-proxy" },
        ],
        spotlights: [
            {
                id: "split-admin",
                selector: '[data-testid="training-toggle-split-admin"], [data-testid="training-refresher-admin-link"]',
                label: "Highlight Split-Pane Admin Button",
                iconKey: "split-admin",
            },
        ],
        spotlightSelector: '[data-testid="training-toggle-split-admin"], [data-testid="training-refresher-admin-link"]',
        spotlightLabel: "Highlight Split-Pane Admin Button",
        objectiveSummary: "Configure at least 1 lane with OCR or review EML/OCR/RPM-Proxy settings (`lanesWithOcrCount >= 1 || onlineLaneCount >= 1`).",
        isAutoVerified: (v) => v.lanesWithOcrCount >= 1 || v.onlineLaneCount >= 1,
    },
    {
        id: "adm-3",
        trackId: "administrator",
        badge: "3.4",
        chipLabel: "Users & RBAC",
        route: "/users",
        pageIconKey: "users",
        videoGuideSlug: "19-viewer-users-passkeys-and-access",
        screenshotFile: "36-users-and-passkeys.png",
        screenshotCaption: "Users & Access self-service WebAuthn Passkeys, role & view scoping, bulk QR onboarding invites, SSO policy, and Federation Tokens.",
        title: "Users, RBAC View Scoping, Bulk QR Invites, Passkeys & SSO",
        durationEstimate: "5 min",
        whyItMatters:
            "In Users & Access {{icon:users}} (`/users`, person-and-gear icon), non-IT administrators onboard whole shifts in seconds via 1-tap QR codes or phone-free temporary passwords, lock accounts to assigned `OperationalViews`, configure Corporate/Federation Hub SSO, and mint `oscar_fed_...` tokens.",
        steps: [
            "Open Users & Access {{icon:users}} (`/users`) and create a practice `Operator` account scoped to `allowedViews: north-gate` — OR open `Bulk CSV / Paste User Enrollment` to preview printable 1-tap Passkey/Password setup QR codes (`/login/enroll?token=oscar_inv_...`) and phone-free temporary passwords for restricted facilities.",
            "Review **Federation Tokens (`oscar_fed_...`)** (paired on remote sites in Servers {{icon:servers}}) and **Enterprise OIDC / Trusted Tunnel SSO** (`ORNL/oscar-federation-hub`, `X-Octelium-Groups` group-to-role mapping, optional private-CA PEM trust, and immediate multi-layer revocation).",
            "Know **Break-Glass Recovery**: if every administrator loses access, run `sudo bash oscar.sh reset-admin-password` (Ubuntu) or `.\\oscar.bat reset-admin-password` (Windows) directly on the host console. Click 'Mark Step Completed' once you have explored `/users`.",
        ],
        keyTerms: [
            {
                term: "Offline Passkeys (FIDO2 / WebAuthn)",
                meaning: "Phishing-resistant biometric or hardware-key sign-in verified 100% locally by OSCAR with zero internet dependency.",
            },
            {
                term: "`allowedViews` Account Scoping",
                meaning: "Restricts an Operator or Viewer strictly to named Operational Views (e.g. `north-gate`) across all UI pages, APIs, and reports.",
            },
            {
                term: "Break-Glass `reset-admin-password`",
                meaning: "Host CLI emergency command generating a fresh local administrator password without wiping any site data.",
            },
        ],
        commonPitfalls: [
            "Local OSCAR passwords are completely independent from remote Octelium Zero-Trust tunnel credentials — explain this during operator onboarding.",
            "Revoking a federated SSO user must disable/delete them in the Identity Provider (`Authentik` / corporate IdP) as well as OSCAR so sessions cannot re-mint.",
        ],
        translations: {
            en: {
                chipLabel: "Users & RBAC",
                title: "Users, RBAC View Scoping, Bulk QR Invites, Passkeys & SSO",
                screenshotCaption: "Users & Access self-service WebAuthn Passkeys, role & view scoping, bulk QR onboarding invites, SSO policy, and Federation Tokens.",
                whyItMatters:
                    "In Users & Access {{icon:users}} (`/users`, person-and-gear icon), non-IT administrators onboard whole shifts in seconds via 1-tap QR codes or phone-free temporary passwords, lock accounts to assigned `OperationalViews`, configure Corporate/Federation Hub SSO, and mint `oscar_fed_...` tokens.",
                steps: [
                    "Open Users & Access {{icon:users}} (`/users`) and create a practice `Operator` account scoped to `allowedViews: north-gate` — OR open `Bulk CSV / Paste User Enrollment` to preview printable 1-tap Passkey/Password setup QR codes (`/login/enroll?token=oscar_inv_...`) and phone-free temporary passwords for restricted facilities.",
                    "Review **Federation Tokens (`oscar_fed_...`)** (paired on remote sites in Servers {{icon:servers}}) and **Enterprise OIDC / Trusted Tunnel SSO** (`ORNL/oscar-federation-hub`, `X-Octelium-Groups` group-to-role mapping, optional private-CA PEM trust, and immediate multi-layer revocation).",
                    "Know **Break-Glass Recovery**: if every administrator loses access, run `sudo bash oscar.sh reset-admin-password` (Ubuntu) or `.\\oscar.bat reset-admin-password` (Windows) directly on the host console. Click 'Mark Step Completed' once you have explored `/users`.",
                ],
                keyTerms: [
                    {
                        term: "Offline Passkeys (FIDO2 / WebAuthn)",
                        meaning: "Phishing-resistant biometric or hardware-key sign-in verified 100% locally by OSCAR with zero internet dependency.",
                    },
                    {
                        term: "`allowedViews` Account Scoping",
                        meaning: "Restricts an Operator or Viewer strictly to named Operational Views (e.g. `north-gate`) across all UI pages, APIs, and reports.",
                    },
                    {
                        term: "Break-Glass `reset-admin-password`",
                        meaning: "Host CLI emergency command generating a fresh local administrator password without wiping any site data.",
                    },
                ],
                commonPitfalls: [
                    "Local OSCAR passwords are completely independent from remote Octelium Zero-Trust tunnel credentials — explain this during operator onboarding.",
                    "Revoking a federated SSO user must disable/delete them in the Identity Provider (`Authentik` / corporate IdP) as well as OSCAR so sessions cannot re-mint.",
                ],
                objectiveSummary: "Review RBAC roles, QR enrollment invites, SSO, and Passkey / Federation Token controls in `/users`.",
            },
            es: {
                chipLabel: "Usuarios y RBAC",
                title: "Usuarios, alcance RBAC, invitaciones QR masivas, Passkeys y SSO",
                screenshotCaption: "Usuarios y acceso con Passkeys sin conexión, alcance por vista, invitaciones QR, SSO y tokens de federación.",
                whyItMatters:
                    "En Usuarios y acceso {{icon:users}} (`/users`), los administradores incorporan turnos completos mediante códigos QR o contraseñas temporales sin teléfono, restringen vistas (`allowedViews`), configuran SSO y crean tokens `oscar_fed_...`.",
                steps: [
                    "Abra Usuarios y acceso {{icon:users}} (`/users`) y pruebe crear un `Operador` limitado a `north-gate` o la inscripción masiva CSV con códigos QR (`/login/enroll?token=oscar_inv_...`).",
                    "Revise **Tokens de federación (`oscar_fed_...`)** (usados en Servidores {{icon:servers}}) y la directiva **SSO OIDC / Túnel confiable** (`X-Octelium-Groups`, CA PEM y revocación completa).",
                    "Recuerde la recuperación de emergencia en el servidor: `sudo bash oscar.sh reset-admin-password` o `.\\oscar.bat reset-admin-password`. Pulse 'Marcar ejercicio completado' al terminar.",
                ],
                keyTerms: [
                    {
                        term: "Passkeys sin conexión (FIDO2 / WebAuthn)",
                        meaning: "Acceso biométrico o llave física verificado localmente por OSCAR sin internet.",
                    },
                    {
                        term: "Alcance `allowedViews`",
                        meaning: "Limita a un usuario únicamente a sus Vistas operativas asignadas en toda la consola e informes.",
                    },
                    {
                        term: "Emergencia `reset-admin-password`",
                        meaning: "Comando CLI local para restablecer la contraseña de administrador sin borrar datos.",
                    },
                ],
                commonPitfalls: [
                    "Las contraseñas locales de OSCAR son independientes del túnel Octelium Zero-Trust.",
                    "Al revocar un usuario SSO, desactívelo también en el proveedor de identidad (`Authentik` / IdP).",
                ],
                objectiveSummary: "Revisar roles RBAC, invitaciones QR, SSO y tokens de federación en `/users`.",
            },
            fr: {
                chipLabel: "Utilisateurs & RBAC",
                title: "Utilisateurs, périmètre RBAC, invitations QR, Passkeys et SSO",
                screenshotCaption: "Utilisateurs et accès : Passkeys hors ligne, périmètre par vue, invitations QR groupées, SSO et jetons de fédération.",
                whyItMatters:
                    "Dans Utilisateurs et accès {{icon:users}} (`/users`), les administrateurs enrôlent des équipes par QR en 1 geste ou mots de passe temporaires sans téléphone, limitent les vues (`allowedViews`), règlent le SSO et créent les jetons `oscar_fed_...`.",
                steps: [
                    "Ouvrez Utilisateurs et accès {{icon:users}} (`/users`) et testez un compte `Opérateur` restreint à `north-gate` ou l’enrôlement CSV groupé avec codes QR (`/login/enroll?token=oscar_inv_...`).",
                    "Inspectez **Jetons de fédération (`oscar_fed_...`)** (pour Serveurs {{icon:servers}}) et la politique **SSO OIDC / Tunnel de confiance** (`X-Octelium-Groups`, AC PEM et révocation complète).",
                    "Retenez la commande d’urgence locale : `sudo bash oscar.sh reset-admin-password` ou `.\\oscar.bat reset-admin-password`. Cliquez sur « Marquer comme terminé » après exploration.",
                ],
                keyTerms: [
                    {
                        term: "Passkeys hors ligne (FIDO2 / WebAuthn)",
                        meaning: "Connexion biométrique ou clé physique vérifiée localement par OSCAR sans internet.",
                    },
                    {
                        term: "Périmètre `allowedViews`",
                        meaning: "Verrouille un compte sur ses seules Vues opérationnelles sur toutes les pages et rapports.",
                    },
                    {
                        term: "Secours `reset-admin-password`",
                        meaning: "Commande CLI réinitialisant l’accès administrateur local sans aucune perte de données.",
                    },
                ],
                commonPitfalls: [
                    "Les mots de passe locaux OSCAR sont distincts des identifiants du tunnel Octelium Zero-Trust.",
                    "Pour révoquer un utilisateur SSO, supprimez-le aussi dans le fournisseur d’identité (`Authentik` / IdP).",
                ],
                objectiveSummary: "Explorer rôles RBAC, invitations QR, SSO et jetons de fédération dans `/users`.",
            },
            el: {
                chipLabel: "Χρήστες & RBAC",
                title: "Χρήστες, εμβέλεια RBAC, μαζικές προσκλήσεις QR, Passkeys & SSO",
                screenshotCaption: "Χρήστες & Πρόσβαση με Passkeys εκτός δικτύου, περιορισμό προβολών, προσκλήσεις QR, SSO και διακριτικά ομοσπονδίας.",
                whyItMatters:
                    "Στους Χρήστες & Πρόσβαση {{icon:users}} (`/users`), οι διαχειριστές εγγράφουν βάρδιες με κωδικούς QR ή προσωρινούς κωδικούς χωρίς κινητό, περιορίζουν λωρίδες (`allowedViews`), ρυθμίζουν SSO και εκδίδουν `oscar_fed_...`.",
                steps: [
                    "Ανοίξτε Χρήστες & Πρόσβαση {{icon:users}} (`/users`) και δοκιμάστε λογαριασμό `Χειριστή` με `north-gate` ή μαζική εγγραφή CSV με κωδικούς QR (`/login/enroll?token=oscar_inv_...`).",
                    "Εξετάστε τα **Διακριτικά ομοσπονδίας (`oscar_fed_...`)** (για Κόμβους {{icon:servers}}) και την πολιτική **SSO OIDC / Έμπιστης σήραγγας** (`X-Octelium-Groups`, CA PEM).",
                    "Γνωρίζετε την εντολή έκτακτης ανάκτησης στον διακομιστή: `sudo bash oscar.sh reset-admin-password` ή `.\\oscar.bat reset-admin-password`. Πατήστε «Σήμανση ως ολοκληρωμένο» μόλις ολοκληρώσετε.",
                ],
                keyTerms: [
                    {
                        term: "Passkeys εκτός δικτύου (FIDO2 / WebAuthn)",
                        meaning: "Βιομετρική σύνδεση ή κλειδί ασφαλείας επαληθευμένο 100% τοπικά χωρίς internet.",
                    },
                    {
                        term: "Περιορισμός `allowedViews`",
                        meaning: "Περιορίζει έναν χρήστη μόνο στις ανατεθειμένες Λειτουργικές προβολές σε όλο το σύστημα.",
                    },
                    {
                        term: "Ανάκτηση `reset-admin-password`",
                        meaning: "Εντολή CLI έκτακτης επαναφοράς κωδικού διαχειριστή χωρίς απώλεια δεδομένων.",
                    },
                ],
                commonPitfalls: [
                    "Οι τοπικοί κωδικοί OSCAR είναι ανεξάρτητοι από τη σήραγγα Octelium Zero-Trust.",
                    "Κατά την ανάκληση χρήστη SSO, απενεργοποιήστε τον και στον πάροχο ταυτότητας (`Authentik` / IdP).",
                ],
                objectiveSummary: "Εξέταση ρόλων RBAC, προσκλήσεων QR, SSO και διακριτικών ομοσπονδίας στο `/users`.",
            },
        },
        copySnippets: [
            { label: "Break-Glass Reset", labels: { es: "Reinicio emergencia", fr: "Secours admin", el: "Επαναφορά έκτακτης ανάγκης" }, value: "sudo bash oscar.sh reset-admin-password" },
        ],
        spotlights: [
            {
                id: "users",
                selector: '[data-testid="nav-item-users"], [data-testid="navbar-user-account-btn"]',
                label: "Highlight Users & Access Icon",
                iconKey: "users",
            },
            {
                id: "servers",
                selector: '[data-testid="nav-item-servers"]',
                label: "Highlight Nodes (Cloud) Icon",
                iconKey: "servers",
            },
        ],
        spotlightSelector: '[data-testid="nav-item-users"], [data-testid="navbar-user-account-btn"]',
        spotlightLabel: "Highlight Users & Access Icon",
        objectiveSummary: "Review RBAC roles, QR enrollment invites, SSO, and Passkey / Federation Token controls in `/users`.",
        isAutoVerified: () => false,
    },
    {
        id: "adm-4",
        trackId: "administrator",
        badge: "3.5",
        chipLabel: "Extensions",
        route: "/extensions",
        pageIconKey: "extensions",
        videoGuideSlug: "25-pluggable-runtime-extensions-and-pmtiles",
        screenshotFile: "46-runtime-extensions-hub.png",
        screenshotCaption: "Runtime Extensions hub for air-gapped .pmtiles basemaps, custom policy packs, OCR/spectroscopy packs, enterprise CAs, and Cargo NII shares.",
        title: "Runtime Extensions (`.pmtiles` Maps, Policy Packs, CAs & Cargo NII)",
        durationEstimate: "5 min",
        whyItMatters:
            "Runtime Extensions {{icon:extensions}} (`/extensions`, puzzle-piece icon) let sites hot-swap air-gapped `.pmtiles` regional maps, agency disposition Policy Packs (`Code 101+`), regional Unicode OCR / spectroscopy libraries, trusted enterprise X.509 CAs, and read-only SMBv2/SMBv3 Cargo UFF shares — surviving every future `oscar upgrade` without touching shipped defaults.",
        steps: [
            "Download `sample-regional-map.pmtiles` and `sample-policy-pack.json` using the practice buttons below.",
            "In Runtime Extensions {{icon:extensions}} (`/extensions`), upload `sample-regional-map.pmtiles` under Offline Regional Basemaps (then verify `Offline: <Layer>` on Map {{icon:map}} `/map`), OR upload `sample-policy-pack.json` under Adjudication Policy Packs (`Code 101` & `Code 102`).",
            "Under Cargo NII (WCO UFF) {{icon:uff}}, test Local Directory mode using `/var/lib/oscar/sandbox-tutorial/uff-share` (or review SMBv2/SMBv3 read-only share credentials for production X-ray NAS servers). Notice you can click `Restore Built-In Default` on any extension anytime.",
        ],
        keyTerms: [
            {
                term: "PMTiles v3 (`.pmtiles`)",
                meaning: "Single-file cloud/offline map archive rendering crisp regional vector/raster basemaps on completely air-gapped networks.",
            },
            {
                term: "Adjudication Policy Pack (`.json`)",
                meaning: "Custom agency disposition code catalog (`Code 101+`) merged cleanly alongside OSCAR's built-in `1–11` and `9998`/`9999` codes.",
            },
            {
                term: "Upgrade-Safe Extensions (`/var/lib/oscar/extensions/`)",
                meaning: "Stored in persistent OSCAR state so every future release upgrade keeps your maps, OCR packs, CAs, and policies automatically.",
            },
        ],
        commonPitfalls: [
            "Uploading a custom extension never deletes OSCAR's built-in defaults — clicking `Restore Built-In Default` reverts instantaneously.",
            "Cargo NII SMB shares MUST use a dedicated read-only NAS service account; OSCAR never writes to or modifies scanner X-ray shares.",
        ],
        translations: {
            en: {
                chipLabel: "Extensions",
                title: "Runtime Extensions (`.pmtiles` Maps, Policy Packs, CAs & Cargo NII)",
                screenshotCaption: "Runtime Extensions hub for air-gapped .pmtiles basemaps, custom policy packs, OCR/spectroscopy packs, enterprise CAs, and Cargo NII shares.",
                whyItMatters:
                    "Runtime Extensions {{icon:extensions}} (`/extensions`, puzzle-piece icon) let sites hot-swap air-gapped `.pmtiles` regional maps, agency disposition Policy Packs (`Code 101+`), regional Unicode OCR / spectroscopy libraries, trusted enterprise X.509 CAs, and read-only SMBv2/SMBv3 Cargo UFF shares — surviving every future `oscar upgrade` without touching shipped defaults.",
                steps: [
                    "Download `sample-regional-map.pmtiles` and `sample-policy-pack.json` using the practice buttons below.",
                    "In Runtime Extensions {{icon:extensions}} (`/extensions`), upload `sample-regional-map.pmtiles` under Offline Regional Basemaps (then verify `Offline: <Layer>` on Map {{icon:map}} `/map`), OR upload `sample-policy-pack.json` under Adjudication Policy Packs (`Code 101` & `Code 102`).",
                    "Under Cargo NII (WCO UFF) {{icon:uff}}, test Local Directory mode using `/var/lib/oscar/sandbox-tutorial/uff-share` (or review SMBv2/SMBv3 read-only share credentials for production X-ray NAS servers). Notice you can click `Restore Built-In Default` on any extension anytime.",
                ],
                keyTerms: [
                    {
                        term: "PMTiles v3 (`.pmtiles`)",
                        meaning: "Single-file cloud/offline map archive rendering crisp regional vector/raster basemaps on completely air-gapped networks.",
                    },
                    {
                        term: "Adjudication Policy Pack (`.json`)",
                        meaning: "Custom agency disposition code catalog (`Code 101+`) merged cleanly alongside OSCAR's built-in `1–11` and `9998`/`9999` codes.",
                    },
                    {
                        term: "Upgrade-Safe Extensions (`/var/lib/oscar/extensions/`)",
                        meaning: "Stored in persistent OSCAR state so every future release upgrade keeps your maps, OCR packs, CAs, and policies automatically.",
                    },
                ],
                commonPitfalls: [
                    "Uploading a custom extension never deletes OSCAR's built-in defaults — clicking `Restore Built-In Default` reverts instantaneously.",
                    "Cargo NII SMB shares MUST use a dedicated read-only NAS service account; OSCAR never writes to or modifies scanner X-ray shares.",
                ],
                objectiveSummary: "Activate an offline `.pmtiles` basemap, Policy Pack, or Cargo NII share in `/extensions`.",
            },
            es: {
                chipLabel: "Extensiones",
                title: "Extensiones de ejecución (mapas `.pmtiles`, políticas, CA y Carga NII)",
                screenshotCaption: "Centro de Extensiones para mapas .pmtiles sin conexión, paquetes de política, OCR/espectroscopia, CA y Carga NII.",
                whyItMatters:
                    "Extensiones {{icon:extensions}} (`/extensions`) permite cambiar en caliente mapas `.pmtiles`, códigos propios (`101+`), paquetes OCR/espectroscopia, certificados CA y recursos SMB de Carga UFF conservándolos tras cada actualización.",
                steps: [
                    "Descargue `sample-regional-map.pmtiles` y `sample-policy-pack.json` abajo.",
                    "En Extensiones {{icon:extensions}} (`/extensions`), cargue `sample-regional-map.pmtiles` en Mapas regionales sin conexión (y compruébelo en Mapa {{icon:map}}) o suba `sample-policy-pack.json` (`Código 101` y `102`).",
                    "En Carga NII (WCO UFF) {{icon:uff}}, pruebe el modo directorio local con `/var/lib/oscar/sandbox-tutorial/uff-share` y observe el botón `Restaurar predeterminado`.",
                ],
                keyTerms: [
                    {
                        term: "PMTiles v3 (`.pmtiles`)",
                        meaning: "Archivo único de mapa regional para redes totalmente aisladas sin internet.",
                    },
                    {
                        term: "Paquete de política (`.json`)",
                        meaning: "Catálogo de códigos de adjudicación propios de la agencia (`101+`) junto a los integrados.",
                    },
                    {
                        term: "Persistencia ante actualizaciones",
                        meaning: "Guardado en `/var/lib/oscar/extensions/` para sobrevivir a todo `oscar upgrade`.",
                    },
                ],
                commonPitfalls: [
                    "Siempre puede revertir al valor integrado en 1 clic sin perder configuraciones.",
                    "Use cuentas SMB de solo lectura para los recursos de escáneres de rayos X.",
                ],
                objectiveSummary: "Activar un mapa `.pmtiles`, paquete de política o recurso Carga NII en `/extensions`.",
            },
            fr: {
                chipLabel: "Extensions",
                title: "Extensions d’exécution (cartes `.pmtiles`, politiques, AC et fret NII)",
                screenshotCaption: "Centre Extensions pour cartes hors ligne .pmtiles, packs de codes, OCR/spectroscopie, AC et partages UFF.",
                whyItMatters:
                    "Extensions {{icon:extensions}} (`/extensions`) permet d’activer à chaud cartes `.pmtiles` hors ligne, codes d’agence (`101+`), packs OCR/spectroscopie, AC X.509 et partages SMB UFF tout en résistant à chaque mise à niveau.",
                steps: [
                    "Téléchargez `sample-regional-map.pmtiles` et `sample-policy-pack.json` ci-dessous.",
                    "Dans Extensions {{icon:extensions}} (`/extensions`), chargez `sample-regional-map.pmtiles` sous Cartes régionales hors ligne (vérifiez sur Carte {{icon:map}}) ou chargez `sample-policy-pack.json` (`Code 101` & `102`).",
                    "Sous Fret NII (WCO UFF) {{icon:uff}}, testez le répertoire local `/var/lib/oscar/sandbox-tutorial/uff-share` et repérez `Rétablir les défauts intégrés`.",
                ],
                keyTerms: [
                    {
                        term: "PMTiles v3 (`.pmtiles`)",
                        meaning: "Archive cartographique autonome pour sites totalement isolés d’internet.",
                    },
                    {
                        term: "Pack de politique (`.json`)",
                        meaning: "Catalogue de codes d’adjudication d’agence (`101+`) ajouté aux codes standards.",
                    },
                    {
                        term: "Extensions persistantes",
                        meaning: "Stockées dans `/var/lib/oscar/extensions/` et préservées à chaque `oscar upgrade`.",
                    },
                ],
                commonPitfalls: [
                    "Les valeurs par défaut livrées ne sont jamais détruites : un clic suffit pour revenir en arrière.",
                    "Les partages SMB UFF doivent utiliser un compte dédié en lecture seule.",
                ],
                objectiveSummary: "Activer une carte `.pmtiles`, un pack de politique ou un partage fret NII dans `/extensions`.",
            },
            el: {
                chipLabel: "Επεκτάσεις",
                title: "Επεκτάσεις εκτέλεσης (χάρτες `.pmtiles`, πολιτικές, CA & Cargo NII)",
                screenshotCaption: "Κέντρο Επεκτάσεων για χάρτες .pmtiles εκτός δικτύου, πακέτα πολιτικής, OCR/φασματοσκοπία, CA και Cargo NII.",
                whyItMatters:
                    "Οι Επεκτάσεις {{icon:extensions}} (`/extensions`) επιτρέπουν άμεση φόρτωση χαρτών `.pmtiles`, κωδικών υπηρεσίας (`101+`), πακέτων OCR/φασματοσκοπίας, CA και SMB Cargo UFF που επιβιώνουν σε κάθε αναβάθμιση.",
                steps: [
                    "Κατεβάστε τα `sample-regional-map.pmtiles` και `sample-policy-pack.json` παρακάτω.",
                    "Στις Επεκτάσεις {{icon:extensions}} (`/extensions`), ανεβάστε `sample-regional-map.pmtiles` στους χάρτες εκτός δικτύου (ελέγξτε τον Χάρτη {{icon:map}}) ή το `sample-policy-pack.json` (`Κωδικοί 101/102`).",
                    "Στο Cargo NII (WCO UFF) {{icon:uff}}, δοκιμάστε τοπικό φάκελο `/var/lib/oscar/sandbox-tutorial/uff-share` και δείτε το κουμπί επαναφοράς προεπιλογών.",
                ],
                keyTerms: [
                    {
                        term: "PMTiles v3 (`.pmtiles`)",
                        meaning: "Μοναδικό αρχείο χάρτη για πλήρως απομονωμένα δίκτυα χωρίς internet.",
                    },
                    {
                        term: "Πακέτο πολιτικής (`.json`)",
                        meaning: "Κατάλογος επιπλέον κωδικών διάθεσης υπηρεσίας (`101+`) δίπλα στους βασικούς.",
                    },
                    {
                        term: "Επεκτάσεις ασφαλείς σε αναβαθμίσεις",
                        meaning: "Αποθηκεύονται στο `/var/lib/oscar/extensions/` και διατηρούνται σε κάθε `oscar upgrade`.",
                    },
                ],
                commonPitfalls: [
                    "Οι ενσωματωμένες προεπιλογές δεν διαγράφονται ποτέ — επανέρχονται με 1 κλικ.",
                    "Χρησιμοποιείτε πάντα λογαριασμό SMB μόνο ανάγνωσης για σαρωτές ακτίνων X.",
                ],
                objectiveSummary: "Ενεργοποίηση χάρτη `.pmtiles`, πακέτου πολιτικής ή Cargo NII στις `/extensions`.",
            },
        },
        sampleFiles: [
            {
                fileName: "sample-regional-map.pmtiles",
                buttonLabel: "Download Practice Map (.pmtiles)",
                buttonLabels: {
                    es: "Descargar mapa de práctica (.pmtiles)",
                    fr: "Télécharger carte d’exercice (.pmtiles)",
                    el: "Λήψη δείγματος χάρτη (.pmtiles)",
                },
            },
            {
                fileName: "sample-policy-pack.json",
                buttonLabel: "Download Policy Pack (.json)",
                buttonLabels: {
                    es: "Descargar paquete de política (.json)",
                    fr: "Télécharger pack de politique (.json)",
                    el: "Λήψη πακέτου πολιτικής (.json)",
                },
            },
        ],
        copySnippets: [
            {
                label: "Copy Sandbox UFF Path",
                labels: {
                    es: "Copiar ruta UFF",
                    fr: "Copier chemin UFF",
                    el: "Αντιγραφή διαδρομής UFF",
                },
                value: "/var/lib/oscar/sandbox-tutorial/uff-share",
            },
        ],
        spotlights: [
            {
                id: "extensions",
                selector: '[data-testid="nav-item-extensions"]',
                label: "Highlight Runtime Extensions Icon",
                iconKey: "extensions",
            },
            {
                id: "map",
                selector: '[data-testid="nav-item-map"]',
                label: "Highlight Map Icon",
                iconKey: "map",
            },
        ],
        spotlightSelector: '[data-testid="nav-item-extensions"]',
        spotlightLabel: "Highlight Runtime Extensions Icon",
        objectiveSummary: "Activate an offline `.pmtiles` basemap, Policy Pack, or Cargo NII share in `/extensions`.",
        isAutoVerified: (v) => v.offlineMapActive || v.policyPackActive || v.cargoUffEnabled,
    },
    {
        id: "adm-5",
        trackId: "administrator",
        badge: "3.6",
        chipLabel: "Lights & Sound",
        route: "/health",
        pageIconKey: "webrelay",
        videoGuideSlug: "29-lane-webrelay-lights-and-sound",
        screenshotFile: "53-lane-webrelay-lights-and-sound.png",
        screenshotCaption: "Per-lane RPM Lights & Sound (WebRelay-Quad) control modal showing Automatic EML gatekeeping, relay coil telemetry (R1–R4), and timed alarm test pulses.",
        title: "Per-Lane Physical RPM Lights & Sound (`WebRelay-Quad`)",
        durationEstimate: "4 min",
        whyItMatters:
            "Administrators suppress nuisance physical siren/beacon activations on benign NORM (`Code 9999`) and stalled gamma holds (`Code 9998`) via Lights & Sound {{icon:webrelay}} (megaphone icon) while pulsing Gamma Red + Siren (`R3`) and Neutron Blue (`R4`) on real threats — failing safe to `0,0,0,0` pass-through if OSCAR ever stops.",
        steps: [
            "Click 'Stage DemoLane01 + Loopback WebRelay' below (or open Status of Health {{icon:health}} `/health` if `DemoLane01` is online) and click the 'Lights & Sound' {{icon:webrelay}} button.",
            "Verify the sandbox loopback WebRelay-Quad (`127.0.0.1` port `10180`) using `Test Connection`, then review all 4 Operating Modes: `AUTO` (arms `R1=1, R2=1` intercept coils, suppresses `9999` and optional `9998`, pulses `R3`/`R4` on real alarms), `PASS_THROUGH` (`0,0,0,0` direct hardware wiring), `MUTED` (`1,1,0,0`), and `MANUAL`.",
            "Click timed pulse controls (`Pulse Gamma + Sounder` `R3` or `Pulse Neutron` `R4`) inside the modal and watch live coil telemetry update in real time!",
        ],
        keyTerms: [
            {
                term: "Fail-Safe `0,0,0,0` Pass-Through",
                meaning: "If OSCAR stops, reboots, or loses power, relays de-energize to `0,0,0,0` so the physical RPM lights and siren immediately fall back to direct hardware wiring.",
            },
            {
                term: "Coil Map (`R1–R4`)",
                meaning: "`R1`/`R2` = intercept coils armed in `AUTO`; `R3` = Gamma Red Beacon + Siren pulse; `R4` = Neutron Blue Beacon pulse.",
            },
        ],
        commonPitfalls: [
            "Forgetting to enable `soundOnNeutronAlarm` or muting a lane during maintenance and forgetting to switch back from `MUTED` to `AUTO` — `/health` flags muted lanes visibly.",
        ],
        translations: {
            en: {
                chipLabel: "Lights & Sound",
                title: "Per-Lane Physical RPM Lights & Sound (`WebRelay-Quad`)",
                screenshotCaption: "Per-lane RPM Lights & Sound (WebRelay-Quad) control modal showing Automatic EML gatekeeping, relay coil telemetry (R1–R4), and timed alarm test pulses.",
                whyItMatters:
                    "Administrators suppress nuisance physical siren/beacon activations on benign NORM (`Code 9999`) and stalled gamma holds (`Code 9998`) via Lights & Sound {{icon:webrelay}} (megaphone icon) while pulsing Gamma Red + Siren (`R3`) and Neutron Blue (`R4`) on real threats — failing safe to `0,0,0,0` pass-through if OSCAR ever stops.",
                steps: [
                    "Click 'Stage DemoLane01 + Loopback WebRelay' below (or open Status of Health {{icon:health}} `/health` if `DemoLane01` is online) and click the 'Lights & Sound' {{icon:webrelay}} button.",
                    "Verify the sandbox loopback WebRelay-Quad (`127.0.0.1` port `10180`) using `Test Connection`, then review all 4 Operating Modes: `AUTO` (arms `R1=1, R2=1` intercept coils, suppresses `9999` and optional `9998`, pulses `R3`/`R4` on real alarms), `PASS_THROUGH` (`0,0,0,0` direct hardware wiring), `MUTED` (`1,1,0,0`), and `MANUAL`.",
                    "Click timed pulse controls (`Pulse Gamma + Sounder` `R3` or `Pulse Neutron` `R4`) inside the modal and watch live coil telemetry update in real time!",
                ],
                keyTerms: [
                    {
                        term: "Fail-Safe `0,0,0,0` Pass-Through",
                        meaning: "If OSCAR stops, reboots, or loses power, relays de-energize to `0,0,0,0` so the physical RPM lights and siren immediately fall back to direct hardware wiring.",
                    },
                    {
                        term: "Coil Map (`R1–R4`)",
                        meaning: "`R1`/`R2` = intercept coils armed in `AUTO`; `R3` = Gamma Red Beacon + Siren pulse; `R4` = Neutron Blue Beacon pulse.",
                    },
                ],
                commonPitfalls: [
                    "Forgetting to enable `soundOnNeutronAlarm` or muting a lane during maintenance and forgetting to switch back from `MUTED` to `AUTO` — `/health` flags muted lanes visibly.",
                ],
                objectiveSummary: "Connect a lane to the loopback WebRelay-Quad (`127.0.0.1:10180`) and verify online coil telemetry (`webRelayOnlineCount >= 1`).",
            },
            es: {
                chipLabel: "Luces y sonido",
                title: "Luces y sirena físicas del RPM por carril (`WebRelay-Quad`)",
                screenshotCaption: "Control modal de Luces y sonido (WebRelay-Quad) con modo AUTO EML, telemetría de bobinas (R1–R4) y pulsos temporizados.",
                whyItMatters:
                    "Permite suprimir sirenas físicas ante cargas NORM benignas (`Código 9999`) y retenciones (`9998`) mediante Luces y sonido {{icon:webrelay}}, activando Luz Roja+Sirena (`R3`) y Azul Neutrones (`R4`) en amenazas reales con modo seguro `0,0,0,0` ante apagado.",
                steps: [
                    "Pulse 'Preparar DemoLane01 + WebRelay local' abajo y abra 'Luces y sonido' {{icon:webrelay}} en Estado de salud {{icon:health}} (`/health`).",
                    "Pruebe `127.0.0.1:10180` con `Probar conexión` y revise los modos `AUTO` (`R1=1, R2=1`), `PASS_THROUGH` (`0,0,0,0`), `MUTED` (`1,1,0,0`) y `MANUAL`.",
                    "Dispare pulsos temporizados (`R3` Gamma + sirena o `R4` Neutrones) y observe la telemetría en vivo.",
                ],
                keyTerms: [
                    {
                        term: "Modo seguro `0,0,0,0` (`PASS_THROUGH`)",
                        meaning: "Si OSCAR se detiene o reinicia, los relés vuelven al cableado físico directo del pórtico.",
                    },
                    {
                        term: "Bobinas `R1–R4`",
                        meaning: "`R1`/`R2` interceptación en `AUTO`; `R3` luz roja gamma + sirena; `R4` luz azul de neutrones.",
                    },
                ],
                commonPitfalls: [
                    "No olvide devolver un carril de `MUTED` a `AUTO` tras mantenimiento (`/health` resalta los carriles silenciados).",
                ],
                objectiveSummary: "Conectar un carril al WebRelay-Quad local (`127.0.0.1:10180`) y confirmar telemetría (`webRelayOnlineCount >= 1`).",
            },
            fr: {
                chipLabel: "Feux & sirène",
                title: "Feux et sirène physiques RPM par voie (`WebRelay-Quad`)",
                screenshotCaption: "Fenêtre Feux et son (WebRelay-Quad) affichant filtrage AUTO EML, télémétrie des bobines (R1–R4) et impulsions temporisées.",
                whyItMatters:
                    "Supprime les déclenchements physiques intempestifs sur NORM (`Code 9999`) et arrêts prolongés (`9998`) via Feux et son {{icon:webrelay}} tout en déclenchant `R3`/`R4` sur menace réelle, avec repli sûr `0,0,0,0` à l’arrêt.",
                steps: [
                    "Cliquez sur « Préparer DemoLane01 + WebRelay local » ci-dessous puis ouvrez « Feux et son » {{icon:webrelay}} dans État de santé {{icon:health}} (`/health`).",
                    "Testez `127.0.0.1:10180` via `Tester la connexion` et examinez `AUTO` (`R1=1, R2=1`), `PASS_THROUGH` (`0,0,0,0`), `MUTED` (`1,1,0,0`) et `MANUAL`.",
                    "Testez les impulsions temporisées (`R3` Gamma + sirène ou `R4` Neutrons) et observez les bobines en direct.",
                ],
                keyTerms: [
                    {
                        term: "Repli sûr `0,0,0,0` (`PASS_THROUGH`)",
                        meaning: "Si OSCAR s’arrête, les relais reviennent automatiquement au câblage direct du portique.",
                    },
                    {
                        term: "Bobines `R1–R4`",
                        meaning: "`R1`/`R2` interception `AUTO` ; `R3` feu rouge gamma + sirène ; `R4` feu bleu neutrons.",
                    },
                ],
                commonPitfalls: [
                    "N’oubliez pas de repasser une voie de `MUTED` à `AUTO` après maintenance.",
                ],
                objectiveSummary: "Connecter une voie au WebRelay-Quad local (`127.0.0.1:10180`) (`webRelayOnlineCount >= 1`).",
            },
            el: {
                chipLabel: "Φώτα & σειρήνα",
                title: "Φυσικά φώτα & σειρήνα RPM ανά λωρίδα (`WebRelay-Quad`)",
                screenshotCaption: "Έλεγχος Φώτων & ήχου (WebRelay-Quad) με αυτόματο φιλτράρισμα EML, τηλεμετρία πηνίων (R1–R4) και παλμούς δοκιμής.",
                whyItMatters:
                    "Καταστέλλει ενοχλητικές ενεργοποιήσεις σειρήνας σε NORM (`Κωδικός 9999`) και στάσεις (`9998`) μέσω Φώτων & ήχου {{icon:webrelay}}, ενεργοποιώντας `R3`/`R4` σε πραγματικές απειλές με ασφαλή επαναφορά `0,0,0,0`.",
                steps: [
                    "Πατήστε «Προετοιμασία DemoLane01 + τοπικό WebRelay» παρακάτω και ανοίξτε «Φώτα & ήχος» {{icon:webrelay}} στην Κατάσταση υγείας {{icon:health}} (`/health`).",
                    "Ελέγξτε `127.0.0.1:10180` με `Δοκιμή σύνδεσης` και δείτε τις λειτουργίες `AUTO` (`R1=1, R2=1`), `PASS_THROUGH` (`0,0,0,0`), `MUTED` (`1,1,0,0`) και `MANUAL`.",
                    "Δοκιμάστε χρονομετρημένους παλμούς (`R3` Γάμμα + σειρήνα ή `R4` Νετρόνια) και παρακολουθήστε ζωντανά τα πηνία.",
                ],
                keyTerms: [
                    {
                        term: "Ασφαλής επαναφορά `0,0,0,0` (`PASS_THROUGH`)",
                        meaning: "Αν σταματήσει το OSCAR, τα ρελέ επιστρέφουν αμέσως στην απευθείας καλωδίωση της πύλης.",
                    },
                    {
                        term: "Πηνία `R1–R4`",
                        meaning: "`R1`/`R2` παρεμβολή `AUTO`· `R3` κόκκινο φως γάμμα + σειρήνα· `R4` μπλε φως νετρονίων.",
                    },
                ],
                commonPitfalls: [
                    "Επαναφέρετε πάντα μια λωρίδα από `MUTED` σε `AUTO` μετά από συντήρηση.",
                ],
                objectiveSummary: "Σύνδεση λωρίδας στο τοπικό WebRelay-Quad (`127.0.0.1:10180`) (`webRelayOnlineCount >= 1`).",
            },
        },
        injectActions: [
            {
                scenario: "stage_webrelay_demo",
                label: "Stage DemoLane01 + Loopback WebRelay",
                labels: {
                    es: "Preparar DemoLane01 + WebRelay local",
                    fr: "Préparer DemoLane01 + WebRelay local",
                    el: "Προετοιμασία DemoLane01 + τοπικό WebRelay",
                },
            },
        ],
        copySnippets: [
            { label: "Copy Sandbox Relay Host", labels: { es: "Copiar Host Relé", fr: "Copier Hôte Relais", el: "Αντιγραφή Host Ρελέ" }, value: "127.0.0.1" },
            { label: "Copy Sandbox Relay Port", labels: { es: "Copiar Puerto Relé", fr: "Copier Port Relais", el: "Αντιγραφή Θύρας Ρελέ" }, value: "10180" },
        ],
        spotlights: [
            {
                id: "health",
                selector: '[data-testid="nav-item-health"]',
                label: "Highlight Status of Health Icon",
                iconKey: "health",
            },
            {
                id: "webrelay",
                selector: '[data-testid^="webrelay-open-lane-"], [data-testid="webrelay-open-header-btn"], [data-testid="lane-view-webrelay-btn"]',
                label: "Highlight Lane Lights & Sound Button",
                iconKey: "webrelay",
            },
        ],
        spotlightSelector: '[data-testid^="webrelay-open-lane-"], [data-testid="webrelay-open-header-btn"], [data-testid="lane-view-webrelay-btn"]',
        spotlightLabel: "Highlight Lane Lights & Sound Button",
        objectiveSummary: "Connect a lane to the loopback WebRelay-Quad (`127.0.0.1:10180`) and verify online coil telemetry (`webRelayOnlineCount >= 1`).",
        isAutoVerified: (v) => (v.webRelayOnlineCount ?? 0) >= 1,
    },
    {
        id: "adm-mobile-detectors",
        trackId: "administrator",
        badge: "3.7",
        chipLabel: "Mobile Patrols",
        route: "/lane-view",
        pageIconKey: "split-admin",
        splitPaneAdmin: true,
        videoGuideSlug: "33-mobile-radiation-detectors",
        screenshotFile: "57-mobile-detector-map-and-lane-view.png",
        screenshotCaption: "Mobile Detector System live GPS breadcrumb trail and Cs-137 hotspot marker on Map (/map) paired with 1,024-channel gamma spectrum in Lane View (/lane-view).",
        title: "Configure & Monitor Mobile Radiation Detectors (`RS-350` & `Kromek D5`)",
        durationEstimate: "5 min",
        whyItMatters:
            "Roving backpack and handheld patrols (`RS-350 Backpack` and `Kromek D5`) operate as dedicated `Mobile Detector System` lanes without portal cameras or Extended Occupancy faults, streaming live GPS trails onto Map {{icon:map}} and 1,024-channel spectra into `/lane-view`.",
        steps: [
            "Click 'Open Split-Pane SensorHub Admin' {{icon:split-admin}} above, right-click the Systems pane -> Add Module -> `Mobile Detector System` (Name `PatrolRS350`, UID `patrol-rs350`, Auto-Start checked), and choose `RS-350 Backpack` (`RS-350`) with Host `127.0.0.1` and Port `10110` (the built-in `:8444` loopback walker simulator).",
            "Click `Apply Changes` and `Start` the module so `PatrolRS350` connects to `127.0.0.1:10110` and streams 1 Hz STX/ETX ANSI N42.42 frames.",
            "Click `Return to Viewer Page`, open Map {{icon:map}} (`/map`) to watch the live GPS trail and periodic `Cs-137` hotspot alarms, then inspect the 1,024-channel gamma spectrum (`662 keV` photopeak) and dose rate in `/lane-view`.",
        ],
        keyTerms: [
            {
                term: "`MobileDetectorSystem` Module",
                meaning: "First-class OSCAR lane type for roving walkers (`RS-350` / `Kromek D5`) suppressing fixed-portal cameras, OCR, WebRelay, and Extended Occupancy.",
            },
            {
                term: "1,024-Channel ANSI N42.42 Spectrum",
                meaning: "Live gamma energy histogram streamed at 1 Hz so analysts spot characteristic isotope peaks (e.g. `Cs-137` at `662 keV`) in real time.",
            },
        ],
        commonPitfalls: [
            "Adding a mobile backpack as a standard `Lane System` instead of `Mobile Detector System`: always pick `Mobile Detector System` so fixed-portal options stay cleanly suppressed.",
        ],
        translations: {
            en: {
                chipLabel: "Mobile Patrols",
                title: "Configure & Monitor Mobile Radiation Detectors (`RS-350` & `Kromek D5`)",
                screenshotCaption: "Mobile Detector System live GPS breadcrumb trail and Cs-137 hotspot marker on Map (/map) paired with 1,024-channel gamma spectrum in Lane View (/lane-view).",
                whyItMatters:
                    "Roving backpack and handheld patrols (`RS-350 Backpack` and `Kromek D5`) operate as dedicated `Mobile Detector System` lanes without portal cameras or Extended Occupancy faults, streaming live GPS trails onto Map {{icon:map}} and 1,024-channel spectra into `/lane-view`.",
                steps: [
                    "Click 'Open Split-Pane SensorHub Admin' {{icon:split-admin}} above, right-click the Systems pane -> Add Module -> `Mobile Detector System` (Name `PatrolRS350`, UID `patrol-rs350`, Auto-Start checked), and choose `RS-350 Backpack` (`RS-350`) with Host `127.0.0.1` and Port `10110` (the built-in `:8444` loopback walker simulator).",
                    "Click `Apply Changes` and `Start` the module so `PatrolRS350` connects to `127.0.0.1:10110` and streams 1 Hz STX/ETX ANSI N42.42 frames.",
                    "Click `Return to Viewer Page`, open Map {{icon:map}} (`/map`) to watch the live GPS trail and periodic `Cs-137` hotspot alarms, then inspect the 1,024-channel gamma spectrum (`662 keV` photopeak) and dose rate in `/lane-view`.",
                ],
                keyTerms: [
                    {
                        term: "`MobileDetectorSystem` Module",
                        meaning: "First-class OSCAR lane type for roving walkers (`RS-350` / `Kromek D5`) suppressing fixed-portal cameras, OCR, WebRelay, and Extended Occupancy.",
                    },
                    {
                        term: "1,024-Channel ANSI N42.42 Spectrum",
                        meaning: "Live gamma energy histogram streamed at 1 Hz so analysts spot characteristic isotope peaks (e.g. `Cs-137` at `662 keV`) in real time.",
                    },
                ],
                commonPitfalls: [
                    "Adding a mobile backpack as a standard `Lane System` instead of `Mobile Detector System`: always pick `Mobile Detector System` so fixed-portal options stay cleanly suppressed.",
                ],
                objectiveSummary: "Create and start a `MobileDetectorSystem` connected to loopback `127.0.0.1:10110` (`mobileDetectorConfigured === true`).",
            },
            es: {
                chipLabel: "Patrullas móviles",
                title: "Configurar y supervisar detectores móviles de radiación (`RS-350` y `Kromek D5`)",
                screenshotCaption: "Traza GPS en vivo y marcador puntual de Cs-137 en Mapa (/map) junto al espectro gamma de 1.024 canales en Vista de carril (/lane-view).",
                whyItMatters:
                    "Las unidades móviles (`RS-350 Backpack` y `Kromek D5`) operan como módulos `Mobile Detector System` sin cámaras de pórtico ni fallos de ocupación prolongada, transmitiendo rutas GPS en vivo en Mapa {{icon:map}} y espectros de 1.024 canales en `/lane-view`.",
                steps: [
                    "Abra SensorHub Admin en vista dividida {{icon:split-admin}}, haga clic derecho en Systems -> Add Module -> `Mobile Detector System` (`PatrolRS350`, UID `patrol-rs350`, Auto-Start activado) y elija `RS-350 Backpack` con Host `127.0.0.1` y Puerto `10110`.",
                    "Pulse Apply Changes e inicie (Start) el módulo para recibir tramas ANSI N42.42 a 1 Hz desde el simulador local de `:8444`.",
                    "Vuelva al visor, abra Mapa {{icon:map}} (`/map`) para seguir el recorrido GPS y las alarmas de `Cs-137`, e inspeccione el espectro de 1.024 canales en `/lane-view`.",
                ],
                keyTerms: [
                    {
                        term: "Módulo `MobileDetectorSystem`",
                        meaning: "Tipo de carril dedicado para mochilas/portátiles que oculta cámaras, OCR, WebRelay y ocupación prolongada.",
                    },
                    {
                        term: "Espectro ANSI N42.42 de 1.024 canales",
                        meaning: "Histograma de energía gamma a 1 Hz que muestra picos isotópicos en vivo (p. ej. `Cs-137` a `662 keV`).",
                    },
                ],
                commonPitfalls: [
                    "No agregue una mochila móvil como `Lane System` fijo; elija siempre `Mobile Detector System`.",
                ],
                objectiveSummary: "Crear e iniciar un `MobileDetectorSystem` conectado a `127.0.0.1:10110` (`mobileDetectorConfigured === true`).",
            },
            fr: {
                chipLabel: "Détecteurs mobiles",
                title: "Configurer et superviser les détecteurs mobiles de rayonnement (`RS-350` et `Kromek D5`)",
                screenshotCaption: "Trace GPS en direct et marqueur de point chaud Cs-137 sur Carte (/map) associés au spectre gamma à 1 024 canaux dans Vue de voie (/lane-view).",
                whyItMatters:
                    "Les patrouilles mobiles (`RS-350 Backpack` et `Kromek D5`) fonctionnent via `Mobile Detector System` sans caméras de portique ni défauts d’occupation prolongée, en diffusant leurs traces GPS sur Carte {{icon:map}} et leurs spectres à 1 024 canaux dans `/lane-view`.",
                steps: [
                    "Ouvrez SensorHub Admin en vue partagée {{icon:split-admin}}, faites un clic droit dans Systems -> Add Module -> `Mobile Detector System` (`PatrolRS350`, UID `patrol-rs350`, Auto-Start coché) et sélectionnez `RS-350 Backpack` avec Hôte `127.0.0.1` et Port `10110`.",
                    "Cliquez sur Apply Changes puis démarrez (Start) le module afin de recevoir les trames ANSI N42.42 à 1 Hz du simulateur intégré à `:8444`.",
                    "Revenez dans OSCAR Viewer, ouvrez Carte {{icon:map}} (`/map`) pour observer la trace GPS et les alarmes `Cs-137`, puis inspectez le spectre à 1 024 canaux dans `/lane-view`.",
                ],
                keyTerms: [
                    {
                        term: "Module `MobileDetectorSystem`",
                        meaning: "Type de voie dédié aux patrouilles mobiles sans caméras fixes, OCR, WebRelay ni occupation prolongée.",
                    },
                    {
                        term: "Spectre ANSI N42.42 à 1 024 canaux",
                        meaning: "Histogramme gamma temps réel à 1 Hz mettant en évidence les pics isotopiques (`Cs-137` à `662 keV`).",
                    },
                ],
                commonPitfalls: [
                    "Choisissez toujours `Mobile Detector System` (et non `Lane System` fixe) pour un détecteur portable.",
                ],
                objectiveSummary: "Créer et démarrer un `MobileDetectorSystem` relié à `127.0.0.1:10110` (`mobileDetectorConfigured === true`).",
            },
            el: {
                chipLabel: "Κινητοί ανιχνευτές",
                title: "Διαμόρφωση & παρακολούθηση κινητών ανιχνευτών ακτινοβολίας (`RS-350` & `Kromek D5`)",
                screenshotCaption: "Ζωντανό ίχνος GPS και δείκτης συναγερμού Cs-137 στον Χάρτη (/map) σε συνδυασμό με φάσμα γάμμα 1.024 καναλιών στην Προβολή λωρίδας (/lane-view).",
                whyItMatters:
                    "Οι κινητές περίπολοι (`RS-350 Backpack` και `Kromek D5`) λειτουργούν ως εξειδικευμένα συστήματα `Mobile Detector System` χωρίς κάμερες πύλης ή σφάλματα παρατεταμένης διέλευσης, μεταδίδοντας ζωντανά ίχνη GPS στον Χάρτη {{icon:map}} και φάσματα 1.024 καναλιών στην `/lane-view`.",
                steps: [
                    "Ανοίξτε το SensorHub Admin σε διπλή προβολή {{icon:split-admin}}, κάντε δεξί κλικ στο Systems -> Add Module -> `Mobile Detector System` (`PatrolRS350`, UID `patrol-rs350`, Auto-Start ενεργό) και επιλέξτε `RS-350 Backpack` με Host `127.0.0.1` και Θύρα `10110`.",
                    "Πατήστε Apply Changes και εκκινήστε (Start) τη μονάδα ώστε να λαμβάνει πλαίσια ANSI N42.42 1 Hz από τον ενσωματωμένο εξομοιωτή της θύρας `:8444`.",
                    "Επιστρέψτε στο OSCAR Viewer, ανοίξτε τον Χάρτη {{icon:map}} (`/map`) για παρακολούθηση του ίχνους GPS και των συναγερμών `Cs-137` και επιθεωρήστε το φάσμα 1.024 καναλιών στην `/lane-view`.",
                ],
                keyTerms: [
                    {
                        term: "Μονάδα `MobileDetectorSystem`",
                        meaning: "Ειδικός τύπος λωρίδας για φορητούς ανιχνευτές χωρίς κάμερες πύλης, OCR, WebRelay ή παρατεταμένη διέλευση.",
                    },
                    {
                        term: "Φάσμα ANSI N42.42 1.024 καναλιών",
                        meaning: "Ζωντανό ιστόγραμμα ενέργειας γάμμα 1 Hz (π.χ. κορυφή `Cs-137` στα `662 keV`).",
                    },
                ],
                commonPitfalls: [
                    "Επιλέγετε πάντα `Mobile Detector System` και όχι σταθερό `Lane System` για φορητούς ανιχνευτές.",
                ],
                objectiveSummary: "Δημιουργία και εκκίνηση `MobileDetectorSystem` συνδεδεμένου στο `127.0.0.1:10110` (`mobileDetectorConfigured === true`).",
            },
        },
        copySnippets: [
            { label: "Copy RS-350 Host", labels: { es: "Copiar Host RS-350", fr: "Copier Hôte RS-350", el: "Αντιγραφή Host RS-350" }, value: "127.0.0.1" },
            { label: "Copy RS-350 Port", labels: { es: "Copiar Puerto RS-350", fr: "Copier Port RS-350", el: "Αντιγραφή Θύρας RS-350" }, value: "10110" },
        ],
        spotlights: [
            {
                id: "split-admin",
                selector: '[data-testid="training-toggle-split-admin"], [data-testid="training-refresher-admin-link"]',
                label: "Highlight Split-Pane Admin Button",
                iconKey: "split-admin",
            },
            {
                id: "map",
                selector: '[data-testid="nav-item-map"]',
                label: "Highlight Map Icon",
                iconKey: "map",
            },
            {
                id: "health",
                selector: '[data-testid="nav-item-health"]',
                label: "Highlight Status of Health Icon",
                iconKey: "health",
            },
        ],
        spotlightSelector: '[data-testid="training-toggle-split-admin"], [data-testid="training-refresher-admin-link"]',
        spotlightLabel: "Highlight Split-Pane Admin Button",
        objectiveSummary: "Create and start a `MobileDetectorSystem` connected to loopback `127.0.0.1:10110` (`mobileDetectorConfigured === true`).",
        isAutoVerified: (snap) => Boolean(snap.mobileDetectorConfigured),
    },
    {
        id: "adm-backup-dr",
        trackId: "administrator",
        badge: "3.8",
        chipLabel: "USB Backups & DR",
        route: "/usb-backups",
        pageIconKey: "usb-backups",
        videoGuideSlug: "24-continual-and-occasional-usb-backups",
        screenshotFile: "45-usb-backups-manager.png",
        screenshotCaption: "USB Backups (/usb-backups) zero-downtime incremental USB 3.x NVMe SSD manager with Safe Eject, SHA-256 verification, and off-site backup-key.txt escrow.",
        title: "Zero-Downtime USB NVMe Backups, Restore & Hardware Replacement",
        durationEstimate: "5 min",
        whyItMatters:
            "Hardware fails — losing a site server must NEVER mean losing years of radiation portal history or spending days rebuilding from scratch. USB Backups {{icon:usb-backups}} (`/usb-backups`, USB trident icon) plus the Bare-Metal Autoinstall USB Creator turn total server replacement into a predictable, technician-ready recovery.",
        steps: [
            "Open USB Backups {{icon:usb-backups}} (`/usb-backups`) and compare the two modes: **Continual Background Sync** (syncs encrypted PostgreSQL + Parquet + `config.json` + media + extensions every 15 minutes with `0.0 s` portal downtime and automatic reconnect catch-up) vs. **Occasional / On-Demand Visit Sync** (plug in an NTFS USB 3.x NVMe SSD during site visits and click `Sync Now`).",
            "Always follow the 2 golden safety rules: (1) Click `Download oscar-backup-key.txt` and store that escrow key **off-site / separately from the USB drive** (without it, encrypted backups cannot be restored), and (2) ALWAYS click `Safely Eject USB Drive` and wait for `SAFE_TO_UNPLUG` before pulling the cable (or run `COPY-TO-ANOTHER-DRIVE.bat` / `./copy-to-another-drive.sh` on a field laptop to mirror deltas onto a second drive).",
            "Know **Cold-Iron Hardware Replacement**: open Users & Access {{icon:users}} -> Backup & Hardware Replacement checklist, build an air-gapped Ubuntu 24.04/26.04 LTS install drive with `oscar-4.0.0-autoinstall-usb-creator.zip` (Video `#31`, which also prints a local **Technician Handover One-Sheet PDF** never stored on the USB), then run 1-command recovery: `sudo bash oscar.sh usb-backup restore --source <usb-path> --key-file oscar-backup-key.txt`.",
        ],
        keyTerms: [
            {
                term: "Zero-Downtime Incremental USB Backup (`0.0 s`)",
                meaning: "Content-addressed incremental sync onto an NTFS USB 3.x NVMe SSD while all 50 portal lanes keep scanning uninterrupted.",
            },
            {
                term: "`oscar-backup-key.txt` Escrow Key",
                meaning: "Master decryption key protecting sensitive backup bundles; store separately from the USB drive (vault/password manager/printed handover sheet).",
            },
            {
                term: "`SAFE_TO_UNPLUG` Safe Eject",
                meaning: "Flushes filesystem caches, verifies SHA-256 manifests, and cleanly unmounts the USB NVMe SSD so the drive is never corrupted.",
            },
            {
                term: "Bare-Metal Autoinstall USB Creator (Video `#31`)",
                meaning: "Windows/Ubuntu GUI/TUI/CLI tool creating an unattended offline Ubuntu + OSCAR installer USB plus a printable Technician Handover One-Sheet PDF.",
            },
        ],
        commonPitfalls: [
            "Yanking the USB SSD without clicking `Safely Eject` risks NTFS dirty-bit corruption; wait for the green `SAFE_TO_UNPLUG` badge.",
            "Saving `oscar-backup-key.txt` ONLY on the USB backup drive itself defeats encryption and creates a single point of failure — store an off-site copy.",
            "Physical PostgreSQL snapshots (`backup` / `usb-backup`) restore onto the same PostgreSQL major version; OSCAR `4.0.0+` automatically upgrades older `4.0+` clusters cleanly afterward.",
        ],
        translations: {
            en: {
                chipLabel: "USB Backups & DR",
                title: "Zero-Downtime USB NVMe Backups, Restore & Hardware Replacement",
                screenshotCaption: "USB Backups (/usb-backups) zero-downtime incremental USB 3.x NVMe SSD manager with Safe Eject, SHA-256 verification, and off-site backup-key.txt escrow.",
                whyItMatters:
                    "Hardware fails — losing a site server must NEVER mean losing years of radiation portal history or spending days rebuilding from scratch. USB Backups {{icon:usb-backups}} (`/usb-backups`, USB trident icon) plus the Bare-Metal Autoinstall USB Creator turn total server replacement into a predictable, technician-ready recovery.",
                steps: [
                    "Open USB Backups {{icon:usb-backups}} (`/usb-backups`) and compare the two modes: **Continual Background Sync** (syncs encrypted PostgreSQL + Parquet + `config.json` + media + extensions every 15 minutes with `0.0 s` portal downtime and automatic reconnect catch-up) vs. **Occasional / On-Demand Visit Sync** (plug in an NTFS USB 3.x NVMe SSD during site visits and click `Sync Now`).",
                    "Always follow the 2 golden safety rules: (1) Click `Download oscar-backup-key.txt` and store that escrow key **off-site / separately from the USB drive** (without it, encrypted backups cannot be restored), and (2) ALWAYS click `Safely Eject USB Drive` and wait for `SAFE_TO_UNPLUG` before pulling the cable (or run `COPY-TO-ANOTHER-DRIVE.bat` / `./copy-to-another-drive.sh` on a field laptop to mirror deltas onto a second drive).",
                    "Know **Cold-Iron Hardware Replacement**: open Users & Access {{icon:users}} -> Backup & Hardware Replacement checklist, build an air-gapped Ubuntu 24.04/26.04 LTS install drive with `oscar-4.0.0-autoinstall-usb-creator.zip` (Video `#31`, which also prints a local **Technician Handover One-Sheet PDF** never stored on the USB), then run 1-command recovery: `sudo bash oscar.sh usb-backup restore --source <usb-path> --key-file oscar-backup-key.txt`.",
                ],
                keyTerms: [
                    {
                        term: "Zero-Downtime Incremental USB Backup (`0.0 s`)",
                        meaning: "Content-addressed incremental sync onto an NTFS USB 3.x NVMe SSD while all 50 portal lanes keep scanning uninterrupted.",
                    },
                    {
                        term: "`oscar-backup-key.txt` Escrow Key",
                        meaning: "Master decryption key protecting sensitive backup bundles; store separately from the USB drive (vault/password manager/printed handover sheet).",
                    },
                    {
                        term: "`SAFE_TO_UNPLUG` Safe Eject",
                        meaning: "Flushes filesystem caches, verifies SHA-256 manifests, and cleanly unmounts the USB NVMe SSD so the drive is never corrupted.",
                    },
                    {
                        term: "Bare-Metal Autoinstall USB Creator (Video `#31`)",
                        meaning: "Windows/Ubuntu GUI/TUI/CLI tool creating an unattended offline Ubuntu + OSCAR installer USB plus a printable Technician Handover One-Sheet PDF.",
                    },
                ],
                commonPitfalls: [
                    "Yanking the USB SSD without clicking `Safely Eject` risks NTFS dirty-bit corruption; wait for the green `SAFE_TO_UNPLUG` badge.",
                    "Saving `oscar-backup-key.txt` ONLY on the USB backup drive itself defeats encryption and creates a single point of failure — store an off-site copy.",
                    "Physical PostgreSQL snapshots (`backup` / `usb-backup`) restore onto the same PostgreSQL major version; OSCAR `4.0.0+` automatically upgrades older `4.0+` clusters cleanly afterward.",
                ],
                objectiveSummary: "Review USB NVMe backup modes, `SAFE_TO_UNPLUG` eject, `oscar-backup-key.txt` escrow, and bare-metal restore in `/usb-backups`.",
            },
            es: {
                chipLabel: "Copias USB y DR",
                title: "Copias USB NVMe sin interrupción, restauración y reemplazo de hardware",
                screenshotCaption: "Copias USB (/usb-backups) con sincronización incremental sin corte en SSD NVMe USB, expulsión segura y custodia de clave.",
                whyItMatters:
                    "Un fallo de hardware nunca debe implicar perder años de historial. Copias USB {{icon:usb-backups}} (`/usb-backups`) junto al Creador USB de autoinstalación convierten la sustitución completa del servidor en una recuperación en un comando.",
                steps: [
                    "Abra Copias USB {{icon:usb-backups}} (`/usb-backups`) y compare **Sincronización continua** (cada 15 min con `0.0 s` de corte y puesta al día automática al reconectar) frente a **Sincronización ocasional** en visitas técnicas.",
                    "Siga las 2 reglas de oro: (1) descargue y guarde `oscar-backup-key.txt` **fuera de la unidad USB**, y (2) pulse SIEMPRE `Expulsar unidad USB de forma segura` y espere `SAFE_TO_UNPLUG` antes de desconectar el cable.",
                    "Para reemplazo total de servidor, revise la lista en Usuarios y acceso {{icon:users}}, cree el USB sin conexión con `oscar-4.0.0-autoinstall-usb-creator.zip` (Vídeo `#31`, con hoja PDF de entrega técnica) y ejecute `sudo bash oscar.sh usb-backup restore --source <ruta-usb> --key-file oscar-backup-key.txt`.",
                ],
                keyTerms: [
                    {
                        term: "Copia incremental USB sin corte (`0.0 s`)",
                        meaning: "Sincronización cifrada en SSD NVMe USB 3.x (`NTFS`) mientras los 50 carriles siguen operando.",
                    },
                    {
                        term: "Clave de custodia `oscar-backup-key.txt`",
                        meaning: "Clave maestra necesaria para descifrar y restaurar copias; guárdela aparte del disco USB.",
                    },
                    {
                        term: "Expulsión segura `SAFE_TO_UNPLUG`",
                        meaning: "Vacía cachés, verifica SHA-256 y desmonta limpiamente la unidad NVMe.",
                    },
                ],
                commonPitfalls: [
                    "Desconectar el SSD sin esperar `SAFE_TO_UNPLUG` puede marcar sucio el sistema NTFS.",
                    "No guarde la única copia de `oscar-backup-key.txt` dentro del propio disco USB.",
                ],
                objectiveSummary: "Revisar copias USB NVMe, expulsión `SAFE_TO_UNPLUG`, custodia de clave y restauración en `/usb-backups`.",
            },
            fr: {
                chipLabel: "Sauvegardes USB",
                title: "Sauvegardes USB NVMe sans coupure, restauration et remplacement matériel",
                screenshotCaption: "Gestionnaire Sauvegardes USB (/usb-backups) incrémental 0,0 s sur SSD NVMe USB avec éjection sûre et clé de secours.",
                whyItMatters:
                    "Une panne serveur ne doit jamais entraîner la perte de l’historique. Sauvegardes USB {{icon:usb-backups}} (`/usb-backups`) et le Créateur USB d’installation automatique rendent le remplacement complet rapide et fiable.",
                steps: [
                    "Ouvrez Sauvegardes USB {{icon:usb-backups}} (`/usb-backups`) : comparez **Synchronisation continue** (toutes les 15 min avec `0,0 s` d’interruption et rattrapage automatique) et **Synchronisation occasionnelle** lors des visites.",
                    "Respectez les 2 règles d’or : (1) conservez `oscar-backup-key.txt` **séparément du disque USB**, et (2) cliquez TOUJOURS sur `Éjecter en toute sécurité` jusqu’à `SAFE_TO_UNPLUG` avant de débrancher.",
                    "Pour un remplacement matériel complet, consultez la liste dans Utilisateurs et accès {{icon:users}}, préparez la clé hors ligne avec `oscar-4.0.0-autoinstall-usb-creator.zip` (Vidéo `#31` + fiche technique PDF locale) puis lancez `sudo bash oscar.sh usb-backup restore --source <chemin-usb> --key-file oscar-backup-key.txt`.",
                ],
                keyTerms: [
                    {
                        term: "Sauvegarde USB incrémentale (`0,0 s`)",
                        meaning: "Synchronisation chiffrée sur SSD NVMe USB 3.x (`NTFS`) sans interrompre les 50 voies.",
                    },
                    {
                        term: "Clé de séquestre `oscar-backup-key.txt`",
                        meaning: "Clé de déchiffrement indispensable à la restauration ; à conserver hors du disque USB.",
                    },
                    {
                        term: "Éjection sûre `SAFE_TO_UNPLUG`",
                        meaning: "Vide les tampons, contrôle SHA-256 et démonte proprement le SSD.",
                    },
                ],
                commonPitfalls: [
                    "Débrancher le SSD sans attendre `SAFE_TO_UNPLUG` risque de corrompre la partition NTFS.",
                    "Ne stockez jamais l’unique exemplaire de `oscar-backup-key.txt` sur le disque USB sauvegardé.",
                ],
                objectiveSummary: "Maîtriser les sauvegardes USB NVMe, l’éjection `SAFE_TO_UNPLUG`, la clé et la restauration dans `/usb-backups`.",
            },
            el: {
                chipLabel: "Αντίγραφα USB & DR",
                title: "Αντίγραφα USB NVMe μηδενικής διακοπής, επαναφορά & αντικατάσταση υλικού",
                screenshotCaption: "Διαχείριση Αντιγράφων USB (/usb-backups) 0,0 s σε USB NVMe SSD με ασφαλή εξαγωγή και κλειδί αποκατάστασης.",
                whyItMatters:
                    "Μία βλάβη διακομιστή δεν πρέπει ποτέ να σημαίνει απώλεια ετών ιστορικού. Τα Αντίγραφα USB {{icon:usb-backups}} (`/usb-backups`) και ο Δημιουργός USB αυτόματης εγκατάστασης επιτρέπουν πλήρη ανάκτηση σε ένα βήμα.",
                steps: [
                    "Ανοίξτε Αντίγραφα USB {{icon:usb-backups}} (`/usb-backups`) και συγκρίνετε **Συνεχή συγχρονισμό** (κάθε 15 λεπτά με `0,0 s` διακοπή και αυτόματη ενημέρωση επανασύνδεσης) με **Περιστασιακό συγχρονισμό** σε επισκέψεις.",
                    "Τηρείτε τους 2 χρυσούς κανόνες: (1) φυλάξτε το `oscar-backup-key.txt` **ξεχωριστά από τον δίσκο USB**, και (2) πατάτε ΠΑΝΤΑ `Ασφαλής εξαγωγή USB` έως την ένδειξη `SAFE_TO_UNPLUG` πριν αποσυνδέσετε.",
                    "Για πλήρη αντικατάσταση διακομιστή, χρησιμοποιήστε το `oscar-4.0.0-autoinstall-usb-creator.zip` (Βίντεο `#31` + εκτυπώσιμο φύλλο παράδοσης PDF) και εκτελέστε `sudo bash oscar.sh usb-backup restore --source <διαδρομή-usb> --key-file oscar-backup-key.txt`.",
                ],
                keyTerms: [
                    {
                        term: "Επαυξητικό αντίγραφο USB (`0,0 s`)",
                        meaning: "Κρυπτογραφημένος συγχρονισμός σε USB 3.x NVMe SSD (`NTFS`) ενώ όλες οι λωρίδες λειτουργούν κανονικά.",
                    },
                    {
                        term: "Κλειδί ασφαλείας `oscar-backup-key.txt`",
                        meaning: "Απαραίτητο κλειδί αποκρυπτογράφησης για επαναφορά· αποθηκεύεται ξεχωριστά από το USB.",
                    },
                    {
                        term: "Ασφαλής εξαγωγή `SAFE_TO_UNPLUG`",
                        meaning: "Ολοκληρώνει εγγραφές, ελέγχει SHA-256 και αποπροσαρτά καθαρά τον δίσκο.",
                    },
                ],
                commonPitfalls: [
                    "Η αποσύνδεση χωρίς `SAFE_TO_UNPLUG` μπορεί να προκαλέσει σφάλμα NTFS.",
                    "Μην αποθηκεύετε το μοναδικό αντίγραφο του `oscar-backup-key.txt` στον ίδιο τον δίσκο USB.",
                ],
                objectiveSummary: "Κατανόηση αντιγράφων USB NVMe, εξαγωγής `SAFE_TO_UNPLUG`, κλειδιού και επαναφοράς στο `/usb-backups`.",
            },
        },
        copySnippets: [
            {
                label: "Cold-Iron USB Restore",
                labels: {
                    es: "Restauración USB completa",
                    fr: "Restauration USB complète",
                    el: "Πλήρης επαναφορά USB",
                },
                value: "sudo bash oscar.sh usb-backup restore --source /mnt/oscar-usb --key-file oscar-backup-key.txt",
            },
        ],
        spotlights: [
            {
                id: "usb-backups",
                selector: '[data-testid="nav-item-usb-backups"]',
                label: "Highlight USB Backups Icon",
                iconKey: "usb-backups",
            },
            {
                id: "users",
                selector: '[data-testid="nav-item-users"]',
                label: "Highlight Users & Access Icon",
                iconKey: "users",
            },
        ],
        spotlightSelector: '[data-testid="nav-item-usb-backups"]',
        spotlightLabel: "Highlight USB Backups Icon",
        objectiveSummary: "Review USB NVMe backup modes, `SAFE_TO_UNPLUG` eject, `oscar-backup-key.txt` escrow, and bare-metal restore in `/usb-backups`.",
        isAutoVerified: () => false,
    },
    {
        id: "adm-lifecycle",
        trackId: "administrator",
        badge: "3.9",
        chipLabel: "Updates & 10-Yr",
        route: "/users?tab=update",
        pageIconKey: "users",
        videoGuideSlug: "30-zero-login-github-system-update",
        screenshotFile: "54-zero-login-github-system-update.png",
        screenshotCaption: "Users & Access -> System Update (/users?tab=update) showing Zero-Login GitHub release check, Production Stable vs. Development Pre-release channel selector, SHA-256 verification, and air-gapped .zip upload.",
        title: "Zero-Login Updates, Release Channels & 10-Year Storage Lifecycle",
        durationEstimate: "5 min",
        whyItMatters:
            "OSCAR `4.0.0+` guarantees **continual in-place upgrades forever** — zero wipe-and-reinit across future OSCAR and PostgreSQL major releases. Administrators manage both zero-login GUI/CLI updates (choosing **Production Stable** or opt-in **Development Pre-release**) and the 10-year `PARQUET_PRIMARY` archive lifecycle right from the console and CLI.",
        steps: [
            "Open Users & Access -> System Update {{icon:users}} (`/users?tab=update`). Observe the **Release Channel** toggle: **Production (Stable — Latest)** is the safe default for operational portals, while **Development (Pre-release — Opt-in)** lets test or early-adopter sites explicitly opt into development builds (`4.0.0-dev.x` / CLI `--channel dev`). Click `Check for Updates` to query official `ORNL/oscar` GitHub Releases with zero GitHub login or token.",
            "Understand how safe upgrades work: OSCAR verifies the SHA-256 digest (or accepts an uploaded air-gapped `oscar-<version>.zip`), optionally takes a pre-upgrade snapshot, deploys into a clean sibling directory, automatically migrates PostgreSQL major versions side-by-side when needed (`PGDATA=/var/lib/postgresql/<major>/docker`), and automatically rolls back to the previous release if health checks fail. (`4.0.0+` upgrades cleanly forever; pre-4.0 pilot installs must initialize fresh once on `4.0.0+`.)",
            "Understand the **10-Year `PARQUET_PRIMARY` Cold Tier**: every 30 minutes OSCAR exports completed PostgreSQL partitions across all 26 streams directly into Zstd-compressed Apache Parquet V2 (`RAW_TELEMETRY` write-once + Bloom-indexed `RAW_EVENTS` compacted into `DAILY_EVENTS` / `MONTHLY_EVENTS`), keeping PostgreSQL fast for 10+ years while automated storage-pressure guardrails protect disk space at `75% / 85% / 92%`. Check `/health` for TLS certificate expiry warnings and use `oscar.sh archive status | verify | hold` (or `oscar.bat`) for archive audits.",
        ],
        keyTerms: [
            {
                term: "Release Channels (`Production Stable` vs. `Dev Pre-release`)",
                meaning: "`Production (Stable — Latest)` tracks official non-prerelease GitHub Latest builds by default; `Development (Pre-release)` is an explicit opt-in toggle (`--channel dev`) for pre-release testing.",
            },
            {
                term: "`4.0.0+` Continual In-Place Upgrade Contract",
                meaning: "Every `4.0.0+` installation upgrades cleanly in place forever — including future PostgreSQL major versions — with sibling-directory rollback and zero data wipe.",
            },
            {
                term: "`PARQUET_PRIMARY` Cold Tier & `75% / 85% / 92%` Guardrails",
                meaning: "30-minute PG staging splits into Zstd Parquet V2 files so 10 years of data stay sub-second searchable; pressure guardrails warn at 75%, trim non-held transient files at 85%, and protect ingestion at 92%.",
            },
        ],
        commonPitfalls: [
            "Never opt a live operational border portal into `Development (Pre-release)` unless specifically authorized for a pilot test — leave production sites on `Production (Stable — Latest)`.",
            "Always run `oscar.sh host-check` (or watch `/health` warnings) ahead of TLS certificate renewal dates so browsers and federated nodes never hit expired certificates.",
        ],
        translations: {
            en: {
                chipLabel: "Updates & 10-Yr",
                title: "Zero-Login Updates, Release Channels & 10-Year Storage Lifecycle",
                screenshotCaption: "Users & Access -> System Update (/users?tab=update) showing Zero-Login GitHub release check, Production Stable vs. Development Pre-release channel selector, SHA-256 verification, and air-gapped .zip upload.",
                whyItMatters:
                    "OSCAR `4.0.0+` guarantees **continual in-place upgrades forever** — zero wipe-and-reinit across future OSCAR and PostgreSQL major releases. Administrators manage both zero-login GUI/CLI updates (choosing **Production Stable** or opt-in **Development Pre-release**) and the 10-year `PARQUET_PRIMARY` archive lifecycle right from the console and CLI.",
                steps: [
                    "Open Users & Access -> System Update {{icon:users}} (`/users?tab=update`). Observe the **Release Channel** toggle: **Production (Stable — Latest)** is the safe default for operational portals, while **Development (Pre-release — Opt-in)** lets test or early-adopter sites explicitly opt into development builds (`4.0.0-dev.x` / CLI `--channel dev`). Click `Check for Updates` to query official `ORNL/oscar` GitHub Releases with zero GitHub login or token.",
                    "Understand how safe upgrades work: OSCAR verifies the SHA-256 digest (or accepts an uploaded air-gapped `oscar-<version>.zip`), optionally takes a pre-upgrade snapshot, deploys into a clean sibling directory, automatically migrates PostgreSQL major versions side-by-side when needed (`PGDATA=/var/lib/postgresql/<major>/docker`), and automatically rolls back to the previous release if health checks fail. (`4.0.0+` upgrades cleanly forever; pre-4.0 pilot installs must initialize fresh once on `4.0.0+`.)",
                    "Understand the **10-Year `PARQUET_PRIMARY` Cold Tier**: every 30 minutes OSCAR exports completed PostgreSQL partitions across all 26 streams directly into Zstd-compressed Apache Parquet V2 (`RAW_TELEMETRY` write-once + Bloom-indexed `RAW_EVENTS` compacted into `DAILY_EVENTS` / `MONTHLY_EVENTS`), keeping PostgreSQL fast for 10+ years while automated storage-pressure guardrails protect disk space at `75% / 85% / 92%`. Check `/health` for TLS certificate expiry warnings and use `oscar.sh archive status | verify | hold` (or `oscar.bat`) for archive audits.",
                ],
                keyTerms: [
                    {
                        term: "Release Channels (`Production Stable` vs. `Dev Pre-release`)",
                        meaning: "`Production (Stable — Latest)` tracks official non-prerelease GitHub Latest builds by default; `Development (Pre-release)` is an explicit opt-in toggle (`--channel dev`) for pre-release testing.",
                    },
                    {
                        term: "`4.0.0+` Continual In-Place Upgrade Contract",
                        meaning: "Every `4.0.0+` installation upgrades cleanly in place forever — including future PostgreSQL major versions — with sibling-directory rollback and zero data wipe.",
                    },
                    {
                        term: "`PARQUET_PRIMARY` Cold Tier & `75% / 85% / 92%` Guardrails",
                        meaning: "30-minute PG staging splits into Zstd Parquet V2 files so 10 years of data stay sub-second searchable; pressure guardrails warn at 75%, trim non-held transient files at 85%, and protect ingestion at 92%.",
                    },
                ],
                commonPitfalls: [
                    "Never opt a live operational border portal into `Development (Pre-release)` unless specifically authorized for a pilot test — leave production sites on `Production (Stable — Latest)`.",
                    "Always run `oscar.sh host-check` (or watch `/health` warnings) ahead of TLS certificate renewal dates so browsers and federated nodes never hit expired certificates.",
                ],
                objectiveSummary: "Review System Update Release Channels (`stable` vs. `dev`), SHA-256 rollback upgrades, and `PARQUET_PRIMARY` 10-year archive commands in `/users?tab=update`.",
            },
            es: {
                chipLabel: "Actualización y 10 años",
                title: "Actualizaciones sin cuenta, canales de versión y ciclo de almacenamiento a 10 años",
                screenshotCaption: "Usuarios y acceso -> Actualización del sistema (/users?tab=update) con selector Producción (Estable) frente a Desarrollo (Prelanzamiento), SHA-256 y carga .zip sin conexión.",
                whyItMatters:
                    "OSCAR `4.0.0+` garantiza **actualizaciones continuas en el lugar para siempre**, incluso en cambios mayores de PostgreSQL. Aquí gestiona canales de versión y el ciclo de archivos `PARQUET_PRIMARY` a 10 años.",
                steps: [
                    "Abra Usuarios y acceso -> Actualización del sistema {{icon:users}} (`/users?tab=update`). Observe el selector **Canal de versión**: **Producción (Estable — Última)** es el predeterminado seguro, mientras **Desarrollo (Prelanzamiento — Opcional)** permite optar por compilaciones `4.0.0-dev.x` (`--channel dev`). Pulse `Buscar actualizaciones` sin cuenta ni token de GitHub.",
                    "Flujo seguro: OSCAR valida el resumen SHA-256 (o acepta un `.zip` sin conexión), instala en un directorio hermano limpio, migra versiones mayores de PostgreSQL automáticamente (`PGDATA=/var/lib/postgresql/<mayor>/docker`) y revierte automáticamente si falla la comprobación de salud.",
                    "Comprenda el nivel frío **`PARQUET_PRIMARY` a 10 años**: cada 30 min exporta particiones PostgreSQL a Parquet V2 Zstd (`RAW_TELEMETRY` + `RAW_EVENTS` compactados), con alertas de disco al `75% / 85% / 92%`, avisos de caducidad TLS en `/health` y auditoría con `oscar.sh archive status | verify | hold`.",
                ],
                keyTerms: [
                    {
                        term: "Canales (`Producción Estable` vs `Desarrollo Prelanzamiento`)",
                        meaning: "`Producción` sigue la versión estable oficial (`Latest`); `Desarrollo` es una opción voluntaria (`--channel dev`) para pruebas.",
                    },
                    {
                        term: "Actualización continua `4.0.0+`",
                        meaning: "Toda instalación `4.0.0+` se actualiza en el lugar indefinidamente con reversión automática y sin borrado.",
                    },
                    {
                        term: "`PARQUET_PRIMARY` y umbrales `75% / 85% / 92%`",
                        meaning: "Nivel frío Zstd Parquet V2 que mantiene búsquedas rápidas durante 10 años y protege el disco.",
                    },
                ],
                commonPitfalls: [
                    "Mantenga siempre los portales de producción en `Producción (Estable — Última)` salvo autorización expresa de piloto.",
                    "Supervise los avisos TLS en `/health` y ejecute `oscar.sh host-check` periódicamente.",
                ],
                objectiveSummary: "Revisar canales de actualización (`stable` vs `dev`), reversión SHA-256 y ciclo `PARQUET_PRIMARY` en `/users?tab=update`.",
            },
            fr: {
                chipLabel: "Mises à jour & 10 ans",
                title: "Mises à jour sans compte, canaux de version et cycle stockage 10 ans",
                screenshotCaption: "Utilisateurs et accès -> Mise à jour système (/users?tab=update) avec sélecteur Production (Stable) vs Développement (Préversion), SHA-256 et import .zip.",
                whyItMatters:
                    "OSCAR `4.0.0+` garantit des **mises à niveau continues sur place à vie**, y compris pour les versions majeures de PostgreSQL. Maîtrisez les canaux de version et le stockage `PARQUET_PRIMARY` sur 10 ans.",
                steps: [
                    "Ouvrez Utilisateurs et accès -> Mise à jour système {{icon:users}} (`/users?tab=update`). Repérez le sélecteur **Canal de version** : **Production (Stable — Dernière)** par défaut, ou **Développement (Préversion — Optionnel)** pour tester `4.0.0-dev.x` (`--channel dev`). Cliquez sur `Rechercher des mises à jour` sans compte GitHub.",
                    "Mise à niveau sûre : vérification SHA-256 (ou import `.zip` hors ligne), déploiement dans un répertoire frère propre, migration automatique des versions majeures PostgreSQL (`PGDATA=/var/lib/postgresql/<majeure>/docker`) et retour arrière automatique en cas d’échec.",
                    "Stockage **`PARQUET_PRIMARY` 10 ans** : toutes les 30 min, les partitions PostgreSQL sont exportées en Parquet V2 Zstd (`RAW_TELEMETRY` + `RAW_EVENTS` compactés) avec garde-fous disque `75% / 85% / 92%`, alertes d’expiration TLS dans `/health` et `oscar.sh archive status | verify | hold`.",
                ],
                keyTerms: [
                    {
                        term: "Canaux (`Production Stable` vs `Développement Préversion`)",
                        meaning: "`Production` suit la dernière version stable (`Latest`) ; `Développement` est une option explicite (`--channel dev`) pour les tests.",
                    },
                    {
                        term: "Mises à jour continues `4.0.0+`",
                        meaning: "Toute installation `4.0.0+` se met à niveau sur place durablement avec repli automatique.",
                    },
                    {
                        term: "`PARQUET_PRIMARY` & seuils `75% / 85% / 92%`",
                        meaning: "Niveau froid Parquet V2 Zstd assurant des recherches rapides sur 10 ans et la protection du disque.",
                    },
                ],
                commonPitfalls: [
                    "Laissez les sites opérationnels sur `Production (Stable — Dernière)` sauf essai pilote approuvé.",
                    "Surveillez les alertes d’expiration TLS dans `/health` et `oscar.sh host-check`.",
                ],
                objectiveSummary: "Vérifier les canaux de mise à jour (`stable` vs `dev`), le repli SHA-256 et le cycle `PARQUET_PRIMARY` dans `/users?tab=update`.",
            },
            el: {
                chipLabel: "Ενημερώσεις & 10ετία",
                title: "Ενημερώσεις χωρίς σύνδεση GitHub, κανάλια εκδόσεων & 10ετής κύκλος αποθήκευσης",
                screenshotCaption: "Χρήστες & Πρόσβαση -> Ενημέρωση συστήματος (/users?tab=update) με επιλογή Παραγωγής (Σταθερή) έναντι Ανάπτυξης (Προέκδοση), SHA-256 και .zip.",
                whyItMatters:
                    "Το OSCAR `4.0.0+` εγγυάται **συνεχείς επιτόπιες αναβαθμίσεις για πάντα**, ακόμη και σε κύριες εκδόσεις PostgreSQL. Εδώ διαχειρίζεστε κανάλια εκδόσεων και τον 10ετή κύκλο `PARQUET_PRIMARY`.",
                steps: [
                    "Ανοίξτε Χρήστες & Πρόσβαση -> Ενημέρωση συστήματος {{icon:users}} (`/users?tab=update`). Δείτε την επιλογή **Κανάλι εκδόσεων**: **Παραγωγή (Σταθερή — Τελευταία)** ως προεπιλογή ή **Ανάπτυξη (Προέκδοση — Προαιρετική)** (`--channel dev`). Πατήστε `Έλεγχος για ενημερώσεις` χωρίς λογαριασμό GitHub.",
                    "Ασφαλής αναβάθμιση: έλεγχος SHA-256 (ή μεταφόρτωση `.zip` εκτός δικτύου), εγκατάσταση σε καθαρό διπλανό φάκελο, αυτόματη μετάβαση κύριων εκδόσεων PostgreSQL (`PGDATA=/var/lib/postgresql/<major>/docker`) και αυτόματη επαναφορά σε σφάλμα.",
                    "Κατανοήστε το ψυχρό επίπεδο **`PARQUET_PRIMARY` 10ετίας**: κάθε 30 λεπτά οι παρτίδες PostgreSQL εξάγονται σε Zstd Parquet V2 με προστασία δίσκου `75% / 85% / 92%`, ειδοποιήσεις λήξης TLS στο `/health` και εντολές `oscar.sh archive status | verify | hold`.",
                ],
                keyTerms: [
                    {
                        term: "Κανάλια (`Παραγωγή Σταθερή` vs `Ανάπτυξη Προέκδοση`)",
                        meaning: "Η `Παραγωγή` ακολουθεί τη σταθερή `Latest`· η `Ανάπτυξη` είναι ρητή επιλογή δοκιμών (`--channel dev`).",
                    },
                    {
                        term: "Συνεχείς αναβαθμίσεις `4.0.0+`",
                        meaning: "Κάθε εγκατάσταση `4.0.0+` αναβαθμίζεται επιτόπου επ’ αόριστον με αυτόματη επαναφορά.",
                    },
                    {
                        term: "`PARQUET_PRIMARY` & όρια `75% / 85% / 92%`",
                        meaning: "Ψυχρό επίπεδο Zstd Parquet V2 που διατηρεί γρήγορες αναζητήσεις για 10+ έτη.",
                    },
                ],
                commonPitfalls: [
                    "Διατηρήστε τις επιχειρησιακές πύλες στην `Παραγωγή (Σταθερή — Τελευταία)` εκτός εγκεκριμένων δοκιμών.",
                    "Παρακολουθείτε τις ειδοποιήσεις λήξης πιστοποιητικών TLS στο `/health` και `oscar.sh host-check`.",
                ],
                objectiveSummary: "Έλεγχος καναλιών ενημέρωσης (`stable` vs `dev`), επαναφοράς SHA-256 και 10ετούς κύκλου `PARQUET_PRIMARY` στο `/users?tab=update`.",
            },
        },
        copySnippets: [
            { label: "Check Archive Status", labels: { es: "Estado del archivo", fr: "État des archives", el: "Κατάσταση αρχείου" }, value: "sudo bash oscar.sh archive status" },
            { label: "Switch CLI Channel (Dev)", labels: { es: "Canal CLI (Dev)", fr: "Canal CLI (Dev)", el: "Κανάλι CLI (Dev)" }, value: "sudo bash oscar.sh update channel dev" },
        ],
        spotlights: [
            {
                id: "users",
                selector: '[data-testid="nav-item-users"]',
                label: "Highlight Users & Access Icon",
                iconKey: "users",
            },
            {
                id: "health",
                selector: '[data-testid="nav-item-health"]',
                label: "Highlight Status of Health Icon",
                iconKey: "health",
            },
        ],
        spotlightSelector: '[data-testid="nav-item-users"]',
        spotlightLabel: "Highlight Users & Access Icon",
        objectiveSummary: "Review System Update Release Channels (`stable` vs. `dev`), SHA-256 rollback upgrades, and `PARQUET_PRIMARY` 10-year archive commands in `/users?tab=update`.",
        isAutoVerified: () => false,
    },
];
