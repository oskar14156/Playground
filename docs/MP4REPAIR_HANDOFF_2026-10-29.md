# MP4Repair — Handoff an den nächsten Agenten
**Stand:** 29. Oktober 2026, Europa/Wien. Die zuletzt geprüften Playground-Läufe stammen vom 28. Oktober 2026 (UTC).
**Status:** Release Candidate 1.3.0 / Android Build 14. Noch NICHT für öffentlichen Play-Store-Release freigegeben. Keine Änderungen in Produktions-main.

## 0. Unbedingt zuerst lesen — Nutzerauftrag und harte Regeln

Der Nutzer will, dass MP4Repair-Fehler aus Sentry behoben werden und alle Fixes möglichst umfassend **real im Android-Emulator** getestet werden. Er hat wiederholt ausdrücklich verlangt:
- **ALLE Builds und Tests ausschließlich über oskar14156/playground ausführen** — NICHT über die GitHub-Actions-Workflows in oskar14156/mp4repair. Codeänderungen und Testsourcen dürfen im privaten App-Repo auf dem Fix-Branch liegen, die CI-Ausführung aber ausschließlich im Playground-Repo.
- **Nicht raten**: GitHub-Quellcode, echte Sentry-Events und Runner-Logs auslesen. Emulatortest ist nicht gleich JVM-/Mocktest.
- **Keinen Release oder Merge voreilig durchführen.** Die bislang ungeprüften und teilweise roten Release-Gates klar benennen.
- Möglichst nahtlos weiterarbeiten und beim Testen auch Fehler selbst beheben, nicht nur empfehlen.
- **Keine echten Zahlungen** im Emulator auslösen. Für Google-Play-Billing echte Internal-Track-Testkonten / autorisierte Testkäufe erst gezielt und sicher prüfen. Keine privaten Upload-Keys oder Sentry-Tokens in öffentlichen Playground-Logs ablegen.
- Der direkte Android-MCP-Emulator des Nutzers (danielealbano/android-remote-control-mcp auf Mac/UTM/Cloudflare-Tunnel) gab zuletzt bei android_get_screen_state / android_list_apps nur "The tool failed internally." zurück. Verfügbarkeit erneut prüfen; nicht davon ausgehen, dass er online ist. Die nachgewiesenen Tests liefen auf GitHub-Actions-Emulatoren in Playground.

## 1. Repositoryzustand, PR, Versionsnummer

- App: https://github.com/oskar14156/mp4repair (privat; GitHub-Connector hat Les-/Schreibzugriff).
- Produktionsbranch **main**: c72fa682e9fee2087ff652fd8bc8f36d8116f90c; enthält die veröffentlichte Android 1.2.9, versionCode 13. Die Produktion ist **nicht** auf 1.3 umgestellt.
- Aktiver Test-/Fix-Branch: **fix/build13-android-memory**, Stand vor diesem Handoff: a4fef91630de5afef04a076577decc8d60e2544c, 34 Commits relativ zum main.
- Draft-PR: **https://github.com/oskar14156/mp4repair/pull/3**; offen, nicht gemergt. Änderungen umfassen Android 1.3.0, versionCode 14. Dieser Branch ist der Ausgangspunkt für weitere Fixes. Der Report-Commit nach Erstellung kann den Head-SHA ändern; daher stets aktuellen PR-Head prüfen.
- Vorheriger zusätzlicher PR #2: test/emulator-standalone-apk, separate ältere Experimentierbranch; nicht mit PR #3 verwechseln oder automatisch mergen.
- Runner-/Testrepo: **https://github.com/oskar14156/playground**. Alle unten verlinkten GitHub-Actions-Läufe wurden dort ausgeführt.
- GitHub-Workflow zum privaten Checkout nutzt vorhandenes Secret **CI_BRIDGE_READ_TOKEN**. Token niemals ausgeben oder ins Repo schreiben.
- Im App-Branch existiert ein älteres QA-Dokument: docs/ANDROID_1_3_RELEASE_QA_2026-10-28.md. Es wurde durch neuere Tests teilweise überholt. **Dieser Handoff ist aktueller.**

## 2. Was geändert wurde — relevante Dateien im PR #3

