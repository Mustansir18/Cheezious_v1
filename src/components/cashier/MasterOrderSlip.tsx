
'use client';

import type { Order } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatDistanceToNow } from 'date-fns';
import { useSettings } from "@/context/SettingsContext";
import { Utensils, ShoppingBag, Check, CheckCircle } from "lucide-react";
import { ScrollArea } from '../ui/scroll-area';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { cn } from '@/lib/utils';

interface MasterOrderSlipProps {
    order: Order;
    onDispatchItem: (orderId: string, itemId: string) => void;
}

export default function MasterOrderSlip({ order, onDispatchItem }: MasterOrderSlipProps) {
    const { settings } = useSettings();
    const table = settings.tables.find(t => t.id === order.tableId);

    const handleDispatchToggle = (itemId: string, isSelectable: boolean, isDispatched: boolean) => {
        if (isSelectable && !isDispatched) {
            onDispatchItem(order.id, itemId);
        }
    };

    return (
        <Card className="break-inside-avoid shadow-lg border-2 border-primary/20">
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
            <CardContent className="p-4 pt-0">
                <ScrollArea className="h-full max-h-96">
                    <div className="space-y-3 pr-2">
                        {order.items.map((item, index) => {
                            const isPrepared = !!item.isPrepared;
                            const isDispatchOnly = !item.stationId;
                            const isDispatched = !!item.isDispatched;
                            const isSelectable = isPrepared || isDispatchOnly;
                            
                            return (
                                <div key={item.id}>
                                    {index > 0 && <Separator className="my-2" />}
                                    <div className="flex justify-between items-start gap-2">
                                        <div className={cn("flex items-start gap-2", !isSelectable && "opacity-50")}>
                                            <Checkbox
                                                id={`dispatch-${item.id}`}
                                                checked={isDispatched}
                                                disabled={!isSelectable || isDispatched}
                                                onCheckedChange={() => handleDispatchToggle(item.id, isSelectable, isDispatched)}
                                                className="mt-1"
                                            />
                                            <Label htmlFor={`dispatch-${item.id}`} className={cn("font-semibold", isSelectable && !isDispatched && "cursor-pointer")}>
                                                <p>{item.quantity}x {item.name}</p>
                                                {item.selectedAddons && item.selectedAddons.length > 0 && (
                                                    <div className="pl-4 text-xs font-normal text-muted-foreground">
                                                        {item.selectedAddons.map(addon => (
                                                            <p key={addon.name}>+ {addon.quantity}x {addon.name}</p>
                                                        ))}
                                                    </div>
                                                )}
                                            </Label>
                                        </div>
                                        <div className="flex-shrink-0">
                                            {isDispatched ? (
                                                <Badge variant="default" className="bg-green-600 hover:bg-green-700">Dispatched</Badge>
                                            ) : isPrepared ? (
                                                <Badge variant="outline" className="border-yellow-500 text-yellow-600">Prepared</Badge>
                                            ) : isDispatchOnly ? (
                                                 <Badge variant="outline" className="border-blue-500 text-blue-600">Direct</Badge>
                                            ) : (
                                                <Badge variant="secondary">Pending</Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
