import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getStatusColor = (status: string) => {
  const statusColors = {
    screening: 'hsl(var(--status-screening))',
    interview: 'hsl(var(--status-interview))',
    assessment: 'hsl(var(--status-assessment))',
    offer: 'hsl(var(--status-offer))',
    hired: 'hsl(var(--status-hired))',
    rejected: 'hsl(var(--status-rejected))'
  };
  
  return statusColors[status as keyof typeof statusColors] || statusColors.screening;
};
