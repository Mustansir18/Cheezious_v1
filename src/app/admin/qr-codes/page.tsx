
"use client";

import { useState } from 'react';
import { useSettings } from '@/context/SettingsContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Printer, QrCode } from 'lucide-react';
import { QRCodeGenerator } from '@/components/admin/qr-code-generator';

export default function QRCodesPage() {
    const { settings, isLoading } = useSettings();
    const [selectedBranchId, setSelectedBranchId] = useState<string | undefined>(settings.branches[0]?.id);
    const [selectedFloorId, setSelectedFloorId] = useState<string | undefined>();
    const [selectedTableId, setSelectedTableId] = useState<string | undefined>();
    const [qrCodeValue, setQrCodeValue] = useState<string | null>(null);

    const availableTables = settings.tables.filter(table => table.floorId === selectedFloorId);
    
    const generateQRCode = () => {
        if (!selectedBranchId || !selectedTableId) return;
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const url = `${origin}/branch/${selectedBranchId}?tableId=${selectedTableId}`;
        setQrCodeValue(url);
    };

    const handlePrint = () => {
        const printContent = document.getElementById('qr-code-container');
        if (printContent) {
            const newWindow = window.open('', '', 'width=400,height=400');
            newWindow?.document.write(`
                <html>
                <head>
                    <title>Print QR Code</title>
                    <style>
                        @media print {
                            body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; height: 100vh; }
                            #print-div { text-align: center; }
                            svg { width: 80mm; height: 80mm; }
                        }
                    </style>
                </head>
                <body>
                    <div id="print-div">
                        ${printContent.innerHTML}
                    </div>
                    <script>
                        window.onload = function() {
                            window.print();
                            window.close();
                        }
                    </script>
                </body>
                </html>
            `);
            newWindow?.document.close();
        }
    };
    
    return (
        <div className="container mx-auto p-4 lg:p-8 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-4xl font-bold">QR Code Generator</CardTitle>
                    <CardDescription>Generate and print QR codes for your tables to allow customers to order directly.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        {/* Branch Select */}
                        <div className="space-y-2">
                            <label>Branch</label>
                            <Select value={selectedBranchId} onValueChange={setSelectedBranchId} disabled={settings.branches.length <= 1}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a branch" />
                                </SelectTrigger>
                                <SelectContent>
                                    {settings.branches.map(branch => (
                                        <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {/* Floor Select */}
                        <div className="space-y-2">
                             <label>Floor</label>
                            <Select value={selectedFloorId} onValueChange={(value) => { setSelectedFloorId(value); setSelectedTableId(undefined); setQrCodeValue(null); }}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a floor" />
                                </SelectTrigger>
                                <SelectContent>
                                    {settings.floors.map(floor => (
                                        <SelectItem key={floor.id} value={floor.id}>{floor.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {/* Table Select */}
                         <div className="space-y-2">
                             <label>Table</label>
                            <Select value={selectedTableId} onValueChange={(value) => { setSelectedTableId(value); setQrCodeValue(null); }} disabled={!selectedFloorId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a table" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableTables.map(table => (
                                        <SelectItem key={table.id} value={table.id}>{table.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <Button onClick={generateQRCode} disabled={!selectedBranchId || !selectedTableId}>
                           <QrCode className="mr-2 h-4 w-4"/> Generate QR Code
                        </Button>
                    </div>

                    {qrCodeValue && (
                        <Card className="mt-8 pt-6 flex flex-col items-center justify-center">
                            <CardContent id="qr-code-container" className="flex flex-col items-center text-center">
                                <QRCodeGenerator value={qrCodeValue} />
                                <div className="mt-4">
                                    <p className="font-bold text-lg">{settings.branches.find(b => b.id === selectedBranchId)?.name}</p>
                                    <p className="text-xl font-headline font-bold">
                                        {settings.floors.find(f => f.id === selectedFloorId)?.name} - {settings.tables.find(t => t.id === selectedTableId)?.name}
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-1">Scan to order</p>
                                </div>
                            </CardContent>
                            <CardHeader>
                                <Button onClick={handlePrint} size="lg">
                                    <Printer className="mr-2 h-4 w-4"/> Print QR Code
                                </Button>
                            </CardHeader>
                        </Card>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
