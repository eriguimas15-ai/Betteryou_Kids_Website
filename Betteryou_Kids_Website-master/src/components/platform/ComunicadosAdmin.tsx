import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import { FileText, Pencil, Send, Trash2 } from "lucide-react";
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
  type ClassGroup,
  type Communication,
  type CommunicationAudience,
  type CommunicationPayload,
  type ServiceItem,
  type SmsLog,
  type SmsStatusInfo,
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
      <span className="font-medium leading-none">{label}</span>
      {children}
    </label>
  );
}

const COMMUNICATION_MANAGE_ROLES = [
  "ADMIN",
  "DIRECAO",
  "COORDENACAO",
  "COMUNICACAO",
  "PROFESSOR",
];

const AUDIENCE_OPTIONS: Array<{
  value: CommunicationAudience;
  label: string;
}> = [
  { value: "ESCOLA", label: "Toda a escola" },
  { value: "UNIDADE", label: "Por unidade" },
  { value: "SERVICO", label: "Por serviço" },
  { value: "TURMA", label: "Por turma" },
  { value: "ENCARREGADO", label: "Encarregado específico" },
];

function communicationStatusLabel(status: string): string {
  switch (status) {
    case "PUBLICADO":
      return "Publicado";
    case "RASCUNHO":
      return "Rascunho";
    case "ARQUIVADO":
      return "Arquivado";
    default:
      return status;
  }
}

function communicationAudienceLabel(item: Communication): string {
  switch (item.audience) {
    case "ESCOLA":
      return "Toda a escola";
    case "UNIDADE":
      return `Unidade: ${item.unit?.name ?? "—"}`;
    case "SERVICO":
      return `Serviço: ${item.service?.name ?? "—"}`;
    case "TURMA":
      return `Turma: ${item.classGroup?.name ?? "—"}`;
    case "ENCARREGADO":
      return `Encarregado: ${item.targetGuardianEmail ?? "—"}`;
    default:
      return item.audience;
  }
}

type ComunicadoForm = {
  title: string;
  body: string;
  audience: CommunicationAudience;
  unitId: string;
  serviceId: string;
  classGroupId: string;
  guardianStudentId: string;
  attachmentUrl: string;
  sendEmail: boolean;
};

const emptyComunicadoForm: ComunicadoForm = {
  title: "",
  body: "",
  audience: "ESCOLA",
  unitId: "",
  serviceId: "",
  classGroupId: "",
  guardianStudentId: "",
  attachmentUrl: "",
  sendEmail: false,
};

