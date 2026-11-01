# Image Generation Workflow

Claude schreibt die Prompts, ChatGPT erzeugt daraus die Bilder. Diese Datei ist die verbindliche Arbeitsanweisung für beide.

## Rollen

| Rolle | Aufgaben | Darf diese Status setzen |
|---|---|---|
| Claude (Prompt Engineer) | Prompts schreiben und pflegen, Stil konsistent halten, Prompts im Repo ablegen | `draft`, `ready` |
| ChatGPT (Image Generation Operator) | Prompts mit Status `ready` lesen, Bilder erzeugen, prüfen, ablegen, Status pflegen, Probleme melden | `generating`, `review`, `approved`, `rejected` |

## Struktur

```
prompts/<kategorie>/<asset_id>.md   eine Datei pro Asset (YAML-Frontmatter + Prompt)
assets/<kategorie>/<datei>.png      fertige Bilder, Pfad steht im Feld output
generation-log/manifest.json        Übersicht und Verlauf aller Assets
```

Kategorien: `characters`, `enemies`, `equipment`, `icons`, `ui`, `environments`.

Das Spiel lädt jedes PNG unter `assets/` automatisch beim Build. Fehlt ein Bild, zeigt es weiter den Platzhalter. Die Dateinamen in `output` sind deshalb fest und dürfen nicht abweichen.

## Prompt-Datei

```yaml
---
asset_id: enemy_squire          # eindeutig im ganzen Repo
name: Squire
category: enemies
type: character_sprite
batch: 02-heroes                # Gruppe, die nacheinander erzeugt wird
status: draft
revision: 1                     # steigt bei jeder inhaltlichen Prompt-Änderung
output: assets/enemies/squire.png
format: png
transparency: true
aspect_ratio: "1:1"
generation_size: 1024x1024      # Größe, in der erzeugt wird
final_size: 512x512             # Größe, in der die Datei abgelegt wird
reference_images:
  - assets/characters/lord.png
---
```

Darunter folgen drei Abschnitte:

- `## Prompt`: der vollständige Text für die Bildgenerierung. Nur dieser Abschnitt wird an den Bildgenerator gegeben.
- `## Acceptance checks`: woran das Ergebnis nach der Generierung geprüft wird.
- `## Changelog`: jede Änderung am Prompt mit Revision und Datum.

## Status

```
draft → ready → generating → review → approved
                                   ↘ rejected → (Claude überarbeitet) → ready
```

- `draft`: noch nicht freigegeben. Nicht generieren.
- `ready`: freigegeben. Darf generiert werden.
- `generating`: ChatGPT arbeitet daran.
- `review`: Bild liegt im Repo und wartet auf Timos Abnahme.
- `approved`: abgenommen. Wird nie automatisch neu eingeplant.
- `rejected`: nicht brauchbar. Grund in `manifest.json` vermerken. Claude überarbeitet den Prompt, erhöht `revision` und setzt wieder `ready`.

Der Status in der Prompt-Datei ist maßgeblich, `manifest.json` spiegelt ihn und hält den Verlauf fest. Beide werden im selben Commit geändert.

## Ablauf für ChatGPT

Vor der Generierung prüfen:

1. Steht `status` wirklich auf `ready`?
2. Ist der Prompt vollständig (Stil, Motiv, Komposition, Perspektive, Transparenz, Größe)?
3. Existieren alle Dateien aus `reference_images` im Repo?
4. Ist `output` ein gültiger Pfad unter `assets/` und existiert dort noch keine Datei?

Wenn eine Prüfung scheitert: nicht generieren, Problem im Manifest eintragen und melden.

Generierung:

1. Status auf `generating` setzen.
2. Referenzbilder anhängen und den Abschnitt `## Prompt` verwenden.
3. In `generation_size` erzeugen, danach auf `final_size` verkleinern.
4. Ergebnis gegen `## Acceptance checks` und die technischen Vorgaben prüfen, besonders echte Transparenz (kein gemaltes Schachbrettmuster) und die Blickrichtung.
5. Bild unter `output` ablegen und Status auf `review` setzen.

Schlägt Generierung oder Upload fehl, bleibt der Status auf `ready` und im Manifest wird ein Eintrag mit `"result": "failed"` und dem Grund ergänzt. Ein erfolgreicher Status wird nur eingetragen, wenn die Datei wirklich im Repo liegt.

## Manifest-Eintrag

```json
{
  "asset_id": "enemy_squire",
  "prompt": "prompts/enemies/enemy_squire.md",
  "output": "assets/enemies/squire.png",
  "batch": "02-heroes",
  "status": "draft",
  "revision": 1,
  "history": [
    { "date": "2026-11-01", "status": "draft", "by": "claude", "note": "created" }
  ]
}
```

Jede Statusänderung hängt einen Eintrag an `history` an (`by`: `claude`, `chatgpt` oder `timo`). Bei Fehlschlägen zusätzlich `"result": "failed"` und `note` mit dem Grund.

## Regeln

1. Jede `asset_id` ist eindeutig.
2. Jeder Prompt ist für sich verständlich und verweist nicht auf andere Prompts.
3. Referenzbilder werden immer mit Repo-Pfad angegeben.
4. Stil, Transparenz, Format, Perspektive, Komposition und Größe stehen in jedem Prompt.
5. `output` ist exakt der Pfad, den das Spiel erwartet.
6. Bestehende Prompts werden nicht ohne Rücksprache mit Timo überschrieben. Änderungen erhöhen `revision` und stehen im Changelog.
7. Assets mit Status `approved` werden nie automatisch neu eingeplant.

## Batches

| Batch | Inhalt | Hinweis |
|---|---|---|
| `01-style-anchor` | Lord | Legt den Stil fest. Alle anderen Prompts nutzen ihn als Referenzbild. |
| `02-heroes` | Squire, Archer, Cutpurse, Battlemage, Champion | `ready`, sobald der Lord `approved` ist |
| `03-environment` | Thronsaal | `ready`, sobald der Lord `approved` ist |
| `04-power-icons` | Icons der Gold-Upgrades | `ready`, sobald der Lord `approved` ist |
| `05-dread-icons` | Icons der Dread-Upgrades | `ready`, sobald der Lord `approved` ist |

## Gemeinsame Stilvorgaben

Alle Prompts verwenden denselben Stilabsatz: cartoony, gemalt, flache Farben mit weichem Cel-Shading, dicke dunkle Outlines, kräftige einfache Formen, leicht Dark Fantasy. Lord und Thronsaal sind dunkel (Lila, Schwarz, Knochenweiß, Glut-Orange), die Helden haben hellere Rollenfarben. Der Lord schaut nach rechts, alle Helden nach links. Icons sitzen alle auf demselben runden lila Badge mit Glut-Rand.
