import {
  type LucideIcon,
  ActivityIcon,
  BatteryChargingIcon,
  CalendarCheck2Icon,
  CarIcon,
  DropletsIcon,
  ShieldCheckIcon,
  WrenchIcon,
} from "lucide-react"

export type ServiceItem = {
  title: string
  description: string
  icon: LucideIcon
}

export type DiagnosticItem = {
  title: string
  points: string[]
  icon: LucideIcon
}

export type WorkflowItem = {
  title: string
  description: string
}

export const services: ServiceItem[] = [
  {
    title: "Oil Change (PMS)",
    description: "Routine preventive service to extend engine life and reduce wear.",
    icon: DropletsIcon,
  },
  {
    title: "Battery Check",
    description: "Battery condition, charging performance, and health assessment.",
    icon: BatteryChargingIcon,
  },
  {
    title: "Brake Check",
    description: "Brake pad, fluid, and response checks for safe daily operation.",
    icon: ShieldCheckIcon,
  },
  {
    title: "Tire Service",
    description: "Tire pressure, tread status, and rotation readiness checks.",
    icon: CarIcon,
  },
  {
    title: "Fluid Check",
    description: "Inspection of critical vehicle fluids for stable performance.",
    icon: WrenchIcon,
  },
]

export const diagnostics: DiagnosticItem[] = [
  {
    title: "Scanning Services",
    points: ["Comprehensive System Scan", "Read Live Data", "Freeze Frame Analysis"],
    icon: ActivityIcon,
  },
  {
    title: "Code Clearing",
    points: ["Erase Diagnostic Trouble Codes (DTCs)", "Reset Service Indicators"],
    icon: CalendarCheck2Icon,
  },
]

export const workflow: WorkflowItem[] = [
  {
    title: "Intake and inspection",
    description: "Capture unit details, current odo, and inspection baseline in a standardized PMS form.",
  },
  {
    title: "Diagnostic validation",
    description: "Run comprehensive scan, read live data, and freeze-frame context before service decisions.",
  },
  {
    title: "Service completion and schedule",
    description: "Apply service actions, clear relevant codes, reset indicators, and assign next schedule date.",
  },
]

