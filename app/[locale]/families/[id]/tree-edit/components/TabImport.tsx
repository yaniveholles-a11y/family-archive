'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'

export default function TabImport({ people, relations, familyId, onRefresh, logHistory }: any) {
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState('')

  const exportJSON = () => {
    const data = { people, relations, exported_at: new Date().toISOString() }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `tree-${familyId}.json`; a.click()
    URL.revokeObjectURL(url)
  }

  const exportCSV = () => {
    const header = 'שם_פרטי,שם_משפחה,מין,שנת_לידה,מקום_לידה,שנת_פטירה,מקום_פטירה,מקצוע,ארץ_מוצא'
    const rows = people.map((p: any) => [
      p.first_name, p.last_name || '', p.gender || '', p.birth_date || '', p.birth_place || '',
      p.death_date || '', p.death_place || '', p.profession || '', p.origin_country || '',
    ].map(v => `"${v}"`).join(','))
    const csv = '\uFEFF' + header + '\n' + rows.join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `tree-${familyId}.csv`; a.click()
  }

  const importJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setImporting(true); setResult('')
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      let added = 0
      if (data.people) {
        for (const p of data.people) {
          const { error } = await supabase.from('people').insert({ ...p, id: undefined, family_id: parseInt(familyId) })
          if (!error) added++
        }
      }
      setResult(`✅ יובאו ${added} אנשים`)
      logHistory('import', 'json', undefined, { count: added })
      onRefresh()
    } catch { setResult('❌ שגיאה בקובץ JSON') }
    setImporting(false)
  }

  const importCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setImporting(true); setResult('')
    try {
      const text = await file.text()
      const lines = text.split('\n').filter(l => l.trim())
      let added = 0
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.replace(/^"|"$/g, '').trim())
        if (!cols[0]) continue
        const { error } = await supabase.from('people').insert({
          first_name: cols[0], last_name: cols[1] || null, gender: cols[2] || null,
          birth_date: cols[3] || null, birth_place: cols[4] || null,
          death_date: cols[5] || null, death_place: cols[6] || null,
          profession: cols[7] || null, origin_country: cols[8] || null,
          family_id: parseInt(familyId),
        })
        if (!error) added++
      }
      setResult(`✅ יובאו ${added} אנשים מ-CSV`)
      logHistory('import', 'csv', undefined, { count: added })
      onRefresh()
    } catch { setResult('❌ שגיאה בקובץ CSV') }
    setImporting(false)
  }

  const exportPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf')
      const pdf = new jsPDF('landscape', 'mm', 'a4')
      pdf.setFontSize(18)
      pdf.text('Family Tree', 148, 15, { align: 'center' })
      pdf.setFontSize(10)
      let y = 30
      people.forEach((p: any, i: number) => {
        const name = [p.first_name, p.last_name].filter(Boolean).join(' ')
        const years = [p.birth_date?.substring(0,4), p.death_date?.substring(0,4)].filter(Boolean).join(' - ')
        pdf.text(`${i+1}. ${name} (${years}) ${p.birth_place || ''}`, 10, y)
        y += 6
        if (y > 190) { pdf.addPage(); y = 15 }
      })
      pdf.save(`tree-${familyId}.pdf`)
    } catch { alert('שגיאה ביצוא PDF') }
  }

  return (
    <div style={{ padding: '12px 14px' }}>
      <Sec title="ייצוא">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <Btn onClick={exportJSON}>📥 ייצא JSON</Btn>
          <Btn onClick={exportCSV}>📥 ייצא CSV</Btn>
          <Btn onClick={exportPDF}>🖨️ ייצא PDF</Btn>
        </div>
        <div style={{ fontSize: 11, color: '#5a3a1a', marginTop: 8 }}>
          {people.length} אנשים · {relations.length} קשרים
        </div>
      </Sec>
      <Sec title="ייבוא">
        <label style={{ display: 'block', background: '#c9a22711', border: '1px dashed #c9a22744', borderRadius: 12, padding: '16px', textAlign: 'center', cursor: 'pointer', color: '#c9a227', fontSize: 13, marginBottom: 8 }}>
          📤 ייבא JSON
          <input type="file" accept=".json" onChange={importJSON} style={{ display: 'none' }} disabled={importing} />
        </label>
        <label style={{ display: 'block', background: '#c9a22711', border: '1px dashed #c9a22744', borderRadius: 12, padding: '16px', textAlign: 'center', cursor: 'pointer', color: '#c9a227', fontSize: 13 }}>
          📤 ייבא CSV
          <input type="file" accept=".csv" onChange={importCSV} style={{ display: 'none' }} disabled={importing} />
        </label>
        {importing && <div style={{ marginTop: 8, color: '#c9a227', fontSize: 12 }}>⏳ מייבא...</div>}
        {result && <div style={{ marginTop: 8, color: result.startsWith('✅') ? '#4ade80' : '#c94949', fontSize: 12 }}>{result}</div>}
      </Sec>
      <Sec title="פורמט CSV">
        <div style={{ fontSize: 11, color: '#5a3a1a', lineHeight: 1.6, background: '#1a0f0533', borderRadius: 8, padding: 10 }}>
          שורה ראשונה — כותרות:<br/>
          שם_פרטי, שם_משפחה, מין, שנת_לידה, מקום_לידה, שנת_פטירה, מקום_פטירה, מקצוע, ארץ_מוצא
        </div>
      </Sec>
    </div>
  )
}
function Sec({ title, children }: any) { return <div style={{ marginBottom: 16 }}><div style={{ fontSize: 13, color: '#c9a227', fontWeight: 600, marginBottom: 8, paddingBottom: 4, borderBottom: '1px solid #c9a22722' }}>{title}</div>{children}</div> }
function Btn({ children, onClick }: any) { return <motion.button whileTap={{ scale: 0.97 }} onClick={onClick} style={{ background: '#c9a22712', border: '1px solid #c9a22733', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', color: '#c9a227', fontSize: 12 }}>{children}</motion.button> }
