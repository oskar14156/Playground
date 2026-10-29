# HANDOFF — MotionShorts / „You Build a Vacuum Cleaner“ / neuer Pocket Puh
**Stand: 29. Oktober 2026 | Arbeitsstand für den nächsten Chat/Agenten**

> **VOR ALLEM LESEN:** Der Nutzer ist mit der Bildqualität weiterhin ausdrücklich unzufrieden („schaut ja noch immer schrecklich aus“). Es gibt funktionierende Rendering-Workflows und komplette Low-Quality-Videos, aber **keinen visuell akzeptierten Film**. Nicht von den bisherigen Low-Poly-Modellen ausgehen und nicht noch einmal dieselben primitiven 3D-Grundformen polieren. Der aktuelle Schwerpunkt ist **hochwertige SOURCE-ASSETS (insbesondere ein echter Fursuit-Fuchskopf)**, glaubwürdige PBR-Welten und tatsächlich animierte 3D-Shots. Erst 3–5 geprüfte Hero-Shots, **dann** gesamte Low-Quality-Vorschau. Kein finaler Render oder Upload ohne Freigabe.

## 1. Wichtigste Nutzerfestlegungen (bindend)

1. **Sprache:** Mit dem Nutzer Deutsch sprechen. Skript, Voiceover und Texteinblendungen im Video Englisch. Er will aktives Umsetzen, keine langen Rückfragen, keine erfundenen Erfolgsmeldungen.
2. **Stil:** TikTok/YouTube Shorts/Reels, 9:16, 1080×1920 als finales Ziel, 30 fps, typischerweise ca. **70–85 Sekunden**, unter 90 Sekunden. Premium-cinematic 3D, klare technische Schnittmodelle, räumliche Kamerafahrten, Motion-Graphics-Overlays, Wort-für-Wort-Captions, dramatische präzise Mechanik, absurder Humor und Loop-Ende. Referenzvideos aus dem Chat: **AC-130, U-Boot/Submarine, FedEx-Sortieranlage** sowie die **Elevator**-Folge als Story-Vorlage. Die tatsächlichen Nutzer-Anhänge in der jeweiligen neuen Sitzung bei Bedarf erneut einsehen; bloße Beschreibungen ersetzen nicht das Bild.
3. **Stil der Story:** „You build ...“ — Freund hat absurde Situation, naiver Versuch scheitert; „But ... So you ...“ ergänzt jeweils ein **wirklich funktionierendes technisches Bauteil**. Pointe/Übertreibung klar als Witz markieren; technische Fakten müssen stimmen.
4. **KRITISCHER CANON-WECHSEL:** **„giant pocket puh“ ist ab sofort ein orange-weißer, aufsetzbarer FURRY-/FURSUIT-FUCHSKOPF-HELM**, mit großen Fuchsohren, Schnauze, expressiven Augen, dichtem glaubwürdigem Kunstfell und **sichtbarer Öffnung/Innenpolsterung**, sodass er eindeutig als Kostümkopf zu erkennen ist. Es ist **nicht mehr** das alte blaue Plüschtier und auch kein echter Fuchs oder eine menschliche Figur. Der Nutzer hat das ausdrücklich als neue dauerhafte Pocket-Puh-Figur bestätigt. Der Canon wurde bereits in motionshorts/AGENTS.md §3d festgehalten; ältere AGENTS-/NEXT-/Skript-Passagen über einen blauen Plush sind überholt.
5. **Echtes programmierbares 3D – keine Diashow:** Nutzer hat mehrmals protestiert: „das ist ja generiert nich code“, „das sind ja nur stillframes nicht so remotion motion graphics videos die aktiv was bewegen“. **KEINE KI-generierten Standbilder als vermeintliche 3D-Render**, keine PNG-Slideshow mit Zoom/Pan als fertiges Motion Graphics. Blender für Modellbau, glTF/GLB/PBR, Remotion + Three.js für deterministische Animation von Meshes, echten 3D-Kameras, Rotationen, Fell- und Luftstrombewegung. Vorproduzierte Blender-Filmsequenzen sind nur als tatsächlich animierte 3D-Sequenzen brauchbar, nicht bloße Standframes.
6. **Qualitätskontrolle:** User: „generiere sample frames schau sie dir an verbessere und mach wieder sample frames und wieder ansehen usw im loop bis sie perfekt sind“ und „Bis das fertig ist mach weiter bis die qualität besser ist loope dich bis die qualität on par ist check immer samples“. Darum nach **jeder** wesentlichen Änderung echte Renderframes (gerne pro Shot 8–12 zeitlich aufeinanderfolgende Frames) **selber ansehen**, Fehler konkret benennen, korrigieren und wieder rendern. Keine Freigabe ohne sichtbaren Qualitätsbeleg. Nicht „perfekt“ behaupten, solange es offensichtlich nicht auf Referenzniveau ist.
7. **Render-Infrastruktur:** Der Nutzer hat ausdrücklich autorisiert, über das **öffentliche Repo oskar14156/Playground** mit GitHub Actions kostenlos zu rendern, inkl. Stimme und mehreren Tests. Google Colab ggf. für Voice, falls erforderlich. Schweres Rendering über Workflows, Artefakte anschließend herunterladen und visuell prüfen. GitHub-Runs/Artefakte ersetzen nicht die eigene QA. Bevor final hochauflösend gerendert/veröffentlicht wird, **immer Low-Quality-Vorschau** (`--scale=0.4 --crf=30` oder vergleichbar) und **explizite Freigabe** vom Nutzer.
8. Der Nutzer hat wiederholt „Weiter“ gesagt und will eigenständiges Arbeiten **ohne dauernde Zustimmung zu jedem Zwischenschritt**. Dies autorisiert nicht, einen unfertigen Film als fertig/viral/release-ready auszugeben oder öffentlich hochzuladen.

