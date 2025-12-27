

"use client";

import { useState } from 'react';
import Image from 'next/image';
import { useMenu } from '@/context/MenuContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Edit, PlusCircle, FileText, FileDown } from 'lucide-react';
import type { MenuCategory, MenuItem, Addon } from '@/lib/types';
import imageCompression from 'browser-image-compression';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog';
import { useToast } from '@/hooks/use-toast';
import { useDeals } from '@/context/DealsContext';
import { cn } from '@/lib/utils';
import { exportListDataAs } from '@/lib/exporter';
import { useSettings } from '@/context/SettingsContext';


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

// Category Form
function CategoryForm({ category, onSave }: { category?: MenuCategory; onSave: (cat: Omit<MenuCategory, 'id'> | MenuCategory, id?: string) => void;}) {
  const [id, setId] = useState(category?.id || '');
  const [name, setName] = useState(category?.name || '');
  const [icon, setIcon] = useState(category?.icon || 'Package');
  const { menu } = useMenu();
  const { toast } = useToast();
  const [isIdInvalid, setIsIdInvalid] = useState(false);
  
  const validateId = (value: string) => {
    if (menu.categories.some(c => c.id === value && c.id !== category?.id)) {
        toast({
            variant: 'destructive',
            title: 'Duplicate Code',
            description: `The code "${value}" is already in use by another category.`,
        });
        setIsIdInvalid(true);
        return false;
    }
    setIsIdInvalid(false);
    return true;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isIdInvalid) return;
    
    if (!category && !validateId(id)) return;
    
    if (category) {
      onSave({ ...category, name, icon });
    } else {
      onSave({ name, icon }, id);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {category ? (
         <div>
          <Label htmlFor="category-id">Category Code</Label>
          <Input id="category-id" value={category.id} disabled />
        </div>
      ) : (
        <div>
          <Label htmlFor="category-id">Category Code</Label>
          <Input 
            id="category-id" 
            value={id} 
            onChange={(e) => { setId(e.target.value); setIsIdInvalid(false); }}
            onBlur={(e) => validateId(e.target.value)}
            required 
            placeholder="e.g., C-00001" 
          />
        </div>
      )}
      <div className={cn(category ? '' : isIdInvalid && 'blur-out')}>
        <div className="mt-4">
          <Label htmlFor="category-name">Category Name</Label>
          <Input id="category-name" value={name} onChange={(e) => setName(e.target.value)} required disabled={!category && isIdInvalid} />
        </div>
        <div className="mt-4">
          <Label htmlFor="category-icon">Icon Name</Label>
          <Input id="category-icon" value={icon} onChange={(e) => setIcon(e.target.value)} required disabled={!category && isIdInvalid} />
          <p className="text-sm text-muted-foreground mt-1">
            Use any valid icon name from <a href="https://lucide.dev/icons/" target="_blank" rel="noopener noreferrer" className="underline">Lucide icons</a>.
          </p>
        </div>
      </div>
      <DialogFooter>
        <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
        <Button type="submit" disabled={isIdInvalid}>Save Category</Button>
      </DialogFooter>
    </form>
  );
}

