import { useEffect } from 'preact/hooks'

// Fades in every [data-reveal] element once it scrolls into view.
export function useReveal(deps) {
  useEffect(() => {
    const els = document.querySelectorAll('[data-reveal]:not(.revealed)')
    if (!('IntersectionObserver' in window)) return els.forEach((el) => el.classList.add('revealed'))
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('revealed')
          io.unobserve(e.target)
        }
      }),
      { rootMargin: '0px 0px -8% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, deps)
}