export function ComunicadosAdmin({
  needsLogin,
  userRole,
  onLogin,
}: {
  needsLogin: boolean;
  userRole: string;
  onLogin: () => void;
}) {
  const canManage = COMMUNICATION_MANAGE_ROLES.includes(userRole);
  const [items, setItems] = useState<Communication[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [form, setForm] = useState<ComunicadoForm>(emptyComunicadoForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [smsStatus, setSmsStatus] = useState<SmsStatusInfo | null>(null);
  const [smsLogs, setSmsLogs] = useState<SmsLog[]>([]);
  const [smsBody, setSmsBody] = useState("");
  const [smsUnitId, setSmsUnitId] = useState("");
  const [smsClassId, setSmsClassId] = useState("");
  const [smsTo, setSmsTo] = useState("");
  const [smsBusy, setSmsBusy] = useState(false);
  const [smsConfigBusy, setSmsConfigBusy] = useState(false);
  const [smsProviderDraft, setSmsProviderDraft] = useState<"console" | "http">(
    "console",
  );
  const [smsEnabledDraft, setSmsEnabledDraft] = useState(false);
  const [smsApiUrlDraft, setSmsApiUrlDraft] = useState("");
  const [smsFromDraft, setSmsFromDraft] = useState("");
  const [smsApiKeyConfigured, setSmsApiKeyConfigured] = useState(false);

  const loadList = () => {
    setLoading(true);
    api
      .getCommunications()
      .then(setItems)
      .catch((err) =>
        setMessage(
          err instanceof Error
            ? err.message
            : "Não foi possível carregar os comunicados.",
        ),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (needsLogin) return;
    loadList();
    // Segmentos: unidades/serviços são públicos; turmas/alunos podem estar
    // restritos a alguns perfis — carregar de forma tolerante a falhas.
    api.getUnits().then(setUnits).catch(() => setUnits([]));
    api.getServices().then(setServices).catch(() => setServices([]));
    api.getClasses().then(setClasses).catch(() => setClasses([]));
    api.getStudents().then(setStudents).catch(() => setStudents([]));
    if (canManage) {
      api.getSmsStatus().then(setSmsStatus).catch(() => setSmsStatus(null));
      api.getSmsLogs(20).then(setSmsLogs).catch(() => setSmsLogs([]));
      api
        .getPlatformSettings()
        .then((settings) => {
          setSmsProviderDraft(
            settings.smsProvider === "http" ? "http" : "console",
          );
          setSmsEnabledDraft(settings.smsEnabled);
          setSmsApiUrlDraft(settings.smsApiUrl ?? "");
          setSmsFromDraft(settings.smsFrom ?? "");
          setSmsApiKeyConfigured(Boolean(settings.smsApiKeyConfigured));
        })
        .catch(() => {
          setSmsProviderDraft("console");
          setSmsEnabledDraft(false);
          setSmsApiUrlDraft("");
          setSmsFromDraft("");
          setSmsApiKeyConfigured(false);
        });
    }
  }, [needsLogin, canManage]);

  const refreshSms = () => {
    api.getSmsStatus().then(setSmsStatus).catch(() => setSmsStatus(null));
    api.getSmsLogs(20).then(setSmsLogs).catch(() => setSmsLogs([]));
  };

  const saveSmsConfig = async () => {
    setSmsConfigBusy(true);
    setMessage("");
    try {
      const settings = await api.updatePlatformSettings({
        smsProvider: smsProviderDraft,
        smsEnabled: smsEnabledDraft,
        smsApiUrl: smsApiUrlDraft.trim() || null,
        smsFrom: smsFromDraft.trim() || null,
      });
      setSmsProviderDraft(settings.smsProvider === "http" ? "http" : "console");
      setSmsEnabledDraft(settings.smsEnabled);
      setSmsApiUrlDraft(settings.smsApiUrl ?? "");
      setSmsFromDraft(settings.smsFrom ?? "");
      setSmsApiKeyConfigured(Boolean(settings.smsApiKeyConfigured));
      setMessage("Configuração SMS guardada.");
      refreshSms();
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : "Não foi possível guardar a configuração SMS.",
      );
    } finally {
      setSmsConfigBusy(false);
    }
  };

  const sendManualSms = async () => {
    if (!smsBody.trim()) {
      setMessage("Indique o texto do SMS.");
      return;
    }
    if (!smsTo.trim() && !smsUnitId && !smsClassId) {
      setMessage("Indique um número, uma unidade ou uma turma.");
      return;
    }
    setSmsBusy(true);
    setMessage("");
    try {
      const result = await api.sendSms({
        body: smsBody.trim(),
        to: smsTo.trim() || null,
        unitId: smsUnitId || null,
        classGroupId: smsClassId || null,
      });
      setMessage(
        `SMS: ${result.count} envio(s) — ${result.info.message}`,
      );
      setSmsBody("");
      refreshSms();
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Não foi possível enviar o SMS.",
      );
    } finally {
      setSmsBusy(false);
    }
  };

  const sendCommSms = async (item: Communication) => {
    setSmsBusy(true);
    setMessage("");
    try {
      const result = await api.sendSmsFromCommunication(item.id);
      setMessage(
        `SMS do comunicado «${item.title}»: ${result.count} envio(s) — ${result.info.message}`,
      );
      refreshSms();
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Não foi possível enviar o SMS.",
      );
    } finally {
      setSmsBusy(false);
    }
  };

  if (needsLogin) {
    return (
      <Card>
        <CardContent className="space-y-4 p-8">
          <h1 className="text-2xl font-bold">Comunicados</h1>
          <p className="text-muted-foreground">
            Inicie sessão para criar e gerir os comunicados às famílias.
          </p>
          <Button onClick={onLogin}>Entrar</Button>
        </CardContent>
      </Card>
    );
  }

  const resetForm = () => {
    setForm(emptyComunicadoForm);
    setEditingId(null);
  };

  const startEdit = (item: Communication) => {
    setEditingId(item.id);
    const guardianStudent =
      item.audience === "ENCARREGADO"
        ? students.find(
            (s) =>
              s.guardianEmail.toLowerCase() ===
              (item.targetGuardianEmail || "").toLowerCase(),
          )
        : undefined;
    setForm({
      title: item.title,
      body: item.body,
      audience: item.audience,
      unitId: item.unitId ?? "",
      serviceId: item.serviceId ?? "",
      classGroupId: item.classGroupId ?? "",
      guardianStudentId: guardianStudent?.id ?? "",
      attachmentUrl: item.attachmentUrl ?? "",
      sendEmail: false,
    });
    setMessage("");
  };

  const buildPayload = (
    status: "RASCUNHO" | "PUBLICADO",
  ): CommunicationPayload | null => {
    if (!form.title.trim() || !form.body.trim()) {
      setMessage("Indique o título e o conteúdo do comunicado.");
      return null;
    }
    const payload: CommunicationPayload = {
      title: form.title.trim(),
      body: form.body.trim(),
      audience: form.audience,
      status,
      attachmentUrl: form.attachmentUrl.trim() || null,
      sendEmail: status === "PUBLICADO" ? form.sendEmail : false,
      unitId: null,
      serviceId: null,
      classGroupId: null,
      targetUserId: null,
      targetGuardianEmail: null,
    };
    if (form.audience === "UNIDADE") {
      if (!form.unitId) {
        setMessage("Seleccione a unidade de destino.");
        return null;
      }
      payload.unitId = form.unitId;
    } else if (form.audience === "SERVICO") {
      if (!form.serviceId) {
        setMessage("Seleccione o serviço de destino.");
        return null;
      }
      payload.serviceId = form.serviceId;
    } else if (form.audience === "TURMA") {
      if (!form.classGroupId) {
        setMessage("Seleccione a turma de destino.");
        return null;
      }
      payload.classGroupId = form.classGroupId;
    } else if (form.audience === "ENCARREGADO") {
      const student = students.find((s) => s.id === form.guardianStudentId);
      if (!student) {
        setMessage("Seleccione o encarregado/aluno de destino.");
        return null;
      }
      payload.targetGuardianEmail = student.guardianEmail;
    }
    return payload;
  };

  const submit = async (status: "RASCUNHO" | "PUBLICADO") => {
    const payload = buildPayload(status);
    if (!payload) return;
    setSaving(true);
    setMessage("");
    try {
      if (editingId) {
        await api.updateCommunication(editingId, payload);
        setMessage("Comunicado actualizado.");
      } else {
        await api.createCommunication(payload);
        setMessage(
          status === "PUBLICADO"
            ? form.sendEmail
              ? "Comunicado publicado (com envio de email)."
              : "Comunicado publicado."
            : "Rascunho guardado.",
        );
      }
      resetForm();
      loadList();
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : "Não foi possível guardar o comunicado.",
      );
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (item: Communication) => {
    try {
      if (item.status === "PUBLICADO") {
        await api.unpublishCommunication(item.id);
      } else {
        await api.publishCommunication(item.id, {
          sendEmail: form.sendEmail,
        });
      }
      loadList();
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Não foi possível actualizar.",
      );
    }
  };

  const remove = async (item: Communication) => {
    if (!window.confirm(`Remover o comunicado "${item.title}"?`)) return;
    try {
      await api.deleteCommunication(item.id);
      if (editingId === item.id) resetForm();
      loadList();
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Não foi possível remover.",
      );
    }
  };

  return (
    <div>
      <div className="mb-7">
        <p className="mb-2 text-sm font-medium text-secondary">COMUNICAÇÃO</p>
        <h1 className="text-3xl font-bold">Comunicados</h1>
        <p className="mt-2 text-muted-foreground">
          Crie mensagens para as famílias, escolha o público-alvo e publique.
          Os encarregados vêem os comunicados que lhes dizem respeito no portal.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {canManage && (
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">
                {editingId ? "Editar comunicado" : "Novo comunicado"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Título">
                <Input
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  placeholder="Ex.: Reunião de pais — 1.º período"
                />
              </Field>
              <Field label="Conteúdo">
                <Textarea
                  rows={6}
                  value={form.body}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, body: e.target.value }))
                  }
                  placeholder="Escreva aqui a mensagem…"
                />
              </Field>
              <Field label="Público-alvo">
                <Select
                  value={form.audience}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      audience: v as CommunicationAudience,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AUDIENCE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              {form.audience === "UNIDADE" && (
                <Field label="Unidade">
                  <Select
                    value={form.unitId}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, unitId: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar unidade" />
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
              )}

              {form.audience === "SERVICO" && (
                <Field label="Serviço">
                  <Select
                    value={form.serviceId}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, serviceId: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar serviço" />
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
              )}

              {form.audience === "TURMA" && (
                <Field label="Turma">
                  <Select
                    value={form.classGroupId}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, classGroupId: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar turma" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} · {c.room.name} · {c.room.unit.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {classes.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Sem turmas disponíveis para o seu perfil.
                    </p>
                  )}
                </Field>
              )}

              {form.audience === "ENCARREGADO" && (
                <Field label="Encarregado (por aluno)">
                  <Select
                    value={form.guardianStudentId}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, guardianStudentId: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar aluno" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.childFullName} — {s.guardianEmail}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {students.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Sem alunos disponíveis para o seu perfil.
                    </p>
                  )}
                </Field>
              )}

              <Field label="Anexo (URL opcional)">
                <Input
                  value={form.attachmentUrl}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, attachmentUrl: e.target.value }))
                  }
                  placeholder="https://…"
                />
              </Field>

              <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Enviar também por email</p>
                  <p className="text-xs text-muted-foreground">
                    Ao publicar, notifica os encarregados do público-alvo. Se o
                    SMTP não estiver configurado, a publicação continua.
                  </p>
                </div>
                <Switch
                  checked={form.sendEmail}
                  onCheckedChange={(checked) =>
                    setForm((f) => ({ ...f, sendEmail: checked }))
                  }
                />
              </div>

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
                  {saving ? "A guardar…" : "Publicar"}
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
            <CardTitle className="text-lg">Comunicados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!canManage && message && (
              <p className="text-sm text-muted-foreground">{message}</p>
            )}
            {loading ? (
              <p className="text-sm text-muted-foreground">A carregar…</p>
            ) : items.length === 0 ? (
              <p className="rounded-lg border p-5 text-sm text-muted-foreground">
                Ainda não existem comunicados.
              </p>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="space-y-2 rounded-lg border p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{item.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {communicationAudienceLabel(item)}
                        {item.author ? ` · ${item.author.name}` : ""}
                        {item.publishedAt
                          ? ` · ${format(parseISO(item.publishedAt), "dd/MM/yyyy", { locale: pt })}`
                          : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={
                          item.status === "PUBLICADO" ? "default" : "secondary"
                        }
                      >
                        {communicationStatusLabel(item.status)}
                      </Badge>
                      {typeof item._count?.reads === "number" && (
                        <Badge variant="outline">
                          {item._count.reads} lido(s)
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="whitespace-pre-line text-sm text-muted-foreground">
                    {item.body}
                  </p>
                  {item.attachmentUrl && (
                    <a
                      className="inline-flex items-center gap-2 text-sm text-primary underline-offset-2 hover:underline"
                      href={item.attachmentUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <FileText className="h-4 w-4" />
                      Anexo
                    </a>
                  )}
                  {canManage && (
                    <div className="flex flex-wrap gap-2 pt-1">
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
                        onClick={() => startEdit(item)}
                      >
                        <Pencil className="mr-1 h-3.5 w-3.5" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => sendCommSms(item)}
                        disabled={smsBusy}
                      >
                        <Send className="mr-1 h-3.5 w-3.5" />
                        Enviar SMS
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

      {canManage && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Enviar SMS</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border p-3">
              <div className="mb-2 flex items-center gap-2">
                <Badge
                  variant={smsStatus?.mode === "live" ? "default" : "secondary"}
                >
                  {smsStatus?.statusLabel ||
                    (smsStatus?.mode === "live"
                      ? "Fornecedor activo"
                      : "Simulação")}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {smsStatus?.provider || "console"}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {smsStatus?.message ||
                  "O envio SMS usa simulação quando não existir configuração activa."}
              </p>
            </div>

            <div className="space-y-3 rounded-lg border p-4">
              <p className="text-sm font-medium">Configuração do fornecedor SMS</p>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Fornecedor">
                  <Select
                    value={smsProviderDraft}
                    onValueChange={(v) =>
                      setSmsProviderDraft(v === "http" ? "http" : "console")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="console">Simulação (console)</SelectItem>
                      <SelectItem value="http">Gateway HTTP</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Envio activo">
                  <div className="flex h-10 items-center rounded-md border px-3">
                    <Switch
                      checked={smsEnabledDraft}
                      onCheckedChange={setSmsEnabledDraft}
                    />
                    <span className="ml-3 text-sm">
                      {smsEnabledDraft ? "Activo" : "Desactivado"}
                    </span>
                  </div>
                </Field>
                <Field label="URL da API (opcional)">
                  <Input
                    value={smsApiUrlDraft}
                    onChange={(e) => setSmsApiUrlDraft(e.target.value)}
                    placeholder="https://api.fornecedor.exemplo/sms"
                  />
                </Field>
                <Field label="Remetente/From (opcional)">
                  <Input
                    value={smsFromDraft}
                    onChange={(e) => setSmsFromDraft(e.target.value)}
                    placeholder="BetteryouKids"
                  />
                </Field>
              </div>
              <p className="text-xs text-muted-foreground">
                Chave API SMS: {smsApiKeyConfigured ? "configurada" : "não configurada"} (por variável de ambiente no servidor).
              </p>
              <Button
                variant="outline"
                onClick={saveSmsConfig}
                disabled={smsConfigBusy}
              >
                {smsConfigBusy ? "A guardar…" : "Guardar configuração SMS"}
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Field label="Texto">
                <Textarea
                  rows={3}
                  value={smsBody}
                  onChange={(e) => setSmsBody(e.target.value)}
                  placeholder="Mensagem curta para os encarregados…"
                />
              </Field>
              <Field label="Número (opcional)">
                <Input
                  value={smsTo}
                  onChange={(e) => setSmsTo(e.target.value)}
                  placeholder="+244…"
                />
              </Field>
              <Field label="Unidade">
                <Select
                  value={smsUnitId || "none"}
                  onValueChange={(v) => setSmsUnitId(v === "none" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas / nenhuma" />
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
              <Field label="Turma">
                <Select
                  value={smsClassId || "none"}
                  onValueChange={(v) => setSmsClassId(v === "none" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Opcional" />
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
            </div>
            <Button onClick={sendManualSms} disabled={smsBusy}>
              {smsBusy ? "A enviar…" : "Enviar SMS"}
            </Button>
            {smsLogs.length > 0 && (
              <div className="space-y-2 border-t pt-4">
                <p className="text-sm font-medium">Últimos envios</p>
                {smsLogs.slice(0, 8).map((log) => (
                  <div
                    key={log.id}
                    className="rounded-lg border p-3 text-xs text-muted-foreground"
                  >
                    <span className="font-medium text-foreground">{log.to}</span>
                    {" · "}
                    {log.status}
                    {" · "}
                    {log.provider}
                    <p className="mt-1 line-clamp-2">{log.body}</p>
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
