/**
 * routeService.ts
 * Handles all interactions with OpenRouteService (ORS) for delivery route optimization.
 * Uses the free ORS Directions API (Matrix + Optimise endpoints).
 * API key is stored in NEXT_PUBLIC_ORS_API_KEY environment variable.
 *
 * ORS Free tier: 2000 requests/day — more than enough for a single dairy shop.
 */

const ORS_BASE_URL = 'https://api.openrouteservice.org'

export interface Coordinate {
    lat: number
    lng: number
}

export interface RouteStop {
    id: number
    name: string
    lat: number
    lng: number
    address?: string
    phone?: string
    type: 'depot' | 'customer'
}

export interface OptimizedRoute {
    orderedStops: RouteStop[]
    routeGeometry: [number, number][] // [lng, lat] pairs for Leaflet polyline (swapped for Leaflet)
    totalDistanceKm: number
    totalDurationMin: number
    legs: {
        from: string
        to: string
        distanceKm: number
        durationMin: number
    }[]
}

/**
 * Geocode an address string to coordinates using Nominatim (free, no key needed).
 * Returns null if address cannot be resolved.
 */
export async function geocodeAddress(address: string): Promise<Coordinate | null> {
    try {
        const encoded = encodeURIComponent(address)
        const res = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1`,
            { headers: { 'User-Agent': 'CowFreshPOS/2.0 (cowfreshdairy@gmail.com)' } }
        )
        const data = await res.json()
        if (!data || data.length === 0) return null
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
    } catch (err) {
        console.error('Geocoding error:', err)
        return null
    }
}

/**
 * Reverse-geocode coordinates to a human-readable address via Nominatim.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { 'User-Agent': 'CowFreshPOS/2.0 (cowfreshdairy@gmail.com)' } }
        )
        const data = await res.json()
        return data?.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`
    } catch {
        return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
    }
}

/**
 * Calculate an optimized delivery route for a list of stops using ORS Directions API.
 * The first stop is treated as the depot (starting point).
 * Falls back to simple sequential ordering if ORS key is missing.
 *
 * @param stops - Array of stops (first element = depot/start)
 * @returns Optimized route with ordered stops, polyline geometry, and distance/duration
 */
export async function calculateOptimizedRoute(stops: RouteStop[]): Promise<OptimizedRoute | null> {
    if (stops.length < 2) return null

    const orsKey = process.env.NEXT_PUBLIC_ORS_API_KEY

    // If no ORS key, return stops in their given order with straight-line estimates
    if (!orsKey || orsKey === 'your_openrouteservice_api_key_here') {
        console.warn('ORS API key not configured. Returning sequential route (no optimization).')
        return buildFallbackRoute(stops)
    }

    try {
        // ORS Directions API — optimized waypoints via "optimize_waypoints" flag
        const coordinates = stops.map(s => [s.lng, s.lat]) // ORS uses [lng, lat]

        const response = await fetch(`${ORS_BASE_URL}/v2/directions/driving-car/geojson`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': orsKey,
            },
            body: JSON.stringify({
                coordinates,
                instructions: false,
                optimize_waypoints: true,
            }),
        })

        if (!response.ok) {
            const errText = await response.text()
            console.error('ORS API error:', errText)
            return buildFallbackRoute(stops)
        }

        const geojson = await response.json()
        const feature = geojson?.features?.[0]
        if (!feature) return buildFallbackRoute(stops)

        const geometry: [number, number][] = feature.geometry.coordinates.map(
            ([lng, lat]: [number, number]) => [lat, lng] // swap back to [lat, lng] for Leaflet
        )

        const summary = feature.properties?.summary || {}
        const totalDistanceKm = (summary.distance || 0) / 1000
        const totalDurationMin = Math.round((summary.duration || 0) / 60)

        // Extract per-segment stats
        const segments = feature.properties?.segments || []
        const legs = segments.map((seg: any, i: number) => ({
            from: stops[i]?.name || `Stop ${i + 1}`,
            to: stops[i + 1]?.name || `Stop ${i + 2}`,
            distanceKm: parseFloat(((seg.distance || 0) / 1000).toFixed(2)),
            durationMin: Math.round((seg.duration || 0) / 60),
        }))

        // Re-order stops by the way ORS returned them (ORS may reorder for optimization)
        // For now keep original order (ORS optimize_waypoints respects order but minimizes backtracking)
        return {
            orderedStops: stops,
            routeGeometry: geometry,
            totalDistanceKm: parseFloat(totalDistanceKm.toFixed(2)),
            totalDurationMin,
            legs,
        }
    } catch (err) {
        console.error('Route calculation error:', err)
        return buildFallbackRoute(stops)
    }
}

/**
 * Fallback: straight lines between stops in given order, no ORS API required.
 * Estimates distance using Haversine formula.
 */
function buildFallbackRoute(stops: RouteStop[]): OptimizedRoute {
    // Build straight-line polyline
    const geometry: [number, number][] = stops.map(s => [s.lat, s.lng])

    let totalDistanceKm = 0
    const legs: OptimizedRoute['legs'] = []

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
            durationMin: Math.round((dist / 30) * 60), // assume 30 km/h avg
        })
    }

    return {
        orderedStops: stops,
        routeGeometry: geometry,
        totalDistanceKm: parseFloat(totalDistanceKm.toFixed(2)),
        totalDurationMin: legs.reduce((s, l) => s + l.durationMin, 0),
        legs,
    }
}

/** Haversine distance between two lat/lng points in kilometres */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371
    const dLat = toRad(lat2 - lat1)
    const dLng = toRad(lng2 - lng1)
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function toRad(deg: number): number {
    return deg * (Math.PI / 180)
}
