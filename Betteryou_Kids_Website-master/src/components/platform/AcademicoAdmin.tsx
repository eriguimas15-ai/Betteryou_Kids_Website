import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import { Download, Trash2 } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  api,
  type AcademicYear,
  type Assessment,
  type AssessmentGradeType,
  type AssessmentPayload,
  type AssessmentPeriod,
  type AssessmentPeriodPayload,
  type AttendanceTurma,
  type DashboardAcademico,
  type DashboardPedagogico,
  type DescriptiveReport,
  type DescriptiveReportPayload,
  type DescriptiveReportStatus,
  type LessonSummary,
  type LessonSummaryPayload,
  type ReportCard,
  type ReportCardStatus,
  type ScheduleEntry,
  type ScheduleEntryPayload,
  type Substitution,
  type SubstitutionPayload,
  type SubstitutionStatus,
  type Unit,
} from "@/lib/api";
import {
  ComportamentoTab,
  HabilitacoesTab,
  NleTab,
} from "@/components/platform/CoverageExtras";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2 text-sm">
      <span className="font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        {label}
      </span>
      {children}
    </label>
  );
}

const ACADEMICO_MANAGE_ROLES = [
  "ADMIN",
  "DIRECAO",
  "COORDENACAO",
  "PROFESSOR",
];

type AcademicoTab =
  | "sumarios"
  | "avaliacoes"
  | "horarios"
  | "periodos"
  | "boletins"
  | "monitorizacao"
  | "sinteses"
  | "substituicoes"
  | "nle"
  | "comportamento"
  | "habilitacoes";

const ACADEMICO_TABS: Array<{ value: AcademicoTab; label: string }> = [
  { value: "sumarios", label: "Sumários" },
  { value: "avaliacoes", label: "Avaliações" },
  { value: "horarios", label: "Horários" },
  { value: "periodos", label: "Períodos" },
  { value: "boletins", label: "Boletins" },
  { value: "monitorizacao", label: "Monitorização" },
  { value: "sinteses", label: "Sínteses" },
  { value: "substituicoes", label: "Substituições" },
  { value: "nle", label: "Actividades NLE" },
  { value: "comportamento", label: "Comportamento" },
  { value: "habilitacoes", label: "Habilitações" },
];

const WEEKDAYS: Array<{ value: number; label: string; short: string }> = [
  { value: 1, label: "Segunda-feira", short: "Seg" },
  { value: 2, label: "Terça-feira", short: "Ter" },
  { value: 3, label: "Quarta-feira", short: "Qua" },
  { value: 4, label: "Quinta-feira", short: "Qui" },
  { value: 5, label: "Sexta-feira", short: "Sex" },
  { value: 6, label: "Sábado", short: "Sáb" },
  { value: 7, label: "Domingo", short: "Dom" },
];

function weekdayLabel(weekday: number): string {
  return WEEKDAYS.find((d) => d.value === weekday)?.label || "—";
}

function formatAcademicoDate(value: string): string {
  try {
    return format(
      parseISO(value.length === 10 ? `${value}T12:00:00` : value),
      "dd/MM/yyyy",
      { locale: pt },
    );
  } catch {
    return value.slice(0, 10);
  }
}

function assessmentGradeDisplay(item: Assessment): string {
  if (item.gradeType === "NUMERICA") {
    return item.gradeValue != null ? String(item.gradeValue) : "—";
  }
  return item.gradeLabel || "—";
}

