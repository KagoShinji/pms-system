import type { UserRole } from "@/types/pms"

export type Permission =
  | "create"
  | "read"
  | "edit"
  | "delete"
  | "manage_roles"
  | "export"

const permissionsByRole: Record<UserRole, Permission[]> = {
  admin: ["create", "read", "edit", "delete", "manage_roles", "export"],
  staff: ["create", "read", "export"],
  viewer: ["read"],
}

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return permissionsByRole[role].includes(permission)
}

