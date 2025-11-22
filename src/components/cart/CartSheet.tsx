
"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { UpdateQuantity } from "./UpdateQuantity";

export function CartSheet({ children }: { children: React.ReactNode }) {
  const { items, cartTotal, cartCount, branchId, clearCart } = useCart();

  const getImageUrl = (imageId: string) => {
    const image = PlaceHolderImages.find((img) => img.id === imageId);
    return image ? image.imageUrl : `https://picsum.photos/seed/${imageId}/200/200`;
  };
  const getImageHint = (imageId: string) => {
    return PlaceHolderImages.find((img) => img.id === imageId)?.imageHint || "food item";
  };

  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle className="font-headline text-2xl">Your Order</SheetTitle>
        </SheetHeader>
        {cartCount > 0 ? (
          <>
            <ScrollArea className="flex-grow">
              <div className="pr-4">
                {items.map((item, index) => (
                  <div key={item.id}>
                    <div className="flex items-center gap-4 py-4">
                       <Image
                        src={getImageUrl(item.imageId)}
                        alt={item.name}
                        width={64}
                        height={64}
                        className="rounded-md object-cover"
                        data-ai-hint={getImageHint(item.imageId)}
                      />
                      <div className="flex-grow">
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          RS {item.price.toFixed(2)}
                        </p>
                      </div>
                      <UpdateQuantity itemId={item.id} quantity={item.quantity} />
                    </div>
                    {index < items.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            </ScrollArea>
            <SheetFooter className="mt-auto border-t pt-4">
                <div className="w-full space-y-4">
                    <div className="flex justify-between font-bold text-lg">
                        <span>Total:</span>
                        <span>RS {cartTotal.toFixed(2)}</span>
                    </div>
                    <Button asChild size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                        <Link href={`/branch/${branchId}/order`}>Confirm Order</Link>
                    </Button>
                </div>
            </SheetFooter>
          </>
        ) : (
          <div className="flex flex-grow flex-col items-center justify-center text-center">
            <p className="text-lg font-semibold">Your cart is empty</p>
            <p className="mt-2 text-muted-foreground">Add some delicious items from the menu!</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
