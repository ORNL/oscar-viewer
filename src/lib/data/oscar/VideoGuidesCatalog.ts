import { Locale } from '@/app/contexts/LanguageContext';

export type VideoGuideTrackId = 'A' | 'B' | 'C';

export interface VideoGuideEntry {
    badge: string;
    slug: string;
    track: VideoGuideTrackId;
    durationLabel: string;
    sizeLabel: string;
    mp4Url: string;
    vttUrl: string;
    srtUrl: string;
    titles: Record<Locale, string>;
    summaries: Record<Locale, string>;
}

export interface VideoGuideUiStrings {
    contextualStripLabel: string;
    watchButtonLabel: (badge: string, durationLabel: string) => string;
    watchButtonAriaLabel: (visibleLabel: string, guideTitle: string, contextTitle?: string) => string;
    closeVideoLabel: string;
    captionsNote: string;
    localCatalogCardTitle: string;
    localCatalogCardDesc: string;
    openLocalCatalogButtonLabel: string;
    openGithubCatalogButtonLabel: string;
    inAppCatalogHeading: string;
    inAppCatalogHint: string;
    tracks: Record<VideoGuideTrackId, string>;
}

const makeGuide = (
    badge: string,
    slug: string,
    track: VideoGuideTrackId,
    durationLabel: string,
    sizeLabel: string,
    titles: Record<Locale, string>,
    summaries: Record<Locale, string>,
): VideoGuideEntry => ({
    badge,
    slug,
    track,
    durationLabel,
    sizeLabel,
    mp4Url: `/video-guides/videos/${slug}.mp4`,
    vttUrl: `/video-guides/captions/${slug}.vtt`,
    srtUrl: `/video-guides/captions/${slug}.srt`,
    titles,
    summaries,
});

