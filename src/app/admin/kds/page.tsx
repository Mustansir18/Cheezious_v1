
"use client";

import { useMemo } from 'react';
import type { Order, OrderItem, KitchenStation } from '@/lib/types';
import { useOrders } from '@/context/OrderContext';
import { useSettings } from '@/context/SettingsContext';
import { Loader, Utensils, ShoppingBag, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface KitchenItemSlipProps {
    item: OrderItem;
    order: Order;
    onTogglePrepared: (orderId: string, itemId: string) => void;
}

const KitchenItemSlip = ({ item, order, onTogglePrepared }: KitchenItemSlipProps) => {
    const { settings } = useSettings();
    const table = settings.tables.find(t => t.id === order.tableId);

    return (
        <Card className={cn("mb-4 break-inside-avoid", item.isPrepared && "opacity-50")}>
            <CardHeader className="p-3">
                <div className="flex justify-between items-start">
                    <CardTitle className="font-bold text-lg">{item.name}</CardTitle>
                    <Badge variant={order.orderType === 'Dine-In' ? 'secondary' : 'outline'} className="flex items-center gap-1">
                        {order.orderType === 'Dine-In' ? <Utensils className="h-3 w-3"/> : <ShoppingBag className="h-3 w-3"/>}
                        {order.orderType === 'Dine-In' && table ? table.name : order.orderType}
                    </Badge>
                </div>
                 <CardDescription className="text-xs">
                    Order #{order.orderNumber} &bull; {formatDistanceToNow(new Date(order.orderDate), { addSuffix: true })}
                </CardDescription>
            </CardHeader>
            <CardContent className="p-3 pt-0">
                <p className="font-bold text-2xl mb-2">{item.quantity}x</p>
                {item.selectedAddons && item.selectedAddons.length > 0 && (
                    <div className="text-xs text-muted-foreground border-t pt-2 mt-2">
                        {item.selectedAddons.map(addon => (
                            <p key={addon.name}>+ {addon.quantity}x {addon.name}</p>
                        ))}
                    </div>
                )}
                 {order.instructions && (
                    <p className="text-xs italic text-amber-700 mt-2 border-t pt-2">"{order.instructions}"</p>
                )}
                <Button 
                    size="sm" 
                    className={cn("w-full mt-3", item.isPrepared ? "bg-gray-400" : "bg-green-600 hover:bg-green-700")}
                    onClick={() => onTogglePrepared(order.id, item.id)}
                >
                    <Check className="mr-2 h-4 w-4"/> {item.isPrepared ? 'Mark as Not Done' : 'Mark as Prepared'}
                </Button>
            </CardContent>
        </Card>
    )
};


interface StationColumnProps {
    title: string;
    stationId?: KitchenStation | 'dispatch';
    orders: Order[];
    onTogglePrepared: (orderId: string, itemId: string) => void;
}

const StationColumn = ({ title, stationId, orders, onTogglePrepared }: StationColumnProps) => {
    const itemsForStation = useMemo(() => {
        const allItems: { item: OrderItem, order: Order }[] = [];
        orders.forEach(order => {
            order.items.forEach(item => {
                if (stationId === 'dispatch') {
                    allItems.push({ item, order });
                } else if (item.stationId === stationId) {
                    allItems.push({ item, order });
                }
            });
        });
        return allItems.filter(({item}) => !item.isPrepared);
    }, [orders, stationId]);

    return (
        <div className="flex flex-col h-full bg-muted/50 rounded-lg">
            <CardHeader className="p-4 border-b">
                <CardTitle className="text-center font-headline text-2xl">{title} ({itemsForStation.length})</CardTitle>
            </CardHeader>
            <ScrollArea className="flex-grow p-4">
                 {itemsForStation.length > 0 ? (
                    <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-4">
                        {itemsForStation.map(({ item, order }) => (
                            <KitchenItemSlip 
                                key={item.id} 
                                item={item} 
                                order={order}
                                onTogglePrepared={onTogglePrepared} 
                            />
                        ))}
                    </div>
                 ) : (
                    <div className="flex h-full items-center justify-center">
                        <p className="text-muted-foreground">No items for this station.</p>
                    </div>
                 )}
            </ScrollArea>
        </div>
    );
};


export default function KDSPage() {
    const { orders, isLoading, toggleItemPrepared } = useOrders();
    const { settings, isLoading: isSettingsLoading } = useSettings();

    const ordersInPreparation = useMemo(() => {
        return orders.filter(order => order.status === 'Preparing');
    }, [orders]);

    if (isLoading || isSettingsLoading) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                <Loader className="h-12 w-12 animate-spin text-primary" />
                <p className="ml-4 text-muted-foreground">Loading KDS...</p>
            </div>
        );
    }
    
    return (
        <div className="h-[calc(100vh-theme(space.16))] w-full p-4">
             <header className="text-center mb-4">
                <h1 className="font-headline text-4xl font-bold">Kitchen Display System</h1>
                <p className="text-muted-foreground">Live order preparation view for all stations.</p>
            </header>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 gap-4 h-[calc(100%-80px)]">
                <StationColumn title="Dispatch" stationId="dispatch" orders={ordersInPreparation} onTogglePrepared={toggleItemPrepared} />
                <StationColumn title="Pizza" stationId="pizza" orders={ordersInPreparation} onTogglePrepared={toggleItemPrepared} />
                <StationColumn title="Fried" stationId="fried" orders={ordersInPreparation} onTogglePrepared={toggleItemPrepared} />
                <StationColumn title="Pasta" stationId="pasta" orders={ordersInPreparation} onTogglePrepared={toggleItemPrepared} />
                <StationColumn title="Bar" stationId="bar" orders={ordersInPreparation} onTogglePrepared={toggleItemPrepared} />
            </div>
        </div>
    );
}
