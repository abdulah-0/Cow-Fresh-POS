export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If logged in, go to dashboard; otherwise go straight to login
  if (user) {
    redirect('/dashboard')
  } else {
    redirect('/login')
  }
}
