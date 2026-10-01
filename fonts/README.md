# fonts/

The two typefaces the site uses for Latin text, copied here so nothing is loaded from Google Fonts (which is unreachable from mainland China). Nothing here is built or modified. Chinese text uses no web font at all: it falls back to the system fonts named in `--font-body` and `--font-display`.

| File | Typeface | Used for | Source | Version | License |
| --- | --- | --- | --- | --- | --- |
| `inter-latin-wght-normal.woff2` | [Inter](https://github.com/rsms/inter), variable weight 100–900 | Body text and everything small (`--font-body`) | [`@fontsource-variable/inter`](https://www.npmjs.com/package/@fontsource-variable/inter) | 5.3.0 | SIL OFL 1.1 (`OFL-Inter.txt`) |
| `eb-garamond-latin-wght-normal.woff2` | [EB Garamond](https://github.com/octaviopardo/EBGaramond12), variable weight 400–800 | Headings of 22px and up (`--font-display`) | [`@fontsource-variable/eb-garamond`](https://www.npmjs.com/package/@fontsource-variable/eb-garamond) | 5.3.0 | SIL OFL 1.1 (`OFL-EBGaramond.txt`) |
| `eb-garamond-latin-500-italic.woff2` | EB Garamond Italic, weight 500 only | Venue names in the paper lists and the marked sentence of the research statement, nothing else | [`@fontsource/eb-garamond`](https://www.npmjs.com/package/@fontsource/eb-garamond) | 5.3.0 | SIL OFL 1.1 (`OFL-EBGaramond.txt`) |

All are the `latin` subset only (the `unicode-range` in each page's `@font-face` lists exactly what it covers). The two upright files are variable fonts: one file each, smaller than the separate static weights it replaces, covering every weight the pages use. The italic is a single static weight, since only one is needed, and is declared only on the two pages that use it (`index.html`, `reading.html`). Inter has no italic file: where Inter text is italic, the browser slants the upright. Chinese text is never italic.

To update one, download the same file from jsDelivr and overwrite it, e.g.:

```bash
curl -fsSL https://cdn.jsdelivr.net/npm/@fontsource-variable/inter@5.3.0/files/inter-latin-wght-normal.woff2 -o inter-latin-wght-normal.woff2
```

The `@font-face` rules and the `<link rel="preload">` for Inter are repeated at the top of each of the four pages; a renamed file has to be changed in all of them. For the static italic the path on jsDelivr is `@fontsource/eb-garamond@5.3.0/files/eb-garamond-latin-500-italic.woff2`.
