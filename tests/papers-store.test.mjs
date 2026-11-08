// Tests for tools/papers/store.mjs (how the paper tool edits reading.html).
// Run: node tests/papers-store.test.mjs
//
// 1. reading.html itself: every inline script compiles, PAPERS and PROJECTS
//    read back, and every paper names a known project.
// 2. Editing: random sequences of add / update / delete on a copy of the real
//    file. After each step the file must read back to exactly the intended
//    list, and every byte outside the touched entry must be unchanged.
// 3. Strings that would break the page (apostrophes, backslashes, newlines,
//    "</script>") come out escaped.
// 4. Comparing with the last commit; 5. rewriting PROJECTS.
// Exits with a non-zero code on failure.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as S from '../tools/papers/store.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(ROOT, 'reading.html'), 'utf8');
let fails = 0, checks = 0;
const ok = (cond, msg) => { checks++; if (!cond) { fails++; if (fails < 15) console.log('FAIL', msg); } };

// ---- 1. the real file -------------------------------------------------------
S.checkScripts(html);
const { papers, projects } = S.parse(html);
ok(papers.length > 0, 'PAPERS is empty');
const projectIds = new Set(projects.map(p => p.id));
for (const { value: p } of papers) {
  const ids = Array.isArray(p.project) ? p.project : [p.project];
  ok(ids.length > 0 && ids.every(id => projectIds.has(id)), 'unknown project in ' + p.title_en);
  ok(typeof p.title_en === 'string' && p.title_en.trim() !== '', 'paper without title_en');
  ok(Number.isInteger(p.year), 'year is not a number in ' + p.title_en);
  ok(Array.isArray(p.topics), 'topics is not a list in ' + p.title_en);
}
// Not an error, only a heads-up: hand-formatted entries are fine, the tool
// just rewrites them in the standard layout the first time they are saved.
const loose = papers.filter(e => S.serialize(e.value) !== html.slice(e.start, e.end)).length;
if (loose) console.log('note: ' + loose + ' entries are not in the standard layout');

// ---- 2. random edits ----------------------------------------------------------
let seed = 7;
const rand = n => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed % n; };
const sample = i => ({
  title_en: 'Test paper ' + i + ': it\'s a "quoted" title',
  authors: 'A. Author, B. Author',
  year: 2000 + rand(27),
  venue: rand(2) ? 'arXiv' : 'Information Sciences',
  link: rand(3) ? 'https://doi.org/10.0000/test.' + i : '',
  project: rand(4) ? projects[rand(projects.length)].id : projects.slice(0, 2).map(p => p.id),
  topics: ['t-' + rand(5)],
  ...(rand(2) ? { note_en: 'Note ' + i + ' with a backslash \\ and </script> inside.', note_zh: '笔记 ' + i + '：“引号”。' } : {})
});

for (let run = 0; run < 6; run++) {
  let src = html;
  let model = papers.map(p => p.value);
  for (let step = 0; step < 25; step++) {
    const before = src;
    const r = rand(3);
    let res, touched;
    if (r === 0 || model.length === 0) {
      const p = sample(run * 100 + step);
      res = S.apply(src, { type: 'add', paper: p });
      model.splice(res.index, 0, p);
    } else if (r === 1) {
      const i = rand(model.length);
      const p = { ...model[i], ...sample(run * 100 + step) };
      touched = S.parse(src).papers[i];
      res = S.apply(src, { type: 'update', index: i, paper: p });
      model[i] = p;
    } else {
      const i = rand(model.length);
      touched = S.parse(src).papers[i];
      res = S.apply(src, { type: 'delete', index: i });
      model.splice(i, 1);
    }
    src = res.src;
    const back = S.parse(src).papers.map(p => p.value);
    ok(JSON.stringify(back) === JSON.stringify(model), `run ${run} step ${step}: list differs after ${['add', 'update', 'delete'][r]}`);
    if (touched) {
      // Outside the touched entry (plus the comma and line break around it)
      // nothing may change.
      const head = before.slice(0, touched.start - 8);
      const tail = before.slice(touched.end + 8);
      ok(src.startsWith(head) && src.endsWith(tail), `run ${run} step ${step}: bytes outside the entry changed`);
    }
  }
}

// ---- 3. escaping ----------------------------------------------------------------
const tricky = { title_en: "Fei Hao's \\ paper\nline two </SCRIPT>", authors: '', year: 2026, venue: '', link: '', project: projects[0].id, topics: [] };
const res = S.apply(html, { type: 'add', paper: tricky });
const back = S.parse(res.src).papers[res.index].value;
ok(back.title_en === tricky.title_en, 'tricky title did not survive: ' + JSON.stringify(back.title_en));
ok(!/<\/script/i.test(S.serialize(tricky)), '</script> was not escaped');
ok(S.serialize({ ...tricky, note_en: '  ', title_zh: '' }).indexOf('note_en') < 0, 'empty optional fields are written');
// The tool sends every field, empty ones included; saving must still succeed.
const withEmpty = S.apply(html, { type: 'update', index: 0, paper: { ...papers[0].value, title_zh: '', note_de: '' } });
ok(!('note_de' in S.parse(withEmpty.src).papers[0].value), 'an emptied note is not removed');

// ---- 4. comparing with the last commit ----------------------------------------
const base = papers.slice(0, 5).map(p => p.value);
const cur = [{ ...base[0], note_en: 'changed' }, base[1], base[3], base[4], sample(999)];
const cmp = S.compare(base, cur);
ok(JSON.stringify(cmp.status) === JSON.stringify(['changed', '', '', '', 'new']), 'compare status ' + JSON.stringify(cmp.status));
ok(cmp.removed.length === 1 && cmp.removed[0] === base[2].title_en, 'compare removed ' + JSON.stringify(cmp.removed));

// ---- 5. projects --------------------------------------------------------------------
// Writing PROJECTS back unchanged must not change a byte.
ok(S.setProjects(html, projects) === html, 'rewriting PROJECTS unchanged altered the file');
const kg = { id: 'kg-test', label_en: "Graphs: it's \\ </script>", label_zh: '图', label_de: '',
  groups: [{ id: 'g-one', label_en: 'One', label_zh: '一' }, { id: 'g-two', label_en: 'Two', label_zh: '二', label_de: 'Zwei' }] };
const withKg = S.setProjects(html, [...projects, kg]);
const kgBack = S.parse(withKg).projects;
ok(kgBack.length === projects.length + 1, 'new project not added');
ok(kgBack[kgBack.length - 1].label_en === kg.label_en, 'project label did not survive: ' + JSON.stringify(kgBack[kgBack.length - 1].label_en));
ok(!('label_de' in kgBack[kgBack.length - 1]), 'empty label_de was written');
ok(kgBack[kgBack.length - 1].groups[1].label_de === 'Zwei', 'group label_de lost');
ok(JSON.stringify(S.parse(withKg).papers.map(p => p.value)) === JSON.stringify(papers.map(p => p.value)), 'papers changed when PROJECTS changed');
// Only the PROJECTS array may change.
const pa = S.locateArray(html, 'PROJECTS');
ok(withKg.startsWith(html.slice(0, pa.open)) && withKg.endsWith(html.slice(pa.close + 1)), 'bytes outside PROJECTS changed');
// Removing it again gives back the original file.
ok(S.setProjects(withKg, projects) === html, 'removing the new project did not restore the file');

console.log(`${checks - fails}/${checks} checks passed (${papers.length} papers)`);
process.exit(fails ? 1 : 0);
