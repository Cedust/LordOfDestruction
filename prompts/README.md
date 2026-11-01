# Image Generation Workflow

Claude schreibt die Prompts, ChatGPT erzeugt daraus die Bilder, Timo gibt sie frei. Diese Datei ist die verbindliche Arbeitsanweisung für alle drei.

## Rollen

| Rolle | Aufgaben | Darf diese Status setzen |
|---|---|---|
| Claude (Prompt Engineer) | Prompts schreiben und pflegen, Stil konsistent halten, Prompts im Repo ablegen | `draft`, `ready` |
| ChatGPT (Image Generation Operator) | Prompts mit Status `ready` unverändert verwenden, Bilder erzeugen, technisch und visuell prüfen, ablegen, Ergebnisse protokollieren, Probleme melden | `generating`, `review`, zurück auf `ready` |
| Timo (Freigabe) | Bilder im Status `review` abnehmen oder ablehnen | `approved`, `rejected` |

## Struktur

```
prompts/<kategorie>/<asset_id>.md   eine Datei pro Asset (YAML-Frontmatter + Prompt)
assets/<kategorie>/<datei>.png      fertige Bilder, Pfad steht im Feld output
assets/references/                  Stilvorlagen für reference_images (werden nicht ins Spiel gepackt)
generation-log/manifest.json        Status-Verlauf und Generierungsprotokoll aller Assets
scripts/validate_asset.py           technische Prüfung eines Bildes gegen seine Prompt-Datei
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
- `## Acceptance checks`: die visuellen Prüfungen für jedes erzeugte Bild.
- `## Changelog`: jede Änderung am Prompt mit Revision und Datum.

## 1. Prompt-Integrität

Der Prompt wird unverändert übergeben. Für ChatGPT gilt verbindlich:

- Als Bild-Prompt wird ausschließlich der Abschnitt `## Prompt` verwendet, exakt und vollständig, vom ersten Zeichen nach der Überschrift bis vor `## Acceptance checks`.
- Keine Umformulierung, Kürzung, Zusammenfassung oder Übersetzung.
- Keine zusätzlichen Beschreibungen oder kreativen Ergänzungen.
- Nichts aus Frontmatter, Acceptance checks, Changelog oder dieser Anleitung in den Bild-Prompt übernehmen.
- Ist `reference_images` leer, werden keine Bilder angehängt, auch keine früheren Bilder aus dem Chat.
- Referenzbilder werden ausschließlich aus den angegebenen Repository-Pfaden geladen, nie aus dem Chatverlauf oder anderen Quellen.

Vor jeder Generierung protokolliert ChatGPT Prompt-Datei, `revision` und Branch beziehungsweise Commit, von dem gelesen wurde, und vergleicht den übergebenen Text mit dem Abschnitt `## Prompt`.

Ist eine unveränderte Übergabe nicht möglich (zum Beispiel weil das Werkzeug den Text kürzt oder umschreibt), wird nicht generiert. Das Problem wird gemeldet und im Manifest mit `"result": "failed"` eingetragen.

## 2. Generierung

ChatGPT darf:

- den freigegebenen Prompt verwenden,
- Bilder generieren,
- Ergebnisse prüfen,
- fehlerhafte Ergebnisse verwerfen und neu generieren. Mehrere Versuche sind normal.

ChatGPT darf nicht:

- den Prompt eigenständig verbessern oder fehlende Details ergänzen,
- Designentscheidungen aus früheren Bildern übernehmen,
- ein Ergebnis, das nicht alle Prüfungen besteht, als fertig deklarieren,
- `approved` oder `rejected` setzen.

Wenn ein Prompt nach mehreren Versuchen nicht zu einem brauchbaren Bild führt, ist das ein Fall für Claude: Problem melden, nicht den Prompt umgehen.

## 3. Prüfung

Jeder Bildkandidat durchläuft zwei getrennte Prüfungen. Erst wenn beide vollständig bestanden sind, darf er abgelegt werden.

### Technische Prüfung (automatisiert)

