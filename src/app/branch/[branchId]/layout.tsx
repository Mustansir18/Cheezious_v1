
import Header from "@/components/layout/Header";

export default function BranchLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { branchId: string };
}) {
  return (
    <div className="min-h-screen bg-background">
      <Header branchId={params.branchId} />
      <main className="w-full">{children}</main>
    </div>
  );
}
