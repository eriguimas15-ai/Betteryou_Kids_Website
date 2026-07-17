import { BadRequestException } from '@nestjs/common';

export type GuardianInput = {
  fullName: string;
  idNumber?: string;
  phone: string;
  altPhone?: string;
  email?: string;
  profession?: string;
  relationship?: string;
  address?: string;
};

export type EmergencyInput = {
  name: string;
  phone: string;
  relation?: string;
};

export type SharedPersonForm = {
  childFullName?: string;
  childBirthDate?: string | Date | null;
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
  guardians?: GuardianInput[];
  emergencyContacts?: EmergencyInput[];
  activities?: string[];
};

const filled = (v: unknown) =>
  v != null && String(v).trim() !== '';

/** Campos obrigatórios dos formulários partilhados de inscrição/renovação. */
export const SHARED_FORM_REQUIRED: Array<{
  key: string;
  label: string;
  get: (data: SharedPersonForm, primaryGuardian: GuardianInput | null, primaryEmergency: EmergencyInput | null) => unknown;
}> = [
  {
    key: 'childFullName',
    label: 'Nome completo da criança',
    get: (d) => d.childFullName,
  },
  {
    key: 'childBirthDate',
    label: 'Data de nascimento',
    get: (d) => d.childBirthDate,
  },
  {
    key: 'childSex',
    label: 'Sexo',
    get: (d) => d.childSex,
  },
  {
    key: 'childBirthPlace',
    label: 'Local de nascimento',
    get: (d) => d.childBirthPlace,
  },
  {
    key: 'childNationality',
    label: 'Nacionalidade',
    get: (d) => d.childNationality,
  },
  {
    key: 'childAddress',
    label: 'Morada da criança',
    get: (d) => d.childAddress,
  },
  {
    key: 'guardianFullName',
    label: 'Nome do encarregado (principal)',
    get: (_d, g) => g?.fullName,
  },
  {
    key: 'guardianIdNumber',
    label: 'N.º de identificação do encarregado',
    get: (_d, g) => g?.idNumber,
  },
  {
    key: 'guardianPhone',
    label: 'Telefone do encarregado',
    get: (_d, g) => g?.phone,
  },
  {
    key: 'guardianEmail',
    label: 'Email do encarregado',
    get: (_d, g) => g?.email,
  },
  {
    key: 'guardianProfession',
    label: 'Profissão do encarregado',
    get: (_d, g) => g?.profession,
  },
  {
    key: 'guardianRelationship',
    label: 'Parentesco do encarregado',
    get: (_d, g) => g?.relationship,
  },
  {
    key: 'guardianAddress',
    label: 'Morada do encarregado',
    get: (_d, g) => g?.address,
  },
  {
    key: 'emergencyName',
    label: 'Nome do contacto de emergência',
    get: (_d, _g, e) => e?.name,
  },
  {
    key: 'emergencyPhone',
    label: 'Telefone do contacto de emergência',
    get: (_d, _g, e) => e?.phone,
  },
  {
    key: 'emergencyRelation',
    label: 'Relação do contacto de emergência',
    get: (_d, _g, e) => e?.relation,
  },
  {
    key: 'allergies',
    label: 'Alergias (indique "Nenhuma" se não existir)',
    get: (d) => d.allergies,
  },
  {
    key: 'medication',
    label: 'Medicação (indique "Nenhuma" se não existir)',
    get: (d) => d.medication,
  },
  {
    key: 'foodRestrictions',
    label: 'Restrições alimentares (indique "Nenhuma" se não existir)',
    get: (d) => d.foodRestrictions,
  },
];

export function normalizeGuardians(data: SharedPersonForm): GuardianInput[] {
  if (data.guardians && data.guardians.length > 0) {
    return data.guardians
      .map((g) => ({
        fullName: (g.fullName || '').trim(),
        idNumber: g.idNumber?.trim() || undefined,
        phone: (g.phone || '').trim(),
        altPhone: g.altPhone?.trim() || undefined,
        email: g.email?.trim().toLowerCase() || undefined,
        profession: g.profession?.trim() || undefined,
        relationship: g.relationship?.trim() || undefined,
        address: g.address?.trim() || undefined,
      }))
      .filter((g) => g.fullName || g.phone || g.email);
  }
  if (data.guardianFullName || data.guardianPhone || data.guardianEmail) {
    return [
      {
        fullName: (data.guardianFullName || '').trim(),
        idNumber: data.guardianIdNumber?.trim() || undefined,
        phone: (data.guardianPhone || '').trim(),
        altPhone: data.guardianAltPhone?.trim() || undefined,
        email: data.guardianEmail?.trim().toLowerCase() || undefined,
        profession: data.guardianProfession?.trim() || undefined,
        relationship: data.guardianRelationship?.trim() || undefined,
        address: data.guardianAddress?.trim() || undefined,
      },
    ];
  }
  return [];
}

