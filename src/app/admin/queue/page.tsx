
"use client";

import { useOrders } from "@/context/OrderContext";
import { Loader } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const StatusColumn = ({ title, orders, status }: { title: string, orders: { orderNumber: string }[], status: 'Pending' | 'Preparing' | 'Ready' }) => {
    
    const badgeVariant = {
        Pending: "secondary",
        Preparing: "default",
        Ready: "default",
    } as const;

    const badgeColor = {
        Pending: "",
        Preparing: "",
        Ready: "bg-green-600 text-white hover:bg-green-700",
    }

    return (
        <Card className="flex flex-col h-full">
            <CardHeader>
                <CardTitle className="font-headline text-3xl text-center">{title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow p-6">
                 <div className="grid grid-cols-2 gap-4">
                    {orders.length > 0 ? (
                        orders.map(order => (
                            <Badge key={order.orderNumber} variant={badgeVariant[status]} className={cn("text-4xl font-bold p-4 block rounded-lg", badgeColor[status])}>
                                {order.orderNumber}
                            </Badge>
                        ))
                    ) : (
                        <div className="col-span-2 flex items-center justify-center h-full text-muted-foreground">
                            <p>No orders in this status</p>
                        </div>
                    )}
                 </div>
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
        <div className="h-screen w-full bg-background p-8">
            <header className="text-center mb-8">
                <h1 className="font-headline text-5xl font-bold">Order Status</h1>
            </header>
            <main className="grid grid-cols-3 gap-6 h-[calc(100vh-120px)]">
                <StatusColumn title="Pending" orders={pendingOrders} status="Pending" />
                <StatusColumn title="Preparing" orders={preparingOrders} status="Preparing" />
                <StatusColumn title="Ready for Pickup" orders={readyOrders} status="Ready" />
            </main>
        </div>
    );
}
