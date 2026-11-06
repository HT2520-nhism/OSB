import React from 'react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
import {
  Ship,
  Compass,
  FileCheck2,
  Scale,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { StatusBadge, FormCodeBadge } from '@/components/ui/Badge';
import { getDashboardStats, getFormSubmissions, getTrips } from '@/lib/api';
import { formatDate, formatWeight } from '@/lib/utils';

export default async function DashboardPage() {
  const stats = await getDashboardStats();
  const recentForms = await getFormSubmissions();
  const trips = await getTrips();

  const pendingForms = recentForms.filter((f) => f.status === 'SUBMITTED').slice(0, 5);

  return (
    <>
      <Header
        title="Tổng Quan Giám Sát Cảng Cá & Biểu Mẫu"
        subtitle="Hệ thống giám sát hành trình, nhật ký khai thác và phê duyệt kiểm tra tàu cá"
      />

      <div className="p-8 space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Tàu ngoài khơi */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Tàu Đang Ngoài Khơi
              </p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {stats.activeVesselsAtSea}{' '}
                <span className="text-xs font-normal text-slate-500">tàu</span>
              </h3>
              <p className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                100% VMS trực tuyến
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Ship className="w-6 h-6" />
            </div>
          </div>

          {/* Card 2: Chuyến biển tháng */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Chuyến Biển Tháng Này
              </p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {stats.tripsThisMonth}{' '}
                <span className="text-xs font-normal text-slate-500">chuyến</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1.5">
                +14% so với tháng trước
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Compass className="w-6 h-6" />
            </div>
          </div>

          {/* Card 3: Biểu mẫu chờ duyệt */}
          <div className="bg-white p-5 rounded-xl border border-blue-200 shadow-xs flex items-center justify-between relative overflow-hidden bg-gradient-to-br from-white to-blue-50/40">
            <div>
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                Biểu Mẫu Chờ Duyệt
              </p>
              <h3 className="text-2xl font-bold text-blue-900 mt-1">
                {stats.pendingFormsCount}{' '}
                <span className="text-xs font-normal text-blue-600">biểu mẫu</span>
              </h3>
              <Link
                href="/forms?status=SUBMITTED"
                className="text-xs text-blue-700 font-semibold hover:underline flex items-center gap-1 mt-1.5"
              >
                Xử lý ngay <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/30">
              <FileCheck2 className="w-6 h-6" />
            </div>
          </div>

          {/* Card 4: Tổng sản lượng */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Sản Lượng Bốc Dỡ
              </p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {formatWeight(stats.totalCatchWeightThisMonth)}
              </h3>
              <p className="text-xs text-emerald-600 font-medium mt-1.5">
                Qua cảng kiểm định
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Scale className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* 4 Regulatory Forms Overview Pill */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Theo dõi 4 Biểu Mẫu Quy Chuẩn Cảng Cá
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Quy định Thông tư số 01/2022/TT-BNNPTNT và Thông tư mới tháng 12/2025
              </p>
            </div>
            <Link
              href="/forms"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              Xem tất cả biểu mẫu <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/forms?code=M03"
              className="p-4 rounded-lg border border-purple-100 bg-purple-50/50 hover:bg-purple-50 hover:border-purple-300 transition-all flex flex-col justify-between"
            >
              <div>
                <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">
                  Mẫu số 03 (PL II)
                </span>
                <h4 className="font-semibold text-sm text-slate-800 mt-1">
                  Kiểm tra Tàu Rời Cảng
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  8 loại hồ sơ, 4 nhóm thiết bị an toàn, kiểm tra thuyền viên.
                </p>
              </div>
              <div className="mt-3 pt-3 border-t border-purple-100 text-xs font-bold text-purple-900">
                {stats.formsBreakdown.m03Count} biên bản xuất cảng
              </div>
            </Link>

            <Link
              href="/forms?code=NKKT"
              className="p-4 rounded-lg border border-cyan-100 bg-cyan-50/50 hover:bg-cyan-50 hover:border-cyan-300 transition-all flex flex-col justify-between"
            >
              <div>
                <span className="text-[11px] font-bold text-cyan-800 uppercase tracking-wider">
                  Mẫu số 01 (PL I)
                </span>
                <h4 className="font-semibold text-sm text-slate-800 mt-1">
                  Nhật Ký Khai Thác Biển
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Mã định danh chuyến biển, mẻ cào/lưới, loài CITES, chuyển tải.
                </p>
              </div>
              <div className="mt-3 pt-3 border-t border-cyan-100 text-xs font-bold text-cyan-900">
                {stats.formsBreakdown.nkktCount} nhật ký đã nộp
              </div>
            </Link>

            <Link
              href="/forms?code=M02"
              className="p-4 rounded-lg border border-indigo-100 bg-indigo-50/50 hover:bg-indigo-50 hover:border-indigo-300 transition-all flex flex-col justify-between"
            >
              <div>
                <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">
                  Mẫu số 02 (PL II)
                </span>
                <h4 className="font-semibold text-sm text-slate-800 mt-1">
                  Kiểm Tra Tàu Cập Cảng
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Đối soát sản lượng báo cáo vs thực tế, kiểm tra hồ sơ nhập bến.
                </p>
              </div>
              <div className="mt-3 pt-3 border-t border-indigo-100 text-xs font-bold text-indigo-900">
                {stats.formsBreakdown.m02Count} biên bản cập cảng
              </div>
            </Link>

            <Link
              href="/forms?code=M01"
              className="p-4 rounded-lg border border-teal-100 bg-teal-50/50 hover:bg-teal-50 hover:border-teal-300 transition-all flex flex-col justify-between"
            >
              <div>
                <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider">
                  Mẫu số 01 (PL II)
                </span>
                <h4 className="font-semibold text-sm text-slate-800 mt-1">
                  Giấy Biên Nhận Bốc Dỡ
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Mục 9 đơn vị thu mua, khối lượng bốc dỡ, chứng nhận COA Mỹ.
                </p>
              </div>
              <div className="mt-3 pt-3 border-t border-teal-100 text-xs font-bold text-teal-900">
                {stats.formsBreakdown.m01Count} giấy biên nhận
              </div>
            </Link>
          </div>
        </div>

        {/* Priority Section: Biểu mẫu mới nộp cần duyệt */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  Biểu Mẫu Chờ Phê Duyệt Gần Nhất
                </h3>
                <p className="text-xs text-slate-500">
                  Cán bộ cảng cần đối soát và phê duyệt để cấp lệnh xuất/nhập bến
                </p>
              </div>
              <Link
                href="/forms?status=SUBMITTED"
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                Xem tất cả ({pendingForms.length})
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/60 text-slate-600">
                    <th className="py-2.5 px-3 font-semibold">Loại Biểu Mẫu</th>
                    <th className="py-2.5 px-3 font-semibold">Số Đăng Ký Tàu</th>
                    <th className="py-2.5 px-3 font-semibold">Thuyền Trưởng</th>
                    <th className="py-2.5 px-3 font-semibold">Thời Gian Gửi</th>
                    <th className="py-2.5 px-3 font-semibold">Trạng Thái</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pendingForms.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Không có biểu mẫu nào đang chờ duyệt.
                      </td>
                    </tr>
                  ) : (
                    pendingForms.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3">
                          <FormCodeBadge code={item.formCode} />
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900">
                          {item.vesselRegistration}
                          <div className="text-[11px] font-normal text-slate-500">
                            {item.vesselName}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-slate-700 font-medium">
                          {item.captainName}
                        </td>
                        <td className="py-3 px-3 text-slate-500">
                          {formatDate(item.submittedAt)}
                        </td>
                        <td className="py-3 px-3">
                          <StatusBadge status={item.status} />
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Link
                            href={`/forms/${item.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
                          >
                            Duyệt ngay
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Chuyến biển đang giám sát */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Compass className="w-4 h-4 text-indigo-600" />
                  Chuyến Biển Mới Nhất
                </h3>
                <Link href="/trips" className="text-xs font-semibold text-blue-600 hover:underline">
                  Xem tất cả
                </Link>
              </div>

              <div className="space-y-3">
                {trips.slice(0, 3).map((trip) => (
                  <div
                    key={trip.id}
                    className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/60 hover:bg-slate-100/60 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-blue-700">
                        {trip.tripIdentifier}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          trip.status === 'ARRIVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {trip.status === 'ARRIVED' ? 'Đã Cập Cảng' : 'Đang Đi Biển'}
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-slate-800 mt-1">
                      {trip.vesselRegistration} • Thuyền trưởng {trip.captainName}
                    </div>

                    <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                      <span>Cảng đi: {trip.departurePort}</span>
                      <span>{trip.operationsCount} mẻ lưới</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100">
              <Link
                href="/forms"
                className="w-full py-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <FileText className="w-4 h-4" />
                Vào Cổng Phê Duyệt Hồ Sơ
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