App-Code:
1. **src/App.tsx**: AppState-Listener, foreground-only previews, modal-/Sheet-Zustände, einmaliger automatischer Pro-Upsell pro Reparatur. Wichtige spätere Commits 90d78ba10c, 7185497597, 2254fb4b3f und a4fef91630 versuchen, das unerwünschte Wiederöffnen der Paywall beim App-Resume / Billing-Refresh zu unterbinden.
2. **src/components/ResultScreen.tsx** und **src/components/RepairedFileSheet.tsx**: Video/ExoPlayer nicht nur pausieren, sondern bei unsichtbarem Bildschirm oder Overlay vollständig unmounten, um Decoder-Ressourcen freizugeben.
3. **android/app/src/main/java/com/oskarpolster/mp4repair/bridge/DeviceValidator.kt**: 320x180-beschränkte Pixelanalyse, mit Seitenverhältnis skalierte Android MediaMetadataRetriever-Probes, sicherer Bitmap.recycle() in finally und begrenzte initiale Referenz-Frames (anstatt mehrfach vollständige 4K/8K-Bitmaps zu allozieren).
4. **android/app/src/main/java/com/oskarpolster/mp4repair/mediarepair/ResolutionFit.kt** und **RepairEngine.kt**: bei mehreren plausibel decodierbaren Auflösungen die Referenz-Seitenverhältnisse berücksichtigen; für HEVC CTU-aligned coded geometry + Conformance-Crop, insbesondere 1080p beschädigt / 720p Referenz.
5. **android/app/build.gradle**: Version 1.3.0 / versionCode 14, Android-Test-Runner und Instrumentierungstest-Abhängigkeiten.
6. **android/app/src/androidTest/java/com/oskarpolster/mp4repair/AndroidRepairIntegrationTest.kt**: echte Android-Tests mit MediaCodec / MediaMetadataRetriever, inklusive zweimaliger Sample-Reparatur, verifizierter Decodierung, Inputfehlern, Abbruch-Cleanup, wiederholten Frame-Probes, 4K und optionalem großem beschädigtem Video.
7. **__tests__/previewLifecycle.test.js**: JavaScript-/Source-Regressionen für den Player-/Speicher-Lifecycle und späterer Paywall-Guard.
8. **tools/harness-android/Main.kt**: portables FFmpeg unter Linux (libx264/libx265 statt ausschließlich macOS VideoToolbox) und Testkorpus.

Auch beachten: Die neueren Paywall-Änderungen wurden nach einigen frühen grünen Läufen committed. Daher **letzte rote UI-Läufe und aktueller Head-Commit** sind für Release maßgeblicher als die früheren 8/8-Testläufe.

## 3. Aktuell verifizierte erfolgreiche Tests (Playground)

| Kategorie | Ergebnis | Nachweis |
| --- | --- | --- |
| Vollständiger Medien-Korpus | **40/40** beschädigte Videos repariert und mit FFmpeg validiert; **4/4** intakte Dateien korrekt erkannt | https://github.com/oskar14156/playground/actions/runs/40778193296 |
| Format-/Codec-Matrix | **31/31** unterstützte Kombinationen erfolgreich; **6/6** nicht unterstützte Kombinationen zurückgewiesen | https://github.com/oskar14156/playground/actions/runs/40778193296 |
| Android 15 / API 35, real native Instrumentation | **9/9** inklusive echter 3840x2160-H.264-Probes 10-mal nacheinander | https://github.com/oskar14156/playground/actions/runs/40776424528 |
| Android 16 / API 36, real native Instrumentation | **10/10**; Log enthält "OK (10 tests)" | https://github.com/oskar14156/playground/actions/runs/40780416206 |
| Android 15 Release-Mode UI (früherer Baseline-Lauf) | **8/8** UI-Szenarien grün; reales Beispielvideo 150 Frames, 0:05, 960x540, ~495 KB | https://github.com/oskar14156/playground/actions/runs/40773831448 |
| Echte große beschädigte Videodatei | **471,556,923 Byte** defekte MP4 -> **471,602,928 Byte** reparierte gültige MP4, 11.280 Frames, kein OOM auf Emulator | https://github.com/oskar14156/playground/actions/runs/40777561888 |
| Größerer Dateistress | Rund **1 GB** beschädigte MP4, 24.960 Frames erfolgreich repariert/validiert, kein Android-OOM; nach Reparatur Java-Heap ~21.5 MB bei ~604 MB Limit | https://github.com/oskar14156/playground/actions/runs/40778658219 |
| JavaScript/static | ältere **37/37 Jest** grün, aktueller Playground-Release-Preflight erfolgreich; **aber** ein späterer automatischer PR-CI-Check meldete **1/38 Jest fehlgeschlagen** (spröde Source-Assertion, siehe Abschnitt 4a) | https://github.com/oskar14156/playground/actions/runs/40783017988 und https://github.com/oskar14156/mp4repair/actions/runs/40782964984 |
| Play Store Preflight (KEINE Store-Freigabe) | npm checks, Android-Release-Konfiguration, Bundle-Generierung mit armeabi-v7a + arm64-v8a, Version 1.3.0+14 | https://github.com/oskar14156/playground/actions/runs/40783017988 |

