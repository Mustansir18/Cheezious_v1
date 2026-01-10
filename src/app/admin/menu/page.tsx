

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
  DialogDescription
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Edit, PlusCircle, FileText, FileDown, ChefHat, Package, Minus, Plus } from 'lucide-react';
import type { MenuCategory, MenuItem, Addon, KitchenStation, SubCategory, MenuItemVariant, DealItem } from '@/lib/types';
import imageCompression from 'browser-image-compression';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { exportListDataAs } from '@/lib/exporter';
import { useSettings } from '@/context/SettingsContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';


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

const kitchenStations: { id: KitchenStation; name: string }[] = [
    { id: 'pizza', name: 'Pizza' },
    { id: 'pasta', name: 'Pasta' },
    { id: 'fried', name: 'Fried' },
    { id: 'bar', name: 'Bar' },
];

// Category Form
function CategoryForm({ category, onSave }: { category?: MenuCategory; onSave: (cat: Omit<MenuCategory, 'id'> | MenuCategory, id?: string) => void;}) {
  const { menu, addSubCategory, deleteSubCategory } = useMenu();
  const { toast } = useToast();
  
  const [id, setId] = useState(category?.id || '');
  const [name, setName] = useState(category?.name || '');
  const [icon, setIcon] = useState(category?.icon || 'Package');
  const [stationId, setStationId] = useState<KitchenStation | undefined>(category?.stationId);
  const [isIdInvalid, setIsIdInvalid] = useState(false);
  
  const [newSubCategoryName, setNewSubCategoryName] = useState('');

  const currentCategoryState = menu.categories.find(c => c.id === category?.id) || category;

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

  const handleAddSubCategory = () => {
    if (newSubCategoryName.trim() && category?.id) {
        addSubCategory(category.id, newSubCategoryName.trim());
        setNewSubCategoryName('');
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isIdInvalid) return;
    
    if (!category && !validateId(id)) return;
    
    const subCategories = currentCategoryState?.subCategories || [];
    const data = { name, icon, stationId, subCategories };

    if (category) {
      onSave({ ...category, ...data });
    } else {
      onSave(data, id);
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
        <div className="mt-4">
            <Label htmlFor="item-station">Kitchen Station</Label>
            <Select value={stationId} onValueChange={(v) => setStationId(v === 'none' ? undefined : (v as KitchenStation))} disabled={!category && isIdInvalid}>
            <SelectTrigger>
                <SelectValue placeholder="Assign to a station" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="none">None (Dispatch Only)</SelectItem>
                {kitchenStations.map(s => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}
            </SelectContent>
            </Select>
        </div>

        {category && (
            <div className="mt-4">
                <Label>Sub-Categories</Label>
                <ScrollArea className="h-40 rounded-md border p-4">
                    <div className="space-y-2">
                        {currentCategoryState?.subCategories?.map(sc => (
                            <div key={sc.id} className="flex items-center justify-between">
                                <span>{sc.name}</span>
                                <DeleteConfirmationDialog
                                    title={`Delete Sub-Category "${sc.name}"?`}
                                    description={<>This will permanently delete the sub-category. Items inside will become unassigned.</>}
                                    onConfirm={() => deleteSubCategory(category.id, sc.id)}
                                />
                            </div>
                        ))}
                         {(!currentCategoryState?.subCategories || currentCategoryState.subCategories.length === 0) && <p className="text-xs text-muted-foreground">No sub-categories yet.</p>}
                    </div>
                </ScrollArea>
                <div className="mt-2 flex gap-2">
                    <Input placeholder="New Sub-Category Name" value={newSubCategoryName} onChange={e => setNewSubCategoryName(e.target.value)} />
                    <Button type="button" variant="secondary" onClick={handleAddSubCategory}>Add</Button>
                </div>
            </div>
        )}
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
  const { toast } = useToast();
  const [id, setId] = useState(item?.id || '');
  const [name, setName] = useState(item?.name || '');
  const [description, setDescription] = useState(item?.description || '');
  const [price, setPrice] = useState(item?.price || 0);
  const [categoryId, setCategoryId] = useState(item?.categoryId || '');
  const [subCategoryId, setSubCategoryId] = useState(item?.subCategoryId || '');
  const [imageUrl, setImageUrl] = useState(item?.imageUrl || '');
  const [isCompressing, setIsCompressing] = useState(false);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>(item?.availableAddonIds || []);
  const [variants, setVariants] = useState<MenuItemVariant[]>(item?.variants || []);
  const [isIdInvalid, setIsIdInvalid] = useState(false);
  
  const selectedCategory = menu.categories.find(c => c.id === categoryId);

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
    if (menu.items.some(i => i.id === value && i.id !== item?.id)) {
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
  
  const handleVariantChange = (index: number, field: 'name' | 'price', value: string | number) => {
    setVariants(currentVariants => {
        const newVariants = [...currentVariants];
        const updatedVariant = { ...newVariants[index], [field]: value };
        newVariants[index] = updatedVariant;
        return newVariants;
    });
  };
  
  const addVariant = () => {
    setVariants([...variants, { id: crypto.randomUUID(), name: '', price: 0 }]);
  };
  
  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isIdInvalid) return;
    
    if (!item && !validateId(id)) return; // Don't save if validation fails on create

    const finalPrice = variants.length > 0 ? 0 : price;

    const data = { name, description, price: finalPrice, categoryId, subCategoryId, imageUrl, availableAddonIds: selectedAddonIds, variants };
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
                <Label htmlFor="item-name">Item Name</Label>
                <Input id="item-name" value={name} onChange={(e) => setName(e.target.value)} required disabled={!item && isIdInvalid} />
            </div>
             <div>
                <Label htmlFor="item-price">Base Price</Label>
                <Input id="item-price" type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} required disabled={!item && isIdInvalid || variants.length > 0} />
                {variants.length > 0 && <p className="text-xs text-muted-foreground mt-1">Price is controlled by variants.</p>}
            </div>
        </div>
        <div className="mt-4">
            <Label htmlFor="item-description">Description</Label>
            <Textarea id="item-description" value={description} onChange={(e) => setDescription(e.target.value)} required disabled={!item && isIdInvalid} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
                <Label htmlFor="item-category">Category</Label>
                <Select value={categoryId} onValueChange={(v) => { setCategoryId(v); setSubCategoryId(''); }} required disabled={!item && isIdInvalid}>
                <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                <SelectContent>
                    {menu.categories.map(cat => (<SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>))}
                </SelectContent>
                </Select>
            </div>
            <div>
                <Label htmlFor="item-subcategory">Sub-Category</Label>
                <Select value={subCategoryId} onValueChange={setSubCategoryId} disabled={!item && isIdInvalid || !selectedCategory || !selectedCategory.subCategories || selectedCategory.subCategories.length === 0}>
                <SelectTrigger><SelectValue placeholder="Select a sub-category" /></SelectTrigger>
                <SelectContent>
                    {selectedCategory?.subCategories?.map(sub => (<SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>))}
                </SelectContent>
                </Select>
            </div>
        </div>
        
        <div className="mt-4">
            <Label>Manage Variants (Sizes)</Label>
            <div className="p-4 border rounded-lg bg-muted/50 space-y-3">
                {variants.map((variant, index) => (
                    <div key={index} className="grid grid-cols-3 gap-2 items-center">
                        <Input placeholder="Variant Name (e.g., Small)" value={variant.name} onChange={e => handleVariantChange(index, 'name', e.target.value)} />
                        <Input type="number" placeholder="Price" value={variant.price} onChange={e => handleVariantChange(index, 'price', Number(e.target.value))} />
                        <DeleteConfirmationDialog
                            title={`Delete Variant "${variant.name || 'Untitled'}"?`}
                            description={<>This will permanently delete this size variant from the item.</>}
                            onConfirm={() => removeVariant(index)}
                            triggerButton={
                                <Button type="button" variant="destructive" size="sm">
                                    <Trash2 className="mr-2 h-4 w-4" /> Remove
                                </Button>
                            }
                        />
                    </div>
                ))}
                <Button type="button" variant="secondary" className="w-full" onClick={addVariant}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Variant
                </Button>
            </div>
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
                            <span className="text-sm text-muted-foreground mr-2">+RS {Math.round(addon.price || 0)}</span>
                             <DeleteConfirmationDialog
                                title={`Delete Add-on "${addon.name}"?`}
                                description={<>This will permanently delete the add-on <strong>{addon.name}</strong> from the library and remove it from all items.</>}
                                onConfirm={() => deleteAddon(addon.id, addon.name)}
                                triggerButton={
                                    <Button variant="ghost" size="icon" className="h-6 w-6">
                                        <Trash2 className="h-3 w-3 text-destructive" />
                                    </Button>
                                }
                            />
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
    const { menu } = useMenu();
    const { toast } = useToast();
    const [id, setId] = useState(addon?.id || '');
    const [name, setName] = useState(addon?.name || '');
    const [price, setPrice] = useState(addon?.price || 0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!addon && menu.addons.some(a => a.id === id)) {
            toast({ variant: 'destructive', title: 'Error', description: `An add-on with the code '${id}' already exists.` });
            return;
        }
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

// KIT Item Form
function KitForm({
  kit,
  onSave,
}: {
  kit?: MenuItem;
  onSave: (kitData: Omit<MenuItem, 'id'> | MenuItem, id?: string) => void;
}) {
  const [id, setId] = useState(kit?.id || '');
  const [name, setName] = useState(kit?.name || '');
  const [description, setDescription] = useState(kit?.description || '');
  const [price, setPrice] = useState(kit?.price || 0);
  const [imageUrl, setImageUrl] = useState(kit?.imageUrl || '');
  const [items, setItems] = useState<DealItem[]>(kit?.dealItems || []);
  const [isCompressing, setIsCompressing] = useState(false);
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
    if (menu.items.some(d => d.id === value && d.id !== kit?.id)) {
      toast({
        variant: 'destructive',
        title: 'Duplicate Code',
        description: `The code "${value}" is already in use by another item.`,
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
    if (!kit && !validateId(id)) return;
    if (items.length === 0) {
        toast({ variant: 'destructive', title: 'No Items in Kit', description: 'Please add at least one item to the kit.' });
        return;
    }
    
    const data = { 
        name, 
        description, 
        price, 
        imageUrl, 
        dealItems: items,
        categoryId: 'C-KIT-01',
        subCategoryId: 'SC-KIT-01',
    };
    if (kit) {
      onSave({ ...kit, ...data });
    } else {
      onSave(data, id);
    }
  };

  const availableItems = menu.items.filter(item => item.categoryId !== 'C-00001' && item.categoryId !== 'C-KIT-01');

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {kit ? (
        <div>
          <Label htmlFor="kit-id">Kit Code</Label>
          <Input id="kit-id" value={kit.id} disabled />
        </div>
      ) : (
        <div>
          <Label htmlFor="kit-id">Kit Code</Label>
          <Input id="kit-id" value={id} onChange={e => { setId(e.target.value); setIsIdInvalid(false); }} onBlur={e => validateId(e.target.value)} required placeholder="e.g., K-00001" />
        </div>
      )}
      <div className={cn(kit ? '' : isIdInvalid && 'blur-out')}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <Label htmlFor="kit-name">Kit Name</Label>
            <Input id="kit-name" value={name} onChange={e => setName(e.target.value)} required disabled={!kit && isIdInvalid} />
          </div>
          <div>
            <Label htmlFor="kit-price">Total Price</Label>
            <Input id="kit-price" type="number" value={price} onChange={e => setPrice(Number(e.target.value))} required disabled={!kit && isIdInvalid} />
          </div>
        </div>
        <div className="mt-4">
          <Label htmlFor="kit-description">Description</Label>
          <Textarea id="kit-description" value={description} onChange={e => setDescription(e.target.value)} required disabled={!kit && isIdInvalid} />
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
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Item to Kit
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput placeholder="Search menu item..." />
                    <CommandEmpty>No item found.</CommandEmpty>
                    <CommandGroup>
                        <ScrollArea className="h-48">
                            {availableItems.map((item) => (
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
          <Label htmlFor="kit-image">Kit Image</Label>
          <Input id="kit-image" type="file" accept="image/*" onChange={handleImageChange} className="file:text-foreground" disabled={!kit && isIdInvalid} />
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
        <Button type="submit" disabled={isIdInvalid || items.length === 0}>Save Kit</Button>
      </DialogFooter>
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
  const [isKitOpen, setKitOpen] = useState(false);
  
  const [editingCategory, setEditingCategory] = useState<MenuCategory | undefined>();
  const [editingItem, setEditingItem] = useState<MenuItem | undefined>();
  const [editingAddon, setEditingAddon] = useState<Addon | undefined>();
  const [editingKit, setEditingKit] = useState<MenuItem | undefined>();

  const kitItems = menu.items.filter(item => item.categoryId === 'C-KIT-01');

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
          addItem({ id, ...itemData } as MenuItem);
      }
      setItemOpen(false);
  }
  
  const handleSaveKit = (kitData: Omit<MenuItem, 'id'> | MenuItem, id?: string) => {
    if ('id' in kitData) {
      updateItem(kitData as MenuItem);
    } else if (id) {
      addItem({ id, ...kitData } as MenuItem);
    }
    setKitOpen(false);
  };

  const handleSaveAddon = (addonData: Omit<Addon, 'id'> | Addon, id?: string) => {
      if ('id' in addonData) {
          updateAddon(addonData as Addon);
      } else if (id) {
          addAddon({ id, ...addonData });
      }
      setAddonOpen(false);
  }

  const handleExport = (list: 'categories' | 'addons' | 'items' | 'kits', format: 'pdf' | 'csv') => {
        let data: any[], columns: any[], title: string;
        const headerInfo = { companyName: settings.companyName, branchName: "All Branches" };

        switch (list) {
            case 'categories':
                title = "Menu Categories";
                columns = [
                    { key: 'id', label: 'Code' },
                    { key: 'name', label: 'Name' },
                    { key: 'stationName', label: 'Kitchen Station' },
                ];
                data = menu.categories.map(c => ({
                    ...c,
                    stationName: kitchenStations.find(s => s.id === c.stationId)?.name || 'None',
                }));
                break;
            case 'addons':
                title = "Add-ons Library";
                columns = [{ key: 'id', label: 'Code' }, { key: 'name', label: 'Name' }, { key: 'price', label: 'Price (RS)' }];
                data = menu.addons.map(a => ({...a, price: Math.round(a.price || 0)}));
                break;
            case 'items':
                title = "Menu Items";
                columns = [
                    { key: 'id', label: 'Code' }, 
                    { key: 'name', label: 'Name' }, 
                    { key: 'categoryName', label: 'Category' },
                    { key: 'price', label: 'Price (RS)' },
                ];
                data = menu.items.map(i => ({
                    ...i, 
                    price: Math.round(i.price),
                    categoryName: menu.categories.find(c => c.id === i.categoryId)?.name || 'N/A',
                }));
                break;
            case 'kits':
                title = "KIT Items";
                columns = [
                  { key: 'id', label: 'Code' },
                  { key: 'name', label: 'Name' },
                  { key: 'price', label: 'Price (RS)' },
                  { key: 'items', label: 'Included Items'},
                ];
                data = kitItems.map(d => ({ 
                    ...d, 
                    price: Math.round(d.price),
                    items: d.dealItems?.map(item => {
                        const menuItem = menu.items.find(mi => mi.id === item.menuItemId);
                        return `${item.quantity}x ${menuItem?.name || 'Unknown Item'}`;
                    }).join(', '),
                }));
                break;
        }
        exportListDataAs(format, data, columns, title, headerInfo);
    };


  if (isLoading) return <div>Loading menu...</div>;

  return (
    <div className="w-full">
        <header className="mb-8">
            <h1 className="font-headline text-4xl font-bold">Menu Management</h1>
            <p className="text-muted-foreground">Manage categories, items, and add-ons for your restaurant menu.</p>
        </header>

        <Tabs defaultValue="items" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="items">Menu Items</TabsTrigger>
                <TabsTrigger value="kits">KIT Items</TabsTrigger>
                <TabsTrigger value="categories">Categories</TabsTrigger>
                <TabsTrigger value="addons">Add-ons</TabsTrigger>
            </TabsList>
            
            <TabsContent value="categories" className="mt-6">
                 <Card>
                    <CardHeader className="flex-row justify-between items-center">
                        <div><CardTitle>Menu Categories</CardTitle><CardDescription>High-level groups for your menu items.</CardDescription></div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => handleExport('categories', 'csv')}><FileDown className="mr-2 h-4 w-4" /> CSV</Button>
                            <Button variant="outline" onClick={() => handleExport('categories', 'pdf')}><FileText className="mr-2 h-4 w-4" /> PDF</Button>
                            <Dialog open={isCategoryOpen} onOpenChange={setCategoryOpen}><DialogTrigger asChild><Button onClick={() => { setEditingCategory(undefined); setCategoryOpen(true); }}><PlusCircle className="mr-2 h-4 w-4" /> Add Category</Button></DialogTrigger>
                                <DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{editingCategory ? 'Edit' : 'Add'} Category</DialogTitle></DialogHeader><CategoryForm category={editingCategory} onSave={handleSaveCategory}/></DialogContent>
                            </Dialog>
                        </div>
                    </CardHeader>
                    <CardContent><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Code</TableHead><TableHead>Sub-Categories</TableHead><TableHead>Station</TableHead><TableHead className="text-right w-[120px]">Actions</TableHead></TableRow></TableHeader>
                        <TableBody>{menu.categories.map(cat => (<TableRow key={cat.id}><TableCell>{cat.name}</TableCell><TableCell className="font-mono text-xs">{cat.id}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                                {cat.subCategories?.map(sc => sc.name).join(', ') || 'N/A'}
                            </TableCell>
                            <TableCell>
                                {cat.stationId ? (
                                     <span className="flex items-center gap-1.5 capitalize">
                                        <ChefHat className="h-4 w-4 text-muted-foreground" />
                                        {cat.stationId}
                                     </span>
                                ) : 'N/A'}
                            </TableCell>
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
            </TabsContent>

            <TabsContent value="addons" className="mt-6">
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
                        <TableBody>{menu.addons.map(addon => (<TableRow key={addon.id}><TableCell>{addon.name}</TableCell><TableCell className="font-mono text-xs">{addon.id}</TableCell><TableCell className="text-right">RS {Math.round(addon.price || 0)}</TableCell>
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
            </TabsContent>
            
            <TabsContent value="kits" className="mt-6">
                <Card>
                  <CardHeader className="flex flex-row justify-between items-center">
                    <div>
                      <CardTitle className="font-headline text-4xl font-bold">KIT Items</CardTitle>
                      <CardDescription>Create and manage bundled products.</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => handleExport('kits', 'csv')}><FileDown className="mr-2 h-4 w-4" /> CSV</Button>
                      <Button variant="outline" onClick={() => handleExport('kits', 'pdf')}><FileText className="mr-2 h-4 w-4" /> PDF</Button>
                      <Dialog open={isKitOpen} onOpenChange={setKitOpen}>
                        <DialogTrigger asChild>
                          <Button onClick={() => { setEditingKit(undefined); setKitOpen(true); }}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add KIT Item
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>{editingKit ? 'Edit KIT Item' : 'Add New KIT Item'}</DialogTitle>
                            <DialogDescription>A KIT Item is a bundle of menu items sold at a specific price.</DialogDescription>
                          </DialogHeader>
                          <KitForm kit={editingKit} onSave={handleSaveKit} />
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
                          <TableHead>Included Items</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                          <TableHead className="text-right w-[120px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {kitItems.map(kit => (
                          <TableRow key={kit.id}>
                            <TableCell>
                              <Image src={kit.imageUrl} alt={kit.name} width={64} height={64} className="rounded-md object-cover" />
                            </TableCell>
                            <TableCell className="font-medium">{kit.name}</TableCell>
                            <TableCell className="font-mono text-xs">{kit.id}</TableCell>
                             <TableCell className="text-xs text-muted-foreground">
                                 <div className="flex flex-col gap-1">
                                     {kit.dealItems?.map(item => {
                                         const menuItem = menu.items.find(mi => mi.id === item.menuItemId);
                                         return (
                                          <div key={item.menuItemId} className="flex items-center gap-2">
                                              <span>{item.quantity}x {menuItem?.name || 'Unknown'}</span>
                                          </div>
                                         )
                                     })}
                                 </div>
                             </TableCell>
                            <TableCell className="text-right">RS {Math.round(kit.price)}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" onClick={() => { setEditingKit(kit); setKitOpen(true); }}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <DeleteConfirmationDialog
                                title={`Delete KIT Item "${kit.name}"?`}
                                description={<>This action cannot be undone. This will permanently delete the KIT item <strong>{kit.name}</strong>.</>}
                                onConfirm={() => deleteItem(kit.id, kit.name)}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="items" className="mt-6">
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
                    <CardContent><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Code</TableHead><TableHead>Category</TableHead><TableHead>Sub-Category</TableHead><TableHead className="text-right">Price</TableHead><TableHead className="text-right w-[120px]">Actions</TableHead></TableRow></TableHeader>
                        <TableBody>{menu.items.filter(i => i.categoryId !== 'C-00001' && i.categoryId !== 'C-KIT-01').map(item => {
                            const category = menu.categories.find(c => c.id === item.categoryId);
                            const subCategory = category?.subCategories?.find(sc => sc.id === item.subCategoryId);
                            return (
                                <TableRow key={item.id}>
                                    <TableCell>{item.name}</TableCell>
                                    <TableCell className="font-mono text-xs">{item.id}</TableCell>
                                    <TableCell>{category?.name || 'N/A'}</TableCell>
                                    <TableCell>{subCategory?.name || 'N/A'}</TableCell>
                                    <TableCell className="text-right">RS {Math.round(item.price)}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => { setEditingItem(item); setItemOpen(true); }}><Edit className="h-4 w-4" /></Button>
                                        <DeleteConfirmationDialog
                                            title={`Delete Item "${item.name}"?`}
                                            description={<>This will permanently delete the item <strong>{item.name}</strong>.</>}
                                            onConfirm={() => deleteItem(item.id, item.name)}
                                        />
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                        </TableBody></Table>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    </div>
  );
}

    
