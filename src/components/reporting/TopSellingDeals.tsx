

'use client';

import type { DealSale } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '../ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Printer, FileDown } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { exportTopItemsAs } from '@/lib/exporter';


interface TopSellingDealsProps {
  data: DealSale[];
  onPrint: () => void;
}

export function TopSellingDeals({ data, onPrint }: TopSellingDealsProps) {
  const title = 'Top Selling Deals';
  return (
    <Card className="h-full">
      <CardHeader className="flex-row justify-between items-center">
        <div>
            <CardTitle className="font-headline">{title}</CardTitle>
            <CardDescription>
                Deals ranked by quantity sold for the selected period.
            </CardDescription>
        </div>
         <div className="flex items-center gap-2 print-hidden">
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => exportTopItemsAs('csv', data, title)}>
                        <FileDown className="h-4 w-4"/>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Download as CSV</p>
                </TooltipContent>
            </Tooltip>
             <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => exportTopItemsAs('pdf', data, title)}>
                        <FileDown className="h-4 w-4 text-red-500"/>
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
        <ScrollArea className="h-[250px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Deal</TableHead>
                <TableHead className="text-center">Qty</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((deal) => (
                <TableRow key={deal.name}>
                  <TableCell className="font-medium">{deal.name}</TableCell>
                  <TableCell className="text-center">{deal.quantity}</TableCell>
                  <TableCell className="text-right">
                    RS {Math.round(deal.totalRevenue)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
