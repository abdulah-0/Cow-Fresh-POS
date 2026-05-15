import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
        // Return a dummy client during build to avoid crashing
        // In the browser, these will be defined via window.__ENV__ or similar
        return createBrowserClient(
            'https://placeholder-url.supabase.co',
            'placeholder-key'
        )
    }

    return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
