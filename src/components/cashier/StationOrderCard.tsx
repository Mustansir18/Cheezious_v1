

'use client';

import type { Order, OrderItem } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { Utensils, ShoppingBag, Check } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { useState, useMemo } from 'react';


interface StationOrderCardProps {
    order: Order;
    stationItems: OrderItem[];
    onItemsPrepared: (orderId: string, itemIds: string[]) => void;
}

interface AggregatedStationItem {
    id: string; // Unique ID for the aggregated group
    name: string;
    totalQuantity: number;
    addons: { name: string; price: number; quantity: number }[];
    instructions?: string;
    componentItemIds: string[]; // IDs of the original OrderItem objects
}

export default function StationOrderCard({ order, stationItems, onItemsPrepared }: StationOrderCardProps) {
    const { settings } = useSettings();
    const table = settings.tables.find(t => t.id === order.tableId);
    const [selectedAggregatedIds, setSelectedAggregatedIds] = useState<string[]>([]);
    
    const aggregatedItems = useMemo(() => {
        const itemMap = new Map<string, AggregatedStationItem>();

        stationItems.forEach(item => {
            // Create a unique key based on the item, its variant, addons, and instructions
            const addonsKey = (item.selectedAddons || []).map(a => `${a.name}:${a.quantity}`).sort().join(',');
            const variantKey = item.selectedVariant ? item.selectedVariant.name : 'no-variant';
            const instructionsKey = item.instructions || 'no-instructions';
            const aggregationKey = `${item.menuItemId}-${variantKey}-${addonsKey}-${instructionsKey}`;

            if (itemMap.has(aggregationKey)) {
                const existing = itemMap.get(aggregationKey)!;
                existing.totalQuantity += item.quantity;
                existing.componentItemIds.push(item.id);
            } else {
                const itemNameWithVariant = item.selectedVariant
                    ? `${item.name} (${item.selectedVariant.name})`
                    : item.name;

                itemMap.set(aggregationKey, {
                    id: aggregationKey,
                    name: itemNameWithVariant,
                    totalQuantity: item.quantity,
                    addons: item.selectedAddons || [],
                    instructions: item.instructions,
                    componentItemIds: [item.id],
                });
            }
        });
        return Array.from(itemMap.values());
    }, [stationItems]);

    const handleToggleGroup = (aggregatedId: string) => {
        setSelectedAggregatedIds(prev => prev.includes(aggregatedId) ? prev.filter(id => id !== aggregatedId) : [...prev, aggregatedId]);
    };

    const handleMarkAsPrepared = () => {
        const itemIdsToPrepare = aggregatedItems
            .filter(aggItem => selectedAggregatedIds.includes(aggItem.id))
            .flatMap(aggItem => aggItem.componentItemIds);

        if(itemIdsToPrepare.length > 0) {
            onItemsPrepared(order.id, itemIdsToPrepare);
            setSelectedAggregatedIds([]);
        }
    };
    
    const selectedItemCount = aggregatedItems
        .filter(aggItem => selectedAggregatedIds.includes(aggItem.id))
        .reduce((sum, item) => sum + item.totalQuantity, 0);

    return (
        <Card className="break-inside-avoid shadow-lg border-2 border-primary/20 bg-card">
            <CardHeader className="p-4">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="font-bold text-xl">Order #{order.orderNumber}</CardTitle>
                         <CardDescription className="text-sm">
                            {formatDistanceToNow(new Date(order.orderDate), { addSuffix: true })}
                        </CardDescription>
                    </div>
                     <Badge variant={order.orderType === 'Dine-In' ? 'secondary' : 'outline'} className="flex items-center gap-1.5 py-1 px-3">
                        {order.orderType === 'Dine-In' ? <Utensils className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
                        <span className="font-semibold">
                            {order.orderType === 'Dine-In' && table ? table.name : order.orderType}
                        </span>
                    </Badge>
                </div>
                 {order.instructions && (
                    <div className="pt-2 text-xs italic text-destructive-foreground bg-destructive p-2 rounded-md">
                        <strong>Order Instructions:</strong> {order.instructions}
                    </div>
                 )}
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <div className="space-y-3">
                    {aggregatedItems.map(aggItem => (
                        <div key={aggItem.id} className="flex items-start gap-3 p-2 rounded-md transition-colors hover:bg-muted/50">
                            <Checkbox 
                                id={`agg-item-${aggItem.id}`} 
                                className="mt-1 h-5 w-5"
                                checked={selectedAggregatedIds.includes(aggItem.id)}
                                onCheckedChange={() => handleToggleGroup(aggItem.id)}
                            />
                            <Label htmlFor={`agg-item-${aggItem.id}`} className="flex-grow cursor-pointer">
                                <p className="font-semibold text-base">{aggItem.totalQuantity}x {aggItem.name}</p>
                                {aggItem.addons && aggItem.addons.length > 0 && (
                                    <div className="pl-4 text-xs font-normal text-muted-foreground">
                                        {aggItem.addons.map(addon => (
                                            <p key={addon.name}>+ {addon.quantity}x {addon.name}</p>
                                        ))}
                                    </div>
                                )}
                                {aggItem.instructions && (
                                    <p className="text-xs italic text-blue-600">"{aggItem.instructions}"</p>
                                )}
                            </Label>
                        </div>
                    ))}
                </div>
            </CardContent>
            <CardFooter className="p-4">
                <Button 
                    className="w-full"
                    disabled={selectedAggregatedIds.length === 0}
                    onClick={handleMarkAsPrepared}
                >
                    <Check className="mr-2 h-4 w-4" /> Mark {selectedItemCount} Item(s) as Prepared
                </Button>
            </CardFooter>
        </Card>
    );
}
