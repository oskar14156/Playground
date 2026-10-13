# 📖 Universeller CI-Runner: Kostenlose GitHub Actions für private Repositories

Dieses System ermöglicht es, automatisierte Tests für **beliebige private Repositories** über dieses öffentliche Repository (`oskar14156/Playground`) auszuführen.

### Warum das funktioniert:
1. **0 private Minuten verbraucht (100% kostenlos):** GitHub Actions stellt für **öffentliche Repositories** unbegrenzte kostenlose Standard-Runner-Minuten bereit. Da der Workflow im öffentlichen Playground startet und abläuft, werden **keine privaten Minuten** berechnet.
2. **Volle Vertraulichkeit:** Der Runner lädt den privaten Code temporär in einen isolierten Ordner auf der virtuellen Maschine (`ubuntu-latest`). Der Code wird **niemals** in das Git-Verzeichnis übernommen, **niemals** gepusht und **niemals** als Build-Artefakt hochgeladen. Am Ende jedes Laufs (`if: always()`) wird der Code restlos gelöscht (`rm -rf`).
3. **Keine künstlichen Begrenzer:**
   - Funktioniert mit **beliebig vielen Repositories**.
   - Unterstützt **beliebig viele Tests** (keine 20-Test-Grenze).
   - Beliebige Testbefehle: Node.js, TypeScript, Python (pytest), Rust (cargo), Shell-Skripte oder maßgeschneiderte Testdateien von KI-Agenten.

---

## 🛠️ Einmalige Einrichtung

### 1. GitHub Token (PAT)
Damit der öffentliche Runner das private Repository auschecken kann, benötigt er ein Personal Access Token (Fine-grained PAT oder Classic) mit Leserechten (`Contents: Read-only`):
1. Öffne: [GitHub Settings → Developer Settings → Personal access tokens](https://github.com/settings/tokens?type=beta)
2. Klicke auf **Generate new token**.
3. **Repository access:** Wähle *Only select repositories* (z. B. `oskar14156/belegfluss` und künftige Repositories des Professors).
4. **Permissions:** Setze unter *Repository permissions* **Contents: Read-only**.
5. Token kopieren.

### 2. Secret in Playground hinterlegen
1. Öffne: [Playground → Settings → Secrets and variables → Actions](https://github.com/oskar14156/Playground/settings/secrets/actions)
2. Klicke auf **New repository secret**.
3. Name: `CI_BRIDGE_READ_TOKEN`
4. Value: Dein kopiertes PAT einfügen und speichern.
*(Hinweis: Für diesen Account ist das Secret bereits aktiv hinterlegt!)*

---

## 🚀 Einen Test selbst ausführen (Ohne KI)

Du oder der Professor können Tests jederzeit manuell über das Web-Interface oder über das Terminal starten.

### Methode 1: Über das GitHub Web-Interface (im Browser)
1. Öffne im Browser: [Playground → Actions](https://github.com/oskar14156/Playground/actions)
2. Wähle in der linken Seitenleiste: **Universal CI Runner - Free Actions for Private Repos**
3. Klicke rechts auf den Button **Run workflow**.
4. Trage die Parameter ein:
   - **repository:** `oskar14156/belegfluss` (oder das Repo des Professors)
   - **ref:** `main` (oder Branch wie `ci/probe-reusable-20`)
   - **test_command:** z. B. `npm test` oder `node --experimental-strip-types --test 'src/utils/dateSwap.test.ts'`
   - **install_command:** `auto` (oder `none`)
5. Klicke auf den grünen Button **Run workflow**.
6. Klicke nach wenigen Sekunden auf den gestarteten Lauf, um Live-Logs und das Step Summary zu sehen.

### Methode 2: Über das Terminal mit GitHub CLI (`gh`)
```bash
# Beliebige Tests ausführen
gh workflow run universal-ci-runner.yml \
  --repo oskar14156/Playground \
  -f repository="oskar14156/belegfluss" \
  -f ref="main" \
  -f test_command="npm test"

# Live-Status und Logs ansehen
gh run list --repo oskar14156/Playground --workflow=universal-ci-runner.yml --limit 1
```

---

## 🤖 Wie KI-Agenten das System nutzen

KI-Agenten (z. B. ChatGPT, Claude, Cursor, Antigravity) können im privaten Repository eigenständig Tests schreiben und diese über den Playground-Runner validieren.

### Typischer Ablauf eines KI-Agenten:
1. **Test schreiben:** Der KI-Agent erstellt im privaten Projekt z. B. eine Testdatei `src/agent.test.ts`.
2. **Pushen:** Der Agent committet und pusht die Datei in einen Branch (z. B. `agent-tests`).
3. **Trigger:** Der Agent führt im Terminal den Befehl aus:
   ```bash
   gh workflow run universal-ci-runner.yml \
     --repo oskar14156/Playground \
     -f repository="oskar14156/mein-privates-repo" \
     -f ref="agent-tests" \
     -f test_command="npm test -- src/agent.test.ts"
   ```
4. **Ergebnis lesen:** Der Agent liest mit `gh run view` die Ergebnisse aus, behebt Fehler im privaten Repo und wiederholt den Lauf – **ohne jemals das private Minuten-Kontingent anzurühren**.

### Kopierbarer Prompt für KI-Agenten:
```text
Du arbeitest in einem privaten Repository. Bitte befolge für alle Tests folgende Regel:
Führe keine Tests direkt auf privaten GitHub Actions Runnern aus, da dies kostenpflichtige private Minuten verbraucht.
Nutze stattdessen den universellen CI-Runner im öffentlichen Repository oskar14156/Playground.
Befehl zum Ausführen:
gh workflow run universal-ci-runner.yml --repo oskar14156/Playground -f repository="<OWNER/REPO>" -f ref="<BRANCH>" -f test_command="<TEST_BEFEHL>"
Lies die Ergebnisse anschließend mit `gh run list --repo oskar14156/Playground --workflow=universal-ci-runner.yml --limit 1` aus.
Der Runner lädt den Code temporär in den Speicher, testet ihn und löscht ihn danach vollständig.
```
