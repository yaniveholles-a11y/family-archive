'use client'
import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode; fallback?: ReactNode }
interface State { hasError: boolean; error?: Error }

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) { super(props); this.state = { hasError: false } }

  static getDerivedStateFromError(error: Error) { return { hasError: true, error } }

  componentDidCatch(error: Error) { console.error('Error caught:', error) }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div dir="rtl" style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, fontFamily: '"Heebo", sans-serif', color: '#f5e6c8' }}>
          <div style={{ fontSize: 48 }}>⚠️</div>
          <h2 style={{ color: '#c9a227' }}>משהו השתבש</h2>
          <p style={{ color: '#8b6914', fontSize: 14 }}>{this.state.error?.message || 'שגיאה לא ידועה'}</p>
          <button onClick={() => { this.setState({ hasError: false }); window.location.reload() }}
            style={{ background: '#c9a227', border: 'none', borderRadius: 10, padding: '10px 24px', color: '#0d0702', cursor: 'pointer', fontWeight: 700 }}>
            רענן עמוד
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
