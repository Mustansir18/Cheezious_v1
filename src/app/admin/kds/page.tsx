
"use client";

import { useMemo } from 'react';
import type { Order, OrderItem, KitchenStation } from '@/lib/types';
import { useOrders } from '@/context/OrderContext';
import { useSettings } from '@/context/SettingsContext';
import { Loader, Utensils, ShoppingBag, Check, ChefHat } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


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
    stationId?: KitchenStation | 'dispatch';
    orders: Order[];
    onTogglePrepared: (orderId: string, itemId: string) => void;
}

const StationColumn = ({ stationId, orders, onTogglePrepared }: StationColumnProps) => {
    const itemsForStation = useMemo(() => {
        const allItems: { item: OrderItem, order: Order }[] = [];
        orders.forEach(order => {
            order.items.forEach(item => {
                if (stationId === 'dispatch') {
                    // Dispatch shows all non-prepared items
                    if (!item.isPrepared) {
                        allItems.push({ item, order });
                    }
                } else if (item.stationId === stationId && !item.isPrepared) {
                    allItems.push({ item, order });
                }
            });
        });
        return allItems;
    }, [orders, stationId]);

    return (
        <ScrollArea className="h-full">
             <div className="p-4 pt-0">
                {itemsForStation.length > 0 ? (
                <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5 gap-4">
                    {itemsForStation.map(({ item, order }) => (
                        <KitchenItemSlip 
                            key={`${order.id}-${item.id}`} 
                            item={item} 
                            order={order}
                            onTogglePrepared={onTogglePrepared} 
                        />
                    ))}
                </div>
                ) : (
                <div className="flex h-[50vh] items-center justify-center">
                    <p className="text-muted-foreground">No items for this station.</p>
                </div>
                )}
             </div>
        </ScrollArea>
    );
};

const stationTabs: { id: KitchenStation | 'dispatch', name: string, icon: React.ElementType }[] = [
    { id: 'dispatch', name: 'Dispatch', icon: ChefHat },
    { id: 'pizza', name: 'Pizza', icon: Utensils },
    { id: 'fried', name: 'Fried', icon: Utensils },
    { id: 'pasta', name: 'Pasta', icon: Utensils },
    { id: 'bar', name: 'Bar', icon: Utensils },
];


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
        <div className="h-screen w-full flex flex-col p-4 bg-muted/40">
             <header className="text-center mb-4 flex-shrink-0">
                <h1 className="font-headline text-4xl font-bold">Kitchen Display System</h1>
                <p className="text-muted-foreground">Live order preparation view for all stations.</p>
            </header>
            <Tabs defaultValue="dispatch" className="w-full flex flex-col flex-grow">
                <TabsList className="grid w-full grid-cols-5 h-auto">
                    {stationTabs.map(tab => (
                         <TabsTrigger key={tab.id} value={tab.id} className="py-3 text-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            <tab.icon className="mr-2 h-5 w-5" />
                            {tab.name}
                        </TabsTrigger>
                    ))}
                </TabsList>
                <div className="flex-grow mt-4 bg-background rounded-lg border">
                    {stationTabs.map(tab => (
                        <TabsContent key={tab.id} value={tab.id} className="h-full m-0">
                           <StationColumn stationId={tab.id} orders={ordersInPreparation} onTogglePrepared={toggleItemPrepared} />
                        </TabsContent>
                    ))}
                </div>
            </Tabs>
        </div>
    );
}
