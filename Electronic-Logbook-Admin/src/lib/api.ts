import {
  FormSubmissionSummary,
  VesselSummary,
  FishingTripSummary,
  DashboardStats,
  FormStatus,
  FormCode,
  UserAccount,
  CreateUserInput,
  UserRole,
  UserStatus,
} from './types';
import { MOCK_STATS, MOCK_VESSELS, MOCK_TRIPS, MOCK_FORM_SUBMISSIONS, MOCK_USERS } from './mock-data';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3030/api';

// Helper to get Bearer token from localStorage for authenticated API calls
function getAuthHeaders(): Record<string, string> {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('elogbook_admin_token');
    if (token && !token.startsWith('mock-')) {
      return { Authorization: `Bearer ${token}` };
    }
  }
  return {};
}

// In-memory store for client-side approval/rejection and data extension operations
let formStore: FormSubmissionSummary[] = [...MOCK_FORM_SUBMISSIONS];

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const res = await fetch(`${API_BASE_URL}/regulatory-forms/stats`, {
      cache: 'no-store',
      headers: { ...getAuthHeaders() },
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Backend offline fallback
  }

  const pendingCount = formStore.filter((f) => f.status === 'SUBMITTED').length;
  return {
    ...MOCK_STATS,
    pendingFormsCount: pendingCount,
  };
}

export async function getFormSubmissions(filters?: {
  formCode?: FormCode | 'ALL';
  status?: FormStatus | 'ALL';
  search?: string;
}): Promise<FormSubmissionSummary[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.formCode && filters.formCode !== 'ALL') params.append('formCode', filters.formCode);
    if (filters?.status && filters.status !== 'ALL') params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);

    const res = await fetch(`${API_BASE_URL}/electronic-logbook/form-submissions?${params.toString()}`, {
      cache: 'no-store',
      headers: { ...getAuthHeaders() },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        const mapped: FormSubmissionSummary[] = data.map((sub: any) => ({
          id: sub.id,
          formCode: (sub.formDefinition?.formCode || sub.formCode || 'NKKT') as FormCode,
          formTitle: sub.formDefinition?.name || sub.formTitle || 'Nhật ký khai thác thủy sản',
          status: (sub.status || 'SUBMITTED') as FormStatus,
          vesselId: sub.vesselId || sub.vessel?.id || '',
          vesselRegistration: sub.vessel?.registrationNumber || sub.vesselRegistration || 'QNg-90345-TS',
          vesselName: sub.vessel?.vesselName || sub.vesselName || 'Hải Đông 01',
          captainName: sub.fishingTrip?.captainName || sub.captainName || 'Nguyễn Văn Hùng',
          submittedAt: sub.submittedAt || sub.createdAt || new Date().toISOString(),
          reviewedAt: sub.approvedAt || sub.rejectedAt || sub.reviewedAt,
          reviewedBy: sub.reviewedBy,
          reviewNotes: sub.rejectionReason || sub.reviewNotes,
          tripId: sub.fishingTripId || sub.tripId,
          data: sub.data?.data || sub.data || {},
        }));

        let list = [
          ...mapped,
          ...formStore.filter((f) => !mapped.some((m) => m.id === f.id)),
        ];

        if (filters?.formCode && filters.formCode !== 'ALL') {
          list = list.filter((f) => f.formCode === filters.formCode);
        }
        if (filters?.status && filters.status !== 'ALL') {
          list = list.filter((f) => f.status === filters.status);
        }
        if (filters?.search) {
          const q = filters.search.toLowerCase();
          list = list.filter(
            (f) =>
              f.vesselRegistration.toLowerCase().includes(q) ||
              f.captainName.toLowerCase().includes(q) ||
              f.formTitle.toLowerCase().includes(q)
          );
        }
        return list;
      }
    }
  } catch {
    // Backend offline fallback
  }

  let list = [...formStore];
  if (filters?.formCode && filters.formCode !== 'ALL') {
    list = list.filter((f) => f.formCode === filters.formCode);
  }
  if (filters?.status && filters.status !== 'ALL') {
    list = list.filter((f) => f.status === filters.status);
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    list = list.filter(
      (f) =>
        f.vesselRegistration.toLowerCase().includes(q) ||
        f.captainName.toLowerCase().includes(q) ||
        f.formTitle.toLowerCase().includes(q)
    );
  }
  return list;
}

