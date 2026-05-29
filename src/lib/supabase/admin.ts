import { createClient } from '@supabase/supabase-js'

/**
 * SERVER-ONLY: Create a Supabase client with the service role key.
 * This client bypasses RLS and should only be used in secure API routes.
 */
export function createAdminClient() {
    let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Supabase URL or Service Role Key is missing')
    }

    if (!supabaseUrl.startsWith('http')) {
        supabaseUrl = `https://${supabaseUrl}`
    }
    supabaseUrl = supabaseUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')

    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
}
