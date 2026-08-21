import { describe, expect, it } from 'vitest'
import { SUBJECT_COLOR_KEYS, getSubjectColorKey } from './subjectColors'

describe('getSubjectColorKey', () => {
  it('uses the catalog preset when no explicit color is set', () => {
    expect(getSubjectColorKey({ color: undefined, catalogId: 'mathematik', name: 'Mathematik' })).toBe('blue')
    expect(getSubjectColorKey({ color: undefined, catalogId: 'deutsch', name: 'Deutsch' })).toBe('orange')
    expect(getSubjectColorKey({ color: undefined, catalogId: 'biologie', name: 'Biologie' })).toBe('green')
  })

  it('prefers an explicit user-chosen color over the catalog preset', () => {
    expect(getSubjectColorKey({ color: 'rose', catalogId: 'mathematik', name: 'Mathematik' })).toBe('rose')
  })

  it('ignores an invalid stored color value and falls back to the preset', () => {
    expect(getSubjectColorKey({ color: 'not-a-real-key', catalogId: 'mathematik', name: 'Mathematik' })).toBe('blue')
  })

  it('assigns a deterministic, stable color to custom subjects without a catalog entry', () => {
    const a = getSubjectColorKey({ color: undefined, catalogId: undefined, name: 'Astronomie' })
    const b = getSubjectColorKey({ color: undefined, catalogId: undefined, name: 'Astronomie' })
    expect(a).toBe(b)
    expect(SUBJECT_COLOR_KEYS).toContain(a)
  })

  it('assigns different colors to different custom subject names most of the time', () => {
    const names = ['Astronomie', 'Robotik', 'Theater', 'Debattieren', 'Schach']
    const keys = names.map((name) => getSubjectColorKey({ color: undefined, catalogId: undefined, name }))
    expect(new Set(keys).size).toBeGreaterThan(1)
  })
})
