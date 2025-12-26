
"use client";

import { useState } from "react";
import { useActivityLog } from "@/context/ActivityLogContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader, Trash2, Filter } from "lucide-react";
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ActivityLogCategory } from "@/lib/types";
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";

const categoryColors: Record<ActivityLogCategory, string> = {
    Order: "bg-blue-100 text-blue-800",
    User: "bg-purple-100 text-purple-800",
    Settings: "bg-gray-100 text-gray-800",
    Deal: "bg-green-100 text-green-800",
    Menu: "bg-orange-100 text-orange-800",
    System: "bg-yellow-100 text-yellow-800",
};

export default function ActivityLogPage() {
    const { logs, isLoading, clearLogs } = useActivityLog();
    const [selectedCategories, setSelectedCategories] = useState<Set<ActivityLogCategory>>(new Set());

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader className="h-12 w-12 animate-spin text-primary" />
                <p className="ml-4 text-muted-foreground">Loading Activity Log...</p>
            </div>
        );
    }

    const categories: ActivityLogCategory[] = ['Order', 'User', 'Settings', 'Deal', 'Menu', 'System'];

    const handleCategoryToggle = (category: ActivityLogCategory) => {
        setSelectedCategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(category)) {
                newSet.delete(category);
            } else {
                newSet.add(category);
            }
            return newSet;
        });
    };
    
    const filteredLogs = selectedCategories.size === 0 
        ? logs 
        : logs.filter(log => selectedCategories.has(log.category));

    return (
        <div className="container mx-auto p-4 lg:p-8 space-y-8">
            <Card>
                <CardHeader className="flex flex-row justify-between items-center">
                    <div>
                        <CardTitle className="font-headline text-4xl font-bold">Activity Log</CardTitle>
                        <CardDescription>A record of all significant actions taken by users.</CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline">
                                    <Filter className="mr-2 h-4 w-4" />
                                    Filter by Category
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56">
                                <DropdownMenuLabel>Categories</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {categories.map(category => (
                                    <DropdownMenuCheckboxItem
                                        key={category}
                                        checked={selectedCategories.has(category)}
                                        onCheckedChange={() => handleCategoryToggle(category)}
                                    >
                                        {category}
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <DeleteConfirmationDialog
                            title="Are you absolutely sure?"
                            description="This action cannot be undone. This will permanently delete all activity log entries."
                            onConfirm={clearLogs}
                            triggerButton={
                                <Button variant="destructive" disabled={logs.length === 0}>
                                    <Trash2 className="mr-2 h-4 w-4" /> Clear Log
                                </Button>
                            }
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[70vh]">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[200px]">Timestamp</TableHead>
                                    <TableHead className="w-[150px]">User</TableHead>
                                    <TableHead>Action</TableHead>
                                    <TableHead className="w-[120px]">Category</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredLogs.map(log => (
                                    <TableRow key={log.id}>
                                        <TableCell>{format(new Date(log.timestamp), 'PPpp')}</TableCell>
                                        <TableCell className="font-medium">{log.user}</TableCell>
                                        <TableCell>{log.message}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={categoryColors[log.category] || 'bg-gray-100 text-gray-800'}>
                                                {log.category}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                    {filteredLogs.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground">
                                {logs.length > 0 ? 'No activities match the selected filters.' : 'No activities have been logged yet.'}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

    