```
python3 scripts/validate_asset.py <prompt-datei> <kandidat.png> --resize <output-pfad>
```

Das Skript skaliert den Kandidaten auf `final_size`, speichert ihn unter dem `output`-Pfad und prüft:

| Prüfung | Bedeutung |
|---|---|
| `format_ok` | Datei ist ein PNG |
| `final_size_ok` | Abmessungen entsprechen `final_size` |
| `alpha_channel` | PNG hat einen Alpha-Kanal (bei `transparency: true`) |
| `transparency_ok` | echte Transparenz: Ecken voll transparent, mindestens 15 % transparente Fläche; bei `transparency: false` vollständig deckend |
| `checkerboard_suspected` | erkennt ein gemaltes Schachbrettmuster statt echter Transparenz |
| `content_ok` | das Bild ist nicht leer |
| `output_path_valid`, `output_path_matches` | Pfad liegt unter `assets/<category>/`, passt zur Kategorie und entspricht exakt `output` |

Das Skript braucht nur Pillow (in ChatGPTs Python-Umgebung vorhanden), gibt das Ergebnis als JSON aus und endet mit Exit-Code 0 (bestanden) oder 1 (nicht bestanden). Das JSON wird unverändert als `validation.technical` ins Manifest übernommen.

### Visuelle Prüfung (manuell durch ChatGPT)

- Jeder Eintrag unter `## Acceptance checks` wird einzeln geprüft und mit `passed` und kurzer Begründung festgehalten.
- Jeder Check ist verpflichtend. Ein einziger nicht bestandener Check verwirft den Kandidaten.
- Es gibt keine Freigabe bei teilweise bestandenen Checks.
- Ein Check gilt nur als bestanden, wenn er tatsächlich am Bild geprüft wurde. Nicht prüfbare Checks gelten als nicht bestanden.
- Für jeden neuen Kandidaten wird die komplette Prüfung wiederholt.

## 4. Status

```
draft ──(Claude)──▶ ready ──(ChatGPT)──▶ generating ──(ChatGPT)──▶ review ──(Timo)──▶ approved
                      ▲                       │                       │
                      └──── endgültig ────────┘                       └──(Timo)──▶ rejected ──(Claude überarbeitet)──▶ ready
                            gescheitert
```

- `draft`: noch nicht freigegeben. Nicht generieren.
- `ready`: freigegeben. Darf generiert werden.
- `generating`: ChatGPT arbeitet daran. Verworfene Kandidaten ändern den Status nicht, sie werden nur im Manifest gezählt.
- `review`: Das Bild liegt unter `output`, hat technische und visuelle Prüfung bestanden und wartet auf Timos Abnahme.
- `approved`: von Timo abgenommen. Wird nie automatisch neu eingeplant.
- `rejected`: von Timo abgelehnt. Grund in `history`. Claude überarbeitet den Prompt, erhöht `revision` und setzt wieder `ready`.

Scheitert die Generierung endgültig (Versuche erschöpft, Upload nicht möglich, Prompt nicht unverändert übergebbar), setzt ChatGPT den Status zurück auf `ready` und dokumentiert Fehler und Anzahl der Versuche im Manifest. Ein erfolgreicher Status wird nur eingetragen, wenn die Datei wirklich im Repo liegt.

Der Status in der Prompt-Datei ist maßgeblich, `manifest.json` spiegelt ihn. Beide werden im selben Commit geändert. Nur `status` darf ChatGPT in der Prompt-Datei ändern, sonst nichts.

## 5. Manifest

Jedes Asset hat zwei Listen. Bestehende Einträge werden nie verändert oder gelöscht, nur ergänzt.

- `history`: jede Statusänderung (`date`, `status`, `by`: `claude`, `chatgpt` oder `timo`, `note`).
- `generations`: ein Eintrag pro Generierungslauf, also pro Durchgang von `generating` bis `review` oder zurück auf `ready`.

