import { OwnerSidebar } from "@/components/owner-sidebar";

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <OwnerSidebar />
      <main className="flex-1 p-5 bg-white overflow-y-auto">{children}</main>
    </div>
  );
}
