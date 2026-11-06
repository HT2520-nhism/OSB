'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Shield,
  Lock,
  Unlock,
  KeyRound,
  Trash2,
  Search,
  RefreshCw,
  Mail,
  Phone,
  Anchor,
  Ship,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  AlertCircle,
  X,
  UserCheck,
  Building2,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/lib/auth-context';
import {
  getUsers,
  createUser,
  updateUser,
  toggleUserStatus,
  resetUserPassword,
  deleteUser,
} from '@/lib/api';
import {
  UserAccount,
  UserRole,
  UserStatus,
  AccountCategory,
  CreateUserInput,
} from '@/lib/types';
import { formatDate } from '@/lib/utils';

export default function UsersPage() {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<UserStatus | 'ALL'>('ALL');
  const [selectedType, setSelectedType] = useState<AccountCategory | 'ALL'>('ALL');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleToAssign, setRoleToAssign] = useState<UserRole>('operator');

  const [passwordResetResult, setPasswordResetResult] = useState<{
    userName: string;
    tempPassword: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Form State for creating user
  const [formData, setFormData] = useState<CreateUserInput>({
    fullName: '',
    identifierType: 'EMAIL',
    identifier: '',
    password: 'Password@123',
    accountType: 'STAFF',
    systemRole: 'operator',
    organization: 'Cảng cá Sa Kỳ (Quảng Ngãi)',
    vesselRegistration: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getUsers({
        role: selectedRole,
        status: selectedStatus,
        accountType: selectedType,
        search: searchQuery,
      });
      setUsers(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedRole, selectedStatus, selectedType]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  // Stats calculation
  const stats = useMemo(() => {
    const total = users.length;
    const staffCount = users.filter((u) => u.systemRole !== 'user').length;
    const fishermanCount = users.filter((u) => u.systemRole === 'user').length;
    const activeCount = users.filter((u) => u.status === 'ACTIVE').length;
    const lockedCount = users.filter((u) => u.status === 'LOCKED').length;
    return { total, staffCount, fishermanCount, activeCount, lockedCount };
  }, [users]);

  // Handle Create User
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.fullName.trim()) {
      setFormError('Vui lòng nhập họ và tên.');
      return;
    }
    if (!formData.identifier.trim()) {
      setFormError('Vui lòng nhập Email hoặc Số điện thoại.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createUser(formData);
      setShowCreateModal(false);
      setFormData({
        fullName: '',
        identifierType: 'EMAIL',
        identifier: '',
        password: 'Password@123',
        accountType: 'STAFF',
        systemRole: 'operator',
        organization: 'Cảng cá Sa Kỳ (Quảng Ngãi)',
        vesselRegistration: '',
      });
      showToast(`Đã tạo tài khoản cho cán bộ "${formData.fullName}" thành công!`);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Không thể tạo tài khoản. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Toggle Status
  const handleToggleStatus = async (user: UserAccount) => {
    try {
      const updated = await toggleUserStatus(user.id);
      showToast(
        updated.status === 'ACTIVE'
          ? `Đã mở khóa tài khoản "${user.fullName}"`
          : `Đã khóa tài khoản "${user.fullName}"`
      );
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Lỗi cập nhật trạng thái');
    }
  };

  // Handle Role Change
  const handleSaveRole = async () => {
    if (!editingUser) return;
    try {
      await updateUser(editingUser.id, { systemRole: roleToAssign });
      setShowRoleModal(false);
      showToast(`Đã cập nhật vai trò "${roleToAssign}" cho "${editingUser.fullName}"`);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Lỗi cập nhật vai trò');
    }
  };

  // Handle Reset Password
  const handleResetPassword = async (user: UserAccount) => {
    try {
      const res = await resetUserPassword(user.id);
      setPasswordResetResult({
        userName: user.fullName,
        tempPassword: res.tempPassword,
      });
      setCopied(false);
    } catch (err: any) {
      showToast(err.message || 'Không thể đặt lại mật khẩu');
    }
  };

  // Handle Delete
  const handleDelete = async (user: UserAccount) => {
    if (confirm(`Bạn có chắc chắn muốn xóa tài khoản "${user.fullName}" (${user.identifier})?`)) {
      try {
        await deleteUser(user.id);
        showToast(`Đã xóa tài khoản "${user.fullName}"`);
        loadData();
      } catch (err: any) {
        showToast(err.message || 'Không thể xóa tài khoản');
      }
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
            Super Admin
          </span>
        );
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            Trưởng ban Quản lý
          </span>
        );
      case 'operator':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            <Shield className="w-3.5 h-3.5 text-blue-600" />
            Cán bộ Kiểm soát Cảng
          </span>
        );
      case 'user':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            <Anchor className="w-3.5 h-3.5 text-slate-500" />
            Ngư dân / Thuyền trưởng
          </span>
        );
    }
  };

  const getAccountTypeBadge = (type: AccountCategory) => {
    switch (type) {
      case 'STAFF':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
            <Building2 className="w-3 h-3" /> Cán bộ Cảng
          </span>
        );
      case 'CAPTAIN':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
            <Ship className="w-3 h-3" /> Thuyền trưởng
          </span>
        );
      case 'OWNER':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
            <Ship className="w-3 h-3" /> Chủ tàu
          </span>
        );
      case 'FISHERMAN':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
            <Anchor className="w-3 h-3" /> Ngư dân
          </span>
        );
    }
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <>
      <Header
        title="Quản Lý Tài Khoản & Phân Quyền"
        subtitle="Hệ thống quản lý danh bạ cán bộ kiểm soát cảng cá, ban quản lý và thuyền trưởng tàu cá eLogbook"
      />

      {/* Floating Toast Message */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-medium">{toastMessage}</span>
        </div>
      )}

      <div className="p-8 space-y-6">
        {/* Top Summary Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng tài khoản</p>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{stats.total}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Tất cả tài khoản hệ thống</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cán bộ Cảng & Admin</p>
              <h3 className="text-2xl font-extrabold text-blue-700 mt-1">{stats.staffCount}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Có quyền duyệt biểu mẫu IUU</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Thuyền trưởng / Ngư dân</p>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{stats.fishermanCount}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Đăng nhập app di động</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <Anchor className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Trạng thái Hoạt động</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-extrabold text-emerald-600">{stats.activeCount}</span>
                <span className="text-xs text-slate-400 font-medium">hoạt động</span>
                {stats.lockedCount > 0 && (
                  <span className="text-xs text-rose-600 font-semibold">({stats.lockedCount} khóa)</span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Sẵn sàng truy cập hệ thống</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <UserCheck className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Filter & Action Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2 max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm tên cán bộ, email, số điện thoại, tàu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
            >
              Tìm
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter by Role */}
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as any)}
              className="px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="ALL">Tất cả vai trò</option>
              <option value="super_admin">Quản trị viên (Super Admin)</option>
              <option value="admin">Trưởng ban Quản lý</option>
              <option value="operator">Cán bộ Kiểm soát Cảng</option>
              <option value="user">Ngư dân / Thuyền trưởng</option>
            </select>

            {/* Filter by Type */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              className="px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="ALL">Tất cả nhóm</option>
              <option value="STAFF">Cán bộ Cảng cá</option>
              <option value="CAPTAIN">Thuyền trưởng</option>
              <option value="OWNER">Chủ tàu</option>
              <option value="FISHERMAN">Ngư dân</option>
            </select>

            {/* Filter by Status */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="LOCKED">Đang khóa</option>
              <option value="PENDING">Chờ kích hoạt</option>
            </select>

            {/* Refresh */}
            <button
              onClick={loadData}
              title="Tải lại danh sách"
              className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            </button>

            {/* Create CTA Button */}
            <button
              onClick={() => {
                setFormError(null);
                setShowCreateModal(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
            >
              <UserPlus className="w-4 h-4" />
              Tạo tài khoản mới
            </button>
          </div>
        </div>

        {/* User Table List */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">
              Danh Sách Người Dùng & Phân Quyền ({users.length} tài khoản)
            </h3>
            <span className="text-xs text-slate-400">
              Phân quyền theo quy chế nghiệp vụ Cảng cá & Quản lý IUU
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-3 px-4">Họ và Tên / Đơn Vị</th>
                  <th className="py-3 px-4">Định Danh Đăng Nhập</th>
                  <th className="py-3 px-4">Nhóm Tài Khoản</th>
                  <th className="py-3 px-4">Vai Trò Hệ Thống</th>
                  <th className="py-3 px-4">Trạng Thái</th>
                  <th className="py-3 px-4">Lần Đăng Nhập Cuối</th>
                  <th className="py-3 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      Không tìm thấy tài khoản nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Full Name & Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center border border-blue-200 shrink-0">
                            {getInitials(u.fullName)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              {u.fullName}
                              {currentUser?.id === u.id && (
                                <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded font-semibold border border-blue-200">
                                  Bạn
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                              {u.vesselRegistration ? (
                                <span className="font-mono text-blue-600 font-medium">Tàu: {u.vesselRegistration}</span>
                              ) : (
                                <span>{u.organization || 'Ban Quản lý Cảng'}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Identifier */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-mono text-slate-800 font-medium">
                          {u.identifierType === 'EMAIL' ? (
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          ) : (
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          )}
                          <span>{u.identifier}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Tạo ngày: {formatDate(u.createdAt)}
                        </div>
                      </td>

                      {/* Account Category */}
                      <td className="py-3.5 px-4">
                        {getAccountTypeBadge(u.accountType)}
                      </td>

                      {/* System Role */}
                      <td className="py-3.5 px-4">
                        {getRoleBadge(u.systemRole)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {u.status === 'ACTIVE' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Hoạt động
                          </span>
                        ) : u.status === 'LOCKED' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Đã khóa
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Chờ kích hoạt
                          </span>
                        )}
                      </td>

                      {/* Last login */}
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {u.lastLoginAt ? formatDate(u.lastLoginAt) : 'Chưa đăng nhập'}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          {/* Phân quyền */}
                          <button
                            onClick={() => {
                              setEditingUser(u);
                              setRoleToAssign(u.systemRole);
                              setShowRoleModal(true);
                            }}
                            title="Đổi vai trò / Phân quyền"
                            className="p-1.5 rounded-md text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </button>

                          {/* Khóa / Mở khóa */}
                          <button
                            onClick={() => handleToggleStatus(u)}
                            title={u.status === 'ACTIVE' ? 'Khóa tài khoản này' : 'Mở khóa tài khoản'}
                            className={`p-1.5 rounded-md transition-colors ${
                              u.status === 'ACTIVE'
                                ? 'text-slate-600 hover:text-rose-600 hover:bg-rose-50'
                                : 'text-rose-600 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                          >
                            {u.status === 'ACTIVE' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                          </button>

                          {/* Reset Mật khẩu */}
                          <button
                            onClick={() => handleResetPassword(u)}
                            title="Đặt lại mật khẩu tạm"
                            className="p-1.5 rounded-md text-slate-600 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>

                          {/* Xóa */}
                          <button
                            onClick={() => handleDelete(u)}
                            title="Xóa tài khoản"
                            className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ─── Modal 1: Tạo Tài Khoản Mới ─────────────────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Tạo Tài Khoản Mới</h3>
                  <p className="text-xs text-slate-500">Cấp quyền truy cập cho cán bộ cảng hoặc ngư dân</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Họ và tên */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Họ và tên <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Văn Hải"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Nhóm tài khoản & Vai trò */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nhóm đối tượng
                  </label>
                  <select
                    value={formData.accountType}
                    onChange={(e) => {
                      const val = e.target.value as AccountCategory;
                      setFormData({
                        ...formData,
                        accountType: val,
                        systemRole: val === 'STAFF' ? 'operator' : 'user',
                      });
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                  >
                    <option value="STAFF">Cán bộ Cảng cá</option>
                    <option value="CAPTAIN">Thuyền trưởng</option>
                    <option value="FISHERMAN">Ngư dân</option>
                    <option value="OWNER">Chủ tàu</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Vai trò hệ thống <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.systemRole}
                    onChange={(e) => setFormData({ ...formData, systemRole: e.target.value as UserRole })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white font-medium"
                  >
                    <option value="operator">Cán bộ Kiểm soát (operator)</option>
                    <option value="admin">Trưởng ban Quản lý (admin)</option>
                    <option value="super_admin">Quản trị viên (super_admin)</option>
                    <option value="user">Người dùng / Ngư dân (user)</option>
                  </select>
                </div>
              </div>

              {/* Định danh: Email / Phone */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Loại đăng nhập
                  </label>
                  <select
                    value={formData.identifierType}
                    onChange={(e) => setFormData({ ...formData, identifierType: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                  >
                    <option value="EMAIL">Email</option>
                    <option value="PHONE">Số điện thoại</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {formData.identifierType === 'EMAIL' ? 'Địa chỉ Email' : 'Số điện thoại'}{' '}
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type={formData.identifierType === 'EMAIL' ? 'email' : 'tel'}
                    required
                    placeholder={
                      formData.identifierType === 'EMAIL' ? 'canbo@port.gov.vn' : '0912345678'
                    }
                    value={formData.identifier}
                    onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Đơn vị hoặc Số hiệu tàu */}
              {formData.accountType === 'STAFF' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Đơn vị / Cảng công tác
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Cảng cá Sa Kỳ, Cảng cá Tịnh Hòa..."
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Số đăng ký tàu quản lý (nếu có)
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: QNg-90345-TS"
                    value={formData.vesselRegistration}
                    onChange={(e) => setFormData({ ...formData, vesselRegistration: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                  />
                </div>
              )}

              {/* Mật khẩu khởi tạo */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mật khẩu khởi tạo
                </label>
                <input
                  type="text"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Mặc định: Password@123. Người dùng có thể đổi sau khi đăng nhập.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
                >
                  {isSubmitting ? 'Đang tạo...' : 'Tạo tài khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal 2: Phân Quyền & Vai Trò ──────────────────────────────────── */}
      {showRoleModal && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Phân Quyền Vai Trò</h3>
                <p className="text-xs text-slate-500">Cập nhật quyền hạn cho tài khoản: {editingUser.fullName}</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 text-xs space-y-1">
              <div className="text-slate-500">Định danh: <span className="font-mono text-slate-800 font-semibold">{editingUser.identifier}</span></div>
              <div className="text-slate-500">Vai trò hiện tại: <span className="font-semibold text-blue-700">{editingUser.systemRole}</span></div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Chọn vai trò mới trong hệ thống:
              </label>
              <div className="space-y-2">
                {[
                  {
                    role: 'operator' as UserRole,
                    title: 'Cán bộ Kiểm soát Cảng (operator)',
                    desc: 'Tiếp nhận, kiểm tra và phê duyệt biểu mẫu M01, M02, M03, NKKT.',
                  },
                  {
                    role: 'admin' as UserRole,
                    title: 'Trưởng ban Quản lý Cảng (admin)',
                    desc: 'Toàn quyền duyệt hồ sơ, ký số xác nhận bốc dỡ và xem báo cáo IUU.',
                  },
                  {
                    role: 'super_admin' as UserRole,
                    title: 'Quản trị viên Hệ thống (super_admin)',
                    desc: 'Quản lý cấu hình toàn bộ hệ thống, phân quyền và giám sát kết nối API.',
                  },
                  {
                    role: 'user' as UserRole,
                    title: 'Ngư dân / Thuyền trưởng (user)',
                    desc: 'Chỉ có quyền khai báo nhật ký trên app di động eLogbook Mobile.',
                  },
                ].map((item) => (
                  <label
                    key={item.role}
                    className={`block p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      roleToAssign === item.role
                        ? 'border-blue-500 bg-blue-50/50 shadow-xs ring-1 ring-blue-500'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{item.title}</span>
                      <input
                        type="radio"
                        name="systemRole"
                        checked={roleToAssign === item.role}
                        onChange={() => setRoleToAssign(item.role)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{item.desc}</p>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowRoleModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-medium"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveRole}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
              >
                Lưu vai trò
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal 3: Kết Quả Reset Mật Khẩu ────────────────────────────────── */}
      {passwordResetResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
              <KeyRound className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">Mật Khẩu Tạm Đã Được Đặt Lại</h3>
              <p className="text-xs text-slate-500 mt-1">
                Tài khoản: <span className="font-semibold text-slate-800">{passwordResetResult.userName}</span>
              </p>
            </div>

            <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between">
              <span className="font-mono text-base font-bold text-blue-700 tracking-wider">
                {passwordResetResult.tempPassword}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(passwordResetResult.tempPassword);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-slate-200 transition-colors flex items-center gap-1 text-xs"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Đã sao chép' : 'Chép'}</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-400">
              Vui lòng gửi mật khẩu tạm này cho cán bộ. Họ sẽ được yêu cầu đổi mật khẩu sau khi đăng nhập.
            </p>

            <button
              onClick={() => setPasswordResetResult(null)}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              Đóng thông báo
            </button>
          </div>
        </div>
      )}
    </>
  );
}

