
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
import { Trash2, Edit, PlusCircle } from 'lucide-react';
import type { MenuCategory, MenuItem } from '@/lib/types';

// Category Form Component
function CategoryForm({
  category,
  onSave,
  onClose,
}: {
  category?: MenuCategory;
  onSave: (cat: Omit<MenuCategory, 'id'> | MenuCategory) => void;
  onClose: () => void;
}) {
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
        <Input
          id="category-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Pizzas"
          required
        />
      </div>
      <div>
        <Label htmlFor="category-icon">Icon Name</Label>
        <Input
          id="category-icon"
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
          placeholder="e.g., Pizza (from lucide-react)"
          required
        />
        <p className="text-sm text-muted-foreground mt-1">
          Use any valid icon name from the{' '}
          <a href="https://lucide.dev/icons/" target="_blank" rel="noopener noreferrer" className="underline">
            Lucide icon library
          </a>
          .
        </p>
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="secondary">Cancel</Button>
        </DialogClose>
        <Button type="submit">Save Category</Button>
      </DialogFooter>
    </form>
  );
}

// Item Form Component
function ItemForm({
  item,
  categories,
  onSave,
  onClose,
}: {
  item?: MenuItem;
  categories: MenuCategory[];
  onSave: (item: Omit<MenuItem, 'id'> | MenuItem) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(item?.name || '');
  const [description, setDescription] = useState(item?.description || '');
  const [price, setPrice] = useState(item?.price || 0);
  const [categoryId, setCategoryId] = useState(item?.categoryId || '');
  const [imageUrl, setImageUrl] = useState(item?.imageUrl || '');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { name, description, price, categoryId, imageUrl };
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
        <Label htmlFor="item-price">Price</Label>
        <Input id="item-price" type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} required />
      </div>
      <div>
        <Label htmlFor="item-category">Category</Label>
        <Select value={categoryId} onValueChange={setCategoryId} required>
          <SelectTrigger>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(cat => (
              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="item-image">Item Image</Label>
        <Input id="item-image" type="file" accept="image/*" onChange={handleImageChange} className="file:text-foreground"/>
        <p className="text-sm text-muted-foreground mt-1">Select an image from your system.</p>
        {imageUrl && (
          <div className="mt-4">
            <p className="text-sm font-medium mb-2">Image Preview:</p>
            <Image src={imageUrl} alt="Image preview" width={100} height={100} className="rounded-md object-cover" />
          </div>
        )}
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="secondary">Cancel</Button>
        </DialogClose>
        <Button type="submit">Save Item</Button>
      </DialogFooter>
    </form>
  );
}

// Main Page Component
export default function MenuManagementPage() {
  const { menu, isLoading, addCategory, updateCategory, deleteCategory, addItem, updateItem, deleteItem } = useMenu();
  const [isCategoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [isItemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | undefined>();
  const [editingItem, setEditingItem] = useState<MenuItem | undefined>();

  const handleSaveCategory = (cat: Omit<MenuCategory, 'id'> | MenuCategory) => {
    if ('id' in cat) {
      updateCategory(cat);
    } else {
      addCategory(cat);
    }
    setCategoryDialogOpen(false);
  };

  const handleSaveItem = (item: Omit<MenuItem, 'id'> | MenuItem) => {
    if ('id' in item) {
      updateItem(item);
    } else {
      addItem(item);
    }
    setItemDialogOpen(false);
  };

  if (isLoading) {
    return <div>Loading menu...</div>;
  }

  return (
    <div className="container mx-auto p-4 lg:p-8 space-y-8">
      <header className="flex justify-between items-start">
        <div>
            <h1 className="font-headline text-4xl font-bold">Menu Management</h1>
            <p className="text-muted-foreground">Add, edit, or delete menu categories and items.</p>
        </div>
      </header>

      {/* Categories Management */}
      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle>Menu Categories</CardTitle>
            <CardDescription>Manage the categories for your menu.</CardDescription>
          </div>
           <Dialog open={isCategoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingCategory(undefined)}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Category
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingCategory ? 'Edit' : 'Add'} Category</DialogTitle>
                  </DialogHeader>
                  <CategoryForm
                    category={editingCategory}
                    onSave={handleSaveCategory}
                    onClose={() => setCategoryDialogOpen(false)}
                  />
                </DialogContent>
            </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Icon</TableHead>
                <TableHead className="text-right w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {menu.categories.map(cat => (
                <TableRow key={cat.id}>
                  <TableCell>{cat.name}</TableCell>
                  <TableCell className="font-mono text-sm">{cat.icon}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => { setEditingCategory(cat); setCategoryDialogOpen(true); }}>
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteCategory(cat.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Items Management */}
      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
            <div>
              <CardTitle>Menu Items</CardTitle>
              <CardDescription>Manage the items available in your menu.</CardDescription>
            </div>
            <Dialog open={isItemDialogOpen} onOpenChange={setItemDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingItem(undefined)}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Item
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingItem ? 'Edit' : 'Add'} Menu Item</DialogTitle>
                  </DialogHeader>
                  <ItemForm
                    item={editingItem}
                    categories={menu.categories}
                    onSave={handleSaveItem}
                    onClose={() => setItemDialogOpen(false)}
                  />
                </DialogContent>
            </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {menu.items.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{menu.categories.find(c => c.id === item.categoryId)?.name || 'N/A'}</TableCell>
                  <TableCell className="text-right">RS {item.price.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => { setEditingItem(item); setItemDialogOpen(true); }}>
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteItem(item.id)}>
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

    