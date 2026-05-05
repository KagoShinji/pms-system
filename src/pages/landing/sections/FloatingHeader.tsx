import { Button } from "@/components/ui/button"

type FloatingHeaderProps = {
  onLoginClick: () => void
}

export function FloatingHeader({ onLoginClick }: FloatingHeaderProps) {
  return (
    <header className="fixed inset-x-0 top-0 z-30 pms-reveal">
      <div className="border-b border-white/10 bg-[#080808]/75 px-5 py-4 backdrop-blur-xl md:px-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <img src="/speclogo.jpg" alt="Spec-C Auto PMS Express logo" className="size-9 rounded-full object-cover" />
            <span className="h-5 w-1 bg-[#e3372f]" />
            <p className="text-xs font-semibold tracking-[0.18em] text-white/80 md:text-sm">SPEC-C AUTO PMS EXPRESS</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="rounded-none border-white/20 bg-white/5 px-4 text-white transition-all duration-300 hover:-translate-y-0.5 hover:border-[#e3372f]/70 hover:bg-[#e3372f]/10"
              onClick={onLoginClick}
            >
              Login
            </Button>
            <Button
              size="sm"
              className="rounded-none bg-[#e3372f] px-4 text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#f0443c]"
              onClick={onLoginClick}
            >
              Start PMS
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
