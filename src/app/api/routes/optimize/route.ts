import { NextRequest, NextResponse } from 'next/server'

export interface RouteStopInput {
    id: number | string
    name: string
    lat: number
    lng: number
    address?: string
    phone?: string
    type?: 'depot' | 'customer'
}

/** Haversine formula distance between two points in km */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371
    const toRad = (deg: number) => (deg * Math.PI) / 180
    const dLat = toRad(lat2 - lat1)
    const dLng = toRad(lng2 - lng1)
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function buildHaversineFallback(stops: RouteStopInput[], reason: string) {
    const geometry: [number, number][] = stops.map(s => [s.lat, s.lng])
    let totalDistanceKm = 0
    const legs: any[] = []

    for (let i = 0; i < stops.length - 1; i++) {
        const dist = haversineKm(
            stops[i].lat, stops[i].lng,
            stops[i + 1].lat, stops[i + 1].lng
        )
        totalDistanceKm += dist
        legs.push({
            from: stops[i].name,
            to: stops[i + 1].name,
            distanceKm: parseFloat(dist.toFixed(2)),
            durationMin: Math.round((dist / 30) * 60), // assume 30 km/h avg speed
        })
    }

    return {
        fallback: true,
        reason,
        orderedStops: stops,
        routeGeometry: geometry,
        totalDistanceKm: parseFloat(totalDistanceKm.toFixed(2)),
        totalDurationMin: legs.reduce((s, l) => s + l.durationMin, 0),
        legs,
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const stops: RouteStopInput[] = body.stops

        if (!stops || !Array.isArray(stops) || stops.length < 2) {
            return NextResponse.json(
                { error: 'At least 2 stops with valid coordinates are required' },
                { status: 400 }
            )
        }

        // Server-side ORS key (checking ORS_API_KEY first, fallback to legacy NEXT_PUBLIC_ORS_API_KEY)
        const orsKey = process.env.ORS_API_KEY || process.env.NEXT_PUBLIC_ORS_API_KEY

        if (!orsKey || orsKey === 'your_openrouteservice_api_key_here' || orsKey.trim() === '') {
            return NextResponse.json(
                buildHaversineFallback(stops, 'ORS API key not configured on server')
            )
        }

        const coordinates = stops.map(s => [s.lng, s.lat]) // ORS requires [lng, lat]

        const orsRes = await fetch('https://api.openrouteservice.org/v2/directions/driving-car/geojson', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': orsKey.trim(),
            },
            body: JSON.stringify({
                coordinates,
                instructions: false,
                optimize_waypoints: true,
            }),
        })

        if (!orsRes.ok) {
            const errText = await orsRes.text()
            console.error('[Server Route Service] ORS API returned error:', orsRes.status, errText)
            return NextResponse.json(
                buildHaversineFallback(stops, `ORS API error: ${orsRes.statusText} (${orsRes.status})`)
            )
        }

        const geojson = await orsRes.json()
        const feature = geojson?.features?.[0]

        if (!feature || !feature.geometry?.coordinates) {
            return NextResponse.json(
                buildHaversineFallback(stops, 'ORS response contained no valid geometry')
            )
        }

        // Swap geometry coordinates from [lng, lat] to [lat, lng] for Leaflet
        const geometry: [number, number][] = feature.geometry.coordinates.map(
            ([lng, lat]: [number, number]) => [lat, lng]
        )

        const summary = feature.properties?.summary || {}
        const totalDistanceKm = (summary.distance || 0) / 1000
        const totalDurationMin = Math.round((summary.duration || 0) / 60)

        const segments = feature.properties?.segments || []
        const legs = segments.map((seg: any, i: number) => ({
            from: stops[i]?.name || `Stop ${i + 1}`,
            to: stops[i + 1]?.name || `Stop ${i + 2}`,
            distanceKm: parseFloat(((seg.distance || 0) / 1000).toFixed(2)),
            durationMin: Math.round((seg.duration || 0) / 60),
        }))

        return NextResponse.json({
            fallback: false,
            orderedStops: stops,
            routeGeometry: geometry,
            totalDistanceKm: parseFloat(totalDistanceKm.toFixed(2)),
            totalDurationMin,
            legs,
        })
    } catch (err: any) {
        console.error('[Server Route Service] Unhandled error:', err)
        return NextResponse.json(
            { error: err.message || 'Failed to calculate optimized route' },
            { status: 500 }
        )
    }
}
