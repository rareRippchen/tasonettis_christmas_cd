#!/usr/bin/env python3
"""Cache-Busting: hängt an CSS/JS-Verweise in index.html einen Inhalts-Fingerabdruck (?v=…).

Ändert sich eine Datei, ändert sich ihre Adresse – Browser laden sie dann sicher neu,
statt eine veraltete Version aus dem Cache mit neuem HTML zu kombinieren.

  python3 scripts/asset-versions.py          # Versionen in index.html aktualisieren
  python3 scripts/asset-versions.py --check  # nur prüfen (Exit-Code 1, wenn veraltet)
"""
import hashlib
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
HTML = ROOT / "index.html"
REF = re.compile(r'((?:href|src)=")((?:css|js)/[^"?#]+\.(?:css|js))(?:\?v=[^"]*)?(")')


def fingerprint(rel):
    return hashlib.sha256((ROOT / rel).read_bytes()).hexdigest()[:10]


def main():
    check = "--check" in sys.argv
    text = HTML.read_text(encoding="utf-8")
    updated = REF.sub(lambda m: f"{m.group(1)}{m.group(2)}?v={fingerprint(m.group(2))}{m.group(3)}", text)

    if updated == text:
        print("OK: Versionen der CSS/JS-Dateien sind aktuell.")
        return 0
    if check:
        print("Veraltete Versionen in index.html – bitte ausführen: python3 scripts/asset-versions.py")
        return 1
    HTML.write_text(updated, encoding="utf-8")
    print("index.html: Versionen der CSS/JS-Dateien aktualisiert.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
