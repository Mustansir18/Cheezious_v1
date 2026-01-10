
'use client';

import { useOrders } from "@/context/OrderContext";
import { useMenu } from "@/context/MenuContext";
import { useSettings } from "@/context/SettingsContext";
import { useMemo, useState, useEffect, useCallback } from "react";
import type { Order } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar as CalendarIcon, ShoppingCart, DollarSign, Utensils, Loader, Printer, Scale, FileDown, Tag, Gift, XCircle, ShoppingBag, FileArchive, FileText, Landmark, Clock, Bike } from "lucide-react";
import { HourlySalesReport } from "@/components/reporting/HourlySalesReport";
import { DailySalesReport, type DailySale } from "@/components/reporting/DailySalesReport";
import { TopSellingItems } from "@/components/reporting/TopSellingItems";
import { TopSellingDeals } from "@/components/reporting/TopSellingDeals";
import { CategorySalesTable } from "@/components/reporting/CategorySalesTable";
import { PaymentMethodBreakdown, type PaymentData } from "@/components/reporting/PaymentMethodBreakdown";
import { OrderAdjustmentsSummary, type OrderAdjustmentData } from "@/components/reporting/OrderAdjustmentsSummary";
import { OrderTypeSummary, type OrderTypeData } from "@/components/reporting/OrderTypeSummary";
import { CompletionTimeReport } from "@/components/reporting/CompletionTimeReport";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, subDays, startOfHour, endOfHour, setHours } from "date-fns";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { ItemSale, DealSale, CategorySale } from "@/lib/types";
import { exportSummaryAs, exportAllReportsAsZip, exportOrderTypeDetailsAs } from '@/lib/exporter';
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';


const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));

