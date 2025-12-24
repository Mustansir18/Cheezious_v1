
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

    const columnStyle = {
        Pending: {
            card: "bg-muted/30 border-slate-200 dark:border-slate-800",
            header: "text-slate-500",
            badge: "bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700",
        },
        Preparing: {
            card: "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800",
            header: "text-blue-600 dark:text-blue-400",
            badge: "bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500",
        },
        Ready: {
            card: "bg-green-50 border-green-300 dark:bg-green-950 dark:border-green-800",
            header: "text-green-600 dark:text-green-400",
            badge: "bg-green-600 text-white hover:bg-green-700 animate-pulse",
        },
    }

    return (
        <Card className={cn("flex flex-col h-full shadow-md", columnStyle[status].card)}>
            <CardHeader className="py-4 border-b-2" style={{ borderColor: 'inherit' }}>
                <CardTitle className={cn("font-headline text-3xl text-center tracking-wider font-extrabold", columnStyle[status].header)}>
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow p-4">
                 <div className="grid grid-cols-2 gap-3">
                    {orders.length > 0 ? (
                        orders.map(order => (
                            <Badge key={order.orderNumber} variant={badgeVariant[status]} className={cn("w-full justify-center text-4xl font-bold p-4 block rounded-lg shadow-sm", columnStyle[status].badge)}>
                                {order.orderNumber}
                            </Badge>
                        ))
                    ) : (
                        <div className="col-span-2 flex items-center justify-center h-full text-muted-foreground py-20">
                            <p className="text-lg">No orders in this status</p>
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
        <div className="h-screen w-full bg-background p-6">
            <header className="text-center mb-6">
                <h1 className="font-headline text-6xl font-extrabold tracking-tight text-primary">Order Status</h1>
                <p className="text-muted-foreground text-xl mt-2">Track your order from kitchen to counter.</p>
            </header>
            <main className="grid grid-cols-3 gap-6 h-[calc(100vh-140px)]">
                <StatusColumn title="PENDING" orders={pendingOrders} status="Pending" />
                <StatusColumn title="PREPARING" orders={preparingOrders} status="Preparing" />
                <StatusColumn title="READY FOR PICKUP" orders={readyOrders} status="Ready" />
            </main>
        </div>
    );
}
