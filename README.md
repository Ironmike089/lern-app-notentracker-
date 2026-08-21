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
  domain/       reine Typen & Konstanten + die Grade Engine (Entities, Bundesländer, Schularten, Fächerkatalog, grading.ts)
  storage/      Dexie-Schema + generischer Repository-Layer
  services/     Orchestrierung von Storage-Zugriffen (Onboarding, Schuljahr, Kategorien, Noteneinträge, Fach-Statistiken)
  components/   wiederverwendbare UI-Bausteine (Button, Card, Sheet, Toast, PerformanceBar, …)
  features/     Screens/Flows (Onboarding, Dashboard, App-Shell, Fachdetail, Notenverwaltung)
  app/          Routing-Glue (RootGate, OnboardingRoute)
```

Die Berechnungs-Engine (`domain/grading.ts`) ist bewusst frei von UI- und Storage-Code, unit-getestet (`*.test.ts`, Vitest) und bildet die Hierarchie categoryAverage → subjectAverage → overallAverage nach. Sie erkennt automatisch, wenn Einträge unterschiedlicher Bewertungssysteme (Noten 1–6 vs. Punkte 0–15) nicht sinnvoll gemischt werden dürfen, statt einen irreführenden Schnitt zu berechnen.

## Entwicklung

```bash
npm install
npm run dev
```

## Build & Checks

```bash
npm run build   # tsc -b && vite build
npm run lint     # oxlint
npm run test     # vitest run — v. a. die Grade Engine
```

## Deployment (GitHub Pages)

Der Workflow `.github/workflows/deploy-pages.yml` baut die App bei jedem Push auf `main` und deployt sie automatisch über GitHub Pages (`actions/deploy-pages`).

Einmalig in den Repo-Einstellungen aktivieren: **Settings → Pages → Source: GitHub Actions**.

Die App ist danach erreichbar unter:
`https://<github-username>.github.io/lern-app-notentracker-/`

Der Vite `base`-Pfad in `vite.config.ts` ist fest auf `/lern-app-notentracker-/` gesetzt (passend zum Repo-Namen). Bei einem Repo-Umzug muss dieser Pfad mit angepasst werden.
