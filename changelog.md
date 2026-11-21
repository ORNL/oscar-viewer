# OSCAR Viewer Change Log
All notable changes to this project will be documented in this file. 

## 3.11.3

### Added

- Added the **Hands-On Training Sandbox & Guided Academy (`oscar-sandbox`)** console experience (`TrainingSandboxApi.ts`, `TrainingCurriculum.ts`, `TrainingCoachDock.tsx`, `TrainingCoachDock.css`, `TrainingSandboxLauncherCard.tsx`, `Navbar.tsx`, `HelpDialog.tsx`, `AlarmQrTransfer.ts`, `VideoGuidesCatalog.ts` across `en`, `es`, `fr`, `el`): remains 100% inert on operational deployments (`0` extra banners, `0` background polling, and `0` screen clutter when `sandboxMode === false`), exposes cross-platform CLI commands and an optional Administrator 1-click host launcher inside **Help (`?`)**, renders a single-row high-contrast **`TRAINING SANDBOX`** top indicator and collapsible multi-modal **Training Coach** inside the isolated `:8444` sandbox (`Watch · Read · Do · Auto-Verify` across 12 Operator, Supervisor, and Split-Pane SensorHub Admin labs with offline 1080p `.mp4`/`.vtt` videos, `1920×1080` manual screenshots, 1-click practice fault/alarm/NORM/Extended Occupancy injection, downloadable `.csv`/`.n42`/`.uff`/`.pmtiles`/`.json` practice files, `[data-testid]` spotlight highlighting, live API outcome auto-verification, `TRAINING SANDBOX — NON-OPERATIONAL` QR/report watermarks, and 1-page vector PDF Completion Records), and bundles how-to video guide `#28` (`28-hands-on-training-sandbox`).

### Changed

- Updated operator help titles, support-bundle fallback metadata, and hardware-replacement recovery checklist references to `OSCAR 3.11.3` (`oscar-3.11.3.zip`).

## 3.11.2

### Added

- Added optional **Cargo Non-Intrusive Inspection (WCO `UFF 2.0` & `UFF 3.0.0`)** integration (`CargoUffApi.ts`, `Tiff16Decoder.ts`, `UffClientArchive.ts`, `CargoUffViewerDialog.tsx`, `CargoUffSmbPickerDialog.tsx`, `RuntimeExtensionsManager.tsx`, `AdjudicationDetail.tsx`, `AdjudicationLog.tsx`, `EventTable.tsx`, `VehiclePassComparisonDialog.tsx`, `HelpDialog.tsx`, `VideoGuidesCatalog.ts` across `745` locale keys in `en`, `es`, `fr`, `el`): ships disabled by default (`0` extra UI controls, `0` background threads, and `0` network requests when disabled), supports direct browser `.uff` file uploads (`up to 200 MB`) with automatic embedded `.n42` WebID extraction, provides a read-only SMBv2/SMBv3 share connector tab in **Runtime Extensions (`/extensions`)**, enables scanner/time-window browsing, 1-character fuzzy OCR container/plate correlation (`OCR ±1`), Tier-1 UFF UUID / `.uff` filename / UNC share-path lookup in **Events (`/event-log`)**, zero-dependency 16-bit `uint16` grayscale TIFF (`WebGL2` `R16UI` + `Uint32Array[65536]` LUT fallback) and palettized **HEMD** atomic-number (`Z_eff`) inspection aligned with the RPM gamma/neutron count profile, zero-download NAS adjudication linking (`.uffref.json`), and bundled how-to video guide `#27` (`27-cargo-uff-smb-and-xray-inspection`).

### Changed

- Updated operator help titles, support-bundle fallback metadata, and hardware-replacement recovery checklist references to `OSCAR 3.11.2` (`oscar-3.11.2.zip`).

## 3.11.1

### Changed

- Updated operator help titles, support-bundle fallback metadata, and hardware-replacement recovery checklist references to `OSCAR 3.11.1` (`oscar-3.11.1.zip`) in alignment with the `3.11.1 (Amber)` security and bare-metal provisioning release.

## 3.11.0

### Added

