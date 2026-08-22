# Abitur-Regelwerk-Audit

Dieses Dokument protokolliert, welche Abitur-/Oberstufenregeln pro Bundesland
recherchiert, gegen offizielle Quellen geprüft und in der App implementiert
wurden. Nichts hier wird "aus dem Gedächtnis" behauptet — jede Zahl trägt
eine Quelle. Wo eine Quelle fehlt oder nicht zugänglich war, steht das
Feld explizit auf **unverifiziert**, und die App berechnet dafür nichts.

## Wichtige Einschränkung dieser Recherche

Die Recherche für dieses Audit wurde ausschließlich über die `WebSearch`-Suche
durchgeführt. Der `WebFetch`-Zugriff auf externe Domains (inklusive
`gymnasiale-oberstufe.bayern.de`, `gesetze-bayern.de`, `kmk.org` und sogar
`wikipedia.org`) ist in dieser Ausführungsumgebung durch den Netzwerk-Egress-
Proxy blockiert — es konnte keine einzige Primärquelle als Volltext geladen
werden. Alle Fakten unten stammen aus den von `WebSearch` zurückgegebenen,
mit Quell-URL versehenen Zusammenfassungen offizieller Seiten
(`gymnasiale-oberstufe.bayern.de`, `oberstufe.bayern.de` — beide Angebote des
Bayerischen Staatsministeriums für Unterricht und Kultus / ISB — sowie
`kmk.org`, die Kultusministerkonferenz selbst).

Diese Zusammenfassungen wurden nur dann als "verifiziert" übernommen, wenn
dieselbe Zahl in mindestens zwei unabhängigen Suchanfragen konsistent aus
derselben amtlichen Domain bestätigt wurde. Eine explizit gegengeprüfte
kommerzielle Quelle (ein "Abi-Rechner"-Portal) lieferte für die
Punkte→Noten-Umrechnung eine intern widersprüchliche Formel (siehe Bayern,
Punkt "Notenumrechnung") — genau das Szenario, vor dem die Aufgabenstellung
warnt. Diese Quelle wurde verworfen, die Umrechnung bleibt entsprechend
unverifiziert.

**Konsequenz für den Umfang**: Eine vollständige, feldweise Verifikation
aller 16 Bundesländer (wie in Abschnitt 21 des Auftrags gefordert) ist mit
den in dieser Umgebung verfügbaren Werkzeugen nicht seriös möglich — das
würde den Primärquellen-Volltext von 16 Kultusministerien erfordern. Diese
Version implementiert daher **ausschließlich Bayern** mit echter,
mehrfach bestätigter Quellenlage. Die übrigen 15 Länder sind als
architektonisch vollständige, aber bewusst leere `verified: false`-Stubs
angelegt — exakt die Honest-Failure-Architektur, die im Projekt bereits vor
diesem Schritt existierte (`domain/abiturRules.ts`, leeres Array). Für sie
gilt weiterhin der neutrale "Oberstufen-Punktetracker"-Hinweis statt einer
berechneten Abiturnote.

---

## Bayern (BY)

| Feld | Wert |
|---|---|
| Bundesland | Bayern |
| Abkürzung | BY |
| Schulart | Gymnasium (G9) |
| Gültiger Abiturjahrgang (dieser Config) | ab 2027 (erster vollständiger G9-Abiturjahrgang) |
| Rule-Version | `BY_GYM_2027_V1` |
| Status | `verified: true` (mit expliziten Einzel-Vorbehalten, siehe unten) |
| Datum der Recherche | 2026-08-22 |

### Offizielle Quellen (via WebSearch-Zusammenfassung, kein WebFetch-Volltext möglich)

- Gymnasiale Oberstufe in Bayern — Qualifikationssystem, Allgemeines:
  https://www.gymnasiale-oberstufe.bayern.de/qualifikationssystem/allgemeines
- Gymnasiale Oberstufe in Bayern — Halbjahresleistungen:
  https://www.gymnasiale-oberstufe.bayern.de/qualifikationssystem/halbjahresleistungen
- Gymnasiale Oberstufe in Bayern — Leistungsnachweise:
  https://www.gymnasiale-oberstufe.bayern.de/qualifikationssystem/leistungsnachweise
- Gymnasiale Oberstufe in Bayern — Abiturprüfung, Fünf-Fächer-Abitur:
  https://www.gymnasiale-oberstufe.bayern.de/abiturpruefung/allgemeines
- Gymnasiale Oberstufe in Bayern — Schriftliche Abiturprüfung:
  https://www.gymnasiale-oberstufe.bayern.de/abiturpruefung/schriftliche-abiturpruefung
- Gymnasiale Oberstufe in Bayern — Mündliche Abiturprüfung (Kolloquium):
  https://www.gymnasiale-oberstufe.bayern.de/abiturpruefung/muendliche-abiturpruefung
- Gymnasiale Oberstufe in Bayern — Prüfungsergebnis:
  https://www.gymnasiale-oberstufe.bayern.de/abiturpruefung/pruefungsergebnis
