// Fills in a paper's title, authors, year, venue and link from whatever is at
// hand: a DOI, an arXiv id or link, a publisher's web page, or the title.
// Sources: Crossref (DOIs, title search, Elsevier PIIs), the arXiv API, and the
// citation_* meta tags that most publisher and proceedings pages carry.
//
// Conventions from README §10.2: link = DOI if there is one, else arXiv;
// venue = 'arXiv' for preprints; year = the year the work first became public
// (so a paper on arXiv in 2023 and in a journal in 2024 gets 2023).

const UA = 'paper-tool/1.0 (local editor of a personal academic website)';

async function get(url, accept = 'application/json') {
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: accept }, signal: AbortSignal.timeout(15000), redirect: 'follow' });
  if (!res.ok) {
    const err = new Error(new URL(url).host + ' 返回 ' + res.status);
    err.status = res.status;
    throw err;
  }
  return res;
}

// ---- Cleaning -------------------------------------------------------------

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

export function clean(s) {
  return String(s || '')
    .replace(/<[^>]+>/g, '')
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) =>
      e[0] === '#' ? String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : +e.slice(1)) : (ENTITIES[e.toLowerCase()] ?? m))
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[​﻿]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// "WANG" -> "Wang", but leave "McDonald", "de la Cruz" and initials alone.
function nameCase(s) {
  return /[a-z]/.test(s) ? s : s.toLowerCase().replace(/(^|[\s\-'])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
}

const norm = s => clean(s).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

function similarity(a, b) {
  const A = new Set(norm(a).split(' ')), B = new Set(norm(b).split(' '));
  let n = 0;
  for (const w of A) if (B.has(w)) n++;
  return n / Math.max(A.size, B.size, 1);
}

// ---- Crossref ---------------------------------------------------------------

function fromCrossref(w) {
  let title = clean((w.title || [])[0]);
  const sub = clean((w.subtitle || [])[0]);
  if (sub && !norm(title).includes(norm(sub))) title += ': ' + sub;
  const date = w['published-online'] || w['published-print'] || w.issued || w.published || w.created;
  const year = date && date['date-parts'] && date['date-parts'][0] && date['date-parts'][0][0];
  let venue = clean((w['container-title'] || [])[0]);
  if (!venue && w.type === 'posted-content') venue = clean((w.institution || [])[0]?.name || w.publisher);
  if (!venue && w.type === 'book') venue = clean(w.publisher);
  return {
    title_en: title,
    authors: (w.author || []).map(a => (a.given && a.family ? nameCase(clean(a.given)) + ' ' + nameCase(clean(a.family)) : clean(a.name || a.family || ''))).filter(Boolean).join(', '),
    year: year || '',
    venue,
    link: 'https://doi.org/' + w.DOI,
    source: 'Crossref'
  };
}

async function crossrefDoi(doi) {
  const res = await get('https://api.crossref.org/works/' + encodeURIComponent(doi));
  return fromCrossref((await res.json()).message);
}

async function crossrefSearch(q, rows = 5) {
  const url = 'https://api.crossref.org/works?rows=' + rows + '&query.bibliographic=' + encodeURIComponent(q) +
    '&select=DOI,title,subtitle,author,issued,published,published-online,published-print,created,container-title,type,publisher';
  const res = await get(url);
  return (await res.json()).message.items.map(fromCrossref);
}

async function crossrefPii(pii) {
  const res = await get('https://api.crossref.org/works?rows=1&filter=alternative-id:' + encodeURIComponent(pii));
  const items = (await res.json()).message.items;
  return items.length ? fromCrossref(items[0]) : null;
}

// ---- arXiv --------------------------------------------------------------------

const tag = (xml, name) => { const m = xml.match(new RegExp('<' + name + '[^>]*>([\\s\\S]*?)</' + name + '>')); return m ? m[1] : ''; };

async function arxiv(query) {
  const res = await get('https://export.arxiv.org/api/query?' + query, 'application/atom+xml');
  const xml = await res.text();
  return xml.split('<entry>').slice(1).map(e => {
    const id = tag(e, 'id').replace(/^https?:\/\/arxiv\.org\/abs\//, '').replace(/v\d+$/, '');
    return {
      title_en: clean(tag(e, 'title')),
      authors: [...e.matchAll(/<name>([\s\S]*?)<\/name>/g)].map(m => clean(m[1])).join(', '),
      year: +tag(e, 'published').slice(0, 4) || '',
      venue: 'arXiv',
      link: 'https://arxiv.org/abs/' + id,
      doi: clean(tag(e, 'arxiv:doi')),
      source: 'arXiv'
    };
  }).filter(p => p.title_en && !/^Error$/i.test(p.title_en));
}

// An arXiv paper that has since been published: venue and DOI link from the
// published version, year from arXiv (when it first became public).
async function withPublished(p) {
  if (!p.doi) return p;
  try {
    const pub = await crossrefDoi(p.doi);
    return { ...p, venue: pub.venue || p.venue, link: pub.link, note: 'arXiv ' + p.year + ' 首次公开，后来发表于 ' + (pub.venue || '期刊') };
  } catch {
    return p;
  }
}

// ---- Publisher pages --------------------------------------------------------

function metaTags(html) {
  const out = {};
  for (const m of html.matchAll(/<meta\s+[^>]*>/gi)) {
    const t = m[0];
    const name = (t.match(/\b(?:name|property)\s*=\s*["']([^"']+)["']/i) || [])[1];
    const content = (t.match(/\bcontent\s*=\s*"([^"]*)"/i) || t.match(/\bcontent\s*=\s*'([^']*)'/i) || [])[1];
    if (!name || content === undefined) continue;
    const k = name.toLowerCase();
    (out[k] = out[k] || []).push(clean(content));
  }
  return out;
}

async function fromPage(url) {
  let html;
  try {
    html = await (await get(url, 'text/html')).text();
  } catch (err) {
    throw new Error('打不开这个网页（' + err.message + '）。换成 DOI、arXiv 编号或标题试试。');
  }
  const m = metaTags(html);
  const doi = (m['citation_doi'] || m['dc.identifier'] || m['prism.doi'] || []).map(d => d.replace(/^(doi:|https?:\/\/(dx\.)?doi\.org\/)/i, '')).find(d => /^10\.\d{4,9}\//.test(d));
  if (doi) {
    try { return [{ ...(await crossrefDoi(doi)), source: 'Crossref' }]; } catch { /* fall through to the page's own tags */ }
  }
  const title = (m['citation_title'] || m['dc.title'] || [])[0];
  if (!title) throw new Error('这个网页上找不到论文信息。换成 DOI、arXiv 编号或标题试试。');
  const date = (m['citation_publication_date'] || m['citation_date'] || m['citation_online_date'] || m['dc.date'] || [])[0] || '';
  return [{
    title_en: title,
    authors: (m['citation_author'] || m['dc.creator'] || []).map(a => (a.includes(',') ? a.split(',').map(s => s.trim()).reverse().join(' ') : a)).join(', '),
    year: +(date.match(/(19|20)\d\d/) || [])[0] || '',
    venue: (m['citation_journal_title'] || m['citation_conference_title'] || m['citation_inbook_title'] || m['citation_publisher'] || [])[0] || '',
    link: doi ? 'https://doi.org/' + doi : url,
    source: new URL(url).host.replace(/^www\./, '')
  }];
}

// ---- Entry point ----------------------------------------------------------------

export function classify(input) {
  let q = String(input || '').trim();
  try { q = decodeURIComponent(q); } catch { /* keep as typed */ }
  let m = q.match(/arxiv\.org\/(?:abs|pdf|html)\/([a-z-]+(?:\.[a-z]{2})?\/\d{7}|\d{4}\.\d{4,5})/i)
    || q.match(/^(?:arxiv:\s*)?(\d{4}\.\d{4,5})(?:v\d+)?$/i)
    || q.match(/^(?:arxiv:\s*)?([a-z-]+(?:\.[a-z]{2})?\/\d{7})(?:v\d+)?$/i)
    || q.match(/10\.48550\/arxiv\.(\d{4}\.\d{4,5})/i);
  if (m) return { kind: 'arxiv', id: m[1] };
  m = q.match(/\b(10\.\d{4,9}\/[^\s"<>]+)/);
  if (m) return { kind: 'doi', id: m[1].replace(/[.,;)\]]+$/, '').replace(/\/(full|abstract|pdf|epdf)$/i, '') };
  m = q.match(/sciencedirect\.com\/science\/article\/(?:abs\/)?pii\/(S?[0-9X]+)/i);
  if (m) return { kind: 'pii', id: m[1], url: q };
  if (/^https?:\/\//i.test(q)) return { kind: 'url', url: q };
  return { kind: 'title', q };
}

// Returns a list of candidates (the best first). Each has the paper fields
// plus `source` and sometimes `note`.
export async function lookup(input) {
  const c = classify(input);
  if (c.kind === 'title' && c.q.length < 8) throw new Error('标题太短，多写几个词。');

  if (c.kind === 'arxiv') {
    const found = await arxiv('id_list=' + encodeURIComponent(c.id));
    if (!found.length) throw new Error('arXiv 上没有 ' + c.id);
    return [await withPublished(found[0])];
  }
  if (c.kind === 'doi') {
    try {
      return [await crossrefDoi(c.id)];
    } catch (err) {
      if (err.status === 404) throw new Error('Crossref 里没有这个 DOI：' + c.id);
      throw err;
    }
  }
  if (c.kind === 'pii') {
    const p = await crossrefPii(c.id).catch(() => null);
    return p ? [p] : fromPage(c.url);
  }
  if (c.kind === 'url') return fromPage(c.url);

  // A title: ask Crossref and arXiv at once, merge the same paper found in
  // both, and rank by how closely the title matches what was typed.
  const [cr, ax] = await Promise.allSettled([crossrefSearch(c.q), arxiv('max_results=3&search_query=' + encodeURIComponent('ti:"' + c.q.replace(/["]/g, '') + '"'))]);
  if (cr.status === 'rejected' && ax.status === 'rejected') throw new Error('Crossref 和 arXiv 都连不上：' + cr.reason.message);
  const list = cr.status === 'fulfilled' ? cr.value : [];
  for (const a of ax.status === 'fulfilled' ? ax.value : []) {
    const same = list.find(p => norm(p.title_en) === norm(a.title_en));
    if (!same) list.push(a);
    else if (a.year && (!same.year || a.year < same.year)) {
      same.note = 'arXiv ' + a.year + ' 首次公开';
      same.year = a.year;
    }
  }
  const ranked = list
    .map(p => ({ p, s: similarity(p.title_en, c.q) }))
    .filter(x => x.p.title_en && x.s >= 0.3)
    .sort((a, b) => b.s - a.s)
    .slice(0, 5)
    .map(x => x.p);
  if (!ranked.length) throw new Error('没有找到标题相近的论文。');
  return ranked;
}
