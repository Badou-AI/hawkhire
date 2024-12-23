'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bell, ChevronLeft, ChevronRight } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { navItems } from './nav-items';
import { Logo } from '@/components/logo';
import { useMediaQuery } from '@/hooks/use-media-query';

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [isCollapsed, setIsCollapsed] = useState(true);

  const shouldCollapse = !isDesktop || isCollapsed;

  return (
    <aside 
      className={cn(
        'fixed left-0 top-0 z-40 h-screen transition-all duration-300',
        shouldCollapse ? 'w-16' : 'w-64',
        className
      )}
    >
      <div className="flex h-full flex-col border-r bg-background px-3 py-4">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <Logo collapsed={shouldCollapse} />
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <NavItem
              key={item.href}
              {...item}
              isCollapsed={shouldCollapse}
              isActive={pathname === item.href}
            />
          ))}
        </nav>

        {/* Bottom section with user controls */}
        <div className="mt-auto space-y-4">
          {/* Toggle button - Only show on desktop */}
          {isDesktop && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="w-full"
            >
              {shouldCollapse ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          )}

          {/* User controls */}
          <div className="flex items-center justify-between px-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/avatars/01.png" alt="@user" />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuItem>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}

interface NavItemProps {
  href: string;
  icon: React.ComponentType;
  label: string;
  isCollapsed: boolean;
  isActive: boolean;
}

function NavItem({ href, icon: Icon, label, isCollapsed, isActive }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        "transition-colors duration-200",
        isActive && "bg-accent text-accent-foreground"
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {!isCollapsed && <span>{label}</span>}
    </Link>
  );
} 