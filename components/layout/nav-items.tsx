import { Home, Users, FileText, Settings, BarChart } from 'lucide-react';

export const navItems = [
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