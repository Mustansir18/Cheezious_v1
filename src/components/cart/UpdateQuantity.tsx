

"use client";

import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2 } from "lucide-react";

export function UpdateQuantity({ cartItemId, quantity }: { cartItemId: string, quantity: number }) {
  const { updateQuantity, items } = useCart();
  const item = items.find(i => i.cartItemId === cartItemId);

  const isDeal = item?.categoryId === 'deals';

  return (
    <div className="flex items-center gap-2">
       <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 text-destructive"
            onClick={() => updateQuantity(cartItemId, quantity - 1)}
            
        >
            <Trash2 className="h-4 w-4" />
        </Button>
      
      <span className="w-6 text-center font-bold">{quantity}</span>

      <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => updateQuantity(cartItemId, quantity + 1)}
          disabled={isDeal}
      >
          <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
