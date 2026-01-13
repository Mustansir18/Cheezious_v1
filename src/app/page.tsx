

'use client';

import { useRouter } from 'next/navigation';
import { useSettings } from '@/context/SettingsContext';
import { useMenu } from '@/context/MenuContext';
import { useDeals } from '@/context/DealsContext';
import { Loader, X, ShoppingCart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { RatingDialog } from '@/components/ui/rating-dialog';
import Header from '@/components/layout/Header';
import { useState, useEffect, useMemo } from 'react';
import type { MenuItem } from '@/lib/types';
import { Dialog, DialogContent, DialogDescription } from '@/components/ui/dialog';
import { DialogTitle, DialogHeader, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import Autoplay from "embla-carousel-autoplay";
import { Separator } from '@/components/ui/separator';


function PromotionModal({ promoImageUrl, onConfirm, isOpen, onOpenChange }: { promoImageUrl: string; onConfirm: () => void; isOpen: boolean; onOpenChange: (open: boolean) => void; }) {
    if (!promoImageUrl) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="p-0 border-0 max-w-2xl bg-transparent shadow-none" hideCloseButton={true}>
                 <DialogTitle className="sr-only">Special Promotion</DialogTitle>
                <div className="relative">
                     <button
                        onClick={() => onOpenChange(false)}
                        className="absolute top-2 right-2 z-20 bg-white/70 hover:bg-white rounded-full p-1 transition-all"
                        aria-label="Close"
                     >
                        <X className="h-5 w-5 text-gray-800" />
                    </button>
                    <Image
                        src={promoImageUrl}
                        alt="Special Promotion"
                        width={800}
                        height={600}
                        className="object-contain w-full h-full rounded-lg cursor-pointer"
                        onClick={onConfirm}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}

function DealDetailDialog({ deal, isOpen, onOpenChange, onConfirm }: { deal: MenuItem | null; isOpen: boolean; onOpenChange: (open: boolean) => void; onConfirm: (dealId: string) => void; }) {
    const { menu } = useMenu();
    if (!deal) return null;

    const includedItems = deal.dealItems?.map(dealItem => {
        const item = menu.items.find(i => i.id === dealItem.menuItemId);
        return {
            ...dealItem,
            name: item?.name || 'Unknown Item',
        };
    }) || [];

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="font-headline text-2xl">{deal.name}</DialogTitle>
                    <DialogDescription>{deal.description}</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <h4 className="font-semibold mb-2">What's Included:</h4>
                    <div className="space-y-2 rounded-md border p-4">
                        {includedItems.map(item => (
                            <div key={item.menuItemId} className="flex justify-between">
                                <span>{item.quantity}x {item.name}</span>
                            </div>
                        ))}
                    </div>
                    <Separator className="my-4"/>
                    <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold">Total Price:</span>
                        <span className="font-headline text-2xl font-bold text-primary">RS {Math.round(deal.price)}</span>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button onClick={() => onConfirm(deal.id)}>
                        <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


export default function Home() {
  const { settings, isLoading: isSettingsLoading } = useSettings();
  const { menu, isLoading: isMenuLoading } = useMenu();
  const { deals, isLoading: isDealsLoading } = useDeals(); // This now gets deals from MenuContext
  const router = useRouter();

  const [isPromoOpen, setPromoOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<MenuItem | null>(null);
  const [isDealDetailOpen, setDealDetailOpen] = useState(false);
  
  const isLoading = isSettingsLoading || isMenuLoading || isDealsLoading;
  
  const promoItem = useMemo(() => {
    if (isLoading || !settings.promotion.itemId) return null;
    // Find the promo item from the main menu list
    return menu.items.find(d => d.id === settings.promotion.itemId);
  }, [isLoading, menu.items, settings.promotion.itemId]);

  useEffect(() => {
    // Only show promo if it's enabled and the session hasn't seen it yet
    const promoSeen = sessionStorage.getItem('promo_seen');
    if (!isLoading && settings.promotion.isEnabled && promoItem && !promoSeen) {
      setPromoOpen(true);
      sessionStorage.setItem('promo_seen', 'true');
    }
  }, [isLoading, settings.promotion.isEnabled, promoItem]);


  const handleStartOrder = (itemId?: string) => {
    const targetBranchId = settings.defaultBranchId || (settings.branches.length > 0 ? settings.branches[0].id : null);
    
    if (targetBranchId) {
        let path = `/branch/${targetBranchId}`;
        if (itemId) {
            path += `?dealId=${itemId}`;
        }
        router.push(path);
    } else {
        alert("No branches are available at the moment. Please check back later.");
    }
  };

  const handleDealClick = (deal: MenuItem) => {
    setSelectedDeal(deal);
    setDealDetailOpen(true);
  };

  const handleConfirmDeal = (dealId: string) => {
    setDealDetailOpen(false);
    handleStartOrder(dealId);
  };

  const handleConfirmPromo = () => {
    if (!promoItem) return;
    setPromoOpen(false);
    handleStartOrder(promoItem.id);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow flex flex-col items-center justify-center p-4 text-center">
        <div className="space-y-1">
          {settings.companyLogo ? (
            <Image src={settings.companyLogo} alt={settings.companyName} width={120} height={120} className="object-contain mx-auto" />
          ) : (
            <div style={{ width: 120, height: 120 }} className="mx-auto" />
          )}
          <h1 className="font-headline text-4xl font-bold tracking-tight">Welcome to {settings.companyName}</h1>
          <p className="text-lg text-muted-foreground">The best place for pizza and fast food lovers.</p>
        </div>

        {isLoading ? (
            <div className="flex items-center gap-2 py-6">
                <Loader className="h-8 w-8 animate-spin text-primary" />
                <span className="text-muted-foreground">Loading restaurant settings...</span>
            </div>
        ) : settings.branches.length === 0 ? (
              <div className="py-6 text-center">
                <p className="mt-2 text-muted-foreground">No branches have been configured yet.</p>
                <p className="mt-1 text-sm text-muted-foreground">Please log in as an admin to add a branch.</p>
            </div>
        ) : (
            <div className="py-6">
                <Button
                    onClick={() => handleStartOrder()}
                    className="rounded-full h-16 w-auto px-8 text-lg font-bold shadow-lg transition-transform duration-300 hover:scale-105 bg-gradient-to-r from-primary to-amber-400 text-primary-foreground animate-pulse"
                >
                    Start Your Order
                </Button>
            </div>
        )}

        {deals.length > 0 && (
            <div className="w-full max-w-6xl px-4 md:px-6 py-6">
                 <h2 className="text-2xl font-bold font-headline mb-4">Today's Deals</h2>
                <Carousel 
                    opts={{ align: "start", loop: true, }}
                    plugins={[ Autoplay({ delay: 3000, stopOnInteraction: true }) ]}
                    className="w-full"
                >
                    <CarouselContent>
                        {deals.map((deal) => (
                        <CarouselItem key={deal.id} className="md:basis-1/2 lg:basis-1/3">
                            <div className="p-1 h-full">
                            <Card 
                                className="overflow-hidden cursor-pointer group h-full flex flex-col"
                                onClick={() => handleDealClick(deal)}
                            >
                                <CardContent className="p-0 flex flex-col flex-grow">
                                    <div className="relative w-full h-48">
                                        <Image
                                            src={deal.imageUrl}
                                            alt={deal.name}
                                            fill
                                            className="object-contain transition-transform group-hover:scale-105"
                                        />
                                    </div>
                                    <div className="p-4 flex-grow">
                                        <h3 className="font-bold font-headline">{deal.name}</h3>
                                        <p className="text-sm text-muted-foreground">{deal.description}</p>
                                    </div>
                                    <div className="p-4 pt-0 mt-auto font-bold text-lg text-primary">
                                        RS {Math.round(deal.price)}
                                    </div>
                                </CardContent>
                            </Card>
                            </div>
                        </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious className="hidden sm:flex" />
                    <CarouselNext className="hidden sm:flex" />
                </Carousel>
            </div>
        )}

      </main>
      <div className="fixed bottom-8 right-8">
          <RatingDialog />
      </div>
       {promoItem && settings.promotion.imageUrl && (
        <PromotionModal
            promoImageUrl={settings.promotion.imageUrl}
            isOpen={isPromoOpen}
            onOpenChange={setPromoOpen}
            onConfirm={handleConfirmPromo}
        />
       )}
       <DealDetailDialog 
            deal={selectedDeal}
            isOpen={isDealDetailOpen}
            onOpenChange={setDealDetailOpen}
            onConfirm={handleConfirmDeal}
       />
    </div>
  );
}
