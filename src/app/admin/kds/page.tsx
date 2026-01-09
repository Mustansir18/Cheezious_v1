
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader } from 'lucide-react';

// This page just redirects to the first station in the KDS.
export default function KDSPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/admin/kds/master');
    }, [router]);

    return (
        <div className="flex h-[calc(100vh-10rem)] w-full items-center justify-center">
            <Loader className="h-10 w-10 animate-spin text-primary" />
            <p className="ml-4 text-muted-foreground">Loading Stations...</p>
        </div>
    );
}

