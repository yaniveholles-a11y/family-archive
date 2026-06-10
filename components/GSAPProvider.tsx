'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

export default function GSAPProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Boot Lenis + GSAP once
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
    })

    // Single RAF via gsap.ticker - Lenis drives ScrollTrigger (no manual requestAnimationFrame needed)
    gsap.ticker.add((time) => { lenis.raf(time * 1000) })
    gsap.ticker.lagSmoothing(0)
    lenis.on('scroll', ScrollTrigger.update)
    ;(window as any).__lenis = lenis

    return () => {
      lenis.destroy()
      gsap.ticker.remove((time) => { lenis.raf(time * 1000) })
      ;(window as any).__lenis = null
    }
  }, [])

  // Re-scan data-* elements and refresh ScrollTrigger on every route change
  useEffect(() => {
    const id = setTimeout(() => {
      ScrollTrigger.getAll().forEach(t => t.kill())

      const ctx = gsap.context(() => {
        // data-reveal="up|left|right|scale"
        gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
          const dir = el.dataset.reveal || 'up'
          const from =
            dir === 'up'    ? { y: 40, opacity: 0 } :
            dir === 'left'  ? { x: -40, opacity: 0 } :
            dir === 'right' ? { x: 40, opacity: 0 } :
                              { scale: 0.85, opacity: 0 }
          gsap.from(el, {
            ...from, duration: 0.9, ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' },
          })
        })

        // data-reveal-stagger - stagger children
        gsap.utils.toArray<HTMLElement>('[data-reveal-stagger]').forEach((container) => {
          gsap.from(Array.from(container.children) as HTMLElement[], {
            y: 25, opacity: 0, duration: 0.7,
            stagger: 0.08, ease: 'power3.out',
            scrollTrigger: { trigger: container, start: 'top 85%', toggleActions: 'play none none none' },
          })
        })

        // data-count="N" - animated counter
        gsap.utils.toArray<HTMLElement>('[data-count]').forEach((el) => {
          const target = parseFloat(el.dataset.count || '0')
          const obj = { val: 0 }
          gsap.to(obj, {
            val: target, duration: 1.5, ease: 'power2.out',
            scrollTrigger: { trigger: el, start: 'top 85%', once: true },
            onUpdate: () => { el.textContent = Math.round(obj.val).toString() },
          })
        })

        // data-parallax="0.3" - vertical parallax
        gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((el) => {
          const speed = parseFloat(el.dataset.parallax || '0.3')
          gsap.to(el, {
            yPercent: -30 * speed, ease: 'none',
            scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
          })
        })

        // data-line - horizontal rule grow
        gsap.utils.toArray<HTMLElement>('[data-line]').forEach((el) => {
          gsap.from(el, {
            scaleX: 0, transformOrigin: 'right center', duration: 1.2, ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 90%', toggleActions: 'play none none none' },
          })
        })
      })

      ScrollTrigger.refresh()
      return () => ctx.revert()
    }, 120)

    return () => clearTimeout(id)
  }, [pathname])

  return <>{children}</>
}
