# Tastonettis – Weihnachts-CD

Statische Landingpage für die Weihnachts-CD der Tastonettis: Logo, Weihnachtsgruß, Albumcover, Streaming-Links und Impressum. Im unteren Bereich kann man Schnee wegwischen und damit einen Schneemann bauen.

Aktuell mit dem Platzhalter **„Klavier To Go“**.

## Lokal ansehen

```sh
python3 -m http.server 8000
# → http://localhost:8000
```

## Anpassen

| Was | Wo |
| --- | --- |
| Tastonettis-Logo | Datei als `assets/tastonettis-logo.png` ablegen. Solange sie fehlt, wird der Schriftzug angezeigt. |
| Albumcover | Bild nach `assets/` legen und `src` von `.cover` in `index.html` anpassen. |
| CD-Titel / Interpret | `.title` und `.artist` in `index.html` |
| Streaming-Links | `href` der Einträge in `.services` (derzeit Such-Links als Platzhalter) |
| Impressum | Link im `<footer>` (derzeit `https://tastonettis.de/impressum`) |

Markenlogos der Streamingdienste stammen aus [Simple Icons](https://simpleicons.org/) (CC0); Amazon Music und Qobuz sind vereinfachte Nachzeichnungen.
