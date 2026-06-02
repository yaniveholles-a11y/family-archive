'use client'
import { useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger)

export default function GSAPProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Lenis — גלילה חלקה
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    })

    // חיבור Lenis עם GSAP
    lenis.on('scroll', ScrollTrigger.update)
    gsap.ticker.add((time: number) => lenis.raf(time * 1000))
    gsap.ticker.lagSmoothing(0)

    // אנימציית כניסה לכל עמוד
    gsap.fromTo('main',
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
    )

    // כרטיסיות נכנסות בזו אחר זו
    gsap.fromTo('.card',
      { opacity: 0, y: 40 },
      {
        opacity: 1, y: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: 'power2.out',
        delay: 0.3
      }
    )

    return () => {
      lenis.destroy()
      ScrollTrigger.getAll().forEach((t: any) => t.kill())
      gsap.ticker.remove((time: number) => lenis.raf(time * 1000))
    }
  }, [])

  return <>{children}</>
}