export const VIDEO_GUIDES_CATALOG: readonly VideoGuideEntry[] = [
    makeGuide(
        '01',
        '01-deployment-init-and-credentials',
        'A',
        '11.2s',
        '201 KiB',
        {
            en: 'Initialize OSCAR Deployment, Admin Credentials & TLS',
            es: 'Inicializar despliegue de OSCAR, credenciales de administrador y TLS',
            fr: 'Initialiser le déploiement OSCAR, les identifiants administrateur et TLS',
            el: 'Αρχικοποίηση εγκατάστασης OSCAR, διαπιστευτηρίων διαχειριστή & TLS',
        },
        {
            en: 'Extract a clean release archive, initialize administrator credentials and TLS SAN certificates with oscar init, and verify healthy startup.',
            es: 'Extraiga un archivo de versión limpio, inicialice credenciales y certificados TLS SAN con oscar init y verifique el arranque saludable.',
            fr: 'Extrayez une archive propre, initialisez les identifiants administrateur et les certificats TLS SAN avec oscar init et vérifiez l’état sain.',
            el: 'Εξαγάγετε καθαρό αρχείο έκδοσης, αρχικοποιήστε διαπιστευτήρια και πιστοποιητικά TLS SAN με το oscar init και επιβεβαιώστε την υγιή εκκίνηση.',
        },
    ),
    makeGuide(
        '02',
        '02-clean-directory-upgrade',
        'A',
        '12.8s',
        '294 KiB',
        {
            en: 'Upgrade OSCAR in a Clean Release Directory',
            es: 'Actualizar OSCAR en un directorio de versión limpio',
            fr: 'Mettre à niveau OSCAR dans un répertoire de version propre',
            el: 'Αναβάθμιση του OSCAR σε καθαρό κατάλογο έκδοσης',
        },
        {
            en: 'Verify a pre-upgrade snapshot, copy only .env, secrets/, and tls/ into a newly extracted release folder, and run oscar upgrade.',
            es: 'Verifique una copia previa, copie únicamente .env, secrets/ y tls/ en una carpeta recién extraída y ejecute oscar upgrade.',
            fr: 'Vérifiez une sauvegarde préalable, copiez uniquement .env, secrets/ et tls/ dans un dossier neuf et exécutez oscar upgrade.',
            el: 'Επαληθεύστε αντίγραφο ασφαλείας, αντιγράψτε μόνο .env, secrets/ και tls/ σε νέο φάκελο έκδοσης και εκτελέστε oscar upgrade.',
        },
    ),
    makeGuide(
        '03',
        '03-archive-and-snapshot-backup',
        'A',
        '11.4s',
        '193 KiB',
        {
            en: 'Verify Parquet Cold-Tier Archives & Single-Snapshot Backup',
            es: 'Verificar archivos Parquet de nivel frío y copia de seguridad instantánea',
            fr: 'Vérifier les archives froides Parquet et la sauvegarde instantanée unique',
            el: 'Επαλήθευση ψυχρών αρχείων Parquet & αντιγράφου ασφαλείας στιγμιοτύπου',
        },
        {
            en: 'Inspect PARQUET_PRIMARY cold-tier generation status, verify SHA-256 parity receipts, and run a coordinated single-snapshot backup.',
            es: 'Inspeccione el estado de generaciones PARQUET_PRIMARY, valide recibos SHA-256 y ejecute una copia instantánea coordinada.',
            fr: 'Inspectez l’état des générations PARQUET_PRIMARY, vérifiez les reçus SHA-256 et exécutez une sauvegarde coordonnée.',
            el: 'Ελέγξτε την κατάσταση γενεών PARQUET_PRIMARY, επαληθεύστε αποδείξεις SHA-256 και εκτελέστε συντονισμένο αντίγραφο ασφαλείας.',
        },
    ),
    makeGuide(
        '04',
        '04-admin-oscar-service-and-custom-codes',
        'B',
        '12.3s',
        '693 KiB',
        {
            en: 'Configure OSCAR Service Retention & Custom Disposition Codes',
            es: 'Configurar retención del Servicio OSCAR y códigos personalizados',
            fr: 'Configurer la rétention du Service OSCAR et les codes personnalisés',
            el: 'Ρύθμιση διατήρησης Υπηρεσίας OSCAR & προσαρμοσμένων κωδικών διάθεσης',
        },
        {
            en: 'Open Services -> OSCAR Service in SensorHub Admin to review 5-JPEG media retention, storage-pressure thresholds, and custom disposition codes.',
            es: 'Abra Servicios -> Servicio OSCAR en SensorHub Admin para revisar la retención de 5 JPEG, umbrales de almacenamiento y códigos personalizados.',
            fr: 'Ouvrez Services -> Service OSCAR dans SensorHub Admin pour ajuster la rétention 5 JPEG, les seuils de stockage et les codes personnalisés.',
            el: 'Ανοίξτε Υπηρεσίες -> Υπηρεσία OSCAR στη διαχείριση SensorHub για έλεγχο διατήρησης 5 JPEG, ορίων δίσκου και προσαρμοσμένων κωδικών.',
        },
    ),
    makeGuide(
        '05',
        '05-admin-lane-spreadsheet-sync',
        'B',
        '10.6s',
        '419 KiB',
        {
            en: 'Sync Multi-Lane Spreadsheet Configuration (config.csv)',
            es: 'Sincronizar hoja de cálculo multicarril (config.csv)',
            fr: 'Synchroniser la feuille de calcul multivoie (config.csv)',
            el: 'Συγχρονισμός υπολογιστικού φύλλου πολλαπλών λωρίδων (config.csv)',
        },
        {
            en: 'Import or download config.csv in OSCAR Service to provision RPM endpoints, RTSP cameras, and OperationalViews assignments in bulk.',
            es: 'Importe o descargue config.csv en el Servicio OSCAR para aprovisionar RPM, cámaras RTSP y asignaciones OperationalViews de forma masiva.',
            fr: 'Importez ou téléchargez config.csv dans le Service OSCAR pour configurer en bloc les RPM, caméras RTSP et vues opérationnelles.',
            el: 'Εισαγάγετε ή λάβετε το config.csv στην Υπηρεσία OSCAR για μαζική ρύθμιση πυλών RPM, καμερών RTSP και αναθέσεων OperationalViews.',
        },
    ),
    makeGuide(
        '06',
        '06-admin-manual-lane-and-site-diagram',
        'B',
        '14.9s',
        '785 KiB',
        {
            en: 'Configure a Lane System & Georeferenced Site Diagram',
            es: 'Configurar un sistema de carril y plano georreferenciado del sitio',
            fr: 'Configurer un système de voie et un plan du site géoréférencé',
            el: 'Ρύθμιση συστήματος λωρίδας & γεωαναφερθέντος διαγράμματος εγκατάστασης',
        },
        {
            en: 'Inspect Lane System coordinates, Extended Occupancy Threshold, and camera/RPM options, then upload a georeferenced Site Diagram.',
            es: 'Revise coordenadas del carril, umbral de ocupación prolongada y opciones de cámara/RPM, y cargue un plano georreferenciado del sitio.',
            fr: 'Inspectez les coordonnées de voie, le seuil d’occupation prolongée et les options caméra/RPM, puis chargez un plan du site géoréférencé.',
            el: 'Ελέγξτε συντεταγμένες λωρίδας, όριο παρατεταμένης διέλευσης και ρυθμίσεις κάμερας/RPM και μεταφορτώστε γεωαναφερθέν διάγραμμα.',
        },
    ),
    makeGuide(
        '07',
        '07-admin-eml-plugin-setup',
        'B',
        '11.8s',
        '818 KiB',
        {
            en: 'Upload External EML VM-250 Plugin & Enable Per-Lane EML',
            es: 'Cargar complemento externo EML VM-250 y activar EML por carril',
            fr: 'Charger le module externe EML VM-250 et activer l’EML par voie',
            el: 'Μεταφόρτωση εξωτερικού προσθέτου EML VM-250 & ενεργοποίηση EML ανά λωρίδα',
        },
        {
            en: 'Upload a licensed Enhanced Machine Learning (EML) VM-250 .jar plugin in OSCAR Service and enable per-lane EML for Code 9999 auto-adjudication.',
            es: 'Cargue el complemento .jar con licencia de Aprendizaje Automático Mejorado (EML) VM-250 y habilite EML por carril para Código 9999.',
            fr: 'Chargez le module .jar sous licence d’Apprentissage Automatique Amélioré (EML) VM-250 et activez l’EML par voie pour le Code 9999.',
            el: 'Μεταφορτώστε το αδειοδοτημένο πρόσθετο .jar Ενισχυμένης Μηχανικής Μάθησης (EML) VM-250 και ενεργοποιήστε το EML ανά λωρίδα (Κωδικός 9999).',
        },
    ),
    makeGuide(
        '08',
        '08-viewer-signin-language-and-nodes',
        'C',
        '16.9s',
        '3.0 MiB',
        {
            en: 'Sign In to OSCAR Viewer, Switch Language & Manage Nodes',
            es: 'Iniciar sesión en OSCAR Viewer, cambiar idioma y gestionar nodos',
            fr: 'Se connecter à OSCAR Viewer, changer la langue et gérer les nœuds',
            el: 'Σύνδεση στο OSCAR Viewer, αλλαγή γλώσσας & διαχείριση κόμβων',
        },
        {
            en: 'Authenticate at the TLS gateway, switch localization live across 4 languages, open the Operator Quick Guide (?), and manage federated nodes.',
            es: 'Autentíquese en la pasarela TLS, cambie el idioma en vivo entre 4 idiomas, abra la guía rápida (?) y gestione nodos federados.',
            fr: 'Authentifiez-vous sur la passerelle TLS, changez la langue en direct parmi 4 langues, ouvrez le guide (?) et gérez les nœuds fédérés.',
            el: 'Συνδεθείτε στην πύλη TLS, αλλάξτε ζωντανά μεταξύ 4 γλωσσών, ανοίξτε τον οδηγό χειριστή (?) και διαχειριστείτε ομόσπονδους κόμβους.',
        },
    ),
    makeGuide(
        '09',
        '09-dashboard-monitoring-and-quick-adjudication',
        'C',
        '12.9s',
        '940 KiB',
        {
            en: 'Monitor Live 50-Lane Dashboard & Inspect Alarm Rows',
            es: 'Supervisar el panel en vivo de 50 carriles e inspeccionar alarmas',
            fr: 'Surveiller le tableau de bord 50 voies en direct et inspecter les alarmes',
            el: 'Παρακολούθηση ζωντανού πίνακα 50 λωρίδων & επιθεώρηση συναγερμών',
        },
        {
            en: 'Monitor real-time lane tiles and unread alarm occupancy rows on the Dashboard, customize panels, and launch rapid alarm review.',
            es: 'Supervise mosaicos de carriles y alarmas no leídas en tiempo real en el Panel, personalice vistas e inicie la revisión rápida.',
            fr: 'Surveillez les tuiles de voies et les alarmes non lues en direct sur le Tableau de bord, personnalisez l’affichage et lancez l’examen rapide.',
            el: 'Παρακολουθήστε ζωντανά τις κάρτες λωρίδων και τους μη αναγνωσμένους συναγερμούς στον Πίνακα ελέγχου και ξεκινήστε ταχεία αξιολόγηση.',
        },
    ),
    makeGuide(
        '10',
        '10-operational-views-scoping',
        'C',
        '11.4s',
        '662 KiB',
        {
            en: 'Scope Workstation Lanes with Fail-Closed Operational Views',
            es: 'Delimitar carriles por estación mediante Vistas Operativas seguras',
            fr: 'Restreindre les voies d’un poste avec les Vues Opérationnelles sécurisées',
            el: 'Περιορισμός λωρίδων σταθμού εργασίας με ασφαλείς Λειτουργικές Προβολές',
        },
        {
            en: 'Apply ?view=<key> workstation URLs to restrict Dashboard, Events, Status of Health, and Reports to assigned portal lanes.',
            es: 'Aplique direcciones ?view=<clave> para limitar Panel, Eventos, Estado de salud e Informes a los carriles asignados.',
            fr: 'Appliquez les URL ?view=<clé> pour restreindre Tableau de bord, Événements, État de santé et Rapports aux voies assignées.',
            el: 'Χρησιμοποιήστε διευθύνσεις ?view=<κλειδί> για περιορισμό του Πίνακα, των Συμβάντων, της Υγείας και των Αναφορών στις ανατεθειμένες λωρίδες.',
        },
    ),
    makeGuide(
        '11',
        '11-live-lane-video-and-charts',
        'C',
        '12.0s',
        '2.4 MiB',
        {
            en: 'Inspect Live Lane Camera Stream & Gamma/Neutron Waveforms',
            es: 'Inspeccionar vídeo en vivo del carril y curvas gamma/neutrones',
            fr: 'Inspecter le flux caméra en direct et les courbes gamma/neutrons',
            el: 'Επιθεώρηση ζωντανού βίντεο λωρίδας & καμπυλών γάμμα/νετρονίων',
        },
        {
            en: 'Open Live Lane View from a lane tile to monitor low-latency camera video alongside synchronized gamma and neutron count-rate traces.',
            es: 'Abra la vista en vivo desde un carril para ver vídeo de baja latencia junto a trazas sincronizadas de conteo gamma y de neutrones.',
            fr: 'Ouvrez la vue en direct d’une voie pour suivre la vidéo caméra à faible latence avec les courbes synchronisées gamma et neutrons.',
            el: 'Ανοίξτε τη ζωντανή προβολή λωρίδας για παρακολούθηση βίντεο χαμηλής καθυστέρησης μαζί με συγχρονισμένες καμπύλες γάμμα και νετρονίων.',
        },
    ),
    makeGuide(
        '12',
        '12-event-log-filtering-and-adjudication-codes',
        'C',
        '18.9s',
        '2.4 MiB',
        {
            en: 'Filter Event Log by Vehicle ID, Adjudication Code & Event UUID',
            es: 'Filtrar el registro de eventos por vehículo, código de adjudicación y UUID',
            fr: 'Filtrer le journal des événements par véhicule, code d’adjudication et UUID',
            el: 'Φιλτράρισμα ιστορικού συμβάντων ανά όχημα, κωδικό αξιολόγησης & UUID',
        },
        {
            en: 'Search historical occupancies by Vehicle / ISO 6346 Container ID, Event UUID, time window, and Adjudication Code (including 9998 & 9999).',
            es: 'Busque ocupaciones históricas por ID de vehículo / contenedor ISO 6346, UUID, ventana temporal y Código de adjudicación (9998 y 9999).',
            fr: 'Recherchez l’historique par ID de véhicule / conteneur ISO 6346, UUID, plage horaire et Code d’adjudication (dont 9998 et 9999).',
            el: 'Αναζητήστε διελεύσεις ανά ID οχήματος / εμπορευματοκιβωτίου ISO 6346, UUID, χρονικό παράθυρο και Κωδικό αξιολόγησης (9998 & 9999).',
        },
    ),
    makeGuide(
        '13',
        '13-event-details-adjudication-and-daily-file',
        'C',
        '19.4s',
        '1.2 MiB',
        {
            en: 'Review Retained 5-Frame Media, Daily File Output & Adjudicate',
            es: 'Revisar los 5 fotogramas retenidos, el archivo diario y adjudicar',
            fr: 'Examiner les 5 images conservées, le fichier quotidien et adjuger',
            el: 'Έλεγχος διατηρούμενων 5 καρέ, ημερήσιου αρχείου & υποβολή αξιολόγησης',
        },
        {
            en: 'Inspect retained 5-frame JPEG evidence, radiation profiles, spectroscopic spectra, and raw RPM Daily File records, then submit an adjudication.',
            es: 'Inspeccione los 5 fotogramas JPEG retenidos, perfiles de radiación, espectros y registros del archivo diario RPM antes de adjudicar.',
            fr: 'Inspectez les 5 images JPEG conservées, les profils radiologiques, les spectres et le fichier quotidien RPM, puis soumettez l’adjudication.',
            el: 'Επιθεωρήστε τα 5 διατηρούμενα καρέ JPEG, τις καμπύλες ακτινοβολίας, τα φάσματα και το ημερήσιο αρχείο RPM και υποβάλετε αξιολόγηση.',
        },
    ),
    makeGuide(
        '14',
        '14-airgapped-alarm-qr-transfer',
        'C',
        '25.2s',
        '1.7 MiB',
        {
            en: 'Export Signed Alarm QR & Verify Offline on Air-Gapped Transfer',
            es: 'Exportar código QR firmado y verificar alarmas sin conexión',
            fr: 'Exporter un QR d’alarme signé et le vérifier hors ligne',
            el: 'Εξαγωγή υπογεγραμμένου QR συναγερμού & επαλήθευση εκτός δικτύου',
        },
        {
            en: 'Export a compact alarm QR code or .oscar-alarm.json bundle and verify its cryptographic integrity and count curves on an air-gapped workstation.',
            es: 'Exporte un código QR compacto o paquete .oscar-alarm.json y verifique su integridad y curvas de conteo en una estación sin conexión.',
            fr: 'Exportez un code QR compact ou fichier .oscar-alarm.json et vérifiez son intégrité et ses courbes sur un poste isolé hors réseau.',
            el: 'Εξαγάγετε κωδικό QR ή αρχείο .oscar-alarm.json και επαληθεύστε την ακεραιότητα και τις καμπύλες μετρήσεων σε απομονωμένο σταθμό.',
        },
    ),
    makeGuide(
        '15',
        '15-status-of-health-and-site-map',
        'C',
        '10.2s',
        '1.3 MiB',
        {
            en: 'Monitor RPM/Camera Status of Health & Georeferenced Site Map',
            es: 'Supervisar el Estado de salud de RPM/cámaras y el Mapa del sitio',
            fr: 'Surveiller l’État de santé RPM/caméras et la Carte du site',
            el: 'Παρακολούθηση Κατάστασης υγείας RPM/καμερών & Χάρτη εγκατάστασης',
        },
        {
            en: 'Check live RPM and camera connectivity, Gamma/Neutron/Tamper/Extended Occupancy fault indicators, and georeferenced lane markers.',
            es: 'Compruebe la conectividad en vivo de RPM y cámaras, indicadores de fallos/manipulación y marcadores de carril en el mapa del sitio.',
            fr: 'Vérifiez la connectivité en direct des RPM et caméras, les indicateurs de défaut/sabotage et les marqueurs sur la carte géoréférencée.',
            el: 'Ελέγξτε τη ζωντανή σύνδεση πυλών RPM και καμερών, τις ενδείξεις βλαβών/παραβίασης και τους δείκτες λωρίδων στον χάρτη.',
        },
    ),
    makeGuide(
        '16',
        '16-national-statistics-and-reports',
        'C',
        '19.6s',
        '658 KiB',
        {
            en: 'Analyze National View Statistics & Generate Multi-Format Reports',
            es: 'Analizar estadísticas nacionales y generar informes multiformato',
            fr: 'Analyser les statistiques nationales et générer des rapports multiformats',
            el: 'Ανάλυση εθνικών στατιστικών & δημιουργία αναφορών πολλαπλών μορφών',
        },
        {
            en: 'Compare multi-node statistics in National View and generate PDF, CSV, JSON, and Excel (.xlsx) operational and adjudication reports.',
            es: 'Compare estadísticas multinodo en Vista Nacional y genere informes operativos y de adjudicación en PDF, CSV, JSON y Excel (.xlsx).',
            fr: 'Comparez les statistiques multi-nœuds dans la Vue Nationale et générez des rapports en PDF, CSV, JSON et Excel (.xlsx).',
            el: 'Συγκρίνετε στατιστικά πολλαπλών κόμβων στην Εθνική προβολή και δημιουργήστε αναφορές PDF, CSV, JSON και Excel (.xlsx).',
        },
    ),
    makeGuide(
        '17',
        '17-vehicle-ocr-and-adjudication',
        'C',
        '32.4s',
        '2.8 MiB',
        {
            en: 'Configure Vehicle OCR, Compare Multi-Pass Transits & Adjudicate',
            es: 'Configurar OCR de vehículos, comparar múltiples pasadas y adjudicar',
            fr: 'Configurer l’OCR véhicules, comparer les passages multiples et adjuger',
            el: 'Ρύθμιση OCR οχημάτων, σύγκριση πολλαπλών διελεύσεων & αξιολόγηση',
        },
        {
            en: 'Enable per-lane container/plate OCR, review crop thumbnails and Vehicle ID auto-fill, compare multi-pass transits, and generate Vehicle Incident Reports.',
            es: 'Active el OCR de contenedores y matrículas, revise recortes y autocompletado, compare múltiples pasadas y genere informes de incidente.',
            fr: 'Activez l’OCR conteneurs/plaques, inspectez les vignettes et le préremplissage, comparez les passages multiples et générez le rapport d’incident.',
            el: 'Ενεργοποιήστε το OCR εμπορευματοκιβωτίων/πινακίδων, ελέγξτε τις μικρογραφίες, συγκρίνετε πολλαπλές διελεύσεις και εξαγάγετε αναφορά συμβάντος οχήματος.',
        },
    ),
    makeGuide(
        '18',
        '18-operator-help-and-support-bundle',
        'C',
        '10.9s',
        '2.0 MiB',
        {
            en: 'Use Operator Quick Guide (?) & Export Redacted Support Bundle',
            es: 'Usar la Guía rápida (?) y exportar paquete de soporte redactado',
            fr: 'Utiliser le Guide rapide (?) et exporter l’archive d’assistance masquée',
            el: 'Χρήση Γρήγορου οδηγού (?) & εξαγωγή πακέτου υποστήριξης με απόκρυψη μυστικών',
        },
        {
            en: 'Open the localized Operator Quick Guide & Glossary (?) and download a secret-redacted client + server diagnostic .zip bundle.',
            es: 'Abra la Guía rápida y glosario (?) localizada y descargue un archivo .zip de diagnóstico con secretos redactados.',
            fr: 'Ouvrez le Guide rapide et glossaire (?) traduit et téléchargez une archive .zip de diagnostic avec masquage des secrets.',
            el: 'Ανοίξτε τον μεταφρασμένο Γρήγορο οδηγό (?) και λάβετε διαγνωστικό αρχείο .zip πελάτη + διακομιστή με αυτόματη απόκρυψη μυστικών.',
        },
    ),
];

