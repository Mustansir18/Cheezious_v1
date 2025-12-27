

'use client';

import { Pie, PieChart, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Printer, FileDown, FileText } from 'lucide-react';
import { Tooltip as UITooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { ElementType } from 'react';
import { exportOrderTypeDetailsAs } from '@/lib/exporter';
import type { Order } from '@/lib/types';
import { useSettings } from '@/context/SettingsContext';

export interface OrderTypeData {
  type: 'Dine-In' | 'Take-Away';
  count: number;
  sales: number;
  icon: ElementType;
  fill: string;
  orders: Order[];
}

interface OrderTypeSummaryProps {
  data: OrderTypeData[];
  onPrint: () => void;
  selectedType: string | null;
  onSelectType: (type: string | null) => void;
  headerInfo: { companyName: string; branchName: string; dateDisplay?: string; };
}

export function OrderTypeSummary({ data, onPrint, selectedType, onSelectType, headerInfo }: OrderTypeSummaryProps) {
  
  const handleSelect = (type: string) => {
    onSelectType(selectedType === type ? null : type);
  }
  
  const selectedData = data.find(d => d.type === selectedType);

  const handleDownload = (format: 'pdf' | 'csv') => {
      if (selectedData) {
          exportOrderTypeDetailsAs(format, selectedData.orders, selectedData.type, headerInfo);
      }
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-row justify-between items-center">
        <div>
          <CardTitle className="font-headline">Order Type Summary</CardTitle>
          <CardDescription>Click to filter the entire report.</CardDescription>
        </div>
        <div className="flex items-center gap-2 print-hidden">
            <UITooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => handleDownload('csv')} disabled={!selectedType}>
                        <FileDown className="h-4 w-4"/>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Download CSV of {selectedType || 'selection'}</p>
                </TooltipContent>
            </UITooltip>
             <UITooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => handleDownload('pdf')} disabled={!selectedType}>
                        <FileText className="h-4 w-4 text-red-500"/>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Download PDF of {selectedType || 'selection'}</p>
                </TooltipContent>
            </UITooltip>
            <Button variant="ghost" size="icon" onClick={onPrint}>
                <Printer className="h-4 w-4"/>
            </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col items-center justify-center gap-8">
        {data.length > 0 ? (
            <>
                <ResponsiveContainer width="100%" height={150} className="max-w-[150px]">
                    <PieChart>
                         <Tooltip
                            cursor={{ fill: 'hsl(var(--muted))' }}
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                return (
                                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                                        <div className="flex flex-col">
                                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                {payload[0].name}
                                            </span>
                                            <span className="font-bold">
                                                RS {payload[0].value ? Math.round(payload[0].value as number).toLocaleString() : 0}
                                            </span>
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
                            nameKey="type"
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            paddingAngle={5}
                            onClick={(payload) => handleSelect(payload.name)}
                            className="cursor-pointer"
                        >
                            {data.map((entry) => (
                                <Cell 
                                    key={`cell-${entry.type}`} 
                                    fill={entry.fill}
                                    outerRadius={selectedType === entry.type ? 70 : 60}
                                    className={cn(
                                        "transition-all",
                                        selectedType && selectedType !== entry.type && "blur-out"
                                    )}
                                />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-4 w-full">
                    {data.map(entry => (
                        <Card 
                            key={entry.type}
                            className={cn(
                                "cursor-pointer transition-all hover:shadow-md",
                                selectedType === entry.type ? "ring-2 ring-primary" : 
                                selectedType ? "blur-out" : ""
                            )}
                            onClick={() => handleSelect(entry.type)}
                        >
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">{entry.type}</CardTitle>
                                <entry.icon className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{entry.count}</div>
                                <p className="text-xs text-muted-foreground">RS {Math.round(entry.sales)}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </>
        ) : (
             <div className="flex h-full w-full items-center justify-center">
                <p className="text-muted-foreground">No order type data for this period.</p>
             </div>
         )}
      </CardContent>
    </Card>
  );
}
