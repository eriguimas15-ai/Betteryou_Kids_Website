/**
 * Base da API (com prefixo /api).
 * Local: omissão → http://localhost:3001/api
 * Produção: definir VITE_API_URL no build, ex. https://api.betteryoukids.com/api
 * (ver `.env.production.example` e docs/DEPLOY-CPANEL.md).
 */
export const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") ||
  "http://localhost:3001/api";

/** Base do servidor (sem /api) — media CMS/galeria pública em /uploads. */
export const API_ORIGIN = API_BASE.replace(/\/api\/?$/, "");

/**
 * URL público para media CMS/galeria (não usar para documentos de inscrição).
 * Documentos sensíveis: `downloadEnrollmentDocument`.
 */
export function uploadPublicUrl(filePath: string): string {
  const normalized = filePath.replace(/\\/g, "/");
  // Nunca construir URL directa para documentos privados
  if (
    normalized.includes("/uploads/documents/") ||
    normalized.includes("uploads/documents/") ||
    /(?:^|\/)documents\//.test(normalized)
  ) {
    console.warn(
      "uploadPublicUrl: documentos de inscrição devem usar downloadEnrollmentDocument",
    );
  }
  const uploadsIdx = normalized.indexOf("/uploads/");
  if (uploadsIdx >= 0) {
    return `${API_ORIGIN}${normalized.slice(uploadsIdx)}`;
  }
  const relativeIdx = normalized.indexOf("uploads/");
  if (relativeIdx >= 0) {
    return `${API_ORIGIN}/${normalized.slice(relativeIdx)}`;
  }
  const name = normalized.split("/").pop() || normalized;
  return `${API_ORIGIN}/uploads/${name}`;
}

/** URL do endpoint autenticado de download de documento de inscrição. */
export function enrollmentDocumentApiPath(
  enrollmentId: string,
  documentId: string,
): string {
  return `${API_BASE}/enrollments/${enrollmentId}/documents/${documentId}/file`;
}

/** Flag local não secreto — a sessão real vive em cookies HttpOnly. */
export const SESSION_FLAG_KEY = "by_session";

/** Descarrega documento de inscrição com JWT em cookie (blob URL temporário). */
export async function downloadEnrollmentDocument(
  enrollmentId: string,
  documentId: string,
  fileName?: string,
): Promise<void> {
  const res = await fetch(enrollmentDocumentApiPath(enrollmentId, documentId), {
    credentials: "include",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(
      (data as { message?: string }).message ||
        "Não foi possível descarregar o documento",
    );
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName || "documento";
  a.rel = "noreferrer";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Disparado quando o access/refresh token deixam de ser válidos. */
export const SESSION_EXPIRED_EVENT = "by:session-expired";

export function hasLocalSessionFlag(): boolean {
  return localStorage.getItem(SESSION_FLAG_KEY) === "1";
}

export function markLocalSession() {
  localStorage.setItem(SESSION_FLAG_KEY, "1");
  // Limpar tokens legados (pré-SEC-06)
  localStorage.removeItem("by_access_token");
  localStorage.removeItem("by_refresh_token");
}

function clearSessionStorage() {
  localStorage.removeItem(SESSION_FLAG_KEY);
  localStorage.removeItem("by_access_token");
  localStorage.removeItem("by_refresh_token");
  localStorage.removeItem("by_user_name");
  localStorage.removeItem("by_user_role");
  localStorage.removeItem("by_user_modules");
}

function expireSession() {
  clearSessionStorage();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
  }
}

/** Renova cookies via refresh HttpOnly; devolve true se OK. */
async function refreshAccessToken(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({}),
    });
    if (!response.ok) {
      clearSessionStorage();
      return false;
    }
    markLocalSession();
    return true;
  } catch {
    clearSessionStorage();
    return false;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  retried = false,
): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  const isAuthCredentialPath =
    path.startsWith("/auth/login") ||
    path.startsWith("/auth/register") ||
    path.startsWith("/auth/refresh") ||
    path.startsWith("/auth/logout");

  if (response.status === 401 && !retried && !isAuthCredentialPath) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return request<T>(path, options, true);
    }
    expireSession();
    throw new Error("Sessão expirada. Entre novamente para continuar.");
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && !isAuthCredentialPath) {
      expireSession();
      throw new Error("Sessão expirada. Entre novamente para continuar.");
    }
    if (response.status === 403) {
      throw new Error(
        "Sem permissão para esta acção. Use a conta admin (admin@betteryoukids.com).",
      );
    }
    const message =
      (Array.isArray(data.message) ? data.message.join(", ") : data.message) ||
      data.error ||
      "Pedido falhou";
    throw new Error(message);
  }
  return data as T;
}

/** Extrai o nome do ficheiro de um cabeçalho Content-Disposition. */
function filenameFromDisposition(header: string | null): string | null {
  if (!header) return null;
  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (utf8?.[1]) return decodeURIComponent(utf8[1]);
  const plain = /filename="?([^";]+)"?/i.exec(header);
  return plain?.[1] ?? null;
}

/**
 * Descarrega um ficheiro binário autenticado (blob) e dispara a transferência
 * no browser. Reutiliza o refresh de token do fluxo JSON.
 */
async function downloadFile(
  path: string,
  fallbackName: string,
  retried = false,
): Promise<void> {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
  });

  if (response.status === 401 && !retried) {
    const refreshed = await refreshAccessToken();
    if (refreshed) return downloadFile(path, fallbackName, true);
    expireSession();
    throw new Error("Sessão expirada. Entre novamente para continuar.");
  }

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error(
        "Sem permissão para este relatório. Use uma conta com acesso (admin/direcção).",
      );
    }
    let message = "Não foi possível gerar o ficheiro.";
    try {
      const data = await response.json();
      message =
        (Array.isArray(data.message) ? data.message.join(", ") : data.message) ||
        data.error ||
        message;
    } catch {
      // resposta não-JSON — manter mensagem genérica
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  const filename =
    filenameFromDisposition(response.headers.get("Content-Disposition")) ||
    fallbackName;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

async function publicFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      (Array.isArray(data.message) ? data.message.join(", ") : data.message) ||
      data.error ||
      "Pedido falhou";
    throw new Error(message);
  }
  return data as T;
}

/**
 * Unidades de reserva (Inscrições / Renovações) quando a API falha ou
 * devolve lista vazia. Nomes canónicos — não substituem a API como fonte.
 */
export const FALLBACK_UNITS: Unit[] = [
  {
    id: "fallback-sagrada-familia",
    name: "Sagrada Família",
    address: "Av. Cmte. Gika 150, Sagrada Família, Luanda",
    active: true,
    services: [
      { active: true, service: { id: "fb-svc-creche", name: "Creche" } },
      {
        active: true,
        service: { id: "fb-svc-pre", name: "Pré-Escolar" },
      },
      {
        active: true,
        service: { id: "fb-svc-jardim", name: "Jardim de Infância" },
      },
      {
        active: true,
        service: { id: "fb-svc-ciclo", name: "1.º Ciclo" },
      },
      { active: true, service: { id: "fb-svc-atl", name: "ATL" } },
    ],
  },
  {
    id: "fallback-patriota",
    name: "Patriota",
    address: "Rua Urbanização Harmonia, Patriota",
    active: true,
    services: [
      { active: true, service: { id: "fb-svc-creche-p", name: "Creche" } },
      {
        active: true,
        service: { id: "fb-svc-pre-p", name: "Pré-Escolar" },
      },
      {
        active: true,
        service: { id: "fb-svc-jardim-p", name: "Jardim de Infância" },
      },
      { active: true, service: { id: "fb-svc-atl-p", name: "ATL" } },
    ],
  },
];

/** Normaliza respostas `/units` (array cru ou envelope `{ data | units | items }`). */
export function normalizeUnitsList(
  data: unknown,
  opts?: { canonicalizeNames?: boolean },
): Unit[] {
  const canonicalizeNames = opts?.canonicalizeNames === true;
  const canonicalize = (name: string) =>
    canonicalizeNames && /^gika$/i.test(name.trim())
      ? "Sagrada Família"
      : name;

  const asUnits = (items: unknown[]): Unit[] =>
    items
      .filter(
        (u): u is Unit =>
          !!u &&
          typeof u === "object" &&
          typeof (u as Unit).id === "string" &&
          typeof (u as Unit).name === "string",
      )
      .map((u) => ({
        ...u,
        name: canonicalize(u.name),
        services: Array.isArray(u.services) ? u.services : [],
      }));

  if (Array.isArray(data)) return asUnits(data);
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    for (const key of ["data", "units", "items", "results"] as const) {
      if (Array.isArray(obj[key])) return asUnits(obj[key] as unknown[]);
    }
  }
  return [];
}

async function fetchUnitsPublic(): Promise<Unit[]> {
  try {
    // Sem Authorization: evita que um JWT inválido dispare o fluxo de
    // refresh/expireSession do `request()` em formulários públicos.
    const raw = await publicFetch<unknown>("/units");
    const list = normalizeUnitsList(raw, { canonicalizeNames: true });
    return list.length > 0 ? list : FALLBACK_UNITS;
  } catch {
    return FALLBACK_UNITS;
  }
}

export function getPublicCmsPage(slug: string): Promise<PublicCmsPage> {
  return publicFetch<PublicCmsPage>(`/cms/pages/${slug}`);
}

export function getPublicTestimonials(): Promise<PublicTestimonial[]> {
  return publicFetch<PublicTestimonial[]>("/cms/testimonials");
}

export function getPublicGallery(): Promise<PublicGalleryAlbum[]> {
  return publicFetch<PublicGalleryAlbum[]>("/cms/gallery");
}

export function getPublicEvents(): Promise<PublicEvent[]> {
  return publicFetch<PublicEvent[]>("/events/public");
}

