'use client';

import React, { useState } from 'react';
import {
  Anchor,
  ShieldCheck,
  Lock,
  Mail,
  Phone,
  CreditCard,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  FileCheck2,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
  const { login } = useAuth();

  const [identifierType, setIdentifierType] = useState<'EMAIL' | 'PHONE' | 'CITIZEN_ID'>('EMAIL');
  const [identifier, setIdentifier] = useState('canbocang@port.gov.vn');
  const [password, setPassword] = useState('Password@123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!identifier.trim() || !password) {
      setError('Vui lòng nhập đầy đủ thông tin đăng nhập.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(identifierType, identifier.trim(), password);
    } catch (err: any) {
      setError(err.message || 'Đăng nhập không thành công. Vui lòng kiểm tra lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemo = (role: 'operator' | 'admin' | 'super_admin') => {
    setError(null);
    if (role === 'operator') {
      setIdentifierType('EMAIL');
      setIdentifier('phanminhduc@port.gov.vn');
      setPassword('Operator@123');
    } else if (role === 'admin') {
      setIdentifierType('EMAIL');
      setIdentifier('admin.thuy-san@gov.vn');
      setPassword('Admin@123');
    } else {
      setIdentifierType('EMAIL');
      setIdentifier('phamduccuong0123@gmail.com');
      setPassword('SuperAdmin@123');
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-950 text-slate-100 selection:bg-blue-600 selection:text-white">
      {/* Left Banner: Branding & Features */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-linear-to-br from-blue-950 via-slate-900 to-slate-950 border-r border-slate-800/80 relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute top-0 -left-20 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/30">
              <Anchor className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white">eLogbook OSB</h2>
              <p className="text-xs text-blue-400 font-medium">Hệ thống Giám sát & Quản lý Cảng cá Điện tử</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 my-auto py-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            Cổng Thông tin Nghiệp vụ Cán bộ Cảng cá & IUU
          </div>

          <h1 className="text-4xl font-extrabold text-white leading-tight tracking-tight">
            Quản trị & Phê duyệt <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 via-sky-300 to-emerald-400">
              Nhật ký Khai thác Thủy sản
            </span>
          </h1>

          <p className="text-slate-300 text-sm leading-relaxed max-w-lg">
            Hệ thống tiếp nhận dữ liệu nhật ký mẻ lưới từ app di động của ngư dân, đối chiếu hành trình VMS 24/7,
            lập biên bản kiểm tra cập/rời cảng và chứng nhận nguyên liệu hải sản xuất khẩu.
          </p>

          <div className="space-y-3 pt-2">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <span className="text-xs text-slate-300">
                Chuẩn hóa 4 biểu mẫu quy chuẩn: <strong>M01, M02, M03, NKKT</strong> theo Thông tư 01/2022/TT-BNNPTNT
              </span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <span className="text-xs text-slate-300">
                Xác nhận khối lượng còn lại (Phần B) và Chứng nhận COA Hoa Kỳ (Phần C)
              </span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <span className="text-xs text-slate-300">
                Cân đối chiếu sản lượng thực tế tại cảng và cảnh báo chênh lệch sai phạm IUU
              </span>
            </div>
          </div>
        </div>

        <div className="relative z-10 pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span>Hệ thống Định danh Xác thực Tập trung</span>
          <span className="text-slate-300 font-mono">Logbook-Identity v2.0</span>
        </div>
      </div>

      {/* Right Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-6">
          {/* Header */}
          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-2xl font-bold text-white tracking-tight">Đăng nhập Quản trị</h2>
            <p className="text-xs text-slate-400">
              Dành riêng cho Cán bộ Kiểm soát Cảng cá, Thanh tra Thủy sản và Quản trị viên
            </p>
          </div>

          {/* Identifier Type Switcher */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setIdentifierType('EMAIL');
                setError(null);
              }}
              className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold transition-all ${
                identifierType === 'EMAIL'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              Email
            </button>
            <button
              type="button"
              onClick={() => {
                setIdentifierType('PHONE');
                setError(null);
              }}
              className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold transition-all ${
                identifierType === 'PHONE'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              Số ĐT
            </button>
            <button
              type="button"
              onClick={() => {
                setIdentifierType('CITIZEN_ID');
                setError(null);
              }}
              className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold transition-all ${
                identifierType === 'CITIZEN_ID'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              Số CCCD
            </button>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-800/80 text-rose-200 text-xs flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{error}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                {identifierType === 'EMAIL'
                  ? 'Địa chỉ Email Cán bộ'
                  : identifierType === 'PHONE'
                  ? 'Số điện thoại đăng ký'
                  : 'Số Căn cước công dân (CCCD)'}
              </label>
              <div className="relative">
                <input
                  type={identifierType === 'EMAIL' ? 'email' : 'text'}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={
                    identifierType === 'EMAIL'
                      ? 'canbocang@port.gov.vn'
                      : identifierType === 'PHONE'
                      ? '0912345678'
                      : '034098001234'
                  }
                  required
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-300">Mật khẩu</label>
                <span className="text-[11px] text-slate-500">Mặc định hoặc do Admin cấp</span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-medium py-2.5 px-4 rounded-xl text-sm transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Đang xác thực...</span>
                </>
              ) : (
                <>
                  <span>Đăng nhập vào Hệ thống</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Login Presets */}
          <div className="pt-4 border-t border-slate-800/80 space-y-2.5">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center">
              Chọn nhanh tài khoản kiểm thử:
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('operator')}
                className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800 text-left transition-all"
              >
                <div className="text-[11px] font-bold text-blue-400">Cán bộ Cảng</div>
                <div className="text-[10px] text-slate-400 truncate">Operator</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('admin')}
                className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800 text-left transition-all"
              >
                <div className="text-[11px] font-bold text-emerald-400">Trưởng ban</div>
                <div className="text-[10px] text-slate-400 truncate">Admin Chi cục</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('super_admin')}
                className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-purple-500/50 hover:bg-slate-800 text-left transition-all"
              >
                <div className="text-[11px] font-bold text-purple-400">Quản trị viên</div>
                <div className="text-[10px] text-slate-400 truncate">Super Admin</div>
              </button>
            </div>
          </div>

          {/* Fishermen Notice */}
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-center">
            <p className="text-xs text-slate-400">
              Bạn là Ngư dân / Thuyền trưởng?{' '}
              <span className="text-blue-400 font-medium">
                Vui lòng mở ứng dụng <strong>eLogbook Mobile</strong> trên điện thoại để nộp nhật ký.
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

