
'use client';

import type { CategorySale } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Printer, FileDown } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Pie, PieChart, ResponsiveContainer, Cell, Tooltip as RechartsTooltip } from 'recharts';

interface CategorySalesTableProps {
  data: CategorySale[];
  onPrint: () => void;
}

export function CategorySalesTable({ data, onPrint }: CategorySalesTableProps) {
  return (
    <Card>
      <CardHeader className="flex-row justify-between items-center">
        <div>
            <CardTitle className="font-headline">Sales by Category</CardTitle>
            <CardDescription>
                Total revenue generated per menu category for the selected period.
            </CardDescription>
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
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <ResponsiveContainer width="100%" height={250}>
            <PieChart>
                <RechartsTooltip
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
                    data={data}
                    dataKey="sales"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                    {data.map((entry) => (
                        <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                    ))}
                </Pie>
            </PieChart>
        </ResponsiveContainer>
        <ScrollArea className="h-[250px] border rounded-md">
           <div className="p-4">
            {data.sort((a,b) => b.sales - a.sales).map(category => (
                <div key={category.name} className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: category.fill }} />
                        <span className="font-medium">{category.name}</span>
                    </div>
                    <span className="font-semibold text-right">RS {Math.round(category.sales)}</span>
                </div>
            ))}
           </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

    