'use client'
import { useEffect, useRef, useState } from 'react'
import type { GlobePerson, GlobeStop, GlobeRoute, GlobeSettings } from '../page'

interface Props {
  people: GlobePerson[]; stops: GlobeStop[]; routes: GlobeRoute[]
  settings: GlobeSettings | null; search: string
  focusCoords: {lat:number;lng:number}|null; highlightPersonId: string|null
}

const TRAVEL_LINE_STYLES: Record<string, { color: string[]; dash: number; width: number }> = {
  default:    { color: ['#ffffffaa','#ffffffaa'], dash: 0.5, width: 1.5 },
  ship:       { color: ['#3498DB','#2980B9'],     dash: 0.4, width: 2 },
  train:      { color: ['#888888','#666666'],     dash: 0.3, width: 2 },
  exile:      { color: ['#E74C3C','#C0392B'],     dash: 0.6, width: 3 },
  pilgrimage: { color: ['#c9a227','#f5d98b'],     dash: 0.5, width: 2 },
  captivity:  { color: ['#666666','#444444'],     dash: 0.2, width: 1.5 },
  unknown:    { color: ['#ffffff33','#ffffff33'],  dash: 0.15, width: 1 },
  walking:    { color: ['#2ECC71','#27AE60'],     dash: 0.3, width: 1.5 },
}

const STOP_TYPE_COLORS: Record<string, string> = {
  birth: '#4ade80', childhood: '#60a5fa', residence: '#ffd95a',
  transit: '#a78bfa', work: '#f97316', study: '#3b82f6',
  marriage: '#ec4899', death: '#6b7280', pilgrimage: '#c9a227',
  exile: '#ef4444', other: '#8b6914',
}

