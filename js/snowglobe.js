/* Easter Egg: Handy schütteln = Schneekugel.
   Der Bewegungssensor wird nur lokal im Browser ausgewertet, es wird nichts gesendet. */
(function () {
  "use strict";

  if (!("DeviceMotionEvent" in window)) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var canvas = document.getElementById("snowglobe");
  var ctx = canvas.getContext("2d");
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, H = 0;

  var MAX_FLAKES = 700;
  var SHAKE_START = 9;   // m/s² Beschleunigung (ohne Schwerkraft), ab der es ein Schütteln ist
  var flakes = [];
  var gravity = null;    // Tiefpass für Geräte ohne event.acceleration
  var lastSpawn = 0;
  var running = false;

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawn(count, power) {
    for (var i = 0; i < count && flakes.length < MAX_FLAKES; i++) {
      var angle = Math.random() * Math.PI * 2;
      var speed = (2 + Math.random() * 7) * (0.6 + power);
      flakes.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: Math.random() * 2.6 + 0.8,
        fall: Math.random() * 0.7 + 0.35,  // Sinkgeschwindigkeit wenn zur Ruhe gekommen
        phase: Math.random() * Math.PI * 2,
        alpha: Math.random() * 0.4 + 0.6
      });
    }
    if (!running) {
      running = true;
      requestAnimationFrame(frame);
    }
  }

  // Bewegung des Handys schubst alle Flocken – in die Gegenrichtung, wie in einer Kugel.
  function nudge(ax, ay) {
    for (var i = 0; i < flakes.length; i++) {
      var f = flakes[i];
      f.vx += -ax * 0.35 * (0.7 + Math.random() * 0.6);
      f.vy += ay * 0.35 * (0.7 + Math.random() * 0.6);
    }
  }

  function frame() {
    ctx.clearRect(0, 0, W, H);
    for (var i = flakes.length - 1; i >= 0; i--) {
      var f = flakes[i];
      f.phase += 0.03;
      f.vx *= 0.955;
      f.vy *= 0.955;
      f.x += f.vx + Math.sin(f.phase) * 0.4;
      f.y += f.vy + f.fall;
      if (f.x < -10) f.x = W + 10;
      if (f.x > W + 10) f.x = -10;
      if (f.y < -40) f.y = -40;
      if (f.y > H + 10) {
        flakes.splice(i, 1);
        continue;
      }
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 255," + f.alpha + ")";
      ctx.fill();
    }
    if (flakes.length) {
      requestAnimationFrame(frame);
    } else {
      running = false;
      ctx.clearRect(0, 0, W, H);
    }
  }

  function onMotion(e) {
    var ax, ay, az;
    if (e.acceleration && e.acceleration.x !== null) {
      ax = e.acceleration.x; ay = e.acceleration.y; az = e.acceleration.z;
    } else if (e.accelerationIncludingGravity && e.accelerationIncludingGravity.x !== null) {
      // Schwerkraft per Tiefpass herausrechnen.
      var a = e.accelerationIncludingGravity;
      if (!gravity) gravity = { x: a.x, y: a.y, z: a.z };
      gravity.x = gravity.x * 0.8 + a.x * 0.2;
      gravity.y = gravity.y * 0.8 + a.y * 0.2;
      gravity.z = gravity.z * 0.8 + a.z * 0.2;
      ax = a.x - gravity.x; ay = a.y - gravity.y; az = a.z - gravity.z;
    } else {
      return;
    }

    var strength = Math.sqrt(ax * ax + ay * ay + az * az);
    if (strength < SHAKE_START) return;

    var power = Math.min(1, (strength - SHAKE_START) / 20);
    var now = Date.now();
    if (now - lastSpawn > 60) {
      lastSpawn = now;
      if (!W) resize();
      spawn(Math.round(25 + power * 60), power);
    }
    nudge(ax, ay);
  }

  function listen() {
    window.addEventListener("devicemotion", onMotion);
  }

  // iOS fragt nach Erlaubnis – nur direkt nach einer Berührung möglich.
  if (typeof DeviceMotionEvent.requestPermission === "function") {
    var asked = false;
    var ask = function () {
      if (asked) return;
      asked = true;
      document.removeEventListener("touchend", ask, true);
      document.removeEventListener("click", ask, true);
      DeviceMotionEvent.requestPermission().then(function (state) {
        if (state === "granted") listen();
      }).catch(function () { /* abgelehnt oder nicht möglich: kein Easter Egg */ });
    };
    document.addEventListener("touchend", ask, true);
    document.addEventListener("click", ask, true);
  } else {
    listen();
  }

  window.addEventListener("resize", resize);
  resize();
})();
