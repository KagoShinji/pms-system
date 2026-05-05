import { useEffect } from "react"

export function useRevealOnScroll() {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>(".pms-reveal"))
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.classList.add("is-visible")
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.15 },
    )

    for (const node of nodes) {
      observer.observe(node)
    }

    return () => observer.disconnect()
  }, [])
}

