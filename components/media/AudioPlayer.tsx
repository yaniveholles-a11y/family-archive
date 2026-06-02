'use client'
/**
 * Audio Player — Wavesurfer.js integration
 * 
 * Cinematic audio player for interview recordings.
 * Shows waveform, playback controls, speed control.
 */
import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

interface Props {
  url: string
  title?: string
  personName?: string
  date?: string
}

export default function AudioPlayer({ url, title, personName, date }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const wavesurferRef = useRef<any>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let mounted = true

    async function init() {
      const WaveSurfer = (await import('wavesurfer.js')).default
      if (!mounted || !containerRef.current) return

      const ws = WaveSurfer.create({
        container: containerRef.current,
        waveColor: '#5a3a1a',
        progressColor: '#c9a227',
        cursorColor: '#f5d98b',
        cursorWidth: 2,
        barWidth: 2,
        barGap: 1,
        barRadius: 2,
        height: 64,
        normalize: true,
        backend: 'WebAudio',
      })

      wavesurferRef.current = ws

      ws.load(url)

      ws.on('ready', () => {
        if (!mounted) return
        setDuration(ws.getDuration())
        setIsReady(true)
      })

      ws.on('audioprocess', () => {
        setCurrentTime(ws.getCurrentTime())
      })

      ws.on('finish', () => {
        setIsPlaying(false)
      })
    }

    init()

    return () => {
      mounted = false
      wavesurferRef.current?.destroy()
    }
  }, [url])

  const togglePlay = () => {
    if (!wavesurferRef.current) return
    wavesurferRef.current.playPause()
    setIsPlaying(!isPlaying)
  }

  const changeSpeed = () => {
    const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2]
    const idx = speeds.indexOf(playbackRate)
    const next = speeds[(idx + 1) % speeds.length]
    setPlaybackRate(next)
    wavesurferRef.current?.setPlaybackRate(next)
  }

  const formatTime = (s: number) => {
    const min = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${min}:${sec.toString().padStart(2, '0')}`
  }

  const skip = (seconds: number) => {
    if (!wavesurferRef.current) return
    wavesurferRef.current.skip(seconds)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'linear-gradient(180deg, #1e140a, #0d0702)',
        border: '1px solid #c9a22733',
        borderRadius: 16,
        padding: '16px 20px',
        fontFamily: '"Heebo", sans-serif',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      }}
    >
      {/* Header */}
      {(title || personName) && (
        <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            {title && (
              <div style={{
                fontSize: 15, fontWeight: 600, color: '#f5e6c8',
                fontFamily: '"Playfair Display", serif',
              }}>{title}</div>
            )}
            {personName && (
              <div style={{ fontSize: 12, color: '#8b6914', marginTop: 2 }}>
                {personName}{date ? ` · ${date}` : ''}
              </div>
            )}
          </div>
          <div style={{
            fontSize: 11, color: '#5a3a1a',
            padding: '2px 8px', borderRadius: 6,
            background: '#c9a22711',
          }}>
            🎙️ הקלטה
          </div>
        </div>
      )}

      {/* Waveform */}
      <div ref={containerRef} style={{
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: 12,
        opacity: isReady ? 1 : 0.3,
        transition: 'opacity 0.3s',
      }} />

      {/* Controls */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Skip back */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => skip(-10)}
            style={{
              background: 'none', border: 'none',
              color: '#8b6914', cursor: 'pointer', fontSize: 14,
              padding: '4px 8px',
            }}
          >-10s</motion.button>

          {/* Play/Pause */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            onClick={togglePlay}
            disabled={!isReady}
            style={{
              background: isPlaying
                ? 'linear-gradient(135deg, #c9a227, #a68520)'
                : 'transparent',
              border: `1.5px solid ${isPlaying ? '#c9a227' : '#c9a22766'}`,
              borderRadius: '50%',
              width: 40, height: 40,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: isReady ? 'pointer' : 'wait',
              color: isPlaying ? '#0d0702' : '#c9a227',
              fontSize: 16,
              boxShadow: isPlaying ? '0 0 20px rgba(201,162,39,0.3)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            {isPlaying ? '⏸' : '▶'}
          </motion.button>

          {/* Skip forward */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => skip(10)}
            style={{
              background: 'none', border: 'none',
              color: '#8b6914', cursor: 'pointer', fontSize: 14,
              padding: '4px 8px',
            }}
          >+10s</motion.button>
        </div>

        {/* Time */}
        <div style={{ fontSize: 12, color: '#8b6914', fontVariantNumeric: 'tabular-nums' }}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>

        {/* Speed */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={changeSpeed}
          style={{
            background: playbackRate !== 1 ? '#c9a22715' : 'transparent',
            border: '1px solid #c9a22733',
            borderRadius: 8, padding: '4px 10px',
            color: '#c9a227', cursor: 'pointer', fontSize: 12,
            fontFamily: '"Heebo", sans-serif',
          }}
        >
          {playbackRate}x
        </motion.button>
      </div>
    </motion.div>
  )
}
