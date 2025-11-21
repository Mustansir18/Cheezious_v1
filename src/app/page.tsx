import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheeziousLogo } from '@/components/icons/CheeziousLogo';
import { branches } from '@/lib/data';
import { MapPin, LogIn } from 'lucide-react';

export default function Home() {
  return (
    <main className="container mx-auto flex min-h-screen flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center space-y-4 text-center">
        <CheeziousLogo className="h-24 w-auto text-primary" />
        <h1 className="font-headline text-4xl font-bold tracking-tight text-primary md:text-5xl">
          Welcome to Cheezious Connect
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          Your seamless digital dining experience starts here. Scan, select, and savor your favorite Cheezious delights.
        </p>
      </div>

      <Card className="mt-12 w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-center font-headline text-2xl">
            Select Your Branch
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            {branches.map((branch) => (
              <Button
                key={branch.id}
                asChild
                size="lg"
                className="justify-start"
              >
                <Link href={`/branch/${branch.id}`}>
                  <MapPin className="mr-2 h-5 w-5" />
                  {branch.name}
                </Link>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 w-full max-w-md">
        <Button asChild variant="outline" className="w-full" size="lg">
          <Link href="/cashier">
            <LogIn className="mr-2 h-5 w-5" />
            Cashier Login
          </Link>
        </Button>
      </div>

      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Cheezious Connect. All Rights Reserved.</p>
      </footer>
    </main>
  );
}
