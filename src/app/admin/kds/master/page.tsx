
'use client';

import { useMemo, Fragment, useState } from 'react';
import type { Order, OrderStatus } from '@/lib/types';
import { useOrders } from '@/context/OrderContext';
import { Loader, ChefHat } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import MasterOrderSlip from '@/components/cashier/MasterOrderSlip';


const KDS_STATUSES: OrderStatus[] = ['Pending', 'Preparing', 'Partial Ready'];

export default function MasterCuttStationPage() {
  const { orders, isLoading, dispatchItem } = useOrders();
  const [selectedItems, setSelectedItems] = useState<Record<string, string[]>>({});

  const handleToggleItemSelection = (orderId: string, itemId: string) => {
    setSelectedItems(prev => {
      const currentSelection = prev[orderId] || [];
      const newSelection = currentSelection.includes(itemId)
        ? currentSelection.filter(id => id !== itemId)
        : [...currentSelection, itemId];
      return { ...prev, [orderId]: newSelection };
    });
  };

  const handleDispatchSelected = (orderId: string) => {
    const itemsToDispatch = selectedItems[orderId] || [];
    if (itemsToDispatch.length > 0) {
      itemsToDispatch.forEach(itemId => dispatchItem(orderId, itemId));
      // Clear selection for this order after dispatching
      setSelectedItems(prev => ({ ...prev, [orderId]: [] }));
    }
  };
  
  const ordersForKDS = useMemo(() => {
    // This filter now correctly shows only orders that require action at the CUTT station.
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
        <header className="mb-6 flex items-center gap-4">
            <ChefHat className="h-10 w-10 text-primary" />
            <div>
                <h1 className="font-headline text-3xl font-bold">CUTT Station (Assembly)</h1>
                <p className="text-muted-foreground">Live view of orders ready for assembly and dispatch.</p>
            </div>
        </header>
       <ScrollArea className="flex-grow">
            <div className="p-4 pt-0">
                {ordersForKDS.length > 0 ? (
                <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5 gap-6 space-y-6">
                    {ordersForKDS.map((order) => (
                        <Fragment key={order.id}>
                          <MasterOrderSlip 
                            order={order} 
                            selectedItemIds={selectedItems[order.id] || []}
                            onToggleItem={handleToggleItemSelection}
                            onDispatchSelected={handleDispatchSelected}
                          />
                          <MasterOrderSlip 
                            order={order}
                            selectedItemIds={selectedItems[order.id] || []}
                            onToggleItem={handleToggleItemSelection}
                            onDispatchSelected={handleDispatchSelected}
                          />
                        </Fragment>
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
