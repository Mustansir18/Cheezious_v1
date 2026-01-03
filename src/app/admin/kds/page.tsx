

"use client";

import { useMemo } from 'react';
import type { Order, OrderItem, KitchenStation, OrderStatus } from '@/lib/types';
import { useOrders } from '@/context/OrderContext';
import { useSettings } from '@/context/SettingsContext';
import { Loader, Utensils, ShoppingBag, Check, ChefHat, CheckCheck, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from '@/components/ui/separator';

const KDS_STATUSES: OrderStatus[] = ['Pending', 'Preparing', 'Partial Ready'];

interface KDSItemGroup {
    name: string;
    quantity: number;
    order: Order;
    originalItems: OrderItem[];
    addons: { name: string; quantity: number }[];
    dealName?: string;
}

// For individual station slips (Pizza, Fried, etc.)
interface KitchenItemSlipProps {
    itemGroup: KDSItemGroup;
    onTogglePrepared: (orderId: string, itemIds: string[]) => void;
}

const KitchenItemSlip = ({ itemGroup, onTogglePrepared }: KitchenItemSlipProps) => {
    const { settings } = useSettings();
    const { order, name, quantity, originalItems } = itemGroup;
    const table = settings.tables.find(t => t.id === order.tableId);
    
    // We can assume all items in the group have the same 'isPrepared' status
    const isPrepared = originalItems[0]?.isPrepared || false;
    const itemIds = originalItems.map(i => i.id);

    return (
        <Card className={cn("mb-4 break-inside-avoid", isPrepared && "opacity-50")}>
            <CardHeader className="p-3">
                <div className="flex justify-between items-start">
                    <CardTitle className="font-bold text-lg">{name}</CardTitle>
                    <Badge variant={order.orderType === 'Dine-In' ? 'secondary' : 'outline'} className="flex items-center gap-1">
                        {order.orderType === 'Dine-In' ? <Utensils className="h-3 w-3"/> : <ShoppingBag className="h-3 w-3"/>}
                        {order.orderType === 'Dine-In' && table ? table.name : order.orderType}
                    </Badge>
                </div>
                 <CardDescription className="text-xs">
                    Order #{order.orderNumber} &bull; {formatDistanceToNow(new Date(order.orderDate), { addSuffix: true })}
                </CardDescription>
                {itemGroup.dealName && (
                    <CardDescription className="text-xs text-primary font-semibold pt-1">
                        Part of "{itemGroup.dealName}" deal
                    </CardDescription>
                )}
            </CardHeader>
            <CardContent className="p-3 pt-0">
                <p className="font-bold text-2xl mb-2">{quantity}x</p>
                {itemGroup.addons && itemGroup.addons.length > 0 && (
                    <div className="text-xs text-muted-foreground border-t pt-2 mt-2">
                        {itemGroup.addons.map(addon => (
                            <p key={addon.name}>+ {addon.quantity}x {addon.name}</p>
                        ))}
                    </div>
                )}
                 {order.instructions && (
                    <p className="text-xs italic text-amber-700 mt-2 border-t pt-2">"{order.instructions}"</p>
                )}
                <Button 
                    size="sm" 
                    className={cn("w-full mt-3", isPrepared ? "bg-gray-400" : "bg-green-600 hover:bg-green-700")}
                    onClick={() => onTogglePrepared(order.id, itemIds)}
                >
                    <Check className="mr-2 h-4 w-4"/> {isPrepared ? 'Mark as Not Done' : 'Mark as Prepared'}
                </Button>
            </CardContent>
        </Card>
    )
};

// For consolidated dispatch slips
interface DispatchOrderSlipProps {
    order: Order;
    onDispatchItem: (orderId: string, itemId: string) => void;
}
const DispatchOrderSlip = ({ order, onDispatchItem }: DispatchOrderSlipProps) => {
    const { settings } = useSettings();
    const table = settings.tables.find(t => t.id === order.tableId);
    
    return (
        <Card className="flex flex-col h-full">
            <CardHeader className="p-4">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="font-bold text-lg">Order #{order.orderNumber}</CardTitle>
                        <CardDescription className="text-xs">
                            {formatDistanceToNow(new Date(order.orderDate), { addSuffix: true })}
                        </CardDescription>
                    </div>
                    <Badge variant={order.orderType === 'Dine-In' ? 'secondary' : 'outline'} className="flex items-center gap-1 text-sm">
                        {order.orderType === 'Dine-In' ? <Utensils className="h-4 w-4"/> : <ShoppingBag className="h-4 w-4"/>}
                        {order.orderType === 'Dine-In' && table ? table.name : order.orderType}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 flex-grow">
                 <ScrollArea className="h-48 pr-4">
                    <div className="space-y-2">
                        {order.items.map(item => (
                            <div key={item.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                     <span className={cn("h-2 w-2 rounded-full",
                                        item.isDispatched ? "bg-green-500" :
                                        item.isPrepared ? "bg-yellow-500 animate-pulse" :
                                        "bg-gray-400"
                                     )}></span>
                                    <span>{item.quantity}x {item.name}</span>
                                </div>
                                {item.isPrepared && !item.isDispatched && (
                                     <Button 
                                        size="sm" 
                                        variant="outline" 
                                        className="h-7 text-xs animate-blink"
                                        onClick={() => onDispatchItem(order.id, item.id)}
                                     >
                                         <Send className="mr-1 h-3 w-3" /> Dispatch
                                     </Button>
                                )}
                                {item.isDispatched && (
                                    <div className="flex items-center text-green-600 text-xs font-semibold">
                                        <CheckCheck className="mr-1 h-4 w-4" /> Dispatched
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                 </ScrollArea>
            </CardContent>
        </Card>
    );
};


interface StationColumnProps {
    stationId: KitchenStation;
    orders: Order[];
    onTogglePrepared: (orderId: string, itemIds: string[]) => void;
}

const StationColumn = ({ stationId, orders, onTogglePrepared }: StationColumnProps) => {
    const itemGroupsForStation = useMemo(() => {
        const itemGroups: KDSItemGroup[] = [];
        orders.forEach(order => {
            const relevantItems = order.items.filter(item => item.stationId === stationId && !item.isPrepared);
            if(relevantItems.length === 0) return;

            const groups: Map<string, {
                name: string;
                quantity: number;
                originalItems: OrderItem[];
                addons: Map<string, { name: string; quantity: number }>;
                dealName?: string;
            }> = new Map();
            
            relevantItems.forEach(item => {
                const groupKey = `${item.name}-${(item.selectedAddons || []).map(a => `${a.id}:${a.quantity}`).sort().join(',')}`;

                if (!groups.has(groupKey)) {
                    groups.set(groupKey, {
                        name: item.name,
                        quantity: 0,
                        originalItems: [],
                        addons: new Map(),
                        dealName: item.dealName,
                    });
                }
                const group = groups.get(groupKey)!;
                group.quantity += item.quantity;
                group.originalItems.push(item);
                (item.selectedAddons || []).forEach(addon => {
                    const addonKey = addon.id;
                    if (!group.addons.has(addonKey)) {
                        group.addons.set(addonKey, { name: addon.name, quantity: 0 });
                    }
                    group.addons.get(addonKey)!.quantity += addon.quantity;
                });
            });

            groups.forEach(group => {
                itemGroups.push({
                    name: group.name,
                    quantity: group.quantity,
                    order,
                    originalItems: group.originalItems,
                    addons: Array.from(group.addons.values()),
                    dealName: group.dealName,
                });
            });
        });
        return itemGroups;
    }, [orders, stationId]);

    return (
        <ScrollArea className="h-full">
             <div className="p-4 pt-0">
                {itemGroupsForStation.length > 0 ? (
                <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5 gap-4">
                    {itemGroupsForStation.map((group, index) => (
                        <KitchenItemSlip 
                            key={`${group.order.id}-${group.name}-${index}`} 
                            itemGroup={group}
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


interface DispatchColumnProps {
    orders: Order[];
    onDispatchItem: (orderId: string, itemId: string) => void;
}
const DispatchColumn = ({ orders, onDispatchItem }: DispatchColumnProps) => {
    const ordersForDispatch = useMemo(() => {
        return orders.filter(order => {
            // An order should be in dispatch if its status is Preparing or Partial Ready
            // AND not all of its items have been dispatched yet.
            const isInDispatchStatus = ['Preparing', 'Partial Ready'].includes(order.status);
            const allItemsDispatched = order.items.every(item => item.isDispatched);
            return isInDispatchStatus && !allItemsDispatched;
        });
    }, [orders]);
    
     return (
        <ScrollArea className="h-full">
            <div className="p-4 pt-0">
                {ordersForDispatch.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                        {ordersForDispatch.map(order => (
                            <DispatchOrderSlip key={order.id} order={order} onDispatchItem={onDispatchItem} />
                        ))}
                    </div>
                ) : (
                    <div className="flex h-[50vh] items-center justify-center">
                        <p className="text-muted-foreground">No orders ready for dispatch.</p>
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
    const { orders, isLoading, toggleItemPrepared, dispatchItem } = useOrders();
    const { settings, isLoading: isSettingsLoading } = useSettings();

    const ordersForKDS = useMemo(() => {
        return orders.filter(order => KDS_STATUSES.includes(order.status));
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
                    <TabsContent value="dispatch" className="h-full m-0">
                        <DispatchColumn orders={ordersForKDS} onDispatchItem={dispatchItem} />
                    </TabsContent>
                    {stationTabs.filter(t => t.id !== 'dispatch').map(tab => (
                        <TabsContent key={tab.id} value={tab.id as string} className="h-full m-0">
                           <StationColumn stationId={tab.id as KitchenStation} orders={ordersForKDS} onTogglePrepared={toggleItemPrepared} />
                        </TabsContent>
                    ))}
                </div>
            </Tabs>
        </div>
    );
}