- Event Details now queries the authenticated event-scoped retained-media API by occupancy UUID and displays exactly five labeled JPEG evidence frames per camera with source ordinals and video timestamps.
- Added keyboard-accessible per-camera galleries, isolated missing/corrupt-frame handling, localized loading and error feedback, and focused API/fallback/rendering regression tests.
- Added strict catalog-transfer, per-frame, and event-wide byte, dimension, and decoded-pixel budgets. Response bodies are stopped at their streaming limits even when `Content-Length` is absent or incorrect.
- Added **EML Non-Threat** automated adjudication support across the Viewer (`en`, `es`, `fr`, `el`): non-threat EML occupancies (`eml-non-threat` / disposition code `9999`) are suppressed from Dashboard alarm notifications, queryable in the Event Log (`Adjudicated = EML Non-Threat`), and rendered in Event Details with an **EML Automated Analysis** summary card (verdict, release/investigate probabilities, model, collimation, lane width, fallback state, and per-source scores) plus formatted `EML_METADATA` feedback in the Adjudication Log.
- Added site-shared per-lane Dashboard alarm read/unread state (`/sensorhub/buckets/adjudication/dashboard-read-state`), watermark-scoped unread alarm banner counts (`100+` cap), synchronized **Unread only** toggle, quick temporal window presets (`15m`, `1h`, `24h`, `15d`), and optional latching alarm audio (`en`, `es`, `fr`, `el`).
- Added a bounded browser diagnostic flight recorder (`SupportDiagnostics.ts`), contextual route-aware click-to-play inline workflow video playback (`VideoGuidesCatalog.ts`, `/video-guides/videos/*.mp4` with synchronized `.vtt` closed captions and zero idle preload overhead), and 1-click **Export Support Bundle** action in **Help (`?`)** (`HelpDialog.tsx`, `en`, `es`, `fr`, `el`, bundling all 26 captioned 1080p how-to video guides locally for offline/air-gapped workstations) that merges redacted client diagnostics with `/sensorhub/buckets/reports/support-bundle` into `oscar-support-<UTC>.zip` (or downloads `oscar-client-support-<UTC>.zip` with CLI fallback guidance when the backend is unreachable).
- Added optional per-lane **Container & License Plate OCR** auto-fill and suggestion chips (`VehicleIdOcr.tsx`, `VehicleOcr.ts`, `Iso6346.ts`, `useVehicleOcrMap.ts`, `en`, `es`, `fr`, `el`): on lanes with `ocrConfig.enabled = true`, **Vehicle ID** in Dashboard Quick Adjudication (`EventPreview.tsx`) and Event Details (`AdjudicationDetail.tsx`) automatically fills ISO 6346 checksum-valid container codes or high-confidence (`>= 85%`) license plates unless edited by the operator, renders clickable suggestion chips with authenticated JPEG evidence crop previews (`/sensorhub/buckets/ocr/crops/<YYYY-MM-DD>/`, retained alongside `frame-03.jpg` with `ocrCropRetentionDays = 365` and held/adjudicated protection while `vehicleOcr` observations tier to `PARQUET_PRIMARY`), and exposes an optional hidden-by-default **Vehicle ID** column in `EventTable.tsx` (`0` extra network queries or MQTT leases when disabled/hidden).
- Added normalized **Vehicle ID Search, Multi-Occupancy Pass Comparison, Linked/Batch Adjudication, and Consolidated Vehicle Incident Reporting (`VEHICLE_INCIDENT`)** across single-node and federated multi-node deployments (`VehicleSearch.ts`, `VehiclePassComparisonDialog.tsx`, `EventTable.tsx`, `AdjudicationDetail.tsx`, `Report.tsx`, `en`, `es`, `fr`, `el` across `737` locale keys): exposes a semantic `<search>` bar and nested `vehicleId` filter on **Events** (`/event-log`), automatically surfaces a **Related Vehicle Passes** correlation banner in **Event Details** when multiple confirmation re-scans or gross-counting -> RS350 spectroscopic secondary transits match the normalized Vehicle ID, aligns chronological passes with visual continuity keyframes/OCR crops and fast `profileOnlyObsIds` on-demand overlaid gamma/neutron radiation profile charts, supports cross-node **Linked Adjudication** (with 1-click spectroscopic isotope carry-over), and generates **Vehicle Incident Reports** (`PDF`, `CSV`, `JSON`, `Excel (.xlsx)`), including browser-relayed remote pass bundles when federated nodes are configured.
- Added multi-format secondary-inspection gamma spectroscopy upload (`.n42`, Ortec ASCII `.spe`, Ortec/Canberra binary `.spc`, and `.xml`), offline photopeak isotope identification fallback and polynomial keV energy calibration resolution (`AdjudicationDetail.tsx`, `WebIdAnalysis.tsx`, `DetectorResponseFunction.tsx`, `IsotopeMapping.ts`, `N42Detail.tsx`), logarithmic-by-default gamma energy spectrograms (`Counts (Log)`) with an accessible 1-click `Log` / `Linear` segmented toggle and clickable Y-axis label (`SpectrumScaleControl.tsx`, `N42Chart.tsx`, `N42ChartPlayback.tsx`, `Rs350ChartPlayback.tsx`), and interactive **UpSet Co-Occurrence** intersection plots (`UpSetPlot.tsx` on `/event-log` and JSON report previews in `/report`).
- Added **Saved Queries** bookmarks (`SavedEventQueries.ts`, `SavedQueriesPopover.tsx`), instant zero-API **Back to Filtered Events** session restoration between `/event-log` and `/event-details`, collapsible on-demand Event Log **UpSet Co-Occurrence** loading (`EventTable.tsx`), secondary-inspection upload pre-toggling (`SecondaryInspectionSelect.tsx`, `AdjudicationDetail.tsx`), and multi-isotope lookup/filtering (`IsotopeMapping.ts`, `EventTableRequests.ts`) across all four locales.
- Added the localized **Users & Access (`/users`)** console (`UsersAccessManager.tsx`, `OnboardingInviteDialogs.tsx`, `AuthSessionApi.ts`, `TunnelSessionSelfHeal.ts`, `Node.ts`, `NodeForm.tsx`, `DataSourceContext.tsx`, `Navbar.tsx` across `735` locale keys in `en`, `es`, `fr`, `el`): self-service offline WebAuthn / FIDO2 Passkey enrollment/renaming/removal (with WebAuthn Signal API synchronization) and local PBKDF2 password updates, non-IT Administrator management of `Administrator`, `Operator`, and read-only `Viewer` accounts, **Bulk Enroll (CSV / Paste)** roster import (`parseBulkUserRoster`) generating ready-to-send startup text messages, printable onboarding cards, and crisp client-rendered 1-tap Passkey/Password setup QR codes (`/login/enroll?token=oscar_inv_...`) plus readable fallback codes for phone-free workstations, Operational View user scoping (`allowedViews`), persistent "Stay Signed In Until Logout" vs. Shift Kiosk session policy controls, optional Corporate OIDC + PKCE and Trusted Zero Trust Tunnel SSO configuration with 24/7 automatic tunnel session self-healing (`TunnelSessionSelfHeal.ts`), URL-normalizing server host entry (`NodeForm.tsx`), human-readable multi-node `nodeName` attribution in Consolidated Vehicle Incident Report previews (`Report.tsx`), downloadable hardware-replacement recovery checklists, and scoped **Federation Service Tokens** (`oscar_fed_<shortId>_<secret>` authenticating both HTTP `Bearer` and HiveMQ WebSocket MQTT `svc-fed-<shortId>` in **Nodes**).

