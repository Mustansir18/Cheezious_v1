
"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import type { PlacedOrder, Order, OrderItem } from "@/lib/types";
import { syncOrderToExternalSystem } from "@/ai/flows/sync-order-flow";
import { useOrders } from "@/context/OrderContext";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/context/SettingsContext";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

const FALLBACK_IMAGE_URL = "https://picsum.photos/seed/placeholder/400/300";

export default function OrderConfirmationPage() {
  const { items, cartTotal, branchId, orderType, floorId, tableId, clearCart, closeCart, setIsCartOpen } = useCart();
  const { addOrder } = useOrders();
  const { settings } = useSettings();
  const router = useRouter();
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState<string>('');

  useEffect(() => {
    // When navigating to this page, ensure the cart sheet is closed.
    setIsCartOpen(false);
  }, [setIsCartOpen]);


  const taxRates: { [key: string]: number } = {
    'Cash': 0.16, // 16%
    'Credit/Debit Card': 0.05, // 5%
  };

  const branch = useMemo(() => settings.branches.find((b) => b.id === branchId), [branchId, settings.branches]);
  const table = useMemo(() => settings.tables.find(t => t.id === tableId), [settings.tables, tableId]);
  const floor = useMemo(() => settings.floors.find(f => f.id === floorId), [settings.floors, floorId]);


  const taxRate = useMemo(() => {
    return taxRates[paymentMethod] || 0;
  }, [paymentMethod]);

  const taxAmount = useMemo(() => cartTotal * taxRate, [cartTotal, taxRate]);
  const grandTotal = useMemo(() => cartTotal + taxAmount, [cartTotal, taxAmount]);


  if (!branchId || !orderType) {
    return (
        <div className="container mx-auto flex h-[calc(100vh-4rem)] flex-col items-center justify-center text-center">
            <h1 className="font-headline text-2xl font-bold">Something went wrong</h1>
            <p className="mt-2 text-muted-foreground">Please start your order again.</p>
            <Button asChild className="mt-4">
                <Link href="/">Go Home</Link>
            </Button>
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

    const orderItems: OrderItem[] = items.map(item => ({
        id: crypto.randomUUID(),
        orderId: orderId,
        menuItemId: item.id,
        name: item.name,
        quantity: item.quantity,
        itemPrice: item.price
    }));

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
        ...(orderType === 'Dine-In' && { floorId, tableId }),
    };
    
    // Asynchronously sync the order to the external system.
    syncOrderToExternalSystem({
        ...newOrder,
        items: newOrder.items.map(item => ({
            menuItemId: item.menuItemId,
            name: item.name,
            quantity: item.quantity,
            itemPrice: item.itemPrice
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
                {orderType === 'Dine-In' && table && (
                    <p><strong>Table:</strong> {table.name} ({floor?.name})</p>
                )}
            </div>

            {items.map((item, index) => (
              <div key={item.id}>
                <div className="flex items-center gap-4 py-2">
                  <Image
                    src={item.imageUrl || FALLBACK_IMAGE_URL}
                    alt={item.name}
                    width={48}
                    height={48}
                    className="rounded-md object-cover"
                  />
                  <div className="flex-grow">
                    <p className="font-semibold text-left">{item.name}</p>
                    <p className="text-sm text-muted-foreground text-left">
                      {item.quantity} x RS {item.price.toFixed(2)}
                    </p>
                  </div>
                  <p className="font-semibold shrink-0">
                    RS {(item.quantity * item.price).toFixed(2)}
                  </p>
                </div>
                {index < items.length - 1 && <Separator />}
              </div>
            ))}
            <Separator />
            
            <div className={cn("p-4 rounded-lg bg-muted/50", !paymentMethod && "animate-blink")}>
                <div className="space-y-2">
                    <Label htmlFor="payment-method" className="font-semibold flex items-center"><CreditCard className="mr-2 h-5 w-5"/>Payment Method</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                        <SelectTrigger id="payment-method">
                            <SelectValue placeholder="Select a payment method" />
                        </SelectTrigger>
                        <SelectContent>
                            {settings.paymentMethods.map(method => (
                                <SelectItem key={method.id} value={method.name}>
                                    {method.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                     {!paymentMethod && <p className="text-xs text-muted-foreground pt-1">Please select a payment method to see the final total.</p>}
                </div>
            </div>


            <div className="space-y-1 pt-2">
                <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>RS {cartTotal.toFixed(2)}</span>
                </div>
                {paymentMethod && taxAmount > 0 && (
                    <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Tax ({(taxRate * 100).toFixed(0)}%)</span>
                        <span>RS {taxAmount.toFixed(2)}</span>
                    </div>
                )}
                <div className="flex justify-between pt-2 text-xl font-bold border-t">
                    <span>Grand Total</span>
                    <span>RS {paymentMethod ? grandTotal.toFixed(2) : cartTotal.toFixed(2)}</span>
                </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col-reverse gap-4 sm:flex-row sm:justify-end sm:gap-2">
          <Button variant="outline" asChild>
            <Link href={`/branch/${branchId}/menu?mode=${orderType}&floorId=${floorId}&tableId=${tableId}`}>Cancel</Link>
          </Button>
          <Button
            onClick={handleConfirmOrder}
            className={cn(
              "w-full sm:w-auto font-bold",
              paymentMethod && "animate-blink"
            )}
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
