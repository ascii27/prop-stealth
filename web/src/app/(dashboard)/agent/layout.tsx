import { AgentSidebar } from "@/components/agent-sidebar";

export default function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <AgentSidebar />
      <main className="flex-1 p-5 bg-white overflow-y-auto">{children}</main>
    </div>
  );
}
