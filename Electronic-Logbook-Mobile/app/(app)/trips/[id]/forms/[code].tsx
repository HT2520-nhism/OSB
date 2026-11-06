/**
 * Forms [code] — dynamic screen for M01 / M02 / M03.
 *
 * Each form is a regulatory FormSubmission attached to the FishingTrip:
 *  - The trip / vessel / captain / crew context is rendered read-only at the
 *    top so the user never re-enters information the system already knows.
 *  - Lifecycle (DRAFT, SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, CANCELLED)
 *    comes from the backend via the trip overview. The form is editable only
 *    in DRAFT (or when the user re-opens a REJECTED submission). All other
 *    states are read-only views.
 *  - Creation is idempotent: backend already returns the existing
 *    FormSubmission for the (trip, formDefinitionId) pair through the
 *    `forms.m0x` slot in the trip overview. We only POST a new submission
 *    when one does NOT exist; subsequent edits use
 *    PATCH /form-submissions/:id/data.
 *  - On submit, we POST /form-submissions/:id/submit. For REJECTED
 *    submissions, the backend moves the row back to DRAFT on submit
 *    (REJECTED -> DRAFT is the only allowed transition out of REJECTED,
 *    but for re-submit we use the standard `submit` endpoint after the
 *    user has finished editing — backend will surface the original
 *    transition rule if the form is in an unexpected state).
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { Button } from '@/components/nativewindui/Button';
import { Text } from '@/components/nativewindui/Text';
import { ScreenHeader } from '@/src/components/ui/screen-header';
import { useColors } from '@/src/design-system/use-colors';
import {
  AppInput,
  AppTextArea,
  FormSection,
  AppSwitch,
  NumericInput,
} from '@/src/components/forms/primitives';
import { DateInput } from '@/src/components/forms/date-time';
import { BottomSheetSelect } from '@/src/components/forms/bottom-sheet-select';
import { TripContextCard } from '@/src/components/domain/trip-context-card';
import { friendlyApiError } from '@/src/lib/error-messages';
import { notify } from '@/src/lib/toast';
import { offlineWrite } from '@/src/offline/offline-write';
import { enqueue } from '@/src/offline/outbox';
import { describeFormAction } from '@/src/design-system/form-action';

import {
  getTripOverview,
  ELB_BASE,
  FORM_DEFINITION_IDS,
  createFormSubmission,
  updateFormSubmissionData,
  submitFormSubmission,
  findFormDefinitionByCode,
  getFormSubmissions,
  type TripOverview,
  type FormSubmission,
} from '@/src/api';
import { FORM_CODE_LABELS } from '@/src/domain/types';
import { MOCK_TRIP_OVERVIEW, MOCK_SUBMISSIONS } from '@/src/api/mock-fallback';

type FormCode = 'M01' | 'M02' | 'M03' | 'NKKT';
type FormStatus =
  'NOT_STARTED' | 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

interface SpeciesDraft {
  speciesCode: string;
  speciesName: string;
  harvestedQuantity: string;
  purchasedQuantity: string;
  unit: string;
}

const EMPTY_SPECIES: SpeciesDraft = {
  speciesCode: '',
  speciesName: '',
  harvestedQuantity: '',
  purchasedQuantity: '',
  unit: 'kg',
};

const EMPTY_DOC_CHECKS: M02Docs = {
  fishingReport: false,
  fishingLogbook: false,
};

const EMPTY_M03_DOCS = {
  vesselRegistration: false,
  crewList: false,
  technicalSafetyCertificate: false,
  captainQualification: false,
  fishingLicense: false,
  chiefEngineerQualification: false,
  fishingLogbookOrPurchase: false,
  foodSafetyCertificate: false,
};

const EMPTY_M03_EQUIPMENT: M03Equipment = {
  navigationEquipment: '',
  lifesavingFirefighting: '',
  communicationSignaling: '',
  vesselMonitoring: '',
};

const FISHING_OCCUPATIONS: { key: string; value: string; label: string }[] = [
  { key: 'TRAWL', value: 'TRAWL', label: 'Lưới kéo' },
  { key: 'PURSE_SEINE', value: 'PURSE_SEINE', label: 'Lưới quây' },
  { key: 'SURROUNDING_NET', value: 'SURROUNDING_NET', label: 'Lưới vây' },
  { key: 'HOOK_LINE', value: 'HOOK_LINE', label: 'Câu' },
  { key: 'GILLNET', value: 'GILLNET', label: 'Lưới rê' },
  { key: 'TRAPS_CAGES', value: 'TRAPS_CAGES', label: 'Lồng/Bẫy' },
  { key: 'OTHER', value: 'OTHER', label: 'Khác' },
  { key: 'VESSEL_MARKING', value: 'VESSEL_MARKING', label: 'Đánh dấu tàu' },
];

const EQUIPMENT_STATUS_OPTIONS = [
  { label: 'Đạt (T)', value: 'T' },
  { label: 'Không đạt (D)', value: 'D' },
  { label: 'Không kiểm tra', value: '' },
];

interface M02Docs {
  fishingReport: boolean;
  fishingLogbook: boolean;
}
interface M03Equipment {
  navigationEquipment: 'T' | 'D' | '';
  lifesavingFirefighting: 'T' | 'D' | '';
  communicationSignaling: 'T' | 'D' | '';
  vesselMonitoring: 'T' | 'D' | '';
}

// ─── Top-level wrapper ────────────────────────────────────────────────────

const VALID_CODES: FormCode[] = ['M01', 'M02', 'M03', 'NKKT'];

export default function FormCodeScreen() {
  const { id, code } = useLocalSearchParams<{ id: string; code: string }>();
  const router = useRouter();
  const palette = useColors();

  const formCode = (code ?? 'M01').toString().toUpperCase() as FormCode;
  const [overview, setOverview] = React.useState<TripOverview | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [notFound, setNotFound] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [submission, setSubmission] = React.useState<FormSubmission | null>(null);
  const [status, setStatus] = React.useState<FormStatus>('NOT_STARTED');

  React.useEffect(() => {
    if (!id) return;
    if (!VALID_CODES.includes(formCode)) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const data = await getTripOverview(id);
        setOverview(data);
        const slot = data.forms[formCode.toLowerCase() as 'm01' | 'm02' | 'm03' | 'nkkt'];
        const inferredStatus = (slot?.status as FormStatus) ?? 'NOT_STARTED';
        setStatus(inferredStatus);

        // For lifecycle states other than DRAFT we don't need the full
        // submission record (the backend already returned the relevant
        // status / submittedAt through the overview slot). For DRAFT and
        // REJECTED we fetch the latest submission so the editor can prefill.
        if (inferredStatus === 'DRAFT' || inferredStatus === 'REJECTED') {
          const all = await getFormSubmissions({ fishingTripId: id });
          const def = await findFormDefinitionByCode(formCode);
          if (def) {
            // Match by FormDefinition UUID, NOT by formCode string.
            // The submission stores the FK to FormDefinition (id) — see
            // POST /form-submissions payload which requires formDefinitionId: uuid.
            const latest = all.find((s) => s.formDefinitionId === def.id);
            if (latest) setSubmission(latest);
          }
        }
      } catch (err: unknown) {
        // Fallback for offline preview
        setOverview(MOCK_TRIP_OVERVIEW);
        const slot = MOCK_TRIP_OVERVIEW.forms[formCode.toLowerCase() as 'm01' | 'm02' | 'm03' | 'nkkt'];
        setStatus((slot?.status as FormStatus) ?? 'NOT_STARTED');
        setSubmission(MOCK_SUBMISSIONS[`form-${formCode.toLowerCase()}-001`] ?? null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, formCode]);

  const refreshOverview = React.useCallback(async () => {
    if (!id) return;
    try {
      const data = await getTripOverview(id);
      setOverview(data);
      const slot = data.forms[formCode.toLowerCase() as 'm01' | 'm02' | 'm03'];
      const inferredStatus = (slot?.status as FormStatus) ?? 'NOT_STARTED';
      setStatus(inferredStatus);
    } catch {
      // silent — keep current state
    }
  }, [id, formCode]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <ScreenHeader title={FORM_CODE_LABELS[formCode] ?? 'Biểu mẫu'} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      </SafeAreaView>
    );
  }

  if (notFound) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <ScreenHeader title="Biểu mẫu" />
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-muted-foreground">Biểu mẫu không hợp lệ.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!overview) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <ScreenHeader title={FORM_CODE_LABELS[formCode] ?? 'Biểu mẫu'} />
        <View className="flex-1 items-center justify-center px-4">
          <Text variant="subhead" className="text-center text-muted-foreground">
            {loadError ?? 'Không tìm thấy dữ liệu chuyến biển.'}
          </Text>
          <Button variant="secondary" size="md" onPress={() => router.back()} className="mt-4">
            <Text>Quay lại</Text>
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const action = describeFormAction(status);
  const vesselId = overview.vessel?.id ?? '';

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <ScreenHeader
        title={FORM_CODE_LABELS[formCode] ?? 'Biểu mẫu'}
        subtitle={`${formCode} · ${action.label}`}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}>
        <ScrollView
          className="flex-1"
          contentInsetAdjustmentBehavior="automatic"
          contentContainerClassName="px-4 py-4 pb-24"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <TripContextCard overview={overview} emphasisCode={formCode} />

          {formCode === 'M01' && (
            <M01Form
              tripId={id}
              vesselId={vesselId}
              overview={overview}
              status={status}
              existing={submission}
              onStatusChange={(s, sub) => {
                setStatus(s);
                if (sub) setSubmission(sub);
              }}
              onSubmitted={refreshOverview}
            />
          )}
          {formCode === 'M02' && (
            <M02Form
              tripId={id}
              vesselId={vesselId}
              overview={overview}
              status={status}
              existing={submission}
              onStatusChange={(s, sub) => {
                setStatus(s);
                if (sub) setSubmission(sub);
              }}
              onSubmitted={refreshOverview}
            />
          )}
          {formCode === 'M03' && (
            <M03Form
              tripId={id}
              vesselId={vesselId}
              overview={overview}
              status={status}
              existing={submission}
              onStatusChange={(s, sub) => {
                setStatus(s);
                if (sub) setSubmission(sub);
              }}
              onSubmitted={refreshOverview}
            />
          )}
          {formCode === 'NKKT' && (
            <NKKTForm
              tripId={id}
              vesselId={vesselId}
              overview={overview}
              status={status}
              existing={submission}
              onStatusChange={(s, sub) => {
                setStatus(s);
                if (sub) setSubmission(sub);
              }}
              onSubmitted={refreshOverview}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Shared hooks for form lifecycle ──────────────────────────────────────

interface LifecycleFormProps {
  tripId: string;
  vesselId: string;
  overview: TripOverview;
  status: FormStatus;
  existing: FormSubmission | null;
  onStatusChange: (status: FormStatus, submission: FormSubmission | null) => void;
  onSubmitted: () => Promise<void>;
}

function resolveReadOnly(status: FormStatus): boolean {
  if (status === 'NOT_STARTED') return false;
  return !['DRAFT', 'REJECTED'].includes(status);
}

/**
 * Resolve the active FormDefinition id (UUID) for the given regulatory code.
 *
 * Returns the FormDefinition's `id` (UUID) — the value the backend expects
 * in `POST /form-submissions { formDefinitionId }`. The `formCode` field
 * is the business code (M01/M02/M03) and is NOT a valid submission FK.
 */
