// Tests for lattice-core.js (the concept-lattice demo's maths). Run: node tests/lattice-core.test.js
//
// Every result is compared with an independent brute-force implementation that
// enumerates all subsets of objects and checks the definitions directly, on
// hundreds of random tables plus edge cases and the classic "Living beings and
// water" example (19 classical concepts). Exits with a non-zero code on failure.

const C = require('../lattice-core.js');
const pc = C.popcount;
let fails = 0, checks = 0;
const ok = (cond, msg) => { checks++; if (!cond) { fails++; if (fails < 15) console.log('FAIL', msg); } };

// ---- independent brute-force definitions (subset enumeration, no closure trick) ----
function bruteExtents(rows, nG, nM, kind) {
  const allM = (1 << nM) - 1, out = {};
  for (let X = 0; X < (1 << nG); X++) {
    let Y = allM, any = 0;
    for (let g = 0; g < nG; g++) if (X >> g & 1) { Y &= rows[g]; any |= rows[g]; }
    const Z = kind === 'threeway' ? (allM & ~any) : 0;
    let back = 0;
    for (let g = 0; g < nG; g++) if ((rows[g] & Y) === Y && (rows[g] & Z) === 0) back |= 1 << g;
    if (back === X) out[X] = { pos: Y, neg: Z };
  }
  return out;
}
const rowsOf = (inc, nG, nM) => inc.map(r => r.reduce((s, v, m) => s | (v ? 1 << m : 0), 0));

function checkContext(inc, nG, nM, label) {
  for (const kind of ['classical', 'threeway']) {
    const rows = rowsOf(inc, nG, nM);
    const brute = bruteExtents(rows, nG, nM, kind);
    const res = C.analyze(inc, nG, nM, kind, { drawLimit: 100000 });
    const got = {}; res.nodes.forEach(n => got[n.ext] = n);
    const bk = Object.keys(brute).map(Number).sort((a, b) => a - b), gk = Object.keys(got).map(Number).sort((a, b) => a - b);
    ok(JSON.stringify(bk) === JSON.stringify(gk), `${label} ${kind}: extents differ (brute ${bk.length} vs ${gk.length})`);
    ok(res.count === bk.length, `${label} ${kind}: count`);
    bk.forEach(e => { if (got[e]) { ok(got[e].pos === brute[e].pos && got[e].neg === brute[e].neg, `${label} ${kind}: intent of ${e}`); } });
    // sorted ascending by size
    for (let i = 1; i < res.nodes.length; i++) ok(pc(res.nodes[i - 1].ext) <= pc(res.nodes[i].ext), `${label} ${kind}: sort`);
    // covers vs brute force on the extents
    const E = res.nodes.map(n => n.ext), key = (a, b) => a + ',' + b;
    const want = new Set();
    for (let i = 0; i < E.length; i++) for (let j = 0; j < E.length; j++) {
      if (i !== j && E[i] !== E[j] && (E[i] & E[j]) === E[i]) {
        let between = false;
        for (let k = 0; k < E.length; k++) if (k !== i && k !== j && E[k] !== E[i] && E[k] !== E[j] && (E[i] & E[k]) === E[i] && (E[k] & E[j]) === E[k]) between = true;
        if (!between) want.add(key(i, j));
      }
    }
    const have = new Set(res.covers.map(c => key(c[0], c[1])));
    ok(want.size === have.size && [...want].every(x => have.has(x)), `${label} ${kind}: covers (want ${want.size}, have ${have.size})`);
    // labels: object at smallest concept containing it; attribute at largest concept whose intent has it
    for (let g = 0; g < nG; g++) {
      const cands = res.nodes.map((n, i) => [n, i]).filter(([n]) => n.ext >> g & 1).sort((a, b) => pc(a[0].ext) - pc(b[0].ext));
      ok(res.objectNode[g] === cands[0][1], `${label} ${kind}: object label ${g}`);
    }
    for (let m = 0; m < nM; m++) {
      const big = (want) => res.nodes.map((n, i) => [n, i]).filter(([n]) => (want === 'pos' ? n.pos : n.neg) >> m & 1).sort((a, b) => pc(b[0].ext) - pc(a[0].ext))[0];
      ok(res.attrNode[m] === big('pos')[1], `${label} ${kind}: attribute label ${m}`);
      if (kind === 'threeway') ok(res.negAttrNode[m] === big('neg')[1], `${label} ${kind}: negated attribute label ${m}`);
    }
    // layout: every cover goes strictly downward, every node placed in a level
    const L = C.layout(res);
    res.covers.forEach(([lo, up]) => ok(L.level[lo] > L.level[up], `${label} ${kind}: edge direction`));
    ok(L.levels.reduce((s, r) => s + r.length, 0) === res.nodes.length, `${label} ${kind}: layout covers all nodes`);
    ok(L.x.every(x => x > 0 && x < 1), `${label} ${kind}: x in (0,1)`);
    ok(L.levels[0].length === 1 && res.nodes[L.levels[0][0]].ext === (1 << nG) - 1, `${label} ${kind}: single top = all objects`);
  }
  // attribute-induced: brute force by its own definition, compared with analyze(transpose)
  const rows = rowsOf(inc, nG, nM), allM = (1 << nM) - 1, want = {};
  for (let Y = 0; Y < (1 << nM); Y++) {
    let pos = 0, neg = 0;
    for (let g = 0; g < nG; g++) { if ((rows[g] & Y) === Y) pos |= 1 << g; if ((rows[g] & Y) === 0) neg |= 1 << g; }
    let back = allM;
    for (let g = 0; g < nG; g++) { if (pos >> g & 1) back &= rows[g]; if (neg >> g & 1) back &= ~rows[g]; }
    if (back === Y) want[Y] = { pos, neg };
  }
  const ae = C.analyze(C.transpose(inc, nG, nM), nM, nG, 'threeway', { drawLimit: 100000 });
  const wk = Object.keys(want).map(Number).sort((a, b) => a - b), ak = ae.nodes.map(n => n.ext).sort((a, b) => a - b);
  ok(JSON.stringify(wk) === JSON.stringify(ak), `${label} AE: extents differ (${wk.length} vs ${ak.length})`);
  ae.nodes.forEach(n => { if (want[n.ext]) ok(want[n.ext].pos === n.pos && want[n.ext].neg === n.neg, `${label} AE: sides of ${n.ext}`); });
}

