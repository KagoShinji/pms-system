import type { AppUser, UserRole } from "@/types/pms"

const USERS_KEY = "pms-system-users-v1"
const ACTIVE_USER_KEY = "pms-system-active-user-v1"

const defaultUsers: AppUser[] = [
  { id: "u-admin", name: "Ari Admin", role: "admin" },
  { id: "u-staff", name: "Sam Staff", role: "staff" },
  { id: "u-viewer", name: "Vee Viewer", role: "viewer" },
]

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

function saveUsers(users: AppUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export function getUsers(): AppUser[] {
  const users = safeParse<AppUser[]>(localStorage.getItem(USERS_KEY), defaultUsers)
  if (users.length === 0) {
    saveUsers(defaultUsers)
    return defaultUsers
  }
  return users
}

export function getActiveUser(): AppUser {
  const users = getUsers()
  const activeUserId = localStorage.getItem(ACTIVE_USER_KEY)
  const found = users.find((user) => user.id === activeUserId)
  if (found) return found
  localStorage.setItem(ACTIVE_USER_KEY, users[0].id)
  return users[0]
}

export function setActiveUser(userId: string): AppUser {
  const users = getUsers()
  const found = users.find((user) => user.id === userId) ?? users[0]
  localStorage.setItem(ACTIVE_USER_KEY, found.id)
  return found
}

export function updateUserRole(userId: string, role: UserRole): AppUser[] {
  const users = getUsers().map((user) => (user.id === userId ? { ...user, role } : user))
  saveUsers(users)
  return users
}