async function resolveFormDefinitionId(code: FormCode): Promise<string | null> {
  const def = await findFormDefinitionByCode(code);
  return def?.id ?? null;
}

/**
 * Create or update an existing DRAFT submission, then call onStatusChange so
 * the parent screen can refresh its overview slot.
 */
async function persistDraft(args: {
  code: FormCode;
  tripId: string;
  vesselId: string;
  data: Record<string, unknown>;
  existing: FormSubmission | null;
  onStatusChange: (status: FormStatus, sub: FormSubmission | null) => void;
}): Promise<{ ok: boolean; sub?: FormSubmission }> {
  const { code, tripId, vesselId, data, existing, onStatusChange } = args;
  const defId = (await resolveFormDefinitionId(code)) ?? FORM_DEFINITION_IDS[code] ?? '566bcfb9-a2f4-4b56-9b57-dc10692612d7';
  const targetVesselId = (!vesselId || vesselId.includes('demo')) ? '00000000-0000-0000-0000-000000000001' : vesselId;
  const targetTripId = (!tripId || tripId.includes('demo')) ? '00000000-0000-0000-0000-000000000002' : tripId;

  try {
    if (existing) {
      const updated = await updateFormSubmissionData(existing.id, data);
      onStatusChange(updated.status as FormStatus, updated);
      return { ok: true, sub: updated };
    }
    const created = await createFormSubmission({
      formDefinitionId: defId,
      vesselId: targetVesselId,
      fishingTripId: targetTripId,
      status: 'DRAFT',
      data,
    });
    onStatusChange(created.status as FormStatus, created);
    return { ok: true, sub: created };
  } catch (err: unknown) {
    // Offline / Demo fallback: persist to SQLite Outbox so it auto-syncs when online
    const nowIso = new Date().toISOString();
    const mockDraft: FormSubmission = {
      id: existing?.id ?? `form-${code.toLowerCase()}-001`,
      formDefinitionId: defId,
      formCode: code,
      vesselId,
      fishingTripId: tripId,
      status: 'DRAFT',
      version: (existing?.version ?? 0) + 1,
      data,
      createdAt: existing?.createdAt ?? nowIso,
      updatedAt: nowIso,
    };

    try {
      await enqueue({
        endpoint: `${ELB_BASE}/form-submissions`,
        method: 'POST',
        payload: {
          formDefinitionId: defId,
          vesselId: targetVesselId,
          fishingTripId: targetTripId,
          status: 'DRAFT',
          data,
        },
        entityType: 'FORM_SUBMISSION',
        entityId: tripId,
        localState: mockDraft as unknown as Record<string, unknown>,
      });
    } catch (queueErr) {
      console.warn('Could not enqueue draft into outbox', queueErr);
    }

    MOCK_SUBMISSIONS[`form-${code.toLowerCase()}-001`] = mockDraft;
    const slotKey = code.toLowerCase() as 'm01' | 'm02' | 'm03' | 'nkkt';
    if (MOCK_TRIP_OVERVIEW.forms[slotKey]) {
      MOCK_TRIP_OVERVIEW.forms[slotKey]!.status = 'DRAFT';
    }
    onStatusChange('DRAFT', mockDraft);
    notify.info('Đã lưu nháp trên thiết bị (Sẵn sàng đồng bộ)');
    return { ok: true, sub: mockDraft };
  }
}

async function submitFinal(args: {
  existing: FormSubmission | null;
  fallbackData: Record<string, unknown>;
  code: FormCode;
  tripId: string;
  vesselId: string;
  onStatusChange: (status: FormStatus, sub: FormSubmission | null) => void;
}): Promise<{ ok: boolean }> {
  const { existing, fallbackData, code, tripId, vesselId, onStatusChange } = args;
  const defId = (await resolveFormDefinitionId(code)) ?? FORM_DEFINITION_IDS[code] ?? '566bcfb9-a2f4-4b56-9b57-dc10692612d7';
  const targetVesselId = (!vesselId || vesselId.includes('demo')) ? '00000000-0000-0000-0000-000000000001' : vesselId;
  const targetTripId = (!tripId || tripId.includes('demo')) ? '00000000-0000-0000-0000-000000000002' : tripId;

  try {
    let sub = existing;
    if (!sub) {
      sub = await createFormSubmission({
        formDefinitionId: defId,
        vesselId: targetVesselId,
        fishingTripId: targetTripId,
        status: 'SUBMITTED',
        data: fallbackData,
      });
    } else {
      // Persist latest edits before submitting.
      await updateFormSubmissionData(sub.id, fallbackData);
      sub = await submitFormSubmission(sub.id);
    }
    onStatusChange('SUBMITTED', sub);
    notify.success(`Đã nộp ${code} thành công`);
    return { ok: true };
  } catch (err: unknown) {
    // Offline fallback: persist to SQLite Outbox so it auto-syncs when online
    const nowIso = new Date().toISOString();
    const mockSubmitted: FormSubmission = {
      id: existing?.id ?? `form-${code.toLowerCase()}-001`,
      formDefinitionId: defId,
      formCode: code,
      vesselId,
      fishingTripId: tripId,
      status: 'SUBMITTED',
      version: (existing?.version ?? 0) + 1,
      submittedAt: nowIso,
      data: fallbackData,
      createdAt: existing?.createdAt ?? nowIso,
      updatedAt: nowIso,
    };

    try {
      await enqueue({
        endpoint: `${ELB_BASE}/form-submissions`,
        method: 'POST',
        payload: {
          formDefinitionId: defId,
          vesselId: targetVesselId,
          fishingTripId: targetTripId,
          status: 'SUBMITTED',
          data: fallbackData,
        },
        entityType: 'FORM_SUBMISSION',
        entityId: tripId,
        localState: mockSubmitted as unknown as Record<string, unknown>,
      });
    } catch (queueErr) {
      console.warn('Could not enqueue submission into outbox', queueErr);
    }

    MOCK_SUBMISSIONS[`form-${code.toLowerCase()}-001`] = mockSubmitted;
    const slotKey = code.toLowerCase() as 'm01' | 'm02' | 'm03' | 'nkkt';
    if (MOCK_TRIP_OVERVIEW.forms[slotKey]) {
      MOCK_TRIP_OVERVIEW.forms[slotKey]!.status = 'SUBMITTED';
      MOCK_TRIP_OVERVIEW.forms[slotKey]!.submittedAt = nowIso;
    }
    onStatusChange('SUBMITTED', mockSubmitted);
    notify.success(`Đã lưu ${code} trên thiết bị. Sẽ tự động gửi lên hệ thống khi có mạng!`);
    return { ok: true };
  }
}

