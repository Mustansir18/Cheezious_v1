
"use client";

import { useRating } from "@/context/RatingContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader, Star, Trash2 } from "lucide-react";
import { format } from 'date-fns';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

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
    const { ratings, isLoading, clearRatings } = useRating();

    const ratingSummary = useMemo(() => {
        if (ratings.length === 0) {
            return {
                average: 0,
                total: 0,
                distribution: [],
                chartData: [],
            };
        }
        const total = ratings.length;
        const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
        const average = sum / total;
        
        const distribution = [1, 2, 3, 4, 5].map(star => {
            const count = ratings.filter(r => r.rating === star).length;
            return { star, count, percentage: total > 0 ? (count / total) * 100 : 0 };
        });

        const COLORS = ['#FF8042', '#FFBB28', '#00C49F', '#0088FE', '#8884d8'].reverse();

        const chartData = distribution.map((d, index) => ({
            name: `${d.star} Star`,
            value: d.count,
            fill: COLORS[d.star - 1],
        })).filter(d => d.value > 0);

        return { average, total, distribution, chartData };
    }, [ratings]);

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader className="h-12 w-12 animate-spin text-primary" />
                <p className="ml-4 text-muted-foreground">Loading Feedback...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 lg:p-8 space-y-8">
            <header className="flex flex-col md:flex-row justify-between items-start gap-4">
                 <div>
                    <h1 className="font-headline text-4xl font-bold">Customer Feedback</h1>
                    <p className="text-muted-foreground">A collection of all user-submitted ratings and comments.</p>
                </div>
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
            </header>

            <Card>
                <CardHeader>
                    <CardTitle>Feedback Summary</CardTitle>
                    <CardDescription>An overview of all ratings received.</CardDescription>
                </CardHeader>
                <CardContent>
                    {ratings.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-1 flex flex-col items-center justify-center text-center">
                                <p className="text-6xl font-bold">{ratingSummary.average.toFixed(2)}</p>
                                <StarRating rating={Math.round(ratingSummary.average)} />
                                <p className="text-muted-foreground mt-1">Based on {ratingSummary.total} ratings</p>
                            </div>
                            <div className="md:col-span-2 h-48">
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
                                        <Pie data={ratingSummary.chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                            {ratingSummary.chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    ) : (
                         <div className="text-center py-12">
                            <p className="text-muted-foreground">No feedback has been submitted yet.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>All Ratings</CardTitle>
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
                                {ratings.map(rating => (
                                    <TableRow key={rating.id}>
                                        <TableCell>{format(new Date(rating.timestamp), 'PPpp')}</TableCell>
                                        <TableCell><StarRating rating={rating.rating} /></TableCell>
                                        <TableCell className="italic text-muted-foreground">"{rating.comment || 'No comment'}"</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                    {ratings.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground">No feedback to display.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
