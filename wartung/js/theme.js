/* Hell/Dunkel-Umschalter.
   Standard ist die Systemeinstellung. Eine manuelle Wahl gilt für diesen Besuch und wird an
   interne Links als ?theme=… weitergegeben – bewusst ohne Cookies oder localStorage (DSGVO). */
(function () {
  "use strict";

  var root = document.documentElement;
  var system = window.matchMedia("(prefers-color-scheme: dark)");
  var param = new URLSearchParams(location.search).get("theme");
  var chosen = param === "dark" || param === "light" ? param : null;

  function current() {
    return chosen || (system.matches ? "dark" : "light");
  }

  // Sofort anwenden (Skript steht im <head>), damit nichts aufblitzt.
  if (chosen) root.setAttribute("data-theme", chosen);

  function syncThemeColor() {
    var color = current() === "dark" ? "#212228" : "#ffffff";
    document.querySelectorAll('meta[name="theme-color"]').forEach(function (m) {
      m.setAttribute("content", color);
      m.removeAttribute("media");
    });
  }

  function syncLinks() {
    document.querySelectorAll("a[data-internal]").forEach(function (a) {
      var url = new URL(a.getAttribute("href"), location.href);
      if (chosen) url.searchParams.set("theme", chosen);
      else url.searchParams.delete("theme");
      a.setAttribute("href", url.pathname.split("/").pop() + url.search + url.hash);
    });
  }

  function syncButton(btn) {
    var dark = current() === "dark";
    btn.setAttribute("aria-pressed", dark ? "true" : "false");
    btn.setAttribute("aria-label", dark ? "Helles Design einschalten" : "Dunkles Design einschalten");
    btn.title = btn.getAttribute("aria-label");
  }

  document.addEventListener("DOMContentLoaded", function () {
    var btn = document.getElementById("theme-toggle");
    if (!btn) return;
    btn.hidden = false;
    syncButton(btn);
    syncLinks();
    if (chosen) syncThemeColor();

    btn.addEventListener("click", function () {
      chosen = current() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", chosen);
      syncButton(btn);
      syncLinks();
      syncThemeColor();
      // Adresse anpassen, damit Neuladen die Wahl behält (ohne neuen Verlaufseintrag).
      var url = new URL(location.href);
      url.searchParams.set("theme", chosen);
      history.replaceState(null, "", url);
    });

    var onSystemChange = function () { if (!chosen) syncButton(btn); };
    if (system.addEventListener) system.addEventListener("change", onSystemChange);
  });
})();
