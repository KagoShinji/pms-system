import { useState } from "react"
import { toast } from "sonner"

import { getActiveUser, getUsers, setActiveUser } from "@/services/mockAuthService"
import LandingPage from "@/pages/LandingPage"
import LoginPage from "@/pages/LoginPage"
import PmsWorkspace from "@/pages/PmsWorkspace"

type AppView = "home" | "login" | "workspace"

const SESSION_KEY = "pms-system-session-v1"
const LOGIN_PASSWORD = "pms123"

function isLoggedIn(): boolean {
  return localStorage.getItem(SESSION_KEY) === "true"
}

export default function App() {
  const users = getUsers()
  const currentUser = getActiveUser()
  const [view, setView] = useState<AppView>(isLoggedIn() ? "workspace" : "home")

  function handleLogin(payload: { userId: string; password: string }) {
    if (payload.password !== LOGIN_PASSWORD) {
      toast.error("Invalid password.")
      return
    }
    const user = users.find((item) => item.id === payload.userId)
    if (!user) {
      toast.error("Selected user does not exist.")
      return
    }
    setActiveUser(user.id)
    localStorage.setItem(SESSION_KEY, "true")
    setView("workspace")
    toast.success(`Welcome ${user.name}`)
  }

  function handleLogout() {
    localStorage.removeItem(SESSION_KEY)
    setView("home")
    toast.info("You are signed out.")
  }

  if (view === "home") {
    return <LandingPage onLoginClick={() => setView("login")} />
  }

  if (view === "login") {
    return (
      <LoginPage
        users={users}
        defaultUserId={currentUser.id}
        onBack={() => setView("home")}
        onLogin={handleLogin}
      />
    )
  }

  return <PmsWorkspace onLogout={handleLogout} />
}

