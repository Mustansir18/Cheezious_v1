
"use client";

import { useOrders } from "@/context/OrderContext";
import { useMemo } from "react";
import type { Order, OrderItem } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  BarChart,
  ShoppingCart,
  DollarSign,
  Utensils,
  Loader,
  Printer,
  CreditCard,
  ShoppingBag,
} from "lucide-react";
import { HourlySalesReport } from "@/components/reporting/HourlySalesReport";
import { TopSellingItems } from "@/components/reporting/TopSellingItems";
import { Button } from "@/components/ui/button";

export interface ItemSale {
  name: string;
  quantity: number;
  totalRevenue: number;
}

export interface HourlySale {
  hour: string;
  sales: number;
}

export default function ReportingPage() {
  const { orders, isLoading } = useOrders();

  const reportData = useMemo(() => {
    if (!orders) return null;

    const totalOrders = orders.length;
    const totalSales = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalItemsSold = orders.reduce(
      (sum, order) =>
        sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
      0
    );

    const itemSales: { [key: string]: ItemSale } = {};
    const hourlySales: { [key: number]: number } = {};
    const dineInOrders = orders.filter((o) => o.orderType === "Dine-In");
    const takeAwayOrders = orders.filter((o) => o.orderType === "Take-Away");
    const paymentMethodCounts: { [key: string]: number } = {};

    for (const order of orders) {
      const hour = new Date(order.orderDate).getHours();
      hourlySales[hour] = (hourlySales[hour] || 0) + order.totalAmount;

      for (const item of order.items) {
        if (!itemSales[item.menuItemId]) {
          itemSales[item.menuItemId] = {
            name: item.name,
            quantity: 0,
            totalRevenue: 0,
          };
        }
        itemSales[item.menuItemId].quantity += item.quantity;
        itemSales[item.menuItemId].totalRevenue += item.quantity * item.itemPrice;
      }
      
      if (order.orderType === 'Dine-In' && order.paymentMethod) {
          paymentMethodCounts[order.paymentMethod] = (paymentMethodCounts[order.paymentMethod] || 0) + 1;
      }
    }

    const topSellingItems = Object.values(itemSales).sort(
      (a, b) => b.quantity - a.quantity
    );

    const hourlySalesChartData: HourlySale[] = Array.from({ length: 24 }, (_, i) => {
        const hour = i.toString().padStart(2, '0');
        return {
            hour: `${hour}:00`,
            sales: hourlySales[i] || 0,
        };
    });

    return {
      totalOrders,
      totalSales,
      totalItemsSold,
      topSellingItems,
      hourlySalesChartData,
      dineInCount: dineInOrders.length,
      takeAwayCount: takeAwayOrders.length,
      paymentMethodCounts,
    };
  }, [orders]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Loading Reports...</p>
      </div>
    );
  }
  
  if (!reportData || orders.length === 0) {
      return (
        <div className="container mx-auto p-4 lg:p-8 text-center">
             <header className="mb-8 print:hidden">
                <h1 className="font-headline text-4xl font-bold">Admin Reports</h1>
                <p className="text-muted-foreground">Sales data from the current session.</p>
            </header>
            <Card className="mt-10">
                <CardContent className="p-12">
                     <h2 className="text-2xl font-semibold">No Order Data</h2>
                     <p className="mt-2 text-muted-foreground">Place some orders to see report data here.</p>
                </CardContent>
            </Card>
        </div>
      )
  }

  const {
    totalOrders,
    totalSales,
    totalItemsSold,
    topSellingItems,
    hourlySalesChartData,
    dineInCount,
    takeAwayCount,
    paymentMethodCounts,
  } = reportData;

  const summaryCards = [
    { title: "Total Sales", value: `RS ${totalSales.toFixed(2)}`, icon: DollarSign },
    { title: "Total Orders", value: totalOrders, icon: ShoppingCart },
    { title: "Total Items Sold", value: totalItemsSold, icon: Utensils },
    { title: "Dine-In Orders", value: dineInCount, icon: Utensils },
    { title: "Take Away Orders", value: takeAwayCount, icon: ShoppingBag },
  ];

  return (
    <div className="container mx-auto p-4 lg:p-8 print:p-0">
      <header className="mb-8 flex justify-between items-start print:hidden">
        <div>
            <h1 className="font-headline text-4xl font-bold">Admin Reports</h1>
            <p className="text-muted-foreground">Sales data from the current session.</p>
        </div>
        <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print Report
        </Button>
      </header>
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5 mb-8">
        {summaryCards.map(card => (
            <Card key={card.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                    <card.icon className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{card.value}</div>
                </CardContent>
            </Card>
        ))}
      </div>
      
       <div className="mb-8">
        <Card>
            <CardHeader>
                <CardTitle className="font-headline flex items-center"><CreditCard className="mr-2 h-5 w-5 text-primary"/>Payment Method Breakdown (Dine-In)</CardTitle>
                <CardDescription>Number of dine-in orders per payment method.</CardDescription>
            </CardHeader>
            <CardContent>
                {Object.keys(paymentMethodCounts).length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {Object.entries(paymentMethodCounts).map(([method, count]) => (
                             <div key={method} className="bg-muted/50 p-4 rounded-lg">
                                <p className="text-sm font-medium text-muted-foreground">{method}</p>
                                <p className="text-2xl font-bold">{count}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground">No dine-in orders with a payment method recorded yet.</p>
                )}
            </CardContent>
        </Card>
       </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3">
            <HourlySalesReport data={hourlySalesChartData} />
        </div>
        <div className="lg:col-span-2">
            <TopSellingItems data={topSellingItems} />
        </div>
      </div>
    </div>
  );
}
