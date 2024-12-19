"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { Calendar, DollarSign, LayoutDashboard, Menu, Users, UserSquare2 } from 'lucide-react'
import { useState } from "react"

const sidebarItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    title: "Vacancies",
    icon: Users,
    href: "/vacancies",
  },
  {
    title: "Applicants",
    icon: UserSquare2,
    href: "/applicants",
  },
  {
    title: "Employees",
    icon: Users,
    href: "/employees",
  },
  {
    title: "Payroll",
    icon: DollarSign,
    href: "/payroll",
  },
  {
    title: "Calendar",
    icon: Calendar,
    href: "/calendar",
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild className="lg:hidden absolute left-4 top-4 z-50">
          <Button variant="ghost" size="icon">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SidebarContent pathname={pathname} />
        </SheetContent>
      </Sheet>
      <aside className="hidden lg:block w-72 bg-violet-600 text-white h-screen overflow-y-auto">
        <SidebarContent pathname={pathname} />
      </aside>
    </>
  )
}

function SidebarContent({ pathname }: { pathname: string }) {
  return (
    <div className="flex h-full flex-col">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="text-2xl font-libre-franklin">Hawkhire</span>
        </Link>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-2 p-2">
          {sidebarItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <span
                className={cn(
                  "flex items-center gap-2 rounded-lg px-4 py-2 hover:bg-violet-500/50 transition-colors text-base",
                  pathname === item.href && "bg-violet-500"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.title}
              </span>
            </Link>
          ))}
        </div>
      </ScrollArea>
      <div className="p-6">
        <div className="rounded-lg bg-violet-500 p-4">
          <h3 className="font-semibold font-libre-franklin text-lg">Upgrade Premium</h3>
          <p className="text-sm text-violet-200 mt-1">
            Elevate your reach to our extensive resume database
          </p>
          <Button className="mt-4 w-full bg-white text-violet-600 hover:bg-violet-100 font-mulish">
            Upgrade now
          </Button>
        </div>
      </div>
    </div>
  )
}

