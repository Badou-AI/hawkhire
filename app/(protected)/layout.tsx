import { Sidebar } from "@/components/sidebar";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4">
        {children}
      </main>
    </div>
  );
} 