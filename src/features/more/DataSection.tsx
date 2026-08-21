import { useRef, useState, type ChangeEvent } from 'react'
import { AlertTriangle, Download, Trash2, Upload } from 'lucide-react'
import {
  backupFilename,
  buildBackup,
  deleteAllData,
  downloadBackup,
  readBackupFile,
  restoreBackup,
  type BackupFile,
} from '../../services/backupService'
import { formatDateDe } from '../../domain/grading'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Sheet } from '../../components/ui/Sheet'
import { ErrorBanner } from '../../components/ui/ErrorBanner'
import { useToast } from '../../components/ui/toastContext'

type Dialog = { kind: 'importConfirm'; backup: BackupFile } | { kind: 'deleteConfirm' } | null

const DELETE_CONFIRM_WORD = 'LÖSCHEN'

function reloadSoon() {
  window.setTimeout(() => window.location.reload(), 700)
}

export function DataSection() {
  const { showToast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dialog, setDialog] = useState<Dialog>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  function closeDialog() {
    setDialog(null)
    setDeleteConfirmText('')
  }

  async function handleExport() {
    const backup = await buildBackup()
    downloadBackup(backup, backupFilename())
    showToast('Backup heruntergeladen.', 'success')
  }

  async function handleFileSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError(null)
    const result = await readBackupFile(file)
    if (!result.valid) {
      setError(result.error)
      return
    }
    setDialog({ kind: 'importConfirm', backup: result.backup })
  }

  async function confirmImport(backup: BackupFile) {
    setBusy(true)
    try {
      const safetyBackup = await buildBackup()
      downloadBackup(safetyBackup, backupFilename('notentracker-backup-vor-import'))
      await restoreBackup(backup)
      showToast('Daten importiert. Die App wird neu geladen…', 'success')
      reloadSoon()
    } catch {
      setBusy(false)
      setError('Der Import ist fehlgeschlagen. Deine bisherigen Daten wurden nicht verändert.')
      closeDialog()
    }
  }

  async function confirmDeleteAll() {
    setBusy(true)
    try {
      await deleteAllData()
      showToast('Alle Daten gelöscht.', 'info')
      reloadSoon()
    } catch {
      setBusy(false)
      setError('Löschen ist fehlgeschlagen. Bitte versuch es erneut.')
      closeDialog()
    }
  }

  const importCounts = dialog?.kind === 'importConfirm' ? summarize(dialog.backup) : null
  const deleteConfirmMatches = deleteConfirmText.trim().toUpperCase() === DELETE_CONFIRM_WORD

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-ink-soft">Daten</p>
      {error && <ErrorBanner message={error} />}
      <Card className="space-y-2">
        <Button variant="secondary" size="md" className="w-full justify-start" onClick={handleExport}>
          <Download className="h-4 w-4" strokeWidth={2} />
          Exportieren
        </Button>
        <Button
          variant="secondary"
          size="md"
          className="w-full justify-start"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-4 w-4" strokeWidth={2} />
          Importieren
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={handleFileSelected}
          aria-label="Backup-Datei auswählen"
        />
      </Card>

      <div className="space-y-2 pt-2">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-danger">
          <AlertTriangle className="h-4 w-4" strokeWidth={2} />
          Gefahrenbereich
        </p>
        <Card className="space-y-3 border-danger/30 bg-danger/5">
          <p className="text-xs text-ink-faint">
            Löscht unwiderruflich alle Fächer, Noten und Einstellungen auf diesem Gerät und setzt die App auf den
            Auslieferungszustand zurück.
          </p>
          <Button
            variant="danger"
            size="md"
            className="w-full justify-start"
            onClick={() => setDialog({ kind: 'deleteConfirm' })}
          >
            <Trash2 className="h-4 w-4" strokeWidth={2} />
            Alle Daten löschen und App zurücksetzen
          </Button>
        </Card>
      </div>

      <Sheet open={dialog?.kind === 'importConfirm'} onClose={() => !busy && closeDialog()} title="Backup importieren?">
        {dialog?.kind === 'importConfirm' && importCounts && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-ink-soft">
              Backup vom {formatDateDe(dialog.backup.exportedAt)} · {importCounts.subjects}{' '}
              {importCounts.subjects === 1 ? 'Fach' : 'Fächer'} · {importCounts.grades}{' '}
              {importCounts.grades === 1 ? 'Note' : 'Noten'}
            </p>
            <ErrorBanner message="Dadurch werden alle aktuellen Fächer, Noten und Einstellungen auf diesem Gerät durch die Daten aus dieser Datei ersetzt." />
            <p className="text-xs text-ink-faint">
              Dein aktueller Stand wird vorher automatisch als Backup-Datei heruntergeladen.
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" size="lg" className="flex-1" onClick={closeDialog} disabled={busy}>
                Abbrechen
              </Button>
              <Button
                size="lg"
                className="flex-1"
                onClick={() => confirmImport(dialog.backup)}
                disabled={busy}
              >
                {busy ? 'Importiert…' : 'Importieren'}
              </Button>
            </div>
          </div>
        )}
      </Sheet>

      <Sheet
        open={dialog?.kind === 'deleteConfirm'}
        onClose={() => !busy && closeDialog()}
        title="Alle Daten löschen und App zurücksetzen?"
      >
        <div className="flex flex-col gap-4">
          <ErrorBanner message="Dadurch werden alle Fächer, Noten und Einstellungen auf diesem Gerät unwiderruflich gelöscht. Dieser Schritt kann nicht rückgängig gemacht werden." />
          <p className="text-xs text-ink-faint">Tipp: Exportiere vorher ein Backup, falls du die Daten später brauchst.</p>
          <div className="space-y-1.5">
            <label htmlFor="delete-confirm-input" className="text-xs font-medium text-ink-soft">
              Gib zur Bestätigung <span className="font-bold text-danger">{DELETE_CONFIRM_WORD}</span> ein:
            </label>
            <input
              id="delete-confirm-input"
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              disabled={busy}
              autoComplete="off"
              autoCapitalize="characters"
              placeholder={DELETE_CONFIRM_WORD}
              className="h-11 w-full rounded-control border border-border bg-bg-raised px-3.5 text-sm text-ink outline-none transition-colors focus:border-danger"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="lg" className="flex-1" onClick={closeDialog} disabled={busy}>
              Abbrechen
            </Button>
            <Button
              variant="danger"
              size="lg"
              className="flex-1"
              onClick={confirmDeleteAll}
              disabled={busy || !deleteConfirmMatches}
            >
              {busy ? 'Löscht…' : 'Ja, alle Daten löschen'}
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  )
}

function summarize(backup: BackupFile) {
  return {
    subjects: backup.data.subjects?.length ?? 0,
    grades: backup.data.gradeEntries?.length ?? 0,
  }
}
