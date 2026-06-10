export default function OfflinePage() {
  return (
    <main dir="rtl" style={{ minHeight:'100vh', background:'#080606', color:'#f0e8d0', fontFamily:'"Heebo",Arial,sans-serif', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', gap:'1.5rem', padding:'2rem' }}>
      <div style={{ fontSize:'4rem' }}>📵</div>
      <h1 style={{ fontFamily:'"Playfair Display",serif', fontSize:'1.8rem', color:'#f5d98b', margin:0 }}>אין חיבור לאינטרנט</h1>
      <p style={{ color:'#5a3a1a', lineHeight:1.8, maxWidth:360 }}>ארכיון המשפחה אינו זמין כרגע. בדוק את החיבור שלך ונסה שנית.</p>
      <button onClick={() => window.location.reload()} style={{ background:'linear-gradient(135deg,#c9a227,#a68520)', color:'#0d0702', border:'none', borderRadius:12, padding:'0.7rem 1.8rem', fontWeight:700, fontSize:'0.95rem', fontFamily:'"Heebo",Arial,sans-serif', cursor:'pointer' }}>נסה שנית</button>
    </main>
  )
}
