import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import { BookOpen, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ManuaisTab } from "@/components/platform/CoverageExtras";
import {
  api,
  type AcademicYear,
  type ClassGroup,
  type CurriculumArea,
  type CurriculumPlan,
  type CurriculumPlanPayload,
  type NeeProfile,
  type PeiPlan,
  type PeiPlanPayload,
  type PeiStatus,
  type ServiceItem,
  type Student,
  type Unit,
} from "@/lib/api";

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
const CURRICULO_MANAGE_ROLES = ["ADMIN", "DIRECAO", "COORDENACAO"];

export function CurriculoAdmin({
  needsLogin,
  userRole,
  onLogin,
}: {
  needsLogin: boolean;
  userRole: string;
  onLogin: () => void;
}) {
  const canManage = CURRICULO_MANAGE_ROLES.includes(userRole);
  const [plans, setPlans] = useState<CurriculumPlan[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [serviceFilter, setServiceFilter] = useState("all");
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [form, setForm] = useState({
    name: "",
    description: "",
    serviceId: "",
    academicYearId: "",
    unitId: "",
    levelLabel: "",
    classGroupId: "",
    active: true,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [areaName, setAreaName] = useState("");
  const [areaCode, setAreaCode] = useState("");
  const [objectiveTitle, setObjectiveTitle] = useState("");
  const [objectiveAreaId, setObjectiveAreaId] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [section, setSection] = useState<"planos" | "manuais">("planos");

  const loadPlans = () => {
    setLoading(true);
    api
      .getCurriculumPlans({
        serviceId: serviceFilter !== "all" ? serviceFilter : undefined,
      })
      .then((list) => {
        setPlans(list);
        setSelectedPlanId((cur) => cur || list[0]?.id || "");
      })
      .catch((err) =>
        setMessage(
          err instanceof Error
            ? err.message
            : "Não foi possível carregar o currículo.",
        ),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (needsLogin) return;
    loadPlans();
    api.getServices().then(setServices).catch(() => setServices([]));
    api.getAcademicYears().then(setYears).catch(() => setYears([]));
    api.getUnits().then(setUnits).catch(() => setUnits([]));
    api.getClasses().then(setClasses).catch(() => setClasses([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsLogin, serviceFilter]);

  if (needsLogin) {
    return (
      <Card>
        <CardContent className="space-y-4 p-8">
          <h1 className="text-2xl font-bold">Currículo</h1>
          <p className="text-muted-foreground">
            Inicie sessão para consultar e gerir planos curriculares.
          </p>
          <Button onClick={onLogin}>Entrar</Button>
        </CardContent>
      </Card>
    );
  }

  const selectedPlan =
    plans.find((p) => p.id === selectedPlanId) || plans[0] || null;

  const resetForm = () => {
    setEditingId(null);
    setForm({
      name: "",
      description: "",
      serviceId: services[0]?.id || "",
      academicYearId: years.find((y) => y.active)?.id || years[0]?.id || "",
      unitId: "",
      levelLabel: "",
      classGroupId: "",
      active: true,
    });
  };

  const startEdit = (plan: CurriculumPlan) => {
    setEditingId(plan.id);
    setSelectedPlanId(plan.id);
    setForm({
      name: plan.name,
      description: plan.description || "",
      serviceId: plan.serviceId,
      academicYearId: plan.academicYearId || "",
      unitId: plan.unitId || "",
      levelLabel: plan.levelLabel || "",
      classGroupId: plan.classGroupId || "",
      active: plan.active,
    });
  };

  const submitPlan = async () => {
    if (!form.name.trim() || !form.serviceId) {
      setMessage("Indique o nome e o serviço do plano.");
      return;
    }
    setSaving(true);
    setMessage("");
    const payload: CurriculumPlanPayload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      serviceId: form.serviceId,
      academicYearId: form.academicYearId || null,
      unitId: form.unitId || null,
      levelLabel: form.levelLabel.trim() || null,
      classGroupId: form.classGroupId || null,
      active: form.active,
    };
    try {
      const saved = editingId
        ? await api.updateCurriculumPlan(editingId, payload)
        : await api.createCurriculumPlan(payload);
      setMessage(editingId ? "Plano actualizado." : "Plano curricular criado.");
      setEditingId(saved.id);
      setSelectedPlanId(saved.id);
      loadPlans();
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Não foi possível guardar.",
      );
    } finally {
      setSaving(false);
    }
  };

  const removePlan = async (id: string) => {
    if (!confirm("Eliminar este plano curricular e as suas áreas?")) return;
    try {
      await api.deleteCurriculumPlan(id);
      if (selectedPlanId === id) setSelectedPlanId("");
      if (editingId === id) resetForm();
      loadPlans();
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Não foi possível eliminar.",
      );
    }
  };

  const addArea = async () => {
    if (!selectedPlan || !areaName.trim()) return;
    try {
      await api.createCurriculumArea({
        planId: selectedPlan.id,
        name: areaName.trim(),
        code: areaCode.trim() || null,
      });
      setAreaName("");
      setAreaCode("");
      loadPlans();
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Não foi possível criar a área.",
      );
    }
  };

  const addObjective = async () => {
    if (!objectiveAreaId || !objectiveTitle.trim()) return;
    try {
      await api.createCurriculumObjective({
        areaId: objectiveAreaId,
        title: objectiveTitle.trim(),
      });
      setObjectiveTitle("");
      loadPlans();
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : "Não foi possível criar o objectivo.",
      );
    }
  };

  return (
    <div>
      <div className="mb-7">
        <p className="mb-2 text-sm font-medium text-secondary">PEDAGÓGICO</p>
        <h1 className="text-3xl font-bold">Currículo</h1>
        <p className="mt-2 text-muted-foreground">
          Planos curriculares por serviço e manuais escolares. Encarregados
          consultam no portal os planos e manuais do serviço dos filhos.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={section === "planos" ? "default" : "outline"}
          onClick={() => setSection("planos")}
        >
          Planos curriculares
        </Button>
        <Button
          size="sm"
          variant={section === "manuais" ? "default" : "outline"}
          onClick={() => setSection("manuais")}
        >
          Manuais escolares
        </Button>
      </div>

      {section === "manuais" ? (
        <ManuaisTab canManage={canManage} />
      ) : (
        <>
      <Card className="mb-6">
        <CardContent className="flex flex-wrap gap-4 p-4">
          <div className="w-64">
            <Field label="Filtrar por serviço">
              <Select value={serviceFilter} onValueChange={setServiceFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {services.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          {message && (
            <p className="self-end text-sm text-muted-foreground">{message}</p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {canManage && (
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">
                {editingId ? "Editar plano" : "Novo plano"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Field label="Nome">
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Ex.: Pré-escolar 2026/2027"
                />
              </Field>
              <Field label="Serviço">
                <Select
                  value={form.serviceId}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, serviceId: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              <Field label="Unidade (opcional)">
                <Select
                  value={form.unitId || "none"}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, unitId: v === "none" ? "" : v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Todas</SelectItem>
                    {units.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Nível / faixa">
                <Input
                  value={form.levelLabel}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, levelLabel: e.target.value }))
                  }
                  placeholder="Ex.: Pré II, 1.ª Classe"
                />
              </Field>
              <Field label="Turma (opcional)">
                <Select
                  value={form.classGroupId || "none"}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      classGroupId: v === "none" ? "" : v,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Descrição">
                <Textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                />
              </Field>
              <div className="flex flex-wrap gap-2">
                <Button onClick={submitPlan} disabled={saving}>
                  {saving ? "A guardar…" : editingId ? "Actualizar" : "Criar"}
                </Button>
                {editingId && (
                  <Button variant="ghost" onClick={resetForm}>
                    Cancelar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className={canManage ? "lg:col-span-2" : "lg:col-span-3"}>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
            <CardTitle className="text-lg">
              Planos ({plans.length})
              {loading ? "…" : ""}
            </CardTitle>
            {plans.length > 0 && (
              <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <SelectTrigger className="w-72">
                  <SelectValue placeholder="Seleccionar plano" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} · {p.service?.name || "—"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedPlan ? (
              <p className="text-sm text-muted-foreground">
                Ainda não há planos curriculares.
              </p>
            ) : (
              <>
                <div className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{selectedPlan.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedPlan.service?.name}
                        {selectedPlan.levelLabel
                          ? ` · ${selectedPlan.levelLabel}`
                          : ""}
                        {selectedPlan.academicYear?.label
                          ? ` · ${selectedPlan.academicYear.label}`
                          : ""}
                        {selectedPlan.unit?.name
                          ? ` · ${selectedPlan.unit.name}`
                          : ""}
                      </p>
                      {selectedPlan.description && (
                        <p className="mt-2 text-sm whitespace-pre-line">
                          {selectedPlan.description}
                        </p>
                      )}
                    </div>
                    {canManage && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEdit(selectedPlan)}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removePlan(selectedPlan.id)}
                        >
                          Eliminar
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {(selectedPlan.areas || []).map((area: CurriculumArea) => (
                  <div key={area.id} className="rounded-lg border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">
                        {area.code ? `${area.code} · ` : ""}
                        {area.name}
                      </p>
                      {canManage && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            if (!confirm("Eliminar área e objectivos?")) return;
                            await api.deleteCurriculumArea(area.id);
                            loadPlans();
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                    <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                      {(area.objectives || []).map((obj) => (
                        <li key={obj.id} className="flex justify-between gap-2">
                          <span>
                            {obj.code ? `[${obj.code}] ` : ""}
                            {obj.title}
                          </span>
                          {canManage && (
                            <button
                              type="button"
                              className="text-xs underline"
                              onClick={async () => {
                                await api.deleteCurriculumObjective(obj.id);
                                loadPlans();
                              }}
                            >
                              remover
                            </button>
                          )}
                        </li>
                      ))}
                      {(area.objectives || []).length === 0 && (
                        <li>Sem objectivos.</li>
                      )}
                    </ul>
                  </div>
                ))}

                {canManage && (
                  <div className="grid gap-3 rounded-lg border border-dashed p-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Nova área</p>
                      <Input
                        placeholder="Nome da área"
                        value={areaName}
                        onChange={(e) => setAreaName(e.target.value)}
                      />
                      <Input
                        placeholder="Código (opc.)"
                        value={areaCode}
                        onChange={(e) => setAreaCode(e.target.value)}
                      />
                      <Button size="sm" onClick={addArea}>
                        Adicionar área
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Novo objectivo</p>
                      <Select
                        value={objectiveAreaId}
                        onValueChange={setObjectiveAreaId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Área" />
                        </SelectTrigger>
                        <SelectContent>
                          {(selectedPlan.areas || []).map((a) => (
                            <SelectItem key={a.id} value={a.id}>
                              {a.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Título do objectivo"
                        value={objectiveTitle}
                        onChange={(e) => setObjectiveTitle(e.target.value)}
                      />
                      <Button size="sm" onClick={addObjective}>
                        Adicionar objectivo
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
        </>
      )}
    </div>
  );
}

const NEE_MANAGE_ROLES = [
  "ADMIN",
  "DIRECAO",
  "COORDENACAO",
  "PROFESSOR",
];

const PEI_STATUS_OPTIONS: Array<{ value: PeiStatus; label: string }> = [
  { value: "RASCUNHO", label: "Rascunho" },
  { value: "ACTIVO", label: "Activo" },
  { value: "EM_REVISAO", label: "Em revisão" },
  { value: "CONCLUIDO", label: "Concluído" },
  { value: "ARQUIVADO", label: "Arquivado" },
];

export function peiStatusLabel(status: PeiStatus | string): string {
  return PEI_STATUS_OPTIONS.find((o) => o.value === status)?.label || status;
}

function peiStatusBadgeVariant(
  status: PeiStatus | string,
): "default" | "secondary" | "outline" | "destructive" {
  if (status === "ACTIVO") return "default";
  if (status === "EM_REVISAO") return "secondary";
  if (status === "ARQUIVADO" || status === "CONCLUIDO") return "outline";
  return "secondary";
}

type PeiFormState = {
  studentId: string;
  academicYearId: string;
  status: PeiStatus;
  title: string;
  objectives: string;
  strategies: string;
  supports: string;
  guardianSummary: string;
  responsibleTeacher: string;
  coordinatorNotes: string;
  reviewDate: string;
};

function emptyPeiForm(): PeiFormState {
  return {
    studentId: "",
    academicYearId: "",
    status: "RASCUNHO",
    title: "",
    objectives: "",
    strategies: "",
    supports: "",
    guardianSummary: "",
    responsibleTeacher: "",
    coordinatorNotes: "",
    reviewDate: "",
  };
}

export function NeeAdmin({
  needsLogin,
  userRole,
  onLogin,
}: {
  needsLogin: boolean;
  userRole: string;
  onLogin: () => void;
}) {
  const canManage = NEE_MANAGE_ROLES.includes(userRole);
  const [units, setUnits] = useState<Unit[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [plans, setPlans] = useState<PeiPlan[]>([]);
  const [profiles, setProfiles] = useState<NeeProfile[]>([]);
  const [unitFilter, setUnitFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [form, setForm] = useState<PeiFormState>(emptyPeiForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PeiPlan | null>(null);
  const [reviewDate, setReviewDate] = useState(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [reviewNotes, setReviewNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadLists = () => {
    setLoading(true);
    setMessage("");
    const planParams: {
      unitId?: string;
      status?: PeiStatus;
      neeOnly?: boolean;
    } = {};
    if (unitFilter !== "all") planParams.unitId = unitFilter;
    if (statusFilter !== "all") planParams.status = statusFilter as PeiStatus;

    Promise.all([
      api.getPeiPlans(planParams),
      api.getNeeProfiles({
        unitId: unitFilter !== "all" ? unitFilter : undefined,
        activeOnly: true,
      }),
      api.getStudents(),
      api.getUnits(),
      api.getAcademicYears(),
    ])
      .then(([planList, profileList, studentList, unitList, yearList]) => {
        setPlans(planList);
        setProfiles(profileList);
        setStudents(studentList);
        setUnits(unitList);
        setYears(yearList);
        if (!form.academicYearId) {
          const active = yearList.find((y) => y.active) || yearList[0];
          if (active) {
            setForm((f) => ({ ...f, academicYearId: active.id }));
          }
        }
      })
      .catch((err) =>
        setMessage(
          err instanceof Error
            ? err.message
            : "Não foi possível carregar os dados NEE/PEI.",
        ),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (needsLogin) return;
    loadLists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsLogin, unitFilter, statusFilter]);

  if (needsLogin) {
    return (
      <Card>
        <CardContent className="space-y-4 p-8">
          <h1 className="text-2xl font-bold">NEE / PEI</h1>
          <p className="text-muted-foreground">
            Inicie sessão para gerir Necessidades Educativas Especiais e Planos
            Educativos Individuais.
          </p>
          <Button onClick={onLogin}>Entrar</Button>
        </CardContent>
      </Card>
    );
  }

  const resetForm = () => {
    const active = years.find((y) => y.active) || years[0];
    setForm({
      ...emptyPeiForm(),
      academicYearId: active?.id || "",
    });
    setEditingId(null);
  };

  const startEdit = (plan: PeiPlan) => {
    setEditingId(plan.id);
    setSelectedPlan(plan);
    setForm({
      studentId: plan.studentId,
      academicYearId: plan.academicYearId || "",
      status: plan.status,
      title: plan.title || "",
      objectives: plan.objectives,
      strategies: plan.strategies || "",
      supports: plan.supports || "",
      guardianSummary: plan.guardianSummary || "",
      responsibleTeacher: plan.responsibleTeacher || "",
      coordinatorNotes: plan.coordinatorNotes || "",
      reviewDate: plan.reviewDate ? plan.reviewDate.slice(0, 10) : "",
    });
    setMessage("");
  };

  const submitPlan = async () => {
    if (!form.studentId || !form.objectives.trim()) {
      setMessage("Seleccione o aluno e indique os objectivos do PEI.");
      return;
    }
    setSaving(true);
    setMessage("");
    const payload: PeiPlanPayload = {
      studentId: form.studentId,
      academicYearId: form.academicYearId || null,
      status: form.status,
      title: form.title.trim() || null,
      objectives: form.objectives.trim(),
      strategies: form.strategies.trim() || null,
      supports: form.supports.trim() || null,
      guardianSummary: form.guardianSummary.trim() || null,
      responsibleTeacher: form.responsibleTeacher.trim() || null,
      coordinatorNotes: form.coordinatorNotes.trim() || null,
      reviewDate: form.reviewDate || null,
    };
    try {
      const saved = editingId
        ? await api.updatePeiPlan(editingId, payload)
        : await api.createPeiPlan(payload);
      setMessage(
        editingId
          ? "PEI actualizado com sucesso."
          : "PEI criado e aluno marcado como NEE.",
      );
      setEditingId(saved.id);
      setSelectedPlan(saved);
      loadLists();
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Não foi possível guardar o PEI.",
      );
    } finally {
      setSaving(false);
    }
  };

  const removePlan = async (id: string) => {
    if (!confirm("Eliminar este PEI?")) return;
    setSaving(true);
    try {
      await api.deletePeiPlan(id);
      if (editingId === id) resetForm();
      if (selectedPlan?.id === id) setSelectedPlan(null);
      setMessage("PEI eliminado.");
      loadLists();
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Não foi possível eliminar.",
      );
    } finally {
      setSaving(false);
    }
  };

  const markNee = async (studentId: string) => {
    setSaving(true);
    try {
      await api.upsertNeeProfile({
        studentId,
        active: true,
        identifiedAt: format(new Date(), "yyyy-MM-dd"),
      });
      setMessage("Aluno marcado com Necessidades Educativas Especiais.");
      loadLists();
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : "Não foi possível marcar o aluno como NEE.",
      );
    } finally {
      setSaving(false);
    }
  };

  const addReview = async () => {
    if (!selectedPlan || !reviewNotes.trim()) {
      setMessage("Indique as notas do acompanhamento.");
      return;
    }
    setSaving(true);
    try {
      const updated = await api.addPeiReview(selectedPlan.id, {
        date: reviewDate,
        notes: reviewNotes.trim(),
      });
      setSelectedPlan(updated);
      setReviewNotes("");
      setMessage("Acompanhamento registado.");
      loadLists();
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : "Não foi possível registar o acompanhamento.",
      );
    } finally {
      setSaving(false);
    }
  };

  const removeReview = async (id: string) => {
    if (!confirm("Eliminar este registo de acompanhamento?")) return;
    setSaving(true);
    try {
      await api.deletePeiReview(id);
      if (selectedPlan) {
        const refreshed = await api.getPeiPlan(selectedPlan.id);
        setSelectedPlan(refreshed);
      }
      setMessage("Registo eliminado.");
      loadLists();
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Não foi possível eliminar.",
      );
    } finally {
      setSaving(false);
    }
  };

  const studentsWithoutNee = students.filter(
    (s) => !profiles.some((p) => p.studentId === s.id && p.active),
  );

  return (
    <div>
      <div className="mb-7">
        <p className="mb-2 text-sm font-medium text-secondary">NEE / PEI</p>
        <h1 className="text-3xl font-bold">Necessidades Educativas Especiais</h1>
        <p className="mt-2 text-muted-foreground">
          Identifique alunos com NEE, elabore o Plano Educativo Individual e
          registe o acompanhamento. Os encarregados consultam um resumo no
          portal.
        </p>
      </div>

      <Card className="mb-6">
        <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-end">
          <div className="lg:w-72">
            <Field label="Unidade">
              <Select value={unitFilter} onValueChange={setUnitFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
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
          </div>
          <div className="lg:w-56">
            <Field label="Estado do PEI">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {PEI_STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Button variant="outline" onClick={loadLists} disabled={loading}>
            Actualizar
          </Button>
        </CardContent>
      </Card>

      {message && (
        <p className="mb-4 text-sm text-muted-foreground">{message}</p>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {editingId ? "Editar PEI" : "Novo PEI"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!canManage ? (
              <p className="text-sm text-muted-foreground">
                O seu perfil tem acesso de consulta.
              </p>
            ) : (
              <>
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
                      {students.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.childFullName}
                          {s.unit?.name ? ` · ${s.unit.name}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Ano lectivo">
                    <Select
                      value={form.academicYearId}
                      onValueChange={(v) =>
                        setForm((f) => ({ ...f, academicYearId: v }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Ano lectivo" />
                      </SelectTrigger>
                      <SelectContent>
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
                          status: v as PeiStatus,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PEI_STATUS_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
                <Field label="Título (opcional)">
                  <Input
                    value={form.title}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, title: e.target.value }))
                    }
                    placeholder="Ex.: PEI 2026/2027"
                  />
                </Field>
                <Field label="Objectivos">
                  <Textarea
                    value={form.objectives}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, objectives: e.target.value }))
                    }
                    rows={3}
                  />
                </Field>
                <Field label="Estratégias">
                  <Textarea
                    value={form.strategies}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, strategies: e.target.value }))
                    }
                    rows={2}
                  />
                </Field>
                <Field label="Apoios / adaptações">
                  <Textarea
                    value={form.supports}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, supports: e.target.value }))
                    }
                    rows={2}
                  />
                </Field>
                <Field label="Resumo para o encarregado (opcional)">
                  <Textarea
                    value={form.guardianSummary}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        guardianSummary: e.target.value,
                      }))
                    }
                    rows={2}
                    placeholder="Se vazio, o portal mostra os objectivos."
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Educador(a) responsável">
                    <Input
                      value={form.responsibleTeacher}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          responsibleTeacher: e.target.value,
                        }))
                      }
                    />
                  </Field>
                  <Field label="Data de revisão">
                    <Input
                      type="date"
                      value={form.reviewDate}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          reviewDate: e.target.value,
                        }))
                      }
                    />
                  </Field>
                </div>
                <Field label="Notas da coordenação (apenas staff)">
                  <Textarea
                    value={form.coordinatorNotes}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        coordinatorNotes: e.target.value,
                      }))
                    }
                    rows={2}
                  />
                </Field>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={submitPlan} disabled={saving}>
                    {editingId ? "Actualizar PEI" : "Criar PEI"}
                  </Button>
                  {editingId && (
                    <Button variant="outline" onClick={resetForm}>
                      Novo
                    </Button>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Planos PEI ({plans.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">A carregar…</p>
              ) : plans.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Ainda não há planos PEI com estes filtros.
                </p>
              ) : (
                <div className="divide-y rounded-lg border">
                  {plans.map((plan) => (
                    <div
                      key={plan.id}
                      className="flex flex-wrap items-start justify-between gap-3 px-4 py-3"
                    >
                      <button
                        type="button"
                        className="min-w-0 flex-1 text-left"
                        onClick={() => startEdit(plan)}
                      >
                        <p className="font-medium">
                          {plan.student?.childFullName || "Aluno"}
                          {plan.title ? ` · ${plan.title}` : ""}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {plan.student?.unit?.name || "—"}
                          {plan.academicYear?.label
                            ? ` · ${plan.academicYear.label}`
                            : ""}
                          {plan.reviewDate
                            ? ` · Revisão ${formatAcademicoDate(plan.reviewDate)}`
                            : ""}
                        </p>
                      </button>
                      <div className="flex items-center gap-2">
                        <Badge variant={peiStatusBadgeVariant(plan.status)}>
                          {peiStatusLabel(plan.status)}
                        </Badge>
                        {canManage && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removePlan(plan.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Alunos com NEE ({profiles.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {profiles.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum aluno marcado como NEE. Ao criar um PEI o perfil é
                  criado automaticamente.
                </p>
              ) : (
                <div className="divide-y rounded-lg border">
                  {profiles.map((p) => (
                    <div
                      key={p.id}
                      className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm"
                    >
                      <div>
                        <p className="font-medium">
                          {p.student?.childFullName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {p.student?.unit?.name || "—"}
                          {p._count
                            ? ` · ${p._count.peiPlans} PEI(s)`
                            : ""}
                        </p>
                      </div>
                      <Badge variant={p.active ? "default" : "outline"}>
                        {p.active ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
              {canManage && studentsWithoutNee.length > 0 && (
                <Field label="Marcar aluno como NEE (sem PEI)">
                  <Select
                    onValueChange={(id) => {
                      if (id) void markNee(id);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar aluno" />
                    </SelectTrigger>
                    <SelectContent>
                      {studentsWithoutNee.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.childFullName}
                          {s.unit?.name ? ` · ${s.unit.name}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {selectedPlan && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">
              Acompanhamento — {selectedPlan.student?.childFullName}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedPlan.coordinatorNotes && (
              <p className="rounded-lg border bg-slate-50 p-3 text-sm">
                <span className="font-medium">Notas internas: </span>
                {selectedPlan.coordinatorNotes}
              </p>
            )}
            {canManage && (
              <div className="grid gap-3 sm:grid-cols-[10rem_1fr_auto]">
                <Input
                  type="date"
                  value={reviewDate}
                  onChange={(e) => setReviewDate(e.target.value)}
                />
                <Input
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Notas do acompanhamento / intervenção"
                />
                <Button onClick={addReview} disabled={saving}>
                  Registar
                </Button>
              </div>
            )}
            {(selectedPlan.reviews || []).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Ainda não há registos de acompanhamento.
              </p>
            ) : (
              <div className="divide-y rounded-lg border">
                {(selectedPlan.reviews || []).map((review) => (
                  <div
                    key={review.id}
                    className="flex flex-wrap items-start justify-between gap-3 px-4 py-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">
                        {formatAcademicoDate(review.date)}
                        {review.author?.name
                          ? ` · ${review.author.name}`
                          : ""}
                      </p>
                      <p className="mt-1 whitespace-pre-line text-muted-foreground">
                        {review.notes}
                      </p>
                    </div>
                    {canManage && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeReview(review.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
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

