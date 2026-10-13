# CI Bridge — einmalige Studien-Integration mit 20 privaten Testdateien

> **Status (13.10.2026):** Der öffentliche Bridge-Code einschließlich eines 20-Dateien-End-to-End-Tests wurde in GitHub Actions erfolgreich ausgeführt. Ein echter **privater Checkout über einen öffentlichen GitHub-hosted Runner** ist **noch nicht verifiziert**: dafür muss der Eigentümer einen eingeschränkten GitHub-Zugriffstoken als Secret anlegen und den Workflow manuell starten. Die private `belegfluss`-Testsuite hat bereits in einem *privaten* Caller-Workflow 20 Suites mit 161/161 bestandenen Tests nachgewiesen, **nicht** in dieser öffentlichen Integration.

## Ziel und Grenzen

Dies ist ein **Integrationstest der hier öffentlich entwickelten CI-Bridge**: Auswahl von exakt 20 Testdateien, Pfad-/Symlink-Validierung, Aufruf eines Node/Python-Testadapters, redaktionell bereinigte Ergebniszusammenfassung und temporärer Checkout eines ausdrücklich autorisierten privaten Test-Fixures.

- `course-exercise/ci-bridge/contract.mjs`: Validierung von 20 Tests.
- `course-exercise/ci-bridge/run-fixture.mjs`: startet die Tests ohne Übergabe des Repo-Lesetokens; unterdrückt Rohlogs.
- `course-exercise/ci-bridge/contract.test.mjs`: öffentliche Unit-/Sicherheitsprüfungen.
- `.github/workflows/course-ci-bridge.yml`: öffentlicher Workflow mit Unit- und 20-Dateien-Public-Fixture-Test; optional einmaliger Integrationslauf mit privatem Fixture.

GitHub Actions ist für das **Softwareprojekt des jeweiligen Repositories** gedacht. GitHubs zusätzliche Terms untersagen auf GitHub-Hosted-Runnern Arbeiten ohne Bezug zum dortigen Softwareprojekt. Das bloße Verlegen beliebiger privater CI-Workloads in ein öffentliches Repo, nur um die private Abrechnung zu umgehen, ist **kein zulässiger allgemeiner Dienst**. Eine Studienübung, die die Kompatibilität des *öffentlich entwickelten* CI-Bridge-Projekts mit einem ausgewählten privaten Test-Fixture nachweist, muss tatsächlich diesem Projekt dienen; GitHub entscheidet über die Auslegung/zulässige Nutzung. **Bitte nicht als dauerhaft kostenlosen CI-Proxy einsetzen.**

## Einmalige Einrichtung durch den Repo-Eigentümer

