'use client'
import { useEffect, useState } from 'react'

// Inline Lottie-compatible SVG animation using CSS — no JSON file needed
// We'll create a pure CSS animated spinner that looks like Lottie
export function GoldSpinner({ size = 40 }: { size?: number }) {
  return (
    <div style={{ width: size, height: size, position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} viewBox="0 0 40 40" style={{ animation: 'spin 2s linear infinite' }}>
        <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(201,162,39,0.15)" strokeWidth="2" />
        <circle cx="20" cy="20" r="16" fill="none" stroke="#c9a227" strokeWidth="2"
          strokeDasharray="25 75" strokeLinecap="round"
          style={{ animation: 'spin 1.5s ease-in-out infinite', transformOrigin: 'center' }} />
        <circle cx="20" cy="20" r="4" fill="#c9a227" opacity="0.6" style={{ animation: 'pulse 1.5s ease-in-out infinite' }} />
      </svg>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.2); } }
      `}</style>
    </div>
  )
}

export function TreeAnimation({ width = 120, height = 140 }: { width?: number; height?: number }) {
  return (
    <svg width={width} height={height} viewBox="0 0 120 140" xmlns="http://www.w3.org/2000/svg">
      <style>{`
        .branch { stroke: #c9a227; stroke-width: 1.5; fill: none; stroke-linecap: round; }
        .leaf { fill: rgba(201,162,39,0.3); }
        @keyframes grow { from { stroke-dashoffset: 100; opacity: 0; } to { stroke-dashoffset: 0; opacity: 1; } }
        @keyframes leafPop { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .b1 { stroke-dasharray: 100; animation: grow 1s ease-out 0s both; }
        .b2 { stroke-dasharray: 60; animation: grow 0.8s ease-out 0.3s both; }
        .b3 { stroke-dasharray: 60; animation: grow 0.8s ease-out 0.5s both; }
        .b4 { stroke-dasharray: 40; animation: grow 0.6s ease-out 0.7s both; }
        .b5 { stroke-dasharray: 40; animation: grow 0.6s ease-out 0.8s both; }
        .l1 { transform-origin: 35px 40px; animation: leafPop 0.4s ease-out 1s both; }
        .l2 { transform-origin: 85px 40px; animation: leafPop 0.4s ease-out 1.1s both; }
        .l3 { transform-origin: 20px 70px; animation: leafPop 0.4s ease-out 1.2s both; }
        .l4 { transform-origin: 100px 70px; animation: leafPop 0.4s ease-out 1.3s both; }
        .root { stroke: #5a3a1a; stroke-width: 2; fill: none; stroke-dasharray: 80; animation: grow 1.2s ease-out 0s both; }
      `}</style>
      {/* Trunk */}
      <path className="branch root" d="M60 130 Q60 100 60 80" />
      {/* Main branches */}
      <path className="branch b1" d="M60 80 Q40 65 30 45" />
      <path className="branch b2" d="M60 80 Q80 65 90 45" />
      {/* Sub branches */}
      <path className="branch b3" d="M40 63 Q25 52 18 38" />
      <path className="branch b4" d="M80 63 Q95 52 102 38" />
      <path className="branch b5" d="M60 80 Q55 68 50 58" />
      {/* Leaves */}
      <circle className="leaf l1" cx="30" cy="42" r="10" />
      <circle className="leaf l2" cx="90" cy="42" r="10" />
      <circle className="leaf l3" cx="18" cy="35" r="8" />
      <circle className="leaf l4" cx="102" cy="35" r="8" />
      <circle className="leaf" cx="50" cy="55" r="7" style={{ transformOrigin: '50px 55px', animation: 'leafPop 0.4s ease-out 1.4s both' }} />
      {/* Root system */}
      <path d="M60 130 Q45 135 35 132" style={{ stroke: '#3a2a10', strokeWidth: 1.2, fill: 'none', strokeDasharray: 40, animation: 'grow 0.8s ease-out 0.5s both' }} />
      <path d="M60 130 Q75 135 85 132" style={{ stroke: '#3a2a10', strokeWidth: 1.2, fill: 'none', strokeDasharray: 40, animation: 'grow 0.8s ease-out 0.6s both' }} />
    </svg>
  )
}

export function PageLoader() {
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 1800)
    return () => clearTimeout(t)
  }, [])

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#080606',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: '1.5rem',
      animation: visible ? 'none' : 'fadeOut 0.5s ease-out forwards',
      pointerEvents: 'none',
    }}>
      <TreeAnimation width={120} height={140} />
      <div style={{ color: '#c9a227', fontSize: '0.75rem', letterSpacing: '0.3em', opacity: 0.6 }}>
        טוען...
      </div>
      <style>{`@keyframes fadeOut { to { opacity: 0; } }`}</style>
    </div>
  )
}

export default GoldSpinner
