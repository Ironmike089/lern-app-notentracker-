# Notentracker

Ein moderner, local-first Notentracker für deutsche weiterführende Schulen — React, TypeScript, Tailwind CSS und Dexie (IndexedDB).

## Tech-Stack

- React 19 + TypeScript, gebaut mit Vite
- Tailwind CSS v4 für Styling
- Dexie (IndexedDB) für local-first Persistenz
- react-router-dom (HashRouter, damit Deep-Links auf GitHub Pages ohne Server-Rewrites funktionieren)
- vite-plugin-pwa für Installierbarkeit als PWA

## Struktur

```
src/
  domain/       reine Typen & Konstanten (Entities, Bundesländer, Schularten, Fächerkatalog, Notenlogik)
  storage/      Dexie-Schema + generischer Repository-Layer
  services/     Orchestrierung von Storage-Zugriffen (Onboarding, Schuljahr)
  components/   wiederverwendbare UI-Bausteine (Button, Card, Toast, …)
  features/     Screens/Flows (Onboarding, Dashboard, App-Shell)
  app/          Routing-Glue (RootGate, OnboardingRoute)
```

Berechnungslogik (`domain/grading.ts`) ist bewusst frei von UI- und Storage-Code und unabhängig testbar.

## Entwicklung

```bash
npm install
npm run dev
```

## Build & Checks

```bash
npm run build   # tsc -b && vite build
npm run lint     # oxlint
```

## Deployment (GitHub Pages)

Der Workflow `.github/workflows/deploy-pages.yml` baut die App bei jedem Push auf `main` und deployt sie automatisch über GitHub Pages (`actions/deploy-pages`).

Einmalig in den Repo-Einstellungen aktivieren: **Settings → Pages → Source: GitHub Actions**.

Die App ist danach erreichbar unter:
`https://<github-username>.github.io/lern-app-notentracker-/`

Der Vite `base`-Pfad in `vite.config.ts` ist fest auf `/lern-app-notentracker-/` gesetzt (passend zum Repo-Namen). Bei einem Repo-Umzug muss dieser Pfad mit angepasst werden.
