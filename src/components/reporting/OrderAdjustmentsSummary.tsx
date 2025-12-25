
'use client';

import type { ElementType } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Printer, FileDown } from 'lucide-react';
import { Tooltip as UITooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface OrderAdjustmentData {
  type: string;
  count: number;
  icon: ElementType;
  color: string;
}

interface OrderAdjustmentsSummaryProps {
  data: OrderAdjustmentData[];
  selectedType: string | null;
  onSelectType: (type: string | null) => void;
  onPrint: () => void;
}

export function OrderAdjustmentsSummary({ data, selectedType, onSelectType, onPrint }: OrderAdjustmentsSummaryProps) {
  
  const handleSelect = (type: string) => {
    onSelectType(selectedType === type ? null : type);
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-row justify-between items-center">
        <div>
          <CardTitle className="font-headline">Order Adjustments</CardTitle>
          <CardDescription>Click a category to filter the report.</CardDescription>
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
      <CardContent className="flex-grow flex flex-col justify-center">
         {data.some(d => d.count > 0) ? (
            <div className="space-y-2">
                {data.map(entry => (
                    <Card 
                        key={entry.type}
                        className={cn(
                            "cursor-pointer transition-all hover:shadow-md",
                            selectedType === entry.type && "ring-2 ring-primary"
                        )}
                        onClick={() => handleSelect(entry.type)}
                    >
                        <CardContent className="p-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <entry.icon className={cn("h-6 w-6", entry.color)} />
                                <span className="font-semibold">{entry.type}</span>
                            </div>
                            <span className="text-xl font-bold">{entry.count}</span>
                        </CardContent>
                    </Card>
                ))}
            </div>
         ) : (
             <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground text-center">No adjustments in this period.</p>
             </div>
         )}
      </CardContent>
    </Card>
  );
}