export default function GlobePreview({ people, stops, routes, settings, search, focusCoords, highlightPersonId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const globeRef = useRef<any>(null)
  const [ready, setReady] = useState(false)

  // Init globe once
  useEffect(() => {
    let mounted = true
    async function init() {
      const GlobeLib = (await import('globe.gl')).default
      if (!mounted || !containerRef.current) return

      const globe = new (GlobeLib as any)(containerRef.current)
      globeRef.current = globe

      const s = settings || {} as GlobeSettings
      globe
        .width(containerRef.current.clientWidth)
        .height(containerRef.current.clientHeight)
        .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
        .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
        .atmosphereColor('#c9a227')
        .atmosphereAltitude(s.atmosphere_intensity || 0.22)
        .showAtmosphere(s.show_atmosphere !== false)
        .backgroundColor('rgba(0,0,0,0)')
        // Points
        .pointsData([]).pointLat('lat').pointLng('lng')
        .pointColor((d: any) => d.color || '#ffd95a')
        .pointRadius((d: any) => (s.point_size || 1) * Math.max(0.3, Math.min(1.8, (d.size || 1))))
        .pointAltitude(0.015)
        .pointLabel((d: any) => `<div style="
          background:linear-gradient(180deg,#1e140aee,#0d0702ee);
          backdrop-filter:blur(12px);border:1px solid #c9a22766;
          padding:10px 16px;border-radius:14px;color:#f5e6c8;
          font-size:12px;direction:rtl;font-family:'Heebo',sans-serif;
          max-width:260px;box-shadow:0 8px 32px #000a;
        ">
          <strong style="font-size:14px;display:block;margin-bottom:3px;">${d.city || d.country || ''}</strong>
          <span style="color:#c9a227">${d.personName}</span>
          <span style="color:#5a3a1a;margin-right:6px">${d.yearStr}</span>
          ${d.note ? '<br/><span style="color:#8b6914;font-size:11px;margin-top:4px;display:block">' + d.note + '</span>' : ''}
          <br/><span style="color:#5a3a1a;font-size:10px">לחץ לזום</span>
        </div>`)
        .onPointClick((d: any) => {
          if (d.lat && d.lng) {
            globe.pointOfView({ lat: d.lat, lng: d.lng, altitude: 0.5 }, 1500)
          }
        })
        // Arcs
        .arcsData([]).arcStartLat('startLat').arcStartLng('startLng')
        .arcEndLat('endLat').arcEndLng('endLng').arcColor('color')
        .arcAltitudeAutoScale(0.45)
        .arcDashLength((d: any) => d.dash || 0.5)
        .arcDashGap(0.15)
        .arcDashAnimateTime(1800)
        .arcStroke((d: any) => d.width || 1.5)
        .arcLabel((d: any) => d.label ? `<div style="
          background:#1e140aee;backdrop-filter:blur(8px);
          border:1px solid #c9a22744;padding:6px 12px;border-radius:10px;
          color:#f5e6c8;font-size:11px;direction:rtl;
        ">${d.label}</div>` : '')
        // Rings
        .ringsData([]).ringLat('lat').ringLng('lng')
        .ringColor(() => (t: number) => `rgba(201,162,39,${Math.max(0, 1 - t)})`)
        .ringMaxRadius(4).ringPropagationSpeed(2).ringRepeatPeriod(1400)

      // Controls
      const controls = globe.controls()
      controls.autoRotate = s.auto_rotate !== false
      controls.autoRotateSpeed = s.rotate_speed || 0.25
      controls.enableDamping = true; controls.dampingFactor = 0.08
      controls.minDistance = 101
      controls.maxDistance = 600

      containerRef.current.addEventListener('mousedown', () => { controls.autoRotate = false })

      // Stars
      if (s.show_stars !== false) {
        try {
          const THREE = await import('three')
          const geo = new THREE.BufferGeometry()
          const count = s.star_count || 2000
          const pos = new Float32Array(count * 3)
          for (let i = 0; i < count; i++) {
            const th = Math.random() * Math.PI * 2
            const ph = Math.acos(Math.random() * 2 - 1)
            const r = 800 + Math.random() * 400
            pos[i*3] = r * Math.sin(ph) * Math.cos(th)
            pos[i*3+1] = r * Math.sin(ph) * Math.sin(th)
            pos[i*3+2] = r * Math.cos(ph)
          }
          geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
          const mat = new THREE.PointsMaterial({ color: 0xfff8e7, size: s.star_size || 1.3, transparent: true, opacity: 0.6 })
          globe.scene().add(new THREE.Points(geo, mat))
        } catch {}
      }

      // Country borders
      try {
        const res = await fetch('https://raw.githubusercontent.com/vasturiano/globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
        const data = await res.json()
        globe.polygonsData(data.features).polygonCapColor(() => 'rgba(0,0,0,0)')
          .polygonSideColor(() => 'rgba(0,0,0,0)').polygonStrokeColor(() => 'rgba(201,162,39,0.35)')
          .polygonAltitude(0.005)
      } catch {}

      globe.pointOfView({ lat: 32, lng: 34, altitude: 2.5 })

      const onResize = () => {
        if (containerRef.current) globe.width(containerRef.current.clientWidth).height(containerRef.current.clientHeight)
      }
      window.addEventListener('resize', onResize)
      setReady(true)
    }
    init()
    return () => { mounted = false; if (containerRef.current) containerRef.current.innerHTML = '' }
  }, [])

  // ── Update points when data changes ──
  useEffect(() => {
    if (!globeRef.current || !ready) return

    const visiblePeople = people.filter(p => p.visible)
    const visibleIds = new Set(visiblePeople.map(p => p.id))
    const personMap = new Map(visiblePeople.map(p => [p.id, p]))

    const pts: any[] = []
    for (const s of stops) {
      if (!s.lat || !s.lng) continue
      if (!visibleIds.has(s.globe_person_id)) continue
      if (highlightPersonId && s.globe_person_id !== highlightPersonId) continue

      const person = personMap.get(s.globe_person_id)
      if (!person) continue

      if (search) {
        const q = search.toLowerCase()
        const match = person.name.toLowerCase().includes(q) ||
          s.city?.toLowerCase().includes(q) ||
          s.country?.toLowerCase().includes(q) ||
          s.year?.toString().includes(q)
        if (!match) continue
      }

      const yearStr = s.year
        ? (s.is_bce ? `${Math.abs(s.year)} לפנה"ס` : `${s.year}`)
        : ''

      pts.push({
        lat: s.lat, lng: s.lng,
        color: STOP_TYPE_COLORS[s.stop_type] || person.color,
        personName: person.name,
        city: s.city, country: s.country,
        yearStr,
        note: s.note || '',
        size: s.priority === 'highlighted' ? 1.5 : 1,
      })
    }

    globeRef.current.pointsData(pts)
    globeRef.current.ringsData(pts.map((p: any) => ({ lat: p.lat, lng: p.lng })))
  }, [stops, people, search, highlightPersonId, ready])

  // ── Update arcs when data changes ──
  useEffect(() => {
    if (!globeRef.current || !ready) return

    const visiblePeople = people.filter(p => p.visible)
    const arcs: any[] = []

    for (const p of visiblePeople) {
      if (highlightPersonId && p.id !== highlightPersonId) continue

      const pStops = stops
        .filter(s => s.globe_person_id === p.id && s.lat && s.lng)
        .sort((a, b) => (a.year || 0) - (b.year || 0))

      for (let i = 0; i < pStops.length - 1; i++) {
        const route = routes.find(r =>
          r.from_stop_id === pStops[i].id && r.to_stop_id === pStops[i+1].id
        )
        const travelType = route?.travel_type || 'default'
        const style = TRAVEL_LINE_STYLES[travelType] || TRAVEL_LINE_STYLES.default

        const fromCity = pStops[i].city || pStops[i].country || ''
        const toCity = pStops[i+1].city || pStops[i+1].country || ''

        arcs.push({
          startLat: pStops[i].lat, startLng: pStops[i].lng,
          endLat: pStops[i+1].lat, endLng: pStops[i+1].lng,
          color: [p.color + 'cc', style.color[1]],
          dash: style.dash,
          width: style.width,
          label: route?.note
            ? `${p.name}: ${fromCity} → ${toCity}${route.note ? ' · ' + route.note : ''}`
            : `${p.name}: ${fromCity} → ${toCity}`,
        })
      }
    }

    globeRef.current.arcsData(arcs)
  }, [stops, people, routes, highlightPersonId, ready])

  // ── Focus on coordinates ──
  useEffect(() => {
    if (!globeRef.current || !focusCoords) return
    globeRef.current.pointOfView(
      { lat: focusCoords.lat, lng: focusCoords.lng, altitude: 0.5 },
      1500
    )
  }, [focusCoords])

  return (
    <div ref={containerRef} style={{
      width: '100%', height: '100%',
      background: 'radial-gradient(ellipse at 50% 50%, #0a0d1a, #030508)',
    }} />
  )
}
