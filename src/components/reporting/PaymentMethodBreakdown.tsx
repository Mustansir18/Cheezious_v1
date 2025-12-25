
'use client';

import { Pie, PieChart, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Printer, FileDown } from 'lucide-react';
import { Tooltip as UITooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export interface PaymentData {
  method: string;
  sales: number;
  fill: string;
}

interface PaymentMethodBreakdownProps {
  data: PaymentData[];
  selectedMethod: string | null;
  onSelectMethod: (method: string | null) => void;
  onPrint: () => void;
}

export function PaymentMethodBreakdown({ data, selectedMethod, onSelectMethod, onPrint }: PaymentMethodBreakdownProps) {
  
  const handlePieClick = (payload: any) => {
    const clickedMethod = payload.name;
    // If the clicked method is already selected, deselect it. Otherwise, select it.
    onSelectMethod(selectedMethod === clickedMethod ? null : clickedMethod);
  }

  return (
     <Card className="h-full flex flex-col">
      <CardHeader className="flex-row justify-between items-center">
        <div>
          <CardTitle className="font-headline">Payment Methods</CardTitle>
          <CardDescription>Click a segment to filter the report.</CardDescription>
        </div>
        <div className="flex items-center gap-2 print-hidden">
            <UITooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" disabled>
                        <FileDown className="h-4 w-4"/>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Download report (coming soon)</p>
                </TooltipContent>
            </UITooltip>
            <Button variant="ghost" size="icon" onClick={onPrint}>
                <Printer className="h-4 w-4"/>
            </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col items-center justify-center">
         {data.length > 0 ? (
            <>
                 <ResponsiveContainer width="100%" height={150}>
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
                            nameKey="method"
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={60}
                            paddingAngle={5}
                            onClick={(data) => handlePieClick(data)}
                            className="cursor-pointer"
                        >
                            {data.map((entry, index) => (
                                <Cell 
                                    key={`cell-${index}`} 
                                    fill={entry.fill} 
                                    stroke={selectedMethod === entry.method ? 'hsl(var(--ring))' : entry.fill}
                                    strokeWidth={selectedMethod === entry.method ? 3 : 1}
                                />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                 <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-4">
                    {data.map((entry) => (
                        <div key={entry.method} className="flex items-center gap-2">
                            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.fill }} />
                            <span className="text-sm font-medium">{entry.method}</span>
                        </div>
                    ))}
                </div>
            </>
         ) : (
             <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground">No payment data for this period.</p>
             </div>
         )}
      </CardContent>
    </Card>
  );
}
