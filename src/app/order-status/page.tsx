
"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import * as Tone from "tone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { CheckCircle, Loader, Utensils, Printer, Info } from "lucide-react";
import type { Order, PlacedOrder } from "@/lib/types";
import { useOrders } from "@/context/OrderContext";
import { useSettings } from "@/context/SettingsContext";
import { OrderReceipt } from "@/components/cashier/OrderReceipt";
import { cn } from "@/lib/utils";
import { RatingDialog } from "@/components/ui/rating-dialog";

const IDLE_TIMEOUT_SECONDS = 10; // 10 seconds

export default function OrderStatusPage() {
  const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null);
  const [hasCheckedStorage, setHasCheckedStorage] = useState(false);
  const router = useRouter();
  const { orders, isLoading: isOrdersLoading } = useOrders();
  const { settings, isLoading: isSettingsLoading } = useSettings();
  const printTriggered = useRef(false);
  const idleTimer = useRef<NodeJS.Timeout>();

  const resetToHome = useCallback(() => {
    sessionStorage.removeItem("placedOrder");
    router.push("/");
  }, [router]);

  const resetIdleTimer = useCallback(() => {
    if (idleTimer.current) {
        clearTimeout(idleTimer.current);
    }
    idleTimer.current = setTimeout(resetToHome, IDLE_TIMEOUT_SECONDS * 1000);
  },[resetToHome]);


  // 1. Load placed order from session storage on mount
  useEffect(() => {
    try {
      const storedOrder = sessionStorage.getItem("placedOrder");
      if (storedOrder) {
        setPlacedOrder(JSON.parse(storedOrder));
      }
    } catch (error) {
      console.error("Could not load order from session storage", error);
    } finally {
        setHasCheckedStorage(true);
    }
  }, []);

  // 2. Find the full order object from the context
  const order: Order | undefined = useMemo(() => {
    if (!placedOrder) return undefined;
    return orders.find(o => o.id === placedOrder.orderId);
  }, [orders, placedOrder]);

  const status = order?.status;
  const isLoading = isOrdersLoading || isSettingsLoading || !hasCheckedStorage;

  // 3. Handle manual printing
  const handlePrint = useCallback(() => {
    resetIdleTimer(); // Reset timer on interaction
    if (!order) return;
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
  }, [order, resetIdleTimer]);
  
  // 4. Handle automatic printing
  useEffect(() => {
    if (!isLoading && order && settings.autoPrintReceipts && !printTriggered.current) {
        printTriggered.current = true;
        handlePrint();
    }
  }, [isLoading, order, settings.autoPrintReceipts, handlePrint]);


  // 5. Play a sound when the order is ready
  useEffect(() => {
    if (status === 'Ready') {
      try {
        if (typeof window !== "undefined") {
          const synth = new Tone.Synth().toDestination();
          const now = Tone.now();
          synth.triggerAttackRelease("E5", "16n", now);
          synth.triggerAttackRelease("G5", "16n", now + 0.1);
          synth.triggerAttackRelease("C6", "8n", now + 0.2);
        }
      } catch (e) {
          console.error("Could not play sound", e)
      }
    }
  }, [status]);
  
  // 6. Set up idle timer and activity listeners
  useEffect(() => {
      // Only set up timers if there's an order to track
      if (placedOrder) {
        resetIdleTimer();
        
        window.addEventListener('scroll', resetIdleTimer);
        window.addEventListener('mousemove', resetIdleTimer);
        window.addEventListener('mousedown', resetIdleTimer);
        window.addEventListener('keypress', resetIdleTimer);
        window.addEventListener('touchstart', resetIdleTimer);

        // Cleanup
        return () => {
            if (idleTimer.current) {
                clearTimeout(idleTimer.current);
            }
            window.removeEventListener('scroll', resetIdleTimer);
            window.removeEventListener('mousemove', resetIdleTimer);
            window.removeEventListener('mousedown', resetIdleTimer);
            window.removeEventListener('keypress', resetIdleTimer);
            window.removeEventListener('touchstart', resetIdleTimer);
        };
      }
  }, [resetIdleTimer, placedOrder]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Loading your order status...</p>
      </div>
    );
  }

  // This check is important for the case where the order is not found
  if (!placedOrder) {
    return (
       <div className="flex h-screen flex-col items-center justify-center gap-4 text-center">
         <Info className="h-16 w-16 text-muted-foreground" />
         <h1 className="font-headline text-2xl font-bold">No Active Order Found</h1>
         <p className="max-w-md text-muted-foreground">This page tracks your order after you've placed it. If you have a pending order, please try again. Otherwise, you can start a new one.</p>
         <Button onClick={resetToHome} className="mt-4">Start a New Order</Button>
       </div>
    );
  }


  const isOrderActive = status === 'Pending' || status === 'Preparing';
  const isOrderReady = status === 'Ready';

  return (
    <div className="container mx-auto flex min-h-screen items-center justify-center p-4">
      <Card className={cn("w-full max-w-md text-center shadow-2xl", isOrderActive && "animate-blink")}>
        <CardHeader>
          {isOrderActive || !status ? (
            <>
              <Utensils className="mx-auto h-16 w-16 animate-pulse text-primary" />
              <CardTitle className="font-headline text-2xl mt-4">
                Your order is being prepared!
              </CardTitle>
            </>
          ) : (
            <>
              <CheckCircle className={`mx-auto h-16 w-16 ${isOrderReady ? 'text-green-500' : 'text-muted-foreground'}`} />
              <CardTitle className="font-headline text-2xl mt-4">
                {isOrderReady ? 'Order Ready for Pickup!' : 'Order Completed'}
              </CardTitle>
            </>
          )}
        </CardHeader>
        <CardContent>
          <p className="text-lg">
            Order <span className="font-bold text-primary">#{placedOrder.orderNumber}</span>
          </p>
          <p className="text-muted-foreground mt-2">
            {isOrderActive || !status
              ? "We'll notify you with a sound when it's ready."
              : isOrderReady
              ? `Please collect your ${placedOrder.orderType} order at the counter.`
              : 'Thank you for your order!'}
          </p>
          
          <div className="mt-6 text-left border rounded-lg p-4 bg-muted/20">
            <h3 className="font-headline font-semibold mb-2">Order Summary</h3>
            <p><strong>Branch:</strong> {placedOrder.branchName}</p>
            {placedOrder.orderType === 'Dine-In' && placedOrder.tableName && (
              <p><strong>Table:</strong> {placedOrder.tableName} ({placedOrder.floorName})</p>
            )}
            <p><strong>Total:</strong> <span className="font-bold">RS {Math.round(placedOrder.total)}</span></p>
          </div>

        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <div className="w-full">
            <RatingDialog />
          </div>
          <div className="grid gap-2 grid-cols-2 w-full">
            <Button
                size="lg"
                variant="outline"
                onClick={handlePrint}
                className="w-full"
                disabled={!order}
            >
                <Printer className="mr-2 h-4 w-4" /> Print Receipt
            </Button>
            <Button
                size="lg"
                className="w-full"
                onClick={() => {
                // Also reset timer on explicit click
                if (idleTimer.current) clearTimeout(idleTimer.current);
                resetToHome();
                }}
            >
                New Order
            </Button>
          </div>
        </CardFooter>
      </Card>
      
      {/* Hidden receipt for printing */}
      {order && (
        <div className="hidden">
            <div id={`printable-receipt-${order.id}`}>
                <OrderReceipt order={order} />
            </div>
        </div>
      )}
    </div>
  );
}
