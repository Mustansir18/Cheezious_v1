
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


interface TopSellingDealsProps {
  data: DealSale[];
  onPrint: () => void;
}

export function TopSellingDeals({ data, onPrint }: TopSellingDealsProps) {
  return (
    <Card className="h-full">
      <CardHeader className="flex-row justify-between items-center">
        <div>
            <CardTitle className="font-headline">Top Selling Deals</CardTitle>
            <CardDescription>
                Deals ranked by quantity sold for the selected period.
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

    