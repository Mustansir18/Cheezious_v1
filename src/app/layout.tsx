
import type { Metadata } from 'next';
import { Toaster } from "@/components/ui/toaster"
import './globals.css';
import AppLayout from './AppLayout';
import { Poppins, PT_Sans } from 'next/font/google';

// This is a dynamic metadata export.
// In a real app, you might fetch this from the SettingsContext,
// but since this is a server component, we'll hardcode it for now.
// A more advanced implementation might involve a separate API route
// to fetch settings that can be used by server components.
export const metadata: Metadata = {
  title: 'Cheezious',
  description: 'Order your favorite Cheezious meals online.',
};

const poppins = Poppins({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-headline',
  weight: ['400', '600', '700'],
});

const ptSans = PT_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
  weight: ['400', '700'],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${poppins.variable} ${ptSans.variable}`}>
      <body className="font-body antialiased">
        <AppLayout>
          {children}
        </AppLayout>
        <Toaster />
      </body>
    </html>
  );
}
