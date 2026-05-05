import type { PMSRecord, PMSRecordInput, PMSRecordUpdate } from "@/types/pms"

export type StorageMode = "local" | "supabase"

type RecordStore = {
  records: PMSRecord[]
}

interface StorageAdapter {
  listRecords: () => Promise<PMSRecord[]>
  createRecord: (input: PMSRecordInput) => Promise<PMSRecord>
  updateRecord: (id: string, update: PMSRecordUpdate) => Promise<PMSRecord | null>
  deleteRecord: (id: string) => Promise<boolean>
}

const STORAGE_KEY = "pms-system-records-v1"

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

function normalize(input: PMSRecordInput): PMSRecordInput {
  return {
    ...input,
    name: input.name.trim(),
    vehicle: input.vehicle.trim(),
    licensePlate: input.licensePlate.trim().toUpperCase(),
    recommendation: input.recommendation.trim(),
    batteryInfo: input.batteryInfo.trim(),
  }
}

function readStore(): RecordStore {
  return safeParse<RecordStore>(localStorage.getItem(STORAGE_KEY), { records: [] })
}

function writeStore(store: RecordStore) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

function sortNewestFirst(records: PMSRecord[]): PMSRecord[] {
  return [...records].toSorted((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

const localAdapter: StorageAdapter = {
  async listRecords() {
    return sortNewestFirst(readStore().records)
  },

  async createRecord(input) {
    const normalized = normalize(input)
    const now = new Date().toISOString()
    const record: PMSRecord = {
      id: crypto.randomUUID(),
      ...normalized,
      currentOdo: Number(normalized.currentOdo),
      createdAt: now,
      updatedAt: now,
    }
    const store = readStore()
    store.records.push(record)
    writeStore(store)
    return record
  },

  async updateRecord(id, update) {
    const store = readStore()
    const index = store.records.findIndex((record) => record.id === id)
    if (index === -1) return null
    const current = store.records[index]
    const merged: PMSRecordInput = normalize({
      dateInspection: update.dateInspection ?? current.dateInspection,
      name: update.name ?? current.name,
      vehicle: update.vehicle ?? current.vehicle,
      licensePlate: update.licensePlate ?? current.licensePlate,
      recommendation: update.recommendation ?? current.recommendation,
      scheduleDate: update.scheduleDate ?? current.scheduleDate,
      batteryInfo: update.batteryInfo ?? current.batteryInfo,
      currentOdo: Number(update.currentOdo ?? current.currentOdo),
    })
    const updated: PMSRecord = {
      ...current,
      ...merged,
      currentOdo: Number(merged.currentOdo),
      updatedAt: new Date().toISOString(),
    }
    store.records[index] = updated
    writeStore(store)
    return updated
  },

  async deleteRecord(id) {
    const store = readStore()
    const next = store.records.filter((record) => record.id !== id)
    if (next.length === store.records.length) return false
    writeStore({ records: next })
    return true
  },
}

const supabaseAdapter: StorageAdapter = {
  async listRecords() {
    throw new Error("Supabase mode is not enabled yet.")
  },
  async createRecord() {
    throw new Error("Supabase mode is not enabled yet.")
  },
  async updateRecord() {
    throw new Error("Supabase mode is not enabled yet.")
  },
  async deleteRecord() {
    throw new Error("Supabase mode is not enabled yet.")
  },
}

function resolveMode(): StorageMode {
  const mode = import.meta.env.VITE_STORAGE_MODE
  return mode === "supabase" ? "supabase" : "local"
}

function resolveAdapter(mode: StorageMode): StorageAdapter {
  if (mode === "supabase") return supabaseAdapter
  return localAdapter
}

export const storageService = {
  mode: resolveMode(),
  adapter(): StorageAdapter {
    return resolveAdapter(this.mode)
  },
  getCachedRecords() {
    if (this.mode !== "local") return []
    return sortNewestFirst(readStore().records)
  },
  async listRecords() {
    return this.adapter().listRecords()
  },
  async createRecord(input: PMSRecordInput) {
    return this.adapter().createRecord(input)
  },
  async updateRecord(id: string, update: PMSRecordUpdate) {
    return this.adapter().updateRecord(id, update)
  },
  async deleteRecord(id: string) {
    return this.adapter().deleteRecord(id)
  },
}
