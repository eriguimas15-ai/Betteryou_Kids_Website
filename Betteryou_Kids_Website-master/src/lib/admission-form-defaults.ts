export type AdmissionQuestionType =
  | 'text'
  | 'textarea'
  | 'select'
  | 'yesno'
  | 'date';

export type AdmissionServiceKey =
  | 'Creche'
  | 'Pré-Escolar'
  | 'ATL'
  | '1.º Ciclo';

export type AdmissionFormMode = 'enrollment' | 'renewal';

export type AdmissionQuestion = {
  id: string;
  key: string;
  label: string;
  type: AdmissionQuestionType;
  required: boolean;
  section: string;
  sortOrder: number;
  options?: string[];
  hint?: string;
  /** Mostrar só quando outra pergunta tem este valor. */
  showIfKey?: string;
  showIfValue?: string;
};

export type AdmissionFormConfig = {
  enrollment: Record<AdmissionServiceKey, AdmissionQuestion[]>;
  renewal: Record<AdmissionServiceKey, AdmissionQuestion[]>;
};

const SERVICES: AdmissionServiceKey[] = [
  'Creche',
  'Pré-Escolar',
  'ATL',
  '1.º Ciclo',
];

function q(
  partial: Omit<AdmissionQuestion, 'sortOrder'> & { sortOrder?: number },
  index: number,
): AdmissionQuestion {
  return {
    ...partial,
    sortOrder: partial.sortOrder ?? index,
  };
}