1. Öffne [GitHub Personal Access Tokens](https://github.com/settings/personal-access-tokens/new). Erstelle einen **Fine-grained PAT** mit kurzer Ablaufzeit (z. B. 1 Tag), **Resource owner = `oskar14156`**, **Repository access = Only select repositories**. Wähle für den ersten Lauf **nur** `oskar14156/belegfluss`; für den Professor-Test muss zusätzlich oder stattdessen das mit Erlaubnis angelegte private Test-Repository ausgewählt werden.
2. Unter **Repository permissions** setze **Contents: Read-only**. Alle anderen Berechtigungen auf **No access** belassen (Metadata Read wird automatisch gesetzt). Token kopieren und niemals hier im Chat, Code, Issue oder Workflow-Eingabefeld eintragen.
3. Öffne [Playground → Settings → Actions secrets](https://github.com/oskar14156/Playground/settings/secrets/actions). Wähle **New repository secret**. Name **`CI_BRIDGE_READ_TOKEN`**, Wert = PAT. Speichern. Dieses Secret muss im **öffentlichen Playground** hinterlegt sein, NICHT im privaten Testrepository, denn der Runner startet im öffentlichen Repo. Nur vertrauenswürdige Personen mit Schreibzugriff auf den Playground sollten dessen Workflows verändern dürfen.
4. Öffne [Playground → Actions](https://github.com/oskar14156/Playground/actions). Wähle **Course CI Bridge - public runner integration** → **Run workflow**. Der Workflow ist nach Merge nach `main` im Actions-Menü verfügbar.

### Erste Kontrolle mit bekanntem privaten Test-Fixture

Die folgenden Werte sind bereits im privaten Repository vorhanden:

| Workflow-Eingabe | Wert |
|---|---|
| Run workflow from | `main` |
| fixture_repository | `oskar14156/belegfluss` |
| fixture_ref | `ci/probe-reusable-20` |
| fixture_language | `node` |
| fixture_manifest | `ci/private-20-test-files.txt` |
| dependency_setup | `none` |

**Run workflow** anklicken. Erwartet wird im **öffentlichen** Workflow:

- `Test public CI Bridge implementation` → PASS, inklusive 20 synthetischer öffentlicher Probe-Dateien.
- `One-time private fixture integration` → Checkout des privaten Repositories und erfolgreiche Ausführung von 20 realen Testdateien. Im bereits bestätigten privaten Vergleichslauf waren es 161 Einzeltests.
- Es wird **nur eine allgemeine PASS-Zusammenfassung** geloggt; private Testnamen, Stacktraces und Dateiinhalte werden nicht absichtlich veröffentlicht. Die Workflows anderer Projekte im vorhandenen Playground sind unabhängig und können einen eigenen Status haben.

Ein solcher Lauf wird in **Playground → Actions** dem öffentlichen Repository zugeordnet. Standard GitHub-hosted Runner sind für öffentliche Repositories kostenlos. Das ist **keine Freigabe**, beliebige fremde private Projekte wiederholt so auszuführen, und GitHubs Nutzungsbedingungen gelten unverändert.

## Morgen: Professoren-Repository als neues privates Fixture

1. Nur mit Zustimmung des Professors und Berechtigung zur Nutzung: ein Repo in deinem Account als **privates Repository** bereitstellen. Achtung: GitHub erzwingt **öffentliche Forks öffentlicher Upstreams**. Wenn sein Ausgangsrepo öffentlich ist, benötigt ihr stattdessen einen **Import in ein neues privates Repository** oder einen autorisierten lokalen Clone+Push; das ist dann technisch kein Fork. Ein erlaubter privater Fork eines privaten Upstreams bleibt privat.
2. Der Token muss Lesezugriff auf **genau dieses neue private Repo** erhalten (PAT-Repoliste entsprechend anpassen bzw. neues eng begrenztes Token erzeugen und das Secret ersetzen).
3. Der Testadapter unterstützt derzeit **Node.js Node-Test-Runner (JavaScript/TypeScript auf Node 22)** und **Python pytest (Python 3.12)**. Das private Repo benötigt 20 kompatible Testdateien. Nicht jedes beliebige Repo hat 20 solcher Dateien oder läuft ohne eigene Abhängigkeiten; eine universelle 100%-Zusage wäre falsch.
4. Am zuverlässigsten legt der Professor im privaten Repo einen Pfad wie `ci/bridge-test-manifest.txt` mit **genau 20 relativen Testdateipfaden** an (eine Datei pro Zeile). Diesen Pfad in **fixture_manifest** angeben. Alternativ das Feld leer lassen: Der öffentliche Adapter findet automatisch die ersten 20 alphabetisch sortierten passenden Dateien im privaten Checkout.
5. Für Node-Projekte mit nötigen npm-Abhängigkeiten **dependency_setup = npm-ci** (benötigt ein funktionierendes `package-lock.json`; Install-Skripte werden aus Sicherheitsgründen nicht ausgeführt). Für pytest-Projekte mit `requirements.txt` **dependency_setup = python-requirements**; ansonsten **none**.
6. **fixture_repository** auf `oskar14156/PROFESSOR-FIXTURE` und **fixture_ref** auf den gewünschten privaten Branch/SHA setzen. Nur Repositories unter `oskar14156` werden akzeptiert.
7. Als Abgabenachweis den **öffentlichen** GitHub-Actions-Lauf öffnen, die zwei grünen Jobs und die kurze Test-Zusammenfassung dokumentieren. Die private Quelle ist nicht im öffentlichen Repo committed.

Nach Abgabe das PAT auf GitHub **widerrufen**, das Secret **`CI_BRIDGE_READ_TOKEN` löschen**, die privaten Fixtures nach Absprache löschen und den für die Vorführung angelegten Workflow deaktivieren bzw. entfernen.

## Sicherheit und bekannte Einschränkungen

- **Kein absoluter Vertraulichkeitsbeweis:** Private Dateien werden temporär auf einem GitHub-gehosteten Runner verarbeitet. Ein böswilliger Test oder eine kompromittierte Dependency könnte Dateien aktiv preisgeben. Nur mit vertrauenswürdigem Code ausführen. Der Repo-Name und die öffentliche Actions-Konfiguration bleiben sichtbar.
- Aus dem öffentlichen Workflow werden keine privaten Testberichte, Caches oder Artifacts hochgeladen. Test-Ausgaben werden im Prozess gesammelt und nicht ins öffentliche Log geleitet; bei Fehlern erfolgt bewusst **keine** Rohdiagnose. Für Debugging den Test privat/lokal wiederholen.
- `actions/checkout` ist mit `persist-credentials: false` konfiguriert. Das fine-grained PAT erhält ausschließlich Repo-Leserechte und wird nicht in den Testprozess übernommen.
- Der Job ist auf zwölf Minuten begrenzt. Ohne Secret gibt es **keinen** erfolgreichen privaten Checkout. Der Bridge-Test selbst braucht **keine** Tokens.
- Erfolgreiche GitHub-Actions-Tests sind kein Beweis, dass die gesamte mobile App gebaut, veröffentlicht oder im Store geprüft werden kann.

### Quellen

- [GitHub Actions Terms](https://docs.github.com/en/site-policy/github-terms/github-terms-for-additional-products-and-features)
- [GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions)
- [GitHub Fine-grained PAT](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)
- [GitHub forks and visibility](https://docs.github.com/en/pull-requests/reference/forks)
