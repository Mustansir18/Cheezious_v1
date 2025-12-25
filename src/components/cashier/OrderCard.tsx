
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
import { Utensils, ShoppingBag, Check, CheckCircle, CookingPot, Loader, CreditCard, Printer, Info, XCircle, Tag, Gift, MessageSquareText } from "lucide-react";
import { useMemo, useState, useCallback } from "react";
import { useSettings } from "@/context/SettingsContext";
import { OrderReceipt } from "./OrderReceipt";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "../ui/input";
import { useAuth } from "@/context/AuthContext";
import { useOrders } from "@/context/OrderContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { useToast } from "@/hooks/use-toast";

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

function OrderModificationDialog({ order }: { order: Order }) {
    const { applyDiscountOrComplementary } = useOrders();
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);

    // Discount state
    const [discountType, setDiscountType] = useState<'percentage' | 'amount'>('amount');
    const [discountValue, setDiscountValue] = useState<number | string>('');

    // Complementary state
    const [complementaryReason, setComplementaryReason] = useState('');

    const handleApplyDiscount = () => {
        const value = Number(discountValue);
        if (isNaN(value) || value <= 0) {
            toast({ variant: 'destructive', title: 'Invalid Discount', description: 'Please enter a valid positive number for the discount.' });
            return;
        }
        applyDiscountOrComplementary(order.id, { discountType, discountValue: value });
        toast({ title: 'Discount Applied', description: `A ${discountType} discount of ${value} has been applied.` });
        setIsOpen(false);
    };
    
    const handleApplyComplementary = () => {
        if (!complementaryReason) {
            toast({ variant: 'destructive', title: 'Reason Required', description: 'Please select a reason for making the order complementary.' });
            return;
        }
        applyDiscountOrComplementary(order.id, { isComplementary: true, complementaryReason });
        toast({ title: 'Order is now Complementary', description: `The order has been marked as complementary.` });
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="secondary" size="sm" className="w-full">
                    Modify Order
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Modify Order #{order.orderNumber}</DialogTitle>
                    <DialogDescription>Apply a discount or mark the order as complementary.</DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="discount">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="discount">Discount</TabsTrigger>
                        <TabsTrigger value="complementary">Complementary</TabsTrigger>
                    </TabsList>
                    <TabsContent value="discount" className="pt-4 space-y-4">
                        <RadioGroup value={discountType} onValueChange={(v) => setDiscountType(v as any)} className="flex gap-4">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="amount" id="amount" />
                                <Label htmlFor="amount">Amount (RS)</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="percentage" id="percentage" />
                                <Label htmlFor="percentage">Percentage (%)</Label>
                            </div>
                        </RadioGroup>
                         <Input 
                            type="number" 
                            placeholder={discountType === 'amount' ? 'e.g., 100' : 'e.g., 15'}
                            value={discountValue}
                            onChange={(e) => setDiscountValue(e.target.value)}
                        />
                         <Button onClick={handleApplyDiscount} className="w-full">Apply Discount</Button>
                    </TabsContent>
                    <TabsContent value="complementary" className="pt-4 space-y-4">
                        <RadioGroup value={complementaryReason} onValueChange={setComplementaryReason}>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="Marketing" id="r-marketing" />
                                <Label htmlFor="r-marketing">Marketing</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="Guest Experience" id="r-guest" />
                                <Label htmlFor="r-guest">Guest Experience</Label>
                            </div>
                             <div className="flex items-center space-x-2">
                                <RadioGroupItem value="Internal" id="r-internal" />
                                <Label htmlFor="r-internal">Internal</Label>
                            </div>
                        </RadioGroup>
                        <Button onClick={handleApplyComplementary} className="w-full">Mark as Complementary</Button>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}

interface OrderCardProps {
    order: Order;
    workflow?: 'cashier' | 'kds';
    onUpdateStatus: (orderId: string, newStatus: OrderStatus, reason?: string) => void;
    children?: React.ReactNode;
}

