
"use client";
import type { Order, OrderStatus } from "@/lib/types";
import { OrderCard } from "@/components/cashier/OrderCard";
import { BarChart, Clock, CookingPot, CheckCircle, Loader, Info, Monitor, XCircle, CheckCheck, FileDown, FileText, Check, Bike } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrders } from "@/context/OrderContext";
import { useSettings } from "@/context/SettingsContext";
import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { OrderReceipt } from "@/components/cashier/OrderReceipt";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import QueuePage from "@/app/admin/queue/page";
import { exportOrderListAs } from "@/lib/exporter";
import { format } from "date-fns";

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


export default function CashierPage() {
  const { orders, isLoading, updateOrderStatus } = useOrders();
  const { settings, isLoading: isSettingsLoading } = useSettings();
  const [activeTab, setActiveTab] = useState<OrderStatus | "All">("All");

  const getOrdersByStatus = (status: OrderStatus) => orders.filter(o => o.status === status);

  const displayedOrders = useMemo(() => {
    const sortedOrders = [...orders].sort((a,b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
    if (activeTab === "All") return sortedOrders;
    return sortedOrders.filter(o => o.status === activeTab);
  }, [orders, activeTab]);

  const defaultBranch = settings.branches.find(b => b.id === settings.defaultBranchId) || settings.branches[0];

  const handleDownload = (format: 'pdf' | 'csv') => {
      if (!defaultBranch) return;
      const title = `Cashier Orders - ${activeTab} (${format(new Date(), 'yyyy-MM-dd')})`;
      exportOrderListAs(format, displayedOrders, title, { companyName: settings.companyName, branchName: defaultBranch.name });
  };
  
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
            <p className="ml-4 text-muted-foreground">Loading Dashboard...</p>
        </div>
      )
  }

  return (
    <div className="w-full p-4 lg:p-8">
      <header className="mb-8 flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
            <h1 className="font-headline text-4xl font-bold">Cashier Dashboard</h1>
            <p className="text-muted-foreground">Manage running, ready, and completed orders.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
            <Dialog>
                <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                        <Monitor className="mr-2 h-4 w-4" />
                        View Order Queue
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-7xl h-[90vh] flex flex-col">
                    <DialogHeader>
                      <DialogTitle>Order Queue</DialogTitle>
                      <DialogDescription>
                        A live view of the public order queue display.
                      </DialogDescription>
                    </DialogHeader>
                    <QueuePage isEmbedded={true} />
                </DialogContent>
            </Dialog>
        </div>
      </header>

       <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
            <div className="flex justify-between items-center mb-8">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 md:grid-cols-7 h-auto">
                    {statusTabs.map(status => {
                        const Icon = tabIcons[status];
                        const count = status === "All" ? orders.length : getOrdersByStatus(status).length;
                        return (
                            <TabsTrigger key={status} value={status} className="flex gap-2 py-2 text-base flex-wrap">
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
                        Array.from({ length: 6 }).map((_, i) => <OrderCard.Skeleton key={i} />)
                    ) : displayedOrders.length > 0 ? (
                        displayedOrders.map((order) => <OrderCard key={order.id} order={order} workflow="cashier" onUpdateStatus={updateOrderStatus} isMutable={true}><OrderInfoModal order={order} /></OrderCard>)
                    ) : (
                        <Card className="lg:col-span-2 xl:col-span-3 flex flex-col items-center justify-center p-12 text-center">
                            <Clock className="h-16 w-16 text-muted-foreground/50 mb-4" />
                            <h3 className="font-headline text-xl font-semibold">No orders found</h3>
                            <p className="text-muted-foreground">There are no orders with this status right now.</p>
                        </Card>
                    )}
                </div>
            </TabsContent>
        </Tabs>
    </div>
  );
}
