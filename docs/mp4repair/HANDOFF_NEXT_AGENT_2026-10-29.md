# MP4Repair — Handoff für den nächsten Agenten (29.10.2026)

## Final QA update — 2026-10-29, ~16:50 Europe/Vienna

**All refreshed technical QA gates are now green** (the older notes below still show their in-progress states). Private full report: [MP4Repair fix-branch handoff](https://github.com/oskar14156/mp4repair/blob/fix/build13-android-memory/docs/HANDOFF_NEXT_AGENT_2026-10-29.md). Private fix-branch head after doc update: `14a6ef429dc162adb90520161a51615e0e23b123`; main untouched at `c72fa682e9fee2087ff652fd8bc8f36d8116f90c`.

- [Android 15 / API35 UI](https://github.com/oskar14156/playground/actions/runs/40903094984): **13/13 PASS**, including real 365MB H264 damaged-video open-with/import and tap `Stop` *during* repair, return to diagnosis.
- [Android 16 / API36 UI](https://github.com/oskar14156/playground/actions/runs/40903122030): **13/13 PASS**, same verified live cancellation, plus twice genuine repairs and six reopen/background loops.
- [1GB damaged video real Android repair](https://github.com/oskar14156/playground/actions/runs/40903424725): **SUCCESS**, original `1043445048` bytes, repaired `1043546001`, `24960` recovered/validated frames, Java heap after `21532224` bytes vs limit `603979776`.
- [Android16 native instrumentation](https://github.com/oskar14156/playground/actions/runs/40903436565): **10/10 PASS** on rerun; original SDK archive failure was infrastructure only.
- [Android build14 metadata, type/lint/Jest](https://github.com/oskar14156/playground/actions/runs/40900479273): **38/38 Jest, 21/21 deterministic Play metadata locales**, all checks success.
- [Full Kotlin/FFmpeg format corpus](https://github.com/oskar14156/playground/actions/runs/40899739237): green corpus job **40/40 damaged, 4/4 healthy, 31/31 supported format repair**; workflow overall red only because its snapshot predates metadata fix; metadata separately confirmed by newer green run.
- **Not public-release-ready automatically**: real Play Internal-test entitlements/purchase restore/Pro Save-Share not yet tested; unresolved production 1.2.9+13 OOM/SIGABRT Sentry risk, 1.3.0+14 not yet deployed; no proof against every 4GB/85min recording. No purchase, no Play upload, no PR merge. Custom EMULATOR2 MCP remains unresponsive, CI tests used actual Android 15/16 emulators.

---


## Continuation note (2026-10-29, ~16:39 Europe/Vienna)

**Authoritative private handoff is:** https://github.com/oskar14156/mp4repair/blob/fix/build13-android-memory/docs/HANDOFF_NEXT_AGENT_2026-10-29.md. Read its newest `NEUESTE FORTSETZUNG` block first; the mirror below predates multiple newly verified runs.

- App private draft PR #3 `fix/build13-android-memory`, **NO MERGE**. The private handoff was updated `[skip ci]` at commit `d508f6a6e0443c6211216df4bba9aa8153350556`; app version 1.3.0+14.
- Real fix in private app branch: track Play 14.txt metadata for 21 locales instead of stale 13.txt, commit `64bd7c5a7ea3b7c6593c2fe8c398a93fdf71ba1d`. Current Playground metadata/Jest [40900479273](https://github.com/oskar14156/playground/actions/runs/40900479273) green **7/7 suites, 38/38 tests**, versioned 21/21 metadata.
- Kotlin corpus/format matrix Playground [40899739237](https://github.com/oskar14156/playground/actions/runs/40899739237) job green **40/40 damaged, 4/4 healthy, 31/31 supported codecs**; overall workflow red only for pre-fix source snapshot metadata.
- Full Android UI 15/16 [40900856799](https://github.com/oskar14156/playground/actions/runs/40900856799) / [40900863967](https://github.com/oskar14156/playground/actions/runs/40900863967): both **12/12 old UI PASS**; 13th synthetic 365MB file first encountered Android **`Open with`** chooser `MP4 Repair` / `Just once`. Driver updated to handle that dialog, commit `17c9c2978d4d7cb2b7d617adea94b0fc1fbc0b2b`; DO NOT mark cancellation PASS before actual Stop.
- **CURRENT ACTIVE**: Android 15 [40903094984](https://github.com/oskar14156/playground/actions/runs/40903094984), Android 16 UI [40903122030](https://github.com/oskar14156/playground/actions/runs/40903122030), Android 16 native 10-case repeat [40903436565](https://github.com/oskar14156/playground/actions/runs/40903436565), actual 1GB Android stress repeat [40903424725](https://github.com/oskar14156/playground/actions/runs/40903424725). Read final logs. Build 13 PROD fatal OOM/SIGABRT in Sentry remain unresolved; no proof build14 resolves all.
- Custom EMULATOR2 MCP calls failed internally, alternative Android_Emulator MCP connection unavailable. Playground real emulator via Android-emulator-runner is the available tested path. Do not report direct local EMULATOR2 success.
- No app repo Actions; no Play purchase, merge, or release.

---


> **START HERE.** Stand aus tatsächlichen GitHub-Actions-Logs, Repository-Code und Sentry. Bitte alle Links/Run-Zustände beim Einstieg neu abrufen. Die letzte Code-/QA-Runde fand am 28.10.2026 UTC statt. **KEIN öffentlicher Release freigegeben; `mp4repair/main` nicht verändert.**

## 0. Nutzerauftrag / unverhandelbare Regeln

Der Nutzer will, dass MP4Repair **gründlich gefixt und auf echten Android-Emulatoren wiederholt getestet** wird, bevor 1.3.0 öffentlich released wird. Es geht besonders um die weiterhin in 1.2.9+13 auftretenden Android-OOM-/SIGABRT-Abstürze, große beschädigte Videos, Reparaturqualität und einen stabilen User-Flow.

**WICHTIG: ALLE BUILDS, CI-JOBS UND TESTS AUSSCHLIESSLICH IN `oskar14156/playground` starten; NICHT in `oskar14156/mp4repair`.** Im App-Repo sind Codeänderungen auf dem Fix-Branch erlaubt, aber kein eigener CI-Lauf / Build. Bestehende Play-/Produktionskonfiguration nicht ändern, keine Käufe auslösen. Hauptbranch nicht mergen oder releasen, bevor alle Gates geprüft sind. Der Nutzer möchte möglichst selbstständiges Weiterarbeiten und konkrete Logs statt Annahmen.

Der benutzerseitig eingerichtete Android-Emulator über `danielealbano/android-remote-control-mcp` meldete zuletzt bei `android_get_screen_state` und `android_list_apps` **„The tool failed internally“**. Noch einmal versuchen, aber falls weiterhin offline, die in Playground gestarteten **realen Android-Emulatoren** mit `reactivecircus/android-emulator-runner@v2` verwenden. Emulator-Tests sind echte Android-UI-/Instrumentation-Tests, keine Mocks.

## 1. Repositories und aktueller GitHub-Stand

- App-Code (privat): https://github.com/oskar14156/mp4repair
- Fix-Branch: https://github.com/oskar14156/mp4repair/tree/fix/build13-android-memory
- **Draft-PR #3** (noch nicht mergen): https://github.com/oskar14156/mp4repair/pull/3
- Playground als alleinige Build-/Testumgebung: https://github.com/oskar14156/playground
- Vorherige QA-Doku in App-Fix-Branch: `docs/ANDROID_1_3_RELEASE_QA_2026-10-28.md`. Sie enthält ältere offene Punkte; **dieser Handoff ist neuer und supersediert deren Teststatus**.
- Latest PR-Head beim Lesen: `a4fef91630de5afef04a076577decc8d60e2544c`, Main/Base `c72fa682e9fee2087ff652fd8bc8f36d8116f90c`. Bitte vor Änderungen erneut `fetch_pr`/GitHub-API lesen, weil möglicherweise parallel Commits entstehen.
- Kandidat: Android **`versionName 1.3.0`, `versionCode 14`** im Fix-Branch. Vor Upload prüfen, ob im Play Console nicht schon ein gleich hoher oder höherer `versionCode` existiert.
- Sentry-Organisation: `oskar-polster`, Region `https://de.sentry.io`, Projekt `mp4-repair`. Sentry-Connector ist verbunden und lesbar; Tools `mcp__SENTRY__find_organizations`, `search_issues`, `search_errors`, `get_sentry_resource`, bei Bedarf per `search_sentry_tools` weitere Events/Breadcrumbs. Keine Credentials hier ablegen.
- Auf Playground ist `CI_BRIDGE_READ_TOKEN` als Secret zum read-only Checkout der privaten App vorhanden. Token **nie loggen oder committen**.

## 2. Releaseentscheidung am 29.10.

**Noch KEIN öffentlicher Produktionsrelease.** Ein interner bzw. geschlossener Play-Store-Test kann nach Prüfung der Signing-/Play-Konfiguration erwogen werden. Obwohl Reparatur- und Stresstests gut sind, bleiben erweiterte UI-Tests am Ende rot und reale Play-Billing-Käufe/Restore auf einem Google-Play-internen Testtrack ungetestet. Kein Push nach Play Store, keine Testzahlungen ohne explizite Freigabe. PR bleibt Draft.

Der relevante alte Sentry-Release ist `com.oskarpolster.mp4repair@1.2.9+13`. Dort wurden trotz vorherigem Speicher-Fix am 28.10. **acht fatale Events in fünf Gruppen** festgestellt: `MP4-REPAIR-A` (2), `10` (1), `X` (1), `Z` (1), `9` (nativer abort, 3). Vor einem neuen öffentlichen Release OOM-Schutz validieren und Sentry in einem gestaffelten Rollout überwachen; nicht allein aus grünen synthetischen Tests „alles gefixt“ ableiten. Erwartete, behandelte Reparaturfehler wie `empty_file`, `zeroed_file`, `reference_damaged` sind keine Abstürze und dürfen nicht kosmetisch verschwiegen werden.

Weitere behandelte 1.2.9-Fehler: `validation_failed`/H, `no_samples_found`/R, `unsupported_codec`/Y, `reference_unusable`/G. Nicht alle diese Fehler sind Bugs; einige Dateien sind schlicht nicht rekonstruierbar. Release 1.3.0+14 ist noch nicht öffentlich ausgeliefert, daher gibt es bislang **keine Produktions-Sentry-Daten für 1.3.0+14**, anhand derer man einen realen Rückgang behaupten dürfte.

## 3. Änderungen auf `fix/build13-android-memory`

PR #3 umfasst folgende wesentlichen Dateien (vor neuen Edits gesamten aktuellen Diff lesen):

- `src/App.tsx`: `AppState`-Foreground-Erkennung; Vorschau nur bei aktiver App und ohne Modal; automatischer Pro-Paywall-Guard `automaticPaywallShown`, Änderungen bei Background/Resume und verzögerter Anzeige; Abhängigkeiten zwischen `flow.screen`, `billing.ready`, `billing.isPro`, `sheet`.
- `src/components/ResultScreen.tsx`, `src/components/RepairedFileSheet.tsx`: `previewActive`; ExoPlayer wird bei verdecktem Bildschirm unmounted statt nur `paused`.
- `android/app/src/main/java/com/oskarpolster/mp4repair/bridge/DeviceValidator.kt`: Größenbegrenzung der Bitmap-/Luma-Proben, `getScaledFrameAtTime` statt voller 4K-Decodes, Seitenverhältnis erhalten, `recycle()` in `finally`, beschränkte wiederholte First-Frame-Probes.
- `android/app/src/main/java/com/oskarpolster/mp4repair/mediarepair/ResolutionFit.kt` und `RepairEngine.kt`: bevorzugen plausiblen Referenz-Aspekt bei 720p-/1080p-Auflösungs-Fit; HEVC-Sonderfall mit Coding Tree Unit/Clipping behandelt (Details anhand aktuellen Diffs prüfen).
- `tools/harness-android/Main.kt`: plattformabhängige FFmpeg-Encoder: macOS VideoToolbox, Linux `libx264`/`libx265`; Test-Fokusmodus für Geometrie.
- `android/app/src/androidTest/java/com/oskarpolster/mp4repair/AndroidRepairIntegrationTest.kt`: echte Android-JUnit-Integrationstests ohne simulierte Repair-Successes, inklusive Abbruch, ungültiger Dateien, 4K und 1GB-Fixture.
- `android/app/build.gradle`: Android-Test-Instrumentation-Runner und Dependencies; Android-Version 1.3.0+14.
- `__tests__/previewLifecycle.test.js`: Lebenszyklus- und Bitmap-Regressionsguards.

Diese Fixes sind **im Fix-Branch/PR**, nicht in `main`.

## 4. Prüfungen — nachweislich GRÜN

| Prüfstrecke | Bestätigter Stand | Links |
|---|---|---|
| RN/TypeScript/Jest/Lint/Prettier | 37/37 Jest-Tests, Typecheck, ESLint, Formatierung bestanden (zum damaligen Test-Commit) | https://github.com/oskar14156/playground/actions/runs/40745865727 |
| Android API 35, Release UI, kleine Probe | 8/8 Szenarien, Onboarding, Einstellungen, Diagnose, echte Reparatur, Background/Resume, Home, erneutes Öffnen, zweite Reparatur begonnen | https://github.com/oskar14156/playground/actions/runs/40773831448 |
| API 35, native Instrumentation/4K | 9/9 native Tests, echter 3840×2160 H.264-Frame-/Validator-Stress (10 Durchläufe) | https://github.com/oskar14156/playground/actions/runs/40776424528 |
| **API 36 / Android 16 native Instrumentation** | **10/10**, inklusive Reparatur-Engine, wiederholtem Decoding, 4K und Negativtests. NEUER beständiger Nachweis! | https://github.com/oskar14156/playground/actions/runs/40780416206 |
| Reparaturkorpus Linux FFmpeg | **40/40 beschädigte Videos repariert+validiert**, 4/4 gesunde erkannt, 31/31 unterstützte Formate repariert, 0/6 nicht unterstützte fälschlich akzeptiert. Historisch gelegentlich 39/40 HEVC; spätere vollständige Runde grün | https://github.com/oskar14156/playground/actions/runs/40778193296 |
| Großdatei realer Android-Emulator | **471.556.923 Byte** mit defektem Index → **471.602.928 Byte**, 11.280 Frames, keine OOM | https://github.com/oskar14156/playground/actions/runs/40777561888 |
| **1-GB-Datei echter Android-Emulator** | **1.043.445.048 Byte** defekt → **1.043.546.001 Byte** valide MP4, **24.960 Frames**, Java-Heap vorher 6.215.904, danach 21.536.320, Limit 603.979.776 Byte; keine OOM | https://github.com/oskar14156/playground/actions/runs/40778658219 |
| Play-Store Preflight | `npm run check`, Konfig-Audit, Android Release APK/AAB ARM32+ARM64, Versions-Check erfolgreich. **Kein realer In-App-Kauf, keine Upload-Signatur und keine Play-Console-Prüfung** | https://github.com/oskar14156/playground/actions/runs/40777798716 und https://github.com/oskar14156/playground/actions/runs/40783017988 |

Die Sample-Reparatur in der UI zeigte **150 Frames, 0:05, 960×540, 495 KB** und eine Ergebnis-/Vorschauansicht; das ist ein tatsächlich in Android erzeugtes Resultat, kein Mock.

**Grenze des Nachweises:** Kein dauerhafter Test über viele Stunden bzw. 4GB+ reale Reparaturen; keine garantierte Behebung des Sentry-`SIGABRT`; echtes Play Billing auf einem internen Google-Play-Track weiterhin offen.

## 5. NEUESTE fehlgeschlagene erweiterte UI-Tests — wichtigste Handlungsaufgabe

**Nicht mit Compiler-/Reparaturfehlern verwechseln.** Neue Runs vom 28.10.22:50 UTC (ca. 23:50 MEZ) haben **alle vorherigen UI-Phasen bestanden**, scheitern erst am letzten **`cancel-repair-and-recover-navigation`**:

- Android 15 / API 35: https://github.com/oskar14156/playground/actions/runs/40783025013
- Android 16 / API 36: https://github.com/oskar14156/playground/actions/runs/40783030992
- Job-IDs: API35 `123149197598`, API36 `123149217037`; `fetch_workflow_job_logs` zeigt alle Details.

**Vor dem Abbruch-Schritt nachweislich PASS auf BEIDEN Versionen:**
1. `onboarding-to-home`
2. `settings-back-navigation`
3. `files-picker-open-and-cancel`
4. `photos-picker-open-and-cancel`
5. `paywall-open-and-dismiss-no-purchase` (keine Käufe)
6. `sample-diagnosis`
7. `real-native-sample-repair` (150 Frames)
8. `background-and-resume-preview`
9. `result-back-to-home`
10. `reopen-repaired-video-and-back`
11. `second-repair-complete` (nicht bloß Progress!)
12. `six-reopen-and-background-cycles`

**Einziger FAIL:** `cancel-repair-and-recover-navigation`:
- Skript startet nach vielen Reparaturen erneut die **5-Sekunden-Sample-Reparatur**, wartet danach bis zu 20 Sekunden explizit auf UI-Text `Rebuilding your video`, will erst dann `Stop` drücken.
- Währenddessen ist in den Fehler-Screenshots/Accessibility-Logs bereits die **automatisch geöffnete Pro-Paywall „Your video is ready“** sichtbar. Das kann bedeuten, dass die kleine Reparatur schneller fertig ist als das UI-Polling und der Fortschrittsbildschirm deshalb schlicht verpasst wurde (konkreter Test-Design-Fehler). Auch die Auto-Paywall kann die Navigation verdecken. **Daher dieser rote E2E-Status allein KEIN Nachweis, dass die native Abbruchfunktion kaputt ist**: der native `cancellationAfterDiagnosisCleansUpOutput`-Test besteht bereits.
- Achtung: Frühere API35/API36-Läufe sind *früher* bei result navigation / paywall modal oder Onboarding gescheitert. Die allerneuesten Läufe haben **diese** Abschnitte bereits bestanden. Bitte nicht alte Testfehler als neuesten Stand berichten.
- `src/App.tsx` hat bereits einen `automaticPaywallShown`-Guard (einmal pro Resultat) und Background-Dismissal; erneute Paywall bei **neuem** Repair ist gewollt, sollte aber nicht unaufgefordert Navigation dauerhaft verdecken. Den aktuellen Code nicht reflexhaft zurücksetzen.

**Konkrete Empfehlung zum nächsten Schritt:** `playground/.github/scripts/mp4repair-release-e2e.sh` bearbeiten:
1. Für Cancel-UI einen **längeren/gezielt verzögerten beschädigten Clip** verwenden, damit Progress sichtbar bleibt und ein Cancel deterministisch erreicht werden kann; oder `Stop` sofort/reaktiv während Repair starten, nicht erst nach langsamer `uiautomator dump`-Pollingrunde.
2. Falls schon `REPAIR COMPLETE` bzw. Paywall statt Progress angezeigt wird, den Fall als **zu schnell abgeschlossene Reparatur / Test-Fixture ungeeignet** protokollieren, nicht automatisch als App-Defekt.
3. Nach jedem neuen Resultat ggf. automatisch eingeblendete Paywall gezielt, ohne Kauf, per `Close` schließen und **prüfen, dass sie nicht nach Dismiss/Background wieder erscheint**. Bestehende Paywall-Guard-Regressionsprüfung nicht abschwächen.
4. Bei Fail UI-Hierarchie, Screenshot und `dumpsys meminfo` sichern. `playground` besitzt bereits Screenshot-Diagnostik in Skript/Workflows. Auf Android 16 `uiautomator`-Knoten/Tap-Bounds kontrollieren.
5. Matrix danach **auf API 35 UND API 36 erneut vollständig grün** ausführen. Wenn unklar, UI- und echte Cancellation-Integrationstests getrennt ausweisen.

Zuletzt geprüfte API35-/API36-Runs 40783025013 und 40783030992 sind beide `completed/failure` ausschließlich im UI-Schritt; der **native Android-16-Run 40780416206 ist `completed/success` mit `OK (10 tests)`**.

## 6. Wichtige Playground-Pfade und Test-Neustart

**Nur** `oskar14156/playground`, Standardbranch `main`, dort u.a.:

- `.github/workflows/mp4repair-release-emulator-matrix.yml` — Release-UI API35.
- `.github/workflows/mp4repair-android16-ui.yml` — Release-UI API36.
- `.github/scripts/mp4repair-release-e2e.sh` — gemeinsame erweiterte UI-Matrix (oben beschriebener Cancel-Test am Ende).
- `.github/workflows/mp4repair-native-instrumentation.yml` — native API35.
- `.github/workflows/mp4repair-native-android16.yml` — native API36.
- `.github/scripts/mp4repair-instrumentation.sh` — Instrumentation-Treiber, inkl. 4K-Fixture.
- `.github/workflows/mp4repair-large-stress.yml` — 1GB-Android-Test, `.github/scripts/mp4repair-large-fixture.sh`, `.github/scripts/mp4repair-large-stress-emulator.sh`.
- `.github/workflows/mp4repair-engine-corpus.yml` — FFmpeg-Reparaturkorpus.
- `.github/workflows/mp4repair-play-release-preflight.yml` bzw. den **tatsächlichen** Namen über GitHub tree feststellen (nicht raten).

Workflows überwiegend `workflow_dispatch` oder `push.paths` bei Änderung der Workflow-YAML. GitHub-MCP hat nicht zwingend eine Dispatch-Aktion; die bestehenden Läufe wurden durch Updates an den YAMLs in Playground angestoßen. **Nicht unkontrolliert mehrere parallele Builds starten.** Die App wird mit `actions/checkout` privat/read-only aus dem Fix-Branch geholt. Android x86_64 Runner. Release-UI-APK ist **nur mit temporärem Debug-Schlüssel signiert**, niemals als produktives Play-Upload-Artefakt verwenden. Native Instrumentation mit `:app:assembleDebug :app:assembleDebugAndroidTest`, nicht unqualifiziertem `assembleDebugAndroidTest` (sonst Fremd-Sentry-Test-APKs und doppelte `libc++_shared.so`).

Zum Kontrollieren:
- `mcp__GitHub__fetch_workflow_run_jobs({repo_full_name:"oskar14156/playground",run_id:...})`
- `mcp__GitHub__fetch_workflow_job_logs({repo_full_name:"oskar14156/playground",job_id:...})`
- GitHub REST über `mcp__GitHub__fetch`: `https://api.github.com/repos/oskar14156/playground/actions/runs?per_page=30`.
- Für Code `mcp__GitHub__fetch_file({repository_full_name:"oskar14156/mp4repair",ref:"fix/build13-android-memory",path:...})` und gezielt `update_file` nach SHA.
- Vor Änderungen PR #3/Branch-HEAD erneut lesen; möglicherweise sind bereits weitere Commits vorhanden.

## 7. Sentry-Hinweise und reale Nutzerfälle

Sentry-Connector erlaubt vollständige Issue/Event/Stacktrace-/Breadcrumb-Analyse, nicht nur Screenshot. Alte, aktuelle Produktionsversion **1.2.9+13** filterbar mit `release:"com.oskarpolster.mp4repair@1.2.9+13"`. Zuletzt um 28.10.2026:
- Fatal OOM: `MP4-REPAIR-A`, `10`, `X`, `Z`; nativer `MP4-REPAIR-9` `abort`, nicht unbewiesen mit OOM gleichsetzen.
- `MP4-REPAIR-10`: 76.876 Frames einer langen Aufnahme, mehrere Preview-/Sharing-/Navigation-Aktionen, dann Android `LOW_MEMORY` und Crash.
- `MP4-REPAIR-A`: ExoPlayer `MediaCodec.getBuffer`, Java-Heap 512 MB auf Samsung-Gerät erschöpft; nicht gleichbedeutend mit fehlendem freiem System-RAM.
- `MP4-REPAIR-H`: `validation_failed`, rekonstruierte Frames nicht decodierbar; `R` `no_samples_found`.
- `Q`: RevenueCat `PRODUCT_NOT_FOUND` auf Emulator (keine Play Store Billing-Umgebung). Nicht als Produktionskauf-Fehler zählen, aber reale Play-Store-Produkte vor Release prüfen.

Ein automatischer UI-Test, der die Paywall im Emulator schließt, ersetzt **keinen** Billing-Kauf-/Restore-Test im offiziellen Google-Play-Testtrack.

## 8. Empfohlene Arbeitsreihenfolge für nächsten Agenten

1. **Zuerst** PR #3 HEAD, letzte Playground-Läufe und den Dateistand neu lesen. Besonders `40783025013` / `40783030992` (rote UI-Tests) und `40780416206` (grüner API36-Nativtest). Keine veralteten Statusangaben verwenden.
2. UI-Abbruchtest deterministisch machen, Auto-Paywall schließen, aber nicht eine neue berechtigte Paywall pauschal als Bug labeln. Auf 35/36 erneut testen.
3. Falls App tatsächlich Cancel/Modal nicht korrekt behandelt, **gezielter Fix im App-Fix-Branch**, Tests nur über Playground. JavaScript 37/37, native 10/10, UI-Matrix und Großdatei-Stress nach Codeänderungen ggf. nochmals verifizieren.
4. Optional 2–4GB/mehrstündige Videos und wiederholte Preview-Pfade unter kontrolliertem Speicherstress auf Emulator testen; nicht behaupten, diese Fälle seien schon vollständig abgedeckt.
5. Interner Google-Play-Test mit produktionsnaher Signatur/Upload-Track, realem Entitlement, Käufen/Restore, Netzwerkfehlern durch berechtigte Tester (keine Zahlung ohne Nutzerentscheidung).
6. Sentry nach eventuellem gestaffelten 1.3.0+14-Rollout auf **neue Release-Version** filtern und Fatal-Ereignisse gegen 1.2.9+13 vergleichen.
7. **Erst nach bestätigter Freigabe** PR #3 mergen, Release-/Play-Upload ausführen. Bis dahin Draft belassen und user-facing Fortschritt ehrlich berichten.

## 9. Aktuelle externe Artefakte / Nicht tun

- Draft PR: https://github.com/oskar14156/mp4repair/pull/3 — **nicht mergen**.
- Kein produktiv signiertes AAB/Play-Release wurde in diesem Handoff erzeugt oder hochgeladen.
- Keine Produktions-Sentry-Issues blind schließen.
- Keine vertraulichen Sentry-Event-Payloads, Nutzer-Videos, Keys, Billing-Daten in öffentliches Playground-Repo committen oder Logs schreiben.
- Separate historische PR #2 zur standalone Debug-APK ist NICHT der aktuelle Memory-Fix-Releasebranch; nicht mit PR #3 verwechseln.
- Report hier in Playground dient auch bei fehlendem direkten Android-MCP-Zugriff als dauerhafter Startpunkt.

**Handoff-Status: Code+nativer Repair-Kern stark validiert; Extended-UI-Cancel-Test noch rot; öffentliche Freigabe NEIN; nächster Arbeitsfokus auf deterministischem UI-Cancel/Paywall-Flow und Release-Gates.**
