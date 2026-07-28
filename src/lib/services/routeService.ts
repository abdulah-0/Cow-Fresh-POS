/**
 * routeService.ts
 * Client wrapper that calls server-side Next.js API endpoints (/api/geocoding/resolve and /api/routes/optimize).
 * Eliminates direct browser calls to Nominatim/ORS and protects API keys.
 */

export interface Coordinate {
    lat: number
    lng: number
}

export interface RouteStop {
    id: number | string
    name: string
    lat: number
    lng: number
    address?: string
    phone?: string
    type?: 'depot' | 'customer'
}

export interface OptimizedRoute {
    fallback: boolean
    reason?: string
    orderedStops: RouteStop[]
    routeGeometry: [number, number][] // [lat, lng] pairs for Leaflet polyline
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
 * Geocode an address string or customerId using the server-side geocoding endpoint.
 */
export async function geocodeAddress(address: string, customerId?: number): Promise<Coordinate | null> {
    try {
        const res = await fetch('/api/geocoding/resolve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address, customerId }),
        })

        if (!res.ok) return null
        const data = await res.json()
        if (data.lat != null && data.lng != null) {
            return { lat: data.lat, lng: data.lng }
        }
        return null
    } catch (err) {
        console.error('Client geocoding error:', err)
        return null
    }
}

/**
 * Reverse-geocode coordinates to an address string using Nominatim server-side fallback or coordinate string.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
}

/**
 * Calculate an optimized delivery route by calling POST /api/routes/optimize
 */
export async function calculateOptimizedRoute(stops: RouteStop[]): Promise<OptimizedRoute | null> {
    if (!stops || stops.length < 2) return null

    try {
        const res = await fetch('/api/routes/optimize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stops }),
        })

        if (!res.ok) {
            console.error('Route optimization API returned status:', res.status)
            return null
        }

        const data: OptimizedRoute = await res.json()
        return data
    } catch (err) {
        console.error('Route calculation error:', err)
        return null
    }
}
