import { type FormEvent, useState } from "react"
import { ArrowLeftIcon, EyeIcon, EyeOffIcon, LogInIcon } from "lucide-react"

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
import type { AppUser } from "@/types/pms"

type LoginPageProps = {
  users: AppUser[]
  defaultUserId: string
  onBack: () => void
  onLogin: (payload: { userId: string; password: string }) => void
}

export default function LoginPage({ users, defaultUserId, onBack, onLogin }: LoginPageProps) {
  const [userId, setUserId] = useState(defaultUserId)
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!userId) {
      setError("Please select a user.")
      return
    }
    if (!password.trim()) {
      setError("Password is required.")
      return
    }
    setError("")
    onLogin({ userId, password })
  }

  return (
    <>
      <style>{`
        @keyframes lp-fade-up {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .lp-anim { animation: lp-fade-up 0.55s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .lp-anim-1 { animation-delay: 0s; }
        .lp-anim-2 { animation-delay: 0.06s; }
        .lp-anim-3 { animation-delay: 0.12s; }
        .lp-anim-4 { animation-delay: 0.18s; }
      `}</style>

      <div className="relative min-h-dvh overflow-hidden bg-zinc-950 font-sans">

        {/* ── LEFT PANEL: Visual branding ── */}
        <div className="hidden md:flex absolute inset-y-0 left-0 w-[52%] flex-col">
          <img
            src="/specbg.jpg"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          {/* Right-side fade to the form panel */}
          <div className="absolute inset-0 bg-linear-to-r from-zinc-950/80 via-zinc-950/40 to-zinc-950" />

          <div className="relative flex h-full flex-col justify-between p-12 xl:p-16">
            {/* Wordmark */}
            <span className="text-xs font-semibold tracking-[0.3em] text-white/30 uppercase select-none">
              PMS System
            </span>

            {/* Hero text */}
            <div className="space-y-5">
              <p className="text-[11px] font-semibold tracking-[0.25em] text-white/30 uppercase">
                Practice Management
              </p>
              <h2 className="max-w-[14ch] text-3xl font-semibold tracking-tight text-white leading-snug">
                Built for precision.<br />Designed for speed.
              </h2>
              <p className="text-sm text-white/35 max-w-[32ch] leading-relaxed">
                Manage your team, workflows, and projects from one unified workspace.
              </p>
            </div>

            {/* Footer */}
            <p className="text-[11px] text-white/20 tracking-wide">
              &copy; {new Date().getFullYear()} PMS System
            </p>
          </div>
        </div>

        {/* ── RIGHT PANEL: Form ── */}
        <div className="relative min-h-dvh flex flex-col items-center justify-center md:ml-[52%] px-6 py-14 md:px-14 lg:px-20">
          {/* Subtle grain overlay */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E")`,
            }}
          />

          <div className="w-full max-w-90 space-y-9">

            {/* Back link */}
            <button
              onClick={onBack}
              className="lp-anim lp-anim-1 group inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors duration-200 hover:text-zinc-200"
            >
              <ArrowLeftIcon
                size={13}
                className="transition-transform duration-200 group-hover:-translate-x-0.5"
              />
              Back to home
            </button>

            {/* Heading */}
            <div className="lp-anim lp-anim-2 space-y-2">
              <h1 className="text-[1.6rem] font-semibold tracking-tight text-zinc-50">
                Sign in to your workspace
              </h1>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Select your role account to continue.{" "}
                <span className="text-zinc-500">
                  Demo password:{" "}
                  <code className="rounded-md bg-zinc-800 px-1.5 py-0.5 font-mono text-xs text-zinc-300">
                    pms123
                  </code>
                </span>
              </p>
            </div>

            {/* Form */}
            <form
              className="lp-anim lp-anim-3 space-y-5"
              onSubmit={submit}
            >
              {/* User select */}
              <div className="space-y-2">
                <Label htmlFor="userId" className="text-[13px] font-medium text-zinc-300">
                  User account
                </Label>
                <Select value={userId} onValueChange={(value) => setUserId(value ?? "")}>
                  <SelectTrigger
                    id="userId"
                    className="h-11 rounded-xl border-zinc-700/70 bg-zinc-900/70 text-zinc-100 ring-offset-zinc-950 transition-colors hover:border-zinc-600 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500/40"
                  >
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-zinc-700/80 bg-zinc-900 text-zinc-100">
                    <SelectGroup>
                      <SelectLabel className="text-[11px] tracking-widest text-zinc-500 uppercase">
                        Available users
                      </SelectLabel>
                      {users.map((user) => (
                        <SelectItem
                          key={user.id}
                          value={user.id}
                          className="rounded-lg py-2.5 focus:bg-zinc-800"
                        >
                          <span className="flex items-center gap-3">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-[11px] font-semibold text-zinc-200 uppercase">
                              {user.name.charAt(0)}
                            </span>
                            <span className="flex flex-col leading-tight">
                              <span className="text-sm text-zinc-100">{user.name}</span>
                              <span className="text-xs text-zinc-400">{user.role}</span>
                            </span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[13px] font-medium text-zinc-300">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    className="h-11 rounded-xl border-zinc-700/70 bg-zinc-900/70 pr-10 text-zinc-100 placeholder:text-zinc-600 ring-offset-zinc-950 transition-colors hover:border-zinc-600 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors hover:text-zinc-300"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOffIcon size={15} /> : <EyeIcon size={15} />}
                  </button>
                </div>
              </div>

              {/* Inline error */}
              {error ? (
                <p className="rounded-lg border border-red-500/20 bg-red-500/8 px-3 py-2.5 text-sm text-red-400">
                  {error}
                </p>
              ) : null}

              {/* Submit */}
              <button
                type="submit"
                className="group flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-zinc-100 text-sm font-semibold text-zinc-900 transition-all duration-200 hover:bg-white active:scale-[0.98] active:translate-y-px"
              >
                <LogInIcon size={15} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                Continue to dashboard
              </button>
            </form>

            {/* Divider hint */}
            <p className="lp-anim lp-anim-4 text-center text-xs text-zinc-600">
              Access is restricted to authorized personnel only.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

