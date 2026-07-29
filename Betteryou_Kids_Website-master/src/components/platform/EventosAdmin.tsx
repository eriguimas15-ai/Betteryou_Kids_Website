import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import {
  CalendarIcon,
  MapPin,
  Pencil,
  Ticket,
  Trash2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  type EventItem,
  type EventPayload,
  type EventRegistration,
  type EventType,
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
      <span className="font-medium leading-none">{label}</span>
      {children}
    </label>
  );
}

const EVENT_MANAGE_ROLES = ["ADMIN", "DIRECAO", "COORDENACAO", "COMUNICACAO"];

const EVENT_TYPE_OPTIONS: Array<{ value: EventType; label: string }> = [
  { value: "FESTA", label: "Festa" },
  { value: "EVENTO", label: "Evento" },
  { value: "PASSEIO", label: "Passeio" },
  { value: "WORKSHOP", label: "Workshop" },
];

function eventTypeLabel(type: string): string {
  return EVENT_TYPE_OPTIONS.find((o) => o.value === type)?.label || type;
}

function eventStatusLabel(status: string): string {
  switch (status) {
    case "PUBLICADO":
      return "Publicado";
    case "RASCUNHO":
      return "Rascunho";
    case "EM_REVISAO":
      return "Em revisão";
    case "ARQUIVADO":
      return "Arquivado";
    default:
      return status;
  }
}

function eventRegistrationStatusLabel(status: string): string {
  switch (status) {
    case "INSCRITO":
      return "Inscrito";
    case "LISTA_ESPERA":
      return "Lista de espera";
    case "CANCELADO":
      return "Cancelado";
    default:
      return status;
  }
}

function formatEventDateTime(value: string | null): string {
  if (!value) return "";
  try {
    return format(parseISO(value), "dd/MM/yyyy · HH:mm", { locale: pt });
  } catch {
    return value.slice(0, 16).replace("T", " ");
  }
}

