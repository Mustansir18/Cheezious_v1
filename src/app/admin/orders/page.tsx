
"use client";
import type { Order, OrderStatus } from "@/lib/types";
import { OrderCard } from "@/components/cashier/OrderCard";
import { Clock, CookingPot, CheckCircle, Loader, Info, Calendar as CalendarIcon, XCircle, Search, CheckCheck, Check, FileDown, FileText, Bike } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useOrders } from "@/context/OrderContext";
import { useSettings } from "@/context/SettingsContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { OrderReceipt } from "@/components/cashier/OrderReceipt";
import { Button } from "@/components/ui/button";
import { useState, useMemo, useEffect } from "react";
import { DateRange } from "react-day-picker";
import { format, subDays } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { exportOrderListAs } from "@/lib/exporter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";


function getBusinessDay(date: Date, start: string, end: string): { start: Date, end: Date } {
  const [startHour, startMinute] = start.split(':').map(Number);
  const [endHour, endMinute] = end.split(':').map(Number);

  let businessDayStart = new Date(date);
  businessDayStart.setHours(startHour, startMinute, 0, 0);

  let businessDayEnd = new Date(date);
  if (startHour > endHour) { // Business day crosses midnight
    businessDayEnd.setDate(businessDayEnd.getDate() + 1);
  }
  businessDayEnd.setHours(endHour, endMinute, 59, 999);

  return { start: businessDayStart, end: businessDayEnd };
}


function OrderInfoModal({ order }: { order: Order }) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 print-hidden">
                    <Info className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xs">
                <DialogHeader>
                    <DialogTitle>Order Details</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <OrderReceipt order={order} />
                </div>
            </DialogContent>
        </Dialog>
    )
}


