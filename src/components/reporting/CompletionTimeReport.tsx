
'use client';

import { useMemo } from 'react';
import type { Order } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Printer, FileDown, Clock, TrendingUp, TrendingDown, FileText } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { exportCompletionTimeAs } from '@/lib/exporter';
import { useSettings } from '@/context/SettingsContext';

export interface CompletionTimeData {
  orders: Order[];
  filteredOrders: Order[]; // This might be used if filtering is applied
}

interface CompletionTimeReportProps {
  data: CompletionTimeData;
  onPrint: () => void;
}

export function CompletionTimeReport({ data, onPrint }: CompletionTimeReportProps) {
  const { settings } = useSettings();
  const title = "Order Completion Time";
  const defaultBranch = settings.branches.find(b => b.id === settings.defaultBranchId) || settings.branches[0];

  const { completedOrders, avgCompletionTime, maxCompletionTime, minCompletionTime } = useMemo(() => {
    const ordersToAnalyze = data.filteredOrders.filter(
      (order) => order.status === 'Completed' && order.orderDate && order.completionDate
    );

    if (ordersToAnalyze.length === 0) {
      return { completedOrders: [], avgCompletionTime: 0, maxCompletionTime: 0, minCompletionTime: 0 };
    }

    const completionTimes = ordersToAnalyze.map((order) => {
      const startTime = new Date(order.orderDate).getTime();
      const endTime = new Date(order.completionDate!).getTime();
      return (endTime - startTime) / (1000 * 60); // in minutes
    });

    const totalMinutes = completionTimes.reduce((sum, time) => sum + time, 0);
    const avgCompletionTime = totalMinutes / ordersToAnalyze.length;
    const maxCompletionTime = Math.max(...completionTimes);
    const minCompletionTime = Math.min(...completionTimes);
    
    return { completedOrders: ordersToAnalyze, avgCompletionTime, maxCompletionTime, minCompletionTime };
  }, [data.filteredOrders]);

  const summaryStats = [
    { title: "Average Time", value: `${avgCompletionTime.toFixed(1)} min`, icon: Clock, color: "text-primary" },
    { title: "Minimum Time", value: `${minCompletionTime.toFixed(1)} min`, icon: TrendingDown, color: "text-green-500" },
    { title: "Maximum Time", value: `${maxCompletionTime.toFixed(1)} min`, icon: TrendingUp, color: "text-red-500" },
  ];

  const hasData = completedOrders.length > 0;
  
  const handleDownload = (format: 'pdf' | 'csv') => {
      if (!defaultBranch) return;
      exportCompletionTimeAs(format, completedOrders, title, { companyName: settings.companyName, branchName: defaultBranch.name });
  }

  return (
    <Card>
      <CardHeader className="flex-row justify-between items-center">
        <div>
          <CardTitle className="font-headline">Order Completion Time</CardTitle>
          <CardDescription>Time from order placement to completion for finalized orders.</CardDescription>
        </div>
        <div className="flex items-center gap-2 print-hidden">
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" disabled={!hasData} onClick={() => handleDownload('csv')}>
                        <FileDown className="h-4 w-4"/>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Download as CSV</p>
                </TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" disabled={!hasData} onClick={() => handleDownload('pdf')}>
                        <FileText className="h-4 w-4 text-red-500"/>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Download as PDF</p>
                </TooltipContent>
            </Tooltip>
            <Button variant="ghost" size="icon" onClick={onPrint}>
                <Printer className="h-4 w-4"/>
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        {hasData ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {summaryStats.map(stat => (
                <Card key={stat.title}>
                <CardContent className="p-4 flex items-center gap-4">
                    <stat.icon className={`h-8 w-8 ${stat.color}`} />
                    <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    </div>
                </CardContent>
                </Card>
            ))}
            </div>
        ) : (
             <div className="text-center py-10">
                <p className="text-muted-foreground">No completed orders in the selected period to analyze.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
