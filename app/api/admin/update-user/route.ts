import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
    try {
        const { id, email, password, full_name, role } = await request.json()

        if (!id) {
            return NextResponse.json({ error: 'User ID es requerido' }, { status: 400 })
        }

        // Use service role key for admin operations
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { autoRefreshToken: false, persistSession: false } }
        )

        // Update auth user if email or password provided
        const authUpdates: any = {}
        if (email) authUpdates.email = email
        if (password) authUpdates.password = password

        if (Object.keys(authUpdates).length > 0) {
            const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, authUpdates)
            if (authError) {
                return NextResponse.json({ error: authError.message }, { status: 400 })
            }
        }

        // Update profile (full_name, role)
        const profileUpdates: any = { updated_at: new Date().toISOString() }
        if (full_name !== undefined) profileUpdates.full_name = full_name
        if (role) profileUpdates.role = role

        if (Object.keys(profileUpdates).length > 1) { // >1 because updated_at is always there
            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .update(profileUpdates)
                .eq('id', id)

            if (profileError) {
                return NextResponse.json({ error: profileError.message }, { status: 400 })
            }
        }

        return NextResponse.json({ success: true })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error interno del servidor'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