- ISB Bayern (oberstufe.bayern.de) — W-Seminar, Seminararbeit und
  Prüfungsgespräch:
  https://www.oberstufe.bayern.de/wissenschaftspropaedeutisches-seminarw-seminar-q1213/seminararbeit-praesentation-und-pruefungsgespraech/
- ISB Bayern — W-Seminar, individuelle Schwerpunktsetzung (Übersicht):
  https://www.gymnasiale-oberstufe.bayern.de/faecherwahl-und-belegung/individuelle-schwerpunktsetzung/w-seminar
- Bayerisches Staatsministerium für Unterricht und Kultus — Aktuelles
  Abiturprüfung 2026:
  https://www.km.bayern.de/lernen/schularten/gymnasium/aktuelles-abiturpruefung-2026
- Kultusministerkonferenz (KMK) — Vereinbarung zur Gestaltung der
  gymnasialen Oberstufe in der Sekundarstufe II (bundesweiter Rahmen):
  https://www.kmk.org/fileadmin/Dateien/pdf/Bildung/AllgBildung/176_Vereinb-S-II-Abi_2021-02-18.pdf

Rechtsgrundlage laut übereinstimmenden Sekundärhinweisen: Gymnasialschulordnung
(GSO) des Freistaats Bayern. Der Volltext der GSO selbst
(`gesetze-bayern.de`) konnte in dieser Umgebung nicht geladen werden
(Egress-Block) und wurde daher NICHT als Quelle verwendet — nur die
offiziellen `bayern.de`-Erklärseiten, die inhaltlich auf ihr basieren.

### Geprüfte Regelpunkte

| Regel | Wert | Status | Quelle(n) |
|---|---|---|---|
| Ausbildungsabschnitte | 12/1, 12/2, 13/1, 13/2 | verifiziert | gymnasiale-oberstufe.bayern.de (mehrfach konsistent) |
| Punktesystem | 0–15 Punkte je Halbjahresleistung | verifiziert | gymnasiale-oberstufe.bayern.de |
| Block I: einzubringende Halbjahresleistungen | 40 | verifiziert | gymnasiale-oberstufe.bayern.de/qualifikationssystem/allgemeines |
| Block I: Maximalpunktzahl | 600 (40 × max. 15) | verifiziert | s.o. |
| Block I: Mindestpunktzahl | 200 | verifiziert | s.o. |
| Block II: Anzahl Abiturprüfungen | 5 | verifiziert | gymnasiale-oberstufe.bayern.de/abiturpruefung/allgemeines |
| Block II: Gewichtung je Prüfung | 4-fach (max. 15×4 = 60 Punkte) | verifiziert | s.o. |
| Block II: Maximalpunktzahl | 300 (5 × 60) | verifiziert | s.o. |
| Block II: Mindestpunktzahl | 100 | verifiziert | s.o. |
| Gesamtqualifikation: Maximalpunktzahl | 900 (600 + 300) | verifiziert | mehrfach konsistent |
| Schriftliche Prüfungsfächer | 3 von 5, davon mind. 2 im erhöhten Anforderungsniveau (Deutsch, Mathematik, Leistungsfach) | verifiziert | gymnasiale-oberstufe.bayern.de/abiturpruefung/schriftliche-abiturpruefung |
| Mündliche Prüfungsfächer (Kolloquium) | 2, je 30 Minuten | verifiziert | gymnasiale-oberstufe.bayern.de/abiturpruefung/muendliche-abiturpruefung |
| Prüfungshäufigkeit Deutsch/Mathematik/Leistungsfach | Leistungsnachweis in allen 4 Ausbildungsabschnitten | verifiziert | gymnasiale-oberstufe.bayern.de/qualifikationssystem/leistungsnachweise |
| Prüfungshäufigkeit andere Fächer | Leistungsnachweis nur in 12/1, 12/2, 13/1 | verifiziert | s.o. |
| W-Seminar: Zeitraum | 12/1, 12/2, 13/1 (Präsentationshalbjahr) | verifiziert | oberstufe.bayern.de (ISB) |
| W-Seminar: Gewichtung Seminararbeit : Präsentation/Prüfungsgespräch | 3 : 1 | verifiziert | oberstufe.bayern.de (ISB) |
| W-Seminar: Maximalpunktzahl | 30 | verifiziert | oberstufe.bayern.de (ISB) |
| W-Seminar: Zählt als reguläre Halbjahresleistung? | Nein — gesondert im Abiturzeugnis ausgewiesen, fließt separat in Block I ein | verifiziert | oberstufe.bayern.de (ISB) |
| **Gesamtpunktzahl → Abiturnote (Umrechnungstabelle)** | **nicht implementiert** | **unverifiziert** | Existenz einer offiziellen Tabelle bestätigt (gymnasiale-oberstufe.bayern.de/abiturpruefung/pruefungsergebnis, KMK-Anlage), Volltext-Werte aber nicht zugänglich; eine kommerzielle Sekundärquelle lieferte eine intern widersprüchliche Formel und wurde verworfen |
| Defizitregeln (max. zulässige Unterpunktungen je Halbjahr/Fach) | **nicht implementiert** | unverifiziert | in Suchergebnissen nur pauschal erwähnt, keine belastbare Detailquelle gefunden |
| 0-Punkte-Regeln | **nicht implementiert** | unverifiziert | keine belastbare Detailquelle gefunden |
| Einbringungsregeln je Fach/Aufgabenfeld (Pflichtfächer, Fremdsprachen, Naturwissenschaften) | **nicht implementiert** | unverifiziert | keine belastbare Detailquelle gefunden |
| Streichmöglichkeiten | **nicht implementiert** | unverifiziert | keine belastbare Detailquelle gefunden |

