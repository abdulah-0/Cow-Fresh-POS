'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Award, Plus, Edit, Trash2, Star } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'
import { getTenantBySlug } from '@/lib/tenantUtils'
import { getCustomerTiers, deleteCustomerTier } from '@/lib/services/loyaltyService'
import CustomerTierDialog from '@/components/features/loyalty/CustomerTierDialog'

export default function LoyaltyPage() {
    const params = useParams()
    const tenantSlug = params.tenant as string
    const [tenantId, setTenantId] = useState<string>('')
    const [tiers, setTiers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showTierDialog, setShowTierDialog] = useState(false)
    const [selectedTier, setSelectedTier] = useState<any>(null)
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
            loadTiers()
        }
    }, [tenantId])

    const loadTiers = async () => {
        setLoading(true)
        try {
            const data = await getCustomerTiers(tenantId)
            setTiers(data)
        } catch (error) {
            console.error('Error loading tiers:', error)
            showToast('error', 'Failed to load customer tiers')
        } finally {
            setLoading(false)
        }
    }

    const handleAddTier = () => {
        setSelectedTier(null)
        setShowTierDialog(true)
    }

    const handleEditTier = (tier: any) => {
        setSelectedTier(tier)
        setShowTierDialog(true)
    }

    const handleDeleteTier = async (tier: any) => {
        if (!confirm(`Delete tier "${tier.name}"?`)) {
            return
        }

        try {
            await deleteCustomerTier(tier.id)
            showToast('success', 'Tier deleted successfully')
            loadTiers()
        } catch (error) {
            console.error('Error deleting tier:', error)
            showToast('error', 'Failed to delete tier')
        }
    }

    const handleTierSaved = () => {
        setShowTierDialog(false)
        setSelectedTier(null)
        loadTiers()
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Loyalty Program</h1>
                    <p className="text-gray-500 mt-1">Manage customer tiers and loyalty rewards</p>
                </div>
                <Button onClick={handleAddTier} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Tier
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Tiers</CardTitle>
                        <Award className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{tiers.length}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Points System</CardTitle>
                        <Star className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Active</div>
                        <p className="text-xs text-muted-foreground">$1 = 1 point</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Point Value</CardTitle>
                        <Star className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">$0.01</div>
                        <p className="text-xs text-muted-foreground">per point</p>
                    </CardContent>
                </Card>
            </div>

            {/* Customer Tiers */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        Customer Tiers
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-12 text-gray-500">Loading tiers...</div>
                    ) : tiers.length === 0 ? (
                        <div className="text-center py-12">
                            <Award className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                            <p className="text-gray-500">No customer tiers yet</p>
                            <p className="text-sm text-gray-400 mt-1">
                                Create your first tier to start rewarding loyal customers
                            </p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tier Name</TableHead>
                                    <TableHead>Min Points</TableHead>
                                    <TableHead>Discount</TableHead>
                                    <TableHead>Color</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tiers.map((tier) => (
                                    <TableRow key={tier.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <Award className="h-4 w-4" style={{ color: tier.color }} />
                                                {tier.name}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{tier.min_points} pts</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className="bg-green-600">{tier.discount_percent}%</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-6 h-6 rounded-full border"
                                                    style={{ backgroundColor: tier.color }}
                                                />
                                                <span className="text-sm font-mono">{tier.color}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEditTier(tier)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDeleteTier(tier)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-600" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* How It Works */}
            <Card>
                <CardHeader>
                    <CardTitle>How Loyalty Points Work</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <h3 className="font-medium">Earning Points</h3>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>• Customers earn 1 point per $1 spent</li>
                                <li>• Points are added automatically after each sale</li>
                                <li>• Manual adjustments can be made by staff</li>
                            </ul>
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-medium">Redeeming Points</h3>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>• Each point is worth $0.01</li>
                                <li>• Points can be redeemed during checkout</li>
                                <li>• Minimum redemption: 100 points ($1.00)</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <CustomerTierDialog
                open={showTierDialog}
                onOpenChange={setShowTierDialog}
                tier={selectedTier}
                tenantId={tenantId}
                onSaved={handleTierSaved}
            />
        </div>
    )
}
