import { useEffect, useState } from "react";
import { DoorOpen, Pencil, Plus, Trash2 } from "lucide-react";
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
import {
  api,
  type AcademicYear,
  type AdminRoom,
  type ClassGroup,
  type RoomDependencies,
  type RoomDeleteResult,
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
const emptyRoomForm = {
  name: "",
  unitId: "",
  serviceId: "",
  academicYearId: "",
  capacity: "",
  levelLabel: "",
  ageLabel: "",
  minAgeYears: "",
  maxAgeYears: "",
  enrolledCount: "0",
  renewalReserved: "0",
  enrollmentReserved: "0",
  active: true,
};

function buildRoomDeleteConfirmMessage(
  room: AdminRoom,
  deps: RoomDependencies,
): string {
  const lines: string[] = [
    `Remover definitivamente a sala "${room.name}" (${room.unit.name})?`,
    "",
  ];

  if (!deps.hasAssociations) {
    lines.push("Esta sala não tem associações.");
  } else {
    lines.push("Esta sala tem:");
    if (deps.enrollments > 0) {
      lines.push(`• ${deps.enrollments} inscrição(ões)`);
    }
    if (deps.renewals > 0) {
      lines.push(`• ${deps.renewals} renovação(ões)`);
    }
    if (deps.students > 0) {
      lines.push(`• ${deps.students} aluno(s)`);
    }
    if (deps.waitlistEntries > 0) {
      lines.push(
        `• ${deps.waitlistEntries} reserva(s) em lista de espera`,
      );
    }
    if (deps.classGroups.count > 0) {
      lines.push(
        `• ${deps.classGroups.count} turma(s): ${deps.classGroups.names.join(", ")}`,
      );
    }
    lines.push("");
    const actions: string[] = [];
    if (
      deps.enrollments > 0 ||
      deps.renewals > 0 ||
      deps.students > 0 ||
      deps.waitlistEntries > 0
    ) {
      actions.push(
        "As associações em inscrições, renovações, alunos e lista de espera serão removidas (ficam sem sala)",
      );
    }
    if (deps.classGroups.count > 0) {
      actions.push(
        `Serão eliminadas as turmas: ${deps.classGroups.names.join(", ")} (com presenças, sumários, avaliações e horários)`,
      );
    }
    if (actions.length > 0) {
      lines.push(`${actions.join(". ")}.`);
    }
  }

  lines.push("", "Continuar?");
  return lines.join("\n");
}

function buildRoomDeleteSuccessMessage(
  room: AdminRoom,
  cleared: RoomDeleteResult["cleared"],
): string {
  const parts: string[] = [];
  if (cleared.enrollments > 0) {
    parts.push(`${cleared.enrollments} inscrição(ões) desassociada(s)`);
  }
  if (cleared.renewals > 0) {
    parts.push(`${cleared.renewals} renovação(ões) desassociada(s)`);
  }
  if (cleared.students > 0) {
    parts.push(`${cleared.students} aluno(s) desassociado(s)`);
  }
  if (cleared.waitlistEntries > 0) {
    parts.push(
      `${cleared.waitlistEntries} reserva(s) em lista de espera desassociada(s)`,
    );
  }
  if (cleared.classGroups.count > 0) {
    parts.push(
      `${cleared.classGroups.count} turma(s) eliminada(s): ${cleared.classGroups.names.join(", ")}`,
    );
  }

  if (parts.length === 0) {
    return `Sala "${room.name}" (${room.unit.name}) removida.`;
  }
  return `Sala "${room.name}" (${room.unit.name}) removida. ${parts.join("; ")}.`;
}

export function SalasAdmin({
  needsLogin,
  onLogin,
}: {
  needsLogin: boolean;
  onLogin: () => void;
}) {
  const [rooms, setRooms] = useState<AdminRoom[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyRoomForm);
  const [filterUnitId, setFilterUnitId] = useState("all");
  const [filterServiceId, setFilterServiceId] = useState("all");
  const [filterLevel, setFilterLevel] = useState("all");

  const loadRooms = () =>
    api
      .getRoomsAdmin(true)
      .then(setRooms)
      .catch(() => setRooms([]));

  useEffect(() => {
    if (needsLogin) return;
    loadRooms();
    api.getUnits().then(setUnits).catch(() => setUnits([]));
    api.getServices().then(setServices).catch(() => setServices([]));
    api
      .getAcademicYears()
      .then((list) => {
        setYears(list);
        const current = list.find((y) => y.label === YEAR);
        setForm((f) => ({
          ...f,
          academicYearId: current?.id || list[0]?.id || "",
        }));
      })
      .catch(() => setYears([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsLogin]);

  const levelOptions = [
    ...new Set(
      rooms
        .map((r) => r.levelLabel)
        .filter((l): l is string => !!l && l.trim().length > 0),
    ),
  ].sort();

  const filteredRooms = rooms.filter((room) => {
    if (filterUnitId !== "all" && room.unitId !== filterUnitId) return false;
    if (filterServiceId !== "all" && room.serviceId !== filterServiceId)
      return false;
    if (filterLevel === "none") return !room.levelLabel;
    if (filterLevel !== "all" && room.levelLabel !== filterLevel) return false;
    return true;
  });

  const resetForm = (keepIds = true) => {
    setEditingId(null);
    setForm((f) => ({
      ...emptyRoomForm,
      unitId: keepIds ? f.unitId : "",
      serviceId: keepIds ? f.serviceId : "",
      academicYearId:
        keepIds && f.academicYearId
          ? f.academicYearId
          : years.find((y) => y.label === YEAR)?.id || years[0]?.id || "",
    }));
  };

  const startEdit = (room: AdminRoom) => {
    setEditingId(room.id);
    setForm({
      name: room.name,
      unitId: room.unitId,
      serviceId: room.serviceId,
      academicYearId: room.academicYearId,
      capacity: String(room.capacity),
      levelLabel: room.levelLabel || "",
      ageLabel: room.ageLabel || "",
      minAgeYears:
        room.minAgeYears != null ? String(room.minAgeYears) : "",
      maxAgeYears:
        room.maxAgeYears != null ? String(room.maxAgeYears) : "",
      enrolledCount: String(room.enrolledCount ?? 0),
      renewalReserved: String(room.renewalReserved ?? 0),
      enrollmentReserved: String(room.enrollmentReserved ?? 0),
      active: room.active,
    });
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (needsLogin) {
    return (
      <Card>
        <CardContent className="space-y-4 p-8">
          <h1 className="text-2xl font-bold">Salas</h1>
          <p className="text-muted-foreground">
            Inicie sessão para gerir as salas.
          </p>
          <Button onClick={onLogin}>Entrar</Button>
        </CardContent>
      </Card>
    );
  }

  const submitRoom = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.unitId || !form.serviceId || !form.academicYearId) {
      setMessage("Seleccione unidade, serviço e ano letivo.");
      return;
    }
    setLoading(true);
    setMessage("");
    const payload = {
      name: form.name.trim(),
      unitId: form.unitId,
      serviceId: form.serviceId,
      academicYearId: form.academicYearId,
      capacity: Number(form.capacity),
      levelLabel: form.levelLabel.trim() || null,
      ageLabel: form.ageLabel.trim() || null,
      minAgeYears: form.minAgeYears ? Number(form.minAgeYears) : null,
      maxAgeYears: form.maxAgeYears ? Number(form.maxAgeYears) : null,
      enrolledCount: Number(form.enrolledCount || 0),
      renewalReserved: Number(form.renewalReserved || 0),
      enrollmentReserved: Number(form.enrollmentReserved || 0),
      active: form.active,
    };
    try {
      if (editingId) {
        await api.updateRoom(editingId, payload);
        setMessage("Sala actualizada com sucesso.");
      } else {
        await api.createRoom({
          name: payload.name,
          unitId: payload.unitId,
          serviceId: payload.serviceId,
          academicYearId: payload.academicYearId,
          capacity: payload.capacity,
          levelLabel: payload.levelLabel || undefined,
          ageLabel: payload.ageLabel || undefined,
          minAgeYears: payload.minAgeYears ?? undefined,
          maxAgeYears: payload.maxAgeYears ?? undefined,
          enrolledCount: payload.enrolledCount,
          renewalReserved: payload.renewalReserved,
          enrollmentReserved: payload.enrollmentReserved,
          active: payload.active,
        });
        setMessage("Sala criada com sucesso.");
      }
      resetForm(true);
      loadRooms();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível guardar a sala.",
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (room: AdminRoom, nextActive: boolean) => {
    if (togglingId) return;
    const previous = room.active === true;
    setTogglingId(room.id);
    setRooms((list) =>
      list.map((r) =>
        r.id === room.id ? { ...r, active: nextActive } : r,
      ),
    );
    if (editingId === room.id) {
      setForm((f) => ({ ...f, active: nextActive }));
    }
    try {
      const updated = await api.setRoomActive(room.id, nextActive);
      setRooms((list) =>
        list.map((r) =>
          r.id === room.id ? { ...r, active: updated.active === true } : r,
        ),
      );
      setMessage(
        nextActive
          ? `Sala "${room.name}" (${room.unit.name}) activada.`
          : `Sala "${room.name}" (${room.unit.name}) desactivada.`,
      );
    } catch (error) {
      setRooms((list) =>
        list.map((r) =>
          r.id === room.id ? { ...r, active: previous } : r,
        ),
      );
      if (editingId === room.id) {
        setForm((f) => ({ ...f, active: previous }));
      }
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível alterar o estado da sala.",
      );
    } finally {
      setTogglingId(null);
    }
  };

  const removeRoom = async (room: AdminRoom) => {
    setMessage("");
    let deps: RoomDependencies;
    try {
      deps = await api.getRoomDependencies(room.id);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível verificar as associações da sala.",
      );
      return;
    }

    if (!window.confirm(buildRoomDeleteConfirmMessage(room, deps))) return;

    try {
      const result = await api.deleteRoom(room.id);
      if (editingId === room.id) resetForm(true);
      setMessage(buildRoomDeleteSuccessMessage(room, result.cleared));
      loadRooms();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível remover a sala.",
      );
    }
  };

  return (
    <div>
      <div className="mb-7">
        <p className="mb-2 text-sm font-medium text-secondary">
          ADMINISTRAÇÃO
        </p>
        <h1 className="text-3xl font-bold">Salas</h1>
        <p className="mt-2 text-muted-foreground">
          Crie e actualize salas. Filtre por unidade, serviço e nível para
          organizar a lista.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">
              {editingId ? "Editar sala" : "Nova sala"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitRoom} className="space-y-4">
              <Field label="Nome">
                <Input
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Ex.: Círculo / Sala Girassol A"
                />
              </Field>
              <Field label="Unidade">
                <Select
                  value={form.unitId}
                  onValueChange={(v) => setForm((f) => ({ ...f, unitId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              <Field label="Ano letivo">
                <Select
                  value={form.academicYearId}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, academicYearId: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
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
              <Field label="Capacidade">
                <Input
                  required
                  type="number"
                  min={1}
                  value={form.capacity}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, capacity: e.target.value }))
                  }
                />
              </Field>
              <Field label="Nível (ex.: 1.ª Classe)">
                <Input
                  placeholder="Opcional — útil no 1.º Ciclo"
                  value={form.levelLabel}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, levelLabel: e.target.value }))
                  }
                />
              </Field>
              <Field label="Faixa etária (texto)">
                <Input
                  placeholder="Ex.: 1 a 2 anos"
                  value={form.ageLabel}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, ageLabel: e.target.value }))
                  }
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Idade mín. (anos)">
                  <Input
                    type="number"
                    min={0}
                    step="0.5"
                    value={form.minAgeYears}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, minAgeYears: e.target.value }))
                    }
                  />
                </Field>
                <Field label="Idade máx. (anos)">
                  <Input
                    type="number"
                    min={0}
                    step="0.5"
                    value={form.maxAgeYears}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, maxAgeYears: e.target.value }))
                    }
                  />
                </Field>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Matriculados">
                  <Input
                    type="number"
                    min={0}
                    value={form.enrolledCount}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        enrolledCount: e.target.value,
                      }))
                    }
                  />
                </Field>
                <Field label="Reservas renov.">
                  <Input
                    type="number"
                    min={0}
                    value={form.renewalReserved}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        renewalReserved: e.target.value,
                      }))
                    }
                  />
                </Field>
                <Field label="Reservas insc.">
                  <Input
                    type="number"
                    min={0}
                    value={form.enrollmentReserved}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        enrollmentReserved: e.target.value,
                      }))
                    }
                  />
                </Field>
              </div>
              <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                <span className="text-sm">Sala activa / habilitada</span>
                <Switch
                  checked={form.active}
                  onCheckedChange={(v) =>
                    setForm((f) => ({ ...f, active: v }))
                  }
                />
              </div>
              {message && (
                <p className="text-sm text-muted-foreground">{message}</p>
              )}
              <div className="flex gap-2">
                <Button type="submit" className="flex-1" disabled={loading}>
                  {editingId ? (
                    <Pencil className="mr-2 h-4 w-4" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  {loading
                    ? "A guardar..."
                    : editingId
                      ? "Actualizar sala"
                      : "Criar sala"}
                </Button>
                {editingId && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      resetForm(true);
                      setMessage("");
                    }}
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Salas existentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {message && (
              <p
                className={`rounded-lg p-3 text-sm ${
                  message.toLowerCase().includes("não") ||
                  message.toLowerCase().includes("expirada") ||
                  message.toLowerCase().includes("falh")
                    ? "bg-destructive/10 text-destructive"
                    : "bg-green/10 text-green"
                }`}
              >
                {message}
              </p>
            )}
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Filtrar unidade">
                <Select value={filterUnitId} onValueChange={setFilterUnitId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {units.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Filtrar serviço">
                <Select
                  value={filterServiceId}
                  onValueChange={setFilterServiceId}
                >
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
              <Field label="Filtrar nível">
                <Select value={filterLevel} onValueChange={setFilterLevel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="none">Sem nível</SelectItem>
                    {levelOptions.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <p className="text-xs text-muted-foreground">
              A mostrar {filteredRooms.length} de {rooms.length} salas
            </p>
            <div className="divide-y rounded-lg border">
              {filteredRooms.length === 0 && (
                <p className="p-5 text-sm text-muted-foreground">
                  Nenhuma sala corresponde aos filtros seleccionados.
                </p>
              )}
              {filteredRooms.map((room) => (
                <div
                  key={room.id}
                  className={`flex flex-wrap items-center justify-between gap-3 p-5 ${
                    editingId === room.id ? "bg-primary/5" : ""
                  }`}
                >
                  <div>
                    <p className="font-semibold">
                      {room.name}
                      {!room.active && (
                        <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-600">
                          Inactiva
                        </span>
                      )}
                      {room.levelLabel && (
                        <span className="ml-2 rounded-full bg-secondary/15 px-2 py-0.5 text-xs text-secondary">
                          {room.levelLabel}
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {room.unit.name} · {room.service.name} ·{" "}
                      {room.academicYear.label}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {room.ageLabel || "Sem faixa etária"} · Capacidade{" "}
                      {room.capacity} · Matriculados {room.enrolledCount} ·{" "}
                      {room.availableVacancies} vagas
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">
                        {room.active ? "Activa" : "Inactiva"}
                      </span>
                      <Switch
                        checked={room.active === true}
                        disabled={togglingId === room.id}
                        onCheckedChange={(checked) =>
                          toggleActive(room, checked)
                        }
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEdit(room)}
                    >
                      <Pencil className="mr-1 h-4 w-4" />
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRoom(room)}
                      aria-label="Remover sala"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function TurmasAdmin({
  needsLogin,
  onLogin,
}: {
  needsLogin: boolean;
  onLogin: () => void;
}) {
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [rooms, setRooms] = useState<AdminRoom[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [filterYearId, setFilterYearId] = useState("all");
  const [filterUnitName, setFilterUnitName] = useState("all");
  const [filterServiceName, setFilterServiceName] = useState("all");
  const [form, setForm] = useState({
    name: "",
    roomId: "",
    academicYearId: "",
    teacherName: "",
    notes: "",
  });

  const loadClasses = (yearId?: string) =>
    api
      .getClasses(yearId)
      .then(setClasses)
      .catch(() => setClasses([]));

  useEffect(() => {
    if (needsLogin) return;
    const yearId =
      filterYearId !== "all" ? filterYearId : undefined;
    loadClasses(yearId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsLogin, filterYearId]);

  useEffect(() => {
    if (needsLogin) return;
    api.getRoomsAdmin(true).then(setRooms).catch(() => setRooms([]));
    api
      .getAcademicYears()
      .then((list) => {
        setYears(list);
        const current = list.find((y) => y.label === YEAR);
        setForm((f) => ({
          ...f,
          academicYearId: current?.id || list[0]?.id || "",
        }));
      })
      .catch(() => setYears([]));
  }, [needsLogin]);

  if (needsLogin) {
    return (
      <Card>
        <CardContent className="space-y-4 p-8">
          <h1 className="text-2xl font-bold">Turmas</h1>
          <p className="text-muted-foreground">
            Inicie sessão para gerir as turmas.
          </p>
          <Button onClick={onLogin}>Entrar</Button>
        </CardContent>
      </Card>
    );
  }

  const resetForm = () => {
    setEditingId(null);
    setForm((f) => ({
      name: "",
      roomId: "",
      academicYearId:
        f.academicYearId ||
        years.find((y) => y.label === YEAR)?.id ||
        years[0]?.id ||
        "",
      teacherName: "",
      notes: "",
    }));
  };

  const startEdit = (item: ClassGroup) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      roomId: item.roomId,
      academicYearId: item.academicYearId,
      teacherName: item.teacherName || "",
      notes: item.notes || "",
    });
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submitClass = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.roomId || !form.academicYearId) {
      setMessage("Seleccione sala e ano letivo.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      if (editingId) {
        await api.updateClass(editingId, {
          name: form.name.trim(),
          roomId: form.roomId,
          teacherName: form.teacherName.trim() || null,
          notes: form.notes.trim() || null,
        });
        setMessage("Turma actualizada com sucesso.");
      } else {
        await api.createClass({
          name: form.name.trim(),
          roomId: form.roomId,
          academicYearId: form.academicYearId,
          teacherName: form.teacherName.trim() || undefined,
          notes: form.notes.trim() || undefined,
        });
        setMessage("Turma criada com sucesso.");
      }
      resetForm();
      loadClasses(filterYearId !== "all" ? filterYearId : undefined);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : editingId
            ? "Não foi possível actualizar a turma."
            : "Não foi possível criar a turma.",
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (item: ClassGroup, nextActive: boolean) => {
    if (togglingId) return;
    const previous = item.active === true;
    setTogglingId(item.id);
    setClasses((list) =>
      list.map((c) => (c.id === item.id ? { ...c, active: nextActive } : c)),
    );
    try {
      await api.updateClass(item.id, { active: nextActive });
      setMessage(
        nextActive
          ? `Turma "${item.name}" activada.`
          : `Turma "${item.name}" desactivada.`,
      );
    } catch (error) {
      setClasses((list) =>
        list.map((c) =>
          c.id === item.id ? { ...c, active: previous } : c,
        ),
      );
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível alterar o estado.",
      );
    } finally {
      setTogglingId(null);
    }
  };

  const removeClass = async (item: ClassGroup) => {
    setMessage("");
    try {
      await api.deleteClass(item.id);
      setClasses((list) => list.filter((c) => c.id !== item.id));
      if (editingId === item.id) resetForm();
      setMessage(`Turma "${item.name}" removida.`);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível remover a turma.",
      );
    }
  };

  const unitOptions = [
    ...new Set(
      rooms
        .map((r) => r.unit.name)
        .filter((name): name is string => !!name && name.trim().length > 0),
    ),
  ].sort();

  const serviceOptions = [
    ...new Set(
      rooms
        .filter(
          (r) => filterUnitName === "all" || r.unit.name === filterUnitName,
        )
        .map((r) => r.service.name)
        .filter((name): name is string => !!name && name.trim().length > 0),
    ),
  ].sort();

  const filteredClasses = classes.filter((item) => {
    if (
      filterUnitName !== "all" &&
      item.room.unit.name !== filterUnitName
    )
      return false;
    if (
      filterServiceName !== "all" &&
      item.room.service.name !== filterServiceName
    )
      return false;
    return true;
  });

  return (
    <div>
      <div className="mb-7">
        <p className="mb-2 text-sm font-medium text-secondary">
          ADMINISTRAÇÃO
        </p>
        <h1 className="text-3xl font-bold">Turmas</h1>
        <p className="mt-2 text-muted-foreground">
          Agrupe alunos por turma, associando cada turma a uma sala e ano
          letivo.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">
              {editingId ? "Editar turma" : "Nova turma"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitClass} className="space-y-4">
              <Field label="Nome">
                <Input
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Ex.: Turma A"
                />
              </Field>
              <Field label="Sala">
                <Select
                  value={form.roomId}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, roomId: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar sala" />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        {room.name} · {room.unit.name} · {room.service.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Ano letivo">
                <Select
                  value={form.academicYearId}
                  disabled={!!editingId}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, academicYearId: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((y) => (
                      <SelectItem key={y.id} value={y.id}>
                        {y.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {editingId && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    O ano letivo não pode ser alterado após a criação.
                  </p>
                )}
              </Field>
              <Field label="Educador(a)">
                <Input
                  value={form.teacherName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, teacherName: e.target.value }))
                  }
                  placeholder="Opcional"
                />
              </Field>
              <Field label="Notas">
                <Textarea
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  placeholder="Opcional"
                  rows={2}
                />
              </Field>
              {message && (
                <p className="text-sm text-muted-foreground">{message}</p>
              )}
              <div className="flex gap-2">
                <Button type="submit" className="flex-1" disabled={loading}>
                  {editingId ? (
                    <Pencil className="mr-2 h-4 w-4" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  {loading
                    ? "A guardar…"
                    : editingId
                      ? "Actualizar turma"
                      : "Criar turma"}
                </Button>
                {editingId && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      resetForm();
                      setMessage("");
                    }}
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Turmas registadas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Filtrar ano letivo">
                <Select value={filterYearId} onValueChange={setFilterYearId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
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
                  value={filterUnitName}
                  onValueChange={(v) => {
                    setFilterUnitName(v);
                    setFilterServiceName("all");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as unidades</SelectItem>
                    {unitOptions.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Serviço">
                <Select
                  value={filterServiceName}
                  onValueChange={setFilterServiceName}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os serviços</SelectItem>
                    {serviceOptions.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <p className="text-xs text-muted-foreground">
              A mostrar {filteredClasses.length} de {classes.length} turmas
            </p>
            <div className="divide-y rounded-lg border">
              {filteredClasses.length === 0 && (
                <p className="p-5 text-sm text-muted-foreground">
                  Nenhuma turma encontrada.
                </p>
              )}
              {filteredClasses.map((item) => (
                <div
                  key={item.id}
                  className={`flex flex-wrap items-center justify-between gap-3 p-5 ${
                    editingId === item.id ? "bg-primary/5" : ""
                  }`}
                >
                  <div>
                    <p className="font-semibold">
                      {item.name}
                      {!item.active && (
                        <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-600">
                          Inactiva
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {item.room.unit.name} · {item.room.service.name} ·{" "}
                      {item.room.name} · {item.academicYear.label}
                    </p>
                    {item.teacherName && (
                      <p className="text-sm text-muted-foreground">
                        Educador(a): {item.teacherName}
                      </p>
                    )}
                    {item.notes && (
                      <p className="text-sm text-muted-foreground">
                        {item.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">
                        {item.active ? "Activa" : "Inactiva"}
                      </span>
                      <Switch
                        checked={item.active === true}
                        disabled={togglingId === item.id}
                        onCheckedChange={(checked) =>
                          toggleActive(item, checked)
                        }
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEdit(item)}
                    >
                      <Pencil className="mr-1 h-4 w-4" />
                      Editar
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeClass(item)}
                      aria-label="Remover turma"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

