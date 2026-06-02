'use client'
import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function NewFamilyPage() {
  const { locale } = useParams() as { locale: string }
  const router = useRouter()
  const [name, setName] = useState("")
  const [nameEn, setNameEn] = useState("")
  const [origin, setOrigin] = useState("")
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!name.trim()) { alert("שם משפחה חובה"); return }
    setSaving(true)
    const { data, error } = await supabase.from("families").insert({
      name, name_en: nameEn || null, origin_country: origin || null
    }).select().single()
    if (error) { alert("שגיאה: " + error.message); setSaving(false); return }
    router.push(`/${locale}/families/${data.id}`)
  }

  return (
    <main dir="rtl" style={{ minHeight: "100vh", background: "#0d0702", color: "#f5e6c8", fontFamily: "Heebo, sans-serif", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#1a0f0544", border: "1px solid #c9a22733", borderRadius: 16, padding: "2rem", width: "100%", maxWidth: 400 }}>
        <h2 style={{ marginBottom: 16, fontFamily: "Playfair Display, serif" }}>משפחה חדשה</h2>
        <div style={{ marginBottom: 8, fontSize: 12, color: "#8b6914", fontWeight: 600 }}>שם משפחה *</div>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="כהן" style={{ width: "100%", boxSizing: "border-box", background: "#1a0f0566", border: "1px solid #c9a22722", borderRadius: 8, padding: "8px 12px", marginBottom: 10, color: "#f5e6c8", fontSize: 14, outline: "none" }} />
        <div style={{ marginBottom: 8, fontSize: 12, color: "#8b6914", fontWeight: 600 }}>שם באנגלית</div>
        <input value={nameEn} onChange={e => setNameEn(e.target.value)} placeholder="Cohen" style={{ width: "100%", boxSizing: "border-box", background: "#1a0f0566", border: "1px solid #c9a22722", borderRadius: 8, padding: "8px 12px", marginBottom: 10, color: "#f5e6c8", fontSize: 14, outline: "none" }} />
        <div style={{ marginBottom: 8, fontSize: 12, color: "#8b6914", fontWeight: 600 }}>ארץ מוצא</div>
        <input value={origin} onChange={e => setOrigin(e.target.value)} placeholder="פולין" style={{ width: "100%", boxSizing: "border-box", background: "#1a0f0566", border: "1px solid #c9a22722", borderRadius: 8, padding: "8px 12px", marginBottom: 16, color: "#f5e6c8", fontSize: 14, outline: "none" }} />
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={save} disabled={saving} style={{ flex: 1, background: "#c9a227", border: "none", borderRadius: 10, padding: "10px", color: "#0d0702", cursor: "pointer", fontWeight: 700, fontSize: 14 }}>{saving ? "..." : "צור משפחה"}</button>
          <button onClick={() => router.back()} style={{ background: "transparent", border: "1px solid #c9a22744", borderRadius: 10, padding: "10px 20px", color: "#c9a227", cursor: "pointer" }}>ביטול</button>
        </div>
      </div>
    </main>
  )
}
