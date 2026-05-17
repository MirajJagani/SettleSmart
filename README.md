# SettleSmart

SettleSmart is a static web prototype that helps international students explore Australian suburbs with more clarity, confidence, and belonging. The experience guides users through a 7-step onboarding flow, generates a shortlist of suburb matches, and lets them inspect a detailed suburb profile with community, safety, and nearby-facility information. The current build is protected by a preview password gate on the landing page.

## What the project does

- Collects user preferences through a guided onboarding flow
- Saves answers in the browser using `localStorage`
- Generates a suburb shortlist using a balanced priority score across rent, housing, commute, lifestyle, language, culture, and university access
- Shows a detailed suburb page with a 7-priority match grid
- Includes a shortlist spin wheel to help users choose which suburb to inspect first
- Supports Epic 7 side-by-side suburb comparison with Compare + buttons and a custom suburb search/dropdown
- Provides nearby-facility exploration with a mini map and safety/risk information

## Main pages

### `index.html`
Landing page and 7-step onboarding flow. This page loads `script.js`, which manages the preview password gate, onboarding steps, progress UI, and saving preferences for the rest of the site.

### `results.html`
Shortlist and suburb comparison page. This page loads `suburb-data.js` and `results.js`, then ranks suburbs, renders the hero summary, suburb cards, Epic 7 comparison panel, custom suburb selector, and shortlist spin wheel.

### `suburb.html`
Suburb profile page. This page loads `suburb-data.js`, `Chart.js`, and `suburb.js` to render the suburb explanation, community snapshot, map, risk summary, and safety indicator.

## Tech stack

- HTML5
- CSS3
- Vanilla JavaScript
- Bootstrap 5.3.6
- Chart.js
- Leaflet / OpenStreetMap services for the mini map experience
- Browser storage (`localStorage` and `sessionStorage`)

## Project structure

```text
SettleSmart/
├── index.html          # Landing page + onboarding flow
├── script.js           # Onboarding logic and preview access gate
├── results.html        # Shortlist page
├── results.js          # Ranking, filters, pagination, and spin wheel
├── suburb.html         # Suburb detail page shell
├── suburb.js           # Suburb detail rendering, map, risk, and safety logic
├── suburb-data.js      # Static suburb dataset + reusable scoring helpers
├── style.css           # Shared design system and page styling
├── img/                # Branding assets and icons
└── README.md           # Project overview and developer guide
```

## How the app works

1. The user opens `index.html` and passes the preview access gate.
2. `script.js` collects city, language, culture, university, budget, housing, commute, and lifestyle preferences.
3. Preferences are saved into `localStorage` under `settlesmart_preferences`.
4. `results.html` loads the saved preferences and uses helpers from `suburb-data.js` to rank suburbs.
5. `results.js` renders the top match, additional suburb cards, filters, pagination, side-by-side comparison, and spin wheel.
6. Compare selections stay temporary for the current results visit and are cleared when the user refreshes/reopens the site or returns home to refine answers.
7. When a suburb card is opened, `suburb.html` reads the selected `slug` and `suburb.js` builds the detailed suburb profile.

## Scoring model summary

The app currently uses a static, client-side scoring approach:

- **Overall fit:** balanced score from rent, housing, commute, lifestyle, language, culture, and university access, with penalties for weak selected priorities so the top match is strong across more aspects
- **Community mode:** emphasises language match, cultural background match, community signals, and overall balance
- **University mode:** emphasises the selected university access score while still rewarding overall priority balance

These helpers live in `suburb-data.js`, so any future developer who changes the ranking logic should start there.

## Data notes

The current prototype uses a large static suburb dataset in `suburb-data.js`. It contains:

- suburb profile data
- language and cultural signals
- rent ranges and housing cues
- university access levels
- safety and crime trend data

This keeps the prototype simple for local testing, but the project can later be migrated to a live backend such as Supabase.

## Local development

Because this is a static frontend, you can run it with any local web server.

### Option 1: VS Code Live Server
Open the project folder in VS Code and launch `index.html` with Live Server.

### Option 2: Python local server
```bash
python -m http.server 5500
```
Then open `http://localhost:5500/index.html`.

## Deployment

The project is structured to work well with static hosting platforms such as Vercel. If you deploy it publicly, review these items first:

- update or remove the preview password gate in `script.js`
- confirm external image URLs are still valid
- test `localStorage`-based flows on desktop and mobile
- verify map and geocoding requests behave correctly in the deployment environment

## Developer handover notes

If you are new to this codebase, start here:

1. Read `script.js` to understand the onboarding flow and saved preference structure.
2. Read `suburb-data.js` to understand the scoring helpers and suburb dataset.
3. Read `results.js` to understand shortlist ranking, filters, and pagination.
4. Read `suburb.js` to understand the suburb detail page, mini map, and safety/risk logic.

The JavaScript files now include function-level comments to make handover easier.

## Future improvements

- move suburb data from the static file into Supabase or another live database
- replace heuristic scoring with validated data-driven weights
- improve map accuracy and facility filtering performance
- add stronger accessibility checks and keyboard interactions
- separate large data and helper logic into smaller modules for maintainability

## Current status

This repository contains the Iteration 3 frontend prototype for SettleSmart, including the guided onboarding flow, suburb shortlist, suburb profile experience, Epic 7 suburb comparison, custom comparison search, temporary comparison selection reset, and balanced top-match ranking logic. The current build is suitable for demonstration, further UI refinement, and future backend/data integration work.