- Added the localized **USB Backups (`/usb-backups`)** zero-shell administrator workspace (`UsbBackupManager.tsx`, `UsbBackupApi.ts`) for initializing external USB 3.x NVMe SSDs (`NTFS`/`ext4`, hardware-excluding OS/active OSCAR disks), switching between `continual`, `occasional`, and `disabled` modes, triggering immediate `0.0 s`-downtime delta syncs, safely ejecting drives (`SAFE_TO_UNPLUG`) for field laptop offloads, and downloading `oscar-backup-key.txt` for off-site escrow.
- Added the localized **Pluggable Runtime Extensions & Regional Packs (`/extensions`)** workspace (`RuntimeExtensionsManager.tsx`, `RuntimeExtensionsApi.ts`, `PmTilesLayerFactory.ts`, `MapComponent.tsx` across `737` locale keys in `en`, `es`, `fr`, `el`): manages upgrade-safe custom **Vehicle OCR** packs (`plate-rules.json`, `.onnx` weights, or `OcrEngine` `.jar` SPI), **Offline Regional Basemaps** (`.pmtiles` v3 vector `MVT` via local-canvas `protomaps-leaflet` and raster `PNG`/`JPEG`/`WEBP` via `pmtiles` over authenticated `HTTP 206` byte-range requests with zero external CDN requests), **Secondary Spectroscopy** (`isotope-library.json` or `SpectroscopyIdentificationAlgorithm` `.jar`), **Trusted Enterprise CAs** (`.pem`/`.crt`), **Agency Adjudication Policy Packs** (`policy-pack.json`), and **EML Alarm Assessment**, with 1-click **Reset to Shipped Default** across every subsystem.

