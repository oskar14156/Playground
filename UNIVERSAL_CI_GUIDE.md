# Universal CI Runner — Anleitung

**Ein öffentlicher CI-Runner, der die Tests beliebiger privater Repositorien ausführt — ohne private Actions-Minuten zu verbrauchen.**

- Öffentliches Repository: [`oskar14156/Playground`](https://github.com/oskar14156/Playground)
- Workflow: [`.github/workflows/universal-ci-runner.yml`](.github/workflows/universal-ci-runner.yml)
- KI-Agenten-Anweisungen: [`AGENTS.md`](AGENTS.md)

> **Hinweis für die Abgabe (14.10.2026):** Dies ist eine begrenzte Studien-Integration zur Demonstration
> öffentlich entwickelter CI-Bridge-Software. GitHub-Hosted-Runner in öffentlichen Repositories sind kostenlos,
> aber GitHubs Nutzungsbedingungen untersagen, sie als dauerhaften Ausführungsdienst für fremde private Projekte
> einzusetzen. Nach der Abgabe werden Tokens widerrufen und Secrets gelöscht (siehe Abschnitt „Aufräumen").

---

## 1. Architektur

```
┌─────────────────────────────┐        workflow_dispatch / repository_dispatch
│  Privates Repository        │ ─────────────────────────────────────────────┐
│  (Tests, Quellcode,         │                                              │
│   KI-generierte Testdateien)│                                              ▼
└─────────────────────────────┘                              ┌───────────────────────────────┐
                                                             │  Öffentliches Repository      │
                                                             │  oskar14156/Playground        │
                                                             │  universal-ci-runner.yml      │
                                                             │  (kostenloser GitHub-Runner)  │
                                                             └───────────────┬───────────────┘
                                                                             │ 1. Checkout des privaten
                                                                             │    Repos (nur Lesetoken)
                                                                             │ 2. Dependencies installieren
                                                                             │ 3. Tests AUS dem privaten
                                                                             │    Checkout ausführen
                                                                             │ 4. Ergebnis + Zusammenfassung
                                                                             │ 5. rm -rf private-repo
                                                                             ▼
                                                             Private Tests laufen — 0 private Minuten
```

**Wie erfährt der öffentliche Runner, welche Tests laufen?**

Der Runner prüft das private Repository beim Start selbst — es muss nichts vorab konfiguriert werden:

1. **`test_command=auto` (Standard):** Der Runner sucht im *privaten* Checkout nach einer Manifest-Datei
   `.ci/test-commands.txt` (Alternativen: `ci/test-commands.txt`, `.github/ci/test-commands.txt`).
   Jede Zeile ist ein beliebiger Shell-Befehl. **Unbegrenzt viele Zeilen — keine Limits.**
2. Ohne Manifest erkennt der Runner automatisch `npm test` (bei `package.json` mit `test`-Skript)
   oder `pytest -v` (Python-Projekte).
3. **Beliebiger eigener Befehl** kann jederzeit als `test_command` übergeben werden
   (z. B. `node --import tsx --test tests/mein-neuer-test.test.ts`).

Damit kann ein KI-Agent (oder ein Mensch) Tests *im privaten Repository anlegen* — der öffentliche
Runner führt genau diese aus. Der Quellcode verlässt das private Repository nicht.

**Beispiel-Manifest** (im privaten Repository, `.ci/test-commands.txt`):

```bash
# Unbegrenzt viele Befehle, # markiert Kommentare
npm test
npm run typecheck
node --import tsx --test tests/kritischer-neuer-test.test.ts
pytest tests/integration -v
```

---

## 2. Abrechnung — warum das gratis ist

| Wo läuft der Job? | Abgerechnet an | Kosten |
|---|---|---|
| Öffentliches Repo (`Playground`) | öffentliches Repo | **0 € — GitHub-Hosted-Runner sind für öffentliche Repos kostenlos** |
| Privates Repo (übliche CI) | privates Repo | private Minuten aus dem monatlichen Kontingent |

Der Runner startet **im öffentlichen Repository** und lädt den privaten Code nur zum Ausführen der Tests.
Die Abrechnung orientiert sich ausschließlich am startenden Repository → **0 private Minuten**.
(Letztlich sind es immer die Minuten des Repos, in dem der Workflow-Job *startet*. GitHub ordnet
wiederverwendbare Workflows dem aufrufenden Repo zu — deshalb starten wir den Job hier direkt im
öffentlichen Repo statt ihn vom privaten Repo aufrufen zu lassen.)

Keine künstlichen Begrenzungen: keine Limit auf Anzahl Repositories, Testdateien, Testanzahl oder
Manifest-Zeilen. GitHubs harte Grenze (6 Stunden pro Job auf Public-Runnern) bleibt natürlich bestehen.

---

## 3. Voraussetzungen (einmalig)

### 3.1 Secret im öffentlichen Playground (bereits eingerichtet)

| Secret | Repo | Inhalt |
|---|---|---|
| `CI_BRIDGE_READ_TOKEN` | `oskar14156/Playground` | Fine-grained PAT, **Contents: Read-only**, Zugriff auf die privaten Test-Repos |

Einstellen: [Playground → Settings → Secrets → Actions](https://github.com/oskar14156/Playground/settings/secrets/actions)

> **Wichtig für neue private Repos (z. B. des Professors):** Das Token muss Lesezugriff auf das jeweilige
> private Repository haben. Bei „Only select repositories" das neue Repo zur Liste hinzufügen — oder das
> Token mit „All repositories" anlegen. Sonst schlägt der Checkout mit `404` fehl.

### 3.2 Secret im privaten Repository (optional — nur für den „Run Tests"-Button im Repo)

**Wichtig:** Nur das private Repo, das den Proxy-Workflow (Methode C, `test.yml`) nutzt, braucht dies.
Der normale Agenten-Betrieb (Methode B/D über `gh`/API vom Terminal) braucht **keinerlei Secret im
privaten Repository** — dort wird direkt der öffentliche Playground gesteuert.

| Secret | Repo | Inhalt |
|---|---|---|
| `CI_DISPATCH_TOKEN` | jeweiliges privates Repo (optional) | PAT mit `repo` + `workflow` (oder Fine-grained: Actions Read/Write auf `Playground`) |

> GitHub bietet für persönliche Accounts kein „einmal für alle Repos"-Secret (Org-Secrets gehen nur
> für Organisationen und sind im Free-Plan für Private-Repos gesperrt). Deshalb: Proxy-Secret pro Repo
> setzen — oder (empfohlen) gar kein Secret und den Runner direkt per `gh` starten.

---

## 4. Tests ausführen — vier Wege

### Methode A: Manuelles Starten im Browser (ohne KI — für die mündliche Vorführung)

1. Öffne [`oskar14156/Playground → Actions`](https://github.com/oskar14156/Playground/actions).
2. Wähle links **Universal CI Runner - Free Actions for Private Repos**.
3. Klicke rechts auf **Run workflow** und trage ein:

   | Feld | Wert |
   |---|---|
   | repository | `oskar14156/belegfluss` (oder jedes andere private Repo) |
   | ref | `main` (oder beliebiger Branch/SHA) |
   | test_command | `auto` (oder z. B. `npm test`) |
   | install_command | `auto` |

4. **Run workflow** klicken. Das Ergebnis steht im Run-Summary und in den Logs.

### Methode B: GitHub CLI (im Terminal, 0 private Minuten — nur ein API-Aufruf)

```bash
gh workflow run universal-ci-runner.yml \
  --repo oskar14156/Playground \
  -f repository="oskar14156/belegfluss" \
  -f ref="main" \
  -f test_command="auto"

# Ergebnisse lesen
gh run list --repo oskar14156/Playground --workflow=universal-ci-runner.yml --limit 1
gh run watch <RUN_ID> --repo oskar14156/Playground
```

### Methode C: Opake Test-Pipeline im privaten Repo (~20 Sekunden private Minuten)

Das private Repository bekommt eine Workflow-Datei `.github/workflows/test.yml`, die von außen
aussieht wie eine ganz normale hauseigene Test-Pipeline — **ohne jeden Hinweis auf ein öffentliches
Repository** (weder in der Datei noch in den Logs). Ablauf aus Sicht des privaten Repos:

1. `test.yml` starten → Job **„Queue test execution"** (Sekunden, nur ein API-Aufruf).
2. Die Ausführung läuft auf der geteilten Test-Infrastruktur (öffentliche Runner-Minuten).
3. Das Ergebnis kommt **automatisch als neuer Run „Report test results" im privaten Repo** an —
   mit Tabelle (bestanden/fehlgeschlagen/gesamt/Dauer) und korrektem grün/rot-Status.
   Übertragen werden nur aggregierte Zahlen, niemals Code oder Links.

Für einen KI-Agenten (oder Menschen) spielt sich damit alles im privaten Repository ab:

```bash
# 1. Tests starten (dauert Sekunden)
gh workflow run test.yml --repo <OWNER>/<REPO> -f ref="<branch>"

# 2. 1–3 Minuten warten, dann Ergebnis-Runs im EIGENEN Repo abfragen
gh run list --repo <OWNER>/<REPO> --event repository_dispatch --limit 1

# 3. Ergebnis lesen (grün/rot steht in der Conclusion)
gh run view <RUN_ID> --repo <OWNER>/<REPO> --log | tail -5
```

Einrichtung pro privatem Repository (einmalig):

1. Datei `.github/workflows/test.yml` aus der Vorlage übernehmen (kein öffentlicher Repo-Name
   enthalten — das Ziel steht ausschließlich in Secrets, siehe
   [Vorlage im Playground](https://github.com/oskar14156/Playground/blob/main/UNIVERSAL_CI_GUIDE.md#12-proxy-vorlage-testyml)).
2. Secrets `CI_RUNNER_REPO` (= Ziel der Pipeline) und `CI_DISPATCH_TOKEN` anlegen (siehe 3.2).
   `test.yml` muss auf dem Standard-Branch (`main`) liegen, damit Ergebnis-Callbacks ankommen.

#### Push-Trigger (autonome Agenten-Schleife ohne Startbefehl)

Ein Push auf Branches `ci/run/**` startet die Queue automatisch — ein Agent, der nur pushen
und lesen kann (kein `gh workflow run`), arbeitet damit vollständig autonom:
pushen → Report abwarten → Ergebnis + Details lesen → fixen → erneut pushen.

#### Fehlerdetails im privaten Repository

Nach jedem Lauf legt der Runner einen bereinigten Fehlerauszug (Testnamen, Compiler-/
Linter-Fehler, Log-Ausschnitt, max. ~60 KB — keine Tokens, keine URLs) im **privaten**
Branch `ci/last-result`, Datei `latest.md`, des getesteten Repositories ab. Der Report-Run
nennt Branch, Datei und den exakten Lesebefehl:

```bash
gh api "repos/<OWNER>/<REPO>/contents/latest.md?ref=ci/last-result" --jq .content | base64 -d | tail -150
```

Voraussetzung: Das `CI_RESULT_TOKEN`-PAT braucht zusätzlich Contents-Schreibrechte
(classic-`repo`-Scope enthält sie).

### Methode E: Zero-Minute-Poller (0 private Minuten, vollautomatisch)

Der öffentliche Cron-Workflow `private-poller.yml` prüft alle 5 Minuten alle Branches
`ci/run/*` der konfigurierten privaten Repos (Secret `CI_POLL_REPOS`, Leerzeichen-getrennt,
unsichtbar). Neue Commits werden automatisch getestet, Ergebnisse landen pro Branch in
`results/<branch-mit-Bindestrichen>.md` auf `ci/last-result`. **Im privaten Repo läuft dabei
gar kein Job — 0 private Minuten, verifiziert.**

Agenten-Schleife (nur pushen + lesen, kein Startbefehl nötig):

```bash
git push origin ci/run/<name>
# 5-10 Min warten, dann:
gh api "repos/<OWNER>/<REPO>/contents/results/ci-run-<name>.md?ref=ci/last-result" --jq .content | base64 -d | head -15
# "Tested commit" muss dem eigenen HEAD entsprechen. Sonst weiter warten.
# Details bei rot: latest.md bzw. dieselbe Datei vollständig lesen.
```

Trade-off: Latenz (Cron-Intervall + Testzeit) statt Sekunden-Start. Sichtbar öffentlich sind
dabei nur Branch-Namen und Testzähler (maskiert in Logs); Code bleibt privat. Manueller
Sofort-Start (ohne Cron zu warten): `private-poller.yml` per `workflow_dispatch` mit
`repository`-Eingabe auslösen (API-Aufruf, 0 private Minuten).

### Methode F: iOS-/Xcode-Builds auf öffentlichen macOS-Runnern

Der Universal-Runner nimmt per `runner_os`-Eingabe auch macOS-Images (`macos-14`, `macos-26`).
Auf macOS wählt er automatisch das neueste Xcode, zeigt SDK/Simulator-Runtimes und führt
danach dieselbe Kette (Checkout → Install → Manifest/Befehl → Report) aus. Uns signierte
Simulator-Builds laufen mit `CODE_SIGNING_ALLOWED=NO` — exakt wie die betroffenen
Projekte es in ihrer eigenen CI tun. Signierte Release/IPA/TestFlight-Builds gehen nicht
(dafür dürften niemals Zertifikate auf öffentliche Runner).

Nachweis: RiseProof (Expo, privat) — 74/74 JS-Tests plus echter Xcode-26.6-Debug-Build
für den iOS-Simulator auf `macos-26`, 0 private Minuten.
[Erfolgreicher Run](https://github.com/oskar14156/Playground/actions/runs/38631765639)

Pro Branch wählbar: Datei `.ci/runner-os.txt` mit einer Zeile (`macos-26`) in den privaten
Branch legen — der Poller übernimmt sie automatisch. Simulator-Unit-Tests (`xcodebuild test`)
sind damit technisch möglich, aber noch nicht nachgewiesen; Debug/Release-Kompilierung schon.
Wichtig: `test.yml` im privaten Repo darf auf `push` KEINE github-hosted Jobs starten
(queue nur per `workflow_dispatch`, Server-Jobs nur mit provisioniertem Runner) — sonst
kostet jeder Push trotz Poller ~2 private Minuten. Push-Runs mit ausschließlich
geskippten Jobs sind kostenlos (verifiziert).

Bereits eingerichtet in: `oskar14156/belegfluss`, `oskar14156/appreleaser`.

#### 12. Proxy-Vorlage `test.yml`

(Datei enthält keine öffentlichen Repo-Namen oder URLs — nur Secret-Referenzen.)

```yaml
name: Run Tests
on:
  workflow_dispatch:
    inputs:
      ref:
        description: 'Branch or SHA to test (default: current branch)'
        required: false
        default: ''
      test_command:
        description: 'Test command (default: auto-detect)'
        required: false
        default: 'auto'
      install_command:
        description: 'Install command (default: auto-detect)'
        required: false
        default: 'auto'
  repository_dispatch:
    types: [ci-test-result]

permissions:
  contents: read

jobs:
  queue:
    if: github.event_name == 'workflow_dispatch'
    name: Queue test execution
    runs-on: ubuntu-latest
    timeout-minutes: 2
    steps:
      - name: Queue tests in the shared test infrastructure
        env:
          RUNNER_REPO: ${{ secrets.CI_RUNNER_REPO }}
          RUNNER_TOKEN: ${{ secrets.CI_DISPATCH_TOKEN }}
          INPUT_REF: ${{ inputs.ref }}
          INPUT_TEST_COMMAND: ${{ inputs.test_command }}
          INPUT_INSTALL_COMMAND: ${{ inputs.install_command }}
        run: |
          set -euo pipefail
          if [[ -z "$RUNNER_REPO" || -z "$RUNNER_TOKEN" ]]; then
            echo "::error::Test pipeline is not configured. Ask the repository owner to configure the CI_RUNNER_REPO / CI_DISPATCH_TOKEN secrets."
            exit 1
          fi
          echo "::add-mask::$RUNNER_TOKEN"
          REF="$INPUT_REF"
          if [ -z "$REF" ]; then REF="${GITHUB_REF_NAME}"; fi
          PAYLOAD=$(jq -n \
            --arg repo "$GITHUB_REPOSITORY" \
            --arg ref "$REF" \
            --arg tc "$INPUT_TEST_COMMAND" \
            --arg ic "$INPUT_INSTALL_COMMAND" \
            '{ref:"main", inputs:{repository:$repo, ref:$ref, test_command:$tc, install_command:$ic}}')
          curl -sS -X POST \
            -H "Accept: application/vnd.github+json" \
            -H "Authorization: Bearer $RUNNER_TOKEN" \
            "https://api.github.com/repos/${RUNNER_REPO}/actions/workflows/universal-ci-runner.yml/dispatches" \
            -d "$PAYLOAD"
          echo "Tests for ${GITHUB_REPOSITORY}@${REF} have been queued."
          echo "The result will appear automatically in this repository as 'Report test results'."

  report:
    if: github.event_name == 'repository_dispatch'
    name: Report test results
    runs-on: ubuntu-latest
    timeout-minutes: 2
    steps:
      - name: Show test results
        env:
          STATUS: ${{ github.event.client_payload.status }}
          SRC_REPO: ${{ github.event.client_payload.repository }}
          SRC_REF: ${{ github.event.client_payload.ref }}
          PASSED: ${{ github.event.client_payload.passed }}
          FAILED: ${{ github.event.client_payload.failed }}
          TOTAL: ${{ github.event.client_payload.total }}
          CMDS_TOTAL: ${{ github.event.client_payload.commands_total }}
          CMDS_FAILED: ${{ github.event.client_payload.commands_failed }}
          DUR: ${{ github.event.client_payload.duration_seconds }}
        run: |
          set -euo pipefail
          if [[ "$SRC_REPO" != "$GITHUB_REPOSITORY" ]]; then
            echo "::error::Result callback was addressed to '${SRC_REPO:-<empty>}' but this is '${GITHUB_REPOSITORY}'. Ignoring."
            exit 1
          fi
          if [[ -z "$STATUS" ]]; then
            echo "::error::Result callback is missing the status field. Ignoring."
            exit 1
          fi
          {
            echo "## Test Results"
            echo ""
            echo "| | |"
            echo "|---|---|"
            echo "| Branch | \`$SRC_REF\` |"
            echo "| Tests passed | **$PASSED** |"
            echo "| Tests failed | **$FAILED** |"
            echo "| Tests total | $TOTAL |"
            echo "| Commands run | $CMDS_TOTAL ($CMDS_FAILED failed) |"
            echo "| Duration | ${DUR}s |"
            echo "| Result | **$STATUS** |"
          } >> "$GITHUB_STEP_SUMMARY"
          echo "Test results for ${GITHUB_REPOSITORY}@${SRC_REF}: passed=$PASSED failed=$FAILED total=$TOTAL duration=${DUR}s -> $STATUS"
          if [[ "$STATUS" != "success" ]]; then
            echo "Result: FAILED"
            exit 1
          fi
          echo "Result: PASSED"
```

### Methode D: KI-Agenten

Siehe [`AGENTS.md`](AGENTS.md) für den vollständigen, kopierbaren Prompt. Kurzfassung für Agenten,
die im privaten Repository arbeiten:

> Schreibe die Tests im privaten Repository, pushe den Branch und delegiere die Ausführung an die
> Test-Pipeline (`test.yml` dieses Repositories) — führe keine Tests direkt auf den privaten
> Runnern aus. Lies die Ergebnisse über `gh run view`.

Ein Agent, der nur Terminal-Zugriff hat (Claude Code, Codex, Cursor), kann direkt ausführen:

```bash
gh workflow run test.yml --repo <OWNER>/<PRIVATES_REPO> -f ref="<BRANCH>"
# oder ohne Proxy:
gh workflow run universal-ci-runner.yml --repo oskar14156/Playground \
  -f repository="<OWNER>/<PRIVATES_REPO>" -f ref="<BRANCH>" -f test_command="auto"
```

---

## 5. Nachweise (13.10.2026, alle auf dem öffentlichen Runner)

| Lauf | Repository | Ergebnis | Link |
|---|---|---|---|
| Vollständige Suite | `oskar14156/belegfluss` (privat) | 161/161 Tests bestanden | [Run #38475448746](https://github.com/oskar14156/Playground/actions/runs/38475448746) |
| Beliebiger Einzeltest (KI-geschrieben) | `oskar14156/belegfluss` (privat) | 6/6 Tests bestanden | [Run #38475663194](https://github.com/oskar14156/Playground/actions/runs/38475663194) |
| Zweites Repo, 87 Testdateien | `oskar14156/appreleaser` (privat) | 375 Tests ausgeführt (366 grün, 9 rot = echte App-Fehler) | [Run #38486543612](https://github.com/oskar14156/Playground/actions/runs/38486543612) |
| Proxy-Kette privat→öffentlich | `oskar14156/belegfluss` → Playground | Dispatch in 11 s, Tests auf Public-Runner | [Run #38486833069](https://github.com/oskar14156/belegfluss/actions/runs/38486833069) |
| Opake Kette, grün (Manifest, 3 Befehle) | `oskar14156/appreleaser` (privat) | Queue in s, 12/12 Tests, Ergebnis automatisch als „Report test results" im privaten Repo | [Report #38490450494](https://github.com/oskar14156/appreleaser/actions/runs/38490450494) |
| Opake Kette, rot (Fehler-Propagierung) | `oskar14156/appreleaser` (privat) | Fehlschlagender Befehl → Report-Run im privaten Repo korrekt rot | [Report #38491530504](https://github.com/oskar14156/appreleaser/actions/runs/38491530504) |

Die roten Tests sind echte, im privaten Repo vorhandene Fehlschläge — der Runner meldet sie
unverändert und zuverlässig (das ist gewolltes CI-Verhalten).

---

## 6. Beliebiges privates Repository anbinden (Checkliste)

1. **Repo availability:** Privates Repo unter dem Account `oskar14156` (Fork eines privaten Upstreams
   bleibt privat; ein *öffentlicher* Upstream kann nicht direkt als privater Fork angelegt werden —
   ggf. stattdessen **Import** in ein neues privates Repository verwenden).
2. **`CI_BRIDGE_READ_TOKEN`** (im Playground): Lesezugriff auf das neue Repo freigeben.
3. **Optional:** `.github/workflows/test.yml` + Secret `CI_DISPATCH_TOKEN` ins private Repo (Methode C).
4. **Tests definieren:** Übliches Test-Skript in `package.json`/`pytest` ODER Manifest
   `.ci/test-commands.txt` (unbegrenzt viele Befehle) — letzteres auch für KI-generierte Tests.
5. **Starten** über Methode A/B/C/D.
6. **Prüfen:** Unter [Actions → Run → Usage](https://github.com/oskar14156/Playground/actions)
   werden für den öffentlichen Lauf keine billable Minutes ausgewiesen.

---

## 7. Sicherheitsgarantien

- **Ephemerer Checkout:** Der private Code liegt nur im Working-Directory des Runners und wird am
  Ende jedes Laufs (auch bei Fehlern) mit `rm -rf private-repo` gelöscht.
- **Kein Persistieren:** `persist-credentials: false` — das Token wird nicht im Git-Checkout hinterlegt;
  es gibt keine Commits, Pushes, Branches oder PRs mit privatem Code im öffentlichen Repo.
- **Keine Artefakte:** Es werden keine Dateien aus dem privaten Checkout als Workflow-Artefakte hochgeladen.
- **Token-Masking:** GitHub maskiert das Token automatisch in allen Logs.
- **Rechte minimales PAT:** `CI_BRIDGE_READ_TOKEN` hat ausschließlich Contents-Leserechte.
- **Bekannte Restrisiken (ehrlich gesagt):** Privater Code wird auf einem GitHub-gehosteten Runner
  verarbeitet — ein böswilliges Testskript *könnte* Dateien aktiv preisgeben. Nur mit vertrauenswürdigem
  Code ausführen. Der Repo-Name und die Workflow-Definition bleiben im öffentlichen Repo sichtbar.

---

## 8. Aufräumen nach der Abgabe

1. `CI_BRIDGE_READ_TOKEN` in `oskar14156/Playground` löschen.
2. `CI_DISPATCH_TOKEN` in `belegfluss` / `appreleaser` löschen.
3. PATs auf [GitHub → Settings → Developer settings](https://github.com/settings/personal-access-tokens) widerrufen.
4. `.github/workflows/test.yml` aus den privaten Repos entfernen.
5. `universal-ci-runner.yml` aus dem Playground entfernen oder deaktivieren (der Fork kann geschlossen werden).
