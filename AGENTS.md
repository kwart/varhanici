# Varhanici Data Agent

## Purpose

Manage source data (`varhanici-data.json`) and web templates for site varhanici.eu. The webpage is a recommender of Czech Catholic liturgical songs for church organists.

## Project Files

| File | Role |
|------|------|
| `varhanici-data.json` | Main database — 231 liturgical day entries |
| `template.html` | Single-page app template (HTML + CSS + JS) |
| `public/organ.jpg` | Background image |
| `public/CNAME` | Custom domain config (`varhanici.eu`) |
| `.github/workflows/deploy.yml` | GitHub Actions build & deploy pipeline |

## Data Schema

```json
[
  {
    "liturgicky_den": "MM-DD Czech name of liturgical day",
    "doporucene_pisne": ["string song IDs"],
    "komentar": "string with liturgical guidance in Czech"
  }
]
```

### Data Conventions

- **`liturgicky_den`**: `MM-DD` date prefix followed by Czech name (e.g. `"01-01 Slavnost Matky Boží, Panny Marie"`)
- **`doporucene_pisne`**: Array of **string** IDs (not numbers) — each references a song at `https://kancional.cz/{id}`
- **`komentar`**: Single string with liturgical guidance for the organist
- All content is in **Czech**
- Entries are sorted by date

## Build & Deployment

Pushes to `main` auto-deploy to GitHub Pages at `varhanici.eu`.

Build steps (in GitHub Actions):
1. `jq -c` minifies `varhanici-data.json`
2. `awk` replaces the `__JSON_DATA__` placeholder in `template.html` to produce `public/index.html`
3. Deploys `public/` to `gh-pages` branch

**Important**: The `__JSON_DATA__` placeholder in `template.html` must be preserved — it is replaced at build time.

## External Dependencies

- **Fuse.js 6.6.2** — client-side fuzzy search, loaded from CDN (`threshold: 0.35`)
- **kancional.cz** — song detail links (`https://kancional.cz/{songNumber}`)

## Common Tasks

The most frequent contribution is editing `varhanici-data.json` — adding entries, correcting song lists, or fixing comments. Template changes are rare.
