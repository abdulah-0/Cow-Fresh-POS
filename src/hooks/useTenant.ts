'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Tenant, Profile } from '@/types'

export function useTenant() {
    const [tenant, setTenant] = useState<Tenant | null>(null)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        async function loadTenant() {
            try {
                const { data: { user } } = await supabase.auth.getUser()

                if (!user) {
                    setLoading(false)
                    return
                }

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*, tenants(*)')
                    .eq('id', user.id)
                    .single()

                if (profile?.current_tenant_id) {
                    setTenant((profile as any).tenants)
                }
            } catch (error) {
                console.error('Error loading tenant:', error)
            } finally {
                setLoading(false)
            }
        }

        loadTenant()
    }, [])

    return { tenant, loading }
}

export function useTenantId() {
    const { tenant } = useTenant()
    return tenant?.id
}