const GUIDE_BY_SLUG = new Map<string, VideoGuideEntry>(
    VIDEO_GUIDES_CATALOG.map((guide) => [guide.slug, guide]),
);

export function getVideoGuideBySlug(slug: string): VideoGuideEntry | undefined {
    return GUIDE_BY_SLUG.get(slug);
}

export function resolveVideoGuidesBySlugs(slugs: readonly string[]): VideoGuideEntry[] {
    const resolved: VideoGuideEntry[] = [];
    for (const slug of slugs) {
        const entry = GUIDE_BY_SLUG.get(slug);
        if (entry) resolved.push(entry);
    }
    return resolved;
}

const ROUTE_VIDEO_GUIDE_SLUGS: Record<string, readonly string[]> = {
    '/': ['09-dashboard-monitoring-and-quick-adjudication', '10-operational-views-scoping'],
    '/quick-view': ['09-dashboard-monitoring-and-quick-adjudication', '10-operational-views-scoping'],
    '/lane-view': ['11-live-lane-video-and-charts'],
    '/event-log': ['12-event-log-filtering-and-adjudication-codes', '17-vehicle-ocr-and-adjudication'],
    '/event-details': ['13-event-details-adjudication-and-daily-file', '17-vehicle-ocr-and-adjudication'],
    '/event-preview': ['13-event-details-adjudication-and-daily-file', '17-vehicle-ocr-and-adjudication'],
    '/alarm-transfer': ['14-airgapped-alarm-qr-transfer'],
    '/health': ['15-status-of-health-and-site-map'],
    '/map': ['15-status-of-health-and-site-map', '06-admin-manual-lane-and-site-diagram'],
    '/national-view': ['16-national-statistics-and-reports'],
    '/report': ['16-national-statistics-and-reports', '17-vehicle-ocr-and-adjudication'],
    '/servers': ['08-viewer-signin-language-and-nodes'],
};

