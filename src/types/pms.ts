export type UserRole = "admin" | "staff" | "viewer"

export type PMSRecord = {
  id: string
  dateInspection: string
  name: string
  vehicle: string
  licensePlate: string
  recommendation: string
  scheduleDate: string
  batteryInfo: string
  currentOdo: number
  createdAt: string
  updatedAt: string
}

export type PMSRecordInput = Omit<PMSRecord, "id" | "createdAt" | "updatedAt">

export type PMSRecordUpdate = Partial<PMSRecordInput>

export type AppUser = {
  id: string
  name: string
  role: UserRole
}

export type InventoryItem = {
  id: string
  name: string
  sku: string
  category: string
  quantity: number
  unitCost: number
  reorderLevel: number
  createdAt: string
  updatedAt: string
}

export type SaleLineItem = {
  itemId: string
  itemName: string
  sku: string
  quantity: number
  unitPrice: number
}

export type SaleTransaction = {
  id: string
  lineItems: SaleLineItem[]
  subtotal: number
  discount: number
  total: number
  processedBy: string
  createdAt: string
}
