// The paper tool's page. Talks to tools/papers/server.mjs; the server does all
// reading and writing of reading.html, git and the network calls.
(function () {
  'use strict';

  var TOKEN = document.querySelector('meta[name="api-token"]').content;
  var LANG_NAME = { en: '英文', zh: '中文', de: '德文' };
  var FLAGS = { pending: '未发布', nonote: '没有笔记', notrans: '缺译文' };

  var S = null;                                   // state from the server
  var view = { q: '', project: 'all', flag: null };
  var cur = { index: null, original: null };      // index null: a new paper
  var sel = { projects: [], groups: [] };         // project and category choices in the form
  var lastLookup = null;                          // the candidate last filled in

  function $(id) { return document.getElementById(id); }
  function F(name) { return $('f-' + name); }

  function h(tag, props) {
    var node = document.createElement(tag);
    if (props) Object.keys(props).forEach(function (k) {
      if (k === 'text') node.textContent = props[k];
      else if (k === 'class') node.className = props[k];
      else if (k.slice(0, 2) === 'on') node.addEventListener(k.slice(2), props[k]);
      else node.setAttribute(k, props[k]);
    });
    for (var i = 2; i < arguments.length; i++) {
      var kid = arguments[i];
      if (kid === null || kid === undefined || kid === false) continue;
      node.appendChild(typeof kid === 'string' ? document.createTextNode(kid) : kid);
    }
    return node;
  }

  function api(name, data) {
    return fetch('/api/' + name, {
      method: data === undefined ? 'GET' : 'POST',
      headers: { 'X-Token': TOKEN, 'Content-Type': 'application/json' },
      body: data === undefined ? undefined : JSON.stringify(data)
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (body) {
        if (!res.ok) {
          var err = new Error(body.error || ('请求失败（' + res.status + '）'));
          err.status = res.status;
          throw err;
        }
        return body;
      });
    }, function () {
      throw new Error('连不上本地服务：终端里的论文库是不是已经关掉了？');
    });
  }

  // ---- Helpers ----------------------------------------------------------------

  function norm(s) { return String(s || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim(); }
  function projectsOf(p) { return Array.isArray(p.project) ? p.project.slice() : (p.project ? [p.project] : []); }
  function hasNote(p) { return !!(p.note_en || p.note_zh || p.note_de); }
  function missingTranslation(p) { return !!p.note_en && (!p.note_zh || !p.note_de); }
  function project(id) { return S.projects.filter(function (p) { return p.id === id; })[0]; }
  function groupsOf(id) { var p = project(id); return (p && p.groups) || []; }

  function surname(name) { var parts = name.trim().split(/\s+/); return parts[parts.length - 1]; }
  function shortAuthors(a) {
    var list = String(a || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    if (!list.length) return '';
    if (list.length > 2) return surname(list[0]) + ' et al.';
    return list.map(surname).join(', ');
  }

  var toastTimer;
  function toast(msg, isError) {
    var t = $('toast');
    t.textContent = msg;
    t.className = 'toast show' + (isError ? ' error' : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.className = 'toast' + (isError ? ' error' : ''); }, isError ? 6000 : 2200);
  }

  function autosize(ta) {
    ta.style.height = 'auto';
    ta.style.height = ta.scrollHeight + 2 + 'px';
  }

  function confirmBox(title, text, okLabel, danger) {
    var d = $('confirmDialog');
    $('confirmTitle').textContent = title;
    $('confirmText').textContent = text;
    $('confirmOk').textContent = okLabel;
    $('confirmOk').className = 'btn primary' + (danger ? ' danger-fill' : '');
    d.returnValue = '';
    d.showModal();
    return new Promise(function (resolve) {
      d.addEventListener('close', function once() {
        d.removeEventListener('close', once);
        resolve(d.returnValue === 'ok');
      });
    });
  }

  // ---- Filters and list ---------------------------------------------------------

  function matches(p, i, ignore) {
    if (ignore !== 'project' && view.project !== 'all' && projectsOf(p).indexOf(view.project) < 0) return false;
    if (ignore !== 'flag' && view.flag === 'pending' && !S.status[i]) return false;
    if (ignore !== 'flag' && view.flag === 'nonote' && hasNote(p)) return false;
    if (ignore !== 'flag' && view.flag === 'notrans' && !missingTranslation(p)) return false;
    if (view.q) {
      var hay = norm([p.title_en, p.title_zh, p.authors, p.venue, p.year, p.link].join(' '));
      var words = norm(view.q).split(' ');
      for (var w = 0; w < words.length; w++) if (hay.indexOf(words[w]) < 0) return false;
    }
    return true;
  }

  function renderFilters() {
    var wrap = $('projectFilter');
    wrap.textContent = '';
    var chips = [{ id: 'all', label: '全部' }].concat(S.projects.map(function (p) { return { id: p.id, label: p.label_zh || p.label_en }; }));
    chips.forEach(function (c) {
      var n = S.papers.filter(function (p, i) {
        return (c.id === 'all' || projectsOf(p).indexOf(c.id) >= 0) && matches(p, i, 'project');
      }).length;
      wrap.appendChild(h('button', {
        class: 'chip', type: 'button', 'aria-pressed': String(view.project === c.id),
        onclick: function () { view.project = c.id; renderFilters(); renderList(); }
      }, c.label, h('span', { class: 'n', text: String(n) })));
    });

    var flags = $('flagFilter');
    flags.textContent = '';
    Object.keys(FLAGS).forEach(function (f) {
      var n = S.papers.filter(function (p, i) {
        var hit = f === 'pending' ? !!S.status[i] : f === 'nonote' ? !hasNote(p) : missingTranslation(p);
        return hit && matches(p, i, 'flag');
      }).length;
      if (!n && view.flag !== f) return;
      flags.appendChild(h('button', {
        class: 'flag', type: 'button', 'aria-pressed': String(view.flag === f),
        onclick: function () { view.flag = view.flag === f ? null : f; renderFilters(); renderList(); }
      }, FLAGS[f] + ' ' + n));
    });
  }

  function renderList() {
    var list = $('list');
    var scroll = list.scrollTop;
    list.textContent = '';
    var shown = 0;
    // With one project chosen: one section. Otherwise one section per project,
    // each paper under the project it lists first. File order within each.
    var sections = view.project === 'all' ? S.projects : [project(view.project)];
    sections.forEach(function (proj) {
      var items = [];
      S.papers.forEach(function (p, i) {
        if ((view.project !== 'all' || projectsOf(p)[0] === proj.id) && matches(p, i)) items.push(i);
      });
      if (!items.length) return;
      shown += items.length;
      list.appendChild(h('div', { class: 'group-head' }, h('span', { text: proj.label_zh || proj.label_en }), h('span', { class: 'n', text: String(items.length) })));
      items.forEach(function (i) { list.appendChild(itemNode(i)); });
    });
    if (!shown) list.appendChild(h('p', { class: 'list-empty', text: '没有符合条件的论文。' }));
    $('resultCount').textContent = shown === S.papers.length ? '共 ' + shown + ' 篇' : shown + ' / ' + S.papers.length + ' 篇';
    list.scrollTop = scroll;
  }

  function itemNode(i) {
    var p = S.papers[i];
    var st = S.status[i];
    var meta = [shortAuthors(p.authors), p.venue, p.year].filter(Boolean).join(' · ');
    return h('button', {
      class: 'item', type: 'button', 'data-index': String(i), 'aria-selected': String(cur.index === i),
      onclick: function () { open(i); }
    },
      h('div', { class: 'item-title', text: p.title_en }),
      h('div', { class: 'item-meta' },
        st ? h('span', { class: 'item-flag', text: st === 'new' ? '新增' : '已修改' }) : null,
        st ? ' · ' : null,
        meta || '—'));
  }

  function markSelected() {
    var items = $('list').querySelectorAll('.item');
    for (var k = 0; k < items.length; k++) items[k].setAttribute('aria-selected', String(+items[k].dataset.index === cur.index));
  }

  function scrollToItem(i) {
    var node = $('list').querySelector('.item[data-index="' + i + '"]');
    if (node) node.scrollIntoView({ block: 'nearest' });
  }

  // ---- Bar --------------------------------------------------------------------

  function pendingCount() {
    return S.status.filter(Boolean).length + S.removed.length;
  }

  function renderBar() {
    var n = pendingCount();
    var sync = $('sync');
    if (n) { sync.textContent = n + ' 处修改未发布'; sync.className = 'sync pending'; }
    else if (S.git.ahead) { sync.textContent = S.git.ahead + ' 个提交还没推送'; sync.className = 'sync pending'; }
    else if (S.git.dirty) { sync.textContent = 'reading.html 有未发布的改动'; sync.className = 'sync pending'; }
    else { sync.textContent = '网站已是最新'; sync.className = 'sync'; }
    $('publish').disabled = !(n || S.git.ahead || S.git.dirty);
  }

  // ---- Form -------------------------------------------------------------------

  var TEXT_FIELDS = ['title_en', 'title_zh', 'authors', 'year', 'venue', 'link', 'note_en', 'note_zh', 'note_de'];

  function allGroupIds(projectIds) {
    var ids = [];
    projectIds.forEach(function (id) { groupsOf(id).forEach(function (g) { if (ids.indexOf(g.id) < 0) ids.push(g.id); }); });
    return ids;
  }

  function fill(p) {
    p = p || {};
    TEXT_FIELDS.forEach(function (k) { F(k).value = p[k] === undefined || p[k] === null ? '' : String(p[k]); });
    sel.projects = projectsOf(p);
    if (!sel.projects.length) sel.projects = [defaultProject()];
    var gids = allGroupIds(sel.projects);
    var topics = p.topics || [];
    sel.groups = topics.filter(function (t) { return gids.indexOf(t) >= 0; });
    F('tags').value = topics.filter(function (t) { return gids.indexOf(t) < 0; }).join(', ');
    lastLookup = null;
    delete $('zhTitleField').dataset.open;
    $('candidates').textContent = '';
    $('lookupInput').value = '';
    $('lookupHint').textContent = '自动填写标题、作者、年份、期刊和链接，填完还可以改。';
    renderChoices();
    refreshForm();
    document.querySelectorAll('textarea.grow').forEach(autosize);
  }

  function defaultProject() {
    if (view.project !== 'all') return view.project;
    var last = localStorage.getItem('papers-tool-project');
    return project(last) ? last : S.projects[0].id;
  }

  function renderChoices() {
    var pw = F('projects');
    pw.textContent = '';
    S.projects.forEach(function (proj) {
      var on = sel.projects.indexOf(proj.id) >= 0;
      pw.appendChild(h('button', {
        class: 'chip', type: 'button', 'aria-pressed': String(on),
        onclick: function () {
          if (on && sel.projects.length === 1) return;   // at least one
          sel.projects = on ? sel.projects.filter(function (x) { return x !== proj.id; }) : sel.projects.concat(proj.id);
          var gids = allGroupIds(sel.projects);
          sel.groups = sel.groups.filter(function (g) { return gids.indexOf(g) >= 0; });
          renderChoices();
          refreshForm();
        }
      }, proj.label_zh || proj.label_en));
    });

    var gw = F('groups');
    gw.textContent = '';
    var withGroups = sel.projects.filter(function (id) { return groupsOf(id).length; });
    $('groupsField').hidden = !withGroups.length;
    // With several projects, a grid: project names in one column, their
    // categories beside them, so the rows of chips line up.
    gw.className = withGroups.length > 1 ? 'group-grid' : '';
    withGroups.forEach(function (id) {
      if (withGroups.length > 1) gw.appendChild(h('span', { class: 'group-row-label', text: project(id).label_zh || project(id).label_en }));
      var row = h('div', { class: 'group-row' });
      groupsOf(id).forEach(function (g) {
        var on = sel.groups.indexOf(g.id) >= 0;
        row.appendChild(h('button', {
          class: 'chip', type: 'button', 'aria-pressed': String(on), title: g.id,
          onclick: function () {
            sel.groups = on ? sel.groups.filter(function (x) { return x !== g.id; }) : sel.groups.concat(g.id);
            renderChoices();
            refreshForm();
          }
        }, g.label_zh || g.label_en));
      });
      gw.appendChild(row);
    });
    renderTagSuggestions();
  }

  // The free-form tags used most often in the chosen projects, as one-click suggestions.
  function renderTagSuggestions() {
    var box = $('tagSuggest');
    box.textContent = '';
    var gids = allGroupIds(S.projects.map(function (p) { return p.id; }));
    var have = readTags();
    var counts = {};
    S.papers.forEach(function (p) {
      if (!projectsOf(p).some(function (id) { return sel.projects.indexOf(id) >= 0; })) return;
      (p.topics || []).forEach(function (t) { if (gids.indexOf(t) < 0 && have.indexOf(t) < 0) counts[t] = (counts[t] || 0) + 1; });
    });
    var top = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a] || (a < b ? -1 : 1); }).slice(0, 8);
    if (!top.length) return;
    box.appendChild(h('span', { text: '常用：' }));
    top.forEach(function (t) {
      box.appendChild(h('button', {
        class: 'link-btn', type: 'button', text: t,
        onclick: function () {
          var tags = readTags().concat(t);
          F('tags').value = tags.join(', ');
          renderTagSuggestions();
          refreshForm();
        }
      }));
    });
  }

  function readTags() {
    return F('tags').value.split(/[,，;；]/).map(function (s) { return s.trim().toLowerCase().replace(/\s+/g, '-'); }).filter(Boolean);
  }

  // The paper as the form describes it. The order of topics and projects that
  // were already there is kept, so an untouched entry reads back unchanged.
  function readForm() {
    var orig = cur.original || {};
    var p = {};
    Object.keys(orig).forEach(function (k) { p[k] = orig[k]; });
    TEXT_FIELDS.forEach(function (k) { p[k] = F(k).value; });
    var y = p.year.trim();
    p.year = /^\d{4}$/.test(y) ? +y : y;

    var origProjects = projectsOf(orig);
    var projects = origProjects.filter(function (x) { return sel.projects.indexOf(x) >= 0; })
      .concat(sel.projects.filter(function (x) { return origProjects.indexOf(x) < 0; }));
    p.project = projects.length === 1 ? projects[0] : projects;

    var gids = allGroupIds(projects);
    var chosen = sel.groups.filter(function (g) { return gids.indexOf(g) >= 0; }).concat(readTags());
    var origTopics = orig.topics || [];
    var topics = origTopics.filter(function (t) { return chosen.indexOf(t) >= 0; })
      .concat(chosen.filter(function (t) { return origTopics.indexOf(t) < 0; }));
    p.topics = topics.filter(function (t, i) { return topics.indexOf(t) === i; });
    return p;
  }

  function comparable(p) {
    var out = {};
    Object.keys(p).sort().forEach(function (k) {
      var v = p[k];
      if (typeof v === 'string') v = v.replace(/\s+/g, ' ').trim();
      if (v === '' || (Array.isArray(v) && !v.length && k !== 'topics')) return;
      if (k === 'year' && /^\d{4}$/.test(String(v))) v = +v;
      out[k] = v;
    });
    return JSON.stringify(out);
  }

  function isDirty() {
    if (!S) return false;
    if (cur.index === null) {
      return ['title_en', 'title_zh', 'authors', 'year', 'venue', 'link', 'note_en', 'note_zh', 'note_de']
        .some(function (k) { return F(k).value.trim() !== ''; });
    }
    return comparable(readForm()) !== comparable(cur.original);
  }

  function refreshForm() {
    var isNew = cur.index === null;
    var st = isNew ? '' : S.status[cur.index];
    var t = F('title_en').value.trim();
    // A new, still empty form is headed just "新增论文"; once there is a title,
    // the title is the heading and the line above says what is going on.
    $('eyebrow').textContent = isNew ? (t ? '新增论文' : '') : '编辑论文' + (st === 'new' ? ' · 新增，还没发布' : st === 'changed' ? ' · 已修改，还没发布' : '');
    $('eyebrow').hidden = !$('eyebrow').textContent;
    $('headTitle').textContent = t || (isNew ? '新增论文' : '（没有标题）');
    $('headTitle').className = 'head-title' + (t || isNew ? '' : ' placeholder');

    $('lookup').hidden = !isNew && !$('lookup').dataset.open;
    $('lookupOpen').hidden = isNew || !!$('lookup').dataset.open;

    var link = F('link').value.trim();
    $('openLink').hidden = !/^https?:\/\/\S+$/.test(link);
    if (!$('openLink').hidden) $('openLink').href = link;

    var zh = !!F('title_zh').value.trim() || !!$('zhTitleField').dataset.open;
    $('zhTitleField').hidden = !zh;
    $('addZhTitle').hidden = zh;

    renderDuplicate();
    renderTranslateButtons();
    renderIssues();

    var dirty = isDirty();
    $('dirty').textContent = dirty ? '有未保存的修改' : '';
    $('save').disabled = !dirty;
    $('revert').hidden = !dirty;
    $('delete').hidden = isNew;
  }

  function findDuplicate() {
    var t = norm(F('title_en').value);
    var l = F('link').value.trim();
    for (var i = 0; i < S.papers.length; i++) {
      if (i === cur.index) continue;
      var p = S.papers[i];
      if ((t && norm(p.title_en) === t) || (l && p.link === l)) return i;
    }
    return -1;
  }

  function renderDuplicate() {
    var box = $('dup');
    var i = findDuplicate();
    box.textContent = '';
    box.hidden = i < 0;
    if (i < 0) return;
    var p = S.papers[i];
    box.appendChild(document.createTextNode('库里已经有这篇：' + [shortAuthors(p.authors), p.year].filter(Boolean).join('，') + '。 '));
    box.appendChild(h('button', { class: 'link-btn', type: 'button', text: '打开那篇', onclick: function () { open(i); } }));
  }

  function renderIssues() {
    var list = $('issues');
    list.textContent = '';
    var add = function (text) { list.appendChild(h('li', { text: text })); };
    var withGroups = sel.projects.filter(function (id) { return groupsOf(id).length; });
    var gids = allGroupIds(withGroups);
    if (withGroups.length && !sel.groups.some(function (g) { return gids.indexOf(g) >= 0; })) {
      add('还没选分类：这篇会排在列表最后的“其他”里。');
    }
    var en = F('note_en').value.trim(), zh = F('note_zh').value.trim(), de = F('note_de').value.trim();
    if (en && (!zh || !de)) {
      var gaps = [!zh && '中文', !de && '德文'].filter(Boolean);
      add(gaps.join('、') + '笔记还空着：网页切到' + (gaps.length > 1 ? '这两种语言' : gaps[0]) + '时会显示英文笔记。');
    } else if (!en && (zh || de)) {
      add('英文笔记还空着：英文页面上这篇不会显示笔记。');
    }
  }

  // ---- Translation --------------------------------------------------------------

  function sourceFor(to) {
    var order = to === 'en' ? ['zh', 'de'] : ['en', to === 'zh' ? 'de' : 'zh'];
    for (var k = 0; k < order.length; k++) if (F('note_' + order[k]).value.trim()) return order[k];
    return null;
  }

  function renderTranslateButtons() {
    document.querySelectorAll('[data-translate]').forEach(function (b) {
      if (b.dataset.busy) return;
      var to = b.dataset.translate;
      var from = sourceFor(to);
      // English is the source language; offer English only when it is the one missing.
      var show = S.llm.ready && !!from && (to !== 'en' || !F('note_en').value.trim());
      b.hidden = !show;
      if (show) b.textContent = '从' + LANG_NAME[from] + (F('note_' + to).value.trim() ? '重新翻译' : '翻译');
    });
    // Google Translate with the English note filled in; paste the result back.
    var en = F('note_en').value.trim();
    document.querySelectorAll('[data-google]').forEach(function (a) {
      a.hidden = !en;
      if (en) a.href = 'https://translate.google.com/?sl=en&tl=' + (a.dataset.google === 'zh' ? 'zh-CN' : 'de') + '&op=translate&text=' + encodeURIComponent(en);
    });
    $('mtHint').textContent = S.llm.ready
      ? '“从英文翻译”用的是免费模型 ' + S.llm.model + '，只能当初稿，⌘Z 可以撤回；也可以点“Google 翻译”，把译文贴回来。'
      : '点“Google 翻译”，把译文贴回来。（要用模型翻译，在 ' + S.llm.configFile + ' 里写上 LLM_API_KEY。）';
  }

  function translateInto(to, button) {
    var from = sourceFor(to);
    if (!from) return;
    button.dataset.busy = '1';
    button.disabled = true;
    button.textContent = '翻译中…';
    var target = F('note_' + to);
    api('translate', { text: F('note_' + from).value, from: from, to: to, project: sel.projects[0], authors: F('authors').value }).then(function (res) {
      if (res.model !== S.llm.model) toast('主模型限流，这次用 ' + res.model + ' 翻译的');
      // Replace through the editing commands so that ⌘Z brings the old text back.
      target.focus();
      target.select();
      if (!document.execCommand('insertText', false, res.text)) target.value = res.text;
      autosize(target);
    }).catch(function (err) {
      toast(err.message, true);
    }).then(function () {
      delete button.dataset.busy;
      button.disabled = false;
      refreshForm();
    });
  }

  // ---- Lookup -----------------------------------------------------------------

  function doLookup() {
    var q = $('lookupInput').value.trim();
    if (!q) { $('lookupInput').focus(); return; }
    var btn = $('lookupBtn');
    btn.disabled = true;
    btn.textContent = '查找中…';
    $('candidates').textContent = '';
    api('lookup', { q: q }).then(function (res) {
      if (res.results.length === 1) useCandidate(res.results[0]);
      else showCandidates(res.results);
    }).catch(function (err) {
      $('lookupHint').textContent = err.message;
    }).then(function () {
      btn.disabled = false;
      btn.textContent = '查找';
    });
  }

  function inLibrary(c) {
    var t = norm(c.title_en);
    for (var i = 0; i < S.papers.length; i++) if (norm(S.papers[i].title_en) === t || (c.link && S.papers[i].link === c.link)) return i;
    return -1;
  }

  function showCandidates(list) {
    $('lookupHint').textContent = '找到 ' + list.length + ' 篇，点一下填入：';
    var box = $('candidates');
    box.textContent = '';
    list.forEach(function (c) {
      var have = inLibrary(c) >= 0;
      box.appendChild(h('button', { class: 'candidate', type: 'button', onclick: function () { useCandidate(c); } },
        h('div', { class: 'candidate-title', text: c.title_en }),
        h('div', { class: 'candidate-meta' },
          have ? h('span', { class: 'have', text: '已在库里 · ' }) : null,
          [shortAuthors(c.authors), c.venue, c.year, c.source].filter(Boolean).join(' · '))));
    });
  }

  function useCandidate(c) {
    ['title_en', 'authors', 'year', 'venue', 'link'].forEach(function (k) {
      if (c[k] !== undefined && c[k] !== '') F(k).value = String(c[k]);
    });
    lastLookup = c;
    $('candidates').textContent = '';
    $('lookupHint').textContent = '已从 ' + c.source + ' 填入' + (c.note ? '（' + c.note + '）' : '') + '。请核对一下。';
    document.querySelectorAll('textarea.grow').forEach(autosize);
    refreshForm();
  }

  // ---- Opening, saving, deleting --------------------------------------------------

  function leaveOk() {
    if (!isDirty()) return Promise.resolve(true);
    return confirmBox('放弃未保存的修改？', '这篇论文还有没保存的修改，离开后就没有了。', '放弃修改', true);
  }

  function open(i) {
    if (i === cur.index) return;
    leaveOk().then(function (ok) {
      if (!ok) return;
      cur = { index: i, original: S.papers[i] };
      delete $('lookup').dataset.open;
      fill(cur.original);
      markSelected();
      $('editorScroll').scrollTop = 0;
    });
  }

  function newPaper(force) {
    var go = function () {
      cur = { index: null, original: null };
      delete $('lookup').dataset.open;
      fill(null);
      markSelected();
      $('editorScroll').scrollTop = 0;
      $('lookupInput').focus();
    };
    if (force) return go();
    leaveOk().then(function (ok) { if (ok) go(); });
  }

  function setState(next) {
    S = next;
    renderBar();
    renderFilters();
    renderList();
    fillDatalist();
  }

  function save() {
    if ($('save').disabled) return;
    var wasNew = cur.index === null;
    var paper = readForm();
    $('save').disabled = true;
    api('save', { index: cur.index, original: cur.original, paper: paper }).then(function (res) {
      localStorage.setItem('papers-tool-project', projectsOf(paper)[0]);
      setState(res.state);
      cur = { index: res.index, original: S.papers[res.index] };
      fill(cur.original);
      markSelected();
      scrollToItem(res.index);
      toast(wasNew ? '已添加到 reading.html' : '已保存');
    }).catch(function (err) {
      if (err.status === 409) reload(true);
      toast(err.message, true);
      refreshForm();
    });
  }

  function remove() {
    if (cur.index === null) return;
    var p = cur.original;
    confirmBox('删除这篇论文？', p.title_en, '删除', true).then(function (ok) {
      if (!ok) return;
      api('delete', { index: cur.index, original: cur.original }).then(function (res) {
        setState(res.state);
        newPaper(true);
        toast('已删除');
      }).catch(function (err) {
        if (err.status === 409) reload(true);
        toast(err.message, true);
      });
    });
  }

  // Reloads the state from disk. When the open entry changed elsewhere, finds
  // it again by its title; unsaved edits in the form are kept.
  function reload(keepForm) {
    return api('state').then(function (next) {
      var dirty = isDirty();
      var before = cur.original;
      setState(next);
      if (cur.index === null) { refreshForm(); return; }
      var i = S.papers.findIndex(function (p) { return comparable(p) === comparable(before); });
      if (i < 0) i = S.papers.findIndex(function (p) { return norm(p.title_en) === norm(before.title_en); });
      if (i < 0) {
        if (!dirty) newPaper(true);
        else { cur = { index: null, original: null }; refreshForm(); }
        return;
      }
      cur = { index: i, original: S.papers[i] };
      if (!dirty && !keepForm) fill(cur.original);
      else refreshForm();
      markSelected();
    }).catch(function (err) { toast(err.message, true); });
  }

  function fillDatalist() {
    var venues = {};
    S.papers.forEach(function (p) { if (p.venue) venues[p.venue] = (venues[p.venue] || 0) + 1; });
    var dl = $('venues');
    dl.textContent = '';
    Object.keys(venues).sort(function (a, b) { return venues[b] - venues[a]; }).forEach(function (v) { dl.appendChild(h('option', { value: v })); });
  }

  // ---- Publishing -----------------------------------------------------------------

  function commitMessage(a, c, d) {
    var n = function (k) { return k + ' paper' + (k === 1 ? '' : 's'); };
    var parts = [];
    if (a) parts.push('add ' + n(a));
    if (c) parts.push('update ' + (a ? c : n(c)));
    if (d) parts.push('remove ' + (a || c ? d : n(d)));
    if (!parts.length) return 'Update Notes';
    var s = parts.length > 1 ? parts.slice(0, -1).join(', ') + ' and ' + parts[parts.length - 1] : parts[0];
    s = s.charAt(0).toUpperCase() + s.slice(1);
    return s + (a && !c && !d ? ' to Notes' : d && !a && !c ? ' from Notes' : ' in Notes');
  }

  function openPublish() {
    if (isDirty()) { toast('这篇还有没保存的修改：先保存或放弃，再发布。', true); return; }
    var added = [], changed = [];
    S.status.forEach(function (st, i) { if (st === 'new') added.push(i); else if (st === 'changed') changed.push(i); });
    var removed = S.removed;

    var parts = [];
    if (added.length) parts.push('新增 ' + added.length + ' 篇');
    if (changed.length) parts.push('修改 ' + changed.length + ' 篇');
    if (removed.length) parts.push('删除 ' + removed.length + ' 篇');
    $('publishSummary').textContent = parts.length
      ? parts.join('，') + '。会提交 reading.html，并推送到 GitHub。'
      : (S.git.dirty ? 'reading.html 有改动（不涉及论文条目），会提交并推送到 GitHub。' : '没有新的修改，只推送已经提交的内容。');

    var ul = $('changeList');
    ul.textContent = '';
    var row = function (kind, cls, title) { ul.appendChild(h('li', null, h('span', { class: 'change-kind' + (cls ? ' ' + cls : ''), text: kind }), h('span', { text: title }))); };
    added.forEach(function (i) { row('新增', '', S.papers[i].title_en); });
    changed.forEach(function (i) { row('修改', '', S.papers[i].title_en); });
    removed.forEach(function (t) { row('删除', 'removed', t); });
    ul.hidden = !ul.childNodes.length;

    $('commitMsg').value = commitMessage(added.length, changed.length, removed.length);
    var notes = [];
    if (S.git.ahead) notes.push('另有 ' + S.git.ahead + ' 个已经提交、还没推送的提交，会一起推送。');
    if (S.git.others.length) notes.push('其他有改动的文件（' + S.git.others.slice(0, 3).join('、') + (S.git.others.length > 3 ? ' 等 ' + S.git.others.length + ' 个' : '') + '）不在这次发布里。');
    notes.push('网站一般一两分钟后更新。');
    $('publishNote').textContent = notes.join(' ');
    $('publishError').hidden = true;
    $('publishGo').disabled = false;
    $('publishGo').textContent = '提交并推送';
    $('publishCancel').textContent = '取消';
    $('publishDialog').showModal();
  }

  function doPublish() {
    var btn = $('publishGo');
    if (btn.dataset.done) { $('publishDialog').close(); return; }
    btn.disabled = true;
    btn.textContent = '正在推送…';
    $('publishError').hidden = true;
    api('publish', { message: $('commitMsg').value }).then(function (res) {
      setState(res.state);
      refreshForm();
      $('publishSummary').textContent = res.pushed ? '已推送到 GitHub。' : '没有需要推送的内容。';
      $('changeList').hidden = true;
      $('publishNote').textContent = '';
      if (res.pushed && S.site) {
        $('publishNote').appendChild(document.createTextNode('网站一般一两分钟后更新：'));
        $('publishNote').appendChild(h('a', { href: S.site, target: '_blank', rel: 'noopener', text: S.site.replace(/^https:\/\//, '') }));
      }
      btn.disabled = false;
      btn.textContent = '完成';
      btn.dataset.done = '1';
      $('publishCancel').hidden = true;
    }).catch(function (err) {
      $('publishError').textContent = err.message;
      $('publishError').hidden = false;
      btn.disabled = false;
      btn.textContent = '再试一次';
      reload(true);
    });
  }

  // ---- Wiring -----------------------------------------------------------------------

  function wire() {
    $('q').addEventListener('input', function () { view.q = this.value; renderFilters(); renderList(); });
    $('q').addEventListener('keydown', function (e) { if (e.key === 'Escape') { this.value = ''; view.q = ''; renderFilters(); renderList(); } });
    $('new').addEventListener('click', function () { newPaper(); });
    $('save').addEventListener('click', save);
    $('revert').addEventListener('click', function () {
      if (cur.index === null) newPaper(true); else fill(cur.original);
    });
    $('delete').addEventListener('click', remove);
    $('lookupBtn').addEventListener('click', doLookup);
    $('lookupInput').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); doLookup(); } });
    $('addZhTitle').addEventListener('click', function () {
      $('zhTitleField').dataset.open = '1';
      refreshForm();
      F('title_zh').focus();
    });
    $('lookupOpen').addEventListener('click', function () {
      $('lookup').dataset.open = '1';
      refreshForm();
      $('lookupInput').focus();
    });
    $('form').addEventListener('input', function (e) {
      if (e.target.classList.contains('grow')) autosize(e.target);
      if (e.target === F('tags')) renderTagSuggestions();
      refreshForm();
    });
    $('form').addEventListener('submit', function (e) { e.preventDefault(); });
    // Titles and author lists are one line on the page: Enter does not add a line break.
    ['title_en', 'authors'].forEach(function (k) {
      F(k).addEventListener('keydown', function (e) { if (e.key === 'Enter') e.preventDefault(); });
    });
    document.querySelectorAll('[data-translate]').forEach(function (b) {
      b.addEventListener('click', function () { translateInto(b.dataset.translate, b); });
    });
    $('publish').addEventListener('click', openPublish);
    $('publishGo').addEventListener('click', doPublish);
    $('publishDialog').addEventListener('close', function () {
      delete $('publishGo').dataset.done;
      $('publishCancel').hidden = false;
    });
    $('commitMsg').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); doPublish(); } });

    document.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save(); }
      var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
      if (e.key === '/' && !typing && !document.querySelector('dialog[open]')) { e.preventDefault(); $('q').focus(); }
    });
    window.addEventListener('beforeunload', function (e) { if (isDirty()) { e.preventDefault(); e.returnValue = ''; } });

    // Coming back to the window: pick up changes made elsewhere (an editor, git).
    var lastFocus = Date.now();
    window.addEventListener('focus', function () {
      if (Date.now() - lastFocus < 1500 || document.querySelector('dialog[open]')) return;
      lastFocus = Date.now();
      reload(false);
    });
    window.addEventListener('resize', function () { document.querySelectorAll('textarea.grow').forEach(autosize); });
  }

  wire();
  api('state').then(function (state) {
    setState(state);
    newPaper(true);
  }).catch(function (err) {
    document.body.textContent = err.message;
  });
})();
