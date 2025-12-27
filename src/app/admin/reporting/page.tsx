
"use client";

import ReportingPage from '@/app/marketing/reporting/page';
import HourlyReportPage from '@/app/marketing/hourly-report/page';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Clock } from 'lucide-react';

export default function AdminReportingPage() {
    return (
        <div className="container mx-auto p-4 lg:p-8">
            <header className="mb-8">
                <h1 className="font-headline text-4xl font-bold">Sales & Reporting</h1>
                <p className="text-muted-foreground">Analyze sales trends and generate detailed reports.</p>
            </header>
            <Tabs defaultValue="sales-reports" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="sales-reports" className="py-3 text-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        <BarChart className="mr-2 h-5 w-5" />
                        Sales Reports
                    </TabsTrigger>
                    <TabsTrigger value="hourly-report" className="py-3 text-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        <Clock className="mr-2 h-5 w-5" />
                        Hourly Report
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="sales-reports" className="mt-6">
                    {/* The ReportingPage component already has its own container and padding, so we can use it directly */}
                    <ReportingPage />
                </TabsContent>
                <TabsContent value="hourly-report" className="mt-6">
                     {/* The HourlyReportPage component also has its own container and padding */}
                    <HourlyReportPage />
                </TabsContent>
            </Tabs>
        </div>
    );
}