export function normalizeEmergencies(
  data: SharedPersonForm,
): EmergencyInput[] {
  if (data.emergencyContacts && data.emergencyContacts.length > 0) {
    return data.emergencyContacts
      .map((e) => ({
        name: (e.name || '').trim(),
        phone: (e.phone || '').trim(),
        relation: e.relation?.trim() || undefined,
      }))
      .filter((e) => e.name || e.phone);
  }
  if (data.emergencyName || data.emergencyPhone) {
    return [
      {
        name: (data.emergencyName || '').trim(),
        phone: (data.emergencyPhone || '').trim(),
        relation: data.emergencyRelation?.trim() || undefined,
      },
    ];
  }
  return [];
}

export function normalizeActivities(activities?: string[]) {
  if (!activities?.length) return [];
  return [
    ...new Set(
      activities.map((a) => a.trim()).filter((a) => a.length > 0),
    ),
  ];
}

export function missingSharedFormFields(data: SharedPersonForm): string[] {
  const guardians = normalizeGuardians(data);
  const emergencies = normalizeEmergencies(data);
  const primaryGuardian = guardians[0] || null;
  const primaryEmergency = emergencies[0] || null;

  const missing = SHARED_FORM_REQUIRED.filter(
    (field) => !filled(field.get(data, primaryGuardian, primaryEmergency)),
  ).map((field) => field.label);

  guardians.forEach((g, index) => {
    if (index === 0) return;
    const n = index + 1;
    if (!filled(g.fullName)) missing.push(`Encarregado ${n}: nome`);
    if (!filled(g.phone)) missing.push(`Encarregado ${n}: telefone`);
    if (!filled(g.relationship)) missing.push(`Encarregado ${n}: parentesco`);
  });

  emergencies.forEach((e, index) => {
    if (index === 0) return;
    const n = index + 1;
    if (!filled(e.name)) missing.push(`Emergência ${n}: nome`);
    if (!filled(e.phone)) missing.push(`Emergência ${n}: telefone`);
  });

  return missing;
}

export function assertSharedFormComplete(data: SharedPersonForm) {
  const missing = missingSharedFormFields(data);
  if (missing.length > 0) {
    throw new BadRequestException(
      `Dados em falta no formulário: ${missing.join('; ')}`,
    );
  }
}

export function primaryPersonFields(data: SharedPersonForm) {
  const guardians = normalizeGuardians(data);
  const emergencies = normalizeEmergencies(data);
  const activities = normalizeActivities(data.activities);
  const primary = guardians[0];
  const emergency = emergencies[0];

  if (!primary) {
    throw new BadRequestException('É necessário pelo menos um encarregado');
  }
  if (!emergency) {
    throw new BadRequestException(
      'É necessário pelo menos um contacto de emergência',
    );
  }

  return {
    guardians,
    emergencies,
    activities,
    flat: {
      guardianFullName: primary.fullName,
      guardianIdNumber: primary.idNumber || null,
      guardianPhone: primary.phone,
      guardianAltPhone: primary.altPhone || null,
      guardianEmail: (primary.email || '').toLowerCase(),
      guardianProfession: primary.profession || null,
      guardianRelationship: primary.relationship || '',
      guardianAddress: primary.address || null,
      emergencyName: emergency.name,
      emergencyPhone: emergency.phone,
      emergencyRelation: emergency.relation || null,
      allergies: data.allergies?.trim() || null,
      medication: data.medication?.trim() || null,
      foodRestrictions: data.foodRestrictions?.trim() || null,
      medicalNotes: data.medicalNotes?.trim() || null,
    },
  };
}
