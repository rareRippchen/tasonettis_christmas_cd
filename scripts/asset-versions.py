#!/usr/bin/env python3
"""Cache-Busting: hängt an CSS/JS-Verweise in allen HTML-Seiten (index.html, wartung.html, …)
einen Inhalts-Fingerabdruck an (?v=…).

Ändert sich eine Datei, ändert sich ihre Adresse – Browser laden sie dann sicher neu,
statt eine veraltete Version aus dem Cache mit neuem HTML zu kombinieren.

  python3 scripts/asset-versions.py          # Versionen in allen HTML-Seiten aktualisieren
  python3 scripts/asset-versions.py --check  # nur prüfen (Exit-Code 1, wenn veraltet)
"""
import hashlib
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGES = sorted(ROOT.glob("*.html"))
REF = re.compile(r'((?:href|src)=")((?:css|js)/[^"?#]+\.(?:css|js))(?:\?v=[^"]*)?(")')


def fingerprint(rel):
    return hashlib.sha256((ROOT / rel).read_bytes()).hexdigest()[:10]


def main():
    check = "--check" in sys.argv
    stale = []
    for page in PAGES:
        text = page.read_text(encoding="utf-8")
        updated = REF.sub(lambda m: f"{m.group(1)}{m.group(2)}?v={fingerprint(m.group(2))}{m.group(3)}", text)
        if updated == text:
            continue
        stale.append(page.name)
        if not check:
            page.write_text(updated, encoding="utf-8")

    if not stale:
        print("OK: Versionen der CSS/JS-Dateien sind aktuell.")
        return 0
    if check:
        print("Veraltete Versionen in " + ", ".join(stale) + " – bitte ausführen: python3 scripts/asset-versions.py")
        return 1
    print(", ".join(stale) + ": Versionen der CSS/JS-Dateien aktualisiert.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
