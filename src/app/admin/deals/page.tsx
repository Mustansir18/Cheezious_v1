

"use client";

import { useState } from 'react';
import Image from 'next/image';
import { useDeals } from '@/context/DealsContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Edit, PlusCircle, Loader, FileText, FileDown, Minus, Plus, ChefHat } from 'lucide-react';
import type { Deal, DealItem, MenuItem } from '@/lib/types';
import imageCompression from 'browser-image-compression';
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog';
import { useToast } from '@/hooks/use-toast';
import { useMenu } from '@/context/MenuContext';
import { cn } from '@/lib/utils';
import { exportListDataAs } from '@/lib/exporter';
import { useSettings } from '@/context/SettingsContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';


async function handleImageUpload(file: File) {
  const options = {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 800,
    useWebWorker: true,
  };
  try {
    const compressedFile = await imageCompression(file, options);
    return await imageCompression.getDataUrlFromFile(compressedFile);
  } catch (error) {
    console.error('Image compression failed:', error);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

function DealForm({
  deal,
  onSave,
}: {
  deal?: Deal;
  onSave: (dealData: Omit<Deal, 'id'> | Deal, id?: string) => void;
}) {
  const [id, setId] = useState(deal?.id || '');
  const [name, setName] = useState(deal?.name || '');
  const [description, setDescription] = useState(deal?.description || '');
  const [price, setPrice] = useState(deal?.price || 0);
  const [imageUrl, setImageUrl] = useState(deal?.imageUrl || '');
  const [items, setItems] = useState<DealItem[]>(deal?.items || []);
  const [isCompressing, setIsCompressing] = useState(false);
  const { deals } = useDeals();
  const { menu } = useMenu();
  const { toast } = useToast();
  const [isIdInvalid, setIsIdInvalid] = useState(false);
  const [isItemPopoverOpen, setItemPopoverOpen] = useState(false);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompressing(true);
      const compressedDataUrl = await handleImageUpload(file);
      setImageUrl(compressedDataUrl);
      setIsCompressing(false);
    }
  };

  const validateId = (value: string) => {
    if (menu.items.some(item => item.id === value) || deals.some(d => d.id === value && d.id !== deal?.id)) {
      toast({
        variant: 'destructive',
        title: 'Duplicate Code',
        description: `The code "${value}" is already in use by another deal or menu item.`,
      });
      setIsIdInvalid(true);
      return false;
    }
    setIsIdInvalid(false);
    return true;
  };
  
  const handleItemSelect = (menuItem: MenuItem) => {
    setItems(currentItems => {
        const existing = currentItems.find(i => i.menuItemId === menuItem.id);
        if (existing) {
            return currentItems.map(i => i.menuItemId === menuItem.id ? {...i, quantity: i.quantity + 1} : i);
        }
        return [...currentItems, { menuItemId: menuItem.id, quantity: 1}];
    });
    setItemPopoverOpen(false);
  };
  
  const handleItemQuantityChange = (menuItemId: string, change: number) => {
      setItems(currentItems => {
          const newQuantity = (currentItems.find(i => i.menuItemId === menuItemId)?.quantity || 0) + change;
          if (newQuantity <= 0) {
              return currentItems.filter(i => i.menuItemId !== menuItemId);
          }
          return currentItems.map(i => i.menuItemId === menuItemId ? {...i, quantity: newQuantity} : i);
      });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isIdInvalid) return;
    if (!deal && !validateId(id)) return;
    if (items.length === 0) {
        toast({ variant: 'destructive', title: 'No Items in Deal', description: 'Please add at least one item to the deal.' });
        return;
    }
    
    const data = { name, description, price, imageUrl, items };
    if (deal) {
      onSave({ ...deal, ...data });
    } else {
      onSave(data, id);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {deal ? (
        <div>
          <Label htmlFor="deal-id">Deal Code</Label>
          <Input id="deal-id" value={deal.id} disabled />
        </div>
      ) : (
        <div>
          <Label htmlFor="deal-id">Deal Code</Label>
          <Input id="deal-id" value={id} onChange={e => { setId(e.target.value); setIsIdInvalid(false); }} onBlur={e => validateId(e.target.value)} required placeholder="e.g., D-00001" />
        </div>
      )}
      <div className={cn(deal ? '' : isIdInvalid && 'blur-out')}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <Label htmlFor="deal-name">Deal Name</Label>
            <Input id="deal-name" value={name} onChange={e => setName(e.target.value)} required disabled={!deal && isIdInvalid} />
          </div>
          <div>
            <Label htmlFor="deal-price">Total Price</Label>
            <Input id="deal-price" type="number" value={price} onChange={e => setPrice(Number(e.target.value))} required disabled={!deal && isIdInvalid} />
          </div>
        </div>
        <div className="mt-4">
          <Label htmlFor="deal-description">Description</Label>
          <Textarea id="deal-description" value={description} onChange={e => setDescription(e.target.value)} required disabled={!deal && isIdInvalid} />
        </div>
        
        <div className="mt-4">
          <Label>Included Items</Label>
            <ScrollArea className="h-40 rounded-md border p-4">
                {items.length === 0 && <p className="text-sm text-muted-foreground">No items added yet.</p>}
                <div className="space-y-2">
                    {items.map(dealItem => {
                        const menuItem = menu.items.find(i => i.id === dealItem.menuItemId);
                        if (!menuItem) return null;
                        return (
                            <div key={dealItem.menuItemId} className="flex items-center justify-between text-sm">
                                <span>{menuItem.name}</span>
                                <div className="flex items-center gap-2">
                                    <Button type="button" variant="outline" size="icon" className="h-6 w-6" onClick={() => handleItemQuantityChange(dealItem.menuItemId, -1)}><Minus className="h-3 w-3"/></Button>
                                    <span className="font-bold">{dealItem.quantity}</span>
                                    <Button type="button" variant="outline" size="icon" className="h-6 w-6" onClick={() => handleItemQuantityChange(dealItem.menuItemId, 1)}><Plus className="h-3 w-3"/></Button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </ScrollArea>
             <Popover open={isItemPopoverOpen} onOpenChange={setItemPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button type="button" variant="outline" className="w-full mt-2">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Item to Deal
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput placeholder="Search menu item..." />
                    <CommandEmpty>No item found.</CommandEmpty>
                    <CommandGroup>
                        <ScrollArea className="h-48">
                            {menu.items.map((item) => (
                                <CommandItem
                                key={item.id}
                                onSelect={() => handleItemSelect(item)}
                                >
                                {item.name}
                                </CommandItem>
                            ))}
                        </ScrollArea>
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
        </div>
        
        <div className="mt-4">
          <Label htmlFor="deal-image">Deal Image</Label>
          <Input id="deal-image" type="file" accept="image/*" onChange={handleImageChange} className="file:text-foreground" disabled={!deal && isIdInvalid} />
          {isCompressing && <p className="text-sm text-blue-500 mt-2">Compressing image...</p>}
          {imageUrl && !isCompressing && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Image Preview:</p>
              <Image src={imageUrl} alt="Image preview" width={100} height={100} className="rounded-md object-cover" />
            </div>
          )}
        </div>
      </div>
      <DialogFooter>
        <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
        <Button type="submit" disabled={isIdInvalid || items.length === 0}>Save Deal</Button>
      </DialogFooter>
    </form>
  );
}

export default function DealsManagementPage() {
  const { deals, isLoading, addDeal, updateDeal, deleteDeal } = useDeals();
  const { menu, isLoading: isMenuLoading } = useMenu();
  const { settings } = useSettings();
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | undefined>();

  const handleSaveDeal = (dealData: Omit<Deal, 'id'> | Deal, id?: string) => {
    if ('id' in dealData) {
      updateDeal(dealData as Deal);
    } else if (id) {
      addDeal({ id, ...dealData });
    }
    setDialogOpen(false);
  };
  
  const handleExport = (format: 'pdf' | 'csv') => {
    const title = "Deals List";
    const columns = [
      { key: 'id', label: 'Code' },
      { key: 'name', label: 'Name' },
      { key: 'price', label: 'Price (RS)' },
      { key: 'items', label: 'Included Items'},
    ];
    const data = deals.map(d => ({ 
        ...d, 
        price: Math.round(d.price),
        items: d.items.map(item => {
            const menuItem = menu.items.find(mi => mi.id === item.menuItemId);
            return `${item.quantity}x ${menuItem?.name || 'Unknown Item'}`;
        }).join(', '),
    }));
    const headerInfo = { companyName: settings.companyName, branchName: "All Branches" };
    exportListDataAs(format, data, columns, title, headerInfo);
  };

  if (isLoading || isMenuLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Loading Deals...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 lg:p-8 space-y-8">
      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle className="font-headline text-4xl font-bold">Deals & Discounts</CardTitle>
            <CardDescription>Create and manage promotional deals for the homepage carousel.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleExport('csv')}><FileDown className="mr-2 h-4 w-4" /> CSV</Button>
            <Button variant="outline" onClick={() => handleExport('pdf')}><FileText className="mr-2 h-4 w-4" /> PDF</Button>
            <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { setEditingDeal(undefined); setDialogOpen(true); }}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Deal
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingDeal ? 'Edit Deal' : 'Add New Deal'}</DialogTitle>
                  <DialogDescription>A deal is a bundle of menu items sold at a specific price.</DialogDescription>
                </DialogHeader>
                <DealForm deal={editingDeal} onSave={handleSaveDeal} />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Included Items & Station</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deals.map(deal => (
                <TableRow key={deal.id}>
                  <TableCell>
                    <Image src={deal.imageUrl} alt={deal.name} width={64} height={64} className="rounded-md object-cover" />
                  </TableCell>
                  <TableCell className="font-medium">{deal.name}</TableCell>
                  <TableCell className="font-mono text-xs">{deal.id}</TableCell>
                   <TableCell className="text-xs text-muted-foreground">
                       {deal.items.map(item => {
                           const menuItem = menu.items.find(mi => mi.id === item.menuItemId);
                           const category = menu.categories.find(c => c.id === menuItem?.categoryId);
                           const stationName = category?.stationId || 'Dispatch';
                           return (
                            <div key={item.menuItemId} className="flex items-center gap-2">
                                <span>{item.quantity}x {menuItem?.name || 'Unknown'}</span>
                                <span className="flex items-center gap-1 text-gray-500 capitalize">
                                    <ChefHat className="h-3 w-3" /> 
                                    ({stationName})
                                </span>
                            </div>
                           )
                       })}
                   </TableCell>
                  <TableCell className="text-right">RS {Math.round(deal.price)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => { setEditingDeal(deal); setDialogOpen(true); }}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <DeleteConfirmationDialog
                      title={`Delete Deal "${deal.name}"?`}
                      description={<>This action cannot be undone. This will permanently delete the deal <strong>{deal.name}</strong>.</>}
                      onConfirm={() => deleteDeal(deal.id, deal.name)}
                    />
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

    
