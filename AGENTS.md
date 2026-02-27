# Varhanici Data Agent

## Purpose

Manage source data (`varhanici-data.json`) and web templates for site varhanici.eu. The webpage is a recommander of Czech Catholic liturgical songs.

Structure:

```json
[
  {
    "liturgicky_den": string,
    "doporucene_pisne": string[],
    "komentar": string
  }
]
```
