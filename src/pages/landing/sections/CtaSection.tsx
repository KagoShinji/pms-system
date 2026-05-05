import { ArrowRightIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

type CtaSectionProps = {
  onLoginClick: () => void
}

export function CtaSection({ onLoginClick }: CtaSectionProps) {
  return (
    <section id="cta" className="relative border-b border-white/10 bg-[#e8e6df] px-5 py-16 text-[#101010] md:px-10 md:py-24 lg:px-16">
      <div className="absolute inset-x-0 top-0 h-1 bg-[#e3372f]" />
      <div className="pms-reveal grid gap-10 lg:grid-cols-[1.4fr_0.6fr] lg:items-end">
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.26em] text-[#e3372f]">Access</p>
          <h2 className="mt-4 max-w-5xl text-[clamp(2.6rem,6vw,7rem)] font-semibold leading-[0.92] tracking-normal">
            Run today&apos;s PMS queue.
          </h2>
          <p className="mt-7 max-w-2xl text-base leading-7 text-black/65">
            Sign in to manage inspection records, service history, and role-based team actions for Spec-C Auto PMS Express.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 lg:justify-end">
          <Button
            onClick={onLoginClick}
            className="group rounded-none bg-[#e3372f] px-6 py-6 text-sm font-semibold text-white transition-all duration-500 hover:-translate-y-0.5 hover:bg-[#f0443c] active:scale-[0.98]"
          >
            Enter PMS
            <span className="ml-3 flex size-8 items-center justify-center bg-white text-black transition-transform duration-500 group-hover:translate-x-1">
              <ArrowRightIcon />
            </span>
          </Button>
          <Button
            variant="outline"
            onClick={onLoginClick}
            className="rounded-none border-black/20 bg-transparent px-6 py-6 text-sm font-semibold text-black transition-all duration-500 hover:-translate-y-0.5 hover:border-[#e3372f]/70 hover:bg-[#e3372f]/10 active:scale-[0.98]"
          >
            Technician login
          </Button>
        </div>
      </div>
    </section>
  )
}
