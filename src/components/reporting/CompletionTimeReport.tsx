
'use client';

import { useMemo } from 'react';
import type { Order } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Printer, FileDown, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid } from 'recharts';

export interface CompletionTimeData {
  orders: Order[];
}

interface CompletionTimeReportProps {
  data: CompletionTimeData;
  onPrint: () => void;
}

export function CompletionTimeReport({ data, onPrint }: CompletionTimeReportProps) {
  const { avgCompletionTime, maxCompletionTime, minCompletionTime, timeDistribution } = useMemo(() => {
    const completedOrders = data.orders.filter(
      (order) => order.orderDate && order.completionDate
    );

    if (completedOrders.length === 0) {
      return { avgCompletionTime: 0, maxCompletionTime: 0, minCompletionTime: 0, timeDistribution: [] };
    }

    const completionTimes = completedOrders.map((order) => {
      const startTime = new Date(order.orderDate).getTime();
      const endTime = new Date(order.completionDate!).getTime();
      return (endTime - startTime) / (1000 * 60); // in minutes
    });

    const totalMinutes = completionTimes.reduce((sum, time) => sum + time, 0);
    const avgCompletionTime = totalMinutes / completedOrders.length;
    const maxCompletionTime = Math.max(...completionTimes);
    const minCompletionTime = Math.min(...completionTimes);
    
    const distribution = [
      { name: '< 5 min', count: 0 },
      { name: '5-10 min', count: 0 },
      { name: '10-15 min', count: 0 },
      { name: '15-20 min', count: 0 },
      { name: '> 20 min', count: 0 },
    ];

    completionTimes.forEach(time => {
        if (time < 5) distribution[0].count++;
        else if (time < 10) distribution[1].count++;
        else if (time < 15) distribution[2].count++;
        else if (time < 20) distribution[3].count++;
        else distribution[4].count++;
    });

    return { avgCompletionTime, maxCompletionTime, minCompletionTime, timeDistribution: distribution };
  }, [data.orders]);

  const summaryStats = [
    { title: "Average Time", value: `${avgCompletionTime.toFixed(1)} min`, icon: Clock, color: "text-primary" },
    { title: "Minimum Time", value: `${minCompletionTime.toFixed(1)} min`, icon: TrendingDown, color: "text-green-500" },
    { title: "Maximum Time", value: `${maxCompletionTime.toFixed(1)} min`, icon: TrendingUp, color: "text-red-500" },
  ];

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
                    <Button variant="ghost" size="icon" disabled>
                        <FileDown className="h-4 w-4"/>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Download report (coming soon)</p>
                </TooltipContent>
            </Tooltip>
            <Button variant="ghost" size="icon" onClick={onPrint}>
                <Printer className="h-4 w-4"/>
            </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
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
        <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={timeDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} label={{ value: 'No. of Orders', angle: -90, position: 'insideLeft' }} />
                    <RechartsTooltip
                        cursor={{ fill: 'hsl(var(--muted))' }}
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                return (
                                <div className="rounded-lg border bg-background p-2 shadow-sm">
                                    <p className="font-bold">{`${payload[0].payload.name}: ${payload[0].value} orders`}</p>
                                </div>
                                );
                            }
                            return null;
                        }}
                    />
                    <Bar dataKey="count" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} name="Orders" />
                </BarChart>
            </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
