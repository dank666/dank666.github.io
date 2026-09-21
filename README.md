# Tejing Wang — Personal Website

Live at **[dank666.github.io](https://dank666.github.io)** · Source: [github.com/dank666/dank666.github.io](https://github.com/dank666/dank666.github.io)

我的个人学术主页，用于展示教育背景、科研经历、项目与论文，主要面向未来的博士申请。

A personal academic homepage for **Tejing Wang (王特警)** — AI student at Shaanxi Normal University, School of Artificial Intelligence and Computer Science. Built to support future PhD applications abroad.

> **这份 README 有两个读者：** 路过的人（看"这是什么"，读下面的 *What it is*）和未来的我自己（看"怎么维护"）。
> 如果你是未来的我：**直接跳到 [2. 速查表](#2-速查表我想做某件事)**，找到你要做的事，照着做就行。忘了怎么发布就看 [3. 标准流程](#3-每次修改的标准流程)。改错了不要慌，[3.4](#34-改错了怎么办) 里有补救办法。

## 目录

- [What it is](#what-it-is)
- [1. 三分钟看懂：网站是怎么运转的](#1-三分钟看懂网站是怎么运转的)
- [2. 速查表：我想做某件事](#2-速查表我想做某件事)
- [3. 每次修改的标准流程](#3-每次修改的标准流程)
- [4. 中英文双语是怎么工作的（必读）](#4-中英文双语是怎么工作的必读)
- [5. 数据文件里的内容：News、Publications、Awards、Projects](#5-数据文件里的内容newspublicationsawardsprojects)
- [6. 直接在 index.html 里手写的部分](#6-直接在-indexhtml-里手写的部分)
- [7. 增加、删除、调整板块和导航](#7-增加删除调整板块和导航)
- [8. 图片：怎么压缩、命名、放进页面](#8-图片怎么压缩命名放进页面)
- [9. 简历 CV](#9-简历-cv)
- [10. Notes 页（论文库和短文笔记）](#10-notes-页论文库和短文笔记)
- [11. 概念格演示](#11-概念格演示)
- [12. 统计（GoatCounter）](#12-统计goatcounter)
- [13. 访客地图（Cloudflare Worker）](#13-访客地图cloudflare-worker)
- [14. 外观：配色、字体、宽度](#14-外观配色字体宽度)
- [15. 自动检查和测试](#15-自动检查和测试)
- [16. 排错：出了问题看这里](#16-排错出了问题看这里)
- [17. 文件说明](#17-文件说明)
- [18. 设计取舍：为什么是这样](#18-设计取舍为什么是这样)
- [19. 定期维护清单](#19-定期维护清单)
- [License](#license)

---

## What it is

- **Bilingual (EN / 中文)** — a one-click language toggle; the choice is remembered across pages.
- **Dark mode** — follows the system setting; a toggle button lets a visitor override it.
- **Sections** — About, Research Statement, Education, Experience, Projects, Publications, News, Skills, Awards, Contact, Visitors.
- **Content in a data file** — News, Publications, Awards and Projects live in `data/content.mjs` as `{ en, zh }` pairs; a small dependency-free script writes them into `index.html` as plain static HTML and refuses to build if either language is missing.
- **Publication cards** with status tags and PDF / arXiv / Code / BibTeX buttons; **project cards** with schematic figures and screenshot galleries; **folded awards**.
- **Notes** (`reading.html`) — short notes plus a searchable library of papers I've read.
- **Concept lattice demo** (`lattice.html`) — enter a formal context and see its classical or three-way concept lattice drawn live. The maths is tested against a brute-force implementation.
- **Visitor map** — anonymous, city-level visit counts on a world map (Cloudflare Worker + D1; no IPs stored).
- **Analytics** — privacy-friendly GoatCounter page views, referrers (`?ref=`) and which sections get read.
- Scroll-spy navigation, responsive down to mobile, skip-to-content link, reduced-motion support, social-preview meta tags, structured data, emails assembled by script (not in the page source).

**Tech stack:** plain HTML / CSS / vanilla JavaScript hosted on GitHub Pages — no framework and nothing to install to *view* the site. The only tooling is one optional Node script (`tools/build.mjs`, no dependencies) used while editing. The only third-party code is a few D3 modules and map data in `vendor/` (no CDN).

---

## 1. 三分钟看懂：网站是怎么运转的

网站是**纯静态**的：仓库里的文件就是网站本身，推送到 GitHub 后，GitHub Pages 把它们原样发布出去。没有服务器、没有数据库（访客地图除外，它是一个独立的小后端）。

你要改的东西，按"在哪里改"分成五类：

| 要改的内容 | 去哪里改 | 改完要构建吗 |
| --- | --- | --- |
| News、Publications、Awards、Projects | `data/content.mjs` | **要**：`node tools/build.mjs` |
| 首屏、About、Research、Education、Experience、Skills、Contact、页脚、导航栏、网页标题 | `index.html`（直接手写） | 不用 |
| Notes 页（论文库 + 短文笔记） | `reading.html` 里的 `PAPERS` / `NOTES` / `PROJECTS` 数组 | 不用 |
| 概念格演示的示例表格 | `lattice.js` 里的 `PRESETS` | 不用 |
| 图片、简历、头像 | `images/`、`CV.pdf` | 不用 |

**三条必须记住的规则：**

1. **中英文成对出现。** 页面上每段可翻译的文字都有中文和英文两份，改一份就要同时改另一份（[第 4 节](#4-中英文双语是怎么工作的必读)）。
2. **`index.html` 里标着 `GENERATED` 的区块不要手改。** 它们是由 `data/content.mjs` 生成的，手改会在下一次构建时被覆盖（[第 5 节](#5-数据文件里的内容newspublicationsawardsprojects)）。
3. **先在本地看，再推送。** 推送就等于发布，全世界都能看到（[第 3 节](#3-每次修改的标准流程)）。

---

## 2. 速查表：我想做某件事

"构建"指改完后要运行一次 `node tools/build.mjs`。

| 我想…… | 改哪里 | 构建？ | 详细说明 |
| --- | --- | --- | --- |
| 加一条 News | `data/content.mjs` 的 `news` 最前面 | 要 | [5.1](#51-news动态) |
| 改 / 删一条 News | 同上 | 要 | [5.1](#51-news动态) |
| 加一篇"撰写中 / 审稿中"的论文 | `data/content.mjs` 的 `publications` | 要 | [5.2](#52-publications论文发表) |
| 论文录用 / 发表了，补上 PDF、arXiv、代码、BibTeX | 同一项的 `status` 和 `links` | 要 | [5.2](#52-publications论文发表) |
| 加一个奖项 / 软著 / 一个新的奖项分组 | `data/content.mjs` 的 `awards` | 要 | [5.3](#53-awards获奖) |
| 加一个项目 / 改项目描述 / 给项目加图或示意图 | `data/content.mjs` 的 `projects` | 要 | [5.4](#54-projects项目经历) |
| 改教育背景 / 科研经历 | `index.html`（搜 `id="education"` / `id="experience"`） | 不用 | [6.4](#64-education-和-experience) |
| 改 About / 研究陈述 | `index.html`（搜 `id="about"` / `id="research"`） | 不用 | [6.3](#63-about-和-research) |
| 改技能 | `index.html`（搜 `skill-list`） | 不用 | [6.5](#65-skills) |
| 改邮箱 / 加 Google Scholar / 改 ORCID | `index.html`（搜 `id="contact"`） | 不用 | [6.6](#66-contact联系方式) |
| 改首屏的名字、副标题、"欢迎合作"那句话 | `index.html`（搜 `class="hero"`） | 不用 | [6.2](#62-首屏hero) |
| 上传 / 更新简历 | 仓库根目录的 `CV.pdf` | 不用 | [9](#9-简历-cv) |
| 换头像 | `images/avatar.webp` 和 `images/avatar.jpg` | 不用 | [8.4](#84-头像) |
| 往 Notes 里加一篇论文 / 一篇短文笔记 | `reading.html` 的 `PAPERS` / `NOTES` | 不用 | [10](#10-notes-页论文库和短文笔记) |
| 加一个全新的板块（比如 Teaching） | `index.html` + 导航栏 | 不用 | [7.1](#71-加一个新板块) |
| 删掉 / 移动一个板块 | `index.html` + 导航栏（生成式板块还要动 `tools/build.mjs`） | 视情况 | [7.2](#72-删除一个板块) |
| 把某个链接放进"More"菜单，或拿出来 | `index.html` 的导航栏 | 不用 | [7.4](#74-导航栏) |
| 改网页标题 / 描述 / 微信和邮件里的分享预览 | 每个页面的 `<head>` | 不用 | [7.5](#75-网页标题描述分享预览) |
| 加一个新页面 | 复制现有页面 + 检查清单 | 不用 | [7.6](#76-新增一个独立页面) |
| 压缩一张图片、给图片起名字 | 终端命令 | 不用 | [8](#8-图片怎么压缩命名放进页面) |
| 改配色 / 字体 / 页面宽度 | 每个页面 `<style>` 开头的变量 | 不用 | [14](#14-外观配色字体宽度) |
| 概念格演示里加一个示例表格 | `lattice.js` 的 `PRESETS` | 不用 | [11](#11-概念格演示) |
| 给简历、邮件里的链接加来源标记 | 在链接后面加 `?ref=cv` | 不用 | [12](#12-统计goatcounter) |
| 关掉 / 换掉统计 | `analytics.js` 里的 `GOATCOUNTER_CODE` | 不用 | [12](#12-统计goatcounter) |
| 看访客地图的数据 / 删掉测试数据 | `wrangler d1` 命令 | 不用 | [13](#13-访客地图cloudflare-worker) |
| 推送后发现改错了 | `git revert` | 不用 | [3.4](#34-改错了怎么办) |
| 页面没更新 / 报错 / 显示不对 | 排错表 | — | [16](#16-排错出了问题看这里) |

---

## 3. 每次修改的标准流程

### 3.1 需要什么

| 工具 | 用来做什么 | 怎么确认装好了 |
| --- | --- | --- |
| **Git** | 保存历史、推送发布 | `git --version` |
| **Python 3** | 在本地起一个预览服务器（macOS 自带） | `python3 --version` |
| **Node.js 20 或更新** | 运行构建脚本和测试（**只有改 `data/content.mjs` 时才需要**） | `node -v`，没有的话到 [nodejs.org](https://nodejs.org) 下载（GitHub 上的自动检查用的是 22） |
| **webp**（可选） | 把图片转成 WebP（见[第 8 节](#8-图片怎么压缩命名放进页面)） | `cwebp -version`，没有的话 `brew install webp` |
| 一个代码编辑器（推荐 VS Code） | 改文件、按 `Cmd+F` 搜索 | — |

**搜索是最重要的技巧。** `index.html` 有两千行，别去翻，直接搜：`id="education"`、`id="contact"`、`skill-list`、`class="hero"`、`GENERATED`。

### 3.2 标准流程

在终端里进入仓库目录（`cd /Users/wangtejing/Projects/PersonalWedsite`），然后：

```bash
# 0. 开始前（好习惯）：确认没有别的未提交改动
git status

# 1. 改文件（编辑器里改 data/content.mjs 或 index.html 等）

# 2. 如果改了 data/content.mjs：构建，把内容写进 index.html
node tools/build.mjs

# 3. 本地预览
python3 -m http.server          # 然后浏览器打开 http://localhost:8000 ；Ctrl+C 停止

# 4. 提交前的最后检查（和 GitHub 上的自动检查是同一个）
node tools/build.mjs --check

# 5. 看看到底改了什么
git status
git diff

# 6. 提交并推送（推送 = 发布）
git add -A
git commit -m "Add a news item about the master's offer"
git push
```

**第 3 步预览时要看什么：**

- 页面**中英文各看一遍**（右上角 EN / 中）。
- **深色模式**看一眼（右上角月亮图标）。
- **手机宽度**看一眼：Chrome 里按 `Cmd+Option+I` 打开开发者工具，再按 `Cmd+Shift+M` 切换设备模式。
- **控制台没有红色报错**：`Cmd+Option+J` 打开控制台。手写 JavaScript 数据（`reading.html`、`lattice.js`）时漏一个逗号，整个功能就会失效，控制台会告诉你是哪一行。

**推送之后：**

1. 等一两分钟。GitHub Pages 自动发布，线上页面会更新。
2. 打开线上页面，用 `Cmd+Shift+R` **强制刷新**（浏览器和 GitHub 会缓存文件约 10 分钟，不强制刷新可能看到旧的）。
3. 在仓库页面的 **Actions** 标签里，最新一次 "Checks" 应该是绿色的 ✓。红色 ✗ 见 [15](#15-自动检查和测试)。

### 3.3 提交信息怎么写

用一句简短的英文说清"做了什么"就行，比如 `Add a news item`、`Update publication status to accepted`、`Fix typo in About`。以后翻历史（`git log`）时靠它找东西。

### 3.4 改错了怎么办

先判断改动**到了哪一步**：

| 情况 | 怎么办 |
| --- | --- |
| 改乱了，还没提交，想**放弃某个文件的所有修改** | `git restore 文件名`（⚠️ 这个文件里没提交的修改会**永久丢失**） |
| 想放弃**所有**没提交的修改 | `git restore .`（⚠️ 同上，全部丢失） |
| 刚提交了，**还没推送**，想撤销这次提交但保留改动 | `git reset --soft HEAD~1` |
| **已经推送**，想撤销某次提交 | `git log --oneline -10` 找到那次提交的编号，然后 `git revert 编号`，再 `git push`（`revert` 会新建一个"撤销提交"，不会改写历史，最安全） |
| 想把**某个文件恢复成旧版本** | `git log --oneline -- 文件名` 找到编号，然后 `git restore --source=编号 文件名` |
| 想**看历史上某次提交改了什么** | `git show 编号` |
| `git push` 被拒绝（`rejected`、`non-fast-forward`） | 远程有你本地没有的提交：先 `git pull --rebase`，再 `git push` |
| 不确定发生了什么 | 先 `git status`，把输出看懂；实在不行，把终端内容发给 Claude |

### 3.5 让 Claude 帮忙

你平时是在这个仓库里用 Claude Code 改网站的，这完全可以继续：告诉它"要改什么"，它会改文件、构建、给你看效果；你说 "push" 它才提交推送。
比较好的说法：**"帮我在 News 里加一条：2026 年 10 月……，先别推送，让我看看效果。"**

---

## 4. 中英文双语是怎么工作的（必读）

页面上几乎每段可翻译的文字，都是**成对**写的：

```html
<p class="lang-en">English text.</p>
<p class="lang-zh">中文文字。</p>
```

页面根节点 `<html>` 上有一个 `data-lang="en"` 或 `"zh"` 属性（右上角的 EN / 中 按钮切换它，选择存在浏览器的 `localStorage` 里，默认英文），CSS 据此把**不是当前语言**的那份隐藏掉。所以：

- **每处文字必须写两份，紧挨着放。** 只写了一份，另一种语言下那里就是一片空白。
- **短的文字**（按钮、标签）用 `<span>`：`<span class="lang-en">About</span><span class="lang-zh">关于</span>`。
- **数据文件**里用 `{ en: "…", zh: "…" }`，缺任何一边构建都会报错，所以不会漏。
- **少数例外**：名字（`<h1 data-i18n data-lang-en="Tejing Wang" data-lang-zh="王特警">`）由脚本切换，两种写法都在属性里；GitHub、ORCID、邮箱这类没有译法的标签只写一份。
- **JavaScript 生成的文字**（访客地图、概念格、Notes 页的列表）读的是同一个 `data-lang`，在各自的数据里也都是中英成对的。
- **文字里的特殊字符**：HTML 里 `&` 要写成 `&amp;`，`<` 写成 `&lt;`。在 JavaScript 字符串里的引号见 [5.0](#50-写数据时的规则) 和 [10.5](#105-写-javascript-数据时的几个陷阱)。

---

## 5. 数据文件里的内容：News、Publications、Awards、Projects

这四个板块的内容都在 **`data/content.mjs`**。改完之后运行一次：

```bash
node tools/build.mjs
```

它会把内容写进 `index.html` 里两行注释之间的区块：

```html
<!-- BEGIN GENERATED: news — edit data/content.mjs, then run "node tools/build.mjs" -->
…这里的内容会被整个替换…
<!-- END GENERATED: news -->
```

**不要手改这些注释之间的内容，也不要删这两行注释**——手改会在下一次构建时消失。`node tools/build.mjs --check` 只检查、不修改，用来确认 `index.html` 和数据是同步的。

### 5.0 写数据时的规则

数据文件是 JavaScript，格式要求比 HTML 严一点：

- **每一项之间要有逗号**（`},` 结尾）。漏逗号是最常见的错误。
- **字符串用双引号** `"…"`。字符串里如果要出现英文双引号，写成 `\"`；中文里建议直接用中文引号 `“ ”` 或 `「 」`，最省事。
- **文字是 HTML**：`&` 要写成 `&amp;`；可以在里面用 `<em>斜体</em>`、`<a href="链接" target="_blank">链接文字</a>`。
- 想写 BibTeX 这类**多行**文字，用 ``String.raw`…` ``（见 5.2）；普通文字不要用反引号。
- 改完数据文件后，构建报错会用一行话告诉你问题在哪一条（见 [5.5](#55-构建报错对照表)）。

### 5.1 News（动态）

在 `news` 数组的**最前面**加一条（越新的越靠前）：

**模板：新增一条 News**

```js
  {
    date: "2026-10",
    text: {
      en: "English description of the update.",
      zh: "中文描述。"
    }
  },
```

- `date` 写 `"年-月"`（两位月份，比如 `"2026-09"`）。页面上的 "Sep 2026" 和 "2026 年 9 月" 是自动生成的。
- 页面上常驻显示最新 **3** 条，更早的自动折叠进"显示更早的动态"按钮。这个 3 是文件顶部的 `NEWS_VISIBLE`，想改就改它。
- **改**一条：直接改对应的文字。**删**一条：把整个 `{ … },` 删掉。**调整顺序**：剪切粘贴（页面按你在数组里的顺序显示，不会自己排序）。

### 5.2 Publications（论文发表）

在 `publications` 数组里加一项。每篇论文显示为一张卡片：一个**状态标签**、标题、一行说明，以及下面的 **PDF / arXiv / Code / BibTeX** 四个按钮。

**模板：新增一篇论文（撰写中或审稿中）**

```js
  {
    status: "under-review",
    title: {
      en: "Paper Title in English",
      zh: "论文中文标题"
    },
    meta: {
      en: "First author · Journal or Conference Name",
      zh: "第一作者 · 期刊或会议名称"
    },
    links: { pdf: "", arxiv: "", code: "", bibtex: "" }
  },
```

- **`status`** 只能是这四个值之一：`"in-preparation"`（撰写中）、`"under-review"`（审稿中）、`"preprint"`（预印本）、`"published"`（已发表）。写错了构建会报错并列出可选值。
- **`meta`** 是状态标签旁边那行小字，可选；没有就删掉这个字段。
- **`links`**：没填的按钮会显示成**灰色虚线的"占位"**（意思是"论文发表后提供"）。填上之后自动变成可以点的按钮。

**论文被录用 / 发表之后**，把这一项改成下面这样（`status` 改成 `"published"`，补上链接）：

**模板：论文发表后的完整写法**

```js
  {
    status: "published",
    title: {
      en: "<a href=\"https://doi.org/10.xxxx/xxxxx\" target=\"_blank\">Paper Title in English</a>",
      zh: "<a href=\"https://doi.org/10.xxxx/xxxxx\" target=\"_blank\">论文中文标题</a>"
    },
    meta: {
      en: "First author · Journal Name, 2027",
      zh: "第一作者 · 期刊名，2027"
    },
    links: {
      pdf: "https://example.com/paper.pdf",
      arxiv: "https://arxiv.org/abs/2601.00000",
      code: "https://github.com/dank666/your-repo",
      bibtex: String.raw`@article{wang2027example,
  title   = {Paper Title in English},
  author  = {Wang, Tejing and Hao, Fei},
  journal = {Journal Name},
  year    = {2027}
}`
    }
  },
```

- **想让标题本身可以点击**：像上面那样，在标题文字外面包一层 `<a href="…">`（中英文两份都要包）。
- **`pdf`、`arxiv`、`code`** 填网址；**`bibtex`** 直接把整条 BibTeX 文本填进去，读者点 BibTeX 按钮就会把它**复制到剪贴板**。
- **BibTeX 一定要写成 ``String.raw`…` ``这种形式**（`String.raw` 加一对反引号，可以多行）。BibTeX 里常有反斜杠（`{\"o}`、`\textit`、`\&`、`\url`），而普通的 JavaScript 多行字符串会曲解反斜杠：`\t` 会变成制表符，`\u` 后面不是十六进制数字时甚至直接报 `SyntaxError`。`String.raw` 会把每个字符原样保留。
- 不想显示灰色占位按钮，只显示已有的：把文件里的 `SHOW_PLACEHOLDER_LINKS` 改成 `false`。

### 5.3 Awards（获奖）

奖项分成"组"（现在有 Competitions 和 Software Copyrights 两组），每组是一张卡。

**模板：往已有的一组里加一项**（加到那一组的 `items` 数组里；**把最强的放前面**）

```js
      {
        en: "Prize name, Competition name (Year)",
        zh: "赛事名称 · 奖项名称（年份）"
      },
```

**模板：新增一整组**（加到 `awards` 数组里）

```js
  {
    title: { en: "Scholarships", zh: "奖学金" },
    items: [
      { en: "Scholarship name (Year)", zh: "奖学金名称（年份）" },
    ]
  },
```

- 竞赛那一组有一行 `visible: 3`，意思是**默认只显示前 3 项**，其余折叠在"Show N more / 再显示 N 项"按钮后面。想多显示几项就改这个数字；不想折叠就删掉这一行；别的组想折叠就给它加一行 `visible: 数字`。
- 因为是按顺序显示的，**最强的奖项要放在最前面**。

### 5.4 Projects（项目经历）

在 `projects` 数组里加一项，**排在前面的先显示**。`title` 和 `description` 是必须的，其余都可选。

**模板：新增一个项目**

```js
  {
    title:       { en: "Project Name", zh: "项目名称" },
    tagline:     { en: "Role · status · advisor", zh: "角色 · 状态 · 导师" },
    description: { en: "English description.", zh: "中文描述。" },
    figure: {
      type: "flow",
      steps: [
        { label: { en: "Input", zh: "输入" }, title: { en: "What goes in", zh: "输入什么" } },
        { label: { en: "Method", zh: "方法" }, title: { en: "What is done", zh: "做了什么" } },
        { label: { en: "Output", zh: "输出" }, title: { en: "What comes out", zh: "得到什么" } }
      ],
      caption: { en: "Schematic overview.", zh: "示意图。" }
    },
    links:   [{ label: { en: "Read more →", zh: "了解更多 →" }, href: "reading.html" }],
    gallery: [{ src: "images/my-project-screenshot.webp", alt: "Description of the image", width: 1280, height: 690 }]
  },
```

各个可选字段：

- **`tagline`**：标题下面的一行小字（角色、时间、导师、是否完成）。
- **`figure`**（示意图），三种类型选一种：
  - `type: "flow"`：几个方框加箭头，表示"输入 → 方法 → 输出"（手机上自动竖排）。
  - `type: "scope"`：一个中心框加几个并列的标签，表示"范围"。写法参考数据文件里"神经符号智能体综述"那一项。
  - `type: "image"`：放你自己画的图：`{ type: "image", src: "images/my-figure.webp", alt: "图的文字说明", width: 1200, height: 600, caption: { en: "…", zh: "…" } }`。
- **`links`**：项目卡下方的一行链接，可以放多个。
- **`gallery`**：截图画廊。点击缩略图会放大（有灯箱，`Esc` 关闭，左右方向键切换）。
  - `src` 是图片路径（先把图片放进 `images/`，见[第 8 节](#8-图片怎么压缩命名放进页面)）。
  - `width` / `height` 是图片的**实际像素尺寸**（用来提前占好位置，避免加载时页面跳动）。
  - `alt` 是给读屏软件和图片加载失败时看的文字说明，**每张图都要写**。

### 5.5 构建报错对照表

构建失败时会打印一行 `Build failed: …`，对照下面找原因：

| 报错里的话 | 原因和解决 |
| --- | --- |
| `news[0].text: needs a non-empty "en" AND "zh" text` | 第 1 条 News 的中文或英文是空的 / 漏写了。`[0]` 是数组里的第几项（从 0 开始数） |
| `news[2].date: expected 'YYYY-MM'` | 日期格式不对，要写成 `"2026-09"` 这种（月份两位数） |
| `publications[1].status: expected one of …` | `status` 写错了，只能是 `in-preparation` / `under-review` / `preprint` / `published` |
| `projects[0].figure.type: expected 'flow', 'scope' or 'image'` | 示意图的 `type` 写错了 |
| `projects[0].figure.steps: a flow needs at least 2 steps` | `flow` 至少要有 2 个步骤 |
| `index.html has no "GENERATED: xxx" block` | `index.html` 里对应的 `GENERATED` 注释被删了，或者你删了整个板块却没同步改 `tools/build.mjs`（见 [7.2](#72-删除一个板块)） |
| 屏幕上出现 `data/content.mjs:行号`、那一行的内容和 `SyntaxError: Unexpected identifier …` | JavaScript 语法错误。最常见的是**上一行末尾漏了逗号**：Node 报的是**漏逗号的下一行**（它到那里才发现不对劲），所以要**看它指的那一行和上一行**。其他原因：引号没配对、字符串里有没转义的 `"`、花括号没配对 |
| `Cannot find module` / `command not found: node` | 没装 Node，或不在仓库目录里运行 |

---

## 6. 直接在 index.html 里手写的部分

这些板块没有放进数据文件，直接改 `index.html`。**每处文字都要中英文两份**（[第 4 节](#4-中英文双语是怎么工作的必读)）。

### 6.1 怎么找到要改的地方

用编辑器搜索（`Cmd+F`）：

| 要改 | 搜 |
| --- | --- |
| 首屏（名字、副标题、联系方式、合作说明） | `class="hero"` |
| About | `id="about"` |
| Research 陈述 | `id="research"` |
| Education | `id="education"` |
| Experience | `id="experience"` |
| Skills | `skill-list` |
| Contact | `id="contact"` |
| 页脚 | `class="footer"` |
| 导航栏 | `class="nav-links"` |
| 网页标题、描述、分享预览 | `og:title` |
| 结构化数据（搜索引擎看的） | `application/ld+json` |
| 四个生成式板块 | `GENERATED` |

**别对 `index.html` 使用编辑器的"格式化文档 / Format Document"**：它会重排缩进、折断长句，让改动变得很大很乱。

### 6.2 首屏（hero）

搜 `class="hero"`，里面有：

- **名字**：`<h1 data-i18n data-lang-en="Tejing Wang" data-lang-zh="王特警">Tejing Wang</h1>`——改名字要改**两个属性和中间的文字**共三处。名字还出现在很多别的地方（导航栏左上角、网页标题、分享预览、结构化数据、页脚版权、`reading.html` 和 `lattice.html`），改名后在整个仓库里搜 `Tejing Wang` 和 `王特警`，把所有出现的地方一起改。
- **副标题**：`<p class="subtitle lang-en">` 和 `<p class="subtitle lang-zh">` 各一份。
- **联系方式那一行** `class="hero-contact"`：邮箱、GitHub、下载简历（邮箱的写法见 6.6）。
- **"欢迎合作"那句话** `class="hero-open"`：想改措辞或暂时去掉，直接改或删这一整段 `<p>`。Contact 里还有一句同样的 `class="contact-open"`，要一起改。

### 6.3 About 和 Research

搜 `id="about"` / `id="research"`。里面是一个个成对的段落：

**模板：新增一段（放在 `<div class="card">` 里面，中英文各一份）**

```html
          <p class="lang-en">
            English paragraph.
          </p>
          <p class="lang-zh">
            中文段落。
          </p>
```

段落里的链接写法：`<a href="https://…" target="_blank">链接文字</a>`。

### 6.4 Education 和 Experience

搜 `id="education"` / `id="experience"`。每一条是一个 `timeline-item`，**越新的放越上面**。

**模板：Education 新增一条（加在 `<div class="timeline">` 里最前面）**

```html
        <div class="timeline-item">
          <div class="timeline-meta lang-en">
            <span>University Name</span>
            <span>2027 – 2030</span>
          </div>
          <div class="timeline-meta lang-zh">
            <span>学校中文名</span>
            <span>2027 年 – 2030 年</span>
          </div>
          <h3 class="lang-en">Degree Name</h3>
          <h3 class="lang-zh">学位名称</h3>
          <p class="lang-en">School or Department · City, Country</p>
          <p class="lang-zh">学院 · 城市，国家</p>
        </div>
```

**模板：Experience 新增一条**

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
          <p class="lang-en">
            Role · Supervised by
            <a href="https://example.com" target="_blank">Prof. Name</a>
          </p>
          <p class="lang-zh">
            职位 · 导师：
            <a href="https://example.com" target="_blank">某某教授</a>
          </p>
          <p class="lang-en">What I worked on, in one or two sentences.</p>
          <p class="lang-zh">做了什么，一两句话。</p>
        </div>
```

**写描述时的原则**：只写你实际做过的、能被人核实的事；没做完的项目就写"参与了 / 了解了 / 学习了"，不要写成"完成了"。

### 6.5 Skills

搜 `skill-list`。每一类是一行（`skill-row`），前面的排在前面显示。

**模板：新增一类技能**

```html
        <div class="skill-row">
          <dt><span class="lang-en">Category</span><span class="lang-zh">类别</span></dt>
          <dd><span class="lang-en">Comma-separated skills.</span><span class="lang-zh">用顿号分隔的技能。</span></dd>
        </div>
```

### 6.6 Contact（联系方式）

搜 `id="contact"`。每一项是一个 `contact-item`。

**邮箱**不是直接写在 HTML 里的：地址被拆成 `data-u`（@ 前面的部分）和 `data-d`（@ 后面的部分）两个属性，由页面脚本在浏览器里拼起来，所以**只读网页源码的简单爬虫找不到**（没开 JavaScript 时页面显示成 `name [at] domain [dot] tld`）。

**模板：新增或修改一个邮箱**（首屏和 Contact 各有这样的写法，两处都要改）

```html
<a class="email-link" href="#contact" data-u="name" data-d="example.edu">name [at] example [dot] edu</a>
```

例如 `wtejing@gmail.com` 是 `data-u="wtejing" data-d="gmail.com"`。要改邮箱，就改这三处：`data-u`、`data-d`，和中间显示的 `[at] [dot]` 版本。

> 这只能挡住最简单的爬虫。请注意：Git 历史里早先提交过的明文地址是**删不掉**的，别人仍然能在仓库历史里翻到。

**模板：把 Google Scholar 的"Coming soon"换成真的链接**（找到 `Google Scholar` 那个 `contact-item`，整个替换成下面这样）

```html
        <div class="contact-item">
          <div class="contact-label">Google Scholar</div>
          <div class="contact-value"><a href="https://scholar.google.com/citations?user=你的ID" target="_blank" rel="noopener">Google Scholar profile</a></div>
        </div>
```

ORCID、GitHub 是同样的写法。加了新的个人主页链接（Scholar、LinkedIn 等）后，顺手把它也加进 [6.8 结构化数据](#68-结构化数据搜索引擎看的)的 `sameAs` 里。

### 6.7 页脚

- **"Last updated"是自动的**：页面加载时向服务器询问这个页面的最后修改时间（在 GitHub Pages 上就是最近一次推送发布的时间），不用手改。`node tools/build.mjs` 每次运行也会把 HTML 里的兜底文字刷新成当月，只在页面拿不到服务器时间时才会看到它。
- **隐私说明**：页脚有两句，平时显示"仅统计城市级别的匿名访问次数"，**统计脚本（第 12 节）启用后**会自动换成"同时包含页面浏览统计"那一句，不用手动切换。
- 版权年份、"View source" 链接在 `class="footer"` 里，每年手动改一下年份。

### 6.8 结构化数据（搜索引擎看的）

搜 `application/ld+json`。这是一小段给搜索引擎看的"名片"（姓名、职位、学校、`knowsAbout`（擅长的领域）、`sameAs`（你在别处的主页））。改了研究方向、职位、或加了 Scholar / LinkedIn 之后，顺手更新这里：`knowsAbout` 里只写你确实可以被认为擅长的领域；`sameAs` 里放你在别的网站的个人主页链接。**别在这里放邮箱**（会被爬虫直接读到）。

---

## 7. 增加、删除、调整板块和导航

### 7.1 加一个新板块

假设要加一个 "Teaching" 板块。分两步：

**第 1 步：在 `index.html` 里加板块**（放在你想让它出现的位置，即某个 `</section>` 后面、下一个 `<section` 前面）：

**模板：新板块**

```html
    <section class="section" id="teaching">
      <div class="section-header">
        <h2 class="section-title"><span class="lang-en">Teaching</span><span class="lang-zh">教学</span></h2>
      </div>

      <div class="list">
        <div class="card">
          <h3 class="lang-en">Item title</h3>
          <h3 class="lang-zh">条目标题</h3>
          <p class="lang-en">English description.</p>
          <p class="lang-zh">中文描述。</p>
        </div>
      </div>
    </section>
```

**第 2 步：在导航栏里加一个链接**（搜 `class="nav-links"`），`href="#teaching"` 要和板块的 `id="teaching"` **完全一致**：

```html
            <a href="#teaching"><span class="lang-en">Teaching</span><span class="lang-zh">教学</span></a>
```

放进主栏还是"More"菜单见 [7.4](#74-导航栏)。

**这些是自动的，不用你管：**

- 板块标题前面的**编号**（01、02……）按出现顺序自动编。
- **交替的背景色**（一块白、一块浅灰）自动按位置交替。
- **滚动到哪个板块，导航里对应的链接就高亮**（前提是板块有 `id`）。
- **统计**（第 12 节）会自动给它加上"板块被阅读"的事件。

`id` 只能用**小写英文字母、数字和短横线**。

### 7.2 删除一个板块

**手写的板块**（About、Research、Education、Experience、Skills、Contact）：

1. 在 `index.html` 里删掉整段 `<section class="section" id="…"> … </section>`。
2. 在导航栏里删掉对应的 `<a href="#…">…</a>`。
3. 完成。编号和背景色会自动重排。

**生成式板块**（News、Publications、Awards、Projects）：除了上面两步，还要**告诉构建脚本别再找它**，否则构建会报错 `index.html has no "GENERATED: xxx" block`：

1. 在 `index.html` 里删掉整段板块（包含里面的 `GENERATED` 两行注释）。
2. 删掉导航栏里的链接。
3. 打开 `tools/build.mjs`，搜 `const blocks`，把对应的一行删掉。例如删除 Projects 板块，就删 `projects: renderProjects` 这一行（注意别留下多余的逗号）。
4. 运行 `node tools/build.mjs` 确认不再报错。数据文件里对应的数据可以留着，也可以一起删。

> **只是想暂时不展示、以后还要用？不用删。** 给 `<section>` 标签加上 `hidden` 属性，并删掉（或注释掉）导航栏里对应的链接：
>
> ```html
> <section class="section" id="awards" hidden>
> ```
>
> 板块就完全不显示了（编号会自动跳过它，生成式板块也不影响构建）。以后要恢复，把 `hidden` 去掉、把导航链接加回来即可。**不要用 `<!-- -->` 去注释生成式板块**：里面的 `GENERATED` 标记本身就是注释，会把外层的注释提前截断，页面会乱。

### 7.3 调整板块顺序

在 `index.html` 里**剪切整段 `<section> … </section>`，粘贴到新位置**即可。编号、背景色自动重排。导航栏里的链接顺序是**独立**的，要顺便调整一下（[7.4](#74-导航栏)）。

### 7.4 导航栏

搜 `class="nav-links"`，导航分两部分：

- **主栏**：`<nav class="nav-links">` 里直接排着的 `<a>`，一直显示。
- **More 菜单**：`<div class="nav-more-menu" id="navMoreMenu">` 里的 `<a>`，点"More"才出现。

**想把某个链接放进主栏或拿出来，就把那一行 `<a …>…</a>` 剪切粘贴到另一部分。** 主栏放太多会挤（屏幕宽度小于 900px 时，More 菜单会自动展开成一行可以横向滚动的链接，不受影响）。目前的经验是主栏放 6 个以内。

链接可以指向本页板块（`href="#id"`）或别的页面（`href="reading.html"`）。

### 7.5 网页标题、描述、分享预览

每个页面（`index.html`、`reading.html`、`lattice.html`）的 `<head>` 里有一组 meta 标签，决定了**浏览器标签页标题、搜索结果里的描述、以及在微信/邮件/Slack 里分享链接时的预览卡片**。搜 `og:title` 就能找到。要改的是这些（每个页面各自独立）：

| 标签 | 作用 |
| --- | --- |
| `<title>` | 浏览器标签页标题，也是搜索结果的标题 |
| `<meta name="description">` | 搜索结果里的描述 |
| `og:title` / `twitter:title` | 分享预览的标题（通常和 `<title>` 一致） |
| `og:description` / `twitter:description` | 分享预览的描述 |
| `og:url` | 这个页面的正式网址 |
| `og:image` / `twitter:image` | 分享预览的图片，**必须是完整网址**（`https://dank666.github.io/images/avatar.jpg`），并且用 **JPG 或 PNG**（不要用 WebP，有的平台不显示） |

改了预览图或标题后，**微信、LinkedIn 等平台会缓存旧的预览**，可能要等一阵才刷新。

### 7.6 新增一个独立页面

最省事的办法是**复制 `reading.html` 当模板**（它有完整的顶栏、语言切换、深色模式），改名，然后逐项检查：

- [ ] `<title>`、`description`、`og:*`、`twitter:*` 都改成新页面的
- [ ] 页面底部有 `<script src="analytics.js" defer></script>`（统计才会覆盖这个页面）
- [ ] 页脚里有 `id="analyticsNote"` 那一段（统计启用时页脚说明才准确；可以照抄 `reading.html`）
- [ ] 中英文内容都成对
- [ ] 在 `sitemap.xml` 里加一条 `<url><loc>https://dank666.github.io/新页面.html</loc></url>`
- [ ] 从主页导航（主栏或 More 菜单）链到它
- [ ] 本地预览：中英文、深色模式、手机宽度、控制台无报错

---

## 8. 图片：怎么压缩、命名、放进页面

### 8.1 原则

- **格式用 WebP**（比 JPG 小三成左右，所有现代浏览器都支持）。头像和分享预览图例外，见下面。
- **宽度不超过 1400 像素，体积几百 KB 以内。** 手机拍的原图动辄几 MB，会让网站变慢。
- **文件名用小写英文、数字和短横线，要有意义**：`nextscience-home-feed.webp` 是好名字，`IMG_4911.jpeg`、`截图 2026-09-01.png` 不是。
- **不要有空格和中文。** GitHub Pages 区分大小写，`Photo.JPG` 和 `photo.jpg` 是两个文件，**大小写写错本地能看到、线上就是裂图**——所以一律小写。
- 图片放在 **`images/`** 目录。

### 8.2 命令（macOS）

```bash
# 1. 装一次转换工具
brew install webp

# 2. 如果原图很大：先把最长边缩到 1400 像素（macOS 自带 sips）
sips -Z 1400 原图.jpg --out /tmp/resized.jpg

# 3. 转成 WebP，直接输出到 images/ 并起一个有意义的名字
cwebp -q 82 -m 6 /tmp/resized.jpg -o images/my-project-screenshot.webp

# 4. 查看图片的实际尺寸（要填进数据文件的 width / height）
sips -g pixelWidth -g pixelHeight images/my-project-screenshot.webp
```

`-q 82` 是画质（0 到 100，82 基本看不出损失）。不想用命令行的话，可以用网页版 [Squoosh](https://squoosh.app/)：拖进图片，选 WebP，下载。

### 8.3 放进页面

- **项目截图 / 示意图**：路径和尺寸写进 `data/content.mjs`（[5.4](#54-projects项目经历)）：`{ src: "images/xxx.webp", alt: "文字说明", width: 1280, height: 690 }`，然后构建。
- **Notes 页、其他手写页面里的图片**：`<img src="images/xxx.webp" alt="文字说明" width="1280" height="690" loading="lazy" decoding="async">`。`loading="lazy"` 让图片滚动到附近才加载；`alt` 一定要写。

### 8.4 头像

- 头像有**两个文件**：`images/avatar.webp`（主用）和 `images/avatar.jpg`（给不支持 WebP 的老浏览器，也**用作微信/邮件里链接预览图**），是同一张照片。**换头像要两个都换。**
- 目前是 700×525（4:3）。头像显示在一个圆形框里，中间会被裁切，所以**把脸放在照片中间**。
- 命令：

```bash
# 假设新照片是 new-photo.jpg，先裁成/缩成约 700 像素宽
sips -Z 700 new-photo.jpg --out images/avatar.jpg
cwebp -q 82 images/avatar.jpg -o images/avatar.webp
sips -g pixelWidth -g pixelHeight images/avatar.jpg     # 看一下实际尺寸
```

- 如果新照片的尺寸不是 700×525，去 `index.html` 里搜 `class="avatar"`，把那个 `<img>` 的 `width`、`height` 改成实际尺寸。

### 8.5 网站图标

`favicon.svg`、`favicon.ico`、`icon-16.png`、`icon-32.png`、`apple-touch-icon.png` 都在仓库根目录，是浏览器标签页和手机主屏幕上的小图标。**换图标时保持文件名和尺寸不变**，直接覆盖就行。

### 8.6 删图

图片不用了：删掉文件，同时去数据文件或 HTML 里删掉引用它的那一行（否则线上会出现裂图）。历史里还会保留旧文件，这是正常的。

---

## 9. 简历 CV

- 把 PDF 命名为 **`CV.pdf`** 放在仓库**根目录**。主页首屏和 Contact 里的"下载简历"按钮会自动生效，不用改任何代码。
- 在 `CV.pdf` 上传之前，点按钮只会提示"简历还没有上传"，不会出现打不开的链接。
- **更新简历**：用同名的新文件覆盖旧文件，提交推送。浏览器可能缓存旧版本约 10 分钟。
- 想知道简历被点了几次：在简历 PDF 里写的个人主页链接后面加 `?ref=cv`（见[第 12 节](#12-统计goatcounter)）。

---

## 10. Notes 页（论文库和短文笔记）

`reading.html`（页面显示名称是 **Notes / 笔记**）里有两种条目：**论文**（读过的论文，每篇带自己的阅读笔记）和**短文笔记**（自己写的短文）。它们的数据都在文件里的 JavaScript 数组中，不用碰 HTML。

### 10.1 结构

在文件里搜这三个：

- `var PROJECTS = [` ——项目分类（页面上方的筛选按钮）
- `var PAPERS = [` ——论文条目
- `var NOTES = [` ——短文笔记条目

`NOTES` 里只要有一条，页面就会自动出现"全部 / 笔记 / 论文"的类型筛选；论文和笔记混排，按时间从新到旧。

### 10.2 加一篇论文

**模板：新增一篇论文**（加到 `PAPERS` 数组里）

```js
    {
      title_en: 'Paper title in English',
      title_zh: '《论文中文标题》（期刊/会议，年份）',
      authors: 'Author One, Author Two',
      year: 2026,
      venue: 'Journal or Conference Name',
      link: 'https://example.com/paper',
      project: 'agent-survey',
      topics: ['some-topic', 'another-topic'],
      note_en: 'Your own reading note in English.',
      note_zh: '你自己的中文阅读笔记。'
    },
```

- `link` 没有的话留空字符串 `''`，标题就不会变成链接。
- `project` 必须是 `PROJECTS` 里某一项的 `id`。
- `topics` 是自己起的标签，用来筛选，用英文小写加短横线。

### 10.3 加一篇短文笔记

**模板：新增一篇短文笔记**（加到 `NOTES` 数组里；文件里也有一份注释掉的模板）

```js
    {
      title_en: 'Note title',
      title_zh: '笔记标题',
      date: '2026-10',
      project: 'agent-survey',
      about: { title_en: 'Paper title', title_zh: '论文标题', link: 'https://example.com/paper' },
      topics: ['some-topic'],
      body_en: ['First paragraph.', 'Second paragraph.'],
      body_zh: ['第一段。', '第二段。']
    },
```

- `about` 是可选的：这篇笔记讲的是哪篇论文（显示成一行带链接的"关于论文"）。不需要就删掉。
- `project` 也是可选的。
- `body_en` / `body_zh` 是**字符串数组**，每个字符串是一段，段与段之间用逗号隔开。**两个数组的段数最好一样。**

### 10.4 加一个新的项目分类

先在 `PROJECTS` 里加一项，论文或笔记里才能用它的 `id`：

```js
    { id: 'new-project-id', label_en: 'Project Name', label_zh: '项目中文名' },
```

### 10.5 写 JavaScript 数据时的几个陷阱

`reading.html` 里的字符串用的是**单引号** `'…'`：

- **文字里有英文单引号（撇号）**，比如 `I've`、`Fei Hao's`，**必须写成 `\'`**：`'I\'ve read this'`；或者整个字符串改用双引号 `"I've read this"`。不处理的话，整个页面的脚本会报错、内容全部消失。
- **每一项之间要有逗号，最后一项后面的逗号可以有也可以没有。**
- 改完**一定要打开浏览器控制台**（`Cmd+Option+J`）看有没有红色报错，有的话它会指出是哪一行。

### 10.6 删除和修改

- **删除**：把整个 `{ … },` 删掉。
- **修改**：直接改里面的文字。
- **改页面顶部的介绍**（"Short notes from my research, together with…"）：搜 `class="page-header"`，那里是普通的中英文成对 HTML。

---

## 11. 概念格演示

`lattice.html` 是一个纯前端的页面：输入一个"对象×属性"的表格，实时画出经典概念格或三支概念格。**不需要后端，也不需要构建。**

- **计算部分**在 `lattice-core.js`（纯函数，不碰页面），**界面**在 `lattice.js`，**页面文字**在 `lattice.html`。
- **加一个示例表格**：在 `lattice.js` 里搜 `var PRESETS = {`，在里面加一项：

**模板：新增一个示例表格**

```js
    myexample: {
      label: ['My example', '我的例子'],
      objects: [['object A', '对象甲'], ['object B', '对象乙'], ['object C', '对象丙']],
      attrs: [['attribute 1', '属性一'], ['attribute 2', '属性二'], ['attribute 3', '属性三']],
      rows: [[0, 1], [1, 2], [0, 2]]
    },
```

  - `objects`、`attrs` 里每一项是 `[英文名, 中文名]`。
  - `rows` 里的**第 i 行**，列出**第 i 个对象具有的属性的下标（从 0 开始数）**。上面的例子里，对象甲有属性一、二，对象乙有属性二、三，对象丙有属性一、三。
  - 前面一项和这一项之间要有逗号。
- **大小限制**：表格最大 12×12、画出来的概念数上限 400，是 `lattice.js` 开头的 `MAX_OBJECTS`、`MAX_ATTRS`、`DRAW_LIMIT`。
- **页面里"三支概念"的定义**采用的是常见表述：三支概念等价于"给每个属性增加一个'否定'副本之后的概念"。如果你论文里的定义或记号不同，改 `lattice.html` 里的说明文字（搜 `lat-def`）和 `lattice-core.js` 顶部的注释。
- **改了 `lattice-core.js` 的计算逻辑之后，一定要运行测试**：`node tests/lattice-core.test.js`。它会拿一个独立的暴力算法逐项对照结果，全部通过才说明算对了（[第 15 节](#15-自动检查和测试)）。改界面和示例表格不需要测试。

---

## 12. 统计（GoatCounter）

`analytics.js` 已经启用，统计后台在 **`https://dank666.goatcounter.com`**（登录后看）。它统计页面浏览、来源，以及主页每个板块有没有被读到；**不使用 cookie，不存 IP，不收集个人信息**。

- **所有页面只加载 `analytics.js` 这一个文件**（主页、Notes、概念格演示都已经加了）。**不要**再把 GoatCounter 官方给的那段 `<script>` 贴进页面，否则每次访问会被记两次。
- **开关**：`analytics.js` 里的 `GOATCOUNTER_CODE` 就是 `.goatcounter.com` 前面那一段。改成空字符串 `''` 就**完全关闭**（页面里不会多任何东西，页脚的隐私说明也自动恢复成只提访客地图的那句）；换成别的站点就填新的代码。
- **知道谁点了哪个链接**：给你发出去的链接加上 `?ref=` 参数，GoatCounter 会把它当作来源显示：
  - 简历里的主页链接：`https://dank666.github.io/?ref=cv`
  - 邮件签名：`https://dank666.github.io/?ref=email`
  - LinkedIn：`https://dank666.github.io/?ref=linkedin`
  - **建议按"用途"分组，不要给每个收件人单独编号**，那样就成了在追踪个人。
- **把自己排除在统计之外**：在你常用的浏览器里打开一次 `https://dank666.github.io/#toggle-goatcounter`。
- **板块阅读**：主页每个板块被读到时会记一次事件，路径形如 `section/about`、`section/research`……在后台的页面列表里能看到，具体位置以你后台界面为准。
- **不会被统计的**：本地预览（localhost、局域网地址、`file://`）、开启了 Do Not Track 的访客、被你排除的浏览器。
- **注意**：和访客地图一样，**中国大陆的网络多半连不上 GoatCounter**，所以这些数据主要反映海外访问。

---

## 13. 访客地图（Cloudflare Worker）

页面底部 **Visitors** 区块在世界地图上按城市显示访问量：圆点越大越深，访问越多。只记录**城市级别**的匿名次数（经纬度取整到约 0.1°），**不存 IP，也不存 User-Agent**。

### 13.1 它是怎么工作的

- **前端** `visitors.js`：有人打开主页时，如果这个浏览器今天还没计过数，就向 Worker 发一次 `POST /hit`（`localStorage` 里的 `visitor-last-hit` 记着日期，所以**同一个浏览器每天只算一次**）；滚动到该区块时再 `GET /stats` 取数据画图。任何请求失败都是静默处理，区块显示提示文字，不影响页面其他部分。
- **后端** `visitor-worker/`（Cloudflare Worker + D1 数据库）：`POST /hit` 只接受来自 `https://dank666.github.io` 的请求；`GET /stats` 另外允许 localhost（本地预览用）。明显的爬虫（User-Agent 里有 bot、curl 等）不计数。
- **只统计线上访问**：在 localhost 或 `file://` 打开页面**不会**增加计数。
- **Worker 地址**填在 `visitors.js` 最顶部的 `API_BASE`（留空时区块显示"暂无数据"）。
- **总访问数** = 数据库里所有城市的次数之和；**国家或地区数** = 不同的国家代码个数。
- 这是"尽力而为"的统计：来源检查可以被伪造，别把它当作严格准确的数字。

### 13.2 日常维护命令

**这些命令都在 `visitor-worker/` 目录里运行**（`cd visitor-worker`），需要已登录 Cloudflare（`npx wrangler login`，登录过期了就再登一次）。

```bash
# 看数据：访问最多的 20 个城市
npx wrangler d1 execute visitor-map --remote --command "SELECT city, country, count FROM visits ORDER BY count DESC LIMIT 20"

# 看总数和国家数
npx wrangler d1 execute visitor-map --remote --command "SELECT SUM(count) AS total, COUNT(DISTINCT country) AS countries FROM visits"

# 删掉某个城市的记录（比如你自己测试时留下的）
npx wrangler d1 execute visitor-map --remote --command "DELETE FROM visits WHERE city = 'Kwai Chung' AND country = 'HK'"

# 清空全部数据（⚠️ 不可恢复）
npx wrangler d1 execute visitor-map --remote --command "DELETE FROM visits"
```

**验证 Worker 是不是活着**（在任何目录）：

```bash
curl -s https://visitor-map.dank666.workers.dev/stats -H "Origin: https://dank666.github.io"
# 应该返回 {"total":…,"countries":…,"points":[…]}
```

### 13.3 改了 Worker 代码之后

改了 `visitor-worker/src/index.js`（比如放宽或收紧来源检查）后，要**重新部署**才生效：`cd visitor-worker && npx wrangler deploy`。Worker 的地址不变。

### 13.4 从零重新部署（换账号或换库时才需要）

在 `visitor-worker/` 目录下，需要 Cloudflare 账号，都是手动执行：

1. `npx wrangler login`
2. `npx wrangler d1 create visitor-map`，把输出里的 `database_id` 填进 `wrangler.toml`
3. `npx wrangler d1 execute visitor-map --remote --file=schema.sql`
4. `npx wrangler deploy`，记下输出的 `https://visitor-map.<你的子域>.workers.dev`，填进 `visitors.js` 的 `API_BASE`，再提交推送

### 13.5 已知限制

**中国大陆的网络通常连不上 `*.workers.dev`。** 大陆访客的访问不会被记录，他们看到的 Visitors 区块是"访客地图暂时无法加载"的提示（数据库里没有数据时才显示"暂无数据"）。所以地图主要反映海外访客。要改善的话，可以给 Worker 绑定自己的域名（Cloudflare 的 Custom Domain），再把 `visitors.js` 里的 `API_BASE` 换成新域名，但这也不保证所有大陆网络都能连上；或者换成国内可访问的后端。

---

## 14. 外观：配色、字体、宽度

### 14.1 配色

**每个页面**（`index.html`、`reading.html`、`lattice.html`）的 `<style>` 开头都定义了一组颜色变量，页面上所有颜色都引用它们。搜 `--accent:`，每个页面有**三处**：

1. 浅色模式：`:root { … }`
2. 系统是深色时的默认：`@media (prefers-color-scheme: dark)` 里的 `:root:not([data-theme="light"])`
3. 手动切到深色：`:root[data-theme="dark"]`

| 变量 | 用在哪里 |
| --- | --- |
| `--bg` | 页面背景 |
| `--text` | 正文文字 |
| `--muted` | 次要文字（灰色的说明） |
| `--line` | 分隔线、边框 |
| `--accent` | 强调色（标题竖条、链接、按钮、状态标签） |
| `--accent-soft` | 强调色的浅底（交替板块的背景、方框底色） |

**改强调色**（比如把深蓝换成深绿）：把三个页面里、每个页面三处的 `--accent`（和需要的话 `--accent-soft`）都改掉，一共 9 处。深色模式下的强调色要**更亮**一些，否则在深色背景上看不清。改完在**浅色、深色两种模式下**都检查一遍。

**如果改的是背景色 `--bg`，还要检查几处"写死"的颜色**（它们不跟变量走，浅色和深色各有一套，在 `index.html` 的样式里搜 `rgba(` 就能找到）：

| 元素 | 写死颜色的规则 |
| --- | --- |
| 顶部导航栏的半透明底色 | `.navbar` 的 `background: rgba(255, 255, 255, 0.92)`，深色下是 `rgba(20, 22, 26, 0.88)` |
| 头像圆框的底色 | `.avatar-wrap`：浅色 `#f4f4f4`，深色 `#22252a` |
| 右下角"返回顶部"按钮 | `.back-to-top`：浅色 `#ffffff`，深色 `#1c1e22` |

### 14.2 字体和宽度

- **字体**：用的是系统自带字体（`font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", …`），所以加载最快。要换的话搜 `font-family`。
- **正文宽度**：`--max-width` 变量。主页是 `760px`，Notes 页和概念格演示更宽。改大了正文行就更长、更难读，一般不建议超过 820px。

### 14.3 深色模式

深色模式**基本不需要单独维护**：只要你写的样式用的是上面的变量（`var(--bg)`、`var(--accent)`…），就会自动跟随。所以**新写样式时不要写死颜色**（比如 `#ffffff`），否则深色模式下会出现刺眼的白块。上面 14.1 列出的三处是历史遗留的例外，改背景色时要单独照顾。

---

## 15. 自动检查和测试

推送到 GitHub 后，`.github/workflows/check.yml` 会自动运行（在仓库页面的 **Actions** 标签里看，名字是 "Checks"）。它**只检查，不会部署或修改任何东西**，做两件事：

1. `node tools/build.mjs --check`：确认 `index.html` 里生成的内容和 `data/content.mjs` 一致。
2. `node tests/lattice-core.test.js`：概念格算法的测试。

**红色 ✗ 怎么办：**

- 点进去看是哪一步失败。
- **"index.html is out of date"**：你改了数据没有构建（或者手改了 `GENERATED` 区块里的东西）。在本地运行 `node tools/build.mjs`，再提交推送。
- **概念格测试失败**：说明你改动的 `lattice-core.js` 算错了。在本地运行 `node tests/lattice-core.test.js` 看具体是哪一项。

**在本地运行同样的检查：**

```bash
node tools/build.mjs --check
node tests/lattice-core.test.js
```

`tests/lattice-core.test.js` 会拿一个独立的暴力算法，对几百个随机表格和边界情况逐项核对概念格算法（还核对了经典的"Living beings and water"例子应有 19 个概念），全部通过才算过。

---

## 16. 排错：出了问题看这里

| 现象 | 可能的原因 → 怎么办 |
| --- | --- |
| **推送了但线上没变** | ① 等 1 到 2 分钟；② 用 `Cmd+Shift+R` 强制刷新；③ 到仓库的 Actions 标签看有没有部署失败 |
| **本地预览没变** | 改了 `data/content.mjs` 但**忘了运行 `node tools/build.mjs`** |
| **构建报错** | 看 [5.5 报错对照表](#55-构建报错对照表) |
| **图片不显示（裂图）** | ① 路径写错；② **大小写不一致**（线上区分大小写，本地不一定）；③ 文件名里有空格或中文；④ 图片文件忘了 `git add` |
| **某段文字在一种语言下空白** | 那里只写了 `lang-en` 或 `lang-zh` 其中一份，补上另一份 |
| **Notes 页的内容全没了 / 某个功能突然失效** | `reading.html` / `lattice.js` 的 JavaScript 数据里有语法错误。打开控制台（`Cmd+Option+J`）看红色报错的行号：多半是**漏逗号**、字符串里的**撇号没转义**（`'I've'` 要写成 `'I\'ve'`）、引号没配对 |
| **手机上页面横向能滑动** | 某个元素太宽（多半是加了很宽的图或表格）。给图片加 `max-width: 100%`，或用 `images/` 里合适尺寸的图 |
| **访客地图显示"暂无数据"** | 数据库里确实没有记录（新部署时正常）；如果一直如此，检查 `visitors.js` 的 `API_BASE`，以及用 [13.2](#132-日常维护命令) 里的 `curl` 看 Worker 是否活着 |
| **访客地图显示"暂时无法加载"** | 访客的网络连不上 Worker（中国大陆网络常见，见 [13.5](#135-已知限制)） |
| **统计后台一直没有数据** | ① 是不是从 localhost 或已排除的浏览器访问的；② 是不是开了 Do Not Track；③ `analytics.js` 里的 `GOATCOUNTER_CODE` 是否为空；④ 大陆网络连不上 |
| **点"Download CV"提示还没上传** | 仓库根目录没有 `CV.pdf`，见[第 9 节](#9-简历-cv) |
| **深色模式下有刺眼的白块** | 某处样式写死了颜色。改用 `var(--bg)` 这类变量（[14.3](#143-深色模式)） |
| **`git push` 被拒绝** | `git pull --rebase` 之后再 `git push` |
| **我不知道自己现在处在什么状态** | `git status` 看有哪些未提交的改动，`git log --oneline -5` 看最近几次提交 |
| **微信里分享的预览图不对** | 平台缓存了旧预览，过一阵会刷新；确认 `og:image` 是完整网址且是 JPG/PNG |

---

## 17. 文件说明

```
.
├── index.html            主页（所有板块）。含四个由 data/content.mjs 生成的区块
├── reading.html          Notes 页：论文库 + 短文笔记（数据在文件里的 PAPERS / NOTES / PROJECTS 数组）
├── lattice.html          概念格演示的页面
├── lattice.js            概念格演示：表格编辑器、画图、示例表格 PRESETS
├── lattice-core.js       概念格演示：概念的计算（纯函数，有测试保护）
├── analytics.js          GoatCounter 统计（站点代码 GOATCOUNTER_CODE 在文件开头）
├── visitors.js           访客地图：记录一次访问、画地图（Worker 地址 API_BASE 在文件开头）
├── data/
│   └── content.mjs       News、Publications、Awards、Projects 的内容——日常最常改的文件
├── tools/
│   └── build.mjs         把 data/content.mjs 写进 index.html（node tools/build.mjs）
├── tests/
│   └── lattice-core.test.js   概念格算法的测试
├── .github/workflows/
│   └── check.yml         GitHub 上的自动检查（不部署）
├── images/               头像、项目截图（WebP；头像另有 JPG 备用）
├── vendor/               访客地图用的 D3 模块和世界地图数据（没有 CDN 依赖，详见 vendor/README.md）
├── visitor-worker/       访客地图的后端（Cloudflare Worker + D1），单独部署，不随网站发布
│   ├── src/index.js      Worker 代码
│   ├── schema.sql        数据库表结构
│   └── wrangler.toml     Worker 配置（数据库 id 不是密钥）
├── CV.pdf                （尚未添加）放进来，"下载简历"按钮就自动生效
├── favicon.svg / favicon.ico / icon-16.png / icon-32.png / apple-touch-icon.png   网站图标
├── robots.txt            给搜索引擎的抓取规则（允许全部）
├── sitemap.xml           给搜索引擎的页面清单（加新页面时要补一条）
├── LICENSE               MIT 许可（只覆盖代码，见文末）
└── README.md             就是这份文档
```

**哪些文件不要乱动：** `vendor/`（第三方代码）、`lattice-core.js`（改了要跑测试）、`tools/build.mjs`（除非你要增删生成式板块）、`.github/workflows/check.yml`。

---

## 18. 设计取舍：为什么是这样

- **纯静态、不用框架**：GitHub Pages 免费托管，没有服务器要维护，不会"过期"。没有 npm 依赖，也就没有依赖过期或安全更新的烦恼。
- **内容进数据文件、再生成静态 HTML，而不是在浏览器里用 JavaScript 渲染**：搜索引擎和 AI 阅读工具往往**不执行 JavaScript**，如果内容是脚本渲染的，它们看到的是空白的论文和项目。生成成静态 HTML 就不会有这个问题。同时数据文件强制中英文成对，避免"改了一边忘了另一边"。
- **构建脚本零依赖、只有一个文件**：不需要 `npm install`，任何装了 Node 的机器都能跑，六个月不碰也不会坏。
- **其余板块仍然手写 HTML**：它们改得很少、每段都是独特的长文字，放进数据文件反而更麻烦。
- **CI 只检查、不部署**：不改变 GitHub Pages 原有的发布方式，出错的后果最小。
- **"Last updated"由页面向服务器询问**，而不是让机器人往仓库里提交日期：不产生额外的提交，也不会让你下次推送时因为"本地落后"而被拒绝。
- **邮箱由脚本拼出来**：只能挡最简单的爬虫，但成本几乎为零。
- **中国大陆访问**：网站本身（GitHub Pages）大陆一般能打开，但访客地图和统计依赖的境外服务常常连不上，所以这两项只反映海外访问。

---

## 19. 定期维护清单

**每次更新内容后**

- [ ] 中英文都看过了，深色模式看过了，手机宽度看过了
- [ ] 控制台没有红色报错
- [ ] `node tools/build.mjs --check` 通过（改了数据的话）
- [ ] 推送后 Actions 是绿色的，线上页面强制刷新后确认

**每个月**

- [ ] 有没有新的 News 要加（拿到 offer、论文状态变化、参加活动等）
- [ ] 论文状态有没有变化（投稿 → 审稿 → 录用），有了 PDF、arXiv、代码就补上链接
- [ ] 看一眼统计后台，了解谁在看、从哪里来

**每个学期 / 每年**

- [ ] Education 里的"预计毕业时间"、Experience 里的时间是否还准确
- [ ] 页脚的版权年份
- [ ] CV.pdf 是否是最新版
- [ ] 主页上所有外部链接（导师主页、学校主页、论文链接）是否还能打开
- [ ] 研究陈述、About 里的描述是否和你现在的研究方向一致
- [ ] 项目描述里"进行中 / 已结束 / 未完成"的状态是否准确
- [ ] 访客地图：Worker 还活着吗（[13.2](#132-日常维护命令) 的 `curl`）；Cloudflare 登录过期了就 `npx wrangler login`
- [ ] Node 版本：偶尔 `node -v`，低于 20 就升级

---

## License

The **code** in this repository (HTML, CSS, and JavaScript) is licensed under the [MIT License](LICENSE) — feel free to use it as a reference or starting point for your own site.

The **written content, personal photos, and project images** are not covered by that license. All rights to that material are reserved by Tejing Wang; please don't reuse the bio text, research statement, or images without permission.

Contact: see the [Contact section of the website](https://dank666.github.io/#contact) · GitHub: [@dank666](https://github.com/dank666)
