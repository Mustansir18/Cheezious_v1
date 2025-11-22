
"use client";

import { useState } from "react";
import { useSettings } from "@/context/SettingsContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

export default function AdminSettingsPage() {
    const { settings, addFloor, deleteFloor, addTable, deleteTable, addPaymentMethod, deletePaymentMethod, toggleAutoPrint } = useSettings();

    const [newFloorName, setNewFloorName] = useState("");
    const [newTableName, setNewTableName] = useState("");
    const [selectedFloorForNewTable, setSelectedFloorForNewTable] = useState("");
    const [newPaymentMethodName, setNewPaymentMethodName] = useState("");

    const handleAddFloor = () => {
        if (newFloorName.trim()) {
            addFloor(newFloorName.trim());
            setNewFloorName("");
        }
    };

    const handleAddTable = () => {
        if (newTableName.trim() && selectedFloorForNewTable) {
            addTable(newTableName.trim(), selectedFloorForNewTable);
            setNewTableName("");
            setSelectedFloorForNewTable("");
        }
    };

    const handleAddPaymentMethod = () => {
        if (newPaymentMethodName.trim()) {
            addPaymentMethod(newPaymentMethodName.trim());
            setNewPaymentMethodName("");
        }
    };

    return (
        <div className="container mx-auto p-4 lg:p-8 space-y-8">
            <header>
                <h1 className="font-headline text-4xl font-bold">Admin Settings</h1>
                <p className="text-muted-foreground">Manage restaurant floors, tables, and payment methods.</p>
            </header>
            
            {/* Printer Settings */}
            <Card>
                <CardHeader>
                    <CardTitle>Printer Settings</CardTitle>
                    <CardDescription>Configure automatic printing options.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="auto-print-switch" className="text-base">Auto-Print Receipts</Label>
                            <p className="text-sm text-muted-foreground">
                                Automatically open the print dialog when an order is placed.
                                Set your desired receipt printer (e.g., EPSON) as the system default for seamless printing.
                            </p>
                        </div>
                        <Switch
                            id="auto-print-switch"
                            checked={settings.autoPrintReceipts}
                            onCheckedChange={toggleAutoPrint}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Floors Management */}
            <Card>
                <CardHeader>
                    <CardTitle>Manage Floors</CardTitle>
                    <CardDescription>Add or remove floors for your restaurant.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2 mb-4">
                        <Input
                            placeholder="New floor name (e.g., Ground Floor)"
                            value={newFloorName}
                            onChange={(e) => setNewFloorName(e.target.value)}
                        />
                        <Button onClick={handleAddFloor}>Add Floor</Button>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Floor Name</TableHead>
                                <TableHead className="text-right w-[80px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {settings.floors.map(floor => (
                                <TableRow key={floor.id}>
                                    <TableCell>{floor.name}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => deleteFloor(floor.id)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Separator />

            {/* Tables Management */}
            <Card>
                <CardHeader>
                    <CardTitle>Manage Tables</CardTitle>
                    <CardDescription>Add tables and assign them to a floor.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-3 gap-2 mb-4">
                        <Input
                            placeholder="New table name (e.g., T1)"
                            value={newTableName}
                            onChange={(e) => setNewTableName(e.target.value)}
                        />
                        <Select value={selectedFloorForNewTable} onValueChange={setSelectedFloorForNewTable}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a floor" />
                            </SelectTrigger>
                            <SelectContent>
                                {settings.floors.map(floor => (
                                    <SelectItem key={floor.id} value={floor.id}>{floor.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button onClick={handleAddTable}>Add Table</Button>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Table Name</TableHead>
                                <TableHead>Floor</TableHead>
                                <TableHead className="text-right w-[80px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {settings.tables.map(table => (
                                <TableRow key={table.id}>
                                    <TableCell>{table.name}</TableCell>
                                    <TableCell>{settings.floors.find(f => f.id === table.floorId)?.name || 'N/A'}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => deleteTable(table.id)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            
            <Separator />
            
            {/* Payment Methods Management */}
            <Card>
                <CardHeader>
                    <CardTitle>Manage Payment Methods</CardTitle>
                    <CardDescription>Add or remove accepted payment methods.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2 mb-4">
                        <Input
                            placeholder="New payment method (e.g., QR Pay)"
                            value={newPaymentMethodName}
                            onChange={(e) => setNewPaymentMethodName(e.target.value)}
                        />
                        <Button onClick={handleAddPaymentMethod}>Add Method</Button>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Method Name</TableHead>
                                <TableHead className="text-right w-[80px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {settings.paymentMethods.map(method => (
                                <TableRow key={method.id}>
                                    <TableCell>{method.name}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => deletePaymentMethod(method.id)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
