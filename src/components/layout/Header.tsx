"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CheeziousLogo } from "@/components/icons/CheeziousLogo";
import { useCart } from "@/context/CartContext";
import { CartSheet } from "@/components/cart/CartSheet";
import { Badge } from "@/components/ui/badge";
import { branches } from "@/lib/data";

export default function Header({ branchId }: { branchId: string }) {
  const { cartCount } = useCart();
  const branch = branches.find((b) => b.id === branchId);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <CheeziousLogo className="h-8 w-8 text-primary" />
          <span className="hidden font-headline text-xl font-bold text-primary sm:inline-block">
            Cheezious
          </span>
        </Link>
        <div className="text-center">
            {branch && <h2 className="font-headline text-lg font-semibold">{branch.name}</h2>}
        </div>
        <CartSheet>
          <Button variant="ghost" size="icon" className="relative">
            <ShoppingCart className="h-6 w-6" />
            {cartCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-accent p-2 text-accent-foreground"
              >
                {cartCount}
              </Badge>
            )}
          </Button>
        </CartSheet>
      </div>
    </header>
  );
}
