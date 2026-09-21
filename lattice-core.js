/* Formal concept analysis core for the concept-lattice demo (lattice.html).
   Pure functions, no DOM, so it can be tested in Node.

   A formal context is a table of objects x attributes (inc[g][m] is true when
   object g has attribute m). Two kinds of concept are computed:

   classical  (X, Y)       Y = attributes shared by all of X
                           X = objects having all of Y
   three-way  (X, (Y, Z))  Y = attributes that EVERY object in X has
              (object-      Z = attributes that NO object in X has
              induced)     X = objects having all of Y and none of Z

   The three-way concepts are exactly the concepts of the context with a
   "negated" copy of every attribute added, which is how they are computed
   here. The attribute-induced version is the same construction on the
   transposed table: (Y, (X, W)) where Y is a set of attributes, X the objects
   having all of them and W the objects having none of them.

   Sets are bitmasks (an int per set), so tables are limited to 30 rows and 30
   columns; the demo page allows far fewer. */
(function (root) {
  'use strict';

  function popcount(x) {
    x = x - ((x >>> 1) & 0x55555555);
    x = (x & 0x33333333) + ((x >>> 2) & 0x33333333);
    return (((x + (x >>> 4)) & 0x0f0f0f0f) * 0x01010101) >>> 24;
  }

  function fullMask(n) {
    return n >= 31 ? 0x7fffffff : (1 << n) - 1;
  }

  // rows[g]: attributes of object g; cols[m]: objects having attribute m.
  function masks(inc, nG, nM) {
    var rows = [], cols = [], g, m;
    for (g = 0; g < nG; g++) rows.push(0);
    for (m = 0; m < nM; m++) cols.push(0);
    for (g = 0; g < nG; g++) {
      for (m = 0; m < nM; m++) {
        if (inc[g] && inc[g][m]) {
          rows[g] |= 1 << m;
          cols[m] |= 1 << g;
        }
      }
    }
    return { rows: rows, cols: cols, allG: fullMask(nG), allM: fullMask(nM) };
  }

  function transpose(inc, nG, nM) {
    var t = [], m, g;
    for (m = 0; m < nM; m++) {
      t.push([]);
      for (g = 0; g < nG; g++) t[m].push(!!(inc[g] && inc[g][m]));
    }
    return t;
  }

  // All sets that are intersections of the given generator sets (and of allG
  // itself, the empty intersection). Returns null if there are more than
  // `limit` of them, so a huge table can't freeze the page.
  function intersectionClosure(generators, allG, limit) {
    var seen = {}, list = [allG], i, n, x;
    seen[allG] = true;
    for (var k = 0; k < generators.length; k++) {
      var c = generators[k];
      n = list.length;
      for (i = 0; i < n; i++) {
        x = list[i] & c;
        if (!seen[x]) {
          seen[x] = true;
          list.push(x);
          if (list.length > limit) return null;
        }
      }
    }
    return list;
  }

  // Upper covers of every node (nodes are sorted by extent size, ascending).
  // covers holds [lower, upper] index pairs.
  function coverRelation(exts) {
    var n = exts.length, covers = [], i, j, k;
    for (i = 0; i < n; i++) {
      var sup = [];
      for (j = i + 1; j < n; j++) {
        if (exts[j] !== exts[i] && (exts[i] & exts[j]) === exts[i]) sup.push(j);
      }
      for (j = 0; j < sup.length; j++) {
        var minimal = true;
        for (k = 0; k < sup.length; k++) {
          if (k !== j && exts[sup[k]] !== exts[sup[j]] && (exts[sup[k]] & exts[sup[j]]) === exts[sup[k]]) {
            minimal = false;
            break;
          }
        }
        if (minimal) covers.push([i, sup[j]]);
      }
    }
    return covers;
  }

  /* analyze(inc, nG, nM, kind, opts)
       kind: 'classical' | 'threeway'
       opts: { limit: max concepts to enumerate (default 20000),
               drawLimit: max concepts for which the diagram is built (default 400;
                          0 = only count the concepts) }
     Returns
       { kind, count, tooMany, tooManyToDraw,
         nodes: [{ ext, pos, neg }]   sorted by |ext| ascending; for classical
                                      concepts neg is always 0
         covers: [[lowerIdx, upperIdx], ...]
         objectNode[g]       node where object g is labelled (its smallest concept)
         attrNode[m]         node where attribute m is labelled
         negAttrNode[m]      three-way only: node where "not m" is labelled }
     "ext" is a bitmask over objects; "pos"/"neg" are bitmasks over attributes. */
  function analyze(inc, nG, nM, kind, opts) {
    opts = opts || {};
    var limit = opts.limit || 20000;
    var drawLimit = opts.drawLimit === undefined ? 400 : opts.drawLimit;
    var threeWay = kind === 'threeway';
    var mk = masks(inc, nG, nM);

    var generators = [], m, g;
    for (m = 0; m < nM; m++) {
      generators.push(mk.cols[m]);
      if (threeWay) generators.push(mk.allG & ~mk.cols[m]);
    }
    var exts = intersectionClosure(generators, mk.allG, limit);
    if (exts === null) {
      return { kind: kind, count: limit, tooMany: true, tooManyToDraw: true, nodes: [], covers: [], objectNode: [], attrNode: [], negAttrNode: [] };
    }
    exts.sort(function (a, b) { return (popcount(a) - popcount(b)) || (a - b); });

    var nodes = [], index = {}, i;
    for (i = 0; i < exts.length; i++) {
      var ext = exts[i], pos = mk.allM, any = 0;
      for (g = 0; g < nG; g++) {
        if (ext & (1 << g)) { pos &= mk.rows[g]; any |= mk.rows[g]; }
      }
      nodes.push({ ext: ext, pos: pos, neg: threeWay ? (mk.allM & ~any) : 0 });
      index[ext] = i;
    }

    var result = { kind: kind, count: nodes.length, tooMany: false, tooManyToDraw: nodes.length > drawLimit, nodes: nodes, covers: [], objectNode: [], attrNode: [], negAttrNode: [] };
    if (result.tooManyToDraw) return result;

    result.covers = coverRelation(exts);

    // Reduced labelling: an object sits at the smallest concept containing it,
    // an attribute at the largest concept whose intent contains it.
    for (g = 0; g < nG; g++) {
      var e = mk.allG;
      for (m = 0; m < nM; m++) {
        if (mk.rows[g] & (1 << m)) e &= mk.cols[m];
        else if (threeWay) e &= mk.allG & ~mk.cols[m];
      }
      result.objectNode.push(index[e]);
    }
    for (m = 0; m < nM; m++) {
      result.attrNode.push(index[mk.cols[m]]);
      if (threeWay) result.negAttrNode.push(index[mk.allG & ~mk.cols[m]]);
    }
    return result;
  }

  /* Diagram layout. Every edge points downward: level 0 is the top concept
     (largest extent). Nodes inside a level are ordered with a few
     barycentre sweeps to reduce edge crossings, then spread evenly.
     Returns { levels: [[nodeIdx...] per level], x: [0..1 per node], level: [per node] } */
  function layout(result) {
    var n = result.nodes.length, covers = result.covers, i, k;
    var up = [], down = [];
    for (i = 0; i < n; i++) { up.push([]); down.push([]); }
    covers.forEach(function (c) { up[c[0]].push(c[1]); down[c[1]].push(c[0]); });

    // Longest path from the top; nodes are sorted by extent size ascending, so
    // walking from the end visits every node after all of its upper covers.
    var level = [];
    for (i = 0; i < n; i++) level.push(0);
    for (i = n - 1; i >= 0; i--) {
      for (k = 0; k < up[i].length; k++) level[i] = Math.max(level[i], level[up[i][k]] + 1);
    }
    var depth = 0;
    for (i = 0; i < n; i++) depth = Math.max(depth, level[i]);
    var levels = [];
    for (k = 0; k <= depth; k++) levels.push([]);
    for (i = n - 1; i >= 0; i--) levels[level[i]].push(i);

    var pos = [];
    function spread() {
      levels.forEach(function (row) {
        row.forEach(function (node, idx) { pos[node] = (idx + 0.5) / row.length; });
      });
    }
    spread();

    function sweep(rowIdx, neighbours) {
      var row = levels[rowIdx];
      var keyed = row.map(function (node, idx) {
        var ns = neighbours[node];
        var key = ns.length ? ns.reduce(function (s, x) { return s + pos[x]; }, 0) / ns.length : pos[node];
        return { node: node, key: key, idx: idx };
      });
      keyed.sort(function (a, b) { return (a.key - b.key) || (a.idx - b.idx); });
      levels[rowIdx] = keyed.map(function (o) { return o.node; });
      levels[rowIdx].forEach(function (node, idx) { pos[node] = (idx + 0.5) / levels[rowIdx].length; });
    }
    for (var pass = 0; pass < 6; pass++) {
      for (k = 1; k <= depth; k++) sweep(k, up);
      for (k = depth - 1; k >= 0; k--) sweep(k, down);
    }
    return { levels: levels, x: pos, level: level };
  }

  var api = { analyze: analyze, layout: layout, transpose: transpose, popcount: popcount, masks: masks };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.LatticeCore = api;
})(typeof window !== 'undefined' ? window : this);
