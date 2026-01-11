
'use client';

import { useMemo } from 'react';
import type { Order, OrderItem, KitchenStation, OrderStatus } from '@/lib/types';
import { useOrders } from '@/context/OrderContext';
import { Loader, Pizza, CookingPot, Flame, Martini } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useParams, notFound } from 'next/navigation';
import StationOrderCard from '@/components/cashier/StationOrderCard';

const KDS_STATUSES: OrderStatus[] = ['Pending', 'Preparing'];

const stationInfo: Record<KitchenStation, { name: string; icon: React.ElementType }> = {
    pizza: { name: 'MAKE Station', icon: Pizza },
    pasta: { name: 'PASTA Station', icon: CookingPot },
    fried: { name: 'FRIED Station', icon: Flame },
    bar: { name: 'BEVERAGES Station', icon: Martini },
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
    
    const stationDetails = stationInfo[stationId];
    
    if (!isLoading && !stationDetails) {
        return notFound();
    }

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    const StationIcon = stationDetails.icon;
    
    return (
        <div className="h-full w-full flex flex-col p-4 sm:p-6 md:p-8 bg-muted/40">
            <header className="mb-6 flex items-center gap-4">
                <StationIcon className="h-10 w-10 text-primary" />
                <div>
                    <h1 className="font-headline text-3xl font-bold">{stationDetails.name}</h1>
                    <p className="text-muted-foreground">Live view of items to be prepared at this station.</p>
                </div>
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
