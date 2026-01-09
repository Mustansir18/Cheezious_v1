
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
import { useState } from 'react';


interface StationOrderCardProps {
    order: Order;
    stationItems: OrderItem[];
    onItemsPrepared: (orderId: string, itemIds: string[]) => void;
}

export default function StationOrderCard({ order, stationItems, onItemsPrepared }: StationOrderCardProps) {
    const { settings } = useSettings();
    const table = settings.tables.find(t => t.id === order.tableId);
    const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
    
    const handleToggleItem = (itemId: string) => {
        setSelectedItemIds(prev => prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]);
    };

    const handleMarkAsPrepared = () => {
        if(selectedItemIds.length > 0) {
            onItemsPrepared(order.id, selectedItemIds);
            setSelectedItemIds([]);
        }
    };

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
                    {stationItems.map(item => (
                        <div key={item.id} className="flex items-start gap-3 p-2 rounded-md transition-colors hover:bg-muted/50">
                            <Checkbox 
                                id={`item-${item.id}`} 
                                className="mt-1 h-5 w-5"
                                checked={selectedItemIds.includes(item.id)}
                                onCheckedChange={() => handleToggleItem(item.id)}
                            />
                            <Label htmlFor={`item-${item.id}`} className="flex-grow cursor-pointer">
                                <p className="font-semibold text-base">{item.quantity}x {item.name}</p>
                                {item.selectedAddons && item.selectedAddons.length > 0 && (
                                    <div className="pl-4 text-xs font-normal text-muted-foreground">
                                        {item.selectedAddons.map(addon => (
                                            <p key={addon.name}>+ {addon.quantity}x {addon.name}</p>
                                        ))}
                                    </div>
                                )}
                            </Label>
                        </div>
                    ))}
                </div>
            </CardContent>
            <CardFooter className="p-4">
                <Button 
                    className="w-full"
                    disabled={selectedItemIds.length === 0}
                    onClick={handleMarkAsPrepared}
                >
                    <Check className="mr-2 h-4 w-4" /> Mark {selectedItemIds.length} Item(s) as Prepared
                </Button>
            </CardFooter>
        </Card>
    );
}