export async function getFormSubmissionById(id: string): Promise<FormSubmissionSummary | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/electronic-logbook/form-submissions/${id}`, {
      cache: 'no-store',
      headers: { ...getAuthHeaders() },
    });
    if (res.ok) {
      const sub = await res.json();
      return {
        id: sub.id,
        formCode: (sub.formDefinition?.formCode || sub.formCode || 'NKKT') as FormCode,
        formTitle: sub.formDefinition?.name || sub.formTitle || 'Nhật ký khai thác thủy sản',
        status: (sub.status || 'SUBMITTED') as FormStatus,
        vesselId: sub.vesselId || sub.vessel?.id || '',
        vesselRegistration: sub.vessel?.registrationNumber || sub.vesselRegistration || 'QNg-90345-TS',
        vesselName: sub.vessel?.vesselName || sub.vesselName || 'Hải Đông 01',
        captainName: sub.fishingTrip?.captainName || sub.captainName || 'Nguyễn Văn Hùng',
        submittedAt: sub.submittedAt || sub.createdAt || new Date().toISOString(),
        reviewedAt: sub.approvedAt || sub.rejectedAt || sub.reviewedAt,
        reviewedBy: sub.reviewedBy,
        reviewNotes: sub.rejectionReason || sub.reviewNotes,
        tripId: sub.fishingTripId || sub.tripId,
        data: sub.data?.data || sub.data || {},
      };
    }
  } catch {
    // Backend offline fallback
  }

  const item = formStore.find((f) => f.id === id);
  return item || null;
}

export async function reviewFormSubmission(
  id: string,
  action: 'APPROVE' | 'REJECT',
  reviewNotes?: string,
  reviewerName: string = 'Phan Minh Đức',
  additionalData?: Record<string, any>
): Promise<{ ok: boolean; message: string; form?: FormSubmissionSummary }> {
  try {
    const endpoint = action === 'APPROVE' ? 'approve' : 'reject';
    const res = await fetch(`${API_BASE_URL}/electronic-logbook/form-submissions/${id}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ reason: reviewNotes }),
    });
    if (res.ok) {
      const updated = await res.json();
      return {
        ok: true,
        message: action === 'APPROVE' ? 'Đã phê duyệt biểu mẫu thành công qua API!' : 'Đã từ chối biểu mẫu.',
        form: updated,
      };
    }
  } catch {
    // fallback
  }

  const index = formStore.findIndex((f) => f.id === id);
  if (index === -1) {
    return { ok: false, message: 'Không tìm thấy hồ sơ biểu mẫu' };
  }

  const currentData = formStore[index].data || {};
  const mergedData = additionalData ? { ...currentData, ...additionalData } : currentData;

  formStore[index] = {
    ...formStore[index],
    status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
    reviewedAt: new Date().toISOString(),
    reviewedBy: reviewerName,
    reviewNotes: reviewNotes || (action === 'APPROVE' ? 'Đã xác nhận đầy đủ tính hợp pháp' : 'Yêu cầu cập nhật lại số liệu'),
    data: mergedData,
  };

  return {
    ok: true,
    message: action === 'APPROVE' ? 'Đã phê duyệt và lưu trữ toàn bộ dữ liệu biểu mẫu!' : 'Đã từ chối và gửi phản hồi đến chủ tàu/thuyền trưởng.',
    form: formStore[index],
  };
}

export async function saveFormData(
  id: string,
  updatedData: Record<string, any>
): Promise<{ ok: boolean; message: string; form?: FormSubmissionSummary }> {
  try {
    const res = await fetch(`${API_BASE_URL}/electronic-logbook/form-submissions/${id}/data`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ data: updatedData }),
    });
    if (res.ok) {
      const updated = await res.json();
      return {
        ok: true,
        message: 'Đã lưu cập nhật dữ liệu mở rộng thành công lên Server!',
        form: updated,
      };
    }
  } catch {
    // fallback
  }

  const index = formStore.findIndex((f) => f.id === id);
  if (index === -1) return { ok: false, message: 'Không tìm thấy biểu mẫu' };

  formStore[index] = {
    ...formStore[index],
    data: {
      ...formStore[index].data,
      ...updatedData,
    },
  };

  return {
    ok: true,
    message: 'Đã lưu cập nhật dữ liệu mở rộng thành công!',
    form: formStore[index],
  };
}

