
'use client';

import { Pie, PieChart, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import { cn } from '@/lib/utils';
import type { ElementType } from 'react';

export interface OrderAdjustmentData {
  type: string;
  count: number;
  icon: ElementType;
  fill: string;
}

interface OrderAdjustmentsSummaryProps {
  data: OrderAdjustmentData[];
  selectedType: string | null;
  onSelectType: (type: string | null) => void;
}

export function OrderAdjustmentsSummary({ data, selectedType, onSelectType }: OrderAdjustmentsSummaryProps) {
  
  const handlePieClick = (payload: any) => {
    const clickedType = payload.name;
    onSelectType(selectedType === clickedType ? null : clickedType);
  }

  return (
    <div className="h-full w-full">
        <h3 className="text-base font-medium mb-2">Order Adjustments</h3>
         {data.some(d => d.count > 0) ? (
            <div className="flex flex-col items-center">
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
                                                {payload[0].value} Orders
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
                            dataKey="count"
                            nameKey="type"
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={60}
                            paddingAngle={5}
                            onClick={(payload) => handlePieClick(payload.name)}
                            className="cursor-pointer"
                        >
                            {data.map((entry) => (
                                <Cell 
                                    key={`cell-${entry.type}`} 
                                    fill={entry.fill} 
                                    stroke={selectedType === entry.type ? 'hsl(var(--ring))' : entry.fill}
                                    strokeWidth={selectedType === entry.type ? 3 : 1}
                                />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                 <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-4">
                    {data.map((entry) => (
                        <div key={entry.type} className="flex items-center gap-2">
                            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.fill }} />
                            <span className="text-sm font-medium">{entry.type} ({entry.count})</span>
                        </div>
                    ))}
                </div>
            </div>
         ) : (
             <div className="flex h-[220px] items-center justify-center">
                <p className="text-muted-foreground text-center">No discounted, complementary, or cancelled orders in this period.</p>
             </div>
         )}
    </div>
  );
}
