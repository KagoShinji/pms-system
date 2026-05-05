import { diagnostics } from "@/pages/landing/data"

export function DiagnosticsSection() {
  return (
    <section id="diagnostics" className="relative border-b border-white/10 bg-[#101010] px-5 py-16 md:px-10 md:py-24 lg:px-16">
      <div className="absolute inset-x-0 top-0 h-px bg-[#e3372f]/60" />
      <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="pms-reveal">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.26em] text-[#e3372f]">Diagnostics</p>
          <h2 className="mt-4 max-w-4xl text-[clamp(2.4rem,5vw,5.8rem)] font-semibold leading-[0.95] tracking-normal">
            Scan deeper before the service call.
          </h2>
          <p className="mt-7 max-w-2xl text-base leading-7 text-white/62">
            Professional vehicle diagnostics for system scans, live data, freeze-frame review, DTC clearing,
            and service indicator resets.
          </p>
          <div className="mt-12 overflow-hidden border border-white/12 border-t-[#e3372f]/70">
            <img src="/specbg.jpg" alt="Spec-C diagnostic service visual" className="h-[22rem] w-full object-cover grayscale contrast-125" />
          </div>
        </div>

        <div className="grid content-start border-t border-white/15">
          {diagnostics.map((group) => (
            <article key={group.title} className="pms-reveal border-b border-white/15 py-8 transition-colors duration-500 hover:border-b-[#e3372f]/70">
              <div className="flex items-center gap-4">
                <group.icon className="text-[#e3372f]" />
                <h3 className="text-2xl font-semibold tracking-normal">{group.title}</h3>
              </div>
              <ul className="mt-6 grid gap-3 text-sm leading-6 text-white/58">
                {group.points.map((point) => (
                  <li key={point} className="flex gap-3">
                    <span className="mt-2 size-1.5 bg-[#e3372f]" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
