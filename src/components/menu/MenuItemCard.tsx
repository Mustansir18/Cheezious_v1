
"use client";

import Image from "next/image";
import type { MenuItem } from "@/lib/types";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { UpdateQuantity } from "@/components/cart/UpdateQuantity";
import { PlusCircle } from "lucide-react";

export function MenuItemCard({ item }: { item: MenuItem }) {
  const { items, addItem } = useCart();
  const cartItem = items.find((i) => i.id === item.id);

  const image = PlaceHolderImages.find((img) => img.id === item.imageId);
  const imageUrl = image ? image.imageUrl : `https://picsum.photos/seed/${item.imageId}/400/300`;
  const imageHint = image ? image.imageHint : "food";

  return (
    <Card className="flex h-full flex-col overflow-hidden transition-shadow hover:shadow-lg">
      <CardHeader className="p-0">
        <div className="relative h-48 w-full">
          <Image
            src={imageUrl}
            alt={item.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            data-ai-hint={imageHint}
          />
        </div>
      </CardHeader>
      <CardContent className="flex-grow p-4">
        <CardTitle className="font-headline text-xl">{item.name}</CardTitle>
        <CardDescription className="mt-2 flex-grow">{item.description}</CardDescription>
      </CardContent>
      <CardFooter className="flex items-center justify-between p-4 pt-0">
        <p className="text-xl font-bold text-primary">RS {item.price.toFixed(2)}</p>
        {cartItem ? (
          <UpdateQuantity itemId={cartItem.id} quantity={cartItem.quantity} />
        ) : (
          <Button
            onClick={() => addItem(item)}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            <PlusCircle className="mr-2 h-5 w-5" />
            Add
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
