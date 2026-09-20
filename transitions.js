/* Seitenübergänge: diagonaler Wisch beim Verlassen, Aufdecken auf der neuen Seite.
   Merkt sich den Wechsel über sessionStorage bzw. window.name. */
(function () {
  var html = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var phone = window.matchMedia("(max-width: 620px)").matches;
  var COVER_MS = phone ? 400 : 520;   // Dauer bis zur Navigation (passt zu pt-leaving in style.css)

  // --- Neue Seite: aufdecken, falls wir per Wisch gekommen sind
  if (html.classList.contains("pt-cover")) {
    var started = false;
    var reveal = function () {
      if (started) return;
      started = true;
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          html.classList.add("pt-reveal");
          setTimeout(function () { html.classList.remove("pt-cover", "pt-reveal"); }, 800);
        });
      });
    };
    if (document.readyState === "complete") {
      setTimeout(reveal, 120);
    } else {
      window.addEventListener("load", function () { setTimeout(reveal, 120); });
      setTimeout(reveal, 1000); // Sicherheitsnetz, falls ein Bild hängt
    }
  }

  // --- Alte Seite: Wisch starten und danach navigieren
  document.addEventListener("click", function (e) {
    if (reduce) return;
    if (e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    var a = e.target.closest("a[href]");
    if (!a) return;
    if (a.target && a.target !== "_self") return;
    if (a.hasAttribute("download")) return;

    var url = new URL(a.href, location.href);
    // Nur interne Seiten (kein mailto:, tel: oder externe Links)
    if (url.protocol !== location.protocol || url.host !== location.host) return;
    // Gleiche Seite: kein Wisch
    if (url.pathname === location.pathname && url.search === location.search) return;

    e.preventDefault();
    if (html.classList.contains("pt-leaving")) return; // Doppeltipp: nur einmal wechseln
    try { sessionStorage.setItem("pt", "1"); } catch (err) {}
    window.name = "pt";
    html.classList.add("pt-leaving");
    setTimeout(function () { location.href = url.href; }, COVER_MS);
    // Notausgang: klappt der Seitenwechsel nicht (z. B. kein Netz), Wisch wieder wegnehmen
    setTimeout(function () { html.classList.remove("pt-leaving"); }, COVER_MS + 4000);
  });

  // Zurück-Button (Seite aus dem Cache): Wisch nicht stehen lassen
  window.addEventListener("pageshow", function (e) {
    if (e.persisted) html.classList.remove("pt-leaving", "pt-cover", "pt-reveal");
  });
})();