export const api = {
  me: () =>
    request<{
      id: string;
      email: string;
      role: string;
      name: string;
      modules: string[];
    }>("/auth/me"),
  /** Lista pública de unidades (Inscrições/Renovações). Sem auth; com fallback. */
  getUnits: () => fetchUnitsPublic(),
  getUnitsAdmin: async () => {
    const raw = await request<unknown>("/units?activeOnly=false");
    return normalizeUnitsList(raw);
  },
  getServices: () => request<ServiceItem[]>("/services"),
  getAcademicYears: () => request<AcademicYear[]>("/academic-years"),
  getRoomsForEnrollment: (params: {
    unitName: string;
    serviceName: string;
    yearLabel: string;
    birthDate?: string;
    levelLabel?: string;
  }) => {
    const q = new URLSearchParams({
      unitName: params.unitName,
      serviceName: params.serviceName,
      yearLabel: params.yearLabel,
    });
    if (params.birthDate) q.set("birthDate", params.birthDate);
    if (params.levelLabel) q.set("levelLabel", params.levelLabel);
    return request<RoomsForEnrollment>(`/rooms/for-enrollment?${q}`);
  },
  getRoomsAdmin: (includeInactive = true) =>
    request<AdminRoom[]>(
      `/rooms?includeInactive=${includeInactive ? "true" : "false"}`,
    ),
  createRoom: (body: CreateRoomPayload) =>
    request<AdminRoom>("/rooms", { method: "POST", body: JSON.stringify(body) }),
  updateRoom: (
    id: string,
    body: Partial<CreateRoomPayload> & {
      active?: boolean;
      enrollmentReserved?: number;
      levelLabel?: string | null;
      ageLabel?: string | null;
      minAgeYears?: number | null;
      maxAgeYears?: number | null;
    },
  ) =>
    request<AdminRoom>(`/rooms/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  setRoomActive: (id: string, active: boolean) =>
    request<AdminRoom>(`/rooms/${id}/active`, {
      method: "PATCH",
      body: JSON.stringify({ active }),
    }),
  getRoomDependencies: (id: string) =>
    request<RoomDependencies>(`/rooms/${id}/dependencies`),
  deleteRoom: (id: string) =>
    request<RoomDeleteResult>(`/rooms/${id}`, { method: "DELETE" }),
  createEnrollment: (body: EnrollmentPayload) =>
    request<EnrollmentResult>("/enrollments", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  getEnrollments: (status?: string) =>
    request<EnrollmentAdmin[]>(
      status ? `/enrollments?status=${status}` : "/enrollments",
    ),
  getMyEnrollments: () => request<GuardianEnrollment[]>("/enrollments/mine"),
  getMyRenewals: () => request<GuardianRenewal[]>("/renewals/mine"),
  confirmEnrollment: (id: string) =>
    request(`/enrollments/${id}/confirm`, { method: "PATCH" }),
  rejectEnrollment: (id: string) =>
    request(`/enrollments/${id}/reject`, { method: "PATCH" }),
  deleteEnrollment: (id: string) =>
    request<{ ok: boolean; id: string }>(`/enrollments/${id}`, {
      method: "DELETE",
    }),
  getDashboard: () => request<DashboardOverview>("/dashboard/overview"),
  getWaitlist: () => request<WaitlistItem[]>("/enrollments/waitlist"),
  getPlatformSettings: () => request<PlatformSettings>("/settings"),
  updatePlatformSettings: (body: {
    waitlistResponseHours?: number;
    waitlistDeadlineEnabled?: boolean;
    smsEnabled?: boolean;
    smsProvider?: "console" | "http";
    smsApiUrl?: string | null;
    smsFrom?: string | null;
  }) =>
    request<PlatformSettings>("/settings", {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  getAdmissionFormConfig: () =>
    request<import("./admission-form").AdmissionFormConfig>(
      "/settings/admission-form",
    ),
  getAdmissionFormConfigAdmin: () =>
    request<import("./admission-form").AdmissionFormConfig>(
      "/settings/admission-form/admin",
    ),
  updateAdmissionFormConfig: (
    config: import("./admission-form").AdmissionFormConfig,
  ) =>
    request<import("./admission-form").AdmissionFormConfig>(
      "/settings/admission-form",
      {
        method: "PATCH",
        body: JSON.stringify({ config }),
      },
    ),
  resetAdmissionFormConfig: () =>
    request<import("./admission-form").AdmissionFormConfig>(
      "/settings/admission-form/reset",
      { method: "POST" },
    ),
  createRenewal: (body: RenewalPayload) =>
    request<
      RenewalItem & {
        estado?: "pendente" | "lista_espera";
        message?: string;
      }
    >("/renewals", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  getRenewals: (status?: string) =>
    request<RenewalItem[]>(
      status ? `/renewals?status=${status}` : "/renewals",
    ),
  setRenewalStatus: (id: string, status: string) =>
    request<RenewalItem>(`/renewals/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  deleteRenewal: (id: string) =>
    request<{ ok: boolean }>(`/renewals/${id}`, { method: "DELETE" }),
  getJobsPublic: () => request<JobOpening[]>("/jobs/public"),
  getActivitiesPublic: (serviceName?: string, unitName?: string) => {
    const params = new URLSearchParams();
    if (serviceName) params.set("serviceName", serviceName);
    if (unitName) params.set("unitName", unitName);
    const qs = params.toString();
    return request<ActivityOffering[]>(
      qs ? `/activities/public?${qs}` : "/activities/public",
    );
  },
  getActivitiesAdmin: () => request<ActivityOffering[]>("/activities"),
  createActivity: (body: ActivityPayload) =>
    request<ActivityOffering>("/activities", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateActivity: (id: string, body: Partial<ActivityPayload>) =>
    request<ActivityOffering>(`/activities/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteActivity: (id: string) =>
    request<{ ok: boolean }>(`/activities/${id}`, { method: "DELETE" }),
  getJobsAdmin: () => request<JobOpening[]>("/jobs"),
  createJob: (body: JobPayload) =>
    request<JobOpening>("/jobs", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateJob: (id: string, body: Partial<JobPayload>) =>
    request<JobOpening>(`/jobs/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteJob: (id: string) =>
    request<{ ok: boolean }>(`/jobs/${id}`, { method: "DELETE" }),
  getAccessModules: () =>
    request<Array<{ key: string; label: string }>>("/users/modules"),
  getAccessProfiles: () => request<AccessProfile[]>("/users/profiles"),
  createAccessProfile: (body: {
    name: string;
    description?: string;
    modules: string[];
  }) =>
    request<AccessProfile>("/users/profiles", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateAccessProfile: (
    id: string,
    body: {
      name?: string;
      description?: string | null;
      modules?: string[];
      active?: boolean;
    },
  ) =>
    request<AccessProfile>(`/users/profiles/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteAccessProfile: (id: string) =>
    request<{ ok: boolean }>(`/users/profiles/${id}`, { method: "DELETE" }),
  getUsers: () => request<PlatformUser[]>("/users"),
  createUser: (body: {
    name: string;
    email: string;
    password: string;
    accessProfileId?: string;
    role?: string;
    active?: boolean;
  }) =>
    request<PlatformUser>("/users", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateUser: (
    id: string,
    body: {
      name?: string;
      email?: string;
      password?: string;
      accessProfileId?: string | null;
      role?: string;
      active?: boolean;
    },
  ) =>
    request<PlatformUser>(`/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  login: async (email: string, password: string) => {
    const result = await request<LoginResult>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    markLocalSession();
    return result;
  },
  register: async (body: { name: string; email: string; password: string }) => {
    const result = await request<LoginResult>("/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    });
    markLocalSession();
    return result;
  },
  logout: async () => {
    clearSessionStorage();
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}),
      });
    } catch {
      // cookies podem já ter expirado
    }
    return { ok: true as const };
  },
  getStudents: () => request<Student[]>("/students"),
  getStudent: (id: string) => request<Student>(`/students/${id}`),
  updateStudentFicha: (id: string, body: StudentFichaPayload) =>
    request<Student>(`/students/${id}/ficha`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  getCmsPages: () => request<CmsPage[]>("/cms/admin/pages"),
  getCmsPage: (slug: string) => request<CmsPage>(`/cms/admin/pages/${slug}`),
  saveCmsPage: (slug: string, body: UpsertCmsPage) =>
    request<CmsPage>(`/cms/admin/pages/${slug}`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  publishCmsPage: (slug: string, publishAt?: string | null) =>
    request<CmsPage>(`/cms/admin/pages/${slug}/publish`, {
      method: "PATCH",
      body: JSON.stringify({ publishAt: publishAt ?? null }),
    }),
  submitCmsPage: (slug: string) =>
    request<CmsPage>(`/cms/admin/pages/${slug}/submit`, { method: "PATCH" }),
  archiveCmsPage: (slug: string) =>
    request<CmsPage>(`/cms/admin/pages/${slug}/archive`, { method: "PATCH" }),
  deleteCmsPage: (slug: string) =>
    request<{ ok: boolean; slug: string }>(`/cms/admin/pages/${slug}`, {
      method: "DELETE",
    }),
  processScheduledContent: () =>
    request<{
      processed: number;
      pages: number;
      testimonials: number;
      galleryAlbums: number;
      message: string;
    }>("/cms/admin/process-scheduled", { method: "POST" }),
  notifyWaitlist: (id: string) =>
    request(`/enrollments/waitlist/${id}/notify`, { method: "POST" }),
  processExpiredWaitlist: () =>
    request<{
      processed: number;
      message: string;
      results: Array<{
        waitlistId: string;
        enrollmentId: string;
        roomId: string | null;
        advancedToId: string | null;
        advancedError?: string;
      }>;
    }>("/enrollments/waitlist/process-expired", { method: "POST" }),
  uploadEnrollmentDocument: async (
    enrollmentId: string,
    file: File,
    type: string,
    uploadToken?: string,
  ) => {
    const form = new FormData();
    form.append("file", file);
    form.append("type", type);
    if (uploadToken) form.append("uploadToken", uploadToken);
    const res = await fetch(`${API_BASE}/enrollments/${enrollmentId}/documents`, {
      method: "POST",
      credentials: "include",
      body: form,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || "Upload falhou");
    return data as { id: string; type: string; fileName: string };
  },
  getEnrollmentDocuments: (enrollmentId: string, uploadToken?: string) =>
    request<
      Array<{
        id: string;
        type: string;
        fileName: string;
        mimeType?: string | null;
        createdAt?: string;
      }>
    >(
      uploadToken
        ? `/enrollments/${enrollmentId}/documents?uploadToken=${encodeURIComponent(uploadToken)}`
        : `/enrollments/${enrollmentId}/documents`,
    ),
  getClasses: (academicYearId?: string) =>
    request<ClassGroup[]>(
      academicYearId ? `/classes?academicYearId=${academicYearId}` : "/classes",
    ),
  createClass: (body: {
    name: string;
    roomId: string;
    academicYearId: string;
    teacherName?: string;
    notes?: string;
  }) => request("/classes", { method: "POST", body: JSON.stringify(body) }),
  updateClass: (
    id: string,
    body: Partial<{
      name: string;
      roomId: string;
      teacherName: string | null;
      notes: string | null;
      active: boolean;
    }>,
  ) =>
    request(`/classes/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteClass: (id: string) => request(`/classes/${id}`, { method: "DELETE" }),
  getAttendanceTurmas: () =>
    request<AttendanceTurma[]>("/attendance/turmas"),
  getAttendanceForTurma: (classGroupId: string, date: string) =>
    request<AttendanceTurmaDay>(
      `/attendance/turma/${classGroupId}?date=${encodeURIComponent(date)}`,
    ),
  saveAttendanceForTurma: (
    classGroupId: string,
    body: {
      date: string;
      records: Array<{
        studentId: string;
        status: AttendanceStatus;
        note?: string;
      }>;
    },
  ) =>
    request<AttendanceTurmaDay>(`/attendance/turma/${classGroupId}`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  getStudentAttendance: (studentId: string) =>
    request<StudentAttendance[]>(`/attendance/aluno/${studentId}`),
  getCommunications: () => request<Communication[]>("/communications"),
  createCommunication: (body: CommunicationPayload) =>
    request<Communication>("/communications", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateCommunication: (id: string, body: Partial<CommunicationPayload>) =>
    request<Communication>(`/communications/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  publishCommunication: (id: string, body?: { sendEmail?: boolean }) =>
    request<Communication>(`/communications/${id}/publish`, {
      method: "POST",
      body: JSON.stringify(body ?? {}),
    }),
  unpublishCommunication: (id: string) =>
    request<Communication>(`/communications/${id}/unpublish`, {
      method: "POST",
    }),
  deleteCommunication: (id: string) =>
    request<{ ok: boolean; id: string }>(`/communications/${id}`, {
      method: "DELETE",
    }),
  getMyCommunications: () =>
    request<CommunicationForMe[]>("/communications/mine"),
  markCommunicationRead: (id: string) =>
    request<{ ok: boolean; id: string; readAt: string }>(
      `/communications/${id}/read`,
      { method: "POST" },
    ),
  getAcademicoTurmas: () => request<AttendanceTurma[]>("/academico/turmas"),
  getAssessmentPeriods: (params?: {
    academicYearId?: string;
    unitId?: string;
  }) => {
    const q = new URLSearchParams();
    if (params?.academicYearId) q.set("academicYearId", params.academicYearId);
    if (params?.unitId) q.set("unitId", params.unitId);
    const qs = q.toString();
    return request<AssessmentPeriod[]>(
      `/academico/periodos${qs ? `?${qs}` : ""}`,
    );
  },
  createAssessmentPeriod: (body: AssessmentPeriodPayload) =>
    request<AssessmentPeriod>("/academico/periodos", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateAssessmentPeriod: (
    id: string,
    body: Partial<AssessmentPeriodPayload>,
  ) =>
    request<AssessmentPeriod>(`/academico/periodos/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteAssessmentPeriod: (id: string) =>
    request<{ ok: boolean; id: string }>(`/academico/periodos/${id}`, {
      method: "DELETE",
    }),
  getReportCards: (params?: {
    periodId?: string;
    classGroupId?: string;
    studentId?: string;
    status?: ReportCardStatus;
  }) => {
    const q = new URLSearchParams();
    if (params?.periodId) q.set("periodId", params.periodId);
    if (params?.classGroupId) q.set("classGroupId", params.classGroupId);
    if (params?.studentId) q.set("studentId", params.studentId);
    if (params?.status) q.set("status", params.status);
    const qs = q.toString();
    return request<ReportCard[]>(`/academico/boletins${qs ? `?${qs}` : ""}`);
  },
  generateReportCards: (body: {
    periodId: string;
    classGroupId: string;
    overwriteDraft?: boolean;
  }) =>
    request<{
      created: number;
      updated: number;
      skipped: number;
      cards: ReportCard[];
    }>("/academico/boletins/gerar", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateReportCard: (
    id: string,
    body: {
      overallComment?: string | null;
      status?: ReportCardStatus;
      lines?: ReportCardLinePayload[];
    },
  ) =>
    request<ReportCard>(`/academico/boletins/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  publishReportCard: (id: string, body?: { sendEmail?: boolean }) =>
    request<ReportCard>(`/academico/boletins/${id}/publish`, {
      method: "POST",
      body: JSON.stringify(body ?? {}),
    }),
  unpublishReportCard: (id: string) =>
    request<ReportCard>(`/academico/boletins/${id}/unpublish`, {
      method: "POST",
    }),
  downloadReportCardPdf: (id: string) =>
    downloadFile(`/academico/boletins/${id}/pdf`, "boletim.pdf"),
  deleteReportCard: (id: string) =>
    request<{ ok: boolean; id: string }>(`/academico/boletins/${id}`, {
      method: "DELETE",
    }),
  getMyReportCards: () => request<ReportCard[]>("/academico/boletins/mine"),
  getStudentReportCards: (studentId: string) =>
    request<ReportCard[]>(`/academico/boletins/aluno/${studentId}`),
  getDashboardAcademico: (params?: {
    unitId?: string;
    academicYearId?: string;
  }) => {
    const q = new URLSearchParams();
    if (params?.unitId && params.unitId !== "all") {
      q.set("unitId", params.unitId);
    }
    if (params?.academicYearId) {
      q.set("academicYearId", params.academicYearId);
    }
    const qs = q.toString();
    return request<DashboardAcademico>(
      `/dashboard/academico${qs ? `?${qs}` : ""}`,
    );
  },
  getDashboardPedagogico: (params?: {
    unitId?: string;
    academicYearId?: string;
    periodId?: string;
  }) => {
    const q = new URLSearchParams();
    if (params?.unitId && params.unitId !== "all") q.set("unitId", params.unitId);
    if (params?.academicYearId) q.set("academicYearId", params.academicYearId);
    if (params?.periodId && params.periodId !== "all") {
      q.set("periodId", params.periodId);
    }
    const qs = q.toString();
    return request<DashboardPedagogico>(
      `/dashboard/pedagogico${qs ? `?${qs}` : ""}`,
    );
  },
  downloadDashboardPedagogicoCsv: (params?: {
    unitId?: string;
    academicYearId?: string;
    periodId?: string;
  }) => {
    const q = new URLSearchParams();
    if (params?.unitId && params.unitId !== "all") q.set("unitId", params.unitId);
    if (params?.academicYearId) q.set("academicYearId", params.academicYearId);
    if (params?.periodId && params.periodId !== "all") {
      q.set("periodId", params.periodId);
    }
    const qs = q.toString();
    return downloadFile(
      `/dashboard/pedagogico/export.csv${qs ? `?${qs}` : ""}`,
      "pedagogico-estrategico.csv",
    );
  },
  getLessonSummaries: (classGroupId: string) =>
    request<LessonSummary[]>(`/academico/sumarios/turma/${classGroupId}`),
  createLessonSummary: (body: LessonSummaryPayload) =>
    request<LessonSummary>("/academico/sumarios", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateLessonSummary: (
    id: string,
    body: Partial<Omit<LessonSummaryPayload, "classGroupId">>,
  ) =>
    request<LessonSummary>(`/academico/sumarios/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteLessonSummary: (id: string) =>
    request<{ ok: boolean; id: string }>(`/academico/sumarios/${id}`, {
      method: "DELETE",
    }),
  getStudentSummaries: (studentId: string) =>
    request<LessonSummary[]>(`/academico/sumarios/aluno/${studentId}`),
  getAssessmentsForTurma: (classGroupId: string) =>
    request<Assessment[]>(`/academico/avaliacoes/turma/${classGroupId}`),
  createAssessment: (body: AssessmentPayload) =>
    request<Assessment>("/academico/avaliacoes", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateAssessment: (
    id: string,
    body: Partial<Omit<AssessmentPayload, "studentId" | "classGroupId">>,
  ) =>
    request<Assessment>(`/academico/avaliacoes/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteAssessment: (id: string) =>
    request<{ ok: boolean; id: string }>(`/academico/avaliacoes/${id}`, {
      method: "DELETE",
    }),
  getStudentAssessments: (studentId: string) =>
    request<Assessment[]>(`/academico/avaliacoes/aluno/${studentId}`),
  getScheduleForTurma: (classGroupId: string) =>
    request<ScheduleEntry[]>(`/academico/horarios/turma/${classGroupId}`),
  createScheduleEntry: (body: ScheduleEntryPayload) =>
    request<ScheduleEntry>("/academico/horarios", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateScheduleEntry: (
    id: string,
    body: Partial<Omit<ScheduleEntryPayload, "classGroupId">>,
  ) =>
    request<ScheduleEntry>(`/academico/horarios/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteScheduleEntry: (id: string) =>
    request<{ ok: boolean; id: string }>(`/academico/horarios/${id}`, {
      method: "DELETE",
    }),
  getStudentSchedule: (studentId: string) =>
    request<ScheduleEntry[]>(`/academico/horarios/aluno/${studentId}`),

  getNonTeachingActivities: (params?: {
    classGroupId?: string;
    teacherUserId?: string;
  }) => {
    const q = new URLSearchParams();
    if (params?.classGroupId) q.set("classGroupId", params.classGroupId);
    if (params?.teacherUserId) q.set("teacherUserId", params.teacherUserId);
    const qs = q.toString();
    return request<NonTeachingActivity[]>(
      `/academico/nle${qs ? `?${qs}` : ""}`,
    );
  },
  createNonTeachingActivity: (body: NonTeachingActivityPayload) =>
    request<NonTeachingActivity>("/academico/nle", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateNonTeachingActivity: (
    id: string,
    body: Partial<NonTeachingActivityPayload>,
  ) =>
    request<NonTeachingActivity>(`/academico/nle/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteNonTeachingActivity: (id: string) =>
    request<{ ok: boolean; id: string }>(`/academico/nle/${id}`, {
      method: "DELETE",
    }),

  getBehaviorRecords: (params?: {
    studentId?: string;
    type?: BehaviorType;
    unitId?: string;
  }) => {
    const q = new URLSearchParams();
    if (params?.studentId) q.set("studentId", params.studentId);
    if (params?.type) q.set("type", params.type);
    if (params?.unitId) q.set("unitId", params.unitId);
    const qs = q.toString();
    return request<BehaviorRecord[]>(
      `/academico/comportamento${qs ? `?${qs}` : ""}`,
    );
  },
  getMyBehaviorRecords: () =>
    request<BehaviorRecord[]>("/academico/comportamento/mine"),
  createBehaviorRecord: (body: BehaviorRecordPayload) =>
    request<BehaviorRecord>("/academico/comportamento", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateBehaviorRecord: (
    id: string,
    body: Partial<Omit<BehaviorRecordPayload, "studentId">>,
  ) =>
    request<BehaviorRecord>(`/academico/comportamento/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteBehaviorRecord: (id: string) =>
    request<{ ok: boolean; id: string }>(`/academico/comportamento/${id}`, {
      method: "DELETE",
    }),

  getQualifications: (params?: { studentId?: string; unitId?: string }) => {
    const q = new URLSearchParams();
    if (params?.studentId) q.set("studentId", params.studentId);
    if (params?.unitId) q.set("unitId", params.unitId);
    const qs = q.toString();
    return request<StudentQualification[]>(
      `/academico/habilitacoes${qs ? `?${qs}` : ""}`,
    );
  },
  getMyQualifications: () =>
    request<StudentQualification[]>("/academico/habilitacoes/mine"),
  createQualification: (body: StudentQualificationPayload) =>
    request<StudentQualification>("/academico/habilitacoes", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateQualification: (
    id: string,
    body: Partial<Omit<StudentQualificationPayload, "studentId">>,
  ) =>
    request<StudentQualification>(`/academico/habilitacoes/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteQualification: (id: string) =>
    request<{ ok: boolean; id: string }>(`/academico/habilitacoes/${id}`, {
      method: "DELETE",
    }),

  getNeeProfiles: (params?: { unitId?: string; activeOnly?: boolean }) => {
    const q = new URLSearchParams();
    if (params?.unitId) q.set("unitId", params.unitId);
    if (params?.activeOnly) q.set("activeOnly", "true");
    const qs = q.toString();
    return request<NeeProfile[]>(`/nee/profiles${qs ? `?${qs}` : ""}`);
  },
  upsertNeeProfile: (body: UpsertNeeProfilePayload) =>
    request<NeeProfile>("/nee/profiles", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateNeeProfile: (id: string, body: Partial<UpsertNeeProfilePayload>) =>
    request<NeeProfile>(`/nee/profiles/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  getPeiPlans: (params?: {
    unitId?: string;
    studentId?: string;
    academicYearId?: string;
    status?: PeiStatus;
    neeOnly?: boolean;
  }) => {
    const q = new URLSearchParams();
    if (params?.unitId) q.set("unitId", params.unitId);
    if (params?.studentId) q.set("studentId", params.studentId);
    if (params?.academicYearId) q.set("academicYearId", params.academicYearId);
    if (params?.status) q.set("status", params.status);
    if (params?.neeOnly) q.set("neeOnly", "true");
    const qs = q.toString();
    return request<PeiPlan[]>(`/nee/plans${qs ? `?${qs}` : ""}`);
  },
  getPeiPlan: (id: string) => request<PeiPlan>(`/nee/plans/${id}`),
  createPeiPlan: (body: PeiPlanPayload) =>
    request<PeiPlan>("/nee/plans", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updatePeiPlan: (id: string, body: Partial<Omit<PeiPlanPayload, "studentId">>) =>
    request<PeiPlan>(`/nee/plans/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deletePeiPlan: (id: string) =>
    request<{ ok: boolean; id: string }>(`/nee/plans/${id}`, {
      method: "DELETE",
    }),
  addPeiReview: (planId: string, body: { date: string; notes: string }) =>
    request<PeiPlan>(`/nee/plans/${planId}/reviews`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  deletePeiReview: (id: string) =>
    request<{ ok: boolean; id: string }>(`/nee/reviews/${id}`, {
      method: "DELETE",
    }),
  getMyPeiPlans: () => request<PeiPlanMine[]>("/nee/mine"),

  getMyCurriculum: () => request<CurriculumMineEntry[]>("/curriculo/mine"),

  getCurriculumPlans: (params?: {
    serviceId?: string;
    academicYearId?: string;
    unitId?: string;
    classGroupId?: string;
    activeOnly?: boolean;
  }) => {
    const q = new URLSearchParams();
    if (params?.serviceId) q.set("serviceId", params.serviceId);
    if (params?.academicYearId) q.set("academicYearId", params.academicYearId);
    if (params?.unitId) q.set("unitId", params.unitId);
    if (params?.classGroupId) q.set("classGroupId", params.classGroupId);
    if (params?.activeOnly) q.set("activeOnly", "true");
    const qs = q.toString();
    return request<CurriculumPlan[]>(`/curriculo/plans${qs ? `?${qs}` : ""}`);
  },
  getCurriculumPlan: (id: string) =>
    request<CurriculumPlan>(`/curriculo/plans/${id}`),
  createCurriculumPlan: (body: CurriculumPlanPayload) =>
    request<CurriculumPlan>("/curriculo/plans", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateCurriculumPlan: (id: string, body: Partial<CurriculumPlanPayload>) =>
    request<CurriculumPlan>(`/curriculo/plans/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteCurriculumPlan: (id: string) =>
    request<{ ok: boolean; id: string }>(`/curriculo/plans/${id}`, {
      method: "DELETE",
    }),
  createCurriculumArea: (body: CurriculumAreaPayload) =>
    request<CurriculumArea>("/curriculo/areas", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateCurriculumArea: (
    id: string,
    body: Partial<Omit<CurriculumAreaPayload, "planId">>,
  ) =>
    request<CurriculumArea>(`/curriculo/areas/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteCurriculumArea: (id: string) =>
    request<{ ok: boolean; id: string }>(`/curriculo/areas/${id}`, {
      method: "DELETE",
    }),
  createCurriculumObjective: (body: CurriculumObjectivePayload) =>
    request<CurriculumObjective>("/curriculo/objectives", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateCurriculumObjective: (
    id: string,
    body: Partial<Omit<CurriculumObjectivePayload, "areaId">>,
  ) =>
    request<CurriculumObjective>(`/curriculo/objectives/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteCurriculumObjective: (id: string) =>
    request<{ ok: boolean; id: string }>(`/curriculo/objectives/${id}`, {
      method: "DELETE",
    }),

  getSchoolManuals: (params?: {
    serviceId?: string;
    academicYearId?: string;
    unitId?: string;
    activeOnly?: boolean;
  }) => {
    const q = new URLSearchParams();
    if (params?.serviceId) q.set("serviceId", params.serviceId);
    if (params?.academicYearId) q.set("academicYearId", params.academicYearId);
    if (params?.unitId) q.set("unitId", params.unitId);
    if (params?.activeOnly) q.set("activeOnly", "true");
    const qs = q.toString();
    return request<SchoolManual[]>(
      `/curriculo/manuais${qs ? `?${qs}` : ""}`,
    );
  },
  getMySchoolManuals: () =>
    request<SchoolManualMineEntry[]>("/curriculo/manuais/mine"),
  createSchoolManual: (body: SchoolManualPayload) =>
    request<SchoolManual>("/curriculo/manuais", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateSchoolManual: (id: string, body: Partial<SchoolManualPayload>) =>
    request<SchoolManual>(`/curriculo/manuais/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteSchoolManual: (id: string) =>
    request<{ ok: boolean; id: string }>(`/curriculo/manuais/${id}`, {
      method: "DELETE",
    }),

  getMeetings: (params?: {
    unitId?: string;
    classGroupId?: string;
    type?: MeetingType;
    status?: MeetingStatus;
  }) => {
    const q = new URLSearchParams();
    if (params?.unitId) q.set("unitId", params.unitId);
    if (params?.classGroupId) q.set("classGroupId", params.classGroupId);
    if (params?.type) q.set("type", params.type);
    if (params?.status) q.set("status", params.status);
    const qs = q.toString();
    return request<Meeting[]>(`/reunioes${qs ? `?${qs}` : ""}`);
  },
  getMyMeetings: () => request<MeetingMine[]>("/reunioes/mine"),
  getMeeting: (id: string) => request<Meeting>(`/reunioes/${id}`),
  createMeeting: (body: MeetingPayload) =>
    request<Meeting>("/reunioes", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateMeeting: (id: string, body: Partial<MeetingPayload>) =>
    request<Meeting>(`/reunioes/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteMeeting: (id: string) =>
    request<{ ok: boolean; id: string }>(`/reunioes/${id}`, {
      method: "DELETE",
    }),
  upsertMeetingMinutes: (
    meetingId: string,
    body: { content: string; status?: MeetingMinutesStatus },
  ) =>
    request<MeetingMinutes>(`/reunioes/${meetingId}/acta`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  publishMeetingMinutes: (meetingId: string) =>
    request<MeetingMinutes>(`/reunioes/${meetingId}/acta/publish`, {
      method: "POST",
    }),
  unpublishMeetingMinutes: (meetingId: string) =>
    request<MeetingMinutes>(`/reunioes/${meetingId}/acta/unpublish`, {
      method: "POST",
    }),
  getMeetingMinutesPrint: (meetingId: string) =>
    request<{
      meetingId: string;
      title: string;
      text: string;
      status: MeetingMinutesStatus;
    }>(`/reunioes/${meetingId}/acta/print`),

  getDescriptiveReports: (params?: {
    unitId?: string;
    studentId?: string;
    academicYearId?: string;
    status?: DescriptiveReportStatus;
  }) => {
    const q = new URLSearchParams();
    if (params?.unitId) q.set("unitId", params.unitId);
    if (params?.studentId) q.set("studentId", params.studentId);
    if (params?.academicYearId) q.set("academicYearId", params.academicYearId);
    if (params?.status) q.set("status", params.status);
    const qs = q.toString();
    return request<DescriptiveReport[]>(`/sinteses${qs ? `?${qs}` : ""}`);
  },
  createDescriptiveReport: (body: DescriptiveReportPayload) =>
    request<DescriptiveReport>("/sinteses", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateDescriptiveReport: (
    id: string,
    body: Partial<Omit<DescriptiveReportPayload, "studentId">>,
  ) =>
    request<DescriptiveReport>(`/sinteses/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  publishDescriptiveReport: (id: string) =>
    request<DescriptiveReport>(`/sinteses/${id}/publish`, { method: "POST" }),
  unpublishDescriptiveReport: (id: string) =>
    request<DescriptiveReport>(`/sinteses/${id}/unpublish`, { method: "POST" }),
  deleteDescriptiveReport: (id: string) =>
    request<{ ok: boolean; id: string }>(`/sinteses/${id}`, {
      method: "DELETE",
    }),
  getMyDescriptiveReports: () =>
    request<DescriptiveReport[]>("/sinteses/mine"),

  getSubstitutions: (params?: {
    classGroupId?: string;
    dateFrom?: string;
    dateTo?: string;
    status?: SubstitutionStatus;
    unitId?: string;
  }) => {
    const q = new URLSearchParams();
    if (params?.classGroupId) q.set("classGroupId", params.classGroupId);
    if (params?.dateFrom) q.set("dateFrom", params.dateFrom);
    if (params?.dateTo) q.set("dateTo", params.dateTo);
    if (params?.status) q.set("status", params.status);
    if (params?.unitId) q.set("unitId", params.unitId);
    const qs = q.toString();
    return request<Substitution[]>(`/substituicoes${qs ? `?${qs}` : ""}`);
  },
  createSubstitution: (body: SubstitutionPayload) =>
    request<Substitution>("/substituicoes", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateSubstitution: (id: string, body: Partial<SubstitutionPayload>) =>
    request<Substitution>(`/substituicoes/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteSubstitution: (id: string) =>
    request<{ ok: boolean; id: string }>(`/substituicoes/${id}`, {
      method: "DELETE",
    }),

  getSmsStatus: () => request<SmsStatusInfo>("/sms/status"),
  getSmsLogs: (limit = 50) =>
    request<SmsLog[]>(`/sms/logs?limit=${limit}`),
  sendSms: (body: {
    body: string;
    unitId?: string | null;
    classGroupId?: string | null;
    to?: string | null;
  }) =>
    request<SmsSendResult>("/sms/send", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  sendSmsFromCommunication: (
    communicationId: string,
    bodyOverride?: string | null,
  ) =>
    request<SmsSendResult>(`/sms/communication/${communicationId}`, {
      method: "POST",
      body: JSON.stringify({ bodyOverride: bodyOverride ?? null }),
    }),

  getAdminTestimonials: () =>
    request<PublicTestimonial[]>("/cms/admin/testimonials"),
  createTestimonial: (body: {
    authorName: string;
    text: string;
    unitName?: string;
    featured?: boolean;
    status?: string;
  }) =>
    request("/cms/admin/testimonials", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateTestimonial: (
    id: string,
    body: Partial<{
      authorName: string;
      text: string;
      unitName: string | null;
      featured: boolean;
      status: string;
      sortOrder: number;
    }>,
  ) =>
    request(`/cms/admin/testimonials/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteTestimonial: (id: string) =>
    request(`/cms/admin/testimonials/${id}`, { method: "DELETE" }),
  submitTestimonial: (id: string) =>
    request<PublicTestimonial>(`/cms/admin/testimonials/${id}/submit`, {
      method: "PATCH",
    }),
  publishTestimonial: (id: string, publishAt?: string | null) =>
    request<PublicTestimonial>(`/cms/admin/testimonials/${id}/publish`, {
      method: "PATCH",
      body: JSON.stringify({ publishAt: publishAt ?? null }),
    }),
  getMediaLibrary: (category?: string) =>
    request<MediaAsset[]>(
      category
        ? `/cms/admin/media?category=${encodeURIComponent(category)}`
        : "/cms/admin/media",
    ),
  uploadMedia: async (file: File, altText?: string, category?: string) => {
    const form = new FormData();
    form.append("file", file);
    if (altText) form.append("altText", altText);
    if (category) form.append("category", category);
    const res = await fetch(`${API_BASE}/cms/admin/media`, {
      method: "POST",
      credentials: "include",
      body: form,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || "Upload falhou");
    return data as MediaAsset;
  },
  updateMedia: (
    id: string,
    body: { altText?: string | null; category?: string | null },
  ) =>
    request<MediaAsset>(`/cms/admin/media/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteMedia: (id: string) =>
    request<{ ok: boolean }>(`/cms/admin/media/${id}`, { method: "DELETE" }),
  getGalleryAdmin: () => request<GalleryAlbum[]>("/cms/admin/gallery"),
  createAlbum: (body: { title: string; slug?: string; sortOrder?: number }) =>
    request<GalleryAlbum>("/cms/admin/gallery", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateAlbum: (
    id: string,
    body: {
      title?: string;
      slug?: string;
      sortOrder?: number;
      status?: string;
    },
  ) =>
    request<GalleryAlbum>(`/cms/admin/gallery/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteAlbum: (id: string) =>
    request<{ ok: boolean }>(`/cms/admin/gallery/${id}`, { method: "DELETE" }),
  submitAlbum: (id: string) =>
    request<GalleryAlbum>(`/cms/admin/gallery/${id}/submit`, {
      method: "PATCH",
    }),
  publishAlbum: (id: string, publishAt?: string | null) =>
    request<GalleryAlbum>(`/cms/admin/gallery/${id}/publish`, {
      method: "PATCH",
      body: JSON.stringify({ publishAt: publishAt ?? null }),
    }),
  archiveAlbum: (id: string) =>
    request<GalleryAlbum>(`/cms/admin/gallery/${id}/archive`, {
      method: "PATCH",
    }),
  addGalleryItem: (
    albumId: string,
    body: { mediaId: string; title?: string; caption?: string; sortOrder?: number },
  ) =>
    request<GalleryItem>(`/cms/admin/gallery/${albumId}/items`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateGalleryItem: (
    itemId: string,
    body: {
      title?: string | null;
      caption?: string | null;
      sortOrder?: number;
      mediaId?: string;
    },
  ) =>
    request<GalleryItem>(`/cms/admin/gallery/items/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  removeGalleryItem: (itemId: string) =>
    request<{ ok: boolean }>(`/cms/admin/gallery/items/${itemId}`, {
      method: "DELETE",
    }),
  getEvents: () => request<EventItem[]>("/events"),
  getEvent: (id: string) => request<EventItem>(`/events/${id}`),
  createEvent: (body: EventPayload) =>
    request<EventItem>("/events", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateEvent: (id: string, body: Partial<EventPayload>) =>
    request<EventItem>(`/events/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  publishEvent: (id: string, publishAt?: string | null) =>
    request<EventItem>(`/events/${id}/publish`, {
      method: "POST",
      body: JSON.stringify({ publishAt: publishAt ?? null }),
    }),
  archiveEvent: (id: string) =>
    request<EventItem>(`/events/${id}/archive`, { method: "POST" }),
  deleteEvent: (id: string) =>
    request<{ ok: boolean; id: string }>(`/events/${id}`, { method: "DELETE" }),
  getEventRegistrations: (id: string) =>
    request<EventRegistration[]>(`/events/${id}/registrations`),
  updateEventRegistration: (
    registrationId: string,
    status: EventRegistrationStatus,
  ) =>
    request<EventRegistration>(`/events/registrations/${registrationId}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  processScheduledEvents: () =>
    request<{ processed: number; message: string }>(
      "/events/admin/process-scheduled",
      { method: "POST" },
    ),
  registerForEvent: (id: string, body: EventRegisterPayload) =>
    request<EventRegistration>(`/events/${id}/register`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  getMyEventRegistrations: () =>
    request<MyEventRegistration[]>("/events/mine/registrations"),
  cancelMyEventRegistration: (registrationId: string) =>
    request<{ ok: boolean; id: string }>(
      `/events/registrations/${registrationId}/mine`,
      { method: "DELETE" },
    ),

  // ----------------------------- Financeiro -----------------------------
  getFeePlans: () => request<FeePlan[]>("/financeiro/fee-plans"),
  createFeePlan: (body: FeePlanPayload) =>
    request<FeePlan>("/financeiro/fee-plans", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateFeePlan: (id: string, body: Partial<FeePlanPayload>) =>
    request<FeePlan>(`/financeiro/fee-plans/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteFeePlan: (id: string) =>
    request<{ ok: boolean; id: string }>(`/financeiro/fee-plans/${id}`, {
      method: "DELETE",
    }),
  getFinanceiroOverview: () =>
    request<FinanceiroOverview>("/financeiro/overview"),
  getFinanceiroStudents: () =>
    request<FinanceiroStudentBalance[]>("/financeiro/students"),
  setStudentProgram: (studentId: string, program: FeeProgram | null) =>
    request<{ id: string; childFullName: string; program: FeeProgram | null }>(
      `/financeiro/students/${studentId}/program`,
      { method: "PATCH", body: JSON.stringify({ program }) },
    ),
  getInvoices: (params?: {
    studentId?: string;
    status?: InvoiceStatus;
    month?: string;
  }) => {
    const qs = new URLSearchParams();
    if (params?.studentId) qs.set("studentId", params.studentId);
    if (params?.status) qs.set("status", params.status);
    if (params?.month) qs.set("month", params.month);
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return request<Invoice[]>(`/financeiro/invoices${suffix}`);
  },
  getInvoice: (id: string) => request<Invoice>(`/financeiro/invoices/${id}`),
  createInvoice: (body: InvoicePayload) =>
    request<Invoice>("/financeiro/invoices", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  generateInvoices: (body: GenerateInvoicesPayload) =>
    request<GenerateInvoicesResult>("/financeiro/invoices/generate", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateInvoice: (id: string, body: Partial<InvoiceUpdatePayload>) =>
    request<Invoice>(`/financeiro/invoices/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  cancelInvoice: (id: string) =>
    request<Invoice>(`/financeiro/invoices/${id}/cancel`, { method: "POST" }),
  deleteInvoice: (id: string) =>
    request<{ ok: boolean; id: string }>(`/financeiro/invoices/${id}`, {
      method: "DELETE",
    }),
  processOverdueInvoices: () =>
    request<{ processed: number; message: string }>(
      "/financeiro/invoices/process-overdue",
      { method: "POST" },
    ),
  getInvoicePayments: (id: string) =>
    request<Payment[]>(`/financeiro/invoices/${id}/payments`),
  createPayment: (invoiceId: string, body: PaymentPayload) =>
    request<Invoice>(`/financeiro/invoices/${invoiceId}/payments`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  getMyInvoices: () => request<Invoice[]>("/financeiro/mine/invoices"),

  getPublicEvents: () => publicFetch<PublicEvent[]>("/events/public"),

  // ------------------------- Painel executivo -------------------------
  getDashboardExecutivo: (unitId?: string) =>
    request<DashboardExecutivo>(
      unitId && unitId !== "all"
        ? `/dashboard/executivo?unitId=${encodeURIComponent(unitId)}`
        : "/dashboard/executivo",
    ),

  // ----------------------------- Auditoria -----------------------------
  getAuditoria: (params?: {
    userId?: string;
    action?: string;
    entity?: string;
    from?: string;
    to?: string;
    page?: number;
    pageSize?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params?.userId) qs.set("userId", params.userId);
    if (params?.action) qs.set("action", params.action);
    if (params?.entity) qs.set("entity", params.entity);
    if (params?.from) qs.set("from", params.from);
    if (params?.to) qs.set("to", params.to);
    if (params?.page) qs.set("page", String(params.page));
    if (params?.pageSize) qs.set("pageSize", String(params.pageSize));
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return request<AuditListResult>(`/auditoria${suffix}`);
  },
  getAuditActions: () => request<string[]>("/auditoria/actions"),

  // ------------------------- Cópias de segurança -------------------------
  getBackups: () => request<BackupsResult>("/backups"),
  createBackup: () =>
    request<{ ok: boolean; file: string; sizeBytes: number; message: string }>(
      "/backups",
      { method: "POST" },
    ),
  downloadBackup: (name: string) =>
    downloadFile(`/backups/${encodeURIComponent(name)}/download`, name),

  // ------------------------------- Unidades -------------------------------
  createUnit: (body: { name: string; address?: string }) =>
    request<Unit>("/units", { method: "POST", body: JSON.stringify(body) }),
  updateUnit: (
    id: string,
    body: { name?: string; address?: string; active?: boolean },
  ) =>
    request<Unit>(`/units/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  setUnitService: (unitId: string, serviceId: string, active: boolean) =>
    request(`/units/${unitId}/services`, {
      method: "POST",
      body: JSON.stringify({ serviceId, active }),
    }),

  // ----------------------------- Relatórios -----------------------------
  downloadMapaPropinasXlsx: (month?: string) => {
    const qs = month ? `?month=${encodeURIComponent(month)}` : "";
    const suffix = month ? `-${month}` : "";
    return downloadFile(
      `/relatorios/financeiro/mapa.xlsx${qs}`,
      `mapa-propinas${suffix}.xlsx`,
    );
  },
  downloadFaturacaoXlsx: (from?: string, to?: string) => {
    const qs = new URLSearchParams();
    if (from) qs.set("from", from);
    if (to) qs.set("to", to);
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return downloadFile(
      `/relatorios/financeiro/faturacao.xlsx${suffix}`,
      "faturacao-pagamentos.xlsx",
    );
  },
  downloadMapaFinanceiroPdf: (month?: string) => {
    const qs = month ? `?month=${encodeURIComponent(month)}` : "";
    const suffix = month ? `-${month}` : "";
    return downloadFile(
      `/relatorios/financeiro/mapa.pdf${qs}`,
      `mapa-financeiro${suffix}.pdf`,
    );
  },
  downloadMatriculasXlsx: () =>
    downloadFile("/relatorios/matriculas.xlsx", "matriculas-lista-espera.xlsx"),
  downloadReciboPdf: (paymentId: string) =>
    downloadFile(
      `/relatorios/pagamentos/${paymentId}/recibo.pdf`,
      `recibo-${paymentId}.pdf`,
    ),
};

export type Unit = {
  id: string;
  name: string;
  address?: string | null;
  active?: boolean;
  services: Array<{
    active: boolean;
    service: { id: string; name: string };
  }>;
};

export type DashboardExecutivo = {
  units: Array<{ id: string; name: string }>;
  filterUnitId: string | null;
  referenceMonth: string;
  ocupacao: {
    totalCapacity: number;
    totalEnrolled: number;
    totalAvailable: number;
    occupancyRate: number;
    porUnidade: Array<{
      unit: string;
      capacity: number;
      enrolled: number;
      available: number;
    }>;
    porServico: Array<{
      service: string;
      capacity: number;
      enrolled: number;
      available: number;
    }>;
  };
  admissoes: {
    alunosMatriculados: number;
    candidaturasPendentes: number;
    listaEspera: number;
    renovacoesPendentes: number;
    renovacoesReservadas: number;
  };
  financeiro: {
    acumulado: FinanceiroKpi;
    mesActual: FinanceiroKpi;
  };
  actividadeRecente: {
    inscricoes: Array<{
      id: string;
      childFullName: string;
      status: string;
      unit: string;
      service: string;
      createdAt: string;
    }>;
    pagamentos: Array<{
      id: string;
      amountAkz: number;
      paidAt: string;
      createdAt: string;
      childFullName: string;
      referenceMonth: string;
    }>;
    comunicados: Array<{
      id: string;
      title: string;
      audience: string;
      publishedAt: string | null;
    }>;
  };
};

export type FinanceiroKpi = {
  faturadoAkz: number;
  recebidoAkz: number;
  emDividaAkz: number;
  taxaCobranca: number;
};

export type AuditLogEntry = {
  id: string;
  userId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  metadata: unknown;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
};

export type AuditListResult = {
  items: AuditLogEntry[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export type BackupFile = {
  name: string;
  sizeBytes: number;
  createdAt: string;
};

export type BackupsResult = {
  status: { mysqldumpResolved: string; available: boolean; dir: string };
  backups: BackupFile[];
};

export type ServiceItem = { id: string; name: string; active: boolean };
export type AcademicYear = { id: string; label: string; active: boolean };

export type EnrollmentRoom = {
  id: string;
  name: string;
  levelLabel: string | null;
  ageLabel: string | null;
  minAgeYears: number | null;
  maxAgeYears: number | null;
  capacity: number;
  enrolledCount: number;
  renewalReserved: number;
  enrollmentReserved: number;
  availableVacancies: number;
  ageEligible: boolean;
  canEnroll: boolean;
  unit: string;
  service: string;
};

export type RoomsForEnrollment = {
  childAgeYears: number | null;
  levels: string[];
  rooms: EnrollmentRoom[];
};

export type AdminRoom = {
  id: string;
  name: string;
  unitId: string;
  serviceId: string;
  academicYearId: string;
  levelLabel: string | null;
  ageLabel: string | null;
  minAgeYears: number | null;
  maxAgeYears: number | null;
  capacity: number;
  enrolledCount: number;
  renewalReserved: number;
  enrollmentReserved: number;
  availableVacancies: number;
  active: boolean;
  unit: { id: string; name: string };
  service: { id: string; name: string };
  academicYear: { id: string; label: string };
};

export type RoomDependencies = {
  roomId: string;
  roomName: string;
  classGroups: { count: number; names: string[] };
  enrollments: number;
  renewals: number;
  students: number;
  waitlistEntries: number;
  hasAssociations: boolean;
};

export type RoomDeleteResult = {
  room: AdminRoom;
  cleared: {
    classGroups: { count: number; names: string[] };
    enrollments: number;
    renewals: number;
    students: number;
    waitlistEntries: number;
  };
};

export type CreateRoomPayload = {
  name: string;
  unitId: string;
  serviceId: string;
  academicYearId: string;
  capacity: number;
  levelLabel?: string | null;
  ageLabel?: string | null;
  minAgeYears?: number | null;
  maxAgeYears?: number | null;
  enrolledCount?: number;
  renewalReserved?: number;
  enrollmentReserved?: number;
  active?: boolean;
};

export type EnrollmentPayload = {
  yearLabel: string;
  unitName: string;
  serviceName: string;
  roomId?: string;
  childFullName: string;
  childBirthDate: string;
  childSex: string;
  childBirthPlace?: string;
  childNationality: string;
  childAddress?: string;
  guardianFullName?: string;
  guardianIdNumber?: string;
  guardianPhone?: string;
  guardianAltPhone?: string;
  guardianEmail?: string;
  guardianProfession?: string;
  guardianRelationship?: string;
  guardianAddress?: string;
  emergencyName?: string;
  emergencyPhone?: string;
  emergencyRelation?: string;
  allergies?: string;
  medication?: string;
  foodRestrictions?: string;
  medicalNotes?: string;
  guardians?: Array<{
    fullName: string;
    idNumber?: string;
    phone: string;
    altPhone?: string;
    email?: string;
    profession?: string;
    relationship?: string;
    address?: string;
  }>;
  emergencyContacts?: Array<{
    name: string;
    phone: string;
    relation?: string;
  }>;
  activities?: string[];
  formExtras?: Record<string, unknown>;
  parentConfirmationAccepted: boolean;
};

export type EnrollmentResult = {
  id: string;
  estado: "pendente_validacao" | "lista_espera";
  status: string;
  vagas_disponiveis: number;
  message: string;
  /** Token de curta duração para upload de documentos na candidatura pública. */
  uploadToken?: string;
  room?: { id: string; name: string };
};

export type EnrollmentAdmin = {
  id: string;
  status: string;
  childFullName: string;
  guardianFullName: string;
  guardianEmail: string;
  unit: { name: string };
  service: { name: string };
  room: { name: string } | null;
};

export type DashboardOverview = {
  stats: {
    alunosMatriculados: number;
    vagasDisponiveis: number;
    renovacoesPendentes: number;
    listaEspera: number;
    candidaturasPendentes: number;
  };
  rooms: Array<{
    id: string;
    name: string;
    unit: string;
    service: string;
    capacity: number;
    enrolled: number;
    reserved: number;
    available: number;
  }>;
};

export type WaitlistItem = {
  id: string;
  status: string;
  priority: number;
  notifiedAt?: string | null;
  responseDeadline?: string | null;
  enrollment: {
    id: string;
    childFullName: string;
    status?: string;
    unit: { name: string };
    service: { name: string };
  };
  room?: { name: string } | null;
};

export type PlatformSettings = {
  id: string;
  waitlistResponseHours: number;
  waitlistDeadlineEnabled: boolean;
  smsEnabled: boolean;
  smsProvider: "console" | "http" | string;
  smsApiUrl: string | null;
  smsFrom: string | null;
  smsApiKeyConfigured: boolean;
  updatedAt: string;
};

export type LoginResult = {
  /** Só presente se a API tiver SWAGGER_RETURN_TOKENS=true; o SPA usa cookies. */
  accessToken?: string;
  refreshToken?: string;
  user: {
    id: string;
    email: string;
    role: string;
    name: string;
    modules?: string[];
  };
};

export type StudentProfileStatus = "PENDENTE_FICHA" | "COMPLETA" | string;

export type EnrollmentDocumentMeta = {
  id: string;
  type: string;
  fileName: string;
  /** @deprecated Não usar URL estática — descarregar via downloadEnrollmentDocument */
  filePath?: string;
  mimeType?: string | null;
  createdAt?: string;
};

export type GuardianEnrollment = {
  id: string;
  status: string;
  childFullName: string;
  guardianFullName: string;
  guardianEmail: string;
  guardianPhone: string;
  childBirthDate?: string | null;
  createdAt: string;
  unit: { id: string; name: string };
  service: { id: string; name: string };
  academicYear: { id: string; label: string };
  room: { id: string; name: string } | null;
  waitlistEntry?: {
    id: string;
    status: string;
    responseDeadline?: string | null;
    notifiedAt?: string | null;
  } | null;
  documents: EnrollmentDocumentMeta[];
  student?: { id: string; profileStatus: StudentProfileStatus } | null;
};

export type GuardianRenewal = {
  id: string;
  status: string;
  childFullName: string;
  createdAt: string;
  unit: { id: string; name: string };
  service: { id: string; name: string };
  academicYear: { id: string; label: string };
  room: { id: string; name: string } | null;
  student?: { id: string; profileStatus: StudentProfileStatus } | null;
};

export type Student = {
  id: string;
  childFullName: string;
  childBirthDate: string | null;
  childSex: string | null;
  childBirthPlace: string | null;
  childNationality: string | null;
  childAddress: string | null;
  guardianFullName: string;
  guardianIdNumber: string | null;
  guardianPhone: string;
  guardianAltPhone: string | null;
  guardianEmail: string;
  guardianProfession: string | null;
  guardianRelationship: string | null;
  guardianAddress: string | null;
  emergencyName: string | null;
  emergencyPhone: string | null;
  emergencyRelation: string | null;
  allergies: string | null;
  medication: string | null;
  foodRestrictions: string | null;
  medicalNotes: string | null;
  guardians?: EnrollmentPayload["guardians"] | null;
  emergencyContacts?: EnrollmentPayload["emergencyContacts"] | null;
  activities?: string[] | null;
  profileStatus: StudentProfileStatus;
  unit?: { id: string; name: string };
  service?: { id: string; name: string };
  academicYear?: { id: string; label: string };
  room?: { id: string; name: string } | null;
  enrollment?: {
    id: string;
    status: string;
    documents?: EnrollmentDocumentMeta[];
    waitlistEntry?: {
      id: string;
      status: string;
      responseDeadline?: string | null;
    } | null;
  } | null;
  renewal?: {
    id: string;
    status: string;
    createdAt?: string;
  } | null;
};

export type ActivityOffering = {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  active: boolean;
  sortOrder: number;
  pricing?: "INCLUDED" | "PAID";
  priceAkz?: number | null;
  serviceName?: string;
  services?: Array<{
    id: string;
    unitId?: string | null;
    pricing: "INCLUDED" | "PAID";
    priceAkz: number | null;
    service: { id: string; name: string };
    unit?: { id: string; name: string } | null;
  }>;
};

export type ActivityPayload = {
  name: string;
  category?: string | null;
  description?: string | null;
  active?: boolean;
  sortOrder?: number;
  services?: Array<{
    unitId?: string | null;
    serviceId: string;
    pricing: "INCLUDED" | "PAID";
    priceAkz?: number | null;
  }>;
};

export type StudentFichaPayload = {
  childFullName?: string;
  childBirthDate?: string;
  childSex?: string;
  childBirthPlace?: string;
  childNationality?: string;
  childAddress?: string;
  guardianFullName?: string;
  guardianIdNumber?: string;
  guardianPhone?: string;
  guardianAltPhone?: string;
  guardianEmail?: string;
  guardianProfession?: string;
  guardianRelationship?: string;
  guardianAddress?: string;
  emergencyName?: string;
  emergencyPhone?: string;
  emergencyRelation?: string;
  allergies?: string;
  medication?: string;
  foodRestrictions?: string;
  medicalNotes?: string;
  guardians?: EnrollmentPayload["guardians"];
  emergencyContacts?: EnrollmentPayload["emergencyContacts"];
  activities?: string[];
};

export type RenewalPayload = {
  yearLabel: string;
  unitName: string;
  serviceName: string;
  roomId?: string;
  childFullName: string;
  childBirthDate?: string;
  childSex?: string;
  childBirthPlace?: string;
  childNationality?: string;
  childAddress?: string;
  guardianFullName?: string;
  guardianIdNumber?: string;
  guardianPhone?: string;
  guardianAltPhone?: string;
  guardianEmail?: string;
  guardianProfession?: string;
  guardianRelationship?: string;
  guardianAddress?: string;
  emergencyName?: string;
  emergencyPhone?: string;
  emergencyRelation?: string;
  allergies?: string;
  medication?: string;
  foodRestrictions?: string;
  medicalNotes?: string;
  previousYearLabel?: string;
  notes?: string;
  guardians?: EnrollmentPayload["guardians"];
  emergencyContacts?: EnrollmentPayload["emergencyContacts"];
  activities?: string[];
  formExtras?: Record<string, unknown>;
  parentConfirmationAccepted: boolean;
};

export type RenewalItem = {
  id: string;
  status: string;
  childFullName: string;
  guardianFullName: string;
  guardianEmail: string;
  guardianPhone: string;
  previousYearLabel: string | null;
  notes: string | null;
  unit: { name: string };
  service: { name: string };
  academicYear: { label: string };
  room: { name: string } | null;
};

export type JobOpening = {
  id: string;
  title: string;
  department: string | null;
  location: string | null;
  description: string;
  requirements: string | null;
  status: string;
  publishedAt: string | null;
};

export type JobPayload = {
  title: string;
  department?: string;
  location?: string;
  description: string;
  requirements?: string;
  status?: string;
};

export type AccessProfile = {
  id: string;
  name: string;
  description: string | null;
  systemKey: string | null;
  modules: string[] | unknown;
  active: boolean;
  _count?: { users: number };
};

export type PlatformUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  accessProfileId: string | null;
  accessProfile?: {
    id: string;
    name: string;
    modules: string[] | unknown;
    systemKey: string | null;
  } | null;
  createdAt: string;
};

export type CmsPage = {
  id: string;
  slug: string;
  title: string;
  status: string;
  sections: Array<{ key: string; label: string; value: string }>;
};

export type PublicCmsPage = {
  title: string;
  sections: Array<{ key: string; label: string; value: string }>;
};

export type PublicTestimonial = {
  id: string;
  authorName: string;
  text: string;
  unitName: string | null;
  featured?: boolean;
  status?: string;
  publishAt?: string | null;
  publishedAt?: string | null;
};

export type ContentStatus =
  | "RASCUNHO"
  | "EM_REVISAO"
  | "PUBLICADO"
  | "ARQUIVADO";

export type MediaAsset = {
  id: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  filePath: string;
  altText: string | null;
  category: string | null;
  createdAt: string;
};

export type GalleryItem = {
  id: string;
  albumId: string;
  mediaId: string;
  title: string | null;
  caption: string | null;
  sortOrder: number;
  media?: MediaAsset;
};

export type GalleryAlbum = {
  id: string;
  title: string;
  slug: string;
  status: ContentStatus;
  sortOrder: number;
  publishAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: GalleryItem[];
};

export type PublicGalleryAlbum = {
  id: string;
  title: string;
  slug: string;
  sortOrder: number;
  items: Array<{
    id: string;
    title: string | null;
    caption: string | null;
    media?: { filePath: string; altText: string | null };
  }>;
};

export type ClassGroup = {
  id: string;
  name: string;
  teacherName: string | null;
  notes: string | null;
  active: boolean;
  roomId: string;
  academicYearId: string;
  room: {
    name: string;
    unit: { name: string };
    service: { name: string };
  };
  academicYear: { label: string };
};

export type AttendanceStatus =
  | "PRESENTE"
  | "FALTA"
  | "FALTA_JUSTIFICADA"
  | "ATRASO";

export type AttendanceTurma = {
  id: string;
  name: string;
  teacherName: string | null;
  active: boolean;
  roomId: string;
  academicYearId: string;
  studentCount: number;
  room: {
    name: string;
    unit: { name: string };
    service: { name: string };
  };
  academicYear: { label: string };
};

export type AttendanceStudentRow = {
  studentId: string;
  childFullName: string;
  status: AttendanceStatus | null;
  note: string | null;
  recordedAt: string | null;
};

export type AttendanceTurmaDay = {
  classGroup: AttendanceTurma;
  date: string;
  students: AttendanceStudentRow[];
};

export type StudentAttendance = {
  id: string;
  date: string;
  status: AttendanceStatus;
  note: string | null;
  classGroup: {
    name: string;
    room: { name: string; unit: { name: string }; service: { name: string } };
    academicYear: { label: string };
  };
};

export type UpsertCmsPage = {
  title: string;
  status?: string;
  sections: Array<{ key: string; label: string; value: string }>;
};

export type CommunicationAudience =
  | "ESCOLA"
  | "UNIDADE"
  | "SERVICO"
  | "TURMA"
  | "ENCARREGADO";

export type CommunicationStatus = "RASCUNHO" | "PUBLICADO" | "ARQUIVADO";

export type Communication = {
  id: string;
  title: string;
  body: string;
  audience: CommunicationAudience;
  status: CommunicationStatus;
  attachmentUrl: string | null;
  unitId: string | null;
  serviceId: string | null;
  classGroupId: string | null;
  targetUserId: string | null;
  targetGuardianEmail: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  author: { id: string; name: string; email: string } | null;
  unit: { id: string; name: string } | null;
  service: { id: string; name: string } | null;
  classGroup: {
    id: string;
    name: string;
    room: { name: string; unit: { name: string }; service: { name: string } };
    academicYear: { label: string };
  } | null;
  _count?: { reads: number };
};

export type CommunicationForMe = Communication & {
  readAt: string | null;
};

export type CommunicationPayload = {
  title: string;
  body: string;
  audience: CommunicationAudience;
  status?: CommunicationStatus;
  unitId?: string | null;
  serviceId?: string | null;
  classGroupId?: string | null;
  targetUserId?: string | null;
  targetGuardianEmail?: string | null;
  attachmentUrl?: string | null;
  sendEmail?: boolean;
};

type AcademicoClassGroupRef = {
  id: string;
  name: string;
  room: { name: string; unit: { name: string }; service: { name: string } };
  academicYear: { label: string };
};

export type LessonSummary = {
  id: string;
  classGroupId: string;
  date: string;
  subject: string;
  topic: string | null;
  description: string;
  homework: string | null;
  createdAt: string;
  updatedAt: string;
  author: { id: string; name: string } | null;
  classGroup?: AcademicoClassGroupRef;
};

export type LessonSummaryPayload = {
  classGroupId: string;
  date: string;
  subject: string;
  topic?: string | null;
  description: string;
  homework?: string | null;
};

export type AssessmentGradeType = "NUMERICA" | "QUALITATIVA";

export type Assessment = {
  id: string;
  studentId: string;
  classGroupId: string;
  periodId?: string | null;
  title: string;
  subject: string;
  date: string;
  gradeType: AssessmentGradeType;
  gradeValue: number | null;
  gradeLabel: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  author: { id: string; name: string } | null;
  student?: { id: string; childFullName: string };
  classGroup?: AcademicoClassGroupRef;
  period?: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
  } | null;
};

export type AssessmentPayload = {
  studentId: string;
  classGroupId: string;
  title: string;
  subject: string;
  date: string;
  gradeType: AssessmentGradeType;
  gradeValue?: number | null;
  gradeLabel?: string | null;
  note?: string | null;
  periodId?: string | null;
};

export type ReportCardStatus = "RASCUNHO" | "PUBLICADO";

export type AssessmentPeriod = {
  id: string;
  name: string;
  academicYearId: string;
  unitId: string | null;
  startDate: string;
  endDate: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  academicYear?: { id: string; label: string; active: boolean };
  unit?: { id: string; name: string } | null;
  _count?: { assessments: number; reportCards: number };
};

export type AssessmentPeriodPayload = {
  name: string;
  academicYearId: string;
  unitId?: string | null;
  startDate: string;
  endDate: string;
  sortOrder?: number;
};

export type ReportCardLine = {
  id: string;
  reportCardId: string;
  subject: string;
  title: string;
  gradeType: AssessmentGradeType | null;
  gradeValue: number | null;
  gradeLabel: string | null;
  comment: string | null;
  sourceType: string;
  sourceId: string | null;
  sortOrder: number;
};

export type ReportCardLinePayload = {
  subject: string;
  title: string;
  gradeType?: AssessmentGradeType | null;
  gradeValue?: number | null;
  gradeLabel?: string | null;
  comment?: string | null;
  sourceType?: string;
  sourceId?: string | null;
  sortOrder?: number;
};

export type ReportCard = {
  id: string;
  studentId: string;
  periodId: string;
  classGroupId: string;
  status: ReportCardStatus;
  overallComment: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  student?: {
    id: string;
    childFullName: string;
    guardianEmail?: string;
    unit?: { id: string; name: string } | null;
    service?: { id: string; name: string } | null;
    room?: { id: string; name: string } | null;
    academicYear?: { id: string; label: string } | null;
  };
  period?: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    academicYear?: { id: string; label: string };
    unit?: { id: string; name: string } | null;
  };
  classGroup?: AcademicoClassGroupRef;
  author?: { id: string; name: string } | null;
  lines?: ReportCardLine[];
};

export type DashboardAcademico = {
  units: Array<{ id: string; name: string }>;
  years: Array<{ id: string; label: string; active: boolean }>;
  filterUnitId: string | null;
  academicYear: { id: string; label: string; active: boolean } | null;
  kpis: {
    alunos: number;
    turmas: number;
    taxaAssiduidade: number | null;
    coberturaAvaliacoes: number | null;
    sumariosRegistados: number;
    neeActivos: number;
    peiAbertos: number;
    incidentesComportamento: number;
  };
  porUnidade: Array<{
    unitId: string;
    unit: string;
    turmas: number;
    studentCount: number;
    attendanceRate: number | null;
    assessmentCoverage: number | null;
    lessonSummaries: number;
  }>;
  porTurma: Array<{
    classGroupId: string;
    name: string;
    unit: string;
    unitId: string;
    service: string;
    academicYear: string;
    studentCount: number;
    attendanceRate: number | null;
    attendanceRecords: number;
    assessmentCoverage: number | null;
    studentsWithAssessments: number;
    lessonSummaries: number;
  }>;
};

export type DashboardPedagogico = {
  units: Array<{ id: string; name: string }>;
  years: Array<{ id: string; label: string; active: boolean }>;
  periods: Array<{
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    academicYearId: string;
    unitId: string | null;
  }>;
  filterUnitId: string | null;
  academicYear: { id: string; label: string; active: boolean } | null;
  period: { id: string; name: string; startDate: string; endDate: string } | null;
  kpis: {
    turmas: number;
    alunos: number;
    neeActivos: number;
    peiActivos: number;
    peiRevisaoEmDia: number | null;
    boletinsPublicados: number;
    boletinsTotal: number;
    coberturaPublicacaoBoletins: number | null;
    substituicoesTotal: number;
    turmasComSubstituicoes: number;
  };
  attendanceTrendByTurma: Array<{
    classGroupId: string;
    turma: string;
    unit: string;
    service: string;
    attendanceRate: number | null;
    attendanceRecords: number;
  }>;
  assessmentDistribution: {
    total: number;
    numericBands: Array<{ band: string; count: number }>;
    qualitativeCounts: Array<{ label: string; count: number }>;
  };
  behaviorTrend: Array<{
    month: string;
    positivos: number;
    incidentes: number;
  }>;
  substitutions: {
    total: number;
    affectedClasses: number;
    byClass: Array<{ classGroupId: string; turma: string; count: number }>;
  };
};

export type ScheduleEntry = {
  id: string;
  classGroupId: string;
  weekday: number;
  startTime: string;
  endTime: string;
  subject: string;
  room: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ScheduleEntryPayload = {
  classGroupId: string;
  weekday: number;
  startTime: string;
  endTime: string;
  subject: string;
  room?: string | null;
};

export type PeiStatus =
  | "RASCUNHO"
  | "ACTIVO"
  | "EM_REVISAO"
  | "CONCLUIDO"
  | "ARQUIVADO";

export type NeeProfile = {
  id: string;
  studentId: string;
  active: boolean;
  diagnosisSummary: string | null;
  notes: string | null;
  identifiedAt: string | null;
  createdAt?: string;
  updatedAt?: string;
  student?: {
    id: string;
    childFullName: string;
    unit?: { id: string; name: string };
    service?: { id: string; name: string };
    room?: { id: string; name: string } | null;
    academicYear?: { id: string; label: string };
  };
  _count?: { peiPlans: number };
};

export type UpsertNeeProfilePayload = {
  studentId: string;
  active?: boolean;
  diagnosisSummary?: string | null;
  notes?: string | null;
  identifiedAt?: string | null;
};

export type PeiReview = {
  id: string;
  peiPlanId?: string;
  date: string;
  notes: string;
  authorId?: string | null;
  author?: { id: string; name: string; email: string } | null;
  createdAt?: string;
};

export type PeiPlan = {
  id: string;
  studentId: string;
  neeProfileId: string | null;
  academicYearId: string | null;
  status: PeiStatus;
  title: string | null;
  objectives: string;
  strategies: string | null;
  supports: string | null;
  guardianSummary: string | null;
  responsibleTeacher: string | null;
  coordinatorNotes: string | null;
  reviewDate: string | null;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
  student?: {
    id: string;
    childFullName: string;
    unitId?: string;
    unit?: { id: string; name: string };
    service?: { id: string; name: string };
    room?: { id: string; name: string } | null;
    academicYear?: { id: string; label: string };
  };
  academicYear?: { id: string; label: string } | null;
  neeProfile?: {
    id: string;
    active: boolean;
    diagnosisSummary: string | null;
    notes: string | null;
    identifiedAt: string | null;
  } | null;
  createdBy?: { id: string; name: string; email: string } | null;
  reviews?: PeiReview[];
};

export type PeiPlanPayload = {
  studentId: string;
  academicYearId?: string | null;
  status?: PeiStatus;
  title?: string | null;
  objectives: string;
  strategies?: string | null;
  supports?: string | null;
  guardianSummary?: string | null;
  responsibleTeacher?: string | null;
  coordinatorNotes?: string | null;
  reviewDate?: string | null;
};

export type PeiPlanMine = {
  id: string;
  status: PeiStatus;
  title: string | null;
  objectives: string;
  strategies: string | null;
  supports: string | null;
  summary: string;
  responsibleTeacher: string | null;
  reviewDate: string | null;
  academicYear: { id: string; label: string } | null;
  recentReviews: Array<{ id: string; date: string; notes: string }>;
  student: {
    id: string;
    childFullName: string;
    unit?: { id: string; name: string };
    room?: { id: string; name: string } | null;
    academicYear?: { id: string; label: string };
    hasNee: boolean;
  };
};

export type CurriculumObjective = {
  id: string;
  areaId?: string;
  code: string | null;
  title: string;
  description: string | null;
  sortOrder: number;
};

export type CurriculumArea = {
  id: string;
  planId?: string;
  name: string;
  code: string | null;
  description: string | null;
  sortOrder: number;
  objectives?: CurriculumObjective[];
};

export type CurriculumPlan = {
  id: string;
  name: string;
  description: string | null;
  serviceId: string;
  academicYearId: string | null;
  unitId: string | null;
  levelLabel: string | null;
  classGroupId: string | null;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
  service?: { id: string; name: string };
  academicYear?: { id: string; label: string } | null;
  unit?: { id: string; name: string } | null;
  classGroup?: {
    id: string;
    name: string;
    teacherName: string | null;
    room?: {
      name: string;
      unit?: { name: string };
      service?: { name: string };
    };
  } | null;
  areas?: CurriculumArea[];
};

export type CurriculumPlanPayload = {
  name: string;
  description?: string | null;
  serviceId: string;
  academicYearId?: string | null;
  unitId?: string | null;
  levelLabel?: string | null;
  classGroupId?: string | null;
  active?: boolean;
};

export type CurriculumAreaPayload = {
  planId: string;
  name: string;
  code?: string | null;
  description?: string | null;
  sortOrder?: number;
};

export type CurriculumObjectivePayload = {
  areaId: string;
  title: string;
  code?: string | null;
  description?: string | null;
  sortOrder?: number;
};

export type CurriculumMineEntry = {
  student: {
    id: string;
    childFullName: string;
    service?: { id: string; name: string };
    unit?: { id: string; name: string };
    academicYear?: { id: string; label: string };
  };
  plans: CurriculumPlan[];
};

export type SchoolManual = {
  id: string;
  title: string;
  subjectArea: string | null;
  serviceId: string | null;
  publisher: string | null;
  academicYearId: string | null;
  unitId: string | null;
  mediaUrl: string | null;
  active: boolean;
  notes: string | null;
  createdAt?: string;
  service?: { id: string; name: string } | null;
  academicYear?: { id: string; label: string } | null;
  unit?: { id: string; name: string } | null;
  createdBy?: { id: string; name: string } | null;
};

export type SchoolManualPayload = {
  title: string;
  subjectArea?: string | null;
  serviceId?: string | null;
  publisher?: string | null;
  academicYearId?: string | null;
  unitId?: string | null;
  mediaUrl?: string | null;
  active?: boolean;
  notes?: string | null;
};

export type SchoolManualMineEntry = {
  student: {
    id: string;
    childFullName: string;
    service?: { id: string; name: string };
  };
  manuals: SchoolManual[];
};

export type NonTeachingActivity = {
  id: string;
  date: string;
  teacherName: string;
  teacherUserId: string | null;
  classGroupId: string | null;
  type: string;
  description: string;
  durationMinutes: number | null;
  notes: string | null;
  createdAt?: string;
  classGroup?: {
    id: string;
    name: string;
    teacherName: string | null;
    room?: {
      name: string;
      unit?: { name: string };
      service?: { name: string };
    };
  } | null;
  teacherUser?: { id: string; name: string; email: string } | null;
  createdBy?: { id: string; name: string } | null;
};

export type NonTeachingActivityPayload = {
  date: string;
  teacherName: string;
  teacherUserId?: string | null;
  classGroupId?: string | null;
  type: string;
  description: string;
  durationMinutes?: number | null;
  notes?: string | null;
};

export type BehaviorType = "POSITIVO" | "A_MELHORAR" | "INCIDENTE";

export type BehaviorRecord = {
  id: string;
  studentId: string;
  date: string;
  type: BehaviorType;
  description: string;
  authorId: string | null;
  visibleToGuardian: boolean;
  createdAt?: string;
  student?: {
    id: string;
    childFullName: string;
    unit?: { id: string; name: string };
    service?: { id: string; name: string };
    room?: { id: string; name: string } | null;
    academicYear?: { id: string; label: string };
  };
  author?: { id: string; name: string } | null;
};

export type BehaviorRecordPayload = {
  studentId: string;
  date: string;
  type: BehaviorType;
  description: string;
  visibleToGuardian?: boolean;
};

export type StudentQualification = {
  id: string;
  studentId: string;
  title: string;
  issuedAt: string;
  issuer: string | null;
  notes: string | null;
  documentUrl: string | null;
  academicYearId: string | null;
  createdAt?: string;
  student?: {
    id: string;
    childFullName: string;
    unit?: { id: string; name: string };
    service?: { id: string; name: string };
    room?: { id: string; name: string } | null;
    academicYear?: { id: string; label: string };
  };
  academicYear?: { id: string; label: string } | null;
  createdBy?: { id: string; name: string } | null;
};

export type StudentQualificationPayload = {
  studentId: string;
  title: string;
  issuedAt: string;
  issuer?: string | null;
  notes?: string | null;
  documentUrl?: string | null;
  academicYearId?: string | null;
};

export type MeetingType =
  | "PEDAGOGICA"
  | "COORDENACAO"
  | "ENCARREGADOS"
  | "OUTRA";

export type MeetingStatus = "AGENDADA" | "REALIZADA" | "CANCELADA";

export type MeetingMinutesStatus = "RASCUNHO" | "PUBLICADA";

export type MeetingMinutes = {
  id: string;
  meetingId?: string;
  content: string;
  authorId: string | null;
  status: MeetingMinutesStatus;
  publishedAt: string | null;
  author?: { id: string; name: string } | null;
  meeting?: { id: string; title: string; dateTime: string };
};

export type Meeting = {
  id: string;
  title: string;
  dateTime: string;
  type: MeetingType;
  participantsNotes: string | null;
  unitId: string | null;
  classGroupId: string | null;
  status: MeetingStatus;
  visibleToGuardians: boolean;
  location: string | null;
  notes: string | null;
  createdAt?: string;
  unit?: { id: string; name: string } | null;
  classGroup?: {
    id: string;
    name: string;
    room?: {
      name: string;
      unit?: { name: string };
      service?: { name: string };
    };
  } | null;
  createdBy?: { id: string; name: string } | null;
  minutes?: MeetingMinutes | null;
};

export type MeetingPayload = {
  title: string;
  dateTime: string;
  type?: MeetingType;
  participantsNotes?: string | null;
  unitId?: string | null;
  classGroupId?: string | null;
  status?: MeetingStatus;
  visibleToGuardians?: boolean;
  location?: string | null;
  notes?: string | null;
};

export type MeetingMine = {
  id: string;
  title: string;
  dateTime: string;
  type: MeetingType;
  status: MeetingStatus;
  location: string | null;
  unit?: { id: string; name: string } | null;
  classGroup?: { id: string; name: string } | null;
};

export type DescriptiveReportStatus = "RASCUNHO" | "PUBLICADO";

export type DescriptiveReport = {
  id: string;
  studentId: string;
  academicYearId: string | null;
  periodLabel: string;
  areaFocus: string | null;
  body: string;
  status: DescriptiveReportStatus;
  authorId: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  student?: {
    id: string;
    childFullName: string;
    unit?: { id: string; name: string };
    service?: { id: string; name: string };
    room?: { id: string; name: string } | null;
    academicYear?: { id: string; label: string };
  };
  academicYear?: { id: string; label: string } | null;
  author?: { id: string; name: string; email: string } | null;
};

export type DescriptiveReportPayload = {
  studentId: string;
  academicYearId?: string | null;
  periodLabel: string;
  areaFocus?: string | null;
  body: string;
  status?: DescriptiveReportStatus;
};

export type SubstitutionStatus =
  | "PLANEADA"
  | "CONFIRMADA"
  | "CANCELADA"
  | "CONCLUIDA";

export type Substitution = {
  id: string;
  date: string;
  classGroupId: string;
  absentTeacher: string;
  substituteTeacher: string;
  substituteUserId: string | null;
  reason: string | null;
  notes: string | null;
  status: SubstitutionStatus;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
  classGroup?: {
    id: string;
    name: string;
    teacherName: string | null;
    room?: {
      name: string;
      unit?: { id: string; name: string };
      service?: { id: string; name: string };
    };
    academicYear?: { id: string; label: string };
  };
  substituteUser?: { id: string; name: string; email: string } | null;
  createdBy?: { id: string; name: string; email: string } | null;
};

export type SubstitutionPayload = {
  date: string;
  classGroupId: string;
  absentTeacher?: string;
  substituteTeacher: string;
  substituteUserId?: string | null;
  reason?: string | null;
  notes?: string | null;
  status?: SubstitutionStatus;
};

export type SmsDeliveryStatus = "SIMULADO" | "ENVIADO" | "FALHA";

export type SmsStatusInfo = {
  provider: string;
  enabled?: boolean;
  mode: "live" | "simulate";
  statusLabel?: "Simulação" | "Fornecedor activo" | string;
  apiUrlConfigured?: boolean;
  apiKeyConfigured?: boolean;
  message: string;
};

export type SmsLog = {
  id: string;
  to: string;
  body: string;
  status: SmsDeliveryStatus;
  provider: string;
  providerResponse: string | null;
  communicationId: string | null;
  unitId: string | null;
  classGroupId: string | null;
  createdById: string | null;
  createdAt: string;
  createdBy?: { id: string; name: string; email: string } | null;
  communication?: { id: string; title: string } | null;
  unit?: { id: string; name: string } | null;
  classGroup?: { id: string; name: string } | null;
};

export type SmsSendResult = {
  info: SmsStatusInfo;
  count: number;
  logs: SmsLog[];
  error?: string;
};

export type EventType = "FESTA" | "EVENTO" | "PASSEIO" | "WORKSHOP";

export type EventStatus = ContentStatus;

export type EventRegistrationStatus = "INSCRITO" | "LISTA_ESPERA" | "CANCELADO";

export type EventItem = {
  id: string;
  title: string;
  description: string;
  type: EventType;
  status: EventStatus;
  startAt: string;
  endAt: string | null;
  location: string | null;
  unitId: string | null;
  capacity: number | null;
  priceAkz: number | null;
  imageUrl: string | null;
  publishAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  author: { id: string; name: string; email: string } | null;
  unit: { id: string; name: string } | null;
  _count?: { registrations: number };
};

export type EventPayload = {
  title: string;
  description: string;
  type: EventType;
  status?: EventStatus;
  startAt: string;
  endAt?: string | null;
  location?: string | null;
  unitId?: string | null;
  capacity?: number | null;
  priceAkz?: number | null;
  imageUrl?: string | null;
  publishAt?: string | null;
};

export type PublicEvent = {
  id: string;
  title: string;
  description: string;
  type: EventType;
  startAt: string;
  endAt: string | null;
  location: string | null;
  capacity: number | null;
  priceAkz: number | null;
  imageUrl: string | null;
  unit: { id: string; name: string } | null;
  registrationsCount: number;
  spotsRemaining: number | null;
  isFull: boolean;
};

export type EventRegistration = {
  id: string;
  eventId: string;
  guardianUserId: string | null;
  studentId: string | null;
  childName: string;
  guardianName: string;
  guardianEmail: string;
  guardianPhone: string | null;
  attendees: number;
  notes: string | null;
  status: EventRegistrationStatus;
  createdAt: string;
  updatedAt: string;
  student?: { id: string; childFullName: string } | null;
  guardianUser?: { id: string; name: string; email: string } | null;
};

export type EventRegisterPayload = {
  studentId?: string | null;
  childName?: string;
  guardianName?: string;
  guardianEmail?: string;
  guardianPhone?: string | null;
  attendees?: number;
  notes?: string | null;
};

export type MyEventRegistration = {
  id: string;
  eventId: string;
  childName: string;
  guardianName: string;
  guardianEmail: string;
  attendees: number;
  status: EventRegistrationStatus;
  createdAt: string;
  event: {
    id: string;
    title: string;
    type: EventType;
    startAt: string;
    endAt: string | null;
    location: string | null;
    unit: { id: string; name: string } | null;
  };
};

// ----------------------------- Financeiro -----------------------------

export type InvoiceStatus = "PENDENTE" | "PAGO" | "VENCIDO" | "ANULADO";

export type PaymentMethod =
  | "NUMERARIO"
  | "TRANSFERENCIA"
  | "MULTICAIXA"
  | "TPA"
  | "OUTRO";

export type FeeKind = "PROPINA" | "TAXA" | "PRODUTO";

export type FeeProgram =
  | "MEIO_TEMPO"
  | "MEIO_TEMPO_ALIMENTACAO"
  | "TEMPO_INTEIRO"
  | "REGULAR"
  | "INTEGRAL";

export type FeePlan = {
  id: string;
  name: string;
  description: string | null;
  kind: FeeKind;
  amountAkz: number;
  unitId: string | null;
  serviceId: string | null;
  program: FeeProgram | null;
  academicYearId: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  unit?: { id: string; name: string } | null;
  service?: { id: string; name: string } | null;
  academicYear?: { id: string; label: string } | null;
};

export type FeePlanPayload = {
  name: string;
  description?: string | null;
  kind?: FeeKind;
  amountAkz: number;
  unitId?: string | null;
  serviceId?: string | null;
  program?: FeeProgram | null;
  academicYearId?: string | null;
  active?: boolean;
};

export type Payment = {
  id: string;
  invoiceId: string;
  amountAkz: number;
  paidAt: string;
  method: PaymentMethod;
  reference: string | null;
  receiptRef: string | null;
  notes: string | null;
  recordedById: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PaymentPayload = {
  amountAkz: number;
  paidAt: string;
  method?: PaymentMethod;
  reference?: string | null;
  receiptRef?: string | null;
  notes?: string | null;
};

export type Invoice = {
  id: string;
  studentId: string;
  feePlanId: string | null;
  referenceMonth: string;
  description: string;
  amountAkz: number;
  dueDate: string;
  status: InvoiceStatus;
  guardianEmail: string;
  notes: string | null;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
  student?: { id: string; childFullName: string; guardianEmail: string };
  feePlan?: { id: string; name: string } | null;
  payments?: Payment[];
};

export type InvoicePayload = {
  studentId: string;
  feePlanId?: string | null;
  referenceMonth: string;
  description?: string;
  amountAkz?: number;
  dueDate: string;
  notes?: string | null;
};

export type InvoiceUpdatePayload = {
  description?: string;
  amountAkz?: number;
  dueDate?: string;
  status?: InvoiceStatus;
  notes?: string | null;
};

export type GenerateInvoicesPayload = {
  referenceMonth: string;
  dueDate: string;
  feePlanId?: string | null;
  amountAkz?: number;
  description?: string;
  studentIds?: string[];
  applySiblingDiscount?: boolean;
};

export type GenerateInvoicesResult = {
  created: number;
  skipped: number;
  skippedNoPlan?: number;
  resolvedByFallback?: number;
  total: number;
  message: string;
};

export type FinanceiroOverview = {
  studentsCount: number;
  outstandingCount: number;
  totalReceivedAkz: number;
  byStatus: Record<string, { count: number; amountAkz: number }>;
};

export type FinanceiroStudentBalance = {
  id: string;
  childFullName: string;
  guardianFullName: string;
  guardianEmail: string;
  serviceId: string;
  program: FeeProgram | null;
  service: { id: string; name: string } | null;
  unit: { id: string; name: string } | null;
  invoiceCount: number;
  billedAkz: number;
  paidAkz: number;
  outstandingAkz: number;
};