export function AcademicoAdmin({
  needsLogin,
  userRole,
  onLogin,
}: {
  needsLogin: boolean;
  userRole: string;
  onLogin: () => void;
}) {
  const canManage = ACADEMICO_MANAGE_ROLES.includes(userRole);
  const [turmas, setTurmas] = useState<AttendanceTurma[]>([]);
  const [selectedTurmaId, setSelectedTurmaId] = useState("");
  const [tab, setTab] = useState<AcademicoTab>("sumarios");

  useEffect(() => {
    if (needsLogin) return;
    api
      .getAcademicoTurmas()
      .then((list) => {
        setTurmas(list);
        setSelectedTurmaId((current) => current || list[0]?.id || "");
      })
      .catch(() => setTurmas([]));
  }, [needsLogin]);

  if (needsLogin) {
    return (
      <Card>
        <CardContent className="space-y-4 p-8">
          <h1 className="text-2xl font-bold">Académico</h1>
          <p className="text-muted-foreground">
            Inicie sessão para gerir sumários, avaliações e horários das turmas.
          </p>
          <Button onClick={onLogin}>Entrar</Button>
        </CardContent>
      </Card>
    );
  }

  const selectedTurma = turmas.find((t) => t.id === selectedTurmaId);

  return (
    <div>
      <div className="mb-7">
        <p className="mb-2 text-sm font-medium text-secondary">ACADÉMICO</p>
        <h1 className="text-3xl font-bold">Académico</h1>
        <p className="mt-2 text-muted-foreground">
          Registe sumários, avaliações, horários, períodos, boletins, sínteses,
          substituições, actividades não lectivas, comportamento e habilitações.
          Os encarregados consultam os dados partilhados no portal.
        </p>
      </div>

      <Card className="mb-6">
        <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-end">
          <div className="lg:w-96">
            <Field label="Turma">
              <Select value={selectedTurmaId} onValueChange={setSelectedTurmaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar turma" />
                </SelectTrigger>
                <SelectContent>
                  {turmas.map((turma) => (
                    <SelectItem key={turma.id} value={turma.id}>
                      {turma.name} · {turma.room.name} · {turma.room.unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          {selectedTurma && (
            <div className="rounded-lg border bg-slate-50 p-3 text-sm text-muted-foreground">
              <p>
                {selectedTurma.room.service.name} ·{" "}
                {selectedTurma.academicYear.label}
                {selectedTurma.teacherName
                  ? ` · Educador(a): ${selectedTurma.teacherName}`
                  : ""}
              </p>
              <p>{selectedTurma.studentCount} aluno(s) na turma</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mb-6 flex flex-wrap gap-2">
        {ACADEMICO_TABS.filter((t) => {
          if (t.value === "monitorizacao") {
            return ["ADMIN", "DIRECAO", "COORDENACAO"].includes(userRole);
          }
          return true;
        }).map((t) => (
          <Button
            key={t.value}
            variant={tab === t.value ? "default" : "outline"}
            size="sm"
            onClick={() => setTab(t.value)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {!selectedTurmaId &&
      tab !== "sinteses" &&
      tab !== "substituicoes" &&
      tab !== "nle" &&
      tab !== "comportamento" &&
      tab !== "habilitacoes" &&
      tab !== "periodos" &&
      tab !== "boletins" &&
      tab !== "monitorizacao" ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Seleccione uma turma para começar.
          </CardContent>
        </Card>
      ) : tab === "sumarios" ? (
        <SumariosTab
          key={`sum-${selectedTurmaId}`}
          classGroupId={selectedTurmaId}
          canManage={canManage}
        />
      ) : tab === "avaliacoes" ? (
        <AvaliacoesTab
          key={`ava-${selectedTurmaId}`}
          classGroupId={selectedTurmaId}
          canManage={canManage}
        />
      ) : tab === "horarios" ? (
        <HorariosTab
          key={`hor-${selectedTurmaId}`}
          classGroupId={selectedTurmaId}
          canManage={canManage}
        />
      ) : tab === "periodos" ? (
        <PeriodosTab canManage={canManage} />
      ) : tab === "boletins" ? (
        <BoletinsTab
          canManage={canManage}
          turmas={turmas}
          selectedTurmaId={selectedTurmaId}
        />
      ) : tab === "monitorizacao" ? (
        <MonitorizacaoAcademicaTab userRole={userRole} />
      ) : tab === "sinteses" ? (
        <SintesesTab canManage={canManage} />
      ) : tab === "substituicoes" ? (
        <SubstituicoesTab
          canManage={["ADMIN", "DIRECAO", "COORDENACAO"].includes(userRole)}
          turmas={turmas}
          selectedTurmaId={selectedTurmaId}
        />
      ) : tab === "nle" ? (
        <NleTab
          canManage={canManage}
          turmas={turmas}
          selectedTurmaId={selectedTurmaId}
        />
      ) : tab === "comportamento" ? (
        <ComportamentoTab canManage={canManage} />
      ) : (
        <HabilitacoesTab canManage={canManage} />
      )}
    </div>
  );
}

type SumarioForm = {
  date: string;
  subject: string;
  topic: string;
  description: string;
  homework: string;
};

function PeriodosTab({ canManage }: { canManage: boolean }) {
  const [items, setItems] = useState<AssessmentPeriod[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [form, setForm] = useState({
    name: "",
    academicYearId: "",
    unitId: "",
    startDate: format(new Date(), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
    sortOrder: "0",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadList = () => {
    setLoading(true);
    api
      .getAssessmentPeriods()
      .then(setItems)
      .catch((err) =>
        setMessage(
          err instanceof Error
            ? err.message
            : "Não foi possível carregar os períodos.",
        ),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadList();
    api.getAcademicYears().then(setYears).catch(() => setYears([]));
    api.getUnits().then(setUnits).catch(() => setUnits([]));
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setForm({
      name: "",
      academicYearId: years.find((y) => y.active)?.id || years[0]?.id || "",
      unitId: "",
      startDate: format(new Date(), "yyyy-MM-dd"),
      endDate: format(new Date(), "yyyy-MM-dd"),
      sortOrder: "0",
    });
  };

  useEffect(() => {
    if (!form.academicYearId && years.length) {
      setForm((f) => ({
        ...f,
        academicYearId: years.find((y) => y.active)?.id || years[0].id,
      }));
    }
  }, [years, form.academicYearId]);

  const startEdit = (item: AssessmentPeriod) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      academicYearId: item.academicYearId,
      unitId: item.unitId ?? "",
      startDate: item.startDate.slice(0, 10),
      endDate: item.endDate.slice(0, 10),
      sortOrder: String(item.sortOrder ?? 0),
    });
    setMessage("");
  };

  const submit = async () => {
    if (!form.name.trim() || !form.academicYearId) {
      setMessage("Indique o nome e o ano lectivo.");
      return;
    }
    const payload: AssessmentPeriodPayload = {
      name: form.name.trim(),
      academicYearId: form.academicYearId,
      unitId: form.unitId || null,
      startDate: form.startDate,
      endDate: form.endDate,
      sortOrder: Number(form.sortOrder) || 0,
    };
    setSaving(true);
    setMessage("");
    try {
      if (editingId) {
        await api.updateAssessmentPeriod(editingId, payload);
        setMessage("Período actualizado.");
      } else {
        await api.createAssessmentPeriod(payload);
        setMessage("Período criado.");
      }
      resetForm();
      loadList();
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : "Não foi possível guardar o período.",
      );
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item: AssessmentPeriod) => {
    if (!window.confirm(`Remover o período «${item.name}»?`)) return;
    try {
      await api.deleteAssessmentPeriod(item.id);
      if (editingId === item.id) resetForm();
      loadList();
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Não foi possível remover.",
      );
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {canManage && (
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">
              {editingId ? "Editar período" : "Novo período"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Nome">
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="1.º Trimestre"
              />
            </Field>
            <Field label="Ano lectivo">
              <Select
                value={form.academicYearId}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, academicYearId: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar ano" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y.id} value={y.id}>
                      {y.label}
                      {y.active ? " (activo)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Unidade (opcional)">
              <Select
                value={form.unitId || "all"}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, unitId: v === "all" ? "" : v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as unidades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as unidades</SelectItem>
                  {units.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Início">
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, startDate: e.target.value }))
                  }
                />
              </Field>
              <Field label="Fim">
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, endDate: e.target.value }))
                  }
                />
              </Field>
            </div>
            <Field label="Ordem">
              <Input
                type="number"
                value={form.sortOrder}
                onChange={(e) =>
                  setForm((f) => ({ ...f, sortOrder: e.target.value }))
                }
              />
            </Field>
            {message && (
              <p className="text-sm text-muted-foreground">{message}</p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button onClick={submit} disabled={saving}>
                {saving ? "A guardar…" : editingId ? "Guardar" : "Criar"}
              </Button>
              {editingId && (
                <Button variant="ghost" onClick={resetForm} disabled={saving}>
                  Cancelar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      <Card className={canManage ? "lg:col-span-2" : "lg:col-span-3"}>
        <CardHeader>
          <CardTitle className="text-lg">Períodos de avaliação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">A carregar…</p>
          ) : items.length === 0 ? (
            <p className="rounded-lg border p-5 text-sm text-muted-foreground">
              Ainda não existem períodos definidos.
            </p>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-lg border p-4"
              >
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.academicYear?.label || "—"}
                    {item.unit ? ` · ${item.unit.name}` : " · Toda a escola"}
                    {" · "}
                    {formatAcademicoDate(item.startDate)} –{" "}
                    {formatAcademicoDate(item.endDate)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item._count?.assessments ?? 0} avaliação(ões) ·{" "}
                    {item._count?.reportCards ?? 0} boletim(ns)
                  </p>
                </div>
                {canManage && (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEdit(item)}
                    >
                      <Pencil className="mr-1 h-3.5 w-3.5" />
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(item)}
                    >
                      <Trash2 className="mr-1 h-3.5 w-3.5" />
                      Remover
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function BoletinsTab({
  canManage,
  turmas,
  selectedTurmaId,
}: {
  canManage: boolean;
  turmas: AttendanceTurma[];
  selectedTurmaId: string;
}) {
  const [periods, setPeriods] = useState<AssessmentPeriod[]>([]);
  const [periodId, setPeriodId] = useState("");
  const [classGroupId, setClassGroupId] = useState(selectedTurmaId);
  const [items, setItems] = useState<ReportCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [editCommentId, setEditCommentId] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState("");
  const [sendEmailOnPublish, setSendEmailOnPublish] = useState(true);
  const [pdfBusyId, setPdfBusyId] = useState<string | null>(null);

  useEffect(() => {
    setClassGroupId(selectedTurmaId);
  }, [selectedTurmaId]);

  useEffect(() => {
    api
      .getAssessmentPeriods()
      .then((list) => {
        setPeriods(list);
        setPeriodId((current) => current || list[0]?.id || "");
      })
      .catch(() => setPeriods([]));
  }, []);

  const loadList = () => {
    if (!periodId && !classGroupId) return;
    setLoading(true);
    api
      .getReportCards({
        periodId: periodId || undefined,
        classGroupId: classGroupId || undefined,
      })
      .then(setItems)
      .catch((err) =>
        setMessage(
          err instanceof Error
            ? err.message
            : "Não foi possível carregar os boletins.",
        ),
      )
      .finally(() => setLoading(false));
  };

  useEffect(loadList, [periodId, classGroupId]);

  const generate = async (overwriteDraft = false) => {
    if (!periodId || !classGroupId) {
      setMessage("Seleccione o período e a turma.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const result = await api.generateReportCards({
        periodId,
        classGroupId,
        overwriteDraft,
      });
      setMessage(
        `Geração: ${result.created} criado(s), ${result.updated} actualizado(s), ${result.skipped} ignorado(s).`,
      );
      setItems(result.cards);
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : "Não foi possível gerar os boletins.",
      );
    } finally {
      setBusy(false);
    }
  };

  const togglePublish = async (item: ReportCard) => {
    try {
      if (item.status === "PUBLICADO") {
        await api.unpublishReportCard(item.id);
        setMessage("Boletim reposto a rascunho.");
      } else {
        await api.publishReportCard(item.id, {
          sendEmail: sendEmailOnPublish,
        });
        setMessage(
          sendEmailOnPublish
            ? "Boletim publicado (com envio de email ao encarregado)."
            : "Boletim publicado.",
        );
      }
      loadList();
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Não foi possível actualizar.",
      );
    }
  };

  const exportPdf = async (item: ReportCard) => {
    setPdfBusyId(item.id);
    setMessage("");
    try {
      await api.downloadReportCardPdf(item.id);
      setMessage("PDF transferido com sucesso.");
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : "Não foi possível exportar o PDF.",
      );
    } finally {
      setPdfBusyId(null);
    }
  };

  const saveComment = async (id: string) => {
    try {
      await api.updateReportCard(id, {
        overallComment: commentDraft.trim() || null,
      });
      setEditCommentId(null);
      loadList();
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : "Não foi possível guardar o comentário.",
      );
    }
  };

  const remove = async (item: ReportCard) => {
    if (
      !window.confirm(
        `Remover o boletim de ${item.student?.childFullName || "aluno"}?`,
      )
    ) {
      return;
    }
    try {
      await api.deleteReportCard(item.id);
      loadList();
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Não foi possível remover.",
      );
    }
  };

  const lineGrade = (line: NonNullable<ReportCard["lines"]>[number]) => {
    if (line.gradeType === "NUMERICA") {
      return line.gradeValue != null ? String(line.gradeValue) : "—";
    }
    return line.gradeLabel || (line.sourceType === "SINTESE" ? "Síntese" : "—");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-end">
          <div className="lg:w-72">
            <Field label="Período">
              <Select value={periodId} onValueChange={setPeriodId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar período" />
                </SelectTrigger>
                <SelectContent>
                  {periods.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} · {p.academicYear?.label || "—"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="lg:w-96">
            <Field label="Turma">
              <Select value={classGroupId} onValueChange={setClassGroupId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar turma" />
                </SelectTrigger>
                <SelectContent>
                  {turmas.map((turma) => (
                    <SelectItem key={turma.id} value={turma.id}>
                      {turma.name} · {turma.room.unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          {canManage && (
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => generate(false)} disabled={busy}>
                  {busy ? "A gerar…" : "Gerar boletins"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => generate(true)}
                  disabled={busy}
                >
                  Regenerar rascunhos
                </Button>
              </div>
              <div className="flex items-center gap-3 rounded-lg border px-3 py-2">
                <div>
                  <p className="text-sm font-medium">Enviar também por email</p>
                  <p className="text-xs text-muted-foreground">
                    Ao publicar, notifica o encarregado com o PDF.
                  </p>
                </div>
                <Switch
                  checked={sendEmailOnPublish}
                  onCheckedChange={setSendEmailOnPublish}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {message && (
        <p className="text-sm text-muted-foreground">{message}</p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Boletins</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">A carregar…</p>
          ) : items.length === 0 ? (
            <p className="rounded-lg border p-5 text-sm text-muted-foreground">
              Ainda não há boletins para estes filtros. Gere a partir das
              avaliações e sínteses do período.
            </p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="space-y-3 rounded-lg border p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">
                      {item.student?.childFullName || "Aluno"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.period?.name || "—"} ·{" "}
                      {item.classGroup?.name || "—"}
                      {item.publishedAt
                        ? ` · ${formatAcademicoDate(item.publishedAt)}`
                        : ""}
                    </p>
                  </div>
                  <Badge
                    variant={
                      item.status === "PUBLICADO" ? "default" : "secondary"
                    }
                  >
                    {item.status === "PUBLICADO" ? "Publicado" : "Rascunho"}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {(item.lines ?? []).map((line) => (
                    <div
                      key={line.id}
                      className="flex flex-wrap items-start justify-between gap-2 rounded border p-2 text-sm"
                    >
                      <div>
                        <p className="font-medium">
                          {line.subject} — {line.title}
                        </p>
                        {line.comment && (
                          <p className="mt-1 whitespace-pre-line text-muted-foreground">
                            {line.comment.length > 180
                              ? `${line.comment.slice(0, 180)}…`
                              : line.comment}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline">{lineGrade(line)}</Badge>
                    </div>
                  ))}
                </div>
                {editCommentId === item.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={commentDraft}
                      onChange={(e) => setCommentDraft(e.target.value)}
                      rows={3}
                      placeholder="Comentário geral do boletim"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => saveComment(item.id)}>
                        Guardar comentário
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditCommentId(null)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : item.overallComment ? (
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">
                      Comentário:{" "}
                    </span>
                    {item.overallComment}
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportPdf(item)}
                    disabled={pdfBusyId === item.id}
                  >
                    <Download className="mr-1 h-3.5 w-3.5" />
                    {pdfBusyId === item.id ? "A exportar…" : "Exportar PDF"}
                  </Button>
                  {canManage && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => togglePublish(item)}
                      >
                        {item.status === "PUBLICADO"
                          ? "Repor rascunho"
                          : "Publicar"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditCommentId(item.id);
                          setCommentDraft(item.overallComment ?? "");
                        }}
                      >
                        Comentário
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(item)}
                      >
                        <Trash2 className="mr-1 h-3.5 w-3.5" />
                        Remover
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MonitorizacaoAcademicaTab({ userRole }: { userRole: string }) {
  const canAccess = ["ADMIN", "DIRECAO", "COORDENACAO"].includes(userRole);
  const [unitId, setUnitId] = useState("all");
  const [yearId, setYearId] = useState("");
  const [data, setData] = useState<DashboardAcademico | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!canAccess) return;
    let active = true;
    setLoading(true);
    setError("");
    api
      .getDashboardAcademico({
        unitId,
        academicYearId: yearId || undefined,
      })
      .then((result) => {
        if (!active) return;
        setData(result);
        if (!yearId && result.academicYear?.id) {
          setYearId(result.academicYear.id);
        }
      })
      .catch((err) => {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Não foi possível carregar.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [canAccess, unitId, yearId]);

  if (!canAccess) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Sem permissão. Reservado à administração, direcção e coordenação.
        </CardContent>
      </Card>
    );
  }

  const kpis = data?.kpis;
  const byUnit = data?.porUnidade ?? [];
  const byTurma = data?.porTurma ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4">
        <div className="w-56">
          <Field label="Unidade">
            <Select value={unitId} onValueChange={setUnitId}>
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as unidades</SelectItem>
                {(data?.units ?? []).map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <div className="w-56">
          <Field label="Ano lectivo">
            <Select value={yearId || "none"} onValueChange={(v) => setYearId(v === "none" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Ano activo" />
              </SelectTrigger>
              <SelectContent>
                {(data?.years ?? []).map((y) => (
                  <SelectItem key={y.id} value={y.id}>
                    {y.label}
                    {y.active ? " (activo)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </div>
      )}
      {loading && !data && (
        <p className="text-muted-foreground">A carregar monitorização…</p>
      )}

      {data && kpis && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ExecKpiCard
              label="Alunos"
              value={String(kpis.alunos)}
              hint={`${kpis.turmas} turma(s)`}
              icon={GraduationCap}
            />
            <ExecKpiCard
              label="Assiduidade"
              value={
                kpis.taxaAssiduidade != null
                  ? `${kpis.taxaAssiduidade}%`
                  : "—"
              }
              icon={Activity}
            />
            <ExecKpiCard
              label="Cobertura de avaliações"
              value={
                kpis.coberturaAvaliacoes != null
                  ? `${kpis.coberturaAvaliacoes}%`
                  : "—"
              }
              hint={`${kpis.sumariosRegistados} sumário(s)`}
              icon={TrendingUp}
            />
            <ExecKpiCard
              label="NEE / PEI / Incidentes"
              value={`${kpis.neeActivos} / ${kpis.peiAbertos} / ${kpis.incidentesComportamento}`}
              hint="NEE activos · PEI abertos · incidentes"
              icon={Users}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Por unidade</CardTitle>
              </CardHeader>
              <CardContent>
                {byUnit.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem dados.</p>
                ) : (
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={byUnit}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="unit" fontSize={12} />
                        <YAxis fontSize={12} domain={[0, 100]} />
                        <RechartsTooltip />
                        <Legend />
                        <Bar
                          dataKey="attendanceRate"
                          name="Assiduidade %"
                          fill="#0d9488"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="assessmentCoverage"
                          name="Avaliações %"
                          fill="#0369a1"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Turmas</CardTitle>
              </CardHeader>
              <CardContent className="max-h-[320px] space-y-2 overflow-y-auto">
                {byTurma.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem turmas.</p>
                ) : (
                  byTurma.map((row) => (
                    <div
                      key={row.classGroupId}
                      className="rounded-lg border p-3 text-sm"
                    >
                      <p className="font-medium">
                        {row.name} · {row.unit}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {row.service} · {row.studentCount} aluno(s)
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Assiduidade:{" "}
                        {row.attendanceRate != null
                          ? `${row.attendanceRate}%`
                          : "—"}
                        {" · "}
                        Avaliações:{" "}
                        {row.assessmentCoverage != null
                          ? `${row.assessmentCoverage}%`
                          : "—"}
                        {" · "}
                        Sumários: {row.lessonSummaries}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function emptySumarioForm(): SumarioForm {
  return {
    date: format(new Date(), "yyyy-MM-dd"),
    subject: "",
    topic: "",
    description: "",
    homework: "",
  };
}

function SumariosTab({
  classGroupId,
  canManage,
}: {
  classGroupId: string;
  canManage: boolean;
}) {
  const [items, setItems] = useState<LessonSummary[]>([]);
  const [form, setForm] = useState<SumarioForm>(emptySumarioForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadList = () => {
    setLoading(true);
    api
      .getLessonSummaries(classGroupId)
      .then(setItems)
      .catch((err) =>
        setMessage(
          err instanceof Error
            ? err.message
            : "Não foi possível carregar os sumários.",
        ),
      )
      .finally(() => setLoading(false));
  };

  useEffect(loadList, [classGroupId]);

  const resetForm = () => {
    setForm(emptySumarioForm());
    setEditingId(null);
  };

  const startEdit = (item: LessonSummary) => {
    setEditingId(item.id);
    setForm({
      date: item.date.slice(0, 10),
      subject: item.subject,
      topic: item.topic ?? "",
      description: item.description,
      homework: item.homework ?? "",
    });
    setMessage("");
  };

  const submit = async () => {
    if (!form.subject.trim() || !form.description.trim()) {
      setMessage("Indique a disciplina e a descrição do sumário.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      if (editingId) {
        await api.updateLessonSummary(editingId, {
          date: form.date,
          subject: form.subject.trim(),
          topic: form.topic.trim() || null,
          description: form.description.trim(),
          homework: form.homework.trim() || null,
        });
        setMessage("Sumário actualizado.");
      } else {
        const payload: LessonSummaryPayload = {
          classGroupId,
          date: form.date,
          subject: form.subject.trim(),
          topic: form.topic.trim() || null,
          description: form.description.trim(),
          homework: form.homework.trim() || null,
        };
        await api.createLessonSummary(payload);
        setMessage("Sumário registado.");
      }
      resetForm();
      loadList();
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : "Não foi possível guardar o sumário.",
      );
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item: LessonSummary) => {
    if (!window.confirm(`Remover o sumário de ${item.subject}?`)) return;
    try {
      await api.deleteLessonSummary(item.id);
      if (editingId === item.id) resetForm();
      loadList();
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Não foi possível remover.",
      );
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {canManage && (
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">
              {editingId ? "Editar sumário" : "Novo sumário"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Data">
              <Input
                type="date"
                value={form.date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, date: e.target.value }))
                }
              />
            </Field>
            <Field label="Disciplina">
              <Input
                value={form.subject}
                onChange={(e) =>
                  setForm((f) => ({ ...f, subject: e.target.value }))
                }
                placeholder="Ex.: Matemática"
              />
            </Field>
            <Field label="Tema (opcional)">
              <Input
                value={form.topic}
                onChange={(e) =>
                  setForm((f) => ({ ...f, topic: e.target.value }))
                }
                placeholder="Ex.: Números até 100"
              />
            </Field>
            <Field label="Descrição">
              <Textarea
                rows={5}
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="O que foi trabalhado na aula…"
              />
            </Field>
            <Field label="Trabalho de casa (opcional)">
              <Textarea
                rows={3}
                value={form.homework}
                onChange={(e) =>
                  setForm((f) => ({ ...f, homework: e.target.value }))
                }
                placeholder="Ex.: Ficha 3, exercícios 1 a 4"
              />
            </Field>
            {message && (
              <p className="text-sm text-muted-foreground">{message}</p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button onClick={submit} disabled={saving}>
                {saving ? "A guardar…" : editingId ? "Guardar" : "Registar"}
              </Button>
              {editingId && (
                <Button variant="ghost" onClick={resetForm} disabled={saving}>
                  Cancelar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className={canManage ? "lg:col-span-2" : "lg:col-span-3"}>
        <CardHeader>
          <CardTitle className="text-lg">Sumários</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!canManage && message && (
            <p className="text-sm text-muted-foreground">{message}</p>
          )}
          {loading ? (
            <p className="text-sm text-muted-foreground">A carregar…</p>
          ) : items.length === 0 ? (
            <p className="rounded-lg border p-5 text-sm text-muted-foreground">
              Ainda não há sumários para esta turma.
            </p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="space-y-2 rounded-lg border p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">
                      {item.subject}
                      {item.topic ? ` — ${item.topic}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatAcademicoDate(item.date)}
                      {item.author ? ` · ${item.author.name}` : ""}
                    </p>
                  </div>
                  {canManage && (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEdit(item)}
                      >
                        <Pencil className="mr-1 h-3.5 w-3.5" />
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(item)}
                      >
                        <Trash2 className="mr-1 h-3.5 w-3.5" />
                        Remover
                      </Button>
                    </div>
                  )}
                </div>
                <p className="whitespace-pre-line text-sm text-muted-foreground">
                  {item.description}
                </p>
                {item.homework && (
                  <p className="text-sm">
                    <span className="font-medium">Trabalho de casa: </span>
                    <span className="text-muted-foreground">
                      {item.homework}
                    </span>
                  </p>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

type AvaliacaoForm = {
  studentId: string;
  title: string;
  subject: string;
  date: string;
  gradeType: AssessmentGradeType;
  gradeValue: string;
  gradeLabel: string;
  note: string;
};

function emptyAvaliacaoForm(): AvaliacaoForm {
  return {
    studentId: "",
    title: "",
    subject: "",
    date: format(new Date(), "yyyy-MM-dd"),
    gradeType: "NUMERICA",
    gradeValue: "",
    gradeLabel: "",
    note: "",
  };
}

function AvaliacoesTab({
  classGroupId,
  canManage,
}: {
  classGroupId: string;
  canManage: boolean;
}) {
  const [items, setItems] = useState<Assessment[]>([]);
  const [roster, setRoster] = useState<AttendanceStudentRow[]>([]);
  const [form, setForm] = useState<AvaliacaoForm>(emptyAvaliacaoForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadList = () => {
    setLoading(true);
    api
      .getAssessmentsForTurma(classGroupId)
      .then(setItems)
      .catch((err) =>
        setMessage(
          err instanceof Error
            ? err.message
            : "Não foi possível carregar as avaliações.",
        ),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadList();
    // Roster da turma (mesma derivação das presenças: sala + ano lectivo).
    api
      .getAttendanceForTurma(classGroupId, format(new Date(), "yyyy-MM-dd"))
      .then((data) => setRoster(data.students))
      .catch(() => setRoster([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classGroupId]);

  const resetForm = () => {
    setForm(emptyAvaliacaoForm());
    setEditingId(null);
  };

  const startEdit = (item: Assessment) => {
    setEditingId(item.id);
    setForm({
      studentId: item.studentId,
      title: item.title,
      subject: item.subject,
      date: item.date.slice(0, 10),
      gradeType: item.gradeType,
      gradeValue: item.gradeValue != null ? String(item.gradeValue) : "",
      gradeLabel: item.gradeLabel ?? "",
      note: item.note ?? "",
    });
    setMessage("");
  };

  const submit = async () => {
    if (!form.studentId) {
      setMessage("Seleccione o aluno.");
      return;
    }
    if (!form.title.trim() || !form.subject.trim()) {
      setMessage("Indique o título e a disciplina.");
      return;
    }
    let gradeValue: number | null = null;
    let gradeLabel: string | null = null;
    if (form.gradeType === "NUMERICA") {
      const parsed = Number(form.gradeValue.replace(",", "."));
      if (form.gradeValue.trim() === "" || Number.isNaN(parsed)) {
        setMessage("Indique a nota numérica.");
        return;
      }
      gradeValue = parsed;
    } else {
      if (!form.gradeLabel.trim()) {
        setMessage("Indique a classificação qualitativa.");
        return;
      }
      gradeLabel = form.gradeLabel.trim();
    }

    setSaving(true);
    setMessage("");
    try {
      if (editingId) {
        await api.updateAssessment(editingId, {
          title: form.title.trim(),
          subject: form.subject.trim(),
          date: form.date,
          gradeType: form.gradeType,
          gradeValue,
          gradeLabel,
          note: form.note.trim() || null,
        });
        setMessage("Avaliação actualizada.");
      } else {
        const payload: AssessmentPayload = {
          studentId: form.studentId,
          classGroupId,
          title: form.title.trim(),
          subject: form.subject.trim(),
          date: form.date,
          gradeType: form.gradeType,
          gradeValue,
          gradeLabel,
          note: form.note.trim() || null,
        };
        await api.createAssessment(payload);
        setMessage("Avaliação registada.");
      }
      resetForm();
      loadList();
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : "Não foi possível guardar a avaliação.",
      );
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item: Assessment) => {
    if (!window.confirm(`Remover a avaliação "${item.title}"?`)) return;
    try {
      await api.deleteAssessment(item.id);
      if (editingId === item.id) resetForm();
      loadList();
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Não foi possível remover.",
      );
    }
  };

  const studentName = (item: Assessment) =>
    item.student?.childFullName ||
    roster.find((r) => r.studentId === item.studentId)?.childFullName ||
    "Aluno";

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {canManage && (
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">
              {editingId ? "Editar avaliação" : "Nova avaliação"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Aluno">
              <Select
                value={form.studentId}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, studentId: v }))
                }
                disabled={!!editingId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar aluno" />
                </SelectTrigger>
                <SelectContent>
                  {roster.map((s) => (
                    <SelectItem key={s.studentId} value={s.studentId}>
                      {s.childFullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {roster.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Esta turma ainda não tem alunos associados.
                </p>
              )}
            </Field>
            <Field label="Título">
              <Input
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                placeholder="Ex.: Teste 1.º período"
              />
            </Field>
            <Field label="Disciplina">
              <Input
                value={form.subject}
                onChange={(e) =>
                  setForm((f) => ({ ...f, subject: e.target.value }))
                }
                placeholder="Ex.: Português"
              />
            </Field>
            <Field label="Data">
              <Input
                type="date"
                value={form.date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, date: e.target.value }))
                }
              />
            </Field>
            <Field label="Tipo de classificação">
              <Select
                value={form.gradeType}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    gradeType: v as AssessmentGradeType,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NUMERICA">Numérica</SelectItem>
                  <SelectItem value="QUALITATIVA">Qualitativa</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            {form.gradeType === "NUMERICA" ? (
              <Field label="Nota">
                <Input
                  type="number"
                  step="0.1"
                  value={form.gradeValue}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, gradeValue: e.target.value }))
                  }
                  placeholder="Ex.: 16.5"
                />
              </Field>
            ) : (
              <Field label="Classificação">
                <Input
                  value={form.gradeLabel}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, gradeLabel: e.target.value }))
                  }
                  placeholder="Ex.: Muito Bom"
                />
              </Field>
            )}
            <Field label="Observação (opcional)">
              <Textarea
                rows={3}
                value={form.note}
                onChange={(e) =>
                  setForm((f) => ({ ...f, note: e.target.value }))
                }
                placeholder="Comentário sobre o desempenho…"
              />
            </Field>
            {message && (
              <p className="text-sm text-muted-foreground">{message}</p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button onClick={submit} disabled={saving}>
                {saving ? "A guardar…" : editingId ? "Guardar" : "Registar"}
              </Button>
              {editingId && (
                <Button variant="ghost" onClick={resetForm} disabled={saving}>
                  Cancelar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className={canManage ? "lg:col-span-2" : "lg:col-span-3"}>
        <CardHeader>
          <CardTitle className="text-lg">Avaliações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!canManage && message && (
            <p className="text-sm text-muted-foreground">{message}</p>
          )}
          {loading ? (
            <p className="text-sm text-muted-foreground">A carregar…</p>
          ) : items.length === 0 ? (
            <p className="rounded-lg border p-5 text-sm text-muted-foreground">
              Ainda não há avaliações para esta turma.
            </p>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-lg border p-4"
              >
                <div className="space-y-1">
                  <p className="font-semibold">{studentName(item)}</p>
                  <p className="text-sm">
                    {item.title} · {item.subject}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatAcademicoDate(item.date)}
                    {item.author ? ` · ${item.author.name}` : ""}
                  </p>
                  {item.note && (
                    <p className="text-sm text-muted-foreground">{item.note}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant="secondary" className="text-base">
                    {assessmentGradeDisplay(item)}
                  </Badge>
                  {canManage && (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEdit(item)}
                      >
                        <Pencil className="mr-1 h-3.5 w-3.5" />
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(item)}
                      >
                        <Trash2 className="mr-1 h-3.5 w-3.5" />
                        Remover
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

type HorarioForm = {
  weekday: number;
  startTime: string;
  endTime: string;
  subject: string;
  room: string;
};

function emptyHorarioForm(): HorarioForm {
  return {
    weekday: 1,
    startTime: "08:00",
    endTime: "09:00",
    subject: "",
    room: "",
  };
}

function HorariosTab({
  classGroupId,
  canManage,
}: {
  classGroupId: string;
  canManage: boolean;
}) {
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [form, setForm] = useState<HorarioForm>(emptyHorarioForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadList = () => {
    setLoading(true);
    api
      .getScheduleForTurma(classGroupId)
      .then(setEntries)
      .catch((err) =>
        setMessage(
          err instanceof Error
            ? err.message
            : "Não foi possível carregar o horário.",
        ),
      )
      .finally(() => setLoading(false));
  };

  useEffect(loadList, [classGroupId]);

  const resetForm = () => {
    setForm(emptyHorarioForm());
    setEditingId(null);
  };

  const startEdit = (item: ScheduleEntry) => {
    setEditingId(item.id);
    setForm({
      weekday: item.weekday,
      startTime: item.startTime,
      endTime: item.endTime,
      subject: item.subject,
      room: item.room ?? "",
    });
    setMessage("");
  };

  const submit = async () => {
    if (!form.subject.trim()) {
      setMessage("Indique a disciplina/actividade.");
      return;
    }
    if (form.endTime <= form.startTime) {
      setMessage("A hora de fim deve ser posterior à de início.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      if (editingId) {
        await api.updateScheduleEntry(editingId, {
          weekday: form.weekday,
          startTime: form.startTime,
          endTime: form.endTime,
          subject: form.subject.trim(),
          room: form.room.trim() || null,
        });
        setMessage("Entrada actualizada.");
      } else {
        const payload: ScheduleEntryPayload = {
          classGroupId,
          weekday: form.weekday,
          startTime: form.startTime,
          endTime: form.endTime,
          subject: form.subject.trim(),
          room: form.room.trim() || null,
        };
        await api.createScheduleEntry(payload);
        setMessage("Entrada adicionada ao horário.");
      }
      resetForm();
      loadList();
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : "Não foi possível guardar o horário.",
      );
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item: ScheduleEntry) => {
    if (
      !window.confirm(
        `Remover ${item.subject} (${weekdayLabel(item.weekday)})?`,
      )
    )
      return;
    try {
      await api.deleteScheduleEntry(item.id);
      if (editingId === item.id) resetForm();
      loadList();
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Não foi possível remover.",
      );
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {canManage && (
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">
              {editingId ? "Editar entrada" : "Nova entrada"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Dia da semana">
              <Select
                value={String(form.weekday)}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, weekday: Number(v) }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WEEKDAYS.map((d) => (
                    <SelectItem key={d.value} value={String(d.value)}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Início">
                <Input
                  type="time"
                  value={form.startTime}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, startTime: e.target.value }))
                  }
                />
              </Field>
              <Field label="Fim">
                <Input
                  type="time"
                  value={form.endTime}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, endTime: e.target.value }))
                  }
                />
              </Field>
            </div>
            <Field label="Disciplina/actividade">
              <Input
                value={form.subject}
                onChange={(e) =>
                  setForm((f) => ({ ...f, subject: e.target.value }))
                }
                placeholder="Ex.: Educação Física"
              />
            </Field>
            <Field label="Sala/local (opcional)">
              <Input
                value={form.room}
                onChange={(e) =>
                  setForm((f) => ({ ...f, room: e.target.value }))
                }
                placeholder="Ex.: Ginásio"
              />
            </Field>
            {message && (
              <p className="text-sm text-muted-foreground">{message}</p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button onClick={submit} disabled={saving}>
                {saving ? "A guardar…" : editingId ? "Guardar" : "Adicionar"}
              </Button>
              {editingId && (
                <Button variant="ghost" onClick={resetForm} disabled={saving}>
                  Cancelar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className={canManage ? "lg:col-span-2" : "lg:col-span-3"}>
        <CardHeader>
          <CardTitle className="text-lg">Horário semanal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!canManage && message && (
            <p className="text-sm text-muted-foreground">{message}</p>
          )}
          {loading ? (
            <p className="text-sm text-muted-foreground">A carregar…</p>
          ) : entries.length === 0 ? (
            <p className="rounded-lg border p-5 text-sm text-muted-foreground">
              Ainda não há horário definido para esta turma.
            </p>
          ) : (
            WEEKDAYS.filter((d) =>
              entries.some((e) => e.weekday === d.value),
            ).map((d) => (
              <div key={d.value} className="space-y-2">
                <p className="text-sm font-semibold">{d.label}</p>
                <div className="divide-y rounded-lg border">
                  {entries
                    .filter((e) => e.weekday === d.value)
                    .map((entry) => (
                      <div
                        key={entry.id}
                        className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 text-sm"
                      >
                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center gap-1 font-medium">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                            {entry.startTime}–{entry.endTime}
                          </span>
                          <span>{entry.subject}</span>
                          {entry.room && (
                            <span className="text-muted-foreground">
                              · {entry.room}
                            </span>
                          )}
                        </div>
                        {canManage && (
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => startEdit(entry)}
                            >
                              <Pencil className="mr-1 h-3.5 w-3.5" />
                              Editar
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => remove(entry)}
                            >
                              <Trash2 className="mr-1 h-3.5 w-3.5" />
                              Remover
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SintesesTab({ canManage }: { canManage: boolean }) {
  const [reports, setReports] = useState<DescriptiveReport[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [form, setForm] = useState({
    studentId: "",
    academicYearId: "",
    periodLabel: "1.º Trimestre",
    areaFocus: "",
    body: "",
    status: "RASCUNHO" as DescriptiveReportStatus,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadList = () => {
    setLoading(true);
    api
      .getDescriptiveReports()
      .then(setReports)
      .catch((err) =>
        setMessage(
          err instanceof Error
            ? err.message
            : "Não foi possível carregar as sínteses.",
        ),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadList();
    api.getStudents().then(setStudents).catch(() => setStudents([]));
    api.getAcademicYears().then((list) => {
      setYears(list);
      const active = list.find((y) => y.active) || list[0];
      if (active) {
        setForm((f) => ({ ...f, academicYearId: f.academicYearId || active.id }));
      }
    });
  }, []);

  const resetForm = () => {
    const active = years.find((y) => y.active) || years[0];
    setEditingId(null);
    setForm({
      studentId: "",
      academicYearId: active?.id || "",
      periodLabel: "1.º Trimestre",
      areaFocus: "",
      body: "",
      status: "RASCUNHO",
    });
  };

  const startEdit = (item: DescriptiveReport) => {
    setEditingId(item.id);
    setForm({
      studentId: item.studentId,
      academicYearId: item.academicYearId || "",
      periodLabel: item.periodLabel,
      areaFocus: item.areaFocus || "",
      body: item.body,
      status: item.status,
    });
  };

  const submit = async () => {
    if (!form.studentId || !form.periodLabel.trim() || !form.body.trim()) {
      setMessage("Seleccione o aluno e preencha o período e o texto.");
      return;
    }
    setSaving(true);
    setMessage("");
    const payload: DescriptiveReportPayload = {
      studentId: form.studentId,
      academicYearId: form.academicYearId || null,
      periodLabel: form.periodLabel.trim(),
      areaFocus: form.areaFocus.trim() || null,
      body: form.body.trim(),
      status: form.status,
    };
    try {
      if (editingId) {
        await api.updateDescriptiveReport(editingId, payload);
        setMessage("Síntese actualizada.");
      } else {
        await api.createDescriptiveReport(payload);
        setMessage("Síntese criada.");
      }
      resetForm();
      loadList();
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Não foi possível guardar.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {canManage && (
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">
              {editingId ? "Editar síntese" : "Nova síntese"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field label="Aluno">
              <Select
                value={form.studentId}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, studentId: v }))
                }
                disabled={!!editingId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.childFullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Período">
              <Input
                value={form.periodLabel}
                onChange={(e) =>
                  setForm((f) => ({ ...f, periodLabel: e.target.value }))
                }
                placeholder="1.º Trimestre"
              />
            </Field>
            <Field label="Área / domínio (opc.)">
              <Input
                value={form.areaFocus}
                onChange={(e) =>
                  setForm((f) => ({ ...f, areaFocus: e.target.value }))
                }
              />
            </Field>
            <Field label="Ano lectivo">
              <Select
                value={form.academicYearId || "none"}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    academicYearId: v === "none" ? "" : v,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {years.map((y) => (
                    <SelectItem key={y.id} value={y.id}>
                      {y.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Estado">
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    status: v as DescriptiveReportStatus,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RASCUNHO">Rascunho</SelectItem>
                  <SelectItem value="PUBLICADO">Publicado</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Texto">
              <Textarea
                rows={8}
                value={form.body}
                onChange={(e) =>
                  setForm((f) => ({ ...f, body: e.target.value }))
                }
              />
            </Field>
            <div className="flex flex-wrap gap-2">
              <Button onClick={submit} disabled={saving}>
                {saving ? "A guardar…" : "Guardar"}
              </Button>
              {editingId && (
                <Button variant="ghost" onClick={resetForm}>
                  Cancelar
                </Button>
              )}
            </div>
            {message && (
              <p className="text-sm text-muted-foreground">{message}</p>
            )}
          </CardContent>
        </Card>
      )}
      <Card className={canManage ? "lg:col-span-2" : "lg:col-span-3"}>
        <CardHeader>
          <CardTitle className="text-lg">Sínteses descritivas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">A carregar…</p>
          ) : reports.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ainda não há sínteses registadas.
            </p>
          ) : (
            reports.map((item) => (
              <div key={item.id} className="rounded-lg border p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">
                      {item.student?.childFullName || "Aluno"} ·{" "}
                      {item.periodLabel}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.areaFocus ? `${item.areaFocus} · ` : ""}
                      {item.academicYear?.label || "—"}
                    </p>
                  </div>
                  <Badge
                    variant={
                      item.status === "PUBLICADO" ? "default" : "secondary"
                    }
                  >
                    {item.status === "PUBLICADO" ? "Publicado" : "Rascunho"}
                  </Badge>
                </div>
                <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
                  {item.body}
                </p>
                {canManage && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startEdit(item)}
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        if (item.status === "PUBLICADO") {
                          await api.unpublishDescriptiveReport(item.id);
                        } else {
                          await api.publishDescriptiveReport(item.id);
                        }
                        loadList();
                      }}
                    >
                      {item.status === "PUBLICADO"
                        ? "Repor rascunho"
                        : "Publicar"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        if (!confirm("Eliminar esta síntese?")) return;
                        await api.deleteDescriptiveReport(item.id);
                        loadList();
                      }}
                    >
                      Remover
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

const SUBSTITUTION_STATUS_OPTIONS: Array<{
  value: SubstitutionStatus;
  label: string;
}> = [
  { value: "PLANEADA", label: "Planeada" },
  { value: "CONFIRMADA", label: "Confirmada" },
  { value: "CANCELADA", label: "Cancelada" },
  { value: "CONCLUIDA", label: "Concluída" },
];

function SubstituicoesTab({
  canManage,
  turmas,
  selectedTurmaId,
}: {
  canManage: boolean;
  turmas: AttendanceTurma[];
  selectedTurmaId: string;
}) {
  const [items, setItems] = useState<Substitution[]>([]);
  const [form, setForm] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    classGroupId: selectedTurmaId || "",
    absentTeacher: "",
    substituteTeacher: "",
    reason: "",
    notes: "",
    status: "PLANEADA" as SubstitutionStatus,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadList = () => {
    setLoading(true);
    api
      .getSubstitutions({
        classGroupId: selectedTurmaId || undefined,
      })
      .then(setItems)
      .catch((err) =>
        setMessage(
          err instanceof Error
            ? err.message
            : "Não foi possível carregar as substituições.",
        ),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadList();
    const turma = turmas.find((t) => t.id === selectedTurmaId);
    setForm((f) => ({
      ...f,
      classGroupId: selectedTurmaId || f.classGroupId,
      absentTeacher: f.absentTeacher || turma?.teacherName || "",
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTurmaId]);

  const resetForm = () => {
    const turma = turmas.find((t) => t.id === selectedTurmaId);
    setEditingId(null);
    setForm({
      date: format(new Date(), "yyyy-MM-dd"),
      classGroupId: selectedTurmaId || "",
      absentTeacher: turma?.teacherName || "",
      substituteTeacher: "",
      reason: "",
      notes: "",
      status: "PLANEADA",
    });
  };

  const startEdit = (item: Substitution) => {
    setEditingId(item.id);
    setForm({
      date: item.date.slice(0, 10),
      classGroupId: item.classGroupId,
      absentTeacher: item.absentTeacher,
      substituteTeacher: item.substituteTeacher,
      reason: item.reason || "",
      notes: item.notes || "",
      status: item.status,
    });
  };

  const submit = async () => {
    if (!form.classGroupId || !form.substituteTeacher.trim()) {
      setMessage("Indique a turma e o substituto.");
      return;
    }
    setSaving(true);
    setMessage("");
    const payload: SubstitutionPayload = {
      date: form.date,
      classGroupId: form.classGroupId,
      absentTeacher: form.absentTeacher.trim() || undefined,
      substituteTeacher: form.substituteTeacher.trim(),
      reason: form.reason.trim() || null,
      notes: form.notes.trim() || null,
      status: form.status,
    };
    try {
      if (editingId) {
        await api.updateSubstitution(editingId, payload);
        setMessage("Substituição actualizada.");
      } else {
        await api.createSubstitution(payload);
        setMessage("Substituição registada.");
      }
      resetForm();
      loadList();
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Não foi possível guardar.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {canManage && (
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">
              {editingId ? "Editar substituição" : "Nova substituição"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field label="Data">
              <Input
                type="date"
                value={form.date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, date: e.target.value }))
                }
              />
            </Field>
            <Field label="Turma">
              <Select
                value={form.classGroupId}
                onValueChange={(v) => {
                  const turma = turmas.find((t) => t.id === v);
                  setForm((f) => ({
                    ...f,
                    classGroupId: v,
                    absentTeacher: turma?.teacherName || f.absentTeacher,
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {turmas.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Ausente">
              <Input
                value={form.absentTeacher}
                onChange={(e) =>
                  setForm((f) => ({ ...f, absentTeacher: e.target.value }))
                }
              />
            </Field>
            <Field label="Substituto">
              <Input
                value={form.substituteTeacher}
                onChange={(e) =>
                  setForm((f) => ({ ...f, substituteTeacher: e.target.value }))
                }
              />
            </Field>
            <Field label="Motivo">
              <Input
                value={form.reason}
                onChange={(e) =>
                  setForm((f) => ({ ...f, reason: e.target.value }))
                }
              />
            </Field>
            <Field label="Estado">
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    status: v as SubstitutionStatus,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUBSTITUTION_STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Notas">
              <Textarea
                rows={3}
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
              />
            </Field>
            <div className="flex flex-wrap gap-2">
              <Button onClick={submit} disabled={saving}>
                {saving ? "A guardar…" : "Guardar"}
              </Button>
              {editingId && (
                <Button variant="ghost" onClick={resetForm}>
                  Cancelar
                </Button>
              )}
            </div>
            {message && (
              <p className="text-sm text-muted-foreground">{message}</p>
            )}
          </CardContent>
        </Card>
      )}
      <Card className={canManage ? "lg:col-span-2" : "lg:col-span-3"}>
        <CardHeader>
          <CardTitle className="text-lg">Substituições</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">A carregar…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Sem substituições para os filtros actuais.
            </p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="rounded-lg border p-4 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">
                      {formatAcademicoDate(item.date)} ·{" "}
                      {item.classGroup?.name || "Turma"}
                    </p>
                    <p className="text-muted-foreground">
                      Ausente: {item.absentTeacher} → Substituto:{" "}
                      {item.substituteTeacher}
                    </p>
                    {item.reason && (
                      <p className="text-muted-foreground">
                        Motivo: {item.reason}
                      </p>
                    )}
                  </div>
                  <Badge variant="secondary">
                    {SUBSTITUTION_STATUS_OPTIONS.find(
                      (o) => o.value === item.status,
                    )?.label || item.status}
                  </Badge>
                </div>
                {canManage && (
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startEdit(item)}
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        if (!confirm("Eliminar esta substituição?")) return;
                        await api.deleteSubstitution(item.id);
                        loadList();
                      }}
                    >
                      Remover
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