### Konsequenz in der App

Die App berechnet und zeigt für Bayern 2027: den Stand von Block I
(Punkte aus eingebrachten Halbjahresleistungen, bezogen auf 40/600),
den Stand von Block II (Punkte aus bereits bekannten Abiturprüfungen,
bezogen auf 5/300) und die daraus resultierende **Gesamtpunktzahl**
(bezogen auf 900). Sie zeigt **keine** Abiturnote als Dezimalzahl, solange
die Umrechnungstabelle nicht verifiziert ist — an der Stelle erscheint
stattdessen "Notenumrechnung noch nicht verifiziert" mit Hinweis auf die
offizielle Quelle. Einbringungsoptimierung (§33 des Auftrags) ist aus
demselben Grund für Bayern vorerst **nicht** aktiv, da die Einbringungs-
und Streichregeln nicht belastbar verifiziert wurden — die App zeigt
stattdessen alle vom Nutzer aktiv eingetragenen Halbjahresleistungen als
eingebracht, ohne eine Optimierung vorzuschlagen.

---

## Die übrigen 15 Bundesländer

Baden-Württemberg (BW), Berlin (BE), Brandenburg (BB), Bremen (HB),
Hamburg (HH), Hessen (HE), Mecklenburg-Vorpommern (MV), Niedersachsen (NI),
Nordrhein-Westfalen (NW), Rheinland-Pfalz (RP), Saarland (SL), Sachsen (SN),
Sachsen-Anhalt (ST), Schleswig-Holstein (SH), Thüringen (TH).

Für alle 15 Länder gilt derselbe Befund: WebSearch bestätigt, dass praktisch
alle Länder auf demselben bundesweiten KMK-Rahmen (Vereinbarung zur
Gestaltung der gymnasialen Oberstufe in der Sekundarstufe II) mit einem
0–15-Punkte-System und einer Gesamtqualifikation von i. d. R. 900 Punkten
aufbauen — aber mit im Detail unterschiedlicher Zahl an Kurshalbjahren,
Einbringungspflichten, Prüfungsfächern und Sonderregeln je Land. Diese
Details konnten ohne Primärquellen-Volltextzugriff nicht seriös pro Land
verifiziert werden.

| Land | Code | Status | Rule-Version |
|---|---|---|---|
| Baden-Württemberg | BW | `verified: false` | — |
| Berlin | BE | `verified: false` | — |
| Brandenburg | BB | `verified: false` | — |
| Bremen | HB | `verified: false` | — |
| Hamburg | HH | `verified: false` | — |
| Hessen | HE | `verified: false` | — |
| Mecklenburg-Vorpommern | MV | `verified: false` | — |
| Niedersachsen | NI | `verified: false` | — |
| Nordrhein-Westfalen | NW | `verified: false` | — |
| Rheinland-Pfalz | RP | `verified: false` | — |
| Saarland | SL | `verified: false` | — |
| Sachsen | SN | `verified: false` | — |
| Sachsen-Anhalt | ST | `verified: false` | — |
| Schleswig-Holstein | SH | `verified: false` | — |
| Thüringen | TH | `verified: false` | — |

Für diese 15 Länder existiert in der App ein leerer, aber vollständig
typisierter `StateRuleConfig`-Stub (siehe `domain/abi/states/`) — die
Architektur ist bereit, sobald belastbare Quellen (z. B. per manuellem
Nutzer-Upload der jeweiligen Kultusministeriums-PDFs oder durch echten
WebFetch-Zugriff in einer anderen Umgebung) verfügbar sind. Bis dahin
zeigt die App für diese Länder ausschließlich den neutralen
"Oberstufen-Punktetracker"-Hinweis, keine Abiturnote, keine Prognose,
keine Einbringungslogik.

---

## Offene Punkte (Antwort auf Frage 15 des Auftrags)

**Ja**, es gibt Stellen, an denen eine Regel nur teilweise verifiziert ist:

1. Bayern: die Punkte→Noten-Umrechnungstabelle (Existenz bestätigt, Werte nicht zugänglich).
2. Bayern: Defizitregeln, 0-Punkte-Regeln, Einbringungs-/Streichregeln je Aufgabenfeld.
3. Alle 15 übrigen Länder: vollständig unverifiziert, absichtlich nicht implementiert.

Diese Funktionen sind entsprechend **nicht** als fertig markiert und in der
App aktiv deaktiviert/ausgeblendet (siehe `verified`-Flag), statt mit
angenommenen Werten zu rechnen.
