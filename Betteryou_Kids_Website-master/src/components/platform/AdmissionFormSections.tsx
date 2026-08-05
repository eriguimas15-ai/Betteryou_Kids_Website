import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import {
  REQUIRED_DOCUMENTS,
  buildDefaultAdmissionFormConfig,
  isQuestionVisible,
  parentConfirmationLabel,
  resolveAdmissionService,
  type AdmissionAnswers,
  type AdmissionFormConfig,
  type AdmissionFormExtras,
  type AdmissionFormMode,
  type AdmissionQuestion,
} from "@/lib/admission-form";

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="font-medium text-foreground">{label}</span>
      {children}
      {hint ? (
        <span className="block text-xs text-muted-foreground">{hint}</span>
      ) : null}
    </label>
  );
}

function QuestionInput({
  question,
  value,
  onChange,
}: {
  question: AdmissionQuestion;
  value: string;
  onChange: (value: string) => void;
}) {
  const common =
    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

  if (question.type === "textarea") {
    return (
      <Textarea
        required={question.required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
      />
    );
  }

  if (question.type === "yesno") {
    return (
      <select
        required={question.required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={common}
      >
        <option value="">Seleccionar</option>
        <option value="Sim">Sim</option>
        <option value="Não">Não</option>
      </select>
    );
  }

  if (question.type === "select") {
    return (
      <select
        required={question.required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={common}
      >
        <option value="">Seleccionar</option>
        {(question.options ?? []).map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }

  if (question.type === "date") {
    return (
      <Input
        required={question.required}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  return (
    <Input
      required={question.required}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function groupBySection(questions: AdmissionQuestion[]) {
  const map = new Map<string, AdmissionQuestion[]>();
  for (const q of questions) {
    const list = map.get(q.section) ?? [];
    list.push(q);
    map.set(q.section, list);
  }
  return [...map.entries()];
}

function DynamicQuestions({
  mode,
  serviceName,
  value,
  onChange,
  config,
}: {
  mode: AdmissionFormMode;
  serviceName: string;
  value: AdmissionFormExtras;
  onChange: (next: AdmissionFormExtras) => void;
  config: AdmissionFormConfig;
}) {
  const service = resolveAdmissionService(serviceName);
  const answers = value.answers ?? {};
  const questions = useMemo(() => {
    if (!service) return [];
    return [...(config[mode][service] ?? [])].sort(
      (a, b) => a.sortOrder - b.sortOrder,
    );
  }, [config, mode, service]);

  const setAnswer = (key: string, nextValue: string) => {
    onChange({
      ...value,
      answers: { ...answers, [key]: nextValue },
    });
  };

  const visible = questions.filter((q) => isQuestionVisible(q, answers));
  const sections = groupBySection(visible);

  if (!service) return null;

  return (
    <>
      <p className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
        Perguntas de {mode === "renewal" ? "renovação" : "inscrição"} para{" "}
        <strong>{service}</strong>. A equipa pode alterar estas perguntas no
        painel de gestão.
      </p>
      {sections.map(([section, items]) => (
        <Card key={section}>
          <CardHeader>
            <CardTitle className="text-lg">{section}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {items.map((question) => (
              <div
                key={question.id}
                className={
                  question.type === "textarea" ? "sm:col-span-2" : undefined
                }
              >
                <Field label={question.label} hint={question.hint}>
                  <QuestionInput
                    question={question}
                    value={answers[question.key] ?? ""}
                    onChange={(v) => setAnswer(question.key, v)}
                  />
                </Field>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
      {mode === "enrollment" && service !== "1.º Ciclo" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Documentos obrigatórios na recepção
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {REQUIRED_DOCUMENTS.map((doc) => (
                <li key={doc}>{doc}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </>
  );
}

function useAdmissionFormConfig() {
  const [config, setConfig] = useState<AdmissionFormConfig>(() =>
    buildDefaultAdmissionFormConfig(),
  );

  useEffect(() => {
    let active = true;
    api
      .getAdmissionFormConfig()
      .then((data) => {
        if (active) setConfig(data);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  return config;
}

export function EnrollmentExtrasSection({
  serviceName,
  value,
  onChange,
}: {
  serviceName: string;
  value: AdmissionFormExtras;
  onChange: (next: AdmissionFormExtras) => void;
}) {
  const config = useAdmissionFormConfig();
  return (
    <DynamicQuestions
      mode="enrollment"
      serviceName={serviceName}
      value={value}
      onChange={onChange}
      config={config}
    />
  );
}

export function RenewalExtrasSection({
  serviceName,
  value,
  onChange,
}: {
  serviceName: string;
  value: AdmissionFormExtras;
  onChange: (next: AdmissionFormExtras) => void;
}) {
  const config = useAdmissionFormConfig();
  return (
    <DynamicQuestions
      mode="renewal"
      serviceName={serviceName}
      value={value}
      onChange={onChange}
      config={config}
    />
  );
}

export function ParentConfirmationSection({
  mode,
  yearLabel,
  accepted,
  onChange,
}: {
  mode: AdmissionFormMode;
  yearLabel: string;
  accepted: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <Card className="border-primary/30">
      <CardHeader>
        <CardTitle className="text-lg">Confirmação final</CardTitle>
      </CardHeader>
      <CardContent>
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 shrink-0"
            required
            checked={accepted}
            onChange={(e) => onChange(e.target.checked)}
          />
          <span>{parentConfirmationLabel(mode, yearLabel)}</span>
        </label>
      </CardContent>
    </Card>
  );
}

/** Utilitário para validação no submit (reexport mental). */
export type { AdmissionAnswers };