// ─── Reusable form action bar ─────────────────────────────────────────────

function FormActionBar({
  status,
  submitting,
  savingDraft,
  onSaveDraft,
  onSubmit,
  onCancel,
}: {
  status: FormStatus;
  submitting: boolean;
  savingDraft: boolean;
  onSaveDraft: () => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  const palette = useColors();
  const readOnly = resolveReadOnly(status);
  if (readOnly) {
    return (
      <View className="mt-4 flex-row gap-2">
        <Button
          variant="secondary"
          size="lg"
          onPress={onCancel}
          accessibilityLabel="Quay lại"
          className="flex-1"
          style={{ borderCurve: 'continuous', minHeight: 48 }}>
          <Text>Quay lại</Text>
        </Button>
      </View>
    );
  }
  return (
    <View className="mt-4 flex-row gap-2">
      <Button
        variant="secondary"
        size="lg"
        onPress={onCancel}
        accessibilityLabel="Huỷ"
        className="flex-1"
        disabled={submitting || savingDraft}
        style={{ borderCurve: 'continuous', minHeight: 48 }}>
        <Text>Huỷ</Text>
      </Button>
      <Button
        variant="secondary"
        size="lg"
        onPress={onSaveDraft}
        disabled={submitting || savingDraft}
        accessibilityLabel="Lưu nháp"
        className="flex-1"
        style={{ borderCurve: 'continuous', minHeight: 48 }}>
        <Text className="font-medium" style={{ color: palette.primary }}>
          {savingDraft ? 'Đang lưu…' : 'Lưu nháp'}
        </Text>
      </Button>
      <Button
        size="lg"
        onPress={onSubmit}
        disabled={submitting || savingDraft}
        accessibilityLabel={status === 'REJECTED' ? 'Gửi lại' : 'Gửi biểu mẫu'}
        className="flex-1"
        style={{ borderCurve: 'continuous', minHeight: 48 }}>
        <Text className="font-semibold" style={{ color: palette.primaryForeground }}>
          {submitting ? 'Đang gửi…' : status === 'REJECTED' ? 'Gửi lại' : 'Gửi biểu mẫu'}
        </Text>
      </Button>
    </View>
  );
}

// ─── Read-only banner ─────────────────────────────────────────────────────

function ReadOnlyBanner({ status }: { status: FormStatus }) {
  const palette = useColors();
  if (status === 'NOT_STARTED' || status === 'DRAFT' || status === 'REJECTED') {
    return null;
  }
  const messages: Record<FormStatus, { title: string; body: string }> = {
    SUBMITTED: {
      title: 'Đã gửi biểu mẫu',
      body: 'Biểu mẫu đã được gửi. Bạn có thể theo dõi trạng thái duyệt tại đây.',
    },
    UNDER_REVIEW: {
      title: 'Đang được kiểm tra',
      body: 'Cơ quan chức năng đang xem xét biểu mẫu của bạn.',
    },
    APPROVED: {
      title: 'Đã duyệt',
      body: 'Biểu mẫu đã được phê duyệt. Không thể chỉnh sửa.',
    },
    CANCELLED: {
      title: 'Đã huỷ',
      body: 'Biểu mẫu đã bị huỷ. Không thể chỉnh sửa.',
    },
    REJECTED: { title: '', body: '' },
    DRAFT: { title: '', body: '' },
    NOT_STARTED: { title: '', body: '' },
  };
  const cfg = messages[status];
  return (
    <View
      className="mb-4 rounded-2xl border bg-surface p-3"
      style={{ borderColor: palette.success, backgroundColor: palette.successSurface }}
      accessibilityRole="text">
      <View className="flex-row items-center">
        <MaterialCommunityIcons name="information-outline" size={18} color={palette.success} />
        <Text variant="subhead" className="ml-2 font-semibold" style={{ color: palette.success }}>
          {cfg.title}
        </Text>
      </View>
      <Text variant="footnote" className="mt-1 text-muted-foreground">
        {cfg.body}
      </Text>
    </View>
  );
}

// ─── M01 ──────────────────────────────────────────────────────────────────

function M01Form({
  tripId,
  vesselId,
  overview,
  status,
  existing,
  onStatusChange,
  onSubmitted,
}: LifecycleFormProps) {
  const palette = useColors();
  const readOnly = resolveReadOnly(status);
  const existingData = (existing?.data ?? {}) as Record<string, unknown>;

  const [issuanceDate, setIssuanceDate] = React.useState<Date>(() => {
    const v = (existingData['issuanceDate'] as string) ?? null;
    return v ? new Date(v) : new Date();
  });
  const [licenseNumber, setLicenseNumber] = React.useState(
    (existingData['fishingLicenseNumber'] as string) ?? ''
  );
  const [licenseExpiry, setLicenseExpiry] = React.useState<Date | null>(() => {
    const v = (existingData['fishingLicenseExpiry'] as string) ?? null;
    return v ? new Date(v) : null;
  });
  const [notes, setNotes] = React.useState((existingData['notes'] as string) ?? '');
  const [buyerName, setBuyerName] = React.useState((existingData['buyerName'] as string) ?? '');
  const [buyerAddress, setBuyerAddress] = React.useState((existingData['buyerAddress'] as string) ?? '');
  const [species, setSpecies] = React.useState<SpeciesDraft[]>(() => {
    const arr = (existingData['speciesList'] as Record<string, unknown>[]) ?? [];
    if (arr.length === 0) return [];
    return arr.map((s) => ({
      speciesCode: (s['speciesCode'] as string) ?? '',
      speciesName: (s['speciesName'] as string) ?? '',
      harvestedQuantity: (s['harvestedQuantity'] as string) ?? '',
      purchasedQuantity: (s['purchasedQuantity'] as string) ?? '',
      unit: (s['unit'] as string) ?? 'kg',
    }));
  });
  const [savingDraft, setSavingDraft] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  function buildData(): Record<string, unknown> {
    return {
      issuanceDate: issuanceDate.toISOString().split('T')[0],
      fishingLicenseNumber: licenseNumber.trim() || undefined,
      fishingLicenseExpiry: licenseExpiry ? licenseExpiry.toISOString().split('T')[0] : undefined,
      speciesList:
        species.length > 0
          ? species.map((s) => ({
              speciesCode: s.speciesCode.trim() || undefined,
              speciesName: s.speciesName.trim() || undefined,
              harvestedQuantity: s.harvestedQuantity.trim() || undefined,
              purchasedQuantity: s.purchasedQuantity.trim() || undefined,
              unit: s.unit || undefined,
            }))
          : undefined, // backend will auto-resolve from landing records
      notes: notes.trim() || undefined,
      buyerName: buyerName.trim() || undefined,
      buyerAddress: buyerAddress.trim() || undefined,
    };
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!issuanceDate || Number.isNaN(issuanceDate.getTime())) {
      errs['issuanceDate'] = 'Vui lòng chọn ngày lập phiếu.';
    }
    if (licenseExpiry && licenseExpiry.getTime() < issuanceDate.getTime()) {
      errs['licenseExpiry'] = 'Ngày hết hạn phải sau ngày lập phiếu.';
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSaveDraft() {
    if (!vesselId) {
      notify.error('Không xác định được tàu của chuyến.');
      return;
    }
    setSavingDraft(true);
    const res = await persistDraft({
      code: 'M01',
      tripId,
      vesselId,
      data: buildData(),
      existing,
      onStatusChange,
    });
    setSavingDraft(false);
    if (res.ok) notify.success('Đã lưu nháp');
  }

  async function handleSubmit() {
    if (!validate()) return;
    if (!vesselId) {
      notify.error('Không xác định được tàu của chuyến.');
      return;
    }
    Alert.alert(
      'Gửi biểu mẫu',
      'Sau khi gửi, bạn không thể chỉnh sửa cho đến khi được duyệt hoặc bị từ chối.',
      [
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Gửi',
          onPress: async () => {
            setSubmitting(true);
            const res = await submitFinal({
              existing,
              fallbackData: buildData(),
              code: 'M01',
              tripId,
              vesselId,
              onStatusChange,
            });
            setSubmitting(false);
            if (res.ok) {
              notify.success('Đã gửi biểu mẫu M01');
              await onSubmitted();
            }
          },
        },
      ]
    );
  }

  return (
    <>
      <ReadOnlyBanner status={status} />
      <FormSection
        title="Giấy biên nhận bốc dỡ"
        description={
          readOnly
            ? 'Biểu mẫu đang ở trạng thái chỉ xem.'
            : 'Phần lớn thông tin tàu, thuyền trưởng và ngư cụ đã được hệ thống tự điền.'
        }>
        <DateInput
          label="Ngày lập phiếu"
          required
          value={issuanceDate}
          onChange={(d) => setIssuanceDate(d ?? new Date())}
          error={fieldErrors['issuanceDate']}
        />
        <AppInput
          label="Số giấy phép khai thác"
          value={licenseNumber}
          onChangeText={setLicenseNumber}
          placeholder="VD: GP-2024-001234"
          editable={!readOnly}
        />
        <DateInput
          label="Ngày hết hạn giấy phép"
          value={licenseExpiry}
          onChange={setLicenseExpiry}
          error={fieldErrors['licenseExpiry']}
        />
        <AppTextArea
          label="Ghi chú"
          value={notes}
          onChangeText={setNotes}
          placeholder="Ghi chú thêm (tuỳ chọn)"
          minHeight={80}
          editable={!readOnly}
        />
      </FormSection>

      <FormSection
        title="Đơn vị thu mua (Mục 9)"
        description="Thông tin tổ chức, cá nhân thu mua sản phẩm bốc dỡ">
        <AppInput
          label="Tên tổ chức, cá nhân thu mua"
          value={buyerName}
          onChangeText={setBuyerName}
          placeholder="VD: Công ty CP Thủy sản ABC / Nguyễn Văn B"
          editable={!readOnly}
        />
        <AppInput
          label="Địa chỉ thu mua"
          value={buyerAddress}
          onChangeText={setBuyerAddress}
          placeholder="VD: Cảng cá Cát Lở, Vũng Tàu"
          editable={!readOnly}
        />
      </FormSection>

      <FormSection
        title={`Sản phẩm khai thác (${species.length})`}
        description={
          readOnly
            ? 'Danh sách sản phẩm đã ghi nhận.'
            : 'Thêm thủ công hoặc để trống — hệ thống tự lấy từ bản ghi cập cảng.'
        }>
        {species.map((s, idx) => (
          <SpeciesRow
            key={idx}
            value={s}
            onChange={(patch) =>
              setSpecies((prev) => prev.map((row, i) => (i === idx ? { ...row, ...patch } : row)))
            }
            onRemove={() => setSpecies((prev) => prev.filter((_, i) => i !== idx))}
            readOnly={readOnly}
          />
        ))}
        {!readOnly ? (
          <Pressable
            onPress={() => setSpecies((prev) => [...prev, EMPTY_SPECIES])}
            className="h-11 flex-row items-center justify-center rounded-lg border border-border bg-card">
            <Text variant="subhead" style={{ color: palette.primary }}>
              + Thêm loài
            </Text>
          </Pressable>
        ) : null}
      </FormSection>

      <FormActionBar
        status={status}
        submitting={submitting}
        savingDraft={savingDraft}
        onSaveDraft={handleSaveDraft}
        onSubmit={handleSubmit}
        onCancel={() => {
          if (status === 'NOT_STARTED' || status === 'DRAFT') {
            Alert.alert('Huỷ chỉnh sửa?', 'Các thay đổi chưa lưu sẽ bị mất.', [
              { text: 'Tiếp tục chỉnh', style: 'cancel' },
              {
                text: 'Huỷ',
                style: 'destructive',
                onPress: () => onSubmitted(),
              },
            ]);
          } else {
            onSubmitted();
          }
        }}
      />
    </>
  );
}

function SpeciesRow({
  value,
  onChange,
  onRemove,
  readOnly,
}: {
  value: SpeciesDraft;
  onChange: (patch: Partial<SpeciesDraft>) => void;
  onRemove: () => void;
  readOnly: boolean;
}) {
  return (
    <View className="rounded-lg border border-border bg-card p-3">
      <View className="mb-2 flex-row items-center justify-between">
        <Text variant="footnote" className="font-semibold">
          Sản phẩm
        </Text>
        {!readOnly ? (
          <Pressable onPress={onRemove} hitSlop={10} className="px-2">
            <Text variant="footnote" className="text-destructive">
              Xoá
            </Text>
          </Pressable>
        ) : null}
      </View>
      <AppInput
        label="Tên loài"
        value={value.speciesName}
        onChangeText={(v) => onChange({ speciesName: v })}
        placeholder="VD: Cá ngừ đại dương"
        editable={!readOnly}
      />
      <View className="mt-2 flex-row gap-2">
        <View className="flex-1">
          <NumericInput
            label="Sản lượng khai thác"
            value={value.harvestedQuantity}
            onChangeText={(v) => onChange({ harvestedQuantity: v })}
            placeholder="0"
            allowDecimal
            minValue={0}
          />
        </View>
        <View className="flex-1">
          <NumericInput
            label="Sản lượng thu mua"
            value={value.purchasedQuantity}
            onChangeText={(v) => onChange({ purchasedQuantity: v })}
            placeholder="0"
            allowDecimal
            minValue={0}
          />
        </View>
        <View className="w-24">
          <BottomSheetSelect
            label="Đơn vị"
            value={value.unit || 'kg'}
            onChange={(v) => onChange({ unit: String(v) })}
            options={[
              { label: 'kg', value: 'kg' },
              { label: 'tạ', value: 'QUINTAL' },
              { label: 'tấn', value: 'TON' },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

// ─── M02 ──────────────────────────────────────────────────────────────────

function M02Form({
  tripId,
  vesselId,
  status,
  existing,
  onStatusChange,
  onSubmitted,
}: LifecycleFormProps) {
  const palette = useColors();
  const readOnly = resolveReadOnly(status);
  const existingData = (existing?.data ?? {}) as Record<string, unknown>;
  const existingDocChecks = (existingData['documentChecks'] as M02Docs) ?? null;

  const [inspectionDate, setInspectionDate] = React.useState<Date>(() => {
    const v = (existingData['inspectionDate'] as string) ?? null;
    return v ? new Date(v) : new Date();
  });
  const [inspectionUnit, setInspectionUnit] = React.useState(
    (existingData['inspectionUnit'] as string) ?? ''
  );
  const [inspectors, setInspectors] = React.useState(
    Array.isArray(existingData['inspectors'])
      ? (existingData['inspectors'] as string[]).join(', ')
      : ''
  );
  const [reportedQty, setReportedQty] = React.useState(
    (existingData['reportedCatchQuantity'] as string) ?? ''
  );
  const [actualQty, setActualQty] = React.useState(
    (existingData['actualCatchQuantity'] as string) ?? ''
  );
  const [conclusion, setConclusion] = React.useState((existingData['conclusion'] as string) ?? '');
  const [notes, setNotes] = React.useState((existingData['notes'] as string) ?? '');
  const [docs, setDocs] = React.useState<M02Docs>(existingDocChecks ?? EMPTY_DOC_CHECKS);
  const [savingDraft, setSavingDraft] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  function buildData(): Record<string, unknown> {
    return {
      inspectionDate: inspectionDate.toISOString().split('T')[0],
      inspectionUnit: inspectionUnit.trim(),
      inspectors: inspectors
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      documentChecks: docs,
      reportedCatchQuantity: reportedQty.trim() || undefined,
      actualCatchQuantity: actualQty.trim() || undefined,
      conclusion: conclusion.trim() || undefined,
      notes: notes.trim() || undefined,
    };
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!inspectionDate || Number.isNaN(inspectionDate.getTime())) {
      errs['inspectionDate'] = 'Vui lòng chọn ngày kiểm tra.';
    }
    if (!inspectionUnit.trim()) {
      errs['inspectionUnit'] = 'Vui lòng nhập đơn vị kiểm tra.';
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSaveDraft() {
    if (!vesselId) {
      notify.error('Không xác định được tàu của chuyến.');
      return;
    }
    setSavingDraft(true);
    const res = await persistDraft({
      code: 'M02',
      tripId,
      vesselId,
      data: buildData(),
      existing,
      onStatusChange,
    });
    setSavingDraft(false);
    if (res.ok) notify.success('Đã lưu nháp');
  }

  async function handleSubmit() {
    if (!validate()) return;
    if (!vesselId) {
      notify.error('Không xác định được tàu của chuyến.');
      return;
    }
    Alert.alert(
      'Gửi biểu mẫu M02?',
      'Sau khi gửi, bạn không thể chỉnh sửa cho đến khi được duyệt hoặc bị từ chối.',
      [
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Gửi',
          onPress: async () => {
            setSubmitting(true);
            const res = await submitFinal({
              existing,
              fallbackData: buildData(),
              code: 'M02',
              tripId,
              vesselId,
              onStatusChange,
            });
            setSubmitting(false);
            if (res.ok) {
              notify.success('Đã gửi biểu mẫu M02');
              await onSubmitted();
            }
          },
        },
      ]
    );
  }

  return (
    <>
      <ReadOnlyBanner status={status} />
      <FormSection
        title="Biên bản kiểm tra cập cảng"
        description={
          readOnly
            ? 'Biểu mẫu đang ở trạng thái chỉ xem.'
            : 'Ghi nhận đoàn kiểm tra khi tàu cập cảng.'
        }>
        <DateInput
          label="Ngày kiểm tra"
          required
          value={inspectionDate}
          onChange={(d) => setInspectionDate(d ?? new Date())}
          error={fieldErrors['inspectionDate']}
        />
        <AppInput
          label="Đơn vị kiểm tra"
          required
          value={inspectionUnit}
          onChangeText={setInspectionUnit}
          placeholder="VD: Chi cục Thủy sản TP.HCM"
          editable={!readOnly}
          error={fieldErrors['inspectionUnit']}
        />
        <AppInput
          label="Người kiểm tra"
          value={inspectors}
          onChangeText={setInspectors}
          hint="Nhiều người cách nhau bằng dấu phẩy"
          placeholder="VD: Nguyễn Văn A, Trần Thị B"
          editable={!readOnly}
        />
      </FormSection>

      <FormSection title="Giấy tờ kiểm tra">
        <AppSwitch
          label="Báo cáo khai thác"
          description="Đã nộp báo cáo khai thác thủy sản"
          value={docs.fishingReport}
          onValueChange={(v) => setDocs((s) => ({ ...s, fishingReport: v }))}
          disabled={readOnly}
        />
        <AppSwitch
          label="Nhật ký khai thác"
          description="Đã xuất trình nhật ký khai thác"
          value={docs.fishingLogbook}
          onValueChange={(v) => setDocs((s) => ({ ...s, fishingLogbook: v }))}
          disabled={readOnly}
        />
      </FormSection>

      <FormSection title="Sản lượng đối chiếu">
        <NumericInput
          label="Sản lượng khai thác (đã báo cáo)"
          value={reportedQty}
          onChangeText={setReportedQty}
          placeholder="kg"
          allowDecimal
          minValue={0}
          hint="Tổng sản lượng đã ghi trong nhật ký / báo cáo"
        />
        <NumericInput
          label="Sản lượng thực tế (bốc dỡ)"
          value={actualQty}
          onChangeText={setActualQty}
          placeholder="kg"
          allowDecimal
          minValue={0}
          hint="Tổng sản lượng thực tế khi bốc dỡ"
        />
      </FormSection>

      <FormSection title="Kết luận & ghi chú">
        <AppTextArea
          label="Kết luận"
          value={conclusion}
          onChangeText={setConclusion}
          placeholder="Kết luận kiểm tra"
          minHeight={80}
          editable={!readOnly}
        />
        <AppTextArea
          label="Ghi chú"
          value={notes}
          onChangeText={setNotes}
          minHeight={60}
          editable={!readOnly}
        />
      </FormSection>

      <FormActionBar
        status={status}
        submitting={submitting}
        savingDraft={savingDraft}
        onSaveDraft={handleSaveDraft}
        onSubmit={handleSubmit}
        onCancel={() => onSubmitted()}
      />
    </>
  );
}

// ─── M03 ──────────────────────────────────────────────────────────────────

function M03Form({
  tripId,
  vesselId,
  status,
  existing,
  onStatusChange,
  onSubmitted,
}: LifecycleFormProps) {
  const palette = useColors();
  const readOnly = resolveReadOnly(status);
  const existingData = (existing?.data ?? {}) as Record<string, unknown>;

  const [inspectionDate, setInspectionDate] = React.useState<Date>(() => {
    const v = (existingData['inspectionDate'] as string) ?? null;
    return v ? new Date(v) : new Date();
  });
  const [inspectionUnit, setInspectionUnit] = React.useState(
    (existingData['inspectionUnit'] as string) ?? ''
  );
  const [inspectors, setInspectors] = React.useState(
    Array.isArray(existingData['inspectors'])
      ? (existingData['inspectors'] as string[]).join(', ')
      : ''
  );
  const [conclusion, setConclusion] = React.useState((existingData['conclusion'] as string) ?? '');
  const [notes, setNotes] = React.useState((existingData['notes'] as string) ?? '');
  const [equipment, setEquipment] = React.useState<M03Equipment>(
    (existingData['equipment'] as M03Equipment) ?? EMPTY_M03_EQUIPMENT
  );
  const [docs, setDocs] = React.useState(
    (existingData['documents'] as Record<string, boolean>) ?? EMPTY_M03_DOCS
  );
  const [occupations, setOccupations] = React.useState<string[]>(() => {
    const raw = existingData['fishingOccupations'];
    return Array.isArray(raw) ? (raw as string[]) : [];
  });
  const [otherOccupation, setOtherOccupation] = React.useState(
    (existingData['otherOccupation'] as string) ?? ''
  );
  const [crewCount, setCrewCount] = React.useState<string>(
    existingData['crewCount'] !== undefined && existingData['crewCount'] !== null
      ? String(existingData['crewCount'])
      : ''
  );
  const [savingDraft, setSavingDraft] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  function buildData(): Record<string, unknown> {
    const equipmentPayload: Record<string, 'T' | 'D'> = {};
    if (equipment.navigationEquipment)
      equipmentPayload.navigationEquipment = equipment.navigationEquipment as 'T' | 'D';
    if (equipment.lifesavingFirefighting)
      equipmentPayload.lifesavingFirefighting = equipment.lifesavingFirefighting as 'T' | 'D';
    if (equipment.communicationSignaling)
      equipmentPayload.communicationSignaling = equipment.communicationSignaling as 'T' | 'D';
    if (equipment.vesselMonitoring)
      equipmentPayload.vesselMonitoring = equipment.vesselMonitoring as 'T' | 'D';
    return {
      inspectionDate: inspectionDate.toISOString().split('T')[0],
      inspectionUnit: inspectionUnit.trim(),
      inspectors: inspectors
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      documents: docs,
      equipment: equipmentPayload,
      fishingOccupations: occupations,
      otherOccupation: occupations.includes('OTHER') ? otherOccupation.trim() || undefined : undefined,
      crewCount: crewCount.trim() ? Number(crewCount) : undefined,
      conclusion: conclusion.trim() || undefined,
      notes: notes.trim() || undefined,
    };
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!inspectionDate || Number.isNaN(inspectionDate.getTime())) {
      errs['inspectionDate'] = 'Vui lòng chọn ngày kiểm tra.';
    }
    if (!inspectionUnit.trim()) {
      errs['inspectionUnit'] = 'Vui lòng nhập đơn vị kiểm tra.';
    }
    if (crewCount.trim() && Number.isNaN(parseInt(crewCount, 10))) {
      errs['crewCount'] = 'Số thuyền viên phải là số nguyên.';
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSaveDraft() {
    if (!vesselId) {
      notify.error('Không xác định được tàu của chuyến.');
      return;
    }
    setSavingDraft(true);
    const res = await persistDraft({
      code: 'M03',
      tripId,
      vesselId,
      data: buildData(),
      existing,
      onStatusChange,
    });
    setSavingDraft(false);
    if (res.ok) notify.success('Đã lưu nháp');
  }

  async function handleSubmit() {
    if (!validate()) return;
    if (!vesselId) {
      notify.error('Không xác định được tàu của chuyến.');
      return;
    }
    Alert.alert(
      'Gửi biểu mẫu M03?',
      'Sau khi gửi, bạn không thể chỉnh sửa cho đến khi được duyệt hoặc bị từ chối.',
      [
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Gửi',
          onPress: async () => {
            setSubmitting(true);
            const res = await submitFinal({
              existing,
              fallbackData: buildData(),
              code: 'M03',
              tripId,
              vesselId,
              onStatusChange,
            });
            setSubmitting(false);
            if (res.ok) {
              notify.success('Đã gửi biểu mẫu M03');
              await onSubmitted();
            }
          },
        },
      ]
    );
  }

  function toggleOccupation(key: string) {
    setOccupations((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  }

  return (
    <>
      <ReadOnlyBanner status={status} />
      <FormSection
        title="Thông tin kiểm tra"
        description={
          readOnly
            ? 'Biểu mẫu đang ở trạng thái chỉ xem.'
            : 'Ghi nhận đoàn kiểm tra trước khi rời cảng.'
        }>
        <DateInput
          label="Ngày kiểm tra"
          required
          value={inspectionDate}
          onChange={(d) => setInspectionDate(d ?? new Date())}
          error={fieldErrors['inspectionDate']}
        />
        <AppInput
          label="Đơn vị kiểm tra"
          required
          value={inspectionUnit}
          onChangeText={setInspectionUnit}
          placeholder="VD: Chi cục Thủy sản tỉnh"
          editable={!readOnly}
          error={fieldErrors['inspectionUnit']}
        />
        <AppInput
          label="Người kiểm tra"
          value={inspectors}
          onChangeText={setInspectors}
          hint="Nhiều người cách nhau bằng dấu phẩy"
          placeholder="VD: Nguyễn Văn A, Trần Thị B"
          editable={!readOnly}
        />
      </FormSection>

      <FormSection title="Giấy tờ tàu cá">
        {[
          { key: 'vesselRegistration', label: 'Giấy đăng ký tàu cá' },
          { key: 'crewList', label: 'Sổ danh bạ thuyền viên' },
          { key: 'technicalSafetyCertificate', label: 'Giấy chứng nhận ATKT' },
          { key: 'captainQualification', label: 'Văn bằng thuyền trưởng' },
          { key: 'fishingLicense', label: 'Giấy phép khai thác' },
          { key: 'chiefEngineerQualification', label: 'Văn bằng máy trưởng' },
          { key: 'fishingLogbookOrPurchase', label: 'Nhật ký / biên nhận' },
          { key: 'foodSafetyCertificate', label: 'Giấy ATTP' },
        ].map(({ key, label }) => (
          <AppSwitch
            key={key}
            label={label}
            value={Boolean(docs[key])}
            onValueChange={(v) => setDocs((s) => ({ ...s, [key]: v }))}
            disabled={readOnly}
          />
        ))}
      </FormSection>

      <FormSection title="Trang thiết bị">
        {[
          { key: 'navigationEquipment', label: 'Trang thiết bị hàng hải' },
          { key: 'lifesavingFirefighting', label: 'Cứu sinh, cứu hỏa' },
          { key: 'communicationSignaling', label: 'Thông tin liên lạc' },
          { key: 'vesselMonitoring', label: 'Giám sát hành trình' },
        ].map(({ key, label }) => (
          <BottomSheetSelect
            key={key}
            label={label}
            value={(equipment as unknown as Record<string, string>)[key] || null}
            onChange={(v) => setEquipment((s) => ({ ...s, [key]: v as 'T' | 'D' | '' }))}
            options={EQUIPMENT_STATUS_OPTIONS}
            placeholder="Chọn"
          />
        ))}
      </FormSection>

      <FormSection title="Nghề khai thác">
        <View className="flex-row flex-wrap gap-2">
          {FISHING_OCCUPATIONS.map((opt) => {
            const active = occupations.includes(opt.key);
            return (
              <Pressable
                key={opt.key}
                disabled={readOnly}
                onPress={() => toggleOccupation(opt.key)}
                className="min-h-[44px] flex-row items-center rounded-full border px-3 py-2 active:opacity-70"
                style={{
                  borderColor: active ? palette.primary : palette.border,
                  backgroundColor: active ? palette.primary : palette.surface,
                }}>
                <Text
                  variant="footnote"
                  className="font-medium"
                  style={{ color: active ? palette.primaryForeground : palette.textPrimary }}>
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {occupations.includes('OTHER') ? (
          <AppInput
            label="Nghề khác (chi tiết)"
            value={otherOccupation}
            onChangeText={setOtherOccupation}
            placeholder="VD: Lặn bắt hải sản / nghề truyền thống địa phương"
            editable={!readOnly}
          />
        ) : null}
        <AppInput
          label="Tổng số thuyền viên"
          value={crewCount}
          onChangeText={setCrewCount}
          placeholder="VD: 12"
          keyboardType="number-pad"
          editable={!readOnly}
          error={fieldErrors['crewCount']}
        />
      </FormSection>

      <FormSection title="Kết luận & ghi chú">
        <AppTextArea
          label="Kết luận"
          value={conclusion}
          onChangeText={setConclusion}
          placeholder="Kết luận kiểm tra"
          minHeight={80}
          editable={!readOnly}
        />
        <AppTextArea
          label="Ghi chú"
          value={notes}
          onChangeText={setNotes}
          minHeight={60}
          editable={!readOnly}
        />
      </FormSection>

      <FormActionBar
        status={status}
        submitting={submitting}
        savingDraft={savingDraft}
        onSaveDraft={handleSaveDraft}
        onSubmit={handleSubmit}
        onCancel={() => onSubmitted()}
      />
    </>
  );
}


// ─── NKKT — Fishing Logbook (Circular 01/2022/TT-BNNPTNT) ──────────────────

interface EndangeredItem {
  operationNumber: number;
  speciesName: string;
  spottedAt: string;
  estimatedWeightKg: string;
  estimatedCount: string;
  estimatedSizeCm: string;
  stage: string;
  condition: string;
  extraNotes: string;
}

interface TransshipmentItem {
  date: string;
  carrierVesselRegNumber: string;
  carrierLicenseNumber: string;
  carrierCaptainName: string;
  latitude: string;
  longitude: string;
  speciesTransferred: string;
  quantityKg: string;
}

const COMMON_ENDANGERED_SPECIES = [
  'Cá voi',
  'Cá heo',
  'Bò biển (Dugong)',
  'Vích',
  'Đồi mồi dứa',
  'Đồi mồi',
  'Rùa da',
  'Quản đồng',
  'Loài khác',
];

function NKKTForm({
  tripId,
  vesselId,
  overview,
  status,
  existing,
  onStatusChange,
  onSubmitted,
}: LifecycleFormProps) {
  const router = useRouter();
  const palette = useColors();
  const readOnly = resolveReadOnly(status);
  const existingData = (existing?.data ?? {}) as Record<string, unknown>;

  // Auto-generate standard trip identifier: (ABC-xxxxx-KT-yy-zz)
  const defaultTripIdentifier = React.useMemo(() => {
    const reg = overview.vessel?.registrationNumber ?? 'TAU';
    const tripNum = String(overview.trip.tripNumber || '01').padStart(2, '0');
    const yearDigits = String(
      new Date(overview.trip.departureAt || Date.now()).getFullYear()
    ).slice(-2);
    return `(${reg}-KT-${tripNum}-${yearDigits})`;
  }, [overview]);

  const [tripIdentifier, setTripIdentifier] = React.useState(
    (existingData['tripIdentifier'] as string) || defaultTripIdentifier
  );
  const [mainOccupation, setMainOccupation] = React.useState(
    (existingData['mainOccupation'] as string) || 'HOOK_LINE'
  );
  const [subOccupation1, setSubOccupation1] = React.useState(
    (existingData['subOccupation1'] as string) || ''
  );
  const [subOccupation2, setSubOccupation2] = React.useState(
    (existingData['subOccupation2'] as string) || ''
  );

  // Ngư cụ theo nghề chính
  const existingGear = (existingData['gearSpecifications'] as Record<string, any>) || {};
  const [gearHookLength, setGearHookLength] = React.useState(
    existingGear.hookLineLength ? String(existingGear.hookLineLength) : ''
  );
  const [gearHookCount, setGearHookCount] = React.useState(
    existingGear.hookCount ? String(existingGear.hookCount) : ''
  );
  const [gearNetLength, setGearNetLength] = React.useState(
    existingGear.netLength ? String(existingGear.netLength) : ''
  );
  const [gearNetHeight, setGearNetHeight] = React.useState(
    existingGear.netHeight ? String(existingGear.netHeight) : ''
  );
  const [gearPerimeter, setGearPerimeter] = React.useState(
    existingGear.perimeter ? String(existingGear.perimeter) : ''
  );

  // Sinh vật nguy cấp quý hiếm
  const [endangeredList, setEndangeredList] = React.useState<EndangeredItem[]>(() => {
    const list = (existingData['endangeredSpecies'] as any[]) || [];
    return list.map((item, idx) => ({
      operationNumber: item.operationNumber || idx + 1,
      speciesName: item.speciesName || '',
      spottedAt: item.spottedAt || '',
      estimatedWeightKg: item.estimatedWeightKg != null ? String(item.estimatedWeightKg) : '',
      estimatedCount: item.estimatedCount != null ? String(item.estimatedCount) : '1',
      estimatedSizeCm: item.estimatedSizeCm != null ? String(item.estimatedSizeCm) : '',
      stage: item.stage || 'HAULING',
      condition: item.condition || 'ALIVE',
      extraNotes: item.extraNotes || '',
    }));
  });

  // Chuyển tải
  const [transshipmentList, setTransshipmentList] = React.useState<TransshipmentItem[]>(() => {
    const list = (existingData['transshipments'] as any[]) || [];
    return list.map((item) => ({
      date: item.date || '',
      carrierVesselRegNumber: item.carrierVesselRegNumber || '',
      carrierLicenseNumber: item.carrierLicenseNumber || '',
      carrierCaptainName: item.carrierCaptainName || '',
      latitude: item.latitude != null ? String(item.latitude) : '',
      longitude: item.longitude != null ? String(item.longitude) : '',
      speciesTransferred: item.speciesTransferred || '',
      quantityKg: item.quantityKg != null ? String(item.quantityKg) : '',
    }));
  });

  const [logbookNumber, setLogbookNumber] = React.useState(
    (existingData['logbookNumber'] as string) || ''
  );
  const [notes, setNotes] = React.useState((existingData['notes'] as string) || '');
  const [savingDraft, setSavingDraft] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  function buildData(): Record<string, unknown> {
    return {
      tripIdentifier: tripIdentifier.trim() || defaultTripIdentifier,
      mainOccupation,
      subOccupation1: subOccupation1.trim() || undefined,
      subOccupation2: subOccupation2.trim() || undefined,
      gearSpecifications: {
        hookLineLength: gearHookLength ? Number(gearHookLength) : undefined,
        hookCount: gearHookCount ? Number(gearHookCount) : undefined,
        netLength: gearNetLength ? Number(gearNetLength) : undefined,
        netHeight: gearNetHeight ? Number(gearNetHeight) : undefined,
        perimeter: gearPerimeter ? Number(gearPerimeter) : undefined,
      },
      endangeredSpecies: endangeredList.map((item) => ({
        operationNumber: Number(item.operationNumber) || 1,
        speciesName: item.speciesName.trim(),
        spottedAt: item.spottedAt || undefined,
        estimatedWeightKg: item.estimatedWeightKg ? Number(item.estimatedWeightKg) : undefined,
        estimatedCount: item.estimatedCount ? Number(item.estimatedCount) : 1,
        estimatedSizeCm: item.estimatedSizeCm ? Number(item.estimatedSizeCm) : undefined,
        stage: item.stage,
        condition: item.condition,
        extraNotes: item.extraNotes.trim() || undefined,
      })),
      transshipments: transshipmentList.map((item) => ({
        date: item.date || undefined,
        carrierVesselRegNumber: item.carrierVesselRegNumber.trim() || undefined,
        carrierLicenseNumber: item.carrierLicenseNumber.trim() || undefined,
        carrierCaptainName: item.carrierCaptainName.trim() || undefined,
        latitude: item.latitude ? Number(item.latitude) : undefined,
        longitude: item.longitude ? Number(item.longitude) : undefined,
        speciesTransferred: item.speciesTransferred.trim() || undefined,
        quantityKg: item.quantityKg ? Number(item.quantityKg) : undefined,
      })),
      logbookNumber: logbookNumber.trim() || undefined,
      notes: notes.trim() || undefined,
    };
  }

  function addEndangered() {
    setEndangeredList((prev) => [
      ...prev,
      {
        operationNumber: (overview.operations?.length || 1),
        speciesName: 'Vích',
        spottedAt: new Date().toISOString(),
        estimatedWeightKg: '',
        estimatedCount: '1',
        estimatedSizeCm: '',
        stage: 'HAULING',
        condition: 'ALIVE',
        extraNotes: '',
      },
    ]);
  }

  function removeEndangered(idx: number) {
    setEndangeredList((prev) => prev.filter((_, i) => i !== idx));
  }

  function addTransshipment() {
    setTransshipmentList((prev) => [
      ...prev,
      {
        date: new Date().toISOString().split('T')[0],
        carrierVesselRegNumber: '',
        carrierLicenseNumber: '',
        carrierCaptainName: '',
        latitude: '',
        longitude: '',
        speciesTransferred: '',
        quantityKg: '',
      },
    ]);
  }

  function removeTransshipment(idx: number) {
    setTransshipmentList((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSaveDraft() {
    if (!vesselId) {
      notify.error('Không xác định được tàu của chuyến.');
      return;
    }
    setSavingDraft(true);
    const res = await persistDraft({
      code: 'NKKT',
      tripId,
      vesselId,
      data: buildData(),
      existing,
      onStatusChange,
    });
    setSavingDraft(false);
    if (res.ok) notify.success('Đã lưu nháp Nhật ký khai thác');
  }

  async function handleSubmit() {
    if (!vesselId) {
      notify.error('Không xác định được tàu của chuyến.');
      return;
    }
    Alert.alert(
      'Nộp Nhật ký khai thác',
      'Xác nhận hoàn thành và nộp Nhật ký khai thác chuyến biển này?',
      [
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Nộp',
          onPress: async () => {
            setSubmitting(true);
            const res = await submitFinal({
              existing,
              fallbackData: buildData(),
              code: 'NKKT',
              tripId,
              vesselId,
              onStatusChange,
            });
            setSubmitting(false);
            if (res.ok) {
              notify.success('Đã nộp Nhật ký khai thác thành công');
              await onSubmitted();
            }
          },
        },
      ]
    );
  }

  return (
    <View className="mt-4 gap-4">
      <ReadOnlyBanner status={status} />

      {/* ── MỤC 1: THÔNG TIN HÀNH CHÍNH & MÃ ĐỊNH DANH ──────────────────── */}
      <FormSection title="1. Thông tin chung & Ngư cụ chính">
        <AppInput
          label="Mã định danh chuyến biển (*)"
          value={tripIdentifier}
          onChangeText={setTripIdentifier}
          editable={!readOnly}
          hint="Quy chuẩn Thông tư 01/2022: (SốĐK - KT - Chuyến - Năm)"
        />

        <BottomSheetSelect
          label="Nghề chính khai thác (**)"
          value={mainOccupation}
          options={FISHING_OCCUPATIONS}
          onChange={setMainOccupation}
          disabled={readOnly}
        />

        <View className="flex-row gap-2">
          <View className="flex-1">
            <AppInput
              label="Nghề phụ 1"
              value={subOccupation1}
              onChangeText={setSubOccupation1}
              editable={!readOnly}
            />
          </View>
          <View className="flex-1">
            <AppInput
              label="Nghề phụ 2"
              value={subOccupation2}
              onChangeText={setSubOccupation2}
              editable={!readOnly}
            />
          </View>
        </View>

        <View className="mt-2 rounded-xl border border-border bg-muted/40 p-3">
          <Text variant="subhead" className="font-semibold text-foreground mb-2">
            Kích thước ngư cụ chính
          </Text>
          <View className="flex-row gap-2">
            <View className="flex-1">
              <NumericInput
                label="Chiều dài vàng câu/lưới (m)"
                value={gearHookLength || gearNetLength}
                onChangeText={(val) => {
                  setGearHookLength(val);
                  setGearNetLength(val);
                }}
                editable={!readOnly}
              />
            </View>
            <View className="flex-1">
              <NumericInput
                label="Số lưỡi / Chiều cao (m)"
                value={gearHookCount || gearNetHeight}
                onChangeText={(val) => {
                  setGearHookCount(val);
                  setGearNetHeight(val);
                }}
                editable={!readOnly}
              />
            </View>
          </View>
        </View>
      </FormSection>

      {/* ── MỤC 2: TỔNG HỢP MẺ KHAI THÁC TRONG CHUYẾN ─────────────────── */}
      <FormSection title="2. Nhật ký các mẻ khai thác">
        <Text variant="footnote" className="text-muted-foreground mb-2">
          Dữ liệu được tự động đồng bộ từ các mẻ lưới ghi chép trên biển.
        </Text>

        {(!overview.operations || overview.operations.length === 0) ? (
          <View className="rounded-xl border border-dashed border-border p-4 items-center justify-center">
            <Text variant="caption1" className="text-muted-foreground mb-2">
              Chưa có mẻ khai thác nào được ghi nhận trong chuyến này.
            </Text>
            <Button
              variant="secondary"
              size="sm"
              onPress={() => router.push(`/trips/${tripId}/operation` as any)}>
              <Text>Ghi nhận mẻ khai thác</Text>
            </Button>
          </View>
        ) : (
          <View className="gap-2">
            {overview.operations.map((op, idx) => (
              <View
                key={op.id || idx}
                className="rounded-xl border border-border bg-card p-3">
                <View className="flex-row items-center justify-between border-b border-border/50 pb-2 mb-2">
                  <Text variant="subhead" className="font-semibold text-primary">
                    Mẻ thứ #{idx + 1} ({op.operationType || 'Khai thác'})
                  </Text>
                  <Text variant="caption1" className="text-muted-foreground">
                    Độ sâu: {op.depth != null ? `${op.depth}m` : '—'}
                  </Text>
                </View>

                <View className="flex-row justify-between mb-1">
                  <Text variant="caption2" className="text-muted-foreground">
                    Vị trí thả: {op.latitude != null ? Number(op.latitude).toFixed(3) : '—'}, {op.longitude != null ? Number(op.longitude).toFixed(3) : '—'}
                  </Text>
                  <Text variant="caption2" className="text-muted-foreground">
                    Thời điểm: {op.operationStartedAt ? new Date(op.operationStartedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </Text>
                </View>

                {op.catches && op.catches.length > 0 && (
                  <View className="mt-2 pt-2 border-t border-border/30">
                    <Text variant="caption2" className="font-medium text-foreground mb-1">
                      Sản lượng đánh bắt:
                    </Text>
                    <View className="flex-row flex-wrap gap-1">
                      {op.catches.map((c, cIdx) => (
                        <View
                          key={c.id || cIdx}
                          className="rounded-md bg-muted px-2 py-0.5 mr-1 mb-1">
                          <Text variant="caption2" className="text-foreground">
                            {c.speciesName || 'Cá'}: <Text className="font-semibold">{c.quantity ?? 0} {c.unit || 'kg'}</Text>
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </FormSection>

      {/* ── MỤC 3: CÁC LOÀI NGUY CẤP, QUÝ, HIẾM (CITES) ───────────────── */}
      <FormSection title="3. Bắt gặp sinh vật nguy cấp, quý, hiếm">
        <Text variant="footnote" className="text-muted-foreground mb-2">
          Khai báo cá voi, cá heo, rùa biển, đồi mồi... theo cam kết quốc tế chống IUU.
        </Text>

        {endangeredList.map((item, idx) => (
          <View
            key={idx}
            className="mb-3 rounded-xl border border-border bg-card p-3 gap-2">
            <View className="flex-row items-center justify-between">
              <Text variant="subhead" className="font-semibold text-foreground">
                Cá thể #{idx + 1}
              </Text>
              {!readOnly && (
                <Pressable
                  onPress={() => removeEndangered(idx)}
                  className="rounded-full bg-destructive/10 p-1">
                  <MaterialCommunityIcons name="trash-can-outline" size={18} color="#ef4444" />
                </Pressable>
              )}
            </View>

            <BottomSheetSelect
              label="Loài sinh vật biển (*)"
              value={item.speciesName}
              options={COMMON_ENDANGERED_SPECIES.map((s) => ({ value: s, label: s }))}
              onChange={(val) => {
                const next = [...endangeredList];
                next[idx].speciesName = val;
                setEndangeredList(next);
              }}
              disabled={readOnly}
            />

            <View className="flex-row gap-2">
              <View className="flex-1">
                <NumericInput
                  label="Số lượng (con)"
                  value={item.estimatedCount}
                  onChangeText={(val) => {
                    const next = [...endangeredList];
                    next[idx].estimatedCount = val;
                    setEndangeredList(next);
                  }}
                  editable={!readOnly}
                />
              </View>
              <View className="flex-1">
                <NumericInput
                  label="Khối lượng ước tính (kg)"
                  value={item.estimatedWeightKg}
                  onChangeText={(val) => {
                    const next = [...endangeredList];
                    next[idx].estimatedWeightKg = val;
                    setEndangeredList(next);
                  }}
                  editable={!readOnly}
                />
              </View>
            </View>

            <View className="flex-row gap-2">
              <View className="flex-1">
                <BottomSheetSelect
                  label="Giai đoạn"
                  value={item.stage}
                  options={[
                    { value: 'SETTING', label: 'Thả lưới/câu' },
                    { value: 'HAULING', label: 'Kéo lưới/thu câu' },
                    { value: 'OTHER', label: 'Khác' },
                  ]}
                  onChange={(val) => {
                    const next = [...endangeredList];
                    next[idx].stage = val;
                    setEndangeredList(next);
                  }}
                  disabled={readOnly}
                />
              </View>
              <View className="flex-1">
                <BottomSheetSelect
                  label="Tình trạng"
                  value={item.condition}
                  options={[
                    { value: 'ALIVE', label: 'Còn sống' },
                    { value: 'DEAD', label: 'Đã chết' },
                    { value: 'INJURED', label: 'Bị thương' },
                  ]}
                  onChange={(val) => {
                    const next = [...endangeredList];
                    next[idx].condition = val;
                    setEndangeredList(next);
                  }}
                  disabled={readOnly}
                />
              </View>
            </View>

            <AppInput
              label="Ghi chú thêm (màu sắc, thẻ số gắn trên cá thể...)"
              value={item.extraNotes}
              onChangeText={(val) => {
                const next = [...endangeredList];
                next[idx].extraNotes = val;
                setEndangeredList(next);
              }}
              editable={!readOnly}
            />
          </View>
        ))}

        {!readOnly && (
          <Button variant="secondary" size="md" onPress={addEndangered} className="mt-1">
            <Text className="font-semibold" style={{ color: palette.primary }}>
              + Thêm sinh vật bắt gặp
            </Text>
          </Button>
        )}
      </FormSection>

      {/* ── MỤC 4: HOẠT ĐỘNG CHUYỂN TẢI TRÊN BIỂN ───────────────────── */}
      <FormSection title="4. Hoạt động chuyển tải / bán trên biển (nếu có)">
        <Text variant="footnote" className="text-muted-foreground mb-2">
          Khai báo nếu có bán hoặc sang mạn hải sản cho tàu dịch vụ hậu cần giữa biển.
        </Text>

        {transshipmentList.map((item, idx) => (
          <View
            key={idx}
            className="mb-3 rounded-xl border border-border bg-card p-3 gap-2">
            <View className="flex-row items-center justify-between">
              <Text variant="subhead" className="font-semibold text-foreground">
                Lần chuyển tải #{idx + 1}
              </Text>
              {!readOnly && (
                <Pressable
                  onPress={() => removeTransshipment(idx)}
                  className="rounded-full bg-destructive/10 p-1">
                  <MaterialCommunityIcons name="trash-can-outline" size={18} color="#ef4444" />
                </Pressable>
              )}
            </View>

            <View className="flex-row gap-2">
              <View className="flex-1">
                <AppInput
                  label="Số ĐK tàu thu mua"
                  value={item.carrierVesselRegNumber}
                  onChangeText={(val) => {
                    const next = [...transshipmentList];
                    next[idx].carrierVesselRegNumber = val;
                    setTransshipmentList(next);
                  }}
                  editable={!readOnly}
                />
              </View>
              <View className="flex-1">
                <AppInput
                  label="Thuyền trưởng tàu mua"
                  value={item.carrierCaptainName}
                  onChangeText={(val) => {
                    const next = [...transshipmentList];
                    next[idx].carrierCaptainName = val;
                    setTransshipmentList(next);
                  }}
                  editable={!readOnly}
                />
              </View>
            </View>

            <View className="flex-row gap-2">
              <View className="flex-1">
                <AppInput
                  label="Tên loài hải sản"
                  value={item.speciesTransferred}
                  onChangeText={(val) => {
                    const next = [...transshipmentList];
                    next[idx].speciesTransferred = val;
                    setTransshipmentList(next);
                  }}
                  editable={!readOnly}
                />
              </View>
              <View className="flex-1">
                <NumericInput
                  label="Khối lượng (kg)"
                  value={item.quantityKg}
                  onChangeText={(val) => {
                    const next = [...transshipmentList];
                    next[idx].quantityKg = val;
                    setTransshipmentList(next);
                  }}
                  editable={!readOnly}
                />
              </View>
            </View>
          </View>
        ))}

        {!readOnly && (
          <Button variant="secondary" size="md" onPress={addTransshipment} className="mt-1">
            <Text className="font-semibold" style={{ color: palette.primary }}>
              + Thêm lượt chuyển tải
            </Text>
          </Button>
        )}
      </FormSection>

      {/* ── MỤC 5: NỘP NHẬT KÝ VÀO SỔ ──────────────────────────────── */}
      <FormSection title="5. Thông tin lưu sổ cảng cá & Ghi chú">
        <AppInput
          label="Vào Sổ số"
          value={logbookNumber}
          onChangeText={setLogbookNumber}
          editable={!readOnly}
          hint="Số thứ tự vào sổ lưu của Ban quản lý Cảng cá khi về bờ"
        />

        <AppTextArea
          label="Ghi chú chuyến biển"
          value={notes}
          onChangeText={setNotes}
          editable={!readOnly}
          minHeight={80}
        />
      </FormSection>

      <FormActionBar
        status={status}
        submitting={submitting}
        savingDraft={savingDraft}
        onSaveDraft={handleSaveDraft}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
      />
    </View>
  );
}
