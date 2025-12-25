'use client';

import Link from "next/link";
import { ShoppingCart, Pizza } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { CartSheet } from "@/components/cart/CartSheet";
import { Badge } from "@/components/ui/badge";
import { useSettings } from "@/context/SettingsContext";
import { cn } from "@/lib/utils";

export default function Header({ branchId }: { branchId: string }) {
  const { cartCount } = useCart();
  const { settings } = useSettings();
  const branch = settings.branches.find((b) => b.id === branchId);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Pizza className="h-8 w-8 text-primary" />
          <span className="hidden font-headline text-xl font-bold text-primary sm:inline-block">
            Cheezious
          </span>
        </Link>
        <div className="text-center">
            {branch && <h2 className="font-headline text-lg font-semibold">{branch.name}</h2>}
        </div>
        <CartSheet>
          <Button variant="outline" className={cn("relative", cartCount > 0 && "animate-blink")}>
            <ShoppingCart className="h-5 w-5" />
            <span className="ml-2">Cart</span>
            {cartCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-accent p-2 text-xs text-accent-foreground"
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
