
'use client';

import { useRouter } from 'next/navigation';
import { useSettings } from '@/context/SettingsContext';
import { useDeals } from '@/context/DealsContext';
import { Loader, Pizza, Utensils, ShoppingBag } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import Autoplay from "embla-carousel-autoplay";
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { RatingDialog } from '@/components/ui/rating-dialog';
import Header from '@/components/layout/Header';
import { useState } from 'react';
import type { Deal, MenuItem } from '@/lib/types';
import { useCart } from '@/context/CartContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

function DealSelectionDialog({ deal, onSelectMode, isOpen, onOpenChange }: { deal: Deal | null; onSelectMode: (mode: 'Dine-In' | 'Take-Away') => void; isOpen: boolean; onOpenChange: (open: boolean) => void; }) {
    if (!deal) return null;

    const { settings } = useSettings();
    const branch = settings.branches.find(b => b.id === settings.defaultBranchId);
    
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="font-headline text-2xl">How will you be dining?</DialogTitle>
                    <DialogDescription>Select an option to add "{deal.name}" to your cart.</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-4">
                     <Button
                        variant={branch?.dineInEnabled ? "outline" : "secondary"}
                        className="h-24 flex-col gap-2"
                        onClick={() => onSelectMode('Dine-In')}
                        disabled={!branch?.dineInEnabled}
                     >
                        <Utensils className="h-8 w-8" />
                        <span className="font-semibold">Dine-In</span>
                     </Button>
                     <Button
                        variant={branch?.takeAwayEnabled ? "outline" : "secondary"}
                        className="h-24 flex-col gap-2"
                        onClick={() => onSelectMode('Take-Away')}
                        disabled={!branch?.takeAwayEnabled}
                     >
                        <ShoppingBag className="h-8 w-8" />
                        <span className="font-semibold">Take Away</span>
                     </Button>
                </div>
                 <DialogFooter className="sm:justify-center">
                    <p className="text-xs text-muted-foreground">You can continue ordering after making a selection.</p>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


function DealsCarousel() {
  const { deals, isLoading } = useDeals();
  const { settings } = useSettings();
  const router = useRouter();
  const { setOrderDetails, addItem } = useCart();
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const defaultBranchId = settings.defaultBranchId || (settings.branches.length > 0 ? settings.branches[0].id : null);

  const handleDealClick = (deal: Deal) => {
    setSelectedDeal(deal);
    setDialogOpen(true);
  };

  const handleModeSelection = (mode: 'Dine-In' | 'Take-Away') => {
    if (!selectedDeal || !defaultBranchId) return;

    setOrderDetails({ branchId: defaultBranchId, orderType: mode });

    const dealAsMenuItem: MenuItem = {
      id: selectedDeal.id,
      name: selectedDeal.name,
      description: selectedDeal.description,
      price: selectedDeal.price,
      imageUrl: selectedDeal.imageUrl,
      categoryId: 'deals',
    };
    
    addItem({ item: dealAsMenuItem, itemQuantity: 1 });

    setDialogOpen(false);
    setSelectedDeal(null);

    router.push(`/branch/${defaultBranchId}/menu?mode=${mode}`);
  };


  if (isLoading) {
    return (
        <div className="flex items-center justify-center p-12">
            <Loader className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  if (deals.length === 0 || !defaultBranchId) {
      return null;
  }

  return (
    <div className="relative w-full">
      <Carousel 
          opts={{ align: "start", loop: true }}
          plugins={[Autoplay({ delay: 5000, stopOnInteraction: false })]}
          className="w-full"
      >
        <CarouselContent className="-ml-4">
          {deals.map((deal) => (
            <CarouselItem key={deal.id} className="md:basis-1/2 lg:basis-1/3 pl-4">
              <div className="block p-1 group cursor-pointer" onClick={() => handleDealClick(deal)}>
                  <Card className="overflow-hidden transition-all duration-300 group-hover:shadow-xl group-hover:scale-105 animate-blink-neon-green">
                    <CardContent className="flex aspect-video items-center justify-center p-0">
                      <Image src={deal.imageUrl} alt={deal.name} width={600} height={400} className="object-cover w-full h-full" />
                    </CardContent>
                  </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="absolute left-[-50px] top-1/2 -translate-y-1/2 z-10 h-10 w-10 bg-background/80 text-foreground border hover:bg-accent" />
        <CarouselNext className="absolute right-[-50px] top-1/2 -translate-y-1/2 z-10 h-10 w-10 bg-background/80 text-foreground border hover:bg-accent" />
      </Carousel>
      <DealSelectionDialog 
        deal={selectedDeal}
        onSelectMode={handleModeSelection}
        isOpen={isDialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}


export default function Home() {
  const { settings, isLoading } = useSettings();
  const router = useRouter();

  const handleStartOrder = () => {
    if (!isLoading && settings.defaultBranchId) {
      router.push(`/branch/${settings.defaultBranchId}`);
    } else if (!isLoading && settings.branches.length > 0) {
      router.push(`/branch/${settings.branches[0].id}`);
    } else {
        alert("No branches are available at the moment. Please check back later.");
    }
  };

  return (
    <>
    <Header />
    <main className="container mx-auto px-4">
      <div className="flex flex-col items-center justify-center space-y-6 pt-20 text-center">
        <Pizza className="h-24 w-24 text-primary animate-icon-blink" />
        <div className="space-y-2">
            <h1 className="font-headline text-5xl font-bold tracking-tight">Welcome to {settings.companyName}</h1>
            <p className="text-lg text-muted-foreground">The best place for pizza and fast food lovers.</p>
        </div>
        
        {isLoading ? (
            <div className="flex items-center gap-2 py-10">
                <Loader className="h-8 w-8 animate-spin text-primary" />
                <span className="text-muted-foreground">Loading restaurant settings...</span>
            </div>
        ) : settings.branches.length === 0 ? (
              <div className="py-10 text-center">
                <p className="mt-2 text-muted-foreground">No branches have been configured yet.</p>
                <p className="mt-1 text-sm text-muted-foreground">Please log in as an admin to add a branch.</p>
            </div>
        ) : (
            <div className="py-6">
                <Button 
                    onClick={handleStartOrder} 
                    className="rounded-full h-16 w-auto px-8 text-lg font-bold shadow-lg transition-transform duration-300 hover:scale-105 bg-gradient-to-r from-primary to-amber-400 text-primary-foreground animate-pulse"
                >
                    Start Your Order
                </Button>
            </div>
        )}
      </div>

      <div className="mt-12 mb-20 px-10">
        <h2 className="text-2xl font-bold font-headline mb-4 text-center">Today's Hot Deals</h2>
        <DealsCarousel />
      </div>

       <div className="fixed bottom-8 right-8">
            <RatingDialog />
        </div>
    </main>
    </>
  );
}
