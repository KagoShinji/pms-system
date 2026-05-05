import { useState } from "react"

import { useRevealOnScroll } from "@/pages/landing/useRevealOnScroll"
import { CtaSection } from "@/pages/landing/sections/CtaSection"
import { DiagnosticsSection } from "@/pages/landing/sections/DiagnosticsSection"
import { FloatingHeader } from "@/pages/landing/sections/FloatingHeader"
import { HeroSection } from "@/pages/landing/sections/HeroSection"
import { ServicesSection } from "@/pages/landing/sections/ServicesSection"
import { SiteFooter } from "@/pages/landing/sections/SiteFooter"
import { WorkflowSection } from "@/pages/landing/sections/WorkflowSection"

type LandingPageProps = {
  onLoginClick: () => void
}

export default function LandingPage({ onLoginClick }: LandingPageProps) {
  useRevealOnScroll()
  const [year] = useState(() => new Date().getFullYear())

  return (
    <div className="relative min-h-[100dvh] overflow-x-hidden bg-[#080808] text-white">
      <div className="fixed inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:72px_72px]" />
      <div className="fixed inset-x-0 top-0 h-1 bg-[#e3372f]" />

      <main className="relative flex w-full max-w-full flex-col">
        <FloatingHeader onLoginClick={onLoginClick} />
        <HeroSection onLoginClick={onLoginClick} />
        <ServicesSection />
        <DiagnosticsSection />
        <WorkflowSection />
        <CtaSection onLoginClick={onLoginClick} />
        <SiteFooter year={year} />
      </main>
    </div>
  )
}
