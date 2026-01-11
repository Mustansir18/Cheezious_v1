
"use client";

import type { Order, OrderItem, OrderStatus, CartItem, MenuItem, SelectedAddon } from "@/lib/types";
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
import { Utensils, ShoppingBag, Check, CheckCircle, CookingPot, Loader, CreditCard, Printer, Info, XCircle, Tag, Gift, MessageSquareText, CheckCheck, PlusCircle, Bike, Search } from "lucide-react";
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
import { useMenu } from "@/context/MenuContext";
import { AddToCartDialog } from "../menu/MenuItemCard";

const statusConfig = {
    Pending: { icon: Loader, color: "text-gray-500", label: "Pending" },
    Preparing: { icon: CookingPot, color: "text-blue-500", label: "Preparing" },
    "Partial Ready": { icon: Check, color: "text-orange-500", label: "Partially Ready" },
    Ready: { icon: CheckCheck, color: "text-yellow-500", label: "Ready for Pickup" },
    Completed: { icon: CheckCircle, color: "text-green-500", label: "Completed" },
    Cancelled: { icon: XCircle, color: "text-red-500", label: "Cancelled" },
};

function AddItemsToOrderDialog({ order }: { order: Order }) {
    const { menu } = useMenu();
    const { addItemsToOrder } = useOrders();
    const [isDialogOpen, setDialogOpen] = useState(false);
    const [itemsToAdd, setItemsToAdd] = useState<CartItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    const handleAddItem = (options: { selectedAddons: any[], itemQuantity: number, instructions: string, selectedVariant?: any }, item: MenuItem) => {
        const cartItemId = crypto.randomUUID();
        
        const addonPrice = options.selectedAddons.reduce((sum, addonData) => sum + (addonData.selectedPrice * addonData.quantity), 0);
        const basePrice = options.selectedVariant ? options.selectedVariant.price : item.price;
        const finalPrice = basePrice + addonPrice;

        const newItem: CartItem = {
            ...item,
            cartItemId,
            quantity: options.itemQuantity,
            price: finalPrice,
            basePrice: basePrice,
            selectedAddons: options.selectedAddons,
            selectedVariant: options.selectedVariant,
            instructions: options.instructions,
        };
        setItemsToAdd(prev => [...prev, newItem]);
    };
    
    const handleConfirm = () => {
        if (itemsToAdd.length > 0) {
            addItemsToOrder(order.id, itemsToAdd);
            setDialogOpen(false);
            setItemsToAdd([]);
            setSearchTerm('');
        }
    };
    
    const filteredMenuItems = useMemo(() => {
        if (!searchTerm) {
            return menu.items.filter(item => item.categoryId !== 'C-00001'); // Exclude deals from being added
        }
        return menu.items.filter(item => 
            item.categoryId !== 'C-00001' && item.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [menu.items, searchTerm]);


    return (
         <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
                <Button variant="secondary" size="sm" className="w-full">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Items
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Add Items to Order #{order.orderNumber}</DialogTitle>
                    <DialogDescription>Select items to add to this existing order. The order total will be recalculated.</DialogDescription>
                </DialogHeader>
                <div className="flex-grow grid grid-cols-2 gap-6 overflow-hidden">
                    <div className="flex flex-col gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search available items..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <ScrollArea className="border rounded-lg p-4 flex-grow">
                            <div className="space-y-2">
                                <h4 className="font-semibold">Available Items</h4>
                                {filteredMenuItems.map(item => (
                                    <div key={item.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                                        <span>{item.name}</span>
                                        <AddToCartDialog 
                                            item={item} 
                                            onAddToCart={(options) => handleAddItem(options, item)} 
                                            triggerButton={<Button size="sm" variant="outline">Add</Button>}
                                        />
                                    </div>
                                ))}
                                {filteredMenuItems.length === 0 && (
                                    <p className="text-sm text-muted-foreground text-center py-4">No items match your search.</p>
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                    <div className="border rounded-lg p-4 flex flex-col">
                        <h4 className="font-semibold mb-2">Items to Add</h4>
                        {itemsToAdd.length === 0 ? (
                            <div className="flex-grow flex items-center justify-center text-muted-foreground">
                                No items selected yet.
                            </div>
                        ) : (
                            <ScrollArea className="flex-grow">
                                <div className="space-y-2">
                                {itemsToAdd.map(item => (
                                    <div key={item.cartItemId} className="text-sm">
                                        <div className="flex justify-between font-semibold">
                                            <span>{item.quantity}x {item.name}</span>
                                            <span>RS {Math.round(item.price * item.quantity)}</span>
                                        </div>
                                         {item.selectedAddons.length > 0 && (
                                            <div className="pl-4 text-xs text-muted-foreground">
                                                {item.selectedAddons.map(addon => <p key={addon.id}>+ {addon.quantity}x {addon.name}</p>)}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                </div>
                            </ScrollArea>
                        )}
                         <div className="mt-4 border-t pt-4">
                            <div className="flex justify-between font-bold text-lg">
                                <span>New Items Total:</span>
                                <span>RS {Math.round(itemsToAdd.reduce((sum, item) => sum + item.price * item.quantity, 0))}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="secondary" onClick={() => { setDialogOpen(false); setItemsToAdd([]); setSearchTerm(''); }}>Cancel</Button>
                    <Button onClick={handleConfirm} disabled={itemsToAdd.length === 0}>Add {itemsToAdd.length} Item(s) to Order</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

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
    isMutable?: boolean;
}

export function OrderCard({ order, workflow = 'cashier', onUpdateStatus, children, isMutable = true }: OrderCardProps) {
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
  const isModifiableByUser = user?.role === 'root' || user?.role === 'admin' || user?.role === 'cashier';
  
  const orderDate = useMemo(() => new Date(order.orderDate), [order.orderDate]);
  
  const table = useMemo(() => {
    if (order.orderType !== 'Dine-In' || !order.tableId) return null;
    return settings.tables.find(t => t.id === order.tableId);
  }, [settings.tables, order.tableId, order.orderType]);
  
  const floor = useMemo(() => {
    if (!table || !table.floorId) return null;
    return settings.floors.find(f => f.id === table.floorId);
  }, [settings.floors, table]);

  const visibleItems = useMemo(() => {
    const mainItems = order.items.filter(i => !i.isDealComponent);
  
    return mainItems.map(main => {
      const components = order.items.filter(
        c => c.isDealComponent && c.parentDealCartItemId === main.id
      );
  
      const aggregated = components.reduce((acc, c) => {
        const key = c.menuItemId;
        if (!acc[key]) {
          acc[key] = { name: c.name, quantity: 0 };
        }
        acc[key].quantity += c.quantity;
        return acc;
      }, {} as Record<string, { name: string; quantity: number }>);
  
      return {
        ...main,
        aggregatedDealComponents: Object.values(aggregated),
      };
    });
  }, [order.items]);


const getOrderTypeIcon = () => {
    switch (order.orderType) {
        case 'Dine-In': return Utensils;
        case 'Take-Away': return ShoppingBag;
        case 'Delivery': return Bike;
        default: return Info;
    }
};

const OrderTypeIcon = getOrderTypeIcon();

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div className="flex items-start justify-between">
            <CardTitle className="font-headline text-xl">Order #{order.orderNumber}</CardTitle>
            <div className="flex items-center gap-1">
                {children}
                <Button variant="ghost" size="icon" className="h-8 w-8 print-hidden" onClick={handlePrint}><Printer className="h-4 w-4" /></Button>
                 <div className="flex flex-col items-center">
                    <Badge variant="secondary">
                        <OrderTypeIcon className="mr-1 h-4 w-4"/>
                        {order.orderType}
                        {order.orderType === 'Dine-In' && table && (
                            <span className="font-bold ml-2">{table.name}</span>
                        )}
                    </Badge>
                </div>
            </div>
        </div>
        <div className="text-sm text-muted-foreground">
            <div>{formatDistanceToNow(orderDate, { addSuffix: true })}</div>
        </div>
        {order.status === 'Cancelled' && order.cancellationReason && (
            <CardDescription className="text-red-500 !mt-1">Reason: {order.cancellationReason}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex-grow">
        <ScrollArea className="h-40 pr-4">
            <div className="space-y-3">
              {visibleItems.map((item) => (
                <div key={item.id} className="text-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-semibold">{item.quantity}x</span> {item.name} {item.selectedVariant ? `(${item.selectedVariant.name})` : ''}
                    </div>
                    <div className="font-mono text-right">RS {Math.round(item.itemPrice * item.quantity)}</div>
                  </div>
                   {item.selectedAddons && item.selectedAddons.length > 0 && (
                        <div className="pl-4 text-xs text-muted-foreground">
                            {item.selectedAddons.map(addon => (
                                <div key={addon.name} className="flex justify-between">
                                  <span>+ {addon.quantity}x {addon.name}</span>
                                  <span>RS {Math.round(addon.price * addon.quantity * item.quantity)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    {item.aggregatedDealComponents && item.aggregatedDealComponents.length > 0 && (
                        <div className="pl-4 text-xs text-muted-foreground border-l-2 ml-1 mt-1 pt-1 space-y-0.5">
                            <p className="font-semibold text-gray-500">Includes:</p>
                             {item.aggregatedDealComponents.map((comp: any) => (
                                <div key={comp.name} className="flex justify-between items-center">
                                  <span>- {comp.quantity}x {comp.name}</span>
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

        <div className="space-y-1 text-sm">
            <div className="flex justify-between">
                <span>Subtotal</span>
                <span>RS {Math.round(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
                <span>Tax ({(order.taxRate * 100).toFixed(0)}%)</span>
                <span>RS {Math.round(order.taxAmount)}</span>
            </div>
            {order.discountAmount > 0 && (
                 <div className="flex justify-between text-destructive">
                    <span>Discount</span>
                    <span>-RS {Math.round(order.discountAmount)}</span>
                </div>
            )}
        </div>


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
         {workflow === 'cashier' && isMutable && (
            <div className="grid grid-cols-1 gap-2 w-full">
                {order.status === 'Pending' && <Button onClick={() => handleUpdateStatus('Preparing')} size="sm" className="w-full"><CookingPot className="mr-2 h-4 w-4" /> Accept & Prepare</Button>}
                 {order.status === 'Preparing' && <Button onClick={() => handleUpdateStatus('Ready')} size="sm" className="w-full bg-yellow-500 hover:bg-yellow-600 text-black"><Check className="mr-2 h-4 w-4" /> Mark as Ready</Button>}
                {order.status === 'Ready' && <Button onClick={() => handleUpdateStatus('Completed')} size="sm" className="w-full bg-green-500 hover:bg-green-600"><CheckCircle className="mr-2 h-4 w-4" /> Mark as Completed</Button>}
                 {(order.status === 'Pending') && isModifiableByUser && (
                     <div className="grid grid-cols-2 gap-2">
                        <CancellationDialog orderId={order.id} onConfirm={handleCancelOrder} />
                        <OrderModificationDialog order={order} />
                     </div>
                 )}
                 {(order.status === 'Preparing' || order.status === 'Ready' || order.status === 'Partial Ready') && isModifiableByUser && (
                     <div className="grid grid-cols-2 gap-2">
                        <AddItemsToOrderDialog order={order} />
                        <OrderModificationDialog order={order} />
                    </div>
                 )}
            </div>
         )}
         {order.status === 'Completed' && isModifiableByUser && isMutable && (
             <div className="grid grid-cols-1 gap-2"><OrderModificationDialog order={order} /></div>
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
