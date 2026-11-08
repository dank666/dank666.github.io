#!/usr/bin/env node
// The paper tool: a local page for adding, editing and deleting the papers on
// the Notes page (reading.html), with lookup by DOI / arXiv / title, machine
// translation of reading notes, and a button that commits and pushes.
//
//   node tools/papers/server.mjs        (or double-click tools/papers/start.command)
//   options: --port 5179  --no-open
//
// It listens on 127.0.0.1 only, and every API call has to carry a token that
// is generated at start and handed only to the page it serves, so other
// websites open in the browser cannot use it. No dependencies.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import * as store from './store.mjs';
import { lookup } from './lookup.mjs';
import { translate, loadConfig, CONFIG_FILE } from './translate.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const FILE = path.join(ROOT, 'reading.html');
const REL = 'reading.html';
const TOKEN = crypto.randomBytes(18).toString('hex');

const argv = process.argv.slice(2);
const opt = name => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : undefined; };
const START_PORT = +(opt('--port') || process.env.PORT || 5179);
const OPEN = !argv.includes('--no-open');

// ---- git ------------------------------------------------------------------

function git(args, timeout = 30000) {
  return new Promise(resolve => {
    execFile('git', args, { cwd: ROOT, timeout, maxBuffer: 64 * 1024 * 1024, env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } },
      (err, stdout, stderr) => resolve({ code: err ? (typeof err.code === 'number' ? err.code : 1) : 0, stdout: String(stdout), stderr: String(stderr || (err && err.message) || '') }));
  });
}

let headCache = { sha: null, papers: [], projects: [] };
async function atHead() {
  const sha = (await git(['rev-parse', 'HEAD'])).stdout.trim();
  if (sha && sha === headCache.sha) return headCache;
  const show = await git(['show', 'HEAD:' + REL]);
  let papers = [], projects = [];
  try {
    if (show.code === 0) {
      const parsed = store.parse(show.stdout);
      papers = parsed.papers.map(p => p.value);
      projects = parsed.projects;
    }
  } catch { /* unreadable old version */ }
  headCache = { sha, papers, projects };
  return headCache;
}

// Projects added, changed or removed since the last commit (by id).
function compareProjects(base, current) {
  const out = [];
  for (const p of current) {
    const b = base.find(x => x.id === p.id);
    if (!b) out.push({ kind: 'new', label: p.label_zh || p.label_en });
    else if (!store.same(b, p)) out.push({ kind: 'changed', label: p.label_zh || p.label_en });
  }
  for (const b of base) if (!current.some(p => p.id === b.id)) out.push({ kind: 'removed', label: b.label_zh || b.label_en });
  return out;
}

async function gitState() {
  const [branch, status, counts] = await Promise.all([
    git(['rev-parse', '--abbrev-ref', 'HEAD']),
    git(['status', '--porcelain=v1', '-z']),
    git(['rev-list', '--left-right', '--count', '@{u}...HEAD'])
  ]);
  const files = status.stdout.split('\0').filter(Boolean).map(s => s.slice(3));
  const [behind, ahead] = counts.code === 0 ? counts.stdout.trim().split(/\s+/).map(Number) : [0, 0];
  return {
    branch: branch.stdout.trim(),
    dirty: files.includes(REL),
    others: files.filter(f => f !== REL && !f.endsWith('.DS_Store')),
    ahead, behind,
    upstream: counts.code === 0
  };
}

let liveUrl = null;
async function siteUrl() {
  if (liveUrl !== null) return liveUrl;
  const r = await git(['remote', 'get-url', 'origin']);
  const m = r.stdout.trim().match(/github\.com[:/]([^/]+)\/([^/]+?)(?:\.git)?$/);
  liveUrl = !m ? '' : m[2].toLowerCase() === (m[1] + '.github.io').toLowerCase()
    ? 'https://' + m[2] + '/' + REL
    : 'https://' + m[1] + '.github.io/' + m[2] + '/' + REL;
  return liveUrl;
}

