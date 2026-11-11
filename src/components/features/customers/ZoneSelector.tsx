'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Zone } from '@/types'
import { getZones } from '@/lib/services/zoneService'

interface ZoneSelectorProps {
    selectedZoneId?: number
    onSelectZone: (zoneId: number | undefined, zone: Zone | null) => void
    error?: string
}

export function ZoneSelector({ selectedZoneId, onSelectZone, error }: ZoneSelectorProps) {
    const [zones, setZones] = useState<Zone[]>([])
    const [selectedZone, setSelectedZone] = useState<Zone | null>(null)
    const [zoneSearch, setZoneSearch] = useState('')
    const [showDropdown, setShowDropdown] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        async function loadZones() {
            try {
                const data = await getZones()
                setZones(data)
            } catch (err) {
                console.error('Failed to load delivery zones:', err)
            }
        }
        loadZones()
    }, [])

    useEffect(() => {
        if (selectedZoneId && zones.length > 0) {
            const found = zones.find((z) => z.id === selectedZoneId) || null
            setSelectedZone(found)
            setZoneSearch(found ? found.zone_name : '')
        } else if (!selectedZoneId) {
            setSelectedZone(null)
            setZoneSearch('')
        }
    }, [selectedZoneId, zones])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowDropdown(false)
                setZoneSearch(selectedZone ? selectedZone.zone_name : '')
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [selectedZone])

    const filteredZones = zones.filter((z) =>
        z.zone_name.toLowerCase().includes(zoneSearch.toLowerCase())
    )

    return (
        <div className="space-y-2 relative" ref={containerRef}>
            <Label>Delivery Zone</Label>
            <Input
                placeholder="Search delivery zone..."
                value={zoneSearch}
                onChange={(e) => {
                    setZoneSearch(e.target.value)
                    setShowDropdown(true)
                    if (!e.target.value) {
                        setSelectedZone(null)
                        onSelectZone(undefined, null)
                    }
                }}
                onFocus={() => setShowDropdown(true)}
                className="w-full text-black dark:text-white"
            />
            {showDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-zinc-950 border border-input rounded-md shadow-md max-h-56 overflow-y-auto">
                    {filteredZones.length > 0 ? (
                        filteredZones.map((zone) => (
                            <div
                                key={zone.id}
                                className="px-3 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground text-sm text-black dark:text-white"
                                onClick={() => {
                                    setSelectedZone(zone)
                                    setZoneSearch(zone.zone_name)
                                    setShowDropdown(false)
                                    onSelectZone(zone.id, zone)
                                }}
                            >
                                <span className="font-medium">{zone.zone_name}</span>
                                {zone.description ? ` (${zone.description})` : ''}
                            </div>
                        ))
                    ) : (
                        <div className="px-3 py-2 text-sm text-muted-foreground">No zones found</div>
                    )}
                </div>
            )}
            {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
    )
}
