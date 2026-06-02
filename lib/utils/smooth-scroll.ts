/**
 * Smooth Scroll — Lenis integration
 * 
 * Cinematic smooth scrolling for the entire site.
 * Integrates with GSAP ScrollTrigger for scroll-based animations.
 */
import Lenis from 'lenis'
import gsap from 'gsap'

let lenisInstance: Lenis | null = null

/** Initialize Lenis smooth scroll */
export function initSmoothScroll(options?: {
  lerp?: number
  duration?: number
  wheelMultiplier?: number
  touchMultiplier?: number
}): Lenis {
  if (lenisInstance) return lenisInstance

  lenisInstance = new Lenis({
    lerp: options?.lerp ?? 0.08,
    duration: options?.duration ?? 1.4,
    wheelMultiplier: options?.wheelMultiplier ?? 0.8,
    touchMultiplier: options?.touchMultiplier ?? 1.5,
    infinite: false,
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true,
  })

  // Connect to GSAP ticker for animation
  gsap.ticker.add((time: number) => {
    lenisInstance?.raf(time * 1000)
  })
  gsap.ticker.lagSmoothing(0)

  return lenisInstance
}

/** Scroll to an element */
export function scrollTo(
  target: string | HTMLElement | number,
  options?: {
    offset?: number
    duration?: number
    immediate?: boolean
  }
): void {
  if (!lenisInstance) return
  lenisInstance.scrollTo(target, {
    offset: options?.offset ?? 0,
    duration: options?.duration ?? 1.4,
    immediate: options?.immediate ?? false,
  })
}

/** Stop smooth scroll (for modals, overlays) */
export function stopScroll(): void {
  lenisInstance?.stop()
}

/** Resume smooth scroll */
export function resumeScroll(): void {
  lenisInstance?.start()
}

/** Destroy instance */
export function destroySmoothScroll(): void {
  lenisInstance?.destroy()
  lenisInstance = null
}

/** Get the Lenis instance */
export function getLenis(): Lenis | null {
  return lenisInstance
}
