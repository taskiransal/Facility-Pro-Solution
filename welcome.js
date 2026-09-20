/* Willkommens-Bildschirm + Sound. Alles läuft von selbst – niemand muss etwas drücken.
   - Der Bildschirm "Herzlich willkommen" erscheint einmal pro Besuch und schließt sich nach ~3 Sekunden.
   - Der Sound wird sofort automatisch versucht. Browser (Chrome, Opera, Edge, Safari, Firefox) erlauben Ton beim ersten
     Öffnen einer fremden Seite aber nur, wenn der Besucher sie schon einmal berührt hat oder es für die Seite erlaubt hat.
     Darum gilt zusätzlich: Klappt es nicht sofort, startet der Ton beim ersten Tippen/Klicken/Tastendruck auf der Seite
     (in den ersten 15 Sekunden). Tippt der Besucher zuerst auf einen Menülink, wird der Ton auf der nächsten Seite
     automatisch versucht – dort erlauben die Browser ihn in der Regel. */
(function () {
  var html = document.documentElement;
  var overlay = document.querySelector(".wl");
  var showWelcome = !!overlay && html.classList.contains("wl-show");

  // Wurde auf der Vorseite zuerst ein Link angetippt? Dann Ton jetzt automatisch versuchen.
  var pending = false;
  try {
    pending = sessionStorage.getItem("wl-pending") === "1";
    if (pending) sessionStorage.removeItem("wl-pending");
  } catch (e) {}

  if (!showWelcome && !pending) return;

  var AUDIO_SRC = "willkommen.mp3";
  var VOLUME = 0.55;              // Der Sound ist laut aufgenommen – bewusst leiser abgespielt
  var AUTO_CLOSE_MS = 2800;       // passt zu wl-bar in style.css
  var CLOSE_AFTER_TAP_MS = 800;   // Tipp auf den Bildschirm: kurz danach schließen
  var ARM_WINDOW_MS = 15000;      // so lange wartet der Ton auf die erste Berührung

  var GESTURES = ["pointerdown", "pointerup", "touchend", "click", "keydown"];
  var audio = null, closed = false, played = false, timer = null, toggle = null;

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

  function disarm() {
    GESTURES.forEach(function (ev) { document.removeEventListener(ev, onGesture, true); });
  }

  function started() {
    played = true; disarm(); makeToggle();
    if (overlay) overlay.classList.add("wl-playing");   // Ton läuft: Hinweis "zum Tippen" ausblenden
  }

  // Erste Berührung: Ton starten (muss direkt im Ereignis passieren, sonst blockt der Browser)
  function onGesture(e) {
    if (played) return;
    if (e.type === "keydown" && e.key === "Escape") return;
    // Tipp auf einen Seitenlink: Seite wechselt gleich – Ton dann auf der nächsten Seite automatisch versuchen
    if (e.target && e.target.closest && e.target.closest("a[href]")) {
      try { sessionStorage.setItem("wl-pending", "1"); } catch (err) {}
      return;
    }
    var a = getAudio();
    try { a.currentTime = 0; } catch (err) {}
    var p = a.play();
    if (p && typeof p.then === "function") {
      p.then(started).catch(function () { /* nächste Berührung probiert es erneut */ });
    } else {
      started();
    }
  }

  // ---- Willkommens-Bildschirm (nur beim ersten Besuch)
  if (showWelcome) {
    overlay.classList.add("wl-ready");   // schaltet den Notausgang aus style.css ab
    overlay.setAttribute("aria-hidden", "false");

    var close = function () {
      if (closed) return;
      closed = true;
      clearTimeout(timer);
      html.classList.add("wl-closing");
      setTimeout(function () {
        html.classList.remove("wl-show", "wl-closing");
        overlay.setAttribute("aria-hidden", "true");
      }, 600);
    };

    // schließt sich von selbst; ein Tipp darauf schließt etwas früher
    timer = setTimeout(close, AUTO_CLOSE_MS);
    overlay.addEventListener("click", function () {
      if (closed) return;
      clearTimeout(timer);
      timer = setTimeout(close, CLOSE_AFTER_TAP_MS);
    });
  }

  // ---- Ton: 1) sofort automatisch versuchen, 2) sonst auf die erste Berührung warten
  GESTURES.forEach(function (ev) { document.addEventListener(ev, onGesture, true); });
  setTimeout(disarm, ARM_WINDOW_MS);
  try {
    var p = getAudio().play();
    if (p && typeof p.then === "function") {
      p.then(started).catch(function () { /* normal: wartet auf die erste Berührung */ });
    } else {
      started();
    }
  } catch (err) {}
})();
