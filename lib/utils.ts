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

export function formatSalaryRange(min: number, max: number): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  })
  
  return `${formatter.format(min)} - ${formatter.format(max)}`
}
