

'use client';

import { useRouter } from 'next/navigation';
import { useSettings } from '@/context/SettingsContext';
import { useMenu } from '@/context/MenuContext';
import { Loader, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { RatingDialog } from '@/components/ui/rating-dialog';
import Header from '@/components/layout/Header';
import { useState, useEffect } from 'react';
import type { MenuItem } from '@/lib/types';
import { Dialog, DialogContent } from '@/components/ui/dialog';

function PromotionModal({ deal, onConfirm, isOpen, onOpenChange }: { deal: MenuItem | null; onConfirm: () => void; isOpen: boolean; onOpenChange: (open: boolean) => void; }) {
    if (!deal) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="p-0 border-0 max-w-2xl bg-transparent shadow-none" hideCloseButton={true}>
                <div className="relative">
                     <button
                        onClick={() => onOpenChange(false)}
                        className="absolute top-2 right-2 z-20 bg-white/70 hover:bg-white rounded-full p-1 transition-all"
                        aria-label="Close"
                     >
                        <X className="h-5 w-5 text-gray-800" />
                    </button>
                    <Image
                        src={deal.imageUrl}
                        alt={deal.name}
                        width={800}
                        height={600}
                        className="object-cover w-full h-full rounded-lg cursor-pointer"
                        onClick={onConfirm}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default function Home() {
  const { settings, isLoading } = useSettings();
  const { menu, isLoading: isMenuLoading } = useMenu();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [promoDeal, setPromoDeal] = useState<MenuItem | null>(null);
  const [isPromoOpen, setPromoOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Find a deal to feature in the promo
    const deals = menu.items.filter(item => item.categoryId === 'C-00001');
    if (deals.length > 0) {
        // For now, just pick the first one. Could be randomized.
        setPromoDeal(deals[0]);

        // Check if the promo has been shown this session
        const promoShown = sessionStorage.getItem('promoShown');
        if (!promoShown) {
            setPromoOpen(true);
            sessionStorage.setItem('promoShown', 'true');
        }
    }
  }, [menu.items]);


  const handleStartOrder = () => {
    if (!isLoading && settings.defaultBranchId) {
      router.push(`/branch/${settings.defaultBranchId}`);
    } else if (!isLoading && settings.branches.length > 0) {
      router.push(`/branch/${settings.branches[0].id}`);
    } else {
        alert("No branches are available at the moment. Please check back later.");
    }
  };

  const handleConfirmPromo = () => {
    if (!promoDeal) return;
    const targetBranchId = settings.defaultBranchId || (settings.branches.length > 0 ? settings.branches[0].id : null);
    if (!targetBranchId) return;

    setPromoOpen(false);
    router.push(`/branch/${targetBranchId}?dealId=${promoDeal.id}`);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow flex flex-col items-center justify-center p-8 text-center">
        <div className="space-y-2">
          {isMounted && settings.companyLogo ? (
            <Image src={settings.companyLogo} alt={settings.companyName} width={120} height={120} className="object-contain mx-auto" />
          ) : (
            <div style={{ width: 120, height: 120 }} className="mx-auto" />
          )}
          <h1 className="font-headline text-4xl font-bold tracking-tight">Welcome to {settings.companyName}</h1>
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
      </main>
      <div className="fixed bottom-8 right-8">
          <RatingDialog />
      </div>
       <PromotionModal
        deal={promoDeal}
        isOpen={isPromoOpen}
        onOpenChange={setPromoOpen}
        onConfirm={handleConfirmPromo}
      />
    </div>
  );
}
