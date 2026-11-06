'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Printer,
  Calendar,
  User,
  Ship,
  FileText,
  AlertTriangle,
  Building,
  Anchor,
  ShieldCheck,
  Check,
  X,
  Plus,
  Trash2,
  Save,
  Scale,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { StatusBadge, FormCodeBadge } from '@/components/ui/Badge';
import { getFormSubmissionById, reviewFormSubmission, saveFormData } from '@/lib/api';
import { FormSubmissionSummary, M01RemainingBalanceItem, M01CoaRemainingItem, M02SpeciesCheckItem } from '@/lib/types';
import { formatDate, formatWeight } from '@/lib/utils';

export default function FormDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const formId = resolvedParams.id;

  const [form, setForm] = useState<FormSubmissionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewerName, setReviewerName] = useState('Phan Minh Đức (Kiểm soát viên)');
  const [processing, setProcessing] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // M01 Active Tab: 'A' | 'B' | 'C'
  const [m01Tab, setM01Tab] = useState<'A' | 'B' | 'C'>('A');

  // Interactive State for M01 Section B (Port confirmation)
  const [secBPortName, setSecBPortName] = useState('');
  const [secBNumber, setSecBNumber] = useState('');
  const [secBDate, setSecBDate] = useState('');
  const [secBItems, setSecBItems] = useState<M01RemainingBalanceItem[]>([]);

  // Interactive State for M01 Section C (COA certification)
  const [secCAuthority, setSecCAuthority] = useState('');
  const [secCCoaNumber, setSecCCoaNumber] = useState('');
  const [secCCoaDate, setSecCCoaDate] = useState('');
  const [secCItems, setSecCItems] = useState<M01CoaRemainingItem[]>([]);

  // Interactive State for M02 Species Weighing
  const [m02Checks, setM02Checks] = useState<M02SpeciesCheckItem[]>([]);

  // Interactive State for M03 Other Occupation
  const [m03OtherOccupation, setM03OtherOccupation] = useState('');

  // Interactive State for NKKT Logbook Number (Port Authority)
  const [logbookNumber, setLogbookNumber] = useState('');

  // Interactive State for M02 Inspection (Port Authority)
  const [m02InspectionUnit, setM02InspectionUnit] = useState('Tổ kiểm soát Cảng cá Tịnh Kỳ');
  const [m02Inspectors, setM02Inspectors] = useState('Phan Minh Đức (Kiểm soát viên); Lê Văn Hoàng (Thanh tra)');
  const [m02DocFishingReport, setM02DocFishingReport] = useState(true);
  const [m02DocFishingLogbook, setM02DocFishingLogbook] = useState(true);
  const [m02Conclusion, setM02Conclusion] = useState('Đủ điều kiện nhập bến và bốc dỡ sản phẩm thủy sản.');

  // Interactive State for M03 Departure Inspection (Port Authority)
  const [m03InspectionUnit, setM03InspectionUnit] = useState('Tổ kiểm soát Cảng cá Cát Lở');
  const [m03Inspectors, setM03Inspectors] = useState('Phan Minh Đức (Tổ trưởng); Vũ Đình Quân (Cán bộ VMS)');
  const [m03Docs, setM03Docs] = useState<Record<string, boolean>>({
    vesselRegistration: true,
    crewList: true,
    technicalSafetyCertificate: true,
    captainQualification: true,
    fishingLicense: true,
    chiefEngineerQualification: true,
    fishingLogbookOrPurchase: true,
    foodSafetyCertificate: true,
  });
  const [m03Equipment, setM03Equipment] = useState<Record<string, 'T' | 'D'>>({
    navigationEquipment: 'D',
    lifesavingFirefighting: 'D',
    communicationSignaling: 'D',
    vesselMonitoring: 'D',
  });
  const [m03CrewCount, setM03CrewCount] = useState(12);
  const [m03Conclusion, setM03Conclusion] = useState('Đủ điều kiện an toàn và pháp lý rời cảng.');

  useEffect(() => {
    async function fetchForm() {
      setLoading(true);
      const data = await getFormSubmissionById(formId);
      setForm(data);
      if (data?.reviewNotes) setReviewNotes(data.reviewNotes);

      // Populate Section B
      const d = data?.data || {};
      if (d.sectionB) {
        setSecBPortName(d.sectionB.portAuthorityName || 'Ban quản lý Cảng cá Tịnh Kỳ');
        setSecBNumber(d.sectionB.confirmationNumber || '');
        setSecBDate(d.sectionB.confirmationDate || new Date().toISOString().split('T')[0]);
        setSecBItems(d.sectionB.remainingBalanceList || []);
      } else if (Array.isArray(d.speciesList)) {
        // Pre-fill from speciesList if sectionB is empty
        setSecBPortName('Ban quản lý Cảng cá');
        setSecBDate(new Date().toISOString().split('T')[0]);
        setSecBItems(
          d.speciesList.map((sp: any) => ({
            speciesName: sp.speciesName || '',
            purchasedQuantity: Number(sp.purchasedQuantity) || 0,
            confirmedQuantity: Number(sp.purchasedQuantity) || 0,
            remainingQuantity: 0,
          }))
        );
      }

      // Populate Section C
      if (d.sectionC) {
        setSecCAuthority(d.sectionC.authorityName || 'Chi cục Thủy sản');
        setSecCCoaNumber(d.sectionC.coaNumber || '');
        setSecCCoaDate(d.sectionC.coaDate || new Date().toISOString().split('T')[0]);
        setSecCItems(d.sectionC.coaRemainingList || []);
      }

      // Populate M02 Checks
      if (Array.isArray(d.speciesChecks) && d.speciesChecks.length > 0) {
        setM02Checks(d.speciesChecks);
      } else if (data?.formCode === 'M02') {
        setM02Checks([
          { speciesName: 'Cá ngừ vằn', reportedQuantity: 8600, actualQuantity: 8500 },
          { speciesName: 'Cá ngừ vây vàng', reportedQuantity: 4300, actualQuantity: 4200 },
          { speciesName: 'Cá nục hoa', reportedQuantity: 1600, actualQuantity: 1550 },
        ]);
      }

      // Populate M03 Other Occupation
      if (d.otherOccupation) {
        setM03OtherOccupation(d.otherOccupation);
      }

      // Populate NKKT Logbook Number
      if (d.logbookNumber) {
        setLogbookNumber(d.logbookNumber);
      }

      // Populate M02 Inspection Data
      if (data?.formCode === 'M02') {
        if (d.inspectionUnit) setM02InspectionUnit(d.inspectionUnit);
        if (Array.isArray(d.inspectors)) setM02Inspectors(d.inspectors.join('; '));
        if (d.documentChecks) {
          setM02DocFishingReport(d.documentChecks.fishingReport !== false);
          setM02DocFishingLogbook(d.documentChecks.fishingLogbook !== false);
        }
        if (d.conclusion) setM02Conclusion(d.conclusion);
      }

      // Populate M03 Departure Inspection Data
      if (data?.formCode === 'M03') {
        if (d.inspectionUnit) setM03InspectionUnit(d.inspectionUnit);
        if (Array.isArray(d.inspectors)) setM03Inspectors(d.inspectors.join('; '));
        if (d.documents) setM03Docs(d.documents);
        if (d.equipment) setM03Equipment(d.equipment);
        if (d.crewCount != null) setM03CrewCount(Number(d.crewCount));
        if (d.conclusion) setM03Conclusion(d.conclusion);
      }

      setLoading(false);
    }
    fetchForm();
  }, [formId]);

  // Handler for Saving Section B (M01)
  const handleSaveSectionB = async () => {
    if (!form) return;
    const sectionBData = {
      portAuthorityName: secBPortName,
      confirmationNumber: secBNumber || `XNNL-${Date.now().toString().slice(-6)}`,
      confirmationDate: secBDate,
      remainingBalanceList: secBItems,
    };
    const res = await saveFormData(form.id, { sectionB: sectionBData });
    if (res.ok) {
      setNotification({ type: 'success', message: 'Đã lưu Xác nhận Khối lượng Còn lại (Phần B) thành công!' });
      if (res.form) setForm(res.form);
    }
  };

  // Handler for Saving Section C (M01 COA)
  const handleSaveSectionC = async () => {
    if (!form) return;
    const sectionCData = {
      authorityName: secCAuthority,
      coaNumber: secCCoaNumber || `COA-US-${Date.now().toString().slice(-6)}`,
      coaDate: secCCoaDate,
      coaRemainingList: secCItems,
    };
    const res = await saveFormData(form.id, { sectionC: sectionCData });
    if (res.ok) {
      setNotification({ type: 'success', message: 'Đã lưu Chứng nhận COA Xuất khẩu Hoa Kỳ (Phần C) thành công!' });
      if (res.form) setForm(res.form);
    }
  };

  // Handler for Saving NKKT Logbook Number (Port Authority)
  const handleSaveNKKTLogbook = async () => {
    if (!form) return;
    const num = logbookNumber.trim() || `SO-LBN-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
    const res = await saveFormData(form.id, {
      logbookNumber: num,
    });
    if (res.ok) {
      setLogbookNumber(num);
      setNotification({ type: 'success', message: 'Đã lưu số vào sổ lưu trữ Cảng cá thành công!' });
      if (res.form) setForm(res.form);
    }
  };

  // Handler for Saving M02 (Port Authority)
  const handleSaveM02 = async () => {
    if (!form) return;
    const res = await saveFormData(form.id, {
      inspectionUnit: m02InspectionUnit,
      inspectors: m02Inspectors.split(';').map((s) => s.trim()).filter(Boolean),
      documentChecks: {
        fishingReport: m02DocFishingReport,
        fishingLogbook: m02DocFishingLogbook,
      },
      speciesChecks: m02Checks,
      conclusion: m02Conclusion,
    });
    if (res.ok) {
      setNotification({ type: 'success', message: 'Đã lưu và ban hành Biên bản Kiểm tra Tàu cá Cập cảng (M02) thành công!' });
      if (res.form) setForm(res.form);
    }
  };

  // Handler for Saving M03 (Port Authority)
  const handleSaveM03 = async () => {
    if (!form) return;
    const res = await saveFormData(form.id, {
      inspectionUnit: m03InspectionUnit,
      inspectors: m03Inspectors.split(';').map((s) => s.trim()).filter(Boolean),
      documents: m03Docs,
      equipment: m03Equipment,
      crewCount: m03CrewCount,
      otherOccupation: m03OtherOccupation,
      conclusion: m03Conclusion,
    });
    if (res.ok) {
      setNotification({ type: 'success', message: 'Đã lưu và ban hành Biên bản Kiểm tra Tàu cá Rời cảng (M03) thành công!' });
      if (res.form) setForm(res.form);
    }
  };

  // Handler for Review (Approve/Reject)
  const handleReview = async (action: 'APPROVE' | 'REJECT') => {
    if (!form) return;
    if (action === 'REJECT' && !reviewNotes.trim()) {
      alert('Vui lòng nhập lý do từ chối để phản hồi đến chủ tàu/thuyền trưởng.');
      return;
    }

    setProcessing(true);
    const extraPayload: Record<string, any> = {};
    if (form.formCode === 'M01') {
      if (secBItems.length > 0) {
        extraPayload.sectionB = {
          portAuthorityName: secBPortName,
          confirmationNumber: secBNumber || `XNNL-${Date.now().toString().slice(-6)}`,
          confirmationDate: secBDate,
          remainingBalanceList: secBItems,
        };
      }
      if (secCItems.length > 0) {
        extraPayload.sectionC = {
          authorityName: secCAuthority,
          coaNumber: secCCoaNumber,
          coaDate: secCCoaDate,
          coaRemainingList: secCItems,
        };
      }
    } else if (form.formCode === 'M02' && m02Checks.length > 0) {
      extraPayload.speciesChecks = m02Checks;
    } else if (form.formCode === 'M03') {
      extraPayload.otherOccupation = m03OtherOccupation;
    }

    const result = await reviewFormSubmission(form.id, action, reviewNotes, reviewerName, extraPayload);
    setProcessing(false);

    if (result.ok) {
      setNotification({ type: 'success', message: result.message });
      if (result.form) setForm(result.form);
    } else {
      setNotification({ type: 'error', message: result.message });
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500">
        <p>Đang tải chi tiết biểu mẫu...</p>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="p-12 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h3 className="text-lg font-bold text-slate-800">Không tìm thấy biểu mẫu</h3>
        <p className="text-xs text-slate-500">Hồ sơ có thể đã bị xóa hoặc đường dẫn không đúng.</p>
        <Link href="/forms" className="text-xs font-semibold text-blue-600 hover:underline">
          &larr; Quay lại danh sách biểu mẫu
        </Link>
      </div>
    );
  }

  const d = form.data || {};

  return (
    <>
      <Header
        title={`Chi Tiết & Thẩm Định Biểu Mẫu: ${form.formCode}`}
        subtitle={`Số đăng ký tàu: ${form.vesselRegistration} • Thuyền trưởng: ${form.captainName}`}
      />

      <div className="p-8 max-w-5xl mx-auto space-y-6">
        {/* Navigation Breadcrumb & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/forms"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại danh sách biểu mẫu</span>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>In Biểu Mẫu / PDF</span>
            </button>
            <StatusBadge status={form.status} className="text-xs px-3 py-1.5" />
          </div>
        </div>

        {/* Toast Notification */}
        {notification && (
          <div
            className={`p-4 rounded-xl border flex items-center gap-3 text-xs font-semibold shadow-xs ${
              notification.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        )}

        {/* Approval Panel */}
        <div className="bg-white rounded-xl border border-blue-200 p-5 shadow-xs bg-gradient-to-br from-white to-blue-50/20">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <ShieldCheck className="w-4.5 h-4.5 text-blue-600" />
                Quy Trình Thẩm Định & Phê Duyệt Của Cán Bộ Cảng Cá
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Cán bộ có quyền nhập mở rộng các phần nghiệp vụ (Phần B, C của M01; cân thực tế M02; nghề khác M03) và phê duyệt
              </p>
            </div>
            {form.reviewedAt && (
              <span className="text-xs text-slate-500">
                Đã xử lý lúc: <strong>{formatDate(form.reviewedAt)}</strong> bởi <strong>{form.reviewedBy}</strong>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cán bộ thẩm định:
              </label>
              <input
                type="text"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                disabled={form.status === 'APPROVED'}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500/20 bg-white"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ý kiến kết luận / Lý do yêu cầu chỉnh sửa:
              </label>
              <input
                type="text"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                disabled={form.status === 'APPROVED'}
                placeholder="Nhập ghi chú phê duyệt hoặc lý do từ chối biểu mẫu..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500/20 bg-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => handleReview('REJECT')}
              disabled={processing || form.status === 'REJECTED'}
              className="px-4 py-2 rounded-lg border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <XCircle className="w-4 h-4 text-rose-600" />
              <span>Từ chối / Yêu cầu khai lại</span>
            </button>

            <button
              onClick={() => handleReview('APPROVE')}
              disabled={processing || form.status === 'APPROVED'}
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Phê duyệt & Lưu trữ biểu mẫu</span>
            </button>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            FORM RENDERING & EXPANDED INPUT SECTIONS
        ───────────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-8 shadow-xs space-y-8 font-sans">
          {/* Header Quốc hiệu & Tiêu ngữ */}
          <div className="text-center space-y-1 pb-6 border-b border-slate-200">
            <h4 className="text-xs font-bold tracking-widest text-slate-800 uppercase">
              Cộng Hòa Xã Hội Chủ Nghĩa Việt Nam
            </h4>
            <p className="text-xs font-semibold text-slate-600 underline underline-offset-4">
              Độc lập - Tự do - Hạnh phúc
            </p>
            <div className="pt-4">
              <span className="inline-block px-2.5 py-1 rounded bg-slate-100 font-bold text-slate-700 text-xs mb-1">
                {form.formCode === 'M01' && 'Mẫu số 01 - Phụ lục II Thông tư số /2025/TT-BNNMT'}
                {form.formCode === 'M02' && 'Mẫu số 02 - Phụ lục II Thông tư số /2025/TT-BNNMT'}
                {form.formCode === 'M03' && 'Mẫu số 03 - Phụ lục II Thông tư số /2025/TT-BNNMT'}
                {form.formCode === 'NKKT' && 'Mẫu số 01 - Phụ lục I Thông tư số 01/2022/TT-BNNPTNT'}
              </span>
              <h2 className="text-lg font-bold text-slate-900 uppercase tracking-tight">
                {form.formTitle}
              </h2>
              {d.inspectionNumber && (
                <p className="text-xs font-mono text-slate-500 mt-0.5">Số: {d.inspectionNumber}</p>
              )}
              {d.receiptNumber && (
                <p className="text-xs font-mono text-slate-500 mt-0.5">Số: {d.receiptNumber}</p>
              )}
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────
              MẪU 01: MỞ RỘNG ĐẦY ĐỦ PHẦN A, PHẦN B VÀ PHẦN C
          ───────────────────────────────────────────────────────── */}
          {form.formCode === 'M01' && (
            <div className="space-y-6">
              {/* Tab Selector for M01 */}
              <div className="flex border-b border-slate-200 gap-2">
                <button
                  onClick={() => setM01Tab('A')}
                  className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
                    m01Tab === 'A'
                      ? 'border-blue-600 text-blue-700 bg-blue-50/40 rounded-t-lg'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Phần A: Thông Tin Bốc Dỡ & Người Mua (Ngư dân)
                </button>
                <button
                  onClick={() => setM01Tab('B')}
                  className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                    m01Tab === 'B'
                      ? 'border-blue-600 text-blue-700 bg-blue-50/40 rounded-t-lg'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span>Phần B: Xác Nhận Khối Lượng Còn Lại (Cảng cá)</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-100 text-amber-800">Cán bộ nhập</span>
                </button>
                <button
                  onClick={() => setM01Tab('C')}
                  className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                    m01Tab === 'C'
                      ? 'border-blue-600 text-blue-700 bg-blue-50/40 rounded-t-lg'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span>Phần C: Chứng Nhận COA Hoa Kỳ</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-purple-100 text-purple-800">Chi cục Thủy sản</span>
                </button>
              </div>

              {/* ── TAB A: THÔNG TIN BIÊN NHẬN ── */}
              {m01Tab === 'A' && (
                <div className="space-y-6">
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
                    <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wide">
                      A. Thông Tin Biên Nhận
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-xs">
                      <div>1. Họ và tên thuyền trưởng: <strong>{d.captainName || form.captainName}</strong></div>
                      <div>2. Số định danh cá nhân (CCCD): <strong>{d.captainIdNumber || '—'}</strong></div>
                      <div>3. Số đăng ký tàu: <strong className="font-mono text-blue-700">{d.vesselRegistration || form.vesselRegistration}</strong></div>
                      <div>4. Số GPKT: <strong>{d.fishingLicenseNumber || '—'}</strong> (Hạn: {d.fishingLicenseExpiry || '—'})</div>
                      <div>5. Ngày bốc dỡ thủy sản: <strong>{d.issuanceDate || formatDate(form.submittedAt)}</strong></div>
                      <div>6. Chiều dài tàu: <strong>{d.vesselLength ? `${d.vesselLength} m` : '—'}</strong> ({d.lengthCategory || 'từ 15m trở lên'})</div>
                      <div className="md:col-span-2">7. Ngư cụ sử dụng: <strong>{d.gearUsed || 'Lưới vây cá nổi nhỏ'}</strong></div>
                    </div>
                  </div>

                  {/* Mục 8: Bảng sản lượng */}
                  <div>
                    <h4 className="font-bold text-xs text-slate-800 uppercase mb-2">
                      8. Chi Tiết Sản Lượng Thủy Sản Khai Thác Bốc Dỡ
                    </h4>
                    <table className="w-full text-left text-xs border border-slate-200">
                      <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="p-2.5 border-r border-slate-200 text-center w-12">TT</th>
                          <th className="p-2.5 border-r border-slate-200">Tên Loài Thủy Sản</th>
                          <th className="p-2.5 border-r border-slate-200 text-right">Khối Lượng Bốc Dỡ (kg) (1)</th>
                          <th className="p-2.5 text-right">Khối Lượng Đã Mua (kg) (2)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {Array.isArray(d.speciesList) && d.speciesList.length > 0 ? (
                          d.speciesList.map((sp: any, idx: number) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="p-2 text-center border-r border-slate-200 font-medium text-slate-500">
                                {idx + 1}
                              </td>
                              <td className="p-2 border-r border-slate-200 font-semibold text-slate-800">
                                {sp.speciesName} {sp.speciesCode ? `(${sp.speciesCode})` : ''}
                              </td>
                              <td className="p-2 border-r border-slate-200 text-right font-mono font-bold text-slate-900">
                                {formatWeight(sp.harvestedQuantity)}
                              </td>
                              <td className="p-2 text-right font-mono font-bold text-blue-700">
                                {formatWeight(sp.purchasedQuantity)}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="p-4 text-center text-slate-400">Chưa có danh sách chi tiết loài.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Mục 9: Đơn vị thu mua */}
                  <div className="bg-amber-50/70 p-4 rounded-lg border border-amber-200/90 space-y-2">
                    <h4 className="font-bold text-xs text-amber-900 uppercase flex items-center gap-1.5">
                      <Building className="w-4 h-4 text-amber-700" />
                      9. Tên Tổ Chức, Cá Nhân Thu Mua Sản Phẩm & Địa Chỉ
                    </h4>
                    <div className="text-xs space-y-1 pl-5">
                      <div>
                        <span className="text-slate-600">Tên tổ chức, cá nhân:</span>{' '}
                        <strong className="text-slate-900">{d.buyerName || 'Chưa ghi nhận'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-600">Địa chỉ thu mua:</span>{' '}
                        <strong className="text-slate-900">{d.buyerAddress || 'Chưa ghi nhận'}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB B: MỞ RỘNG PHẦN B (XÁC NHẬN CÒN LẠI CHO CẢNG CÁ) ── */}
              {m01Tab === 'B' && (
                <div className="space-y-6">
                  <div className="p-4 rounded-lg bg-blue-50/60 border border-blue-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-blue-900 uppercase tracking-wide">
                        B. Xác Nhận Khối Lượng Thủy Sản Khai Thác Còn Lại (Cảng Cá)
                      </h4>
                      <span className="text-[11px] text-blue-600 font-medium">
                        Quy định khi cấp Giấy xác nhận NLTS chưa hết khối lượng biên nhận
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Tổ chức quản lý Cảng cá:
                        </label>
                        <input
                          type="text"
                          value={secBPortName}
                          onChange={(e) => setSecBPortName(e.target.value)}
                          className="w-full px-3 py-1.5 rounded border border-slate-300 text-xs bg-white"
                          placeholder="VD: Ban quản lý Cảng cá Tịnh Kỳ"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Cấp Giấy xác nhận NLTS số:
                        </label>
                        <input
                          type="text"
                          value={secBNumber}
                          onChange={(e) => setSecBNumber(e.target.value)}
                          className="w-full px-3 py-1.5 rounded border border-slate-300 text-xs bg-white font-mono"
                          placeholder="VD: XNNL-2026-00412"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Ngày xác nhận:
                        </label>
                        <input
                          type="date"
                          value={secBDate}
                          onChange={(e) => setSecBDate(e.target.value)}
                          className="w-full px-3 py-1.5 rounded border border-slate-300 text-xs bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bảng nhập Phần B */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-bold text-xs text-slate-800 uppercase">
                        Bảng Thống Kê Khối Lượng Xác Nhận & Còn Lại
                      </h5>
                      <button
                        type="button"
                        onClick={() =>
                          setSecBItems((prev) => [
                            ...prev,
                            { speciesName: '', purchasedQuantity: 0, confirmedQuantity: 0, remainingQuantity: 0 },
                          ])
                        }
                        className="px-2.5 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-semibold flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Thêm dòng loài</span>
                      </button>
                    </div>

                    <table className="w-full text-left text-xs border border-slate-200">
                      <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="p-2.5 border-r border-slate-200 text-center w-10">TT</th>
                          <th className="p-2.5 border-r border-slate-200">Tên Loài Thủy Sản</th>
                          <th className="p-2.5 border-r border-slate-200 w-36">KL Đã Thu Mua (kg)</th>
                          <th className="p-2.5 border-r border-slate-200 w-36">KL Đã Xác Nhận (kg)</th>
                          <th className="p-2.5 w-36">KL Còn Lại (kg)</th>
                          <th className="p-2.5 text-center w-12">Xóa</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {secBItems.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2 text-center border-r border-slate-200 font-medium text-slate-500">
                              {idx + 1}
                            </td>
                            <td className="p-2 border-r border-slate-200">
                              <input
                                type="text"
                                value={item.speciesName}
                                onChange={(e) => {
                                  const next = [...secBItems];
                                  next[idx].speciesName = e.target.value;
                                  setSecBItems(next);
                                }}
                                className="w-full px-2 py-1 rounded border border-slate-200 text-xs"
                                placeholder="Nhập tên loài..."
                              />
                            </td>
                            <td className="p-2 border-r border-slate-200">
                              <input
                                type="number"
                                value={item.purchasedQuantity}
                                onChange={(e) => {
                                  const next = [...secBItems];
                                  const val = Number(e.target.value) || 0;
                                  next[idx].purchasedQuantity = val;
                                  next[idx].remainingQuantity = Math.max(0, val - (Number(next[idx].confirmedQuantity) || 0));
                                  setSecBItems(next);
                                }}
                                className="w-full px-2 py-1 rounded border border-slate-200 text-xs font-mono"
                              />
                            </td>
                            <td className="p-2 border-r border-slate-200">
                              <input
                                type="number"
                                value={item.confirmedQuantity}
                                onChange={(e) => {
                                  const next = [...secBItems];
                                  const val = Number(e.target.value) || 0;
                                  next[idx].confirmedQuantity = val;
                                  next[idx].remainingQuantity = Math.max(0, (Number(next[idx].purchasedQuantity) || 0) - val);
                                  setSecBItems(next);
                                }}
                                className="w-full px-2 py-1 rounded border border-blue-300 text-xs font-mono font-bold text-blue-800 bg-blue-50/50"
                              />
                            </td>
                            <td className="p-2 font-mono font-bold text-emerald-700 bg-emerald-50/30">
                              {item.remainingQuantity} kg
                            </td>
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => setSecBItems((prev) => prev.filter((_, i) => i !== idx))}
                                className="text-rose-500 hover:text-rose-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="flex justify-end mt-4">
                      <button
                        type="button"
                        onClick={handleSaveSectionB}
                        className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
                      >
                        <Save className="w-4 h-4" />
                        <span>Lưu Xác Nhận Phần B</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB C: MỞ RỘNG PHẦN C (CHỨNG NHẬN COA HOA KỲ) ── */}
              {m01Tab === 'C' && (
                <div className="space-y-6">
                  <div className="p-4 rounded-lg bg-purple-50/60 border border-purple-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-purple-900 uppercase tracking-wide">
                        C. Chứng Nhận Khối Lượng Thủy Sản Còn Lại (Xuất Khẩu Hoa Kỳ - COA)
                      </h4>
                      <span className="text-[11px] text-purple-700 font-medium">
                        Cơ quan có thẩm quyền cấp sau khi cấp Giấy COA Hoa Kỳ
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Cơ quan có thẩm quyền chứng nhận:
                        </label>
                        <input
                          type="text"
                          value={secCAuthority}
                          onChange={(e) => setSecCAuthority(e.target.value)}
                          className="w-full px-3 py-1.5 rounded border border-slate-300 text-xs bg-white"
                          placeholder="VD: Chi cục Thủy sản Quảng Ngãi"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Cấp Giấy chứng nhận COA số:
                        </label>
                        <input
                          type="text"
                          value={secCCoaNumber}
                          onChange={(e) => setSecCCoaNumber(e.target.value)}
                          className="w-full px-3 py-1.5 rounded border border-slate-300 text-xs bg-white font-mono"
                          placeholder="VD: COA-US-2026-0889"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Ngày chứng nhận COA:
                        </label>
                        <input
                          type="date"
                          value={secCCoaDate}
                          onChange={(e) => setSecCCoaDate(e.target.value)}
                          className="w-full px-3 py-1.5 rounded border border-slate-300 text-xs bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bảng nhập Phần C */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-bold text-xs text-slate-800 uppercase">
                        Bảng Chứng Nhận Khối Lượng COA
                      </h5>
                      <button
                        type="button"
                        onClick={() =>
                          setSecCItems((prev) => [
                            ...prev,
                            { speciesName: '', previousRemainingQuantity: 0, certifiedQuantity: 0, remainingAfterCertification: 0 },
                          ])
                        }
                        className="px-2.5 py-1 rounded bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 text-xs font-semibold flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Thêm dòng loài COA</span>
                      </button>
                    </div>

                    <table className="w-full text-left text-xs border border-slate-200">
                      <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="p-2.5 border-r border-slate-200 text-center w-10">TT</th>
                          <th className="p-2.5 border-r border-slate-200">Tên Loài Thủy Sản</th>
                          <th className="p-2.5 border-r border-slate-200 w-40">KL Còn Lại Lần Trước (kg)</th>
                          <th className="p-2.5 border-r border-slate-200 w-40">KL Đã Chứng Nhận COA (kg)</th>
                          <th className="p-2.5 w-40">KL Còn Lại Sau Cấp (kg)</th>
                          <th className="p-2.5 text-center w-12">Xóa</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {secCItems.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2 text-center border-r border-slate-200 font-medium text-slate-500">
                              {idx + 1}
                            </td>
                            <td className="p-2 border-r border-slate-200">
                              <input
                                type="text"
                                value={item.speciesName}
                                onChange={(e) => {
                                  const next = [...secCItems];
                                  next[idx].speciesName = e.target.value;
                                  setSecCItems(next);
                                }}
                                className="w-full px-2 py-1 rounded border border-slate-200 text-xs"
                                placeholder="Nhập tên loài..."
                              />
                            </td>
                            <td className="p-2 border-r border-slate-200">
                              <input
                                type="number"
                                value={item.previousRemainingQuantity}
                                onChange={(e) => {
                                  const next = [...secCItems];
                                  const val = Number(e.target.value) || 0;
                                  next[idx].previousRemainingQuantity = val;
                                  next[idx].remainingAfterCertification = Math.max(0, val - (Number(next[idx].certifiedQuantity) || 0));
                                  setSecCItems(next);
                                }}
                                className="w-full px-2 py-1 rounded border border-slate-200 text-xs font-mono"
                              />
                            </td>
                            <td className="p-2 border-r border-slate-200">
                              <input
                                type="number"
                                value={item.certifiedQuantity}
                                onChange={(e) => {
                                  const next = [...secCItems];
                                  const val = Number(e.target.value) || 0;
                                  next[idx].certifiedQuantity = val;
                                  next[idx].remainingAfterCertification = Math.max(0, (Number(next[idx].previousRemainingQuantity) || 0) - val);
                                  setSecCItems(next);
                                }}
                                className="w-full px-2 py-1 rounded border border-purple-300 text-xs font-mono font-bold text-purple-800 bg-purple-50/50"
                              />
                            </td>
                            <td className="p-2 font-mono font-bold text-emerald-700 bg-emerald-50/30">
                              {item.remainingAfterCertification} kg
                            </td>
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => setSecCItems((prev) => prev.filter((_, i) => i !== idx))}
                                className="text-rose-500 hover:text-rose-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="flex justify-end mt-4">
                      <button
                        type="button"
                        onClick={handleSaveSectionC}
                        className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
                      >
                        <Save className="w-4 h-4" />
                        <span>Lưu Chứng Nhận COA Phần C</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────
              MẪU 02: BIÊN BẢN KIỂM TRA TÀU CÁ CẬP CẢNG (BQL CẢNG CÁ)
          ───────────────────────────────────────────────────────── */}
          {form.formCode === 'M02' && (
            <div className="space-y-6 text-xs">
              <div className="p-3 bg-blue-50/70 rounded-lg border border-blue-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-blue-900 uppercase">Biên Bản Kiểm Tra Tàu Cá Cập Cảng</span>
                  <p className="text-[11px] text-blue-700">Mục này do Cán bộ Kiểm soát Cảng cá nhập và ban hành theo Thông tư 01/2022/TT-BNNPTNT.</p>
                </div>
                <span className="px-2 py-1 rounded bg-blue-100 text-blue-800 font-bold text-[11px]">Tổ Kiểm Soát Cảng Cá</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div>Cảng cá kiểm tra: <strong>{d.portName || 'Cảng cá Tịnh Kỳ'}</strong></div>
                <div>Thời gian: <strong>{formatDate(d.inspectionTime || form.submittedAt)}</strong></div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Đơn vị kiểm tra:</label>
                  <input
                    type="text"
                    value={m02InspectionUnit}
                    onChange={(e) => setM02InspectionUnit(e.target.value)}
                    className="w-full px-2.5 py-1 rounded border border-slate-300 text-xs bg-white text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Thành viên kiểm tra (phân cách bằng dấu chấm phẩy):</label>
                  <input
                    type="text"
                    value={m02Inspectors}
                    onChange={(e) => setM02Inspectors(e.target.value)}
                    className="w-full px-2.5 py-1 rounded border border-slate-300 text-xs bg-white text-slate-800"
                  />
                </div>
              </div>

              {/* Mục 3: Hồ sơ */}
              <div className="border border-slate-200 p-4 rounded-lg space-y-2">
                <h4 className="font-bold text-xs text-slate-800 uppercase">3. Kiểm Tra Hồ Sơ</h4>
                <div className="flex gap-8">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={m02DocFishingReport}
                      onChange={(e) => setM02DocFishingReport(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span className="text-slate-800 font-medium">Báo cáo khai thác thủy sản</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={m02DocFishingLogbook}
                      onChange={(e) => setM02DocFishingLogbook(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span className="text-slate-800 font-medium">Nhật ký khai thác thủy sản (Điện tử)</span>
                  </label>
                </div>
              </div>

              {/* Mục 4: Bảng kiểm tra sản lượng chi tiết từng loài (Mở rộng cho Cán bộ nhập) */}
              <div className="border border-slate-200 p-4 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-slate-800 uppercase flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-blue-600" />
                    4. Đối Soát Sản Lượng Báo Cáo vs Cân Thực Tế Từng Loài Tại Bến
                  </h4>
                  <button
                    type="button"
                    onClick={() =>
                      setM02Checks((prev) => [
                        ...prev,
                        { speciesName: '', reportedQuantity: 0, actualQuantity: 0 },
                      ])
                    }
                    className="px-2 py-1 rounded bg-blue-50 text-blue-700 text-xs font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Thêm loài
                  </button>
                </div>

                <table className="w-full text-left text-xs border border-slate-200">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-2 border-r border-slate-200 w-10 text-center">TT</th>
                      <th className="p-2 border-r border-slate-200">Tên Loài Thủy Sản</th>
                      <th className="p-2 border-r border-slate-200 w-40 text-right">SL Báo Cáo (kg)</th>
                      <th className="p-2 border-r border-slate-200 w-40 text-right">SL Cân Thực Tế (kg)</th>
                      <th className="p-2 text-right w-36">Chênh Lệch</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {m02Checks.map((item, idx) => {
                      const rep = Number(item.reportedQuantity) || 0;
                      const act = Number(item.actualQuantity) || 0;
                      const diff = act - rep;
                      const pct = rep > 0 ? ((diff / rep) * 100).toFixed(1) : '0';
                      return (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2 border-r border-slate-200 text-center text-slate-500 font-medium">
                            {idx + 1}
                          </td>
                          <td className="p-2 border-r border-slate-200 font-semibold">
                            <input
                              type="text"
                              value={item.speciesName}
                              onChange={(e) => {
                                const next = [...m02Checks];
                                next[idx].speciesName = e.target.value;
                                setM02Checks(next);
                              }}
                              className="w-full px-2 py-0.5 rounded border border-slate-200 text-xs"
                            />
                          </td>
                          <td className="p-2 border-r border-slate-200 text-right">
                            <input
                              type="number"
                              value={item.reportedQuantity}
                              onChange={(e) => {
                                const next = [...m02Checks];
                                next[idx].reportedQuantity = Number(e.target.value) || 0;
                                setM02Checks(next);
                              }}
                              className="w-28 text-right px-2 py-0.5 rounded border border-slate-200 text-xs font-mono"
                            />
                          </td>
                          <td className="p-2 border-r border-slate-200 text-right">
                            <input
                              type="number"
                              value={item.actualQuantity}
                              onChange={(e) => {
                                const next = [...m02Checks];
                                next[idx].actualQuantity = Number(e.target.value) || 0;
                                setM02Checks(next);
                              }}
                              className="w-28 text-right px-2 py-0.5 rounded border border-blue-300 font-bold text-blue-900 bg-blue-50/40 text-xs font-mono"
                            />
                          </td>
                          <td className="p-2 text-right font-mono font-bold">
                            <span className={Math.abs(Number(pct)) > 15 ? 'text-rose-600' : 'text-emerald-700'}>
                              {diff > 0 ? `+${diff}` : diff} kg ({pct}%)
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mục 5: Kết luận & Ký ban hành */}
              <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200 space-y-3">
                <h4 className="font-bold text-xs text-emerald-900 uppercase">5. Kết Luận Kiểm Tra Của Tổ Kiểm Soát Cảng Cá</h4>
                <textarea
                  value={m02Conclusion}
                  onChange={(e) => setM02Conclusion(e.target.value)}
                  className="w-full p-2 rounded border border-emerald-300 text-xs bg-white text-emerald-900 font-medium"
                  rows={2}
                  placeholder="Ghi rõ kết luận kiểm tra..."
                />
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleSaveM02}
                    className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
                  >
                    <Save className="w-4 h-4" />
                    <span>Lưu & Ký Ban Hành Biên Bản Cập Cảng M02</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────
              MẪU 03: MỞ RỘNG NGHỀ KHÁC & ĐOÀN KIỂM TRA
          ───────────────────────────────────────────────────────── */}
          {form.formCode === 'M03' && (
            <div className="space-y-6 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div>Cảng cá: <strong>{d.portName || 'Cảng cá Cát Lở'}</strong></div>
                <div>Thời gian: <strong>{formatDate(d.inspectionTime || form.submittedAt)}</strong></div>
                <div>Tàu cá: <strong className="font-mono text-blue-700">{d.vesselRegistration || form.vesselRegistration}</strong></div>
                <div>Thuyền trưởng: <strong>{d.captainName || form.captainName}</strong></div>
                <div>Số lượng thuyền viên: <strong>{d.crewCount || 12} người</strong></div>
                <div>Đơn vị kiểm tra: <strong>{d.inspectionUnit || 'Tổ kiểm soát Cảng cá'}</strong></div>
              </div>

              {/* Mục 3: 8 Loại Giấy Tờ */}
              <div className="border border-slate-200 p-4 rounded-lg space-y-2">
                <h4 className="font-bold text-xs text-slate-800 uppercase">
                  3. Kiểm Tra Hồ Sơ Tàu Cá (8 Loại Giấy Tờ Bắt Buộc)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {[
                    { key: 'vesselRegistration', label: '1. Giấy chứng nhận đăng ký tàu cá' },
                    { key: 'crewList', label: '2. Sổ danh bạ thuyền viên tàu cá' },
                    { key: 'technicalSafetyCertificate', label: '3. Giấy chứng nhận an toàn kỹ thuật' },
                    { key: 'captainQualification', label: '4. Văn bằng, chứng chỉ thuyền trưởng' },
                    { key: 'fishingLicense', label: '5. Giấy phép khai thác thủy sản' },
                    { key: 'chiefEngineerQualification', label: '6. Văn bằng, chứng chỉ máy trưởng' },
                    { key: 'fishingLogbookOrPurchase', label: '7. Nhật ký khai thác / thu mua' },
                    { key: 'foodSafetyCertificate', label: '8. Giấy chứng nhận an toàn thực phẩm' },
                  ].map((doc) => {
                    const isChecked = d.documents?.[doc.key] !== false;
                    return (
                      <div key={doc.key} className="flex items-center gap-2 p-1.5 bg-slate-50 rounded">
                        <span className={`w-4 h-4 rounded flex items-center justify-center text-white ${isChecked ? 'bg-emerald-600' : 'bg-rose-500'}`}>
                          {isChecked ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        </span>
                        <span className={isChecked ? 'text-slate-800 font-medium' : 'text-rose-600 font-medium'}>
                          {doc.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Mục 4.1: Trang thiết bị */}
              <div className="border border-slate-200 p-4 rounded-lg space-y-2">
                <h4 className="font-bold text-xs text-slate-800 uppercase">
                  4.1 Trang Thiết Bị Trên Tàu (Đạt &apos;Đ&apos; / Thiếu &apos;T&apos;)
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { key: 'navigationEquipment', label: 'Hàng hải' },
                    { key: 'lifesavingFirefighting', label: 'Cứu sinh, cứu hỏa' },
                    { key: 'communicationSignaling', label: 'Thông tin liên lạc' },
                    { key: 'vesselMonitoring', label: 'Giám sát VMS' },
                  ].map((eq) => (
                    <div key={eq.key} className="p-2.5 bg-slate-50 rounded border border-slate-200 text-center">
                      <div className="text-[11px] text-slate-500">{eq.label}</div>
                      <div className="text-sm font-bold text-emerald-700 mt-1">ĐẠT (Đ)</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mục 4.2: Nghề khai thác & Mở rộng trường Nghề Khác */}
              <div className="border border-slate-200 p-4 rounded-lg space-y-2">
                <h4 className="font-bold text-xs text-slate-800 uppercase">
                  4.2 Loại Nghề Khai Thác Thủy Sản & Đánh Dấu Tàu Cá
                </h4>
                <div className="flex flex-wrap gap-2">
                  {(d.fishingOccupations || ['PURSE_SEINE', 'VESSEL_MARKING']).map((occ: string) => (
                    <span key={occ} className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md font-semibold text-xs border border-blue-200">
                      {occ}
                    </span>
                  ))}
                </div>

                {/* Ô mở rộng Nghề khác */}
                <div className="mt-3 pt-2 border-t border-slate-100">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Nghề khác (Ghi rõ chi tiết nếu có):
                  </label>
                  <input
                    type="text"
                    value={m03OtherOccupation}
                    onChange={(e) => setM03OtherOccupation(e.target.value)}
                    className="w-full px-3 py-1.5 rounded border border-slate-300 text-xs bg-white"
                    placeholder="VD: Nghề câu kết hợp bẫy lồng tôm hùm giống..."
                  />
                </div>
              </div>

              {/* Mục 6: Kết luận & Ký cấp phép rời cảng */}
              <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200 space-y-3">
                <h4 className="font-bold text-xs text-emerald-900 uppercase">6. Kết Luận Của Tổ Kiểm Soát Cảng Cá</h4>
                <textarea
                  value={m03Conclusion}
                  onChange={(e) => setM03Conclusion(e.target.value)}
                  className="w-full p-2 rounded border border-emerald-300 text-xs bg-white text-emerald-900 font-medium"
                  rows={2}
                  placeholder="Ghi rõ kết luận kiểm tra rời cảng..."
                />
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleSaveM03}
                    className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
                  >
                    <Save className="w-4 h-4" />
                    <span>Lưu & Ký Cấp Phép Rời Cảng M03</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────
              NKKT: NHẬT KÝ KHAI THÁC THỦY SẢN (PL I)
          ───────────────────────────────────────────────────────── */}
          {form.formCode === 'NKKT' && (
            <div className="space-y-6 text-xs">
              <div className="p-4 bg-blue-50/60 rounded-lg border border-blue-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-blue-700 font-semibold uppercase">Mã định danh chuyến biển:</span>
                  <div className="text-base font-mono font-bold text-blue-900 mt-0.5">
                    {d.tripIdentifier || '(QNg-90345-KT-06-25)'}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-500">Nghề chính:</span>
                  <div className="font-bold text-slate-800">{d.mainOccupation || 'Lưới vây'}</div>
                </div>
              </div>

              {/* Phần I: Mẻ khai thác */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs text-slate-800 uppercase">
                  I. Nhật Ký Các Mẻ Khai Thác Trên Biển
                </h4>
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 font-semibold text-slate-700">
                      <tr>
                        <th className="p-2 border-r border-slate-200">Mẻ</th>
                        <th className="p-2 border-r border-slate-200">Thời gian thả & Tọa độ</th>
                        <th className="p-2 border-r border-slate-200">Thời gian thu & Tọa độ</th>
                        <th className="p-2 text-right">Sản lượng (kg)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {Array.isArray(d.operationsSummary) && d.operationsSummary.length > 0 ? (
                        d.operationsSummary.map((op: any, i: number) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="p-2 border-r border-slate-200 font-bold text-center">#{op.operationNo || i + 1}</td>
                            <td className="p-2 border-r border-slate-200">
                              {op.settingTime} • <span className="font-mono text-blue-700">{op.settingLatitude}, {op.settingLongitude}</span>
                            </td>
                            <td className="p-2 border-r border-slate-200">
                              {op.haulingTime} • <span className="font-mono text-blue-700">{op.haulingLatitude}, {op.haulingLongitude}</span>
                            </td>
                            <td className="p-2 text-right font-mono font-bold text-slate-900">
                              {formatWeight(op.totalCatchKg)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-slate-400">Không có dữ liệu mẻ lưới.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Phần I.2: Sinh vật nguy cấp CITES */}
              {Array.isArray(d.endangeredSpecies) && d.endangeredSpecies.length > 0 && (
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 space-y-2">
                  <h4 className="font-bold text-xs text-amber-900 uppercase flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-700" />
                    I.2 Bắt Gặp Sinh Vật Nguy Cấp, Quý, Hiếm (CITES / IUU)
                  </h4>
                  {d.endangeredSpecies.map((item: any, idx: number) => (
                    <div key={idx} className="bg-white p-3 rounded border border-amber-200 text-xs space-y-1">
                      <div>Loài: <strong className="text-amber-900">{item.speciesName}</strong></div>
                      <div>Số lượng: <strong>{item.estimatedCount} con</strong> • Khối lượng ước tính: <strong>{item.estimatedWeightKg} kg</strong></div>
                      <div>Tình trạng: <strong className="text-emerald-700">{item.condition}</strong> • Giai đoạn: <strong>{item.stage}</strong></div>
                      <div className="text-slate-600 italic">Chi tiết xử lý: {item.extraNotes}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Vào sổ cảng cá & Xác nhận của BQL Cảng cá */}
              <div className="p-4 bg-blue-50/60 rounded-lg border border-blue-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-blue-900 uppercase tracking-wide flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-700" />
                    II. Xác Nhận Tiếp Nhận & Vào Sổ Lưu Trữ Của Cảng Cá
                  </h4>
                  <span className="text-[11px] text-blue-600 font-medium">
                    Do Cán bộ Kiểm soát Cảng cá thực hiện khi tiếp nhận nhật ký
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Số vào sổ Cảng cá:
                    </label>
                    <input
                      type="text"
                      value={logbookNumber}
                      onChange={(e) => setLogbookNumber(e.target.value)}
                      placeholder="VD: SO-LBN-2026-0158"
                      className="w-full px-3 py-1.5 rounded border border-slate-300 font-mono text-xs bg-white text-slate-900 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Cán bộ tiếp nhận & kiểm tra:
                    </label>
                    <input
                      type="text"
                      value={reviewerName}
                      onChange={(e) => setReviewerName(e.target.value)}
                      className="w-full px-3 py-1.5 rounded border border-slate-300 text-xs bg-white text-slate-900"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleSaveNKKTLogbook}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
                  >
                    <Save className="w-4 h-4" />
                    <span>Lưu Số Sổ & Xác Nhận Cảng Cá</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