// ---- state ----------------------------------------------------------------

function read() {
  return fs.readFileSync(FILE, 'utf8');
}

function writeAtomic(text) {
  const tmp = FILE + '.papers-tool.tmp';
  fs.writeFileSync(tmp, text);
  fs.renameSync(tmp, FILE);
}

async function state() {
  const { papers, projects } = store.parse(read());
  const values = papers.map(p => p.value);
  const [head, g, url] = await Promise.all([atHead(), gitState(), siteUrl()]);
  const { status, removed } = store.compare(head.papers, values);
  const cfg = loadConfig();
  return {
    projects, papers: values, status, removed, projectChanges: compareProjects(head.projects, projects), git: g, site: url,
    llm: { model: cfg.model, ready: !!cfg.apiKey, configFile: CONFIG_FILE }
  };
}

// ---- input checks ---------------------------------------------------------

const CJK = /[㐀-䶿一-鿿豈-﫿]/;

function line(s) {
  return String(s ?? '').replace(/[​﻿]/g, '').replace(/\s+/g, ' ').trim();
}

// Notes are one paragraph on the page; a line break pasted from a PDF becomes
// a space (or nothing between two Chinese characters).
function paragraph(s) {
  return String(s ?? '').replace(/[​﻿]/g, '')
    .replace(/[ \t]*\n\s*/g, (m, i, all) => (CJK.test(all[i - 1] || '') && CJK.test(all[i + m.length] || '') ? '' : ' '))
    .replace(/[ \t]{2,}/g, ' ').trim();
}

const straight = s => s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"');

class HttpError extends Error { constructor(status, msg) { super(msg); this.status = status; } }

function cleanPaper(p, projects) {
  const out = {
    title_en: straight(line(p.title_en)),
    title_zh: line(p.title_zh),
    authors: straight(line(p.authors)),
    year: Number(line(p.year)),
    venue: straight(line(p.venue)),
    link: line(p.link),
    project: Array.isArray(p.project) ? p.project.map(line).filter(Boolean) : line(p.project),
    topics: (Array.isArray(p.topics) ? p.topics : []).map(t => line(t).toLowerCase()).filter(Boolean),
    note_en: straight(paragraph(p.note_en)),
    note_zh: paragraph(p.note_zh),
    note_de: paragraph(p.note_de)
  };
  // Fields this tool does not know about are kept as they are.
  for (const k of Object.keys(p)) if (!(k in out)) out[k] = p[k];
  if (Array.isArray(out.project) && out.project.length === 1) out.project = out.project[0];
  out.topics = [...new Set(out.topics)];

  if (!out.title_en) throw new HttpError(400, '标题不能为空');
  if (!Number.isInteger(out.year) || out.year < 1900 || out.year > 2100) throw new HttpError(400, '年份要写成四位数字，比如 2026');
  const ids = new Set(projects.map(x => x.id));
  const chosen = Array.isArray(out.project) ? out.project : [out.project];
  if (!chosen.length || !chosen[0]) throw new HttpError(400, '至少要选一个项目');
  for (const id of chosen) if (!ids.has(id)) throw new HttpError(400, '没有这个项目：' + id);
  if (out.link && !/^https?:\/\/\S+$/.test(out.link)) throw new HttpError(400, '链接要以 http:// 或 https:// 开头');
  return out;
}

// The entry the page was editing, found again in the file as it is now. If
// the file was changed elsewhere in the meantime, the entry may have moved; if
// the entry itself was changed elsewhere, refuse rather than overwrite that.
function locate(papers, index, original) {
  const same = v => store.same(v, original);
  if (papers[index] && same(papers[index].value)) return index;
  const i = papers.findIndex(p => same(p.value));
  if (i >= 0) return i;
  throw new HttpError(409, '这篇论文在别处被改动过（比如在编辑器里），页面已重新载入。请检查后再保存一次。');
}

// ---- actions ----------------------------------------------------------------

let queue = Promise.resolve();
const serial = fn => (queue = queue.then(fn, fn));

