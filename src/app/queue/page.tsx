
"use client";

import { useOrders } from "@/context/OrderContext";
import { Loader, Home } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useSettings } from "@/context/SettingsContext";

const IDLE_TIMEOUT_SECONDS = 30; 

const StatusColumn = ({ title, orders, status }: { title: string, orders: { orderNumber: string }[], status: 'Pending' | 'Preparing' | 'Ready' }) => {
    
    const badgeVariant = {
        Pending: "secondary",
        Preparing: "default",
        Ready: "default",
    } as const;

    const headerColor = {
        Pending: "bg-gray-200 text-gray-800",
        Preparing: "bg-blue-500 text-white",
        Ready: "bg-yellow-500 text-black",
    }

    const badgeColor = {
        Pending: "animate-pulse",
        Preparing: "animate-pulse",
        Ready: "bg-green-600 text-white hover:bg-green-700 animate-pulse",
    }

    return (
        <Card className="flex flex-col h-full bg-muted/20">
            <CardHeader className="p-4">
                 <Badge className={cn(
                    "text-2xl font-bold justify-center py-3 rounded-lg shadow-md border-0",
                    headerColor[status]
                 )}>
                    {title}
                </Badge>
            </CardHeader>
            <CardContent className="flex-grow p-4">
                 <div className="flex flex-wrap justify-center gap-4">
                    {orders.length > 0 ? (
                        orders.map(order => (
                            <Badge key={order.orderNumber} variant={badgeVariant[status]} className={cn("text-3xl font-bold p-3 px-6 rounded-lg", badgeColor[status])}>
                                {order.orderNumber}
                            </Badge>
                        ))
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            <p>No orders in this status</p>
                        </div>
                    )}
                 </div>
            </CardContent>
        </Card>
    );
};


export default function QueuePage() {
    const { orders, isLoading: isOrdersLoading } = useOrders();
    const { settings, isLoading: isSettingsLoading } = useSettings();
    const router = useRouter();
    const idleTimer = useRef<NodeJS.Timeout>();

    const resetToHome = useCallback(() => {
        router.push("/");
    }, [router]);

    const resetIdleTimer = useCallback(() => {
        if (idleTimer.current) {
            clearTimeout(idleTimer.current);
        }
        idleTimer.current = setTimeout(resetToHome, IDLE_TIMEOUT_SECONDS * 1000);
    }, [resetToHome]);
    
    // Set up idle timer and activity listeners
    useEffect(() => {
        resetIdleTimer();
        
        const events = ['scroll', 'mousemove', 'mousedown', 'keypress', 'touchstart'];
        events.forEach(event => window.addEventListener(event, resetIdleTimer));

        // Cleanup
        return () => {
            if (idleTimer.current) {
                clearTimeout(idleTimer.current);
            }
            events.forEach(event => window.removeEventListener(event, resetIdleTimer));
        };
    }, [resetIdleTimer]);

    const pendingOrders = orders.filter(order => order.status === "Pending");
    const preparingOrders = orders.filter(order => order.status === "Preparing");
    const readyOrders = orders.filter(order => order.status === "Ready");

    const isLoading = isOrdersLoading || isSettingsLoading;

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader className="h-12 w-12 animate-spin text-primary" />
                <p className="ml-4 text-muted-foreground">Loading Queue...</p>
            </div>
        );
    }
    
    return (
        <div className="h-screen w-full bg-background p-8">
            <header className="text-center mb-8 flex justify-between items-center">
                <div className="w-16"></div> {/* Spacer */}
                <h1 className="font-headline text-5xl font-bold">Order Queue status</h1>
                <Link href="/" passHref>
                    <Button variant="outline" size="icon" aria-label="Back to Home">
                        <Home className="h-6 w-6" />
                    </Button>
                </Link>
            </header>
            <main className="grid grid-cols-3 gap-6 h-[calc(100vh-140px)]">
                <StatusColumn title="Pending" orders={pendingOrders} status="Pending" />
                <StatusColumn title="Preparing" orders={preparingOrders} status="Preparing" />
                <StatusColumn title="Pickup" orders={readyOrders} status="Ready" />
            </main>
        </div>
    );
}
