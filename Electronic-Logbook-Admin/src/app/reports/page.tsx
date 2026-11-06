import React from 'react';

export const dynamic = 'force-dynamic';
import { FileSpreadsheet, Download, Printer, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { getDashboardStats } from '@/lib/api';
import { formatWeight } from '@/lib/utils';

export default async function ReportsPage() {
  const stats = await getDashboardStats();

  return (
    <>
      <Header
        title="Báo Cáo & Thống Kê Phục Vụ Thanh Tra IUU"
        subtitle="Tổng hợp dữ liệu giám sát cảng cá, tỷ lệ nhật ký điện tử và sản lượng truy xuất nguồn gốc"
      />

      <div className="p-8 space-y-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              Báo Cáo Giám Sát Tàu Cá Cập/Rời Cảng Tháng 11/2026
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Phù hợp chuẩn định dạng thanh tra của Ủy ban Châu Âu (EC) và Bộ Nông nghiệp & PTNT
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {}}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Xuất Báo Cáo Excel (.xlsx)</span>
            </button>
            <button
              onClick={() => {}}
              className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-2 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>In PDF Hồ Sơ Cảng</span>
            </button>
          </div>
        </div>

        {/* 3 Metric Cards for IUU */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-500">Tỷ lệ nộp Nhật ký Điện tử</span>
                <h4 className="text-xl font-bold text-slate-900">98.4%</h4>
              </div>
            </div>
            <p className="text-[11px] text-emerald-600 font-medium mt-3">
              Đạt chỉ tiêu khuyến nghị của EC về chống khai thác IUU
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-500">Tàu giám sát qua VMS 24/7</span>
                <h4 className="text-xl font-bold text-slate-900">100%</h4>
              </div>
            </div>
            <p className="text-[11px] text-blue-600 font-medium mt-3">
              Không có tàu vượt ranh giới biển cho phép
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-500">Sản lượng truy xuất nguồn gốc</span>
                <h4 className="text-xl font-bold text-slate-900">{formatWeight(stats.totalCatchWeightThisMonth)}</h4>
              </div>
            </div>
            <p className="text-[11px] text-indigo-600 font-medium mt-3">
              100% cấp giấy biên nhận bốc dỡ qua cảng M01
            </p>
          </div>
        </div>

        {/* Detailed Report Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <h4 className="font-bold text-slate-900 text-sm mb-3">
            Bảng Thống Kê Theo Nhóm Biểu Mẫu Quy Định
          </h4>
          <table className="w-full text-left text-xs border border-slate-200">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3 border-r border-slate-200">Mã Biểu Mẫu</th>
                <th className="p-3 border-r border-slate-200">Văn Bản Quy Định</th>
                <th className="p-3 border-r border-slate-200 text-center">Số Lượng Đã Lập</th>
                <th className="p-3 border-r border-slate-200 text-center">Đã Phê Duyệt</th>
                <th className="p-3 text-center">Tỷ Lệ Tuân Thủ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr className="hover:bg-slate-50">
                <td className="p-3 font-bold font-mono text-purple-700 border-r border-slate-200">Mẫu 03</td>
                <td className="p-3 border-r border-slate-200">Biên bản kiểm tra tàu cá rời cảng (Phụ lục II Thông tư 2025)</td>
                <td className="p-3 text-center font-bold border-r border-slate-200">{stats.formsBreakdown.m03Count}</td>
                <td className="p-3 text-center font-bold text-emerald-700 border-r border-slate-200">{stats.formsBreakdown.m03Count - 1}</td>
                <td className="p-3 text-center font-bold text-emerald-700">97.4%</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="p-3 font-bold font-mono text-cyan-800 border-r border-slate-200">NKKT</td>
                <td className="p-3 border-r border-slate-200">Nhật ký khai thác thủy sản (Phụ lục I Thông tư 01/2022)</td>
                <td className="p-3 text-center font-bold border-r border-slate-200">{stats.formsBreakdown.nkktCount}</td>
                <td className="p-3 text-center font-bold text-emerald-700 border-r border-slate-200">{stats.formsBreakdown.nkktCount}</td>
                <td className="p-3 text-center font-bold text-emerald-700">100%</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="p-3 font-bold font-mono text-indigo-700 border-r border-slate-200">Mẫu 02</td>
                <td className="p-3 border-r border-slate-200">Biên bản kiểm tra tàu cá cập cảng (Phụ lục II Thông tư 2025)</td>
                <td className="p-3 text-center font-bold border-r border-slate-200">{stats.formsBreakdown.m02Count}</td>
                <td className="p-3 text-center font-bold text-emerald-700 border-r border-slate-200">{stats.formsBreakdown.m02Count}</td>
                <td className="p-3 text-center font-bold text-emerald-700">100%</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="p-3 font-bold font-mono text-teal-800 border-r border-slate-200">Mẫu 01</td>
                <td className="p-3 border-r border-slate-200">Giấy biên nhận sản phẩm bốc dỡ (Phụ lục II Thông tư 2025)</td>
                <td className="p-3 text-center font-bold border-r border-slate-200">{stats.formsBreakdown.m01Count}</td>
                <td className="p-3 text-center font-bold text-emerald-700 border-r border-slate-200">{stats.formsBreakdown.m01Count - 1}</td>
                <td className="p-3 text-center font-bold text-emerald-700">96.2%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
