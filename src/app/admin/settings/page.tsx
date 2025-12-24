
"use client";

import { useState, useEffect } from "react";
import QRCode from "react-qr-code";
import { useSettings } from "@/context/SettingsContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, QrCode } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { branches } from "@/lib/data";

const QRCodeCard = ({ title, value, description }: { title: string; value: string; description: string }) => {
    return (
        <div className="rounded-lg border bg-card text-card-foreground p-4 flex flex-col items-center justify-center text-center gap-4">
            <div className="bg-white p-2 border rounded-md">
                <QRCode value={value} size={128} />
            </div>
            <div>
                <h3 className="font-semibold">{title}</h3>
                <p className="text-xs text-muted-foreground">{description}</p>
            </div>
        </div>
    );
};


export default function AdminSettingsPage() {
    const { settings, addFloor, deleteFloor, addTable, deleteTable, addPaymentMethod, deletePaymentMethod, toggleAutoPrint } = useSettings();
    const [baseUrl, setBaseUrl] = useState("");

    const [newFloorName, setNewFloorName] = useState("");
    const [newTableName, setNewTableName] = useState("");
    const [selectedFloorForNewTable, setSelectedFloorForNewTable] = useState("");
    const [newPaymentMethodName, setNewPaymentMethodName] = useState("");

    useEffect(() => {
        // Ensure this runs only on the client
        if (typeof window !== "undefined") {
            setBaseUrl(window.location.origin);
        }
    }, []);

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
    
    const handlePrintQRCodes = () => {
        const printableArea = document.getElementById('qr-codes-section');
        if (!printableArea) return;

        const printContainer = document.createElement('div');
        printContainer.id = 'printable-area';
        
        // Define a wrapper for the grid and the styles
        const contentToPrint = `
            <style>
                @media print {
                    @page { size: A4; margin: 20mm; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .qr-grid-print { display: grid !important; grid-template-columns: repeat(3, 1fr) !important; gap: 20mm !important; }
                    .qr-card-print { break-inside: avoid !important; page-break-inside: avoid !important; border: 1px solid #ccc !important; border-radius: 8px !important; padding: 16px !important; text-align: center !important; }
                    .qr-card-print h3 { font-size: 14pt !important; font-weight: bold !important; margin-bottom: 8px !important; }
                    .qr-card-print p { font-size: 10pt !important; color: #555 !important; }
                    .qr-code-bg-print { background-color: white !important; padding: 8px !important; border: 1px solid #eee !important; border-radius: 4px !important; display: inline-block !important; margin-bottom: 12px !important;}
                }
            </style>
            <div class="qr-grid-print">
                ${Array.from(printableArea.children).map(child => {
                    const title = child.querySelector('h3')?.textContent || '';
                    const description = child.querySelector('p')?.textContent || '';
                    const qrSvgHtml = child.querySelector('svg')?.outerHTML || '';
                    
                    // The QRCode component generates an SVG. We need to make sure its styles are inline for printing.
                    const styledQrSvgHtml = qrSvgHtml.replace('<svg', '<svg style="width: 100%; height: auto;"');

                    return `
                        <div class="qr-card-print">
                            <h3>${title}</h3>
                            <div class="qr-code-bg-print">${styledQrSvgHtml}</div>
                            <p>${description}</p>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
        
        printContainer.innerHTML = contentToPrint;

        document.body.appendChild(printContainer);
        document.body.classList.add('printing-active');
        window.print();
        document.body.classList.remove('printing-active');
        document.body.removeChild(printContainer);
    };

    const defaultPaymentMethodIds = ['cash', 'card'];
    const defaultBranch = branches[0]; // Assuming one branch for now

    return (
        <div className="container mx-auto p-4 lg:p-8 space-y-8">
            <header>
                <h1 className="font-headline text-4xl font-bold">Admin Settings</h1>
                <p className="text-muted-foreground">Manage restaurant layout, payments, and QR codes.</p>
            </header>
            
            {/* QR Codes Section */}
            <Card>
                 <CardHeader className="flex flex-row justify-between items-center">
                    <div>
                        <CardTitle>QR Codes</CardTitle>
                        <CardDescription>Generate QR codes for tables and take-away orders to streamline the ordering process.</CardDescription>
                    </div>
                     <Button onClick={handlePrintQRCodes}><QrCode className="mr-2 h-4 w-4"/> Print QR Codes</Button>
                </CardHeader>
                <CardContent>
                    <div id="qr-codes-section" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {/* Take Away QR */}
                        {baseUrl && defaultBranch && (
                             <QRCodeCard
                                title="Take-Away Orders"
                                value={`${baseUrl}/branch/${defaultBranch.id}/menu?mode=Take-Away`}
                                description={`Scan to order Take-Away from ${defaultBranch.name}`}
                            />
                        )}

                        {/* Dine-In Table QRs */}
                        {baseUrl && settings.tables.map(table => {
                            const floor = settings.floors.find(f => f.id === table.floorId);
                            if (!floor || !defaultBranch) return null;
                            const url = `${baseUrl}/branch/${defaultBranch.id}/menu?mode=Dine-In&floorId=${floor.id}&tableId=${table.id}`;
                            return (
                                <QRCodeCard
                                    key={table.id}
                                    title={`Table: ${table.name}`}
                                    value={url}
                                    description={`Floor: ${floor.name}`}
                                />
                            );
                         })}
                    </div>
                    {settings.tables.length === 0 && (
                        <p className="text-center text-muted-foreground py-8">
                            Add floors and tables below to generate QR codes for them.
                        </p>
                    )}
                </CardContent>
            </Card>

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
                                        {!defaultPaymentMethodIds.includes(method.id) && (
                                            <Button variant="ghost" size="icon" onClick={() => deletePaymentMethod(method.id)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        )}
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
