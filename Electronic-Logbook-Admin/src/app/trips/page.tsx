import React from 'react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
import { Compass, Ship, FileText, ArrowRight } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { getTrips } from '@/lib/api';
import { formatDate, formatWeight } from '@/lib/utils';

export default async function TripsPage() {
  const trips = await getTrips();

  return (
    <>
      <Header
        title="Quản Lý Chuyến Biển & Nhật Ký Khai Thác"
        subtitle="Giám sát hành trình xuất/nhập bến, mã định danh chuyến biển và số mẻ cào/lưới"
      />

      <div className="p-8 space-y-6">
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">
              Danh Sách Chuyến Biển Đang Diễn Ra & Đã Cập Cảng ({trips.length} chuyến)
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-3 px-4">Mã Định Danh Chuyến</th>
                  <th className="py-3 px-4">Số ĐK Tàu Cá</th>
                  <th className="py-3 px-4">Thuyền Trưởng</th>
                  <th className="py-3 px-4">Cảng Đi & Xuất Bến</th>
                  <th className="py-3 px-4">Cảng Về & Cập Bến</th>
                  <th className="py-3 px-4 text-center">Số Mẻ Lưới</th>
                  <th className="py-3 px-4 text-right">Tổng Sản Lượng</th>
                  <th className="py-3 px-4">Trạng Thái</th>
                  <th className="py-3 px-4 text-right">Biểu Mẫu Chuyến</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {trips.map((trip) => (
                  <tr key={trip.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-bold font-mono text-blue-700">
                      {trip.tripIdentifier}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 font-mono">
                      {trip.vesselRegistration}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {trip.captainName}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{trip.departurePort}</div>
                      <div className="text-[11px] text-slate-500">{formatDate(trip.departureTime)}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      {trip.arrivalPort ? (
                        <>
                          <div className="font-medium text-slate-800">{trip.arrivalPort}</div>
                          <div className="text-[11px] text-slate-500">{formatDate(trip.arrivalTime)}</div>
                        </>
                      ) : (
                        <span className="text-slate-400 italic">Chưa cập bến</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                      {trip.operationsCount}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">
                      {formatWeight(trip.totalCatchWeightKg)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          trip.status === 'ARRIVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {trip.status === 'ARRIVED' ? 'Đã Cập Bến' : 'Đang Khai Thác'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/forms?search=${encodeURIComponent(trip.vesselRegistration)}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Xem biểu mẫu</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
