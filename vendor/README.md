# vendor/

Third-party files used by the visitor map (`visitors.js`), copied here so the site doesn't depend on any CDN at runtime. Nothing here is built or modified.

| File | Source | Version | License |
| --- | --- | --- | --- |
| `d3-array.min.js` | [d3-array](https://github.com/d3/d3-array) | 3.2.4 | ISC |
| `d3-geo.min.js` | [d3-geo](https://github.com/d3/d3-geo) | 3.1.1 | ISC |
| `topojson-client.min.js` | [topojson-client](https://github.com/topojson/topojson-client) | 3.1.0 | ISC |
| `countries-110m.json` | [world-atlas](https://github.com/topojson/world-atlas) (derived from [Natural Earth](https://www.naturalearthdata.com/), public domain) | 2.0.2 | ISC |

To update one, download the file from the same path on jsDelivr, e.g.:

```bash
curl -fsSL https://cdn.jsdelivr.net/npm/d3-geo@3.1.1/dist/d3-geo.min.js -o d3-geo.min.js
```

`d3-geo` needs `d3-array` loaded first (its UMD build reads it from the shared `d3` global); `visitors.js` handles the order.
