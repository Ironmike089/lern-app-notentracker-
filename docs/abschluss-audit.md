# Abschluss-Audit — Lückenschluss & Löschfunktion

Dieses Dokument protokolliert die letzte Bearbeitungsrunde: den Abschluss
aller zuvor selbst identifizierten Lücken gegenüber dem ursprünglichen
Auftrag, die Vereinfachung der Konto-Löschfunktion und die abschließende
technische Verifikation vor dem Deployment auf GitHub Pages.

## Umgesetzte Punkte

| # | Punkt | Umsetzung |
|---|---|---|
| 1 | Löschfunktion vereinfachen | Kein Pflicht-Tippfeld ("LÖSCHEN") mehr. Einstellungen → **Konto löschen** → Sicherheitsabfrage ("Konto wirklich löschen?") → **Ja, löschen**. |
| 2 | Abi-Prognose auf dem Haupt-Dashboard | Unter der Haupt-Gauge erscheint bei Oberstufenschüler:innen mit verifizierten Regeln (aktuell nur Bayern) eine Zeile "Abi-Prognose: X / Y P.", berechnet mit dem bereits bestehenden `abiProjectionService` im Modus `currentAverage`. |
| 3 | Notengruppen-UI kompakter | Kategorien werden als kompakte Zeile (Name · Gewichtung · Chevron) dargestellt; Bearbeitung (Umbenennen, Art, Gewichtung, Aktiv/Inaktiv, Reihenfolge, Löschen) öffnet sich in einem Detail-Sheet statt alles inline aufzublähen. |
| 4 | `CategoryType` um „Projektarbeit“ erweitert | Neuer Wert `'project'` in `domain/types.ts` und `CATEGORY_TYPE_LABEL`; `analyticsService` entsprechend nachgezogen (TypeScript hat die fehlende Stelle beim Kompilieren selbst aufgedeckt). |
| 5 | Gauge-Geometrie testbar gemacht | Reine Geometrie-Funktionen aus `PerformanceGauge` nach `domain/gauge.ts` extrahiert, 15 Unit-Tests (Winkel-Grenzen, Clamping, exakte Spec-Werte für Noten- und Punkte-Skala, Bogen-Geometrie). |
| 6 | Regressionstest „Fächerliste bleibt einspaltig“ | Da keine Komponenten-Render-Testinfrastruktur existiert (Vitest läuft im `node`-Environment ohne jsdom/RTL), prüft ein Quellcode-Scan-Test (`subjectListLayout.test.ts`), dass in keiner der Fächerlisten-Ansichten ein mehrspaltiges Grid (`grid-cols-2` o. Ä.) wieder auftaucht. |
| 7 | Einstellungen in Gruppen strukturiert | `MorePage` ist jetzt in vier klar beschriftete Gruppen gegliedert: Allgemein, Schule, Daten & Konto, Info — ohne neue, nicht existierende Einstellungen zu erfinden. |
| 8 | Abi-Simulator-Modi | Auf ausdrücklichen Wunsch unverändert gelassen (keine Umbenennung in „Konservativ/Realistisch/Optimistisch“). |

Nicht angetastet, weiterhin bewusst zurückgestellt: die Entscheidung
Import/Export (Optionen A–E) — dazu folgt eine erneute Nachfrage, siehe
„Offene Punkte" unten.

## E2E-Verifikation (Playwright gegen den laufenden Dev-Server)

Alle Szenarien wurden gegen `http://localhost:5173/lern-app-notentracker-/`
mit Chromium (`/opt/pw-browsers/chromium`) durchgespielt, jeweils mit
Konsolenfehler-Zählung (`pageerror` + `console.error`):

| Szenario | Ergebnis |
|---|---|
| Realschule, NRW, Klasse 8 | Abi-Dashboard-Karte **nicht** sichtbar, Abitur-Settings-Sektion **nicht** sichtbar, 0 Konsolenfehler. |
| Gymnasium vor der Oberstufe, NRW, Klasse 8 | Abi-UI korrekt ausgeblendet, 0 Konsolenfehler. |
| Gymnasium Oberstufe, aber anderes Bundesland (NRW statt Bayern) | Abi-UI korrekt ausgeblendet (keine verifizierten Regeln für NRW), 0 Konsolenfehler. |
| Gymnasium Oberstufe Bayern, Notendaten + Abi-Setup-Wizard | Voller Fluss (Onboarding → Noteneingabe → Abi-Setup → Dashboard-Prognose → Analyse-Impact-Abschnitt) funktioniert, Ergebnisse von Hand nachgerechnet und bestätigt. |
| Konto löschen (vereinfachter Dialog) | „Ja, löschen"-Button ist sofort aktiv (kein Pflichttext mehr nötig). `deleteAllData()` leert alle IndexedDB-Tabellen nachweislich vollständig (`userSettings`, `schoolProfiles`, `subjects` etc. je `[]` direkt nach dem Löschvorgang). Eine anschließende Navigation auf `#/app/more` leitet korrekt auf `#/onboarding` um und zeigt den Willkommens-Screen — die Löschlogik (`deleteAllData` + `RequireOnboarding`-Guard) funktioniert nachweislich end-to-end. |

### Hinweis zum automatischen Reload nach dem Löschen

Die App löst nach dem Löschen `window.location.reload()` aus, um sicher in
einen komplett frischen Zustand zu starten. In dieser sandboxten
Playwright-Testumgebung hängt `window.location.reload()` (und ebenso
Playwrights eigenes `page.reload()`) nach dem Neustart dauerhaft im
Ladezustand — reproduzierbar **auch** bei einem bloßen `goto()` gefolgt von
einem Reload ganz ohne App-Code, sowie identisch gegen den fertigen
Produktions-Build (`vite preview`, kein Dev-Server involviert). Das ist ein
Artefakt dieser konkreten Sandbox/Browser-Automatisierung, keine Regression
der App: Die eigentliche Lösch- und Weiterleitungslogik wurde — wie oben
beschrieben — unabhängig vom `reload()`-Aufruf direkt verifiziert (IndexedDB
leer, `RequireOnboarding` leitet korrekt um). Im echten Browser des Nutzers
funktioniert `location.reload()` normal.

## Technische Abschlussprüfung

- `npx tsc -b` — sauber, keine Fehler.
- `npx oxlint .` — sauber, keine Findings.
- `npx vitest run` — 189/189 Tests bestanden (12 Testdateien).
- `npm run build` — erfolgreich, PWA-Service-Worker generiert.

## Offene Punkte

- **Import/Export (Optionen A–E)**: Diese Entscheidung liegt weiterhin bei
  dir. Da jetzt alles aus dem letzten Prompt umgesetzt ist, folgt dazu noch
  einmal eine gezielte Nachfrage.
