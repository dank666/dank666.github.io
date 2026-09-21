/* Visitor map: records one anonymous visit per browser per day and draws
   the aggregated city-level stats on a world map.

   Everything here fails silently: if the Worker is unreachable, the libraries
   don't load, or anything else goes wrong, the rest of the page is untouched
   and the Visitors block just shows "No data yet". */
(function () {
  'use strict';

  // ---- Configuration ------------------------------------------------------
  // After deploying visitor-worker/, paste its URL here (no trailing slash),
  // e.g. 'https://visitor-map.your-subdomain.workers.dev'.
  // While this is empty the block simply shows "No data yet".
  var API_BASE = 'https://visitor-map.dank666.workers.dev';

  // Visits are only recorded from the real site. Local previews (localhost,
  // file://, LAN addresses) can read the map but never add to the counts.
  var SITE_ORIGIN = 'https://dank666.github.io';
  var LAST_HIT_KEY = 'visitor-last-hit';
  var REQUEST_TIMEOUT_MS = 6000;
  var ANTARCTICA_ID = '010';

  var root = document.getElementById('visitorMap');
  var canvas = document.getElementById('visitorCanvas');
  if (!root || !canvas) return;

  var state = { topo: null, stats: null, width: 0 };

  function setState(name) {
    root.setAttribute('data-state', name);
  }

  function currentLang() {
    return document.documentElement.getAttribute('data-lang') === 'zh' ? 'zh' : 'en';
  }

  // ---- Network ------------------------------------------------------------
  function fetchJSON(url, options) {
    var ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, REQUEST_TIMEOUT_MS) : null;
    var opts = Object.assign({}, options);
    if (ctrl) opts.signal = ctrl.signal;
    return fetch(url, opts)
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) { clearTimeout(timer); return data; },
            function (err) { clearTimeout(timer); throw err; });
  }

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  // Count this browser at most once per day. The date is only remembered after
  // the Worker acknowledged the hit, so a failed attempt is retried next visit.
  function recordHit() {
    if (!API_BASE || location.origin !== SITE_ORIGIN) return Promise.resolve();
    var last = null;
    try { last = localStorage.getItem(LAST_HIT_KEY); } catch (e) {}
    if (last === today()) return Promise.resolve();
    return fetchJSON(API_BASE + '/hit', { method: 'POST', keepalive: true })
      .then(function () {
        try { localStorage.setItem(LAST_HIT_KEY, today()); } catch (e) {}
      })
      .catch(function () {});
  }

  // ---- Libraries and map data (loaded lazily) ------------------------------
  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = function () { reject(new Error('failed to load ' + src)); };
      document.head.appendChild(s);
    });
  }

  function loadLibs() {
    // d3-geo's UMD build picks d3-array up from the shared `d3` global.
    var geo = loadScript('vendor/d3-array.min.js').then(function () {
      return loadScript('vendor/d3-geo.min.js');
    });
    var topo = loadScript('vendor/topojson-client.min.js');
    var data = fetchJSON('vendor/countries-110m.json');
    return Promise.all([geo, topo, data]).then(function (r) { return r[2]; });
  }

  // ---- Rendering ------------------------------------------------------------
  var SVG_NS = 'http://www.w3.org/2000/svg';

  function svgEl(name, attrs) {
    var el = document.createElementNS(SVG_NS, name);
    for (var k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }

  function countryName(code) {
    try {
      var name = new Intl.DisplayNames([currentLang() === 'zh' ? 'zh-CN' : 'en'], { type: 'region' }).of(code);
      if (name) return name;
    } catch (e) {}
    return code;
  }

  function tipText(p) {
    var country = countryName(p.country);
    var place = p.city ? p.city + ', ' + country : country;
    var n = p.count.toLocaleString();
    if (currentLang() === 'zh') return place + ' · ' + n + ' 次访问';
    return place + ' · ' + n + (p.count === 1 ? ' visit' : ' visits');
  }

  function render() {
    if (!state.topo || !state.stats || !window.d3 || !window.topojson) return;
    var w = Math.round(canvas.clientWidth);
    if (w < 50) return;
    state.width = w;

    var pad = 8;
    var countries = window.topojson.feature(state.topo, state.topo.objects.countries);
    var land = {
      type: 'FeatureCollection',
      features: countries.features.filter(function (f) { return String(f.id) !== ANTARCTICA_ID; })
    };
    var projection = window.d3.geoNaturalEarth1().fitExtent([[pad, pad], [w - pad, w]], land);
    var path = window.d3.geoPath(projection);
    var b = path.bounds(land);
    var top = b[0][1] - pad;
    var height = b[1][1] - b[0][1] + pad * 2;

    var svg = svgEl('svg', {
      viewBox: '0 ' + top + ' ' + w + ' ' + height,
      role: 'group',
      'aria-label': currentLang() === 'zh' ? '访客世界地图' : 'World map of visitors'
    });

    var g = svgEl('g', {});
    land.features.forEach(function (f) {
      var d = path(f);
      if (d) g.appendChild(svgEl('path', { d: d, 'class': 'visitor-land' }));
    });
    svg.appendChild(g);

    // Radius and opacity both scale with sqrt(count), so one busy city can't
    // swamp the rest. The floor on the denominator keeps a handful of visits
    // from producing one huge dot.
    var points = state.stats.points;
    var maxCount = points.reduce(function (m, p) { return Math.max(m, p.count); }, 0);
    var denom = Math.max(maxCount, 20);
    var R_MIN = 3, R_MAX = 16;

    var tip = document.createElement('div');
    tip.className = 'visitor-tip';
    tip.hidden = true;
    var activeDot = null;

    function hideTip() {
      tip.hidden = true;
      if (activeDot) activeDot.classList.remove('is-active');
      activeDot = null;
    }

    function showTip(dot, p, cx, cy, r) {
      if (activeDot) activeDot.classList.remove('is-active');
      activeDot = dot;
      dot.classList.add('is-active');
      tip.textContent = tipText(p);
      tip.hidden = false;
      var half = tip.offsetWidth / 2;
      var left = Math.min(Math.max(cx, half + 4), w - half - 4);
      tip.style.left = left - half + 'px';
      tip.style.top = Math.max(cy - top - r - tip.offsetHeight - 6, 4) + 'px';
    }

    // Draw big dots first so small ones stay visible on top.
    points.slice().sort(function (a, c) { return c.count - a.count; }).forEach(function (p) {
      var xy = projection([p.lon, p.lat]);
      if (!xy) return;
      var t = Math.sqrt(p.count / denom);
      var r = R_MIN + (R_MAX - R_MIN) * Math.min(t, 1);
      var dot = svgEl('circle', {
        cx: xy[0].toFixed(1),
        cy: xy[1].toFixed(1),
        r: r.toFixed(1),
        'fill-opacity': (0.35 + 0.65 * Math.min(t, 1)).toFixed(2),
        'class': 'visitor-dot',
        tabindex: '0',
        role: 'img',
        'aria-label': tipText(p)
      });
      function show() { showTip(dot, p, xy[0], xy[1], r); }
      dot.addEventListener('mouseenter', show);
      dot.addEventListener('mouseleave', hideTip);
      dot.addEventListener('focus', show);
      dot.addEventListener('blur', hideTip);
      dot.addEventListener('click', function (e) { e.stopPropagation(); show(); });
      svg.appendChild(dot);
    });

    svg.addEventListener('click', hideTip);

    canvas.textContent = '';
    canvas.appendChild(svg);
    canvas.appendChild(tip);
  }

  function showStats(stats) {
    document.getElementById('visitorTotal').textContent = stats.total.toLocaleString();
    document.getElementById('visitorCountries').textContent = stats.countries.toLocaleString();
  }

  function normalize(raw) {
    if (!raw || !Array.isArray(raw.points)) return null;
    var points = raw.points.filter(function (p) {
      return p && isFinite(p.lat) && isFinite(p.lon) && isFinite(p.count) && p.count > 0 && typeof p.country === 'string';
    }).map(function (p) {
      return { city: typeof p.city === 'string' ? p.city : '', country: p.country, lat: +p.lat, lon: +p.lon, count: +p.count };
    });
    var total = isFinite(raw.total) ? +raw.total : 0;
    if (!points.length || total <= 0) return null;
    return { total: total, countries: isFinite(raw.countries) ? +raw.countries : 0, points: points };
  }

  // ---- Boot -----------------------------------------------------------------
  var started = false;
  function start() {
    if (started) return;
    started = true;
    if (!API_BASE) { setState('empty'); return; }

    // Wait for our own hit (if any) so it shows up in the numbers below.
    var stats = hit.then(function () { return fetchJSON(API_BASE + '/stats'); }).then(normalize);
    Promise.all([stats, loadLibs()])
      .then(function (r) {
        if (!r[0]) { setState('empty'); return; }
        state.stats = r[0];
        state.topo = r[1];
        showStats(state.stats);
        setState('ready');
        render();
      })
      .catch(function () { setState('empty'); });
  }

  var hit = recordHit();

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      if (entries.some(function (e) { return e.isIntersecting; })) {
        io.disconnect();
        start();
      }
    }, { rootMargin: '400px 0px' });
    io.observe(root);
  } else {
    start();
  }

  // Redraw on width changes and on EN/中 switch (tooltip text and country
  // names are generated in JS; everything else follows CSS).
  if ('ResizeObserver' in window) {
    new ResizeObserver(function () {
      if (state.stats && Math.abs(canvas.clientWidth - state.width) > 1) render();
    }).observe(canvas);
  }
  if ('MutationObserver' in window) {
    new MutationObserver(function () { render(); })
      .observe(document.documentElement, { attributes: true, attributeFilter: ['data-lang'] });
  }
})();
