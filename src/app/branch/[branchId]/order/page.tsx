
"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import Link from "next/link";
import { branches } from "@/lib/data";
import type { PlacedOrder } from "@/lib/types";
import { useFirebase, errorEmitter, FirestorePermissionError } from "@/firebase";
import { collection, serverTimestamp, addDoc, DocumentReference } from "firebase/firestore";
import { syncOrderToExternalSystem } from "@/ai/flows/sync-order-flow";

export default function OrderConfirmationPage() {
  const { items, cartTotal, branchId, orderType, clearCart } = useCart();
  const router = useRouter();
  const { firestore } = useFirebase();

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
  
  const branch = branches.find((b) => b.id === branchId);

  const handleConfirmOrder = async () => {
    if (!firestore || !branchId || !orderType) return;

    const orderNumber = `${branchId.slice(0,3).toUpperCase()}-${Date.now().toString().slice(-6)}`;
    
    const newOrder = {
        branchId,
        orderDate: serverTimestamp(),
        orderType,
        status: "Pending",
        totalAmount: cartTotal,
        orderNumber,
    };

    const ordersCollection = collection(firestore, "orders");
    
    try {
        const docRef = await addDoc(ordersCollection, newOrder).catch(async (error) => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: 'orders',
                operation: 'create',
                requestResourceData: newOrder
            }));
            // Here, returning null and checking for it is a clean way to stop execution.
            return null;
        });

        // Ensure docRef is not null before proceeding
        if (!docRef) {
          // The error has been emitted, so we just stop here.
          return; 
        }

        const orderItemsCollection = collection(firestore, `orders/${docRef.id}/order_items`);
        
        const itemPromises = items.map((item) => {
            const orderItem = {
                orderId: docRef.id,
                menuItemId: item.id,
                quantity: item.quantity,
                itemPrice: item.price,
                name: item.name,
            };
            return addDoc(orderItemsCollection, orderItem).catch(async (error) => {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: `orders/${docRef.id}/order_items`,
                    operation: 'create',
                    requestResourceData: orderItem
                }));
            });
        });

        await Promise.all(itemPromises);

        const placedOrder: PlacedOrder = {
            orderId: docRef.id,
            orderNumber,
            items,
            total: cartTotal,
            branchName: branch!.name,
            orderType,
        };

        // Asynchronously sync the order to the external system.
        // We don't need to await this; it can happen in the background.
        syncOrderToExternalSystem({
            ...newOrder,
            id: docRef.id,
            orderDate: new Date().toISOString(), // Convert to ISO string for serialization
            items: items.map(item => ({
                menuItemId: item.id,
                name: item.name,
                quantity: item.quantity,
                itemPrice: item.price
            }))
        });

        sessionStorage.setItem('placedOrder', JSON.stringify(placedOrder));
        clearCart();
        router.push("/order-status");

    } catch (error: any) {
        console.error("An unexpected error occurred while placing the order:", error);
    }
  };

  const getImageUrl = (imageId: string) => {
    return PlaceHolderImages.find((img) => img.id === imageId)?.imageUrl || "/placeholder.jpg";
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
            </div>

            {items.map((item, index) => (
              <div key={item.id}>
                <div className="flex items-center gap-4 py-2">
                  <Image
                    src={getImageUrl(item.imageId)}
                    alt={item.name}
                    width={48}
                    height={48}
                    className="rounded-md object-cover"
                  />
                  <div className="flex-grow">
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.quantity} x ${item.price.toFixed(2)}
                    </p>
                  </div>
                  <p className="font-semibold">
                    ${(item.quantity * item.price).toFixed(2)}
                  </p>
                </div>
                {index < items.length - 1 && <Separator />}
              </div>
            ))}
            <Separator />
            <div className="flex justify-between pt-4 text-xl font-bold">
              <span>Total</span>
              <span>${cartTotal.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col-reverse gap-4 sm:flex-row sm:justify-end sm:gap-2">
          <Button variant="outline" asChild>
            <Link href={`/branch/${branchId}/menu?mode=${orderType}`}>Cancel</Link>
          </Button>
          <Button
            onClick={handleConfirmOrder}
            className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90"
            size="lg"
          >
            Place Order
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