function HourlyReportDetail() {
    const { orders } = useOrders();
    const { settings } = useSettings();
    const date = new Date();
    const [startHour, setStartHour] = useState<string>('00');
    const [endHour, setEndHour] = useState<string>('23');

    // Filters
    const [orderNumberFilter, setOrderNumberFilter] = useState('');
    const [orderTypeFilter, setOrderTypeFilter] = useState('all');
    const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');

    const reportData = useMemo(() => {
        if (!date || !startHour || !endHour) return null;

        const reportStartDate = startOfHour(setHours(date, parseInt(startHour)));
        const reportEndDate = endOfHour(setHours(date, parseInt(endHour)));

        const timeFilteredOrders = orders.filter(order => {
            const orderDate = new Date(order.orderDate);
            return order.status === 'Completed' && orderDate >= reportStartDate && orderDate <= reportEndDate;
        });

        const filteredOrders = timeFilteredOrders.filter(order => {
            const orderNumberMatch = !orderNumberFilter || order.orderNumber.toLowerCase().includes(orderNumberFilter.toLowerCase());
            const orderTypeMatch = orderTypeFilter === 'all' || order.orderType === orderTypeFilter;
            const paymentMethodMatch = paymentMethodFilter === 'all' || order.paymentMethod === paymentMethodFilter;
            return orderNumberMatch && orderTypeMatch && paymentMethodMatch;
        });
        
        filteredOrders.sort((a, b) => new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime());

        const totalSales = filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0);

        return {
            orders: filteredOrders,
            totalSales: totalSales,
            totalOrders: filteredOrders.length,
            reportDate: date,
            reportHours: `${startHour}:00 - ${endHour}:59`,
        };
    }, [orders, date, startHour, endHour, orderNumberFilter, orderTypeFilter, paymentMethodFilter]);
    
    const generatePdf = useCallback(() => {
        if (!reportData) return;
        const doc = new jsPDF();
        
        const branch = settings.branches.find(b => b.id === settings.defaultBranchId) || settings.branches[0];

        // Header
        doc.setFontSize(18);
        doc.text(settings.companyName, 14, 22);
        doc.setFontSize(12);
        doc.text(branch.name, 14, 30);
        doc.setFontSize(16);
        doc.text('Hourly Sales Report', 14, 40);
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Date: ${format(reportData.reportDate, 'PPP')}`, 14, 48);
        doc.text(`Time: ${reportData.reportHours}`, 14, 54);

        // Summary
        (doc as any).autoTable({
            startY: 65,
            head: [['Metric', 'Value']],
            body: [
                ['Total Sales', `RS ${Math.round(reportData.totalSales)}`],
                ['Total Orders', reportData.totalOrders.toString()],
            ],
            theme: 'striped',
        });
        
        const finalY = (doc as any).autoTable.previous.finalY;

        // Order Details
        (doc as any).autoTable({
            startY: finalY + 10,
            head: [['Time', 'Order #', 'Type', 'Amount (RS)']],
            body: reportData.orders.map(order => [
                format(new Date(order.orderDate), 'p'),
                order.orderNumber,
                order.orderType,
                Math.round(order.totalAmount).toLocaleString(),
            ]),
            theme: 'grid',
        });

        doc.save(`hourly-report-${format(reportData.reportDate, 'yyyy-MM-dd')}-${startHour}-${endHour}.pdf`);
    }, [reportData, settings, startHour, endHour]);

    const generateCsv = useCallback(() => {
        if (!reportData) return;
        
        let csvContent = `Hourly Sales Report\n`;
        csvContent += `Date: ${format(reportData.reportDate, 'PPP')}\n`;
        csvContent += `Time Range: ${reportData.reportHours}\n\n`;
        csvContent += `Total Sales,RS ${Math.round(reportData.totalSales)}\n`;
        csvContent += `Total Orders,${reportData.totalOrders}\n\n`;
        
        csvContent += `Time,Order #,Type,Payment,Amount (RS)\n`;
        reportData.orders.forEach(order => {
            csvContent += `${format(new Date(order.orderDate), 'p')},${order.orderNumber},${order.orderType},${order.paymentMethod},${Math.round(order.totalAmount)}\n`;
        });
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, `hourly-report-${format(reportData.reportDate, 'yyyy-MM-dd')}-${startHour}-${endHour}.csv`);
    }, [reportData, startHour, endHour]);


    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline flex items-center">
                    <Clock className="mr-2"/> Hourly Sales Report for {format(date, 'PPP')}
                </CardTitle>
                <CardDescription>Generate a detailed sales report for a specific time range for today.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end mb-8">
                    <div className="space-y-2">
                        <Label>Start Hour</Label>
                        <Select value={startHour} onValueChange={setStartHour}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {hours.map(hour => (
                                    <SelectItem key={`start-${hour}`} value={hour} disabled={parseInt(hour) > parseInt(endHour)}>{hour}:00</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>End Hour</Label>
                        <Select value={endHour} onValueChange={setEndHour}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {hours.map(hour => (
                                    <SelectItem key={`end-${hour}`} value={hour} disabled={parseInt(hour) < parseInt(startHour)}>{hour}:59</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="flex items-center gap-2 print-hidden md:col-start-4">
                        <Button onClick={generateCsv} variant="outline" className="w-full">
                            <FileDown className="mr-2 h-4 w-4" /> CSV
                        </Button>
                        <Button onClick={generatePdf} variant="outline" className="w-full">
                            <FileText className="mr-2 h-4 w-4" /> PDF
                        </Button>
                    </div>
                </div>
                 {reportData && (
                    <>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Time</TableHead>
                                    <TableHead className="w-[200px]">
                                        <Input 
                                            placeholder="Filter Order #"
                                            value={orderNumberFilter}
                                            onChange={(e) => setOrderNumberFilter(e.target.value)}
                                            className="h-8"
                                        />
                                    </TableHead>
                                    <TableHead className="w-[150px]">
                                         <Select value={orderTypeFilter} onValueChange={setOrderTypeFilter}>
                                            <SelectTrigger className="h-8">
                                                <SelectValue placeholder="All Types" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Types</SelectItem>
                                                <SelectItem value="Dine-In">Dine-In</SelectItem>
                                                <SelectItem value="Take-Away">Take-Away</SelectItem>
                                                <SelectItem value="Delivery">Delivery</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </TableHead>
                                    <TableHead className="w-[180px]">
                                         <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                                            <SelectTrigger className="h-8">
                                                <SelectValue placeholder="All Payment Methods" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Methods</SelectItem>
                                                {settings.paymentMethods.map(pm => (
                                                    <SelectItem key={pm.id} value={pm.name}>{pm.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </TableHead>
                                    <TableHead className="text-right">Amount (RS)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reportData.orders.map(order => (
                                    <TableRow key={order.id}>
                                        <TableCell>{format(new Date(order.orderDate), 'p')}</TableCell>
                                        <TableCell className="font-medium">{order.orderNumber}</TableCell>
                                        <TableCell>{order.orderType}</TableCell>
                                        <TableCell>{order.paymentMethod}</TableCell>
                                        <TableCell className="text-right font-semibold">{Math.round(order.totalAmount).toLocaleString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                         {reportData.orders.length === 0 && (
                            <div className="text-center py-12 text-muted-foreground">
                                No completed orders found with the current filters.
                            </div>
                        )}
                    </>
                 )}
            </CardContent>
        </Card>
    );
}


export interface HourlySale {
  hour: string;
  sales: number;
}

function ReportCardActions({ reportId, onPrint, onDownloadPdf, onDownloadCsv }: { reportId: string; onPrint: (id: string) => void, onDownloadPdf: () => void, onDownloadCsv: () => void }) {
    return (
        <div className="flex items-center gap-2 print-hidden">
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={onDownloadCsv}>
                        <FileDown className="h-4 w-4"/>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Download as CSV</p>
                </TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={onDownloadPdf}>
                        <FileText className="h-4 w-4 text-red-500"/>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Download as PDF</p>
                </TooltipContent>
            </Tooltip>
            <Button variant="ghost" size="icon" onClick={() => onPrint(reportId)}>
                <Printer className="h-4 w-4"/>
            </Button>
        </div>
    );
}


export default function ReportingPage() {
  const { orders, isLoading } = useOrders();
  const { menu, isLoading: isMenuLoading } = useMenu();
  const { settings, isLoading: isSettingsLoading } = useSettings();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [selectedOrderType, setSelectedOrderType] = useState<string | null>(null);
  const [selectedAdjustmentType, setSelectedAdjustmentType] = useState<string | null>(null);
  const [topItemsLimit, setTopItemsLimit] = useState(5);
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
    const totalTax = filteredOrders.reduce((sum, order) => sum + order.taxAmount, 0);
    const netSales = totalSales - totalTax;
    const totalItemsSold = filteredOrders.reduce(
      (sum, order) =>
        sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
      0
    );
    const averageOrderSize = totalOrders > 0 ? totalSales / totalOrders : 0;

    const itemSales: { [key: string]: ItemSale } = {};
    const dealSales: { [key: string]: DealSale } = {};
    const hourlySales: { [key: number]: number } = {};
    const categorySales: { [key: string]: { sales: number, id: string} } = {};
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
    const deliveryOrders = orderTypeFiltered.filter((o) => o.orderType === "Delivery");

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
            if (!categorySales[menuItem.categoryId]) {
              categorySales[menuItem.categoryId] = { sales: 0, id: menuItem.categoryId };
            }
            categorySales[menuItem.categoryId].sales += revenue;


            if (menuItem.categoryId === 'deals') {
                if (!dealSales[item.menuItemId]) {
                    dealSales[item.menuItemId] = { id: item.menuItemId, name: item.name, quantity: 0, totalRevenue: 0 };
                }
                dealSales[item.menuItemId].quantity += item.quantity;
                dealSales[item.menuItemId].totalRevenue += revenue;
            } else {
                 if (!itemSales[item.menuItemId]) {
                    itemSales[item.menuItemId] = { id: item.menuItemId, name: item.name, quantity: 0, totalRevenue: 0 };
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
        { type: 'Dine-In', count: dineInOrders.length, sales: dineInOrders.reduce((sum, o) => sum + o.totalAmount, 0), icon: Utensils, fill: 'hsl(var(--chart-1))', orders: dineInOrders },
        { type: 'Take-Away', count: takeAwayOrders.length, sales: takeAwayOrders.reduce((sum, o) => sum + o.totalAmount, 0), icon: ShoppingBag, fill: 'hsl(var(--chart-2))', orders: takeAwayOrders },
        { type: 'Delivery', count: deliveryOrders.length, sales: deliveryOrders.reduce((sum, o) => sum + o.totalAmount, 0), icon: Bike, fill: 'hsl(var(--chart-3))', orders: deliveryOrders },
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

    const completionTimeData = {
        orders: baseFilteredOrders,
        filteredOrders: filteredOrders,
    };
    
    const categoryChartData: CategorySale[] = Object.entries(categorySales).map(([categoryId, { sales }], index) => {
        const category = menu.categories.find(c => c.id === categoryId);
        return {
            id: categoryId,
            name: category?.name || 'Uncategorized',
            sales: sales,
            fill: `hsl(var(--chart-${index + 1}))`
        };
    }).filter(c => c.sales > 0);

    const summaryCards = [
        { title: "Total Sales", value: `RS ${Math.round(totalSales)}` },
        { title: "Net Sales (w/o Tax)", value: `RS ${Math.round(netSales)}` },
        { title: "Total Tax", value: `RS ${Math.round(totalTax)}` },
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

  const defaultBranch = settings.branches.find(b => b.id === settings.defaultBranchId) || settings.branches[0];

  const handleExportAll = async () => {
      if (!reportData || !defaultBranch) return;
      toast({
          title: 'Exporting All Reports',
          description: 'Your download will begin shortly...'
      });
      await exportAllReportsAsZip({
          ...reportData,
          companyName: settings.companyName,
          branchName: defaultBranch.name,
          dateDisplay,
      });
  }


  if (isLoading || isMenuLoading || isSettingsLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Loading Reports...</p>
      </div>
    );
  }
  
  if (!reportData || orders.length === 0 || !defaultBranch) {
      return (
        <div className="w-full p-4 lg:p-8 text-center">
             <header className="mb-8">
                <h1 className="font-headline text-4xl font-bold">{settings.companyName} Reports</h1>
                <p className="text-muted-foreground">No sales data available for the current session.</p>
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
    { ...summaryCards[1], icon: DollarSign },
    { ...summaryCards[2], icon: Landmark },
    { ...summaryCards[3], icon: ShoppingCart },
    { ...summaryCards[4], icon: Scale },
    { ...summaryCards[5], icon: Utensils },
  ];
  
  const activeFilters = [selectedOrderType, selectedPaymentMethod, selectedAdjustmentType].filter(Boolean);
  let filterDescription = `Sales data for: ${dateDisplay}.`;
  if (activeFilters.length > 0) {
      filterDescription = `Displaying '${activeFilters.join(', ')}' orders for: ${dateDisplay}.`
  }


  return (
    <TooltipProvider>
    <div className="w-full p-4 lg:p-8">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
            <h1 className="font-headline text-4xl font-bold">{settings.companyName} Reports</h1>
            <p className="font-semibold text-lg text-primary">{defaultBranch.name}</p>
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
                        <CardDescription>Top-level metrics for {defaultBranch.name} during the selected period.</CardDescription>
                    </div>
                    <ReportCardActions 
                        reportId="summary-report" 
                        onPrint={handlePrint}
                        onDownloadPdf={() => exportSummaryAs('pdf', summaryCards, { companyName: settings.companyName, branchName: defaultBranch.name, dateDisplay })}
                        onDownloadCsv={() => exportSummaryAs('csv', summaryCards)}
                    />
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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
                    headerInfo={{ companyName: settings.companyName, branchName: defaultBranch.name, dateDisplay }}
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
                  <TopSellingItems 
                    data={topSellingItems} 
                    onPrint={() => handlePrint('top-items-report')} 
                    limit={topItemsLimit}
                    onLimitChange={setTopItemsLimit}
                  />
                </div>
                <div id="top-deals-report">
                  <TopSellingDeals data={topSellingDeals} onPrint={() => handlePrint('top-deals-report')} />
                </div>
              </div>
          </div>

           <div id="category-sales-table-report">
                <CategorySalesTable data={categoryChartData} onPrint={() => handlePrint('category-sales-table-report')} />
           </div>

           <div id="hourly-report-detail">
                <HourlyReportDetail />
           </div>
      </div>
    </div>
    </TooltipProvider>
  );
}