export function normalizeConsolePathname(pathname?: string | null): string {
    if (!pathname) return '/';
    const withoutQuery = pathname.split('?')[0]?.split('#')[0] ?? '/';
    const trimmed = withoutQuery.replace(/\/+$/, '');
    return trimmed.length > 0 ? trimmed : '/';
}

export function getContextualVideoGuidesForPath(pathname?: string | null): VideoGuideEntry[] {
    const normalized = normalizeConsolePathname(pathname);
    const slugs = ROUTE_VIDEO_GUIDE_SLUGS[normalized] ?? ['18-operator-help-and-support-bundle'];
    return resolveVideoGuidesBySlugs(slugs);
}

export const CONSOLE_PAGE_CARD_GUIDE_SLUGS: readonly (readonly string[])[] = [
    ['09-dashboard-monitoring-and-quick-adjudication', '10-operational-views-scoping', '11-live-lane-video-and-charts'],
    ['12-event-log-filtering-and-adjudication-codes', '13-event-details-adjudication-and-daily-file', '17-vehicle-ocr-and-adjudication'],
    ['15-status-of-health-and-site-map'],
    ['15-status-of-health-and-site-map', '06-admin-manual-lane-and-site-diagram'],
    ['16-national-statistics-and-reports'],
    ['16-national-statistics-and-reports'],
    ['14-airgapped-alarm-qr-transfer'],
    ['08-viewer-signin-language-and-nodes'],
];

