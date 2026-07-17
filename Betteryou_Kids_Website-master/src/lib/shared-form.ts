export type GuardianForm = {
  fullName: string;
  idNumber: string;
  phone: string;
  altPhone: string;
  email: string;
  profession: string;
  relationship: string;
  address: string;
};

export type EmergencyForm = {
  name: string;
  phone: string;
  relation: string;
};

export const emptyGuardian = (): GuardianForm => ({
  fullName: "",
  idNumber: "",
  phone: "",
  altPhone: "",
  email: "",
  profession: "",
  relationship: "",
  address: "",
});

export const emptyEmergency = (): EmergencyForm => ({
  name: "",
  phone: "",
  relation: "",
});

export type ActivityPricingKind = "INCLUDED" | "PAID";

export type ActivityOption = {
  name: string;
  pricing: ActivityPricingKind;
  priceAkz: number | null;
};

/** Matriz de actividades por serviço (fallback offline / API indisponível). */
export const ACTIVITY_OFFERINGS_BY_SERVICE: Record<string, ActivityOption[]> = {
  Creche: [
    { name: "Ginástica", pricing: "INCLUDED", priceAkz: null },
    { name: "Inglês", pricing: "INCLUDED", priceAkz: null },
    { name: "Música", pricing: "INCLUDED", priceAkz: null },
    { name: "Dança Criativa", pricing: "PAID", priceAkz: 40000 },
  ],
  "Pré-Escolar": [
    { name: "Ginástica", pricing: "INCLUDED", priceAkz: null },
    { name: "Inglês", pricing: "INCLUDED", priceAkz: null },
    { name: "Música", pricing: "INCLUDED", priceAkz: null },
    { name: "Jiu-Jitsu", pricing: "PAID", priceAkz: 40000 },
    { name: "Ballet", pricing: "PAID", priceAkz: 40000 },
    { name: "Xadrez", pricing: "PAID", priceAkz: 30000 },
  ],
  ATL: [
    { name: "Ginástica", pricing: "INCLUDED", priceAkz: null },
    { name: "Inglês", pricing: "INCLUDED", priceAkz: null },
    { name: "Música", pricing: "INCLUDED", priceAkz: null },
    { name: "Jiu-Jitsu", pricing: "PAID", priceAkz: 40000 },
    { name: "Ballet", pricing: "PAID", priceAkz: 40000 },
    { name: "Xadrez", pricing: "PAID", priceAkz: 30000 },
  ],
  "1.º Ciclo": [
    { name: "Jiu-Jitsu", pricing: "PAID", priceAkz: 40000 },
    { name: "Ballet", pricing: "PAID", priceAkz: 40000 },
    { name: "Xadrez", pricing: "PAID", priceAkz: 30000 },
    { name: "Artes", pricing: "PAID", priceAkz: 45000 },
  ],
};

/** @deprecated Use ACTIVITY_OFFERINGS_BY_SERVICE / activitiesForService */
export const FALLBACK_ACTIVITIES = [
  "Ginástica",
  "Inglês",
  "Música",
  "Jiu-Jitsu",
  "Ballet",
  "Xadrez",
  "Dança Criativa",
  "Artes",
];

export function activitiesForService(serviceName: string): ActivityOption[] {
  return ACTIVITY_OFFERINGS_BY_SERVICE[serviceName.trim()] ?? [];
}

