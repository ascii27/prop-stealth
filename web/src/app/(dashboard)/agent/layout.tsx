import { AgentSidebar } from "@/components/agent-sidebar";
import { UserProvider } from "@/lib/user-context";

export default function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <div className="flex min-h-screen">
        <AgentSidebar />
        <main className="flex-1 p-5 bg-white overflow-y-auto">{children}</main>
      </div>
    </UserProvider>
  );
}
