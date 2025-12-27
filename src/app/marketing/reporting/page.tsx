

"use client";

import { useOrders } from "@/context/OrderContext";
import { useMenu } from "@/context/MenuContext";
import { useMemo, useState, useEffect } from "react";
import type { Order } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar as CalendarIcon, ShoppingCart, DollarSign, Utensils, Loader, Printer, Scale, FileDown, Tag, Gift, XCircle, ShoppingBag, FileArchive } from "lucide-react";
import { HourlySalesReport } from "@/components/reporting/HourlySalesReport";
import { DailySalesReport, type DailySale } from "@/components/reporting/DailySalesReport";
import { TopSellingItems } from "@/components/reporting/TopSellingItems";
import { TopSellingDeals } from "@/components/reporting/TopSellingDeals";
import { CategorySalesTable } from "@/components/reporting/CategorySalesTable";
import { PaymentMethodBreakdown, type PaymentData } from "@/components/reporting/PaymentMethodBreakdown";
import { OrderAdjustmentsSummary, type OrderAdjustmentData } from "@/components/reporting/OrderAdjustmentsSummary";
import { OrderTypeSummary, type OrderTypeData } from "@/components/reporting/OrderTypeSummary";
import { CompletionTimeReport, type CompletionTimeData } from "@/components/reporting/CompletionTimeReport";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, subDays } from "date-fns";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { ItemSale, DealSale, CategorySale } from "@/lib/types";
import { exportSummaryAs, exportAllReportsAsZip } from '@/lib/exporter';
import { useToast } from "@/hooks/use-toast";


export interface HourlySale {
  hour: string;
  sales: number;
}

function ReportCardActions({ reportId, onPrint, onDownloadPdf, onDownloadCsv }: { reportId: string; onPrint: (id: string) => void, onDownloadPdf: () => void, onDownloadCsv: () => void }) {
    return (
        <div className="flex items-center gap-2 print-hidden">
            <UITooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={onDownloadCsv}>
                        <FileDown className="h-4 w-4"/>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Download as CSV</p>
                </TooltipContent>
            </UITooltip>
            <UITooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={onDownloadPdf}>
                        <FileDown className="h-4 w-4 text-red-500"/>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Download as PDF</p>
                </TooltipContent>
            </UITooltip>
            <Button variant="ghost" size="icon" onClick={() => onPrint(reportId)}>
                <Printer className="h-4 w-4"/>
            </Button>
        </div>
    );
}