// Item Form
function ItemForm({ item, onSave }: { item?: MenuItem; onSave: (item: Omit<MenuItem, 'id'> | MenuItem, id?: string) => void; }) {
  const { menu } = useMenu();
  const { deals } = useDeals();
  const { toast } = useToast();
  const [id, setId] = useState(item?.id || '');
  const [name, setName] = useState(item?.name || '');
  const [description, setDescription] = useState(item?.description || '');
  const [price, setPrice] = useState(item?.price || 0);
  const [categoryId, setCategoryId] = useState(item?.categoryId || '');
  const [imageUrl, setImageUrl] = useState(item?.imageUrl || '');
  const [isCompressing, setIsCompressing] = useState(false);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>(item?.availableAddonIds || []);
  const [isIdInvalid, setIsIdInvalid] = useState(false);


  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompressing(true);
      const compressedDataUrl = await handleImageUpload(file);
      setImageUrl(compressedDataUrl);
      setIsCompressing(false);
    }
  };
  
  const handleAddonToggle = (addonId: string) => {
      setSelectedAddonIds(prev => prev.includes(addonId) ? prev.filter(id => id !== addonId) : [...prev, addonId]);
  }

  const validateId = (value: string) => {
    if (menu.items.some(item => item.id === value && item.id !== item?.id) || deals.some(deal => deal.id === value)) {
        toast({
            variant: 'destructive',
            title: 'Duplicate Code',
            description: `The code "${value}" is already in use by another item or deal.`,
        });
        setIsIdInvalid(true);
        return false;
    }
    setIsIdInvalid(false);
    return true;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isIdInvalid) return;
    
    if (!item && !validateId(id)) return; // Don't save if validation fails on create

    const data = { name, description, price, categoryId, imageUrl, availableAddonIds: selectedAddonIds };
    if (item) {
      onSave({ ...item, ...data });
    } else {
      onSave(data, id);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {item ? (
        <div>
          <Label htmlFor="item-id">Item Code</Label>
          <Input id="item-id" value={item.id} disabled />
        </div>
      ) : (
        <div>
          <Label htmlFor="item-id">Item Code</Label>
          <Input 
            id="item-id" 
            value={id} 
            onChange={(e) => { setId(e.target.value); setIsIdInvalid(false); }}
            onBlur={(e) => validateId(e.target.value)}
            required 
            placeholder="e.g., I-00001" 
          />
        </div>
      )}
      <div className={cn(item ? '' : isIdInvalid && 'blur-out')}>
        <div className="mt-4">
            <Label htmlFor="item-name">Item Name</Label>
            <Input id="item-name" value={name} onChange={(e) => setName(e.target.value)} required disabled={!item && isIdInvalid} />
        </div>
        <div className="mt-4">
            <Label htmlFor="item-description">Description</Label>
            <Textarea id="item-description" value={description} onChange={(e) => setDescription(e.target.value)} required disabled={!item && isIdInvalid} />
        </div>
        <div className="mt-4">
            <Label htmlFor="item-price">Base Price</Label>
            <Input id="item-price" type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} required disabled={!item && isIdInvalid} />
        </div>
        <div className="mt-4">
            <Label htmlFor="item-category">Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId} required disabled={!item && isIdInvalid}>
            <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
            <SelectContent>
                {menu.categories.map(cat => (<SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>))}
            </SelectContent>
            </Select>
        </div>
        <div className="mt-4">
            <Label>Available Add-ons</Label>
            <ScrollArea className="h-40 rounded-md border p-4">
                <div className="space-y-2">
                    {menu.addons.map(addon => (
                        <div key={addon.id} className="flex items-center space-x-2">
                            <Checkbox
                                id={`addon-${addon.id}`}
                                checked={selectedAddonIds.includes(addon.id)}
                                onCheckedChange={() => handleAddonToggle(addon.id)}
                                disabled={!item && isIdInvalid}
                            />
                            <Label htmlFor={`addon-${addon.id}`} className="font-normal flex-grow">{addon.name}</Label>
                            <span className="text-sm text-muted-foreground">+RS {Math.round(addon.price)}</span>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
        <div className="mt-4">
            <Label htmlFor="item-image">Item Image</Label>
            <Input id="item-image" type="file" accept="image/*" onChange={handleImageChange} className="file:text-foreground" disabled={!item && isIdInvalid}/>
            <p className="text-sm text-muted-foreground mt-1">It will be automatically compressed.</p>
            {isCompressing && <p className="text-sm text-blue-500 mt-2">Compressing...</p>}
            {imageUrl && !isCompressing && (
            <div className="mt-4"><p className="text-sm font-medium mb-2">Preview:</p><Image src={imageUrl} alt="Preview" width={100} height={100} className="rounded-md object-cover" /></div>
            )}
        </div>
      </div>
      <DialogFooter>
        <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
        <Button type="submit" disabled={isIdInvalid}>Save Item</Button>
      </DialogFooter>
    </form>
  );
}

// Addon Form
function AddonForm({ addon, onSave }: { addon?: Addon; onSave: (addon: Omit<Addon, 'id'> | Addon, id?: string) => void; }) {
    const [id, setId] = useState(addon?.id || '');
    const [name, setName] = useState(addon?.name || '');
    const [price, setPrice] = useState(addon?.price || 0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const data = { name, price };
        if (addon) {
          onSave({ ...addon, ...data });
        } else {
          onSave(data, id);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {addon ? (
              <div>
                <Label htmlFor="addon-id">Add-on Code</Label>
                <Input id="addon-id" value={addon.id} disabled />
              </div>
            ) : (
              <div>
                <Label htmlFor="addon-id">Add-on Code</Label>
                <Input id="addon-id" value={id} onChange={(e) => setId(e.target.value)} required placeholder="e.g., A-00001" />
              </div>
            )}
            <div><Label htmlFor="addon-name">Add-on Name</Label><Input id="addon-name" value={name} onChange={e => setName(e.target.value)} required /></div>
            <div><Label htmlFor="addon-price">Price</Label><Input id="addon-price" type="number" value={price} onChange={e => setPrice(Number(e.target.value))} required /></div>
            <DialogFooter><DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose><Button type="submit">Save</Button></DialogFooter>
        </form>
    );
}

// Main Page Component
export default function MenuManagementPage() {
  const { menu, isLoading, addCategory, updateCategory, deleteCategory, addItem, updateItem, deleteItem, addAddon, updateAddon, deleteAddon } = useMenu();
  const { settings } = useSettings();
  const [isCategoryOpen, setCategoryOpen] = useState(false);
  const [isItemOpen, setItemOpen] = useState(false);
  const [isAddonOpen, setAddonOpen] = useState(false);
  
  const [editingCategory, setEditingCategory] = useState<MenuCategory | undefined>();
  const [editingItem, setEditingItem] = useState<MenuItem | undefined>();
  const [editingAddon, setEditingAddon] = useState<Addon | undefined>();

  const handleSaveCategory = (categoryData: Omit<MenuCategory, 'id'> | MenuCategory, id?: string) => {
      if ('id' in categoryData) {
          updateCategory(categoryData as MenuCategory);
      } else if(id) {
          addCategory({ id, ...categoryData });
      }
      setCategoryOpen(false);
  }

  const handleSaveItem = (itemData: Omit<MenuItem, 'id'> | MenuItem, id?: string) => {
      if ('id' in itemData) {
          updateItem(itemData as MenuItem);
      } else if (id) {
          addItem({ id, ...itemData });
      }
      setItemOpen(false);
  }

  const handleSaveAddon = (addonData: Omit<Addon, 'id'> | Addon, id?: string) => {
      if ('id' in addonData) {
          updateAddon(addonData as Addon);
      } else if (id) {
          addAddon({ id, ...addonData });
      }
      setAddonOpen(false);
  }

  const handleExport = (list: 'categories' | 'addons' | 'items', format: 'pdf' | 'csv') => {
        let data: any[], columns: any[], title: string;
        const headerInfo = { companyName: settings.companyName, branchName: "All Branches" };

        switch (list) {
            case 'categories':
                title = "Menu Categories";
                columns = [{ key: 'id', label: 'Code' }, { key: 'name', label: 'Name' }];
                data = menu.categories;
                break;
            case 'addons':
                title = "Add-ons Library";
                columns = [{ key: 'id', label: 'Code' }, { key: 'name', label: 'Name' }, { key: 'price', label: 'Price (RS)' }];
                data = menu.addons.map(a => ({...a, price: Math.round(a.price)}));
                break;
            case 'items':
                title = "Menu Items";
                columns = [
                    { key: 'id', label: 'Code' }, 
                    { key: 'name', label: 'Name' }, 
                    { key: 'categoryName', label: 'Category' },
                    { key: 'price', label: 'Price (RS)' }
                ];
                data = menu.items.map(i => ({
                    ...i, 
                    price: Math.round(i.price),
                    categoryName: menu.categories.find(c => c.id === i.categoryId)?.name || 'N/A'
                }));
                break;
        }
        exportListDataAs(format, data, columns, title, headerInfo);
    };


  if (isLoading) return <div>Loading menu...</div>;

  return (
    <div className="container mx-auto p-4 lg:p-8 space-y-8">
        <header>
            <h1 className="font-headline text-4xl font-bold">Menu Management</h1>
            <p className="text-muted-foreground">Manage categories, items, and add-ons for your restaurant menu.</p>
        </header>

        {/* Categories */}
        <Card>
            <CardHeader className="flex-row justify-between items-center">
                <div><CardTitle>Menu Categories</CardTitle><CardDescription>High-level groups for your menu items.</CardDescription></div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => handleExport('categories', 'csv')}><FileDown className="mr-2 h-4 w-4" /> CSV</Button>
                    <Button variant="outline" onClick={() => handleExport('categories', 'pdf')}><FileText className="mr-2 h-4 w-4" /> PDF</Button>
                    <Dialog open={isCategoryOpen} onOpenChange={setCategoryOpen}><DialogTrigger asChild><Button onClick={() => { setEditingCategory(undefined); setCategoryOpen(true); }}><PlusCircle className="mr-2 h-4 w-4" /> Add Category</Button></DialogTrigger>
                        <DialogContent><DialogHeader><DialogTitle>{editingCategory ? 'Edit' : 'Add'} Category</DialogTitle></DialogHeader><CategoryForm category={editingCategory} onSave={handleSaveCategory}/></DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Code</TableHead><TableHead>Icon</TableHead><TableHead className="text-right w-[120px]">Actions</TableHead></TableRow></TableHeader>
                <TableBody>{menu.categories.map(cat => (<TableRow key={cat.id}><TableCell>{cat.name}</TableCell><TableCell className="font-mono text-xs">{cat.id}</TableCell><TableCell className="font-mono">{cat.icon}</TableCell>
                    <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => { setEditingCategory(cat); setCategoryOpen(true); }}><Edit className="h-4 w-4" /></Button>
                        <DeleteConfirmationDialog
                            title={`Delete Category "${cat.name}"?`}
                            description={<>This will delete the category and all associated items. This action is permanent.</>}
                            onConfirm={() => deleteCategory(cat.id, cat.name)}
                        />
                    </TableCell></TableRow>))}
                </TableBody></Table>
            </CardContent>
        </Card>

        {/* Addons */}
        <Card>
            <CardHeader className="flex-row justify-between items-center">
                <div><CardTitle>Add-ons Library</CardTitle><CardDescription>All available add-ons for your menu items.</CardDescription></div>
                 <div className="flex gap-2">
                    <Button variant="outline" onClick={() => handleExport('addons', 'csv')}><FileDown className="mr-2 h-4 w-4" /> CSV</Button>
                    <Button variant="outline" onClick={() => handleExport('addons', 'pdf')}><FileText className="mr-2 h-4 w-4" /> PDF</Button>
                    <Dialog open={isAddonOpen} onOpenChange={setAddonOpen}><DialogTrigger asChild><Button onClick={() => { setEditingAddon(undefined); setAddonOpen(true); }}><PlusCircle className="mr-2 h-4 w-4" /> Add Add-on</Button></DialogTrigger>
                        <DialogContent><DialogHeader><DialogTitle>{editingAddon ? 'Edit' : 'Add'} Add-on</DialogTitle></DialogHeader><AddonForm addon={editingAddon} onSave={handleSaveAddon}/></DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Code</TableHead><TableHead className="text-right">Price</TableHead><TableHead className="text-right w-[120px]">Actions</TableHead></TableRow></TableHeader>
                <TableBody>{menu.addons.map(addon => (<TableRow key={addon.id}><TableCell>{addon.name}</TableCell><TableCell className="font-mono text-xs">{addon.id}</TableCell><TableCell className="text-right">RS {Math.round(addon.price)}</TableCell>
                    <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => { setEditingAddon(addon); setAddonOpen(true); }}><Edit className="h-4 w-4" /></Button>
                        <DeleteConfirmationDialog
                            title={`Delete Add-on "${addon.name}"?`}
                            description={<>This will permanently delete the add-on <strong>{addon.name}</strong>.</>}
                            onConfirm={() => deleteAddon(addon.id, addon.name)}
                        />
                    </TableCell></TableRow>))}
                </TableBody></Table>
            </CardContent>
        </Card>

        {/* Items */}
        <Card>
            <CardHeader className="flex-row justify-between items-center">
                <div><CardTitle>Menu Items</CardTitle><CardDescription>The main dishes and products you offer.</CardDescription></div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => handleExport('items', 'csv')}><FileDown className="mr-2 h-4 w-4" /> CSV</Button>
                    <Button variant="outline" onClick={() => handleExport('items', 'pdf')}><FileText className="mr-2 h-4 w-4" /> PDF</Button>
                    <Dialog open={isItemOpen} onOpenChange={setItemOpen}><DialogTrigger asChild><Button onClick={() => { setEditingItem(undefined); setItemOpen(true); }}><PlusCircle className="mr-2 h-4 w-4" /> Add Item</Button></DialogTrigger>
                        <DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{editingItem ? 'Edit' : 'Add'} Item</DialogTitle></DialogHeader><ItemForm item={editingItem} onSave={handleSaveItem}/></DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Code</TableHead><TableHead>Category</TableHead><TableHead className="text-right">Price</TableHead><TableHead className="text-right w-[120px]">Actions</TableHead></TableRow></TableHeader>
                <TableBody>{menu.items.map(item => (<TableRow key={item.id}><TableCell>{item.name}</TableCell><TableCell className="font-mono text-xs">{item.id}</TableCell><TableCell>{menu.categories.find(c => c.id === item.categoryId)?.name || 'N/A'}</TableCell><TableCell className="text-right">RS {Math.round(item.price)}</TableCell>
                    <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => { setEditingItem(item); setItemOpen(true); }}><Edit className="h-4 w-4" /></Button>
                        <DeleteConfirmationDialog
                            title={`Delete Item "${item.name}"?`}
                            description={<>This will permanently delete the item <strong>{item.name}</strong>.</>}
                            onConfirm={() => deleteItem(item.id, item.name)}
                        />
                    </TableCell></TableRow>))}
                </TableBody></Table>
            </CardContent>
        </Card>
    </div>
  );
}