**Begrenzungen:** Die realen 4K-Probes nutzen einen kurzen Videoclip; die 1-GB-Datei ist ein synthetisches Testvideo. Kein realer 85-Minuten-4K-/4-GB-Nutzerfall belegt, keine Garantie gegen alle alten Sentry-OOMs, SIGABRT nicht eindeutig behoben. Es gibt keinen Nachweis eines echten erfolgreichen Google-Play-Kaufs oder Restores. Android-Automation testete Save/Share lediglich im nicht zahlenden Zustand, nicht tatsächlichen Pro-Speicher- oder Share-Erfolg.

## 4. Aktuelle rote Tests — genau verstehen, nicht vorschnell als App-Bug melden

Neuester Stand bei Prüfung am 29.10.2026:
- Android 16, letzter erweiterter UI-Run: **40783030992** (fehlgeschlagen im letzten Szenario): https://github.com/oskar14156/playground/actions/runs/40783030992
- Android 15, letzter erweiterter UI-Run: **40783025013** (gleiche Stelle): https://github.com/oskar14156/playground/actions/runs/40783025013
- In beiden neuesten Logs sind **12 Szenarien PASS** und das **13. Szenario cancel-repair-and-recover-navigation FAIL**.
- Bestandene Szenarien der letzten beiden Läufe: (1) Onboarding->Home, (2) Settings/Back, (3) Android-Dokumentpicker öffnen/abbrechen, (4) Foto/Gallery-Picker öffnen/abbrechen, (5) Paywall öffnen/schließen OHNE Kauf, (6) Sample-Diagnose, (7) echte Sample-Reparatur bis Ergebnis, (8) Background/Resume ohne automatische Paywall, (9) Ergebnis->Home, (10) reparierte Datei erneut öffnen, (11) zweite Reparatur bis Ergebnis, (12) sechs wiederholte Preview-Open/Background/Back-Zyklen. In beiden neuesten Runs alle PASS.
- Fehlender letzter Test: Aktuell wählt **.github/scripts/mp4repair-release-e2e.sh** wieder SampleDamaged.mp4, tippt "Start repair" und wartet bis zu 20 Sekunden auf Text "Rebuilding your video", um danach "Stop" zu drücken. **Die kurze 5-Sekunden-Sample-Reparatur ist zu schnell**, die automatisierte Pro-Paywall öffnet bereits nach Erfolg. UI meldet "REPAIR COMPLETE / Your video is ready", statt den kurz sichtbaren Progress-Screen. Dies ist **kein nachgewiesener Reparatur-Crash oder Abbruch-Bug**, sondern ein Testdesignfehler / Race mit Auto-Upsell. Der native Android-Abbruchtest bestand bereits separat.
- Richtiger nächster Fix für E2E: einen echten **langsameren beschädigten Clip** für den Abbruchtest erzeugen/importieren (z.B. ~100-500 MB, über Dokumentpicker oder gezielte AndroidTest-Bridge), sicher auf Fortschritt und "Stop" warten, dann Abbruch/Navigation/Datei-Cleanup prüfen. Keinen Erfolg behaupten, bevor ein realer Stop während laufender Reparatur ausgelöst wurde. **Nicht** Test einfach grün machen, indem man nach abgeschlossener Reparatur ein erfolgreiches Result akzeptiert: Das wäre kein Abbruchtest.
- Bei wiederkehrender Paywall sicher unterscheiden: pro neuem erfolgreichem Repair ist ein Upsell normal; **nicht normal** ist Reopen derselben bereits geschlossenen Paywall nach Background/Resume oder Billing-Refresh. Die neuesten beiden Läufe bestanden Hintergrund- und mehrere Preview-Zyklen; der Testfehler passiert beim automatisch angezeigten Upsell des neu gestarteten, besonders schnellen dritten Repairversuchs.
- Ältere rote Läufe hatten teils Onboarding/Quickstep-Anomalien und ein Overlay-Race. Diese NICHT als aktuellen App-Defekt anführen, wenn die neuesten Logs bis zum 13. Szenario kommen.

