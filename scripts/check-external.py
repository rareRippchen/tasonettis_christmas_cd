#!/usr/bin/env python3
"""DSGVO-Prüfung: Findet Ressourcen, die von fremden Servern geladen würden.

Alles, was der Browser beim Aufruf der Seite automatisch lädt (Schriften, Bilder,
Skripte, Stylesheets, iframes, Videos, …), muss vom eigenen Webserver kommen.
Normale Links (<a href>), die erst beim Anklicken aufgerufen werden, sind erlaubt.

Aufruf: python3 scripts/check-external.py   (Exit-Code 1 bei Funden)
"""
import pathlib
import re
import sys
from html.parser import HTMLParser

ROOT = pathlib.Path(__file__).resolve().parent.parent
SKIP_DIRS = {".git", "node_modules", "scripts", ".github"}
EXTERNAL = re.compile(r"^\s*(?:https?:)?//", re.I)

# Attribute, über die der Browser automatisch Inhalte lädt.
LOADING_ATTRS = {"src", "srcset", "poster", "data", "background", "action", "formaction"}


class Checker(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.path = path
        self.problems = []
        self.in_style = False

    def report(self, what):
        line, _ = self.getpos()
        self.problems.append(f"{self.path}:{line}: {what}")

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        for name, value in attrs.items():
            if value is None:
                continue
            if name in LOADING_ATTRS:
                urls = [part.strip().split(" ")[0] for part in value.split(",")] if name == "srcset" else [value]
                for url in urls:
                    if EXTERNAL.match(url):
                        self.report(f"<{tag} {name}=\"{url}\"> lädt von extern")
            if name == "style":
                for problem in css_problems(value):
                    self.report(f"style-Attribut: {problem}")
        # <link> lädt je nach rel (stylesheet, icon, preload, preconnect, dns-prefetch …).
        if tag == "link" and EXTERNAL.match(attrs.get("href") or ""):
            self.report(f"<link rel=\"{attrs.get('rel')}\" href=\"{attrs['href']}\"> lädt von extern")
        if tag == "style":
            self.in_style = True

    def handle_endtag(self, tag):
        if tag == "style":
            self.in_style = False

    def handle_data(self, data):
        if self.in_style:
            for problem in css_problems(data):
                self.report(problem)


def css_problems(text):
    found = []
    for url in re.findall(r"url\(\s*['\"]?([^'\")]+)", text, re.I):
        if EXTERNAL.match(url):
            found.append(f"url({url}) lädt von extern")
    for url in re.findall(r"@import\s+(?:url\()?\s*['\"]?([^'\")\s;]+)", text, re.I):
        if EXTERNAL.match(url):
            found.append(f"@import {url} lädt von extern")
    return found


def js_problems(text):
    # Jede absolute http(s)-URL in Skripten ist verdächtig (fetch, Image, import, …).
    return [f"URL {url} im Skript" for url in re.findall(r"""['"`]((?:https?:)?//[^'"`\s]+)""", text)]


def files():
    for path in sorted(ROOT.rglob("*")):
        if path.is_file() and not SKIP_DIRS.intersection(path.relative_to(ROOT).parts):
            yield path


def main():
    problems = []
    for path in files():
        rel = path.relative_to(ROOT)
        suffix = path.suffix.lower()
        if suffix not in {".html", ".htm", ".css", ".js", ".mjs", ".svg"}:
            continue
        text = path.read_text(encoding="utf-8", errors="replace")
        if suffix in {".html", ".htm"}:
            checker = Checker(rel)
            checker.feed(text)
            problems += checker.problems
        elif suffix == ".css":
            problems += [f"{rel}: {p}" for p in css_problems(text)]
        elif suffix in {".js", ".mjs"}:
            problems += [f"{rel}: {p}" for p in js_problems(text)]
        elif suffix == ".svg":
            # Namespaces wie xmlns="http://www.w3.org/2000/svg" sind keine Ladevorgänge.
            for url in re.findall(r"""(?:href|src)\s*=\s*['"]((?:https?:)?//[^'"]+)""", text):
                problems.append(f"{rel}: {url} lädt von extern")
            problems += [f"{rel}: {p}" for p in css_problems(text)]

    if problems:
        print("Externe Ressourcen gefunden – bitte lokal ablegen (DSGVO):")
        print("\n".join(f"  {p}" for p in problems))
        return 1
    print("OK: Alle Ressourcen werden vom eigenen Webserver geladen.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