### Changed

- Retained-media manifest validation now accepts Java `Instant.MAX` (`+1000000000-12-31T23:59:59.999999999Z`) provisional `rollbackDeleteAfter` timestamps emitted before the 24-hour MP4 rollback grace clock begins, while continuing to reject malformed signed-year timestamps.
- Event Details adjudication logs now discover all adjudication datastreams associated with a lane, merge historical observations matched either by the occupancy's `adjudicatedIds` array or by `occupancyObsId` with live MQTT entries, refresh deterministically after adjudication submission, and deduplicate entries by observation ID and timestamp.
- National Statistics refresh now follows its durable command status through `PENDING` to terminal
  completion, keeps the controls busy for the complete operation, and fetches the exact observation
  ID returned by that command instead of accepting a stale latest row. Terminal failures remain
  visible, node or operational-view changes cancel stale UI work, and scoped range scans run
  sequentially to avoid multiplying database load.
- Events without a retained-media manifest continue to use their legacy MP4 paths after the API returns `404`. Unexpected API or schema failures are visible to the operator and still offer the MP4 when available.
- During the retained-media rollback grace period, the original hot MP4 remains playable beneath the five-frame evidence gallery. Only each camera's selected JPEG is fetched initially, at most three frame requests run concurrently, loaded frames are reused in memory, and object URLs are revoked on navigation.
- The reviewed MQTT MessagePort source is pinned directly to the immutable upstream `ORNL/osh-js` commit and lockfile integrity hash, removing the personal packaging-fork dependency from clean builds.
- Status of Health and Dashboard snapshots now request at most 10 streams per batch, retain two global workers and a 10-second deadline, and recover independently when one batch stalls. This keeps browser and server work bounded against large accumulated observation histories.
- Live HLS playback in Lane Details now attaches per-viewer session headers (`X-OSCAR-HLS-Viewer` and `X-OSCAR-HLS-Viewer-State`) with periodic heartbeat and immediate unload/navigation release so multiple operators can view the same lane concurrently without interrupting each other, while stripping redundant `videos/` bucket prefixes from returned `streamPath` values.
- Localized occupancy alarm status values in `EventTable` and `AlarmTransferImport`, custom disposition code prefixes in `AdjudicationSelect` and `AdjudicationLog`, and Status of Health timestamps across English, Spanish, French, and Greek; refined domain terminology (`διέλευση`, `αξιολόγηση`, singular `Ανιχνευτής`, `Adjugé`, `fallos`) and sized table headers and navigation drawers so labels fit cleanly without clipping.

## 3.10.0

### Added

- Added configurable custom disposition codes in Event Details and bulk adjudication workflows.
- Added alarm priority sorting (`Gamma-Neutron` > `Neutron` > `Gamma`), shareable occupancy observation-ID links, live and historical Daily File RPM message displays, and individual detector charting in Lane View.

## 3.9.1

### Upgrade notes