export const REPORT_CARD_GUIDE_SLUGS: readonly (readonly string[])[] = [
    ['16-national-statistics-and-reports'],
    ['16-national-statistics-and-reports'],
    ['16-national-statistics-and-reports'],
    ['16-national-statistics-and-reports'],
    ['16-national-statistics-and-reports'],
    ['17-vehicle-ocr-and-adjudication', '16-national-statistics-and-reports'],
];

export const GLOSSARY_INDEX_GUIDE_SLUGS: Readonly<Record<number, readonly string[]>> = {
    4: ['07-admin-eml-plugin-setup'],
    7: ['13-event-details-adjudication-and-daily-file'],
    9: ['10-operational-views-scoping'],
    10: ['13-event-details-adjudication-and-daily-file'],
    11: ['03-archive-and-snapshot-backup'],
    12: ['17-vehicle-ocr-and-adjudication'],
};

export const VIDEO_GUIDE_UI_STRINGS: Record<Locale, VideoGuideUiStrings> = {
    en: {
        contextualStripLabel: 'Video guides for this page:',
        watchButtonLabel: (badge, durationLabel) => `Watch #${badge} (${durationLabel})`,
        watchButtonAriaLabel: (visibleLabel, guideTitle, contextTitle) =>
            contextTitle ? `${visibleLabel} — ${guideTitle} (${contextTitle})` : `${visibleLabel} — ${guideTitle}`,
        closeVideoLabel: 'Close video',
        captionsNote: '1080p H.264 · synchronized English closed captions (.vtt) included; zero data loaded until played.',
        localCatalogCardTitle: 'Built-In How-To Video Guides (`/video-guides/index.html`)',
        localCatalogCardDesc: '18 compressed 1080p workflow screen recordings (< 2 min each, ~22.5 MiB total) bundled directly inside OSCAR for offline and air-gapped workstations, with synchronized closed captions.',
        openLocalCatalogButtonLabel: 'Open Local Video Guide Page',
        openGithubCatalogButtonLabel: 'ORNL/oscar-video-guides (GitHub)',
        inAppCatalogHeading: 'Browse & Play All 18 Workflow Video Guides Inline',
        inAppCatalogHint: 'Expand a track below and select any workflow to play it directly inside this dialog.',
        tracks: {
            A: 'Track A — CLI Deployment, Upgrades & Storage Lifecycle (01–03)',
            B: 'Track B — SensorHub Admin Configuration (04–07)',
            C: 'Track C — OSCAR Viewer Console Operations (08–18)',
        },
    },
    es: {
        contextualStripLabel: 'Videoguías para esta página:',
        watchButtonLabel: (badge, durationLabel) => `Ver #${badge} (${durationLabel})`,
        watchButtonAriaLabel: (visibleLabel, guideTitle, contextTitle) =>
            contextTitle ? `${visibleLabel} — ${guideTitle} (${contextTitle})` : `${visibleLabel} — ${guideTitle}`,
        closeVideoLabel: 'Cerrar vídeo',
        captionsNote: '1080p H.264 · incluye subtítulos sincronizados (.vtt en inglés); no descarga datos hasta reproducir.',
        localCatalogCardTitle: 'Videoguías prácticas integradas (`/video-guides/index.html`)',
        localCatalogCardDesc: '18 grabaciones cortas en 1080p (< 2 min cada una, ~22,5 MiB en total) integradas localmente en OSCAR para estaciones sin conexión o aisladas, con subtítulos sincronizados.',
        openLocalCatalogButtonLabel: 'Abrir catálogo local de videoguías',
        openGithubCatalogButtonLabel: 'ORNL/oscar-video-guides (GitHub)',
        inAppCatalogHeading: 'Explorar y reproducir las 18 videoguías aquí mismo',
        inAppCatalogHint: 'Despliegue una sección y pulse cualquier guía para reproducirla directamente en este cuadro de diálogo.',
        tracks: {
            A: 'Bloque A — Despliegue CLI, actualizaciones y ciclo de almacenamiento (01–03)',
            B: 'Bloque B — Configuración en SensorHub Admin (04–07)',
            C: 'Bloque C — Operaciones de consola en OSCAR Viewer (08–18)',
        },
    },
    fr: {
        contextualStripLabel: 'Guides vidéo pour cette page :',
        watchButtonLabel: (badge, durationLabel) => `Voir #${badge} (${durationLabel})`,
        watchButtonAriaLabel: (visibleLabel, guideTitle, contextTitle) =>
            contextTitle ? `${visibleLabel} — ${guideTitle} (${contextTitle})` : `${visibleLabel} — ${guideTitle}`,
        closeVideoLabel: 'Fermer la vidéo',
        captionsNote: '1080p H.264 · sous-titres synchronisés (.vtt en anglais) inclus ; aucune donnée chargée avant lecture.',
        localCatalogCardTitle: 'Guides vidéo pratiques intégrés (`/video-guides/index.html`)',
        localCatalogCardDesc: '18 courtes captures 1080p (< 2 min chacune, ~22,5 Mio au total) embarquées localement dans OSCAR pour les postes hors ligne ou isolés, avec sous-titres synchronisés.',
        openLocalCatalogButtonLabel: 'Ouvrir la page locale des guides vidéo',
        openGithubCatalogButtonLabel: 'ORNL/oscar-video-guides (GitHub)',
        inAppCatalogHeading: 'Parcourir et lire les 18 guides vidéo intégrés',
        inAppCatalogHint: 'Dépliez une catégorie ci-dessous et sélectionnez un guide pour le lire directement dans cette fenêtre.',
        tracks: {
            A: 'Volet A — Déploiement CLI, mises à niveau et cycle de stockage (01–03)',
            B: 'Volet B — Configuration dans SensorHub Admin (04–07)',
            C: 'Volet C — Opérations de console dans OSCAR Viewer (08–18)',
        },
    },
    el: {
        contextualStripLabel: 'Βιντεοοδηγοί για αυτή τη σελίδα:',
        watchButtonLabel: (badge, durationLabel) => `Προβολή #${badge} (${durationLabel})`,
        watchButtonAriaLabel: (visibleLabel, guideTitle, contextTitle) =>
            contextTitle ? `${visibleLabel} — ${guideTitle} (${contextTitle})` : `${visibleLabel} — ${guideTitle}`,
        closeVideoLabel: 'Κλείσιμο βίντεο',
        captionsNote: '1080p H.264 · περιλαμβάνει συγχρονισμένους υπότιτλους (.vtt στα αγγλικά)· μηδενική φόρτωση δεδομένων πριν την αναπαραγωγή.',
        localCatalogCardTitle: 'Ενσωματωμένοι βιντεοοδηγοί εργασιών (`/video-guides/index.html`)',
        localCatalogCardDesc: '18 συμπιεσμένα βίντεο 1080p (< 2 λεπ. έκαστο, ~22,5 MiB συνολικά) ενσωματωμένα τοπικά στο OSCAR για σταθμούς εκτός δικτύου, με συγχρονισμένους υπότιτλους.',
        openLocalCatalogButtonLabel: 'Άνοιγμα τοπικής σελίδας βιντεοοδηγών',
        openGithubCatalogButtonLabel: 'ORNL/oscar-video-guides (GitHub)',
        inAppCatalogHeading: 'Περιήγηση & αναπαραγωγή και των 18 βιντεοοδηγών εντός παραθύρου',
        inAppCatalogHint: 'Αναπτύξτε μια ενότητα παρακάτω και επιλέξτε οποιονδήποτε οδηγό για άμεση αναπαραγωγή.',
        tracks: {
            A: 'Ενότητα A — Εγκατάσταση CLI, αναβαθμίσεις & κύκλος αποθήκευσης (01–03)',
            B: 'Ενότητα B — Διαμόρφωση στο SensorHub Admin (04–07)',
            C: 'Ενότητα C — Λειτουργίες κονσόλας στο OSCAR Viewer (08–18)',
        },
    },
};
