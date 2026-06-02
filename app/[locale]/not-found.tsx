export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#1c1008',
      color: '#f5e6c8',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Arial, sans-serif',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌳</div>
        <h1 style={{ color: '#f5d98b', marginBottom: '0.5rem' }}>404</h1>
        <p style={{ color: '#b89a5a' }}>הדף לא נמצא</p>
        <a href="/he" style={{ color: '#c9a227' }}>חזרה לדף הבית</a>
      </div>
    </div>
  )
}