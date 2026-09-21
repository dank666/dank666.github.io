# Tejing Wang — Personal Website

Live at **[dank666.github.io](https://dank666.github.io)**

我的个人学术主页，用于展示教育背景、科研经历、项目与论文，主要面向未来的博士申请。

A personal academic homepage for **Tejing Wang (王特警)** — AI student at Shaanxi Normal University, School of Artificial Intelligence and Computer Science. Built to support future PhD applications abroad.

## Features

- **Bilingual (EN / 中文)** — one-click language toggle in the nav bar; the choice is remembered across pages via `localStorage`
- **Dark mode** — follows the system setting automatically; a toggle button next to the language switch lets a visitor override it, remembered the same way
- **Sections** — News, About, Research Statement, Education, Experience, Projects, Publications, Skills, Awards, Contact
- **Scroll-spy navigation** — the nav link for whichever section is currently in view is highlighted automatically as you scroll. On wide screens the less-used links live in a "More" dropdown (`#navMoreMenu` in `index.html`) to keep the bar uncluttered; to move a link between the bar and the dropdown, just move its `<a>` line. Below 900px the dropdown flattens back into a normal horizontally-scrolling row.
- **Project image galleries** — project cards can include a thumbnail grid; clicking a thumbnail opens it full-size in a lightbox overlay (Esc to close, Left/Right arrow keys to step through the gallery)
- **Notes** (`reading.html`) — a separate, growing page that holds both short notes and a library of the papers I've read, organized by project and topic, with searchable/filterable entries and a reading note on every paper
- **Concept lattice demo** (`lattice.html`) — enter a formal context (objects × attributes) and see its classical concept lattice or one of two three-way concept lattices drawn live (pure front end, no back end). The maths is in `lattice-core.js` and was checked against a brute-force implementation.
- **Analytics** (`analytics.js`) — privacy-friendly GoatCounter page views, referrers (`?ref=`) and which home-page sections get read; switch it off by emptying `GOATCOUNTER_CODE` in the file
- **Collapsible, scalable News feed** — only the most recent 3 updates show by default; older entries expand into a height-capped, scrollable list, so it stays usable whether there are 3 entries or 300
- **CV download** — a "Download CV" link (hero and Contact section) points at `CV.pdf`; if that file doesn't exist yet, clicking it shows a friendly "not uploaded yet" notice instead of a broken link. Once `CV.pdf` is added to the repo root, the button starts working automatically — no code changes needed.
- **Social link previews** — Open Graph and Twitter Card meta tags on both pages, so sharing the link in email/Slack/WeChat shows a title, description, and preview image instead of a bare URL
- **Favicon** — a "TW" monogram icon (SVG + PNG/ICO fallbacks) shown in browser tabs and bookmarks
- **Content in a data file** — News, Publications, Awards and Projects live in `data/content.mjs` as `{ en, zh }` pairs; a small dependency-free script (`tools/build.mjs`) writes them into `index.html` as plain static HTML, and refuses to build if either language is missing
- **Publication cards** with a status tag (Under Review / In Preparation / …) and PDF / arXiv / Code / BibTeX buttons that light up as soon as you fill in the links
- **Project cards with schematic figures**, **folded awards** (strongest three shown, the rest one click away), a compact **Skills** list, and a note that you are open to remote collaboration and research internships
- **Emails are assembled by script** instead of being written into the HTML, so simple scrapers reading the page source don't find them
- **Visitor map** — a "Visitors" section with a world map of city-level, anonymous visit counts (bigger and darker dot = more visits). Backed by a small Cloudflare Worker + D1 database in `visitor-worker/`; no IPs are stored. See [Visitor map](#visitor-map-访客地图) below.
- **Footer with last-updated date and source link** — a small "Last updated" line plus a link back to this repository
- Sticky nav, back-to-top button, skip-to-content link, responsive down to mobile, reduced-motion support

## Tech stack

Plain **HTML / CSS / vanilla JavaScript** — no framework and nothing to install. Chosen deliberately to keep the site easy to hand-edit and cheap to host on GitHub Pages. The site itself is static; the only tooling is one optional Node script (`tools/build.mjs`, no dependencies) that turns `data/content.mjs` into HTML while you edit. The only third-party code is the small set of D3 modules and map data used by the visitor map, copied into `vendor/` (no CDN, no npm install).

## Project structure

```
.
├── index.html            # main homepage (all sections)
├── reading.html          # Notes: short notes + paper library subpage
├── lattice.html          # concept lattice demo page
├── lattice.js            # concept lattice demo: table editor and diagram
├── lattice-core.js       # concept lattice demo: the concept computation (pure functions)
├── analytics.js          # GoatCounter analytics (the site code is set at the top of the file)
├── visitors.js           # visitor map: records a visit, draws the map (Worker URL goes at the top)
├── data/content.mjs      # News, Publications, Awards, Projects — the one place to edit them
├── tools/build.mjs       # writes data/content.mjs into index.html (node tools/build.mjs)
├── tests/                # tests for the concept-lattice maths (node tests/lattice-core.test.js)
├── .github/workflows/    # CI: fails if index.html is out of date or a test breaks
├── images/               # photos and screenshots (WebP; the avatar also has a JPEG fallback)
├── vendor/               # d3-array, d3-geo, topojson-client, world-atlas map data (see vendor/README.md)
├── visitor-worker/       # Cloudflare Worker + D1 backend for the visitor map (deployed separately)
├── CV.pdf                # (not yet added) drop a PDF here to enable the "Download CV" button
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

### 基本规则：中英文成对出现，先改数据再构建

页面上几乎每一段可翻译的文字，都是**成对**出现的：一份英文（`lang-en`）、一份中文（`lang-zh`），页面用 `<html>` 上的 `data-lang` 属性通过 CSS 隐藏当前不需要的那份。

- **News、Publications、Awards、Projects** 四个板块的内容都在 **`data/content.mjs`** 里，每段文字是一个 `{ en: "...", zh: "..." }` 对。改完之后运行一次：

  ```bash
  node tools/build.mjs
  ```

  它会把内容写进 `index.html` 里标着 `GENERATED` 的区块（**不要手改这些区块，会被覆盖**）。任何一边的文字缺失或为空，构建会直接报错并告诉你是哪一条，所以不会再出现"改了英文忘了中文"。数据里的文字是 HTML：`&` 要写成 `&amp;`，可以用 `<em>…</em>` 和 `<a href="…" target="_blank">…</a>`。
- **其余板块**（About、Research、Education、Experience、Skills、Contact 等）仍然直接在 `index.html` 里手写，同样是成对的 `lang-en` / `lang-zh`，改哪段就同时改两份。
- 没有安装 Node 的话，也可以直接把改动告诉我，我来改并构建。

### 加一条 News（动态）

在 `data/content.mjs` 的 `news` 数组**最前面**加一条（越新的排越上面），然后运行 `node tools/build.mjs`：

```js
{
  date: "2026-10",                 // 年-月；页面上的 "Oct 2026" / "2026 年 10 月" 由它自动生成
  text: {
    en: "English description of the update.",
    zh: "中文描述。"
  }
},
```

页面上常驻显示最新 3 条（`NEWS_VISIBLE`），更早的自动折叠进"显示更早的动态"，不用手动挪。

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

### 加一个 Project（项目经历，含示意图和图片画廊）

在 `data/content.mjs` 的 `projects` 数组里加一项（排在前面的先显示），然后运行 `node tools/build.mjs`。除了 `title` 和 `description`，其余字段都是可选的：

```js
{
  title:       { en: "Project Name", zh: "项目名称" },
  tagline:     { en: "Role · status · advisor", zh: "角色 · 状态 · 导师" },   // 标题下面的一行小字
  description: { en: "English description.", zh: "中文描述。" },
  figure: {                                   // 示意图，三选一：
    type: "flow",                             //   流程：几个方框加箭头（手机上自动竖排）
    steps: [
      { label: { en: "Input", zh: "输入" }, title: { en: "…", zh: "…" } },
      { label: { en: "Method", zh: "方法" }, title: { en: "…", zh: "…" } }
    ],
    caption: { en: "Schematic overview.", zh: "示意图。" }
  },
  //   type: "scope"  一个中心框 + 几个并列的小标签（见"神经符号智能体综述"那一项）
  //   type: "image"  放你自己画的图：{ type: "image", src: "images/x.webp", alt: "…", width: 1200, height: 600, caption: {…} }
  links:   [{ label: { en: "Read more →", zh: "了解更多 →" }, href: "reading.html" }],
  gallery: [{ src: "images/xxx.webp", alt: "Description", width: 1280, height: 690 }]
},
```

**加图片时**：图片放进 `images/`，用有语义的文件名（比如 `nextscience-home-feed.webp`，不要 `IMG_1234.jpg`），格式用 WebP，宽度 1400px 以内、几百 KB 以内。手机拍的原图动辄几 MB，会拖慢网站。可以把图片直接发给我，我来转换和命名；想自己弄，可以用 [Squoosh](https://squoosh.app/)（网页版）。`width` / `height` 是图片的实际像素尺寸，用来提前占好位置、避免页面跳动。点击缩略图放大的灯箱是自动的。

### 加 / 更新一条 Publication（论文发表）

在 `data/content.mjs` 的 `publications` 数组里加一项，然后运行 `node tools/build.mjs`：

```js
{
  status: "under-review",     // "in-preparation" | "under-review" | "preprint" | "published"
  title: { en: "Paper Title in English", zh: "论文中文标题" },
  meta:  { en: "First author · Venue", zh: "第一作者 · 期刊/会议" },   // 可选，状态标签旁边的一行
  links: { pdf: "", arxiv: "", code: "", bibtex: "" }
},
```

`links` 就是卡片下面的 **PDF / arXiv / Code / BibTeX** 四个按钮。论文正式刊登、有了链接之后，把对应的字段填上，那个按钮就会从灰色虚线的"占位"变成可点击的按钮：`pdf` / `arxiv` / `code` 填网址；`bibtex` 直接把整条 BibTeX 文本填进去（可以用反引号写多行），点按钮会把它复制到剪贴板。没填的按钮显示为占位；如果你更想只显示已有的按钮，把文件里的 `SHOW_PLACEHOLDER_LINKS` 改成 `false`。

### 更新 Skills（技能）

Skills 现在是紧凑的"一行一类"列表，直接在 `index.html` 的 `<dl class="skill-list">` 里改。加一类就复制一个 `.skill-row`：

```html
<div class="skill-row">
  <dt><span class="lang-en">Category</span><span class="lang-zh">类别</span></dt>
  <dd><span class="lang-en">Comma-separated skills.</span><span class="lang-zh">用顿号分隔的技能。</span></dd>
</div>
```

### 加一条 Award / Software Copyright（获奖 / 软著）

在 `data/content.mjs` 的 `awards` 里，往对应分组的 `items` 里加一项（两种语言一起写），然后运行 `node tools/build.mjs`。**把最强的排在前面**：竞赛那一组的 `visible: 3` 表示默认只显示前 3 项，其余折叠在"Show N more / 再显示 N 项"按钮后面；想多显示几项就改这个数字，不想折叠就删掉这一行。

### 更新 Contact（联系方式）

在 `index.html` 的 `<section id="contact">` 里找到对应的 `.contact-item`，把 "Coming soon" / "待添加" 那两行换成真正的链接（格式参考 GitHub 那一条）。

**邮箱**不是直接写在 HTML 里的：地址被拆成 `data-u`（@ 前面）和 `data-d`（@ 后面）两个属性，由页面脚本拼出来，所以只读网页源码的简单爬虫找不到。要改或加一个邮箱，复制一个 `<a class="email-link" data-u="…" data-d="…">` 即可（没开 JavaScript 时会显示成 `name [at] domain [dot] tld`）。这只能挡住最简单的爬虫；请注意 Git 历史里早先提交过的明文地址是删不掉的。

页面首屏和 Contact 里各有一句"欢迎远程合作或科研实习"（`hero-open` / `contact-open`），想改措辞或暂时去掉，直接改或删这两段。

### 换头像 / 加简历

- **头像**：`images/avatar.webp`（主用）和 `images/avatar.jpg`（兼容旧浏览器、也用于微信/邮件里的链接预览图）是同一张照片的两种格式，两个都要换成新照片才行——直接把新照片发给我，我帮你处理成这两种格式并放到正确的文件名。
- **简历（CV）**：把 PDF 文件重命名为 `CV.pdf`，放进仓库根目录即可，网站会自动识别，Hero 区和 Contact 区的"下载简历"按钮会立刻生效，不用改任何代码。

### Notes（笔记与论文库）加内容

`reading.html`（页面名称是 **Notes / 笔记**）里有两种条目：**论文**和**短文笔记**。都不用碰 HTML，直接改文件里的数组。

**加一篇论文**：搜 `var PAPERS = [`，往数组里加一条新的对象（照抄格式即可）：

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

**加一篇短文笔记**：搜 `var NOTES = [`，往数组里加一条（文件里有注释掉的模板）：

```js
{
  title_en: 'Note title',
  title_zh: '笔记标题',
  date: '2026-09',                    // 年-月
  project: 'agent-survey',            // 可选，PROJECTS 里的 id
  about: { title_en: 'Paper title', title_zh: '论文标题', link: 'https://...' },  // 可选：这篇笔记讲的是哪篇论文（显示为一行带链接的"关于论文"）
  topics: ['some-topic'],
  body_en: ['First paragraph.', 'Second paragraph.'],   // 每个字符串是一段
  body_zh: ['第一段。', '第二段。']
}
```

页面上一开始只有论文时看起来和原来的论文库一样；只要 `NOTES` 里有了第一条，就会自动出现"全部 / 笔记 / 论文"的类型筛选。论文和笔记混排，按时间从新到旧。

如果内容属于一个全新的项目（不是"agent-survey"），先在上面的 `var PROJECTS = [ ... ]` 数组里加一条新项目：

```js
{ id: 'new-project-id', label_en: 'Project Name', label_zh: '项目中文名' }
```

### 统计与来源（GoatCounter）

`analytics.js` 已经开启，统计页面在 `https://dank666.goatcounter.com`。所有页面（主页、Notes、概念格演示）都只需要加载这一个文件，**不要**再往页面里粘贴 GoatCounter 官方给的那段 `<script>`，否则每次访问会被记两次。

- **开关**：`analytics.js` 里的 `GOATCOUNTER_CODE` 就是 `.goatcounter.com` 前面的那一段。改成空字符串 `''` 就会完全关闭（页面里不会多任何东西，页脚的隐私说明也会恢复成只提访客地图的那一句）；换成自己的其他站点就填新的代码。开启后页脚的隐私说明会自动换成包含统计的那一句。
- **谁点了哪个链接**：给发出去的链接加 `?ref=` 参数，比如简历里写 `https://dank666.github.io/?ref=cv`，邮件签名写 `?ref=email`。GoatCounter 会把它当作来源显示。建议按"用途"分组（cv、email、linkedin……），不要给每个收件人单独编号，那样就成了在追踪个人。
- **把自己排除在统计之外**：在自己的浏览器里打开一次 `https://dank666.github.io/#toggle-goatcounter`。
- **板块阅读**：主页每个板块被读到时会记一次事件（`section/about`、`section/research`……），在 GoatCounter 后台的 Events 里看。

不会被统计的：本地预览（localhost、局域网 IP、`file://`）、开启了 Do Not Track 的访客、以及上面排除的浏览器。和访客地图一样，中国大陆网络多半连不上 GoatCounter，所以这些数据主要反映海外访问。

### 概念格演示

`lattice.html` 是纯前端页面，不需要后端。计算部分在 `lattice-core.js`（纯函数，可以直接在 Node 里 `require` 测试），界面在 `lattice.js`。想改示例表格，改 `lattice.js` 里的 `PRESETS`。表格大小上限（12 × 12）和画图的概念数上限（400）是文件顶部的常量 `MAX_OBJECTS`、`MAX_ATTRS`、`DRAW_LIMIT`。页面里"三支概念"采用的是常见表述：等价于给每个属性增加一个"否定"副本之后的概念；如果你论文里的定义或记号不同，改 `lattice.html` 里的说明文字（`.lat-def`）和 `lattice-core.js` 顶部的注释即可。

### 每次改完之后

1. **如果改了 `data/content.mjs`，先运行 `node tools/build.mjs`**，把内容写进 `index.html`。忘了也不会悄悄出错：推送后 GitHub 上的检查（`.github/workflows/check.yml`）会发现 `index.html` 和数据对不上并标红。
2. **页脚"最后更新"是自动的**：页面加载时会向服务器询问这个页面上次更新的时间（在 GitHub Pages 上就是最近一次推送发布的时间），不用手改。`build.mjs` 每次运行也会把 HTML 里的兜底文字刷新成当月，只在页面拿不到服务器时间时才会看到它。
3. **本地预览**：在仓库根目录运行 `python3 -m http.server`，打开 `http://localhost:8000`（访客地图和概念格演示页需要通过 HTTP 访问；只改文字的话直接双击 `index.html` 也行）。
4. **发布**：改完 `git add` / `git commit` / `git push` 到 `main` 分支，GitHub Pages 会在一两分钟内自动更新线上网站。如果这部分不熟悉，把改动告诉我，我可以帮你提交和推送。

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
- **已知限制：中国大陆网络通常连不上 `*.workers.dev`。** 大陆访客的访问不会被记录，他们看到的 Visitors 区块是"访客地图暂时无法加载"的提示（数据库里没有数据时才显示"暂无数据"）。所以地图主要反映海外访客。要改善的话可以给 Worker 绑定自己的域名（Cloudflare Custom Domain），再把 `visitors.js` 里的 `API_BASE` 换成新域名；或者换成国内可访问的后端。

## Running locally

Only News, Publications, Awards and Projects need the build step (`node tools/build.mjs` after editing `data/content.mjs`); everything else is edited in place. To preview, serve the folder with any static file server (the visitor map and lattice demo load their data over HTTP), e.g.:

```bash
python3 -m http.server
```

## Deployment

Hosted via **GitHub Pages** from this repository (`dank666.github.io`), which serves `index.html` at the repo root automatically.

## License

The **code** in this repository (HTML, CSS, and JavaScript) is licensed under the [MIT License](LICENSE) — feel free to use it as a reference or starting point for your own site.

The **written content, personal photos, and project images** are not covered by that license. All rights to that material are reserved by Tejing Wang; please don't reuse the bio text, research statement, or images without permission.

## Contact

- Email: see the Contact section of the [website](https://dank666.github.io/#contact)
- GitHub: [@dank666](https://github.com/dank666)
