'use client'
import { useEffect, useRef } from 'react'

export default function Globe() {
  const globeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!globeRef.current) return

    import('globe.gl').then(({ default: Globe }) => {
      const globe = new Globe(globeRef.current!)
        .globeImageUrl('//unpkg.com/three-globe/example/img/earth-night.jpg')
        .backgroundColor('rgba(0,0,0,0)')
        .width(600)
        .height(600)
        .atmosphereColor('#C8860A')
        .atmosphereAltitude(0.25)

      globe.controls().autoRotate = true
      globe.controls().autoRotateSpeed = 0.4
      globe.controls().enableZoom = false
    })
  }, [])

  return (
    <div ref={globeRef} style={{
      width: '600px',
      height: '600px',
    }} />
  )
}