// ---- known example: Ganter & Wille, "Living beings and water" ----
const A = 'abcdefghi'.split('');
const living = { leech: 'abg', bream: 'abgh', frog: 'abcgh', dog: 'acghi', 'spike-weed': 'abdf', reed: 'abcdf', bean: 'acde', maize: 'acdf' };
const names = Object.keys(living);
const inc = names.map(n => A.map(a => living[n].includes(a)));
const cl = C.analyze(inc, 8, 9, 'classical');
console.log('Living beings & water: classical concepts =', cl.count, '(literature: 19)');
ok(cl.count === 19, 'living beings has 19 classical concepts');
const top = cl.nodes[cl.nodes.length - 1], bottom = cl.nodes[0];
ok(top.ext === 255 && top.pos === 1, 'top concept = all objects with only "needs water"');
ok(bottom.ext === 0 && bottom.pos === 511, 'bottom concept = no object with all attributes');
const tw = C.analyze(inc, 8, 9, 'threeway');
console.log('Living beings & water: three-way (object-induced) concepts =', tw.count);
checkContext(inc, 8, 9, 'living');

// ---- small toy example, by hand ----
// objects: sparrow, bat, dolphin ; attributes: flies, swims
const toy = [[true, false], [true, false], [false, true]];
const toyCl = C.analyze(toy, 3, 2, 'classical');
console.log('toy classical count =', toyCl.count, '(hand count: 4 = {all}, {sparrow,bat}, {dolphin}, {})');
ok(toyCl.count === 4, 'toy classical count');

// ---- randomised property test ----
let seed = 12345; const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
for (let t = 0; t < 250; t++) {
  const nG = 1 + Math.floor(rnd() * 8), nM = 1 + Math.floor(rnd() * 8), dens = rnd();
  const m = Array.from({ length: nG }, () => Array.from({ length: nM }, () => rnd() < dens));
  checkContext(m, nG, nM, `rand#${t}(${nG}x${nM})`);
}
// edge cases: empty table, full table, single cell
checkContext([[false]], 1, 1, 'single-false'); checkContext([[true]], 1, 1, 'single-true');
checkContext([[false, false], [false, false]], 2, 2, 'all-false'); checkContext([[true, true], [true, true]], 2, 2, 'all-true');

// ---- limits ----
const big = Array.from({ length: 12 }, (_, g) => Array.from({ length: 12 }, (_, m) => g !== m)); // "contranominal" scale: 2^12 concepts
const t0 = Date.now(); const bigRes = C.analyze(big, 12, 12, 'classical');
console.log('12x12 contranominal: count', bigRes.count, 'tooManyToDraw', bigRes.tooManyToDraw, (Date.now() - t0) + 'ms');
ok(bigRes.count === 4096 && bigRes.tooManyToDraw, 'contranominal scale has 2^12 concepts and is not drawn');
const t1 = Date.now(); const cap = C.analyze(big, 12, 12, 'threeway', { limit: 1000 });
console.log('limit respected:', cap.tooMany, (Date.now() - t1) + 'ms'); ok(cap.tooMany, 'limit stops enumeration');

console.log(`\n${checks} checks, ${fails} failures`);
process.exit(fails ? 1 : 0);