### Wo Logs und Diagnostik zu finden sind
- Workflow **.github/workflows/mp4repair-release-emulator-matrix.yml** (Android API 35).
- Workflow **.github/workflows/mp4repair-android16-ui.yml** (Android API 36).
- Gemeinsamer UI-Treiber **.github/scripts/mp4repair-release-e2e.sh** in Playground.
- Bei UI-Fehlschlag werden UI-/Memory-/App-Log-Auszüge geschrieben; Workflow lädt mit **if: failure()** ggf. Screenshots als kurzes Artefakt hoch.
- Runner-Logs vollständig lesen, nach **CASE START**, **CASE PASS**, **CASE FAIL**, **TAP**, **REPAIR RESULT**, **Traceback**, **OutOfMemoryError** und **FATAL EXCEPTION** suchen. Sie unterscheiden technische Tests von Scheinfehlern der Automation.
- Der direkte Custom-Android-MCP-Emulator war zuletzt offline; PLAYGROUND-Emulatoren sind die verifizierte Alternative.

## 4a. Weitere beobachtete, NICHT abschließend geklärte PR-Checks

**Wichtige Zusatzprüfung bei Handoff-Erstellung:** Im privaten MP4Repair-Repository liefen bereits automatisch frühere GitHub-Actions-Checks auf pull_request, **obwohl der Nutzer alle aktiv angestoßenen Tests ausschließlich in Playground verlangt**. Diese PR-getriggerten Runs NICHT als Grundlage für neue Tests benutzen und keine weiteren Build-/Test-Jobs dort absichtlich starten. Für reine Dokumentations-Commits ist die Commit-Nachricht mit [ci skip] markiert. Nächster Agent sollte die automatischen Trigger prüfen und nach Möglichkeit unbeabsichtigte PR-CI-Starts ohne Verlust wichtiger Codechecks verhindern; erforderliche Checks in Playground replizieren.

- https://github.com/oskar14156/mp4repair/actions/runs/40782964984 (automatischer PR-Run, FAIL): **Checks** mit **37/38 Jest PASS und 1 FAIL**. Der Test __tests__/previewLifecycle.test.js erwartet den exakten Code-String "setAppActive(state === 'active')", der nach dem berechtigten AppState-/Paywall-Refactoring nicht mehr wörtlich vorkommt. Das kann eine veraltete **Source-Level-Testassertion** statt eines echten Funktionsdefekts sein: tatsächliches Verhalten prüfen und im Fix-Branch eine semantisch passende Regression formulieren. Außerdem **Repair engine (Kotlin)** / npm run test:formats FAIL; in den Logs ist mindestens der Fall **mp4-mpeg4-aac.mp4, cut at 70% -> validation_failed** enthalten. Dieser Failure ist nicht durch ältere grüne Formatmatrizen entschuldigt: aktuelle Codeversion und reproduzierbaren Fixture-Befund erneut **in Playground** testen.
- https://github.com/oskar14156/mp4repair/actions/runs/40782988300 (späterer automatischer PR-Run, FAIL): Android build und Repair engine (Kotlin) erfolgreich; **Checks** scheiterten bei **"The store listing is up to date"** (generierte Store-Listing-/Lokalisierungsdatei vermutlich nicht synchron). Die genaue Diff-/Generator-Ausgabe in den Job-Logs prüfen und nur danach korrigieren. Der spätere **Playground-Preflight 40783017988 war erfolgreich**; Versions-/Snapshot-Unterschiede zwischen Runs berücksichtigen.
- Diese automatisch ausgelösten Jobs sind **keine Freigabe** und die genannten roten Prüfpunkte sollten vor dem Merge erneut erfolgreich im Playground ausgeführt werden.
- Neueste Android-16-native Instrumentierung **10/10 grün** bleibt unabhängig davon bestätigt; die neueste **UI-Matrix 12 PASS, 1 FAIL** (Cancel-Race) bleibt rot.

## 5. Weitere test- und buildrelevante Playground-Dateien

