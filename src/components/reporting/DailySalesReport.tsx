

'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Printer, FileDown } from 'lucide-react';
import {
  Line,
  LineChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Tooltip as UITooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { exportChartDataAs } from '@/lib/exporter';


export interface DailySale {
  date: string;
  sales: number;
}

interface DailySalesReportProps {
  data: DailySale[];
  onPrint: () => void;
}

export function DailySalesReport({ data, onPrint }: DailySalesReportProps) {
  const title = "Daily Sales Trend (Last 7 Days)";
  return (
    <Card>
      <CardHeader className="flex-row justify-between items-center">
        <div>
            <CardTitle className="font-headline">{title}</CardTitle>
            <CardDescription>Total revenue generated per day for the last week.</CardDescription>
        </div>
        <div className="flex items-center gap-2 print-hidden">
            <UITooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => exportChartDataAs('csv', data, title, 'date', 'sales')}>
                        <FileDown className="h-4 w-4"/>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Download as CSV</p>
                </TooltipContent>
            </UITooltip>
             <UITooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => exportChartDataAs('pdf', data, title, 'date', 'sales')}>
                        <FileDown className="h-4 w-4 text-red-500"/>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Download as PDF</p>
                </TooltipContent>
            </UITooltip>
            <Button variant="ghost" size="icon" onClick={onPrint}>
                <Printer className="h-4 w-4"/>
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `RS ${Math.round(value)}`}
            />
            <Tooltip
              cursor={{ fill: 'hsl(var(--muted))' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            Date
                          </span>
                          <span className="font-bold text-muted-foreground">
                            {payload[0].payload.date}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            Sales
                          </span>
                          <span className="font-bold">
                            RS {payload[0].value ? Math.round(payload[0].value as number).toLocaleString() : 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line type="monotone" dataKey="sales" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ r: 4, fill: "hsl(var(--chart-2))" }} activeDot={{ r: 8, fill: "hsl(var(--chart-2))" }} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
