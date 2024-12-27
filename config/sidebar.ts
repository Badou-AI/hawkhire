import {
    BriefcaseIcon,
    UsersIcon,
    FileTextIcon,
    SettingsIcon,
    HelpCircleIcon,
    ChartNoAxesColumnIcon
} from 'lucide-react';

export const sidebarItems = [
  {
    title: 'Home',
    icon: BriefcaseIcon,
    href: '/jobs',
    variant: 'default'
  },
  {
    title: 'Dashboard',
    icon: ChartNoAxesColumnIcon,
    href: '/dashboard',
    variant: 'default'
  },
  {
    title: 'Candidates',
    icon: UsersIcon,
    href: '/candidates',
    variant: 'default'
  },
  {
    title: 'Resume Parser',
    icon: FileTextIcon,
    href: '/resume-processing',
    variant: 'default'
  },
  {
    title: 'Settings',
    icon: SettingsIcon,
    href: '/settings',
    variant: 'default'
  },
  {
    title: 'Help',
    icon: HelpCircleIcon,
    href: '/help',
    variant: 'default'
  }
] 