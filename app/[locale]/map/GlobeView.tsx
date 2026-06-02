'use client'
import { useEffect, useRef, useCallback } from 'react'
import gsap from 'gsap'

export interface GeoPoint {
  name: string; lat: number; lng: number; count: number
  people: Array<{ id: number | string; name: string }>
}
export interface GeoArc {
  startLat: number; startLng: number; endLat: number; endLng: number
  color: string[]; label?: string
}

interface Props {
  points: GeoPoint[]
  arcs: GeoArc[]
  onPointClick: (point: GeoPoint) => void
  focusCoords?: { lat: number; lng: number } | null
}

export default function GlobeView({ points, arcs, onPointClick, focusCoords }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const globeRef = useRef<any>(null)
  const initDone = useRef(false)

  useEffect(() => {
    let mounted = true
    async function init() {
      const GlobeLib = (await import('globe.gl')).default
      if (!mounted || !containerRef.current) return

      const globe = new (GlobeLib as any)(containerRef.current)
      globeRef.current = globe

      globe
        .width(containerRef.current.clientWidth)
        .height(containerRef.current.clientHeight)
        .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
        .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
        .atmosphereColor('#c9a227')
        .atmosphereAltitude(0.22)
        .backgroundColor('rgba(0,0,0,0)')
        .showGraticules(false)
        // Points — small golden dots
        .pointsData([])
        .pointLat('lat').pointLng('lng')
        .pointColor(() => '#ffd95a')
        .pointRadius(0.15)
        .pointAltitude(0.01)
        .pointResolution(12)
        .pointLabel((d: unknown) => {
          const p = d as GeoPoint
          return `<div style="
            background:linear-gradient(180deg,#1e140aee,#0d0702ee);
            backdrop-filter:blur(16px);
            border:1px solid #c9a22766;padding:12px 18px;border-radius:14px;
            color:#f5e6c8;font-size:13px;direction:rtl;
            font-family:'Heebo',Arial,sans-serif;max-width:240px;
            box-shadow:0 12px 40px #000c,0 0 30px #c9a22715;
          ">
            <strong style="font-size:16px;display:block;margin-bottom:6px;
              font-family:'Playfair Display',serif;letter-spacing:0.03em;">
              ${p.name}
            </strong>
            <div style="color:#c9a227;font-size:12px;margin-bottom:4px;">
              ${p.people.map(pp => pp.name).join(' · ')}
            </div>
            <div style="color:#5a3a1a;font-size:11px">
              ${p.count} בני משפחה · לחץ לזום לעיר
            </div>
          </div>`
        })
        .onPointClick((point: unknown) => {
          const p = point as GeoPoint
          // Smooth cinematic zoom to point before switching view
          globe.pointOfView(
            { lat: p.lat, lng: p.lng, altitude: 0.08 },
            2000
          )
          // Wait for zoom animation, then switch to city view
          setTimeout(() => {
            if (mounted) onPointClick(p)
          }, 2200)
        })
        // Arcs — thin elegant lines
        .arcsData([])
        .arcStartLat('startLat').arcStartLng('startLng')
        .arcEndLat('endLat').arcEndLng('endLng')
        .arcColor('color')
        .arcAltitudeAutoScale(0.3)
        .arcDashLength(0.4)
        .arcDashGap(0.2)
        .arcDashAnimateTime(2500)
        .arcStroke(0.5)
        // Pulsing rings at each point
        .ringsData([])
        .ringLat('lat').ringLng('lng')
        .ringColor(() => (t: number) => `rgba(201,162,39,${Math.max(0, 1 - t)})`)
        .ringMaxRadius(3)
        .ringPropagationSpeed(1.5)
        .ringRepeatPeriod(2000)

      // Controls
      const controls = globe.controls()
      controls.autoRotate = true
      controls.autoRotateSpeed = 0.2
      controls.enableZoom = true
      controls.minDistance = 101
      controls.maxDistance = 500
      controls.enableDamping = true
      controls.dampingFactor = 0.06

      containerRef.current!.addEventListener('mousedown', () => { controls.autoRotate = false })
      containerRef.current!.addEventListener('touchstart', () => { controls.autoRotate = false })

      // Stars
      try {
        const THREE = await import('three')
        const geo = new THREE.BufferGeometry()
        const positions = new Float32Array(2500 * 3)
        for (let i = 0; i < 2500; i++) {
          const theta = Math.random() * Math.PI * 2
          const phi = Math.acos((Math.random() * 2) - 1)
          const r = 700 + Math.random() * 500
          positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
          positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
          positions[i * 3 + 2] = r * Math.cos(phi)
        }
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        const mat = new THREE.PointsMaterial({ color: 0xfff8e7, size: 1.2, transparent: true, opacity: 0.5 })
        const stars = new THREE.Points(geo, mat)
        globe.scene().add(stars)
      } catch {}

      // Country borders
      try {
        const res = await fetch('https://raw.githubusercontent.com/vasturiano/globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
        const data = await res.json()
        if (mounted) {
          globe.polygonsData(data.features)
            .polygonCapColor(() => 'rgba(0,0,0,0)')
            .polygonSideColor(() => 'rgba(0,0,0,0)')
            .polygonStrokeColor(() => 'rgba(201,162,39,0.35)')
            .polygonAltitude(0.006)
        }
      } catch {}

      // Cinematic entrance
      if (!initDone.current) {
        initDone.current = true
        globe.pointOfView({ lat: 32, lng: 34, altitude: 3.5 })
        gsap.to({}, {
          duration: 3, ease: 'power3.inOut',
          onUpdate: function () {
            const p = this.progress()
            globe.pointOfView({ lat: 32, lng: 34, altitude: 3.5 - p * 2 })
          },
        })
        gsap.fromTo(containerRef.current, { opacity: 0 }, { opacity: 1, duration: 1.5, ease: 'power2.out' })
      }

      // Resize
      const handleResize = () => {
        if (containerRef.current && globeRef.current) {
          globe.width(containerRef.current.clientWidth).height(containerRef.current.clientHeight)
        }
      }
      window.addEventListener('resize', handleResize)
    }
    init()
    return () => { mounted = false; if (containerRef.current) containerRef.current.innerHTML = '' }
  }, [])

  // Update points
  useEffect(() => {
    if (!globeRef.current || !points.length) return
    globeRef.current.pointsData(points)
    globeRef.current.ringsData(points.map((p: GeoPoint) => ({ lat: p.lat, lng: p.lng })))
  }, [points])

  // Update arcs
  useEffect(() => {
    if (!globeRef.current) return
    globeRef.current.arcsData(arcs)
    if (arcs.length > 0) globeRef.current.controls().autoRotate = false
  }, [arcs])

  // Focus with cinematic zoom
  useEffect(() => {
    if (!globeRef.current || !focusCoords) return
    globeRef.current.pointOfView(
      { lat: focusCoords.lat, lng: focusCoords.lng, altitude: 0.6 },
      2000
    )
  }, [focusCoords])

  return (
    <div ref={containerRef} style={{
      width: '100%', height: '100%',
      background: 'radial-gradient(ellipse at 50% 50%, #0a0d1a, #030508)',
    }} />
  )
}
