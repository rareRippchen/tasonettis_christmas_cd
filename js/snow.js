(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var root = document.documentElement;

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
      skyCtx.fillStyle = "rgba(220, 226, 235," + f.alpha + ")";
      skyCtx.fill();
    }
  }

  /* ---------- Schneemann (wird an zwei Stellen gezeichnet) ---------- */

  // shown: 0..5 – Unterkugel, Mittelkugel, Kopf, Gesicht+Arme, Mütze+Schal.
  function drawSnowman(ctx, cx, ground, s, shown) {
    function grow(v) { return Math.max(0, Math.min(1, v)); }
    function dot(x, y, r, color) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    function ball(x, y, r) {
      var g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
      g.addColorStop(0, "#ffffff");
      g.addColorStop(1, "#cbd7e4");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(120, 140, 165, .35)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    if (shown <= 0.001) return;
    var r1 = 34 * s, r2 = 25 * s, r3 = 18 * s;
    var g1 = grow(shown), g2 = grow(shown - 1), g3 = grow(shown - 2);
    var g4 = grow(shown - 3), g5 = grow(shown - 4);

    // Schatten
    ctx.fillStyle = "rgba(60, 80, 110, .18)";
    ctx.beginPath();
    ctx.ellipse(cx, ground, r1 * 1.1 * g1, 6 * s * g1, 0, 0, Math.PI * 2);
    ctx.fill();

    var y1 = ground - r1 * g1;
    if (g1 > 0) ball(cx, y1, r1 * g1);
    var y2 = y1 - r1 * 0.8 - r2 * 0.8;
    if (g2 > 0) ball(cx, y2, r2 * g2);
    var y3 = y2 - r2 * 0.8 - r3 * 0.8;
    if (g3 > 0) ball(cx, y3, r3 * g3);

    if (g4 > 0) {
      ctx.globalAlpha = g4;
      dot(cx - 6 * s, y3 - 4 * s, 2.2 * s, "#1b1e24");
      dot(cx + 6 * s, y3 - 4 * s, 2.2 * s, "#1b1e24");
      dot(cx, y2 - 8 * s, 2.6 * s, "#1b1e24");
      dot(cx, y2 + 2 * s, 2.6 * s, "#1b1e24");
      dot(cx, y2 + 12 * s, 2.6 * s, "#1b1e24");
      ctx.fillStyle = "#f28c28";
      ctx.beginPath();
      ctx.moveTo(cx, y3 + 1 * s);
      ctx.lineTo(cx + 15 * s, y3 + 4 * s);
      ctx.lineTo(cx, y3 + 5 * s);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#6b4a2b";
      ctx.lineWidth = 2.5 * s;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(cx - r2 * 0.9, y2);
      ctx.lineTo(cx - r2 * 2.1, y2 - 16 * s);
      ctx.moveTo(cx - r2 * 1.7, y2 - 11 * s);
      ctx.lineTo(cx - r2 * 1.9, y2 - 20 * s);
      ctx.moveTo(cx + r2 * 0.9, y2);
      ctx.lineTo(cx + r2 * 2.1, y2 - 16 * s);
      ctx.moveTo(cx + r2 * 1.7, y2 - 11 * s);
      ctx.lineTo(cx + r2 * 1.9, y2 - 20 * s);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    if (g5 > 0) {
      ctx.globalAlpha = g5;
      // Rote Mütze mit Bommel
      ctx.fillStyle = "#e3141b";
      ctx.beginPath();
      ctx.moveTo(cx - r3 * 1.0, y3 - r3 * 0.55);
      ctx.quadraticCurveTo(cx, y3 - r3 * 2.6, cx + r3 * 1.3, y3 - r3 * 1.7);
      ctx.lineTo(cx + r3 * 1.0, y3 - r3 * 0.55);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(cx - r3 * 1.05, y3 - r3 * 0.75, r3 * 2.1, r3 * 0.35);
      dot(cx + r3 * 1.3, y3 - r3 * 1.7, 4 * s, "#ffffff");
      // Schal
      ctx.fillStyle = "#e3141b";
      ctx.fillRect(cx - r3 * 0.95, y3 + r3 * 0.6, r3 * 1.9, 6 * s);
      ctx.fillRect(cx + r3 * 0.3, y3 + r3 * 0.6, 6 * s, 18 * s);
      ctx.globalAlpha = 1;
    }
  }

  /* ---------- Schneedecke über der ganzen Seite ---------- */
  var cover = document.getElementById("snowcover");
  var layer = document.getElementById("snowlayer");
  var layerCtx = layer.getContext("2d");
  var manCanvas = document.getElementById("snowman");
  var manCtx = manCanvas.getContext("2d");
  var hint = document.getElementById("snow-hint");
  var skip = document.getElementById("snow-skip");

  var STAGES = [0.06, 0.15, 0.25, 0.36, 0.47]; // freigeschobener Anteil je Bauschritt
  var REVEAL_AT = 0.5;                          // ab hier rutscht der Rest ab

  var W = 0, H = 0;
  var stage = 0;      // erreichter Bauschritt 0..5
  var shown = 0;      // animierter Wert für weiches Wachsen
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
    [layer, manCanvas].forEach(function (c) {
      c.width = Math.round(W * dpr);
      c.height = Math.round(H * dpr);
    });
    layerCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    manCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
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
    var s = 0;
    while (s < STAGES.length && cleared >= STAGES[s]) s++;
    if (s > stage) stage = s;
    if (reduceMotion) shown = stage;
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

  skip.addEventListener("click", function () {
    stage = STAGES.length;
    reveal();
  });

  // Rest der Schneedecke abrutschen lassen, Schneemann wandert ans Seitenende.
  function reveal() {
    if (!covered) return;
    covered = false;
    stage = STAGES.length;
    var finish = function () {
      root.classList.remove("snowed");
      var theme = document.getElementById("theme-color");
      if (theme) theme.setAttribute("content", "#141820");
      cover.remove();
      showFinalSnowman();
    };
    // Kurz warten, damit man die Mütze noch aufgesetzt sieht.
    setTimeout(function () {
      cover.classList.add("melting");
      if (reduceMotion) finish();
      else setTimeout(finish, 1200);
    }, reduceMotion ? 0 : 700);
  }

  function showFinalSnowman() {
    var slot = document.getElementById("snowman-slot");
    var c = document.getElementById("snowman-final");
    var w = 160, h = 170;
    c.width = w * dpr;
    c.height = h * dpr;
    var ctx = c.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawSnowman(ctx, w / 2, h - 10, 1, STAGES.length);
    slot.hidden = false;
  }

  function drawCoverSnowman() {
    manCtx.clearRect(0, 0, W, H);
    var vh = visibleHeight();
    var s = Math.max(0.9, Math.min(1.6, Math.min(W, vh) / 360));
    // Abstand nach unten: iOS legt Leisten über den Seitenrand.
    drawSnowman(manCtx, W / 2, vh - Math.max(28 * s, vh * 0.12), s, shown);
  }

  /* ---------- Schleife ---------- */
  function frame() {
    drawSky();
    if (covered || cover.isConnected) {
      if (shown < stage) shown = Math.min(stage, shown + 0.05);
      drawCoverSnowman();
    }
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

  resizeSky();
  sizeCanvases(false);
  cover.classList.add("ready");
  frame();
})();
