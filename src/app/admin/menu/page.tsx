
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Edit, PlusCircle } from 'lucide-react';
import type { MenuCategory, MenuItem, Addon, AddonCategory } from '@/lib/types';
import imageCompression from 'browser-image-compression';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

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
function CategoryForm({ category, onSave }: { category?: MenuCategory; onSave: (cat: Omit<MenuCategory, 'id'> | MenuCategory) => void;}) {
  const [name, setName] = useState(category?.name || '');
  const [icon, setIcon] = useState(category?.icon || 'Package');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (category) {
      onSave({ ...category, name, icon });
    } else {
      onSave({ name, icon });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="category-name">Category Name</Label>
        <Input id="category-name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="category-icon">Icon Name</Label>
        <Input id="category-icon" value={icon} onChange={(e) => setIcon(e.target.value)} required />
        <p className="text-sm text-muted-foreground mt-1">
          Use any valid icon name from <a href="https://lucide.dev/icons/" target="_blank" rel="noopener noreferrer" className="underline">Lucide icons</a>.
        </p>
      </div>
      <DialogFooter>
        <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
        <Button type="submit">Save Category</Button>
      </DialogFooter>
    </form>
  );
}

// Item Form
function ItemForm({ item, onSave }: { item?: MenuItem; onSave: (item: Omit<MenuItem, 'id'> | MenuItem) => void; }) {
  const { menu } = useMenu();
  const [name, setName] = useState(item?.name || '');
  const [description, setDescription] = useState(item?.description || '');
  const [price, setPrice] = useState(item?.price || 0);
  const [categoryId, setCategoryId] = useState(item?.categoryId || '');
  const [imageUrl, setImageUrl] = useState(item?.imageUrl || '');
  const [isCompressing, setIsCompressing] = useState(false);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>(item?.availableAddonIds || []);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { name, description, price, categoryId, imageUrl, availableAddonIds: selectedAddonIds };
    if (item) {
      onSave({ ...item, ...data });
    } else {
      onSave(data);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="item-name">Item Name</Label>
        <Input id="item-name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="item-description">Description</Label>
        <Textarea id="item-description" value={description} onChange={(e) => setDescription(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="item-price">Base Price</Label>
        <Input id="item-price" type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} required />
      </div>
      <div>
        <Label htmlFor="item-category">Category</Label>
        <Select value={categoryId} onValueChange={setCategoryId} required>
          <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
          <SelectContent>
            {menu.categories.map(cat => (<SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Available Add-ons</Label>
        <ScrollArea className="h-40 rounded-md border p-4">
            {menu.addonCategories.map(cat => (
                <div key={cat.id} className="mb-4">
                    <p className="font-semibold mb-2">{cat.name}</p>
                    <div className="space-y-2">
                        {menu.addons.filter(a => a.addonCategoryId === cat.id).map(addon => (
                            <div key={addon.id} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`addon-${addon.id}`}
                                    checked={selectedAddonIds.includes(addon.id)}
                                    onCheckedChange={() => handleAddonToggle(addon.id)}
                                />
                                <Label htmlFor={`addon-${addon.id}`} className="font-normal flex-grow">{addon.name}</Label>
                                <span className="text-sm text-muted-foreground">+RS {addon.price}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </ScrollArea>
      </div>
      <div>
        <Label htmlFor="item-image">Item Image</Label>
        <Input id="item-image" type="file" accept="image/*" onChange={handleImageChange} className="file:text-foreground"/>
        <p className="text-sm text-muted-foreground mt-1">It will be automatically compressed.</p>
        {isCompressing && <p className="text-sm text-blue-500 mt-2">Compressing...</p>}
        {imageUrl && !isCompressing && (
          <div className="mt-4"><p className="text-sm font-medium mb-2">Preview:</p><Image src={imageUrl} alt="Preview" width={100} height={100} className="rounded-md object-cover" /></div>
        )}
      </div>
      <DialogFooter>
        <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
        <Button type="submit">Save Item</Button>
      </DialogFooter>
    </form>
  );
}

// Addon Category Form
function AddonCategoryForm({ category, onSave }: { category?: AddonCategory; onSave: (cat: Omit<AddonCategory, 'id'> | AddonCategory) => void; }) {
    const [name, setName] = useState(category?.name || '');
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(category ? { ...category, name } : { name });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label htmlFor="addon-cat-name">Category Name</Label><Input id="addon-cat-name" value={name} onChange={e => setName(e.target.value)} required /></div>
            <DialogFooter><DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose><Button type="submit">Save</Button></DialogFooter>
        </form>
    );
}

// Addon Form
function AddonForm({ addon, onSave }: { addon?: Addon; onSave: (addon: Omit<Addon, 'id'> | Addon) => void; }) {
    const { menu } = useMenu();
    const [name, setName] = useState(addon?.name || '');
    const [price, setPrice] = useState(addon?.price || 0);
    const [addonCategoryId, setAddonCategoryId] = useState(addon?.addonCategoryId || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const data = { name, price, addonCategoryId };
        onSave(addon ? { ...addon, ...data } : data);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label htmlFor="addon-name">Add-on Name</Label><Input id="addon-name" value={name} onChange={e => setName(e.target.value)} required /></div>
            <div><Label htmlFor="addon-price">Price</Label><Input id="addon-price" type="number" value={price} onChange={e => setPrice(Number(e.target.value))} required /></div>
            <div>
                <Label htmlFor="addon-category-select">Category</Label>
                <Select value={addonCategoryId} onValueChange={setAddonCategoryId} required>
                    <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                    <SelectContent>{menu.addonCategories.map(cat => (<SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>))}</SelectContent>
                </Select>
            </div>
            <DialogFooter><DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose><Button type="submit">Save</Button></DialogFooter>
        </form>
    );
}

// Main Page Component
export default function MenuManagementPage() {
  const { menu, isLoading, addCategory, updateCategory, deleteCategory, addItem, updateItem, deleteItem, addAddon, updateAddon, deleteAddon, addAddonCategory, updateAddonCategory, deleteAddonCategory } = useMenu();
  const [isCategoryOpen, setCategoryOpen] = useState(false);
  const [isItemOpen, setItemOpen] = useState(false);
  const [isAddonOpen, setAddonOpen] = useState(false);
  const [isAddonCatOpen, setAddonCatOpen] = useState(false);
  
  const [editingCategory, setEditingCategory] = useState<MenuCategory | undefined>();
  const [editingItem, setEditingItem] = useState<MenuItem | undefined>();
  const [editingAddon, setEditingAddon] = useState<Addon | undefined>();
  const [editingAddonCat, setEditingAddonCat] = useState<AddonCategory | undefined>();

  const handleSave = (setter: (val: boolean) => void, saveFn: (data: any) => void) => (data: any) => {
    saveFn(data);
    setter(false);
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
                <Dialog open={isCategoryOpen} onOpenChange={setCategoryOpen}><DialogTrigger asChild><Button onClick={() => setEditingCategory(undefined)}><PlusCircle/> Add Category</Button></DialogTrigger>
                    <DialogContent><DialogHeader><DialogTitle>{editingCategory ? 'Edit' : 'Add'} Category</DialogTitle></DialogHeader><CategoryForm category={editingCategory} onSave={handleSave(setCategoryOpen, editingCategory ? updateCategory : addCategory)}/></DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Icon</TableHead><TableHead className="text-right w-[120px]">Actions</TableHead></TableRow></TableHeader>
                <TableBody>{menu.categories.map(cat => (<TableRow key={cat.id}><TableCell>{cat.name}</TableCell><TableCell className="font-mono">{cat.icon}</TableCell>
                    <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => { setEditingCategory(cat); setCategoryOpen(true); }}><Edit/></Button>
                        <AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="text-destructive"/></Button></AlertDialogTrigger>
                            <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will delete the category "{cat.name}" and all associated items.</AlertDialogDescription></AlertDialogHeader>
                                <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteCategory(cat.id, cat.name)}>Delete</AlertDialogAction></AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </TableCell></TableRow>))}
                </TableBody></Table>
            </CardContent>
        </Card>

        {/* Addon Categories */}
        <Card>
            <CardHeader className="flex-row justify-between items-center">
                <div><CardTitle>Add-on Categories</CardTitle><CardDescription>Groups for add-ons (e.g., "Sauces", "Extra Toppings").</CardDescription></div>
                <Dialog open={isAddonCatOpen} onOpenChange={setAddonCatOpen}><DialogTrigger asChild><Button onClick={() => setEditingAddonCat(undefined)}><PlusCircle/> Add Category</Button></DialogTrigger>
                    <DialogContent><DialogHeader><DialogTitle>{editingAddonCat ? 'Edit' : 'Add'} Add-on Category</DialogTitle></DialogHeader><AddonCategoryForm category={editingAddonCat} onSave={handleSave(setAddonCatOpen, editingAddonCat ? updateAddonCategory : addAddonCategory)}/></DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead className="text-right w-[120px]">Actions</TableHead></TableRow></TableHeader>
                <TableBody>{menu.addonCategories.map(cat => (<TableRow key={cat.id}><TableCell>{cat.name}</TableCell>
                    <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => { setEditingAddonCat(cat); setAddonCatOpen(true); }}><Edit/></Button>
                        <AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="text-destructive"/></Button></AlertDialogTrigger>
                            <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will delete the add-on category "{cat.name}" and all associated add-ons.</AlertDialogDescription></AlertDialogHeader>
                                <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteAddonCategory(cat.id, cat.name)}>Delete</AlertDialogAction></AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </TableCell></TableRow>))}
                </TableBody></Table>
            </CardContent>
        </Card>

        {/* Addons */}
        <Card>
            <CardHeader className="flex-row justify-between items-center">
                <div><CardTitle>Add-ons Library</CardTitle><CardDescription>All available add-ons for your menu items.</CardDescription></div>
                <Dialog open={isAddonOpen} onOpenChange={setAddonOpen}><DialogTrigger asChild><Button onClick={() => setEditingAddon(undefined)}><PlusCircle/> Add Add-on</Button></DialogTrigger>
                    <DialogContent><DialogHeader><DialogTitle>{editingAddon ? 'Edit' : 'Add'} Add-on</DialogTitle></DialogHeader><AddonForm addon={editingAddon} onSave={handleSave(setAddonOpen, editingAddon ? updateAddon : addAddon)}/></DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Category</TableHead><TableHead className="text-right">Price</TableHead><TableHead className="text-right w-[120px]">Actions</TableHead></TableRow></TableHeader>
                <TableBody>{menu.addons.map(addon => (<TableRow key={addon.id}><TableCell>{addon.name}</TableCell><TableCell>{menu.addonCategories.find(c => c.id === addon.addonCategoryId)?.name || 'N/A'}</TableCell><TableCell className="text-right">RS {addon.price.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => { setEditingAddon(addon); setAddonOpen(true); }}><Edit/></Button>
                        <AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="text-destructive"/></Button></AlertDialogTrigger>
                            <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will delete the add-on "{addon.name}".</AlertDialogDescription></AlertDialogHeader>
                                <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteAddon(addon.id, addon.name)}>Delete</AlertDialogAction></AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </TableCell></TableRow>))}
                </TableBody></Table>
            </CardContent>
        </Card>

        {/* Items */}
        <Card>
            <CardHeader className="flex-row justify-between items-center">
                <div><CardTitle>Menu Items</CardTitle><CardDescription>The main dishes and products you offer.</CardDescription></div>
                <Dialog open={isItemOpen} onOpenChange={setItemOpen}><DialogTrigger asChild><Button onClick={() => setEditingItem(undefined)}><PlusCircle/> Add Item</Button></DialogTrigger>
                    <DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{editingItem ? 'Edit' : 'Add'} Item</DialogTitle></DialogHeader><ItemForm item={editingItem} onSave={handleSave(setItemOpen, editingItem ? updateItem : addItem)}/></DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Category</TableHead><TableHead className="text-right">Price</TableHead><TableHead className="text-right w-[120px]">Actions</TableHead></TableRow></TableHeader>
                <TableBody>{menu.items.map(item => (<TableRow key={item.id}><TableCell>{item.name}</TableCell><TableCell>{menu.categories.find(c => c.id === item.categoryId)?.name || 'N/A'}</TableCell><TableCell className="text-right">RS {item.price.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => { setEditingItem(item); setItemOpen(true); }}><Edit/></Button>
                        <AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="text-destructive"/></Button></AlertDialogTrigger>
                            <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will delete the item "{item.name}".</AlertDialogDescription></AlertDialogHeader>
                                <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteItem(item.id, item.name)}>Delete</AlertDialogAction></AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </TableCell></TableRow>))}
                </TableBody></Table>
            </CardContent>
        </Card>
    </div>
  );
}
