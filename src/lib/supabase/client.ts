import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
        // Return a dummy client during build to avoid crashing
        return createBrowserClient(
            'https://placeholder-url.supabase.co',
            'placeholder-key'
        )
    }

    // Defensive URL normalization:
    // 1. Ensure https protocol
    if (!supabaseUrl.startsWith('http')) {
        supabaseUrl = `https://${supabaseUrl}`
    }
    // 2. Remove trailing slash and /rest/v1 if accidentally included
    supabaseUrl = supabaseUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')

    return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
