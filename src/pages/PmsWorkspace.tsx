import { type FormEvent, useMemo, useRef, useState } from "react"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import {
  BarChart3Icon,
  CarIcon,
  ClipboardListIcon,
  DownloadIcon,
  ExternalLinkIcon,
  FileDownIcon,
  GaugeIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MenuIcon,
  MinusIcon,
  MoonIcon,
  PackageIcon,
  PlusCircleIcon,
  PlusIcon,
  ReceiptIcon,
  ScanTextIcon,
  SearchIcon,
  ShieldIcon,
  ShoppingCartIcon,
  SunIcon,
  TagIcon,
  Trash2Icon,
  TrendingUpIcon,
  XIcon,
  PrinterIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { hasPermission } from "@/lib/rbac"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { getActiveUser, getUsers, setActiveUser, updateUserRole } from "@/services/mockAuthService"
import { storageService } from "@/services/storageService"
import type { AppUser, InventoryItem, PMSRecord, SaleLineItem, SaleTransaction, UserRole } from "@/types/pms"

type Page = "dashboard" | "create" | "records" | "admin" | "inventory" | "pos" | "analytics"
type SearchField = "all" | "name" | "vehicle" | "licensePlate"
type HistoryOrder = "newest" | "oldest"

type FormState = {
  dateInspection: string
  name: string
  vehicle: string
  licensePlate: string
  recommendation: string
  scheduleDate: string
  batteryInfo: string
  currentOdo: string
}

type PmsWorkspaceProps = {
  onLogout?: () => void
}

const initialForm: FormState = {
  dateInspection: "",
  name: "",
  vehicle: "",
  licensePlate: "",
  recommendation: "",
  scheduleDate: "",
  batteryInfo: "",
  currentOdo: "",
}

function formatDate(value: string): string {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "Invalid date"
  return parsed.toLocaleDateString()
}

function normalizePlate(plate: string): string {
  return plate.trim().toUpperCase()
}

// ── Inventory / Transaction localStorage helpers ──────────────────────────
const INV_KEY = "pms-inventory-v1"
const TXN_KEY = "pms-transactions-v1"

const SEED_INVENTORY: Omit<InventoryItem, "id" | "createdAt" | "updatedAt">[] = [
  { name: "Engine Oil (4L)", sku: "OIL-4L-10W40", itemType: "product", category: "Fluids", quantity: 24, unitCost: 580, reorderLevel: 6 },
  { name: "Oil Filter", sku: "FLT-OIL-UNI", itemType: "product", category: "Filters", quantity: 18, unitCost: 120, reorderLevel: 5 },
  { name: "Air Filter", sku: "FLT-AIR-UNI", itemType: "product", category: "Filters", quantity: 12, unitCost: 180, reorderLevel: 4 },
  { name: "Brake Pad Set (Front)", sku: "BRK-PAD-FR", itemType: "product", category: "Brakes", quantity: 8, unitCost: 950, reorderLevel: 3 },
  { name: "Wiper Blade (Pair)", sku: "WIP-PAIR-24", itemType: "product", category: "Accessories", quantity: 15, unitCost: 320, reorderLevel: 4 },
  { name: "Spark Plug (Set of 4)", sku: "IGN-PLUG-4", itemType: "product", category: "Ignition", quantity: 3, unitCost: 620, reorderLevel: 4 },
  { name: "Coolant (1L)", sku: "COOL-1L-GRN", itemType: "product", category: "Fluids", quantity: 20, unitCost: 140, reorderLevel: 5 },
  { name: "Battery (MF 70AH)", sku: "BAT-MF-70AH", itemType: "product", category: "Electrical", quantity: 4, unitCost: 3800, reorderLevel: 2 },
  { name: "PMS Labor Package", sku: "SRV-PMS-LABOR", itemType: "service", category: "Services", quantity: 0, unitCost: 1500, reorderLevel: 0 },
  { name: "Computerized Diagnostic Scan", sku: "SRV-DIAG-SCAN", itemType: "service", category: "Services", quantity: 0, unitCost: 850, reorderLevel: 0 },
  { name: "Wheel Alignment", sku: "SRV-WHL-ALIGN", itemType: "service", category: "Services", quantity: 0, unitCost: 1200, reorderLevel: 0 },
]

function readInventory(): InventoryItem[] {
  try {
    const raw = localStorage.getItem(INV_KEY)
    if (!raw) {
      const seeded: InventoryItem[] = SEED_INVENTORY.map((s) => {
        const now = new Date().toISOString()
        return { ...s, id: crypto.randomUUID(), createdAt: now, updatedAt: now }
      })
      localStorage.setItem(INV_KEY, JSON.stringify(seeded))
      return seeded
    }
    const parsed = (JSON.parse(raw) as InventoryItem[]).map((item) => ({
      ...item,
      itemType: item.itemType ?? "product",
    }))
    const existingSkus = new Set(parsed.map((item) => item.sku))
    const now = new Date().toISOString()
    const missingServices = SEED_INVENTORY
      .filter((seed) => seed.itemType === "service" && !existingSkus.has(seed.sku))
      .map((seed) => ({
        ...seed,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
      }))
    if (missingServices.length === 0) return parsed
    const merged = [...missingServices, ...parsed]
    localStorage.setItem(INV_KEY, JSON.stringify(merged))
    return merged
  } catch { return [] }
}

function writeInventory(items: InventoryItem[]) {
  localStorage.setItem(INV_KEY, JSON.stringify(items))
}

function readTransactions(): SaleTransaction[] {
  try { return JSON.parse(localStorage.getItem(TXN_KEY) ?? "[]") as SaleTransaction[] }
  catch { return [] }
}

function writeTransactions(txns: SaleTransaction[]) {
  localStorage.setItem(TXN_KEY, JSON.stringify(txns))
}

type InventoryFormState = {
  name: string
  sku: string
  itemType: "product" | "service"
  category: string
  quantity: string
  unitCost: string
  reorderLevel: string
}

const initialInvForm: InventoryFormState = {
  name: "", sku: "", itemType: "product", category: "", quantity: "", unitCost: "", reorderLevel: "",
}

type CartEntry = { item: InventoryItem; qty: number }
type PendingSale = { txn: SaleTransaction; cartEntries: CartEntry[] }

const INVOICE_LOGO_PATH = "/speclogo.jpg"
let invoiceLogoDataUrlPromise: Promise<string | null> | null = null

function getInvoiceLogoUrl() {
  return new URL(INVOICE_LOGO_PATH, window.location.origin).toString()
}

function getInvoiceLogoDataUrl() {
  if (invoiceLogoDataUrlPromise) return invoiceLogoDataUrlPromise
  invoiceLogoDataUrlPromise = fetch(getInvoiceLogoUrl())
    .then((response) => {
      if (!response.ok) throw new Error("Invoice logo fetch failed")
      return response.blob()
    })
    .then((blob) => new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(new Error("Invoice logo conversion failed"))
      reader.readAsDataURL(blob)
    }))
    .catch(() => null)
  return invoiceLogoDataUrlPromise
}

function validateForm(form: FormState): Partial<Record<keyof FormState, string>> {
  const errors: Partial<Record<keyof FormState, string>> = {}
  if (!form.dateInspection) errors.dateInspection = "Date of inspection is required."
  if (!form.name.trim()) errors.name = "Owner name is required."
  if (!form.vehicle.trim()) errors.vehicle = "Vehicle is required."
  if (!form.licensePlate.trim()) errors.licensePlate = "License plate is required."
  if (!form.recommendation.trim()) errors.recommendation = "Recommendation is required."
  if (!form.scheduleDate) errors.scheduleDate = "Schedule date is required."
  if (!form.batteryInfo.trim()) errors.batteryInfo = "Battery info is required."
  if (!form.currentOdo.trim()) {
    errors.currentOdo = "Current odometer is required."
  } else if (Number.isNaN(Number(form.currentOdo))) {
    errors.currentOdo = "Current odometer must be numeric."
  }
  return errors
}

