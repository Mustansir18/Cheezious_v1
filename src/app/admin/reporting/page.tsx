"use client";

import { useOrders } from "@/context/OrderContext";
import { useMemo } from "react";
import type { Order, OrderItem } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, ShoppingCart, DollarSign, Utensils, Loader } from "lucide-react";
import { HourlySalesReport } from "@/components/reporting/HourlySalesReport";
import { TopSellingItems } from "@/components/reporting/TopSellingItems";

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
    };
  }, [orders]);

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
             <header className="mb-8">
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
  } = reportData;

  const summaryCards = [
    { title: "Total Sales", value: `$${totalSales.toFixed(2)}`, icon: DollarSign },
    { title: "Total Orders", value: totalOrders, icon: ShoppingCart },
    { title: "Total Items Sold", value: totalItemsSold, icon: Utensils },
  ];

  return (
    <div className="container mx-auto p-4 lg:p-8">
      <header className="mb-8">
        <h1 className="font-headline text-4xl font-bold">Admin Reports</h1>
        <p className="text-muted-foreground">Sales data from the current session.</p>
      </header>
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-8">
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
