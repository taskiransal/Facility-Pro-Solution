/* Willkommens-Bildschirm: "Herzlich willkommen" + Sound, einmal pro Besuch (Sitzung).
   Browser erlauben Ton erst nach einem Tipp/Klick – deshalb gibt es den Knopf "Mit Ton eintreten".
   Ohne Tipp schließt sich der Bildschirm nach 5 Sekunden von selbst (ohne Ton). */
(function () {
  var html = document.documentElement;
  var overlay = document.querySelector(".wl");
  if (!overlay || !html.classList.contains("wl-show")) return;

  var AUDIO_SRC = "willkommen.mp3";
  var VOLUME = 0.55;          // Der Sound ist laut aufgenommen – bewusst leiser abgespielt
  var AUTO_CLOSE_MS = 5000;   // passt zu wl-bar in style.css
  var CLOSE_AFTER_TAP_MS = 1500;

  var soundBtn = overlay.querySelector(".wl-sound");
  var skipBtn = overlay.querySelector(".wl-skip");
  var audio = null, closed = false, timer = null, toggle = null;

  overlay.setAttribute("aria-hidden", "false");

  function getAudio() {
    if (!audio) {
      audio = new Audio(AUDIO_SRC);
      audio.preload = "auto";
      audio.volume = VOLUME;
      audio.addEventListener("ended", function () { if (toggle) { toggle.remove(); toggle = null; } });
    }
    return audio;
  }

  function makeToggle() {
    if (toggle) return;
    toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "snd";
    toggle.setAttribute("aria-label", "Ton ausschalten");
    toggle.innerHTML =
      '<svg class="on" viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>' +
      '<svg class="off" viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="m16 9 5 6M21 9l-5 6"/></svg>';
    toggle.addEventListener("click", function () {
      var a = getAudio();
      a.muted = !a.muted;
      toggle.classList.toggle("is-muted", a.muted);
      toggle.setAttribute("aria-label", a.muted ? "Ton einschalten" : "Ton ausschalten");
    });
    document.body.appendChild(toggle);
  }

  function playSound() {
    var a = getAudio();
    a.currentTime = 0;
    var p = a.play();
    if (p && typeof p.then === "function") {
      p.then(makeToggle).catch(function () { /* vom Browser blockiert */ });
    } else {
      makeToggle();
    }
  }

  function close() {
    if (closed) return;
    closed = true;
    clearTimeout(timer);
    document.removeEventListener("keydown", onKey);
    html.classList.add("wl-closing");
    setTimeout(function () {
      html.classList.remove("wl-show", "wl-closing");
      overlay.setAttribute("aria-hidden", "true");
    }, 600);
  }

  function onKey(e) { if (e.key === "Escape") close(); }
  document.addEventListener("keydown", onKey);

  soundBtn.addEventListener("click", function () {
    clearTimeout(timer);
    overlay.classList.add("wl-hold");   // Zeitbalken ausblenden
    playSound();                        // muss direkt im Klick passieren, sonst blockt der Browser
    timer = setTimeout(close, CLOSE_AFTER_TAP_MS);
  });
  skipBtn.addEventListener("click", close);

  timer = setTimeout(close, AUTO_CLOSE_MS);

  // Manche Browser erlauben Ton sofort (z. B. wenn die Seite oft besucht wurde) – dann direkt abspielen
  try {
    var p = getAudio().play();
    if (p && typeof p.then === "function") {
      p.then(function () {
        makeToggle();
        soundBtn.hidden = true;
        skipBtn.textContent = "Weiter zur Seite";
      }).catch(function () { /* normal: erst nach Tipp erlaubt */ });
    }
  } catch (err) {}

  // Tastatur-Nutzer: Fokus auf den Ton-Knopf (auf dem Handy nicht nötig, sonst stört der Fokus-Rahmen)
  if (!window.matchMedia("(pointer: coarse)").matches) { try { soundBtn.focus({ preventScroll: true }); } catch (err) {} }
})();
