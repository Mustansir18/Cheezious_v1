
"use client";

import type { Order, OrderItem, OrderStatus } from "@/lib/types";
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
import { Utensils, ShoppingBag, Check, CheckCircle, CookingPot, Loader, CreditCard, Printer, Info, XCircle } from "lucide-react";
import { useMemo, useRef, useState, useCallback } from "react";
import { useSettings } from "@/context/SettingsContext";
import { OrderReceipt } from "./OrderReceipt";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "../ui/input";

const statusConfig = {
    Pending: { icon: Loader, color: "text-gray-500", label: "Pending" },
    Preparing: { icon: CookingPot, color: "text-blue-500", label: "Preparing" },
    Ready: { icon: Check, color: "text-yellow-500", label: "Ready for Pickup" },
    Completed: { icon: CheckCircle, color: "text-green-500", label: "Completed" },
    Cancelled: { icon: XCircle, color: "text-red-500", label: "Cancelled" },
};

function CancellationDialog({ orderId, onConfirm }: { orderId: string, onConfirm: (orderId: string, reason: string) => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [reason, setReason] = useState("");
    const [customReason, setCustomReason] = useState("");

    const handleConfirm = () => {
        const finalReason = reason === 'custom' ? customReason : reason;
        if (finalReason) {
            onConfirm(orderId, finalReason);
            setIsOpen(false);
        }
    };

    const reasons = [
        { id: "false-order", label: "False Order" },
        { id: "guest-mind-change", label: "Guest Mind Change" },
        { id: "double-order", label: "Double Order" },
        { id: "guest-not-found", label: "Guest Not Found" },
    ];

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                     <Button variant="destructive" size="sm" className="w-full">
                        Cancel Order
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure you want to cancel this order?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will mark the order as cancelled.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>No, Keep Order</AlertDialogCancel>
                        <AlertDialogAction onClick={() => setIsOpen(true)}>Yes, Cancel Order</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Reason for Cancellation</DialogTitle>
                    <DialogDescription>
                        Please select a reason for cancelling order #{orderId.slice(-6)}.
                    </DialogDescription>
                </DialogHeader>
                <RadioGroup value={reason} onValueChange={setReason} className="space-y-2 py-4">
                    {reasons.map(r => (
                        <div key={r.id} className="flex items-center space-x-2">
                            <RadioGroupItem value={r.label} id={r.id} />
                            <Label htmlFor={r.id}>{r.label}</Label>
                        </div>
                    ))}
                     <div className="flex items-center space-x-2">
                        <RadioGroupItem value="custom" id="custom" />
                        <Label htmlFor="custom">Other</Label>
                    </div>
                    {reason === 'custom' && (
                        <Input 
                            placeholder="Please specify the reason"
                            value={customReason}
                            onChange={(e) => setCustomReason(e.target.value)}
                            className="mt-2"
                        />
                    )}
                </RadioGroup>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button onClick={handleConfirm} disabled={!reason || (reason === 'custom' && !customReason)}>Confirm Cancellation</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

interface OrderCardProps {
    order: Order;
    workflow?: 'cashier' | 'kds';
    onUpdateStatus: (orderId: string, newStatus: OrderStatus, reason?: string) => void;
    children?: React.ReactNode; // For additional action buttons like InfoModal
}

export function OrderCard({ order, workflow = 'cashier', onUpdateStatus, children }: OrderCardProps) {
  const { settings } = useSettings();
  
  const handleUpdateStatus = (newStatus: OrderStatus) => {
    onUpdateStatus(order.id, newStatus);
  };

  const handleCancelOrder = useCallback((orderId: string, reason: string) => {
    console.log(`Order ${orderId} cancelled. Reason: ${reason}`);
    onUpdateStatus(orderId, 'Cancelled', reason);
  }, [onUpdateStatus]);

  const handlePrint = () => {
    const printableArea = document.getElementById(`printable-receipt-${order.id}`);
    if (!printableArea) return;

    const printContainer = document.createElement('div');
    printContainer.id = 'printable-area';
    printContainer.appendChild(printableArea.cloneNode(true));
    document.body.appendChild(printContainer);
    
    document.body.classList.add('printing-active');
    window.print();

    // Use a timeout to ensure the cleanup happens after the print dialog is likely closed
    setTimeout(() => {
        if (document.body.contains(printContainer)) {
            document.body.removeChild(printContainer);
        }
        document.body.classList.remove('printing-active');
    }, 500);
  };
  
  const StatusIcon = statusConfig[order.status]?.icon || Loader;

  const orderDate = useMemo(() => new Date(order.orderDate), [order.orderDate]);
  const table = useMemo(() => settings.tables.find(t => t.id === order.tableId), [settings.tables, order.tableId]);


  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
            <span className="font-headline text-xl">Order #{order.orderNumber}</span>
            <div className="flex items-center gap-1">
                {children}
                <Button variant="ghost" size="icon" className="h-8 w-8 print-hidden" onClick={handlePrint}>
                    <Printer className="h-4 w-4" />
                </Button>
                <Badge variant="secondary">{order.orderType === 'Dine-In' ? <Utensils className="mr-1 h-4 w-4"/> : <ShoppingBag className="mr-1 h-4 w-4" />} {order.orderType}</Badge>
            </div>
        </CardTitle>
        <CardDescription>
          {formatDistanceToNow(orderDate, { addSuffix: true })}
           {order.status === 'Cancelled' && order.cancellationReason && ` - Reason: ${order.cancellationReason}`}
        </CardDescription>
        {table && <CardDescription>Table: <span className="font-semibold">{table.name}</span></CardDescription>}
      </CardHeader>
      <CardContent className="flex-grow">
        <ScrollArea className="h-40 pr-4">
            <div className="space-y-3">
            {order.items?.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-sm">
                    <div>
                        <span className="font-semibold">{item.quantity}x</span> {item.name}
                    </div>
                    <div className="font-mono">RS {(item.quantity * item.itemPrice).toFixed(2)}</div>
                </div>
            ))}
            </div>
        </ScrollArea>
        <Separator className="my-4" />
        <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>RS {order.totalAmount.toFixed(2)}</span>
        </div>
         {order.paymentMethod && (
            <div className="flex items-center mt-2 text-sm text-muted-foreground">
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Paid with {order.paymentMethod}</span>
            </div>
         )}
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
         <div className="flex items-center w-full">
            <StatusIcon className={`mr-2 h-5 w-5 ${statusConfig[order.status]?.color}`} />
            <span className="font-semibold">{statusConfig[order.status]?.label}</span>
         </div>
         {workflow === 'kds' && (
             <div className="grid grid-cols-1 gap-2 w-full">
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
             </div>
         )}
         {workflow === 'cashier' && (
            <div className="grid grid-cols-1 gap-2 w-full">
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
                 {(order.status === 'Pending' || order.status === 'Preparing' || order.status === 'Ready') && (
                    <CancellationDialog orderId={order.id} onConfirm={handleCancelOrder} />
                 )}
             </div>
         )}
      </CardFooter>
      {/* Hidden receipt for printing */}
      <div className="hidden">
        <div id={`printable-receipt-${order.id}`}>
          <OrderReceipt order={order} />
        </div>
      </div>
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
