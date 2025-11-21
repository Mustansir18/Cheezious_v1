"use client";

import { useFirebase, useCollection, useMemoFirebase } from "@/firebase";
import { collection, doc, updateDoc } from "firebase/firestore";
import type { Order, OrderItem } from "@/lib/types";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "../ui/skeleton";
import { ScrollArea } from "../ui/scroll-area";
import { Utensils, ShoppingBag, Check, CheckCircle, CookingPot, Loader } from "lucide-react";
import { updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";

const statusConfig = {
    Pending: { icon: Loader, color: "bg-gray-500", label: "New Order" },
    Preparing: { icon: CookingPot, color: "bg-blue-500", label: "Preparing" },
    Ready: { icon: Check, color: "bg-yellow-500", label: "Ready" },
    Completed: { icon: CheckCircle, color: "bg-green-500", label: "Completed" },
    Cancelled: { icon: CheckCircle, color: "bg-red-500", label: "Cancelled" },
};


export function OrderCard({ order }: { order: Order }) {
  const { firestore } = useFirebase();
  const orderItemsQuery = useMemoFirebase(
    () =>
      firestore
        ? collection(firestore, `orders/${order.id}/order_items`)
        : null,
    [firestore, order.id]
  );

  const { data: items, isLoading } = useCollection<OrderItem>(orderItemsQuery);

  const handleUpdateStatus = (newStatus: Order['status']) => {
    if (!firestore) return;
    const orderRef = doc(firestore, "orders", order.id);
    updateDocumentNonBlocking(orderRef, { status: newStatus });
  };
  
  const StatusIcon = statusConfig[order.status]?.icon || Loader;

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
            <span className="font-headline text-xl">Order #{order.orderNumber}</span>
            <Badge variant="secondary">{order.orderType === 'Dine-In' ? <Utensils className="mr-1 h-4 w-4"/> : <ShoppingBag className="mr-1 h-4 w-4" />} {order.orderType}</Badge>
        </CardTitle>
        <CardDescription>
          {formatDistanceToNow(order.orderDate.toDate(), { addSuffix: true })}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <ScrollArea className="h-40 pr-4">
            <div className="space-y-3">
            {isLoading && Array.from({length: 3}).map((_, i) => <OrderItemSkeleton key={i} />)}
            {items?.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-sm">
                    <div>
                        <span className="font-semibold">{item.quantity}x</span> {item.name}
                    </div>
                    <div className="font-mono">${(item.quantity * item.itemPrice).toFixed(2)}</div>
                </div>
            ))}
            </div>
        </ScrollArea>
        <Separator className="my-4" />
        <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>${order.totalAmount.toFixed(2)}</span>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
         <div className="flex items-center w-full">
            <StatusIcon className={`mr-2 h-5 w-5 ${statusConfig[order.status]?.color}`} />
            <span className="font-semibold">{statusConfig[order.status]?.label}</span>
         </div>
         <div className="grid grid-cols-2 gap-2 w-full">
            {order.status === 'Pending' && (
                <Button onClick={() => handleUpdateStatus('Preparing')} size="sm" className="w-full">
                    <CookingPot className="mr-2 h-4 w-4" /> Accept & Prepare
                </Button>
            )}
            {order.status === 'Preparing' && (
                <Button onClick={() => handleUpdateStatus('Ready')} size="sm" className="w-full bg-yellow-500 hover:bg-yellow-600 text-black">
                   <Check className="mr-2 h-4 w-4" /> Mark as Ready
                </Button>
            )}
            {order.status === 'Ready' && (
                 <Button onClick={() => handleUpdateStatus('Completed')} size="sm" className="w-full bg-green-500 hover:bg-green-600">
                    <CheckCircle className="mr-2 h-4 w-4" /> Mark as Completed
                 </Button>
            )}
             {(order.status === 'Pending' || order.status === 'Preparing') && (
                <Button onClick={() => handleUpdateStatus('Cancelled')} size="sm" variant="destructive" className="w-full">
                    Cancel Order
                </Button>
             )}
         </div>

      </CardFooter>
    </Card>
  );
}

const OrderItemSkeleton = () => (
    <div className="flex justify-between items-center text-sm">
        <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-4 w-12" />
    </div>
);

OrderCard.Skeleton = function OrderCardSkeleton() {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <OrderItemSkeleton />
            <OrderItemSkeleton />
          </div>
          <Separator className="my-4" />
          <div className="flex justify-between">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-20" />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
        </CardFooter>
      </Card>
    );
  };
