import { cn } from '@/lib/utils';
import { Sidebar } from './sidebar';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className={cn(
        "min-h-screen transition-all duration-300",
        "pl-16 lg:pl-16", // Always leave space for collapsed sidebar
      )}>
        <div className="container py-6">
          {children}
        </div>
      </main>
    </div>
  );
} 