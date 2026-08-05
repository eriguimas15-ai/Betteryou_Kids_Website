import type {
  AdmissionFormConfig,
  AdmissionFormMode,
  AdmissionQuestion,
  AdmissionServiceKey,
} from "./admission-form-defaults";
import {
  ADMISSION_SERVICES,
  buildDefaultAdmissionFormConfig,
  normalizeAdmissionFormConfig,
} from "./admission-form-defaults";

export type {
  AdmissionFormConfig,
  AdmissionFormMode,
  AdmissionQuestion,
  AdmissionQuestionType,
  AdmissionServiceKey,
} from "./admission-form-defaults";

export {
  ADMISSION_SERVICES,
  buildDefaultAdmissionFormConfig,
  normalizeAdmissionFormConfig,
} from "./admission-form-defaults";

export type AdmissionAnswers = Record<string, string>;

export type AdmissionFormExtras = {
  processType?: "nova" | "renovacao";
  answers: AdmissionAnswers;
  parentConfirmationAccepted?: boolean;
  parentConfirmationAt?: string;
};

export const emptyAdmissionExtras = (
  processType: "nova" | "renovacao" = "nova",
): AdmissionFormExtras => ({
  processType,
  answers: {},
});

export function resolveAdmissionService(
  serviceName: string,
): AdmissionServiceKey | null {
  const name = serviceName.trim() as AdmissionServiceKey;
  return ADMISSION_SERVICES.includes(name) ? name : null;
}

export const REQUIRED_DOCUMENTS = [
  "Cópia do Boletim de Nascimento da Criança",
  "Cópia do BI dos Pais e Encarregado de Educação",
  "Boletim de Vacinas Actualizado",
  "Declaração Médica",
  "2 Fotografias Tipo Passe da Criança",
  "Fotocópia do Seguro de Saúde, caso possua",
] as const;

export function parentConfirmationLabel(
  mode: AdmissionFormMode,
  yearLabel: string,
): string {
  if (mode === "renewal") {
    return `Confirmo o interesse na renovação da matrícula da criança para o ano lectivo ${yearLabel} e declaro que as informações prestadas são verdadeiras.`;
  }
  return `Declaro que as informações prestadas são verdadeiras e confirmo o interesse no processo de matrícula/renovação do aluno para o ano lectivo ${yearLabel}.`;
}

const filled = (v: unknown) => v != null && String(v).trim() !== "";

export function isQuestionVisible(
  question: AdmissionQuestion,
  answers: AdmissionAnswers,
): boolean {
  if (!question.showIfKey) return true;
  return answers[question.showIfKey] === (question.showIfValue ?? "Sim");
}

export function questionsFor(
  config: AdmissionFormConfig,
  mode: AdmissionFormMode,
  serviceName: string,
): AdmissionQuestion[] {
  const service = resolveAdmissionService(serviceName);
  if (!service) return [];
  return [...(config[mode][service] ?? [])].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );
}

export function missingDynamicAnswers(
  questions: AdmissionQuestion[],
  answers: AdmissionAnswers,
): string[] {
  const missing: string[] = [];
  for (const question of questions) {
    if (!isQuestionVisible(question, answers)) continue;
    if (!question.required) continue;
    if (!filled(answers[question.key])) missing.push(question.label);
  }
  return missing;
}

/** @deprecated Prefer missingDynamicAnswers with config loaded from API. */
export function missingAdmissionExtras(
  serviceName: string,
  mode: AdmissionFormMode,
  extras: AdmissionFormExtras,
  config?: AdmissionFormConfig,
): string[] {
  const cfg = config ?? buildDefaultAdmissionFormConfig();
  return missingDynamicAnswers(
    questionsFor(cfg, mode, serviceName),
    extras.answers ?? {},
  );
}

export function buildFormExtrasPayload(
  extras: AdmissionFormExtras,
  parentConfirmationAccepted: boolean,
): AdmissionFormExtras & Record<string, unknown> {
  const answers = extras.answers ?? {};
  return {
    processType: extras.processType,
    answers,
    ...answers,
    parentConfirmationAccepted,
    parentConfirmationAt: parentConfirmationAccepted
      ? new Date().toISOString()
      : undefined,
  };
}

export function newQuestionId(prefix = "q"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}
