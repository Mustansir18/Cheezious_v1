
"use client";

import { useRating } from "@/context/RatingContext";
import { useSettings } from "@/context/SettingsContext";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader, Star, Trash2, Calendar as CalendarIcon } from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { useState, useMemo } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";


const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
            <Star
                key={star}
                className={`h-4 w-4 ${rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
            />
        ))}
    </div>
);


export default function FeedbackPage() {
    const { ratings, isLoading: isRatingsLoading, clearRatings } = useRating();
    const { isLoading: isSettingsLoading } = useSettings();
    const { user } = useAuth();
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
      from: new Date(),
      to: new Date(),
    });

    const filteredRatings = useMemo(() => {
        if (!dateRange || !dateRange.from) return ratings;

        const fromDate = startOfDay(dateRange.from);
        const toDate = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);

        return ratings.filter(rating => {
            const ratingDate = new Date(rating.timestamp);
            return ratingDate >= fromDate && ratingDate <= toDate;
        });
    }, [ratings, dateRange]);

    const ratingSummary = useMemo(() => {
        if (filteredRatings.length === 0) {
            return {
                average: 0,
                total: 0,
                distribution: [],
                chartData: [],
            };
        }
        const total = filteredRatings.length;
        const sum = filteredRatings.reduce((acc, r) => acc + r.rating, 0);
        const average = sum / total;
        
        const distribution = [5, 4, 3, 2, 1].map(star => {
            const count = filteredRatings.filter(r => r.rating === star).length;
            return { star, count, percentage: total > 0 ? (count / total) * 100 : 0 };
        });

        const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#FF6347'];

        const chartData = distribution.map((d, index) => ({
            name: `${d.star} Star`,
            value: d.count,
            fill: COLORS[index],
        })).filter(d => d.value > 0);

        return { average, total, distribution, chartData };
    }, [filteredRatings]);
    
    const isLoading = isRatingsLoading || isSettingsLoading;

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader className="h-12 w-12 animate-spin text-primary" />
                <p className="ml-4 text-muted-foreground">Loading Feedback...</p>
            </div>
        );
    }
    
    const dateDisplay = dateRange?.from
      ? dateRange.to
        ? `${format(dateRange.from, "LLL dd, y")} - ${format(dateRange.to, "LLL dd, y")}`
        : format(dateRange.from, "LLL dd, y")
      : "Pick a date range";

    return (
        <div className="container mx-auto p-4 lg:p-8 space-y-8">
            <header className="flex flex-col md:flex-row justify-between items-start gap-4">
                 <div>
                    <h1 className="font-headline text-4xl font-bold">Customer Feedback</h1>
                    <p className="text-muted-foreground">A collection of all user-submitted ratings and comments.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            id="date"
                            variant={"outline"}
                            className={cn(
                            "w-full sm:w-[300px] justify-start text-left font-normal",
                            !dateRange && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            <span>{dateDisplay}</span>
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={dateRange?.from}
                            selected={dateRange}
                            onSelect={setDateRange}
                            numberOfMonths={2}
                            disabled={(d) => d > new Date() || d < subDays(new Date(), 90)}
                        />
                        </PopoverContent>
                    </Popover>
                    {user?.role === 'root' && (
                        <DeleteConfirmationDialog
                            title="Are you absolutely sure?"
                            description="This action cannot be undone. This will permanently delete all customer feedback entries. Type DELETE to confirm."
                            onConfirm={clearRatings}
                            triggerButton={
                                <Button variant="destructive" disabled={ratings.length === 0}>
                                    <Trash2 className="mr-2 h-4 w-4" /> Clear All Feedback
                                </Button>
                            }
                        />
                    )}
                </div>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle>Feedback Summary</CardTitle>
                    <CardDescription>An overview of all ratings received for the selected period.</CardDescription>
                </CardHeader>
                <CardContent>
                    {filteredRatings.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <div className="flex flex-col items-center justify-center text-center">
                                <p className="text-6xl font-bold">{ratingSummary.average.toFixed(2)}</p>
                                <StarRating rating={Math.round(ratingSummary.average)} />
                                <p className="text-muted-foreground mt-1">Based on {ratingSummary.total} ratings</p>
                            </div>
                            <div className="h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <RechartsTooltip content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                                                        <p className="font-bold">{`${payload[0].name}: ${payload[0].value} ratings`}</p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}/>
                                        <Pie data={ratingSummary.chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={60}>
                                            {ratingSummary.chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                             <div className="space-y-2">
                                {ratingSummary.distribution.map(({ star, count, percentage }) => (
                                    <div key={star} className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground whitespace-nowrap">{star} star</span>
                                        <div className="w-full bg-muted rounded-full h-2.5">
                                            <div className="bg-yellow-400 h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div>
                                        </div>
                                        <span className="text-sm font-bold w-12 text-right">{count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                         <div className="text-center py-12">
                            <p className="text-muted-foreground">No feedback has been submitted for the selected period.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>All Ratings for {dateDisplay}</CardTitle>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[50vh]">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[200px]">Date</TableHead>
                                    <TableHead className="w-[150px]">Rating</TableHead>
                                    <TableHead>Comment</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredRatings.map(rating => (
                                    <TableRow key={rating.id}>
                                        <TableCell>{format(new Date(rating.timestamp), 'PPpp')}</TableCell>
                                        <TableCell><StarRating rating={rating.rating} /></TableCell>
                                        <TableCell className="italic text-muted-foreground">"{rating.comment || 'No comment'}"</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                    {filteredRatings.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground">No feedback to display for the selected period.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
