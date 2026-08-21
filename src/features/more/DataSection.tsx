import { useRef, useState, type ChangeEvent } from 'react'
import { Download, Trash2, Upload } from 'lucide-react'
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

function reloadSoon() {
  window.setTimeout(() => window.location.reload(), 700)
}

export function DataSection() {
  const { showToast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dialog, setDialog] = useState<Dialog>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

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
      setDialog(null)
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
      setDialog(null)
    }
  }

  const importCounts = dialog?.kind === 'importConfirm' ? summarize(dialog.backup) : null

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
        <Button
          variant="ghost"
          size="md"
          className="w-full justify-start text-danger hover:bg-danger/10"
          onClick={() => setDialog({ kind: 'deleteConfirm' })}
        >
          <Trash2 className="h-4 w-4" strokeWidth={2} />
          Alle Daten löschen
        </Button>
      </Card>

      <Sheet
        open={dialog?.kind === 'importConfirm'}
        onClose={() => !busy && setDialog(null)}
        title="Backup importieren?"
      >
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
              <Button variant="ghost" size="lg" className="flex-1" onClick={() => setDialog(null)} disabled={busy}>
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
        onClose={() => !busy && setDialog(null)}
        title="Alle Daten löschen?"
      >
        <div className="flex flex-col gap-4">
          <ErrorBanner message="Dadurch werden alle Fächer, Noten und Einstellungen auf diesem Gerät unwiderruflich gelöscht." />
          <p className="text-xs text-ink-faint">Tipp: Exportiere vorher ein Backup, falls du die Daten später brauchst.</p>
          <div className="flex gap-2">
            <Button variant="ghost" size="lg" className="flex-1" onClick={() => setDialog(null)} disabled={busy}>
              Abbrechen
            </Button>
            <Button variant="danger" size="lg" className="flex-1" onClick={confirmDeleteAll} disabled={busy}>
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
