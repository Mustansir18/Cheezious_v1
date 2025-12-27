
"use client";

import { useState, useMemo } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useSettings } from "@/context/SettingsContext";
import { useCart } from "@/context/CartContext";
import { useOrders } from "@/context/OrderContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { OrderStatus } from "@/lib/types";

const ACTIVE_STATUSES: OrderStatus[] = ['Pending', 'Preparing', 'Ready'];

export default function TableSelectionPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const branchId = params.branchId as string;
    const dealId = searchParams.get('dealId');

    const { settings, isLoading } = useSettings();
    const { setOrderDetails } = useCart();
    const router = useRouter();

    const [selectedFloorId, setSelectedFloorId] = useState<string>("");
    const [selectedTableId, setSelectedTableId] = useState<string>("");
    
    const availableTables = settings.tables.filter(table => table.floorId === selectedFloorId);
    
    const occupiedTableIds = useMemo(() => {
        return new Set(settings.occupiedTableIds);
    }, [settings.occupiedTableIds]);


    const handleProceedToMenu = () => {
        if (selectedFloorId && selectedTableId) {
            // This is the critical fix: update the context *before* navigating.
            setOrderDetails({
                branchId: branchId,
                orderType: 'Dine-In',
            });
            const menuUrl = `/branch/${branchId}/menu?mode=Dine-In&floorId=${selectedFloorId}&tableId=${selectedTableId}${dealId ? `&dealId=${dealId}` : ''}`;
            router.push(menuUrl);
        }
    };
    
    if (isLoading) {
        return <div>Loading settings...</div>
    }

    return (
        <div className="container mx-auto flex flex-col items-center justify-center px-4 py-12">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="font-headline text-center text-2xl">Select Your Table</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-2">
                        <Label htmlFor="floor-select">Floor</Label>
                        <Select value={selectedFloorId} onValueChange={setSelectedFloorId}>
                            <SelectTrigger id="floor-select">
                                <SelectValue placeholder="Select a floor" />
                            </SelectTrigger>
                            <SelectContent>
                                {settings.floors.map(floor => (
                                    <SelectItem key={floor.id} value={floor.id}>
                                        {floor.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="table-select">Table</Label>
                        <Select value={selectedTableId} onValueChange={setSelectedTableId} disabled={!selectedFloorId}>
                            <SelectTrigger id="table-select">
                                <SelectValue placeholder="Select a table" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableTables.map(table => (
                                    <SelectItem 
                                        key={table.id} 
                                        value={table.id}
                                        disabled={occupiedTableIds.has(table.id)}
                                    >
                                        {table.name} {occupiedTableIds.has(table.id) && '(Occupied)'}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button 
                        className="w-full" 
                        size="lg"
                        disabled={!selectedFloorId || !selectedTableId}
                        onClick={handleProceedToMenu}
                    >
                        Proceed to Menu
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
