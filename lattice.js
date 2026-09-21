/* Concept-lattice demo UI: an editable object x attribute table on one side,
   the live-drawn concept lattice (classical, or one of the two three-way
   versions) on the other. The maths lives in lattice-core.js. */
(function () {
  'use strict';

  var Core = window.LatticeCore;
  var tableEl = document.getElementById('ctxTable');
  if (!Core || !tableEl) return;

  var MAX_OBJECTS = 12;
  var MAX_ATTRS = 12;
  var DRAW_LIMIT = 400;
  var SVG_NS = 'http://www.w3.org/2000/svg';

  var outPanel = document.getElementById('outPanel');
  var presetSelect = document.getElementById('presetSelect');
  var diagramEl = document.getElementById('diagram');
  var infoEl = document.getElementById('info');
  var countsEl = document.getElementById('counts');
  var listEl = document.getElementById('conceptList');
  var listSummary = document.getElementById('listSummary');
  var sizeNote = document.getElementById('sizeNote');

  // ---- Examples -------------------------------------------------------------
  // rows[i] lists the attribute indices that object i has.
  var PRESETS = {
    animals: {
      label: ['Animals (small)', '动物（小例子）'],
      objects: [['sparrow', '麻雀'], ['bat', '蝙蝠'], ['dolphin', '海豚'], ['ostrich', '鸵鸟'], ['salmon', '鲑鱼']],
      attrs: [['flies', '会飞'], ['lays eggs', '产卵'], ['lives in water', '生活在水中'], ['has feathers', '有羽毛']],
      rows: [[0, 1, 3], [0], [2], [1, 3], [1, 2]]
    },
    living: {
      label: ['Living beings and water (Ganter & Wille)', '生物与水（Ganter & Wille 经典例子）'],
      objects: [['leech', '水蛭'], ['bream', '鳊鱼'], ['frog', '青蛙'], ['dog', '狗'], ['spike-weed', '水草'], ['reed', '芦苇'], ['bean', '豆'], ['maize', '玉米']],
      attrs: [['needs water', '需要水'], ['lives in water', '生活在水中'], ['lives on land', '生活在陆地'], ['needs chlorophyll', '需要叶绿素'],
              ['two seed leaves', '两片子叶'], ['one seed leaf', '一片子叶'], ['can move', '能运动'], ['has limbs', '有四肢'], ['suckles young', '哺乳']],
      rows: [[0, 1, 6], [0, 1, 6, 7], [0, 1, 2, 6, 7], [0, 2, 6, 7, 8], [0, 1, 3, 5], [0, 1, 2, 3, 5], [0, 2, 3, 4], [0, 2, 3, 5]]
    }
  };

  var state = { presetId: 'animals', objects: [], attrs: [], inc: [], mode: 'classical', selected: null };

  function currentLang() {
    return document.documentElement.getAttribute('data-lang') === 'zh' ? 'zh' : 'en';
  }

  function t(en, zh) {
    return currentLang() === 'zh' ? zh : en;
  }

  function nameOf(item) {
    return currentLang() === 'zh' && item.zh ? item.zh : item.en;
  }

  function loadPreset(id) {
    var p = PRESETS[id];
    state.presetId = id;
    state.objects = p.objects.map(function (o) { return { en: o[0], zh: o[1] }; });
    state.attrs = p.attrs.map(function (a) { return { en: a[0], zh: a[1] }; });
    state.inc = p.rows.map(function (row) {
      var r = p.attrs.map(function () { return false; });
      row.forEach(function (m) { r[m] = true; });
      return r;
    });
    state.selected = null;
  }

  function markCustom() {
    if (state.presetId !== 'custom') {
      state.presetId = 'custom';
      renderPresetOptions();
    }
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  // ---- Table editor -----------------------------------------------------------
  function renderPresetOptions() {
    var lang = currentLang() === 'zh' ? 1 : 0;
    presetSelect.innerHTML = '';
    Object.keys(PRESETS).forEach(function (id) {
      var o = el('option', '', PRESETS[id].label[lang]);
      o.value = id;
      presetSelect.appendChild(o);
    });
    if (state.presetId === 'custom') {
      var c = el('option', '', t('Custom (edited)', '自定义（已修改）'));
      c.value = 'custom';
      presetSelect.appendChild(c);
    }
    presetSelect.value = state.presetId;
  }

  function nameInput(item, label) {
    var input = el('input', 'lat-name');
    input.type = 'text';
    input.value = nameOf(item);
    input.maxLength = 24;
    input.setAttribute('aria-label', label);
    input.addEventListener('input', function () {
      item.en = input.value;
      item.zh = input.value;
      markCustom();
      refreshCellLabels();
      renderOutput();
    });
    return input;
  }

  function removeButton(label, disabled, onClick) {
    var b = el('button', 'lat-x', '×');
    b.type = 'button';
    b.title = label;
    b.setAttribute('aria-label', label);
    b.disabled = disabled;
    b.addEventListener('click', onClick);
    return b;
  }

  function renderTable() {
    var nG = state.objects.length, nM = state.attrs.length;
    tableEl.innerHTML = '';

    var caption = el('caption', 'sr-only', t('Formal context: rows are objects, columns are attributes. Press a cell to toggle it.',
      '形式背景：行是对象，列是属性。点击单元格切换是否具有该属性。'));
    tableEl.appendChild(caption);

    var thead = el('thead');
    var hr = el('tr');
    hr.appendChild(el('th', 'lat-corner'));
    state.attrs.forEach(function (a, j) {
      var th = el('th', 'lat-colhead');
      th.scope = 'col';
      th.appendChild(nameInput(a, t('Attribute name', '属性名称')));
      th.appendChild(removeButton(t('Remove this attribute', '删除这个属性'), nM <= 1, function () {
        state.attrs.splice(j, 1);
        state.inc.forEach(function (row) { row.splice(j, 1); });
        structureChanged();
      }));
      hr.appendChild(th);
    });
    var addCol = el('th', 'lat-addcell');
    var addA = el('button', 'lat-btn', '+ ' + t('attribute', '属性'));
    addA.type = 'button';
    addA.disabled = nM >= MAX_ATTRS;
    addA.addEventListener('click', function () {
      state.attrs.push({ en: 'attr ' + (nM + 1), zh: '属性' + (nM + 1) });
      state.inc.forEach(function (row) { row.push(false); });
      structureChanged();
    });
    addCol.appendChild(addA);
    hr.appendChild(addCol);
    thead.appendChild(hr);
    tableEl.appendChild(thead);

    var tbody = el('tbody');
    state.objects.forEach(function (o, i) {
      var tr = el('tr');
      var th = el('th', 'lat-rowhead');
      th.scope = 'row';
      th.appendChild(nameInput(o, t('Object name', '对象名称')));
      th.appendChild(removeButton(t('Remove this object', '删除这个对象'), nG <= 1, function () {
        state.objects.splice(i, 1);
        state.inc.splice(i, 1);
        structureChanged();
      }));
      tr.appendChild(th);
      state.attrs.forEach(function (a, j) {
        var td = el('td', 'lat-cellwrap');
        var b = el('button', 'lat-cell');
        b.type = 'button';
        b.dataset.i = String(i);
        b.dataset.j = String(j);
        b.setAttribute('role', 'checkbox');
        setCell(b, state.inc[i][j], o, a);
        b.addEventListener('click', function () {
          state.inc[i][j] = !state.inc[i][j];
          setCell(b, state.inc[i][j], o, a);
          markCustom();
          cellsChanged();
        });
        td.appendChild(b);
        tr.appendChild(td);
      });
      tr.appendChild(el('td'));
      tbody.appendChild(tr);
    });
    var lr = el('tr');
    var addRow = el('td', 'lat-addcell');
    var addO = el('button', 'lat-btn', '+ ' + t('object', '对象'));
    addO.type = 'button';
    addO.disabled = nG >= MAX_OBJECTS;
    addO.addEventListener('click', function () {
      state.objects.push({ en: 'object ' + (nG + 1), zh: '对象' + (nG + 1) });
      state.inc.push(state.attrs.map(function () { return false; }));
      structureChanged();
    });
    addRow.appendChild(addO);
    lr.appendChild(addRow);
    tbody.appendChild(lr);
    tableEl.appendChild(tbody);

    sizeNote.textContent = t(
      nG + ' objects × ' + nM + ' attributes (at most ' + MAX_OBJECTS + ' × ' + MAX_ATTRS + ')',
      nG + ' 个对象 × ' + nM + ' 个属性（最多 ' + MAX_OBJECTS + ' × ' + MAX_ATTRS + '）');
  }

  function refreshCellLabels() {
    tableEl.querySelectorAll('.lat-cell').forEach(function (b) {
      var o = state.objects[+b.dataset.i], a = state.attrs[+b.dataset.j];
      if (o && a) b.setAttribute('aria-label', nameOf(o) + ' — ' + nameOf(a));
    });
  }

  function setCell(button, on, obj, attr) {
    button.textContent = on ? '✓' : '';
    button.setAttribute('aria-checked', String(on));
    button.setAttribute('aria-label', nameOf(obj) + ' — ' + nameOf(attr));
  }

  function structureChanged() {
    markCustom();
    state.selected = null;
    renderTable();
    renderOutput();
  }

  function cellsChanged() {
    state.selected = null;
    renderOutput();
  }

  // ---- Analysis ----------------------------------------------------------------
  var MODES = ['classical', 'oe', 'ae'];

  function analyzeMode(mode, drawLimit) {
    var nG = state.objects.length, nM = state.attrs.length;
    var opts = { drawLimit: drawLimit };
    if (mode === 'classical') return Core.analyze(state.inc, nG, nM, 'classical', opts);
    if (mode === 'oe') return Core.analyze(state.inc, nG, nM, 'threeway', opts);
    return Core.analyze(Core.transpose(state.inc, nG, nM), nM, nG, 'threeway', opts);
  }

  // In attribute-induced mode the roles are swapped: the extent is a set of
  // attributes and the two sides of the intent are sets of objects.
  function sides(mode) {
    return mode === 'ae'
      ? { ext: state.attrs, intent: state.objects }
      : { ext: state.objects, intent: state.attrs };
  }

  function setText(mask, items) {
    var names = [];
    items.forEach(function (item, i) { if (mask & (1 << i)) names.push(nameOf(item)); });
    return names.length ? '{' + names.join(', ') + '}' : '∅';
  }

  function conceptText(node, mode) {
    var s = sides(mode);
    if (mode === 'classical') {
      return { ext: setText(node.ext, s.ext), pos: setText(node.pos, s.intent), neg: null };
    }
    return { ext: setText(node.ext, s.ext), pos: setText(node.pos, s.intent), neg: setText(node.neg, s.intent) };
  }

  var MODE_NAMES = {
    classical: ['Classical concepts', '经典概念'],
    oe: ['Three-way, object-induced', '三支概念（对象诱导）'],
    ae: ['Three-way, attribute-induced', '三支概念（属性诱导）']
  };

  // ---- Output ---------------------------------------------------------------------
  function renderOutput() {
    outPanel.setAttribute('data-mode', state.mode);
    document.querySelectorAll('.lat-mode').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.mode === state.mode));
    });

    var res = analyzeMode(state.mode, DRAW_LIMIT);

    // Concept counts for all three views side by side: shows at a glance what
    // the negative information adds.
    countsEl.innerHTML = '';
    MODES.forEach(function (m) {
      var r = m === state.mode ? res : analyzeMode(m, 0);
      var chip = el('span', 'lat-chip' + (m === state.mode ? ' is-current' : ''));
      var n = r.tooMany ? '> ' + r.count : String(r.count);
      chip.textContent = t(MODE_NAMES[m][0], MODE_NAMES[m][1]) + ': ' + n;
      countsEl.appendChild(chip);
    });

    diagramEl.innerHTML = '';
    listEl.innerHTML = '';
    infoEl.textContent = '';

    if (res.tooMany || res.tooManyToDraw) {
      var big = res.tooMany ? '> ' + res.count : String(res.count);
      diagramEl.appendChild(el('p', 'lat-message', t(
        'This table has ' + big + ' concepts, which is too many to draw legibly (limit ' + DRAW_LIMIT + '). Try fewer objects or attributes.',
        '这张表有 ' + big + ' 个概念，太多了，画出来看不清（上限 ' + DRAW_LIMIT + '）。请减少对象或属性。')));
      listSummary.textContent = t('All concepts', '全部概念');
      return;
    }

    var selectedIdx = -1;
    res.nodes.forEach(function (n, i) { if (state.selected !== null && n.ext === state.selected) selectedIdx = i; });
    if (selectedIdx < 0) state.selected = null;

    drawDiagram(res);
    renderList(res);
    renderInfo(res);
    listSummary.textContent = t('All concepts (' + res.count + ')', '全部概念（' + res.count + '）');
  }

  function select(res, idx) {
    state.selected = idx === null ? null : res.nodes[idx].ext;
    applySelection(res);
    renderInfo(res);
  }

  function selectedIndex(res) {
    for (var i = 0; i < res.nodes.length; i++) if (res.nodes[i].ext === state.selected) return i;
    return -1;
  }

  function renderInfo(res) {
    var idx = state.selected === null ? -1 : selectedIndex(res);
    infoEl.innerHTML = '';
    if (idx < 0) {
      infoEl.appendChild(el('p', 'lat-hint', t('Click a node or a row of the list to see its extent and intent.',
        '点击图中的节点或列表中的一行，查看它的外延和内涵。')));
      return;
    }
    var mode = state.mode, txt = conceptText(res.nodes[idx], mode);
    function line(label, value) {
      var p = el('p', 'lat-info-line');
      p.appendChild(el('strong', '', label + ' '));
      p.appendChild(document.createTextNode(value));
      infoEl.appendChild(p);
    }
    if (mode === 'ae') {
      line(t('Extent (attributes):', '外延（属性）：'), txt.ext);
      line(t('Objects having all of them:', '拥有全部这些属性的对象：'), txt.pos);
      line(t('Objects having none of them:', '一个都不拥有的对象：'), txt.neg);
    } else if (mode === 'oe') {
      line(t('Extent (objects):', '外延（对象）：'), txt.ext);
      line(t('Attributes all of them have:', '它们全部具有的属性：'), txt.pos);
      line(t('Attributes none of them has:', '它们全部不具有的属性：'), txt.neg);
    } else {
      line(t('Extent (objects):', '外延（对象）：'), txt.ext);
      line(t('Intent (shared attributes):', '内涵（共有属性）：'), txt.pos);
    }
  }

  function renderList(res) {
    var mode = state.mode, three = mode !== 'classical';
    var table = el('table', 'lat-list-table');
    var head = el('tr');
    var cols = mode === 'ae'
      ? [t('Extent (attributes)', '外延（属性）'), t('Objects having all', '拥有全部的对象'), t('Objects having none', '一个都没有的对象')]
      : mode === 'oe'
        ? [t('Extent (objects)', '外延（对象）'), t('Attributes all have', '全部具有的属性'), t('Attributes none has', '全部不具有的属性')]
        : [t('Extent (objects)', '外延（对象）'), t('Intent (shared attributes)', '内涵（共有属性）')];
    cols.forEach(function (c) { var th = el('th', '', c); th.scope = 'col'; head.appendChild(th); });
    table.appendChild(head);

    var order = res.nodes.map(function (n, i) { return i; }).reverse(); // top concept first
    order.forEach(function (i) {
      var n = res.nodes[i], txt = conceptText(n, mode);
      var tr = el('tr', 'lat-list-row');
      tr.dataset.ext = String(n.ext);
      tr.tabIndex = 0;
      tr.appendChild(el('td', '', txt.ext));
      tr.appendChild(el('td', '', txt.pos));
      if (three) tr.appendChild(el('td', '', txt.neg));
      function choose() { select(res, i); }
      tr.addEventListener('click', choose);
      tr.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(); }
      });
      table.appendChild(tr);
    });
    listEl.appendChild(table);
    applySelection(res);
  }

  function applySelection(res) {
    var ext = state.selected;
    diagramEl.querySelectorAll('.lat-node').forEach(function (g) {
      g.classList.toggle('is-active', ext !== null && g.dataset.ext === String(ext));
    });
    diagramEl.querySelectorAll('.lat-edge').forEach(function (line) {
      var on = ext !== null && (line.dataset.lo === String(ext) || line.dataset.up === String(ext));
      line.classList.toggle('is-active', on);
    });
    listEl.querySelectorAll('.lat-list-row').forEach(function (row) {
      row.classList.toggle('is-active', ext !== null && row.dataset.ext === String(ext));
    });
  }

  // ---- Diagram -----------------------------------------------------------------------
  function svgEl(name, attrs) {
    var e = document.createElementNS(SVG_NS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  function shorten(s) {
    return s.length > 16 ? s.slice(0, 15) + '…' : s;
  }

  function drawDiagram(res) {
    var mode = state.mode, three = mode !== 'classical';
    var s = sides(mode);
    var lay = Core.layout(res);

    // Labels: elements of the extent go below their node, elements of the
    // intent above it (negated ones as "¬name").
    var below = [], above = [], i;
    for (i = 0; i < res.nodes.length; i++) { below.push([]); above.push([]); }
    res.objectNode.forEach(function (node, g) { below[node].push(nameOf(s.ext[g])); });
    res.attrNode.forEach(function (node, m) { above[node].push({ text: nameOf(s.intent[m]), neg: false }); });
    res.negAttrNode.forEach(function (node, m) { above[node].push({ text: '¬' + nameOf(s.intent[m]), neg: true }); });

    var maxRow = 1;
    lay.levels.forEach(function (row) { maxRow = Math.max(maxRow, row.length); });
    var padX = 56, colW = 88, rowGap = 84, lineH = 14;
    var boxW = diagramEl.clientWidth || 640;
    var W = Math.max(boxW - 2, maxRow * colW + padX * 2);

    var topLines = 1, bottomLines = 1;
    lay.levels[0].forEach(function (n) { topLines = Math.max(topLines, above[n].length); });
    lay.levels[lay.levels.length - 1].forEach(function (n) { bottomLines = Math.max(bottomLines, below[n].length); });
    var top = 24 + topLines * lineH, bottom = 22 + bottomLines * lineH;
    var H = top + (lay.levels.length - 1) * rowGap + bottom;

    var svg = svgEl('svg', {
      width: W, height: H, viewBox: '0 0 ' + W + ' ' + H, role: 'group',
      'aria-label': t('Concept lattice diagram', '概念格图')
    });
    var xs = [], ys = [];
    res.nodes.forEach(function (n, k) {
      xs[k] = padX + lay.x[k] * (W - padX * 2);
      ys[k] = top + lay.level[k] * rowGap;
    });

    var edges = svgEl('g', {});
    res.covers.forEach(function (c) {
      edges.appendChild(svgEl('line', {
        'class': 'lat-edge', x1: xs[c[0]].toFixed(1), y1: ys[c[0]].toFixed(1), x2: xs[c[1]].toFixed(1), y2: ys[c[1]].toFixed(1),
        'data-lo': String(res.nodes[c[0]].ext), 'data-up': String(res.nodes[c[1]].ext)
      }));
    });
    svg.appendChild(edges);

    res.nodes.forEach(function (n, k) {
      var txt = conceptText(n, mode);
      var g = svgEl('g', { 'class': 'lat-node', 'data-ext': String(n.ext), tabindex: '0', role: 'button' });
      g.setAttribute('aria-label', three
        ? txt.ext + ' | ' + txt.pos + ' | ' + txt.neg
        : txt.ext + ' | ' + txt.pos);
      g.appendChild(svgEl('circle', { 'class': 'lat-hit', cx: xs[k].toFixed(1), cy: ys[k].toFixed(1), r: 15 }));
      g.appendChild(svgEl('circle', { 'class': 'lat-dot' + (below[k].length ? ' has-ext' : ''), cx: xs[k].toFixed(1), cy: ys[k].toFixed(1), r: 7 }));

      above[k].forEach(function (lbl, idx) {
        var text = svgEl('text', {
          'class': 'lat-lbl ' + (lbl.neg ? 'lat-lbl-neg' : 'lat-lbl-pos'),
          x: xs[k].toFixed(1), y: (ys[k] - 13 - idx * lineH).toFixed(1), 'text-anchor': 'middle'
        });
        text.textContent = shorten(lbl.text);
        g.appendChild(text);
      });
      below[k].forEach(function (name, idx) {
        var text = svgEl('text', {
          'class': 'lat-lbl lat-lbl-ext', x: xs[k].toFixed(1), y: (ys[k] + 21 + idx * lineH).toFixed(1), 'text-anchor': 'middle'
        });
        text.textContent = shorten(name);
        g.appendChild(text);
      });

      function choose(e) { if (e) e.stopPropagation(); select(res, k); }
      g.addEventListener('click', choose);
      g.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(); }
      });
      svg.appendChild(g);
    });

    svg.addEventListener('click', function () { select(res, null); });
    diagramEl.appendChild(svg);
    applySelection(res);
  }

  // ---- Wiring ------------------------------------------------------------------------------
  presetSelect.addEventListener('change', function () {
    if (!PRESETS[presetSelect.value]) return;
    loadPreset(presetSelect.value);
    renderTable();
    renderOutput();
  });

  document.getElementById('clearBtn').addEventListener('click', function () {
    state.inc = state.inc.map(function (row) { return row.map(function () { return false; }); });
    markCustom();
    state.selected = null;
    renderTable();
    renderOutput();
  });

  document.querySelectorAll('.lat-mode').forEach(function (b) {
    b.addEventListener('click', function () {
      state.mode = b.dataset.mode;
      state.selected = null;
      renderOutput();
    });
  });

  function renderAll() {
    renderPresetOptions();
    renderTable();
    renderOutput();
  }

  loadPreset('animals');
  renderAll();

  if ('MutationObserver' in window) {
    new MutationObserver(renderAll)
      .observe(document.documentElement, { attributes: true, attributeFilter: ['data-lang'] });
  }
  if ('ResizeObserver' in window) {
    var lastW = 0;
    new ResizeObserver(function () {
      var w = Math.round(diagramEl.clientWidth);
      if (Math.abs(w - lastW) > 1) { lastW = w; renderOutput(); }
    }).observe(diagramEl);
  }
})();
