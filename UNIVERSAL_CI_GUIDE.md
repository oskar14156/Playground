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

### Methode C: Proxy-Workflow im privaten Repo (~10 Sekunden private Minuten)

Das private Repository bekommt eine winzige Workflow-Datei, die nur die Tests an den öffentlichen
Runner **delegiert**. So kann alles aus dem privaten Repo heraus gesteuert werden:

**Datei: `.github/workflows/test.yml` (in JEDEM privaten Repository):**

```yaml
name: Run Tests
on:
  workflow_dispatch:
    inputs:
      ref:
        description: 'Branch or SHA to test'
        required: false
        default: ''
      test_command:
        description: 'Test command (default: auto)'
        required: false
        default: 'auto'
      install_command:
        description: 'Install command (default: auto)'
        required: false
        default: 'auto'

permissions:
  contents: read

jobs:
  dispatch:
    runs-on: ubuntu-latest
    timeout-minutes: 1
    steps:
      - name: Delegate to CI pipeline
        env:
          GH_TOKEN: ${{ secrets.CI_DISPATCH_TOKEN }}
        run: |
          REF="${{ inputs.ref }}"
          if [ -z "$REF" ]; then REF="${GITHUB_REF_NAME}"; fi
          gh workflow run universal-ci-runner.yml \
            --repo oskar14156/Playground \
            -f repository="${GITHUB_REPOSITORY}" \
            -f ref="${REF}" \
            -f test_command="${{ inputs.test_command }}" \
            -f install_command="${{ inputs.install_command }}"
```

Einmalig im privaten Repo: Secret `CI_DISPATCH_TOKEN` anlegen (siehe 3.2) und die Datei committen.
Danach startet man Tests im privaten Repo wie gewohnt — die private Minute-Kosten betragen nur
den kurzen Dispatch-Job (~10 s).

Bereits eingerichtet in: `oskar14156/belegfluss`, `oskar14156/appreleaser`.

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
