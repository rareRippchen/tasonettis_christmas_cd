/* Easter Egg: Das Handy ist eine Schneekugel.
   Schwerkraft folgt der Lage des Handys, Schütteln wirbelt den Schnee auf,
   die Bildschirmränder sind die Glaswand.
   Die Sensordaten werden nur lokal im Browser ausgewertet, es wird nichts gesendet. */
(function () {
  "use strict";

  if (!("DeviceMotionEvent" in window)) return;
  // Bewusst auch bei „Bewegung reduzieren“ aktiv: Es bewegt sich nur, wenn man selbst schüttelt.

  var canvas = document.getElementById("snowglobe");
  var ctx = canvas.getContext("2d");
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, H = 0;

  /* ---------- Stellschrauben ---------- */
  var MAX_FLAKES = 650;
  var SHAKE_START = 9;      // m/s² (ohne Schwerkraft), ab der ein Schütteln zählt
  var SINK = 0.11;          // Schwerkraft in px/Frame² bei senkrechtem Handy
  var DRAG = 0.94;          // Flüssigkeitswiderstand pro Frame (kleiner = zäher)
  var INERTIA = 0.3;        // wie stark Handybewegung die Flocken mitreißt
  var MELT_AFTER = 8000;    // ms, die eine Flocke ruhig liegt, bevor sie schmilzt
  var MELT_TIME = 20000;    // ms bis sie ganz weg ist

  var flakes = [];
  var grav = { x: 0, y: 1 };     // Richtung „unten“ in Bildschirmkoordinaten, Länge 0..1
  var hasOrientation = false;
  var lowpass = null;            // Fallback: Schwerkraft aus accelerationIncludingGravity
  var agitation = 0;             // Verwirbelung, klingt nach dem Schütteln ab
  var lastSpawn = 0;
  var running = false;
  var lastTime = 0;

  // Diagnose: Seite mit ?sensor aufrufen, dann zeigt eine kleine Box den Sensorstatus.
  var debug = /[?&]sensor\b/.test(location.search) ? createDebug() : null;
  var stats = { permission: "–", motionEvents: 0, orientationEvents: 0, accel: 0, beta: null, gamma: null };

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /* ---------- Geräte- in Bildschirmkoordinaten ---------- */

  function screenAngle() {
    if (screen.orientation && typeof screen.orientation.angle === "number") return screen.orientation.angle;
    if (typeof window.orientation === "number") return window.orientation;
    return 0;
  }

  // (x, y) im Hochformat-Bildschirmsystem (x rechts, y unten) auf die aktuelle Drehung umrechnen.
  function toScreen(x, y) {
    var a = screenAngle() * Math.PI / 180;
    var c = Math.cos(a), s = Math.sin(a);
    return { x: x * c + y * s, y: -x * s + y * c };
  }

  // Lage des Handys: Richtung, in die Dinge auf dem Bildschirm fallen.
  function onOrientation(e) {
    stats.orientationEvents++;
    stats.beta = e.beta;
    stats.gamma = e.gamma;
    if (e.beta === null || e.gamma === null) return;
    hasOrientation = true;
    var b = e.beta * Math.PI / 180;
    var g = e.gamma * Math.PI / 180;
    // „Oben“ im Gerätesystem ist (-sin γ·cos β, sin β, cos γ·cos β); fallen = Gegenrichtung,
    // die y-Achse des Geräts zeigt nach oben, der Bildschirm zählt nach unten.
    grav = toScreen(Math.sin(g) * Math.cos(b), Math.sin(b));
  }

  function onMotion(e) {
    stats.motionEvents++;
    var ig = e.accelerationIncludingGravity;

    // Ohne Lagesensor: Schwerkraft aus dem Beschleunigungssensor (Tiefpass).
    if (!hasOrientation && ig && ig.x !== null) {
      if (!lowpass) lowpass = { x: ig.x, y: ig.y, z: ig.z };
      lowpass.x = lowpass.x * 0.85 + ig.x * 0.15;
      lowpass.y = lowpass.y * 0.85 + ig.y * 0.15;
      lowpass.z = lowpass.z * 0.85 + ig.z * 0.15;
      grav = toScreen(-lowpass.x / 9.81, lowpass.y / 9.81);
    }

    // Bewegung ohne Schwerkraft.
    var ax, ay, az;
    if (e.acceleration && e.acceleration.x !== null) {
      ax = e.acceleration.x; ay = e.acceleration.y; az = e.acceleration.z;
    } else if (ig && ig.x !== null && lowpass) {
      ax = ig.x - lowpass.x; ay = ig.y - lowpass.y; az = ig.z - lowpass.z;
    } else {
      return;
    }

    var strength = Math.sqrt(ax * ax + ay * ay + az * az);
    stats.accel = Math.max(stats.accel * 0.9, strength);
    if (strength < SHAKE_START) return;
    var power = Math.min(1, (strength - SHAKE_START) / 20);

    agitation = Math.min(1.5, agitation + 0.25 + power * 0.5);

    // Trägheit: Die Kugel bewegt sich, das Wasser mit dem Schnee bleibt zurück.
    var push = toScreen(-ax, ay);
    for (var i = 0; i < flakes.length; i++) {
      var f = flakes[i];
      var k = INERTIA * (0.7 + Math.random() * 0.6) / f.mass;
      f.vx += push.x * k;
      f.vy += push.y * k;
      f.rest = 0;
    }

    var now = Date.now();
    if (now - lastSpawn > 80 && flakes.length < MAX_FLAKES) {
      lastSpawn = now;
      if (!W) resize();
      spawnFromFloor(Math.round(20 + power * 50), power);
    }
    start();
  }

  /* ---------- Schnee ---------- */

  // Neuer Schnee wird vom „Boden“ der Kugel aufgewirbelt – also vom Rand, zu dem die Schwerkraft zeigt.
  function spawnFromFloor(count, power) {
    var gl = Math.sqrt(grav.x * grav.x + grav.y * grav.y);
    var dx = gl > 0.2 ? grav.x / gl : 0;
    var dy = gl > 0.2 ? grav.y / gl : 1;
    for (var i = 0; i < count && flakes.length < MAX_FLAKES; i++) {
      // Punkt auf dem Rand in Fallrichtung, quer dazu verteilt.
      var t = Math.random() - 0.5;
      var cx = W / 2 + dx * W / 2 - dy * t * W;
      var cy = H / 2 + dy * H / 2 + dx * t * H;
      var r = Math.random() * 2.4 + 0.9;
      // Reicht je nach Kraft bis quer durch die ganze Kugel (Weg ≈ Startgeschwindigkeit / (1 - DRAG)).
      var depth = Math.abs(dx) * W + Math.abs(dy) * H;
      var speed = depth * (1 - DRAG) * (0.35 + Math.random() * 0.75) * (0.7 + power * 0.6);
      var spread = (Math.random() - 0.5) * 1.6;
      flakes.push({
        x: Math.max(0, Math.min(W, cx)),
        y: Math.max(0, Math.min(H, cy)),
        // gegen die Schwerkraft ins Innere schießen, etwas gefächert
        vx: (-dx + -dy * spread) * speed,
        vy: (-dy + dx * spread) * speed,
        r: r,
        mass: 0.6 + r / 3.3,     // große Flocken sinken schneller und sind träger
        phase: Math.random() * Math.PI * 2,
        swirl: 0.5 + Math.random(),
        alpha: Math.random() * 0.35 + 0.65,
        rest: 0                  // ms, die die Flocke schon ruhig liegt
      });
    }
  }

  function step(dt, ms, time) {
    var sink = SINK * Math.min(1, Math.sqrt(grav.x * grav.x + grav.y * grav.y) * 1.2);
    var gl = Math.sqrt(grav.x * grav.x + grav.y * grav.y) || 1;
    var drag = Math.pow(DRAG, dt);
    agitation *= Math.pow(0.986, dt);

    for (var i = flakes.length - 1; i >= 0; i--) {
      var f = flakes[i];

      // Schwerkraft (skaliert mit Neigung) und Strudel, die nach dem Schütteln abklingen.
      var gk = sink * f.mass / gl;
      f.vx += (grav.x * gk) * dt;
      f.vy += (grav.y * gk) * dt;
      if (agitation > 0.01) {
        f.phase += 0.05 * f.swirl * dt;
        var sw = agitation * 0.35 * f.swirl;
        f.vx += Math.cos(f.phase + f.y * 0.01 + time * 0.0007) * sw * dt;
        f.vy += Math.sin(f.phase * 1.3 + f.x * 0.01) * sw * dt;
      }
      f.vx *= drag;
      f.vy *= drag;
      f.x += f.vx * dt;
      f.y += f.vy * dt;

      // Glaswand: kein Durchkommen, Schnee drückt sich an und rutscht nur langsam.
      var touching = false;
      if (f.x < f.r) { f.x = f.r; if (f.vx < 0) f.vx = 0; touching = true; }
      else if (f.x > W - f.r) { f.x = W - f.r; if (f.vx > 0) f.vx = 0; touching = true; }
      if (f.y < f.r) { f.y = f.r; if (f.vy < 0) f.vy = 0; touching = true; }
      else if (f.y > H - f.r) { f.y = H - f.r; if (f.vy > 0) f.vy = 0; touching = true; }
      if (touching) {
        var fr = Math.pow(0.8, dt);
        f.vx *= fr;
        f.vy *= fr;
      }

      // Ruhig liegender (oder flach schwebender) Schnee schmilzt irgendwann.
      var speed2 = f.vx * f.vx + f.vy * f.vy;
      if ((touching && speed2 < 0.05) || speed2 < 0.0004) f.rest += ms;
      else f.rest = Math.max(0, f.rest - ms * 2);
      var fade = f.rest > MELT_AFTER ? 1 - (f.rest - MELT_AFTER) / MELT_TIME : 1;
      if (fade <= 0) {
        flakes.splice(i, 1);
        continue;
      }
      f.draw = f.alpha * fade;
    }
  }

  function render() {
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < flakes.length; i++) {
      var f = flakes[i];
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 255," + f.draw + ")";
      ctx.fill();
    }
  }

  function frame(time) {
    var ms = lastTime ? Math.min(50, time - lastTime) : 16.7;
    lastTime = time;
    step(ms / 16.7, ms, time);
    render();
    if (flakes.length) {
      requestAnimationFrame(frame);
    } else {
      running = false;
      lastTime = 0;
      ctx.clearRect(0, 0, W, H);
    }
  }

  function start() {
    if (running) return;
    running = true;
    requestAnimationFrame(frame);
  }

  /* ---------- Sensoren anmelden ---------- */

  function listen(motion, orientation) {
    if (motion) window.addEventListener("devicemotion", onMotion);
    if (orientation) window.addEventListener("deviceorientation", onOrientation);
  }

  // iOS fragt nach Erlaubnis – nur direkt in einer Berührung möglich, daher beide Abfragen sofort
  // im selben Handler. Schlägt die Abfrage technisch fehl, wird beim nächsten Tipp erneut gefragt;
  // nur ein ausdrückliches „Nicht erlauben“ ist endgültig.
  function request(Ctor) {
    if (!Ctor || typeof Ctor.requestPermission !== "function") return Promise.resolve("granted");
    try {
      return Promise.resolve(Ctor.requestPermission()).catch(function (err) {
        return "error: " + (err && err.name || err);
      });
    } catch (err) {
      return Promise.resolve("error: " + (err && err.name || err));
    }
  }

  if (typeof DeviceMotionEvent.requestPermission === "function") {
    var busy = false;
    var ask = function () {
      if (busy) return;
      busy = true;
      stats.permission = "frage …";
      Promise.all([request(window.DeviceMotionEvent), request(window.DeviceOrientationEvent)]).then(function (r) {
        stats.permission = "Bewegung: " + r[0] + ", Lage: " + r[1];
        var motionOk = r[0] === "granted";
        var orientationOk = r[1] === "granted";
        var final = motionOk || r[0] === "denied";
        if (final) {
          document.removeEventListener("touchend", ask, true);
          document.removeEventListener("click", ask, true);
        }
        // Lage allein reicht nicht zum Schütteln, Bewegung allein schon (Schwerkraft-Fallback).
        if (motionOk) listen(true, orientationOk);
        busy = false;
      });
    };
    document.addEventListener("touchend", ask, true);
    document.addEventListener("click", ask, true);
  } else {
    stats.permission = "nicht nötig";
    listen(true, true);
  }

  function createDebug() {
    var box = document.createElement("pre");
    box.style.cssText = "position:fixed;left:8px;bottom:8px;z-index:20;margin:0;padding:8px 10px;" +
      "font:11px/1.4 ui-monospace,monospace;color:#fff;background:rgba(0,0,0,.75);border-radius:8px;" +
      "pointer-events:none;white-space:pre-wrap;max-width:calc(100% - 16px)";
    document.body.appendChild(box);
    return box;
  }

  function fmt(v) { return v === null || v === undefined ? "–" : Math.round(v); }

  if (debug) {
    setInterval(function () {
      debug.textContent =
        "Erlaubnis: " + stats.permission + "\n" +
        "Bewegungs-Events: " + stats.motionEvents + "  (Stärke " + stats.accel.toFixed(1) + ", Schütteln ab " + SHAKE_START + ")\n" +
        "Lage-Events: " + stats.orientationEvents + "  (β " + fmt(stats.beta) + "°, γ " + fmt(stats.gamma) + "°)\n" +
        "Schwerkraft: x " + grav.x.toFixed(2) + ", y " + grav.y.toFixed(2) + "\n" +
        "Flocken: " + flakes.length + "  ·  Drehung: " + screenAngle() + "°";
    }, 250);
  }

  window.addEventListener("resize", resize);
  resize();
})();
