#!/usr/bin/env python3
"""Cache-Busting: hängt an CSS/JS-Verweise in allen HTML-Seiten (index.html, wartung/*.html, …)
einen Inhalts-Fingerabdruck an (?v=…). Pfade werden relativ zur jeweiligen Seite aufgelöst.

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
SKIP_DIRS = {".git", "node_modules", "scripts", ".github"}
PAGES = sorted(p for p in ROOT.rglob("*.html") if not SKIP_DIRS.intersection(p.relative_to(ROOT).parts))
REF = re.compile(r'((?:href|src)=")((?:css|js)/[^"?#]+\.(?:css|js))(?:\?v=[^"]*)?(")')


def fingerprint(page, rel):
    return hashlib.sha256((page.parent / rel).read_bytes()).hexdigest()[:10]


def main():
    check = "--check" in sys.argv
    stale = []
    for page in PAGES:
        text = page.read_text(encoding="utf-8")
        updated = REF.sub(lambda m: f"{m.group(1)}{m.group(2)}?v={fingerprint(page, m.group(2))}{m.group(3)}", text)
        if updated == text:
            continue
        stale.append(str(page.relative_to(ROOT)))
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
