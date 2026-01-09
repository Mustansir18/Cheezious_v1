
'use client';

import { useMemo } from 'react';
import type { Order, OrderItem, KitchenStation, OrderStatus } from '@/lib/types';
import { useOrders } from '@/context/OrderContext';
import { Loader, Pizza, CookingPot, Flame, Martini } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useParams } from 'next/navigation';
import StationOrderCard from '@/components/cashier/StationOrderCard';

const KDS_STATUSES: OrderStatus[] = ['Pending', 'Preparing'];

const stationInfo: Record<KitchenStation, { name: string; icon: React.ElementType }> = {
    pizza: { name: 'Pizza Station', icon: Pizza },
    pasta: { name: 'Pasta Station', icon: CookingPot },
    fried: { name: 'Fried Station', icon: Flame },
    bar: { name: 'Bar & Desserts', icon: Martini },
};

export default function IndividualStationPage() {
    const params = useParams();
    const stationId = params.stationId as KitchenStation;

    const { orders, isLoading, toggleItemPrepared } = useOrders();

    const stationOrders = useMemo(() => {
        const relevantOrders: { order: Order; stationItems: OrderItem[] }[] = [];

        orders.forEach(order => {
            if (!KDS_STATUSES.includes(order.status)) return;

            const itemsForStation = order.items.filter(item => item.stationId === stationId && !item.isPrepared);
            
            if (itemsForStation.length > 0) {
                relevantOrders.push({
                    order: order,
                    stationItems: itemsForStation
                });
            }
        });
        
        return relevantOrders.sort((a,b) => new Date(a.order.orderDate).getTime() - new Date(b.order.orderDate).getTime());
    }, [orders, stationId]);

    const handleItemsPrepared = (orderId: string, itemIds: string[]) => {
        toggleItemPrepared(orderId, itemIds);
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    const { name = "Kitchen Station", icon: Icon = Loader } = stationInfo[stationId] || {};

    return (
        <div className="h-screen w-full flex flex-col p-4 sm:p-6 md:p-8 bg-muted/40">
            <header className="text-center mb-8 flex-shrink-0 flex items-center justify-center gap-4">
                <Icon className="h-10 w-10 text-primary" />
                <h1 className="font-headline text-4xl font-bold">{name}</h1>
            </header>
            <ScrollArea className="flex-grow">
                <div className="p-4 pt-0">
                    {stationOrders.length > 0 ? (
                        <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5 gap-6 space-y-6">
                            {stationOrders.map(({ order, stationItems }) => (
                                <StationOrderCard 
                                    key={order.id} 
                                    order={order} 
                                    stationItems={stationItems}
                                    onItemsPrepared={handleItemsPrepared}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex h-[50vh] items-center justify-center">
                            <p className="text-muted-foreground text-lg">No items to prepare at this station.</p>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
