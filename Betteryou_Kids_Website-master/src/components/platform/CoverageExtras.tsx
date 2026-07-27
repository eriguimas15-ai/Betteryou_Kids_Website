import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  api,
  type AttendanceTurma,
  type BehaviorRecord,
  type BehaviorType,
  type Meeting,
  type MeetingMinutesStatus,
  type MeetingStatus,
  type MeetingType,
  type NonTeachingActivity,
  type SchoolManual,
  type ServiceItem,
  type Student,
  type StudentQualification,
  type Unit,
  type AcademicYear,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}

export function meetingTypeLabel(type: MeetingType | string): string {
  switch (type) {
    case "PEDAGOGICA":
      return "Pedagógica";
    case "COORDENACAO":
      return "Coordenação";
    case "ENCARREGADOS":
      return "Encarregados";
    case "OUTRA":
      return "Outra";
    default:
      return type;
  }
}

export function behaviorTypeLabel(type: BehaviorType | string): string {
  switch (type) {
    case "POSITIVO":
      return "Positivo";
    case "A_MELHORAR":
      return "A melhorar";
    case "INCIDENTE":
      return "Incidente";
    default:
      return type;
  }
}

function formatDate(value: string): string {
  try {
    return format(
      new Date(value.length === 10 ? `${value}T12:00:00` : value),
      "dd/MM/yyyy",
    );
  } catch {
    return value.slice(0, 10);
  }
}

function formatDateTime(value: string): string {
  try {
    return format(new Date(value), "dd/MM/yyyy HH:mm");
  } catch {
    return value;
  }
}

