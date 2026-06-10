import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({
        reply: 'שגיאה: מפתח API של Claude לא מוגדר. הוסף ANTHROPIC_API_KEY ל-.env.local',
      })
    }

    const system = `אתה עוזר AI למאגר נתונים של עץ משפחתי ממשפחה יהודית ישראלית.
אתה עונה בעברית על שאלות אודות ההיסטוריה המשפחתית, תקופת השואה, העלייה לארץ ישראל, ומידע ביוגרפי.
אתה מנומס, חם, ומסביר. אם אינך יודע מידע ספציפי, אמור זאת בכנות.`

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system,
        messages: messages.map((m: { role: string; content: string }) => ({
          role: m.role,
          content: m.content,
        })),
      }),
    })

    const data = await res.json()
    const reply = data.content?.[0]?.text || 'לא התקבלה תשובה'
    return NextResponse.json({ reply })
  } catch (err) {
    console.error('AI chat error:', err)
    return NextResponse.json({ reply: '❌ שגיאה פנימית. נסה שנית.' }, { status: 500 })
  }
}
