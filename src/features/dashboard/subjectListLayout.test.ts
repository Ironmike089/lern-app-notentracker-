/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * Regression guard for the "Fächerliste ist immer einspaltig" requirement —
 * no component-render testing is set up in this project (vitest runs in a
 * plain `node` environment, no jsdom/RTL), so this checks the actual source
 * of every screen that renders the subject list for a reintroduced 2-column
 * grid class, on any breakpoint, rather than skipping the guarantee.
 */

const FORBIDDEN_PATTERNS = [/\bgrid-cols-2\b/, /\bsm:grid-cols-2\b/, /\bmd:grid-cols-2\b/, /\blg:grid-cols-2\b/, /\bxl:grid-cols-2\b/]

const FILES_RENDERING_SUBJECT_LIST = ['Dashboard.tsx', '../subjects-list/SubjectsListPage.tsx']

function readSource(relativePath: string): string {
  const url = new URL(relativePath, import.meta.url)
  return readFileSync(fileURLToPath(url), 'utf-8')
}

describe('subject list layout', () => {
  it.each(FILES_RENDERING_SUBJECT_LIST)('%s never uses a multi-column grid for the subject list', (relativePath) => {
    const source = readSource(relativePath)
    for (const pattern of FORBIDDEN_PATTERNS) {
      expect(source).not.toMatch(pattern)
    }
  })

  it('SubjectCard rows stack with plain vertical spacing, not a grid', () => {
    const source = readSource('SubjectCard.tsx')
    expect(source).not.toMatch(/\bgrid-cols-/)
  })
})
