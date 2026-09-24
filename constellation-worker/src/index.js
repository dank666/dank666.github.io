// Backend for the "Constellation" streak page on dank666.github.io.
//
//   GET    /checkins        public: list of done-days + simple stats
//   POST   /checkin         owner-only: mark one day done (upsert)
//   DELETE /checkin?date=…  owner-only: undo a day (fixes mistakes)
//
// There is deliberately no "missed day" record. A date either has a row
// (a star) or it doesn't — nothing here represents failure, only progress.
// Writes require `Authorization: Bearer <ADMIN_TOKEN>` (a Worker secret);
// see constellation-worker/wrangler.toml for how to set it.

const LOCAL_ORIGIN = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_NOTE_LEN = 200;
const MAX_DAYS = 4000; // ~11 years; plenty of headroom, keeps payloads bounded

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');
    const isSite = origin === env.SITE_ORIGIN;
    const isLocal = origin !== null && LOCAL_ORIGIN.test(origin);
    const allowed = isSite || isLocal;

    if (request.method === 'OPTIONS') {
      if (!allowed) return new Response(null, { status: 403 });
      return new Response(null, { status: 204, headers: cors(origin) });
    }

    try {
      if (url.pathname === '/checkins' && request.method === 'GET') {
        if (!allowed) return json({ error: 'forbidden' }, 403, null);
        return await handleList(env, origin);
      }
      if (url.pathname === '/checkin' && request.method === 'POST') {
        if (!allowed) return json({ error: 'forbidden' }, 403, null);
        return await handleUpsert(request, env, origin);
      }
      if (url.pathname === '/checkin' && request.method === 'DELETE') {
        if (!allowed) return json({ error: 'forbidden' }, 403, null);
        return await handleDelete(request, env, origin);
      }
      return json({ error: 'not found' }, 404, allowed ? origin : null);
    } catch (err) {
      return json({ error: 'server error' }, 500, allowed ? origin : null);
    }
  },
};

function checkAuth(request, env) {
  const header = request.headers.get('Authorization') || '';
  const match = /^Bearer (.+)$/.exec(header);
  return !!match && !!env.ADMIN_TOKEN && match[1] === env.ADMIN_TOKEN;
}

async function handleList(env, origin) {
  const { results } = await env.DB
    .prepare('SELECT date, note FROM checkins ORDER BY date ASC LIMIT ?1')
    .bind(MAX_DAYS)
    .all();

  return json(
    { days: results, stats: computeStats(results.map((r) => r.date)) },
    200,
    origin,
    { 'Cache-Control': 'public, max-age=30' }
  );
}

async function handleUpsert(request, env, origin) {
  if (!checkAuth(request, env)) return json({ error: 'unauthorized' }, 401, origin);

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ error: 'bad json' }, 400, origin);
  }

  const date = String(body && body.date || '');
  if (!DATE_RE.test(date)) return json({ error: 'bad date' }, 400, origin);

  const note = String((body && body.note) || '').slice(0, MAX_NOTE_LEN);

  await env.DB
    .prepare(
      `INSERT INTO checkins (date, note, created_at) VALUES (?1, ?2, ?3)
       ON CONFLICT (date) DO UPDATE SET note = ?2`
    )
    .bind(date, note, new Date().toISOString())
    .run();

  return json({ ok: true }, 200, origin);
}

async function handleDelete(request, env, origin) {
  if (!checkAuth(request, env)) return json({ error: 'unauthorized' }, 401, origin);

  const url = new URL(request.url);
  const date = url.searchParams.get('date') || '';
  if (!DATE_RE.test(date)) return json({ error: 'bad date' }, 400, origin);

  await env.DB.prepare('DELETE FROM checkins WHERE date = ?1').bind(date).run();
  return json({ ok: true }, 200, origin);
}

// Streaks are measured in *calendar days present in the list*, not against
// "today" — the caller compares the last date to today itself if it wants
// to know whether the current streak is still alive.
function computeStats(dates) {
  let best = 0;
  let run = 0;
  let prev = null;
  for (const d of dates) {
    if (prev && daysBetween(prev, d) === 1) {
      run += 1;
    } else {
      run = 1;
    }
    if (run > best) best = run;
    prev = d;
  }
  // Current streak: the run ending at the last date.
  let current = dates.length ? 1 : 0;
  for (let i = dates.length - 1; i > 0; i--) {
    if (daysBetween(dates[i - 1], dates[i]) === 1) current += 1;
    else break;
  }
  return { total: dates.length, bestStreak: best, currentStreak: current, lastDate: dates[dates.length - 1] || null };
}

function daysBetween(a, b) {
  const ms = Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z');
  return Math.round(ms / 86400000);
}

function cors(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

function json(body, status, origin, extra) {
  const headers = Object.assign({ 'Content-Type': 'application/json' }, extra);
  if (origin) Object.assign(headers, cors(origin));
  return new Response(JSON.stringify(body), { status, headers });
}
