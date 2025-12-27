
"use client";

import { useState, useMemo, useCallback } from 'react';
import { useOrders } from '@/context/OrderContext';
import { useSettings } from '@/context/SettingsContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { format, startOfDay, endOfDay, setHours, startOfHour, endOfHour } from 'date-fns';
import { Calendar as CalendarIcon, Printer, DollarSign, ShoppingCart, FileText, FileDown, X } from 'lucide-react';
import type { Order } from '@/lib/types';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { saveAs } from 'file-saver';
import { Input } from '@/components/ui/input';


const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));

export default function HourlyReportPage() {
    const { orders } = useOrders();
    const { settings } = useSettings();
    const [date, setDate] = useState<Date>(new Date());
    const [startHour, setStartHour] = useState<string>('00');
    const [endHour, setEndHour] = useState<string>('23');

    // Filters
    const [orderNumberFilter, setOrderNumberFilter] = useState('');
    const [orderTypeFilter, setOrderTypeFilter] = useState('');
    const [paymentMethodFilter, setPaymentMethodFilter] = useState('');

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
            const orderTypeMatch = !orderTypeFilter || order.orderType === orderTypeFilter;
            const paymentMethodMatch = !paymentMethodFilter || order.paymentMethod === paymentMethodFilter;
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
        doc.autoTable({
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
        doc.autoTable({
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
        <div className="container mx-auto p-4 lg:p-8">
            <header className="mb-8">
                <h1 className="font-headline text-4xl font-bold">Hourly Sales Report</h1>
                <p className="text-muted-foreground">Generate a detailed sales report for a specific date and time range.</p>
            </header>

            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>Report Configuration</CardTitle>
                    <CardDescription>Select a date and hour range to generate the report.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="space-y-2">
                        <Label>Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    <span>{date ? format(date, "PPP") : "Pick a date"}</span>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar initialFocus mode="single" selected={date} onSelect={(d) => d && setDate(d)} />
                            </PopoverContent>
                        </Popover>
                    </div>

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
                </CardContent>
            </Card>

            {reportData && (
                <Card id="printable-report">
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="font-headline text-2xl">Report for {format(reportData.reportDate, 'PPP')}</CardTitle>
                                <CardDescription>Showing sales from {reportData.reportHours}</CardDescription>
                            </div>
                            <div className="flex items-center gap-2 print-hidden">
                                <Button onClick={generateCsv} variant="outline">
                                    <FileDown className="mr-2 h-4 w-4" /> CSV
                                </Button>
                                <Button onClick={generatePdf} variant="outline">
                                    <FileText className="mr-2 h-4 w-4" /> PDF
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">RS {Math.round(reportData.totalSales).toLocaleString()}</div>
                                </CardContent>
                            </Card>
                             <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                                    <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{reportData.totalOrders.toLocaleString()}</div>
                                </CardContent>
                            </Card>
                        </div>
                        
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
                                                <SelectItem value="">All Types</SelectItem>
                                                <SelectItem value="Dine-In">Dine-In</SelectItem>
                                                <SelectItem value="Take-Away">Take-Away</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </TableHead>
                                    <TableHead className="w-[180px]">
                                         <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                                            <SelectTrigger className="h-8">
                                                <SelectValue placeholder="All Payment Methods" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="">All Methods</SelectItem>
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
                    </CardContent>
                </Card>
            )}

        </div>
    );
}