export function formatActivityPriceLabel(option: ActivityOption): string {
  if (option.pricing === "INCLUDED") return "Incluído";
  if (option.priceAkz == null) return "";
  const formatted = option.priceAkz.toLocaleString("pt-PT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `AKZ ${formatted}`;
}

export function filterActivitiesForService(
  selected: string[],
  options: ActivityOption[],
): string[] {
  const allowed = new Set(options.map((o) => o.name));
  return selected.filter((name) => allowed.has(name));
}

const filled = (v: unknown) => v != null && String(v).trim() !== "";

export function missingSharedFormFields(data: {
  childFullName?: string;
  childBirthDate?: string;
  childSex?: string;
  childBirthPlace?: string;
  childNationality?: string;
  childAddress?: string;
  allergies?: string;
  medication?: string;
  foodRestrictions?: string;
  guardians: GuardianForm[];
  emergencyContacts: EmergencyForm[];
}): string[] {
  const g0 = data.guardians[0];
  const e0 = data.emergencyContacts[0];
  const checks: Array<[string, unknown]> = [
    ["Nome completo da criança", data.childFullName],
    ["Data de nascimento", data.childBirthDate],
    ["Sexo", data.childSex],
    ["Local de nascimento", data.childBirthPlace],
    ["Nacionalidade", data.childNationality],
    ["Morada da criança", data.childAddress],
    ["Nome do encarregado (principal)", g0?.fullName],
    ["N.º de identificação do encarregado", g0?.idNumber],
    ["Telefone do encarregado", g0?.phone],
    ["Email do encarregado", g0?.email],
    ["Profissão do encarregado", g0?.profession],
    ["Parentesco do encarregado", g0?.relationship],
    ["Morada do encarregado", g0?.address],
    ["Nome do contacto de emergência", e0?.name],
    ["Telefone do contacto de emergência", e0?.phone],
    ["Relação do contacto de emergência", e0?.relation],
    ['Alergias (indique "Nenhuma" se não existir)', data.allergies],
    ['Medicação (indique "Nenhuma" se não existir)', data.medication],
    [
      'Restrições alimentares (indique "Nenhuma" se não existir)',
      data.foodRestrictions,
    ],
  ];

  const missing = checks
    .filter(([, value]) => !filled(value))
    .map(([label]) => label);

  data.guardians.forEach((g, index) => {
    if (index === 0) return;
    const n = index + 1;
    if (!filled(g.fullName)) missing.push(`Encarregado ${n}: nome`);
    if (!filled(g.phone)) missing.push(`Encarregado ${n}: telefone`);
    if (!filled(g.relationship)) missing.push(`Encarregado ${n}: parentesco`);
  });

  data.emergencyContacts.forEach((e, index) => {
    if (index === 0) return;
    const n = index + 1;
    if (!filled(e.name)) missing.push(`Emergência ${n}: nome`);
    if (!filled(e.phone)) missing.push(`Emergência ${n}: telefone`);
  });

  return missing;
}

export function toApiGuardians(guardians: GuardianForm[]) {
  return guardians.map((g) => ({
    fullName: g.fullName.trim(),
    idNumber: g.idNumber.trim() || undefined,
    phone: g.phone.trim(),
    altPhone: g.altPhone.trim() || undefined,
    email: g.email.trim() || undefined,
    profession: g.profession.trim() || undefined,
    relationship: g.relationship.trim() || undefined,
    address: g.address.trim() || undefined,
  }));
}

export function toApiEmergencies(contacts: EmergencyForm[]) {
  return contacts.map((e) => ({
    name: e.name.trim(),
    phone: e.phone.trim(),
    relation: e.relation.trim() || undefined,
  }));
}

export function guardiansFromStudent(student: {
  guardians?: unknown;
  guardianFullName: string;
  guardianIdNumber?: string | null;
  guardianPhone: string;
  guardianAltPhone?: string | null;
  guardianEmail: string;
  guardianProfession?: string | null;
  guardianRelationship?: string | null;
  guardianAddress?: string | null;
}): GuardianForm[] {
  const list = Array.isArray(student.guardians)
    ? (student.guardians as Array<Record<string, string>>)
    : [];
  if (list.length > 0) {
    return list.map((g) => ({
      fullName: g.fullName || "",
      idNumber: g.idNumber || "",
      phone: g.phone || "",
      altPhone: g.altPhone || "",
      email: g.email || "",
      profession: g.profession || "",
      relationship: g.relationship || "",
      address: g.address || "",
    }));
  }
  return [
    {
      fullName: student.guardianFullName || "",
      idNumber: student.guardianIdNumber || "",
      phone: student.guardianPhone || "",
      altPhone: student.guardianAltPhone || "",
      email: student.guardianEmail || "",
      profession: student.guardianProfession || "",
      relationship: student.guardianRelationship || "",
      address: student.guardianAddress || "",
    },
  ];
}

export function emergenciesFromStudent(student: {
  emergencyContacts?: unknown;
  emergencyName?: string | null;
  emergencyPhone?: string | null;
  emergencyRelation?: string | null;
}): EmergencyForm[] {
  const list = Array.isArray(student.emergencyContacts)
    ? (student.emergencyContacts as Array<Record<string, string>>)
    : [];
  if (list.length > 0) {
    return list.map((e) => ({
      name: e.name || "",
      phone: e.phone || "",
      relation: e.relation || "",
    }));
  }
  return [
    {
      name: student.emergencyName || "",
      phone: student.emergencyPhone || "",
      relation: student.emergencyRelation || "",
    },
  ];
}

export function activitiesFromStudent(student: {
  activities?: unknown;
}): string[] {
  return Array.isArray(student.activities)
    ? (student.activities as string[])
    : [];
}
