

"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import type { MenuItem, Addon, CartItem } from "@/lib/types";
import { useCart } from "@/context/CartContext";
import { useMenu } from "@/context/MenuContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { PlusCircle, Plus, Minus, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { UpdateQuantity } from "../cart/UpdateQuantity";
import { cn } from "@/lib/utils";
import { Textarea } from "../ui/textarea";

const FALLBACK_IMAGE_URL = "https://picsum.photos/seed/placeholder/400/300";

function AddToCartDialog({ item, onAddToCart }: { item: MenuItem; onAddToCart: (options: { selectedAddons: { addon: Addon; quantity: number }[], itemQuantity: number, instructions: string }) => void; }) {
    const { menu } = useMenu();
    const [selectedAddons, setSelectedAddons] = useState<Map<string, { addon: Addon; quantity: number }>>(new Map());
    const [itemQuantity, setItemQuantity] = useState(1);
    const [instructions, setInstructions] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const availableAddons = menu.addons.filter(addon => item.availableAddonIds?.includes(addon.id));

    const handleAddonToggle = (addon: Addon) => {
        setSelectedAddons(prev => {
            const newMap = new Map(prev);
            if (newMap.has(addon.id)) {
                newMap.delete(addon.id);
            } else {
                newMap.set(addon.id, { addon, quantity: 1 });
            }
            return newMap;
        });
    };
    
    const handleAddonQuantityChange = (addonId: string, change: number) => {
        setSelectedAddons(prev => {
            const newMap = new Map(prev);
            const existing = newMap.get(addonId);
            if (existing) {
                const newQuantity = existing.quantity + change;
                if (newQuantity > 0) {
                    newMap.set(addonId, { ...existing, quantity: newQuantity });
                } else {
                    newMap.delete(addonId);
                }
            }
            return newMap;
        });
    };

    const handleConfirm = () => {
        const addonsArray = Array.from(selectedAddons.values());
        onAddToCart({ selectedAddons: addonsArray, itemQuantity, instructions });
        setIsOpen(false);
        // Reset state after adding to cart
        setSelectedAddons(new Map());
        setItemQuantity(1);
        setInstructions('');
    };
    
    const totalAddonPrice = Array.from(selectedAddons.values()).reduce((sum, { addon, quantity }) => sum + (addon.price * quantity), 0);
    const finalPrice = (item.price + totalAddonPrice) * itemQuantity;
    
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="default">
                    <PlusCircle className="mr-2 h-5 w-5" />
                    {item.availableAddonIds && item.availableAddonIds.length > 0 ? 'Customize & Add' : 'Add to Cart'}
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="font-headline text-2xl">{item.name}</DialogTitle>
                    <DialogDescription>Customize your item and add special instructions.</DialogDescription>
                </DialogHeader>
                
                <div className="flex-grow overflow-y-auto pr-2 space-y-6">
                     <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <Label className="font-semibold text-lg">Quantity</Label>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setItemQuantity(q => Math.max(1, q - 1))} disabled={itemQuantity <= 1}>
                                <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center font-bold text-lg">{itemQuantity}</span>
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setItemQuantity(q => q + 1)}>
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                    
                    {availableAddons.length > 0 && (
                        <div>
                            <h4 className="font-semibold mb-2">Available Add-ons</h4>
                            <div className="space-y-2">
                                {availableAddons.map(addon => {
                                    const isSelected = selectedAddons.has(addon.id);
                                    const selectedInfo = selectedAddons.get(addon.id);

                                    return (
                                        <div key={addon.id} className={cn("p-2 rounded-md hover:bg-muted/50", isSelected && "bg-muted/50")}>
                                            <div className="flex items-center space-x-3">
                                                <input
                                                    type="checkbox"
                                                    id={`addon-dialog-${addon.id}`}
                                                    checked={isSelected}
                                                    onChange={() => handleAddonToggle(addon)}
                                                    className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                                                />
                                                <Label htmlFor={`addon-dialog-${addon.id}`} className="flex-grow font-normal cursor-pointer text-base">
                                                    {addon.name}
                                                </Label>
                                                <span className="text-sm font-semibold">+RS {Math.round(addon.price)}</span>
                                            </div>
                                            {isSelected && selectedInfo && (
                                                <div className="flex items-center justify-end gap-2 mt-2">
                                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleAddonQuantityChange(addon.id, -1)}>
                                                        {selectedInfo.quantity === 1 ? <Trash2 className="h-4 w-4 text-destructive" /> : <Minus className="h-4 w-4" />}
                                                    </Button>
                                                    <span className="w-6 text-center font-bold">{selectedInfo.quantity}</span>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleAddonQuantityChange(addon.id, 1)}>
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div>
                        <Label htmlFor="special-instructions" className="font-semibold">Special Instructions</Label>
                        <Textarea
                            id="special-instructions"
                            placeholder="e.g., extra spicy, no onions..."
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                            className="mt-2"
                        />
                    </div>
                </div>

                <DialogFooter className="mt-auto pt-4 border-t">
                    <div className="w-full flex justify-between items-center">
                       <p className="text-xl font-bold">Total: RS {Math.round(finalPrice)}</p>
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
  const { addItem, items: cartItems } = useCart();

  const handleAddToCart = (options: { selectedAddons: { addon: Addon; quantity: number }[], itemQuantity: number, instructions: string }) => {
    addItem({ item, ...options });
  };
  
  const variationsInCart = useMemo(() => {
    return cartItems.filter(cartItem => cartItem.id === item.id);
  }, [cartItems, item.id]);

  const hasCustomizations = item.availableAddonIds && item.availableAddonIds.length > 0;

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
      <CardFooter className="flex flex-col items-stretch gap-4 p-4 pt-0">
        <p className="text-xl font-bold text-primary">RS {Math.round(item.price)}</p>
        
        {variationsInCart.length === 0 ? (
            <AddToCartDialog 
                item={item} 
                onAddToCart={handleAddToCart}
            />
        ) : (
            <div className="space-y-3">
                {variationsInCart.map((cartItem) => (
                    <div key={cartItem.cartItemId} className="p-3 rounded-md bg-muted/50">
                        <div className="flex justify-between items-center">
                            <div className="font-semibold">
                                <p>{item.name}</p>
                                {cartItem.selectedAddons.length > 0 && (
                                    <div className="pl-2 text-xs font-normal text-muted-foreground">
                                        {cartItem.selectedAddons.map(addon => (
                                            <p key={addon.id}>+ {addon.quantity}x {addon.name}</p>
                                        ))}
                                    </div>
                                )}
                                {cartItem.instructions && (
                                    <p className="pl-2 text-xs italic text-blue-600">"{cartItem.instructions}"</p>
                                )}
                            </div>
                            <UpdateQuantity cartItemId={cartItem.cartItemId} quantity={cartItem.quantity} />
                        </div>
                    </div>
                ))}
                 <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="secondary" className="w-full">
                            <PlusCircle className="mr-2 h-5 w-5" />
                            Add Another Variation
                        </Button>
                    </DialogTrigger>
                    <AddToCartDialog 
                        item={item} 
                        onAddToCart={handleAddToCart}
                    />
                </Dialog>
            </div>
        )}
      </CardFooter>
    </Card>
  );
}
