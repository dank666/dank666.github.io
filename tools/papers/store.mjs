// Reads and edits the PAPERS array inside reading.html without touching the
// rest of the file. Every entry is located by its exact position in the text,
// so saving one paper rewrites only that paper's `{ … }` block: comments, the
// order of the list and all other entries stay byte-for-byte as they were.
//
// No dependencies. Used by tools/papers/server.mjs and tests/papers-store.test.mjs.

import vm from 'node:vm';

// Field order in reading.html. Fields not listed here (should one ever be
// added by hand) are kept and written after these.
const ORDER = ['title_en', 'title_zh', 'authors', 'year', 'venue', 'link', 'project', 'topics', 'note_en', 'note_zh', 'note_de'];
// Always written, even when empty (README §10.2: `link: ''` when there is none).
const REQUIRED = ['title_en', 'authors', 'year', 'venue', 'link', 'project', 'topics'];

const ENTRY_INDENT = '    ';
const FIELD_INDENT = '      ';

// ---- Scanning -------------------------------------------------------------

// Index just past the string literal that starts at i (', " or `).
function endOfString(src, i) {
  const q = src[i];
  for (let j = i + 1; j < src.length; j++) {
    if (src[j] === '\\') { j++; continue; }
    if (src[j] === q) return j + 1;
    if (src[j] === '\n' && q !== '`') throw new Error('Unterminated string at offset ' + i);
  }
  throw new Error('Unterminated string at offset ' + i);
}

// Walks src from `from`, calling visit(char, index) for every character that
// is code (not inside a string or comment). Stops when visit returns true.
function walk(src, from, visit) {
  for (let i = from; i < src.length; i++) {
    const c = src[i];
    if (c === '/' && src[i + 1] === '/') { const n = src.indexOf('\n', i); i = n < 0 ? src.length : n; continue; }
    if (c === '/' && src[i + 1] === '*') { const n = src.indexOf('*/', i + 2); if (n < 0) throw new Error('Unterminated comment'); i = n + 1; continue; }
    if (c === "'" || c === '"' || c === '`') { i = endOfString(src, i) - 1; continue; }
    if (visit(c, i)) return i;
  }
  return -1;
}

// Finds `var NAME = [ … ]` and the top-level `{ … }` entries inside it.
export function locateArray(src, name) {
  const decl = src.indexOf('var ' + name + ' = [');
  if (decl < 0) throw new Error('var ' + name + ' = [ not found');
  const open = src.indexOf('[', decl);
  const entries = [];
  let depth = 0, start = -1;
  const close = walk(src, open, (c, i) => {
    if (c === '[' || c === '{') {
      if (depth === 1 && c === '{') start = i;
      depth++;
    } else if (c === ']' || c === '}') {
      depth--;
      if (depth === 1 && c === '}') entries.push({ start, end: i + 1 });
      if (depth === 0) return true;
    }
    return false;
  });
  if (close < 0) throw new Error('var ' + name + ': closing ] not found');
  return { open, close, entries };
}

// Evaluates a JS literal (an object or array taken from the file) in an empty
// context and returns it as plain JSON data.
function evaluate(text) {
  const value = vm.runInNewContext('(' + text + ')', Object.create(null), { timeout: 1000 });
  return JSON.parse(JSON.stringify(value));
}

export function parse(src) {
  const arr = locateArray(src, 'PAPERS');
  const values = evaluate(src.slice(arr.open, arr.close + 1));
  if (values.length !== arr.entries.length) throw new Error('PAPERS holds something other than { … } entries');
  const papers = arr.entries.map((e, i) => ({ ...e, value: values[i] }));
  const projArr = locateArray(src, 'PROJECTS');
  const projects = evaluate(src.slice(projArr.open, projArr.close + 1));
  return { papers, projects, open: arr.open, close: arr.close };
}

// Compiles (does not run) every inline <script> of the page. This is the
// check that catches the "one missing comma blanks the whole page" mistake.
export function checkScripts(html) {
  const re = /<script(\s[^>]*)?>([\s\S]*?)<\/script>/gi;
  let m, n = 0;
  while ((m = re.exec(html))) {
    if (m[1] && /\ssrc\s*=/.test(m[1])) continue;
    if (m[1] && /type\s*=\s*["']?(application\/(ld\+)?json|text\/template)/i.test(m[1])) continue;
    try {
      new vm.Script(m[2], { filename: 'inline-script-' + (++n) });
    } catch (err) {
      const line = html.slice(0, m.index).split('\n').length;
      throw new Error('Script error in the <script> that starts on line ' + line + ': ' + err.message);
    }
  }
}

// ---- Writing --------------------------------------------------------------

function quote(s) {
  return "'" + String(s)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r\n?|\n/g, '\\n')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
    .replace(/<\/(script)/gi, '<\\/$1') + "'";
}

function literal(v) {
  if (typeof v === 'string') return quote(v);
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (v === null) return 'null';
  if (Array.isArray(v)) return '[' + v.map(literal).join(', ') + ']';
  return '{ ' + Object.keys(v).map(k => key(k) + ': ' + literal(v[k])).join(', ') + ' }';
}

function key(k) {
  return /^[A-Za-z_$][\w$]*$/.test(k) ? k : quote(k);
}

function isEmpty(v) {
  return v === undefined || v === null || (typeof v === 'string' && v.trim() === '') || (Array.isArray(v) && v.length === 0);
}

// The paper as it will read back from the file: fields in the file's order,
// optional fields left out when empty, required ones always present.
export function normalize(paper) {
  const keys = ORDER.filter(k => k in paper || REQUIRED.includes(k)).concat(Object.keys(paper).filter(k => !ORDER.includes(k)));
  const out = {};
  for (const k of keys) {
    const v = paper[k];
    if (isEmpty(v) && !REQUIRED.includes(k)) continue;
    out[k] = v === undefined || v === null ? (k === 'topics' ? [] : '') : v;
  }
  return out;
}

// One entry, formatted like the existing ones. The first line has no indent
// (the entry's indent is already in the file before its `{`).
export function serialize(paper) {
  const p = normalize(paper);
  const lines = Object.keys(p).map(k => FIELD_INDENT + key(k) + ': ' + literal(p[k]));
  return '{\n' + lines.join(',\n') + '\n' + ENTRY_INDENT + '}';
}

// JSON with sorted keys, for comparing two papers regardless of field order.
function canonical(v) {
  if (Array.isArray(v)) return '[' + v.map(canonical).join(',') + ']';
  if (v && typeof v === 'object') return '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + canonical(v[k])).join(',') + '}';
  return JSON.stringify(v);
}
export const same = (a, b) => canonical(a) === canonical(b);

