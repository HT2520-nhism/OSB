import React from 'react';
import { FormStatus, FormCode } from '@/lib/types';
import { cn } from '@/lib/utils';

export function StatusBadge({ status, className }: { status: FormStatus; className?: string }) {
  const configs: Record<FormStatus, { label: string; bg: string; text: string; dot: string }> = {
    DRAFT: {
      label: 'Bản nháp',
      bg: 'bg-amber-50 border-amber-200',
      text: 'text-amber-700',
      dot: 'bg-amber-400',
    },
    SUBMITTED: {
      label: 'Chờ duyệt',
      bg: 'bg-blue-50 border-blue-200',
      text: 'text-blue-700',
      dot: 'bg-blue-500 animate-pulse',
    },
    APPROVED: {
      label: 'Đã duyệt',
      bg: 'bg-emerald-50 border-emerald-200',
      text: 'text-emerald-700',
      dot: 'bg-emerald-500',
    },
    REJECTED: {
      label: 'Từ chối',
      bg: 'bg-rose-50 border-rose-200',
      text: 'text-rose-700',
      dot: 'bg-rose-500',
    },
  };

  const config = configs[status] || configs.DRAFT;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border shadow-xs',
        config.bg,
        config.text,
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', config.dot)} />
      {config.label}
    </span>
  );
}

export function FormCodeBadge({ code, className }: { code: FormCode; className?: string }) {
  const configs: Record<FormCode, { label: string; bg: string; text: string; border: string }> = {
    M03: {
      label: 'Mẫu 03 (Rời cảng)',
      bg: 'bg-purple-50 text-purple-700',
      border: 'border-purple-200',
      text: 'text-purple-700',
    },
    NKKT: {
      label: 'NKKT (Nhật ký biển)',
      bg: 'bg-cyan-50 text-cyan-800',
      border: 'border-cyan-200',
      text: 'text-cyan-800',
    },
    M02: {
      label: 'Mẫu 02 (Cập cảng)',
      bg: 'bg-indigo-50 text-indigo-700',
      border: 'border-indigo-200',
      text: 'text-indigo-700',
    },
    M01: {
      label: 'Mẫu 01 (Bốc dỡ)',
      bg: 'bg-teal-50 text-teal-800',
      border: 'border-teal-200',
      text: 'text-teal-800',
    },
  };

  const config = configs[code] || { label: code, bg: 'bg-gray-100', border: 'border-gray-200', text: 'text-gray-700' };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border',
        config.bg,
        config.border,
        config.text,
        className
      )}
    >
      {config.label}
    </span>
  );
}

