'use client'
import { useState, useRef, useEffect } from 'react'

export default function LazyImage({ src, alt, style, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [loaded, setLoaded] = useState(false)
  const [inView, setInView] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setInView(true); observer.disconnect() }
    }, { threshold: 0.1 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} style={{ ...style, position: 'relative', overflow: 'hidden' }}>
      {!loaded && (
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #1a0f0544, #c9a22711)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: '#c9a22733', fontSize: 24 }}>✦</span>
        </div>
      )}
      {inView && (
        <img
          src={src} alt={alt || ''} {...props}
          onLoad={() => setLoaded(true)}
          style={{ ...style, opacity: loaded ? 1 : 0, transition: 'opacity 0.4s ease' }}
        />
      )}
    </div>
  )
}
