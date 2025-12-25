
"use client";
import type { Order, OrderStatus } from "@/lib/types";
import { OrderCard } from "@/components/cashier/OrderCard";
import { Clock, CookingPot, CheckCircle, Loader, Info, Calendar as CalendarIcon, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useOrders } from "@/context/OrderContext";
import { useSettings } from "@/context/SettingsContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { OrderReceipt } from "@/components/cashier/OrderReceipt";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { DateRange } from "react-day-picker";
import { format, subDays } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


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

  const [date, setDate] = useState<Date | undefined>(new Date());

  const today = new Date();
  const isToday = date ? format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd') : true;

  const filteredOrders = useMemo(() => {
    if (!date) return [];
    
    const { start: businessDayStart, end: businessDayEnd } = getBusinessDay(date, settings.businessDayStart, settings.businessDayEnd);

    return orders.filter(order => {
        const orderDate = new Date(order.orderDate);
        return orderDate >= businessDayStart && orderDate <= businessDayEnd;
    });
  }, [orders, date, settings.businessDayStart, settings.businessDayEnd]);


  const getOrdersByStatus = (status: OrderStatus) => filteredOrders.filter(o => o.status === status);

  const displayedOrders = activeTab === "All" ? filteredOrders : getOrdersByStatus(activeTab as OrderStatus);

  const statusTabs: (OrderStatus | "All")[] = ["All", "Pending", "Preparing", "Ready", "Completed", "Cancelled"];
  const tabIcons: Record<OrderStatus | "All", React.ElementType> = {
    All: Clock,
    Pending: Clock,
    Preparing: CookingPot,
    Ready: CheckCircle,
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
    <div className="container mx-auto p-4 lg:p-8">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
            <h1 className="font-headline text-4xl font-bold">Order Management</h1>
            <p className="text-muted-foreground">Live view of all running, ready, and completed orders.</p>
        </div>
         <Popover>
            <PopoverTrigger asChild>
            <Button
                id="date"
                variant={"outline"}
                className={cn(
                "w-[200px] justify-start text-left font-normal",
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
      </header>
      
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-6 mb-8">
                 {statusTabs.map(status => {
                     const Icon = tabIcons[status];
                     const count = status === "All" ? filteredOrders.length : getOrdersByStatus(status).length;
                     return (
                        <TabsTrigger key={status} value={status} className="flex gap-2">
                            <Icon className="h-4 w-4" />
                            {status} ({count})
                        </TabsTrigger>
                     )
                 })}
            </TabsList>

            <TabsContent value={activeTab}>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {isLoading ? (
                        Array.from({ length: 3 }).map((_, i) => <OrderCard.Skeleton key={i} />)
                    ) : displayedOrders.length > 0 ? (
                    displayedOrders.map((order) => <OrderCard key={order.id} order={order} workflow="cashier" onUpdateStatus={updateOrderStatus} isMutable={isToday}><OrderInfoModal order={order} /></OrderCard>)
                    ) : (
                    <Card className="lg:col-span-2 xl:col-span-3 flex flex-col items-center justify-center p-12 text-center">
                        <Clock className="h-16 w-16 text-muted-foreground/50 mb-4" />
                        <h3 className="font-headline text-xl font-semibold">No orders found</h3>
                        <p className="text-muted-foreground">There are no orders with this status for the selected business day.</p>
                    </Card>
                    )}
                </div>
            </TabsContent>
        </Tabs>
    </div>
  );
}
