'use client';

import { useState, useEffect } from "react";
import { useSettings } from "@/context/SettingsContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Edit, Lock } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/context/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";


function AdvancedSettingsGate({ onUnlock }: { onUnlock: () => void }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { toast } = useToast();

    const handleUnlock = () => {
        // NOTE: In a real app, this would be a secure API call.
        if (username === 'root' && password === 'Faith123$$') {
            onUnlock();
        } else {
            toast({
                variant: 'destructive',
                title: 'Access Denied',
                description: 'The credentials you entered are incorrect.',
            });
        }
    };
    
    return (
        <Card className="mt-6">
            <CardHeader>
                <CardTitle className="flex items-center"><Lock className="mr-2"/> Advanced Settings</CardTitle>
                <CardDescription>You must enter root credentials to access these settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="adv-username">Username</Label>
                    <Input id="adv-username" value={username} onChange={(e) => setUsername(e.target.value)} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="adv-password">Password</Label>
                    <Input id="adv-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
            </CardContent>
            <CardFooter>
                <Button onClick={handleUnlock}>Unlock Advanced Settings</Button>
            </CardFooter>
        </Card>
    );
}

export default function AdminSettingsPage() {
    const { settings, addFloor, deleteFloor, addTable, deleteTable, addPaymentMethod, deletePaymentMethod, toggleAutoPrint, updateBranch, toggleService, updateBusinessDayHours, addBranch, deleteBranch, setDefaultBranch } = useSettings();
    const { user } = useAuth();
    
    const [isAdvancedSettingsUnlocked, setAdvancedSettingsUnlocked] = useState(false);

    const [newFloorName, setNewFloorName] = useState("");
    const [newTableName, setNewTableName] = useState("");
    const [selectedFloorForNewTable, setSelectedFloorForNewTable] = useState("");
    const [newPaymentMethodName, setNewPaymentMethodName] = useState("");
    const [editingBranch, setEditingBranch] = useState<(typeof settings.branches)[0] | null>(null);
    const [editingBranchName, setEditingBranchName] = useState("");
    
    const [businessDayStart, setBusinessDayStart] = useState(settings.businessDayStart);
    const [businessDayEnd, setBusinessDayEnd] = useState(settings.businessDayEnd);

    const [newBranchName, setNewBranchName] = useState('');

    useEffect(() => {
        setBusinessDayStart(settings.businessDayStart);
        setBusinessDayEnd(settings.businessDayEnd);
    }, [settings.businessDayStart, settings.businessDayEnd]);


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
        }
    };

    const handleAddPaymentMethod = () => {
        if (newPaymentMethodName.trim()) {
            addPaymentMethod(newPaymentMethodName.trim());
            setNewPaymentMethodName("");
        }
    };
    
    const handleUpdateBranch = () => {
        if (editingBranch && editingBranchName.trim()) {
            updateBranch(editingBranch.id, editingBranchName.trim());
            setEditingBranch(null);
            setEditingBranchName("");
        }
    };
    
    const handleSaveBusinessHours = () => {
        updateBusinessDayHours(businessDayStart, businessDayEnd);
    };

    const handleAddBranch = () => {
        if (newBranchName.trim()) {
            addBranch(newBranchName.trim());
            setNewBranchName('');
        }
    };

    const defaultPaymentMethodIds = ['cash', 'card'];

    const visibleBranches = user?.role === 'admin'
        ? settings.branches.filter(b => b.id === user.branchId)
        : settings.branches;

    return (
        <div className="container mx-auto p-4 lg:p-8 space-y-8">
            <header>
                <h1 className="font-headline text-4xl font-bold">Admin Settings</h1>
                <p className="text-muted-foreground">Manage restaurant layout, payments, and branch settings.</p>
            </header>

            <Tabs defaultValue="general">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="advanced">Advanced</TabsTrigger>
                </TabsList>
                <TabsContent value="general" className="mt-6 space-y-8">
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
                </TabsContent>
                <TabsContent value="advanced">
                    {!isAdvancedSettingsUnlocked ? (
                        <AdvancedSettingsGate onUnlock={() => setAdvancedSettingsUnlocked(true)} />
                    ) : (
                        <div className="space-y-8 mt-6">
                            {/* Branch Management */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Branch Management</CardTitle>
                                    <CardDescription>Configure settings for each restaurant branch.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {user?.role === 'root' && (
                                        <div className="mb-6 p-4 border rounded-lg space-y-4">
                                            <h4 className="font-semibold">Add New Branch</h4>
                                            <div className="grid md:grid-cols-2 gap-2">
                                                <Input
                                                    placeholder="New branch name"
                                                    value={newBranchName}
                                                    onChange={(e) => setNewBranchName(e.target.value)}
                                                />
                                                <Button onClick={handleAddBranch}>Add Branch</Button>
                                            </div>
                                        </div>
                                    )}
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Branch Name</TableHead>
                                                <TableHead>Dine-In</TableHead>
                                                <TableHead>Take Away</TableHead>
                                                <TableHead className="text-right w-[120px]">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {visibleBranches.map(branch => (
                                                <TableRow key={branch.id}>
                                                    <TableCell className="font-medium">{branch.name}</TableCell>
                                                    <TableCell>
                                                        <Switch
                                                            checked={branch.dineInEnabled}
                                                            onCheckedChange={(checked) => toggleService(branch.id, 'dineInEnabled', checked)}
                                                            aria-label="Toggle Dine-In"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Switch
                                                            checked={branch.takeAwayEnabled}
                                                            onCheckedChange={(checked) => toggleService(branch.id, 'takeAwayEnabled', checked)}
                                                            aria-label="Toggle Take Away"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="icon" onClick={() => { setEditingBranch(branch); setEditingBranchName(branch.name); }}>
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button variant="ghost" size="icon">
                                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        This action cannot be undone. This will permanently delete the branch and any associated user access.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                    <AlertDialogAction onClick={() => deleteBranch(branch.id)}>Delete</AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>

                            {/* Default Branch Settings */}
                            {user?.role === 'root' && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Default Branch</CardTitle>
                                        <CardDescription>Select the default branch for the main landing page.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                                            <div className="space-y-2">
                                                <Label htmlFor="default-branch-select">Default Branch for Homepage</Label>
                                                <Select value={settings.defaultBranchId || ''} onValueChange={setDefaultBranch}>
                                                    <SelectTrigger id="default-branch-select">
                                                        <SelectValue placeholder="Select a default branch" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {settings.branches.map(branch => (
                                                            <SelectItem key={branch.id} value={branch.id}>
                                                                {branch.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Business Day Settings */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Business Day Configuration</CardTitle>
                                    <CardDescription>Set the start and end time for your business day for reporting purposes.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 items-end gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="business-day-start">Business Day Start Time</Label>
                                            <Input
                                                id="business-day-start"
                                                type="time"
                                                value={businessDayStart}
                                                onChange={(e) => setBusinessDayStart(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="business-day-end">Business Day End Time</Label>
                                            <Input
                                                id="business-day-end"
                                                type="time"
                                                value={businessDayEnd}
                                                onChange={(e) => setBusinessDayEnd(e.target.value)}
                                            />
                                        </div>
                                        <Button onClick={handleSaveBusinessHours}>Save Business Hours</Button>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        For a business day that spans across midnight (e.g., 11:00 AM to 4:00 AM), reports will include sales from the start time on the selected date to the end time on the following day.
                                    </p>
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
                    )}
                </TabsContent>
            </Tabs>
           

            {/* Edit Branch Dialog */}
            <Dialog open={!!editingBranch} onOpenChange={(isOpen) => !isOpen && setEditingBranch(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Branch Name</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="branch-name">Branch Name</Label>
                        <Input
                            id="branch-name"
                            value={editingBranchName}
                            onChange={(e) => setEditingBranchName(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="secondary">Cancel</Button>
                        </DialogClose>
                        <Button onClick={handleUpdateBranch}>Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
