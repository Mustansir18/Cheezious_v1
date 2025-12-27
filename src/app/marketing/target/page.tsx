
"use client";

import { useState, useMemo } from 'react';
import { useOrders } from '@/context/OrderContext';
import { useMenu } from '@/context/MenuContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Target, DollarSign } from 'lucide-react';
import type { DateRange } from 'react-day-picker';

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
        let targetName = "Whole Menu";

        if (targetType === 'item') {
            actualSales = filteredOrders.reduce((sum, order) => {
                const itemSales = order.items
                    .filter(item => item.menuItemId === selectedId)
                    .reduce((itemSum, item) => itemSum + (item.itemPrice * item.quantity), 0);
                return sum + itemSales;
            }, 0);
            targetName = menu.items.find(i => i.id === selectedId)?.name || 'N/A';
        } else if (targetType === 'category') {
            const itemIdsInCategory = menu.items.filter(item => item.categoryId === selectedId).map(item => item.id);
            actualSales = filteredOrders.reduce((sum, order) => {
                const categorySales = order.items
                    .filter(item => itemIdsInCategory.includes(item.menuItemId))
                    .reduce((itemSum, item) => itemSum + (item.itemPrice * item.quantity), 0);
                return sum + categorySales;
            }, 0);
            targetName = menu.categories.find(c => c.id === selectedId)?.name || 'N/A';
        } else { // 'menu'
            actualSales = filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0);
        }

        const percentage = (actualSales / targetAmount) * 100;

        return {
            targetAmount,
            actualSales,
            percentage,
            name: targetName,
        };
    }, [orders, menu, targetType, selectedId, targetAmount, dateRange]);

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
                <Card className="mt-8">
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
                </Card>
            )}
        </div>
    );
}
