

"use client";

import { useState, useMemo } from 'react';
import { useOrders } from '@/context/OrderContext';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DateRange } from "react-day-picker";
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from '@/lib/utils';
import { CalendarIcon, Search, FileDown, FileText, User } from 'lucide-react';
import { exportOrderListAs } from '@/lib/exporter';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function SaleVerificationPage() {
    const { orders, isLoading: isOrdersLoading } = useOrders();
    const { users, isLoading: isUsersLoading } = useAuth();
    const { settings, isLoading: isSettingsLoading } = useSettings();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUserId, setSelectedUserId] = useState('all');
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
      from: startOfDay(new Date()),
      to: endOfDay(new Date()),
    });

    const isLoading = isOrdersLoading || isUsersLoading || isSettingsLoading;

    const filteredOrders = useMemo(() => {
        let completedOrders = orders.filter(order => order.status === 'Completed');

        if (dateRange?.from) {
            const fromDate = startOfDay(dateRange.from);
            const toDate = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);

            completedOrders = completedOrders.filter(order => {
                const completionDate = order.completionDate ? new Date(order.completionDate) : new Date(order.orderDate);
                return completionDate >= fromDate && completionDate <= toDate;
            });
        }
        
        if (selectedUserId !== 'all') {
            completedOrders = completedOrders.filter(order => order.completedBy === selectedUserId);
        }

        if (searchTerm) {
            const lowercasedTerm = searchTerm.toLowerCase();
            completedOrders = completedOrders.filter(order => 
                order.orderNumber.toLowerCase().includes(lowercasedTerm)
            );
        }
        
        return completedOrders.sort((a, b) => new Date(b.completionDate || b.orderDate).getTime() - new Date(a.completionDate || a.orderDate).getTime());

    }, [orders, dateRange, selectedUserId, searchTerm]);

    const handleExport = (format: 'pdf' | 'csv') => {
      const title = `Sale Verification Report - ${selectedUserId === 'all' ? 'All Users' : users.find(u => u.id === selectedUserId)?.username}`;
      const defaultBranch = settings.branches.find(b => b.id === settings.defaultBranchId) || settings.branches[0];
      const data = filteredOrders.map(o => ({
          ...o,
          completedByName: users.find(u => u.id === o.completedBy)?.username || 'N/A',
          orderDate: new Date(o.orderDate).toLocaleString(),
          completionDate: o.completionDate ? new Date(o.completionDate).toLocaleString() : 'N/A',
      }));

      const columns = [
          { key: 'orderNumber', label: 'Order #' },
          { key: 'completionDate', label: 'Completion Time' },
          { key: 'totalAmount', label: 'Amount (RS)' },
          { key: 'completedByName', label: 'Completed By' },
      ];
      
       exportOrderListAs(format, data as any, title, { companyName: settings.companyName, branchName: defaultBranch?.name || '' });
    };
    
    const dateDisplay = dateRange?.from
      ? dateRange.to
        ? `${format(dateRange.from, "LLL dd, y")} - ${format(dateRange.to, "LLL dd, y")}`
        : format(dateRange.from, "LLL dd, y")
      : "Pick a date";

    if (isLoading) {
        return <div>Loading...</div>
    }

    return (
        <div className="w-full space-y-8">
            <header>
                <h1 className="font-headline text-4xl font-bold">Sale Verification Report</h1>
                <p className="text-muted-foreground">Track completed sales and verify which user handled each transaction.</p>
            </header>

            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                         <div>
                            <CardTitle>Completed Sales Log</CardTitle>
                            <CardDescription>A list of all orders marked as "Completed" within the selected filters.</CardDescription>
                         </div>
                         <div className="flex gap-2">
                             <Button variant="outline" onClick={() => handleExport('csv')} disabled={filteredOrders.length === 0}>
                                <FileDown className="mr-2 h-4 w-4" /> CSV
                            </Button>
                            <Button variant="outline" onClick={() => handleExport('pdf')} disabled={filteredOrders.length === 0}>
                                <FileText className="mr-2 h-4 w-4" /> PDF
                            </Button>
                         </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <Popover>
                            <PopoverTrigger asChild>
                            <Button
                                id="date"
                                variant={"outline"}
                                className={cn("w-full justify-start text-left font-normal", !dateRange && "text-muted-foreground")}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                <span>{dateDisplay}</span>
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
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
                        <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a user" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Users</SelectItem>
                                {users.filter(u => u.role === 'cashier' || u.role === 'admin' || u.role === 'root').map(user => (
                                    <SelectItem key={user.id} value={user.id}>
                                       <span className="flex items-center"><User className="mr-2 h-4 w-4" /> {user.username}</span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                         <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by Order #"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    <ScrollArea className="h-[60vh]">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Order #</TableHead>
                                    <TableHead>Completion Time</TableHead>
                                    <TableHead>Completed By</TableHead>
                                    <TableHead className="text-right">Amount (RS)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredOrders.map(order => (
                                    <TableRow key={order.id}>
                                        <TableCell className="font-mono">{order.orderNumber}</TableCell>
                                        <TableCell>{order.completionDate ? format(new Date(order.completionDate), 'PPpp') : 'N/A'}</TableCell>
                                        <TableCell className="font-medium">
                                            {users.find(u => u.id === order.completedBy)?.username || 'N/A'}
                                        </TableCell>
                                        <TableCell className="text-right font-semibold">{Math.round(order.totalAmount).toLocaleString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                    {filteredOrders.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                            <p>No completed sales match the selected criteria.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
