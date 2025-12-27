
'use client';

import { useRouter } from 'next/navigation';
import { useSettings } from '@/context/SettingsContext';
import { useDeals } from '@/context/DealsContext';
import { Loader, Pizza } from 'lucide-react';
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
import type { Deal } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';

function DealConfirmationDialog({ deal, onConfirm, isOpen, onOpenChange }: { deal: Deal | null; onConfirm: () => void; isOpen: boolean; onOpenChange: (open: boolean) => void; }) {
    if (!deal) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="font-headline text-2xl">Add Deal to Order?</DialogTitle>
                    <DialogDescription>You are about to add the "{deal.name}" deal to your order.</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <div className="relative h-48 w-full rounded-md overflow-hidden">
                        <Image src={deal.imageUrl} alt={deal.name} layout="fill" objectFit="cover" />
                    </div>
                    <h3 className="font-semibold mt-4 text-lg">{deal.name}</h3>
                    <p className="text-sm text-muted-foreground">{deal.description}</p>
                    <p className="font-bold text-lg mt-2">RS {Math.round(deal.price)}</p>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button onClick={onConfirm}>Add to Cart</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


function DealsCarousel() {
  const { deals, isLoading } = useDeals();
  const { settings } = useSettings();
  const router = useRouter();
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const defaultBranchId = settings.defaultBranchId || (settings.branches.length > 0 ? settings.branches[0].id : null);

  const handleDealClick = (deal: Deal) => {
    setSelectedDeal(deal);
    setDialogOpen(true);
  };

  const handleConfirmDeal = () => {
    if (!selectedDeal || !defaultBranchId) return;
    
    setDialogOpen(false);
    
    // Redirect to the branch selection page with the dealId as a query parameter
    router.push(`/branch/${defaultBranchId}?dealId=${selectedDeal.id}`);
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
      <DealConfirmationDialog 
        deal={selectedDeal}
        onConfirm={handleConfirmDeal}
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
