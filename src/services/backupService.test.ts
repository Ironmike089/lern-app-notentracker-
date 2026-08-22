import { describe, expect, it } from 'vitest'
import { BACKUP_VERSION, validateBackup, type BackupFile } from './backupService'

function validBackup(): BackupFile {
  return {
    version: BACKUP_VERSION,
    exportedAt: '2026-08-21T10:00:00.000Z',
    data: {
      userSettings: null,
      schoolProfile: null,
      schoolYears: [],
      semesters: [],
      subjects: [],
      assessmentCategories: [],
      gradeEntries: [],
      subjectGoals: [],
      abiProfile: null,
      seminarAssessments: [],
    },
  }
}

describe('validateBackup', () => {
  it('accepts a well-formed backup', () => {
    const result = validateBackup(validBackup())
    expect(result.valid).toBe(true)
  })

  it('rejects null', () => {
    const result = validateBackup(null)
    expect(result.valid).toBe(false)
  })

  it('rejects a plain string instead of an object', () => {
    const result = validateBackup('not an object')
    expect(result.valid).toBe(false)
  })

  it('rejects an array at the top level', () => {
    const result = validateBackup([1, 2, 3])
    expect(result.valid).toBe(false)
  })

  it('rejects a missing version field', () => {
    const backup = validBackup() as unknown as Record<string, unknown>
    delete backup.version
    const result = validateBackup(backup)
    expect(result.valid).toBe(false)
  })

  it('rejects a version mismatch', () => {
    const backup = { ...validBackup(), version: 999 }
    const result = validateBackup(backup)
    expect(result.valid).toBe(false)
    if (!result.valid) expect(result.error).toContain('999')
  })

  it('rejects a missing exportedAt field', () => {
    const backup = validBackup() as unknown as Record<string, unknown>
    delete backup.exportedAt
    const result = validateBackup(backup)
    expect(result.valid).toBe(false)
  })

  it('rejects a missing data field', () => {
    const backup = validBackup() as unknown as Record<string, unknown>
    delete backup.data
    const result = validateBackup(backup)
    expect(result.valid).toBe(false)
  })

  it('rejects data with a non-array gradeEntries field', () => {
    const backup = validBackup()
    // @ts-expect-error intentionally malformed for the test
    backup.data.gradeEntries = 'not an array'
    const result = validateBackup(backup)
    expect(result.valid).toBe(false)
  })

  it('rejects a completely unrelated JSON shape without crashing', () => {
    const result = validateBackup({ foo: 'bar', baz: [1, 2, 3] })
    expect(result.valid).toBe(false)
  })

  it('rejects undefined', () => {
    const result = validateBackup(undefined)
    expect(result.valid).toBe(false)
  })
})
