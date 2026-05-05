import { services } from "@/pages/landing/data"

export function ServicesSection() {
  return (
    <section id="services" className="relative border-b border-white/10 bg-[#0b0b0b] px-5 py-16 md:px-10 md:py-24 lg:px-16">
      <div className="absolute inset-x-0 top-0 h-px bg-[#e3372f]/80" />
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.5fr]">
        <div className="pms-reveal">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.26em] text-[#e3372f]">Services</p>
          <h2 className="mt-4 max-w-xl text-[clamp(2.4rem,5vw,5.8rem)] font-semibold leading-[0.95] tracking-normal">
            Built for fast bay turnover.
          </h2>
        </div>

        <div className="grid border-t border-white/15 md:grid-cols-2">
          {services.map((service, index) => (
            <article
              key={service.title}
              className="pms-reveal group relative min-h-52 border-b border-white/15 px-0 py-7 transition-colors duration-500 hover:bg-[#e3372f]/[0.045] md:px-7 md:[&:nth-child(odd)]:border-r"
            >
              <span className="absolute left-0 top-0 h-0.5 w-12 bg-[#e3372f] transition-all duration-500 group-hover:w-24" />
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="font-mono text-xs text-[#e3372f]/80">{String(index + 1).padStart(2, "0")}</p>
                  <h3 className="mt-5 text-2xl font-semibold tracking-normal text-white">{service.title}</h3>
                </div>
                <service.icon className="mt-1 text-white/55 transition-all duration-500 group-hover:-translate-y-1 group-hover:text-[#e3372f]" />
              </div>
              <p className="mt-8 max-w-md text-sm leading-6 text-white/58">{service.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
