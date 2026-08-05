import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { api } from "@/lib/api";
import {
  ADMISSION_SERVICES,
  buildDefaultAdmissionFormConfig,
  newQuestionId,
  type AdmissionFormConfig,
  type AdmissionFormMode,
  type AdmissionQuestion,
  type AdmissionQuestionType,
  type AdmissionServiceKey,
} from "@/lib/admission-form";

const TYPES: Array<{ value: AdmissionQuestionType; label: string }> = [
  { value: "text", label: "Texto" },
  { value: "textarea", label: "Texto longo" },
  { value: "yesno", label: "Sim / Não" },
  { value: "select", label: "Lista de opções" },
  { value: "date", label: "Data" },
];

const emptyDraft = (): AdmissionQuestion => ({
  id: newQuestionId("new"),
  key: "",
  label: "",
  type: "text",
  required: true,
  section: "Geral",
  sortOrder: 0,
  options: [],
  hint: "",
});

export function AdmissionQuestionsAdmin() {
  const [config, setConfig] = useState<AdmissionFormConfig>(() =>
    buildDefaultAdmissionFormConfig(),
  );
  const [mode, setMode] = useState<AdmissionFormMode>("enrollment");
  const [service, setService] = useState<AdmissionServiceKey>("Creche");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState<AdmissionQuestion | null>(null);
  const [isNew, setIsNew] = useState(false);

  const questions = useMemo(
    () =>
      [...(config[mode][service] ?? [])].sort(
        (a, b) => a.sortOrder - b.sortOrder,
      ),
    [config, mode, service],
  );

  const load = () => {
    setLoading(true);
    api
      .getAdmissionFormConfigAdmin()
      .then(setConfig)
      .catch(() => setConfig(buildDefaultAdmissionFormConfig()))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const updateList = (list: AdmissionQuestion[]) => {
    setConfig((current) => ({
      ...current,
      [mode]: {
        ...current[mode],
        [service]: list.map((item, index) => ({
          ...item,
          sortOrder: index,
        })),
      },
    }));
  };

  const saveAll = async () => {
    setSaving(true);
    setMessage("");
    try {
      const saved = await api.updateAdmissionFormConfig(config);
      setConfig(saved);
      setMessage("Perguntas guardadas com sucesso.");
      setEditing(null);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível guardar as perguntas.",
      );
    } finally {
      setSaving(false);
    }
  };

  const resetDefaults = async () => {
    if (
      !window.confirm(
        "Repor as perguntas padrão de todos os tipos de ensino? As alterações actuais serão perdidas.",
      )
    ) {
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const saved = await api.resetAdmissionFormConfig();
      setConfig(saved);
      setMessage("Perguntas padrão restauradas.");
      setEditing(null);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível restaurar as perguntas.",
      );
    } finally {
      setSaving(false);
    }
  };

  const move = (index: number, direction: -1 | 1) => {
    const next = [...questions];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    const tmp = next[index];
    next[index] = next[target];
    next[target] = tmp;
    updateList(next);
  };

  const remove = (id: string) => {
    if (!window.confirm("Remover esta pergunta?")) return;
    updateList(questions.filter((item) => item.id !== id));
    if (editing?.id === id) setEditing(null);
  };

  const startAdd = () => {
    setIsNew(true);
    setEditing({
      ...emptyDraft(),
      sortOrder: questions.length,
      key: `campo_${questions.length + 1}`,
      label: "Nova pergunta",
    });
  };

  const startEdit = (question: AdmissionQuestion) => {
    setIsNew(false);
    setEditing({
      ...question,
      options: question.options ? [...question.options] : [],
    });
  };

  const applyDraft = () => {
    if (!editing) return;
    const label = editing.label.trim();
    const key = editing.key.trim().replace(/\s+/g, "_");
    if (!label || !key) {
      setMessage("A pergunta precisa de título e chave interna.");
      return;
    }
    const normalized: AdmissionQuestion = {
      ...editing,
      label,
      key,
      section: editing.section.trim() || "Geral",
      options:
        editing.type === "select"
          ? (editing.options ?? []).map((o) => o.trim()).filter(Boolean)
          : undefined,
      hint: editing.hint?.trim() || undefined,
      showIfKey: editing.showIfKey?.trim() || undefined,
      showIfValue: editing.showIfValue?.trim() || undefined,
    };
    if (isNew) {
      updateList([...questions, normalized]);
    } else {
      updateList(
        questions.map((item) =>
          item.id === normalized.id ? normalized : item,
        ),
      );
    }
    setEditing(null);
    setIsNew(false);
    setMessage("Alteração aplicada na lista. Clique em Guardar para publicar.");
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-sm font-medium text-secondary">ADMISSÕES</p>
        <h2 className="text-2xl font-bold">Perguntas por tipo de ensino</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Adicione, edite ou remova perguntas dos formulários de inscrição e
          renovação. As alterações passam a valer no site após Guardar.
        </p>
      </div>

      {message && (
        <p
          className={`rounded-lg p-3 text-sm ${
            message.toLowerCase().includes("não")
              ? "bg-destructive/10 text-destructive"
              : "bg-green/10 text-green"
          }`}
        >
          {message}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Seleccionar formulário</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Modo</span>
            <Select
              value={mode}
              onValueChange={(v) => setMode(v as AdmissionFormMode)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="enrollment">Nova inscrição</SelectItem>
                <SelectItem value="renewal">Renovação</SelectItem>
              </SelectContent>
            </Select>
          </label>
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Tipo de ensino</span>
            <Select
              value={service}
              onValueChange={(v) => setService(v as AdmissionServiceKey)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ADMISSION_SERVICES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <Button type="button" onClick={startAdd}>
              <Plus className="mr-1 h-4 w-4" />
              Adicionar pergunta
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={saving || loading}
              onClick={saveAll}
            >
              {saving ? "A guardar..." : "Guardar"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={saving}
              onClick={resetDefaults}
            >
              Restaurar padrão
            </Button>
          </div>
        </CardContent>
      </Card>

      {editing && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-lg">
              {isNew ? "Nova pergunta" : "Editar pergunta"}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5 text-sm sm:col-span-2">
              <span className="font-medium">Título da pergunta</span>
              <Input
                value={editing.label}
                onChange={(e) =>
                  setEditing({ ...editing, label: e.target.value })
                }
              />
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium">Chave interna</span>
              <Input
                value={editing.key}
                onChange={(e) =>
                  setEditing({ ...editing, key: e.target.value })
                }
                placeholder="ex.: preferredSchedule"
              />
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium">Secção</span>
              <Input
                value={editing.section}
                onChange={(e) =>
                  setEditing({ ...editing, section: e.target.value })
                }
              />
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium">Tipo</span>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={editing.type}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    type: e.target.value as AdmissionQuestionType,
                  })
                }
              >
                {TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={editing.required}
                onChange={(e) =>
                  setEditing({ ...editing, required: e.target.checked })
                }
              />
              Obrigatória
            </label>
            {editing.type === "select" && (
              <label className="block space-y-1.5 text-sm sm:col-span-2">
                <span className="font-medium">Opções (uma por linha)</span>
                <Textarea
                  rows={4}
                  value={(editing.options ?? []).join("\n")}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      options: e.target.value.split("\n"),
                    })
                  }
                />
              </label>
            )}
            <label className="block space-y-1.5 text-sm sm:col-span-2">
              <span className="font-medium">Ajuda / nota</span>
              <Input
                value={editing.hint ?? ""}
                onChange={(e) =>
                  setEditing({ ...editing, hint: e.target.value })
                }
              />
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium">Mostrar se chave</span>
              <Input
                value={editing.showIfKey ?? ""}
                onChange={(e) =>
                  setEditing({ ...editing, showIfKey: e.target.value })
                }
                placeholder="ex.: siblings"
              />
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium">Mostrar se valor</span>
              <Input
                value={editing.showIfValue ?? ""}
                onChange={(e) =>
                  setEditing({ ...editing, showIfValue: e.target.value })
                }
                placeholder="ex.: Sim"
              />
            </label>
            <div className="flex flex-wrap gap-2 sm:col-span-2">
              <Button type="button" onClick={applyDraft}>
                Aplicar na lista
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditing(null);
                  setIsNew(false);
                }}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {mode === "enrollment" ? "Inscrição" : "Renovação"} · {service} (
            {questions.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <p className="p-5 text-sm text-muted-foreground">A carregar...</p>
          ) : questions.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">
              Ainda não há perguntas neste formulário.
            </p>
          ) : (
            <div className="divide-y">
              {questions.map((question, index) => (
                <div
                  key={question.id}
                  className="flex flex-wrap items-start justify-between gap-3 p-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{question.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {question.section} · {question.type}
                      {question.required ? " · obrigatória" : " · opcional"} ·{" "}
                      {question.key}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => move(index, -1)}
                      disabled={index === 0}
                      aria-label="Subir"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => move(index, 1)}
                      disabled={index === questions.length - 1}
                      aria-label="Descer"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => startEdit(question)}
                    >
                      <Pencil className="mr-1 h-3.5 w-3.5" />
                      Editar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => remove(question.id)}
                      aria-label="Remover"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
