import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { email, password, full_name, role, family_ids } = await req.json()

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(u => u.email === email)

    let userId: string

    if (existingUser) {
      userId = existingUser.id
      if (password) {
        await supabaseAdmin.auth.admin.updateUserById(userId, { password })
      }
    } else {
      const genPassword = password || Array.from({ length: 10 }, () => 
        'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'[Math.floor(Math.random() * 55)]
      ).join('')

      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: genPassword,
        email_confirm: true,
      })
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      userId = data.user.id
    }

    // Update or create role — always store email and full_name
    const { data: existingRole } = await supabaseAdmin
      .from('user_roles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()

    if (existingRole) {
      await supabaseAdmin.from('user_roles')
        .update({ 
          role: role || 'viewer', 
          full_name: full_name || null,
          email: email || null,
        })
        .eq('user_id', userId)
    } else {
      await supabaseAdmin.from('user_roles')
        .insert({ 
          user_id: userId, 
          role: role || 'viewer', 
          full_name: full_name || null,
          email: email || null,
        })
    }

    // Add family access
    if (family_ids && family_ids.length > 0) {
      for (const fid of family_ids) {
        try {
          await supabaseAdmin.from('user_family_access')
            .upsert({ user_id: userId, family_id: fid }, { onConflict: 'user_id,family_id' })
        } catch {}
      }
      // Also store first family in user_roles
      await supabaseAdmin.from('user_roles')
        .update({ family_id: family_ids[0] })
        .eq('user_id', userId)
    }

    return NextResponse.json({ success: true, user_id: userId })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
