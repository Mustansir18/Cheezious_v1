
"use client";

import { useState, useMemo } from 'react';
import jsPDF from 'jspdf';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { useOrders } from '@/context/OrderContext';
import { useMenu } from '@/context/MenuContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Target, DollarSign, FileDown, FileText, Utensils, ShoppingBag } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { Pie, PieChart, ResponsiveContainer, Cell, Tooltip } from 'recharts';

export default function SalesTargetPage() {
    const { orders } = useOrders();
    const { menu } = useMenu();

    const [targetType, setTargetType] = useState<'item' | 'category' | 'menu'>('category');
    const [selectedId, setSelectedId] = useState<string>('');
    const [targetAmount, setTargetAmount] = useState<number>(10000);
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: new Date(new Date().setHours(0, 0, 0, 0)),
        to: new Date(),
    });

    const targetData = useMemo(() => {
        if ((targetType !== 'menu' && !selectedId) || targetAmount <= 0) return null;

        const filteredOrders = orders.filter(order => {
            const orderDate = new Date(order.orderDate);
            if (!dateRange?.from) return false;
            const toDate = dateRange.to ? new Date(dateRange.to) : new Date();
            toDate.setHours(23, 59, 59, 999);
            return order.status === 'Completed' && orderDate >= dateRange.from && orderDate <= toDate;
        });

        let actualSales = 0;
        let dineInSales = 0;
        let takeAwaySales = 0;
        let targetName = "Whole Menu";

        const calculateSales = (order: typeof orders[0]) => {
            if (targetType === 'item') {
                return order.items
                    .filter(item => item.menuItemId === selectedId)
                    .reduce((itemSum, item) => itemSum + (item.itemPrice * item.quantity), 0);
            } else if (targetType === 'category') {
                const itemIdsInCategory = menu.items.filter(item => item.categoryId === selectedId).map(item => item.id);
                return order.items
                    .filter(item => itemIdsInCategory.includes(item.menuItemId))
                    .reduce((itemSum, item) => itemSum + (item.itemPrice * item.quantity), 0);
            }
            return order.totalAmount; // Whole menu
        };

        filteredOrders.forEach(order => {
            const orderSales = calculateSales(order);
            actualSales += orderSales;
            if (order.orderType === 'Dine-In') {
                dineInSales += orderSales;
            } else if (order.orderType === 'Take-Away') {
                takeAwaySales += orderSales;
            }
        });
        
        if (targetType === 'item') {
            targetName = menu.items.find(i => i.id === selectedId)?.name || 'N/A';
        } else if (targetType === 'category') {
            targetName = menu.categories.find(c => c.id === selectedId)?.name || 'N/A';
        }

        const percentage = (actualSales / targetAmount) * 100;
        const salesBreakdown = [
            { name: 'Dine-In', sales: dineInSales, fill: 'hsl(var(--chart-1))' },
            { name: 'Take-Away', sales: takeAwaySales, fill: 'hsl(var(--chart-2))' },
        ].filter(item => item.sales > 0);

        return {
            targetAmount,
            actualSales,
            percentage,
            name: targetName,
            salesBreakdown,
        };
    }, [orders, menu, targetType, selectedId, targetAmount, dateRange]);
    
    const handleDownloadPDF = () => {
        if (!targetData) return;
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text(`Sales Target Report: ${targetData.name}`, 14, 22);

        doc.setFontSize(11);
        doc.text(`Period: ${dateDisplay}`, 14, 32);

        doc.setFontSize(12);
        doc.text(`Target Amount: RS ${targetData.targetAmount.toLocaleString()}`, 14, 45);
        doc.text(`Achieved Sales: RS ${targetData.actualSales.toLocaleString()}`, 14, 52);
        doc.text(`Percentage Reached: ${targetData.percentage.toFixed(2)}%`, 14, 59);

        doc.save(`sales-target-report-${targetData.name}.pdf`);
    };

    const handleDownloadExcel = () => {
        if (!targetData) return;
        const zip = new JSZip();
        let content = "Sales Target Report\n\n";
        content += `Target Name: ${targetData.name}\n`;
        content += `Period: ${dateDisplay}\n\n`;
        content += `Target Amount,Achieved Sales,Percentage\n`;
        content += `${targetData.targetAmount},${targetData.actualSales},${targetData.percentage.toFixed(2)}%\n`;

        zip.file("report.txt", content);
        zip.generateAsync({ type: "blob" }).then(function(content) {
            saveAs(content, `sales-target-report-${targetData.name}.zip`);
        });
    };

    const selectionOptions = targetType === 'item' ? menu.items : menu.categories;
    const dateDisplay = dateRange?.from
      ? dateRange.to
        ? `${format(dateRange.from, "LLL dd, y")} - ${format(dateRange.to, "LLL dd, y")}`
        : format(dateRange.from, "LLL dd, y")
      : "Pick a date range";

    return (
        <div className="container mx-auto p-4 lg:p-8">
            <header className="mb-8">
                <h1 className="font-headline text-4xl font-bold">Sales Targets</h1>
                <p className="text-muted-foreground">Set and track sales goals for items or categories.</p>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle>Target Configuration</CardTitle>
                    <CardDescription>Define your sales target and the period to track.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div className="space-y-2">
                        <Label>Target Type</Label>
                        <Select value={targetType} onValueChange={(v) => { setTargetType(v as any); setSelectedId(''); }}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="menu">Whole Menu</SelectItem>
                                <SelectItem value="category">Category</SelectItem>
                                <SelectItem value="item">Menu Item</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {targetType !== 'menu' && (
                        <div className="space-y-2">
                            <Label>Select {targetType === 'item' ? 'Item' : 'Category'}</Label>
                            <Select value={selectedId} onValueChange={setSelectedId}>
                                <SelectTrigger><SelectValue placeholder={`Select a ${targetType}`} /></SelectTrigger>
                                <SelectContent>
                                    {selectionOptions.map(option => (
                                        <SelectItem key={option.id} value={option.id}>{option.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="target-amount">Target Amount (RS)</Label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="target-amount"
                                type="number"
                                value={targetAmount}
                                onChange={(e) => setTargetAmount(Number(e.target.value))}
                                className="pl-10"
                            />
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label>Date Range</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn("w-full justify-start text-left font-normal", !dateRange && "text-muted-foreground")}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    <span>{dateDisplay}</span>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                                <Calendar initialFocus mode="range" selected={dateRange} onSelect={setDateRange} numberOfMonths={2} />
                            </PopoverContent>
                        </Popover>
                    </div>
                </CardContent>
            </Card>

            {targetData && (
                <div className="mt-8 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center"><Target className="mr-2 text-primary"/>Target Progress: {targetData.name}</CardTitle>
                            <CardDescription>Showing progress for the period: {dateDisplay}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <div className="flex justify-between mb-1 text-sm font-medium">
                                    <span>Achieved: RS {Math.round(targetData.actualSales).toLocaleString()}</span>
                                    <span className="text-muted-foreground">Target: RS {targetData.targetAmount.toLocaleString()}</span>
                                </div>
                                <Progress value={targetData.percentage} className="h-4" />
                            </div>
                            <div className="text-center text-2xl font-bold">
                                {targetData.percentage.toFixed(2)}%
                                <span className="text-sm font-normal text-muted-foreground ml-1">of target reached</span>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-end gap-2">
                            <Button variant="outline" onClick={handleDownloadPDF}>
                                <FileText className="mr-2 h-4 w-4" /> Download PDF
                            </Button>
                            <Button variant="outline" onClick={handleDownloadExcel}>
                                <FileDown className="mr-2 h-4 w-4" /> Download Excel
                            </Button>
                        </CardFooter>
                    </Card>

                    {targetData.salesBreakdown.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Sales Breakdown by Order Type</CardTitle>
                                <CardDescription>Dine-In vs. Take-Away sales for the selected target.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col md:flex-row items-center justify-center gap-8">
                                <ResponsiveContainer width="100%" height={200} className="max-w-[200px]">
                                    <PieChart>
                                        <Tooltip
                                            cursor={{ fill: 'hsl(var(--muted))' }}
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                return (
                                                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                                                        <div className="flex flex-col">
                                                            <span className="text-[0.70rem] uppercase text-muted-foreground">{payload[0].name}</span>
                                                            <span className="font-bold">RS {payload[0].value ? Math.round(payload[0].value as number).toLocaleString() : 0}</span>
                                                        </div>
                                                    </div>
                                                );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Pie
                                            data={targetData.salesBreakdown}
                                            dataKey="sales"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={40}
                                            outerRadius={70}
                                            paddingAngle={5}
                                        >
                                            {targetData.salesBreakdown.map((entry) => (
                                                <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="grid grid-cols-1 gap-4 w-full md:w-auto">
                                    {targetData.salesBreakdown.map(entry => (
                                        <div key={entry.name} className="flex items-center gap-4 rounded-lg border p-3">
                                            {entry.name === 'Dine-In' ? <Utensils className="h-6 w-6 text-muted-foreground" /> : <ShoppingBag className="h-6 w-6 text-muted-foreground" />}
                                            <div>
                                                <p className="text-sm text-muted-foreground">{entry.name}</p>
                                                <p className="text-lg font-bold">RS {Math.round(entry.sales).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
}