async function save({ index, original, paper }) {
  const src = read();
  const { papers, projects } = store.parse(src);
  const clean = cleanPaper(paper || {}, projects);
  const op = index === null || index === undefined
    ? { type: 'add', paper: clean }
    : { type: 'update', index: locate(papers, index, original), paper: clean };
  const res = store.apply(src, op);
  if (res.src !== src) writeAtomic(res.src);
  return { index: res.index, state: await state() };
}

async function remove({ index, original }) {
  const src = read();
  const { papers } = store.parse(src);
  const res = store.apply(src, { type: 'delete', index: locate(papers, index, original) });
  writeAtomic(res.src);
  return { state: await state() };
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function cleanProjects(list) {
  if (!Array.isArray(list) || !list.length) throw new HttpError(400, '至少要有一个项目');
  const ids = new Set();
  return list.map(p => {
    const out = { id: line(p.id).toLowerCase(), label_en: straight(line(p.label_en)), label_zh: line(p.label_zh), label_de: line(p.label_de) };
    if (!SLUG.test(out.id)) throw new HttpError(400, '项目编号只能用英文小写字母、数字和短横线：' + (out.id || '（空）'));
    if (ids.has(out.id)) throw new HttpError(400, '项目编号重复：' + out.id);
    ids.add(out.id);
    if (!out.label_zh || !out.label_en) throw new HttpError(400, '项目要有中文名和英文名');
    const gids = new Set();
    out.groups = (Array.isArray(p.groups) ? p.groups : []).map(g => {
      const go = { id: line(g.id).toLowerCase(), label_en: straight(line(g.label_en)), label_zh: line(g.label_zh), label_de: line(g.label_de) };
      if (!SLUG.test(go.id)) throw new HttpError(400, '分类编号只能用英文小写字母、数字和短横线：' + (go.id || '（空）'));
      if (gids.has(go.id)) throw new HttpError(400, '“' + out.label_zh + '”里的分类编号重复：' + go.id);
      gids.add(go.id);
      if (!go.label_zh || !go.label_en) throw new HttpError(400, '每个分类都要有中文名和英文名（“' + out.label_zh + '”）');
      return go;
    });
    return out;
  });
}

async function saveProjects({ projects, original }) {
  const src = read();
  const parsed = store.parse(src);
  if (!store.same(parsed.projects, original)) {
    throw new HttpError(409, '项目在别处被改动过，页面已重新载入。请再改一次。');
  }
  const clean = cleanProjects(projects);
  for (const old of parsed.projects) {
    if (clean.some(p => p.id === old.id)) continue;
    const n = parsed.papers.filter(e => [].concat(e.value.project).includes(old.id)).length;
    if (n) throw new HttpError(400, '“' + (old.label_zh || old.label_en) + '”下还有 ' + n + ' 篇论文，不能删除这个项目。');
  }
  writeAtomic(store.setProjects(src, clean));
  return { state: await state() };
}

async function publish({ message }) {
  const msg = String(message || '').trim();
  if (!msg) throw new HttpError(400, '提交说明不能为空');
  let g = await gitState();
  if (g.branch !== 'main') throw new HttpError(400, '现在在分支 ' + g.branch + ' 上，网站是从 main 发布的。');
  store.checkScripts(read());

  const fetched = await git(['fetch', '--quiet'], 30000);
  g = await gitState();
  if (g.behind > 0) throw new HttpError(409, 'GitHub 上有 ' + g.behind + ' 个本地还没有的提交。先在终端里运行 git pull，再回来发布。');

  if (g.dirty) {
    const c = await git(['commit', '-m', msg, '--', REL]);
    if (c.code) throw new HttpError(500, 'git commit 失败：' + (c.stderr || c.stdout).trim());
  }
  g = await gitState();
  if (!g.upstream) throw new HttpError(500, 'main 没有对应的远端分支，无法推送。');
  if (g.ahead === 0) return { pushed: false, state: await state() };

  const p = await git(['push'], 120000);
  if (p.code) {
    const why = (p.stderr || p.stdout).trim().split('\n').slice(-3).join(' ');
    const net = fetched.code ? '（连不上 GitHub？）' : '';
    throw new HttpError(502, '推送失败' + net + '：' + why + ' 修改已经在本地提交，下次点“发布”会再推送。');
  }
  return { pushed: true, state: await state() };
}

// ---- http -------------------------------------------------------------------

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.pdf': 'application/pdf', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml'
};

