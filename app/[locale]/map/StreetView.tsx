'use client'
import { useEffect, useRef } from 'react'

interface Props {
  lat: number
  lng: number
}

export default function StreetView({ lat, lng }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null)

  useEffect(() => {
    // Inject Leaflet CSS
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'
    document.head.appendChild(link)
    return () => { document.head.removeChild(link) }
  }, [])

  useEffect(() => {
    let mounted = true

    async function init() {
      const L = (await import('leaflet')).default
      if (!mounted || !mapRef.current) return

      // Fix Leaflet's broken default icon path in Next.js
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })

      const map = L.map(mapRef.current!).setView([lat, lng], 17)
      mapInstanceRef.current = map

      // OpenStreetMap tiles (free, no key)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)

      // Pulsing golden marker
      const icon = L.divIcon({
        html: `
          <div style="position:relative">
            <div style="
              width:18px;height:18px;background:#c9a227;border-radius:50%;
              border:3px solid #fff;box-shadow:0 0 0 3px #c9a22766;
              animation:pulse 1.5s infinite;
            "></div>
          </div>
          <style>@keyframes pulse{0%,100%{box-shadow:0 0 0 3px #c9a22766}50%{box-shadow:0 0 0 8px #c9a22722}}</style>
        `,
        className: '',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      })

      L.marker([lat, lng], { icon })
        .addTo(map)
        .bindPopup('📍 מיקום שנבחר', { closeButton: false })
        .openPopup()
    }

    init()

    return () => {
      mounted = false
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [lat, lng])

  return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
}
