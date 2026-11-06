'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileCheck2,
  Ship,
  Compass,
  FileSpreadsheet,
  Anchor,
  ShieldCheck,
  LogOut,
  UserCheck,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  // Hide sidebar completely on login page
  if (pathname === '/login') {
    return null;
  }

  const navItems = [
    {
      title: 'Tổng quan',
      href: '/',
      icon: LayoutDashboard,
      matchExact: true,
    },
    {
      title: 'Phê duyệt Biểu mẫu',
      href: '/forms',
      icon: FileCheck2,
      badge: '6 chờ duyệt',
      badgeColor: 'bg-blue-600 text-white',
    },
    {
      title: 'Quản lý Tàu cá',
      href: '/vessels',
      icon: Ship,
    },
    {
      title: 'Chuyến biển & Nhật ký',
      href: '/trips',
      icon: Compass,
    },
    {
      title: 'Báo cáo IUU',
      href: '/reports',
      icon: FileSpreadsheet,
    },
    {
      title: 'Tài khoản & Phân quyền',
      href: '/users',
      icon: Users,
      badge: 'Admin',
      badgeColor: 'bg-purple-950/80 text-purple-300 border border-purple-800/60',
    },
  ];

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'super_admin':
        return 'Quản trị viên (Super Admin)';
      case 'admin':
        return 'Trưởng ban Quản lý';
      case 'operator':
      default:
        return 'Cán bộ Kiểm soát Cảng';
    }
  };

  const getRoleBadgeStyle = (role?: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-950/80 text-purple-300 border-purple-800/60';
      case 'admin':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60';
      case 'operator':
      default:
        return 'bg-blue-950/80 text-blue-300 border-blue-800/60';
    }
  };

  return (
    <aside className="w-64 border-r border-slate-200 bg-slate-900 text-slate-200 flex flex-col shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
          <Anchor className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-base text-white tracking-tight leading-tight">
            eLogbook Admin
          </h1>
          <p className="text-xs text-blue-400 font-medium flex items-center gap-1 mt-0.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            Kiểm soát Cảng cá & IUU
          </p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="p-3 space-y-1.5 flex-1">
        <div className="px-3 py-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Nghiệp vụ Cảng cá
        </div>

        {navItems.map((item) => {
          const isActive = item.matchExact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className={cn('w-4.5 h-4.5', isActive ? 'text-white' : 'text-slate-400')} />
                <span>{item.title}</span>
              </div>
              {item.badge && (
                <span
                  className={cn(
                    'px-2 py-0.5 text-[10px] font-bold rounded-full',
                    isActive ? 'bg-white text-blue-700' : item.badgeColor
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logged in User Card */}
      <div className="p-3.5 mx-3 mb-2 rounded-xl bg-slate-800/80 border border-slate-700/60 flex flex-col gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-500/40 text-blue-300 flex items-center justify-center font-bold text-xs shrink-0">
            {user?.fullName ? user.fullName.charAt(0) : 'C'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate">
              {user?.fullName || 'Phan Minh Đức'}
            </p>
            <p className="text-[11px] text-slate-400 truncate">
              {user?.identifier || 'canbocang@port.gov.vn'}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-slate-700/50">
          <span
            className={cn(
              'px-2 py-0.5 text-[10px] font-semibold rounded-md border',
              getRoleBadgeStyle(user?.systemRole)
            )}
          >
            {getRoleLabel(user?.systemRole)}
          </span>

          <button
            type="button"
            onClick={() => logout()}
            title="Đăng xuất khỏi hệ thống"
            className="flex items-center gap-1 text-[11px] font-medium text-rose-400 hover:text-rose-300 transition-colors p-1 rounded hover:bg-rose-950/40 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Thoát</span>
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 text-xs text-slate-400 space-y-1 bg-slate-950/40">
        <div className="flex items-center justify-between">
          <span>Hệ thống:</span>
          <span className="text-emerald-400 font-medium flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Gateway Connected
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Thông tư áp dụng:</span>
          <span className="text-slate-300 font-medium">01/2022 & TT 2025</span>
        </div>
        <div className="pt-2 text-[11px] text-slate-500">
          Phiên bản 2.1.0 • OSB eLogbook
        </div>
      </div>
    </aside>
  );
}
