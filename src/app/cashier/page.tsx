
"use client";
import type { Order } from "@/lib/types";
import { OrderCard } from "@/components/cashier/OrderCard";
import { BarChart, Clock, CookingPot, CheckCircle, Loader, Info, Monitor } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrders } from "@/context/OrderContext";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { OrderReceipt } from "@/components/cashier/OrderReceipt";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function OrderInfoModal({ order }: { order: Order }) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 print-hidden">
                    <Info className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xs">
                <DialogHeader>
                    <DialogTitle>Order Details</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <OrderReceipt order={order} />
                </div>
            </DialogContent>
        </Dialog>
    )
}


export default function CashierPage() {
  const { orders, isLoading, updateOrderStatus } = useOrders();

  const runningOrders = orders.filter(order => order.status === "Pending" || order.status === "Preparing");
  const readyOrders = orders.filter(order => order.status === "Ready");
  const completedOrders = orders.filter(order => order.status === "Completed");

  const totalSales = completedOrders?.reduce((acc, order) => acc + order.totalAmount, 0) ?? 0;
  
  const summaryCards = [
    { title: "Running Orders", value: runningOrders?.length ?? 0, icon: Clock },
    { title: "Ready for Pickup", value: readyOrders?.length ?? 0, icon: CookingPot },
    { title: "Completed Today", value: completedOrders?.length ?? 0, icon: CheckCircle },
    { title: "Total Sales", value: `RS ${Math.round(totalSales)}`, icon: BarChart },
  ];

  if (isLoading) {
      return (
        <div className="flex h-screen items-center justify-center">
            <Loader className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-4 text-muted-foreground">Loading Dashboard...</p>
        </div>
      )
  }

  return (
    <div className="container mx-auto p-4 lg:p-8">
      <header className="mb-8 flex justify-between items-start">
        <div>
            <h1 className="font-headline text-4xl font-bold">Cashier Dashboard</h1>
            <p className="text-muted-foreground">Manage running, ready, and completed orders.</p>
        </div>
        <Link href="/admin/queue" target="_blank">
            <Button variant="outline">
                <Monitor className="mr-2 h-4 w-4" />
                Open Order Queue
            </Button>
        </Link>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {summaryCards.map(card => (
            <Card key={card.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                    <card.icon className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {isLoading ? <Skeleton className="h-8 w-24" /> : card.value}
                    </div>
                </CardContent>
            </Card>
        ))}
      </div>

      <div className="space-y-12">
        <div>
            <h2 className="font-headline text-2xl font-bold mb-4">Running Orders</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {isLoading ? (
                    Array.from({ length: 2 }).map((_, i) => <OrderCard.Skeleton key={i} />)
                ) : runningOrders && runningOrders.length > 0 ? (
                runningOrders.map((order) => <OrderCard key={order.id} order={order} workflow="cashier" onUpdateStatus={updateOrderStatus}><OrderInfoModal order={order} /></OrderCard>)
                ) : (
                <Card className="lg:col-span-2 xl:col-span-3 flex flex-col items-center justify-center p-12 text-center">
                    <Clock className="h-16 w-16 text-muted-foreground/50 mb-4" />
                    <h3 className="font-headline text-xl font-semibold">No running orders</h3>
                    <p className="text-muted-foreground">New orders will appear here once placed.</p>
                </Card>
                )}
            </div>
        </div>

        <div>
            <h2 className="font-headline text-2xl font-bold mb-4">Ready for Pickup</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => <OrderCard.Skeleton key={i} />)
                ) : readyOrders && readyOrders.length > 0 ? (
                readyOrders.map((order) => <OrderCard key={order.id} order={order} workflow="cashier" onUpdateStatus={updateOrderStatus}><OrderInfoModal order={order} /></OrderCard>)
                ) : (
                <Card className="lg:col-span-2 xl:col-span-3 flex flex-col items-center justify-center p-12 text-center">
                    <CookingPot className="h-16 w-16 text-muted-foreground/50 mb-4" />
                    <h3 className="font-headline text-xl font-semibold">No orders are ready</h3>
                    <p className="text-muted-foreground">Orders marked as "Ready" by the kitchen will appear here.</p>
                </Card>
                )}
            </div>
        </div>
        
        <div>
            <h2 className="font-headline text-2xl font-bold mb-4">Completed Orders</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {isLoading ? (
                    Array.from({ length: 1 }).map((_, i) => <OrderCard.Skeleton key={i} />)
                ) : completedOrders && completedOrders.length > 0 ? (
                completedOrders.map((order) => <OrderCard key={order.id} order={order} workflow="cashier" onUpdateStatus={updateOrderStatus}><OrderInfoModal order={order} /></OrderCard>)
                ) : (
                <Card className="lg:col-span-2 xl:col-span-3 flex flex-col items-center justify-center p-12 text-center">
                    <CheckCircle className="h-16 w-16 text-muted-foreground/50 mb-4" />
                    <h3 className="font-headline text-xl font-semibold">No completed orders yet</h3>
                    <p className="text-muted-foreground">Completed orders for the day will be shown here.</p>
                </Card>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}
