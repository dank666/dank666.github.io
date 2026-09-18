# Tejing Wang — Personal Website

Live at **[dank666.github.io](https://dank666.github.io)**

我的个人学术主页，用于展示教育背景、科研经历、项目与论文，主要面向未来的博士申请。

A personal academic homepage for **Tejing Wang (王特警)** — AI student at Shaanxi Normal University, School of Artificial Intelligence and Computer Science. Built to support future PhD applications abroad.

## Features

- **Bilingual (EN / 中文)** — one-click language toggle in the nav bar; the choice is remembered across pages via `localStorage`
- **Sections** — News, About, Research Statement, Education, Experience, Projects, Publications, Skills, Awards, Contact
- **Scroll-spy navigation** — the nav link for whichever section is currently in view is highlighted automatically as you scroll
- **Project image galleries** — project cards can include a thumbnail grid; clicking a thumbnail opens it full-size in a lightbox overlay
- **Reading Library** (`reading.html`) — a separate, growing library of papers read during research, organized by project and topic, with searchable/filterable notes
- **Collapsible News feed** — only the most recent updates show by default; older entries expand on demand
- **CV download** — a "Download CV" link (hero and Contact section) points at `CV.pdf`; if that file doesn't exist yet, clicking it shows a friendly "not uploaded yet" notice instead of a broken link. Once `CV.pdf` is added to the repo root, the button starts working automatically — no code changes needed.
- **Social link previews** — Open Graph and Twitter Card meta tags on both pages, so sharing the link in email/Slack/WeChat shows a title, description, and preview image instead of a bare URL
- **Favicon** — a "TW" monogram icon (SVG + PNG/ICO fallbacks) shown in browser tabs and bookmarks
- **Footer with last-updated date and source link** — a small "Last updated" line plus a link back to this repository
- Sticky nav, back-to-top button, responsive down to mobile, reduced-motion support

## Tech stack

Plain **HTML / CSS / vanilla JavaScript** — no framework, no build step, no dependencies. Chosen deliberately to keep the site easy to hand-edit and cheap to host on GitHub Pages.

## Project structure

```
.
├── index.html            # main homepage (all sections)
├── reading.html          # reading library subpage
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

## Updating content

- **General content** (About, Education, Experience, etc.): edit the `lang-en` / `lang-zh` paragraph pairs directly in `index.html`. Every translatable element has both language versions in the markup; the CSS shows/hides them based on the `data-lang` attribute on `<html>`.
- **Projects & image galleries**: each project card is a `.card` inside the Projects section. To add a gallery, drop a `.project-gallery` div with `<img>` tags inside the card (see the NextScience or Embodied Cell cards for the pattern) — the lightbox click behavior is wired up automatically for any image inside `.project-gallery`, no extra JS needed per image.
- **Reading Library**: add new papers by appending an entry to the `PAPERS` array near the bottom of `reading.html` — no HTML editing needed. Each entry needs `title_en`/`title_zh`, `authors`, `year`, `project`, `topics`, and `note_en`/`note_zh`.
- **News**: add new items to the top of the `.timeline` in the News section of `index.html`; move older ones into the `#newsMore` block so they collapse under "Show earlier updates."
- **Publications**: once a paper has a preprint/DOI link, wrap its title text in `<a href="LINK" target="_blank">…</a>` — there's an HTML comment above each entry marking where to do this.
- **CV**: add a file named `CV.pdf` to the repo root. The "Download CV" links in the hero and Contact section will pick it up automatically.
- **Footer "Last updated" date**: this is a manually written line in the `<footer>` of `index.html` — update the month/year there after any content change (GitHub Pages doesn't expose commit timestamps to the page, so it isn't automated).

## Running locally

No build step required — just open `index.html` in a browser, or serve the folder with any static file server, e.g.:

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
