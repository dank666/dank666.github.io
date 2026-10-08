/* Concept-lattice demo UI: an editable cross table (objects x attributes)
   beside the live-drawn concept lattice (classical, or one of the two
   three-way versions), with the table's implications, a list of all concepts,
   import/export, a shareable link and a comparison against a frozen
   "reference" copy of the table. The maths lives in lattice-core.js. */
(function () {
  'use strict';

  var Core = window.LatticeCore;
  var tableEl = document.getElementById('ctxTable');
  if (!Core || !tableEl) return;

  var MAX_OBJECTS = 12;
  var MAX_ATTRS = 12;
  var DRAW_LIMIT = 400;
  var NAME_MAX = 24;
  var UNDO_MAX = 60;
  var SVG_NS = 'http://www.w3.org/2000/svg';
  var LANGS = ['en', 'zh', 'de'];
  var MODES = ['classical', 'oe', 'ae'];

  function $(id) { return document.getElementById(id); }

  var rootEl = $('latRoot');
  var layoutEl = $('latLayout');
  var ctxPanel = $('ctxPanel');
  var presetSelect = $('presetSelect');
  var sizeNote = $('sizeNote');
  var undoBtn = $('undoBtn');
  var importBtn = $('importBtn');
  var importBox = $('importBox');
  var importText = $('importText');
  var importMsg = $('importMsg');
  var compareOff = $('compareOff');
  var compareOn = $('compareOn');
  var viewRow = $('viewRow');
  var diffEl = $('diffSummary');
  var diagramEl = $('diagram');
  var infoEl = $('info');
  var listEl = $('conceptList');
  var listSummary = $('listSummary');
  var implEl = $('implList');
  var implSummary = $('implSummary');
  var statusEl = $('latStatus');

  // ---- Examples -------------------------------------------------------------
  // rows[i] lists the attribute indices that object i has.
  var PRESETS = {
    animals: {
      label: ['Animals (small)', '动物（小例子）', 'Tiere (klein)'],
      objects: [['sparrow', '麻雀', 'Spatz'], ['bat', '蝙蝠', 'Fledermaus'], ['dolphin', '海豚', 'Delfin'], ['ostrich', '鸵鸟', 'Strauß'], ['salmon', '鲑鱼', 'Lachs']],
      attrs: [['flies', '会飞', 'fliegt'], ['lays eggs', '产卵', 'legt Eier'], ['lives in water', '生活在水中', 'lebt im Wasser'], ['has feathers', '有羽毛', 'hat Federn']],
      rows: [[0, 1, 3], [0], [2], [1, 3], [1, 2]]
    },
    living: {
      label: ['Living beings and water (Ganter & Wille)', '生物与水（Ganter & Wille 经典例子）', 'Lebewesen und Wasser (Ganter & Wille)'],
      objects: [['leech', '水蛭', 'Blutegel'], ['bream', '鳊鱼', 'Brasse'], ['frog', '青蛙', 'Frosch'], ['dog', '狗', 'Hund'], ['spike-weed', '水草', 'Wasserpest'], ['reed', '芦苇', 'Schilf'], ['bean', '豆', 'Bohne'], ['maize', '玉米', 'Mais']],
      attrs: [['needs water', '需要水', 'benötigt Wasser'], ['lives in water', '生活在水中', 'lebt im Wasser'], ['lives on land', '生活在陆地', 'lebt an Land'], ['needs chlorophyll', '需要叶绿素', 'benötigt Chlorophyll'],
              ['two seed leaves', '两片子叶', 'zweikeimblättrig'], ['one seed leaf', '一片子叶', 'einkeimblättrig'], ['can move', '能运动', 'kann sich bewegen'], ['has limbs', '有四肢', 'hat Gliedmaßen'], ['suckles young', '哺乳', 'säugt Junge']],
      rows: [[0, 1, 6], [0, 1, 6, 7], [0, 1, 2, 6, 7], [0, 2, 6, 7, 8], [0, 1, 3, 5], [0, 1, 2, 3, 5], [0, 2, 3, 4], [0, 2, 3, 5]]
    }
  };
  var DEFAULT_PRESET = 'animals';

  /* base: the example the objects and attributes come from, while they are
           untouched (cells may differ); null once anything was renamed, added,
           removed or imported.
     ref:  a frozen copy of the cells to compare against, or null.
     view: which of the two tables the lattice is drawn for ('cur' | 'ref').
     selected: extent (bitmask) of the selected concept, or null. */
  var state = { base: null, objects: [], attrs: [], inc: [], ref: null, mode: 'classical', view: 'cur', selected: null };
  var undoStack = [];
  var current = null;   // what the output currently shows: { res, mode, other }

  // ---- Texts ------------------------------------------------------------------
  // Interface texts built in JavaScript: [English, Chinese, German]. {0}, {1} …
  // are filled in by tr(). Texts that never change are in lattice.html.
  var STR = {
    custom: ['Custom (edited)', '自定义（已修改）', 'Eigene (bearbeitet)'],
    caption: ['Formal context: rows are objects, columns are attributes. Press a cell to toggle it.',
      '形式背景：行是对象，列是属性。点击单元格切换是否具有该属性。',
      'Formaler Kontext: Zeilen sind Gegenstände, Spalten sind Merkmale. Drücken Sie eine Zelle, um sie umzuschalten.'],
    addAttr: ['+ attribute', '+ 属性', '+ Merkmal'],
    addObj: ['+ object', '+ 对象', '+ Gegenstand'],
    newAttr: ['attr {0}', '属性{0}', 'Merkmal {0}'],
    newObj: ['object {0}', '对象{0}', 'Gegenstand {0}'],
    size: ['{0} objects × {1} attributes', '{0} 个对象 × {1} 个属性', '{0} Gegenstände × {1} Merkmale'],
    limit: ['At most {0}', '最多 {0} 个', 'Höchstens {0}'],
    remove: ['Remove', '删除', 'Entfernen'],
    editObj: ['Object name', '对象名称', 'Name des Gegenstands'],
    editAttr: ['Attribute name', '属性名称', 'Name des Merkmals'],
    renameHint: ['{0} — rename or remove', '{0}——重命名或删除', '{0} – umbenennen oder entfernen'],
    tooMany: ['This table has {0} concepts, which is too many to draw legibly (limit {1}). Try fewer objects or attributes.',
      '这张表有 {0} 个概念，太多了，画出来看不清（上限 {1}）。请减少对象或属性。',
      'Diese Tabelle hat {0} Begriffe – zu viele, um sie lesbar zu zeichnen (Grenze {1}). Versuchen Sie es mit weniger Gegenständen oder Merkmalen.'],
    hint: ['Click a node to see its extent and intent, and where it sits in the table.',
      '点击图中的节点，查看它的外延和内涵，以及它在表格中的位置。',
      'Klicken Sie auf einen Knoten, um Umfang und Inhalt zu sehen – und wo er in der Tabelle liegt.'],
    extObj: ['Extent (objects)', '外延（对象）', 'Umfang (Gegenstände)'],
    extAttr: ['Extent (attributes)', '外延（属性）', 'Umfang (Merkmale)'],
    intent: ['Intent (shared attributes)', '内涵（共有属性）', 'Inhalt (gemeinsame Merkmale)'],
    attrAll: ['Attributes all of them have', '它们全部具有的属性', 'Merkmale, die sie alle haben'],
    attrNone: ['Attributes none of them has', '它们全部不具有的属性', 'Merkmale, die keiner von ihnen hat'],
    objAll: ['Objects having all of them', '拥有全部这些属性的对象', 'Gegenstände, die sie alle haben'],
    objNone: ['Objects having none of them', '一个都不拥有的对象', 'Gegenstände, die keines davon haben'],
    allConcepts: ['All concepts ({0})', '全部概念（{0}）', 'Alle Begriffe ({0})'],
    allConceptsPlain: ['All concepts', '全部概念', 'Alle Begriffe'],
    impl: ['Implications ({0})', '蕴含规则（{0}）', 'Implikationen ({0})'],
    implPlain: ['Implications', '蕴含规则', 'Implikationen'],
    implNone: ['No rule holds in this table beyond the trivial ones.', '这张表里没有非平凡的蕴含规则。', 'In dieser Tabelle gilt keine nichttriviale Regel.'],
    implTooMany: ['Too many rules to list.', '规则太多，无法列出。', 'Zu viele Regeln, um sie aufzulisten.'],
    implNever: ['Never together in this table', '在这张表中从不同时出现', 'Kommen in dieser Tabelle nie gemeinsam vor'],
    always: ['every object', '所有对象', 'jeder Gegenstand'],
    notInRef: ['not in the reference', '参考表中不成立', 'gilt nicht in der Referenz'],
    notInCur: ['no longer holds', '当前表中不再成立', 'gilt nicht mehr'],
    tagNew: ['only here', '仅此表', 'nur hier'],
    tagLost: ['gone', '已消失', 'entfallen'],
    diffCells: ['Differing cells: {0}', '不同的单元格：{0}', 'Abweichende Zellen: {0}'],
    diffHere: ['Concepts only in this table: {0}', '仅当前表有的概念：{0}', 'Begriffe nur in dieser Tabelle: {0}'],
    diffRef: ['Concepts only in the reference: {0}', '仅参考表有的概念：{0}', 'Begriffe nur in der Referenz: {0}'],
    diffRing: ['Ringed nodes exist only in the table shown.', '带外圈的节点只存在于当前显示的那张表中。', 'Umringte Knoten gibt es nur in der gezeigten Tabelle.'],
    diffSame: ['The table is identical to the reference.', '当前表与参考表完全相同。', 'Die Tabelle stimmt mit der Referenz überein.'],
    alsoRef: ['Also a concept of the reference.', '在参考表中也是一个概念。', 'Auch ein Begriff der Referenz.'],
    notRef: ['Not a concept of the reference.', '在参考表中不是概念。', 'Kein Begriff der Referenz.'],
    alsoCur: ['Also a concept of the current table.', '在当前表中也是一个概念。', 'Auch ein Begriff der aktuellen Tabelle.'],
    notCur: ['No longer a concept of the current table.', '在当前表中已不再是概念。', 'Kein Begriff der aktuellen Tabelle mehr.'],
    impEmpty: ['Paste a table first.', '请先粘贴表格。', 'Fügen Sie zuerst eine Tabelle ein.'],
    impShape: ['This could not be read as a table. It needs a header row with the attribute names, then one row per object.',
      '无法把这段内容读成表格。需要第一行是属性名称，之后每个对象一行。',
      'Das ließ sich nicht als Tabelle lesen. Nötig sind eine Kopfzeile mit den Merkmalsnamen und danach eine Zeile je Gegenstand.'],
    impTooBig: ['The table is {0} × {1}; this demo handles at most {2} × {3}.', '这张表是 {0} × {1}，本演示最多支持 {2} × {3}。',
      'Die Tabelle ist {0} × {1}; diese Demo verarbeitet höchstens {2} × {3}.'],
    impOk: ['Loaded {0} objects × {1} attributes.', '已载入 {0} 个对象 × {1} 个属性。', '{0} Gegenstände × {1} Merkmale geladen.'],
    impRefDropped: [' The table has other objects or attributes than the reference, so the reference was cleared.',
      ' 这张表的对象或属性与参考表不同，参考表已清除。',
      ' Die Tabelle hat andere Gegenstände oder Merkmale als die Referenz; die Referenz wurde entfernt.'],
    copied: ['Link copied.', '链接已复制。', 'Link kopiert.'],
    copyFail: ['Copy the address from the address bar.', '请从地址栏复制网址。', 'Kopieren Sie die Adresse aus der Adresszeile.'],
    diagram: ['Concept lattice diagram', '概念格图', 'Diagramm des Begriffsverbands']
  };

  function currentLang() {
    var lang = document.documentElement.getAttribute('data-lang');
    return lang === 'zh' || lang === 'de' ? lang : 'en';
  }

  function tr(key) {
    var entry = STR[key];
    var text = entry[LANGS.indexOf(currentLang())] || entry[0];
    for (var k = 1; k < arguments.length; k++) text = text.split('{' + (k - 1) + '}').join(arguments[k]);
    return text;
  }

  function countObjects(n) {
    var lang = currentLang();
    if (lang === 'zh') return n + ' 个对象';
    if (lang === 'de') return n === 1 ? '1 Gegenstand' : n + ' Gegenstände';
    return n === 1 ? '1 object' : n + ' objects';
  }

  function nameOf(item) {
    var lang = currentLang();
    return (lang !== 'en' && item[lang]) || item.en;
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function announce(text) {
    statusEl.textContent = '';
    statusEl.textContent = text;
  }

  // ---- State ------------------------------------------------------------------
  function emptyRow() { return state.attrs.map(function () { return false; }); }

  function presetCells(p) {
    return p.rows.map(function (row) {
      var r = p.attrs.map(function () { return false; });
      row.forEach(function (m) { r[m] = true; });
      return r;
    });
  }

  function loadPreset(id) {
    var p = PRESETS[id];
    state.base = id;
    state.objects = p.objects.map(function (o) { return { en: o[0], zh: o[1] || o[0], de: o[2] || o[0] }; });
    state.attrs = p.attrs.map(function (a) { return { en: a[0], zh: a[1] || a[0], de: a[2] || a[0] }; });
    state.inc = presetCells(p);
    state.ref = null;
    state.view = 'cur';
    state.selected = null;
  }

  function sameCells(a, b) {
    return a.length === b.length && a.every(function (row, i) {
      return row.length === b[i].length && row.every(function (v, j) { return v === b[i][j]; });
    });
  }

  function isPristine() {
    return !!state.base && sameCells(state.inc, presetCells(PRESETS[state.base]));
  }

  function snapshot() {
    return JSON.stringify({ base: state.base, objects: state.objects, attrs: state.attrs, inc: state.inc, ref: state.ref });
  }

  // Remember the table as it is, before a change, so "Undo" can bring it back.
  function checkpoint() {
    undoStack.push(snapshot());
    if (undoStack.length > UNDO_MAX) undoStack.shift();
    undoBtn.disabled = false;
  }

  function undo() {
    if (!undoStack.length) return;
    var s = JSON.parse(undoStack.pop());
    state.base = s.base;
    state.objects = s.objects;
    state.attrs = s.attrs;
    state.inc = s.inc;
    state.ref = s.ref;
    if (!state.ref) state.view = 'cur';
    state.selected = null;
    undoBtn.disabled = !undoStack.length;
    renderAll();
  }

  // ---- Link to the current table ------------------------------------------------
  // The address carries the whole state, so a link reopens exactly this table:
  //   p=<example>  [c=<cells>]         an example, with its cells if they were edited
  //   d=<names>     c=<cells>          any other table (names as base64url JSON)
  //   r=<cells>                        the reference being compared against
  //   m=oe|ae   v=ref                  kind of concept, which table is drawn
  // Cells are one base-36 number per row (bit j = attribute j), joined by dots.
  function encodeCells(inc) {
    return inc.map(function (row) {
      var mask = 0;
      row.forEach(function (v, j) { if (v) mask |= 1 << j; });
      return mask.toString(36);
    }).join('.');
  }

  function decodeCells(text, nG, nM) {
    var parts = String(text).split('.');
    if (parts.length !== nG) return null;
    var out = [];
    for (var i = 0; i < nG; i++) {
      var mask = parseInt(parts[i], 36);
      if (!(mask >= 0) || mask >= Math.pow(2, nM)) return null;
      var row = [];
      for (var j = 0; j < nM; j++) row.push(!!(mask & (1 << j)));
      out.push(row);
    }
    return out;
  }

  function toBase64Url(text) {
    return btoa(unescape(encodeURIComponent(text))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function fromBase64Url(text) {
    var b64 = text.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    return decodeURIComponent(escape(atob(b64)));
  }

  function encodeState() {
    var parts = [];
    if (state.base) {
      if (state.base !== DEFAULT_PRESET || !isPristine()) parts.push('p=' + state.base);
      if (!isPristine()) parts.push('c=' + encodeCells(state.inc));
    } else {
      parts.push('d=' + toBase64Url(JSON.stringify({ o: state.objects.map(nameOf), a: state.attrs.map(nameOf) })));
      parts.push('c=' + encodeCells(state.inc));
    }
    if (state.ref) parts.push('r=' + encodeCells(state.ref));
    if (state.mode !== 'classical') parts.push('m=' + state.mode);
    if (state.ref && state.view === 'ref') parts.push('v=ref');
    return parts.join('&');
  }

  // Returns false (and leaves the state alone) if the text is not a valid state.
  function decodeState(hash) {
    var q = {};
    String(hash).replace(/^#/, '').split('&').forEach(function (pair) {
      var k = pair.indexOf('=');
      if (k > 0) q[pair.slice(0, k)] = pair.slice(k + 1);
    });
    var objects, attrs, inc, base = null;
    try {
      if (q.d) {
        var names = JSON.parse(fromBase64Url(q.d));
        if (!names || !Array.isArray(names.o) || !Array.isArray(names.a)) return false;
        if (!names.o.length || !names.a.length || names.o.length > MAX_OBJECTS || names.a.length > MAX_ATTRS) return false;
        var item = function (n) { n = String(n).slice(0, NAME_MAX); return { en: n, zh: n, de: n }; };
        objects = names.o.map(item);
        attrs = names.a.map(item);
        inc = decodeCells(q.c, objects.length, attrs.length);
        if (!inc) return false;
      } else {
        var id = q.p || DEFAULT_PRESET;
        if (!PRESETS[id]) return false;
        loadPreset(id);
        objects = state.objects;
        attrs = state.attrs;
        base = id;
        inc = q.c ? decodeCells(q.c, objects.length, attrs.length) : state.inc;
        if (!inc) return false;
      }
    } catch (e) {
      return false;
    }
    state.base = base;
    state.objects = objects;
    state.attrs = attrs;
    state.inc = inc;
    state.ref = q.r ? decodeCells(q.r, objects.length, attrs.length) : null;
    state.mode = MODES.indexOf(q.m) >= 0 ? q.m : 'classical';
    state.view = state.ref && q.v === 'ref' ? 'ref' : 'cur';
    state.selected = null;
    return true;
  }

  var lastHash = '';
  function syncUrl() {
    lastHash = encodeState();
    try {
      history.replaceState(null, '', location.pathname + location.search + (lastHash ? '#' + lastHash : ''));
    } catch (e) {}
  }

  // ---- Table ---------------------------------------------------------------------
  // Chinese, Japanese and Korean names are set upright, one character under
  // the other; everything else is turned to read from the bottom up.
  var CJK = /[぀-ヿ㐀-鿿가-힯豈-﫿]/;

  function setVertical(span, text) {
    span.textContent = text;
    span.classList.toggle('is-cjk', CJK.test(text));
  }

  function renderPresetOptions() {
    var lang = LANGS.indexOf(currentLang());
    presetSelect.innerHTML = '';
    Object.keys(PRESETS).forEach(function (id) {
      var o = el('option', '', PRESETS[id].label[lang] || PRESETS[id].label[0]);
      o.value = id;
      presetSelect.appendChild(o);
    });
    if (!isPristine()) {
      var c = el('option', '', tr('custom'));
      c.value = 'custom';
      presetSelect.appendChild(c);
    }
    presetSelect.value = isPristine() ? state.base : 'custom';
  }

  function nameButton(cls, item, kind, index) {
    var b = el('button', cls);
    b.type = 'button';
    b.dataset.kind = kind;
    b.dataset.index = String(index);
    var label = kind === 'attr' ? el('span', 'lat-vert') : b;
    if (kind === 'attr') { setVertical(label, nameOf(item)); b.appendChild(label); } else { b.textContent = nameOf(item); }
    b.setAttribute('aria-label', tr('renameHint', nameOf(item)));
    b.addEventListener('click', function (e) { e.stopPropagation(); openEditor(b, kind, index); });
    b.addEventListener('mouseenter', function () { hoverName(kind, index, true); });
    b.addEventListener('mouseleave', function () { hoverName(kind, index, false); });
    return b;
  }

  function addButton(text, vertical, disabled, limit, onClick) {
    var b = el('button', 'lat-add');
    b.type = 'button';
    if (vertical) { var s = el('span', 'lat-vert'); setVertical(s, text); b.appendChild(s); } else { b.textContent = text; }
    b.disabled = disabled;
    if (disabled) b.title = tr('limit', limit);
    b.addEventListener('click', onClick);
    return b;
  }

  function renderTable() {
    var nG = state.objects.length, nM = state.attrs.length;
    closeEditor();
    tableEl.innerHTML = '';
    tableEl.appendChild(el('caption', 'sr-only', tr('caption')));

    var thead = el('thead');
    var hr = el('tr');
    hr.appendChild(el('th', 'lat-corner'));
    state.attrs.forEach(function (a, j) {
      var th = el('th', 'lat-colhead');
      th.scope = 'col';
      th.dataset.j = String(j);
      th.appendChild(nameButton('lat-colname', a, 'attr', j));
      hr.appendChild(th);
    });
    var addCol = el('th', 'lat-colhead lat-addcol');
    addCol.appendChild(addButton(tr('addAttr'), true, nM >= MAX_ATTRS, MAX_ATTRS, function () {
      checkpoint();
      state.attrs.push({ en: tr('newAttr', nM + 1), zh: tr('newAttr', nM + 1), de: tr('newAttr', nM + 1) });
      state.inc.forEach(function (row) { row.push(false); });
      if (state.ref) state.ref.forEach(function (row) { row.push(false); });
      structureChanged();
    }));
    hr.appendChild(addCol);
    thead.appendChild(hr);
    tableEl.appendChild(thead);

    var tbody = el('tbody');
    state.objects.forEach(function (o, i) {
      var tr_ = el('tr');
      var th = el('th', 'lat-rowhead');
      th.scope = 'row';
      th.dataset.i = String(i);
      th.appendChild(nameButton('lat-rowname', o, 'obj', i));
      tr_.appendChild(th);
      state.attrs.forEach(function (a, j) {
        var td = el('td', 'lat-cellwrap');
        var b = el('button', 'lat-cell');
        b.type = 'button';
        b.dataset.i = String(i);
        b.dataset.j = String(j);
        b.setAttribute('role', 'checkbox');
        b.addEventListener('click', function () {
          checkpoint();
          state.inc[i][j] = !state.inc[i][j];
          state.selected = null;
          refreshCells();
          renderPresetOptions();
          renderOutput();
          syncUrl();
        });
        td.appendChild(b);
        tr_.appendChild(td);
      });
      tr_.appendChild(el('td', 'lat-pad'));
      tbody.appendChild(tr_);
    });
    var lr = el('tr');
    var addRow = el('th', 'lat-rowhead lat-addrow');
    addRow.appendChild(addButton(tr('addObj'), false, nG >= MAX_OBJECTS, MAX_OBJECTS, function () {
      checkpoint();
      state.objects.push({ en: tr('newObj', nG + 1), zh: tr('newObj', nG + 1), de: tr('newObj', nG + 1) });
      state.inc.push(emptyRow());
      if (state.ref) state.ref.push(emptyRow());
      structureChanged();
    }));
    lr.appendChild(addRow);
    tbody.appendChild(lr);
    tableEl.appendChild(tbody);

    refreshCells();
    sizeNote.textContent = tr('size', nG, nM);
    // The left column of the page is as wide as the table needs (see .lat-layout).
    layoutEl.style.setProperty('--ctx-w', (tableEl.offsetWidth + 2) + 'px');
  }

  // Crosses, names for screen readers, and the differences from the reference.
  function refreshCells() {
    tableEl.querySelectorAll('.lat-cell').forEach(function (b) {
      var i = +b.dataset.i, j = +b.dataset.j;
      var on = state.inc[i][j];
      b.textContent = on ? '×' : '';
      b.setAttribute('aria-checked', String(on));
      b.setAttribute('aria-label', nameOf(state.objects[i]) + ' — ' + nameOf(state.attrs[j]));
      var was = state.ref ? state.ref[i][j] : on;
      b.parentNode.classList.toggle('is-added', on && !was);
      b.parentNode.classList.toggle('is-removed', !on && was);
    });
    compareOff.hidden = !!state.ref;
    compareOn.hidden = !state.ref;
    $('compareLegend').hidden = !state.ref;
  }

  function structureChanged() {
    state.base = null;
    state.selected = null;
    renderAll();
  }

  // ---- Renaming and removing: a small editor that opens at the name ---------------
  var editor = null;   // { box, input, kind, index, anchor, before, saved }

  function closeEditor() {
    if (!editor) return;
    var e = editor;
    editor = null;
    e.box.remove();
    // An emptied name gets its old text back.
    var list = e.kind === 'attr' ? state.attrs : state.objects;
    var item = list[e.index];
    if (item && !nameOf(item).trim()) {
      item.en = e.before.en; item.zh = e.before.zh; item.de = e.before.de;
      renderAll();
    }
  }

  function openEditor(anchor, kind, index) {
    if (editor && editor.anchor === anchor) { closeEditor(); return; }
    closeEditor();
    var list = kind === 'attr' ? state.attrs : state.objects;
    var item = list[index];
    var box = el('div', 'lat-pop');
    var input = el('input', 'lat-name');
    input.type = 'text';
    input.maxLength = NAME_MAX;
    input.value = nameOf(item);
    input.setAttribute('aria-label', tr(kind === 'attr' ? 'editAttr' : 'editObj'));
    var remove = el('button', 'lat-btn', tr('remove'));
    remove.type = 'button';
    remove.disabled = list.length <= 1;
    box.appendChild(input);
    box.appendChild(remove);
    ctxPanel.appendChild(box);
    editor = { box: box, input: input, kind: kind, index: index, anchor: anchor, before: { en: item.en, zh: item.zh, de: item.de }, saved: false };

    // Under the name, kept inside the panel.
    var pr = ctxPanel.getBoundingClientRect(), ar = anchor.getBoundingClientRect();
    var left = Math.max(0, Math.min(ar.left - pr.left, pr.width - box.offsetWidth));
    box.style.left = left + 'px';
    box.style.top = (ar.bottom - pr.top + 6) + 'px';

    input.addEventListener('input', function () {
      if (!editor.saved) { checkpoint(); editor.saved = true; }
      item.en = input.value; item.zh = input.value; item.de = input.value;
      state.base = null;
      var label = anchor.querySelector('.lat-vert');
      if (label) setVertical(label, input.value); else anchor.textContent = input.value;
      anchor.setAttribute('aria-label', tr('renameHint', input.value));
      layoutEl.style.setProperty('--ctx-w', (tableEl.offsetWidth + 2) + 'px');
      refreshCells();
      renderPresetOptions();
      renderOutput();
      syncUrl();
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); closeEditor(); anchor.focus(); }
      if (e.key === 'Escape') {
        e.preventDefault();
        if (editor.saved) { closeEditor(); undo(); } else { closeEditor(); anchor.focus(); }
      }
    });
    remove.addEventListener('click', function () {
      if (!editor.saved) checkpoint();
      editor = null;
      box.remove();
      if (kind === 'attr') {
        state.attrs.splice(index, 1);
        state.inc.forEach(function (row) { row.splice(index, 1); });
        if (state.ref) state.ref.forEach(function (row) { row.splice(index, 1); });
      } else {
        state.objects.splice(index, 1);
        state.inc.splice(index, 1);
        if (state.ref) state.ref.splice(index, 1);
      }
      structureChanged();
    });
    box.addEventListener('click', function (e) { e.stopPropagation(); });
    input.focus();
    input.select();
  }

  document.addEventListener('click', function () { closeEditor(); });

  // ---- Analysis ------------------------------------------------------------------
  function analyzeTable(inc, mode, drawLimit) {
    var nG = state.objects.length, nM = state.attrs.length;
    var opts = { drawLimit: drawLimit };
    if (mode === 'classical') return Core.analyze(inc, nG, nM, 'classical', opts);
    if (mode === 'oe') return Core.analyze(inc, nG, nM, 'threeway', opts);
    return Core.analyze(Core.transpose(inc, nG, nM), nM, nG, 'threeway', opts);
  }

  function shownCells() { return state.view === 'ref' && state.ref ? state.ref : state.inc; }
  function otherCells() { return !state.ref ? null : state.view === 'ref' ? state.inc : state.ref; }

  // In attribute-induced mode the roles are swapped: the extent is a set of
  // attributes and the two sides of the intent are sets of objects.
  function sides(mode) {
    return mode === 'ae'
      ? { ext: state.attrs, intent: state.objects }
      : { ext: state.objects, intent: state.attrs };
  }

  function names(mask, items) {
    var out = [];
    items.forEach(function (item, i) { if (mask & (1 << i)) out.push(nameOf(item)); });
    return out;
  }

  function setText(mask, items) {
    var out = names(mask, items);
    return out.length ? '{' + out.join(', ') + '}' : '∅';
  }

  function conceptText(node, mode) {
    var s = sides(mode);
    return {
      ext: setText(node.ext, s.ext),
      pos: setText(node.pos, s.intent),
      neg: mode === 'classical' ? null : setText(node.neg, s.intent)
    };
  }

  // ---- Output ---------------------------------------------------------------------
  function renderOutput() {
    var mode = state.mode;
    rootEl.setAttribute('data-mode', mode);
    document.querySelectorAll('.lat-mode[data-mode]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.mode === mode));
    });
    document.querySelectorAll('.lat-mode[data-view]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.view === state.view));
    });
    viewRow.hidden = !state.ref;

    var cells = shownCells();
    var res = analyzeTable(cells, mode, DRAW_LIMIT);

    // The number of concepts of each kind, on its button: shows at a glance
    // what the negative information adds.
    MODES.forEach(function (m) {
      var r = m === mode ? res : analyzeTable(cells, m, 0);
      $('count-' + m).textContent = r.tooMany ? '> ' + r.count : String(r.count);
    });

    // The other table of a comparison: which of the concepts shown it lacks.
    var other = null;
    if (state.ref) {
      var o = analyzeTable(otherCells(), mode, DRAW_LIMIT);
      if (!o.tooMany && !o.tooManyToDraw) {
        other = {};
        o.nodes.forEach(function (n) { other[n.ext] = true; });
      }
    }
    current = { res: res, mode: mode, other: other, onlyOther: 0 };

    diagramEl.innerHTML = '';
    listEl.innerHTML = '';
    infoEl.textContent = '';

    if (res.tooMany || res.tooManyToDraw) {
      var big = res.tooMany ? '> ' + res.count : String(res.count);
      diagramEl.appendChild(el('p', 'lat-message', tr('tooMany', big, DRAW_LIMIT)));
      listSummary.textContent = tr('allConceptsPlain');
      state.selected = null;
      current.res = null;
    } else {
      if (other) {
        var here = {};
        res.nodes.forEach(function (n) { here[n.ext] = true; });
        Object.keys(other).forEach(function (ext) { if (!here[ext]) current.onlyOther++; });
      }
      if (state.selected !== null && selectedIndex(res) < 0) state.selected = null;
      drawDiagram(res);
      renderList(res);
      renderInfo(res);
      listSummary.textContent = tr('allConcepts', res.count);
    }
    renderDiff();
    renderImplications();
    applySelection();
  }

  function selectedIndex(res) {
    for (var i = 0; i < res.nodes.length; i++) if (res.nodes[i].ext === state.selected) return i;
    return -1;
  }

  function select(ext) {
    state.selected = ext;
    applySelection();
    if (current && current.res) renderInfo(current.res);
  }

  // A concept chosen from a list further down the page: bring the diagram
  // (and with it the table) back into view, where the choice is shown.
  function selectAndShow(ext) {
    select(ext);
    var r = diagramEl.getBoundingClientRect();
    if (r.bottom < 120 || r.top > window.innerHeight - 120) diagramEl.scrollIntoView({ block: 'center' });
  }

  function isDiff(node) {
    return !!current.other && !current.other[node.ext];
  }

  function renderInfo(res) {
    var idx = state.selected === null ? -1 : selectedIndex(res);
    infoEl.innerHTML = '';
    if (idx < 0) {
      infoEl.appendChild(el('p', 'lat-hint', tr('hint')));
      return;
    }
    var mode = state.mode, txt = conceptText(res.nodes[idx], mode);
    function line(label, value) {
      var p = el('p', 'lat-info-line');
      p.appendChild(el('strong', '', label + (currentLang() === 'zh' ? '：' : ': ')));
      p.appendChild(document.createTextNode(value));
      infoEl.appendChild(p);
    }
    if (mode === 'ae') {
      line(tr('extAttr'), txt.ext);
      line(tr('objAll'), txt.pos);
      line(tr('objNone'), txt.neg);
    } else if (mode === 'oe') {
      line(tr('extObj'), txt.ext);
      line(tr('attrAll'), txt.pos);
      line(tr('attrNone'), txt.neg);
    } else {
      line(tr('extObj'), txt.ext);
      line(tr('intent'), txt.pos);
    }
    if (current.other) {
      var same = !isDiff(res.nodes[idx]);
      var key = state.view === 'ref' ? (same ? 'alsoCur' : 'notCur') : (same ? 'alsoRef' : 'notRef');
      infoEl.appendChild(el('p', 'lat-info-line lat-info-diff', tr(key)));
    }
  }

  function renderList(res) {
    var mode = state.mode, three = mode !== 'classical';
    var table = el('table', 'lat-list-table');
    var head = el('tr');
    var cols = mode === 'ae' ? [tr('extAttr'), tr('objAll'), tr('objNone')]
      : mode === 'oe' ? [tr('extObj'), tr('attrAll'), tr('attrNone')]
        : [tr('extObj'), tr('intent')];
    cols.forEach(function (c) { var th = el('th', '', c); th.scope = 'col'; head.appendChild(th); });
    table.appendChild(head);

    for (var i = res.nodes.length - 1; i >= 0; i--) {   // top concept first
      (function (n) {
        var txt = conceptText(n, mode);
        var row = el('tr', 'lat-list-row');
        row.dataset.ext = String(n.ext);
        row.tabIndex = 0;
        var first = el('td', '', txt.ext);
        if (isDiff(n)) first.appendChild(el('span', 'lat-tag', tr(state.view === 'ref' ? 'tagLost' : 'tagNew')));
        row.appendChild(first);
        row.appendChild(el('td', '', txt.pos));
        if (three) row.appendChild(el('td', '', txt.neg));
        function choose() { selectAndShow(n.ext); }
        row.addEventListener('click', choose);
        row.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(); }
        });
        table.appendChild(row);
      })(res.nodes[i]);
    }
    listEl.appendChild(table);
  }

  // What the comparison found, in one line above the diagram.
  function renderDiff() {
    diffEl.hidden = !state.ref;
    if (!state.ref) return;
    var cells = 0;
    state.inc.forEach(function (row, i) { row.forEach(function (v, j) { if (v !== state.ref[i][j]) cells++; }); });
    diffEl.innerHTML = '';
    if (!cells) {
      diffEl.textContent = tr('diffSame');
      return;
    }
    var parts = [tr('diffCells', cells)];
    if (current.res && current.other) {
      var shown = current.res.nodes.filter(isDiff).length;
      var here = state.view === 'ref' ? current.onlyOther : shown;
      var inRef = state.view === 'ref' ? shown : current.onlyOther;
      parts.push(tr('diffHere', here));
      parts.push(tr('diffRef', inRef));
    }
    parts.forEach(function (text) { diffEl.appendChild(el('span', 'lat-diff-item', text)); });
    if (current.res && current.other && current.res.nodes.some(isDiff)) {
      diffEl.appendChild(el('span', 'lat-diff-note', tr('diffRing')));
    }
  }

  // ---- Implications ---------------------------------------------------------------
  function renderImplications() {
    var nG = state.objects.length, nM = state.attrs.length;
    var cells = shownCells();
    var found = Core.implications(cells, nG, nM);
    implEl.innerHTML = '';
    if (found.tooMany) {
      implSummary.textContent = tr('implPlain');
      implEl.appendChild(el('p', 'lat-hint', tr('implTooMany')));
      return;
    }
    implSummary.textContent = tr('impl', found.list.length);
    if (!found.list.length) {
      implEl.appendChild(el('p', 'lat-hint', tr('implNone')));
      return;
    }
    var mk = Core.masks(cells, nG, nM);
    var otherMk = otherCells() ? Core.masks(otherCells(), nG, nM) : null;
    var canSelect = state.mode !== 'ae' && !!(current && current.res);

    function row(im, never) {
      var b = el(canSelect ? 'button' : 'div', 'lat-impl-row');
      if (canSelect) b.type = 'button';
      var premise = names(im.premise, state.attrs);
      b.appendChild(el('span', 'lat-impl-p', premise.length ? premise.join(', ') : tr('always')));
      if (!never) {
        b.appendChild(el('span', 'lat-arrow', '→'));
        b.appendChild(el('span', 'lat-impl-c', names(im.conclusion, state.attrs).join(', ')));
        b.appendChild(el('span', 'lat-impl-s', countObjects(im.support)));
      }
      // A rule of this table that the other table of the comparison breaks.
      if (otherMk && (Core.intentClosure(otherMk, im.premise).intent & im.conclusion) !== im.conclusion) {
        b.appendChild(el('span', 'lat-tag', tr(state.view === 'ref' ? 'notInCur' : 'notInRef')));
      }
      if (canSelect) {
        b.addEventListener('click', function () {
          var ext = Core.intentClosure(mk, im.premise).ext;
          if (current.res.nodes.some(function (n) { return n.ext === ext; })) selectAndShow(ext);
        });
      }
      var li = el('li');
      li.appendChild(b);
      return li;
    }

    var holds = found.list.filter(function (im) { return im.support > 0; });
    var never = found.list.filter(function (im) { return im.support === 0; });
    holds.sort(function (a, b) { return b.support - a.support; });
    if (holds.length) {
      var ul = el('ul', 'lat-impl');
      holds.forEach(function (im) { ul.appendChild(row(im, false)); });
      implEl.appendChild(ul);
    }
    if (never.length) {
      implEl.appendChild(el('p', 'lat-sub', tr('implNever')));
      var ul2 = el('ul', 'lat-impl');
      never.forEach(function (im) { ul2.appendChild(row(im, true)); });
      implEl.appendChild(ul2);
    }
  }

  // ---- Selection: in the diagram, the list and the table ----------------------------
  function applySelection() {
    var ext = state.selected;
    var res = current && current.res;
    var svg = diagramEl.querySelector('svg');
    if (svg) svg.classList.toggle('has-selection', ext !== null);
    diagramEl.querySelectorAll('.lat-node').forEach(function (g) {
      var e = +g.dataset.ext;
      g.classList.toggle('is-active', ext !== null && e === ext);
      // Everything above (larger extent) and below (smaller extent) the choice.
      g.classList.toggle('is-rel', ext !== null && e !== ext && ((e & ext) === ext || (e & ext) === e));
    });
    diagramEl.querySelectorAll('.lat-edge').forEach(function (line) {
      var lo = +line.dataset.lo, up = +line.dataset.up;
      var on = ext !== null && (((lo & ext) === ext && (up & ext) === ext) || ((lo & ext) === lo && (up & ext) === up));
      line.classList.toggle('is-rel', on);
    });
    listEl.querySelectorAll('.lat-list-row').forEach(function (row) {
      row.classList.toggle('is-active', ext !== null && row.dataset.ext === String(ext));
    });

    // The concept as a rectangle in the table: its rows and columns, the
    // cells where they meet, and (three-way) the block that is empty.
    var node = null;
    if (res && ext !== null) { var idx = selectedIndex(res); if (idx >= 0) node = res.nodes[idx]; }
    var rows = 0, colsPos = 0, colsNeg = 0, rowsNeg = 0;
    if (node && state.mode === 'ae') { colsPos = node.ext; rows = node.pos; rowsNeg = node.neg; }
    else if (node) { rows = node.ext; colsPos = node.pos; colsNeg = node.neg; }
    tableEl.querySelectorAll('.lat-rowhead[data-i]').forEach(function (th) {
      var bit = 1 << +th.dataset.i;
      th.classList.toggle('is-on', !!(rows & bit));
      th.classList.toggle('is-neg', !!(rowsNeg & bit));
    });
    tableEl.querySelectorAll('.lat-colhead[data-j]').forEach(function (th) {
      var bit = 1 << +th.dataset.j;
      th.classList.toggle('is-on', !!(colsPos & bit));
      th.classList.toggle('is-neg', !!(colsNeg & bit));
    });
    tableEl.querySelectorAll('.lat-cell').forEach(function (b) {
      var r = 1 << +b.dataset.i, c = 1 << +b.dataset.j;
      b.parentNode.classList.toggle('in-rect', !!(rows & r) && !!(colsPos & c));
      b.parentNode.classList.toggle('in-neg', (!!(rows & r) && !!(colsNeg & c)) || (!!(rowsNeg & r) && !!(colsPos & c)));
    });
  }

  // Pointing at a name in the table shows where it is written in the diagram.
  function hoverName(kind, index, on) {
    var res = current && current.res;
    if (!res) return;
    var asExtent = (kind === 'obj') === (state.mode !== 'ae');
    var node = asExtent ? res.objectNode[index] : res.attrNode[index];
    if (node === undefined) return;
    var ext = String(res.nodes[node].ext);
    diagramEl.querySelectorAll('.lat-node').forEach(function (g) {
      g.classList.toggle('is-hover', on && g.dataset.ext === ext);
    });
  }

  // ---- Diagram -----------------------------------------------------------------------
  function svgEl(name, attrs) {
    var e = document.createElementNS(SVG_NS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  var measure = null;
  function textWidth(text) {
    if (!measure) measure = document.createElement('canvas').getContext('2d');
    measure.font = '12px ' + getComputedStyle(document.body).fontFamily;
    return measure.measureText(text).width;
  }

  function segmentHitsBox(x1, y1, x2, y2, b) {
    // Liang–Barsky clipping of the segment against the box.
    var t0 = 0, t1 = 1, dx = x2 - x1, dy = y2 - y1;
    var p = [-dx, dx, -dy, dy], q = [x1 - b.x0, b.x1 - x1, y1 - b.y0, b.y1 - y1];
    for (var i = 0; i < 4; i++) {
      if (p[i] === 0) { if (q[i] < 0) return false; continue; }
      var r = q[i] / p[i];
      if (p[i] < 0) { if (r > t1) return false; if (r > t0) t0 = r; }
      else { if (r < t0) return false; if (r < t1) t1 = r; }
    }
    return t0 < t1;
  }

  function boxesOverlap(a, b) {
    return a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
  }

  function distToSegment(px, py, x1, y1, x2, y2) {
    var dx = x2 - x1, dy = y2 - y1, len = dx * dx + dy * dy;
    var t = len ? Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / len)) : 0;
    return Math.sqrt(Math.pow(px - x1 - t * dx, 2) + Math.pow(py - y1 - t * dy, 2));
  }

  var R = 6.5, LINE = 15, COL = 128, COL_MIN = 58;

  // Where everything goes, for a drawing with `pad` free on both sides.
  function geometry(res, lay, above, below, boxW, pad) {
    var n = res.nodes.length, k;
    // Levels are a little closer together where the box is narrow (a phone),
    // so the lattice and the table above it fit on one screen more often.
    var ROW = boxW < 420 ? 66 : 80;
    // Columns are at most COL wide, so a small lattice stays compact in the
    // middle of the box; a wide one gets narrower columns, then scrolls.
    var unit = Math.min(COL, Math.max(COL_MIN, (boxW - 2 * pad) / lay.span));
    var tight = unit <= COL_MIN + 0.01;
    var inner = lay.span * unit;
    var W = Math.max(boxW, inner + 2 * pad);
    var xs = [], ys = [];
    for (k = 0; k < n; k++) {
      xs[k] = W / 2 + (lay.x[k] - 0.5) * inner;
      ys[k] = lay.level[k] * ROW;
    }

    // Edges are straight, except one that would run through a node it has
    // nothing to do with (possible when it spans several levels): that one
    // bows around the node, to whichever side leaves more room.
    var segments = [];
    var edges = res.covers.map(function (c) {
      var x1 = xs[c[0]], y1 = ys[c[0]], x2 = xs[c[1]], y2 = ys[c[1]];
      var clear = R + 7, blocked = false, q;
      if (lay.level[c[0]] - lay.level[c[1]] > 1) {
        for (q = 0; q < n && !blocked; q++) {
          blocked = q !== c[0] && q !== c[1] && distToSegment(xs[q], ys[q], x1, y1, x2, y2) < clear;
        }
      }
      if (!blocked) {
        segments.push([x1, y1, x2, y2]);
        return { d: 'M' + x1.toFixed(1) + ' ' + y1.toFixed(1) + 'L' + x2.toFixed(1) + ' ' + y2.toFixed(1), c: c };
      }
      var len = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
      var nx = -(y2 - y1) / len, ny = (x2 - x1) / len, best = null;
      [1, -1, 1.7, -1.7].forEach(function (f) {
        var cx = (x1 + x2) / 2 + nx * f * 2 * (R + 16), cy = (y1 + y2) / 2 + ny * f * 2 * (R + 16);
        var pts = [], room = Infinity, t, j;
        for (t = 0; t <= 8; t++) {
          var u = t / 8;
          pts.push([(1 - u) * (1 - u) * x1 + 2 * (1 - u) * u * cx + u * u * x2, (1 - u) * (1 - u) * y1 + 2 * (1 - u) * u * cy + u * u * y2]);
        }
        for (q = 0; q < n; q++) {
          if (q === c[0] || q === c[1]) continue;
          for (j = 1; j < pts.length; j++) room = Math.min(room, distToSegment(xs[q], ys[q], pts[j - 1][0], pts[j - 1][1], pts[j][0], pts[j][1]));
        }
        // The gentler bow wins unless it still comes too close to a node.
        var score = Math.min(room, clear + 6) - Math.abs(f) * 0.01;
        if (!best || score > best.score) best = { score: score, cx: cx, cy: cy, pts: pts };
      });
      for (q = 1; q < best.pts.length; q++) segments.push([best.pts[q - 1][0], best.pts[q - 1][1], best.pts[q][0], best.pts[q][1]]);
      return { d: 'M' + x1.toFixed(1) + ' ' + y1.toFixed(1) + 'Q' + best.cx.toFixed(1) + ' ' + best.cy.toFixed(1) + ' ' + x2.toFixed(1) + ' ' + y2.toFixed(1), c: c };
    });

    // Each block of names tries several places around its node and takes the
    // one that crosses the fewest edges and touches no other name or node.
    // A second and third round let earlier blocks react to later ones.
    var blocks = [];
    lay.levels.forEach(function (row) {
      row.forEach(function (node) {
        [[above[node], true], [below[node], false]].forEach(function (pair) {
          if (!pair[0].length) return;
          var w = 0;
          pair[0].forEach(function (l) { w = Math.max(w, textWidth(l.text)); });
          blocks.push({ node: node, lines: pair[0], up: pair[1], w: w + 4, h: pair[0].length * LINE, box: null, anchor: 'middle' });
        });
      });
    });
    function choose(block) {
      var x = xs[block.node], y = ys[block.node], w = block.w, h = block.h, up = block.up;
      var near = R + 4, side = R + 5, dir = up ? -1 : 1;
      // y0 of a block whose near edge is `gap` away from the node's centre line
      function at(gap) { return up ? y - gap - h : y + gap; }
      var options = [
        ['middle', x - w / 2, at(near), 0],
        ['start', x + side, at(4), 0.5],
        ['end', x - side - w, at(4), 0.6],
        ['start', x + side + 2, y - h / 2, 1.2],
        ['end', x - side - 2 - w, y - h / 2, 1.3],
        ['middle', x - w / 2, at(near + LINE), 1.6],
        ['start', x + side, at(4 + LINE), 1.9],
        ['end', x - side - w, at(4 + LINE), 2],
        ['start', x + side + 2, y - h / 2 + dir * LINE, 2.3],
        ['end', x - side - 2 - w, y - h / 2 + dir * LINE, 2.4]
      ];
      var best = null;
      options.forEach(function (o) {
        var b = { x0: o[1], y0: o[2], x1: o[1] + w, y1: o[2] + h };
        var cost = o[3], q;
        segments.forEach(function (sg) { if (segmentHitsBox(sg[0], sg[1], sg[2], sg[3], b)) cost += 4; });
        blocks.forEach(function (other) { if (other !== block && other.box && boxesOverlap(b, other.box)) cost += 25; });
        for (q = 0; q < n; q++) {
          if (xs[q] > b.x0 - R && xs[q] < b.x1 + R && ys[q] > b.y0 - R && ys[q] < b.y1 + R) cost += 25;
        }
        // Sticking out at the side is cheap while the columns can still move
        // closer to make room, and expensive once they cannot.
        var out = Math.max(4 - b.x0, b.x1 - W + 4, 0);
        if (out > 0) cost += tight ? 8 + out / 4 : out / 12;
        if (!best || cost < best.cost) best = { cost: cost, box: b, anchor: o[0] };
      });
      block.box = best.box;
      block.anchor = best.anchor;
    }
    for (var round = 0; round < 3; round++) blocks.forEach(choose);

    var labels = [];
    blocks.forEach(function (block) {
      var b = block.box;
      var tx = block.anchor === 'middle' ? (b.x0 + b.x1) / 2 : block.anchor === 'start' ? b.x0 + 2 : b.x1 - 2;
      block.lines.forEach(function (l, i) {
        // Above a node the first name is the one nearest to it.
        var row = block.up ? block.lines.length - 1 - i : i;
        labels.push({ node: block.node, text: l.text, cls: l.cls, x: tx, y: b.y0 + (row + 1) * LINE - 4, anchor: block.anchor });
      });
    });

    // The drawing is as large as its nodes and names need.
    var box = { x0: 0, x1: W, y0: -R - 12, y1: (lay.levels.length - 1) * ROW + R + 12 };
    blocks.forEach(function (block) {
      box.x0 = Math.min(box.x0, block.box.x0 - 8); box.x1 = Math.max(box.x1, block.box.x1 + 8);
      box.y0 = Math.min(box.y0, block.box.y0 - 10); box.y1 = Math.max(box.y1, block.box.y1 + 10);
    });
    return { xs: xs, ys: ys, W: W, unit: unit, edges: edges, labels: labels, box: box };
  }

  function drawDiagram(res) {
    var mode = state.mode;
    var s = sides(mode);
    var lay = Core.layout(res);
    var n = res.nodes.length, k;

    // Names: the elements of the extent go under their node, those of the
    // intent over it (negated ones as "¬name").
    var below = [], above = [];
    for (k = 0; k < n; k++) { below.push([]); above.push([]); }
    res.objectNode.forEach(function (node, g) { below[node].push({ text: nameOf(s.ext[g]), cls: 'lat-lbl-ext' }); });
    res.attrNode.forEach(function (node, m) { above[node].push({ text: nameOf(s.intent[m]), cls: 'lat-lbl-pos' }); });
    res.negAttrNode.forEach(function (node, m) { above[node].push({ text: '¬' + nameOf(s.intent[m]), cls: 'lat-lbl-neg' }); });

    // Names that stick out at the sides get the room they need (the columns
    // move closer), as long as the columns can still shrink.
    var boxW = (diagramEl.clientWidth || 640) - 2;
    // The most room the sides can get before the drawing outgrows its box.
    var padMax = Math.max(44, (boxW - lay.span * COL_MIN) / 2);
    var pad = 44, geo = null;
    for (k = 0; k < 4; k++) {
      geo = geometry(res, lay, above, below, boxW, pad);
      var over = Math.max(-geo.box.x0, geo.box.x1 - geo.W);
      if (over <= 0 || pad >= padMax) break;
      pad = Math.min(pad + over, padMax);
    }
    var xs = geo.xs, ys = geo.ys;
    var width = geo.box.x1 - geo.box.x0, height = geo.box.y1 - geo.box.y0;

    // A drawing that is only a little too wide is scaled down to fit; a much
    // wider one keeps its size and scrolls sideways inside the box.
    var scale = width > boxW && width <= boxW * 1.18 ? boxW / width : 1;
    var svg = svgEl('svg', {
      width: Math.round(width * scale), height: Math.round(height * scale),
      viewBox: [geo.box.x0, geo.box.y0, width, height].map(function (v) { return v.toFixed(1); }).join(' '),
      role: 'group', 'aria-label': tr('diagram')
    });

    var edges = svgEl('g', {});
    geo.edges.forEach(function (e) {
      edges.appendChild(svgEl('path', {
        'class': 'lat-edge', d: e.d,
        'data-lo': String(res.nodes[e.c[0]].ext), 'data-up': String(res.nodes[e.c[1]].ext)
      }));
    });
    svg.appendChild(edges);

    res.nodes.forEach(function (node, i) {
      var txt = conceptText(node, mode);
      var x = xs[i].toFixed(1), y = ys[i].toFixed(1);
      var g = svgEl('g', { 'class': 'lat-node' + (isDiff(node) ? ' is-diff' : ''), 'data-ext': String(node.ext), tabindex: '0', role: 'button' });
      g.setAttribute('aria-label', txt.neg === null ? txt.ext + ' | ' + txt.pos : txt.ext + ' | ' + txt.pos + ' | ' + txt.neg);
      g.appendChild(svgEl('circle', { 'class': 'lat-hit', cx: x, cy: y, r: 16 }));
      g.appendChild(svgEl('circle', { 'class': 'lat-ring', cx: x, cy: y, r: R + 4.5 }));
      g.appendChild(svgEl('circle', { 'class': 'lat-dot', cx: x, cy: y, r: R }));
      // As in the textbooks: the upper half is filled where an attribute is
      // written at the node, the lower half where an object is.
      var left = (xs[i] - R).toFixed(1), right = (xs[i] + R).toFixed(1);
      if (above[i].length) g.appendChild(svgEl('path', { 'class': 'lat-half', d: 'M' + left + ' ' + y + 'A' + R + ' ' + R + ' 0 0 1 ' + right + ' ' + y + 'Z' }));
      if (below[i].length) g.appendChild(svgEl('path', { 'class': 'lat-half', d: 'M' + left + ' ' + y + 'A' + R + ' ' + R + ' 0 0 0 ' + right + ' ' + y + 'Z' }));
      geo.labels.forEach(function (l) {
        if (l.node !== i) return;
        var t = svgEl('text', { 'class': 'lat-lbl ' + l.cls, x: l.x.toFixed(1), y: l.y.toFixed(1), 'text-anchor': l.anchor });
        t.textContent = l.text;
        g.appendChild(t);
      });
      function choose(e) { if (e) e.stopPropagation(); select(state.selected === node.ext ? null : node.ext); }
      g.addEventListener('click', choose);
      g.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(); }
      });
      svg.appendChild(g);
    });

    svg.addEventListener('click', function () { select(null); });
    diagramEl.appendChild(svg);
  }

  // ---- Download the diagram ------------------------------------------------------------
  // A standalone SVG: the page's styles are written into the copy, since the
  // file will be opened without this page's stylesheet.
  function downloadSvg() {
    var svg = diagramEl.querySelector('svg');
    if (!svg) return;
    var copy = svg.cloneNode(true);
    copy.setAttribute('xmlns', SVG_NS);
    copy.removeAttribute('role');
    copy.removeAttribute('class');
    var from = svg.querySelectorAll('*'), to = copy.querySelectorAll('*');
    var props = ['fill', 'fill-opacity', 'stroke', 'stroke-width', 'stroke-opacity', 'stroke-dasharray', 'stroke-linejoin',
      'paint-order', 'opacity', 'font-family', 'font-size', 'font-style', 'font-weight'];
    for (var i = 0; i < from.length; i++) {
      var cs = getComputedStyle(from[i]), style = '';
      for (var p = 0; p < props.length; p++) style += props[p] + ':' + cs.getPropertyValue(props[p]) + ';';
      to[i].setAttribute('style', style);
      ['class', 'tabindex', 'role', 'aria-label', 'data-ext', 'data-lo', 'data-up'].forEach(function (a) { to[i].removeAttribute(a); });
    }
    copy.querySelectorAll('circle').forEach(function (c) { if (c.getAttribute('r') === '16') c.remove(); });
    var vb = svg.getAttribute('viewBox').split(' ');
    copy.insertBefore(svgEl('rect', { x: vb[0], y: vb[1], width: vb[2], height: vb[3], fill: getComputedStyle(document.body).backgroundColor }), copy.firstChild);
    var blob = new Blob(['<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(copy)], { type: 'image/svg+xml' });
    var a = el('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'concept-lattice.svg';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }

  function copyLink() {
    syncUrl();
    function done() { announce(tr('copied')); flash($('linkBtn')); }
    function fallback() {
      var ta = el('textarea');
      ta.value = location.href;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) {}
      ta.remove();
      if (ok) done(); else announce(tr('copyFail'));
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(location.href).then(done, fallback);
    else fallback();
  }

  // Swaps a button's label for its "done" text for a moment.
  function flash(btn) {
    btn.classList.add('is-done');
    setTimeout(function () { btn.classList.remove('is-done'); }, 1600);
  }

  // ---- Import ------------------------------------------------------------------------------
  var TRUE_CELL = /^(1|x|×|✓|✔|true|yes|y|t|\+|\*)$/i;

  function splitLine(line, delim) {
    var out = [], cur = '', quoted = false;
    for (var i = 0; i < line.length; i++) {
      var ch = line[i];
      if (quoted) {
        if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (ch === '"') quoted = false;
        else cur += ch;
      } else if (ch === '"') quoted = true;
      else if (ch === delim) { out.push(cur); cur = ''; }
      else cur += ch;
    }
    out.push(cur);
    return out;
  }

  // Burmeister format: "B", a name line, the two counts, the object names, the
  // attribute names, then one line of X and . per object.
  function parseCxt(lines) {
    var i = /^\d+$/.test((lines[1] || '').trim()) ? 1 : 2;
    var nG = parseInt(lines[i], 10), nM = parseInt(lines[i + 1], 10);
    if (!(nG > 0) || !(nM > 0)) return { error: 'impShape' };
    i += 2;
    while (i < lines.length && !lines[i].trim()) i++;
    var objects = lines.slice(i, i + nG), attrs = lines.slice(i + nG, i + nG + nM);
    var rows = lines.slice(i + nG + nM, i + nG + nM + nG);
    if (objects.length !== nG || attrs.length !== nM || rows.length !== nG) return { error: 'impShape' };
    return {
      objects: objects, attrs: attrs,
      inc: rows.map(function (row) {
        var cells = row.replace(/\s/g, ''), out = [];
        for (var j = 0; j < nM; j++) out.push(/[Xx×1]/.test(cells[j] || ''));
        return out;
      })
    };
  }

  // A table with a header row: tab-, semicolon- or comma-separated.
  function parseDelimited(lines) {
    lines = lines.filter(function (l) { return l.trim(); });
    var delim = ['\t', ';', ','].sort(function (a, b) { return lines[0].split(b).length - lines[0].split(a).length; })[0];
    var rows = lines.map(function (l) { return splitLine(l, delim); });
    var attrs = rows[0].slice(1);
    if (!attrs.length || rows.length < 2) return { error: 'impShape' };
    return {
      objects: rows.slice(1).map(function (r) { return r[0]; }),
      attrs: attrs,
      inc: rows.slice(1).map(function (r) {
        return attrs.map(function (a, j) { return TRUE_CELL.test((r[j + 1] || '').trim()); });
      })
    };
  }

  function parseTable(text) {
    var lines = text.replace(/^﻿/, '').replace(/\r\n?/g, '\n').split('\n');
    while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
    while (lines.length && !lines[0].trim()) lines.shift();
    if (!lines.length) return { error: 'impEmpty' };
    return /^B\s*$/.test(lines[0]) ? parseCxt(lines) : parseDelimited(lines);
  }

  function importTable() {
    var t = parseTable(importText.value);
    if (t.error) { importMsg.textContent = tr(t.error); return; }
    if (t.objects.length > MAX_OBJECTS || t.attrs.length > MAX_ATTRS) {
      importMsg.textContent = tr('impTooBig', t.objects.length, t.attrs.length, MAX_OBJECTS, MAX_ATTRS);
      return;
    }
    var clean = function (list, key) {
      return list.map(function (n, i) {
        n = String(n).trim().slice(0, NAME_MAX) || tr(key, i + 1);
        return { en: n, zh: n, de: n };
      });
    };
    var objects = clean(t.objects, 'newObj'), attrs = clean(t.attrs, 'newAttr');
    // The reference is kept when the new table has the same objects and attributes.
    var sameNames = function (a, b) { return a.length === b.length && a.every(function (x, i) { return nameOf(x) === nameOf(b[i]); }); };
    var keepRef = !!state.ref && sameNames(objects, state.objects) && sameNames(attrs, state.attrs);
    var dropped = !!state.ref && !keepRef;
    checkpoint();
    if (!keepRef) {
      state.objects = objects;
      state.attrs = attrs;
      state.base = null;
      state.ref = null;
      state.view = 'cur';
    }
    state.inc = t.inc;
    state.selected = null;
    renderAll();
    importMsg.textContent = tr('impOk', objects.length, attrs.length) + (dropped ? tr('impRefDropped') : '');
  }

  // ---- Wiring ------------------------------------------------------------------------------
  presetSelect.addEventListener('change', function () {
    if (!PRESETS[presetSelect.value]) return;
    checkpoint();
    loadPreset(presetSelect.value);
    renderAll();
  });

  undoBtn.addEventListener('click', undo);
  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === 'z' && !/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) {
      e.preventDefault();
      undo();
    }
    if (e.key === 'Escape' && editor) closeEditor();
  });

  $('clearBtn').addEventListener('click', function () {
    checkpoint();
    state.inc = state.inc.map(function (row) { return row.map(function () { return false; }); });
    state.selected = null;
    renderAll();
  });

  importBtn.addEventListener('click', function () {
    var open = importBox.hidden;
    importBox.hidden = !open;
    importBtn.setAttribute('aria-expanded', String(open));
    if (open) importText.focus();
  });
  $('importLoad').addEventListener('click', importTable);
  $('importFile').addEventListener('change', function (e) {
    var file = e.target.files && e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () { importText.value = String(reader.result); importTable(); };
    reader.readAsText(file);
    e.target.value = '';
  });

  $('refSet').addEventListener('click', function () {
    checkpoint();
    state.ref = state.inc.map(function (row) { return row.slice(); });
    state.view = 'cur';
    renderAll();
  });
  $('refUpdate').addEventListener('click', function () {
    checkpoint();
    state.ref = state.inc.map(function (row) { return row.slice(); });
    renderAll();
  });
  $('refClear').addEventListener('click', function () {
    checkpoint();
    state.ref = null;
    state.view = 'cur';
    renderAll();
  });

  document.querySelectorAll('.lat-mode[data-mode]').forEach(function (b) {
    b.addEventListener('click', function () {
      state.mode = b.dataset.mode;
      state.selected = null;
      renderOutput();
      syncUrl();
    });
  });
  document.querySelectorAll('.lat-mode[data-view]').forEach(function (b) {
    b.addEventListener('click', function () {
      state.view = b.dataset.view;
      state.selected = null;
      renderOutput();
      syncUrl();
    });
  });

  $('svgBtn').addEventListener('click', downloadSvg);
  $('linkBtn').addEventListener('click', copyLink);

  function renderAll() {
    renderPresetOptions();
    renderTable();
    renderOutput();
    syncUrl();
  }

  if (!decodeState(location.hash)) loadPreset(DEFAULT_PRESET);
  undoBtn.disabled = true;
  renderAll();

  window.addEventListener('hashchange', function () {
    var hash = location.hash.replace(/^#/, '');
    if (hash === lastHash) return;
    if (!decodeState(hash)) loadPreset(DEFAULT_PRESET);
    renderAll();
  });

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
  // Label widths are measured, so draw again once the web font has arrived.
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { renderOutput(); });
})();