- This release adds operator-facing navigation and URL-scoped operational views. Validate workstation URLs and train operators before production rollout.

### Added

- Added exact Event UUID lookup, fresh-session Event Details deep links, copyable node-qualified URLs, and visible UUID metadata in printed/PDF and alarm-transfer workflows.
- Added a localized Status of Health page for lane RPM and camera connectivity, radiation and tamper faults, and configurable extended-occupancy alerts.
- Added URL-scoped operational views that consistently limit lane discovery, dashboards, maps, reports, notifications, and health monitoring to assigned lanes.
- Added compact alarm QR export from the dashboard and Event Details, including adaptively downsampled gamma, neutron, and threshold series.
- Added an offline Alarm Transfer page that scans a camera or saved QR image, imports portable alarm files, verifies transfer integrity, redraws charts, and downloads or shares the alarm package.
- Added complete English, Spanish, French, and Greek interface translations for the transfer workflow.

### Changed

- Dashboard lane cards now show compact, independently labeled RPM and camera connection indicators plus gamma-high, gamma-low, neutron-high, tamper, and extended-occupancy fault indicators. They share the bounded Status of Health snapshot instead of adding per-lane health subscriptions.
- Viewer installs no longer pull the unused HTML tag injector, legacy browser-polyfill stack, or deprecated patch and test tooling.
- Alarm Transfer camera scanning now keeps a visible framed preview, reports camera and validation state, supports selecting among available cameras, preserves native scan pixels for dense alarm codes, and closes the camera immediately after stopping or importing.
- Alarm QR images now use integer module-aligned raster and display sizes so saved images and on-screen codes do not acquire decoder-breaking fractional pixel boundaries.
- Status of Health now refreshes latest observations in globally limited batches of at most 50 streams on entry and every 30 seconds instead of using per-stream real-time MQTT feeds, with a 10-second request deadline so stalled nodes cannot block later work, preventing oversized requests and bounding CPU and server load at large sites.
- Event filtering, counts, pagination, and bulk selection now query the complete matching server-side result set rather than only the currently loaded page.
- Lane Details now shows localized live-video preparation and terminal error states, retries transient playlist and media failures within fixed bounds, and offers a Retry action that safely starts one fresh server stream.
- Live-video URLs now honor each node's configured bucket endpoint, normalize platform-specific path separators, and remain same-origin for the default node.

### Security

- Alarm QR payloads are compressed Base45 documents with a SHA-256 corruption check and strict import limits. They are not encrypted or digitally signed, so the interface warns operators to confirm the source independently.
- Migrated the static Viewer to Next.js 16 and React 19, and migrated component tests to Cypress 16 with Vite 8. Removed the obsolete standalone Webpack toolchain, browser polyfills, and vulnerable patch tooling; the MQTT MessagePort fix is now pinned to its reviewed `osh-js` source commit.
- Clean installs now contain no known npm audit advisories or deprecated locked packages, and CI rejects future advisories at every severity.

## 3.8.4

### Added

- Added nested AND/OR filtering across all event columns on the dashboard and Events page.
- Added cross-page alarm selection, selection of all filtered alarms, and bulk adjudication with progress and per-event failure isolation.

### Changed

- Event counts, pages, live updates, and bulk selection now use the same filter definition.
- Occupancy ID, Max Gamma, and Max Neutron filters now default to inclusive minimum/maximum comparisons.
- Server requests and adjudication commands use bounded concurrency to protect multi-lane deployments.


## 3.0.0 - 2025-11-11
### Added
- Added MQTT to DataSources to allow client to receive messages through a single persistent websocket instead of opening multiple websockets per lane.
- 


## [2.0.0] - 2025-10-14
### Removed
- Inserting DataStreams and Systems from client
### Changed
- Updated charts to handle Aspect Occupancy events
- 
- National View Page styling and handling of data from client to backend
- Video Playback changed to use html elements rather than osh-js
- Updated osh-js to 3.1.0
- 
### Added
- Implemented Report Generation Page
- Button to export as PDF to Event Details Page
- Added SiteMap diagram to Map components
