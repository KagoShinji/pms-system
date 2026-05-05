import { workflow } from "@/pages/landing/data"

export function WorkflowSection() {
  return (
    <section id="workflow" className="relative border-b border-white/10 bg-[#080808] px-5 py-16 md:px-10 md:py-24 lg:px-16">
      <div className="absolute inset-x-0 top-0 h-px bg-[#e3372f]/50" />
      <div className="pms-reveal flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.26em] text-[#e3372f]">Process</p>
          <h2 className="mt-4 max-w-5xl text-[clamp(2.4rem,5vw,5.8rem)] font-semibold leading-[0.95] tracking-normal">
            Intake to release, without lost records.
          </h2>
        </div>
        <p className="max-w-sm text-sm leading-6 text-white/55">
          A compact workflow for repeated service operations, vehicle history, and schedule discipline.
        </p>
      </div>

      <div className="mt-14 grid border-t border-white/15 lg:grid-cols-3">
        {workflow.map((step, index) => (
          <article
            key={step.title}
            className="pms-reveal group min-h-72 border-b border-white/15 py-8 transition-colors duration-500 hover:bg-[#e3372f]/[0.035] lg:border-b-0 lg:border-r lg:px-8 lg:last:border-r-0"
          >
            <p className="font-mono text-xs text-[#e3372f]/80">{`0${index + 1}`}</p>
            <span className="mt-5 block h-0.5 w-10 bg-[#e3372f] transition-all duration-500 group-hover:w-20" />
            <h3 className="mt-8 text-3xl font-semibold tracking-normal">{step.title}</h3>
            <p className="mt-7 max-w-md text-sm leading-6 text-white/58">{step.description}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
