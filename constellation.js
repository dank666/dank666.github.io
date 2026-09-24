/* Constellation: one star per day the plan got done. No missed-day penalty
   is drawn anywhere — a gap in the sky is just a gap, never a broken star.

   Like visitors.js, everything here fails silently: if the Worker is
   unreachable or unconfigured, the panel shows a short message instead of
   breaking the rest of the page. */
(function () {
  'use strict';

  // ---- Configuration ------------------------------------------------------
  // After deploying constellation-worker/, paste its URL here (no trailing
  // slash), e.g. 'https://constellation-log.your-subdomain.workers.dev'.
  // While this is empty the panel simply shows "No stars yet".
  var API_BASE = 'https://constellation-log.dank666.workers.dev';

  var TOKEN_KEY = 'constellation-token';
  var REQUEST_TIMEOUT_MS = 6000;
  var GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5)); // ~2.39996 rad
  // Radius normalisation: tuned so a year of daily stars (n=365) reaches
  // ~0.46 of the way to the panel edge. Depends only on a star's own index,
  // never on the total count, so existing stars never jump when a new one
  // is added.
  var RADIUS_K = 0.46 / Math.sqrt(365);
  var MAX_RADIUS = 0.48;
  var MILESTONES = [7, 30, 100, 200, 365, 500, 1000]; // star counts, 1-based

  var root = document.getElementById('constellation');
  var canvas = document.getElementById('constellationCanvas');
  if (!root || !canvas) return;

  var ctx = canvas.getContext('2d');
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var state = {
    days: [],       // [{date, note}] ascending
    stats: null,
    stars: [],      // computed layout: [{date, note, x, y, r, milestone}]
    dust: [],       // decorative background points
    todayDone: false,
  };

  function setPanelState(name) {
    root.setAttribute('data-state', name);
  }

  function currentLang() {
    return document.documentElement.getAttribute('data-lang') === 'zh' ? 'zh' : 'en';
  }

  function localDateStr(d) {
    d = d || new Date();
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }

  // ---- Deterministic layout -------------------------------------------------

  function hashString(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = (h * 16777619) >>> 0;
    }
    return h >>> 0;
  }

  function mulberry32(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s + 0x6d2b79f5) | 0;
      var t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function clamp01(v) {
    return Math.max(0, Math.min(1, v));
  }

  function layoutStars(days) {
    return days.map(function (day, index) {
      var n = index + 1;
      var rnd = mulberry32(hashString(day.date));
      var r = Math.min(MAX_RADIUS, RADIUS_K * Math.sqrt(n));
      var theta = n * GOLDEN_ANGLE;
      var jitter = 0.055;
      var cx = 0.5 + r * Math.cos(theta) + (rnd() - 0.5) * jitter;
      var cy = 0.5 + r * Math.sin(theta) + (rnd() - 0.5) * jitter;
      var milestone = MILESTONES.indexOf(n) !== -1;
      return {
        date: day.date,
        note: day.note || '',
        x: clamp01(cx),
        y: clamp01(cy),
        index: index,
        milestone: milestone,
        phase: rnd() * Math.PI * 2, // twinkle offset
      };
    });
  }

  function nearestNeighborLinks(stars) {
    // Each star (after the first) links to whichever earlier star sits
    // closest to it — a simple growing tree, so the picture reads as one
    // connected constellation rather than a strict day-by-day chain.
    var links = [];
    for (var i = 1; i < stars.length; i++) {
      var best = -1;
      var bestDist = Infinity;
      for (var j = 0; j < i; j++) {
        var dx = stars[i].x - stars[j].x;
        var dy = stars[i].y - stars[j].y;
        var d = dx * dx + dy * dy;
        if (d < bestDist) {
          bestDist = d;
          best = j;
        }
      }
      if (best !== -1) links.push([best, i]);
    }
    return links;
  }

  function makeDust(count, seed) {
    var rnd = mulberry32(seed);
    var pts = [];
    for (var i = 0; i < count; i++) {
      pts.push({ x: rnd(), y: rnd(), r: 0.3 + rnd() * 0.7, phase: rnd() * Math.PI * 2 });
    }
    return pts;
  }

  // ---- Rendering ------------------------------------------------------------

  var dpr = window.devicePixelRatio || 1;
  var displayW = 0;
  var displayH = 0;

  function resize() {
    var rect = canvas.getBoundingClientRect();
    displayW = Math.max(1, rect.width);
    displayH = Math.max(1, rect.height);
    dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(displayW * dpr);
    canvas.height = Math.round(displayH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw(t) {
    if (!displayW) resize();
    ctx.clearRect(0, 0, displayW, displayH);

    // Background: near-black, with a very soft glow that grows richer as
    // more stars accumulate — the whole sky gets a little more alive.
    var total = state.stars.length;
    var glowBoost = Math.min(1, total / 200);
    var grad = ctx.createRadialGradient(
      displayW * 0.5, displayH * 0.5, 0,
      displayW * 0.5, displayH * 0.5, Math.max(displayW, displayH) * 0.7
    );
    grad.addColorStop(0, 'rgba(80, 90, 150,' + (0.10 + glowBoost * 0.14) + ')');
    grad.addColorStop(1, 'rgba(6, 8, 18, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, displayW, displayH);

    var tw = reduceMotion ? 0 : t / 1000;

    // Decorative dust (never interactive, just atmosphere).
    ctx.fillStyle = 'rgba(200, 210, 255, 1)';
    state.dust.forEach(function (p) {
      var flicker = reduceMotion ? 0.5 : 0.35 + 0.25 * Math.sin(tw * 0.6 + p.phase);
      ctx.globalAlpha = 0.12 + glowBoost * 0.1 + flicker * 0.08;
      ctx.beginPath();
      ctx.arc(p.x * displayW, p.y * displayH, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Constellation lines.
    ctx.strokeStyle = 'rgba(150, 170, 230, 0.35)';
    ctx.lineWidth = 1;
    state.links.forEach(function (pair) {
      var a = state.stars[pair[0]];
      var b = state.stars[pair[1]];
      ctx.beginPath();
      ctx.moveTo(a.x * displayW, a.y * displayH);
      ctx.lineTo(b.x * displayW, b.y * displayH);
      ctx.stroke();
    });

    // Stars.
    state.stars.forEach(function (s) {
      var flicker = reduceMotion ? 1 : 0.75 + 0.25 * Math.sin(tw * 1.3 + s.phase);
      var baseR = (s.milestone ? 3.2 : 1.8) + glowBoost * 1.1;
      var r = baseR * flicker;

      var glow = ctx.createRadialGradient(
        s.x * displayW, s.y * displayH, 0,
        s.x * displayW, s.y * displayH, r * (s.milestone ? 6 : 4)
      );
      var core = s.milestone ? '255, 226, 158' : '255, 255, 255';
      glow.addColorStop(0, 'rgba(' + core + ', ' + (0.85 * flicker) + ')');
      glow.addColorStop(1, 'rgba(' + core + ', 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(s.x * displayW, s.y * displayH, r * (s.milestone ? 6 : 4), 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(' + core + ', 1)';
      ctx.beginPath();
      ctx.arc(s.x * displayW, s.y * displayH, r, 0, Math.PI * 2);
      ctx.fill();
    });

    if (!reduceMotion) animHandle = requestAnimationFrame(draw);
  }

  // A single continuous rAF chain, started once. Later data reloads (e.g.
  // after a check-in) must NOT call draw() directly while it's running —
  // that would spawn a second parallel chain — they just update `state`
  // and let the running loop pick it up on its next tick.
  var animHandle = null;
  function ensureAnimating() {
    if (reduceMotion) {
      draw(0); // no loop running; redraw the static frame explicitly
      return;
    }
    if (animHandle === null) animHandle = requestAnimationFrame(draw);
  }

  // ---- Hover tooltip (desktop only, best-effort) ---------------------------

  var tip = document.getElementById('constellationTip');
  function nearestStar(px, py) {
    var best = null;
    var bestDist = Infinity;
    state.stars.forEach(function (s) {
      var dx = s.x * displayW - px;
      var dy = s.y * displayH - py;
      var d = dx * dx + dy * dy;
      if (d < bestDist) {
        bestDist = d;
        best = s;
      }
    });
    return bestDist < 100 ? best : null;
  }

  canvas.addEventListener('mousemove', function (e) {
    if (!tip) return;
    var rect = canvas.getBoundingClientRect();
    var s = nearestStar(e.clientX - rect.left, e.clientY - rect.top);
    if (!s) {
      tip.hidden = true;
      return;
    }
    tip.hidden = false;
    tip.style.left = e.clientX - rect.left + 12 + 'px';
    tip.style.top = e.clientY - rect.top + 12 + 'px';
    tip.textContent = s.note ? s.date + ' — ' + s.note : s.date;
  });
  canvas.addEventListener('mouseleave', function () {
    if (tip) tip.hidden = true;
  });

  // ---- Network ---------------------------------------------------------

  function withTimeout() {
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, REQUEST_TIMEOUT_MS);
    return { controller: controller, timer: timer, settle: function () { clearTimeout(timer); } };
  }

  function fetchJson(path, options) {
    var t = withTimeout();
    options = options || {};
    options.signal = t.controller.signal;
    return fetch(API_BASE + path, options)
      .then(function (res) {
        t.settle();
        if (!res.ok) return res.json().then(function (b) { throw Object.assign(new Error('http'), { status: res.status, body: b }); });
        return res.json();
      })
      .catch(function (err) {
        t.settle();
        throw err;
      });
  }

  function getToken() {
    try { return localStorage.getItem(TOKEN_KEY) || ''; } catch (e) { return ''; }
  }
  function setToken(v) {
    try {
      if (v) localStorage.setItem(TOKEN_KEY, v);
      else localStorage.removeItem(TOKEN_KEY);
    } catch (e) {}
  }

  function applyData(data) {
    state.days = data.days || [];
    state.stats = data.stats || { total: 0, currentStreak: 0, bestStreak: 0, lastDate: null };
    state.stars = layoutStars(state.days);
    state.links = nearestNeighborLinks(state.stars);
    state.dust = makeDust(30 + Math.min(220, state.stats.total * 2), 1337);
    state.todayDone = state.stats.lastDate === localDateStr();

    var totalEl = document.getElementById('constellationTotal');
    var currentEl = document.getElementById('constellationCurrent');
    var bestEl = document.getElementById('constellationBest');
    if (totalEl) totalEl.textContent = String(state.stats.total);
    if (currentEl) currentEl.textContent = String(state.stats.currentStreak);
    if (bestEl) bestEl.textContent = String(state.stats.bestStreak);

    updateCheckinUI();
    setPanelState(state.stars.length ? 'ready' : 'empty');
    resize();
    ensureAnimating();
  }

  function load() {
    if (!API_BASE) {
      setPanelState('empty');
      return;
    }
    setPanelState('loading');
    fetchJson('/checkins', { headers: { 'Content-Type': 'application/json' } })
      .then(applyData)
      .catch(function () { setPanelState('error'); });
  }

  // ---- Check-in panel ----------------------------------------------------

  var lockedBox = document.getElementById('checkinLocked');
  var unlockedBox = document.getElementById('checkinUnlocked');
  var ownerLinkBtn = document.getElementById('ownerLinkBtn');
  var ownerForm = document.getElementById('ownerForm');
  var ownerTokenInput = document.getElementById('ownerTokenInput');
  var ownerTokenSave = document.getElementById('ownerTokenSave');
  var ownerSignoutBtn = document.getElementById('ownerSignoutBtn');
  var checkinNote = document.getElementById('checkinNote');
  var checkinBtn = document.getElementById('checkinBtn');
  var checkinUndoBtn = document.getElementById('checkinUndoBtn');
  var checkinStatus = document.getElementById('checkinStatus');

  function showStatus(en, zh, isError) {
    if (!checkinStatus) return;
    checkinStatus.hidden = false;
    checkinStatus.classList.toggle('is-error', !!isError);
    checkinStatus.textContent = currentLang() === 'zh' ? zh : en;
  }

  function updateCheckinUI() {
    var hasToken = !!getToken() && !!API_BASE;
    if (lockedBox) lockedBox.hidden = hasToken;
    if (unlockedBox) unlockedBox.hidden = !hasToken;
    if (!hasToken) return;

    var todayNote = '';
    if (state.todayDone) {
      var todayDay = state.days.filter(function (d) { return d.date === localDateStr(); })[0];
      todayNote = todayDay ? todayDay.note || '' : '';
    }
    if (checkinNote) checkinNote.value = todayNote;
    if (checkinBtn) {
      checkinBtn.disabled = false;
      // Stays clickable even when already done today — re-clicking just
      // re-saves the note, e.g. after editing it.
      checkinBtn.dataset.done = state.todayDone ? 'true' : 'false';
    }
    if (checkinUndoBtn) checkinUndoBtn.hidden = !state.todayDone;
  }

  if (ownerLinkBtn && ownerForm) {
    ownerLinkBtn.addEventListener('click', function () {
      ownerForm.hidden = !ownerForm.hidden;
      if (!ownerForm.hidden && ownerTokenInput) ownerTokenInput.focus();
    });
  }

  if (ownerTokenSave && ownerTokenInput) {
    ownerTokenSave.addEventListener('click', function () {
      var v = ownerTokenInput.value.trim();
      if (!v) return;
      setToken(v);
      ownerTokenInput.value = '';
      ownerForm.hidden = true;
      updateCheckinUI();
    });
  }

  if (ownerSignoutBtn) {
    ownerSignoutBtn.addEventListener('click', function () {
      setToken('');
      updateCheckinUI();
    });
  }

  function authedRequest(path, method, body) {
    return fetchJson(path, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + getToken(),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  if (checkinBtn) {
    checkinBtn.addEventListener('click', function () {
      checkinBtn.disabled = true;
      authedRequest('/checkin', 'POST', { date: localDateStr(), note: checkinNote ? checkinNote.value.trim() : '' })
        .then(function () {
          showStatus('Star lit.', '星星已点亮。', false);
          return fetchJson('/checkins');
        })
        .then(applyData)
        .catch(function (err) {
          checkinBtn.disabled = false;
          if (err && err.status === 401) {
            setToken('');
            updateCheckinUI();
            showStatus('Sign-in expired.', '登录已失效，请重新输入。', true);
          } else {
            showStatus('Could not save — try again.', '保存失败，请重试。', true);
          }
        });
    });
  }

  if (checkinUndoBtn) {
    checkinUndoBtn.addEventListener('click', function () {
      checkinUndoBtn.disabled = true;
      authedRequest('/checkin?date=' + localDateStr(), 'DELETE')
        .then(function () { return fetchJson('/checkins'); })
        .then(applyData)
        .catch(function () { showStatus('Could not undo — try again.', '撤销失败，请重试。', true); })
        .then(function () { checkinUndoBtn.disabled = false; });
    });
  }

  // ---- Init ---------------------------------------------------------------

  window.addEventListener('resize', function () {
    resize();
    if (reduceMotion) draw(0);
  });

  load();
  updateCheckinUI();
})();
