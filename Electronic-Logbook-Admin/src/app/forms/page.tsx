'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { StatusBadge, FormCodeBadge } from '@/components/ui/Badge';
import { getFormSubmissions } from '@/lib/api';
import { FormSubmissionSummary, FormCode, FormStatus } from '@/lib/types';
import { formatDate } from '@/lib/utils';

function FormsContent() {
  const searchParams = useSearchParams();
  const initialCode = (searchParams.get('code') as FormCode) || 'ALL';
  const initialStatus = (searchParams.get('status') as FormStatus) || 'ALL';

  const [forms, setForms] = useState<FormSubmissionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCode, setSelectedCode] = useState<FormCode | 'ALL'>(initialCode);
  const [selectedStatus, setSelectedStatus] = useState<FormStatus | 'ALL'>(initialStatus);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    setLoading(true);
    const data = await getFormSubmissions({
      formCode: selectedCode,
      status: selectedStatus,
      search: searchQuery,
    });
    setForms(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [selectedCode, selectedStatus]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const formTabs: { code: FormCode | 'ALL'; label: string }[] = [
    { code: 'ALL', label: 'Tất cả biểu mẫu' },
    { code: 'M03', label: 'Mẫu 03 (Rời cảng)' },
    { code: 'NKKT', label: 'NKKT (Nhật ký biển)' },
    { code: 'M02', label: 'Mẫu 02 (Cập cảng)' },
    { code: 'M01', label: 'Mẫu 01 (Bốc dỡ)' },
  ];

  const statusOptions: { value: FormStatus | 'ALL'; label: string }[] = [
    { value: 'ALL', label: 'Tất cả trạng thái' },
    { value: 'SUBMITTED', label: 'Chờ duyệt' },
    { value: 'APPROVED', label: 'Đã phê duyệt' },
    { value: 'REJECTED', label: 'Bị từ chối' },
    { value: 'DRAFT', label: 'Bản nháp' },
  ];

  return (
    <>
      <Header
        title="Quản Lý & Phê Duyệt Biểu Mẫu Quy Định"
        subtitle="Tiếp nhận, kiểm tra tính hợp pháp và phê duyệt hồ sơ tàu cá theo Thông tư thủy sản"
      />

      <div className="p-8 space-y-6">
        {/* Navigation Tabs by Form Code */}
        <div className="flex border-b border-slate-200 gap-1 overflow-x-auto">
          {formTabs.map((tab) => (
            <button
              key={tab.code}
              onClick={() => setSelectedCode(tab.code)}
              className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
                selectedCode === tab.code
                  ? 'border-blue-600 text-blue-700 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <form onSubmit={handleSearch} className="flex items-center gap-3 flex-1 min-w-[280px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo số đăng ký tàu, thuyền trưởng..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
            >
              Tìm kiếm
            </button>
          </form>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Filter className="w-4 h-4 text-slate-400" />
              <span>Trạng thái:</span>
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as FormStatus | 'ALL')}
              className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <button
              onClick={loadData}
              title="Làm mới dữ liệu"
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">
              Tổng số biểu mẫu tìm thấy: <strong className="text-slate-900">{forms.length}</strong>
            </span>
            <span className="text-xs text-slate-400">
              Nhấp vào biểu mẫu để xem chi tiết đầy đủ và thực hiện phê duyệt
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600">
                  <th className="py-3 px-4 font-semibold">Loại Biểu Mẫu</th>
                  <th className="py-3 px-4 font-semibold">Tên Biểu Mẫu</th>
                  <th className="py-3 px-4 font-semibold">Tàu Cá / Chủ Tàu</th>
                  <th className="py-3 px-4 font-semibold">Thuyền Trưởng</th>
                  <th className="py-3 px-4 font-semibold">Thời Gian Gửi</th>
                  <th className="py-3 px-4 font-semibold">Trạng Thái</th>
                  <th className="py-3 px-4 font-semibold text-right">Chi Tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                        <span>Đang tải dữ liệu hồ sơ...</span>
                      </div>
                    </td>
                  </tr>
                ) : forms.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Không tìm thấy biểu mẫu nào phù hợp với bộ lọc hiện tại.
                    </td>
                  </tr>
                ) : (
                  forms.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    >
                      <td className="py-3.5 px-4">
                        <FormCodeBadge code={item.formCode} />
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        {item.formTitle}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 font-mono">
                          {item.vesselRegistration}
                        </span>
                        <div className="text-[11px] text-slate-500 font-normal">
                          {item.vesselName}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        {item.captainName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {formatDate(item.submittedAt)}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/forms/${item.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 group-hover:border-blue-600 group-hover:bg-blue-600 group-hover:text-white text-slate-700 text-xs font-semibold transition-all shadow-2xs"
                        >
                          <span>Xem & Duyệt</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

export default function FormsManagementPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-400">Đang tải danh sách biểu mẫu...</div>}>
      <FormsContent />
    </Suspense>
  );
}
