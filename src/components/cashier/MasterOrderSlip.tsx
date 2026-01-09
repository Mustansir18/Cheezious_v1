
'use client';

import type { Order } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatDistanceToNow } from 'date-fns';
import { useSettings } from "@/context/SettingsContext";
import { Utensils, ShoppingBag } from "lucide-react";
import { ScrollArea } from '../ui/scroll-area';

interface MasterOrderSlipProps {
    order: Order;
}

export default function MasterOrderSlip({ order }: MasterOrderSlipProps) {
    const { settings } = useSettings();
    const table = settings.tables.find(t => t.id === order.tableId);

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
                        {order.items.map((item, index) => (
                            <div key={item.id}>
                                {index > 0 && <Separator className="my-2" />}
                                <div className="flex justify-between items-start gap-4">
                                    <div className="font-semibold">
                                        <p>{item.quantity}x {item.name}</p>
                                         {item.selectedAddons && item.selectedAddons.length > 0 && (
                                            <div className="pl-4 text-xs font-normal text-muted-foreground">
                                                {item.selectedAddons.map(addon => (
                                                    <p key={addon.name}>+ {addon.quantity}x {addon.name}</p>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-shrink-0">
                                         <Badge variant="outline" className="h-6 w-6 items-center justify-center rounded-full p-0 font-bold">
                                            {item.quantity}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
