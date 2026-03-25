import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
    try {
        const { email, password, full_name } = await request.json()

        if (!email || !password) {
            return NextResponse.json({ error: 'Email y contraseña son requeridos' }, { status: 400 })
        }

        // Use service role key for admin operations
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { autoRefreshToken: false, persistSession: false } }
        )

        // Create auth user
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
        })

        if (authError) {
            return NextResponse.json({ error: authError.message }, { status: 400 })
        }

        // Create profile
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .insert({
                id: authData.user.id,
                email: email,
                full_name: full_name || null,
                role: 'participant',
            })

        if (profileError) {
            return NextResponse.json({ error: profileError.message }, { status: 400 })
        }

        return NextResponse.json({ success: true, user_id: authData.user.id })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error interno del servidor'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
