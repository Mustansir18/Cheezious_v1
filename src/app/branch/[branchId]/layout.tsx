import BranchLayoutClient from './BranchLayoutClient';

export default function BranchLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { branchId: string };
}) {
  // The client boundary is moved to the new component
  return <BranchLayoutClient branchId={params.branchId}>{children}</BranchLayoutClient>;
}