```json
{
  "datetime": "2026-11-01T22:30:00Z",
  "revision": 3,
  "source": "claude/project-thread-ev1eok@12a2530",
  "attempts": 2,
  "result": "passed",
  "status_after": "review",
  "error": null,
  "rejected_candidates": [
    { "attempt": 1, "reason": "visual: 'No texture or grain' failed, stone texture on armor" }
  ],
  "validation": {
    "technical": { "passed": true, "format": "png", "dimensions": "1024x1024", "alpha_channel": true, "...": "Ausgabe von validate_asset.py" },
    "visual": {
      "passed": true,
      "checks": [
        { "check": "Looks to the right", "passed": true, "note": "body and helmet turned right" }
      ]
    }
  }
}
```

`result` ist `passed` oder `failed`. Bei `failed` steht in `error`, warum der Lauf gescheitert ist, und `validation` enthält die Ergebnisse des letzten Kandidaten.

## 6. Style Anchor und Batches

| Batch | Inhalt | Startet wann |
|---|---|---|
| `01-style-anchor` | Lord | sofort |
| `02-heroes` | Squire, Archer, Cutpurse, Battlemage, Champion | nach Freigabe von Batch 01 |
| `03-environment` | Thronsaal | nach Freigabe von Batch 01 |
| `04-power-icons` | Icons der Gold-Upgrades | nach Freigabe von Batch 01 |
| `05-dread-icons` | Icons der Dread-Upgrades | nach Freigabe von Batch 01 |

- Batch `01-style-anchor` muss vollständig generiert und von Timo `approved` sein, bevor ein anderer Batch startet. Claude setzt die abhängigen Prompts erst danach auf `ready`.
- Für den Lord selbst dient `assets/references/lord_style_reference.png` als Vorlage (von Timo ausgewählt).
- Der freigegebene Lord unter `assets/characters/lord.png` ist die verbindliche Stilreferenz für alle folgenden Assets.
- Diese Referenz darf nicht eigenständig durch ein anderes Bild ersetzt werden, auch nicht durch einen besseren Kandidaten.
- Innerhalb eines Batches werden die Assets nacheinander erzeugt. Jedes Asset bekommt seinen eigenen Lauf und Manifest-Eintrag.

## Vor jeder Generierung (Checkliste für ChatGPT)

1. Steht `status` wirklich auf `ready`?
2. Ist der Abschnitt `## Prompt` vollständig (Stil, Motiv, Komposition, Perspektive, Transparenz, Größe)?
3. Existieren alle Dateien aus `reference_images` im Repo?
4. Ist der Batch freigegeben (Batch 01 `approved`, falls es nicht Batch 01 ist)?
5. Ist `output` ein gültiger Pfad unter `assets/` und existiert dort noch keine Datei?
6. Kann der Prompt unverändert übergeben werden?

Scheitert eine Prüfung: nicht generieren, im Manifest eintragen und melden.

## Regeln

1. Jede `asset_id` ist eindeutig.
2. Jeder Prompt ist für sich verständlich und verweist nicht auf andere Prompts.
3. Referenzbilder werden immer mit Repo-Pfad angegeben.
4. Stil, Transparenz, Format, Perspektive, Komposition und Größe stehen in jedem Prompt.
5. `output` ist exakt der Pfad, den das Spiel erwartet. Asset-Pfade werden nicht umbenannt.
6. Bestehende Prompts werden nicht ohne Rücksprache mit Timo geändert. Änderungen erhöhen `revision` und stehen im Changelog.
7. Assets mit Status `approved` werden nie automatisch neu eingeplant.
8. Die Manifest-Historie wird nur ergänzt, nie umgeschrieben.

## Gemeinsame Stilvorgaben

Alle Prompts verwenden denselben Stilabsatz: einfache, saubere 2D-Cartoon-Grafik, große flache Farbflächen mit höchstens einem weichen Schattenton, dicke gleichmäßige Outlines, keine Textur, sehr wenige Details, weiche gedämpfte Farben, kompakte Proportionen. Lord und Thronsaal sind dunkel, die Helden haben hellere Rollenfarben. Der Lord schaut nach rechts, alle Helden nach links. Icons sitzen alle auf demselben runden Badge.
