# motionshorts

Gesichtslose 3D-Erklärvideos für TikTok, Reels und Shorts (9:16, 30–45 s), komplett aus Code:
- **Remotion + Three.js:** schnell, Render in ca. 5 min.
- **Blender:** fotorealistisch, Render in ca. 25–50 min.

Dazu kommen KI-Stimme, wortgenaue Untertitel, Sounds und ein nahtloser Loop.

Ein KI-Agent übernimmt die ganze Arbeit: Thema recherchieren, Hooks schreiben, Skript, Stimme, Storyboard, 3D-Szenen bauen, rendern und prüfen. Du entscheidest an den ★-Stellen: welcher Hook, ob das Skript passt, ob die Vorschau passt.

## Was du brauchst

| | |
|---|---|
| Rechner | Mac (Apple Silicon) oder Linux, 16 GB RAM empfohlen, ≥ 10 GB frei |
| Node 18+ | `brew install node` |
| ffmpeg | `brew install ffmpeg` |
| Python 3.12 | `brew install python@3.12` |
| Blender 4.2+ | optional, nur für die fotorealistische Variante: `brew install --cask blender` |
| Ein KI-Agent mit Terminal-Zugriff | **Claude Code**, **Codex** (ChatGPT), Cursor, Gemini CLI … |

Das normale ChatGPT oder Claude im Browser kann nur Skripte schreiben. Zum Rendern braucht es einen Agenten, der auf deinem Rechner Befehle ausführen darf.

## Einrichten (einmalig)

```bash
cd motionshorts
scripts/setup.sh                 # Grundausstattung
scripts/setup.sh --local-voice   # optional: lokale Stimme (Chatterbox, ~3 GB Download)
scripts/doctor.sh                # zeigt, was installiert ist
```

## Stimme: drei Möglichkeiten

| Engine | Qualität | Kosten | Wie |
|---|---|---|---|
| `chatterbox` | sehr natürlich | gratis, läuft lokal (langsam, 16 GB RAM) | `scripts/setup.sh --local-voice` |
| `openai` | sehr natürlich | ein paar Cent pro Video | `export OPENAI_API_KEY=sk-…` (API-Key von platform.openai.com, ist **nicht** das ChatGPT-Abo) |
| `edge` | etwas roboterhaft | gratis | geht sofort |

Wenn keine natürliche Stimme eingerichtet ist, fragt der Agent dich, welche du nehmen willst.

## Benutzen

Öffne den Ordner in deinem Agenten und schreib zum Beispiel:

- **Claude Code:** `claude` im Ordner starten → „Mach ein Video über Vulkane“
- **Codex (ChatGPT):** `codex` im Ordner starten → „Mach ein Video über Vulkane“
- **Cursor:** Ordner öffnen, Agent-Modus → gleiche Nachricht

Der Agent liest `AGENTS.md` bzw. `CLAUDE.md` und arbeitet nach den Anleitungen in
`.claude/skills/`. Brauchbare Anweisungen sind zum Beispiel:
- „Mach ein Video über X“ (er schlägt 5 Hooks vor, du wählst)
- „Mach das in Blender, so realistisch wie möglich“ (du bekommst erst einen 3-Minuten-Entwurf)
- „Die Stimme soll tiefer sein“, „Shot 4 sieht schlecht aus, weil …“

Die fertigen Videos liegen in `out/<name>.mp4`. Eine Live-Vorschau mit Zeitleiste bekommst du mit `npm run dev`.

**Spartipps:**
- Pro Video einen neuen Chat starten.
- Thema und Wunsch-Hook gleich in die erste Nachricht schreiben.
- Den Entwurf selbst anschauen statt den Agenten jedes Bild prüfen zu lassen.

## Beispiele im Repo

`videos/` enthält die Drehbücher und `src/videos/` den Code von 7 fertigen Videos:
- black-box
- titanic
- volcano
- php2shell
- meteors
- coaster-loop
- great-circle

Black Box und Titanic gibt es zusätzlich als Blender-Version (`blender/`).

## Lizenzen

- **Remotion:** gratis für Einzelpersonen und Firmen bis 3 Personen. Größere Firmen brauchen eine Lizenz: https://remotion.dev/license
- **Texturen und Himmel** in `public/textures`: CC0 von Poly Haven.
- **Sounds und Musik:** werden von `scripts/sfx.py` mathematisch erzeugt, ohne fremde Samples.
- **Stimmen:** Klone nur Stimmen, an denen du die Rechte hast, zum Beispiel deine eigene.
