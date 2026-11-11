'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'

interface PosItemSearchBarProps {
    searchQuery: string
    onSearchChange: (val: string) => void
    onSearchSubmit: () => void
    inputRef?: React.RefObject<HTMLInputElement | null>
}

export function PosItemSearchBar({
    searchQuery,
    onSearchChange,
    onSearchSubmit,
    inputRef,
}: PosItemSearchBarProps) {
    return (
        <Card className="border-0 shadow-sm">
            <CardContent className="pt-4 pb-4">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            ref={inputRef}
                            placeholder="Search by name, barcode, or item number... (F2)"
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') onSearchSubmit()
                            }}
                            className="pl-9 h-11 bg-gray-50 border-gray-200 focus:border-purple-400 transition-all"
                        />
                    </div>
                    <Button
                        onClick={onSearchSubmit}
                        className="h-11 px-5 shrink-0 text-white font-semibold"
                        style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                    >
                        Search
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
