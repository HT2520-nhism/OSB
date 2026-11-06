'use client';

import React from 'react';
import { Bell, Search, UserCheck, Shield } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export function Header({ title, subtitle }: { title?: string; subtitle?: string }) {
  const { user } = useAuth();

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'super_admin':
        return 'Quản trị viên Hệ thống';
      case 'admin':
        return 'Trưởng ban Quản lý';
      case 'operator':
      default:
        return 'Kiểm soát viên Cảng cá';
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'CB';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between sticky top-0 z-20">
      <div>
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">
          {title || 'Cổng Thông Tin Kiểm Soát & Phê Duyệt Cảng Cá'}
        </h2>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {/* Quick Search */}
        <div className="relative w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm số đăng ký tàu, thuyền trưởng..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* Notifications */}
        <button
          className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
          title="Thông báo mới"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-blue-600 rounded-full" />
        </button>

        {/* User Badge */}
        <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center border border-blue-200">
            {getInitials(user?.fullName)}
          </div>
          <div className="text-left">
            <div className="text-xs font-semibold text-slate-800 flex items-center gap-1">
              {user?.fullName || 'Phan Minh Đức'}
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="text-[11px] text-slate-400">
              {getRoleLabel(user?.systemRole)}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

