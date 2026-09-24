(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);

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

  /* ---------- Schneefeld zum Wegwischen ---------- */
  var field = document.getElementById("snowfield");
  var layer = document.getElementById("snowlayer");
  var layerCtx = layer.getContext("2d");
  var manCanvas = document.getElementById("snowman");
  var manCtx = manCanvas.getContext("2d");
  var W = 0, H = 0;
  var progress = 0;       // 0..1, wie viel Schnee weggewischt wurde
  var stage = 0;          // 0..5, Baufortschritt des Schneemanns
  var shown = 0;          // animierter Wert für weiches Wachsen
  var lastPoint = null;
  var measurePending = false;

  function resizeField() {
    var rect = field.getBoundingClientRect();
    W = rect.width;
    H = rect.height;
    [layer, manCanvas].forEach(function (c) {
      c.width = W * dpr;
      c.height = H * dpr;
    });
    layerCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    manCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    fillSnow();
    progress = 0;
    stage = 0;
  }

  // Schneedecke: welliger Hügel aus weißen Kreisen.
  function fillSnow() {
    layerCtx.globalCompositeOperation = "source-over";
    layerCtx.clearRect(0, 0, W, H);
    var grad = layerCtx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(1, "#d9e3ee");
    layerCtx.fillStyle = grad;
    layerCtx.beginPath();
    layerCtx.moveTo(0, H);
    for (var x = 0; x <= W; x += 8) {
      var y = H * 0.18 + Math.sin(x / 38) * 8 + Math.sin(x / 13) * 3;
      layerCtx.lineTo(x, y);
    }
    layerCtx.lineTo(W, H);
    layerCtx.closePath();
    layerCtx.fill();
    // Glitzern
    for (var i = 0; i < W / 4; i++) {
      layerCtx.fillStyle = "rgba(180, 200, 225, .6)";
      layerCtx.fillRect(Math.random() * W, H * 0.3 + Math.random() * H * 0.7, 1.5, 1.5);
    }
  }

  function wipe(x, y) {
    layerCtx.globalCompositeOperation = "destination-out";
    layerCtx.lineCap = "round";
    layerCtx.lineWidth = 34;
    layerCtx.beginPath();
    if (lastPoint) layerCtx.moveTo(lastPoint.x, lastPoint.y);
    else layerCtx.moveTo(x - 0.1, y);
    layerCtx.lineTo(x, y);
    layerCtx.stroke();
    lastPoint = { x: x, y: y };
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

  // Grob abtasten, wie viel Schnee noch liegt.
  function measure() {
    var data = layerCtx.getImageData(0, 0, layer.width, layer.height).data;
    var step = 12 * dpr, total = 0, gone = 0;
    for (var y = Math.floor(layer.height * 0.25); y < layer.height; y += step) {
      for (var x = 0; x < layer.width; x += step) {
        total++;
        if (data[(Math.floor(y) * layer.width + Math.floor(x)) * 4 + 3] < 40) gone++;
      }
    }
    progress = total ? gone / total : 0;
    var thresholds = [0.08, 0.2, 0.34, 0.48, 0.62];
    var s = 0;
    while (s < thresholds.length && progress >= thresholds[s]) s++;
    if (s > stage) stage = s;
    if (reduceMotion) shown = stage;
  }

  function point(e) {
    var rect = layer.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  layer.addEventListener("pointerdown", function (e) {
    layer.setPointerCapture(e.pointerId);
    lastPoint = null;
    var p = point(e);
    wipe(p.x, p.y);
  });
  layer.addEventListener("pointermove", function (e) {
    // Maus wischt beim Drüberfahren, Finger/Stift nur bei Berührung.
    if (e.pointerType !== "mouse" && e.buttons === 0) return;
    var p = point(e);
    wipe(p.x, p.y);
  });
  layer.addEventListener("pointerleave", function () { lastPoint = null; });
  layer.addEventListener("pointerup", function () { lastPoint = null; });

  // Doppeltippen, wenn der Schneemann fertig ist: neuer Schnee.
  layer.addEventListener("dblclick", function () {
    if (stage >= 5) {
      fillSnow();
      progress = 0;
      stage = 0;
      shown = 0;
    }
  });

  /* ---------- Schneemann ---------- */
  function ball(x, y, r) {
    var g = manCtx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
    g.addColorStop(0, "#ffffff");
    g.addColorStop(1, "#cfdae6");
    manCtx.fillStyle = g;
    manCtx.beginPath();
    manCtx.arc(x, y, r, 0, Math.PI * 2);
    manCtx.fill();
  }

  function dot(x, y, r, color) {
    manCtx.fillStyle = color;
    manCtx.beginPath();
    manCtx.arc(x, y, r, 0, Math.PI * 2);
    manCtx.fill();
  }

  function grow(v) { return Math.max(0, Math.min(1, v)); }

  function drawSnowman() {
    manCtx.clearRect(0, 0, W, H);
    if (shown <= 0.001) return;
    var cx = W / 2;
    var ground = H - 10;
    var s = Math.min(1, H / 170);
    var r1 = 34 * s, r2 = 25 * s, r3 = 18 * s;

    var g1 = grow(shown), g2 = grow(shown - 1), g3 = grow(shown - 2);
    var g4 = grow(shown - 3), g5 = grow(shown - 4);

    var y1 = ground - r1 * g1;
    if (g1 > 0) ball(cx, y1, r1 * g1);
    var y2 = y1 - r1 * 0.8 - r2 * 0.8;
    if (g2 > 0) ball(cx, y2, r2 * g2);
    var y3 = y2 - r2 * 0.8 - r3 * 0.8;
    if (g3 > 0) ball(cx, y3, r3 * g3);

    if (g4 > 0) {
      manCtx.globalAlpha = g4;
      // Augen, Knöpfe, Karottennase
      dot(cx - 6 * s, y3 - 4 * s, 2.2 * s, "#1b1e24");
      dot(cx + 6 * s, y3 - 4 * s, 2.2 * s, "#1b1e24");
      dot(cx, y2 - 8 * s, 2.6 * s, "#1b1e24");
      dot(cx, y2 + 2 * s, 2.6 * s, "#1b1e24");
      dot(cx, y2 + 12 * s, 2.6 * s, "#1b1e24");
      manCtx.fillStyle = "#f28c28";
      manCtx.beginPath();
      manCtx.moveTo(cx, y3 + 1 * s);
      manCtx.lineTo(cx + 15 * s, y3 + 4 * s);
      manCtx.lineTo(cx, y3 + 5 * s);
      manCtx.closePath();
      manCtx.fill();
      // Ast-Arme
      manCtx.strokeStyle = "#6b4a2b";
      manCtx.lineWidth = 2.5 * s;
      manCtx.lineCap = "round";
      manCtx.beginPath();
      manCtx.moveTo(cx - r2 * 0.9, y2);
      manCtx.lineTo(cx - r2 * 2.1, y2 - 16 * s);
      manCtx.moveTo(cx - r2 * 1.7, y2 - 11 * s);
      manCtx.lineTo(cx - r2 * 1.9, y2 - 20 * s);
      manCtx.moveTo(cx + r2 * 0.9, y2);
      manCtx.lineTo(cx + r2 * 2.1, y2 - 16 * s);
      manCtx.moveTo(cx + r2 * 1.7, y2 - 11 * s);
      manCtx.lineTo(cx + r2 * 1.9, y2 - 20 * s);
      manCtx.stroke();
      manCtx.globalAlpha = 1;
    }

    if (g5 > 0) {
      manCtx.globalAlpha = g5;
      // Rote Tastonettis-Mütze mit Bommel
      manCtx.fillStyle = "#e3141b";
      manCtx.beginPath();
      manCtx.moveTo(cx - r3 * 1.0, y3 - r3 * 0.55);
      manCtx.quadraticCurveTo(cx, y3 - r3 * 2.6, cx + r3 * 1.3, y3 - r3 * 1.7);
      manCtx.lineTo(cx + r3 * 1.0, y3 - r3 * 0.55);
      manCtx.closePath();
      manCtx.fill();
      manCtx.fillStyle = "#ffffff";
      manCtx.fillRect(cx - r3 * 1.05, y3 - r3 * 0.75, r3 * 2.1, r3 * 0.35);
      dot(cx + r3 * 1.3, y3 - r3 * 1.7, 4 * s, "#ffffff");
      // Schal
      manCtx.fillStyle = "#e3141b";
      manCtx.fillRect(cx - r3 * 0.95, y3 + r3 * 0.6, r3 * 1.9, 6 * s);
      manCtx.fillRect(cx + r3 * 0.3, y3 + r3 * 0.6, 6 * s, 18 * s);
      manCtx.globalAlpha = 1;
    }
  }

  /* ---------- Schleife ---------- */
  function frame() {
    drawSky();
    if (shown < stage) shown = Math.min(stage, shown + 0.04);
    drawSnowman();
    requestAnimationFrame(frame);
  }

  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      resizeSky();
      // Nur neu aufbauen, wenn sich die Breite ändert (mobile Adressleiste ändert nur die Höhe).
      if (Math.abs(field.getBoundingClientRect().width - W) > 1) {
        resizeField();
        shown = 0;
      }
    }, 150);
  });

  resizeSky();
  resizeField();
  frame();
})();
