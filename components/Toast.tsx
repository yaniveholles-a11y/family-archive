'use client'
import { useState, useEffect, createContext, useContext, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type ToastType = 'success' | 'error' | 'info'
type Toast = { id: number; message: string; type: ToastType }

const ToastContext = createContext<{ show: (msg: string, type?: ToastType) => void }>({ show: () => {} })

export function useToast() { return useContext(ToastContext) }

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  let counter = 0

  const show = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }, [])

  const colors = { success: '#4ade80', error: '#c94949', info: '#c9a227' }
  const icons = { success: '✓', error: '✕', info: 'ℹ' }

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div key={t.id}
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
              style={{
                background: '#1e140aee', backdropFilter: 'blur(16px)',
                border: `1px solid ${colors[t.type]}44`,
                borderRadius: 12, padding: '10px 18px',
                display: 'flex', alignItems: 'center', gap: 10,
                cursor: 'pointer', boxShadow: '0 8px 32px #000a',
                direction: 'rtl', fontFamily: '"Heebo", sans-serif',
              }}>
              <span style={{ color: colors[t.type], fontSize: 16, fontWeight: 700 }}>{icons[t.type]}</span>
              <span style={{ color: '#f5e6c8', fontSize: 13 }}>{t.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