function crecheEnrollment(): AdmissionQuestion[] {
  const rows: Array<Omit<AdmissionQuestion, 'sortOrder'> & { sortOrder?: number }> = [
    { id: 'c-e-1', key: 'startDate', label: 'Data de início', type: 'date', required: true, section: 'Administrativo' },
    { id: 'c-e-2', key: 'preferredSchedule', label: 'Horário pretendido', type: 'select', required: true, section: 'Administrativo', options: ['Integral', 'Meio Período'] },
    { id: 'c-e-3', key: 'childIdNumber', label: 'N.º de identificação civil (registo de nascimento ou BI)', type: 'text', required: true, section: 'Administrativo' },
    { id: 'c-e-4', key: 'locality', label: 'Localidade', type: 'text', required: true, section: 'Administrativo' },
    { id: 'c-e-5', key: 'homeLanguages', label: 'Língua(s) falada(s) em casa', type: 'text', required: true, section: 'Administrativo' },
    { id: 'c-e-6', key: 'fatherFullName', label: 'Nome completo do pai', type: 'text', required: true, section: 'Pais' },
    { id: 'c-e-7', key: 'fatherContacts', label: 'Contactos telefónicos e e-mail do pai', type: 'text', required: true, section: 'Pais' },
    { id: 'c-e-8', key: 'fatherProfession', label: 'Profissão do pai', type: 'text', required: true, section: 'Pais' },
    { id: 'c-e-9', key: 'fatherAddress', label: 'Morada completa do pai', type: 'text', required: true, section: 'Pais' },
    { id: 'c-e-10', key: 'motherFullName', label: 'Nome completo da mãe', type: 'text', required: true, section: 'Pais' },
    { id: 'c-e-11', key: 'motherContacts', label: 'Contactos telefónicos e e-mail da mãe', type: 'text', required: true, section: 'Pais' },
    { id: 'c-e-12', key: 'motherProfession', label: 'Profissão da mãe', type: 'text', required: true, section: 'Pais' },
    { id: 'c-e-13', key: 'motherAddress', label: 'Morada completa da mãe', type: 'text', required: true, section: 'Pais' },
    { id: 'c-e-14', key: 'authorizedPickup', label: 'Pessoas autorizadas a recolher o aluno', type: 'textarea', required: true, section: 'Família' },
    { id: 'c-e-15', key: 'livesWith', label: 'A criança reside actualmente com', type: 'select', required: true, section: 'Família', options: ['Ambos os Pais', 'Só com o pai', 'Só com a mãe', 'Outro'] },
    { id: 'c-e-16', key: 'siblings', label: 'Tem irmãos?', type: 'yesno', required: false, section: 'Família' },
    { id: 'c-e-17', key: 'siblingsDetails', label: 'Nome(s) e idade(s) dos irmãos', type: 'textarea', required: false, section: 'Família', showIfKey: 'siblings', showIfValue: 'Sim' },
    { id: 'c-e-18', key: 'bloodGroup', label: 'Grupo sanguíneo', type: 'select', required: false, section: 'Saúde', options: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
    { id: 'c-e-19', key: 'hasHealthInsurance', label: 'Possui seguro de saúde?', type: 'yesno', required: true, section: 'Saúde' },
    { id: 'c-e-20', key: 'healthInsuranceDetails', label: 'Seguradora e n.º da apólice', type: 'text', required: false, section: 'Saúde', showIfKey: 'hasHealthInsurance', showIfValue: 'Sim' },
    { id: 'c-e-21', key: 'pediatricianName', label: 'Nome do pediatra', type: 'text', required: true, section: 'Saúde' },
    { id: 'c-e-22', key: 'pediatricianPhone', label: 'Contacto do pediatra', type: 'text', required: false, section: 'Saúde' },
    { id: 'c-e-23', key: 'pediatricianPlace', label: 'Onde é feito o acompanhamento?', type: 'text', required: true, section: 'Saúde' },
    { id: 'c-e-24', key: 'vaccinesUpToDate', label: 'Vacinas em dia?', type: 'yesno', required: true, section: 'Saúde', hint: 'Entregar boletim de vacinas actualizado na recepção' },
    { id: 'c-e-25', key: 'feverAntipyreticAuth', label: 'Em caso de febre, autoriza antipirético?', type: 'yesno', required: true, section: 'Saúde' },
    { id: 'c-e-26', key: 'chronicConditions', label: 'Doenças crónicas ou condições especiais', type: 'textarea', required: false, section: 'Saúde' },
    { id: 'c-e-27', key: 'birthType', label: 'Tipo de parto', type: 'select', required: true, section: 'Desenvolvimento', options: ['Parto Normal', 'Cesariana'] },
    { id: 'c-e-28', key: 'gestationWeeks', label: 'Tempo de gestação', type: 'text', required: true, section: 'Desenvolvimento' },
    { id: 'c-e-29', key: 'pregnancyTrauma', label: 'Situações traumáticas durante a gravidez?', type: 'yesno', required: true, section: 'Desenvolvimento' },
    { id: 'c-e-30', key: 'pregnancyTraumaDetails', label: 'Especifique', type: 'textarea', required: false, section: 'Desenvolvimento', showIfKey: 'pregnancyTrauma', showIfValue: 'Sim' },
    { id: 'c-e-31', key: 'walksAutonomously', label: 'Já anda de forma autónoma?', type: 'text', required: true, section: 'Desenvolvimento' },
    { id: 'c-e-32', key: 'languageDevelopment', label: 'Desenvolvimento da linguagem', type: 'select', required: true, section: 'Desenvolvimento', options: ['Balbucia/ sons', 'Utiliza palavras', 'Utiliza frases simples'] },
    { id: 'c-e-33', key: 'diaperStatus', label: 'Estado de desfralde', type: 'select', required: true, section: 'Desenvolvimento', options: ['Usa fralda', 'Em processo de desfralde', 'Não usa fralda'] },
    { id: 'c-e-34', key: 'napRoutine', label: 'Rotina de descanso diúrno', type: 'select', required: true, section: 'Desenvolvimento', options: ['Faz sesta regularmente', 'Faz sesta ocasionalmente', 'Não faz sesta'] },
    { id: 'c-e-35', key: 'sleepDescription', label: 'Breve descrição sobre o sono', type: 'textarea', required: true, section: 'Desenvolvimento' },
    { id: 'c-e-36', key: 'appetite', label: 'Como é o apetite?', type: 'text', required: true, section: 'Desenvolvimento' },
    { id: 'c-e-37', key: 'preferredFoods', label: 'Alimentos preferidos ou recusados', type: 'textarea', required: true, section: 'Desenvolvimento' },
    { id: 'c-e-38', key: 'habitsBehavior', label: 'Hábitos e comportamentos relevantes', type: 'textarea', required: true, section: 'Desenvolvimento' },
    { id: 'c-e-39', key: 'personalityNotes', label: 'Observações sobre comportamento/personalidade', type: 'textarea', required: true, section: 'Desenvolvimento' },
    { id: 'c-e-40', key: 'attendedNursery', label: 'Já frequentou algum infantário?', type: 'yesno', required: true, section: 'Desenvolvimento' },
    { id: 'c-e-41', key: 'nurseryNames', label: 'Qual/quais instituições', type: 'text', required: false, section: 'Desenvolvimento', showIfKey: 'attendedNursery', showIfValue: 'Sim' },
    { id: 'c-e-42', key: 'authOutings', label: 'Autoriza actividades e saídas pedagógicas?', type: 'yesno', required: true, section: 'Autorizações' },
    { id: 'c-e-43', key: 'authPhotos', label: 'Autoriza fotografias/vídeos?', type: 'yesno', required: true, section: 'Autorizações' },
    { id: 'c-e-44', key: 'authMedication', label: 'Autoriza administração de medicação?', type: 'yesno', required: true, section: 'Autorizações' },
    { id: 'c-e-45', key: 'needsIndividualSupport', label: 'Necessidade de apoio pedagógico individualizado?', type: 'yesno', required: true, section: 'Autorizações' },
    { id: 'c-e-46', key: 'individualSupportDetails', label: 'Detalhe do apoio', type: 'textarea', required: false, section: 'Autorizações', showIfKey: 'needsIndividualSupport', showIfValue: 'Sim' },
    { id: 'c-e-47', key: 'relevantMedicalInfo', label: 'Informação médica/alimentar/emocional relevante?', type: 'yesno', required: true, section: 'Autorizações' },
    { id: 'c-e-48', key: 'relevantMedicalDetails', label: 'Detalhe', type: 'textarea', required: false, section: 'Autorizações', showIfKey: 'relevantMedicalInfo', showIfValue: 'Sim' },
    { id: 'c-e-49', key: 'additionalInfo', label: 'Informação adicional sobre o aluno', type: 'textarea', required: false, section: 'Autorizações' },
  ];
  return rows.map((row, i) => q(row, i));
}

function preEscolarEnrollment(): AdmissionQuestion[] {
  const rows: Array<Omit<AdmissionQuestion, 'sortOrder'> & { sortOrder?: number }> = [
    { id: 'p-e-1', key: 'startDate', label: 'Data de início', type: 'date', required: true, section: 'Administrativo' },
    { id: 'p-e-2', key: 'preferredSchedule', label: 'Horário pretendido', type: 'select', required: true, section: 'Administrativo', options: ['Integral', 'Meio Período'] },
    { id: 'p-e-3', key: 'childIdNumber', label: 'N.º de identificação civil', type: 'text', required: true, section: 'Administrativo' },
    { id: 'p-e-4', key: 'locality', label: 'Localidade', type: 'text', required: true, section: 'Administrativo' },
    { id: 'p-e-5', key: 'homeLanguages', label: 'Língua(s) falada(s) em casa', type: 'text', required: true, section: 'Administrativo' },
    { id: 'p-e-6', key: 'fatherFullName', label: 'Nome completo do pai', type: 'text', required: true, section: 'Pais' },
    { id: 'p-e-7', key: 'fatherContacts', label: 'Contactos do pai', type: 'text', required: true, section: 'Pais' },
    { id: 'p-e-8', key: 'fatherProfession', label: 'Profissão do pai', type: 'text', required: true, section: 'Pais' },
    { id: 'p-e-9', key: 'fatherAddress', label: 'Morada do pai', type: 'text', required: true, section: 'Pais' },
    { id: 'p-e-10', key: 'motherFullName', label: 'Nome completo da mãe', type: 'text', required: true, section: 'Pais' },
    { id: 'p-e-11', key: 'motherContacts', label: 'Contactos da mãe', type: 'text', required: true, section: 'Pais' },
    { id: 'p-e-12', key: 'motherProfession', label: 'Profissão da mãe', type: 'text', required: true, section: 'Pais' },
    { id: 'p-e-13', key: 'motherAddress', label: 'Morada da mãe', type: 'text', required: true, section: 'Pais' },
    { id: 'p-e-14', key: 'authorizedPickup', label: 'Pessoas autorizadas a recolher o aluno', type: 'textarea', required: true, section: 'Família' },
    { id: 'p-e-15', key: 'livesWith', label: 'Com quem a criança reside', type: 'select', required: true, section: 'Família', options: ['Ambos os Pais', 'Só com o pai', 'Só com a mãe', 'Outro'] },
    { id: 'p-e-16', key: 'siblings', label: 'Tem irmãos?', type: 'yesno', required: false, section: 'Família' },
    { id: 'p-e-17', key: 'familyAtSchool', label: 'Alguém da família frequenta/frequentou este estabelecimento?', type: 'textarea', required: false, section: 'Família' },
    { id: 'p-e-18', key: 'hasHealthInsurance', label: 'Possui seguro de saúde?', type: 'yesno', required: true, section: 'Saúde' },
    { id: 'p-e-19', key: 'pediatricianName', label: 'Nome do pediatra', type: 'text', required: true, section: 'Saúde' },
    { id: 'p-e-20', key: 'pediatricianPlace', label: 'Onde é feito o acompanhamento?', type: 'text', required: true, section: 'Saúde' },
    { id: 'p-e-21', key: 'feverAntipyreticAuth', label: 'Em caso de febre, autoriza antipirético?', type: 'yesno', required: true, section: 'Saúde' },
    { id: 'p-e-22', key: 'birthType', label: 'Tipo de parto', type: 'select', required: true, section: 'Desenvolvimento', options: ['Parto Normal', 'Cesariana'] },
    { id: 'p-e-23', key: 'gestationWeeks', label: 'Tempo de gestação', type: 'text', required: true, section: 'Desenvolvimento' },
    { id: 'p-e-24', key: 'pregnancyTrauma', label: 'Situações traumáticas na gravidez?', type: 'yesno', required: true, section: 'Desenvolvimento' },
    { id: 'p-e-25', key: 'autonomousFeeding', label: 'Autónoma na alimentação?', type: 'yesno', required: true, section: 'Desenvolvimento' },
    { id: 'p-e-26', key: 'diaperStatus', label: 'Uso de fralda', type: 'select', required: true, section: 'Desenvolvimento', options: ['Usa fralda', 'Em processo de desfralde', 'Não usa fralda'] },
    { id: 'p-e-27', key: 'napRoutine', label: 'Dorme a sesta?', type: 'yesno', required: true, section: 'Desenvolvimento' },
    { id: 'p-e-28', key: 'napSchedule', label: 'Hora de dormir e acordar', type: 'text', required: true, section: 'Desenvolvimento' },
    { id: 'p-e-29', key: 'comfortObjects', label: 'Hábitos ou objectos de conforto', type: 'textarea', required: false, section: 'Desenvolvimento' },
    { id: 'p-e-30', key: 'attentionDifficulties', label: 'Dificuldades de atenção ou comportamento?', type: 'yesno', required: false, section: 'Desenvolvimento' },
    { id: 'p-e-31', key: 'newEnvironmentReaction', label: 'Reacção a novos ambientes/pessoas', type: 'text', required: true, section: 'Desenvolvimento' },
    { id: 'p-e-32', key: 'fearsPhobias', label: 'Medos ou inseguranças', type: 'text', required: false, section: 'Desenvolvimento' },
    { id: 'p-e-33', key: 'usualMeals', label: 'Alimentação habitual', type: 'textarea', required: false, section: 'Desenvolvimento' },
    { id: 'p-e-34', key: 'attendedNursery', label: 'Já frequentou outras instituições?', type: 'yesno', required: true, section: 'Desenvolvimento' },
    { id: 'p-e-35', key: 'interestAreas', label: 'Interesse particular por alguma área', type: 'text', required: false, section: 'Desenvolvimento' },
    { id: 'p-e-36', key: 'authOutings', label: 'Autoriza actividades e saídas pedagógicas?', type: 'yesno', required: true, section: 'Autorizações' },
    { id: 'p-e-37', key: 'authPhotos', label: 'Autoriza fotografias/vídeos?', type: 'yesno', required: true, section: 'Autorizações' },
    { id: 'p-e-38', key: 'authMedication', label: 'Autoriza administração de medicação?', type: 'yesno', required: true, section: 'Autorizações' },
    { id: 'p-e-39', key: 'needsIndividualSupport', label: 'Necessidade de apoio individualizado?', type: 'yesno', required: true, section: 'Autorizações' },
    { id: 'p-e-40', key: 'relevantMedicalInfo', label: 'Informação médica/alimentar/emocional relevante?', type: 'yesno', required: true, section: 'Autorizações' },
    { id: 'p-e-41', key: 'additionalInfo', label: 'Informação adicional', type: 'textarea', required: false, section: 'Autorizações' },
  ];
  return rows.map((row, i) => q(row, i));
}

function atlEnrollment(): AdmissionQuestion[] {
  const base = preEscolarEnrollment().map((item) => ({
    ...item,
    id: item.id.replace('p-e-', 'a-e-'),
  }));
  const withoutSchedule = base.filter((item) => item.key !== 'preferredSchedule');
  const atlSpecific: AdmissionQuestion[] = [
    q({ id: 'a-e-atl1', key: 'atlFrequency', label: 'Frequência pretendida', type: 'text', required: true, section: 'Administrativo' }, 1),
    q({ id: 'a-e-atl2', key: 'atlSchedule', label: 'Horário de permanência no ATL', type: 'text', required: true, section: 'Administrativo' }, 2),
    q({ id: 'a-e-atl3', key: 'externalSchoolName', label: 'Escola a frequentar no próximo ano', type: 'text', required: true, section: 'Administrativo' }, 3),
    q({ id: 'a-e-atl4', key: 'schoolGrade', label: 'Grau de escolaridade / classe', type: 'text', required: true, section: 'Administrativo' }, 4),
    q({ id: 'a-e-atl5', key: 'currentSchoolName', label: 'Escola que frequenta actualmente', type: 'text', required: true, section: 'Administrativo' }, 5),
    q({ id: 'a-e-atl6', key: 'usesGlassesOrAids', label: 'Usa óculos, aparelhos auditivos ou outros?', type: 'yesno', required: true, section: 'Desenvolvimento' }, 50),
    q({ id: 'a-e-atl7', key: 'favoritePlay', label: 'Tipos de brincadeiras preferidas', type: 'text', required: false, section: 'Desenvolvimento' }, 51),
  ];
  return [...atlSpecific, ...withoutSchedule].map((item, i) => ({
    ...item,
    sortOrder: i,
  }));
}

function cicloEnrollment(): AdmissionQuestion[] {
  const rows: Array<Omit<AdmissionQuestion, 'sortOrder'> & { sortOrder?: number }> = [
    { id: '1-e-1', key: 'currentlyAtBetteryou', label: 'Frequenta actualmente a Betteryou Kids?', type: 'yesno', required: true, section: '1.º Ciclo' },
    { id: '1-e-2', key: 'preferredSchedule', label: 'Horário pretendido', type: 'select', required: true, section: '1.º Ciclo', options: ['Integral', 'Meio Período'] },
    { id: '1-e-3', key: 'homeLanguages', label: 'Língua(s) falada(s) em casa', type: 'text', required: true, section: '1.º Ciclo' },
    { id: '1-e-4', key: 'currentSchoolName', label: 'Escola actualmente frequentada', type: 'text', required: false, section: '1.º Ciclo', showIfKey: 'currentlyAtBetteryou', showIfValue: 'Não', hint: 'Apenas se frequenta outra instituição' },
    { id: '1-e-5', key: 'pedagogicalReports', label: 'Relatórios pedagógicos/psicológicos relevantes?', type: 'yesno', required: true, section: '1.º Ciclo' },
    { id: '1-e-6', key: 'needsIndividualSupport', label: 'Necessidade de apoio individualizado?', type: 'yesno', required: true, section: '1.º Ciclo' },
    { id: '1-e-7', key: 'relevantMedicalInfo', label: 'Informação médica/alimentar/emocional relevante?', type: 'yesno', required: true, section: '1.º Ciclo' },
    { id: '1-e-8', key: 'learningHabits', label: 'Hábitos de aprendizagem e autonomia', type: 'textarea', required: true, section: '1.º Ciclo' },
    { id: '1-e-9', key: 'interestAreas', label: 'Interesse particular por alguma área', type: 'text', required: false, section: '1.º Ciclo' },
    { id: '1-e-10', key: 'fatherFullName', label: 'Nome completo do pai', type: 'text', required: true, section: 'Pais' },
    { id: '1-e-11', key: 'fatherContacts', label: 'Contactos do pai', type: 'text', required: true, section: 'Pais' },
    { id: '1-e-12', key: 'fatherProfession', label: 'Profissão do pai', type: 'text', required: true, section: 'Pais' },
    { id: '1-e-13', key: 'motherFullName', label: 'Nome completo da mãe', type: 'text', required: true, section: 'Pais' },
    { id: '1-e-14', key: 'motherContacts', label: 'Contactos da mãe', type: 'text', required: true, section: 'Pais' },
    { id: '1-e-15', key: 'motherProfession', label: 'Profissão da mãe', type: 'text', required: true, section: 'Pais' },
    { id: '1-e-16', key: 'authorizedPickup', label: 'Pessoas autorizadas a recolher o aluno', type: 'textarea', required: true, section: 'Recolha' },
    { id: '1-e-17', key: 'additionalInfo', label: 'Informação adicional', type: 'textarea', required: false, section: 'Recolha' },
  ];
  return rows.map((row, i) => q(row, i));
}

function crecheRenewal(): AdmissionQuestion[] {
  const rows: Array<Omit<AdmissionQuestion, 'sortOrder'> & { sortOrder?: number }> = [
    { id: 'c-r-1', key: 'wantsRenewal', label: 'Pretende renovar a matrícula?', type: 'select', required: true, section: 'Renovação', options: ['Sim', 'Não', 'Ainda em avaliação'] },
    { id: 'c-r-2', key: 'preferredSchedule', label: 'Horário pretendido', type: 'select', required: true, section: 'Renovação', options: ['Integral', 'Meio Período'] },
    { id: 'c-r-3', key: 'sleepChange', label: 'Alteração relevante na rotina de sono?', type: 'yesno', required: true, section: 'Renovação' },
    { id: 'c-r-4', key: 'sleepChangeDetails', label: 'Detalhe da rotina de sono', type: 'textarea', required: false, section: 'Renovação', showIfKey: 'sleepChange', showIfValue: 'Sim' },
    { id: 'c-r-5', key: 'foodChange', label: 'Alteração alimentar relevante?', type: 'yesno', required: true, section: 'Renovação' },
    { id: 'c-r-6', key: 'foodChangeDetails', label: 'Detalhe alimentar', type: 'textarea', required: false, section: 'Renovação', showIfKey: 'foodChange', showIfValue: 'Sim' },
    { id: 'c-r-7', key: 'diaperCurrent', label: 'Utiliza actualmente fralda?', type: 'select', required: true, section: 'Renovação', options: ['Sim', 'Não', 'Em fase de transição'] },
    { id: 'c-r-8', key: 'emotionalChange', label: 'Alteração emocional/comportamental/familiar?', type: 'yesno', required: true, section: 'Renovação' },
    { id: 'c-r-9', key: 'therapeuticSupport', label: 'Necessita acompanhamento especializado?', type: 'yesno', required: true, section: 'Renovação' },
    { id: 'c-r-10', key: 'pickupPersonsMaintained', label: 'Mantêm-se as pessoas autorizadas a recolher?', type: 'yesno', required: true, section: 'Renovação' },
    { id: 'c-r-11', key: 'pickupPersonsUpdated', label: 'Novas pessoas autorizadas', type: 'textarea', required: false, section: 'Renovação', showIfKey: 'pickupPersonsMaintained', showIfValue: 'Não' },
    { id: 'c-r-12', key: 'guardianContactsChanged', label: 'Houve alteração dos contactos dos encarregados?', type: 'yesno', required: true, section: 'Renovação' },
    { id: 'c-r-13', key: 'guardianNewContacts', label: 'Novos contactos', type: 'textarea', required: false, section: 'Renovação', showIfKey: 'guardianContactsChanged', showIfValue: 'Sim' },
    { id: 'c-r-14', key: 'additionalInfo', label: 'Informação adicional', type: 'textarea', required: false, section: 'Renovação' },
  ];
  return rows.map((row, i) => q(row, i));
}

function preRenewal(): AdmissionQuestion[] {
  const rows: Array<Omit<AdmissionQuestion, 'sortOrder'> & { sortOrder?: number }> = [
    { id: 'p-r-1', key: 'wantsRenewal', label: 'Pretende renovar a matrícula?', type: 'yesno', required: true, section: 'Renovação' },
    { id: 'p-r-2', key: 'preferredSchedule', label: 'Horário pretendido', type: 'select', required: true, section: 'Renovação', options: ['Integral', 'Meio Período'] },
    { id: 'p-r-3', key: 'targetLevel', label: 'Nível de ensino pretendido', type: 'text', required: true, section: 'Renovação' },
    { id: 'p-r-4', key: 'relevantMedicalInfo', label: 'Alteração médica/alimentar/emocional?', type: 'yesno', required: true, section: 'Renovação' },
    { id: 'p-r-5', key: 'therapeuticSupport', label: 'Necessita acompanhamento especializado?', type: 'yesno', required: true, section: 'Renovação' },
    { id: 'p-r-6', key: 'developmentNotes', label: 'Desenvolvimento/comportamento/adaptação', type: 'textarea', required: false, section: 'Renovação' },
    { id: 'p-r-7', key: 'interestAreas', label: 'Interesse por área ou actividade', type: 'text', required: false, section: 'Renovação' },
    { id: 'p-r-8', key: 'pickupPersonsMaintained', label: 'Mantêm-se as pessoas autorizadas a recolher?', type: 'yesno', required: true, section: 'Renovação' },
    { id: 'p-r-9', key: 'pickupPersonsUpdated', label: 'Novas pessoas autorizadas', type: 'textarea', required: false, section: 'Renovação', showIfKey: 'pickupPersonsMaintained', showIfValue: 'Não' },
    { id: 'p-r-10', key: 'guardianContactsChanged', label: 'Houve alteração dos contactos?', type: 'yesno', required: true, section: 'Renovação' },
    { id: 'p-r-11', key: 'guardianNewContacts', label: 'Novos contactos', type: 'textarea', required: false, section: 'Renovação', showIfKey: 'guardianContactsChanged', showIfValue: 'Sim' },
    { id: 'p-r-12', key: 'additionalInfo', label: 'Informação adicional', type: 'textarea', required: false, section: 'Renovação' },
  ];
  return rows.map((row, i) => q(row, i));
}

function atlRenewal(): AdmissionQuestion[] {
  const rows: Array<Omit<AdmissionQuestion, 'sortOrder'> & { sortOrder?: number }> = [
    { id: 'a-r-1', key: 'wantsRenewal', label: 'Pretende renovar a matrícula?', type: 'yesno', required: true, section: 'Renovação' },
    { id: 'a-r-2', key: 'atlFrequency', label: 'Frequência pretendida', type: 'text', required: true, section: 'Renovação' },
    { id: 'a-r-3', key: 'atlSchedule', label: 'Horário de permanência no ATL', type: 'text', required: true, section: 'Renovação' },
    { id: 'a-r-4', key: 'externalSchoolName', label: 'Escola a frequentar', type: 'text', required: true, section: 'Renovação' },
    { id: 'a-r-5', key: 'schoolGrade', label: 'Grau / classe', type: 'text', required: true, section: 'Renovação' },
    { id: 'a-r-6', key: 'relevantMedicalInfo', label: 'Alteração médica/alimentar/emocional?', type: 'yesno', required: true, section: 'Renovação' },
    { id: 'a-r-7', key: 'therapeuticSupport', label: 'Necessita acompanhamento especializado?', type: 'yesno', required: true, section: 'Renovação' },
    { id: 'a-r-8', key: 'developmentNotes', label: 'Desenvolvimento/comportamento', type: 'textarea', required: false, section: 'Renovação' },
    { id: 'a-r-9', key: 'pickupPersonsMaintained', label: 'Mantêm-se as pessoas autorizadas a recolher?', type: 'yesno', required: true, section: 'Renovação' },
    { id: 'a-r-10', key: 'guardianContactsChanged', label: 'Houve alteração dos contactos?', type: 'yesno', required: true, section: 'Renovação' },
    { id: 'a-r-11', key: 'additionalInfo', label: 'Informação adicional', type: 'textarea', required: false, section: 'Renovação' },
  ];
  return rows.map((row, i) => q(row, i));
}

function cicloRenewal(): AdmissionQuestion[] {
  const rows: Array<Omit<AdmissionQuestion, 'sortOrder'> & { sortOrder?: number }> = [
    { id: '1-r-1', key: 'wantsRenewal', label: 'Pretende renovar a matrícula?', type: 'yesno', required: true, section: 'Renovação' },
    { id: '1-r-2', key: 'preferredSchedule', label: 'Horário pretendido', type: 'select', required: true, section: 'Renovação', options: ['Integral', 'Meio Período'] },
    { id: '1-r-3', key: 'relevantMedicalInfo', label: 'Alteração médica/alimentar/emocional?', type: 'yesno', required: false, section: 'Renovação' },
    { id: '1-r-4', key: 'additionalInfo', label: 'Informação adicional', type: 'textarea', required: false, section: 'Renovação' },
  ];
  return rows.map((row, i) => q(row, i));
}

export function buildDefaultAdmissionFormConfig(): AdmissionFormConfig {
  return {
    enrollment: {
      Creche: crecheEnrollment(),
      'Pré-Escolar': preEscolarEnrollment(),
      ATL: atlEnrollment(),
      '1.º Ciclo': cicloEnrollment(),
    },
    renewal: {
      Creche: crecheRenewal(),
      'Pré-Escolar': preRenewal(),
      ATL: atlRenewal(),
      '1.º Ciclo': cicloRenewal(),
    },
  };
}

export function normalizeAdmissionFormConfig(
  raw: unknown,
): AdmissionFormConfig {
  const defaults = buildDefaultAdmissionFormConfig();
  if (!raw || typeof raw !== 'object') return defaults;
  const data = raw as Partial<AdmissionFormConfig>;
  const result = buildDefaultAdmissionFormConfig();
  for (const mode of ['enrollment', 'renewal'] as const) {
    for (const service of SERVICES) {
      const list = data[mode]?.[service];
      if (Array.isArray(list) && list.length > 0) {
        result[mode][service] = list
          .filter((item) => item && typeof item === 'object')
          .map((item, index) => ({
            id: String(item.id || `${mode}-${service}-${index}`),
            key: String(item.key || `q_${index}`).trim() || `q_${index}`,
            label: String(item.label || 'Pergunta').trim() || 'Pergunta',
            type: (['text', 'textarea', 'select', 'yesno', 'date'].includes(
              String(item.type),
            )
              ? item.type
              : 'text') as AdmissionQuestionType,
            required: Boolean(item.required),
            section: String(item.section || 'Geral').trim() || 'Geral',
            sortOrder: Number.isFinite(Number(item.sortOrder))
              ? Number(item.sortOrder)
              : index,
            options: Array.isArray(item.options)
              ? item.options.map(String).filter(Boolean)
              : undefined,
            hint: item.hint ? String(item.hint) : undefined,
            showIfKey: item.showIfKey ? String(item.showIfKey) : undefined,
            showIfValue: item.showIfValue ? String(item.showIfValue) : undefined,
          }))
          .sort((a, b) => a.sortOrder - b.sortOrder);
      }
    }
  }
  return result;
}

export { SERVICES as ADMISSION_SERVICES };
