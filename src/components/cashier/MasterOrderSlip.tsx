
'use client';

import type { Order } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { useSettings } from "@/context/SettingsContext";
import { Utensils, ShoppingBag, Check } from "lucide-react";
import { ScrollArea } from '../ui/scroll-area';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';
import { useMenu } from '@/context/MenuContext';
import { Button } from '../ui/button';

interface MasterOrderSlipProps {
    order: Order;
    selectedItemIds: string[];
    onToggleItem: (orderId: string, itemId: string) => void;
    onDispatchSelected: (orderId: string) => void;
}

export default function MasterOrderSlip({ order, selectedItemIds, onToggleItem, onDispatchSelected }: MasterOrderSlipProps) {
    const { settings } = useSettings();
    const { menu } = useMenu();
    const table = settings.tables.find(t => t.id === order.tableId);
    
    const dispatchableItems = useMemo(() => {
        const physicalItems = order.items.filter(item => {
            if (item.isDispatched) return false;

            const menuItem = menu.items.find(mi => mi.id === item.menuItemId);
            const isDealContainer = !item.isDealComponent && !!menuItem?.dealItems?.length;
            return !isDealContainer;
        });
        return physicalItems;
    }, [order.items, menu.items]);
    
    const handleDispatchToggle = (itemId: string) => {
        onToggleItem(order.id, itemId);
    };

    const handleDispatch = () => {
        onDispatchSelected(order.id);
    };

    const selectedCount = selectedItemIds.length;

    return (
        <Card className="break-inside-avoid shadow-lg border-2 border-primary/20 flex flex-col">
            <CardHeader className="p-4">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="font-bold text-xl">Order #{order.orderNumber}</CardTitle>
                         <CardDescription className="text-sm">
                            {formatDistanceToNow(new Date(order.orderDate), { addSuffix: true })}
                        </CardDescription>
                    </div>
                     <Badge variant={order.orderType === 'Dine-In' ? 'secondary' : 'outline'} className="flex items-center gap-1.5 py-1 px-3">
                        {order.orderType === 'Dine-In' ? (
                        <Utensils className="h-4 w-4" />
                        ) : (
                        <ShoppingBag className="h-4 w-4" />
                        )}
                        <span className="font-semibold">
                            {order.orderType === 'Dine-In' && table ? table.name : order.orderType}
                        </span>
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 flex-grow overflow-hidden">
                <ScrollArea className="h-full max-h-[450px]">
                    <div className="space-y-3 pr-2">
                        {dispatchableItems.map((item, index) => {
                            const isPrepared = !!item.isPrepared;
                            const isDispatchOnly = !item.stationId;
                            const isSelectable = isPrepared || isDispatchOnly;
                            const isSelected = selectedItemIds.includes(item.id);
                            
                            return (
                                <div key={item.id} className={cn("flex justify-between items-start gap-2 p-2 rounded-md", !isSelectable && "opacity-50")}>
                                    <div className="flex items-start gap-2">
                                        <Checkbox
                                            id={`${order.id}-${item.id}`}
                                            checked={isSelected}
                                            disabled={!isSelectable}
                                            onCheckedChange={() => handleDispatchToggle(item.id)}
                                            className="mt-1"
                                        />
                                        <Label htmlFor={`${order.id}-${item.id}`} className={cn("font-semibold", isSelectable && "cursor-pointer")}>
                                            <p>{item.quantity}x {item.name} {item.selectedVariant ? `(${item.selectedVariant.name})` : ''}</p>
                                            {item.selectedAddons && item.selectedAddons.length > 0 && (
                                                <div className="pl-4 text-xs font-normal text-muted-foreground">
                                                    {item.selectedAddons.map(addon => (
                                                        <p key={addon.name}>+ {addon.quantity}x {addon.name}</p>
                                                    ))}
                                                </div>
                                            )}
                                             {item.instructions && (
                                                <p className="text-xs italic text-blue-600">"{item.instructions}"</p>
                                             )}
                                        </Label>
                                    </div>
                                    <div className="flex-shrink-0">
                                        {isPrepared ? (
                                            <Badge variant="outline" className="border-yellow-500 text-yellow-600">Prepared</Badge>
                                        ) : isDispatchOnly ? (
                                             <Badge variant="outline" className="border-blue-500 text-blue-600">Direct</Badge>
                                        ) : (
                                            <Badge variant="secondary">Preparing</Badge>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </ScrollArea>
            </CardContent>
             <CardFooter className="p-2">
                <Button 
                    className="w-full"
                    disabled={selectedCount === 0}
                    onClick={handleDispatch}
                >
                    <Check className="mr-2 h-4 w-4" /> Dispatch {selectedCount} Item(s)
                </Button>
            </CardFooter>
        </Card>
    );
}
