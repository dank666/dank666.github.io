# Tejing Wang — Personal Website

Live at **[dank666.github.io](https://dank666.github.io)**

我的个人学术主页，用于展示教育背景、科研经历、项目与论文，主要面向未来的博士申请。

A personal academic homepage for **Tejing Wang (王特警)** — AI student at Shaanxi Normal University, School of Artificial Intelligence and Computer Science. Built to support future PhD applications abroad.

## Features

- **Bilingual (EN / 中文)** — one-click language toggle in the nav bar; the choice is remembered across pages via `localStorage`
- **Dark mode** — follows the system setting automatically; a toggle button next to the language switch lets a visitor override it, remembered the same way
- **Sections** — News, About, Research Statement, Education, Experience, Projects, Publications, Skills, Awards, Contact
- **Scroll-spy navigation** — the nav link for whichever section is currently in view is highlighted automatically as you scroll
- **Project image galleries** — project cards can include a thumbnail grid; clicking a thumbnail opens it full-size in a lightbox overlay (Esc to close, Left/Right arrow keys to step through the gallery)
- **Reading Library** (`reading.html`) — a separate, growing library of papers read during research, organized by project and topic, with searchable/filterable notes
- **Collapsible, scalable News feed** — only the most recent 3 updates show by default; older entries expand into a height-capped, scrollable list, so it stays usable whether there are 3 entries or 300
- **CV download** — a "Download CV" link (hero and Contact section) points at `CV.pdf`; if that file doesn't exist yet, clicking it shows a friendly "not uploaded yet" notice instead of a broken link. Once `CV.pdf` is added to the repo root, the button starts working automatically — no code changes needed.
- **Social link previews** — Open Graph and Twitter Card meta tags on both pages, so sharing the link in email/Slack/WeChat shows a title, description, and preview image instead of a bare URL
- **Favicon** — a "TW" monogram icon (SVG + PNG/ICO fallbacks) shown in browser tabs and bookmarks
- **Visitor map** — a "Visitors" section with a world map of city-level, anonymous visit counts (bigger and darker dot = more visits). Backed by a small Cloudflare Worker + D1 database in `visitor-worker/`; no IPs are stored. See [Visitor map](#visitor-map-访客地图) below.
- **Footer with last-updated date and source link** — a small "Last updated" line plus a link back to this repository
- Sticky nav, back-to-top button, skip-to-content link, responsive down to mobile, reduced-motion support

## Tech stack

Plain **HTML / CSS / vanilla JavaScript** — no framework, no build step. Chosen deliberately to keep the site easy to hand-edit and cheap to host on GitHub Pages. The only third-party code is the small set of D3 modules and map data used by the visitor map, copied into `vendor/` (no CDN, no npm install).

## Project structure

```
.
├── index.html            # main homepage (all sections)
├── reading.html          # reading library subpage
├── visitors.js           # visitor map: records a visit, draws the map (Worker URL goes at the top)
├── vendor/               # d3-array, d3-geo, topojson-client, world-atlas map data (see vendor/README.md)
├── visitor-worker/       # Cloudflare Worker + D1 backend for the visitor map (deployed separately)
├── IMG_4911.jpeg         # profile photo (JPEG fallback)
├── avatar.webp           # profile photo (WebP, served first via <picture>)
├── CV.pdf                # (not yet added) drop a PDF here to enable the "Download CV" button
├── nextscience-1.jpg      # NextScience project gallery images
├── nextscience-2.jpg
├── nextscience-3.jpg
├── nextscience-4.jpg
├── embodied-cell-1.jpg    # Embodied Cell project gallery images
├── embodied-cell-2.jpg
├── embodied-cell-3.jpg
├── embodied-cell-4.jpg
├── favicon.svg           # favicon, modern browsers
├── favicon.ico           # favicon fallback (16/32/48px), older browsers
├── icon-16.png           # favicon fallback, 16px
├── icon-32.png           # favicon fallback, 32px
├── apple-touch-icon.png  # iOS home-screen icon (180px)
├── robots.txt            # search engine crawl rules
├── sitemap.xml           # search engine sitemap
├── LICENSE                # MIT license (code only — see License section below)
└── README.md
```

## 如何自己更新内容（Updating Content）

这一节是写给未来的自己看的——不用记代码细节，照着对应小节复制模板改文字就行。

### 基本规则：中英文成对出现

页面上几乎每一段可翻译的文字，在 HTML 里都是**成对**写的：一份 `class="lang-en"`，一份 `class="lang-zh"`，紧挨着放在一起。页面通过 `<html>` 标签上的 `data-lang` 属性，用 CSS 把当前不需要的那份隐藏掉。

**改内容时的唯一原则：改哪段文字，就同时改它对应的中/英文两份，不要只改一份。** 加新内容时，两份也要一起加，顺序和位置保持一一对应（少数地方比如导航栏英文名字、GitHub/ORCID 这种没有译法的标签除外，那些本来就没有 `lang-zh`）。

### 加一条 News（动态）

打开 `index.html`，找到 `<section class="section" id="news">`。News 区块只在页面上常驻显示**最新 3 条**，更早的会自动折叠进"显示更早的动态"按钮里，不用担心以后攒多了会把页面撑长（这部分是限高可滚动的）。

加新动态时：
1. 把下面这段模板粘贴到 `<div class="timeline">` 里**第一条**的前面（越新的排越上面）；
2. 原来排第 3 的那条，手动剪切挪到下面 `<div class="timeline-more" id="newsMore" hidden>` 里面的最前面（保持「常驻 3 条 + 其余折叠」的结构）。

```html
<div class="timeline-item">
  <div class="timeline-meta lang-en"><span>Mon YYYY</span></div>
  <div class="timeline-meta lang-zh"><span>YYYY 年 M 月</span></div>
  <p class="lang-en">English description of the update.</p>
  <p class="lang-zh">中文描述。</p>
</div>
```

### 更新 Education / Experience（教育背景 / 科研经历）

同样在 `index.html` 里找到对应的 `<section id="education">` 或 `<section id="experience">`，在 `<div class="timeline">` 里加一条：

```html
<div class="timeline-item">
  <div class="timeline-meta lang-en">
    <span>Institution Name</span>
    <span>Mon YYYY – Mon YYYY</span>
  </div>
  <div class="timeline-meta lang-zh">
    <span>机构中文名</span>
    <span>YYYY 年 M 月 – YYYY 年 M 月</span>
  </div>
  <p class="lang-en">English description.</p>
  <p class="lang-zh">中文描述。</p>
</div>
```

### 加一个 Project（项目经历，含图片画廊）

在 `<section id="projects">` 的 `<div class="list">` 里加一个 `.card`：

```html
<div class="card">
  <h3 class="lang-en">Project Name — Short Tagline</h3>
  <h3 class="lang-zh">项目中文名 —— 简短说明</h3>
  <p class="lang-en">English description of the project.</p>
  <p class="lang-zh">中文项目描述。</p>

  <div class="project-gallery">
    <img src="project-1.jpg" alt="Description of image 1" loading="lazy" decoding="async">
    <img src="project-2.jpg" alt="Description of image 2" loading="lazy" decoding="async">
  </div>
</div>
```

图片画廊是可选的（没有图就把 `.project-gallery` 那块删掉）。点击图片放大的灯箱效果是自动生效的，不用额外写 JS。

**加新图片时注意**：直接把手机拍的原图放进仓库体积会很大（几 MB 一张很常见），会拖慢网站加载。建议先压缩、缩小尺寸再放进来——可以直接把图片发给我（Claude），我帮你压缩并生成合适的文件；如果想自己弄，可以用 [Squoosh](https://squoosh.app/)（网页版，不用装软件）压到几百 KB 以内。

### 加 / 更新一条 Publication（论文发表）

在 `<section id="publications">` 里加一个 `.publication-item`：

```html
<div class="publication-item">
  <div class="publication-title lang-en">Paper Title in English</div>
  <div class="publication-title lang-zh">论文中文标题</div>
  <p class="publication-meta lang-en">Author role · Venue · Status</p>
  <p class="publication-meta lang-zh">作者身份 · 期刊/会议 · 状态</p>
</div>
```

等论文有预印本/DOI 链接了，把标题文字包一层链接即可（两份都要包）：

```html
<div class="publication-title lang-en"><a href="链接" target="_blank">Paper Title in English</a></div>
```

### 加一条 Skill（技能）

在 `<section id="skills">` 里加一个 `.card`（格式和 Project 卡片一样，但不需要图片画廊）：

```html
<div class="card">
  <h3 class="lang-en">Skill Category</h3>
  <h3 class="lang-zh">技能类别</h3>
  <p class="lang-en">Comma-separated skills in English.</p>
  <p class="lang-zh">用顿号分隔的中文技能列表。</p>
</div>
```

### 加一条 Award / Software Copyright（获奖 / 软著）

在 `<section id="awards">` 对应的 `<ul class="award-list lang-en">` 和 `<ul class="award-list lang-zh">` 里各加一个 `<li>`（两份数量、顺序要对应）：

```html
<li>Prize name, Competition name (Year)</li>
```

```html
<li>奖项名称，赛事名称（年份）</li>
```

### 更新 Contact（联系方式：Google Scholar / ORCID 等）

在 `<section id="contact">` 里找到对应的 `.contact-item`，把 "Coming soon" / "待添加" 那两行换成真正的链接，格式参考 GitHub 那一条：

```html
<div class="contact-item">
  <div class="contact-label">Google Scholar</div>
  <div class="contact-value"><a href="你的主页链接" target="_blank">显示文字</a></div>
</div>
```

### 换头像 / 加简历

- **头像**：仓库根目录的 `avatar.webp`（主用）和 `IMG_4911.jpeg`（兼容旧浏览器的备用格式）是同一张照片的两种格式，两个都要换成新照片才行——直接把新照片发给我，我帮你处理成这两种格式并放到正确的文件名。
- **简历（CV）**：把 PDF 文件重命名为 `CV.pdf`，放进仓库根目录即可，网站会自动识别，Hero 区和 Contact 区的"下载简历"按钮会立刻生效，不用改任何代码。

### Reading Library（论文库）加论文

`reading.html` 里不用碰 HTML，直接在文件里搜 `var PAPERS = [`，往数组里加一条新的对象（照抄格式即可）：

```js
{
  title_en: 'Paper title in English',
  title_zh: '《论文中文标题》（期刊/会议，年份）',
  authors: 'Author One, Author Two',
  year: 2026,
  venue: 'Journal or Conference Name',
  link: 'https://论文链接（没有可以先留空字符串）',
  project: 'agent-survey',           // 对应 PROJECTS 数组里某个条目的 id
  topics: ['some-topic', 'another-topic'],  // 自定义标签，用于筛选，英文短横线格式
  note_en: 'Your own reading note in English.',
  note_zh: '你自己的中文阅读笔记。'
}
```

如果这篇论文属于一个全新的项目（不是"agent-survey"），先在上面的 `var PROJECTS = [ ... ]` 数组里加一条新项目：

```js
{ id: 'new-project-id', label_en: 'Project Name', label_zh: '项目中文名' }
```

### 每次改完之后

1. **更新页脚"最后更新"日期**：`index.html` 的 `<footer>` 里有一行 "Last updated: ... / 最后更新：..."，是手写的，改完内容后顺手把月份改一下（GitHub Pages 不会自动生成这个日期）。
2. **本地预览**（可选）：不改代码只是想看看效果，直接双击 `index.html` 用浏览器打开就行，不需要起服务器。
3. **发布**：改完 `git add` / `git commit` / `git push` 到 `main` 分支，GitHub Pages 会在一两分钟内自动更新线上网站。如果这部分不熟悉，把改动告诉我，我可以帮你提交和推送。

## Visitor map（访客地图）

页面底部的 **Visitors** 区块会在世界地图上按城市显示访问量。只记录城市级别的匿名次数（经纬度取整到约 0.1°），**不存 IP，也不存 User-Agent**。

- **前端**：`visitors.js`。访客打开主页时，如果这个浏览器今天还没计过数，就向 Worker 发一次 `POST /hit`（`localStorage` 里的 `visitor-last-hit` 记录日期）；滚动到该区块时再 `GET /stats` 并画图。任何请求失败都会静默处理，区块显示"暂无数据"，不影响页面其他部分。
- **后端**：`visitor-worker/`（Cloudflare Worker + D1）。`POST /hit` 只接受来自 `https://dank666.github.io` 的请求；`GET /stats` 另外允许 `localhost`（本地预览用）。明显的爬虫 UA 不计数。
- **只统计线上访问**：在 localhost / `file://` 打开页面时**不会**发 `/hit`，本地预览不会增加计数。
- **Worker 地址**填在 `visitors.js` 最顶部的 `API_BASE`（留空时区块显示"暂无数据"）。
- **首次部署**（在 `visitor-worker/` 目录下，需要 Cloudflare 账号，都是手动执行）：
  1. `npx wrangler login`
  2. `npx wrangler d1 create visitor-map` → 把输出里的 `database_id` 填进 `wrangler.toml`
  3. `npx wrangler d1 execute visitor-map --remote --file=schema.sql`
  4. `npx wrangler deploy` → 记下输出的 `https://visitor-map.<你的子域>.workers.dev`，填进 `visitors.js` 的 `API_BASE`，再提交推送
- **本地预览地图**：地图数据要通过 HTTP 读取，所以要起静态服务器（`python3 -m http.server`），直接双击打开 `index.html` 时该区块会显示"暂无数据"。
- 计数只是"尽力而为"：`Origin` 头可以被伪造，所以别把它当作严格准确的统计。

## Running locally

For most edits no build step is required — just open `index.html` in a browser. To see the visitor map, serve the folder with any static file server instead (the map data is loaded over HTTP), e.g.:

```bash
python3 -m http.server
```

## Deployment

Hosted via **GitHub Pages** from this repository (`dank666.github.io`), which serves `index.html` at the repo root automatically.

## License

The **code** in this repository (HTML, CSS, and JavaScript) is licensed under the [MIT License](LICENSE) — feel free to use it as a reference or starting point for your own site.

The **written content, personal photos, and project images** are not covered by that license. All rights to that material are reserved by Tejing Wang; please don't reuse the bio text, research statement, or images without permission.

## Contact

- Email: [wtejing@gmail.com](mailto:wtejing@gmail.com)
- GitHub: [@dank666](https://github.com/dank666)
