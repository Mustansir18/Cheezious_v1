

'use client';

import { useState, useEffect } from "react";
import Image from "next/image";
import { useSettings } from "@/context/SettingsContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Edit, Lock, Percent, PlusCircle, Megaphone } from "lucide-react";
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import type { Branch, Role, UserRole, PromotionSettings } from "@/lib/types";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { ALL_PERMISSIONS } from '@/config/permissions';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import imageCompression from 'browser-image-compression';
import { useMenu } from "@/context/MenuContext";


async function handleImageUpload(file: File) {
  const options = {
    maxSizeMB: 0.2, // Max size 200KB
    maxWidthOrHeight: 400, // Max width or height 400px
    useWebWorker: true,
  };
  try {
    const compressedFile = await imageCompression(file, options);
    return await imageCompression.getDataUrlFromFile(compressedFile);
  } catch (error) {
    console.error('Image compression failed:', error);
    // Fallback for safety, though it might exceed size limits
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

function RoleForm({
  role,
  onSave,
  onClose,
}: {
  role?: Role;
  onSave: (role: Omit<Role, 'id'> | Role, id?: string) => void;
  onClose: () => void;
}) {
  const [id, setId] = useState<UserRole | string>('');
  const [name, setName] = useState(role?.name || '');
  const [permissions, setPermissions] = useState<string[]>(role?.permissions || []);

  const handlePermissionToggle = (permission: string) => {
    setPermissions(prev =>
      prev.includes(permission) ? prev.filter(p => p !== permission) : [...prev, permission]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { name, permissions };
    if (role) {
      onSave({ ...role, ...data });
    } else {
      onSave({ ...data }, id);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {role ? (
        <div>
          <Label htmlFor="role-id">Role Code</Label>
          <Input id="role-id" value={role.id as string} disabled />
        </div>
      ) : (
        <div>
          <Label htmlFor="role-id">Role Code</Label>
          <Input id="role-id" value={id} onChange={(e) => setId(e.target.value)} required placeholder="e.g. R-00001" />
        </div>
      )}
      <div>
        <Label htmlFor="role-name">Role Name</Label>
        <Input id="role-name" value={name} onChange={(e) => setName(e.target.value)} required disabled={!!role?.id && ['root', 'admin', 'cashier', 'marketing'].includes(role.id as string)} />
        {role?.id && ['root', 'admin', 'cashier', 'marketing'].includes(role.id as string) && <p className="text-xs text-muted-foreground mt-1">Default role names cannot be changed.</p>}
      </div>
      <div>
        <Label>Permissions</Label>
        <ScrollArea className="h-60 rounded-md border p-4">
            <div className="space-y-2">
                {ALL_PERMISSIONS.map(permission => (
                     <div key={permission.id} className="flex items-start space-x-2">
                        <Checkbox
                            id={`perm-${permission.id}`}
                            checked={permissions.includes(permission.id)}
                            onCheckedChange={() => handlePermissionToggle(permission.id)}
                            disabled={role?.id === 'root'}
                        />
                         <div className="grid gap-1.5 leading-none">
                            <Label htmlFor={`perm-${permission.id}`} className="font-normal cursor-pointer">{permission.name}</Label>
                            <p className="text-xs text-muted-foreground">{permission.description}</p>
                        </div>
                     </div>
                ))}
            </div>
        </ScrollArea>
      </div>
      <DialogFooter>
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit">Save Role</Button>
      </DialogFooter>
    </form>
  );
}

function RoleManagement() {
    const { settings, addRole, updateRole, deleteRole } = useSettings();
    const [isDialogOpen, setDialogOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | undefined>();

    const openDialog = (role?: Role) => {
        setEditingRole(role);
        setDialogOpen(true);
    };

    const closeDialog = () => {
        setEditingRole(undefined);
        setDialogOpen(false);
    };

    const handleSave = (roleData: Omit<Role, 'id'> | Role, id?: string) => {
        if ('id' in roleData) {
            updateRole(roleData as Role);
        } else if (id) {
            addRole({ id, ...roleData });
        }
        closeDialog();
    };

    return (
        <Card>
            <CardHeader className="flex-row justify-between items-center">
                 <div>
                    <CardTitle>Role Management</CardTitle>
                    <CardDescription>Define roles and their access permissions across the application.</CardDescription>
                </div>
                <Button onClick={() => openDialog()}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Role
                </Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Role</TableHead>
                            <TableHead>Code</TableHead>
                            <TableHead>Permissions</TableHead>
                            <TableHead className="text-right w-[120px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {settings.roles.map(role => (
                            <TableRow key={role.id}>
                                <TableCell className="font-semibold capitalize">{role.name}</TableCell>
                                <TableCell className="font-mono text-xs">{role.id}</TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-2 max-w-md">
                                        {role.permissions.map(permission => (
                                            <span key={permission} className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                                                {ALL_PERMISSIONS.find(p => p.id === permission)?.name || permission}
                                            </span>
                                        ))}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => openDialog(role)}>
                                        <Edit className="h-4 w-4"/>
                                    </Button>
                                     <DeleteConfirmationDialog
                                        title={`Delete Role "${role.name}"?`}
                                        description={<>This will permanently delete the role. Users with this role will lose access.</>}
                                        onConfirm={() => deleteRole(role.id as UserRole)}
                                        triggerButton={
                                            <Button variant="ghost" size="icon" disabled={['root', 'admin', 'cashier', 'marketing'].includes(role.id as string)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        }
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
             <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingRole ? `Edit Role: ${editingRole.name}` : 'Add New Role'}</DialogTitle>
                    </DialogHeader>
                    <RoleForm role={editingRole} onSave={handleSave} onClose={closeDialog} />
                </DialogContent>
            </Dialog>
        </Card>
    );
}

function AdvancedSettingsGate({ onUnlock }: { onUnlock: () => void }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { toast } = useToast();

    const handleUnlock = () => {
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

function PromotionSettingsManager() {
    const { settings, updatePromotion } = useSettings();
    const { menu } = useMenu();
    const { toast } = useToast();
    
    const [promotionState, setPromotionState] = useState<PromotionSettings>(settings.promotion);

    useEffect(() => {
        setPromotionState(settings.promotion);
    }, [settings.promotion]);

    const deals = menu.items.filter(item => item.categoryId === 'C-00001');

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const compressedDataUrl = await handleImageUpload(file);
            setPromotionState(prev => ({...prev, imageUrl: compressedDataUrl}));
        }
    };

    const handleSave = () => {
        updatePromotion(promotionState);
        toast({ title: 'Success', description: 'Promotion settings have been updated.' });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Homepage Pop-up Promotion</CardTitle>
                <CardDescription>Configure the promotional pop-up that appears when a user first visits the homepage.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                 <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label htmlFor="promo-enabled-switch" className="text-base">Enable Promotion Pop-up</Label>
                        <p className="text-sm text-muted-foreground">
                            If disabled, the pop-up will not appear on the homepage.
                        </p>
                    </div>
                    <Switch
                        id="promo-enabled-switch"
                        checked={promotionState.isEnabled}
                        onCheckedChange={(checked) => setPromotionState(prev => ({ ...prev, isEnabled: checked }))}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="promo-deal-select">Featured Deal</Label>
                    <Select 
                        value={promotionState.dealId || ''}
                        onValueChange={(value) => setPromotionState(prev => ({...prev, dealId: value}))}
                    >
                        <SelectTrigger id="promo-deal-select">
                            <SelectValue placeholder="Select a deal to feature" />
                        </SelectTrigger>
                        <SelectContent>
                            {deals.map(deal => (
                                <SelectItem key={deal.id} value={deal.id}>{deal.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                     <p className="text-xs text-muted-foreground">This is the deal that will be added to the cart when a user clicks the promotion.</p>
                </div>
                
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    <div className="space-y-2">
                        <Label htmlFor="promo-image">Promotion Image</Label>
                        <Input 
                            id="promo-image" 
                            type="file" 
                            accept="image/*" 
                            onChange={handleImageChange}
                            className="file:text-foreground"
                        />
                        <p className="text-xs text-muted-foreground">This image will be shown in the pop-up. Recommended: 800x600, less than 200KB.</p>
                    </div>
                     <div className="space-y-2">
                        <Label>Image Preview</Label>
                        <div className="flex items-center justify-center p-4 border rounded-lg h-40 bg-muted/50">
                            {promotionState.imageUrl ? (
                                <Image src={promotionState.imageUrl} alt="Promotion Preview" width={160} height={120} className="object-contain rounded-md" />
                            ) : (
                                <p className="text-muted-foreground">No image set</p>
                            )}
                        </div>
                    </div>
                </div>

            </CardContent>
            <CardFooter>
                 <Button onClick={handleSave}>Save Promotion Settings</Button>
            </CardFooter>
        </Card>
    );
}

export default function AdminSettingsPage() {
    const { settings, addFloor, deleteFloor, addTable, deleteTable, addPaymentMethod, deletePaymentMethod, toggleAutoPrint, updateBranch, toggleService, updateBusinessDayHours, addBranch, deleteBranch, setDefaultBranch, updateCompanyName, updateCompanyLogo, updatePaymentMethodTaxRate, addDeliveryMode, deleteDeliveryMode } = useSettings();
    const { user } = useAuth();
    const { toast } = useToast();
    
    const [isAdvancedSettingsUnlocked, setAdvancedSettingsUnlocked] = useState(false);

    const [newFloorId, setNewFloorId] = useState("");
    const [newFloorName, setNewFloorName] = useState("");
    const [newTableId, setNewTableId] = useState("");
    const [newTableName, setNewTableName] = useState("");
    const [selectedFloorForNewTable, setSelectedFloorForNewTable] = useState("");
    const [newPaymentMethodId, setNewPaymentMethodId] = useState("");
    const [newPaymentMethodName, setNewPaymentMethodName] = useState("");
    const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
    const [editingBranchName, setEditingBranchName] = useState("");
    const [editingBranchPrefix, setEditingBranchPrefix] = useState("");
    const [companyName, setCompanyName] = useState(settings.companyName);
    const [companyLogo, setCompanyLogo] = useState(settings.companyLogo || '');
    const [newDeliveryModeId, setNewDeliveryModeId] = useState('');
    const [newDeliveryModeName, setNewDeliveryModeName] = useState('');
    
    const [businessDayStart, setBusinessDayStart] = useState(settings.businessDayStart);
    const [businessDayEnd, setBusinessDayEnd] = useState(settings.businessDayEnd);

    const [newBranchId, setNewBranchId] = useState('');
    const [newBranchName, setNewBranchName] = useState('');
    const [newBranchPrefix, setNewBranchPrefix] = useState('');

    useEffect(() => {
        setBusinessDayStart(settings.businessDayStart);
        setBusinessDayEnd(settings.businessDayEnd);
        setCompanyName(settings.companyName);
        setCompanyLogo(settings.companyLogo || '');
    }, [settings]);


    const handleAddFloor = () => {
        if (newFloorId.trim() && newFloorName.trim()) {
            addFloor(newFloorId.trim(), newFloorName.trim());
            setNewFloorId("");
            setNewFloorName("");
        }
    };

    const handleAddTable = () => {
        if (newTableId.trim() && newTableName.trim() && selectedFloorForNewTable) {
            addTable(newTableId.trim(), newTableName.trim(), selectedFloorForNewTable);
            setNewTableId("");
            setNewTableName("");
        }
    };
    
    const handleAddDeliveryMode = () => {
        if (newDeliveryModeId.trim() && newDeliveryModeName.trim()) {
            addDeliveryMode(newDeliveryModeId.trim(), newDeliveryModeName.trim());
            setNewDeliveryModeId("");
            setNewDeliveryModeName("");
        }
    };

    const handleAddPaymentMethod = () => {
        if (newPaymentMethodId.trim() && newPaymentMethodName.trim()) {
            addPaymentMethod(newPaymentMethodId.trim(), newPaymentMethodName.trim());
            setNewPaymentMethodId("");
            setNewPaymentMethodName("");
        }
    };
    
    const handleUpdateBranch = () => {
        if (editingBranch && editingBranchName.trim() && editingBranchPrefix.trim()) {
            updateBranch(editingBranch.id, editingBranchName.trim(), editingBranchPrefix.trim());
            setEditingBranch(null);
            setEditingBranchName("");
            setEditingBranchPrefix("");
        }
    };
    
    const handleSaveBusinessHours = () => {
        updateBusinessDayHours(businessDayStart, businessDayEnd);
    };

    const handleSaveCompanyInfo = () => {
        if (companyName.trim()) {
            updateCompanyName(companyName.trim());
        }
        if (companyLogo) {
            updateCompanyLogo(companyLogo);
        }
        toast({ title: 'Success', description: 'Company information has been updated.' });
    };

    const handleLogoImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
          const compressedDataUrl = await handleImageUpload(file);
          setCompanyLogo(compressedDataUrl);
        }
    };

    const handleAddBranch = () => {
        if (newBranchId.trim() && newBranchName.trim() && newBranchPrefix.trim()) {
            addBranch(newBranchId.trim(), newBranchName.trim(), newBranchPrefix.trim());
            setNewBranchId('');
            setNewBranchName('');
            setNewBranchPrefix('');
        }
    };
    
    const openEditDialog = (branch: Branch) => {
        setEditingBranch(branch);
        setEditingBranchName(branch.name);
        setEditingBranchPrefix(branch.orderPrefix);
    }

    const visibleBranches = user?.role === 'admin'
        ? settings.branches.filter(b => b.id === user.branchId)
        : settings.branches;

    return (
        <div className="w-full space-y-8">
            <header>
                <h1 className="font-headline text-4xl font-bold">Admin Settings</h1>
                <p className="text-muted-foreground">Manage restaurant layout, payments, and branch settings.</p>
            </header>

            <Tabs defaultValue="general">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="promotions">Promotions</TabsTrigger>
                    <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
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
                            <div className="flex flex-col md:flex-row gap-2 mb-4">
                                <Input
                                    placeholder="New floor code (e.g., F-01)"
                                    value={newFloorId}
                                    onChange={(e) => setNewFloorId(e.target.value)}
                                />
                                <Input
                                    placeholder="New floor name (e.g., Ground Floor)"
                                    value={newFloorName}
                                    onChange={(e) => setNewFloorName(e.target.value)}
                                />
                                <Button onClick={handleAddFloor} className="w-full md:w-auto">Add Floor</Button>
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Floor Name</TableHead>
                                        <TableHead>Code</TableHead>
                                        <TableHead className="text-right w-[80px]">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {settings.floors.map(floor => (
                                        <TableRow key={floor.id}>
                                            <TableCell>{floor.name}</TableCell>
                                            <TableCell className="font-mono text-xs">{floor.id}</TableCell>
                                            <TableCell className="text-right">
                                                <DeleteConfirmationDialog
                                                    title={`Delete Floor "${floor.name}"?`}
                                                    description={<>This action cannot be undone. This will permanently delete the floor <strong>{floor.name}</strong> and all of its tables.</>}
                                                    onConfirm={() => deleteFloor(floor.id, floor.name)}
                                                />
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
                            <div className="grid md:grid-cols-4 gap-2 mb-4">
                                <Input
                                    placeholder="New table code (e.g., T-01)"
                                    value={newTableId}
                                    onChange={(e) => setNewTableId(e.target.value)}
                                />
                                <Input
                                    placeholder="New table name (e.g., Table 1)"
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
                                        <TableHead>Code</TableHead>
                                        <TableHead>Floor</TableHead>
                                        <TableHead className="text-right w-[80px]">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {settings.tables.map(table => (
                                        <TableRow key={table.id}>
                                            <TableCell>{table.name}</TableCell>
                                            <TableCell className="font-mono text-xs">{table.id}</TableCell>
                                            <TableCell>{settings.floors.find(f => f.id === table.floorId)?.name || 'N/A'}</TableCell>
                                            <TableCell className="text-right">
                                                 <DeleteConfirmationDialog
                                                    title={`Delete Table "${table.name}"?`}
                                                    description={<>This action cannot be undone. This will permanently delete table <strong>{table.name}</strong>.</>}
                                                    onConfirm={() => deleteTable(table.id, table.name)}
                                                 />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                 <TabsContent value="promotions" className="mt-6">
                    <PromotionSettingsManager />
                </TabsContent>
                 <TabsContent value="roles" className="mt-6">
                    <RoleManagement />
                </TabsContent>
                <TabsContent value="advanced">
                    {!isAdvancedSettingsUnlocked ? (
                        <AdvancedSettingsGate onUnlock={() => setAdvancedSettingsUnlocked(true)} />
                    ) : (
                        <div className="space-y-8 mt-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Company Information</CardTitle>
                                    <CardDescription>Set the company name and logo displayed across the app.</CardDescription>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="company-name">Company Name</Label>
                                            <Input
                                                id="company-name"
                                                value={companyName}
                                                onChange={(e) => setCompanyName(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="company-logo">Company Logo</Label>
                                            <Input 
                                                id="company-logo" 
                                                type="file" 
                                                accept="image/*" 
                                                onChange={handleLogoImageChange}
                                                className="file:text-foreground"
                                            />
                                            <p className="text-xs text-muted-foreground">Recommended: Square, less than 200KB.</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Logo Preview</Label>
                                        <div className="flex items-center justify-center p-4 border rounded-lg h-40 bg-muted/50">
                                            {companyLogo ? (
                                                <Image src={companyLogo} alt="Company Logo Preview" width={128} height={128} className="object-contain rounded-md" />
                                            ) : (
                                                <p className="text-muted-foreground">No logo set</p>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button>Save Company Info</Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will change the company name and logo displayed across the entire application.
                                            </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleSaveCompanyInfo}>Save</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </CardFooter>
                            </Card>

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
                                            <div className="grid md:grid-cols-4 gap-2">
                                                <Input
                                                    placeholder="Branch Code (e.g., B-01)"
                                                    value={newBranchId}
                                                    onChange={(e) => setNewBranchId(e.target.value)}
                                                />
                                                <Input
                                                    placeholder="New branch name"
                                                    value={newBranchName}
                                                    onChange={(e) => setNewBranchName(e.target.value)}
                                                />
                                                 <Input
                                                    placeholder="Order Prefix (e.g., G3)"
                                                    value={newBranchPrefix}
                                                    onChange={(e) => setNewBranchPrefix(e.target.value)}
                                                />
                                                <Button onClick={handleAddBranch}>Add Branch</Button>
                                            </div>
                                        </div>
                                    )}
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Branch Name</TableHead>
                                                <TableHead>Code</TableHead>
                                                <TableHead>Order Prefix</TableHead>
                                                <TableHead>Dine-In</TableHead>
                                                <TableHead>Take Away</TableHead>
                                                <TableHead>Delivery</TableHead>
                                                <TableHead className="text-right w-[120px]">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {visibleBranches.map(branch => (
                                                <TableRow key={branch.id}>
                                                    <TableCell className="font-medium">{branch.name}</TableCell>
                                                    <TableCell className="font-mono text-xs">{branch.id}</TableCell>
                                                    <TableCell className="font-mono">{branch.orderPrefix}</TableCell>
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
                                                     <TableCell>
                                                        <Switch
                                                            checked={branch.deliveryEnabled}
                                                            onCheckedChange={(checked) => toggleService(branch.id, 'deliveryEnabled', checked)}
                                                            aria-label="Toggle Delivery"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(branch)}>
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <DeleteConfirmationDialog
                                                            title={`Delete Branch "${branch.name}"?`}
                                                            description={<>This action cannot be undone. This will permanently delete the branch <strong>{branch.name}</strong> and any associated user access.</>}
                                                            onConfirm={() => deleteBranch(branch.id, branch.name)}
                                                        />
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
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button>Save Business Hours</Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will change the business hours used for all reports.
                                                </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={handleSaveBusinessHours}>Save</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>

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
                                    <CardTitle>Manage Payment Methods & Taxes</CardTitle>
                                    <CardDescription>Add, remove, and set tax rates for payment methods.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-col md:flex-row gap-2 mb-4">
                                        <Input
                                            placeholder="New method code (e.g., PM-01)"
                                            value={newPaymentMethodId}
                                            onChange={(e) => setNewPaymentMethodId(e.target.value)}
                                        />
                                        <Input
                                            placeholder="New payment method name (e.g., QR Pay)"
                                            value={newPaymentMethodName}
                                            onChange={(e) => setNewPaymentMethodName(e.target.value)}
                                        />
                                        <Button onClick={handleAddPaymentMethod} className="w-full md:w-auto">Add Method</Button>
                                    </div>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Method Name</TableHead>
                                                <TableHead>Code</TableHead>
                                                <TableHead className="w-[150px]">Tax Rate (%)</TableHead>
                                                <TableHead className="text-right w-[80px]">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {settings.paymentMethods.map(method => (
                                                <TableRow key={method.id}>
                                                    <TableCell>{method.name}</TableCell>
                                                    <TableCell className="font-mono text-xs">{method.id}</TableCell>
                                                    <TableCell>
                                                        <div className="relative">
                                                            <Input
                                                                type="number"
                                                                value={method.taxRate ? method.taxRate * 100 : 0}
                                                                onChange={(e) => updatePaymentMethodTaxRate(method.id, parseFloat(e.target.value) / 100)}
                                                                className="pl-2 pr-7"
                                                            />
                                                            <Percent className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                         <DeleteConfirmationDialog
                                                            title={`Delete Method "${method.name}"?`}
                                                            description={<>This action will permanently delete the payment method <strong>{method.name}</strong>.</>}
                                                            onConfirm={() => deletePaymentMethod(method.id, method.name)}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>

                             {/* Delivery Modes Management */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Manage Delivery Modes</CardTitle>
                                    <CardDescription>Add or remove delivery sources like Website, App, or Call Centre.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-col md:flex-row gap-2 mb-4">
                                        <Input
                                            placeholder="New mode code (e.g., DM-01)"
                                            value={newDeliveryModeId}
                                            onChange={(e) => setNewDeliveryModeId(e.target.value)}
                                        />
                                        <Input
                                            placeholder="New mode name (e.g., Website)"
                                            value={newDeliveryModeName}
                                            onChange={(e) => setNewDeliveryModeName(e.target.value)}
                                        />
                                        <Button onClick={handleAddDeliveryMode} className="w-full md:w-auto">Add Mode</Button>
                                    </div>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Mode Name</TableHead>
                                                <TableHead>Code</TableHead>
                                                <TableHead className="text-right w-[80px]">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {settings.deliveryModes.map(mode => (
                                                <TableRow key={mode.id}>
                                                    <TableCell>{mode.name}</TableCell>
                                                    <TableCell className="font-mono text-xs">{mode.id}</TableCell>
                                                    <TableCell className="text-right">
                                                        <DeleteConfirmationDialog
                                                            title={`Delete Delivery Mode "${mode.name}"?`}
                                                            description={<>This will permanently delete the delivery mode <strong>{mode.name}</strong>.</>}
                                                            onConfirm={() => deleteDeliveryMode(mode.id, mode.name)}
                                                        />
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
                        <DialogTitle>Edit Branch</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="branch-id">Branch Code</Label>
                            <Input
                                id="branch-id"
                                value={editingBranch?.id || ''}
                                disabled
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="branch-name">Branch Name</Label>
                            <Input
                                id="branch-name"
                                value={editingBranchName}
                                onChange={(e) => setEditingBranchName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                             <Label htmlFor="branch-prefix">Order Prefix</Label>
                            <Input
                                id="branch-prefix"
                                value={editingBranchPrefix}
                                onChange={(e) => setEditingBranchPrefix(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="secondary">Cancel</Button>
                        </DialogClose>
                        <Button onClick={handleUpdateBranch}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
