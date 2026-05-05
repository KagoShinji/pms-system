import { useEffect, useState } from "react"

type SplashScreenProps = {
  onDone: () => void
}

export function SplashScreen({ onDone }: SplashScreenProps) {
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    const exitTimer = setTimeout(() => setExiting(true), 2000)
    const doneTimer = setTimeout(() => onDone(), 2400)
    return () => {
      clearTimeout(exitTimer)
      clearTimeout(doneTimer)
    }
  }, [onDone])

  return (
    <>
      <style>{`
        @keyframes splash-fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes splash-line-in {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
        @keyframes splash-progress {
          from { width: 0%; }
          to   { width: 100%; }
        }
        @keyframes splash-exit {
          from { opacity: 1; }
          to   { opacity: 0; }
        }
        @keyframes splash-logo-draw {
          from { stroke-dashoffset: 120; opacity: 0; }
          to   { stroke-dashoffset: 0; opacity: 1; }
        }
        .splash-item-1 {
          animation: splash-fade-in 0.5s cubic-bezier(0.16,1,0.3,1) 0.1s both;
        }
        .splash-item-2 {
          animation: splash-fade-in 0.5s cubic-bezier(0.16,1,0.3,1) 0.25s both;
        }
        .splash-item-3 {
          animation: splash-fade-in 0.5s cubic-bezier(0.16,1,0.3,1) 0.4s both;
        }
        .splash-item-4 {
          animation: splash-fade-in 0.5s cubic-bezier(0.16,1,0.3,1) 0.55s both;
        }
        .splash-progress-bar {
          animation: splash-progress 1.4s cubic-bezier(0.4,0,0.2,1) 0.6s both;
        }
        .splash-top-line {
          animation: splash-line-in 0.4s cubic-bezier(0.16,1,0.3,1) 0s both;
          transform-origin: left center;
        }
        .splash-exiting {
          animation: splash-exit 0.4s cubic-bezier(0.4,0,1,1) forwards;
        }
      `}</style>

      <div
        className={`fixed inset-0 z-9999 flex flex-col items-center justify-center bg-[#080808] select-none ${exiting ? "splash-exiting" : ""}`}
        aria-hidden="true"
      >
        {/* Grid overlay */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-size-[72px_72px]" />

        {/* Top red accent bar */}
        <div className="splash-top-line absolute inset-x-0 top-0 h-0.75 bg-[#e3372f]" />

        {/* Center content */}
        <div className="relative flex flex-col items-center gap-0">
          {/* Logo mark */}
          <div className="splash-item-1 mb-8">
            <svg
              viewBox="0 0 64 64"
              width="72"
              height="72"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <rect width="64" height="64" rx="8" fill="#111111" />
              <rect x="0" y="0" width="64" height="6" rx="4" fill="#e3372f" />
              <rect x="0" y="0" width="64" height="3" fill="#e3372f" />
              <rect x="0" y="58" width="64" height="6" rx="4" fill="#e3372f" />
              <rect x="0" y="61" width="64" height="3" fill="#e3372f" />
              <text
                x="6"
                y="47"
                fontFamily="Arial Black, Arial, sans-serif"
                fontWeight="900"
                fontSize="36"
                fontStyle="italic"
                fill="white"
                letterSpacing="-2"
              >
                S
              </text>
              <text
                x="33"
                y="47"
                fontFamily="Arial Black, Arial, sans-serif"
                fontWeight="900"
                fontSize="36"
                fontStyle="italic"
                fill="#e3372f"
                letterSpacing="-2"
              >
                C
              </text>
            </svg>
          </div>

          {/* Eyebrow label */}
          <p className="splash-item-2 mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.32em] text-white/40">
            <span className="mr-2 inline-block h-px w-6 -translate-y-0.5 bg-[#e3372f] align-middle" />
            Preventive Maintenance System
          </p>

          {/* Brand name */}
          <h1 className="splash-item-3 text-center font-sans text-[clamp(2rem,5vw,3.25rem)] font-semibold leading-none tracking-tight text-white">
            Spec-C Auto
            <span className="block text-[0.72em] font-light tracking-[0.18em] text-white/50">
              PMS EXPRESS
            </span>
          </h1>

          {/* Progress bar */}
          <div className="splash-item-4 relative mt-10 h-px w-65 overflow-hidden bg-white/10">
            <div className="splash-progress-bar absolute inset-y-0 left-0 bg-[#e3372f]" />
          </div>

          {/* Status label */}
          <p className="splash-item-4 mt-3 font-mono text-[10px] uppercase tracking-[0.22em] text-white/25">
            Initialising workspace
          </p>
        </div>

        {/* Bottom red accent bar */}
        <div className="splash-top-line absolute inset-x-0 bottom-0 h-0.75 bg-[#e3372f]" />
      </div>
    </>
  )
}
