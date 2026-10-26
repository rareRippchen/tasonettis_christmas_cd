# Tastonettis – Weihnachts-CD

Statische Landingpage für die Weihnachts-CD der Tastonettis: Logo, Weihnachtsgruß, Albumcover, Streaming-Links und Impressum. Beim Laden liegt die ganze Seite unter einer Schneedecke: Wer sie mit dem Finger (oder der Maus) freischiebt, baut dabei einen Schneemann. Ab etwa der Hälfte rutscht der Rest ab, und der fertige Schneemann steht unten auf der Seite. Oben rechts lässt sich der Schnee auch überspringen.

**Easter Egg:** Schüttelt man das Handy, schneit es wie in einer Schneekugel (`js/snowglobe.js`). Auf dem iPhone fragt iOS nach dem ersten Wischen einmal nach der Erlaubnis für Bewegungsdaten. Die Sensordaten werden nur im Browser ausgewertet und nirgendwohin gesendet.

Aktuell mit dem Platzhalter **„Klavier To Go“** (2017, UPC 4050215330047).

## Lokal ansehen

```sh
python3 -m http.server 8000
# → http://localhost:8000
```

## Anpassen

| Was | Wo |
| --- | --- |
| Tastonettis-Logo | `assets/tastonettis-logo.svg` (von tastonettis.de) |
| Albumcover | Bild nach `assets/` legen und `src` von `.cover` in `index.html` anpassen (derzeit `assets/cover-klavier-to-go.jpg`). |
| CD-Titel / Interpret | `.title` und `.artist` in `index.html` |
| Streaming-Links | `href` der Einträge in `.services` – direkte Album-Links; Amazon Music: Suche, YouTube Music: Kanal |
| Impressum / Datenschutz | Links im `<footer>` (`https://tastonettis.de/impressum.php` und `/datenschutz.php`) |

## DSGVO

Die Seite lädt **nichts von fremden Servern**: die Schrift (Plus Jakarta Sans) liegt unter `assets/fonts/`, alle Bilder und Icons unter `assets/`. Es gibt keine Cookies, kein Tracking und keine eingebetteten Player. Externe Dienste werden nur über normale Links erreicht, also erst, wenn man darauf klickt.

Die Regeln für künftige Änderungen stehen in `CLAUDE.md`. Prüfen lässt sich das mit:

```sh
python3 scripts/check-external.py
```

Die Prüfung läuft auch automatisch als GitHub Action bei jedem Push.

Markenlogos der Streamingdienste stammen aus [Simple Icons](https://simpleicons.org/) (CC0); Amazon Music und Qobuz sind vereinfachte Nachzeichnungen.
