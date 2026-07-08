# job_seeker_ro_spider — GUSTURI DIVINE S.R.L. Scraper

[![Oportunitati SI Cariere](https://github.com/sebiboga/gusturi-divine-srl-nodejs-scraper/actions/workflows/job-seeker-ro-spider.yml/badge.svg)](https://github.com/sebiboga/gusturi-divine-srl-nodejs-scraper/actions/workflows/job-seeker-ro-spider.yml)
[![Automation Tests](https://github.com/sebiboga/gusturi-divine-srl-nodejs-scraper/actions/workflows/automation-testing.yml/badge.svg)](https://github.com/sebiboga/gusturi-divine-srl-nodejs-scraper/actions/workflows/automation-testing.yml)

[![Version](https://img.shields.io/github/package-json/v/sebiboga/gusturi-divine-srl-nodejs-scraper?label=version&color=blue)](CHANGELOG.md)
[![Test Results](https://img.shields.io/badge/test--results-HTML-9b59b6)](https://sebiboga.github.io/gusturi-divine-srl-nodejs-scraper/test-results/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![JavaScript](https://img.shields.io/badge/javascript-ESM-F7DF1E?logo=javascript&logoColor=black)](https://ecma-international.org/)
[![Node.js](https://img.shields.io/badge/node-24-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Website](https://img.shields.io/website?url=https%3A%2F%2Fpeviitor.ro&label=peviitor.ro)](https://peviitor.ro)
[![API](https://img.shields.io/website?url=https%3A%2F%2Fapi.peviitor.ro%2F&label=api.peviitor.ro)](https://api.peviitor.ro/)
[![SOLR](https://img.shields.io/website?url=https%3A%2F%2Fsolr.peviitor.ro%2Fsolr%2F&label=solr.peviitor.ro)](https://solr.peviitor.ro/solr/)
[![GitHub Pages](https://img.shields.io/github/deployments/sebiboga/gusturi-divine-srl-nodejs-scraper/github-pages?label=GitHub%20Pages)](https://sebiboga.github.io/gusturi-divine-srl-nodejs-scraper/)

**job_seeker_ro_spider** — un scraper pentru job-urile GUSTURI DIVINE S.R.L. din România. Extrage anunțurile de pe [ANOFM](https://www.anofm.ro) și le publică în [peviitor.ro](https://peviitor.ro) prin API-ul SOLR.

> **Derivat din:** [EPAM Systems International SRL Node.js Scraper](https://github.com/sebiboga/epam-systems-international-srl-nodejs-scraper) — șablonul de referință pentru scraper-ele Node.js din ecosistemul peviitor.ro.

## Overview

Proiectul automatizează colectarea zilnică a job-urilor GUSTURI DIVINE S.R.L. din România, menținând board-ul peviitor.ro la zi cu cele mai recente oportunități de carieră.

## Features

- **ANOFM API**: Queries job listings by company CIF
- **ANAF Validation**: Validates company existence and status before scraping
- **SOLR Storage**: Stores job data for peviitor.ro
- **Automated CI**: Daily scheduled scraping via GitHub Actions
- **Multi-layer tests**: Unit, integration, E2E, consistency

## Quick Start

```bash
# Install dependencies
npm install

# Run the scraper (test mode — single page)
npm run scrape -- --test

# Run all tests
npm test
```

## How It Works

```mermaid
flowchart TD
    A[GitHub Actions: Daily 6 AM] --> B[ANAF Company Validation]
    B --> C{Company Active?}
    C -->|Yes| D[Scrape ANOFM API by CIF]
    C -->|No| E[Delete jobs from SOLR]
    D --> F[Transform to Job Model]
    F --> G[Upsert to SOLR]
    G --> H[Generate docs/jobs.md]
    H --> I[Run Tests]
    I --> J[Push results to docs/]
```

## ANOFM API

The scraper uses the public ANOFM API:

```
POST https://mediere.anofm.ro/api/entity/vw_public_job_posting
```

With payload:
```json
{
  "current": 1,
  "rowCount": 250,
  "sort": { "created_at": "desc" },
  "employer_tax_code": "<CIF>"
}
```

## Project Structure

```
├── index.js                 # Main scraper entry point
├── company.js               # Company validation (ANAF)
├── solr.js                  # SOLR database operations
├── config/
│   └── company.json         # Single source of truth for company identity
├── src/
│   ├── anaf.js              # ANAF API client
│   ├── markdown-generator.js # Job markdown generator
│   └── job-validator.js     # URL validation
├── tests/
│   ├── unit/                # Unit tests
│   ├── integration/         # Integration tests
│   ├── e2e/                 # End-to-end tests
│   └── consistency/         # Repository consistency tests
├── docs/
│   ├── index.html           # GitHub Pages job board
│   ├── company.json         # Company config for HTML page
│   └── jobs.md              # Generated job listings
└── .github/workflows/
    ├── job-seeker-ro-spider.yml     # Main scraping workflow
    └── automation-testing.yml       # Test automation workflow
```

## Testing

```bash
# Run all tests
npm test

# Test categories:
npm run test:unit          # Unit tests (fast, no external deps)
npm run test:integration   # Integration tests (ANAF/SOLR)
npm run test:e2e           # E2E tests (full pipeline)
npm run test:consistency   # Repository consistency checks
```

## License

MIT — see [LICENSE](LICENSE).