export function OrderCard({ order, workflow = 'cashier', onUpdateStatus, children }: OrderCardProps) {
  const { settings } = useSettings();
  const { user } = useAuth();
  
  const handleUpdateStatus = (newStatus: OrderStatus) => {
    onUpdateStatus(order.id, newStatus);
  };

  const handleCancelOrder = useCallback((orderId: string, reason: string) => {
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
    
    setTimeout(() => {
        if (document.body.contains(printContainer)) {
            document.body.removeChild(printContainer);
        }
        document.body.classList.remove('printing-active');
    }, 500);
  };
  
  const StatusIcon = statusConfig[order.status]?.icon || Loader;
  const isModifiable = user?.role === 'admin' || user?.role === 'root';
  const orderDate = useMemo(() => new Date(order.orderDate), [order.orderDate]);
  const table = useMemo(() => settings.tables.find(t => t.id === order.tableId), [settings.tables, order.tableId]);
  const floor = useMemo(() => settings.floors.find(f => f.id === order.floorId), [settings.floors, order.floorId]);


  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
            <CardTitle className="font-headline text-xl">Order #{order.orderNumber}</CardTitle>
            <div className="flex items-center gap-1">
                {children}
                <Button variant="ghost" size="icon" className="h-8 w-8 print-hidden" onClick={handlePrint}><Printer className="h-4 w-4" /></Button>
                <Badge variant="secondary">{order.orderType === 'Dine-In' ? <Utensils className="mr-1 h-4 w-4"/> : <ShoppingBag className="mr-1 h-4 w-4" />} {order.orderType}</Badge>
            </div>
        </div>
        <div className="flex justify-between items-center text-sm text-muted-foreground">
             <span>{formatDistanceToNow(orderDate, { addSuffix: true })}</span>
             {order.orderType === 'Dine-In' && table && floor && (
                <span className="font-semibold">{floor.name} - {table.name}</span>
            )}
        </div>
        {order.status === 'Cancelled' && order.cancellationReason && (
            <CardDescription className="text-red-500 !mt-1">Reason: {order.cancellationReason}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex-grow">
        <ScrollArea className="h-40 pr-4">
            <div className="space-y-3">
            {order.items?.map((item) => (
                <div key={item.id} className="text-sm">
                  <div className="flex justify-between items-center">
                    <div><span className="font-semibold">{item.quantity}x</span> {item.name}</div>
                    <div className="font-mono">RS {Math.round(item.baseItemPrice * item.quantity)}</div>
                  </div>
                   {item.selectedAddons && item.selectedAddons.length > 0 && (
                        <div className="pl-4 text-xs text-muted-foreground">
                            {item.selectedAddons.map(addon => (
                                <div key={addon.name} className="flex justify-between">
                                  <span>+ {addon.name}</span>
                                  <span>RS {Math.round(addon.price * item.quantity)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
            </div>
        </ScrollArea>
        
        {order.instructions && (
            <div className="mt-4 border-t pt-4">
                <div className="text-sm italic text-muted-foreground flex items-start gap-2">
                    <MessageSquareText className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>"{order.instructions}"</span>
                </div>
            </div>
        )}

        <Separator className="my-4" />

        { (order.isComplementary || order.discountAmount) && order.originalTotalAmount && (
            <div className="text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>RS {Math.round(order.subtotal)}</span></div>
                 <div className="flex justify-between"><span>Tax</span><span>RS {Math.round(order.taxAmount)}</span></div>
                <div className="flex justify-between"><span>Original Total</span><span className="line-through">RS {Math.round(order.originalTotalAmount)}</span></div>
                {order.isComplementary ? (
                    <div className="flex justify-between text-green-600 font-semibold"><span>Complementary</span><span>-RS {order.discountAmount ? Math.round(order.discountAmount) : 0}</span></div>
                ) : (
                    <div className="flex justify-between"><span>Discount ({order.discountType === 'percentage' ? `${order.discountValue}%` : 'RS'})</span><span>-RS {order.discountAmount ? Math.round(order.discountAmount) : 0}</span></div>
                )}
            </div>
        )}

        <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t">
            <span>Total</span>
            <span>RS {Math.round(order.totalAmount)}</span>
        </div>
         {order.paymentMethod && (
            <div className="flex items-center mt-2 text-sm text-muted-foreground">
                {order.isComplementary ? <Gift className="mr-2 h-4 w-4" /> : <CreditCard className="mr-2 h-4 w-4" />}
                <span>{order.isComplementary ? `Complementary (${order.complementaryReason})` : `Paid with ${order.paymentMethod}`}</span>
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
                {order.status === 'Pending' && <Button onClick={() => handleUpdateStatus('Preparing')} size="sm" className="w-full"><CookingPot className="mr-2 h-4 w-4" /> Accept & Prepare</Button>}
                {order.status === 'Preparing' && <Button onClick={() => handleUpdateStatus('Ready')} size="sm" className="w-full bg-yellow-500 hover:bg-yellow-600 text-black"><Check className="mr-2 h-4 w-4" /> Mark as Ready</Button>}
             </div>
         )}
         {workflow === 'cashier' && (
            <div className="grid grid-cols-1 gap-2 w-full">
                {order.status === 'Pending' && <Button onClick={() => handleUpdateStatus('Preparing')} size="sm" className="w-full"><CookingPot className="mr-2 h-4 w-4" /> Accept & Prepare</Button>}
                 {order.status === 'Preparing' && <Button onClick={() => handleUpdateStatus('Ready')} size="sm" className="w-full bg-yellow-500 hover:bg-yellow-600 text-black"><Check className="mr-2 h-4 w-4" /> Mark as Ready</Button>}
                {order.status === 'Ready' && <Button onClick={() => handleUpdateStatus('Completed')} size="sm" className="w-full bg-green-500 hover:bg-green-600"><CheckCircle className="mr-2 h-4 w-4" /> Mark as Completed</Button>}
                 {(order.status === 'Pending' || order.status === 'Preparing' || order.status === 'Ready') && (
                     <div className="grid grid-cols-2 gap-2">
                        <CancellationDialog orderId={order.id} onConfirm={handleCancelOrder} />
                        {isModifiable && <OrderModificationDialog order={order} />}
                     </div>
                 )}
                 {order.status === 'Completed' && isModifiable && (<div className="grid grid-cols-1 gap-2"><OrderModificationDialog order={order} /></div>)}
             </div>
         )}
      </CardFooter>
      <div className="hidden"><div id={`printable-receipt-${order.id}`}><OrderReceipt order={order} /></div></div>
    </Card>
  );
}

const OrderItemSkeleton = () => (
    <div className="flex justify-between items-center text-sm">
        <div className="flex items-center gap-2"><Skeleton className="h-4 w-4 rounded-full" /><Skeleton className="h-4 w-24" /></div>
        <Skeleton className="h-4 w-12" />
    </div>
);

OrderCard.Skeleton = function OrderCardSkeleton() {
    return (
      <Card>
        <CardHeader>
            <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-6 w-12" />
            </div>
            <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3"><OrderItemSkeleton /><OrderItemSkeleton /></div>
          <Separator className="my-4" />
          <div className="flex justify-between"><Skeleton className="h-6 w-16" /><Skeleton className="h-6 w-20" /></div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></CardFooter>
      </Card>
    );
  };

    