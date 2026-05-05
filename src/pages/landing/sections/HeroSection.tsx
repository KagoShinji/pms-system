import { ArrowRightIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

type HeroSectionProps = {
  onLoginClick: () => void
}

export function HeroSection({ onLoginClick }: HeroSectionProps) {
  return (
    <section id="home" className="relative min-h-[94dvh] overflow-hidden border-b border-white/10">
      <img
        src="/landingpagebg.jpg"
        alt="Spec-C Auto PMS Express performance car"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,8,8,0.95)_0%,rgba(8,8,8,0.72)_44%,rgba(8,8,8,0.2)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(227,55,47,0.22)_0%,transparent_28%,transparent_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#080808] to-transparent" />
      <div className="absolute bottom-0 left-0 h-1 w-full bg-[#e3372f]" />

      <div className="relative flex min-h-[94dvh] items-end px-5 pb-14 pt-28 md:px-10 md:pb-20 lg:px-16">
        <div className="pms-reveal w-full max-w-6xl">
          <p className="mb-5 font-mono text-xs font-semibold uppercase tracking-[0.28em] text-white/60">
            <span className="mr-3 inline-block h-2 w-10 bg-[#e3372f]" />
            Preventive maintenance / diagnostics / express records
          </p>
          <h1 className="max-w-5xl text-balance text-[clamp(3.25rem,7vw,7.8rem)] font-semibold leading-[0.92] tracking-normal">
            Spec-C Auto PMS Express
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-7 text-white/70 md:text-lg">
            A premium service workflow for oil changes, battery checks, brake inspections, tire care,
            fluid checks, and professional diagnostic scanning.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              onClick={onLoginClick}
              className="group rounded-none bg-[#e3372f] px-6 py-6 text-sm font-semibold text-white transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:bg-[#f0443c] active:scale-[0.98]"
            >
              Enter PMS
              <span className="ml-3 flex size-8 items-center justify-center bg-white text-black transition-transform duration-500 group-hover:translate-x-1">
                <ArrowRightIcon />
              </span>
            </Button>
            <Button
              variant="outline"
              onClick={onLoginClick}
              className="rounded-none border-white/25 bg-white/5 px-6 py-6 text-sm font-semibold text-white transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:border-[#e3372f]/70 hover:bg-[#e3372f]/10 active:scale-[0.98]"
            >
              Service intake
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
