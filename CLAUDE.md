# Tastonettis – Weihnachts-CD

Statische Landingpage (HTML/CSS/JS, kein Build-Schritt).

## DSGVO – verbindlich für alle Änderungen

- **Alle Ressourcen kommen vom eigenen Webserver.** Schriften, Bilder, Icons, Skripte, Stylesheets, Videos usw. werden ins Repo gelegt (`assets/`, `css/`, `js/`) und relativ eingebunden.
- **Verboten:** Google Fonts, CDNs (jsDelivr, cdnjs, unpkg …), eingebettete Player/iframes (YouTube, Spotify …), Analytics/Tracking-Pixel, Social-Media-Widgets, externe Favicons, `preconnect`/`dns-prefetch` zu fremden Hosts.
- **Keine Cookies, kein `localStorage`/`sessionStorage`**, keine Formulare, die Daten an Dritte senden.
- **Erlaubt:** normale Links (`<a href>`) auf externe Seiten (Streamingdienste, Impressum, Datenschutz) – sie werden erst beim Klick aufgerufen. Externe Links mit `rel="noopener"`.
- Neue Schriften über Fontsource (`npm pack @fontsource/<name>`) als `.woff2` nach `assets/fonts/` kopieren, in `css/fonts.css` per `@font-face` einbinden, Lizenzdatei mitlegen.
- Fremde Logos/Grafiken als lokale Datei ablegen, nie direkt verlinken.
- Impressum **und** Datenschutzerklärung müssen im Footer verlinkt bleiben.

Vor jedem Commit ausführen (läuft auch als GitHub Action):

```sh
python3 scripts/check-external.py
```
