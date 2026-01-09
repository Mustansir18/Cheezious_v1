
'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChefHat, Pizza, CookingPot, Flame, Martini, ClipboardList } from 'lucide-react';
import type { KitchenStation } from '@/lib/types';

interface StationInfo {
    id: KitchenStation | 'master';
    name: string;
    description: string;
    icon: React.ElementType;
}

const stations: StationInfo[] = [
    { id: 'pizza', name: 'Pizza Station', description: 'Pizzas and Pizza Rolls', icon: Pizza },
    { id: 'pasta', name: 'Pasta Station', description: 'All pasta dishes', icon: CookingPot },
    { id: 'fried', name: 'Fried Station', description: 'Fried chicken, wings, and sides', icon: Flame },
    { id: 'bar', name: 'Bar & Desserts', description: 'Drinks, desserts, and dips', icon: Martini },
    { id: 'master', name: 'CUTT Station', description: 'Master assembly view of all orders', icon: ClipboardList },
];

export default function KDSLandingPage() {
    const router = useRouter();

    const handleStationSelect = (stationId: string) => {
        if (stationId === 'master') {
            router.push('/admin/kds/master');
        } else {
            router.push(`/admin/kds/${stationId}`);
        }
    };

    return (
        <div className="container mx-auto p-4 lg:p-8">
            <header className="mb-8">
                <h1 className="font-headline text-4xl font-bold">Kitchen Display System</h1>
                <p className="text-muted-foreground">Select a station to view assigned order items.</p>
            </header>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {stations.map((station) => (
                    <Card 
                        key={station.id}
                        className="group transform cursor-pointer transition-transform duration-300 hover:scale-105 hover:shadow-xl"
                        onClick={() => handleStationSelect(station.id)}
                    >
                        <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                            <station.icon className="h-10 w-10 text-primary" />
                            <div>
                                <CardTitle className="font-headline text-2xl">{station.name}</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">{station.description}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