function formatMoney(value: number) {
  return `₱${value.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

function invoiceHtml(txn: SaleTransaction) {
  const logoUrl = getInvoiceLogoUrl()
  const receiptNo = txn.id.slice(0, 8).toUpperCase()
  const rows = txn.lineItems.map((line) => {
    const lineTotal = line.quantity * line.unitPrice
    return `
      <tr>
        <td>${escapeHtml(line.itemName)}<div class="muted">${escapeHtml(line.sku)}</div></td>
        <td>${line.quantity}</td>
        <td>${formatMoney(line.unitPrice)}</td>
        <td>${formatMoney(lineTotal)}</td>
      </tr>
    `
  }).join("")

  const stamp = new Date(txn.createdAt)
  return `<!doctype html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Receipt ${escapeHtml(receiptNo)}</title>
      <style>
        :root { color-scheme: light; }
        body {
          margin: 0;
          padding: 26px;
          font-family: "IBM Plex Sans", "Segoe UI", sans-serif;
          background: #e4e4e7;
          color: #18181b;
        }
        .receipt {
          max-width: 820px;
          margin: 0 auto;
          border: 1.5px solid #27272a;
          border-radius: 16px;
          background: #ffffff;
          box-shadow: 0 8px 24px rgba(24, 24, 27, 0.08);
          overflow: hidden;
        }
        .headerline {
          height: 5px;
          background: linear-gradient(90deg, #ef4444, #27272a 50%, #ef4444);
        }
        .head {
          padding: 18px 24px 16px;
          border-bottom: 1.5px solid #3f3f46;
          display: flex;
          justify-content: space-between;
          gap: 14px;
          flex-wrap: wrap;
        }
        .brand-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .logo {
          width: 38px;
          height: 38px;
          border-radius: 6px;
          object-fit: cover;
          border: 1px solid #52525b;
        }
        .brand { font-weight: 800; letter-spacing: .09em; font-size: 12px; text-transform: uppercase; color: #27272a; }
        .sub { color: #52525b; font-size: 11px; margin-top: 5px; }
        .doc { text-align: right; }
        .doc h1 { margin: 0; font-size: 32px; line-height: 1; color: #27272a; letter-spacing: -0.02em; }
        .doc p { margin: 3px 0 0; font-family: "IBM Plex Mono", monospace; color: #52525b; font-size: 11px; }
        .receipt-tag {
          display: inline-flex;
          margin-top: 5px;
          border: 1px solid #a1a1aa;
          padding: 2px 8px;
          border-radius: 999px;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: .08em;
          color: #52525b;
          font-weight: 600;
        }
        .meta {
          display: grid;
          grid-template-columns: repeat(2, minmax(180px, 1fr));
          gap: 10px;
          padding: 14px 24px;
          border-bottom: 1px solid #d4d4d8;
        }
        .meta-card {
          border: 1px solid #71717a;
          border-radius: 10px;
          background: #f4f4f5;
          padding: 10px;
        }
        .meta-card b { display: block; color: #52525b; font-size: 10px; text-transform: uppercase; letter-spacing: .08em; }
        .meta-card span { display: block; margin-top: 5px; color: #27272a; font-size: 13px; }
        table {
          width: calc(100% - 48px);
          margin: 14px 24px;
          border-collapse: collapse;
          border: 1px solid #71717a;
          border-radius: 10px;
          overflow: hidden;
        }
        th, td { padding: 10px; border-bottom: 1px solid #d4d4d8; font-size: 12px; }
        th { text-align: left; color: #52525b; font-size: 10px; text-transform: uppercase; letter-spacing: .08em; background: #f4f4f5; }
        td:nth-child(2), td:nth-child(3), td:nth-child(4) { font-family: "IBM Plex Mono", monospace; }
        td:nth-child(2), td:nth-child(3), td:nth-child(4) { text-align: right; }
        .muted { color: #71717a; font-size: 10px; margin-top: 3px; }
        .totals {
          margin: 2px 24px 16px;
          margin-left: auto;
          width: min(320px, calc(100% - 48px));
          border: 1px solid #71717a;
          border-radius: 10px;
          overflow: hidden;
          background: #f9fafb;
        }
        .row { display: flex; justify-content: space-between; padding: 10px 12px; font-size: 12px; color: #3f3f46; }
        .row + .row { border-top: 1px solid #d4d4d8; }
        .row b { font-family: "IBM Plex Mono", monospace; }
        .grand { font-size: 14px; color: #111827; background: #eceff1; font-weight: 700; }
        .footerline {
          border-top: 1.5px solid #3f3f46;
          margin: 0 24px;
          height: 1px;
        }
        .foot {
          margin: 8px 24px 18px;
          display: flex;
          justify-content: space-between;
          gap: 12px;
          color: #52525b;
          font-size: 10px;
        }
        .mono { font-family: "IBM Plex Mono", monospace; }
        .thank-you {
          margin: 0 24px 10px;
          text-align: center;
          color: #3f3f46;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: .05em;
          text-transform: uppercase;
        }
        @media print {
          body { padding: 0; background: #ffffff; }
          .receipt {
            box-shadow: none;
            border-radius: 0;
            border-left: 0;
            border-right: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="receipt">
        <div class="headerline"></div>
        <div class="head">
          <div class="brand-wrap">
            <img src="${escapeHtml(logoUrl)}" alt="SPEC-C" class="logo" />
            <div>
              <div class="brand">SPEC-C Auto PMS Xpress</div>
              <div class="sub">Auto Service and Preventive Maintenance</div>
            </div>
          </div>
          <div class="doc">
            <h1>Receipt</h1>
            <p class="mono">No. ${escapeHtml(receiptNo)}</p>
            <span class="receipt-tag">Sales Receipt</span>
          </div>
        </div>
        <div class="meta">
          <div class="meta-card"><b>Date / Time</b><span>${escapeHtml(stamp.toLocaleString())}</span></div>
          <div class="meta-card"><b>Cashier</b><span>${escapeHtml(txn.processedBy)}</span></div>
          <div class="meta-card"><b>Item Count</b><span class="mono">${txn.lineItems.reduce((sum, item) => sum + item.quantity, 0)}</span></div>
          <div class="meta-card"><b>Transaction ID</b><span class="mono">${escapeHtml(txn.id)}</span></div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th>Line Total</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="totals">
          <div class="row"><span>Subtotal</span><b>${formatMoney(txn.subtotal)}</b></div>
          <div class="row"><span>Discount</span><b>- ${formatMoney(txn.discount)}</b></div>
          <div class="row grand"><span>Amount Paid</span><b>${formatMoney(txn.total)}</b></div>
        </div>
        <p class="thank-you">Thank you for choosing SPEC-C</p>
        <div class="footerline"></div>
        <div class="foot">
          <span>This document is system generated and valid without signature.</span>
          <span class="mono">Generated ${escapeHtml(new Date().toLocaleString())}</span>
        </div>
      </div>
    </body>
  </html>`
}

function PmsWorkspace({ onLogout }: PmsWorkspaceProps) {
  const { resolvedTheme, setTheme } = useTheme()

  const [page, setPage] = useState<Page>("dashboard")
  const [records, setRecords] = useState<PMSRecord[]>(() => storageService.getCachedRecords())
  const [users, setUsers] = useState<AppUser[]>(() => getUsers())
  const [activeUser, setActiveUserState] = useState<AppUser>(() => getActiveUser())
  const [nowReference] = useState(() => Date.now())

  const [form, setForm] = useState<FormState>(initialForm)
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormState, string>>>({})

  const [searchTerm, setSearchTerm] = useState("")
  const [searchField, setSearchField] = useState<SearchField>("all")
  const [historyOrder, setHistoryOrder] = useState<HistoryOrder>("newest")
  const [editingRecord, setEditingRecord] = useState<PMSRecord | null>(null)
  const [editForm, setEditForm] = useState<FormState>(initialForm)
  const [editErrors, setEditErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // ── Inventory state ──
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(() => readInventory())
  const [invForm, setInvForm] = useState<InventoryFormState>(initialInvForm)
  const [invFormErrors, setInvFormErrors] = useState<Partial<Record<keyof InventoryFormState, string>>>({})
  const [showInvForm, setShowInvForm] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [invSearch, setInvSearch] = useState("")

  // ── POS state ──
  const [cart, setCart] = useState<CartEntry[]>([])
  const [posSearch, setPosSearch] = useState("")
  const [posDiscount, setPosDiscount] = useState("")
  const [pendingSale, setPendingSale] = useState<PendingSale | null>(null)
  const [latestInvoice, setLatestInvoice] = useState<SaleTransaction | null>(null)
  const [savingInvoicePdf, setSavingInvoicePdf] = useState(false)
  const [invoicePreviewUrl, setInvoicePreviewUrl] = useState<string | null>(null)
  const [invoicePreviewKind, setInvoicePreviewKind] = useState<"html" | "pdf" | null>(null)
  const [invoicePreviewName, setInvoicePreviewName] = useState("")
  const [printAfterPreviewLoad, setPrintAfterPreviewLoad] = useState(false)
  const invoicePreviewRef = useRef<HTMLIFrameElement | null>(null)

  // ── Transactions state ──
  const [transactions, setTransactions] = useState<SaleTransaction[]>(() => readTransactions())

  const discountPct = Math.min(100, Math.max(0, Number(posDiscount) || 0))
  const cartSubtotal = cart.reduce((sum, entry) => sum + entry.item.unitCost * entry.qty, 0)
  const cartDiscount = cartSubtotal * (discountPct / 100)
  const cartTotal = cartSubtotal - cartDiscount

  async function refreshRecords() {
    const next = await storageService.listRecords()
    setRecords(next)
  }

  const permissions = useMemo(() => {
    return {
      create: hasPermission(activeUser.role, "create"),
      read: hasPermission(activeUser.role, "read"),
      edit: hasPermission(activeUser.role, "edit"),
      delete: hasPermission(activeUser.role, "delete"),
      manage: hasPermission(activeUser.role, "manage_roles"),
      export: hasPermission(activeUser.role, "export"),
    }
  }, [activeUser])

  const latestByPlateForForm = useMemo(() => {
    const normalizedPlate = normalizePlate(form.licensePlate)
    if (!normalizedPlate) return null
    return records.find((record) => normalizePlate(record.licensePlate) === normalizedPlate) ?? null
  }, [form.licensePlate, records])

  const filteredRecords = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    const base = records.filter((record) => {
      if (!query) return true
      if (searchField === "name") return record.name.toLowerCase().includes(query)
      if (searchField === "vehicle") return record.vehicle.toLowerCase().includes(query)
      if (searchField === "licensePlate") return record.licensePlate.toLowerCase().includes(query)
      return (
        record.name.toLowerCase().includes(query) ||
        record.vehicle.toLowerCase().includes(query) ||
        record.licensePlate.toLowerCase().includes(query)
      )
    })
    const ordered = [...base]
    ordered.sort((a, b) => {
      const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      return historyOrder === "oldest" ? diff : -diff
    })
    return ordered
  }, [historyOrder, records, searchField, searchTerm])

  const groupedHistory = useMemo(() => {
    const groups = new Map<string, PMSRecord[]>()
    for (const record of filteredRecords) {
      const key = normalizePlate(record.licensePlate)
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(record)
    }
    return [...groups.entries()].map(([plate, items]) => {
      const latest = [...items].toSorted(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )[0]
      return { plate, items, latest }
    })
  }, [filteredRecords])

  const dashboardStats = useMemo(() => {
    const total = records.length
    const uniqueVehicles = new Set(records.map((record) => normalizePlate(record.licensePlate))).size
    const upcoming = records.filter((record) => {
      const schedule = new Date(record.scheduleDate).getTime()
      const next30Days = nowReference + 1000 * 60 * 60 * 24 * 30
      return schedule >= nowReference && schedule <= next30Days
    }).length
    return { total, uniqueVehicles, upcoming }
  }, [nowReference, records])

  function setFormValue<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function setEditFormValue<K extends keyof FormState>(key: K, value: FormState[K]) {
    setEditForm((current) => ({ ...current, [key]: value }))
  }

  function applyAutofillFrom(record: PMSRecord) {
    setForm((current) => ({
      ...current,
      name: record.name,
      vehicle: record.vehicle,
      recommendation: record.recommendation,
      batteryInfo: record.batteryInfo,
      currentOdo: String(record.currentOdo),
    }))
    toast.info("Latest record data applied.")
  }

  async function handleCreateRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!permissions.create) {
      toast.error("Your role cannot create records.")
      return
    }
    const errors = validateForm(form)
    setFormErrors(errors)
    if (Object.keys(errors).length > 0) {
      toast.error("Please fix form errors before saving.")
      return
    }
    try {
      await storageService.createRecord({
        dateInspection: form.dateInspection,
        name: form.name,
        vehicle: form.vehicle,
        licensePlate: normalizePlate(form.licensePlate),
        recommendation: form.recommendation,
        scheduleDate: form.scheduleDate,
        batteryInfo: form.batteryInfo,
        currentOdo: Number(form.currentOdo),
      })
      setForm(initialForm)
      setFormErrors({})
      await refreshRecords()
      setPage("records")
      toast.success("PMS record saved.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save record.")
    }
  }

  function startEdit(record: PMSRecord) {
    if (!permissions.edit) return
    setEditingRecord(record)
    setEditForm({
      dateInspection: record.dateInspection,
      name: record.name,
      vehicle: record.vehicle,
      licensePlate: record.licensePlate,
      recommendation: record.recommendation,
      scheduleDate: record.scheduleDate,
      batteryInfo: record.batteryInfo,
      currentOdo: String(record.currentOdo),
    })
    setEditErrors({})
    toast.info(`Editing ${record.licensePlate}`)
  }

  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editingRecord) return
    if (!permissions.edit) {
      toast.error("Your role cannot edit records.")
      return
    }
    const errors = validateForm(editForm)
    setEditErrors(errors)
    if (Object.keys(errors).length > 0) {
      toast.error("Please fix edit form errors.")
      return
    }
    try {
      const updated = await storageService.updateRecord(editingRecord.id, {
        dateInspection: editForm.dateInspection,
        name: editForm.name,
        vehicle: editForm.vehicle,
        licensePlate: normalizePlate(editForm.licensePlate),
        recommendation: editForm.recommendation,
        scheduleDate: editForm.scheduleDate,
        batteryInfo: editForm.batteryInfo,
        currentOdo: Number(editForm.currentOdo),
      })
      if (!updated) {
        toast.error("Record not found.")
        return
      }
      setEditingRecord(null)
      setEditForm(initialForm)
      await refreshRecords()
      toast.success("Record updated.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update record.")
    }
  }

  async function removeRecord(record: PMSRecord) {
    if (!permissions.delete) {
      toast.error("Your role cannot delete records.")
      return
    }
    const approved = window.confirm(`Delete record for ${record.licensePlate} on ${formatDate(record.dateInspection)}?`)
    if (!approved) return
    const removed = await storageService.deleteRecord(record.id)
    if (!removed) {
      toast.error("Record was already removed.")
      return
    }
    if (editingRecord?.id === record.id) {
      setEditingRecord(null)
      setEditForm(initialForm)
    }
    await refreshRecords()
    toast.success("Record deleted.")
  }

  function exportJson() {
    if (!permissions.export) {
      toast.error("Your role cannot export data.")
      return
    }
    const payload = JSON.stringify(filteredRecords, null, 2)
    const blob = new Blob([payload], { type: "application/json;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `pms-records-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    URL.revokeObjectURL(url)
    toast.success("JSON export ready.")
  }

  function exportCsv() {
    if (!permissions.export) {
      toast.error("Your role cannot export data.")
      return
    }
    const headers = [
      "id",
      "dateInspection",
      "name",
      "vehicle",
      "licensePlate",
      "recommendation",
      "scheduleDate",
      "batteryInfo",
      "currentOdo",
      "createdAt",
      "updatedAt",
    ]
    const rows = filteredRecords.map((record) =>
      headers
        .map((header) => {
          const value = String(record[header as keyof PMSRecord] ?? "")
          return `"${value.replaceAll("\"", "\"\"")}"`
        })
        .join(","),
    )
    const csv = [headers.join(","), ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `pms-records-${new Date().toISOString().slice(0, 10)}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
    toast.success("CSV export ready.")
  }

  function handleSwitchUser(userId: string | null) {
    if (!userId) return
    const selected = setActiveUser(userId)
    setActiveUserState(selected)
    setUsers(getUsers())
    toast.info(`Switched to ${selected.name} (${selected.role})`)
  }

  function handleRoleChange(userId: string, role: UserRole) {
    if (!permissions.manage) {
      toast.error("Only admins can manage roles.")
      return
    }
    const nextUsers = updateUserRole(userId, role)
    setUsers(nextUsers)
    setActiveUserState(getActiveUser())
    toast.success("Role updated.")
  }

  // ── Analytics memos ──────────────────────────────────────────────────────
  const analyticsStats = useMemo(() => {
    const revenue = transactions.reduce((sum, t) => sum + t.total, 0)
    const avgOrder = transactions.length > 0 ? revenue / transactions.length : 0
    return { revenue, count: transactions.length, avgOrder }
  }, [transactions])

  const topItems = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number }>()
    for (const t of transactions) {
      for (const li of t.lineItems) {
        const cur = map.get(li.itemId) ?? { name: li.itemName, qty: 0, revenue: 0 }
        map.set(li.itemId, { name: li.itemName, qty: cur.qty + li.quantity, revenue: cur.revenue + li.quantity * li.unitPrice })
      }
    }
    return [...map.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5)
  }, [transactions])

  const revenueByDay = useMemo(() => {
    const days: { label: string; revenue: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toLocaleDateString("en-CA") // YYYY-MM-DD
      const label = d.toLocaleDateString("en-US", { weekday: "short" })
      const revenue = transactions
        .filter((t) => t.createdAt.startsWith(key))
        .reduce((sum, t) => sum + t.total, 0)
      days.push({ label, revenue })
    }
    return days
  }, [transactions])

  // ── Inventory functions ──────────────────────────────────────────────────
  function validateInvForm(f: InventoryFormState) {
    const e: Partial<Record<keyof InventoryFormState, string>> = {}
    if (!f.name.trim()) e.name = "Name is required."
    if (!f.sku.trim()) e.sku = "SKU is required."
    if (!f.itemType) e.itemType = "Type is required."
    if (!f.category.trim()) e.category = "Category is required."
    if (!f.quantity.trim() || Number.isNaN(Number(f.quantity))) e.quantity = "Valid quantity required."
    if (!f.unitCost.trim() || Number.isNaN(Number(f.unitCost))) e.unitCost = "Valid unit cost required."
    if (!f.reorderLevel.trim() || Number.isNaN(Number(f.reorderLevel))) e.reorderLevel = "Valid reorder level required."
    return e
  }

  function saveInventoryItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const errors = validateInvForm(invForm)
    setInvFormErrors(errors)
    if (Object.keys(errors).length > 0) return
    const now = new Date().toISOString()
    let next: InventoryItem[]
    if (editingItem) {
      next = inventoryItems.map((it) =>
        it.id === editingItem.id
          ? { ...it, name: invForm.name.trim(), sku: invForm.sku.trim().toUpperCase(), itemType: invForm.itemType, category: invForm.category.trim(), quantity: Number(invForm.quantity), unitCost: Number(invForm.unitCost), reorderLevel: Number(invForm.reorderLevel), updatedAt: now }
          : it,
      )
      toast.success("Item updated.")
    } else {
      const newItem: InventoryItem = { id: crypto.randomUUID(), name: invForm.name.trim(), sku: invForm.sku.trim().toUpperCase(), itemType: invForm.itemType, category: invForm.category.trim(), quantity: Number(invForm.quantity), unitCost: Number(invForm.unitCost), reorderLevel: Number(invForm.reorderLevel), createdAt: now, updatedAt: now }
      next = [newItem, ...inventoryItems]
      toast.success("Item added.")
    }
    writeInventory(next)
    setInventoryItems(next)
    setInvForm(initialInvForm)
    setInvFormErrors({})
    setShowInvForm(false)
    setEditingItem(null)
  }

  function startEditItem(item: InventoryItem) {
    setEditingItem(item)
    setInvForm({ name: item.name, sku: item.sku, itemType: item.itemType, category: item.category, quantity: String(item.quantity), unitCost: String(item.unitCost), reorderLevel: String(item.reorderLevel) })
    setInvFormErrors({})
    setShowInvForm(true)
  }

  function deleteInventoryItem(id: string) {
    if (!window.confirm("Delete this inventory item?")) return
    const next = inventoryItems.filter((it) => it.id !== id)
    writeInventory(next)
    setInventoryItems(next)
    toast.success("Item deleted.")
  }

  // ── POS functions ────────────────────────────────────────────────────────
  function addToCart(item: InventoryItem) {
    if (item.itemType === "product" && item.quantity === 0) { toast.error("Item is out of stock."); return }
    setCart((prev) => {
      const existing = prev.find((e) => e.item.id === item.id)
      if (existing) {
        if (item.itemType === "product" && existing.qty >= item.quantity) { toast.error("Not enough stock."); return prev }
        return prev.map((e) => e.item.id === item.id ? { ...e, qty: e.qty + 1 } : e)
      }
      return [...prev, { item, qty: 1 }]
    })
  }

  function changeCartQty(itemId: string, delta: number) {
    setCart((prev) =>
      prev.flatMap((e) => {
        if (e.item.id !== itemId) return [e]
        const next = e.qty + delta
        if (next <= 0) return []
        if (e.item.itemType === "product" && next > e.item.quantity) { toast.error("Not enough stock."); return [e] }
        return [{ ...e, qty: next }]
      }),
    )
  }

  function replaceInvoicePreview(url: string, kind: "html" | "pdf", name: string, printOnLoad = false) {
    if (invoicePreviewUrl) URL.revokeObjectURL(invoicePreviewUrl)
    setInvoicePreviewUrl(url)
    setInvoicePreviewKind(kind)
    setInvoicePreviewName(name)
    setPrintAfterPreviewLoad(printOnLoad)
  }

  function clearInvoicePreview() {
    if (invoicePreviewUrl) URL.revokeObjectURL(invoicePreviewUrl)
    setInvoicePreviewUrl(null)
    setInvoicePreviewKind(null)
    setInvoicePreviewName("")
    setPrintAfterPreviewLoad(false)
  }

  function viewInvoiceFile(txn: SaleTransaction) {
    setLatestInvoice(txn)
    const html = invoiceHtml(txn)
    const blob = new Blob([html], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    replaceInvoicePreview(url, "html", `invoice-${txn.id.slice(0, 8)}.html`)
  }

  function printInvoice(txn: SaleTransaction) {
    setLatestInvoice(txn)
    const html = invoiceHtml(txn)
    const blob = new Blob([html], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    replaceInvoicePreview(url, "html", `invoice-${txn.id.slice(0, 8)}.html`, true)
  }

  async function createInvoicePdfBlob(txn: SaleTransaction) {
    const moduleName = "jspdf"
    const { jsPDF } = await import(/* @vite-ignore */ moduleName)
    const doc = new jsPDF({ unit: "pt", format: "a4" })
    const logoDataUrl = await getInvoiceLogoDataUrl()
    const left = 44
    const right = 551
    const receiptNo = txn.id.slice(0, 8).toUpperCase()
    let y = 56

    doc.setFillColor(255, 255, 255)
    doc.rect(0, 0, 595, 842, "F")

    doc.setDrawColor(63, 63, 70)
    doc.setLineWidth(1.1)
    doc.roundedRect(28, 28, 539, 786, 12, 12, "S")

    doc.setFillColor(239, 68, 68)
    doc.rect(28, 28, 539, 4, "F")

    if (logoDataUrl) {
      doc.addImage(logoDataUrl, "JPEG", left, y - 14, 28, 28)
    }

    doc.setTextColor(39, 39, 42)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(11)
    doc.text("SPEC-C AUTO PMS XPRESS", left + 36, y)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.setTextColor(82, 82, 91)
    doc.text("Auto Service and Preventive Maintenance", left + 36, y + 14)

    doc.setFont("helvetica", "bold")
    doc.setFontSize(28)
    doc.setTextColor(39, 39, 42)
    doc.text("RECEIPT", right, y + 3, { align: "right" })
    doc.setFont("courier", "normal")
    doc.setFontSize(9)
    doc.setTextColor(82, 82, 91)
    doc.text(`No. ${receiptNo}`, right, y + 18, { align: "right" })

    y += 34
    doc.setDrawColor(63, 63, 70)
    doc.setLineWidth(1)
    doc.line(left, y, right, y)

    y += 16
    doc.setDrawColor(113, 113, 122)
    doc.setFillColor(244, 244, 245)
    doc.roundedRect(left, y, 245, 50, 8, 8, "FD")
    doc.roundedRect(left + 260, y, 247, 50, 8, 8, "FD")

    doc.setFont("helvetica", "bold")
    doc.setFontSize(8)
    doc.setTextColor(82, 82, 91)
    doc.text("DATE / TIME", left + 10, y + 14)
    doc.text("CASHIER", left + 270, y + 14)

    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.setTextColor(39, 39, 42)
    doc.text(new Date(txn.createdAt).toLocaleString(), left + 10, y + 31)
    doc.text(txn.processedBy, left + 270, y + 31)

    y += 66
    doc.setDrawColor(113, 113, 122)
    doc.setFillColor(244, 244, 245)
    doc.roundedRect(left, y, right - left, 22, 6, 6, "FD")

    const col = { item: left + 8, qty: left + 300, unit: left + 375, total: left + 467 }
    doc.setFont("helvetica", "bold")
    doc.setFontSize(8)
    doc.setTextColor(82, 82, 91)
    doc.text("DESCRIPTION", col.item, y + 14)
    doc.text("QTY", col.qty, y + 14)
    doc.text("UNIT PRICE", col.unit, y + 14)
    doc.text("LINE TOTAL", col.total, y + 14)

    y += 30
    doc.setFontSize(10)
    doc.setTextColor(39, 39, 42)

    const printableLines: SaleLineItem[] = txn.lineItems.slice(0, 16)
    for (const line of printableLines) {
      if (y > 650) break
      const amount = line.quantity * line.unitPrice
      doc.setDrawColor(212, 212, 216)
      doc.line(left, y + 16, right, y + 16)

      doc.setFont("helvetica", "normal")
      doc.text(line.itemName.slice(0, 42), col.item, y)
      doc.setFont("courier", "normal")
      doc.setFontSize(8)
      doc.setTextColor(113, 113, 122)
      doc.text(line.sku, col.item, y + 10)

      doc.setFontSize(10)
      doc.setTextColor(39, 39, 42)
      doc.text(String(line.quantity), col.qty, y)
      doc.text(formatMoney(line.unitPrice), col.unit, y)
      doc.text(formatMoney(amount), col.total, y)
      y += 22
    }

    y = Math.max(y + 8, 664)
    doc.setDrawColor(113, 113, 122)
    doc.roundedRect(left + 290, y, 217, 86, 8, 8, "S")

    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.setTextColor(82, 82, 91)
    doc.text("Subtotal", left + 304, y + 20)
    doc.text("Discount", left + 304, y + 40)
    doc.setFont("helvetica", "bold")
    doc.text("Amount Paid", left + 304, y + 66)

    doc.setFont("courier", "normal")
    doc.setTextColor(39, 39, 42)
    doc.text(formatMoney(txn.subtotal), right - 12, y + 20, { align: "right" })
    doc.text(`- ${formatMoney(txn.discount)}`, right - 12, y + 40, { align: "right" })
    doc.setFont("courier", "bold")
    doc.text(formatMoney(txn.total), right - 12, y + 66, { align: "right" })

    doc.setDrawColor(63, 63, 70)
    doc.line(left, 764, right, 764)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.setTextColor(63, 63, 70)
    doc.text("THANK YOU FOR CHOOSING SPEC-C", 298, 781, { align: "center" })
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.setTextColor(113, 113, 122)
    doc.text("This receipt is system generated and valid without signature.", left, 797)
    doc.text(`Generated ${new Date().toLocaleString()}`, right, 797, { align: "right" })

    return doc.output("blob") as Blob
  }

  async function saveInvoiceAsPdf(txn: SaleTransaction) {
    setSavingInvoicePdf(true)
    try {
      setLatestInvoice(txn)
      const blob = await createInvoicePdfBlob(txn)
      const url = URL.createObjectURL(blob)
      replaceInvoicePreview(url, "pdf", `invoice-${txn.id.slice(0, 8)}.pdf`)
      toast.success("PDF is ready below.")
    } catch {
      toast.error("Unable to generate PDF right now.")
    } finally {
      setSavingInvoicePdf(false)
    }
  }

  function processSale() {
    if (cart.length === 0) { toast.error("Cart is empty."); return }
    const now = new Date().toISOString()
    const txn: SaleTransaction = {
      id: crypto.randomUUID(),
      lineItems: cart.map((e) => ({ itemId: e.item.id, itemName: e.item.name, sku: e.item.sku, quantity: e.qty, unitPrice: e.item.unitCost })),
      subtotal: cartSubtotal,
      discount: cartDiscount,
      total: cartTotal,
      processedBy: activeUser.name,
      createdAt: now,
    }
    setPendingSale({ txn, cartEntries: [...cart] })
  }

  function confirmSalePayment() {
    if (!pendingSale) return
    const { txn, cartEntries } = pendingSale
    // Deduct stock
    const updatedInv = inventoryItems.map((it) => {
      const entry = cartEntries.find((e) => e.item.id === it.id)
      if (!entry) return it
      if (it.itemType === "service") return it
      return { ...it, quantity: it.quantity - entry.qty, updatedAt: txn.createdAt }
    })
    writeInventory(updatedInv)
    setInventoryItems(updatedInv)
    const nextTxns = [txn, ...transactions]
    writeTransactions(nextTxns)
    setTransactions(nextTxns)
    setPendingSale(null)
    setCart([])
    setPosDiscount("")
    clearInvoicePreview()
    setLatestInvoice(txn)
    toast.success(`Sale processed — ${formatMoney(txn.total)}`)
  }

  function cancelSalePayment() {
    setPendingSale(null)
    toast.message("Payment confirmation cancelled.")
  }

  const navigation = [
    { id: "dashboard" as const, label: "Dashboard", icon: LayoutDashboardIcon },
    { id: "create" as const, label: "Create PMS", icon: PlusCircleIcon },
    { id: "records" as const, label: "Search / Records", icon: SearchIcon },
    { id: "admin" as const, label: "Admin", icon: ShieldIcon },
    { id: "inventory" as const, label: "Inventory", icon: PackageIcon },
    { id: "pos" as const, label: "Point of Sale", icon: ShoppingCartIcon },
    { id: "analytics" as const, label: "Sales & Analytics", icon: BarChart3Icon },
  ]

  return (
    <div className="h-dvh overflow-hidden bg-zinc-950 text-zinc-100">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-zinc-950/75 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-zinc-800 bg-zinc-900 transition-transform duration-200 ease-in-out",
          "md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 border-b border-zinc-800 px-4 py-3.5">
          <img
            src="/speclogo.jpg"
            alt="SPEC-C"
            className="size-10 shrink-0 rounded-md object-cover"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold tracking-tight text-zinc-100">SPEC-C</p>
            <p className="truncate text-[10px] font-medium uppercase tracking-widest text-red-500">Auto PMS Xpress</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 p-3">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = page === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setPage(item.id)
                  setSidebarOpen(false)
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150",
                  isActive
                    ? "bg-zinc-800 text-zinc-100"
                    : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200",
                )}
              >
                <Icon size={15} />
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* Stats strip */}
        <div className="border-t border-zinc-800 px-5 py-3">
          <div className="flex gap-4 text-[11px] text-zinc-600">
            <span>{storageService.mode}</span>
            <span>{records.length} records</span>
            <span>{dashboardStats.uniqueVehicles} vehicles</span>
          </div>
        </div>

        {/* User area */}
        <div className="space-y-2 border-t border-zinc-800 p-3">
          <Select value={activeUser.id} onValueChange={handleSwitchUser}>
            <SelectTrigger className="h-9 w-full border-zinc-700/60 bg-zinc-800/50 text-sm text-zinc-200">
              <SelectValue placeholder="Switch user" />
            </SelectTrigger>
            <SelectContent className="border-zinc-700/80 bg-zinc-900 text-zinc-100">
              <SelectGroup>
                <SelectLabel className="text-[11px] uppercase tracking-widest text-zinc-500">
                  Switch account
                </SelectLabel>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id} className="focus:bg-zinc-800">
                    <span className="flex items-center gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-[10px] font-semibold uppercase">
                        {user.name.charAt(0)}
                      </span>
                      <span className="truncate">{user.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <span className="flex-1 rounded-md bg-zinc-800 px-2 py-1 text-center text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
              {activeUser.role}
            </span>
            <button
              type="button"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
              className="flex h-7 w-7 items-center justify-center rounded-md border border-zinc-700/60 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
            >
              {resolvedTheme === "dark" ? <SunIcon size={13} /> : <MoonIcon size={13} />}
            </button>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                aria-label="Sign out"
                className="flex h-7 w-7 items-center justify-center rounded-md border border-zinc-700/60 text-zinc-400 transition-colors hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
              >
                <LogOutIcon size={13} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ── Main shell (offset on desktop) ── */}
      <div className="flex h-dvh flex-col overflow-hidden md:ml-60">
        {/* Top bar */}
        <header className="flex shrink-0 items-center gap-3 border-b border-zinc-800 bg-zinc-950 px-4 py-3">
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 md:hidden"
          >
            {sidebarOpen ? <XIcon size={16} /> : <MenuIcon size={16} />}
          </button>
          <h1 className="flex-1 text-sm font-semibold text-zinc-100">
            {navigation.find((n) => n.id === page)?.label}
          </h1>
          {page === "records" && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={exportJson}
                disabled={!permissions.export}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700/60 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <DownloadIcon size={12} />
                JSON
              </button>
              <button
                type="button"
                onClick={exportCsv}
                disabled={!permissions.export}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700/60 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <DownloadIcon size={12} />
                CSV
              </button>
            </div>
          )}
          {page === "create" && permissions.create && (
            <button
              type="submit"
              form="create-pms-form"
              className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-900 transition-all hover:bg-white active:scale-[0.98]"
            >
              Save record
            </button>
          )}
          {page === "inventory" && permissions.create && (
            <button
              type="button"
              onClick={() => { setEditingItem(null); setInvForm(initialInvForm); setInvFormErrors({}); setShowInvForm((v) => !v) }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-900 transition-all hover:bg-white active:scale-[0.98]"
            >
              <PlusIcon size={12} />
              Add Item
            </button>
          )}
          {page === "pos" && cart.length > 0 && (
            <button
              type="button"
              onClick={processSale}
              className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-900 transition-all hover:bg-white active:scale-[0.98]"
            >
              <ReceiptIcon size={12} />
              Process Sale
            </button>
          )}
        </header>

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto p-5 md:p-6">
          {!permissions.read && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
              <p className="text-sm font-medium text-zinc-100">Access limited</p>
              <p className="mt-1 text-sm text-zinc-400">Your current role cannot view records.</p>
            </div>
          )}

          {/* ─── Dashboard ─── */}
          {permissions.read && page === "dashboard" && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {[
                  { icon: ClipboardListIcon, label: "Total Records", value: dashboardStats.total },
                  { icon: CarIcon, label: "Unique Vehicles", value: dashboardStats.uniqueVehicles },
                  { icon: GaugeIcon, label: "Upcoming (30 days)", value: dashboardStats.upcoming },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
                    <div className="mb-3 flex items-center gap-2">
                      <Icon size={13} className="text-zinc-500" />
                      <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">{label}</span>
                    </div>
                    <p className="font-mono text-3xl font-semibold tracking-tight text-zinc-50">{value}</p>
                  </div>
                ))}
              </div>

              <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
                <div className="border-b border-zinc-800 px-5 py-4">
                  <p className="text-sm font-semibold text-zinc-100">Latest PMS Entries</p>
                  <p className="mt-0.5 text-xs text-zinc-500">Most recent inspections across all vehicles</p>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-800 hover:bg-transparent">
                      <TableHead className="text-zinc-500">Date</TableHead>
                      <TableHead className="text-zinc-500">Owner</TableHead>
                      <TableHead className="text-zinc-500">Vehicle</TableHead>
                      <TableHead className="text-zinc-500">Plate</TableHead>
                      <TableHead className="text-right text-zinc-500">Odo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.slice(0, 6).map((record) => (
                      <TableRow key={record.id} className="border-zinc-800 hover:bg-zinc-800/40">
                        <TableCell className="text-zinc-300">{formatDate(record.dateInspection)}</TableCell>
                        <TableCell className="font-medium text-zinc-100">{record.name}</TableCell>
                        <TableCell className="text-zinc-300">{record.vehicle}</TableCell>
                        <TableCell>
                          <span className="rounded-md bg-zinc-800 px-2 py-0.5 font-mono text-xs text-zinc-200">
                            {record.licensePlate}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm text-zinc-300">
                          {record.currentOdo.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                    {records.length === 0 && (
                      <TableRow className="border-zinc-800">
                        <TableCell colSpan={5} className="py-12 text-center text-zinc-500">
                          No records yet. Create your first PMS entry.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* ─── Create record ─── */}
          {permissions.read && page === "create" && (
            <div className="mx-auto max-w-2xl">
              {!permissions.create && (
                <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
                  <p className="text-sm text-amber-400">Your role is read-only. You cannot create records.</p>
                </div>
              )}
              <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
                <div className="border-b border-zinc-800 px-6 py-4">
                  <p className="text-sm font-semibold text-zinc-100">New PMS Record</p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    Add a preventive maintenance entry. Enter a plate number to autofill from history.
                  </p>
                </div>
                <form id="create-pms-form" className="space-y-5 p-6" onSubmit={handleCreateRecord}>
                  {/* Inspection info */}
                  <div>
                    <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
                      Inspection Info
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="dateInspection" className="text-xs font-medium text-zinc-300">
                          Date of Inspection
                        </Label>
                        <Input
                          id="dateInspection"
                          type="date"
                          value={form.dateInspection}
                          onChange={(e) => setFormValue("dateInspection", e.target.value)}
                          className="h-9 border-zinc-700/60 bg-zinc-800/50 text-zinc-100"
                        />
                        {formErrors.dateInspection && (
                          <p className="text-xs text-red-400">{formErrors.dateInspection}</p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="scheduleDate" className="text-xs font-medium text-zinc-300">
                          Schedule Date
                        </Label>
                        <Input
                          id="scheduleDate"
                          type="date"
                          value={form.scheduleDate}
                          onChange={(e) => setFormValue("scheduleDate", e.target.value)}
                          className="h-9 border-zinc-700/60 bg-zinc-800/50 text-zinc-100"
                        />
                        {formErrors.scheduleDate && (
                          <p className="text-xs text-red-400">{formErrors.scheduleDate}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-zinc-800" />

                  {/* Vehicle details */}
                  <div>
                    <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
                      Vehicle Details
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="licensePlate" className="text-xs font-medium text-zinc-300">
                          License Plate
                        </Label>
                        <Input
                          id="licensePlate"
                          value={form.licensePlate}
                          onChange={(e) => setFormValue("licensePlate", e.target.value.toUpperCase())}
                          placeholder="ABC-1234"
                          className="h-9 border-zinc-700/60 bg-zinc-800/50 font-mono text-zinc-100 placeholder:text-zinc-600"
                        />
                        {formErrors.licensePlate && (
                          <p className="text-xs text-red-400">{formErrors.licensePlate}</p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="name" className="text-xs font-medium text-zinc-300">
                          Owner Name
                        </Label>
                        <Input
                          id="name"
                          value={form.name}
                          onChange={(e) => setFormValue("name", e.target.value)}
                          className="h-9 border-zinc-700/60 bg-zinc-800/50 text-zinc-100"
                        />
                        {formErrors.name && <p className="text-xs text-red-400">{formErrors.name}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="vehicle" className="text-xs font-medium text-zinc-300">
                          Vehicle Model / Type
                        </Label>
                        <Input
                          id="vehicle"
                          value={form.vehicle}
                          onChange={(e) => setFormValue("vehicle", e.target.value)}
                          className="h-9 border-zinc-700/60 bg-zinc-800/50 text-zinc-100"
                        />
                        {formErrors.vehicle && <p className="text-xs text-red-400">{formErrors.vehicle}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="currentOdo" className="text-xs font-medium text-zinc-300">
                          Current Odometer
                        </Label>
                        <Input
                          id="currentOdo"
                          value={form.currentOdo}
                          onChange={(e) => setFormValue("currentOdo", e.target.value)}
                          placeholder="e.g. 45000"
                          className="h-9 border-zinc-700/60 bg-zinc-800/50 font-mono text-zinc-100 placeholder:text-zinc-600"
                        />
                        {formErrors.currentOdo && (
                          <p className="text-xs text-red-400">{formErrors.currentOdo}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-zinc-800" />

                  {/* Maintenance details */}
                  <div>
                    <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
                      Maintenance Details
                    </p>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="batteryInfo" className="text-xs font-medium text-zinc-300">
                          Battery Info
                        </Label>
                        <Input
                          id="batteryInfo"
                          value={form.batteryInfo}
                          onChange={(e) => setFormValue("batteryInfo", e.target.value)}
                          className="h-9 border-zinc-700/60 bg-zinc-800/50 text-zinc-100"
                        />
                        {formErrors.batteryInfo && (
                          <p className="text-xs text-red-400">{formErrors.batteryInfo}</p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="recommendation" className="text-xs font-medium text-zinc-300">
                          Recommendation
                        </Label>
                        <Textarea
                          id="recommendation"
                          value={form.recommendation}
                          onChange={(e) => setFormValue("recommendation", e.target.value)}
                          rows={3}
                          className="resize-none border-zinc-700/60 bg-zinc-800/50 text-zinc-100"
                        />
                        {formErrors.recommendation && (
                          <p className="text-xs text-red-400">{formErrors.recommendation}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Autofill notice */}
                  {latestByPlateForForm && (
                    <div className="flex items-center justify-between rounded-lg border border-zinc-700/60 bg-zinc-800/40 px-4 py-3">
                      <div>
                        <p className="text-xs font-medium text-zinc-300">Existing vehicle found</p>
                        <p className="text-xs text-zinc-500">
                          Last inspected: {formatDate(latestByPlateForForm.dateInspection)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => applyAutofillFrom(latestByPlateForForm)}
                        className="rounded-lg border border-zinc-600/60 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-zinc-100"
                      >
                        Autofill
                      </button>
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={!permissions.create}
                    className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-zinc-100 text-sm font-semibold text-zinc-900 transition-all hover:bg-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Save PMS Record
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ─── Records / Search ─── */}
          {permissions.read && page === "records" && (
            <div className="space-y-5">
              {/* Search bar */}
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <SearchIcon
                    size={13}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                  />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search records..."
                    className="h-9 border-zinc-700/60 bg-zinc-900 pl-8 text-zinc-100 placeholder:text-zinc-600"
                  />
                </div>
                <Select value={searchField} onValueChange={(v) => setSearchField(v as SearchField)}>
                  <SelectTrigger className="h-9 w-full border-zinc-700/60 bg-zinc-900 text-zinc-300 sm:w-44">
                    <SelectValue placeholder="Search by" />
                  </SelectTrigger>
                  <SelectContent className="border-zinc-700/80 bg-zinc-900 text-zinc-100">
                    <SelectGroup>
                      <SelectLabel className="text-[11px] uppercase tracking-widest text-zinc-500">
                        Search by
                      </SelectLabel>
                      <SelectItem value="all" className="focus:bg-zinc-800">All fields</SelectItem>
                      <SelectItem value="name" className="focus:bg-zinc-800">Owner name</SelectItem>
                      <SelectItem value="vehicle" className="focus:bg-zinc-800">Vehicle</SelectItem>
                      <SelectItem value="licensePlate" className="focus:bg-zinc-800">License plate</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <Select value={historyOrder} onValueChange={(v) => setHistoryOrder(v as HistoryOrder)}>
                  <SelectTrigger className="h-9 w-full border-zinc-700/60 bg-zinc-900 text-zinc-300 sm:w-40">
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent className="border-zinc-700/80 bg-zinc-900 text-zinc-100">
                    <SelectGroup>
                      <SelectLabel className="text-[11px] uppercase tracking-widest text-zinc-500">Sort</SelectLabel>
                      <SelectItem value="newest" className="focus:bg-zinc-800">Newest first</SelectItem>
                      <SelectItem value="oldest" className="focus:bg-zinc-800">Oldest first</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              {/* Edit form */}
              {editingRecord && (
                <div className="overflow-hidden rounded-xl border border-zinc-700/80 bg-zinc-900">
                  <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3.5">
                    <div>
                      <p className="text-sm font-semibold text-zinc-100">Edit Record</p>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        {editingRecord.licensePlate} — {formatDate(editingRecord.dateInspection)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingRecord(null)}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
                    >
                      <XIcon size={14} />
                    </button>
                  </div>
                  <form className="grid gap-4 p-5 sm:grid-cols-2" onSubmit={saveEdit}>
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-dateInspection" className="text-xs text-zinc-300">Date of Inspection</Label>
                      <Input id="edit-dateInspection" type="date" value={editForm.dateInspection} onChange={(e) => setEditFormValue("dateInspection", e.target.value)} className="h-9 border-zinc-700/60 bg-zinc-800/50 text-zinc-100" />
                      {editErrors.dateInspection && <p className="text-xs text-red-400">{editErrors.dateInspection}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-name" className="text-xs text-zinc-300">Owner Name</Label>
                      <Input id="edit-name" value={editForm.name} onChange={(e) => setEditFormValue("name", e.target.value)} className="h-9 border-zinc-700/60 bg-zinc-800/50 text-zinc-100" />
                      {editErrors.name && <p className="text-xs text-red-400">{editErrors.name}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-vehicle" className="text-xs text-zinc-300">Vehicle</Label>
                      <Input id="edit-vehicle" value={editForm.vehicle} onChange={(e) => setEditFormValue("vehicle", e.target.value)} className="h-9 border-zinc-700/60 bg-zinc-800/50 text-zinc-100" />
                      {editErrors.vehicle && <p className="text-xs text-red-400">{editErrors.vehicle}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-licensePlate" className="text-xs text-zinc-300">License Plate</Label>
                      <Input id="edit-licensePlate" value={editForm.licensePlate} onChange={(e) => setEditFormValue("licensePlate", e.target.value.toUpperCase())} className="h-9 border-zinc-700/60 bg-zinc-800/50 font-mono text-zinc-100" />
                      {editErrors.licensePlate && <p className="text-xs text-red-400">{editErrors.licensePlate}</p>}
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="edit-recommendation" className="text-xs text-zinc-300">Recommendation</Label>
                      <Textarea id="edit-recommendation" value={editForm.recommendation} onChange={(e) => setEditFormValue("recommendation", e.target.value)} rows={2} className="resize-none border-zinc-700/60 bg-zinc-800/50 text-zinc-100" />
                      {editErrors.recommendation && <p className="text-xs text-red-400">{editErrors.recommendation}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-scheduleDate" className="text-xs text-zinc-300">Schedule Date</Label>
                      <Input id="edit-scheduleDate" type="date" value={editForm.scheduleDate} onChange={(e) => setEditFormValue("scheduleDate", e.target.value)} className="h-9 border-zinc-700/60 bg-zinc-800/50 text-zinc-100" />
                      {editErrors.scheduleDate && <p className="text-xs text-red-400">{editErrors.scheduleDate}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-batteryInfo" className="text-xs text-zinc-300">Battery Info</Label>
                      <Input id="edit-batteryInfo" value={editForm.batteryInfo} onChange={(e) => setEditFormValue("batteryInfo", e.target.value)} className="h-9 border-zinc-700/60 bg-zinc-800/50 text-zinc-100" />
                      {editErrors.batteryInfo && <p className="text-xs text-red-400">{editErrors.batteryInfo}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-currentOdo" className="text-xs text-zinc-300">Current Odometer</Label>
                      <Input id="edit-currentOdo" value={editForm.currentOdo} onChange={(e) => setEditFormValue("currentOdo", e.target.value)} className="h-9 border-zinc-700/60 bg-zinc-800/50 font-mono text-zinc-100" />
                      {editErrors.currentOdo && <p className="text-xs text-red-400">{editErrors.currentOdo}</p>}
                    </div>
                    <div className="flex items-end gap-2 sm:col-span-2">
                      <button
                        type="submit"
                        className="flex h-9 items-center gap-2 rounded-lg bg-zinc-100 px-4 text-sm font-semibold text-zinc-900 transition-all hover:bg-white active:scale-[0.98]"
                      >
                        Save changes
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingRecord(null)}
                        className="flex h-9 items-center gap-2 rounded-lg border border-zinc-700/60 px-4 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Vehicle groups */}
              {groupedHistory.map((group) => (
                <div key={group.plate} className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-semibold text-zinc-100">{group.plate}</span>
                      <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-400">
                        {group.items.length} {group.items.length === 1 ? "entry" : "entries"}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500">
                      {group.latest.name} · {group.latest.vehicle} · Next: {formatDate(group.latest.scheduleDate)}
                    </p>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-zinc-800 hover:bg-transparent">
                        <TableHead className="text-zinc-500">Inspected</TableHead>
                        <TableHead className="text-right text-zinc-500">Odo</TableHead>
                        <TableHead className="text-zinc-500">Battery</TableHead>
                        <TableHead className="text-zinc-500">Recommendation</TableHead>
                        <TableHead className="text-zinc-500">Created</TableHead>
                        <TableHead className="text-right text-zinc-500">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.items.map((record) => (
                        <TableRow key={record.id} className="border-zinc-800 hover:bg-zinc-800/30">
                          <TableCell className="text-zinc-300">{formatDate(record.dateInspection)}</TableCell>
                          <TableCell className="text-right font-mono text-sm text-zinc-300">
                            {record.currentOdo.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-zinc-400">{record.batteryInfo}</TableCell>
                          <TableCell className="max-w-64 truncate text-zinc-400">{record.recommendation}</TableCell>
                          <TableCell className="text-xs text-zinc-500">
                            {new Date(record.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => startEdit(record)}
                                disabled={!permissions.edit}
                                className="rounded-md border border-zinc-700/60 px-2.5 py-1 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => removeRecord(record)}
                                disabled={!permissions.delete}
                                className="inline-flex items-center gap-1 rounded-md border border-zinc-700/60 px-2.5 py-1 text-xs font-medium text-zinc-300 transition-colors hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                <Trash2Icon size={11} />
                                Delete
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ))}

              {groupedHistory.length === 0 && (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-12 text-center">
                  <SearchIcon size={24} className="mx-auto mb-3 text-zinc-700" />
                  <p className="text-sm font-medium text-zinc-400">No records found</p>
                  <p className="mt-1 text-xs text-zinc-600">Try adjusting your search or field filter</p>
                </div>
              )}
            </div>
          )}

          {/* ─── Admin ─── */}
          {permissions.read && page === "admin" && (
            <div className="mx-auto max-w-2xl">
              <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
                <div className="border-b border-zinc-800 px-5 py-4">
                  <p className="text-sm font-semibold text-zinc-100">RBAC Management</p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    Mock local roles — ready to replace with Supabase Auth.
                  </p>
                </div>
                {!permissions.manage && (
                  <div className="border-b border-zinc-800 bg-amber-500/5 px-5 py-3">
                    <p className="text-xs text-amber-400">Only admins can update role assignments.</p>
                  </div>
                )}
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-800 hover:bg-transparent">
                      <TableHead className="text-zinc-500">User</TableHead>
                      <TableHead className="text-zinc-500">Current Role</TableHead>
                      <TableHead className="text-zinc-500">Change Role</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id} className="border-zinc-800 hover:bg-zinc-800/30">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-700 text-xs font-semibold uppercase text-zinc-200">
                              {user.name.charAt(0)}
                            </span>
                            <span className="text-sm text-zinc-100">{user.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "rounded-md px-2 py-0.5 text-xs font-semibold uppercase tracking-wider",
                              user.role === "admin" && "bg-amber-500/15 text-amber-400",
                              user.role === "staff" && "bg-blue-500/15 text-blue-400",
                              user.role === "viewer" && "bg-zinc-700 text-zinc-400",
                            )}
                          >
                            {user.role}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={user.role}
                            onValueChange={(v) => handleRoleChange(user.id, v as UserRole)}
                            disabled={!permissions.manage}
                          >
                            <SelectTrigger className="h-8 w-40 border-zinc-700/60 bg-zinc-800/50 text-sm text-zinc-200 disabled:opacity-40">
                              <SelectValue placeholder="Role" />
                            </SelectTrigger>
                            <SelectContent className="border-zinc-700/80 bg-zinc-900 text-zinc-100">
                              <SelectGroup>
                                <SelectLabel className="text-[11px] uppercase tracking-widest text-zinc-500">
                                  Role
                                </SelectLabel>
                                <SelectItem value="admin" className="focus:bg-zinc-800">Admin</SelectItem>
                                <SelectItem value="staff" className="focus:bg-zinc-800">Staff</SelectItem>
                                <SelectItem value="viewer" className="focus:bg-zinc-800">Viewer</SelectItem>
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
          {/* ─── Inventory ─── */}
          {permissions.read && page === "inventory" && (
            <div className="space-y-5">
              {/* Stats */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { icon: PackageIcon, label: "Total Items", value: inventoryItems.length },
                  { icon: ScanTextIcon, label: "Services", value: inventoryItems.filter((i) => i.itemType === "service").length },
                  { icon: TrendingUpIcon, label: "Low Stock", value: inventoryItems.filter((i) => i.itemType === "product" && i.quantity <= i.reorderLevel).length },
                  { icon: TagIcon, label: "Total Value", value: `₱${inventoryItems.reduce((s, i) => s + i.quantity * i.unitCost, 0).toLocaleString("en-PH")}` },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
                    <div className="mb-3 flex items-center gap-2">
                      <Icon size={13} className="text-zinc-500" />
                      <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">{label}</span>
                    </div>
                    <p className="font-mono text-3xl font-semibold tracking-tight text-zinc-50">{value}</p>
                  </div>
                ))}
              </div>

              {/* Search */}
              <div className="relative">
                <SearchIcon size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <Input
                  value={invSearch}
                  onChange={(e) => setInvSearch(e.target.value)}
                  placeholder="Search items..."
                  className="h-9 border-zinc-700/60 bg-zinc-900 pl-8 text-zinc-100 placeholder:text-zinc-600"
                />
              </div>

              {/* Add / Edit form */}
              {showInvForm && (
                <div className="overflow-hidden rounded-xl border border-zinc-700/80 bg-zinc-900">
                  <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3.5">
                    <p className="text-sm font-semibold text-zinc-100">{editingItem ? "Edit Item" : "New Inventory Item"}</p>
                    <button type="button" onClick={() => { setShowInvForm(false); setEditingItem(null) }} className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200">
                      <XIcon size={14} />
                    </button>
                  </div>
                  <form className="grid gap-4 p-5 sm:grid-cols-2 md:grid-cols-3" onSubmit={saveInventoryItem}>
                    {(["name", "sku", "category", "quantity", "unitCost", "reorderLevel"] as const).map((field) => (
                      <div key={field} className="space-y-1.5">
                        <Label htmlFor={`inv-${field}`} className="text-xs text-zinc-300 capitalize">
                          {field === "unitCost" ? "Unit Cost (₱)" : field === "reorderLevel" ? "Reorder Level" : field}
                        </Label>
                        <Input
                          id={`inv-${field}`}
                          value={invForm[field]}
                          onChange={(e) => setInvForm((p) => ({ ...p, [field]: field === "sku" ? e.target.value.toUpperCase() : e.target.value }))}
                          className="h-9 border-zinc-700/60 bg-zinc-800/50 text-zinc-100"
                        />
                        {invFormErrors[field] && <p className="text-xs text-red-400">{invFormErrors[field]}</p>}
                      </div>
                    ))}
                    <div className="space-y-1.5">
                      <Label htmlFor="inv-itemType" className="text-xs text-zinc-300">Type</Label>
                      <Select value={invForm.itemType} onValueChange={(value) => setInvForm((p) => ({ ...p, itemType: value as "product" | "service" }))}>
                        <SelectTrigger id="inv-itemType" className="h-9 border-zinc-700/60 bg-zinc-800/50 text-zinc-100">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent className="border-zinc-700/80 bg-zinc-900 text-zinc-100">
                          <SelectItem value="product" className="focus:bg-zinc-800">Product</SelectItem>
                          <SelectItem value="service" className="focus:bg-zinc-800">Service</SelectItem>
                        </SelectContent>
                      </Select>
                      {invFormErrors.itemType && <p className="text-xs text-red-400">{invFormErrors.itemType}</p>}
                    </div>
                    <div className="flex items-end gap-2 sm:col-span-2 md:col-span-3">
                      <button type="submit" className="flex h-9 items-center gap-2 rounded-lg bg-zinc-100 px-4 text-sm font-semibold text-zinc-900 transition-all hover:bg-white active:scale-[0.98]">
                        {editingItem ? "Save changes" : "Add item"}
                      </button>
                      <button type="button" onClick={() => { setShowInvForm(false); setEditingItem(null) }} className="flex h-9 items-center gap-2 rounded-lg border border-zinc-700/60 px-4 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800">
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Table */}
              <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-800 hover:bg-transparent">
                      <TableHead className="text-zinc-500">Item</TableHead>
                      <TableHead className="text-zinc-500">Type</TableHead>
                      <TableHead className="text-zinc-500">SKU</TableHead>
                      <TableHead className="text-zinc-500">Category</TableHead>
                      <TableHead className="text-right text-zinc-500">Qty</TableHead>
                      <TableHead className="text-right text-zinc-500">Unit Cost</TableHead>
                      <TableHead className="text-right text-zinc-500">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventoryItems
                      .filter((it) => {
                        const q = invSearch.toLowerCase()
                        return !q || it.name.toLowerCase().includes(q) || it.sku.toLowerCase().includes(q) || it.category.toLowerCase().includes(q)
                      })
                      .map((item) => {
                        const lowStock = item.itemType === "product" && item.quantity <= item.reorderLevel
                        return (
                          <TableRow key={item.id} className="hidden border-zinc-800 hover:bg-zinc-800/30 md:table-row">
                            <TableCell className="font-medium text-zinc-100">{item.name}</TableCell>
                            <TableCell>
                              <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider", item.itemType === "service" ? "bg-sky-500/15 text-sky-300" : "bg-zinc-800 text-zinc-300")}>
                                {item.itemType}
                              </span>
                            </TableCell>
                            <TableCell className="font-mono text-xs text-zinc-400">{item.sku}</TableCell>
                            <TableCell className="text-zinc-400">{item.category}</TableCell>
                            <TableCell className="text-right">
                              <span className={cn("rounded-md px-2 py-0.5 font-mono text-xs font-semibold", lowStock ? "bg-red-500/15 text-red-400" : "bg-zinc-800 text-zinc-200")}>
                                {item.itemType === "service" ? "service" : item.quantity}
                                {lowStock && " ⚠"}
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm text-zinc-300">
                              ₱{item.unitCost.toLocaleString("en-PH")}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1.5">
                                <button type="button" onClick={() => startEditItem(item)} className="rounded-md border border-zinc-700/60 px-2.5 py-1 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-zinc-100">
                                  Edit
                                </button>
                                <button type="button" onClick={() => deleteInventoryItem(item.id)} disabled={!permissions.delete} className="rounded-md border border-zinc-700/60 px-2.5 py-1 text-xs font-medium text-zinc-300 transition-colors hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-40">
                                  Delete
                                </button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    {inventoryItems
                      .filter((it) => {
                        const q = invSearch.toLowerCase()
                        return !q || it.name.toLowerCase().includes(q) || it.sku.toLowerCase().includes(q) || it.category.toLowerCase().includes(q)
                      })
                      .map((item) => {
                        const lowStock = item.itemType === "product" && item.quantity <= item.reorderLevel
                        return (
                          <TableRow key={`${item.id}-mobile`} className="border-zinc-800 md:hidden">
                            <TableCell colSpan={7} className="px-4 py-3">
                              <div className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-900/70 p-3">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <p className="text-sm font-semibold text-zinc-100">{item.name}</p>
                                    <p className="mt-1 font-mono text-[11px] text-zinc-500">{item.sku}</p>
                                  </div>
                                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider", item.itemType === "service" ? "bg-sky-500/15 text-sky-300" : "bg-zinc-800 text-zinc-300")}>{item.itemType}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-400">
                                  <p>Category: <span className="text-zinc-300">{item.category}</span></p>
                                  <p className="text-right">Price: <span className="font-mono text-zinc-200">₱{item.unitCost.toLocaleString("en-PH")}</span></p>
                                  <p>Stock: <span className={cn("font-mono", lowStock ? "text-red-400" : "text-zinc-300")}>{item.itemType === "service" ? "service" : item.quantity}</span></p>
                                  <p className="text-right">Reorder: <span className="font-mono text-zinc-300">{item.reorderLevel}</span></p>
                                </div>
                                <div className="flex gap-2">
                                  <button type="button" onClick={() => startEditItem(item)} className="flex-1 rounded-md border border-zinc-700/60 px-2.5 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-zinc-100">
                                    Edit
                                  </button>
                                  <button type="button" onClick={() => deleteInventoryItem(item.id)} disabled={!permissions.delete} className="flex-1 rounded-md border border-zinc-700/60 px-2.5 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-40">
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    {inventoryItems.length === 0 && (
                      <TableRow className="border-zinc-800">
                        <TableCell colSpan={7} className="py-12 text-center text-zinc-500">No items yet. Click "Add Item" to get started.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* ─── POS ─── */}
          {permissions.read && page === "pos" && (
            <div className="grid h-full min-h-0 gap-5 xl:grid-cols-[1fr_320px]">
              {/* Item browser */}
              <div className="flex min-w-0 flex-col gap-4 overflow-y-auto">
                <div className="relative">
                  <SearchIcon size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <Input
                    value={posSearch}
                    onChange={(e) => setPosSearch(e.target.value)}
                    placeholder="Search items..."
                    className="h-9 border-zinc-700/60 bg-zinc-900 pl-8 text-zinc-100 placeholder:text-zinc-600"
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {inventoryItems
                    .filter((it) => {
                      const q = posSearch.toLowerCase()
                      return !q || it.name.toLowerCase().includes(q) || it.sku.toLowerCase().includes(q) || it.category.toLowerCase().includes(q)
                    })
                    .map((item) => {
                      const inCart = cart.find((e) => e.item.id === item.id)
                      const outOfStock = item.itemType === "product" && item.quantity === 0
                      return (
                        <button
                          key={item.id}
                          type="button"
                          disabled={outOfStock}
                          onClick={() => addToCart(item)}
                          className={cn(
                            "relative flex flex-col rounded-xl border p-4 text-left transition-all duration-150",
                            outOfStock
                              ? "cursor-not-allowed border-zinc-800 bg-zinc-900/50 opacity-50"
                              : inCart
                                ? "border-zinc-500/60 bg-zinc-800"
                                : "border-zinc-800 bg-zinc-900 hover:border-zinc-600 hover:bg-zinc-800/70",
                          )}
                        >
                          {inCart && (
                            <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-200 text-[10px] font-bold text-zinc-900">
                              {inCart.qty}
                            </span>
                          )}
                          <span className={cn("mb-2 inline-flex w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider", item.itemType === "service" ? "bg-sky-500/15 text-sky-300" : "bg-zinc-800 text-zinc-400")}>{item.itemType}</span>
                          <span className="mb-1 text-xs font-mono text-zinc-500">{item.sku}</span>
                          <span className="text-sm font-medium leading-tight text-zinc-100">{item.name}</span>
                          <span className="mt-1 text-[11px] text-zinc-500">{item.category}</span>
                          <span className="mt-2 font-mono text-sm font-semibold text-zinc-300">₱{item.unitCost.toLocaleString("en-PH")}</span>
                          {item.itemType === "service" ? (
                            <span className="mt-1 text-[11px] text-sky-300/90">Service item</span>
                          ) : (
                            <span className={cn("mt-1 text-[11px]", item.quantity <= item.reorderLevel ? "text-red-400" : "text-zinc-500")}>
                              {item.quantity} in stock
                            </span>
                          )}
                        </button>
                      )
                    })}
                </div>
              </div>

              {/* Cart panel */}
              <div className="flex w-full shrink-0 flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 xl:w-80">
                <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-3.5">
                  <ShoppingCartIcon size={14} className="text-zinc-400" />
                  <p className="text-sm font-semibold text-zinc-100">Cart</p>
                  <span className="ml-auto rounded-full bg-zinc-700 px-2 py-0.5 text-[11px] font-semibold text-zinc-300">
                    {cart.reduce((s, e) => s + e.qty, 0)} items
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                      <ShoppingCartIcon size={28} className="text-zinc-700" />
                      <p className="text-xs text-zinc-600">Click an item to add it to the cart</p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-zinc-800">
                      {cart.map((entry) => (
                        <li key={entry.item.id} className="flex items-center gap-3 px-4 py-3">
                          <div className="flex-1 min-w-0">
                            <p className="truncate text-xs font-medium text-zinc-200">{entry.item.name}</p>
                            <p className="font-mono text-xs text-zinc-500">₱{entry.item.unitCost.toLocaleString("en-PH")}</p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button type="button" onClick={() => changeCartQty(entry.item.id, -1)} className="flex h-6 w-6 items-center justify-center rounded-md border border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200">
                              <MinusIcon size={11} />
                            </button>
                            <span className="w-6 text-center font-mono text-xs font-semibold text-zinc-200">{entry.qty}</span>
                            <button type="button" onClick={() => changeCartQty(entry.item.id, 1)} className="flex h-6 w-6 items-center justify-center rounded-md border border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200">
                              <PlusIcon size={11} />
                            </button>
                          </div>
                          <span className="w-20 shrink-0 text-right font-mono text-xs text-zinc-300">
                            ₱{(entry.item.unitCost * entry.qty).toLocaleString("en-PH")}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Totals */}
                <div className="shrink-0 space-y-3 border-t border-zinc-800 p-4">
                  <div className="flex items-center gap-2">
                    <TagIcon size={12} className="text-zinc-500" />
                    <Input
                      value={posDiscount}
                      onChange={(e) => setPosDiscount(e.target.value)}
                      placeholder="Discount %"
                      className="h-8 border-zinc-700/60 bg-zinc-800/50 text-xs text-zinc-100 placeholder:text-zinc-600"
                    />
                  </div>
                  <div className="space-y-1 text-xs text-zinc-400">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="font-mono">{formatMoney(cartSubtotal)}</span>
                    </div>
                    {discountPct > 0 && (
                      <div className="flex justify-between text-red-400">
                        <span>Discount ({posDiscount}%)</span>
                        <span className="font-mono">- {formatMoney(cartDiscount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-zinc-800 pt-2 text-sm font-semibold text-zinc-100">
                      <span>Total</span>
                      <span className="font-mono">{formatMoney(cartTotal)}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={processSale}
                    disabled={cart.length === 0}
                    className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-zinc-100 text-sm font-semibold text-zinc-900 transition-all hover:bg-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ReceiptIcon size={14} />
                    Process Sale
                  </button>
                  {cart.length > 0 && (
                    <button type="button" onClick={() => setCart([])} className="w-full text-center text-xs text-zinc-600 transition-colors hover:text-zinc-400">
                      Clear cart
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {pendingSale && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/70 p-4 backdrop-blur-sm">
              <div className="w-full max-w-lg rounded-2xl border border-zinc-700/80 bg-zinc-950 shadow-2xl shadow-black/40">
                <div className="border-b border-zinc-800 px-5 py-4">
                  <p className="text-sm font-semibold text-zinc-100">Confirm Payment</p>
                  <p className="mt-1 text-xs text-zinc-500">Verify payment details before generating invoice.</p>
                </div>
                <div className="space-y-3 px-5 py-4 text-sm">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span>Line Items</span>
                    <span className="font-mono text-zinc-200">{pendingSale.txn.lineItems.reduce((sum, item) => sum + item.quantity, 0)}</span>
                  </div>
                  <div className="flex items-center justify-between text-zinc-400">
                    <span>Subtotal</span>
                    <span className="font-mono text-zinc-200">{formatMoney(pendingSale.txn.subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-zinc-400">
                    <span>Discount</span>
                    <span className="font-mono text-zinc-200">- {formatMoney(pendingSale.txn.discount)}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-zinc-800 pt-3 text-base font-semibold text-zinc-100">
                    <span>Total Due</span>
                    <span className="font-mono">{formatMoney(pendingSale.txn.total)}</span>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 border-t border-zinc-800 px-5 py-4">
                  <button
                    type="button"
                    onClick={cancelSalePayment}
                    className="inline-flex h-9 items-center rounded-lg border border-zinc-700/60 px-3 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmSalePayment}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-zinc-100 px-3 text-xs font-semibold text-zinc-900 transition-all hover:bg-white"
                  >
                    <ReceiptIcon size={12} />
                    Confirm Payment
                  </button>
                </div>
              </div>
            </div>
          )}

          {latestInvoice && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/70 p-4 backdrop-blur-sm">
              <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-zinc-700/80 bg-zinc-950 shadow-2xl shadow-black/40">
                <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
                  <div>
                    <p className="text-sm font-semibold text-zinc-100">Billing Invoice E-Document</p>
                    <p className="mt-1 font-mono text-xs text-zinc-500">INV-{latestInvoice.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                  <button type="button" onClick={() => { clearInvoicePreview(); setLatestInvoice(null) }} className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-700/70 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200">
                    <XIcon size={14} />
                  </button>
                </div>

                <div className="overflow-y-auto px-5 py-5">
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
                    <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-zinc-800 pb-4">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">SPEC-C Auto PMS Xpress</p>
                        <p className="mt-1 text-sm text-zinc-300">E-Document Billing Invoice</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-zinc-100">Invoice</p>
                        <p className="font-mono text-xs text-zinc-500">#{latestInvoice.id.slice(0, 8).toUpperCase()}</p>
                      </div>
                    </div>

                    <div className="mb-4 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3">
                        <p className="text-[10px] uppercase tracking-widest text-zinc-500">Issued</p>
                        <p className="mt-1 text-sm text-zinc-200">{new Date(latestInvoice.createdAt).toLocaleString()}</p>
                      </div>
                      <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3">
                        <p className="text-[10px] uppercase tracking-widest text-zinc-500">Processed By</p>
                        <p className="mt-1 text-sm text-zinc-200">{latestInvoice.processedBy}</p>
                      </div>
                      <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3">
                        <p className="text-[10px] uppercase tracking-widest text-zinc-500">Line Items</p>
                        <p className="mt-1 text-sm text-zinc-200">{latestInvoice.lineItems.reduce((sum, item) => sum + item.quantity, 0)}</p>
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-lg border border-zinc-800">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-zinc-800 hover:bg-transparent">
                            <TableHead className="text-zinc-500">Item</TableHead>
                            <TableHead className="text-right text-zinc-500">Qty</TableHead>
                            <TableHead className="text-right text-zinc-500">Unit Price</TableHead>
                            <TableHead className="text-right text-zinc-500">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {latestInvoice.lineItems.map((line) => (
                            <TableRow key={`${latestInvoice.id}-${line.itemId}`} className="border-zinc-800 hover:bg-zinc-800/20">
                              <TableCell>
                                <p className="text-sm text-zinc-200">{line.itemName}</p>
                                <p className="font-mono text-[11px] text-zinc-500">{line.sku}</p>
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm text-zinc-300">{line.quantity}</TableCell>
                              <TableCell className="text-right font-mono text-sm text-zinc-300">{formatMoney(line.unitPrice)}</TableCell>
                              <TableCell className="text-right font-mono text-sm font-semibold text-zinc-100">{formatMoney(line.unitPrice * line.quantity)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="ml-auto mt-4 w-full max-w-xs space-y-2 rounded-lg border border-zinc-800 bg-zinc-950/70 p-3 text-sm">
                      <div className="flex items-center justify-between text-zinc-400">
                        <span>Subtotal</span>
                        <span className="font-mono">{formatMoney(latestInvoice.subtotal)}</span>
                      </div>
                      <div className="flex items-center justify-between text-zinc-400">
                        <span>Discount</span>
                        <span className="font-mono">- {formatMoney(latestInvoice.discount)}</span>
                      </div>
                      <div className="flex items-center justify-between border-t border-zinc-800 pt-2 text-base font-semibold text-zinc-100">
                        <span>Total</span>
                        <span className="font-mono">{formatMoney(latestInvoice.total)}</span>
                      </div>
                    </div>

                    {invoicePreviewUrl && (
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Document Preview ({invoicePreviewKind?.toUpperCase()})</p>
                          <a
                            href={invoicePreviewUrl}
                            download={invoicePreviewName}
                            className="inline-flex h-7 items-center gap-1 rounded-md border border-zinc-700/60 px-2 text-[11px] font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
                          >
                            <DownloadIcon size={11} />
                            Download
                          </a>
                        </div>
                        <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
                          <iframe
                            ref={invoicePreviewRef}
                            src={invoicePreviewUrl}
                            title="Invoice preview"
                            className="h-105 w-full"
                            onLoad={() => {
                              if (!printAfterPreviewLoad) return
                              invoicePreviewRef.current?.contentWindow?.focus()
                              invoicePreviewRef.current?.contentWindow?.print()
                              setPrintAfterPreviewLoad(false)
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 border-t border-zinc-800 px-5 py-4">
                  <button
                    type="button"
                    onClick={() => saveInvoiceAsPdf(latestInvoice)}
                    disabled={savingInvoicePdf}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-zinc-100 px-3 text-xs font-semibold text-zinc-900 transition-all hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <FileDownIcon size={13} />
                    {savingInvoicePdf ? "Generating..." : "Generate PDF"}
                  </button>
                  <button
                    type="button"
                    onClick={() => viewInvoiceFile(latestInvoice)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-zinc-700/60 bg-zinc-900 px-3 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
                  >
                    <ExternalLinkIcon size={13} />
                    View File
                  </button>
                  <button
                    type="button"
                    onClick={() => printInvoice(latestInvoice)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-zinc-700/60 bg-zinc-900 px-3 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
                  >
                    <PrinterIcon size={13} />
                    Preview & Print
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─── Sales & Analytics ─── */}
          {permissions.read && page === "analytics" && (
            <div className="space-y-5">
              {/* Stats */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {[
                  { icon: TrendingUpIcon, label: "Total Revenue", value: `₱${analyticsStats.revenue.toLocaleString("en-PH", { minimumFractionDigits: 2 })}` },
                  { icon: ReceiptIcon, label: "Transactions", value: analyticsStats.count },
                  { icon: TagIcon, label: "Avg. Order Value", value: `₱${analyticsStats.avgOrder.toLocaleString("en-PH", { minimumFractionDigits: 2 })}` },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
                    <div className="mb-3 flex items-center gap-2">
                      <Icon size={13} className="text-zinc-500" />
                      <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">{label}</span>
                    </div>
                    <p className="font-mono text-2xl font-semibold tracking-tight text-zinc-50">{value}</p>
                  </div>
                ))}
              </div>

              {/* Revenue chart */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
                <p className="mb-4 text-sm font-semibold text-zinc-100">Revenue — Last 7 Days</p>
                {revenueByDay.every((d) => d.revenue === 0) ? (
                  <p className="py-8 text-center text-sm text-zinc-600">No sales recorded yet.</p>
                ) : (
                  <div className="flex h-36 items-end gap-2">
                    {(() => {
                      const max = Math.max(...revenueByDay.map((d) => d.revenue), 1)
                      return revenueByDay.map((d) => (
                        <div key={d.label} className="group flex flex-1 flex-col items-center gap-1.5">
                          <span className="text-[10px] text-zinc-600 opacity-0 transition-opacity group-hover:opacity-100 font-mono">
                            ₱{d.revenue.toLocaleString("en-PH")}
                          </span>
                          <div
                            className="w-full rounded-t-md bg-zinc-700 transition-all duration-300 group-hover:bg-zinc-400"
                            style={{ height: `${Math.max(4, (d.revenue / max) * 100)}%` }}
                          />
                          <span className="text-[10px] text-zinc-500">{d.label}</span>
                        </div>
                      ))
                    })()}
                  </div>
                )}
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                {/* Top items */}
                <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
                  <div className="border-b border-zinc-800 px-5 py-4">
                    <p className="text-sm font-semibold text-zinc-100">Top Selling Items</p>
                  </div>
                  {topItems.length === 0 ? (
                    <p className="py-8 text-center text-sm text-zinc-600">No sales yet.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="border-zinc-800 hover:bg-transparent">
                          <TableHead className="text-zinc-500">Item</TableHead>
                          <TableHead className="text-right text-zinc-500">Units</TableHead>
                          <TableHead className="text-right text-zinc-500">Revenue</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topItems.map((item, i) => (
                          <TableRow key={item.name} className="border-zinc-800 hover:bg-zinc-800/30">
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-bold text-zinc-400">
                                  {i + 1}
                                </span>
                                <span className="text-sm text-zinc-200">{item.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm text-zinc-300">{item.qty}</TableCell>
                            <TableCell className="text-right font-mono text-sm text-zinc-200">
                              ₱{item.revenue.toLocaleString("en-PH")}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>

                {/* Recent transactions */}
                <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
                  <div className="border-b border-zinc-800 px-5 py-4">
                    <p className="text-sm font-semibold text-zinc-100">Recent Transactions</p>
                  </div>
                  {transactions.length === 0 ? (
                    <p className="py-8 text-center text-sm text-zinc-600">No transactions yet.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="border-zinc-800 hover:bg-transparent">
                          <TableHead className="text-zinc-500">Date</TableHead>
                          <TableHead className="text-zinc-500">By</TableHead>
                          <TableHead className="text-zinc-500">Items</TableHead>
                          <TableHead className="text-right text-zinc-500">Total</TableHead>
                          <TableHead className="text-right text-zinc-500">Invoice</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.slice(0, 10).map((txn) => (
                          <TableRow key={txn.id} className="border-zinc-800 hover:bg-zinc-800/30">
                            <TableCell className="text-xs text-zinc-400">{new Date(txn.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell className="text-sm text-zinc-300">{txn.processedBy}</TableCell>
                            <TableCell className="text-sm text-zinc-400">{txn.lineItems.reduce((s, l) => s + l.quantity, 0)}</TableCell>
                            <TableCell className="text-right font-mono text-sm font-semibold text-zinc-100">
                              ₱{txn.total.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setLatestInvoice(txn)}
                                  className="inline-flex h-7 items-center gap-1 rounded-md border border-zinc-700/60 px-2 text-[11px] font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
                                >
                                  <ReceiptIcon size={11} />
                                  View
                                </button>
                                <button
                                  type="button"
                                  onClick={() => printInvoice(txn)}
                                  className="inline-flex h-7 items-center gap-1 rounded-md border border-zinc-700/60 px-2 text-[11px] font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
                                >
                                  <PrinterIcon size={11} />
                                  Print
                                </button>
                                <button
                                  type="button"
                                  onClick={() => saveInvoiceAsPdf(txn)}
                                  disabled={savingInvoicePdf}
                                  className="inline-flex h-7 items-center gap-1 rounded-md border border-zinc-700/60 px-2 text-[11px] font-medium text-zinc-300 transition-colors hover:bg-zinc-800 disabled:opacity-50"
                                >
                                  <FileDownIcon size={11} />
                                  PDF
                                </button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default PmsWorkspace
