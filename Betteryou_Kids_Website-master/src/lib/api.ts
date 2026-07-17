export const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") ||
  "http://localhost:3001/api";

/** Disparado quando o access/refresh token deixam de ser válidos. */
export const SESSION_EXPIRED_EVENT = "by:session-expired";

function clearSessionStorage() {
  localStorage.removeItem("by_access_token");
  localStorage.removeItem("by_refresh_token");
  localStorage.removeItem("by_user_name");
  localStorage.removeItem("by_user_role");
}

function expireSession() {
  clearSessionStorage();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
  }
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem("by_refresh_token");
  if (!refreshToken) return null;
  try {
    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      clearSessionStorage();
      return null;
    }
    localStorage.setItem("by_access_token", data.accessToken);
    if (data.refreshToken) {
      localStorage.setItem("by_refresh_token", data.refreshToken);
    }
    return data.accessToken as string;
  } catch {
    clearSessionStorage();
    return null;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  retried = false,
): Promise<T> {
  const token = localStorage.getItem("by_access_token");
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const isAuthCredentialPath =
    path.startsWith("/auth/login") ||
    path.startsWith("/auth/register") ||
    path.startsWith("/auth/refresh") ||
    path.startsWith("/auth/logout");

  if (response.status === 401 && !retried && !isAuthCredentialPath) {
    const nextToken = await refreshAccessToken();
    if (nextToken) {
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

async function publicFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`);
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

export function getPublicCmsPage(slug: string): Promise<PublicCmsPage> {
  return publicFetch<PublicCmsPage>(`/cms/pages/${slug}`);
}

export function getPublicTestimonials(): Promise<PublicTestimonial[]> {
  return publicFetch<PublicTestimonial[]>("/cms/testimonials");
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
  getUnits: () => request<Unit[]>("/units"),
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
  deleteRoom: (id: string) =>
    request<AdminRoom>(`/rooms/${id}`, { method: "DELETE" }),
  createEnrollment: (body: EnrollmentPayload) =>
    request<EnrollmentResult>("/enrollments", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  getEnrollments: (status?: string) =>
    request<EnrollmentAdmin[]>(
      status ? `/enrollments?status=${status}` : "/enrollments",
    ),
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
  getActivitiesPublic: (serviceName?: string) =>
    request<ActivityOffering[]>(
      serviceName
        ? `/activities/public?serviceName=${encodeURIComponent(serviceName)}`
        : "/activities/public",
    ),
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
  login: (email: string, password: string) =>
    request<LoginResult>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  register: (body: { name: string; email: string; password: string }) =>
    request<LoginResult>("/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  getStudents: () => request<Student[]>("/students"),
  getStudent: (id: string) => request<Student>(`/students/${id}`),
  updateStudentFicha: (id: string, body: StudentFichaPayload) =>
    request<Student>(`/students/${id}/ficha`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  getCmsPage: (slug: string) => request<CmsPage>(`/cms/admin/pages/${slug}`),
  saveCmsPage: (slug: string, body: UpsertCmsPage) =>
    request<CmsPage>(`/cms/admin/pages/${slug}`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  publishCmsPage: (slug: string) =>
    request<CmsPage>(`/cms/admin/pages/${slug}/publish`, { method: "PATCH" }),
  notifyWaitlist: (id: string) =>
    request(`/enrollments/waitlist/${id}/notify`, { method: "POST" }),
  uploadEnrollmentDocument: async (
    enrollmentId: string,
    file: File,
    type: string,
  ) => {
    const form = new FormData();
    form.append("file", file);
    form.append("type", type);
    const token = localStorage.getItem("by_access_token");
    const res = await fetch(`${API_BASE}/enrollments/${enrollmentId}/documents`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || "Upload falhou");
    return data as { id: string; type: string; fileName: string };
  },
  getEnrollmentDocuments: (enrollmentId: string) =>
    request<
      Array<{
        id: string;
        type: string;
        fileName: string;
        filePath: string;
        mimeType?: string | null;
      }>
    >(`/enrollments/${enrollmentId}/documents`),
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
  updateTestimonial: (id: string, body: Record<string, unknown>) =>
    request(`/cms/admin/testimonials/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteTestimonial: (id: string) =>
    request(`/cms/admin/testimonials/${id}`, { method: "DELETE" }),
};

export type Unit = {
  id: string;
  name: string;
  address?: string;
  services: Array<{
    active: boolean;
    service: { id: string; name: string };
  }>;
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
};

export type EnrollmentResult = {
  id: string;
  estado: "pendente_validacao" | "lista_espera";
  status: string;
  vagas_disponiveis: number;
  message: string;
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
  enrollment: {
    childFullName: string;
    unit: { name: string };
    service: { name: string };
  };
  room?: { name: string } | null;
};

export type LoginResult = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: string;
    name: string;
    modules?: string[];
  };
};

export type StudentProfileStatus = "PENDENTE_FICHA" | "COMPLETA" | string;

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
    pricing: "INCLUDED" | "PAID";
    priceAkz: number | null;
    service: { id: string; name: string };
  }>;
};

export type ActivityPayload = {
  name: string;
  category?: string | null;
  description?: string | null;
  active?: boolean;
  sortOrder?: number;
  services?: Array<{
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

export type UpsertCmsPage = {
  title: string;
  status?: string;
  sections: Array<{ key: string; label: string; value: string }>;
};
