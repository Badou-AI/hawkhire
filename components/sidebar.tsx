"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSidebarStore } from '@/lib/store/sidebar-store';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Bell,
  Menu,
  X,
  Home,
  Users,
  FileText,
  BarChart,
  Settings,
  LogOut
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const navItems = [
  {
    href: '/dashboard',
    icon: Home,
    label: 'Dashboard'
  },
  {
    href: '/candidates',
    icon: Users,
    label: 'Candidates'
  },
  {
    href: '/resume-processing',
    icon: FileText,
    label: 'Resume Processing'
  },
  {
    href: '/analytics',
    icon: BarChart,
    label: 'Analytics'
  },
  {
    href: '/settings',
    icon: Settings,
    label: 'Settings'
  }
];

export function Sidebar() {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const { isCollapsed, setIsCollapsed } = useSidebarStore();

  useEffect(() => {
    setIsMounted(true);
    const handleResize = () => {
      const width = window.innerWidth;
      // Collapse for tablet view (768px to 1024px)
      if (width >= 768 && width <= 1024) {
        setIsCollapsed(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setIsCollapsed]);

  if (!isMounted) {
    return (
      <aside className="w-16 shrink-0">
        <div className="flex h-full flex-col bg-primary px-3 py-4" />
      </aside>
    );
  }

  return (
    <aside 
      className={cn(
        "relative h-screen shrink-0 transition-all duration-300 bg-primary",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-full flex-col px-3 py-4">
        {/* Logo and Toggle */}
        <div className={cn(
          "mb-8 flex items-center",
          isCollapsed ? "justify-center" : "justify-between"
        )}>
          {isCollapsed ? (
            <div className="w-8 h-8 rounded-md bg-primary-foreground/20 flex items-center justify-center text-white">
              H
            </div>
          ) : (
            <>
              <div className="text-xl font-bold text-white">Hawkhire</div>
              <Button 
                variant="ghost" 
                size="icon"
                className="text-white hover:text-white hover:bg-primary-foreground/20"
                onClick={() => setIsCollapsed(true)}
              >
                <X className="h-5 w-5" />
              </Button>
            </>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2",
                "text-white hover:bg-primary-foreground/20",
                "transition-colors duration-200",
                pathname === item.href && "bg-primary-foreground/20 text-white font-medium"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="mt-auto space-y-4">
          {/* Hamburger menu - show based on screen size */}
          {isCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(false)}
              className="w-full text-white hover:text-white hover:bg-primary-foreground/20"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}

          {/* User controls - stacked vertically */}
          <div className="flex flex-col gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className={cn(
                    "w-full text-white hover:text-white",
                    "flex items-center gap-3 rounded-lg px-3 py-2",
                    "justify-start hover:bg-primary-foreground/20"
                  )}
                >
                  <Avatar className="h-5 w-5">
                    <AvatarImage src="/avatars/01.png" alt="@user" />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                  {!isCollapsed && <span>Profile</span>}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuItem>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button 
              variant="ghost" 
              className={cn(
                "w-full text-white hover:text-white",
                "flex items-center gap-3 rounded-lg px-3 py-2",
                "justify-start hover:bg-primary-foreground/20"
              )}
            >
              <Bell className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span>Notifications</span>}
            </Button>

            <Button 
              variant="ghost" 
              className={cn(
                "w-full text-white hover:text-white",
                "flex items-center gap-3 rounded-lg px-3 py-2",
                "justify-start hover:bg-primary-foreground/20"
              )}
            >
              <LogOut className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span>Sign Out</span>}
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}