export function ManuaisTab({ canManage }: { canManage: boolean }) {
  const [items, setItems] = useState<SchoolManual[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [form, setForm] = useState({
    title: "",
    subjectArea: "",
    serviceId: "",
    publisher: "",
    academicYearId: "",
    unitId: "",
    mediaUrl: "",
    active: true,
    notes: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => {
    api
      .getSchoolManuals()
      .then(setItems)
      .catch((err) =>
        setMessage(
          err instanceof Error ? err.message : "Erro ao carregar manuais.",
        ),
      );
  };

  useEffect(() => {
    load();
    api.getServices().then(setServices).catch(() => setServices([]));
    api.getAcademicYears().then(setYears).catch(() => setYears([]));
    api.getUnits().then(setUnits).catch(() => setUnits([]));
  }, []);

  const reset = () => {
    setEditingId(null);
    setForm({
      title: "",
      subjectArea: "",
      serviceId: "",
      publisher: "",
      academicYearId: "",
      unitId: "",
      mediaUrl: "",
      active: true,
      notes: "",
    });
  };

  const submit = async () => {
    if (!form.title.trim()) {
      setMessage("Indique o título do manual.");
      return;
    }
    setSaving(true);
    setMessage("");
    const body = {
      title: form.title.trim(),
      subjectArea: form.subjectArea.trim() || null,
      serviceId: form.serviceId || null,
      publisher: form.publisher.trim() || null,
      academicYearId: form.academicYearId || null,
      unitId: form.unitId || null,
      mediaUrl: form.mediaUrl.trim() || null,
      active: form.active,
      notes: form.notes.trim() || null,
    };
    try {
      if (editingId) await api.updateSchoolManual(editingId, body);
      else await api.createSchoolManual(body);
      setMessage(editingId ? "Manual actualizado." : "Manual criado.");
      reset();
      load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Erro ao guardar.");
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
              {editingId ? "Editar manual" : "Novo manual"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field label="Título">
              <Input
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
              />
            </Field>
            <Field label="Área / disciplina">
              <Input
                value={form.subjectArea}
                onChange={(e) =>
                  setForm((f) => ({ ...f, subjectArea: e.target.value }))
                }
              />
            </Field>
            <Field label="Serviço">
              <Select
                value={form.serviceId || "none"}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    serviceId: v === "none" ? "" : v,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {services.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Editora">
              <Input
                value={form.publisher}
                onChange={(e) =>
                  setForm((f) => ({ ...f, publisher: e.target.value }))
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
            <Field label="Unidade">
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
                  <SelectItem value="none">—</SelectItem>
                  {units.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="URL / ficheiro">
              <Input
                value={form.mediaUrl}
                onChange={(e) =>
                  setForm((f) => ({ ...f, mediaUrl: e.target.value }))
                }
              />
            </Field>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">Activo</span>
              <Switch
                checked={form.active}
                onCheckedChange={(v) => setForm((f) => ({ ...f, active: v }))}
              />
            </div>
            <Field label="Notas">
              <Textarea
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
              />
            </Field>
            {message && (
              <p className="text-sm text-muted-foreground">{message}</p>
            )}
            <div className="flex gap-2">
              <Button disabled={saving} onClick={submit}>
                {editingId ? "Actualizar" : "Criar"}
              </Button>
              {editingId && (
                <Button variant="outline" onClick={reset}>
                  Cancelar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      <Card className={canManage ? "lg:col-span-2" : "lg:col-span-3"}>
        <CardHeader>
          <CardTitle className="text-lg">Manuais ({items.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ainda não há manuais registados.
            </p>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-lg border p-3"
              >
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {[
                      item.subjectArea,
                      item.service?.name,
                      item.publisher,
                      item.academicYear?.label,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </p>
                  <Badge variant={item.active ? "default" : "outline"}>
                    {item.active ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
                {canManage && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingId(item.id);
                        setForm({
                          title: item.title,
                          subjectArea: item.subjectArea || "",
                          serviceId: item.serviceId || "",
                          publisher: item.publisher || "",
                          academicYearId: item.academicYearId || "",
                          unitId: item.unitId || "",
                          mediaUrl: item.mediaUrl || "",
                          active: item.active,
                          notes: item.notes || "",
                        });
                      }}
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        if (!confirm("Eliminar este manual?")) return;
                        await api.deleteSchoolManual(item.id);
                        load();
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

export function NleTab({
  canManage,
  turmas,
  selectedTurmaId,
}: {
  canManage: boolean;
  turmas: AttendanceTurma[];
  selectedTurmaId: string;
}) {
  const [items, setItems] = useState<NonTeachingActivity[]>([]);
  const [form, setForm] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    teacherName: "",
    classGroupId: selectedTurmaId || "",
    type: "Planeamento",
    description: "",
    durationMinutes: "",
    notes: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => {
    api
      .getNonTeachingActivities(
        selectedTurmaId ? { classGroupId: selectedTurmaId } : undefined,
      )
      .then(setItems)
      .catch((err) =>
        setMessage(err instanceof Error ? err.message : "Erro ao carregar."),
      );
  };

  useEffect(() => {
    setForm((f) => ({ ...f, classGroupId: selectedTurmaId || f.classGroupId }));
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTurmaId]);

  const submit = async () => {
    if (!form.teacherName.trim() || !form.description.trim()) {
      setMessage("Indique o docente e a descrição.");
      return;
    }
    setSaving(true);
    setMessage("");
    const body = {
      date: form.date,
      teacherName: form.teacherName.trim(),
      classGroupId: form.classGroupId || null,
      type: form.type.trim(),
      description: form.description.trim(),
      durationMinutes: form.durationMinutes
        ? Number(form.durationMinutes)
        : null,
      notes: form.notes.trim() || null,
    };
    try {
      if (editingId) await api.updateNonTeachingActivity(editingId, body);
      else await api.createNonTeachingActivity(body);
      setMessage(editingId ? "Actualizado." : "Registado.");
      setEditingId(null);
      setForm((f) => ({
        ...f,
        description: "",
        notes: "",
        durationMinutes: "",
      }));
      load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Erro ao guardar.");
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
              {editingId ? "Editar actividade NLE" : "Nova actividade NLE"}
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
            <Field label="Docente">
              <Input
                value={form.teacherName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, teacherName: e.target.value }))
                }
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
                  {turmas.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Tipo">
              <Input
                value={form.type}
                onChange={(e) =>
                  setForm((f) => ({ ...f, type: e.target.value }))
                }
                placeholder="Planeamento, Formação…"
              />
            </Field>
            <Field label="Descrição">
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </Field>
            <Field label="Duração (min)">
              <Input
                type="number"
                value={form.durationMinutes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, durationMinutes: e.target.value }))
                }
              />
            </Field>
            <Field label="Notas">
              <Textarea
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
              />
            </Field>
            {message && (
              <p className="text-sm text-muted-foreground">{message}</p>
            )}
            <Button disabled={saving} onClick={submit}>
              {editingId ? "Actualizar" : "Registar"}
            </Button>
          </CardContent>
        </Card>
      )}
      <Card className={canManage ? "lg:col-span-2" : "lg:col-span-3"}>
        <CardHeader>
          <CardTitle className="text-lg">
            Actividades não lectivas ({items.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem registos.</p>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-lg border p-3"
              >
                <div>
                  <p className="font-medium">
                    {formatDate(item.date)} · {item.type}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {item.teacherName}
                    {item.classGroup?.name
                      ? ` · ${item.classGroup.name}`
                      : ""}
                    {item.durationMinutes
                      ? ` · ${item.durationMinutes} min`
                      : ""}
                  </p>
                  <p className="mt-1 text-sm">{item.description}</p>
                </div>
                {canManage && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingId(item.id);
                        setForm({
                          date: item.date.slice(0, 10),
                          teacherName: item.teacherName,
                          classGroupId: item.classGroupId || "",
                          type: item.type,
                          description: item.description,
                          durationMinutes:
                            item.durationMinutes != null
                              ? String(item.durationMinutes)
                              : "",
                          notes: item.notes || "",
                        });
                      }}
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        if (!confirm("Eliminar este registo?")) return;
                        await api.deleteNonTeachingActivity(item.id);
                        load();
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

export function ComportamentoTab({ canManage }: { canManage: boolean }) {
  const [items, setItems] = useState<BehaviorRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [form, setForm] = useState({
    studentId: "",
    date: format(new Date(), "yyyy-MM-dd"),
    type: "POSITIVO" as BehaviorType,
    description: "",
    visibleToGuardian: false,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => {
    api
      .getBehaviorRecords()
      .then(setItems)
      .catch((err) =>
        setMessage(err instanceof Error ? err.message : "Erro ao carregar."),
      );
  };

  useEffect(() => {
    load();
    api.getStudents().then(setStudents).catch(() => setStudents([]));
  }, []);

  const submit = async () => {
    if (!form.studentId || !form.description.trim()) {
      setMessage("Seleccione o aluno e descreva o registo.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      if (editingId) {
        await api.updateBehaviorRecord(editingId, {
          date: form.date,
          type: form.type,
          description: form.description.trim(),
          visibleToGuardian: form.visibleToGuardian,
        });
        setMessage("Registo actualizado.");
      } else {
        await api.createBehaviorRecord({
          studentId: form.studentId,
          date: form.date,
          type: form.type,
          description: form.description.trim(),
          visibleToGuardian: form.visibleToGuardian,
        });
        setMessage("Registo criado.");
      }
      setEditingId(null);
      setForm((f) => ({ ...f, description: "", visibleToGuardian: false }));
      load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Erro ao guardar.");
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
              {editingId ? "Editar comportamento" : "Novo registo"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field label="Aluno">
              <Select
                value={form.studentId}
                onValueChange={(v) => setForm((f) => ({ ...f, studentId: v }))}
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
            <Field label="Data">
              <Input
                type="date"
                value={form.date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, date: e.target.value }))
                }
              />
            </Field>
            <Field label="Tipo">
              <Select
                value={form.type}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, type: v as BehaviorType }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="POSITIVO">Positivo</SelectItem>
                  <SelectItem value="A_MELHORAR">A melhorar</SelectItem>
                  <SelectItem value="INCIDENTE">Incidente</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Descrição">
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </Field>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">Visível ao encarregado</span>
              <Switch
                checked={form.visibleToGuardian}
                onCheckedChange={(v) =>
                  setForm((f) => ({ ...f, visibleToGuardian: v }))
                }
              />
            </div>
            {message && (
              <p className="text-sm text-muted-foreground">{message}</p>
            )}
            <Button disabled={saving} onClick={submit}>
              {editingId ? "Actualizar" : "Criar"}
            </Button>
          </CardContent>
        </Card>
      )}
      <Card className={canManage ? "lg:col-span-2" : "lg:col-span-3"}>
        <CardHeader>
          <CardTitle className="text-lg">
            Comportamento ({items.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-lg border p-3"
            >
              <div>
                <p className="font-medium">
                  {item.student?.childFullName} · {formatDate(item.date)}
                </p>
                <Badge variant="outline">{behaviorTypeLabel(item.type)}</Badge>
                {item.visibleToGuardian && (
                  <Badge className="ml-2" variant="secondary">
                    Portal
                  </Badge>
                )}
                <p className="mt-1 text-sm">{item.description}</p>
              </div>
              {canManage && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingId(item.id);
                      setForm({
                        studentId: item.studentId,
                        date: item.date.slice(0, 10),
                        type: item.type,
                        description: item.description,
                        visibleToGuardian: item.visibleToGuardian,
                      });
                    }}
                  >
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      if (!confirm("Eliminar?")) return;
                      await api.deleteBehaviorRecord(item.id);
                      load();
                    }}
                  >
                    Remover
                  </Button>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function HabilitacoesTab({ canManage }: { canManage: boolean }) {
  const [items, setItems] = useState<StudentQualification[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [form, setForm] = useState({
    studentId: "",
    title: "",
    issuedAt: format(new Date(), "yyyy-MM-dd"),
    issuer: "",
    notes: "",
    documentUrl: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => {
    api
      .getQualifications()
      .then(setItems)
      .catch((err) =>
        setMessage(err instanceof Error ? err.message : "Erro ao carregar."),
      );
  };

  useEffect(() => {
    load();
    api.getStudents().then(setStudents).catch(() => setStudents([]));
  }, []);

  const submit = async () => {
    if (!form.studentId || !form.title.trim()) {
      setMessage("Indique o aluno e o título.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const body = {
        studentId: form.studentId,
        title: form.title.trim(),
        issuedAt: form.issuedAt,
        issuer: form.issuer.trim() || null,
        notes: form.notes.trim() || null,
        documentUrl: form.documentUrl.trim() || null,
      };
      if (editingId) {
        const { studentId: _s, ...rest } = body;
        await api.updateQualification(editingId, rest);
        setMessage("Habilitação actualizada.");
      } else {
        await api.createQualification(body);
        setMessage("Habilitação criada.");
      }
      setEditingId(null);
      setForm((f) => ({ ...f, title: "", issuer: "", notes: "", documentUrl: "" }));
      load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Erro ao guardar.");
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
              {editingId ? "Editar habilitação" : "Nova habilitação"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field label="Aluno">
              <Select
                value={form.studentId}
                onValueChange={(v) => setForm((f) => ({ ...f, studentId: v }))}
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
            <Field label="Título">
              <Input
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
              />
            </Field>
            <Field label="Data de emissão">
              <Input
                type="date"
                value={form.issuedAt}
                onChange={(e) =>
                  setForm((f) => ({ ...f, issuedAt: e.target.value }))
                }
              />
            </Field>
            <Field label="Entidade emissora">
              <Input
                value={form.issuer}
                onChange={(e) =>
                  setForm((f) => ({ ...f, issuer: e.target.value }))
                }
              />
            </Field>
            <Field label="URL do documento">
              <Input
                value={form.documentUrl}
                onChange={(e) =>
                  setForm((f) => ({ ...f, documentUrl: e.target.value }))
                }
              />
            </Field>
            <Field label="Notas">
              <Textarea
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
              />
            </Field>
            {message && (
              <p className="text-sm text-muted-foreground">{message}</p>
            )}
            <Button disabled={saving} onClick={submit}>
              {editingId ? "Actualizar" : "Criar"}
            </Button>
          </CardContent>
        </Card>
      )}
      <Card className={canManage ? "lg:col-span-2" : "lg:col-span-3"}>
        <CardHeader>
          <CardTitle className="text-lg">
            Habilitações ({items.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-lg border p-3"
            >
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-sm text-muted-foreground">
                  {item.student?.childFullName} · {formatDate(item.issuedAt)}
                  {item.issuer ? ` · ${item.issuer}` : ""}
                </p>
              </div>
              {canManage && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingId(item.id);
                      setForm({
                        studentId: item.studentId,
                        title: item.title,
                        issuedAt: item.issuedAt.slice(0, 10),
                        issuer: item.issuer || "",
                        notes: item.notes || "",
                        documentUrl: item.documentUrl || "",
                      });
                    }}
                  >
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      if (!confirm("Eliminar?")) return;
                      await api.deleteQualification(item.id);
                      load();
                    }}
                  >
                    Remover
                  </Button>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

const MEETING_TYPES: MeetingType[] = [
  "PEDAGOGICA",
  "COORDENACAO",
  "ENCARREGADOS",
  "OUTRA",
];

export function ReunioesAdmin({
  needsLogin,
  userRole,
  onLogin,
}: {
  needsLogin: boolean;
  userRole: string;
  onLogin: () => void;
}) {
  const canManage = ["ADMIN", "DIRECAO", "COORDENACAO"].includes(userRole);
  const [items, setItems] = useState<Meeting[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [form, setForm] = useState({
    title: "",
    dateTime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    type: "PEDAGOGICA" as MeetingType,
    participantsNotes: "",
    unitId: "",
    status: "AGENDADA" as MeetingStatus,
    visibleToGuardians: false,
    location: "",
    notes: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [minutesContent, setMinutesContent] = useState("");
  const [minutesStatus, setMinutesStatus] =
    useState<MeetingMinutesStatus>("RASCUNHO");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => {
    api
      .getMeetings()
      .then((list) => {
        setItems(list);
        setSelectedId((cur) => cur || list[0]?.id || "");
      })
      .catch((err) =>
        setMessage(err instanceof Error ? err.message : "Erro ao carregar."),
      );
  };

  useEffect(() => {
    if (needsLogin) return;
    load();
    api.getUnits().then(setUnits).catch(() => setUnits([]));
  }, [needsLogin]);

  useEffect(() => {
    const selected = items.find((m) => m.id === selectedId);
    if (selected?.minutes) {
      setMinutesContent(selected.minutes.content);
      setMinutesStatus(selected.minutes.status);
    } else {
      setMinutesContent("");
      setMinutesStatus("RASCUNHO");
    }
  }, [selectedId, items]);

  if (needsLogin) {
    return (
      <Card>
        <CardContent className="space-y-4 p-8">
          <h1 className="text-2xl font-bold">Reuniões e actas</h1>
          <p className="text-muted-foreground">
            Inicie sessão para gerir reuniões e actas.
          </p>
          <Button onClick={onLogin}>Entrar</Button>
        </CardContent>
      </Card>
    );
  }

  const submit = async () => {
    if (!form.title.trim()) {
      setMessage("Indique o título da reunião.");
      return;
    }
    setSaving(true);
    setMessage("");
    const body = {
      title: form.title.trim(),
      dateTime: new Date(form.dateTime).toISOString(),
      type: form.type,
      participantsNotes: form.participantsNotes.trim() || null,
      unitId: form.unitId || null,
      status: form.status,
      visibleToGuardians: form.visibleToGuardians,
      location: form.location.trim() || null,
      notes: form.notes.trim() || null,
    };
    try {
      if (editingId) await api.updateMeeting(editingId, body);
      else await api.createMeeting(body);
      setMessage(editingId ? "Reunião actualizada." : "Reunião criada.");
      setEditingId(null);
      setForm((f) => ({
        ...f,
        title: "",
        participantsNotes: "",
        notes: "",
        location: "",
        visibleToGuardians: false,
      }));
      load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Erro ao guardar.");
    } finally {
      setSaving(false);
    }
  };

  const saveMinutes = async () => {
    if (!selectedId || !minutesContent.trim()) return;
    setSaving(true);
    try {
      await api.upsertMeetingMinutes(selectedId, {
        content: minutesContent.trim(),
        status: minutesStatus,
      });
      setMessage("Acta guardada.");
      load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Erro ao guardar acta.");
    } finally {
      setSaving(false);
    }
  };

  const printMinutes = async () => {
    if (!selectedId) return;
    try {
      const result = await api.getMeetingMinutesPrint(selectedId);
      const win = window.open("", "_blank");
      if (!win) return;
      win.document.write(
        `<pre style="font-family:Georgia,serif;white-space:pre-wrap;padding:24px">${result.text.replace(/</g, "&lt;")}</pre>`,
      );
      win.document.close();
      win.focus();
      win.print();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Sem acta para imprimir.");
    }
  };

  return (
    <div>
      <div className="mb-7">
        <p className="mb-2 text-sm font-medium text-secondary">COORDENAÇÃO</p>
        <h1 className="text-3xl font-bold">Reuniões e actas</h1>
        <p className="mt-2 text-muted-foreground">
          Agende reuniões pedagógicas ou com encarregados e elabore actas
          imprimíveis.
        </p>
      </div>
      {message && (
        <p className="mb-4 text-sm text-muted-foreground">{message}</p>
      )}
      <div className="grid gap-6 lg:grid-cols-3">
        {canManage && (
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">
                {editingId ? "Editar reunião" : "Nova reunião"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Field label="Título">
                <Input
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                />
              </Field>
              <Field label="Data e hora">
                <Input
                  type="datetime-local"
                  value={form.dateTime}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, dateTime: e.target.value }))
                  }
                />
              </Field>
              <Field label="Tipo">
                <Select
                  value={form.type}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, type: v as MeetingType }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MEETING_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {meetingTypeLabel(t)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Estado">
                <Select
                  value={form.status}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, status: v as MeetingStatus }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AGENDADA">Agendada</SelectItem>
                    <SelectItem value="REALIZADA">Realizada</SelectItem>
                    <SelectItem value="CANCELADA">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Unidade">
                <Select
                  value={form.unitId || "none"}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      unitId: v === "none" ? "" : v,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    {units.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Local">
                <Input
                  value={form.location}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, location: e.target.value }))
                  }
                />
              </Field>
              <Field label="Participantes">
                <Textarea
                  value={form.participantsNotes}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      participantsNotes: e.target.value,
                    }))
                  }
                />
              </Field>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">
                  Visível na agenda do portal
                </span>
                <Switch
                  checked={form.visibleToGuardians}
                  onCheckedChange={(v) =>
                    setForm((f) => ({ ...f, visibleToGuardians: v }))
                  }
                />
              </div>
              <Button disabled={saving} onClick={submit}>
                {editingId ? "Actualizar" : "Criar"}
              </Button>
            </CardContent>
          </Card>
        )}
        <Card className={canManage ? "lg:col-span-2" : "lg:col-span-3"}>
          <CardHeader>
            <CardTitle className="text-lg">Reuniões ({items.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className={`cursor-pointer rounded-lg border p-3 ${
                  selectedId === item.id ? "border-primary" : ""
                }`}
                onClick={() => setSelectedId(item.id)}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDateTime(item.dateTime)} ·{" "}
                      {meetingTypeLabel(item.type)}
                      {item.unit?.name ? ` · ${item.unit.name}` : ""}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      <Badge variant="outline">{item.status}</Badge>
                      {item.visibleToGuardians && (
                        <Badge variant="secondary">Portal</Badge>
                      )}
                      {item.minutes && (
                        <Badge variant="outline">
                          Acta {item.minutes.status.toLowerCase()}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {canManage && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingId(item.id);
                          setForm({
                            title: item.title,
                            dateTime: format(
                              new Date(item.dateTime),
                              "yyyy-MM-dd'T'HH:mm",
                            ),
                            type: item.type,
                            participantsNotes: item.participantsNotes || "",
                            unitId: item.unitId || "",
                            status: item.status,
                            visibleToGuardians: item.visibleToGuardians,
                            location: item.location || "",
                            notes: item.notes || "",
                          });
                        }}
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!confirm("Eliminar reunião?")) return;
                          await api.deleteMeeting(item.id);
                          load();
                        }}
                      >
                        Remover
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {selectedId && canManage && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Acta da reunião</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field label="Conteúdo">
              <Textarea
                rows={10}
                value={minutesContent}
                onChange={(e) => setMinutesContent(e.target.value)}
                placeholder="Texto da acta…"
              />
            </Field>
            <Field label="Estado da acta">
              <Select
                value={minutesStatus}
                onValueChange={(v) =>
                  setMinutesStatus(v as MeetingMinutesStatus)
                }
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RASCUNHO">Rascunho</SelectItem>
                  <SelectItem value="PUBLICADA">Publicada</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <div className="flex flex-wrap gap-2">
              <Button disabled={saving} onClick={saveMinutes}>
                Guardar acta
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  await api.publishMeetingMinutes(selectedId);
                  setMessage("Acta publicada.");
                  load();
                }}
              >
                Publicar
              </Button>
              <Button variant="outline" onClick={printMinutes}>
                Imprimir / exportar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
