
"use client";

import { useState } from "react";
import { useActivityLog } from "@/context/ActivityLogContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader, Trash2, Filter, Search } from "lucide-react";
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ActivityLogCategory } from "@/lib/types";
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { Input } from "@/components/ui/input";

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
    const [searchTerm, setSearchTerm] = useState('');

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
            // Reset search term if 'Order' category is deselected
            if (category === 'Order' && !newSet.has('Order')) {
                setSearchTerm('');
            }
            return newSet;
        });
    };
    
    const filteredLogs = logs.filter(log => {
        const categoryMatch = selectedCategories.size === 0 || selectedCategories.has(log.category);
        if (!categoryMatch) return false;

        const searchMatch = !searchTerm || log.message.toLowerCase().includes(searchTerm.toLowerCase());

        // If 'Order' category is selected, we must match the search term.
        if (selectedCategories.has('Order')) {
            return log.category === 'Order' && searchMatch;
        }

        return true;
    });

    return (
        <div className="w-full space-y-8">
            <Card>
                <CardHeader className="flex flex-row justify-between items-start">
                    <div>
                        <CardTitle className="font-headline text-4xl font-bold">Activity Log</CardTitle>
                        <CardDescription>A record of all significant actions taken by users.</CardDescription>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
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
                                description="This action cannot be undone. This will permanently delete all activity log entries. Type DELETE to confirm."
                                onConfirm={clearLogs}
                                triggerButton={
                                    <Button variant="destructive" disabled={logs.length === 0}>
                                        <Trash2 className="mr-2 h-4 w-4" /> Clear Log
                                    </Button>
                                }
                            />
                        </div>
                         {selectedCategories.has('Order') && (
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search in Orders..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 w-full sm:w-auto"
                                />
                            </div>
                        )}
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
