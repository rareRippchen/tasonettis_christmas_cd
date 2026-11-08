(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var root = document.documentElement;

  // Hell/Dunkel nach Systemeinstellung: Flocken auf hellem Grund blaugrau statt weiß.
  var darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
  function flakeRGB() { return darkQuery.matches ? "220, 226, 235" : "150, 168, 192"; }

  /* ---------- Fallender Schnee im Hintergrund ---------- */
  var sky = document.getElementById("snowfall");
  var skyCtx = sky.getContext("2d");
  var flakes = [];

  function resizeSky() {
    sky.width = window.innerWidth * dpr;
    sky.height = window.innerHeight * dpr;
    skyCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var count = Math.round(window.innerWidth * window.innerHeight / 9000);
    flakes = [];
    for (var i = 0; i < count; i++) flakes.push(newFlake(true));
  }

  function newFlake(anywhere) {
    return {
      x: Math.random() * window.innerWidth,
      y: anywhere ? Math.random() * window.innerHeight : -5,
      r: Math.random() * 1.8 + 0.6,
      speed: Math.random() * 0.6 + 0.25,
      drift: Math.random() * Math.PI * 2,
      alpha: Math.random() * 0.5 + 0.3
    };
  }

  function drawSky() {
    skyCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    var rgb = flakeRGB();
    for (var i = 0; i < flakes.length; i++) {
      var f = flakes[i];
      if (!reduceMotion) {
        f.drift += 0.01;
        f.y += f.speed;
        f.x += Math.sin(f.drift) * 0.3;
        if (f.y > window.innerHeight + 5) flakes[i] = f = newFlake(false);
      }
      skyCtx.beginPath();
      skyCtx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      skyCtx.fillStyle = "rgba(" + rgb + "," + f.alpha + ")";
      skyCtx.fill();
    }
  }

  /* ---------- Schneedecke über der ganzen Seite ---------- */
  var cover = document.getElementById("snowcover");
  var layer = document.getElementById("snowlayer");
  var layerCtx = layer.getContext("2d");
  var hint = document.getElementById("snow-hint");
  var skip = document.getElementById("snow-skip");

  var REVEAL_AT = 0.5;   // ab diesem freigeschobenen Anteil rutscht der Rest ab

  var W = 0, H = 0;
  var lastPoint = null;
  var measurePending = false;
  var covered = true;

  // Tatsächlich sichtbare Höhe (ohne Browserleisten).
  function visibleHeight() {
    var vv = window.visualViewport;
    return Math.min(H, vv ? vv.height : window.innerHeight);
  }

  function brushRadius() {
    return Math.max(26, Math.min(48, Math.min(W, visibleHeight()) * 0.075));
  }

  function sizeCanvases(keepSnow) {
    var old = null;
    if (keepSnow && layer.width && layer.height) {
      old = document.createElement("canvas");
      old.width = layer.width;
      old.height = layer.height;
      old.getContext("2d").drawImage(layer, 0, 0);
    }
    // Maße vom Element selbst: Es ist bewusst höher als das Fenster (siehe CSS).
    W = cover.clientWidth;
    H = cover.clientHeight;
    layer.width = Math.round(W * dpr);
    layer.height = Math.round(H * dpr);
    layerCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (old) {
      layerCtx.drawImage(old, 0, 0, W, H);
    } else {
      paintSnow();
    }
  }

  // Dichte Schneedecke: Verlauf, weiche Verwehungen und Glitzer.
  function paintSnow() {
    layerCtx.globalCompositeOperation = "source-over";
    var grad = layerCtx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "#fbfdff");
    grad.addColorStop(1, "#e3eaf3");
    layerCtx.fillStyle = grad;
    layerCtx.fillRect(0, 0, W, H);

    var drifts = Math.round(W * H / 14000);
    for (var i = 0; i < drifts; i++) {
      var x = Math.random() * W, y = Math.random() * H;
      var r = 40 + Math.random() * 120;
      var g = layerCtx.createRadialGradient(x, y - r * 0.3, 0, x, y, r);
      g.addColorStop(0, "rgba(255, 255, 255, .7)");
      g.addColorStop(0.7, "rgba(235, 241, 248, .25)");
      g.addColorStop(1, "rgba(200, 214, 230, 0)");
      layerCtx.fillStyle = g;
      layerCtx.beginPath();
      layerCtx.ellipse(x, y, r * 1.6, r, 0, 0, Math.PI * 2);
      layerCtx.fill();
    }

    var sparkles = Math.round(W * H / 600);
    for (var j = 0; j < sparkles; j++) {
      layerCtx.fillStyle = Math.random() < 0.5 ? "rgba(170, 190, 215, .55)" : "rgba(255, 255, 255, .9)";
      layerCtx.fillRect(Math.random() * W, Math.random() * H, 1.4, 1.4);
    }
  }

  // Ein Stempel: weich wegschieben, am Rand bleibt ein leichter Schneewall.
  function stamp(x, y, r) {
    layerCtx.globalCompositeOperation = "destination-out";
    var g = layerCtx.createRadialGradient(x, y, r * 0.55, x, y, r);
    g.addColorStop(0, "rgba(0, 0, 0, 1)");
    g.addColorStop(1, "rgba(0, 0, 0, 0)");
    layerCtx.fillStyle = g;
    layerCtx.beginPath();
    layerCtx.arc(x, y, r, 0, Math.PI * 2);
    layerCtx.fill();

    // Schattenkante nur dort, wo noch Schnee liegt.
    layerCtx.globalCompositeOperation = "source-atop";
    var edge = layerCtx.createRadialGradient(x, y, r * 0.9, x, y, r * 1.35);
    edge.addColorStop(0, "rgba(120, 145, 180, 0)");
    edge.addColorStop(0.3, "rgba(120, 145, 180, .07)");
    edge.addColorStop(1, "rgba(120, 145, 180, 0)");
    layerCtx.fillStyle = edge;
    layerCtx.beginPath();
    layerCtx.arc(x, y, r * 1.35, 0, Math.PI * 2);
    layerCtx.fill();
    layerCtx.globalCompositeOperation = "source-over";
  }

  function push(x, y) {
    var r = brushRadius();
    if (lastPoint) {
      var dx = x - lastPoint.x, dy = y - lastPoint.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      var steps = Math.max(1, Math.ceil(dist / (r * 0.35)));
      for (var i = 1; i <= steps; i++) {
        stamp(lastPoint.x + dx * i / steps, lastPoint.y + dy * i / steps, r);
      }
    } else {
      stamp(x, y, r);
    }
    lastPoint = { x: x, y: y };
    hint.classList.add("gone");
    scheduleMeasure();
  }

  function scheduleMeasure() {
    if (measurePending) return;
    measurePending = true;
    setTimeout(function () {
      measurePending = false;
      measure();
    }, 150);
  }

  // Grob abtasten, wie viel der sichtbaren Fläche schon frei ist.
  function measure() {
    if (!covered) return;
    var rows = Math.min(layer.height, Math.round(visibleHeight() * dpr));
    var data = layerCtx.getImageData(0, 0, layer.width, rows).data;
    var step = Math.round(14 * dpr), total = 0, free = 0;
    for (var y = 0; y < rows; y += step) {
      for (var x = 0; x < layer.width; x += step) {
        total++;
        if (data[(y * layer.width + x) * 4 + 3] < 60) free++;
      }
    }
    var cleared = total ? free / total : 0;
    if (cleared >= REVEAL_AT) reveal();
  }

  function point(e) {
    var rect = cover.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  cover.addEventListener("pointerdown", function (e) {
    if (e.target === skip) return;
    cover.setPointerCapture(e.pointerId);
    lastPoint = null;
    var p = point(e);
    push(p.x, p.y);
  });
  cover.addEventListener("pointermove", function (e) {
    if (e.buttons === 0) return;
    var p = point(e);
    push(p.x, p.y);
  });
  cover.addEventListener("pointerup", function () { lastPoint = null; });
  cover.addEventListener("pointercancel", function () { lastPoint = null; });

  skip.addEventListener("click", reveal);

  // Rest der Schneedecke abrutschen lassen.
  function reveal() {
    if (!covered) return;
    covered = false;
    var finish = function () {
      root.classList.remove("snowed");
      syncThemeColor();
      cover.remove();
    };
    cover.classList.add("melting");
    if (reduceMotion) finish();
    else setTimeout(finish, 1200);
  }

  /* ---------- Schleife ---------- */
  function frame() {
    drawSky();
    requestAnimationFrame(frame);
  }

  var resizeTimer;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      resizeSky();
      if (cover.isConnected && (cover.clientWidth !== W || cover.clientHeight !== H)) sizeCanvases(true);
    }, 150);
  }
  window.addEventListener("resize", onResize);
  // iOS: Leisten ein-/ausfahren ändert nur den visualViewport.
  if (window.visualViewport) window.visualViewport.addEventListener("resize", onResize);

  // Browserleiste: schneefarben solange Schnee liegt, danach Seitenhintergrund (hell/dunkel).
  function syncThemeColor() {
    var theme = document.getElementById("theme-color");
    if (!theme || root.classList.contains("snowed")) return;
    theme.setAttribute("content", getComputedStyle(document.body).backgroundColor);
  }
  if (darkQuery.addEventListener) darkQuery.addEventListener("change", syncThemeColor);

  resizeSky();
  sizeCanvases(false);
  cover.classList.add("ready");
  frame();
})();