## 2. Projekt, Repositorys und Branches

- **Kanonisches privates/Quellprojekt:** [oskar14156/motionshorts](https://github.com/oskar14156/motionshorts), Branch `main`. **ZUERST vollständig lesen**: `AGENTS.md` (besonders §0, §3a/§3b/§3d), `.claude/skills/reel-director/SKILL.md`, `.claude/skills/reel-build/SKILL.md`, zugehörige `references/{hooks,story,tension,visual-grammar,storyboard-format}.md`. Beispiel „Elevator“: `videos/elevator/{brief.md,script.txt}`, `src/videos/elevator/{sets.tsx,building.tsx,cues.ts}`.
- **Aktuelles Cloud-Render-/Experimentier-Repo:** [oskar14156/Playground](https://github.com/oskar14156/Playground), aktiver Arbeitsbranch **[vacuum-v2-3d](https://github.com/oskar14156/Playground/tree/vacuum-v2-3d)**. Hier liegen die laufenden Builds, Arbeitsdateien und Workflows. Stand beim Verfassen: Branch-HEAD `7381fe6fd5b1fac4a37c87e367098318a649a8da` (vor diesem Handoff-Commit; danach ändert sich die SHA). `main` ist **nicht** automatisch der Arbeitsstand.
- **WICHTIG:** `motionshorts/NEXT.md` enthielt alte Anweisungen („Submarine als Nächstes“, später „blue plush“). **Elevator Episode 1 und Submarine Episode 2 sind laut Nutzer schon erledigt**. Folge 3 ist das Staubsauger-Video. Alte NEXT-Textstellen bzw. alte blaue Plush-Skripte **nicht als aktuelle Canon übernehmen**.
- Ein Agent mit reinem GitHub-Connector hat nicht automatisch direkten Shell-/Mac-Zugriff. Nutze die vorhandenen GitHub-Actions-Workflows für Node, Blender, TTS, Remotion/ffmpeg. **Niemals behaupten**, lokal auf dem Mac etwas gerendert zu haben, wenn nur ein Remote-Workflow lief.

## 3. Aktuelle Folge: „You Build a Vacuum Cleaner“ — Story

Aktueller englischer Text (neuer Fuchshelm): `Playground/videos/vacuum-cleaner/fox-preview-script.txt`.

**Dramaturgie:**
- Freund kauft einen riesigen Pocket Puh (tragbarer Furry-Fuchshelm). Der Helm verliert massenhaft orange Kunstfell und das Wohnzimmer versinkt darin. Besen funktioniert nicht.
- Lüfter/Impeller erzeugt einen Druckunterschied, Schlauch saugt Fell an, aber schießt es hinten heraus.
- Versiegelter Staubbehälter + erster Filter. Problem: Filter verstopft.
- Zyklon als Vorabscheider: Rotation trennt größere Fussel, Feinstaub wird nachgelagert gefiltert.
- Feinfilter/saubere Abluft.
- Rotierende Bürstenwalze löst tief im Teppich festsitzendes Fell.
- Blockierter Schlauch/Motorüberhitzung → thermische Abschaltung.
- Finale: Raum ist endlich sauber, aber der riesige **Fuchshelm fehlt**. Blick in transparenten Behälter → seine Fuchsaugen sehen heraus; Freund: **“You cleaned the wrong thing.”** Absurd, bewusst keine physikalisch plausible Saugkraft.
- Seamless loop outro. 70–85s in der aktuellen animierten Fassung ca. 72,8s; Voice English. Nicht noch einmal U-Boot oder eine neue Idee erfinden.

## 4. Relevante vorhandene Implementierungen

**Bereits gerenderte / vorhandene Varianten (nicht als final akzeptiert):**
- `src/videos/vacuum3d/Vacuum3DLab.tsx`: ganz frühe reine Three.js-Low-Poly-Demo mit simplen Möbeln und Technik; verwerfen, nicht weiter aufpolieren.
- `blender/vacuum_hero.py`: mehrteilige Maschine mit Zyklon, Motor, impeller, filter und Bürstenwalze. Mehrere echte Cycles-Stills; Stand als Produktstudie nicht hochwertig genug.
- `blender/vacuum_story_samples.py`: naive Wohnzimmer-, Fell- und Schlussgag-Szene. Geändert, damit Fox statt Blue-Plush, mehrere Kameras; wirkt cartoonhaft.
- `blender/fox_helmet_sample.py`: Aufsetz-Fuchshelm als Blender-Code, Vorder-/Dreiviertel-/Rückansicht. Echtes offenes Helm-Innere, aber ungeeignete primitive/trianguläre Gesichtsformen. **Nicht als endgültiges Charaktermodell verwenden.**
- `src/videos/vacuum3d/VacuumFoxFullPreview.tsx`: komplette **Standbild-/Pan-Version** mit Voice; **vom Nutzer ausdrücklich abgelehnt**, da keine echte aktive 3D-Animation.
- `src/videos/vacuum3d/VacuumActive3D.tsx`: vollständiges per Frame animiertes Three.js-Reel (bewegte Kamera, Partikel, Impeller, Bürste). Technisch echtes 3D, optisch weiterhin Low-Poly. Der bessere Zyklon-/Filterteil wurde später eingehängt.
- `src/videos/vacuum3d/VacuumPremiumCyclone.tsx`: **beste technische Mechanik-Probe bisher**; lädt echten Blender-vacuum_body.glb, dynamische Luftpartikel, Ringschrauben, Impeller, Filter, Exploded View, drei 3D-Kameraphasen. Dennoch nicht auf Referenzniveau.
- `src/videos/vacuum3d/VacuumFoxRoomCinematic.tsx`: Blender-GLB-Zimmer plus vorhandener Fuchshelm, bewegte 3D-Kamera, Fellpartikel. Visuelle Schwäche bleibt.
- `src/vacuum-quality-entry.tsx`, `src/vacuum-room-quality-entry.tsx`, `src/Root.tsx`: jeweils registrierte Remotion-Kompositionen.
- **Letzter ernsthafter Modellersatz:** `scripts/polyhaven_asset.py` (CC0-Poly-Haven-glTF mit PBR-Texturen und MD5-Checks), `blender/fox_pbr_living_room_hero.py` (importiert `sofa_02`, früheren Fuchs-GLB, Blender/Cycles-Render, hat auch Haar-Groom-Versuche), `.github/workflows/vacuum-pbr-assets.yml`. Real texturiertes Couch-Modell ist besser; **Fuchshelm bleibt katastrophal**.
- `videos/vacuum-cleaner/blender-review-log.md`, `videos/vacuum-cleaner/active3d-qa-2026-10-28.md`, `videos/vacuum-cleaner/QUALITY_REBUILD_REQUIRED_2026-10-28.md` dokumentieren einzelne QA-Runden und eindeutige Ablehnungen. **Diese Dateien unbedingt lesen**, bevor Fehler wiederholt werden.

**Noch nicht vollständig robust:** Workflows ziehen zum Teil GLBs oder VO aus alten **GitHub Actions-Artefakten mit nur 7 Tagen Aufbewahrung**. Künftigen reproduzierbaren Asset-Build sicherstellen, damit Tests nicht plötzlich wegen abgelaufener Run-Artefakte scheitern. Manche automatischen Branch-Workflows sind alt und schlagen nach Änderungen aus irrelevanten Gründen fehl; sauber isolierte Entry-Points/TS-Checks bevorzugen.

## 5. Belegte GitHub-Runs / zeitlicher Projektverlauf

Die folgenden IDs sind konkrete GitHub-Actions-Läufe im öffentlichen Playground-Repo (`https://github.com/oskar14156/Playground/actions/runs/<ID>`):

| Phase | Run-ID(s) | Ergebnis / Befund |
| --- | --- | --- |
| Erste echte Three.js-Blockouts | 40704525832 | 5 Stills + kurze Kamerafahrt; formal echtes 3D, visuell primitive Möbel und schlechter Motor |
| Blender-Maschinen-Lookdev Runden 1–4 | 40708454431, 40709088615, 40709812432, 40710755828 | 3 Ansichten je Runde, verbesserte Bürste und Zyklon; trotzdem Produktprototyp |
| Blender Zyklon-Motion-Kontaktbögen | 40712067234, 40713013472 | Bewegung zuerst kaum sichtbar, danach stärkerer 3D-Kameraorbit/Partikel |
| Wohnzimmer / Fell / Pointe | 40717776571, 40718386631, 40719046060, 40719560480 | Hierarchie-, Kamera- und Beleuchtungsfehler behoben, aber billiger Cartoon-Look |
| Fox-Fursuit-Helm | 40741987894, 40742397385, 40742755079 | Echte aufsetzbare 3D-Fuchsmaske mit Rücköffnung; äußerlich weiterhin cartoonhaft |
| Erste volle 72,9s Preview | **40744763890** | Animierte PNG-Stills + TTS + Captions, 432×768; Nutzer **lehnt Standbild-Panning ab** |
| Erste echte Three.js-Motion-Proben | 40756050927, 40756874789 | Rotierende 3D-Objekte und Partikel, aber übergroße bunte Brocken/primitive Mechanik |
| Erste vollständige echte 3D-Animation | **40756575346** | Erfolgreiche **72,8s, 30fps, 324×576**, englische VO; Bildqualität **abgelehnt** |
| Besserer Blender-GLB-Zyklon + Kameraregie | 40761423071, 40761860192, 40762241659, 40762565609, 40762906332 | Mehrere 3D-Proben, Fehler bei Filter/Crop/Exploded View korrigiert |
| Beste 5s technische Animation | **40763494510** | Echtes per Frame gerendertes 3D, erfolgreich, nicht final freigegeben |
| Gesamte Preview V2 mit besserem Zyklon | **40763518607** | **Erfolgreich abgeschlossen** (nicht „läuft noch“!), technisch echte 3D-Integration, visuell weiterhin **nicht akzeptiert** |
| Blender-GLB-Fuchs/Room-Bewegung | **40764603537** | Erfolgreich abgeschlossen, Modellqualität weiterhin nicht auf Zielniveau |
| Erster PBR-/Sofa-Asset-Ersatz | 40774222729, 40774697608 | Reales texturiertes Sofa, zunächst falsche Ausrichtung; danach korrigiert |
| Cycles-Hair-Groom-Test | **40775165985** | 17.000 Emit-Haare + children, aber starre Igel-Stacheln auf schlechtem Kopfmodell; **abgelehnt** |
| Letzter aktueller 3D-PBR-Test | **40864014799 (29.10.2026)** | **Erfolgreich abgeschlossen**, CC0 Poly Haven `sofa_02` inkl. normal/albedo/ARM-Texturen via Downloader, drei echte Cycles-Frames. Qualität des Sofas besser, Fuchshelm **weiterhin unbrauchbar**. Artefakt `vacuum-quality-real-cc0-pbr-model-comparison` |

**Letzter bei Berichtserstellung verifizierter Branch-Stand:** Commit `7381fe6` vor dem Handoff, letzter relevanter erfolgreicher Run **40864014799**; kein laufender neuer PBR-Render behauptet. In der Folgesitzung Status **neu** prüfen.

## 6. Objektive Gründe für die Qualitätsprobleme

- **Fox-Maske**: Ursprungsmesh basiert auf simplen Kugeln/Zylindern und dreieckigen Ohren; große aufgesetzte Augen, kaum authentische Silhouette, kein glaubwürdig genähtes/glatt verarbeitetes Fursuit-Gesicht. Extra orange Haare auf dieser Basis ergeben orange Stacheln, **kein glaubwürdiges Kunstfell**.
- **Wohnzimmer**: Frühere Möbel sind Boxen, flache Materialien, leere Wände und unpassende Kameras; PBR-Sofa verbessert nur ein Objekt, nicht das restliche Interior. Umgebungsdetails, Reflektionen, Schatten, Maßstab und Tiefe fehlen.
- **Staubsauger**: Frühe Motoren/Behälter sahen aus wie graue Ringe, Kegel und Röhren; der Zuschauer erkennt Funktion/Airflow nicht. Auch beste Cutaway-Version benötigt High-Poly-Gehäuse, echte Schächte, plausible mechanische Teile und detailreiche Materialien.
- **Animation**: Kein Rendering von Standbildern mit künstlichen Zooms. Luft/Fell muss **pro Frame nachvollziehbar** durch echte Maschinengeometrie wandern; Bürste muss Teppich wirklich berühren, keine irreführenden Partikelteleports. Mehr Partikel ≠ bessere Qualität.
- **Kameras / Bildaufbau**: Statische Perspektiven, schlechtes Framing, abgeschnittene Mechanik, übergroße Labels und zu dunkle/überbelichtete Shots. Vermeide Wände über dem Set, schwarze Deckenlücken, False Transparency, verdeckte Mechanik und schlecht lesbare Captions.
- **Schnitt / Rhythmus**: Unterschiede zwischen wide / technical cutaway / close / punchline in ca. 1.5–3s Beat-Wechseln; nicht 70 Sekunden mit den gleichen 3 Kameras.

Der Nutzer hat jeden kosmetischen Iterationsweg weiterhin abgelehnt; **nicht erneut behaupten, Qualitätsbenchmark sei erreicht, nur weil CI grün ist**.

## 7. Asset-Strategie, Lizenzen und offene Kandidaten

**Erfolgreich eingebunden:**
- **Poly Haven** `sofa_02`: https://polyhaven.com/a/sofa_02 — CC0 (kommerziell verwendbar). Workflow lädt glTF plus benötigte Texturen, verifiziert Hashes und exportiert 3 Cycles-Ansichten. Weiter mit echten PBR-Requisiten und ggf. HDRIs von Poly Haven. Lizenzquellen in CREDITS dokumentieren.
- `vacuum_body.glb`, `room.glb`, `fox_helmet.glb` aus früherem Playground-Lite-Modellbuild/Actions-Artefakt (Run 40752972311). Gerade `fox_helmet.glb` ist **inhaltlich nicht als finales Modell tauglich**.

**Noch NICHT heruntergeladen / nicht getestet:**
- Sketchfab **CC BY** „Fursuit base kemono fox 3D print“ — https://sketchfab.com/3d-models/fursuit-base-kemono-fox-3d-print-015d8f28b7bf4c03baede4f0a6ca619d . Angeblich ca. 323k Tris, als **mögliche Basis** für tragbaren Fox-Helm. Download kann Auth erfordern. **Verfügbarkeit, reale Meshqualität und Lizenz direkt erneut prüfen, bevor man diesen Kandidaten als Lösung bezeichnet.** CC BY benötigt korrektes Attribution-/Lizenzmanagement.
- Sketchfab CC BY Dyson-Mesh: https://sketchfab.com/3d-models/upright-dyson-vacuum-cleaner-26354cd6800744289bc1754cab8dbd4b . Bloße Außenhülle reicht **nicht** für funktionalen Cutaway; außerdem kommerzielle Marken-/Design-Aspekte prüfen.

**Nie** ohne erlaubte Lizenz Drittmodelle kopieren/redistribuieren. Kein Screenshot oder AI-Illustration als falsches 3D-Modell ausgeben.

## 8. Was der nächste Agent KONKRET tun soll (Reihenfolge, keine Rückfrageschleife)

**Ziel ist nicht noch ein langer Text, sondern ein besseres sichtbares Ergebnis.**

1. **Start & Status:** AGENTS.md/Skills/Elevator-Referenz/alle drei QA-Dokumente lesen; aktiven Playground-Branch HEAD und Runs erneut abfragen. Die alten 7-Tage-Artefakte ggf. sichern oder Builds reproduzieren.
2. **Erst das Fursuit-Quellmodell austauschen:** Das bisherige orange Kugel-/EVA-Mesh nicht weiter feinjustieren. Rechtlich verfügbares detailliertes Fox-Fursuit-Base-Mesh finden (Sketchfab-CC-BY-Kandidat prüfen, ggf. alternatives CC0/CC BY) oder wirklich neu korrekt sculpten. **Echte tragbare Helmschale, aufsetzbare Neck-Öffnung, Innenfutter, Symmetrie, Gesicht, Schnauze, Augenhöhlen, textile Fur-Groom**. Kein Igel-Fell. 3 unabhängige Ansichten vorne/¾/hinten rendern, sehen, Fehler beheben; nicht akzeptieren, wenn wie Karnevalsplastik.
3. **Premium-Raum und Requisiten:** CC0-PBR-Raum mit mehreren real modellierten Gegenständen, plausibler Möblierung, Beleuchtung und Texturen aufbauen; Poly Haven `sofa_02` ist Anfang, nicht fertiges Set. Nicht wieder simplen Sofa-Boxblock ergänzen. Zwei separate Framing-Checks: Weitwinkel voller Raum und glaubwürdige nah gefilmte Fox-Maske.
4. **Mechanische Hero-Shots:** Vorhandenen `VacuumPremiumCyclone.tsx` als **funktionale Animationsbasis** nutzen, echte hochwertige 3D-Außenhülle, Schlauch, Ansaugwege, Filter, Brush-Roller und funktionale Querschnitte ergänzen. Kontrollieren, ob das Publikum bei jeder „But / So“-Aussage das Teil und seine Wirkung versteht.
5. **Bewegung/QA:** Für jeden Hauptshot wenigstens 8–12 echte Frames aus einer **zeitlich veränderlichen 3D-Szene** rendern; als Bogen selbst ansehen, konkrete Fehler beheben und wieder rendern. Prüfen auf Parallaxe, Schnitt, harte Kanten, überzeichnetes Fur, falsche Mechanik, T-Posen, Clipping, Lesbarkeit, fehlende Wand/Decke und TTS-Cues. Nach jeder Runde objektiv entscheiden: Verbesserung oder noch nicht.
6. **Erst nach starken Samples** alle Shots mit vorhandenem englischen 70–85s-Skript, Voiceover, sound design und Captions zur kompletten 9:16 Low-Quality-MP4 komponieren. Render über Playground GitHub Actions, Voice bei Bedarf Chatterbox/Colab (bisher Edge TTS wurde für technische Probe genutzt), Länge/Clipping/Audiosynchronität prüfen. **User Preview zeigen und Freigabe einholen**. Keine finale Veröffentlichung vorher.
7. **Dokumentation:** Commit in passendem Branch; README/CREDITS/Lizenz, getestete Run-ID, Modellquelle, Bildfehler und QA-Fix nach jeder Iteration notieren. Keine Secrets in Repository/Logs, keine falschen Erfolgsbehauptungen.

**Definition of Done (für visuelle Freigabe, nicht nur grüne CI):** Fursuit wirkt aus Front/Seite/Hinten wie ein echtes aufsetzbares Fell-Kostümteil; Wohnzimmer ist detailliert und realistisch; Mechanik sieht herstellergerecht aus und erklärt realen Luftweg; echte kontinuierliche 3D-Animation bei 30 fps; komplexe Kamerafahrten ohne Clipping/Flicker; Captions und englisches Voiceover synchron; 3–5 hochwertige Hero-Shots und Frame-Sequenzen eigenständig kritisch geprüft; vollständige Low-Quality-Preview vom Nutzer akzeptiert. **Derzeit: NICHT erreicht.**

## 9. Spezifische Links zum sofortigen Einstieg

- **Playground Arbeitsbranch:** https://github.com/oskar14156/Playground/tree/vacuum-v2-3d
- **Letzter erfolgreicher PBR-Test (29.10.):** https://github.com/oskar14156/Playground/actions/runs/40864014799
- **Letzte vollständige echte 3D-Preview V2:** https://github.com/oskar14156/Playground/actions/runs/40763518607
- **5-Sekunden-Zyklon-Qualitätsprobe:** https://github.com/oskar14156/Playground/actions/runs/40763494510
- **Fuchs-Room-Animationsprobe:** https://github.com/oskar14156/Playground/actions/runs/40764603537
- **Detaillierte Fehleranalyse des letzten Asset-Rebuilds:** https://github.com/oskar14156/Playground/blob/vacuum-v2-3d/videos/vacuum-cleaner/QUALITY_REBUILD_REQUIRED_2026-10-28.md
- **Mechanische Frame-QA:** https://github.com/oskar14156/Playground/blob/vacuum-v2-3d/videos/vacuum-cleaner/active3d-qa-2026-10-28.md
- **Fuchs + Sofa Blender-Test:** https://github.com/oskar14156/Playground/blob/vacuum-v2-3d/blender/fox_pbr_living_room_hero.py
- **Kanonische Instructions:** https://github.com/oskar14156/motionshorts/blob/main/AGENTS.md

## 10. Fertiger Prompt für einen neuen Chat (kann so eingefügt werden)

> Setze mein Projekt **oskar14156/motionshorts** / **oskar14156/Playground** nahtlos fort. Lies zuerst den vollständigen Handoff-Report `docs/HANDOFF_MOTIONSHORTS_VACUUM_FOX_2026-10-29.md` auf dem Playground-Branch `vacuum-v2-3d`, dann motionshorts/AGENTS.md, Reel-Director/Build-Skills, alle QA-Reports, Referenzen und aktuellen Code. **Pocket Puh ist ab jetzt der tragbare, orange-weiße Furry-Fuchshelm, nicht mehr das blaue Plüschtier.** Folge 3 „You Build a Vacuum Cleaner“ wurde bereits als englisches 72,8s-Video technisch gerendert, jedoch ist die Bildqualität von mir mehrfach abgelehnt worden. Es sollen **echte 3D-Animationen** im Stil meiner AC-130-/FedEx-/U-Boot-Referenzclips entstehen, KEINE PNG-Zooms, KI-Standbilder oder Low-Poly-Prototypen. Aktuelle größte Blocker: neues hochwertiges Fursuit-Helmmodell, besseres PBR-Wohnzimmer und echter Maschinen-Cutaway. Zuletzt erfolgreicher Asset-Test Run 40864014799. **Arbeite selbstständig an echtem Code und renderbaren hochwertigen Modellen**, nutze GitHub Actions in Playground, teste pro Änderung 3–5 Frames und 8–12 Motion-Frames, schau dir jedes Resultat an, verbessere es und wiederhole bis sichtbar auf Referenzniveau. Halte die gesamte Arbeit im Repository fest. Vollständige Low-Quality-Preview vor jedem finalen Render; nichts veröffentlichen ohne meine Freigabe. Sprich Deutsch, Film Englisch. **Frag mich nicht erneut nach bereits geklärten Details; starte konkret bei der Ablösung des schlechten Fox-Helm-Quellmodells.**

---
*Verfasst auf Basis des bisherigen Gesprächs, der im Repo vorhandenen QA-Reports und der am 29.10.2026 abgefragten GitHub-Actions-/Branch-Stände. Dies ist ein nachvollziehbarer Arbeits- und Entscheidungshandoff, **kein wortgetreues vollständiges Chat-Transkript**. Alle Run-IDs sind nachprüfbar; ältere Artefakte können nach Ablauf der Aufbewahrungsfrist verschwinden.*
