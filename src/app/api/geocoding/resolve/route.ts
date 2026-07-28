import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Simple in-memory server queue to ensure 1 req/sec rate limit to Nominatim
let lastNominatimCallTime = 0

async function throttleNominatimCall() {
    const now = Date.now()
    const elapsed = now - lastNominatimCallTime
    if (elapsed < 1000) {
        await new Promise(resolve => setTimeout(resolve, 1000 - elapsed))
    }
    lastNominatimCallTime = Date.now()
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { address, customerId, forceRefresh } = body

        if (!address && !customerId) {
            return NextResponse.json({ error: 'Either address or customerId is required' }, { status: 400 })
        }

        const supabase = await createClient()
        let targetAddress = address
        let existingCustomer: any = null

        // 1. Check database cache if customerId is provided
        if (customerId) {
            const { data: customer, error: custErr } = await supabase
                .from('customers')
                .select('id, delivery_address, latitude, longitude, person:people(address_1, city, state)')
                .eq('id', customerId)
                .single()

            if (!custErr && customer) {
                existingCustomer = customer
                if (!targetAddress) {
                    const person = Array.isArray(customer.person) ? customer.person[0] : customer.person
                    targetAddress = customer.delivery_address || 
                        [person?.address_1, person?.city, person?.state].filter(Boolean).join(', ')
                }

                // If cache exists and forceRefresh is false, return cached coordinates
                if (!forceRefresh && customer.latitude != null && customer.longitude != null) {
                    return NextResponse.json({
                        cached: true,
                        lat: Number(customer.latitude),
                        lng: Number(customer.longitude),
                        address: targetAddress,
                    })
                }
            }
        }

        if (!targetAddress || targetAddress.trim().length === 0) {
            return NextResponse.json({ error: 'No valid address found to geocode' }, { status: 400 })
        }

        // 2. Rate-limit and query Nominatim API server-side
        await throttleNominatimCall()

        const userAgent = process.env.NOMINATIM_USER_AGENT || 'CowFreshPOS/1.0 (contact@cowfresh.example)'
        const encodedAddress = encodeURIComponent(targetAddress.trim())
        const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&limit=1`

        const nomRes = await fetch(nominatimUrl, {
            headers: { 'User-Agent': userAgent },
        })

        if (!nomRes.ok) {
            return NextResponse.json(
                { error: 'Failed to communicate with Nominatim geocoding service' },
                { status: 502 }
            )
        }

        const data = await nomRes.json()
        if (!data || data.length === 0) {
            return NextResponse.json(
                { error: `Address "${targetAddress}" could not be geocoded` },
                { status: 404 }
            )
        }

        const lat = parseFloat(data[0].lat)
        const lng = parseFloat(data[0].lon)

        // 3. Write resolved coordinates back to customer record if customerId is present
        if (customerId) {
            await supabase
                .from('customers')
                .update({
                    latitude: lat,
                    longitude: lng,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', customerId)
        }

        return NextResponse.json({
            cached: false,
            lat,
            lng,
            address: targetAddress,
        })
    } catch (err: any) {
        console.error('Server geocoding error:', err)
        return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
    }
}
