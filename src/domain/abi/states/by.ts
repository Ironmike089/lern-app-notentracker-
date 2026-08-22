import type { StateRuleConfig } from '../types'

/**
 * Bavaria (G9 Gymnasium), Abitur ab 2027. Every number here is cited in
 * docs/abi-rules-audit.md, sourced from gymnasiale-oberstufe.bayern.de /
 * oberstufe.bayern.de (both official offerings of the Bavarian
 * Kultusministerium/ISB) via WebSearch-grounded queries — WebFetch to
 * primary documents was blocked in the research environment, so nothing
 * here that couldn't be cross-confirmed made it in; see `unverifiedAspects`
 * for exactly what was deliberately left out instead of guessed.
 */
export const BAVARIA_GYMNASIUM_2027_V1: StateRuleConfig = {
  state: 'BY',
  schoolType: 'gymnasium',
  ruleVersion: 'BY_GYM_2027_V1',
  graduationYearFrom: 2027,
  validFrom: '2026-08-22',
  verified: true,
  lastVerifiedAt: '2026-08-22',
  sourceReferences: [
    { label: 'Gymnasiale Oberstufe in Bayern – Qualifikationssystem, Allgemeines', url: 'https://www.gymnasiale-oberstufe.bayern.de/qualifikationssystem/allgemeines' },
    { label: 'Gymnasiale Oberstufe in Bayern – Halbjahresleistungen', url: 'https://www.gymnasiale-oberstufe.bayern.de/qualifikationssystem/halbjahresleistungen' },
    { label: 'Gymnasiale Oberstufe in Bayern – Leistungsnachweise', url: 'https://www.gymnasiale-oberstufe.bayern.de/qualifikationssystem/leistungsnachweise' },
    { label: 'Gymnasiale Oberstufe in Bayern – Fünf-Fächer-Abitur', url: 'https://www.gymnasiale-oberstufe.bayern.de/abiturpruefung/allgemeines' },
    { label: 'Gymnasiale Oberstufe in Bayern – Schriftliche Abiturprüfung', url: 'https://www.gymnasiale-oberstufe.bayern.de/abiturpruefung/schriftliche-abiturpruefung' },
    { label: 'Gymnasiale Oberstufe in Bayern – Mündliche Abiturprüfung (Kolloquium)', url: 'https://www.gymnasiale-oberstufe.bayern.de/abiturpruefung/muendliche-abiturpruefung' },
    { label: 'ISB Bayern – W-Seminar: Seminararbeit und Prüfungsgespräch', url: 'https://www.oberstufe.bayern.de/wissenschaftspropaedeutisches-seminarw-seminar-q1213/seminararbeit-praesentation-und-pruefungsgespraech/' },
    { label: 'Kultusministerkonferenz – Vereinbarung zur Gestaltung der gymnasialen Oberstufe in der Sekundarstufe II', url: 'https://www.kmk.org/fileadmin/Dateien/pdf/Bildung/AllgBildung/176_Vereinb-S-II-Abi_2021-02-18.pdf' },
  ],
  gradingScale: 'points_0_15',
  qualificationPhase: {
    semesterNames: ['12/1', '12/2', '13/1', '13/2'],
    requiredContributions: 40,
    maxPoints: 600,
    minPoints: 200,
  },
  examBlock: {
    examCount: 5,
    examWeighting: 4,
    maxPointsPerExam: 15,
    maxPoints: 300,
    minPoints: 100,
    writtenExamCount: 3,
    oralExamCount: 2,
  },
  // 600 + 300 — arithmetic from the two verified block maxima above, not a separately cited figure.
  totalPoints: { max: 900, min: 300 },
  seminarModules: [
    {
      id: 'w-seminar',
      label: 'W-Seminar',
      semesterNames: ['12/1', '12/2', '13/1'],
      seminarPaperWeight: 3,
      presentationWeight: 1,
      maxPoints: 30,
      countsAsHalfYearGrade: false,
      scoringFormulaNote:
        'Das 3:1-Gewichtungsverhältnis und die Maximalpunktzahl 30 sind offiziell belegt; die konkrete Formel ' +
        '(Seminararbeit × 3 + Präsentation × 1, Summe halbiert, aus je 0–15 Punkten) ist eine daraus abgeleitete, ' +
        'nicht wörtlich mit Formel belegte Rechenvorschrift — siehe docs/abi-rules-audit.md.',
    },
  ],
  gradeConversion: {
    available: false,
    note:
      'Die offizielle Umrechnungstabelle Gesamtpunktzahl → Abiturnote existiert nachweislich (KMK-Anlage, ' +
      'gymnasiale-oberstufe.bayern.de), ihre Werte konnten aber nicht verifiziert werden — eine kommerzielle ' +
      'Sekundärquelle lieferte eine intern widersprüchliche Formel und wurde verworfen. Die App zeigt daher nur ' +
      'die Punktzahl, keine berechnete Abiturnote.',
  },
  requiredSetupFields: ['graduationYear', 'performanceSubject', 'writtenExamSubjects', 'oralExamSubjects', 'wSeminarSubject'],
  unverifiedAspects: [
    'Punkte→Note-Umrechnungstabelle (Existenz bestätigt, Werte nicht zugänglich)',
    'Defizitregeln (maximal zulässige Unterpunktungen)',
    '0-Punkte-Sonderregeln',
    'Einbringungs- und Streichregeln je Aufgabenfeld/Pflichtfach (Block I nutzt daher aktuell alle erfassten Halbjahresleistungen statt der optimierten Pflichteinbringung von 40)',
  ],
}