// The position after which a new paper goes: after the last paper of the same
// (first-listed) project, so the file stays grouped by project.
function insertAfter(papers, paper) {
  const first = p => (Array.isArray(p.project) ? p.project[0] : p.project);
  for (let i = papers.length - 1; i >= 0; i--) {
    if (first(papers[i].value) === first(paper)) return i;
  }
  return papers.length - 1;
}

// Applies one change and returns the new file text. Throws (and changes
// nothing) unless the result parses back to exactly the intended list and
// every script on the page still compiles.
//   { type: 'add', paper }
//   { type: 'update', index, paper }
//   { type: 'delete', index }
export function apply(src, op) {
  const { papers, close } = parse(src);
  if (op.paper) op = { ...op, paper: normalize(op.paper) };
  const expected = papers.map(p => p.value);
  let out, at;

  if (op.type === 'update') {
    const e = papers[op.index];
    if (!e) throw new Error('No paper at index ' + op.index);
    out = src.slice(0, e.start) + serialize(op.paper) + src.slice(e.end);
    expected[op.index] = op.paper;
    at = op.index;
  } else if (op.type === 'add') {
    if (papers.length === 0) {
      out = src.slice(0, close) + '\n' + ENTRY_INDENT + serialize(op.paper) + '\n  ' + src.slice(close).replace(/^\s*/, '');
      expected.push(op.paper);
      at = 0;
    } else {
      const i = insertAfter(papers, op.paper);
      const pos = papers[i].end;
      out = src.slice(0, pos) + ',\n' + ENTRY_INDENT + serialize(op.paper) + src.slice(pos);
      expected.splice(i + 1, 0, op.paper);
      at = i + 1;
    }
  } else if (op.type === 'delete') {
    const e = papers[op.index];
    if (!e) throw new Error('No paper at index ' + op.index);
    const after = src.slice(e.end).match(/^[ \t]*,[ \t]*\n?/);
    if (after) {
      // Remove the whole line(s) of the entry and its trailing comma.
      const lineStart = src.lastIndexOf('\n', e.start - 1) + 1;
      const from = /^[ \t]*$/.test(src.slice(lineStart, e.start)) ? lineStart : e.start;
      out = src.slice(0, from) + src.slice(e.end + after[0].length);
    } else if (op.index > 0) {
      // The last entry: remove the comma after the one before it.
      out = src.slice(0, papers[op.index - 1].end) + src.slice(e.end);
    } else {
      out = src.slice(0, e.start) + src.slice(e.end);
    }
    expected.splice(op.index, 1);
    at = -1;
  } else {
    throw new Error('Unknown change ' + op.type);
  }

  const check = parse(out).papers.map(p => p.value);
  if (!same(check, expected)) {
    throw new Error('The edited file does not read back as intended; nothing was saved.');
  }
  checkScripts(out);
  return { src: out, index: at };
}

// ---- Comparing with the last commit ---------------------------------------

const norm = s => String(s || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

// Which papers are new, changed or gone compared with `base` (the list as of
// the last commit). Matched by title first, then by link.
export function compare(base, current) {
  const used = new Set();
  const byTitle = new Map(), byLink = new Map();
  base.forEach((p, i) => {
    const t = norm(p.title_en);
    if (!byTitle.has(t)) byTitle.set(t, i);
    if (p.link && !byLink.has(p.link)) byLink.set(p.link, i);
  });
  const status = current.map(p => {
    let i = byTitle.get(norm(p.title_en));
    if (i === undefined || used.has(i)) i = p.link ? byLink.get(p.link) : undefined;
    if (i === undefined || used.has(i)) return 'new';
    used.add(i);
    return same(base[i], p) ? '' : 'changed';
  });
  const removed = base.filter((_, i) => !used.has(i)).map(p => p.title_en);
  return { status, removed };
}

export { norm };