export default function ReportingPage() {
  const { orders, isLoading } = useOrders();
  const { menu, isLoading: isMenuLoading } = useMenu();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [selectedOrderType, setSelectedOrderType] = useState<string | null>(null);
  const [selectedAdjustmentType, setSelectedAdjustmentType] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().setHours(0, 0, 0, 0)),
    to: new Date(),
  });
  const { toast } = useToast();

  const reportData = useMemo(() => {
    if (!orders || !menu.categories.length) return null;

    const baseFilteredOrders = orders.filter(order => {
        const orderDate = new Date(order.orderDate);
        if (!dateRange?.from) return false;
        const toDate = dateRange.to ? new Date(dateRange.to) : new Date();
        toDate.setHours(23, 59, 59, 999);
        return orderDate >= dateRange.from && orderDate <= toDate;
    });

    const filteredOrders = baseFilteredOrders
      .filter(order => selectedPaymentMethod ? order.paymentMethod === selectedPaymentMethod : true)
      .filter(order => selectedOrderType ? order.orderType === selectedOrderType : true)
      .filter(order => {
          if (!selectedAdjustmentType) return true;
          if (selectedAdjustmentType === 'Discounted') return !!order.discountAmount && order.discountAmount > 0;
          if (selectedAdjustmentType === 'Complementary') return !!order.isComplementary;
          if (selectedAdjustmentType === 'Cancelled') return order.status === 'Cancelled';
          return true;
      });
        
    const totalOrders = filteredOrders.length;
    const totalSales = filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalItemsSold = filteredOrders.reduce(
      (sum, order) =>
        sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
      0
    );
    const averageOrderSize = totalOrders > 0 ? totalSales / totalOrders : 0;

    const itemSales: { [key: string]: ItemSale } = {};
    const dealSales: { [key: string]: DealSale } = {};
    const hourlySales: { [key: number]: number } = {};
    const categorySales: { [key: string]: number } = {};
    const itemsMap = new Map(menu.items.map(item => [item.id, item]));

    
    // --- Data for Charts (calculated from less filtered data) ---
    let orderTypeFiltered = baseFilteredOrders.filter(o => selectedPaymentMethod ? o.paymentMethod === selectedPaymentMethod : true);
    orderTypeFiltered = orderTypeFiltered.filter(o => {
        if (!selectedAdjustmentType) return true;
        if (selectedAdjustmentType === 'Discounted') return !!o.discountAmount && o.discountAmount > 0;
        if (selectedAdjustmentType === 'Complementary') return !!o.isComplementary;
        if (selectedAdjustmentType === 'Cancelled') return o.status === 'Cancelled';
        return true;
    });
    const dineInOrders = orderTypeFiltered.filter((o) => o.orderType === "Dine-In");
    const takeAwayOrders = orderTypeFiltered.filter((o) => o.orderType === "Take-Away");

    let paymentFiltered = baseFilteredOrders.filter(o => selectedOrderType ? o.orderType === selectedOrderType : true);
     paymentFiltered = paymentFiltered.filter(o => {
        if (!selectedAdjustmentType) return true;
        if (selectedAdjustmentType === 'Discounted') return !!o.discountAmount && o.discountAmount > 0;
        if (selectedAdjustmentType === 'Complementary') return !!o.isComplementary;
        if (selectedAdjustmentType === 'Cancelled') return o.status === 'Cancelled';
        return true;
    });
    const paymentMethodSales: { [key: string]: number } = {};
     paymentFiltered.forEach(order => {
        if (order.paymentMethod) {
            paymentMethodSales[order.paymentMethod] = (paymentMethodSales[order.paymentMethod] || 0) + order.totalAmount;
        }
    });

    const adjustmentFiltered = baseFilteredOrders
        .filter(o => selectedPaymentMethod ? o.paymentMethod === selectedPaymentMethod : true)
        .filter(o => selectedOrderType ? o.orderType === selectedOrderType : true);

    const discountedCount = adjustmentFiltered.filter(o => o.discountAmount && o.discountAmount > 0).length;
    const complementaryCount = adjustmentFiltered.filter(o => o.isComplementary).length;
    const cancelledCount = adjustmentFiltered.filter(o => o.status === 'Cancelled').length;


    for (const order of filteredOrders) {
      const hour = new Date(order.orderDate).getHours();
      hourlySales[hour] = (hourlySales[hour] || 0) + order.totalAmount;

      for (const item of order.items) {
        const menuItem = itemsMap.get(item.menuItemId);
        const revenue = item.quantity * item.itemPrice;

        if (menuItem) {
            categorySales[menuItem.categoryId] = (categorySales[menuItem.categoryId] || 0) + revenue;

            if (menuItem.categoryId === 'deals') {
                if (!dealSales[item.menuItemId]) {
                    dealSales[item.menuItemId] = { name: item.name, quantity: 0, totalRevenue: 0 };
                }
                dealSales[item.menuItemId].quantity += item.quantity;
                dealSales[item.menuItemId].totalRevenue += revenue;
            } else {
                 if (!itemSales[item.menuItemId]) {
                    itemSales[item.menuItemId] = { name: item.name, quantity: 0, totalRevenue: 0 };
                }
                itemSales[item.menuItemId].quantity += item.quantity;
                itemSales[item.menuItemId].totalRevenue += revenue;
            }
        }
      }
    }

    const topSellingItems = Object.values(itemSales).sort((a, b) => b.quantity - a.quantity);
    const topSellingDeals = Object.values(dealSales).sort((a, b) => b.quantity - a.quantity);


    const hourlySalesChartData: HourlySale[] = Array.from({ length: 24 }, (_, i) => {
        const hour = i.toString().padStart(2, '0');
        return {
            hour: `${hour}:00`,
            sales: hourlySales[i] || 0,
        };
    });
    
    const paymentChartData: PaymentData[] = Object.entries(paymentMethodSales).map(([method, sales], index) => ({
        method,
        sales,
        fill: `hsl(var(--chart-${index + 1}))`
    }));

    const orderTypeChartData: OrderTypeData[] = [
        { type: 'Dine-In', count: dineInOrders.length, sales: dineInOrders.reduce((sum, o) => sum + o.totalAmount, 0), icon: Utensils, fill: 'hsl(var(--chart-1))' },
        { type: 'Take-Away', count: takeAwayOrders.length, sales: takeAwayOrders.reduce((sum, o) => sum + o.totalAmount, 0), icon: ShoppingBag, fill: 'hsl(var(--chart-2))' },
    ];
    
    const adjustmentChartData: OrderAdjustmentData[] = [
        { type: 'Discounted', count: discountedCount, icon: Tag, color: 'text-blue-500'},
        { type: 'Complementary', count: complementaryCount, icon: Gift, color: 'text-green-500'},
        { type: 'Cancelled', count: cancelledCount, icon: XCircle, color: 'text-red-500'},
    ]

    const today = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => subDays(today, i)).reverse();
    const dailySalesChartData: DailySale[] = last7Days.map(date => {
        const dateString = date.toISOString().split('T')[0];
        const daySales = filteredOrders
            .filter(order => new Date(order.orderDate).toISOString().split('T')[0] === dateString)
            .reduce((sum, order) => sum + order.totalAmount, 0);
        
        return {
            date: format(date, 'MMM d'),
            sales: daySales
        };
    });

    const completionTimeData: CompletionTimeData = {
        baseOrders: baseFilteredOrders,
        filteredOrders: filteredOrders,
    };
    
    const categoryChartData: CategorySale[] = Object.entries(categorySales).map(([categoryId, sales], index) => {
        const category = menu.categories.find(c => c.id === categoryId);
        return {
            name: category?.name || 'Uncategorized',
            sales: sales,
            fill: `hsl(var(--chart-${index + 1}))`
        };
    }).filter(c => c.sales > 0);

    const summaryCards = [
        { title: "Total Sales", value: `RS ${Math.round(totalSales)}` },
        { title: "Total Orders", value: totalOrders },
        { title: "Avg. Order Size", value: `RS ${Math.round(averageOrderSize)}` },
        { title: "Total Items Sold", value: totalItemsSold },
    ];


    return {
      totalOrders,
      totalSales,
      totalItemsSold,
      averageOrderSize,
      summaryCards,
      topSellingItems,
      topSellingDeals,
      hourlySalesChartData,
      dailySalesChartData,
      paymentChartData,
      orderTypeChartData,
      adjustmentChartData,
      completionTimeData,
      categoryChartData,
    };
  }, [orders, menu.items, menu.categories, dateRange, selectedPaymentMethod, selectedOrderType, selectedAdjustmentType]);

    const handlePrint = (reportId: string) => {
        const reportElement = document.getElementById(reportId);
        if (!reportElement) return;

        const printContainer = document.createElement('div');
        printContainer.id = 'printable-area';
        
        const contentToPrint = reportElement.cloneNode(true) as HTMLElement;
        
        const buttons = contentToPrint.querySelectorAll('.print-hidden');
        buttons.forEach(btn => btn.remove());

        printContainer.appendChild(contentToPrint);
        
        document.body.appendChild(printContainer);
        document.body.classList.add('printing-active');
        
        window.print();
        
        document.body.removeChild(printContainer);
        document.body.classList.remove('printing-active');
  };

  useEffect(() => {
    const afterPrint = () => {
      document.body.classList.remove('printing-active');
      const printableArea = document.getElementById('printable-area');
      if (printableArea) {
        document.body.removeChild(printableArea);
      }
    };

    window.addEventListener('afterprint', afterPrint);
    return () => {
      window.removeEventListener('afterprint', afterPrint);
    };
  }, []);

  const dateDisplay = dateRange?.from
      ? dateRange.to
        ? `${format(dateRange.from, "LLL dd, y")} - ${format(dateRange.to, "LLL dd, y")}`
        : format(dateRange.from, "LLL dd, y")
      : "Pick a date";

  const handleExportAll = async () => {
      if (!reportData) return;
      toast({
          title: 'Exporting All Reports',
          description: 'Your download will begin shortly...'
      });
      await exportAllReportsAsZip(reportData, dateDisplay);
  }


  if (isLoading || isMenuLoading) {
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
    summaryCards,
    topSellingItems,
    topSellingDeals,
    hourlySalesChartData,
    dailySalesChartData,
    paymentChartData,
    orderTypeChartData,
    adjustmentChartData,
    completionTimeData,
    categoryChartData,
  } = reportData;

  const summaryCardsWithIcons = [
    { ...summaryCards[0], icon: DollarSign },
    { ...summaryCards[1], icon: ShoppingCart },
    { ...summaryCards[2], icon: Scale },
    { ...summaryCards[3], icon: Utensils },
  ];
  
  const activeFilters = [selectedOrderType, selectedPaymentMethod, selectedAdjustmentType].filter(Boolean);
  let filterDescription = `Sales data for: ${dateDisplay}.`;
  if (activeFilters.length > 0) {
      filterDescription = `Displaying '${activeFilters.join(', ')}' orders for: ${dateDisplay}.`
  }


  return (
    <TooltipProvider>
    <div className="container mx-auto p-4 lg:p-8">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
            <h1 className="font-headline text-4xl font-bold">Admin Reports</h1>
            <p className="text-muted-foreground">{filterDescription}</p>
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
                  <span>{dateDisplay}</span>
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
             <Button onClick={handleExportAll}>
                <FileArchive className="mr-2 h-4 w-4" />
                Export All (ZIP)
            </Button>
        </div>
      </header>
      
      <div className="space-y-8">
          <div id="summary-report">
             <Card>
                <CardHeader className="flex-row justify-between items-center">
                    <div>
                        <CardTitle className="font-headline flex items-center">Overall Summary</CardTitle>
                        <CardDescription>Top-level metrics for the selected period.</CardDescription>
                    </div>
                    <ReportCardActions 
                        reportId="summary-report" 
                        onPrint={handlePrint}
                        onDownloadPdf={() => exportSummaryAs('pdf', summaryCards)}
                        onDownloadCsv={() => exportSummaryAs('csv', summaryCards)}
                    />
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {summaryCardsWithIcons.map(card => (
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
                </CardContent>
             </Card>
          </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1" id="order-type-report">
                <OrderTypeSummary
                    data={orderTypeChartData}
                    onPrint={() => handlePrint('order-type-report')}
                    selectedType={selectedOrderType}
                    onSelectType={setSelectedOrderType}
                />
            </div>
             <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div id="payment-method-report">
                    <PaymentMethodBreakdown 
                        data={paymentChartData}
                        selectedMethod={selectedPaymentMethod}
                        onSelectMethod={setSelectedPaymentMethod}
                        onPrint={() => handlePrint('payment-method-report')}
                    />
                </div>
                 <div id="adjustments-report">
                    <OrderAdjustmentsSummary 
                        data={adjustmentChartData}
                        selectedType={selectedAdjustmentType}
                        onSelectType={setSelectedAdjustmentType}
                        onPrint={() => handlePrint('adjustments-report')}
                    />
                </div>
            </div>
        </div>

        <div id="completion-time-report">
            <CompletionTimeReport data={completionTimeData} onPrint={() => handlePrint('completion-time-report')} />
        </div>
        
          
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              <div className="lg:col-span-3 space-y-8">
                <div id="hourly-sales-report">
                    <HourlySalesReport data={hourlySalesChartData} onPrint={() => handlePrint('hourly-sales-report')} />
                </div>
                 <div id="daily-sales-report">
                    <DailySalesReport data={dailySalesChartData} onPrint={() => handlePrint('daily-sales-report')} />
                </div>
              </div>
              <div className="lg:col-span-2 grid grid-cols-1 gap-8">
                <div id="top-items-report">
                  <TopSellingItems data={topSellingItems} onPrint={() => handlePrint('top-items-report')} />
                </div>
                <div id="top-deals-report">
                  <TopSellingDeals data={topSellingDeals} onPrint={() => handlePrint('top-deals-report')} />
                </div>
              </div>
          </div>

           <div id="category-sales-table-report">
                <CategorySalesTable data={categoryChartData} onPrint={() => handlePrint('category-sales-table-report')} />
           </div>
      </div>
    </div>
    </TooltipProvider>
  );
}
