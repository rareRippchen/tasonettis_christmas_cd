/* Countdown bis zur Veröffentlichung des neuen Albums (Termin steht in data-release). */
(function () {
  "use strict";

  var box = document.getElementById("countdown");
  var released = document.getElementById("released");
  var target = Date.parse(box.getAttribute("data-release"));
  if (isNaN(target)) return;

  var fields = {};
  ["days", "hours", "minutes", "seconds"].forEach(function (u) {
    fields[u] = box.querySelector('[data-unit="' + u + '"]');
  });

  function pad(n) { return n < 10 ? "0" + n : String(n); }

  var timer;
  function tick() {
    var left = Math.max(0, target - Date.now());
    var s = Math.floor(left / 1000);
    fields.days.textContent = Math.floor(s / 86400);
    fields.hours.textContent = pad(Math.floor(s / 3600) % 24);
    fields.minutes.textContent = pad(Math.floor(s / 60) % 60);
    fields.seconds.textContent = pad(s % 60);

    if (left === 0) {
      clearInterval(timer);
      box.hidden = true;
      released.hidden = false;
    }
  }

  tick();
  timer = setInterval(tick, 1000);
})();
