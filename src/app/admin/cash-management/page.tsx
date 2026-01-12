

"use client";

import { useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCashierLog } from '@/context/CashierLogContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ArrowUpCircle, ArrowDownCircle, Search, Printer, Calendar as CalendarIcon, FileDown, FileText } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import type { User, CashierLogEntry } from '@/lib/types';
import { useSettings } from '@/context/SettingsContext';
import { exportListDataAs } from '@/lib/exporter';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

function TransactionDialog({
    type,
    users,
    onConfirm
}: {
    type: 'bleed' | 'deposit';
    users: User[];
    onConfirm: (details: { cashierId: string; amount: number; notes: string }) => void;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedCashierId, setSelectedCashierId] = useState('');
    const [amount, setAmount] = useState('');
    const [notes, setNotes] = useState('');
    const { toast } = useToast();

    const title = type === 'deposit' ? 'Safe Deposit' : 'Cash Bleed';
    const description = type === 'deposit' ? 'Give cash to a cashier.' : 'Take cash from a cashier.';
    const buttonLabel = type === 'deposit' ? 'Make Deposit' : 'Confirm Bleed';
    const Icon = type === 'deposit' ? ArrowDownCircle : ArrowUpCircle;

    const handleSubmit = () => {
        const numAmount = parseFloat(amount);
        const cashier = users.find(u => u.id === selectedCashierId);

        if (!cashier) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please select a valid cashier.' });
            return;
        }
        if (isNaN(numAmount) || numAmount <= 0) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please enter a valid positive amount.' });
            return;
        }
        if (type === 'bleed' && numAmount > (cashier.balance || 0)) {
            toast({ variant: 'destructive', title: 'Error', description: `Cannot bleed more than the cashier's current balance of RS ${cashier.balance || 0}.` });
            return;
        }

        onConfirm({ cashierId: selectedCashierId, amount: numAmount, notes });
        setIsOpen(false);
        setSelectedCashierId('');
        setAmount('');
        setNotes('');
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Icon className="mr-2 h-4 w-4" /> {title}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="cashier-select">Cashier</Label>
                        <Select value={selectedCashierId} onValueChange={setSelectedCashierId}>
                            <SelectTrigger id="cashier-select">
                                <SelectValue placeholder="Select a cashier" />
                            </SelectTrigger>
                            <SelectContent>
                                {users.map(user => (
                                    <SelectItem key={user.id} value={user.id}>{user.username} (Balance: RS {Math.round(user.balance || 0)})</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="amount-input">Amount (RS)</Label>
                        <Input id="amount-input" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g., 5000" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="notes-input">Notes (Optional)</Label>
                        <Textarea id="notes-input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g., End of shift reconciliation" />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                    <Button onClick={handleSubmit}>{buttonLabel}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

const TransactionSlip = ({ log, adminName }: { log: CashierLogEntry; adminName: string }) => {
    return (
        <div className="p-4 bg-white text-black font-mono text-xs w-[300px] border border-gray-200">
            <div className="text-center mb-4">
                <h2 className="font-bold text-sm uppercase">{log.type} RECEIPT</h2>
            </div>
            <div className="mb-4 space-y-1">
                <div className="flex justify-between"><span>Transaction ID:</span><span className="font-bold">{log.id.slice(-8)}</span></div>
                <div className="flex justify-between"><span>Date:</span><span className="font-bold">{new Date(log.timestamp).toLocaleDateString()}</span></div>
                <div className="flex justify-between"><span>Time:</span><span className="font-bold">{new Date(log.timestamp).toLocaleTimeString()}</span></div>
                <div className="flex justify-between"><span>Admin:</span><span className="font-bold">{adminName}</span></div>
                <div className="flex justify-between"><span>Cashier:</span><span className="font-bold">{log.cashierName}</span></div>
            </div>
            <hr className="border-dashed border-black my-2" />
            <div className="flex justify-between font-bold text-sm">
                <span>AMOUNT:</span>
                <span className="text-right whitespace-nowrap">RS {Math.round(log.amount)}</span>
            </div>
            <hr className="border-dashed border-black my-2" />
            {log.notes && <div className="mt-2 text-gray-600">Notes: {log.notes}</div>}
            <div className="text-center mt-4">
                <p>--- End of Receipt ---</p>
            </div>
        </div>
    );
};


export default function CashManagementPage() {
    const { users } = useAuth();
    const { settings } = useSettings();
    const { logs: transactionLogs, logTransaction } = useCashierLog();
    const [searchTerm, setSearchTerm] = useState('');
    const [date, setDate] = useState<Date | undefined>(new Date());
    const { toast } = useToast();

    const cashiers = users.filter(u => u.role === 'cashier' || u.role === 'admin' || u.role === 'root');

    const handleConfirmTransaction = (details: { cashierId: string; amount: number; notes: string }) => {
        const cashier = cashiers.find(c => c.id === details.cashierId);
        if (!cashier) return;

        const type = details.amount > 0 ? 'deposit' : 'bleed';
        logTransaction({
            type: type,
            amount: Math.abs(details.amount),
            cashierId: cashier.id,
            cashierName: cashier.username,
            notes: details.notes
        });
        toast({ title: 'Success', description: `Transaction of RS ${details.amount} for ${cashier.username} has been logged.` });
    };

    const handlePrintSlip = (log: any) => {
        const admin = users.find(u => u.id === log.adminId);
        if (!admin) return;

        const printContainer = document.createElement('div');
        printContainer.id = 'printable-area';
        
        const receiptElement = document.getElementById(`receipt-${log.id}`);
        if(receiptElement) {
             printContainer.appendChild(receiptElement.cloneNode(true));
             document.body.appendChild(printContainer);
             document.body.classList.add('printing-active');
             window.print();
             document.body.removeChild(printContainer);
             document.body.classList.remove('printing-active');
        }
    };

    const filteredLogs = useMemo(() => {
        if (!date) return [];

        const fromDate = startOfDay(date);
        const toDate = endOfDay(date);

        return transactionLogs.filter(log => {
            const logDate = new Date(log.timestamp);
            const dateMatch = logDate >= fromDate && logDate <= toDate;
            if (!dateMatch) return false;

            const searchMatch = !searchTerm || 
                log.cashierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.adminName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.id.toLowerCase().includes(searchTerm.toLowerCase());
            return searchMatch;
        });
    }, [transactionLogs, searchTerm, date]);
    
    const handleDownload = (format: 'pdf' | 'csv') => {
        const defaultBranch = settings.branches.find(b => b.id === settings.defaultBranchId) || settings.branches[0];
        const title = `Cash Transactions Report`;
        const headerInfo = { 
            companyName: settings.companyName, 
            branchName: defaultBranch?.name || "All Branches", 
            dateDisplay: date ? format(date, "PPP") : 'All Time'
        };

        const columns = [
            { key: 'timestamp', label: 'Timestamp' },
            { key: 'type', label: 'Type' },
            { key: 'cashierName', label: 'Cashier' },
            { key: 'adminName', label: 'Admin' },
            { key: 'amount', label: 'Amount (RS)' },
            { key: 'notes', label: 'Notes' },
        ];
        
        const data = filteredLogs.map(log => ({
            ...log,
            timestamp: format(new Date(log.timestamp), 'Pp'),
            type: log.type === 'deposit' ? 'Safe Deposit' : 'Cash Bleed',
            amount: Math.round(log.amount),
        }));
        
        exportListDataAs(format, data, columns, title, headerInfo);
    };

    return (
        <div className="w-full space-y-8">
            <header>
                <h1 className="font-headline text-4xl font-bold">Cash Management</h1>
                <p className="text-muted-foreground">Monitor cashier balances and manage cash transactions like bleed and safe deposits.</p>
            </header>

            <Tabs defaultValue="balances">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="balances">Cashier Balances</TabsTrigger>
                    <TabsTrigger value="logs">Transaction Logs</TabsTrigger>
                </TabsList>

                <TabsContent value="balances" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Current Cashier Balances</CardTitle>
                            <CardDescription>Live view of the cash balance for each user account.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <div className="flex justify-end gap-2 mb-4">
                                <TransactionDialog type="deposit" users={cashiers} onConfirm={(details) => handleConfirmTransaction({ ...details, amount: details.amount })} />
                                <TransactionDialog type="bleed" users={cashiers} onConfirm={(details) => handleConfirmTransaction({ ...details, amount: -details.amount })} />
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead className="text-right">Current Balance (RS)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {cashiers.map(cashier => (
                                        <TableRow key={cashier.id}>
                                            <TableCell className="font-medium">{cashier.username}</TableCell>
                                            <TableCell className="capitalize">{cashier.role}</TableCell>
                                            <TableCell className="text-right font-bold text-lg">
                                                {Math.round(cashier.balance || 0).toLocaleString()}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="logs" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Safe Deposit & Bleed Logs</CardTitle>
                            <CardDescription>A complete audit trail of all cash transactions.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-4 flex flex-col md:flex-row gap-4 items-end">
                                <div className="relative flex-grow md:max-w-sm">
                                    <Label htmlFor="log-search">Search Logs</Label>
                                    <Search className="absolute left-3 top-2/3 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="log-search"
                                        placeholder="Search logs..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                                <div className="space-y-2">
                                     <Label>Date</Label>
                                     <Popover>
                                        <PopoverTrigger asChild>
                                        <Button
                                            id="date"
                                            variant={"outline"}
                                            className={cn("w-full md:w-[240px] justify-start text-left font-normal", !date && "text-muted-foreground")}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {date ? format(date, "PPP") : <span>Pick a date</span>}
                                        </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="end">
                                        <Calendar
                                            mode="single"
                                            selected={date}
                                            onSelect={setDate}
                                            initialFocus
                                            disabled={(d) => d > new Date() || d < subDays(new Date(), 30)}
                                        />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={() => handleDownload('csv')} disabled={filteredLogs.length === 0}><FileDown className="mr-2 h-4 w-4" /> CSV</Button>
                                    <Button variant="outline" onClick={() => handleDownload('pdf')} disabled={filteredLogs.length === 0}><FileText className="mr-2 h-4 w-4" /> PDF</Button>
                                </div>
                            </div>
                            <ScrollArea className="h-[60vh]">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Timestamp</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Cashier</TableHead>
                                            <TableHead>Admin</TableHead>
                                            <TableHead className="text-right">Amount (RS)</TableHead>
                                            <TableHead className="text-center">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredLogs.map(log => (
                                            <TableRow key={log.id}>
                                                <TableCell>{format(new Date(log.timestamp), 'PPpp')}</TableCell>
                                                <TableCell>
                                                    <span className={`font-semibold ${log.type === 'deposit' ? 'text-green-600' : 'text-red-600'}`}>
                                                        {log.type === 'deposit' ? 'Safe Deposit' : 'Cash Bleed'}
                                                    </span>
                                                </TableCell>
                                                <TableCell>{log.cashierName}</TableCell>
                                                <TableCell>{log.adminName}</TableCell>
                                                <TableCell className="text-right font-semibold">{Math.round(log.amount).toLocaleString()}</TableCell>
                                                <TableCell className="text-center">
                                                    <Button variant="ghost" size="icon" onClick={() => handlePrintSlip(log)}>
                                                        <Printer className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                            {filteredLogs.length === 0 && <p className="text-center text-muted-foreground pt-8">No transaction logs found for the selected date.</p>}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
             {/* Hidden receipt container */}
             <div className="hidden">
                {transactionLogs.map(log => (
                    <div key={`receipt-${log.id}`} id={`receipt-${log.id}`}>
                        <TransactionSlip log={log} adminName={log.adminName} />
                    </div>
                ))}
            </div>
        </div>
    );
}
