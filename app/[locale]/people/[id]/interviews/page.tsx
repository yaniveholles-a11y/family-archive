'use client'
import { useParams } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'

type Recording = { id: string; name: string; url: string; date: string }

export default function InterviewsPage() {
  const { locale, id } = useParams() as { locale: string; id: string }
  const [person, setPerson] = useState<{ first_name: string; last_name?: string } | null>(null)
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [recording, setRecording] = useState(false)
  const [recordTime, setRecordTime] = useState(0)
  const [playing, setPlaying] = useState<string | null>(null)
  const [waveData, setWaveData] = useState<number[]>(Array(60).fill(2))
  const [uploading, setUploading] = useState(false)

  const mediaRecRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animRef = useRef<number>(0)
  const wsRef = useRef<any>(null)
  const wsContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadPerson()
    loadRecordings()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      cancelAnimationFrame(animRef.current)
      wsRef.current?.destroy()
    }
  }, [id])

  async function loadPerson() {
    const { data } = await supabase.from('people').select('first_name,last_name').eq('id', id).single()
    setPerson(data)
  }

  async function loadRecordings() {
    const { data } = await supabase.storage.from('interviews').list(`person-${id}/`, {
      sortBy: { column: 'created_at', order: 'desc' }
    })
    if (data) {
      const recs: Recording[] = data
        .filter(f => f.name.endsWith('.webm') || f.name.endsWith('.mp3'))
        .map(f => ({
          id: f.id || f.name,
          name: f.name,
          url: supabase.storage.from('interviews').getPublicUrl(`person-${id}/${f.name}`).data.publicUrl,
          date: f.created_at || '',
        }))
      setRecordings(recs)
    }
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const ctx = new AudioContext()
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 128
      source.connect(analyser)
      analyserRef.current = analyser

      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      mediaRecRef.current = mr
      chunksRef.current = []
      mr.ondataavailable = e => chunksRef.current.push(e.data)
      mr.onstop = handleStop
      mr.start(100)
      setRecording(true)
      setRecordTime(0)
      timerRef.current = setInterval(() => setRecordTime(t => t + 1), 1000)
      animateWave()
    } catch { alert('לא ניתן לגשת למיקרופון') }
  }

  function animateWave() {
    if (!analyserRef.current) return
    const buf = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(buf)
    const bars = Array.from({ length: 60 }, (_, i) => {
      const v = buf[Math.floor(i * buf.length / 60)] / 255
      return Math.max(2, v * 48)
    })
    setWaveData(bars)
    animRef.current = requestAnimationFrame(animateWave)
  }

  function stopRecording() {
    mediaRecRef.current?.stop()
    mediaRecRef.current?.stream.getTracks().forEach(t => t.stop())
    cancelAnimationFrame(animRef.current)
    if (timerRef.current) clearInterval(timerRef.current)
    setRecording(false)
    setWaveData(Array(60).fill(2))
  }

  async function handleStop() {
    const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
    const name = `interview-${Date.now()}.webm`
    setUploading(true)
    const { error } = await supabase.storage.from('interviews').upload(`person-${id}/${name}`, blob)
    if (!error) await loadRecordings()
    setUploading(false)
  }

  async function playWithWaveSurfer(url: string, recId: string) {
    if (playing === recId) {
      wsRef.current?.pause()
      setPlaying(null)
      return
    }
    if (wsRef.current) { wsRef.current.destroy(); wsRef.current = null }
    const { default: WaveSurfer } = await import('wavesurfer.js')
    const ws = WaveSurfer.create({
      container: wsContainerRef.current!,
      waveColor: 'rgba(201,162,39,0.35)',
      progressColor: '#c9a227',
      cursorColor: '#f5d98b',
      barWidth: 2, barGap: 1, barRadius: 2,
      height: 48, normalize: true,
    })
    ws.load(url)
    ws.on('ready', () => { ws.play(); setPlaying(recId) })
    ws.on('finish', () => setPlaying(null))
    wsRef.current = ws
  }

  function fmtTime(s: number) {
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  }

  return (
    <main dir="rtl" style={{ minHeight: '100vh', background: '#080606', color: '#f0e8d0', fontFamily: '"Heebo",Arial,sans-serif' }}>
      <div style={{ background: 'rgba(8,6,6,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(201,162,39,0.12)', padding: '0 2rem', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 10, padding: '0.85rem 0' }}>
          <a href={`/${locale}/people`} style={{ color: '#3a2a10', fontSize: '0.82rem', textDecoration: 'none' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#c9a227')} onMouseLeave={e => (e.currentTarget.style.color = '#3a2a10')}>← אנשים</a>
          <span style={{ color: '#1a0f05' }}>·</span>
          <span style={{ color: '#f5d98b', fontSize: '0.85rem' }}>🎙️ ראיונות{person ? ` — ${person.first_name} ${person.last_name || ''}` : ''}</span>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '1.5rem 2rem 4rem' }}>

        {/* Recorder card */}
        <div style={{ background: 'rgba(26,15,5,0.8)', border: '1px solid rgba(201,162,39,0.12)', borderRadius: 16, padding: '1.75rem', marginBottom: '2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.72rem', color: '#5a3a1a', letterSpacing: '0.12em', marginBottom: '1.25rem' }}>🎙️ הקלטת ראיון</div>

          {/* Waveform bars */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, height: 56, marginBottom: '1.25rem' }}>
            {waveData.map((h, i) => (
              <motion.div key={i} animate={{ height: h }}
                style={{ width: 3, borderRadius: 2, background: recording ? `rgba(201,162,39,${0.3 + (h / 48) * 0.7})` : 'rgba(201,162,39,0.12)' }} />
            ))}
          </div>

          {recording && (
            <div style={{ fontFamily: 'monospace', fontSize: '1.5rem', color: '#c9a227', marginBottom: '1rem', letterSpacing: '0.08em' }}>
              {fmtTime(recordTime)}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <AnimatePresence mode="wait">
              {!recording ? (
                <motion.button key="start" onClick={startRecording}
                  initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                  whileHover={{ scale: 1.07 }} whileTap={{ scale: 0.92 }}
                  style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#c9a227,#a68520)', border: 'none', cursor: 'pointer', fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  🎙️
                </motion.button>
              ) : (
                <motion.button key="stop" onClick={stopRecording}
                  initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                  whileHover={{ scale: 1.07 }} whileTap={{ scale: 0.92 }}
                  style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(180,60,60,0.8)', border: '2px solid rgba(220,80,80,0.4)', cursor: 'pointer', fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  ⏹️
                </motion.button>
              )}
            </AnimatePresence>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#3a2a10', marginTop: '0.75rem' }}>
            {recording ? 'מקליט... לחץ לעצור' : 'לחץ להתחיל הקלטה'}
          </div>
          {uploading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: '0.75rem', fontSize: '0.78rem', color: '#4a9e6a' }}>
              ⬆ מעלה לענן...
            </motion.div>
          )}
        </div>

        {/* WaveSurfer player container */}
        {playing && (
          <div style={{ background: 'rgba(26,15,5,0.6)', border: '1px solid rgba(201,162,39,0.15)', borderRadius: 12, padding: '0.75rem 1rem', marginBottom: '1rem' }}>
            <div ref={wsContainerRef} />
          </div>
        )}
        {!playing && <div ref={wsContainerRef} style={{ display: 'none' }} />}

        {/* List */}
        <div style={{ fontSize: '0.72rem', color: '#5a3a1a', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>
          הקלטות ({recordings.length})
        </div>
        {recordings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#2a1a08' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🎙️</div>
            <div>אין הקלטות עדיין</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {recordings.map(r => (
              <motion.div key={r.id} whileHover={{ x: -2 }}
                style={{ background: 'rgba(26,15,5,0.7)', border: `1px solid ${playing === r.id ? 'rgba(201,162,39,0.3)' : 'rgba(201,162,39,0.08)'}`, borderRadius: 12, padding: '0.85rem 1.1rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <motion.button onClick={() => playWithWaveSurfer(r.url, r.id)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  style={{ width: 38, height: 38, borderRadius: '50%', background: playing === r.id ? 'linear-gradient(135deg,#c9a227,#a68520)' : 'rgba(201,162,39,0.1)', border: `1px solid rgba(201,162,39,${playing === r.id ? 0.5 : 0.2})`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', flexShrink: 0 }}>
                  {playing === r.id ? '⏸' : '▶'}
                </motion.button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.82rem', color: '#f5d98b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.name.replace(/\.(webm|mp3)$/, '')}
                  </div>
                  {r.date && <div style={{ fontSize: '0.68rem', color: '#3a2a10', marginTop: '0.15rem' }}>{new Date(r.date).toLocaleDateString('he-IL')}</div>}
                </div>
                <a href={r.url} download={r.name} style={{ color: '#3a2a10', textDecoration: 'none', fontSize: '0.85rem', flexShrink: 0 }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#c9a227')} onMouseLeave={e => (e.currentTarget.style.color = '#3a2a10')}>
                  ⬇
                </a>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
