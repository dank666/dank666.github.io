#!/usr/bin/env node
// Regenerates the data-driven parts of index.html from data/content.mjs.
//
//   node tools/build.mjs           rewrite index.html
//   node tools/build.mjs --check   change nothing; exit 1 if index.html is out of date
//
// No dependencies. Each generated block sits between a pair of comments
//   <!-- BEGIN GENERATED: name … -->   and   <!-- END GENERATED: name -->
// and is replaced wholesale, so never hand-edit inside those markers.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import * as data from '../data/content.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const INDEX = path.join(root, 'index.html');
const CHECK = process.argv.includes('--check');

// ---- helpers ---------------------------------------------------------------
function need(pair, where) {
  const ok = pair && typeof pair.en === 'string' && typeof pair.zh === 'string' && pair.en.trim() && pair.zh.trim();
  if (!ok) throw new Error(`${where}: needs a non-empty "en" AND "zh" text`);
  return pair;
}

function indent(text, n) {
  const pad = ' '.repeat(n);
  return text.split('\n').map((l) => (l ? pad + l : l)).join('\n');
}

// Attribute values: escape quotes and any bare "&".
function attr(value) {
  return String(value)
    .replace(/&(?!amp;|lt;|gt;|quot;|#\d+;)/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/\r?\n/g, '&#10;');
}

// <span class="lang-en">EN</span><span class="lang-zh">ZH</span> (for use inside another element)
function spans(value) {
  return `<span class="lang-en">${value.en}</span><span class="lang-zh">${value.zh}</span>`;
}

// <tag class="cls lang-en">EN</tag> followed by <tag class="cls lang-zh">ZH</tag>
function pair(tag, cls, value) {
  const c = (lang) => [cls, lang].filter(Boolean).join(' ');
  return `<${tag} class="${c('lang-en')}">${value.en}</${tag}>\n<${tag} class="${c('lang-zh')}">${value.zh}</${tag}>`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ---- News ---------------------------------------------------------------------
function renderNews() {
  const item = (n, i) => {
    const m = /^(\d{4})-(\d{2})$/.exec(n.date || '');
    if (!m || +m[2] < 1 || +m[2] > 12) throw new Error(`news[${i}].date: expected 'YYYY-MM', got ${JSON.stringify(n.date)}`);
    need(n.text, `news[${i}].text`);
    return [
      '<div class="timeline-item">',
      `  <div class="timeline-meta lang-en"><span>${MONTHS[+m[2] - 1]} ${m[1]}</span></div>`,
      `  <div class="timeline-meta lang-zh"><span>${m[1]} 年 ${+m[2]} 月</span></div>`,
      indent(pair('p', '', n.text), 2),
      '</div>'
    ].join('\n');
  };
  const items = data.news.map(item);
  const shown = items.slice(0, data.NEWS_VISIBLE);
  const rest = items.slice(data.NEWS_VISIBLE);

  let html = `<div class="timeline">\n${indent(shown.join('\n'), 2)}`;
  if (rest.length) {
    html += `\n  <div class="timeline-more" id="newsMore" hidden>\n${indent(rest.join('\n'), 4)}\n  </div>`;
  }
  html += '\n</div>';
  if (rest.length) {
    html += `

<button class="show-more-btn" id="newsToggle" type="button" aria-expanded="false" aria-controls="newsMore" data-state="collapsed">
  <span class="label-show"><span class="lang-en">Show earlier updates</span><span class="lang-zh">显示更早的动态</span></span>
  <span class="label-hide"><span class="lang-en">Hide earlier updates</span><span class="lang-zh">收起</span></span>
</button>`;
  }
  return html;
}

// ---- Publications --------------------------------------------------------------
const STATUS = {
  'in-preparation': { en: 'In Preparation', zh: '撰写中' },
  'under-review': { en: 'Under Review', zh: '审稿中' },
  preprint: { en: 'Preprint', zh: '预印本' },
  published: { en: 'Published', zh: '已发表' }
};

// key in `links`, English label, Chinese label
const LINK_KINDS = [
  ['pdf', 'PDF', 'PDF'],
  ['arxiv', 'arXiv', 'arXiv'],
  ['code', 'Code', '代码'],
  ['bibtex', 'BibTeX', 'BibTeX']
];

function renderLinks(links = {}) {
  const buttons = LINK_KINDS.map(([key, en, zh]) => {
    const value = String(links[key] || '').trim();
    const label = en === zh ? en : spans({ en, zh });
    if (!value) {
      if (!data.SHOW_PLACEHOLDER_LINKS) return '';
      return `<span class="pub-btn is-soon" aria-disabled="true" title="Available after publication / 论文发表后提供">${label}</span>`;
    }
    if (key === 'bibtex') {
      return `<button class="pub-btn" type="button" data-bibtex="${attr(value)}"><span class="pub-btn-label">${label}</span><span class="pub-btn-done" aria-hidden="true">${spans({ en: 'Copied ✓', zh: '已复制 ✓' })}</span></button>`;
    }
    return `<a class="pub-btn" href="${attr(value)}" target="_blank" rel="noopener">${label}</a>`;
  }).filter(Boolean);
  if (!buttons.length) return '';
  return `<div class="pub-links" role="group" aria-label="Paper links / 论文链接">\n${indent(buttons.join('\n'), 2)}\n</div>`;
}

function renderPublications() {
  const cards = data.publications.map((p, i) => {
    need(p.title, `publications[${i}].title`);
    const status = STATUS[p.status];
    if (!status) throw new Error(`publications[${i}].status: expected one of ${Object.keys(STATUS).join(', ')}, got ${JSON.stringify(p.status)}`);
    const row = [`<span class="status-pill status-${p.status}">${spans(status)}</span>`];
    if (p.meta) row.push(pair('span', 'publication-meta', need(p.meta, `publications[${i}].meta`)));
    const links = renderLinks(p.links);
    return [
      '<div class="publication-item pub-card">',
      indent(pair('div', 'publication-title', p.title), 2),
      `  <div class="pub-status-row">\n${indent(row.join('\n'), 4)}\n  </div>`,
      links && indent(links, 2),
      '</div>'
    ].filter(Boolean).join('\n');
  });
  return `<div class="list">\n${indent(cards.join('\n'), 2)}\n  <span class="sr-only" id="bibStatus" role="status" aria-live="polite"></span>\n</div>`;
}

// ---- Awards ----------------------------------------------------------------------
function renderAwards() {
  const lists = (items) => ['en', 'zh']
    .map((lang) => `<ul class="award-list lang-${lang}">\n${indent(items.map((it) => `<li>${it[lang]}</li>`).join('\n'), 2)}\n</ul>`)
    .join('\n');

  const cards = data.awards.map((group, g) => {
    need(group.title, `awards[${g}].title`);
    const items = group.items.map((it, i) => need(it, `awards[${g}].items[${i}]`));
    const shown = Number.isInteger(group.visible) && group.visible > 0 && group.visible < items.length ? group.visible : items.length;

    const parts = ['<div class="card">', indent(pair('h3', '', group.title), 2), indent(lists(items.slice(0, shown)), 2)];
    if (shown < items.length) {
      const id = `awardsMore${g}`;
      const n = items.length - shown;
      parts.push(`  <div class="award-more" id="${id}" hidden>\n${indent(lists(items.slice(shown)), 4)}\n  </div>`);
      parts.push(`  <button class="show-more-btn" id="awardsToggle${g}" type="button" aria-expanded="false" aria-controls="${id}" data-state="collapsed">
    <span class="label-show"><span class="lang-en">Show ${n} more</span><span class="lang-zh">再显示 ${n} 项</span></span>
    <span class="label-hide"><span class="lang-en">Show fewer</span><span class="lang-zh">收起</span></span>
  </button>`);
    }
    parts.push('</div>');
    return parts.join('\n');
  });
  return `<div class="list">\n${indent(cards.join('\n'), 2)}\n</div>`;
}

// ---- Projects ----------------------------------------------------------------------
function renderFigure(fig, where) {
  if (!fig) return '';
  const caption = fig.caption ? `\n  <figcaption>${spans(need(fig.caption, `${where}.caption`))}</figcaption>` : '';
  if (fig.type === 'flow') {
    if (!Array.isArray(fig.steps) || fig.steps.length < 2) throw new Error(`${where}.steps: a flow needs at least 2 steps`);
    const steps = fig.steps.map((st, i) => [
      '<li class="flow-step">',
      `  <span class="flow-kicker">${spans(need(st.label, `${where}.steps[${i}].label`))}</span>`,
      `  <span class="flow-title">${spans(need(st.title, `${where}.steps[${i}].title`))}</span>`,
      '</li>'
    ].join('\n')).join('\n');
    return `<figure class="flow">\n  <ol class="flow-steps">\n${indent(steps, 4)}\n  </ol>${caption}\n</figure>`;
  }
  if (fig.type === 'scope') {
    const items = (fig.items || []).map((it, i) => `<li>${spans(need(it, `${where}.items[${i}]`))}</li>`).join('\n');
    return `<figure class="flow scope">\n  <div class="scope-root">${spans(need(fig.title, `${where}.title`))}</div>\n  <ul class="scope-items">\n${indent(items, 4)}\n  </ul>${caption}\n</figure>`;
  }
  if (fig.type === 'image') {
    return `<figure class="flow flow-image">\n  <img src="${attr(fig.src)}" alt="${attr(fig.alt)}" width="${fig.width}" height="${fig.height}" loading="lazy" decoding="async">${caption}\n</figure>`;
  }
  throw new Error(`${where}.type: expected 'flow', 'scope' or 'image', got ${JSON.stringify(fig.type)}`);
}

function renderProjects() {
  const cards = data.projects.map((p, i) => {
    const where = `projects[${i}]`;
    need(p.title, `${where}.title`);
    need(p.description, `${where}.description`);
    const parts = ['<div class="card">', indent(pair('h3', '', p.title), 2)];
    if (p.tagline) parts.push(indent(pair('p', 'project-tagline', need(p.tagline, `${where}.tagline`)), 2));
    parts.push(indent(pair('p', '', p.description), 2));
    if (p.figure) parts.push(indent(renderFigure(p.figure, `${where}.figure`), 2));
    if (p.links && p.links.length) {
      const anchors = p.links.map((l, k) => `<a href="${attr(l.href)}">${spans(need(l.label, `${where}.links[${k}].label`))}</a>`).join('\n');
      parts.push(`  <p class="project-links">\n${indent(anchors, 4)}\n  </p>`);
    }
    if (p.gallery && p.gallery.length) {
      const imgs = p.gallery
        .map((g) => {
          const size = g.width && g.height ? ` width="${g.width}" height="${g.height}"` : '';
          return `<img src="${attr(g.src)}" alt="${attr(g.alt)}"${size} loading="lazy" decoding="async">`;
        })
        .join('\n');
      parts.push(`  <div class="project-gallery">\n${indent(imgs, 4)}\n  </div>`);
    }
    parts.push('</div>');
    return parts.join('\n');
  });
  return `<div class="list">\n${indent(cards.join('\n'), 2)}\n</div>`;
}

// ---- Splice into index.html ------------------------------------------------------------
const blocks = {
  news: renderNews,
  publications: renderPublications,
  awards: renderAwards,
  projects: renderProjects
};

function main() {
  const before = readFileSync(INDEX, 'utf8');
  let after = before;
  for (const [name, render] of Object.entries(blocks)) {
    const re = new RegExp(`(<!-- BEGIN GENERATED: ${name}\\b[^>]*-->)[\\s\\S]*?(\\n[ \\t]*<!-- END GENERATED: ${name} -->)`);
    if (!re.test(after)) throw new Error(`index.html has no "GENERATED: ${name}" block`);
    after = after.replace(re, (_, open, close) => `${open}\n${indent(render(), 6)}${close}`);
  }

  // The footer's "Last updated" text is a fallback for visitors whose browser can't
  // ask the server for the real date (the page script overwrites it when it can).
  // It is refreshed whenever the build runs, but never checked, so a new month
  // alone does not make `--check` fail.
  function stampFooter(html) {
    const now = new Date();
    const en = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    const zh = `${now.getFullYear()} 年 ${now.getMonth() + 1} 月`;
    return html
      .replace(/(<span class="js-updated-en">)[^<]*(<\/span>)/, `$1${en}$2`)
      .replace(/(<span class="js-updated-zh">)[^<]*(<\/span>)/, `$1${zh}$2`);
  }

  if (!CHECK) after = stampFooter(after);

  if (CHECK) {
    if (after !== before) {
      console.error('index.html is out of date with data/content.mjs — run: node tools/build.mjs');
      process.exit(1);
    }
    console.log('index.html is up to date.');
  } else if (after !== before) {
    writeFileSync(INDEX, after);
    console.log('index.html updated.');
  } else {
    console.log('index.html already up to date.');
  }
}

try {
  main();
} catch (err) {
  console.error(`\nBuild failed: ${err.message}\n`);
  process.exit(1);
}