function send(res, code, body, type = 'application/json; charset=utf-8') {
  res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

function serveFile(res, base, rel) {
  const parts = rel.split('/').filter(Boolean);
  if (parts.some(p => p.startsWith('.') || p === 'node_modules')) return send(res, 404, 'Not found', 'text/plain');
  let file = path.join(base, ...parts);
  if (!file.startsWith(base)) return send(res, 404, 'Not found', 'text/plain');
  try {
    if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    send(res, 200, fs.readFileSync(file), TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream');
  } catch {
    send(res, 404, 'Not found', 'text/plain');
  }
}

function body(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', c => { size += c.length; if (size > 4e6) { reject(new HttpError(413, 'Too large')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}); } catch { reject(new HttpError(400, 'Bad JSON')); } });
    req.on('error', reject);
  });
}

const ROUTES = {
  'GET state': () => state(),
  'POST save': b => serial(() => save(b)),
  'POST delete': b => serial(() => remove(b)),
  'POST publish': b => serial(() => publish(b)),
  'POST projects': b => serial(() => saveProjects(b)),
  'POST lookup': async b => ({ results: await lookup(b.q) }),
  'POST translate': async b => {
    const { papers, projects } = store.parse(read());
    return translate({ text: b.text, from: b.from, to: b.to, project: b.project, authors: b.authors, papers: papers.map(p => p.value), projects });
  }
};

let port = START_PORT;
const server = http.createServer(async (req, res) => {
  // Only this machine, under the name the page was opened with.
  const host = String(req.headers.host || '');
  if (host !== '127.0.0.1:' + port && host !== 'localhost:' + port) return send(res, 403, 'Forbidden', 'text/plain');

  const url = new URL(req.url, 'http://' + host);
  const p = decodeURIComponent(url.pathname);

  if (p.startsWith('/api/')) {
    if (req.headers['x-token'] !== TOKEN) return send(res, 403, { error: 'Forbidden' });
    const route = ROUTES[req.method + ' ' + p.slice(5)];
    if (!route) return send(res, 404, { error: 'Not found' });
    try {
      send(res, 200, await route(req.method === 'POST' ? await body(req) : {}));
    } catch (err) {
      if (!err.status) console.error(err);
      send(res, err.status || 500, { error: err.message || String(err) });
    }
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed', 'text/plain');
  if (p === '/' || p === '/index.html') {
    const html = fs.readFileSync(path.join(HERE, 'index.html'), 'utf8').replace('{{TOKEN}}', TOKEN);
    return send(res, 200, html, TYPES['.html']);
  }
  if (p === '/app.js' || p === '/app.css') return serveFile(res, HERE, p);
  // The whole site, for the preview and the fonts.
  if (p === '/site') { res.writeHead(302, { Location: '/site/' }); return res.end(); }
  if (p.startsWith('/site/')) return serveFile(res, ROOT, p.slice(6));
  send(res, 404, 'Not found', 'text/plain');
});

server.on('error', err => {
  if (err.code === 'EADDRINUSE' && port < START_PORT + 10) { port++; server.listen(port, '127.0.0.1'); return; }
  console.error(err.message);
  process.exit(1);
});

server.listen(port, '127.0.0.1', () => {
  const url = 'http://127.0.0.1:' + port + '/';
  console.log('\n  论文库已打开：' + url);
  console.log('  关掉这个窗口（或按 Ctrl+C）就会停止。\n');
  if (OPEN) {
    const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'explorer' : 'xdg-open';
    execFile(cmd, [url], () => {});
  }
});
