

'use client';

import type { HourlySale } from '@/app/marketing/reporting/page';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Printer, FileDown } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Tooltip as UITooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { exportChartDataAs } from '@/lib/exporter';


interface HourlySalesReportProps {
  data: HourlySale[];
  onPrint: () => void;
}

export function HourlySalesReport({ data, onPrint }: HourlySalesReportProps) {
  const title = "Hourly Sales";
  return (
    <Card className="h-full">
      <CardHeader className="flex-row justify-between items-center">
        <div>
            <CardTitle className="font-headline">{title}</CardTitle>
            <CardDescription>Total revenue generated per hour for the selected period.</CardDescription>
        </div>
        <div className="flex items-center gap-2 print-hidden">
            <UITooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => exportChartDataAs('csv', data, title, 'hour', 'sales')}>
                        <FileDown className="h-4 w-4"/>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Download as CSV</p>
                </TooltipContent>
            </UITooltip>
            <UITooltip>
                <TooltipTrigger asChild>
                     <Button variant="ghost" size="icon" onClick={() => exportChartDataAs('pdf', data, title, 'hour', 'sales')}>
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
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" fontSize={12} tickLine={false} axisLine={false} />
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
                            Hour
                          </span>
                          <span className="font-bold text-muted-foreground">
                            {payload[0].payload.hour}
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
            <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
