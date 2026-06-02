'use client'
import { useEffect, useRef } from 'react'

interface Stop {
  lat: number; lng: number; city?: string; country?: string
  year?: number; personName?: string; stop_type?: string; address?: string
}

interface Props {
  lat: number; lng: number; placeName: string
  onStreetView: (lat: number, lng: number) => void
  stops?: Stop[]
}

const STOP_ICONS: Record<string, string> = {
  birth: '👶', childhood: '🏠', residence: '🏡', transit: '🚶',
  work: '💼', study: '📚', marriage: '💍', death: '✝️',
  pilgrimage: '✡️', exile: '🏃', other: '📍',
}

export default function CityView({ lat, lng, placeName, onStreetView, stops = [] }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)

  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/maplibre-gl@latest/dist/maplibre-gl.css'
    document.head.appendChild(link)
    return () => { document.head.removeChild(link) }
  }, [])

  useEffect(() => {
    let mounted = true
    async function init() {
      const maplibre = await import('maplibre-gl')
      if (!mounted || !mapRef.current) return
      await new Promise(r => setTimeout(r, 150))

      const map = new maplibre.Map({
        container: mapRef.current!,
        style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
        center: [lng, lat],
        zoom: 13,
        pitch: 45,
        bearing: -10,
      })
      mapInstanceRef.current = map

      map.on('load', () => {
        if (!mounted) return

        // Add 3D buildings
        const layers = map.getStyle().layers || []
        const labelLayerId = layers.find((l: any) => l.type === 'symbol' && l.layout?.['text-field'])?.id
        
        try {
          map.addSource('openmaptiles', {
            type: 'vector',
            url: 'https://api.maptiler.com/tiles/v3/tiles.json?key=get_your_own_OpIi9ZULNHzrESv6T2vL'
          })
        } catch {}

        // Main golden marker
        const mainEl = document.createElement('div')
        mainEl.innerHTML = `
          <div style="position:relative">
            <div style="
              width:20px;height:20px;background:#c9a227;border-radius:50%;
              border:3px solid #fff;
              box-shadow:0 0 0 4px #c9a22744, 0 4px 12px #0008;
              animation:pulse 2s infinite;
            "></div>
            <div style="
              position:absolute;top:-32px;left:50%;transform:translateX(-50%);
              background:#1e140aee;backdrop-filter:blur(8px);
              border:1px solid #c9a22766;padding:4px 10px;border-radius:8px;
              color:#f5e6c8;font-size:12px;white-space:nowrap;
              font-family:'Heebo',sans-serif;direction:rtl;
              box-shadow:0 4px 16px #0006;
            ">${placeName}</div>
          </div>
          <style>@keyframes pulse{0%,100%{box-shadow:0 0 0 4px #c9a22744}50%{box-shadow:0 0 0 12px #c9a22700}}</style>
        `
        new maplibre.Marker({ element: mainEl }).setLngLat([lng, lat]).addTo(map)

        // Add stop markers if available
        stops.forEach(stop => {
          if (!stop.lat || !stop.lng) return
          const dist = Math.sqrt(Math.pow(stop.lat - lat, 2) + Math.pow(stop.lng - lng, 2))
          if (dist > 1) return // Only show nearby stops

          const icon = STOP_ICONS[stop.stop_type || 'other'] || '📍'
          const el = document.createElement('div')
          el.innerHTML = `
            <div style="
              font-size:18px;cursor:pointer;
              filter:drop-shadow(0 2px 4px #0008);
              transition:transform 0.2s;
            " onmouseover="this.style.transform='scale(1.3)'"
               onmouseout="this.style.transform='scale(1)'"
            >${icon}</div>
          `
          const popup = new maplibre.Popup({ offset: 20, closeButton: false })
            .setHTML(`<div style="direction:rtl;font-family:'Heebo',sans-serif;padding:4px">
              <strong>${stop.personName || ''}</strong>
              ${stop.year ? `<br/><span style="color:#888">${stop.year}</span>` : ''}
              ${stop.city ? `<br/><span style="font-size:11px">${stop.city}</span>` : ''}
            </div>`)

          new maplibre.Marker({ element: el })
            .setLngLat([stop.lng, stop.lat])
            .setPopup(popup)
            .addTo(map)
        })
      })

      // Click → zoom closer then go to street
      map.on('click', (e) => {
        map.flyTo({ center: [e.lngLat.lng, e.lngLat.lat], zoom: 17, pitch: 60, duration: 1500 })
        setTimeout(() => {
          if (mounted) onStreetView(e.lngLat.lat, e.lngLat.lng)
        }, 1700)
      })

      map.getCanvas().style.cursor = 'crosshair'
    }
    init()
    return () => {
      mounted = false
      if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null }
    }
  }, [lat, lng])

  return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
}
