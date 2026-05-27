'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
    Milk, Plus, Edit, History, BarChart3, Save, Loader2,
    Droplets, Trash2, Calendar, ChevronLeft, ChevronRight, Info, AlertTriangle, Check
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/toast'
import {
    getPackingHistory,
    getPackingEntryByDate,
    createPackingEntry,
    PackingInput,
    PackingProductInput
} from '@/lib/services/packingService'
import { getMilkInventoryByDate } from '@/lib/services/milkInventoryService'
import { getItems } from '@/lib/services/itemsService'
import ClientRoleGuard from '@/components/providers/ClientRoleGuard'

function toLocalDate(d: Date) {
    return d.toISOString().split('T')[0]
}

// Extensible conversion factor mapper
function getConversionFactor(name: string, unitType: string): number {
    const lowercaseName = name.toLowerCase()
    
    // Explicit ML conversions
    if (lowercaseName.includes('500 ml') || lowercaseName.includes('500ml')) {
        return 0.5
    }
    if (lowercaseName.includes('250 ml') || lowercaseName.includes('250ml')) {
        return 0.25
    }
    if (lowercaseName.includes('750 ml') || lowercaseName.includes('750ml')) {
        return 0.75
    }
    
    // Explicit Liter conversions
    if (lowercaseName.includes('1.5 l') || lowercaseName.includes('1.5l') || lowercaseName.includes('1.5 liter')) {
        return 1.5
    }
    if (lowercaseName.includes('2 l') || lowercaseName.includes('2l') || lowercaseName.includes('2 liter')) {
        return 2.0
    }
    if (lowercaseName.includes('5 l') || lowercaseName.includes('5l') || lowercaseName.includes('5 liter')) {
        return 5.0
    }
    
    // Default by unit type
    if (unitType === 'liter' || unitType === 'kg') {
        return 1.0
    }
    
    return 1.0
}

