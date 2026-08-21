import { subjectRepository } from '../storage/repositories'

export async function archiveSubject(id: string): Promise<void> {
  const subject = await subjectRepository.getById(id)
  if (!subject) return
  await subjectRepository.put({ ...subject, archived: true })
}

export async function unarchiveSubject(id: string): Promise<void> {
  const subject = await subjectRepository.getById(id)
  if (!subject) return
  await subjectRepository.put({ ...subject, archived: false })
}
