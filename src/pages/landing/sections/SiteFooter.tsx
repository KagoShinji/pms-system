type SiteFooterProps = {
  year: number
}

export function SiteFooter({ year }: SiteFooterProps) {
  return (
    <footer className="pms-reveal flex flex-col gap-3 border-t border-[#e3372f]/50 bg-[#080808] px-5 py-8 text-sm text-white/45 md:px-10 lg:px-16">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p>
          <span className="mr-2 text-[#e3372f]">SPEC-C</span>(c) {year} Spec-C Auto PMS Express
        </p>
        <p>Diagnostics-ready preventive maintenance system</p>
      </div>
      <p className="text-center">
        <a
          href="https://www.facebook.com/profile.php?id=61587269647950"
          target="_blank"
          rel="noopener noreferrer"
          className="text-white/60 transition-colors duration-200 hover:text-[#e3372f]"
        >
          Created by: ODC
        </a>
      </p>
    </footer>
  )
}

