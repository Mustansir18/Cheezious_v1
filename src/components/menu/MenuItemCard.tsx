
"use client";

import { useState } from "react";
import Image from "next/image";
import type { MenuItem, Addon } from "@/lib/types";
import { useCart } from "@/context/CartContext";
import { useMenu } from "@/context/MenuContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, MessageSquarePlus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const FALLBACK_IMAGE_URL = "https://picsum.photos/seed/placeholder/400/300";

function AddToCartDialog({ item, onAddToCart }: { item: MenuItem; onAddToCart: (options: { selectedAddons: Addon[]; instructions: string }) => void; }) {
    const { menu } = useMenu();
    const [selectedAddons, setSelectedAddons] = useState<Addon[]>([]);
    const [instructions, setInstructions] = useState("");
    const [isOpen, setIsOpen] = useState(false);

    const availableAddons = menu.addons.filter(addon => item.availableAddonIds?.includes(addon.id));
    const addonCategories = menu.addonCategories.filter(cat => availableAddons.some(a => a.addonCategoryId === cat.id));

    const handleAddonToggle = (addon: Addon) => {
        setSelectedAddons(prev => prev.some(a => a.id === addon.id) ? prev.filter(a => a.id !== addon.id) : [...prev, addon]);
    };

    const handleConfirm = () => {
        onAddToCart({ selectedAddons, instructions });
        setIsOpen(false);
        // Reset state for next time
        setSelectedAddons([]);
        setInstructions("");
    };
    
    const totalAddonPrice = selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
    const finalPrice = item.price + totalAddonPrice;

    // Decide if dialog is needed
    if (!item.availableAddonIds || item.availableAddonIds.length === 0) {
        return (
            <Button onClick={() => onAddToCart({ selectedAddons: [], instructions: '' })} className="bg-accent text-accent-foreground hover:bg-accent/90">
                <PlusCircle className="mr-2 h-5 w-5" /> Add
            </Button>
        );
    }
    
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                    <PlusCircle className="mr-2 h-5 w-5" /> Customize & Add
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="font-headline text-2xl">{item.name}</DialogTitle>
                    <DialogDescription>Customize your item with add-ons and special instructions.</DialogDescription>
                </DialogHeader>
                
                <div className="flex-grow overflow-y-auto pr-2">
                    {addonCategories.map(cat => (
                        <div key={cat.id} className="mb-4">
                            <h4 className="font-semibold mb-2">{cat.name}</h4>
                            <div className="space-y-2">
                                {availableAddons.filter(a => a.addonCategoryId === cat.id).map(addon => (
                                    <div key={addon.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50">
                                        <Checkbox
                                            id={`addon-dialog-${addon.id}`}
                                            checked={selectedAddons.some(a => a.id === addon.id)}
                                            onCheckedChange={() => handleAddonToggle(addon)}
                                        />
                                        <Label htmlFor={`addon-dialog-${addon.id}`} className="flex-grow font-normal cursor-pointer">
                                            {addon.name}
                                        </Label>
                                        <span className="text-sm text-muted-foreground">+RS {addon.price.toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    <div className="mt-6">
                        <Label htmlFor="instructions" className="font-semibold flex items-center mb-2"><MessageSquarePlus className="mr-2 h-5 w-5" /> Special Instructions</Label>
                        <Textarea
                            id="instructions"
                            placeholder="e.g., make it extra spicy, no onions..."
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter className="mt-auto pt-4 border-t">
                    <div className="w-full flex justify-between items-center">
                       <p className="text-xl font-bold">Total: RS {finalPrice.toFixed(2)}</p>
                       <div className="flex gap-2">
                         <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                         <Button onClick={handleConfirm}>Add to Cart</Button>
                       </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


export function MenuItemCard({ item }: { item: MenuItem }) {
  const { addItem } = useCart();

  const handleAddToCart = (options: { selectedAddons: Addon[]; instructions: string }) => {
    addItem({ item, ...options });
  };
  
  return (
    <Card className="flex h-full flex-col overflow-hidden transition-shadow hover:shadow-lg">
      <CardHeader className="p-0">
        <div className="relative h-48 w-full">
          <Image
            src={item.imageUrl || FALLBACK_IMAGE_URL}
            alt={item.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            data-ai-hint="food meal"
          />
        </div>
      </CardHeader>
      <CardContent className="flex-grow p-4">
        <CardTitle className="font-headline text-xl">{item.name}</CardTitle>
        <CardDescription className="mt-2 flex-grow">{item.description}</CardDescription>
      </CardContent>
      <CardFooter className="flex items-center justify-between p-4 pt-0">
        <p className="text-xl font-bold text-primary">RS {item.price.toFixed(2)}</p>
        <AddToCartDialog item={item} onAddToCart={handleAddToCart} />
      </CardFooter>
    </Card>
  );
}
