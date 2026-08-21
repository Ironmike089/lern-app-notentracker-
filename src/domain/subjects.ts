/**
 * Predefined subject catalog. `icon` is a lookup key resolved to an actual
 * icon component in the UI layer (see components/icons/subjectIcon.tsx) —
 * domain code stays free of React/UI concerns.
 */
export interface SubjectCatalogEntry {
  id: string
  name: string
  icon: string
  group: 'sprachen' | 'naturwissenschaften' | 'gesellschaft' | 'werte' | 'kreativ'
}

export const SUBJECT_CATALOG: SubjectCatalogEntry[] = [
  { id: 'deutsch', name: 'Deutsch', icon: 'book-open', group: 'sprachen' },
  { id: 'mathematik', name: 'Mathematik', icon: 'sigma', group: 'naturwissenschaften' },
  { id: 'englisch', name: 'Englisch', icon: 'languages', group: 'sprachen' },
  { id: 'franzoesisch', name: 'Französisch', icon: 'languages', group: 'sprachen' },
  { id: 'latein', name: 'Latein', icon: 'scroll', group: 'sprachen' },
  { id: 'spanisch', name: 'Spanisch', icon: 'languages', group: 'sprachen' },
  { id: 'italienisch', name: 'Italienisch', icon: 'languages', group: 'sprachen' },
  { id: 'griechisch', name: 'Griechisch', icon: 'scroll', group: 'sprachen' },

  { id: 'biologie', name: 'Biologie', icon: 'leaf', group: 'naturwissenschaften' },
  { id: 'chemie', name: 'Chemie', icon: 'flask-conical', group: 'naturwissenschaften' },
  { id: 'physik', name: 'Physik', icon: 'atom', group: 'naturwissenschaften' },
  { id: 'informatik', name: 'Informatik', icon: 'cpu', group: 'naturwissenschaften' },
  { id: 'natur-und-technik', name: 'Natur und Technik', icon: 'microscope', group: 'naturwissenschaften' },

  { id: 'geschichte', name: 'Geschichte', icon: 'landmark', group: 'gesellschaft' },
  { id: 'geographie', name: 'Geographie', icon: 'globe', group: 'gesellschaft' },
  { id: 'politik-und-gesellschaft', name: 'Politik und Gesellschaft', icon: 'scale', group: 'gesellschaft' },
  { id: 'sozialkunde', name: 'Sozialkunde', icon: 'users', group: 'gesellschaft' },
  { id: 'wirtschaft-und-recht', name: 'Wirtschaft und Recht', icon: 'briefcase', group: 'gesellschaft' },
  { id: 'wirtschaft', name: 'Wirtschaft', icon: 'briefcase', group: 'gesellschaft' },
  { id: 'sozialwissenschaften', name: 'Sozialwissenschaften', icon: 'users', group: 'gesellschaft' },

  { id: 'ethik', name: 'Ethik', icon: 'compass', group: 'werte' },
  { id: 'religion-evangelisch', name: 'Religion evangelisch', icon: 'church', group: 'werte' },
  { id: 'religion-katholisch', name: 'Religion katholisch', icon: 'church', group: 'werte' },
  { id: 'philosophie', name: 'Philosophie', icon: 'brain', group: 'werte' },

  { id: 'kunst', name: 'Kunst', icon: 'palette', group: 'kreativ' },
  { id: 'musik', name: 'Musik', icon: 'music', group: 'kreativ' },
  { id: 'sport', name: 'Sport', icon: 'dumbbell', group: 'kreativ' },
  { id: 'darstellendes-spiel', name: 'Darstellendes Spiel', icon: 'drama', group: 'kreativ' },
]

export const CUSTOM_SUBJECT_ICON = 'notebook-pen'

export function searchSubjectCatalog(query: string): SubjectCatalogEntry[] {
  const q = query.trim().toLowerCase()
  if (!q) return SUBJECT_CATALOG
  return SUBJECT_CATALOG.filter((s) => s.name.toLowerCase().includes(q))
}
