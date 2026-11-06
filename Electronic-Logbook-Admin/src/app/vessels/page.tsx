import React from 'react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
import { Ship, ShieldCheck, AlertCircle, FileText } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { getVessels } from '@/lib/api';

export default async function VesselsPage() {
  const vessels = await getVessels();

  return (
    <>
      <Header
        title="Quản Lý Đội Tàu Cá Cảng"
        subtitle="Danh bạ thông tin tàu cá, chiều dài, công suất máy chính và giấy phép khai thác"
      />

      <div className="p-8 space-y-6">
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">
              Danh Sách Tàu Cá Đang Quản Lý ({vessels.length} tàu)
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-3 px-4">Số Đăng Ký Tàu</th>
                  <th className="py-3 px-4">Tên Tàu / Loại Tàu</th>
                  <th className="py-3 px-4">Chiều Dài (m)</th>
                  <th className="py-3 px-4">Công Suất (kW)</th>
                  <th className="py-3 px-4">Giấy Phép KT</th>
                  <th className="py-3 px-4">Chủ Tàu / SĐT</th>
                  <th className="py-3 px-4">Trạng Thái</th>
                  <th className="py-3 px-4 text-right">Biểu Mẫu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vessels.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-bold font-mono text-blue-700">
                      {v.registrationNumber}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {v.vesselName}
                      <div className="text-[11px] text-slate-500 font-normal">{v.vesselType}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                      {v.length} m
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                      {v.enginePowerKw} kW
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-mono text-slate-800">{v.licenseNumber || '—'}</div>
                      <div className="text-[11px] text-slate-500">Hạn: {v.licenseExpiry || '—'}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{v.ownerName}</div>
                      <div className="text-[11px] text-slate-500">{v.ownerPhone || '—'}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          v.status === 'AT_SEA'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {v.status === 'AT_SEA' ? 'Đang Đi Biển' : 'Trong Cảng'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/forms?search=${encodeURIComponent(v.registrationNumber)}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Xem hồ sơ</span>
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
