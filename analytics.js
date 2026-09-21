/* Lightweight, privacy-friendly analytics via GoatCounter (no cookies, no
   personal data): page views, referrers, and which sections of the home page
   get read.

   GOATCOUNTER_CODE below is the "xxx" in https://xxx.goatcounter.com. Set it
   to '' to switch analytics off: this file then does nothing at all and adds
   nothing to the page.

   Referrers / campaigns: add ?ref=something to links you send out, e.g.
     https://dank666.github.io/?ref=cv
   GoatCounter then shows "something" as the source of those visits.

   Not counted: local previews (localhost, LAN addresses, file://), visitors
   who send Do Not Track, and your own browser after you open
   https://dank666.github.io/#toggle-goatcounter once. */
(function () {
  'use strict';

  var GOATCOUNTER_CODE = 'dank666';

  if (!GOATCOUNTER_CODE) return;
  if (navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.msDoNotTrack === '1') return;

  // Count "/" rather than "/?ref=cv" as the page. The full query string is
  // still sent along separately, which is how GoatCounter reads ref/utm_*.
  window.goatcounter = {
    path: function () { return location.pathname || '/'; }
  };

  // The footer's privacy line is swapped for one that also covers analytics,
  // and only once analytics is really running.
  function showNote() {
    var note = document.getElementById('analyticsNote');
    var plain = document.getElementById('privacyNote');
    if (note) note.hidden = false;
    if (plain) plain.hidden = true;
  }

  // One event per section per page view, once it is actually on screen: at
  // least half of it, or 40% of the viewport for sections taller than that.
  function trackSections() {
    var sections = document.querySelectorAll('.section[id]');
    if (!sections.length || !('IntersectionObserver' in window)) return;

    var seen = {};
    var thresholds = [];
    for (var i = 0; i <= 20; i++) thresholds.push(i / 20);

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var id = entry.target.id;
        if (seen[id]) return;
        var need = Math.min(entry.boundingClientRect.height * 0.5, window.innerHeight * 0.4);
        if (entry.intersectionRect.height < need) return;
        seen[id] = true;
        io.unobserve(entry.target);
        try {
          window.goatcounter.count({ path: 'section/' + id, title: 'Section: ' + id, event: true });
        } catch (e) {}
      });
    }, { threshold: thresholds });

    sections.forEach(function (sec) { io.observe(sec); });
  }

  var script = document.createElement('script');
  script.async = true;
  script.src = 'https://gc.zgo.at/count.js';
  script.setAttribute('data-goatcounter', 'https://' + GOATCOUNTER_CODE + '.goatcounter.com/count');
  script.onload = function () {
    showNote();
    trackSections();
  };
  // If the script is blocked or unreachable (ad blockers, some networks),
  // nothing else on the page is affected.
  document.head.appendChild(script);
})();