export default function AdminOrdersPage() {
  const { orders, isLoading, updateOrderStatus } = useOrders();
  const { settings, isLoading: isSettingsLoading } = useSettings();
  const [activeTab, setActiveTab] = useState<OrderStatus | "All">("All");
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFloor, setSelectedFloor] = useState<string>('all');
  const [selectedOrderType, setSelectedOrderType] = useState<string>('all');

  const [date, setDate] = useState<Date | undefined>(new Date());

  const today = new Date();
  const isToday = date ? format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd') : true;

  // Reset floor filter if order type is not 'Dine-In' or 'all'
  useEffect(() => {
    if (selectedOrderType !== 'Dine-In' && selectedOrderType !== 'all') {
      setSelectedFloor('all');
    }
  }, [selectedOrderType]);

  const filteredOrders = useMemo(() => {
    if (!date) return [];
    
    const { start: businessDayStart, end: businessDayEnd } = getBusinessDay(date, settings.businessDayStart, settings.businessDayEnd);

    let dateFilteredOrders = orders.filter(order => {
        const orderDate = new Date(order.orderDate);
        return orderDate >= businessDayStart && orderDate <= businessDayEnd;
    });

    // 1. Filter by Order Type Dropdown
    if (selectedOrderType !== 'all') {
        dateFilteredOrders = dateFilteredOrders.filter(order => order.orderType === selectedOrderType);
    }
    
    // 2. Filter by Floor Dropdown
    if (selectedFloor !== 'all') {
        dateFilteredOrders = dateFilteredOrders.filter(order => {
            if (order.orderType !== 'Dine-In') return false; // Only Dine-In orders have a floor
            const table = settings.tables.find(t => t.id === order.tableId);
            return table?.floorId === selectedFloor;
        });
    }

    // 3. Filter by Search Term
    if (searchTerm) {
        const lowercasedTerm = searchTerm.toLowerCase();
        dateFilteredOrders = dateFilteredOrders.filter(order => {
            const table = settings.tables.find(t => t.id === order.tableId);
            const floor = settings.floors.find(f => f.id === table?.floorId);

            const orderNumberMatch = order.orderNumber.toLowerCase().includes(lowercasedTerm);
            const orderTypeMatch = order.orderType.toLowerCase().includes(lowercasedTerm);
            const tableMatch = table && table.name.toLowerCase().includes(lowercasedTerm);
            const floorMatch = floor && floor.name.toLowerCase().includes(lowercasedTerm);
            
            return orderNumberMatch || orderTypeMatch || tableMatch || floorMatch;
        });
    }

    // Sort all orders by date, newest first
    dateFilteredOrders.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());

    return dateFilteredOrders;

  }, [orders, date, settings, searchTerm, selectedFloor, selectedOrderType]);


  const getOrdersByStatus = (status: OrderStatus) => filteredOrders.filter(o => o.status === status);

  const displayedOrders = activeTab === "All" ? filteredOrders : getOrdersByStatus(activeTab as OrderStatus);
  const defaultBranch = settings.branches.find(b => b.id === settings.defaultBranchId) || settings.branches[0];

  const handleDownload = (format: 'pdf' | 'csv') => {
      if (!defaultBranch) return;
      const title = `Orders - ${activeTab} (${formatDateForFilename(date)})`;
      exportOrderListAs(format, displayedOrders, title, { companyName: settings.companyName, branchName: defaultBranch.name });
  };
    
  const formatDateForFilename = (date: Date | undefined) => {
      return date ? format(date, 'yyyy-MM-dd') : 'all-time';
  }

  const statusTabs: (OrderStatus | "All")[] = ["All", "Pending", "Preparing", "Partial Ready", "Ready", "Completed", "Cancelled"];
  const tabIcons: Record<OrderStatus | "All", React.ElementType> = {
    All: Clock,
    Pending: Clock,
    Preparing: CookingPot,
    "Partial Ready": Check,
    Ready: CheckCheck,
    Completed: CheckCircle,
    Cancelled: XCircle,
  };


  if (isLoading || isSettingsLoading) {
      return (
        <div className="flex h-screen items-center justify-center">
            <Loader className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-4 text-muted-foreground">Loading Orders...</p>
        </div>
      )
  }

  return (
    <div className="w-full p-4 md:p-6 lg:p-8">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
            <h1 className="font-headline text-4xl font-bold">Order Management</h1>
            <p className="text-muted-foreground">Live view of all running, ready, and completed orders.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
             <Popover>
                <PopoverTrigger asChild>
                <Button
                    id="date"
                    variant={"outline"}
                    className={cn(
                    "w-full md:w-[200px] justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    disabled={(d) => d > new Date() || d < subDays(new Date(), 30)}
                />
                </PopoverContent>
            </Popover>
        </div>
      </header>

      <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
                <Label htmlFor="search-filter">Search</Label>
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        id="search-filter"
                        placeholder="Filter by order #, table..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor="type-filter">Filter by Order Type</Label>
                <Select value={selectedOrderType} onValueChange={setSelectedOrderType}>
                    <SelectTrigger id="type-filter">
                        <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Order Types</SelectItem>
                        <SelectItem value="Dine-In">Dine-In</SelectItem>
                        <SelectItem value="Take-Away">Take-Away</SelectItem>
                        <SelectItem value="Delivery">Delivery</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            {(selectedOrderType === 'Dine-In' || selectedOrderType === 'all') && (
                <div className="space-y-2">
                    <Label htmlFor="floor-filter">Filter by Floor</Label>
                    <Select value={selectedFloor} onValueChange={setSelectedFloor}>
                        <SelectTrigger id="floor-filter">
                            <SelectValue placeholder="All Floors" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Floors</SelectItem>
                            {settings.floors.map(floor => (
                                <SelectItem key={floor.id} value={floor.id}>{floor.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}
      </div>
      
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
            <div className="flex justify-between items-center mb-8">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-7 h-auto">
                    {statusTabs.map(status => {
                        const Icon = tabIcons[status];
                        const count = status === "All" ? filteredOrders.length : getOrdersByStatus(status).length;
                        return (
                            <TabsTrigger key={status} value={status} className="flex gap-2 flex-wrap py-2">
                                <Icon className="h-4 w-4" />
                                {status} ({count})
                            </TabsTrigger>
                        )
                    })}
                </TabsList>
                 <div className="flex gap-2 ml-4">
                    <Button variant="outline" onClick={() => handleDownload('csv')} disabled={displayedOrders.length === 0}><FileDown className="mr-2 h-4 w-4" /> CSV</Button>
                    <Button variant="outline" onClick={() => handleDownload('pdf')} disabled={displayedOrders.length === 0}><FileText className="mr-2 h-4 w-4" /> PDF</Button>
                </div>
            </div>

            <TabsContent value={activeTab}>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {isLoading ? (
                        Array.from({ length: 3 }).map((_, i) => <OrderCard.Skeleton key={i} />)
                    ) : displayedOrders.length > 0 ? (
                    displayedOrders.map((order) => <OrderCard key={order.id} order={order} workflow="cashier" onUpdateStatus={updateOrderStatus} isMutable={isToday}><OrderInfoModal order={order} /></OrderCard>)
                    ) : (
                    <Card className="lg:col-span-2 xl:col-span-3 flex flex-col items-center justify-center p-12 text-center">
                        <Search className="h-16 w-16 text-muted-foreground/50 mb-4" />
                        <h3 className="font-headline text-xl font-semibold">No orders found</h3>
                        <p className="text-muted-foreground">
                            {searchTerm || selectedFloor !== 'all' || selectedOrderType !== 'all' ? "No orders match your search or filter criteria." : "There are no orders with this status for the selected business day."}
                        </p>
                    </Card>
                    )}
                </div>
            </TabsContent>
        </Tabs>
    </div>
  );
}