- .github/workflows/mp4repair-native-instrumentation.yml — Android API 35 native Integrationstests.
- .github/workflows/mp4repair-native-android16.yml — Android API 36 native Integrationstests, zuletzt 10/10.
- .github/scripts/mp4repair-instrumentation.sh — APK-Installation, echtes adb instrument; externe 4K-Stressdatei.
- .github/workflows/mp4repair-large-stress.yml — echte synthetisch beschädigte große MP4 erzeugen, Android-Instrumentierung.
- .github/scripts/mp4repair-large-fixture.sh und .github/scripts/mp4repair-large-stress-emulator.sh — Generator / Emulator-Test großer Videos.
- .github/workflows/mp4repair-engine-corpus.yml — 40-Fälle-FFmpeg-Korpus und Formatmatrix.
- .github/workflows/mp4repair-play-preflight.yml — npm, Config-Audit, Release AAB und Versionsprüfung; **kein Store Upload**.
- .github/workflows/mp4repair-memory-emulator.yml — ältere JS + Android Smoke Tests.
- .github/workflows/mp4repair-android-bundle.yml — älterer Standalone-Debug-APK-Test.
- .github/workflows/mp4repair-emulator-retest.yml — zuvor erzeugte APK ohne Neubau erneut prüfen.

CI-Jobs können über GitHub Actions > Workflow > Run workflow gestartet werden; falls die Tool-Verbindung keinen workflow_dispatch-Aufruf bietet, wurde bisher eine kleine Änderung der entsprechenden *Playground*-Workflowdatei gepusht, die den path-gefilterten Push-Run auslöst. Vermeide unnötige doppelte parallele Läufe; vor neuen Actions den aktuellen Run-Status prüfen. **Niemals** MP4Repair-eigene Workflows als Ausweichroute starten.

## 6. Sentry – tatsächliche neue Fehler von alten unterscheiden

Sentry ist im Chat als Plugin verbunden; MCP-Namespace **mcp__SENTRY__**. Organization-Slug **oskar-polster**, Projekt **mp4-repair**, Region https://de.sentry.io. Fehlergruppen und Stacktraces direkt über die verfügbaren Sentry-Tools lesen; nicht nur den alten Screenshot nutzen.

Letzter untersuchter Produktionsrelease: **com.oskarpolster.mp4repair@1.2.9+13**. Dort gab es am 28.10.2026 acht fatale Android-Events in fünf Issue-Gruppen: **MP4-REPAIR-A**, **-10**, **-X**, **-Z** (OOM/Java-Heap) und **-9** (nativer abort/SIGABRT; genaue Ursache offen). Zudem behandelte Engine-Events **-H** (validation_failed), **-R** (no_samples_found), **-Y** (unsupported_codec), **-W** (reference_damaged), **-N** (empty_file), **-V** (zeroed_file), **-G** (reference_unusable); nicht alle sind Software-Defekte. -Q war nur im Emulator.
Bei -10 war nach langer Reparatur/Vorschau (76.876 Frames) ein Heap-OOM aufgetreten, bei -A im Android MediaCodec/ExoPlayer, bei älteren Fällen auch bei großen Dateien. Diese Sentry-Ereignisse stammen aus **1.2.9**, nicht aus neuem 1.3.0. **Keine 1.3-Produktionsevents erwarten, bevor 1.3 tatsächlich ausgerollt wurde.**
Nächster Agent sollte Release-Version und Event-Datum filtern, nicht alle ungelösten historischen Sentry-Issues als wiederkehrende neue Fehler deklarieren. Sentry-Issues wurden hier nicht geschlossen und keine produktiven Datensätze verändert.

## 7. Release-Entscheidung

**Kein öffentlicher Release / keine Merge-Freigabe ohne verifizierte Gates.** Der Nutzer hatte explizit gefragt "release oder nicht?", und die Empfehlung war: interner bzw. geschlossener Test möglich; kein öffentlicher 100%-Rollout.

Gates:
1. Echten Stop-/Cancel-UI-Test auf laufender längerer Reparatur bestehen und die erweiterte 13-Szenarien-Matrix auf API 35 + 36 komplett grün bekommen.
2. Aktuelles PR-Head-SHA nochmals auf API 35/36 und mit großem Videostress verifizieren. Auf Sentry 1.3 (falls später intern ausgeliefert) nach wirklichen neuen Fehlern filtern.
3. Google Play Console prüfen: höchster bereits genutzter versionCode (14 nur zulässig, wenn frei), interner Testtrack, Release-AAB mit privatem Signiermaterial korrekt bereitstellen; keine CI-Dummy-Signatur ausliefern.
4. Tatsächliche RevenueCat-/Play-Testkäufe und Restore für weekly, yearly, lifetime kontrollieren; Fehlkonfigurationen und Testemulator-Billing auseinanderhalten. Kein unautorisierter echter Kauf.
5. Saves und Shares mit autorisiertem Pro-Entitlement / Testaccount real auf Device prüfen.
6. Nach internem Feldtest allenfalls **gestaffelten** Produktionsrollout (z.B. 5 %) samt Sentry-Monitoring erwägen; keine automatische Publikation.

