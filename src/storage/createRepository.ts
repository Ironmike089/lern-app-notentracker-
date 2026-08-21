import type { Table } from 'dexie'

/**
 * Thin, uniform CRUD wrapper around a Dexie table. UI code depends on this
 * interface, never on Dexie directly — keeps IndexedDB an implementation
 * detail that could be swapped later without touching components.
 */
export interface Repository<T, K> {
  getAll(): Promise<T[]>
  getById(id: K): Promise<T | undefined>
  put(item: T): Promise<K>
  bulkPut(items: T[]): Promise<void>
  remove(id: K): Promise<void>
}

export function createRepository<T, K extends string>(table: Table<T, K>): Repository<T, K> {
  return {
    getAll: () => table.toArray(),
    getById: (id) => table.get(id),
    put: (item) => table.put(item),
    bulkPut: (items) => table.bulkPut(items).then(() => undefined),
    remove: (id) => table.delete(id),
  }
}
