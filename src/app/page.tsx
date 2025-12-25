
'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useSettings } from '@/context/SettingsContext';
import { useDeals } from '@/context/DealsContext';
import { Loader, ListChecks, Pizza, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import Autoplay from "embla-carousel-autoplay";

function DealsCarousel() {
  const { deals, isLoading } = useDeals();
  const { settings } = useSettings();
  const defaultBranchId = settings.defaultBranchId || (settings.branches.length > 0 ? settings.branches[0].id : null);

  if (isLoading) {
    return (
        <div className="flex items-center justify-center p-12">
            <Loader className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  if (deals.length === 0 || !defaultBranchId) {
      return null; // Don't show the carousel if there are no deals or no branches
  }

  return (
    <Carousel 
        opts={{ align: "start", loop: true }}
        plugins={[Autoplay({ delay: 5000, stopOnInteraction: false })]}
        className="w-full relative"
    >
      <CarouselContent>
        {deals.map((deal) => (
          <CarouselItem key={deal.id} className="md:basis-1/2 lg:basis-1/3">
             <Link href={`/branch/${defaultBranchId}?dealId=${deal.id}`} className="block p-1 group">
                <Card className="overflow-hidden transition-all duration-300 group-hover:shadow-xl group-hover:scale-105">
                  <CardContent className="flex aspect-video items-center justify-center p-0">
                    <Image src={deal.imageUrl} alt={deal.name} width={600} height={400} className="object-cover w-full h-full" />
                  </CardContent>
                </Card>
            </Link>
          </CarouselItem>
        ))}
      </CarouselContent>
       <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 bg-green-500/80 text-white border-none hover:bg-green-500">
        <ChevronLeft className="h-6 w-6" />
      </CarouselPrevious>
      <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 bg-green-500/80 text-white border-none hover:bg-green-500">
        <ChevronRight className="h-6 w-6" />
      </CarouselNext>
    </Carousel>
  );
}


export default function Home() {
  const { settings, isLoading } = useSettings();
  const router = useRouter();

  const handleStartOrder = () => {
    if (!isLoading && settings.defaultBranchId) {
      router.push(`/branch/${settings.defaultBranchId}`);
    } else if (!isLoading && settings.branches.length > 0) {
      // Fallback to the first branch if default is not set
      router.push(`/branch/${settings.branches[0].id}`);
    } else {
        // Handle case with no branches
        alert("No branches are available at the moment. Please check back later.");
    }
  };
  
  const handleCheckStatus = () => {
    router.push('/admin/queue');
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center justify-center text-center space-y-6">
            <Pizza className="h-24 w-24 text-primary" />
            <div className="space-y-2">
                <h1 className="font-headline text-5xl font-bold tracking-tight">Welcome to Cheezious</h1>
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
                <div className="flex flex-col sm:flex-row gap-4 py-6 items-center">
                    <Button size="lg" className="px-10 py-6 text-lg font-bold" onClick={handleStartOrder}>Start Your Order</Button>
                    <Button size="lg" variant="secondary" onClick={handleCheckStatus}>
                        Already placed an order?
                    </Button>
                </div>
             )}
        </div>
        
        <div className="w-full max-w-6xl mt-12">
            <h2 className="text-2xl font-bold font-headline mb-4 text-center">Today's Hot Deals</h2>
            <DealsCarousel />
        </div>
    </main>
  );
}
