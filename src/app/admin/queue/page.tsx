
"use client";

import { useOrders } from "@/context/OrderContext";
import { Loader, CookingPot, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const StatusColumn = ({ title, orders, status }: { title: string, orders: { orderNumber: string }[], status: 'Pending' | 'Preparing' | 'Ready' }) => {
    
    const badgeVariant = {
        Pending: "secondary",
        Preparing: "default",
        Ready: "default", // Changed from "destructive"
    } as const;

    const bgColor = {
        Pending: "bg-gray-100 dark:bg-gray-800/50",
        Preparing: "bg-blue-100 dark:bg-blue-900/50",
        Ready: "bg-green-100 dark:bg-green-900/50",
    }
    
    const readyBadgeClass = status === 'Ready' ? 'bg-green-600 text-white hover:bg-green-700' : '';

    return (
        <Card className={cn("flex flex-col h-full", bgColor[status])}>
            <CardHeader className="py-4">
                <CardTitle className="font-headline text-2xl text-center tracking-wider">{title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow space-y-2 p-4">
                {orders.length > 0 ? (
                    orders.map(order => (
                        <Badge key={order.orderNumber} variant={badgeVariant[status]} className={cn("w-full justify-center text-2xl font-bold p-3 block", readyBadgeClass)}>
                            {order.orderNumber}
                        </Badge>
                    ))
                ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                        <p>No orders</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};


export default function QueuePage() {
    const { orders, isLoading } = useOrders();

    const pendingOrders = orders.filter(order => order.status === "Pending");
    const preparingOrders = orders.filter(order => order.status === "Preparing");
    const readyOrders = orders.filter(order => order.status === "Ready");

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader className="h-12 w-12 animate-spin text-primary" />
                <p className="ml-4 text-muted-foreground">Loading Queue...</p>
            </div>
        );
    }
    
    return (
        <div className="h-screen w-full bg-background p-4">
            <header className="text-center mb-6">
                <h1 className="font-headline text-5xl font-bold tracking-tight">Order Status</h1>
                <p className="text-muted-foreground text-lg">Track your order from preparation to pickup.</p>
            </header>
            <main className="grid grid-cols-3 gap-4 h-[calc(100vh-120px)]">
                <StatusColumn title="PENDING" orders={pendingOrders} status="Pending" />
                <StatusColumn title="PREPARING" orders={preparingOrders} status="Preparing" />
                <StatusColumn title="READY FOR PICKUP" orders={readyOrders} status="Ready" />
            </main>
        </div>
    );
}