function isoToLocalInput(value: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

function formatEventPrice(priceAkz: number | null): string {
  if (priceAkz == null || priceAkz <= 0) return "Gratuito";
  return `${priceAkz.toLocaleString("pt-PT")} AKZ`;
}

type EventoForm = {
  title: string;
  description: string;
  type: EventType;
  unitId: string;
  startAt: string;
  endAt: string;
  location: string;
  capacity: string;
  priceAkz: string;
  imageUrl: string;
  publishAt: string;
};

const emptyEventoForm: EventoForm = {
  title: "",
  description: "",
  type: "EVENTO",
  unitId: "",
  startAt: "",
  endAt: "",
  location: "",
  capacity: "",
  priceAkz: "",
  imageUrl: "",
  publishAt: "",
};

export function EventosAdmin({
  needsLogin,
  userRole,
  onLogin,
}: {
  needsLogin: boolean;
  userRole: string;
  onLogin: () => void;
}) {
  const canManage = EVENT_MANAGE_ROLES.includes(userRole);
  const [items, setItems] = useState<EventItem[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [form, setForm] = useState<EventoForm>(emptyEventoForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [openRegistrations, setOpenRegistrations] = useState<string | null>(
    null,
  );
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [registrationsLoading, setRegistrationsLoading] = useState(false);

  const loadList = () => {
    setLoading(true);
    api
      .getEvents()
      .then(setItems)
      .catch((err) =>
        setMessage(
          err instanceof Error
            ? err.message
            : "Não foi possível carregar os eventos.",
        ),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (needsLogin) return;
    loadList();
    api.getUnits().then(setUnits).catch(() => setUnits([]));
  }, [needsLogin]);

  if (needsLogin) {
    return (
      <Card>
        <CardContent className="space-y-4 p-8">
          <h1 className="text-2xl font-bold">Eventos e festas</h1>
          <p className="text-muted-foreground">
            Inicie sessão para criar e gerir os eventos e festas infantis.
          </p>
          <Button onClick={onLogin}>Entrar</Button>
        </CardContent>
      </Card>
    );
  }

  const resetForm = () => {
    setForm(emptyEventoForm);
    setEditingId(null);
  };

  const startEdit = (item: EventItem) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      description: item.description,
      type: item.type,
      unitId: item.unitId ?? "",
      startAt: isoToLocalInput(item.startAt),
      endAt: isoToLocalInput(item.endAt),
      location: item.location ?? "",
      capacity: item.capacity != null ? String(item.capacity) : "",
      priceAkz: item.priceAkz != null ? String(item.priceAkz) : "",
      imageUrl: item.imageUrl ?? "",
      publishAt: isoToLocalInput(item.publishAt),
    });
    setMessage("");
  };

  const buildPayload = (
    status: "RASCUNHO" | "PUBLICADO",
  ): EventPayload | null => {
    if (!form.title.trim() || !form.description.trim()) {
      setMessage("Indique o título e a descrição do evento.");
      return null;
    }
    if (!form.startAt) {
      setMessage("Indique a data e hora de início.");
      return null;
    }
    return {
      title: form.title.trim(),
      description: form.description.trim(),
      type: form.type,
      status,
      startAt: form.startAt,
      endAt: form.endAt || null,
      location: form.location.trim() || null,
      unitId: form.unitId || null,
      capacity: form.capacity ? Number(form.capacity) : null,
      priceAkz: form.priceAkz ? Number(form.priceAkz) : null,
      imageUrl: form.imageUrl.trim() || null,
      publishAt: form.publishAt || null,
    };
  };

  const submit = async (status: "RASCUNHO" | "PUBLICADO") => {
    const payload = buildPayload(status);
    if (!payload) return;
    setSaving(true);
    setMessage("");
    try {
      if (editingId) {
        await api.updateEvent(editingId, payload);
        if (status === "PUBLICADO") {
          await api.publishEvent(editingId, payload.publishAt);
        }
        setMessage("Evento actualizado.");
      } else {
        await api.createEvent(payload);
        setMessage(
          status === "PUBLICADO"
            ? payload.publishAt
              ? "Evento agendado/publicado."
              : "Evento publicado."
            : "Rascunho guardado.",
        );
      }
      resetForm();
      loadList();
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : "Não foi possível guardar o evento.",
      );
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (item: EventItem) => {
    try {
      if (item.status === "PUBLICADO") {
        await api.archiveEvent(item.id);
      } else {
        await api.publishEvent(item.id, null);
      }
      loadList();
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Não foi possível actualizar.",
      );
    }
  };

  const remove = async (item: EventItem) => {
    if (!window.confirm(`Remover o evento "${item.title}"?`)) return;
    try {
      await api.deleteEvent(item.id);
      if (editingId === item.id) resetForm();
      if (openRegistrations === item.id) setOpenRegistrations(null);
      loadList();
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Não foi possível remover.",
      );
    }
  };

  const toggleRegistrations = (item: EventItem) => {
    if (openRegistrations === item.id) {
      setOpenRegistrations(null);
      return;
    }
    setOpenRegistrations(item.id);
    setRegistrationsLoading(true);
    api
      .getEventRegistrations(item.id)
      .then(setRegistrations)
      .catch(() => setRegistrations([]))
      .finally(() => setRegistrationsLoading(false));
  };

  const changeRegistrationStatus = async (
    reg: EventRegistration,
    status: EventRegistration["status"],
  ) => {
    try {
      await api.updateEventRegistration(reg.id, status);
      setRegistrations((list) =>
        list.map((r) => (r.id === reg.id ? { ...r, status } : r)),
      );
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Não foi possível actualizar.",
      );
    }
  };

  return (
    <div>
      <div className="mb-7">
        <p className="mb-2 text-sm font-medium text-secondary">COMUNIDADE</p>
        <h1 className="text-3xl font-bold">Eventos e festas</h1>
        <p className="mt-2 text-muted-foreground">
          Crie festas, passeios e workshops, agende a publicação e faça a gestão
          das inscrições das famílias.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {canManage && (
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">
                {editingId ? "Editar evento" : "Novo evento"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Título">
                <Input
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  placeholder="Ex.: Festa de fim de ano"
                />
              </Field>
              <Field label="Descrição">
                <Textarea
                  rows={5}
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  placeholder="Descreva o evento, o programa e o que levar…"
                />
              </Field>
              <Field label="Tipo">
                <Select
                  value={form.type}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, type: v as EventType }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
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
                    <SelectValue placeholder="Todas as unidades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Todas as unidades</SelectItem>
                    {units.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Início">
                  <Input
                    type="datetime-local"
                    value={form.startAt}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, startAt: e.target.value }))
                    }
                  />
                </Field>
                <Field label="Fim (opcional)">
                  <Input
                    type="datetime-local"
                    value={form.endAt}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, endAt: e.target.value }))
                    }
                  />
                </Field>
              </div>
              <Field label="Local (opcional)">
                <Input
                  value={form.location}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, location: e.target.value }))
                  }
                  placeholder="Ex.: Unidade Gika — Pátio exterior"
                />
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Lotação (opcional)">
                  <Input
                    type="number"
                    min={1}
                    value={form.capacity}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, capacity: e.target.value }))
                    }
                    placeholder="Sem limite"
                  />
                </Field>
                <Field label="Preço AKZ (opcional)">
                  <Input
                    type="number"
                    min={0}
                    value={form.priceAkz}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, priceAkz: e.target.value }))
                    }
                    placeholder="Gratuito"
                  />
                </Field>
              </div>
              <Field label="Imagem (URL opcional)">
                <Input
                  value={form.imageUrl}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, imageUrl: e.target.value }))
                  }
                  placeholder="https://…"
                />
              </Field>
              <Field label="Agendar publicação (opcional)">
                <Input
                  type="datetime-local"
                  value={form.publishAt}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, publishAt: e.target.value }))
                  }
                />
              </Field>

              {message && (
                <p className="text-sm text-muted-foreground">{message}</p>
              )}

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => submit("RASCUNHO")}
                  disabled={saving}
                >
                  {editingId ? "Guardar" : "Guardar rascunho"}
                </Button>
                <Button onClick={() => submit("PUBLICADO")} disabled={saving}>
                  {saving
                    ? "A guardar…"
                    : form.publishAt
                      ? "Agendar/Publicar"
                      : "Publicar"}
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
            <CardTitle className="text-lg">Eventos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!canManage && message && (
              <p className="text-sm text-muted-foreground">{message}</p>
            )}
            {loading ? (
              <p className="text-sm text-muted-foreground">A carregar…</p>
            ) : items.length === 0 ? (
              <p className="rounded-lg border p-5 text-sm text-muted-foreground">
                Ainda não existem eventos.
              </p>
            ) : (
              items.map((item) => (
                <div key={item.id} className="space-y-2 rounded-lg border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{item.title}</p>
                      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <CalendarIcon className="h-3.5 w-3.5" />
                          {formatEventDateTime(item.startAt)}
                        </span>
                        {item.location && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {item.location}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <Ticket className="h-3.5 w-3.5" />
                          {formatEventPrice(item.priceAkz)}
                        </span>
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{eventTypeLabel(item.type)}</Badge>
                      <Badge
                        variant={
                          item.status === "PUBLICADO" ? "default" : "secondary"
                        }
                      >
                        {eventStatusLabel(item.status)}
                      </Badge>
                      {typeof item._count?.registrations === "number" && (
                        <Badge variant="outline">
                          {item._count.registrations} inscrição(ões)
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="whitespace-pre-line text-sm text-muted-foreground">
                    {item.description}
                  </p>
                  {item.publishAt && !item.publishedAt && (
                    <p className="text-xs text-muted-foreground">
                      Agendado para {formatEventDateTime(item.publishAt)}
                    </p>
                  )}
                  {canManage && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => togglePublish(item)}
                      >
                        {item.status === "PUBLICADO" ? "Arquivar" : "Publicar"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleRegistrations(item)}
                      >
                        <Users className="mr-1 h-3.5 w-3.5" />
                        Inscrições
                      </Button>
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

                  {openRegistrations === item.id && (
                    <div className="mt-2 space-y-2 rounded-lg bg-muted/50 p-3">
                      {registrationsLoading ? (
                        <p className="text-sm text-muted-foreground">
                          A carregar inscrições…
                        </p>
                      ) : registrations.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Ainda não há inscrições.
                        </p>
                      ) : (
                        registrations.map((reg) => (
                          <div
                            key={reg.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-background p-2"
                          >
                            <div className="text-sm">
                              <p className="font-medium">{reg.childName}</p>
                              <p className="text-xs text-muted-foreground">
                                {reg.guardianName} · {reg.guardianEmail}
                                {reg.guardianPhone
                                  ? ` · ${reg.guardianPhone}`
                                  : ""}{" "}
                                · {reg.attendees} pessoa(s)
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={
                                  reg.status === "INSCRITO"
                                    ? "default"
                                    : reg.status === "LISTA_ESPERA"
                                      ? "secondary"
                                      : "outline"
                                }
                              >
                                {eventRegistrationStatusLabel(reg.status)}
                              </Badge>
                              <Select
                                value={reg.status}
                                onValueChange={(v) =>
                                  changeRegistrationStatus(
                                    reg,
                                    v as EventRegistration["status"],
                                  )
                                }
                              >
                                <SelectTrigger className="h-8 w-[150px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="INSCRITO">
                                    Inscrito
                                  </SelectItem>
                                  <SelectItem value="LISTA_ESPERA">
                                    Lista de espera
                                  </SelectItem>
                                  <SelectItem value="CANCELADO">
                                    Cancelado
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
