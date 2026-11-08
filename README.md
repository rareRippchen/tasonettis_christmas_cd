# Tastonettis – Weihnachts-CD

Statische Landingpage für die Weihnachts-CD der Tastonettis: Logo, Weihnachtsgruß, Albumcover, Streaming-Links und Impressum. Beim Laden liegt die ganze Seite unter einer Schneedecke: Man schiebt sie mit dem Finger (oder der Maus) frei; ab etwa der Hälfte rutscht der Rest ab. Oben rechts lässt sich der Schnee auch überspringen.

**Easter Egg:** Das Handy ist eine Schneekugel (`js/snowglobe.js`): Schütteln wirbelt Schnee auf, er sinkt immer dorthin, wo bei der aktuellen Haltung unten ist (auch kopfüber und quer), sammelt sich am Rand und schmilzt nach einer Weile. Auf dem iPhone fragt iOS nach dem ersten Wischen einmal nach der Erlaubnis für Bewegungsdaten. Die Sensordaten werden nur im Browser ausgewertet und nirgendwohin gesendet.

Aktuell mit dem Platzhalter **„Klavier To Go“** (2017, UPC 4050215330047).

## Wartungsseite (bis Weihnachten)

`wartung.html` ist die Wartungsseite „Musik-Baustelle“ mit Countdown bis zur Veröffentlichung der neuen CD (Titel und Songs noch geheim; **keine** Weihnachts-CD). Zum Testen liegt sie als eigene Datei neben `index.html`.

- Termin: `data-release` am Countdown in `wartung.html` (derzeit `2026-12-24T00:00:00+01:00`) und das angezeigte Datum darunter.
- Ist der Termin erreicht, ersetzt die Meldung „Die neue CD ist da!“ den Countdown.
- Dateien: `css/wartung.css`, `js/countdown.js`, Bild `assets/musik-baustelle.webp`.

## Design: hell & dunkel

Beide Seiten übernehmen Farben und Schriften der neuen Tastonettis-Website (Rot `#ed1c24`, Systemschrift, Überschriften in `ui-rounded`) und wechseln automatisch zwischen hellem und dunklem Design – je nach Systemeinstellung (`prefers-color-scheme`). Die Farben stehen als Variablen oben in `css/style.css` bzw. `css/wartung.css`.

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

Die Seite lädt **nichts von fremden Servern**: Es werden die Systemschriften des Geräts genutzt (wie auf der neuen Tastonettis-Website), alle Bilder und Icons liegen unter `assets/`. Es gibt keine Cookies, kein Tracking und keine eingebetteten Player. Externe Dienste werden nur über normale Links erreicht, also erst, wenn man darauf klickt.

Die Regeln für künftige Änderungen stehen in `CLAUDE.md`. Prüfen lässt sich das mit:

```sh
python3 scripts/check-external.py
```

Die Prüfung läuft auch automatisch als GitHub Action bei jedem Push.

Markenlogos der Streamingdienste stammen aus [Simple Icons](https://simpleicons.org/) (CC0); Amazon Music und Qobuz sind vereinfachte Nachzeichnungen.
