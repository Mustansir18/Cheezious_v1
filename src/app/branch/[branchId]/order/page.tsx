

'use client';

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
  const { items, cartTotal, branchId, orderType, floorId, tableId, deliveryMode, customerName, customerPhone, customerAddress, clearCart, closeCart, setIsCartOpen } = useCart();
  const { addOrder } = useOrders();
  const { settings } = useSettings();
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

  const displayedItems = useMemo(() => {
    const mainItems = items.filter(item => !item.isDealComponent);
    return mainItems.map(mainItem => {
        if (mainItem.categoryId === 'C-00001') { // It's a deal
            const components = items.filter(i => i.isDealComponent && i.parentDealCartItemId === mainItem.cartItemId);
            const aggregatedComponents = components.reduce((acc, comp) => {
                const existing = acc.find(a => a.name === comp.name);
                if (existing) {
                    existing.quantity += 1;
                } else {
                    acc.push({ name: comp.name, quantity: 1 });
                }
                return acc;
            }, [] as { name: string; quantity: number }[]);
            
            return { ...mainItem, aggregatedComponents };
        }
        return mainItem;
    });
  }, [items]);


  if (!branchId || !orderType) {
    return (
        <div className="w-full h-[calc(100vh-4rem)] flex flex-col items-center justify-center text-center px-4">
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

    const orderItems: OrderItem[] = items.map((cartItem: CartItem): OrderItem => {
        const menuItem = menu.items.find(mi => mi.id === cartItem.id);
        const category = menu.categories.find(c => c.id === menuItem?.categoryId);
        return {
            id: cartItem.cartItemId, // Use the unique cartItemId as the OrderItem ID
            orderId: orderId,
            menuItemId: cartItem.id,
            name: cartItem.name,
            quantity: cartItem.quantity,
            itemPrice: cartItem.price,
            baseItemPrice: cartItem.basePrice,
            selectedAddons: cartItem.selectedAddons.map(a => ({ name: a.name, price: a.price, quantity: a.quantity })),
            selectedVariant: cartItem.selectedVariant ? { name: cartItem.selectedVariant.name, price: cartItem.selectedVariant.price } : undefined,
            stationId: category?.stationId,
            isPrepared: !category?.stationId,
            isDealComponent: !!cartItem.isDealComponent,
            parentDealCartItemId: cartItem.parentDealCartItemId,
            instructions: cartItem.instructions,
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
        deliveryMode: orderType === 'Delivery' ? deliveryMode : undefined,
        customerName: orderType === 'Delivery' ? customerName || undefined : undefined,
        customerPhone: orderType === 'Delivery' ? customerPhone || undefined : undefined,
        customerAddress: orderType === 'Delivery' ? customerAddress || undefined : undefined,
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
        deliveryMode: newOrder.deliveryMode,
        ...(table && { tableName: table.name }),
        ...(floor && { floorName: floor.name }),
    };

    sessionStorage.setItem('placedOrder', JSON.stringify(placedOrder));
    clearCart();
    closeCart();
    router.push("/order-status");
  };

  const { menu } = useMenu();

  return (
    <div className="w-full px-4 py-12 lg:px-8">
      <Card className="shadow-xl max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="font-headline text-3xl text-center">Confirm Your Order</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-lg border p-4">
                <p><strong>Branch:</strong> {branch?.name}</p>
                <p><strong>Order Type:</strong> {orderType}</p>
                {orderType === 'Dine-In' && table && (<p><strong>Table:</strong> {table.name} ({floor?.name})</p>)}
                {orderType === 'Delivery' && deliveryMode && (
                    <>
                        <p><strong>Delivery via:</strong> {deliveryMode}</p>
                        {customerName && <p><strong>Customer:</strong> {customerName} ({customerPhone})</p>}
                        {customerAddress && <p><strong>Address:</strong> {customerAddress}</p>}
                    </>
                )}
            </div>

            {displayedItems.map((item, index) => (
              <div key={item.cartItemId}>
                <div className="flex items-start gap-4 py-2">
                  <Image
                    src={item.imageUrl || FALLBACK_IMAGE_URL}
                    alt={item.name}
                    width={48}
                    height={48}
                    className="rounded-md object-contain"
                  />
                  <div className="flex-grow">
                    <p className="font-semibold text-left">{item.quantity}x {item.name} {item.selectedVariant ? `(${item.selectedVariant.name})` : ''}</p>
                     
                     {/* For regular items with addons */}
                    {item.selectedAddons.length > 0 && (
                        <div className="pl-4 text-sm text-muted-foreground text-left border-l-2 ml-2 mt-1">
                            {item.selectedAddons.map(addon => (<p key={addon.id}>+ {addon.quantity}x {addon.name}</p>))}
                        </div>
                    )}
                    
                    {/* For deals/bundles */}
                    {(item as any).aggregatedComponents && (
                        <div className="pl-4 text-xs text-muted-foreground border-l-2 ml-2 mt-1">
                            <p className="font-semibold">Includes:</p>
                            {(item as any).aggregatedComponents.map((component: any) => (
                                <p key={component.name}>- {component.quantity}x {component.name}</p>
                            ))}
                        </div>
                    )}

                     {item.instructions && (
                        <p className="text-sm text-blue-600 italic text-left mt-1">"{item.instructions}"</p>
                     )}
                    <p className="text-sm text-muted-foreground text-left mt-1">
                      Item price: RS {Math.round(item.price)}
                    </p>
                  </div>
                  <p className="font-semibold shrink-0">
                    RS {Math.round(item.quantity * item.price)}
                  </p>
                </div>
                {index < displayedItems.length - 1 && <Separator />}
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
