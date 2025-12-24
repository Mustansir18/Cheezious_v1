'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Card, CardContent } from '@/components/ui/card';
import { useDeals } from '@/context/DealsContext';
import Autoplay from 'embla-carousel-autoplay';
import { Loader, Pizza } from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';

export default function Home() {
  const { deals, isLoading: isDealsLoading } = useDeals();
  const { settings, isLoading: isSettingsLoading } = useSettings();

  const isLoading = isDealsLoading || isSettingsLoading;
  
  const defaultBranch = settings.branches.find(b => b.id === settings.defaultBranchId) || settings.branches[0];

  return (
    <main className="flex min-h-screen flex-col">
      <div className="container mx-auto flex flex-col items-center justify-center p-4 text-center flex-grow">
        <Pizza className="h-24 w-auto text-primary" />
        <h1 className="font-headline text-4xl font-bold tracking-tight text-primary md:text-5xl mt-4">
          Welcome to {defaultBranch?.name || 'Cheezious'}
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground mt-2">
          Your seamless digital dining experience starts here.
        </p>
        <Button asChild size="lg" className="mt-6" disabled={!defaultBranch}>
          <Link href={`/branch/${defaultBranch?.id || ''}`}>Start Your Order</Link>
        </Button>
      </div>

      <section className="w-full py-12 bg-muted/40">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold font-headline text-center mb-8">Today's Hottest Deals</h2>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
                <Loader className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : deals.length > 0 ? (
            <Carousel
              opts={{
                align: 'start',
                loop: true,
              }}
              plugins={[
                Autoplay({
                  delay: 4000,
                  stopOnInteraction: true,
                }),
              ]}
              className="w-full"
            >
              <CarouselContent>
                {deals.map((deal) => (
                  <CarouselItem key={deal.id} className="md:basis-1/2 lg:basis-1/3">
                    <div className="p-1">
                      <Card className="overflow-hidden">
                        <CardContent className="relative flex aspect-video items-center justify-center p-0">
                          <Image
                            src={deal.imageUrl}
                            alt={deal.name}
                            fill
                            className="object-cover"
                          />
                           <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                           <div className="absolute bottom-0 left-0 p-4 text-white">
                                <h3 className="text-xl font-bold font-headline">{deal.name}</h3>
                                <p className="text-sm">{deal.description}</p>
                                <p className="text-lg font-bold mt-2">RS {deal.price.toFixed(2)}</p>
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
          ) : (
             <div className="text-center text-muted-foreground">
                <p>No special deals available at the moment. Please check back later!</p>
                <Button asChild variant="link">
                    <Link href="/admin/deals">Add a Deal</Link>
                </Button>
             </div>
          )}
        </div>
      </section>
    </main>
  );
}
