

"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import type { PlacedOrder, Order, OrderItem, CartItem } from "@/lib/types";
import { syncOrderToExternalSystem } from "@/ai/flows/sync-order-flow";
import { useOrders } from "@/context/OrderContext";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/context/SettingsContext";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, MessageSquarePlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { useMenu } from "@/context/MenuContext";

const FALLBACK_IMAGE_URL = "https://picsum.photos/seed/placeholder/400/300";

export default function OrderConfirmationPage() {
  const { items, cartTotal, branchId, orderType, floorId, tableId, clearCart, closeCart, setIsCartOpen } = useCart();
  const { addOrder } = useOrders();
  const { settings } = useSettings();
  const { menu } = useMenu();
  const router = useRouter();
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [instructions, setInstructions] = useState('');

  useEffect(() => {
    setIsCartOpen(false);
  }, [setIsCartOpen]);

  const branch = useMemo(() => settings.branches.find((b) => b.id === branchId), [branchId, settings.branches]);
  const table = useMemo(() => settings.tables.find(t => t.id === tableId), [settings.tables, tableId]);
  const floor = useMemo(() => settings.floors.find(f => f.id === floorId), [settings.floors, floorId]);

  const selectedPaymentMethod = useMemo(() => settings.paymentMethods.find(pm => pm.name === paymentMethod), [paymentMethod, settings.paymentMethods]);
  const taxRate = useMemo(() => selectedPaymentMethod?.taxRate || 0, [selectedPaymentMethod]);
  const taxAmount = useMemo(() => cartTotal * taxRate, [cartTotal, taxRate]);
  const grandTotal = useMemo(() => cartTotal + taxAmount, [cartTotal, taxAmount]);


  if (!branchId || !orderType) {
    return (
        <div className="container mx-auto flex h-[calc(100vh-4rem)] flex-col items-center justify-center text-center">
            <h1 className="font-headline text-2xl font-bold">Something went wrong</h1>
            <p className="mt-2 text-muted-foreground">Please start your order again.</p>
            <Button asChild className="mt-4"><Link href="/">Go Home</Link></Button>
        </div>
    );
  }
  
  const handleConfirmOrder = async () => {
    if (!branchId || !orderType || !branch) return;
    if (!paymentMethod) {
        toast({
            variant: "destructive",
            title: "Payment Method Required",
            description: "Please select a payment method to continue.",
        });
        return;
    }

    const orderId = crypto.randomUUID();
    const orderNumber = `${branch.orderPrefix}-${Date.now().toString().slice(-6)}`;

    const orderItems: OrderItem[] = items.map((item: CartItem) => {
        const menuItem = menu.items.find(mi => mi.id === item.id);
        const category = menu.categories.find(c => c.id === menuItem?.categoryId);
        return {
            id: crypto.randomUUID(),
            orderId: orderId,
            menuItemId: item.id,
            name: item.name,
            quantity: item.quantity,
            itemPrice: item.price,
            baseItemPrice: item.basePrice,
            selectedAddons: item.selectedAddons.map(a => ({ name: a.name, price: a.price, quantity: a.quantity })),
            selectedVariant: item.selectedVariant ? { name: item.selectedVariant.name, price: item.selectedVariant.price } : undefined,
            stationId: category?.stationId,
            isPrepared: !category?.stationId,
            dealName: item.dealName,
            instructions: item.instructions,
        };
    });

    const newOrder: Order = {
        id: orderId,
        orderNumber,
        branchId,
        orderDate: new Date().toISOString(),
        orderType,
        status: "Pending",
        totalAmount: grandTotal,
        subtotal: cartTotal,
        taxRate: taxRate,
        taxAmount: taxAmount,
        items: orderItems,
        paymentMethod,
        instructions,
        floorId: orderType === 'Dine-In' ? floorId : undefined,
        tableId: orderType === 'Dine-In' ? tableId : undefined,
    };
    
    syncOrderToExternalSystem({
        ...newOrder,
        items: newOrder.items.map(item => ({
            menuItemId: item.menuItemId,
            name: item.name,
            quantity: item.quantity,
            itemPrice: item.itemPrice,
            baseItemPrice: item.baseItemPrice,
            selectedAddons: item.selectedAddons,
        }))
    }).then(result => {
        if (!result.success) {
            toast({
                variant: "destructive",
                title: "Sync Failed",
                description: "Could not sync the order with the external system. Please check the logs.",
            });
        }
    });

    addOrder(newOrder);
    
    const placedOrder: PlacedOrder = {
        orderId: newOrder.id,
        orderNumber: newOrder.orderNumber,
        total: grandTotal,
        branchName: branch.name,
        orderType,
        ...(table && { tableName: table.name }),
        ...(floor && { floorName: floor.name }),
    };

    sessionStorage.setItem('placedOrder', JSON.stringify(placedOrder));
    clearCart();
    closeCart();
    router.push("/order-status");
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-12">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline text-3xl text-center">Confirm Your Order</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-lg border p-4">
                <p><strong>Branch:</strong> {branch?.name}</p>
                <p><strong>Order Type:</strong> {orderType}</p>
                {orderType === 'Dine-In' && table && (<p><strong>Table:</strong> {table.name} ({floor?.name})</p>)}
            </div>

            {items.map((item, index) => (
              <div key={item.cartItemId}>
                <div className="flex items-start gap-4 py-2">
                  <Image
                    src={item.imageUrl || FALLBACK_IMAGE_URL}
                    alt={item.name}
                    width={48}
                    height={48}
                    className="rounded-md object-cover"
                  />
                  <div className="flex-grow">
                    <p className="font-semibold text-left">{item.quantity}x {item.name} {item.selectedVariant ? `(${item.selectedVariant.name})` : ''}</p>
                    <div className="text-sm text-muted-foreground text-left">
                        {item.selectedAddons.map(addon => (<p key={addon.id}>+ {addon.quantity}x {addon.name}</p>))}
                    </div>
                     {item.instructions && (
                        <p className="text-sm text-blue-600 italic text-left">"{item.instructions}"</p>
                     )}
                    <p className="text-sm text-muted-foreground text-left">
                      Item price: RS {Math.round(item.price)}
                    </p>
                  </div>
                  <p className="font-semibold shrink-0">
                    RS {Math.round(item.quantity * item.price)}
                  </p>
                </div>
                {index < items.length - 1 && <Separator />}
              </div>
            ))}
            <Separator />
            
            <div className="space-y-2">
                <Label htmlFor="instructions" className="font-semibold flex items-center"><MessageSquarePlus className="mr-2 h-5 w-5"/>Special Instructions (for the whole order)</Label>
                <Textarea 
                    id="instructions"
                    placeholder="e.g., provide extra cutlery..."
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                />
                 <p className="text-xs text-muted-foreground pt-1">Any special requests for the entire order can be added here. For item-specific requests, go back and edit the item.</p>
            </div>

            <div className={cn("p-4 rounded-lg bg-muted/50", !paymentMethod && "animate-pulse")}>
                <div className="space-y-2">
                    <Label htmlFor="payment-method" className="font-semibold flex items-center"><CreditCard className="mr-2 h-5 w-5"/>Payment Method</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                        <SelectTrigger id="payment-method"><SelectValue placeholder="Select a payment method" /></SelectTrigger>
                        <SelectContent>{settings.paymentMethods.map(method => (<SelectItem key={method.id} value={method.name}>{method.name}</SelectItem>))}</SelectContent>
                    </Select>
                     {!paymentMethod && <p className="text-sm text-foreground/80 pt-1">Please select a payment method to see the final total.</p>}
                </div>
            </div>

            <div className="space-y-1 pt-2">
                <div className="flex justify-between"><span>Subtotal</span><span>RS {Math.round(cartTotal)}</span></div>
                {paymentMethod && taxAmount > 0 && (<div className="flex justify-between text-sm text-muted-foreground"><span>Tax ({(taxRate * 100).toFixed(0)}%)</span><span>RS {Math.round(taxAmount)}</span></div>)}
                <div className="flex justify-between pt-2 text-xl font-bold border-t"><span>Grand Total</span><span>RS {paymentMethod ? Math.round(grandTotal) : Math.round(cartTotal)}</span></div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col-reverse gap-4 sm:flex-row sm:justify-end sm:gap-2">
          <Button variant="outline" asChild><Link href={`/branch/${branchId}/menu?mode=${orderType}&floorId=${floorId}&tableId=${tableId}`}>Go Back to Menu</Link></Button>
          <Button
            onClick={handleConfirmOrder}
            className={cn("w-full sm:w-auto font-bold bg-primary text-primary-foreground hover:bg-primary/90", !!paymentMethod && "animate-blink")}
            size="lg"
            disabled={items.length === 0}
          >
            Place Order
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
