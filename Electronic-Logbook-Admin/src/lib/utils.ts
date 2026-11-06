import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString?: string | null): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return dateString;
  }
}

export function formatWeight(kg?: number | string | null): string {
  if (kg === undefined || kg === null || kg === '') return '0 kg';
  const num = typeof kg === 'number' ? kg : parseFloat(kg);
  if (isNaN(num)) return `${kg}`;
  return new Intl.NumberFormat('vi-VN').format(num) + ' kg';
}

