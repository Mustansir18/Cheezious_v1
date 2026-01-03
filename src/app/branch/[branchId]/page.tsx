

'use client';

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Utensils, ShoppingBag } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";
import { useMemo } from "react";
import { notFound, useParams, useSearchParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { useDeals } from "@/context/DealsContext";

export default function ModeSelectionPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const branchId = params.branchId as string;
  const dealId = searchParams.get('dealId');

  const { settings } = useSettings();
  const { setOrderDetails, addDeal } = useCart();
  const { deals } = useDeals();
  const branch = useMemo(() => settings.branches.find((b) => b.id === branchId), [branchId, settings.branches]);
  const dealToAdd = useMemo(() => deals.find(d => d.id === dealId), [deals, dealId]);
  
  const handleModeSelect = (mode: 'Dine-In' | 'Take-Away') => {
      // Set the order details first
      setOrderDetails({ branchId, orderType: mode });

      // If a deal was selected, add its component items to the cart
      if (dealToAdd) {
          addDeal(dealToAdd);
      }

      // Navigate to the appropriate next page
      if (mode === 'Dine-In') {
        router.push(`/branch/${branchId}/table-selection?dealId=${dealId || ''}`);
      } else {
        router.push(`/branch/${branchId}/menu?mode=Take-Away&dealId=${dealId || ''}`);
      }
  };

  if (!branch) {
    return notFound();
  }

  const isDineInAvailable = branch.dineInEnabled;
  const isTakeAwayAvailable = branch.takeAwayEnabled;

  return (
    <div className="container mx-auto flex flex-col items-center justify-center px-4 py-12 text-center min-h-[calc(100vh-4rem)]">
      <h1 className="font-headline text-3xl font-bold tracking-tight md:text-4xl">
        Welcome to {branch?.name || 'Cheezious'}!
      </h1>
      <p className="mt-4 max-w-xl text-lg text-muted-foreground">
        How would you like to enjoy your meal today?
      </p>

      <div className="mt-10 grid w-full max-w-2xl grid-cols-1 gap-8 md:grid-cols-2">
        {isDineInAvailable ? (
            <Card 
                className={cn("transform transition-transform duration-300 hover:scale-105 hover:shadow-xl cursor-pointer", "animate-blink")}
                onClick={() => handleModeSelect('Dine-In')}
            >
                <CardHeader>
                <Utensils className="mx-auto h-16 w-16 text-primary" />
                </CardHeader>
                <CardContent>
                <CardTitle className="font-headline text-2xl">Dine-In</CardTitle>
                <p className="mt-2 text-muted-foreground">
                    Enjoy your meal in our cozy restaurant.
                </p>
                </CardContent>
            </Card>
        ) : (
             <Card className="opacity-50">
                <CardHeader>
                    <Utensils className="mx-auto h-16 w-16 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <CardTitle className="font-headline text-2xl text-muted-foreground">Dine-In</CardTitle>
                    <p className="mt-2 text-muted-foreground">
                        Currently unavailable at this branch.
                    </p>
                </CardContent>
            </Card>
        )}

        {isTakeAwayAvailable ? (
            <Card 
              className={cn("transform transition-transform duration-300 hover:scale-105 hover:shadow-xl cursor-pointer", "animate-blink")}
              onClick={() => handleModeSelect('Take-Away')}
            >
                <CardHeader>
                <ShoppingBag className="mx-auto h-16 w-16 text-primary" />
                </CardHeader>
                <CardContent>
                <CardTitle className="font-headline text-2xl">Take Away</CardTitle>
                <p className="mt-2 text-muted-foreground">
                    Grab your favorites to enjoy on the go.
                </p>
                </CardContent>
            </Card>
         ) : (
             <Card className="opacity-50">
                <CardHeader>
                    <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <CardTitle className="font-headline text-2xl text-muted-foreground">Take Away</CardTitle>
                    <p className="mt-2 text-muted-foreground">
                        Currently unavailable at this branch.
                    </p>
                </CardContent>
            </Card>
         )}
      </div>
    </div>
  );
}
