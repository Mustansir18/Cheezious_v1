import BranchLayoutClient from './BranchLayoutClient';

export default async function BranchLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { branchId: string };
}) {
  return <BranchLayoutClient branchId={params.branchId}>{children}</BranchLayoutClient>;
}
