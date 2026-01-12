
'use client';

import Header from "@/components/layout/Header";

export default function BranchLayoutClient({
  children,
  branchId,
}: {
  children: React.ReactNode;
  branchId: string;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Header branchId={branchId} />
      <main className="w-full">{children}</main>
    </div>
  );
}
