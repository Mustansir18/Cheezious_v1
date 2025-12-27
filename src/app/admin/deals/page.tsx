

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
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Edit, PlusCircle, Loader } from 'lucide-react';
import type { Deal } from '@/lib/types';
import imageCompression from 'browser-image-compression';
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog';


async function handleImageUpload(file: File) {
  const options = {
    maxSizeMB: 0.5, // (max file size in MB)
    maxWidthOrHeight: 800, // (max width or height in pixels)
    useWebWorker: true,
  };
  try {
    const compressedFile = await imageCompression(file, options);
    // Convert the compressed file to a Data URL for preview
    return await imageCompression.getDataUrlFromFile(compressedFile);
  } catch (error) {
    console.error('Image compression failed:', error);
    // Fallback to reading the original file if compression fails
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
  onSave: (deal: Omit<Deal, 'id'> | Deal, id?: string) => void;
}) {
  const [id, setId] = useState('');
  const [name, setName] = useState(deal?.name || '');
  const [description, setDescription] = useState(deal?.description || '');
  const [price, setPrice] = useState(deal?.price || 0);
  const [imageUrl, setImageUrl] = useState(deal?.imageUrl || '');
  const [isCompressing, setIsCompressing] = useState(false);


  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompressing(true);
      const compressedDataUrl = await handleImageUpload(file);
      setImageUrl(compressedDataUrl);
      setIsCompressing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { name, description, price, imageUrl };
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
          <Input id="deal-id" value={id} onChange={(e) => setId(e.target.value)} required placeholder="e.g. D-001" />
        </div>
      )}
      <div>
        <Label htmlFor="deal-name">Deal Name</Label>
        <Input id="deal-name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="deal-description">Description</Label>
        <Textarea id="deal-description" value={description} onChange={(e) => setDescription(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="deal-price">Price</Label>
        <Input id="deal-price" type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} required />
      </div>
      <div>
        <Label htmlFor="deal-image">Deal Image</Label>
        <Input id="deal-image" type="file" accept="image/*" onChange={handleImageChange} className="file:text-foreground"/>
        <p className="text-sm text-muted-foreground mt-1">Select an image from your system. It will be automatically compressed.</p>
        {isCompressing && <p className="text-sm text-blue-500 mt-2">Compressing image...</p>}
        {imageUrl && !isCompressing && (
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
        <Button type="submit">Save Deal</Button>
      </DialogFooter>
    </form>
  );
}

export default function DealsManagementPage() {
  const { deals, isLoading, addDeal, updateDeal, deleteDeal } = useDeals();
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | undefined>();

  const handleSaveDeal = (dealData: Omit<Deal, 'id'> | Deal, id?: string) => {
    if ('id' in dealData) {
      updateDeal(dealData);
    } else if (id) {
      addDeal({ id, ...dealData });
    }
    setDialogOpen(false);
  };

  if (isLoading) {
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
           <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => { setEditingDeal(undefined); setDialogOpen(true); }}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Deal
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingDeal ? 'Edit' : 'Add'} Deal</DialogTitle>
                  </DialogHeader>
                  <DealForm
                    deal={editingDeal}
                    onSave={handleSaveDeal}
                  />
                </DialogContent>
            </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
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
