"use client";

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { sidebarItems } from '@/config/sidebar';
import { useSidebarStore } from '@/lib/store/sidebar-store';
import { ChevronRight } from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, toggleCollapsed } = useSidebarStore();

  return (
    <aside 
      className={cn(
        "h-full bg-primary transition-all duration-300",
        isCollapsed ? "w-[80px]" : "w-[256px]"
      )}
    >
      <div className="relative flex h-full flex-col items-center gap-2 py-4">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-2xl font-bold text-white">
          H
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapsed}
          className={cn(
            "absolute -right-3 top-6 h-6 w-6 rounded-full bg-primary text-white/60 hover:text-white",
            "transition-all duration-300",
            isCollapsed ? "rotate-0" : "rotate-180"
          )}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link key={item.href} href={item.href} className="w-full px-2">
              <Button
                variant="ghost"
                className={cn(
                  'flex h-12 w-full items-center gap-3 rounded-xl',
                  'text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white',
                  isActive && 'bg-white/10 text-white',
                  isCollapsed && 'justify-center'
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!isCollapsed && (
                  <span className="transition-all duration-200">
                    {item.title}
                  </span>
                )}
              </Button>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}

