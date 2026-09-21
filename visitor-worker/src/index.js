// Anonymous, city-level visitor counter for dank666.github.io.
//
//   POST /hit    record one visit (production origin only)
//   GET  /stats  aggregated totals + per-city points (also readable from
//                localhost, so the site can be previewed locally)
//
// Nothing personal is stored: no IP, no User-Agent. Coordinates are rounded
// to ~0.1 degree (roughly city scale) before being written.

// Obvious crawlers / tools. Not a security boundary, just keeps counts sane.
const BOT_UA = /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|preview|monitor|uptime|curl|wget|python-requests|httpclient|axios|node-fetch|go-http/i;

const LOCAL_ORIGIN = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

const MAX_POINTS = 2000;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');
    const isSite = origin === env.SITE_ORIGIN;
    const isLocal = origin !== null && LOCAL_ORIGIN.test(origin);

    if (request.method === 'OPTIONS') {
      if (!isSite && !isLocal) return new Response(null, { status: 403 });
      return new Response(null, { status: 204, headers: cors(origin) });
    }

    try {
      if (url.pathname === '/hit' && request.method === 'POST') {
        // Local previews must never be counted, so localhost is not accepted here.
        if (!isSite) return json({ error: 'forbidden' }, 403, null);
        return await handleHit(request, env, origin);
      }
      if (url.pathname === '/stats' && request.method === 'GET') {
        if (!isSite && !isLocal) return json({ error: 'forbidden' }, 403, null);
        return await handleStats(env, origin);
      }
      return json({ error: 'not found' }, 404, origin);
    } catch (err) {
      return json({ error: 'server error' }, 500, isSite || isLocal ? origin : null);
    }
  },
};

async function handleHit(request, env, origin) {
  const ua = request.headers.get('User-Agent') || '';
  if (!ua || BOT_UA.test(ua)) return json({ counted: false, reason: 'bot' }, 200, origin);

  const cf = request.cf || {};
  const lat = parseFloat(cf.latitude);
  const lon = parseFloat(cf.longitude);
  if (!cf.country || !Number.isFinite(lat) || !Number.isFinite(lon)) {
    return json({ counted: false, reason: 'no-location' }, 200, origin);
  }

  await env.DB
    .prepare(
      `INSERT INTO visits (city, country, lat, lon, count)
       VALUES (?1, ?2, ?3, ?4, 1)
       ON CONFLICT (country, city, lat, lon) DO UPDATE SET count = count + 1`
    )
    .bind(cf.city || '', cf.country, round1(lat), round1(lon))
    .run();

  return json({ counted: true }, 200, origin);
}

async function handleStats(env, origin) {
  const totals = await env.DB
    .prepare('SELECT COALESCE(SUM(count), 0) AS total, COUNT(DISTINCT country) AS countries FROM visits')
    .first();
  const { results } = await env.DB
    .prepare('SELECT city, country, lat, lon, count FROM visits ORDER BY count DESC LIMIT ?1')
    .bind(MAX_POINTS)
    .all();

  return json(
    { total: totals.total, countries: totals.countries, points: results },
    200,
    origin,
    { 'Cache-Control': 'public, max-age=60' }
  );
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

function cors(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

// `origin` is only echoed back in CORS headers by callers that already
// validated it; pass null to send no CORS headers at all.
function json(body, status, origin, extra) {
  const headers = Object.assign({ 'Content-Type': 'application/json' }, extra);
  if (origin) Object.assign(headers, cors(origin));
  return new Response(JSON.stringify(body), { status, headers });
}
