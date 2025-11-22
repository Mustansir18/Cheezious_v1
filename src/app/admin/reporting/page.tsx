
"use client";

import { useOrders } from "@/context/OrderContext";
import { useMemo, useState } from "react";
import type { Order, OrderItem } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar as CalendarIcon, ShoppingCart, DollarSign, Utensils, Loader, Printer, CreditCard, ShoppingBag, FileDown } from "lucide-react";
import { HourlySalesReport } from "@/components/reporting/HourlySalesReport";
import { TopSellingItems } from "@/components/reporting/TopSellingItems";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

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
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().setHours(0, 0, 0, 0)),
    to: new Date(),
  });

  const reportData = useMemo(() => {
    if (!orders) return null;

    const filteredOrders = orders.filter(order => {
        const orderDate = new Date(order.orderDate);
        if (!dateRange?.from) return false;
        // Set 'to' date to the end of the day
        const toDate = dateRange.to ? new Date(dateRange.to) : new Date();
        toDate.setHours(23, 59, 59, 999);
        return orderDate >= dateRange.from && orderDate <= toDate;
    });

    const totalOrders = filteredOrders.length;
    const totalSales = filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalItemsSold = filteredOrders.reduce(
      (sum, order) =>
        sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
      0
    );

    const itemSales: { [key: string]: ItemSale } = {};
    const hourlySales: { [key: number]: number } = {};
    const dineInOrders = filteredOrders.filter((o) => o.orderType === "Dine-In");
    const takeAwayOrders = filteredOrders.filter((o) => o.orderType === "Take-Away");
    const paymentMethodCounts: { [key: string]: number } = {};

    for (const order of filteredOrders) {
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
  }, [orders, dateRange]);

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
    <div className="container mx-auto p-4 lg:p-8" id="print-area">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start gap-4 print:hidden">
        <div>
            <h1 className="font-headline text-4xl font-bold">Admin Reports</h1>
            <p className="text-muted-foreground">Sales data for the selected period.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "w-full sm:w-[300px] justify-start text-left font-normal",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
            <Button onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Print Report
            </Button>
            <Button variant="outline" disabled>
              <FileDown className="mr-2 h-4 w-4" />
              Download
            </Button>
        </div>
      </header>
      
      {/* This div wrapper ensures print styles apply correctly */}
      <div className="print-content space-y-8">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
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
          
          <Card>
              <CardHeader>
                  <CardTitle className="font-headline flex items-center"><CreditCard className="mr-2 h-5 w-5 text-primary"/>Payment Method Breakdown (Dine-In)</CardTitle>
                  <CardDescription>Number of dine-in orders per payment method for the selected period.</CardDescription>
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
                      <p className="text-muted-foreground">No dine-in orders with a payment method recorded for this period.</p>
                  )}
              </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              <div className="lg:col-span-3">
                  <HourlySalesReport data={hourlySalesChartData} />
              </div>
              <div className="lg:col-span-2">
                  <TopSellingItems data={topSellingItems} />
              </div>
          </div>
      </div>
    </div>
  );
}

    