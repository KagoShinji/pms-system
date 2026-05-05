type SiteFooterProps = {
  year: number
}

export function SiteFooter({ year }: SiteFooterProps) {
  return (
    <footer className="pms-reveal flex flex-wrap items-center justify-between gap-3 border-t border-[#e3372f]/50 bg-[#080808] px-5 py-8 text-sm text-white/45 md:px-10 lg:px-16">
      <p>
        <span className="mr-2 text-[#e3372f]">SPEC-C</span>(c) {year} Spec-C Auto PMS Express
      </p>
      <p>Diagnostics-ready preventive maintenance system</p>
    </footer>
  )
}