export async function getVessels(): Promise<VesselSummary[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/electronic-logbook/vessels`, {
      cache: 'no-store',
      headers: { ...getAuthHeaders() },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch {}
  return MOCK_VESSELS;
}

export async function getTrips(): Promise<FishingTripSummary[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/electronic-logbook/fishing-trips`, {
      cache: 'no-store',
      headers: { ...getAuthHeaders() },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch {}
  return MOCK_TRIPS;
}

// ─── User & Account Management ───────────────────────────────────────────────

let userStore: UserAccount[] = [...MOCK_USERS];

export async function getUsers(filters?: {
  role?: UserRole | 'ALL';
  status?: UserStatus | 'ALL';
  accountType?: string | 'ALL';
  search?: string;
}): Promise<UserAccount[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/logbook/accounts`, {
      cache: 'no-store',
      headers: { ...getAuthHeaders() },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        // Map backend account structure to UserAccount
        const mapped: UserAccount[] = data.map((acc: any) => {
          const primaryId = acc.identifiers?.find((i: any) => i.isPrimary) || acc.identifiers?.[0];
          return {
            id: acc.id,
            fullName: acc.profile?.fullName || (acc.systemRole === 'super_admin' ? 'Quản trị viên Hệ thống' : 'Người dùng eLogbook'),
            identifier: primaryId?.value || '—',
            identifierType: primaryId?.type || 'EMAIL',
            systemRole: (acc.systemRole || 'user') as UserRole,
            accountType: (acc.accountType || 'STAFF') as any,
            status: (acc.status || 'ACTIVE') as UserStatus,
            createdAt: acc.createdAt || new Date().toISOString(),
            lastLoginAt: acc.lastLoginAt,
          };
        });
        userStore = mapped;
      }
    }
  } catch {
    // Backend offline / dev fallback
  }

  let list = [...userStore];
  if (filters?.role && filters.role !== 'ALL') {
    list = list.filter((u) => u.systemRole === filters.role);
  }
  if (filters?.status && filters.status !== 'ALL') {
    list = list.filter((u) => u.status === filters.status);
  }
  if (filters?.accountType && filters.accountType !== 'ALL') {
    list = list.filter((u) => u.accountType === filters.accountType);
  }
  if (filters?.search && filters.search.trim()) {
    const q = filters.search.toLowerCase().trim();
    list = list.filter(
      (u) =>
        u.fullName.toLowerCase().includes(q) ||
        u.identifier.toLowerCase().includes(q) ||
        (u.organization && u.organization.toLowerCase().includes(q)) ||
        (u.vesselRegistration && u.vesselRegistration.toLowerCase().includes(q))
    );
  }

  return list;
}

export async function createUser(input: CreateUserInput): Promise<UserAccount> {
  const newUser: UserAccount = {
    id: `user-${Date.now()}`,
    fullName: input.fullName.trim(),
    identifier: input.identifier.trim(),
    identifierType: input.identifierType,
    systemRole: input.systemRole,
    accountType: input.accountType,
    status: 'ACTIVE',
    organization: input.organization?.trim() || (input.accountType === 'STAFF' ? 'Ban Quản lý Cảng cá' : 'Đội tàu khai thác'),
    vesselRegistration: input.vesselRegistration?.trim() || undefined,
    createdAt: new Date().toISOString(),
    lastLoginAt: null,
  };

  try {
    const res = await fetch(`${API_BASE_URL}/logbook/accounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({
        accountType: input.accountType,
        systemRole: input.systemRole,
        fullName: input.fullName,
        identifier: input.identifier,
        identifierType: input.identifierType,
        password: input.password || 'Password@123',
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.id) newUser.id = data.id;
    }
  } catch {
    // Store locally on fallback
  }

  userStore = [newUser, ...userStore];
  return newUser;
}

export async function updateUser(
  id: string,
  updates: Partial<UserAccount>
): Promise<UserAccount> {
  const index = userStore.findIndex((u) => u.id === id);
  if (index === -1) throw new Error('Không tìm thấy tài khoản');

  const updated: UserAccount = {
    ...userStore[index],
    ...updates,
  };
  userStore[index] = updated;

  try {
    await fetch(`${API_BASE_URL}/logbook/accounts/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({
        systemRole: updates.systemRole,
        status: updates.status,
        accountType: updates.accountType,
      }),
    });
  } catch {
    // Offline fallback
  }

  return updated;
}

export async function toggleUserStatus(id: string): Promise<UserAccount> {
  const user = userStore.find((u) => u.id === id);
  if (!user) throw new Error('Không tìm thấy tài khoản');
  const nextStatus: UserStatus = user.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
  return updateUser(id, { status: nextStatus });
}

export async function resetUserPassword(
  id: string
): Promise<{ success: boolean; tempPassword: string }> {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
  let tempPassword = 'P@';
  for (let i = 0; i < 8; i++) {
    tempPassword += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  // Call backend if available
  try {
    await fetch(`${API_BASE_URL}/logbook/accounts/${id}/reset-password`, {
      method: 'POST',
      headers: { ...getAuthHeaders() },
    });
  } catch {
    // Dev fallback
  }

  return { success: true, tempPassword };
}

export async function deleteUser(id: string): Promise<boolean> {
  userStore = userStore.filter((u) => u.id !== id);
  try {
    await fetch(`${API_BASE_URL}/logbook/accounts/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() },
    });
  } catch {}
  return true;
}