export default function PackingPage() {
    const today = toLocalDate(new Date())
    const [activeTab, setActiveTab] = useState('dashboard')
    const [selectedDate, setSelectedDate] = useState(today)
    
    // Data states
    const [history, setHistory] = useState<any[]>([])
    const [allItems, setAllItems] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingEntry, setLoadingEntry] = useState(false)
    const [saving, setSaving] = useState(false)
    
    // Form states
    const [receivedInput, setReceivedInput] = useState('')
    const [selectedProducts, setSelectedProducts] = useState<any[]>([]) // array of { item, quantity, factor }
    const [existingEntryId, setExistingEntryId] = useState<string | null>(null)
    const [searchItemQuery, setSearchItemQuery] = useState('')
    const [showAddItemSelector, setShowAddItemSelector] = useState(false)
    
    const { showToast } = useToast()
    
    // Load historical packing entries and inventory items
    const loadCoreData = useCallback(async () => {
        setLoading(true)
        try {
            const [hist, itemsData] = await Promise.all([
                getPackingHistory(),
                getItems({ paginated: false }) // fetch all items
            ])
            setHistory(hist)
            setAllItems(itemsData || [])
        } catch (error) {
            console.error('Failed to load packing data:', error)
            showToast('error', 'Failed to load packing history')
        } finally {
            setLoading(false)
        }
    }, [showToast])
    
    useEffect(() => {
        loadCoreData()
    }, [loadCoreData])
    
    // Fetch or prefill entry when selectedDate changes
    const loadEntryForDate = useCallback(async (date: string) => {
        setLoadingEntry(true)
        try {
            // 1. Fetch packing entry if it already exists
            const packingEntry = await getPackingEntryByDate(date)
            // 2. Fetch today's milk inventory (to see total received raw milk)
            const milkInv = await getMilkInventoryByDate(date)
            
            if (packingEntry) {
                setExistingEntryId(packingEntry.id)
                setReceivedInput(String(packingEntry.total_milk_received || ''))
                
                // Map existing products
                const mappedProducts = packingEntry.products.map((p: any) => {
                    const matchedItem = allItems.find(i => i.id === p.product_id) || p.product
                    return {
                        item: matchedItem,
                        quantity: p.quantity_produced,
                        factor: getConversionFactor(matchedItem?.name || '', matchedItem?.unit_type || '')
                    }
                })
                setSelectedProducts(mappedProducts)
            } else {
                setExistingEntryId(null)
                // Prefill raw milk received from milk inventory today if available
                setReceivedInput(milkInv ? String(milkInv.total_received) : '')
                setSelectedProducts([])
            }
        } catch (error) {
            console.error('Error fetching entry for date:', error)
            showToast('error', 'Failed to load packing entry details')
        } finally {
            setLoadingEntry(false)
        }
    }, [allItems, showToast])
    
    // Reload date entry when date changes or allItems finishes loading
    useEffect(() => {
        if (allItems.length > 0) {
            loadEntryForDate(selectedDate)
        }
    }, [selectedDate, allItems, loadEntryForDate])
    
    // Add product to entry
    const addProductToEntry = (item: any) => {
        const alreadyExists = selectedProducts.find(p => p.item.id === item.id)
        if (alreadyExists) {
            showToast('warning', `"${item.name}" is already added to the list`)
            return
        }
        
        const factor = getConversionFactor(item.name, item.unit_type)
        setSelectedProducts(prev => [
            ...prev,
            { item, quantity: 1, factor }
        ])
        setShowAddItemSelector(false)
        setSearchItemQuery('')
        showToast('success', `Added "${item.name}"`)
    }
    
    // Remove product from entry
    const removeProductFromEntry = (itemId: number) => {
        setSelectedProducts(prev => prev.filter(p => p.item.id !== itemId))
    }
    
    // Update quantity of a product in entry
    const updateProductQuantity = (itemId: number, qty: number) => {
        setSelectedProducts(prev => prev.map(p => {
            if (p.item.id === itemId) {
                return { ...p, quantity: Math.max(0, qty) }
            }
            return p
        }))
    }
    
    // Live calculations
    const rawReceived = parseFloat(receivedInput) || 0
    const totalMilkUsed = selectedProducts.reduce((sum, p) => sum + (p.quantity * p.factor), 0)
    const remainingMilk = rawReceived - totalMilkUsed
    
    // Handle Save Daily Entry
    const handleSaveEntry = async () => {
        if (isNaN(rawReceived) || rawReceived <= 0) {
            return showToast('error', 'Total milk received must be a positive number')
        }
        
        setSaving(true)
        try {
            const productsInput: PackingProductInput[] = selectedProducts.map(p => ({
                product_id: p.item.id,
                quantity_produced: p.quantity
            }))
            
            const packingInput: PackingInput = {
                date: selectedDate,
                total_milk_received: rawReceived,
                total_milk_used: totalMilkUsed,
                remaining_milk: remainingMilk,
                products: productsInput
            }
            
            await createPackingEntry(packingInput)
            showToast('success', `Packing entry for ${selectedDate} saved successfully!`)
            
            // Refresh history and dashboard numbers
            await loadCoreData()
            setActiveTab('dashboard')
        } catch (error) {
            console.error('Error saving packing entry:', error)
            showToast('error', 'Failed to save daily packing entry')
        } finally {
            setSaving(false)
        }
    }
    
    const handleDateShift = (days: number) => {
        const d = new Date(selectedDate)
        d.setDate(d.getDate() + days)
        setSelectedDate(toLocalDate(d))
    }
    
    // Filter items based on search query
    const filteredItemsForAdd = allItems.filter(item => 
        item.name.toLowerCase().includes(searchItemQuery.toLowerCase()) ||
        (item.category || '').toLowerCase().includes(searchItemQuery.toLowerCase())
    )
    
    // Summary metrics for Dashboard Tab
    const latestPackingRecord = history.length > 0 ? history[0] : null
    const totalMilkReceivedAllTime = history.reduce((s, h) => s + parseFloat(h.total_milk_received || 0), 0)
    const totalMilkUsedAllTime = history.reduce((s, h) => s + parseFloat(h.total_milk_used || 0), 0)
    const averageEfficiency = totalMilkReceivedAllTime > 0 
        ? Math.round((totalMilkUsedAllTime / totalMilkReceivedAllTime) * 100) 
        : 0
        
    return (
        <ClientRoleGuard routeSegment="milk-inventory">
            <div className="space-y-6">
                {/* Main Premium Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
                                <Milk className="h-5 w-5 text-white" />
                            </div>
                            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Packing Module</h1>
                        </div>
                        <p className="text-gray-500 mt-1 text-sm sm:text-base">
                            Convert raw milk supplies into packaged dairy retail inventory with automatic stock reconciliation.
                        </p>
                    </div>
                    <Button 
                        onClick={() => {
                            setSelectedDate(today)
                            setActiveTab('create')
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all rounded-xl self-start sm:self-center"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Log Today&apos;s Packing
                    </Button>
                </div>
                
                {/* Styled Navigation Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-6 bg-gray-100 p-1 rounded-xl">
                        <TabsTrigger value="dashboard" className="rounded-lg py-2 flex items-center justify-center gap-2">
                            <BarChart3 className="h-4 w-4" />
                            Dashboard
                        </TabsTrigger>
                        <TabsTrigger value="create" className="rounded-lg py-2 flex items-center justify-center gap-2">
                            <Edit className="h-4 w-4" />
                            Create Daily Entry
                        </TabsTrigger>
                        <TabsTrigger value="history" className="rounded-lg py-2 flex items-center justify-center gap-2">
                            <History className="h-4 w-4" />
                            Packing History
                        </TabsTrigger>
                    </TabsList>
                    
                    {/* TABS 1: DASHBOARD */}
                    <TabsContent value="dashboard">
                        {loading ? (
                            <div className="py-20 text-center">
                                <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mx-auto mb-4" />
                                <p className="text-gray-500">Loading packing dashboard analytics...</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Visual KPI Summary Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Received Card */}
                                    <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
                                        <CardHeader className="flex flex-row items-center justify-between pb-2 pt-5">
                                            <CardTitle className="text-sm font-medium text-gray-500">Total Milk Processed</CardTitle>
                                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-sm">
                                                <Droplets className="h-4 w-4 text-white" />
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pb-5">
                                            <div className="text-3xl font-extrabold text-gray-900">{totalMilkReceivedAllTime.toFixed(1)} <span className="text-sm font-semibold text-gray-400">L</span></div>
                                            <p className="mt-1 text-xs text-gray-400">Total bulk raw milk supply processed</p>
                                        </CardContent>
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-600" />
                                    </Card>
                                    
                                    {/* Used Card */}
                                    <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
                                        <CardHeader className="flex flex-row items-center justify-between pb-2 pt-5">
                                            <CardTitle className="text-sm font-medium text-gray-500">Used in Retail Packing</CardTitle>
                                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-sm">
                                                <Milk className="h-4 w-4 text-white" />
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pb-5">
                                            <div className="text-3xl font-extrabold text-gray-900">{totalMilkUsedAllTime.toFixed(1)} <span className="text-sm font-semibold text-gray-400">L</span></div>
                                            <p className="mt-1 text-xs text-gray-400">Conversions efficiency: <span className="font-bold text-indigo-600">{averageEfficiency}%</span></p>
                                        </CardContent>
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-600" />
                                    </Card>
                                    
                                    {/* Remaining Card */}
                                    <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
                                        <CardHeader className="flex flex-row items-center justify-between pb-2 pt-5">
                                            <CardTitle className="text-sm font-medium text-gray-500">Leftover Unpackaged Raw Milk</CardTitle>
                                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm">
                                                <Info className="h-4 w-4 text-white" />
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pb-5">
                                            <div className="text-3xl font-extrabold text-gray-900">{(totalMilkReceivedAllTime - totalMilkUsedAllTime).toFixed(1)} <span className="text-sm font-semibold text-gray-400">L</span></div>
                                            <p className="mt-1 text-xs text-gray-400">Kept in bulk for POS register & dispatches</p>
                                        </CardContent>
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-600" />
                                    </Card>
                                </div>
                                
                                {/* Latest Packing Log detail */}
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                    <Card className="lg:col-span-8 border-0 shadow-sm">
                                        <CardHeader>
                                            <CardTitle className="text-lg font-bold text-gray-900">Latest Operations Log</CardTitle>
                                            <CardDescription>Details of the most recent conversion entry</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            {latestPackingRecord ? (
                                                <div className="space-y-6">
                                                    <div className="flex items-center justify-between bg-indigo-50/50 border border-indigo-100/50 rounded-xl p-4">
                                                        <div>
                                                            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">LOG DATE</p>
                                                            <p className="text-lg font-bold text-indigo-900 mt-0.5">{latestPackingRecord.date}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">REMAINING MILK</p>
                                                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 mt-1">
                                                                {parseFloat(latestPackingRecord.remaining_milk).toFixed(1)} L Remaining
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                    
                                                    <div>
                                                        <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Products Packaged</h4>
                                                        <div className="divide-y divide-gray-100 rounded-xl border border-gray-100 overflow-hidden">
                                                            {latestPackingRecord.products && latestPackingRecord.products.length > 0 ? (
                                                                latestPackingRecord.products.map((p: any, idx: number) => {
                                                                    const factor = getConversionFactor(p.product?.name || '', p.product?.unit_type || '')
                                                                    return (
                                                                        <div key={idx} className="flex justify-between items-center p-3.5 hover:bg-gray-50/50 transition-colors">
                                                                            <div>
                                                                                <p className="text-sm font-semibold text-gray-900">{p.product?.name || `Product ID: ${p.product_id}`}</p>
                                                                                <p className="text-xs text-gray-400 mt-0.5">Factor: {factor} L per unit</p>
                                                                            </div>
                                                                            <div className="text-right">
                                                                                <span className="text-sm font-extrabold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                                                                                    {p.quantity_produced} Units
                                                                                </span>
                                                                                <p className="text-[10px] text-gray-400 mt-1">{(p.quantity_produced * factor).toFixed(1)} L consumed</p>
                                                                            </div>
                                                                        </div>
                                                                    )
                                                                })
                                                            ) : (
                                                                <p className="text-center py-6 text-sm text-gray-400">No packaged products logged in this entry.</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-center py-16 text-gray-400">
                                                    <Milk className="mx-auto h-12 w-12 text-gray-200 mb-3" />
                                                    <p className="text-sm">No packing operations completed yet.</p>
                                                    <Button 
                                                        variant="link" 
                                                        onClick={() => setActiveTab('create')}
                                                        className="text-indigo-600 font-semibold text-xs mt-2"
                                                    >
                                                        Create a daily packing log now
                                                    </Button>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                    
                                    <Card className="lg:col-span-4 border-0 shadow-sm">
                                        <CardHeader>
                                            <CardTitle className="text-lg font-bold text-gray-900">Conversion Factors</CardTitle>
                                            <CardDescription>Standard raw milk to packed product conversion weights</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="rounded-xl border border-blue-100 bg-blue-50/30 p-4 space-y-3">
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="font-semibold text-gray-700">Milk 1 KG / Litre</span>
                                                    <span className="text-blue-700 font-bold bg-blue-100/80 px-2 py-0.5 rounded-full text-xs">1.0 L</span>
                                                </div>
                                                <div className="flex justify-between items-center text-sm border-t border-blue-100/50 pt-2">
                                                    <span className="font-semibold text-gray-700">Milk 500 ML</span>
                                                    <span className="text-blue-700 font-bold bg-blue-100/80 px-2 py-0.5 rounded-full text-xs">0.5 L</span>
                                                </div>
                                                <div className="flex justify-between items-center text-sm border-t border-blue-100/50 pt-2">
                                                    <span className="font-semibold text-gray-700">Yogurt 1 KG</span>
                                                    <span className="text-blue-700 font-bold bg-blue-100/80 px-2 py-0.5 rounded-full text-xs">1.0 L</span>
                                                </div>
                                                <div className="flex justify-between items-center text-sm border-t border-blue-100/50 pt-2">
                                                    <span className="font-semibold text-gray-700">Milk 250 ML</span>
                                                    <span className="text-blue-700 font-bold bg-blue-100/80 px-2 py-0.5 rounded-full text-xs">0.25 L</span>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-start gap-2 bg-gray-50 border border-gray-100 rounded-xl p-3 text-xs text-gray-500">
                                                <Info className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                                <p>
                                                    The system auto-calculates milk usage by checking the product item name or its specified unit type (Liters/KG).
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        )}
                    </TabsContent>
                    
                    {/* TABS 2: CREATE DAILY ENTRY */}
                    <TabsContent value="create">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            
                            {/* Product selection and conversion form */}
                            <div className="lg:col-span-8 space-y-6">
                                <Card className="border-0 shadow-sm">
                                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                                        <div>
                                            <CardTitle className="text-lg font-bold">Daily Production Details</CardTitle>
                                            <CardDescription>Select items and enter packed quantities for {selectedDate}</CardDescription>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button variant="outline" size="sm" onClick={() => handleDateShift(-1)} className="rounded-lg h-8 w-8 p-0">
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>
                                            <Input 
                                                type="date" 
                                                value={selectedDate} 
                                                onChange={e => setSelectedDate(e.target.value)} 
                                                className="h-8 w-36 text-xs rounded-lg"
                                            />
                                            <Button variant="outline" size="sm" onClick={() => handleDateShift(1)} disabled={selectedDate >= today} className="rounded-lg h-8 w-8 p-0">
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        
                                        {/* Received Supply Input */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                                            <div>
                                                <Label htmlFor="received-milk-input" className="text-gray-700 font-semibold text-sm">Total Received Milk (Liters) *</Label>
                                                <Input 
                                                    id="received-milk-input"
                                                    type="number" 
                                                    min="0"
                                                    step="0.1"
                                                    value={receivedInput}
                                                    onChange={e => setReceivedInput(e.target.value)}
                                                    placeholder="e.g. 500"
                                                    className="mt-1 bg-white"
                                                />
                                                <span className="text-[10px] text-gray-400 mt-1 block"> Prefilled automatically from daily milk intake logs.</span>
                                            </div>
                                            
                                            <div className="flex flex-col justify-end">
                                                {loadingEntry ? (
                                                    <div className="text-xs text-gray-400 flex items-center gap-1.5"><Loader2 className="h-3 w-3 animate-spin" />Checking existing date log...</div>
                                                ) : existingEntryId ? (
                                                    <Badge className="bg-amber-100 text-amber-800 border-amber-200 self-start py-1 px-3.5 mb-1.5 text-xs font-semibold rounded-lg">
                                                        <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                                                        Editing Existing Record
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-green-100 text-green-800 border-green-200 self-start py-1 px-3.5 mb-1.5 text-xs font-semibold rounded-lg">
                                                        <Check className="h-3.5 w-3.5 mr-1" />
                                                        New Entry Log
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {/* Added Packed Products table list */}
                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Packaged Products</h4>
                                                
                                                {/* Add Item search/dropdown trigger */}
                                                <div className="relative">
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm"
                                                        onClick={() => setShowAddItemSelector(!showAddItemSelector)}
                                                        className="text-xs rounded-lg text-indigo-600 border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50"
                                                    >
                                                        <Plus className="h-3.5 w-3.5 mr-1" /> Add Product Item
                                                    </Button>
                                                    
                                                    {/* Floating searchable item selection */}
                                                    {showAddItemSelector && (
                                                        <Card className="absolute right-0 mt-2 w-80 z-20 shadow-xl border-gray-200 rounded-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                                                            <div className="p-3 border-b border-gray-100">
                                                                <Input 
                                                                    placeholder="Search item name..."
                                                                    value={searchItemQuery}
                                                                    onChange={e => setSearchItemQuery(e.target.value)}
                                                                    className="h-8 text-xs"
                                                                    autoFocus
                                                                />
                                                            </div>
                                                            <div className="max-h-60 overflow-y-auto divide-y divide-gray-50">
                                                                {filteredItemsForAdd.length > 0 ? (
                                                                    filteredItemsForAdd.map(item => (
                                                                        <button
                                                                            key={item.id}
                                                                            onClick={() => addProductToEntry(item)}
                                                                            className="w-full text-left p-2.5 text-xs hover:bg-indigo-50 hover:text-indigo-950 flex justify-between items-center transition-colors"
                                                                        >
                                                                            <div>
                                                                                <p className="font-semibold text-gray-800">{item.name}</p>
                                                                                <p className="text-[10px] text-gray-400 mt-0.5">{item.category || 'No Category'} • Unit: {item.unit_type}</p>
                                                                            </div>
                                                                            <Badge variant="outline" className="text-[10px]">Add</Badge>
                                                                        </button>
                                                                    ))
                                                                ) : (
                                                                    <p className="p-4 text-center text-xs text-gray-400">No items matched search</p>
                                                                )}
                                                            </div>
                                                        </Card>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {/* Selection List */}
                                            {selectedProducts.length === 0 ? (
                                                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 bg-gray-50/50">
                                                    <Milk className="mx-auto h-9 w-9 text-gray-300 mb-2" />
                                                    <p className="text-sm font-medium">No packaged products added yet.</p>
                                                    <p className="text-xs text-gray-400 mt-0.5">Click &quot;Add Product Item&quot; to begin building today&apos;s packing inventory.</p>
                                                </div>
                                            ) : (
                                                <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                                                    <Table>
                                                        <TableHeader className="bg-gray-50/50">
                                                            <TableRow>
                                                                <TableHead>Product Name</TableHead>
                                                                <TableHead>Factor (L/KG)</TableHead>
                                                                <TableHead className="w-36">Packets Produced</TableHead>
                                                                <TableHead className="text-right">Milk Consumed</TableHead>
                                                                <TableHead className="w-12"></TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {selectedProducts.map((p, idx) => (
                                                                <TableRow key={idx}>
                                                                    <TableCell>
                                                                        <span className="font-bold text-gray-800">{p.item.name}</span>
                                                                        <span className="text-[10px] text-gray-400 block mt-0.5">Category: {p.item.category || 'Dairy'}</span>
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <span className="font-mono text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                                                                            {p.factor.toFixed(2)} L
                                                                        </span>
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <Input 
                                                                            type="number"
                                                                            min="0"
                                                                            value={p.quantity}
                                                                            onChange={e => updateProductQuantity(p.item.id, parseInt(e.target.value) || 0)}
                                                                            className="h-8 text-sm"
                                                                        />
                                                                    </TableCell>
                                                                    <TableCell className="text-right font-mono font-bold text-indigo-600">
                                                                        {(p.quantity * p.factor).toFixed(1)} L
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <Button 
                                                                            variant="ghost" 
                                                                            size="sm"
                                                                            onClick={() => removeProductFromEntry(p.item.id)}
                                                                            className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg h-8 w-8 p-0"
                                                                        >
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </Button>
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            )}
                                        </div>
                                        
                                    </CardContent>
                                </Card>
                            </div>
                            
                            {/* Right summary and live math reconciliation card */}
                            <div className="lg:col-span-4 space-y-6">
                                <Card className="border-0 shadow-sm relative overflow-hidden bg-gradient-to-b from-white to-gray-50">
                                    <CardHeader>
                                        <CardTitle className="text-base font-bold text-gray-900">Packing Summary & Balance</CardTitle>
                                        <CardDescription>Live real-time mathematical calculations</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4 pt-2">
                                        <div className="rounded-xl bg-white border border-gray-150 p-4 space-y-3.5 shadow-sm">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500 font-semibold">Total Received Milk</span>
                                                <span className="font-bold text-gray-800">{rawReceived.toFixed(1)} L</span>
                                            </div>
                                            <div className="flex justify-between text-sm border-t border-gray-100 pt-2.5">
                                                <span className="text-gray-500 font-semibold">Total Used in Packing</span>
                                                <span className="font-bold text-red-600">- {totalMilkUsed.toFixed(1)} L</span>
                                            </div>
                                            <div className="flex justify-between text-base border-t border-gray-200 pt-3.5 font-extrabold">
                                                <span className="text-gray-900">Remaining Raw Milk</span>
                                                <span className={remainingMilk >= 0 ? 'text-indigo-600' : 'text-red-600'}>
                                                    {remainingMilk.toFixed(1)} L
                                                </span>
                                            </div>
                                        </div>
                                        
                                        {/* Warning or Success Message */}
                                        {remainingMilk < 0 ? (
                                            <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 flex items-start gap-2.5 text-xs text-red-700 animate-pulse">
                                                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                                <div>
                                                    <p className="font-bold">Insufficient Raw Milk Supply!</p>
                                                    <p className="mt-0.5 text-red-600/95">Packaged milk consumed exceeds total received raw milk supply. Verify entered numbers.</p>
                                                </div>
                                            </div>
                                        ) : selectedProducts.length > 0 ? (
                                            <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3.5 flex items-start gap-2.5 text-xs text-indigo-700">
                                                <Info className="h-4 w-4 mt-0.5 flex-shrink-0 text-indigo-400" />
                                                <div>
                                                    <p className="font-semibold">Reconciliation Ready</p>
                                                    <p className="mt-0.5 text-indigo-600/95">
                                                        Saving will automatically adjust inventory at **Main Store (location_id: 1)** and recalculate daily stock differences.
                                                    </p>
                                                </div>
                                            </div>
                                        ) : null}
                                        
                                        <Button 
                                            onClick={handleSaveEntry} 
                                            disabled={saving || loadingEntry || isNaN(rawReceived) || rawReceived <= 0}
                                            className="w-full bg-indigo-600 hover:bg-indigo-700 py-6 text-sm font-semibold rounded-xl mt-4 shadow-sm"
                                        >
                                            {saving ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                    Reconciling & Syncing Stock...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="h-4 w-4 mr-2" />
                                                    Save Daily Packing Entry
                                                </>
                                            )}
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>
                            
                        </div>
                    </TabsContent>
                    
                    {/* TABS 3: PACKING HISTORY LOGS */}
                    <TabsContent value="history">
                        <Card className="border-0 shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg font-bold text-gray-900">Operations History logs</CardTitle>
                                <CardDescription>All previous daily bulk to retail conversion entries</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                {loading ? (
                                    <div className="py-20 text-center text-gray-400">
                                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-600 mb-3" />
                                        <p>Fetching operation logs...</p>
                                    </div>
                                ) : history.length === 0 ? (
                                    <div className="text-center py-20 text-gray-400">
                                        <History className="mx-auto h-12 w-12 text-gray-200 mb-3" />
                                        <p className="text-sm">No historical packing logs recorded.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader className="bg-gray-50/50">
                                                <TableRow>
                                                    <TableHead className="pl-6">Log Date</TableHead>
                                                    <TableHead className="text-right">Bulk Intake</TableHead>
                                                    <TableHead className="text-right">Packed Volume</TableHead>
                                                    <TableHead className="text-right">Leftover Raw</TableHead>
                                                    <TableHead>Efficiency</TableHead>
                                                    <TableHead className="w-24 pr-6"></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {history.map((record) => {
                                                    const received = parseFloat(record.total_milk_received || 0)
                                                    const used = parseFloat(record.total_milk_used || 0)
                                                    const remaining = parseFloat(record.remaining_milk || 0)
                                                    const efficiency = received > 0 ? Math.round((used / received) * 100) : 0
                                                    
                                                    return (
                                                        <TableRow key={record.id} className="hover:bg-gray-50/50 transition-colors">
                                                            <TableCell className="pl-6 font-semibold text-gray-900">
                                                                <div className="flex items-center gap-2">
                                                                    <Calendar className="h-4 w-4 text-gray-400" />
                                                                    {record.date}
                                                                    {record.date === today && (
                                                                        <Badge className="bg-green-100 text-green-700 text-[10px] py-0 px-2 border-green-200">
                                                                            Today
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-right font-mono font-medium text-gray-700">{received.toFixed(1)} L</TableCell>
                                                            <TableCell className="text-right font-mono font-semibold text-indigo-600">{used.toFixed(1)} L</TableCell>
                                                            <TableCell className="text-right font-mono font-medium">
                                                                <span className={remaining >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                                                                    {remaining.toFixed(1)} L
                                                                </span>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="h-1.5 w-16 bg-gray-100 rounded-full overflow-hidden">
                                                                        <div 
                                                                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" 
                                                                            style={{ width: `${Math.min(efficiency, 100)}%` }} 
                                                                        />
                                                                    </div>
                                                                    <span className="text-xs text-gray-500 font-semibold">{efficiency}%</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="pr-6 text-right">
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        setSelectedDate(record.date)
                                                                        setActiveTab('create')
                                                                    }}
                                                                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 rounded-lg hover:bg-indigo-50/80"
                                                                >
                                                                    <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    )
                                                })}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                    
                </Tabs>
            </div>
        </ClientRoleGuard>
    )
}