## 8. Konkreter nächster Arbeitsplan (in Reihenfolge)

**A.** Einmal neu laden: aktuelle PR #3 SHA, Diff, aktuelle Playground-Workflow-Runs, ob weitere Agents gerade commits/Tests gestartet haben. Hier wurden bis 28.10. 22:51 UTC zahlreiche weitere Commits und Runs hinzugefügt; vermeide paralleles Überschreiben. Ausgangs-HEAD vor Handoff a4fef91630de5afef04a076577decc8d60e2544c.
**B.** Zusätzlich die in Abschnitt 4a dokumentierten automatischen PR-Check-Abweichungen (Jest-Source-Assertion, MPEG4-AAC cut-at-70%-Formatfixture, Store-Listing-Generierung) **ausschließlich in Playground** reproduzieren und ggf. Code/Test/Listing korrigieren. Danach den fehlgeschlagenen End-to-End-UI-Cancel-Test korrekt nachbauen und mit *langsamerem* realem File ausführen; bevorzugt dafür eigene Android-Instrumentierung/externen Clip plus ADB-Import statt 5-Sekunden-Sample. Den Paywall-Overlay-Race so testen, dass er echten Benutzerabläufen entspricht.
**C.** Beide erweiterten UI-Runs auf API 35/36 erneut prüfen. Alle anderen 12 Szenarien sind in den neuesten beiden Runs grün; nicht unbesehen wieder auslassen.
**D.** Bei jeder echten Abweichung Android-App-Code in fix/build13-android-memory fixen, nur Playground Builds/Tests starten und das Draft-PR aktualisieren.
**E.** Nach bestätigtem UI-Cancel die große-Datei-OOM-Absicherung (1-4GB, längere Nutzungsdauer, App-Background/Resume, Vorschauwechsel, Speicherprotokolle) weiter ausbauen.
**F.** Play/Billing-Gates und Sentry-Monitoring nach interner Freigabe vervollständigen. Nur mit Nutzervorgabe Release/Merge/Store-Upload ausführen.

## 9. Verweise / sofort nutzbare Einstiege

- Draft PR #3: https://github.com/oskar14156/mp4repair/pull/3
- Neueste API-35-UI-Logs (12 PASS, Cancel FAIL): https://github.com/oskar14156/playground/actions/runs/40783025013
- Neueste API-36-UI-Logs (12 PASS, Cancel FAIL): https://github.com/oskar14156/playground/actions/runs/40783030992
- Android-16-Nativtests 10/10: https://github.com/oskar14156/playground/actions/runs/40780416206
- Android-15-UI-Baseline 8/8: https://github.com/oskar14156/playground/actions/runs/40773831448
- Full repair corpus 40/40: https://github.com/oskar14156/playground/actions/runs/40778193296
- 1-GB-Reparaturtest: https://github.com/oskar14156/playground/actions/runs/40778658219
- Play Release Preflight: https://github.com/oskar14156/playground/actions/runs/40783017988
- Vorhandene ältere QA-Notiz (nicht vollständig aktuell): https://github.com/oskar14156/mp4repair/blob/fix/build13-android-memory/docs/ANDROID_1_3_RELEASE_QA_2026-10-28.md

## 10. Was ausdrücklich NICHT getan wurde

- **Kein Merge** in mp4repair/main; dort weiterhin 1.2.9+13.
- **Keine öffentliche Play-Store-Veröffentlichung**, keine echten Nutzerkäufe.
- Kein ausreichender Nachweis für alle 4-GB/85-Minuten-OOM-Szenarien oder vollständige Beseitigung von nativen SIGABRTs.
- Kein aktueller Zugriff auf den Nutzer-Mac-Emulator durch dessen Custom-MCP.
- Fehlgeschlagene erweiterte UI-Cancel-Szenarien wurden **nicht** als bestanden deklariert.

**Definition of done für nächsten Agenten:** Er kann selbst aus GitHub/Sentry den aktuellen Head und Fehlerstand prüfen, die konkreten letzten roten Testlogs lesen, gezielt den Cancel-Race mit einem real länger dauernden Video beheben, alle betreffenden Playground-Tests grün bekommen, die Draft-PR-Beschreibung aktualisieren und anschließend einen mit konkreter Evidenz begründeten Release-Vorschlag machen — ohne ein einziges mp4repair-Repo-Actions-Testbuild oder öffentliches Release zu starten.
