
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
import { UpdateQuantity } from "./UpdateQuantity";
import { cn } from "@/lib/utils";

const FALLBACK_IMAGE_URL = "https://picsum.photos/seed/placeholder/400/300";

export function CartSheet({ children }: { children: React.ReactNode }) {
  const { items, cartTotal, cartCount, branchId, isCartOpen, setIsCartOpen } = useCart();

  return (
    <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
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
                  <div key={item.cartItemId}>
                    <div className="flex items-start gap-4 py-4">
                       <Image
                        src={item.imageUrl || FALLBACK_IMAGE_URL}
                        alt={item.name}
                        width={64}
                        height={64}
                        className="rounded-md object-cover"
                        data-ai-hint="food item"
                      />
                      <div className="flex-grow space-y-1">
                        <p className="font-semibold">{item.name}</p>
                        <div className="text-sm text-muted-foreground">
                            {item.selectedAddons.map(addon => (
                                <p key={addon.id}>+ {addon.quantity}x {addon.name}</p>
                            ))}
                        </div>
                        <p className="text-sm">
                          RS {Math.round(item.price)}
                        </p>
                      </div>
                      <UpdateQuantity cartItemId={item.cartItemId} quantity={item.quantity} />
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
                        <span>RS {Math.round(cartTotal)}</span>
                    </div>
                    <Button asChild size="lg" className={cn(
                        "w-full",
                        "animate-blink"
                      )}>
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
