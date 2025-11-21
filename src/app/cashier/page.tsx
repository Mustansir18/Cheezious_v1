"use client";
import { useFirebase, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy } from "firebase/firestore";
import type { Order } from "@/lib/types";
import { OrderCard } from "@/components/cashier/OrderCard";
import { BarChart, Clock, CookingPot, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";


export default function CashierPage() {
  const { firestore } = useFirebase();

  const ordersQuery = useMemoFirebase(
    () =>
      firestore
        ? query(
            collection(firestore, "orders"),
            where("status", "in", ["Pending", "Preparing"]),
            orderBy("orderDate", "asc")
          )
        : null,
    [firestore]
  );
  
  const completedOrdersQuery = useMemoFirebase(
    () =>
      firestore
        ? query(
            collection(firestore, "orders"),
            where("status", "in", ["Ready", "Completed"]),
            orderBy("orderDate", "desc")
          )
        : null,
    [firestore]
  );


  const { data: activeOrders, isLoading: isLoadingActive } = useCollection<Order>(ordersQuery);
  const { data: completedOrders, isLoading: isLoadingCompleted } = useCollection<Order>(completedOrdersQuery);
  
  const totalSales = completedOrders?.reduce((acc, order) => acc + order.totalAmount, 0) ?? 0;
  
  const summaryCards = [
    { title: "Active Orders", value: activeOrders?.length ?? 0, icon: CookingPot },
    { title: "Completed Today", value: completedOrders?.length ?? 0, icon: CheckCircle },
    { title: "Total Sales", value: `$${totalSales.toFixed(2)}`, icon: BarChart },
  ];

  return (
    <div className="container mx-auto p-4 lg:p-8">
      <header className="mb-8">
        <h1 className="font-headline text-4xl font-bold">Cashier Dashboard</h1>
        <p className="text-muted-foreground">Live orders from Cheezious Connect</p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
        {summaryCards.map(card => (
            <Card key={card.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                    <card.icon className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {(isLoadingActive || isLoadingCompleted) ? <Skeleton className="h-8 w-24" /> : card.value}
                    </div>
                </CardContent>
            </Card>
        ))}
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {isLoadingActive ? (
            Array.from({ length: 3 }).map((_, i) => <OrderCard.Skeleton key={i} />)
        ) : activeOrders && activeOrders.length > 0 ? (
          activeOrders.map((order) => <OrderCard key={order.id} order={order} />)
        ) : (
          <Card className="lg:col-span-2 xl:col-span-3 flex flex-col items-center justify-center p-12 text-center">
             <Clock className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="font-headline text-xl font-semibold">No active orders</h3>
            <p className="text-muted-foreground">New orders will appear here automatically.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
