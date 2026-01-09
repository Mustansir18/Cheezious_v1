
'use client';

import { useMemo } from 'react';
import type { Order, OrderStatus } from '@/lib/types';
import { useOrders } from '@/context/OrderContext';
import { Loader } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import MasterOrderSlip from '@/components/cashier/MasterOrderSlip';


const KDS_STATUSES: OrderStatus[] = ['Pending', 'Preparing', 'Partial Ready', 'Ready'];

export default function MasterCuttStationPage() {
  const { orders, isLoading } = useOrders();

  const ordersForKDS = useMemo(() => {
    return orders
        .filter((order) => KDS_STATUSES.includes(order.status))
        .sort((a,b) => new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime());
  }, [orders]);

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Loading CUTT Station...</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col p-4 sm:p-6 md:p-8 bg-muted/40">
       <ScrollArea className="flex-grow">
            <div className="p-4 pt-0">
                {ordersForKDS.length > 0 ? (
                <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5 gap-6 space-y-6">
                    {ordersForKDS.map((order) => (
                        <MasterOrderSlip key={order.id} order={order} />
                    ))}
                </div>
                ) : (
                <div className="flex h-[50vh] items-center justify-center">
                    <p className="text-muted-foreground text-lg">No active orders for assembly.</p>
                </div>
                )}
            </div>
      </ScrollArea>
    </div>
  );
}
