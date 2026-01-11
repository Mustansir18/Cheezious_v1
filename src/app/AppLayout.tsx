
'use client';

// This component is a simple pass-through for the main application layout.
// The global state providers are now correctly handled in the root layout.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
