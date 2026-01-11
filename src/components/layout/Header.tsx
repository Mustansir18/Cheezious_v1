
'use client';

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ShoppingCart, Pizza } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { CartSheet } from "@/components/cart/CartSheet";
import { Badge } from "@/components/ui/badge";
import { useSettings } from "@/context/SettingsContext";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

export default function Header({ branchId }: { branchId?: string }) {
  const { cartCount } = useCart();
  const { settings } = useSettings();
  const router = useRouter();
  const branch = settings.branches.find((b) => b.id === branchId);

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleCheckStatus = () => {
    router.push('/queue');
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="w-full flex h-16 items-center justify-between px-4 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          {isClient && settings.companyLogo ? (
            <Image src={settings.companyLogo} alt={settings.companyName} width={40} height={40} className="object-contain" />
          ) : (
            <div style={{ width: 40, height: 40 }} /> // Placeholder to prevent layout shift
          )}
          <span className="hidden font-headline text-xl font-bold text-primary sm:inline-block">
            {settings.companyName}
          </span>
        </Link>
        
        {branchId ? (
            <>
                <div className="text-center">
                    {branch && <h2 className="font-headline text-lg font-semibold">{branch.name}</h2>}
                </div>
                <CartSheet>
                <Button variant="secondary" className={cn("relative", cartCount > 0 && "animate-blink")}>
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
            </>
        ) : (
             <div className="flex items-center gap-3">
                <p className="text-sm text-muted-foreground font-bold">Already placed an order?</p>
                <Button size="sm" variant="secondary" onClick={handleCheckStatus} className="animate-blink">
                    Check Order Status
                </Button>
            </div>
        )}
      </div>
    </header>
  );
}
