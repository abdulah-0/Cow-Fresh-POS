'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Plus, MapPin, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { useToast } from '@/components/ui/toast'
import { getTenantBySlug } from '@/lib/tenantUtils'
import {
    getStockLocations,
    createStockLocation,
    deleteStockLocation,
} from '@/lib/services/inventoryService'

export default function LocationsPage() {
    const params = useParams()
    const tenantSlug = params.tenant as string
    const [tenantId, setTenantId] = useState<string>('')
    const [locations, setLocations] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [newLocationName, setNewLocationName] = useState('')
    const [adding, setAdding] = useState(false)
    const { showToast } = useToast()

    useEffect(() => {
        async function loadTenant() {
            const tenant = await getTenantBySlug(tenantSlug)
            if (tenant) {
                setTenantId(tenant.id)
            }
        }
        loadTenant()
    }, [tenantSlug])

    useEffect(() => {
        if (tenantId) {
            loadLocations()
        }
    }, [tenantId])

    const loadLocations = async () => {
        setLoading(true)
        try {
            const data = await getStockLocations(tenantId)
            setLocations(data)
        } catch (error) {
            console.error('Error loading locations:', error)
            showToast('error', 'Failed to load locations')
        } finally {
            setLoading(false)
        }
    }

    const handleAddLocation = async () => {
        if (!newLocationName.trim()) return

        setAdding(true)
        try {
            await createStockLocation(tenantId, newLocationName.trim())
            showToast('success', 'Location created successfully')
            setNewLocationName('')
            loadLocations()
        } catch (error) {
            console.error('Error creating location:', error)
            showToast('error', 'Failed to create location')
        } finally {
            setAdding(false)
        }
    }

    const handleDeleteLocation = async (location: any) => {
        if (!confirm(`Delete location "${location.location_name}"?`)) return

        try {
            await deleteStockLocation(location.id)
            showToast('success', 'Location deleted successfully')
            loadLocations()
        } catch (error: any) {
            console.error('Error deleting location:', error)
            showToast('error', error.message || 'Failed to delete location')
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Stock Locations</h1>
                <p className="text-gray-500 mt-1">Manage warehouse and store locations</p>
            </div>

            {/* Add Location */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex gap-4">
                        <Input
                            placeholder="Enter location name (e.g., Main Warehouse, Store Front)"
                            value={newLocationName}
                            onChange={(e) => setNewLocationName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAddLocation()
                            }}
                        />
                        <Button onClick={handleAddLocation} disabled={adding || !newLocationName.trim()}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Location
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Locations Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Locations ({locations.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-12 text-gray-500">Loading locations...</div>
                    ) : locations.length === 0 ? (
                        <div className="text-center py-12">
                            <MapPin className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                            <p className="text-gray-500">No locations found</p>
                            <p className="text-sm text-gray-400 mt-1">Add your first location above</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Location Name</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {locations.map((location) => (
                                    <TableRow key={location.id}>
                                        <TableCell className="font-mono">{location.id}</TableCell>
                                        <TableCell className="font-medium">{location.location_name}</TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDeleteLocation(location)}
                                            >
                                                <Trash2 className="h-4 w-4 text-red-600" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
