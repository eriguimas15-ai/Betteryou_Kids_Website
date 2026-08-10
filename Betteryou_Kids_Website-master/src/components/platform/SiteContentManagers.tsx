import { useEffect, useState } from "react";
import { Pencil, Plus, Send, Trash2, Upload } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { api, uploadPublicUrl } from "@/lib/api";
import {
  CMS_ACTIVIDADES_SECTION,
  CMS_ACTIVIDADES_SLUG,
  CMS_ICON_OPTIONS,
  CMS_JORNADA_SECTION,
  CMS_JORNADA_SLUG,
  CMS_SERVICOS_SECTION,
  CMS_SERVICOS_SLUG,
  CMS_THEME_COLOR_OPTIONS,
  DEFAULT_CMS_ACTIVITIES,
  DEFAULT_CMS_JOURNEY,
  DEFAULT_CMS_SERVICES,
  createEmptyActivityCard,
  createEmptyJourneyItem,
  createEmptyServiceCard,
  parseActivitiesJson,
  parseJourneyJson,
  parseServicesJson,
  sectionValue,
  type CmsActivityCard,
  type CmsIconName,
  type CmsJourneyItem,
  type CmsServiceCard,
  type CmsThemeColor,
} from "@/lib/site-content-cms";

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

function StatusPill({ status }: { status: string }) {
  const label =
    status === "PUBLICADO"
      ? "Publicado"
      : status === "EM_REVISAO"
        ? "Em revisão"
        : status === "ARQUIVADO"
          ? "Arquivado"
          : "Rascunho";
  return (
    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
      {label}
    </span>
  );
}

function IconColorSelects({
  icon,
  color,
  onIcon,
  onColor,
}: {
  icon: CmsIconName;
  color: CmsThemeColor;
  onIcon: (v: CmsIconName) => void;
  onColor: (v: CmsThemeColor) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Ícone">
        <Select value={icon} onValueChange={(v) => onIcon(v as CmsIconName)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CMS_ICON_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Cor">
        <Select
          value={color}
          onValueChange={(v) => onColor(v as CmsThemeColor)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CMS_THEME_COLOR_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </div>
  );
}

export function JourneyManager() {
  const [items, setItems] = useState<CmsJourneyItem[]>(
    DEFAULT_CMS_JOURNEY.map((i) => ({ ...i })),
  );
  const [status, setStatus] = useState("RASCUNHO");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    api
      .getCmsPage(CMS_JORNADA_SLUG)
      .then((page) => {
        setStatus(page.status || "RASCUNHO");
        const parsed = parseJourneyJson(
          sectionValue(page, CMS_JORNADA_SECTION),
        );
        setItems(
          parsed?.length
            ? parsed
            : DEFAULT_CMS_JOURNEY.map((i) => ({ ...i })),
        );
      })
      .catch(() => {
        setStatus("RASCUNHO");
        setItems(DEFAULT_CMS_JOURNEY.map((i) => ({ ...i })));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (nextItems: CmsJourneyItem[], notice: string) => {
    setLoading(true);
    setMessage("");
    try {
      const page = await api.saveCmsPage(CMS_JORNADA_SLUG, {
        title: "Sobre / Nossa Jornada",
        sections: [
          {
            key: CMS_JORNADA_SECTION,
            label: "Marcos da jornada",
            value: JSON.stringify(nextItems),
          },
        ],
      });
      setStatus(page.status || status);
      setItems(nextItems);
      setMessage(notice);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Erro ao guardar.");
    } finally {
      setLoading(false);
    }
  };

  const editing = items.find((i) => i.id === editingId) || null;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-lg">Nossa Jornada</CardTitle>
          <StatusPill status={status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Visualize, edite, adicione ou remova marcos da história no Sobre.
          Depois publique para aparecer no site.
        </p>

        {editing && (
          <div className="space-y-3 rounded-lg border p-4">
            <p className="text-sm font-medium">
              {editing.title.trim() ? `Editar: ${editing.title}` : "Novo marco"}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Ano">
                <Input
                  value={editing.year}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((i) =>
                        i.id === editing.id
                          ? { ...i, year: e.target.value }
                          : i,
                      ),
                    )
                  }
                />
              </Field>
              <Field label="Título">
                <Input
                  value={editing.title}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((i) =>
                        i.id === editing.id
                          ? { ...i, title: e.target.value }
                          : i,
                      ),
                    )
                  }
                />
              </Field>
            </div>
            <Field label="Descrição">
              <Textarea
                rows={3}
                value={editing.description}
                onChange={(e) =>
                  setItems((prev) =>
                    prev.map((i) =>
                      i.id === editing.id
                        ? { ...i, description: e.target.value }
                        : i,
                    ),
                  )
                }
              />
            </Field>
            <IconColorSelects
              icon={editing.icon}
              color={editing.color}
              onIcon={(icon) =>
                setItems((prev) =>
                  prev.map((i) => (i.id === editing.id ? { ...i, icon } : i)),
                )
              }
              onColor={(color) =>
                setItems((prev) =>
                  prev.map((i) => (i.id === editing.id ? { ...i, color } : i)),
                )
              }
            />
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={loading}
                onClick={async () => {
                  if (!editing.title.trim() || !editing.year.trim()) {
                    setMessage("Indique o ano e o título.");
                    return;
                  }
                  await save(items, "Jornada guardada.");
                  setEditingId(null);
                }}
              >
                Guardar marco
              </Button>
              <Button
                variant="ghost"
                disabled={loading}
                onClick={() => setEditingId(null)}
              >
                Fechar
              </Button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            disabled={loading}
            onClick={() => {
              const created = createEmptyJourneyItem();
              setItems((prev) => [...prev, created]);
              setEditingId(created.id);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar marco
          </Button>
          <Button
            disabled={loading}
            onClick={() => save(items, "Jornada guardada.")}
          >
            Guardar tudo
          </Button>
          {status !== "EM_REVISAO" && status !== "PUBLICADO" && (
            <Button
              variant="outline"
              disabled={loading}
              onClick={async () => {
                setLoading(true);
                try {
                  await save(items, "");
                  await api.submitCmsPage(CMS_JORNADA_SLUG);
                  setStatus("EM_REVISAO");
                  setMessage("Submetido para revisão.");
                } catch (err) {
                  setMessage(
                    err instanceof Error ? err.message : "Erro ao submeter.",
                  );
                } finally {
                  setLoading(false);
                }
              }}
            >
              <Send className="mr-2 h-4 w-4" />
              Rever
            </Button>
          )}
          {status !== "PUBLICADO" && (
            <Button
              variant="secondary"
              disabled={loading}
              onClick={async () => {
                setLoading(true);
                try {
                  await save(items, "");
                  await api.publishCmsPage(CMS_JORNADA_SLUG);
                  setStatus("PUBLICADO");
                  setMessage("Jornada publicada no site.");
                } catch (err) {
                  setMessage(
                    err instanceof Error ? err.message : "Erro ao publicar.",
                  );
                } finally {
                  setLoading(false);
                }
              }}
            >
              Publicar
            </Button>
          )}
        </div>

        {message && <p className="text-sm text-muted-foreground">{message}</p>}

        <div className="divide-y rounded-lg border">
          {items.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">
              Ainda não há marcos na jornada.
            </p>
          )}
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-start justify-between gap-3 p-4"
            >
              <div>
                <p className="font-semibold">
                  {item.year} — {item.title || "(sem título)"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {item.description || "Sem descrição"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Ícone {item.icon} · Cor {item.color}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingId(item.id)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={loading}
                  onClick={async () => {
                    if (!window.confirm("Remover este marco da jornada?"))
                      return;
                    const next = items.filter((i) => i.id !== item.id);
                    if (editingId === item.id) setEditingId(null);
                    await save(next, "Marco removido.");
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function ServicesContentManager() {
  const [items, setItems] = useState<CmsServiceCard[]>(
    DEFAULT_CMS_SERVICES.map((i) => ({ ...i, features: [...i.features] })),
  );
  const [status, setStatus] = useState("RASCUNHO");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    api
      .getCmsPage(CMS_SERVICOS_SLUG)
      .then((page) => {
        setStatus(page.status || "RASCUNHO");
        const parsed = parseServicesJson(
          sectionValue(page, CMS_SERVICOS_SECTION),
        );
        setItems(
          parsed?.length
            ? parsed
            : DEFAULT_CMS_SERVICES.map((i) => ({
                ...i,
                features: [...i.features],
              })),
        );
      })
      .catch(() => {
        setStatus("RASCUNHO");
        setItems(
          DEFAULT_CMS_SERVICES.map((i) => ({
            ...i,
            features: [...i.features],
          })),
        );
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (nextItems: CmsServiceCard[], notice: string) => {
    setLoading(true);
    setMessage("");
    try {
      const page = await api.saveCmsPage(CMS_SERVICOS_SLUG, {
        title: "Serviços",
        sections: [
          {
            key: CMS_SERVICOS_SECTION,
            label: "Cartões de serviços",
            value: JSON.stringify(nextItems),
          },
        ],
      });
      setStatus(page.status || status);
      setItems(nextItems);
      setMessage(notice);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Erro ao guardar.");
    } finally {
      setLoading(false);
    }
  };

  const editing = items.find((i) => i.id === editingId) || null;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-lg">Serviços (site)</CardTitle>
          <StatusPill status={status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Conteúdo da página Serviços: ver, editar, adicionar ou remover
          cartões. Publique para actualizar o site.
        </p>

        {editing && (
          <div className="space-y-3 rounded-lg border p-4">
            <p className="text-sm font-medium">
              {editing.title.trim()
                ? `Editar: ${editing.title}`
                : "Novo serviço"}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Título">
                <Input
                  value={editing.title}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((i) =>
                        i.id === editing.id
                          ? { ...i, title: e.target.value }
                          : i,
                      ),
                    )
                  }
                />
              </Field>
              <Field label="Faixa etária">
                <Input
                  value={editing.ageRange}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((i) =>
                        i.id === editing.id
                          ? { ...i, ageRange: e.target.value }
                          : i,
                      ),
                    )
                  }
                  placeholder="Ex.: 1-3 anos"
                />
              </Field>
            </div>
            <Field label="Descrição">
              <Textarea
                rows={3}
                value={editing.description}
                onChange={(e) =>
                  setItems((prev) =>
                    prev.map((i) =>
                      i.id === editing.id
                        ? { ...i, description: e.target.value }
                        : i,
                    ),
                  )
                }
              />
            </Field>
            <Field label="Características (uma por linha)">
              <Textarea
                rows={5}
                value={editing.features.join("\n")}
                onChange={(e) =>
                  setItems((prev) =>
                    prev.map((i) =>
                      i.id === editing.id
                        ? {
                            ...i,
                            features: e.target.value.split(/\r?\n/),
                          }
                        : i,
                    ),
                  )
                }
              />
            </Field>
            <IconColorSelects
              icon={editing.icon}
              color={editing.color}
              onIcon={(icon) =>
                setItems((prev) =>
                  prev.map((i) => (i.id === editing.id ? { ...i, icon } : i)),
                )
              }
              onColor={(color) =>
                setItems((prev) =>
                  prev.map((i) => (i.id === editing.id ? { ...i, color } : i)),
                )
              }
            />
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={loading}
                onClick={async () => {
                  if (!editing.title.trim()) {
                    setMessage("Indique o título do serviço.");
                    return;
                  }
                  const cleaned = items.map((i) =>
                    i.id === editing.id
                      ? {
                          ...i,
                          features: i.features
                            .map((f) => f.trim())
                            .filter(Boolean),
                        }
                      : i,
                  );
                  await save(cleaned, "Serviços guardados.");
                  setEditingId(null);
                }}
              >
                Guardar serviço
              </Button>
              <Button
                variant="ghost"
                disabled={loading}
                onClick={() => setEditingId(null)}
              >
                Fechar
              </Button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            disabled={loading}
            onClick={() => {
              const created = createEmptyServiceCard();
              setItems((prev) => [...prev, created]);
              setEditingId(created.id);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar serviço
          </Button>
          <Button
            disabled={loading}
            onClick={() =>
              save(
                items.map((i) => ({
                  ...i,
                  features: i.features.map((f) => f.trim()).filter(Boolean),
                })),
                "Serviços guardados.",
              )
            }
          >
            Guardar tudo
          </Button>
          {status !== "EM_REVISAO" && status !== "PUBLICADO" && (
            <Button
              variant="outline"
              disabled={loading}
              onClick={async () => {
                setLoading(true);
                try {
                  await save(items, "");
                  await api.submitCmsPage(CMS_SERVICOS_SLUG);
                  setStatus("EM_REVISAO");
                  setMessage("Submetido para revisão.");
                } catch (err) {
                  setMessage(
                    err instanceof Error ? err.message : "Erro ao submeter.",
                  );
                } finally {
                  setLoading(false);
                }
              }}
            >
              <Send className="mr-2 h-4 w-4" />
              Rever
            </Button>
          )}
          {status !== "PUBLICADO" && (
            <Button
              variant="secondary"
              disabled={loading}
              onClick={async () => {
                setLoading(true);
                try {
                  await save(items, "");
                  await api.publishCmsPage(CMS_SERVICOS_SLUG);
                  setStatus("PUBLICADO");
                  setMessage("Serviços publicados no site.");
                } catch (err) {
                  setMessage(
                    err instanceof Error ? err.message : "Erro ao publicar.",
                  );
                } finally {
                  setLoading(false);
                }
              }}
            >
              Publicar
            </Button>
          )}
        </div>

        {message && <p className="text-sm text-muted-foreground">{message}</p>}

        <div className="divide-y rounded-lg border">
          {items.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">
              Ainda não há serviços no site.
            </p>
          )}
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-start justify-between gap-3 p-4"
            >
              <div>
                <p className="font-semibold">
                  {item.title || "(sem título)"}{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    {item.ageRange}
                  </span>
                </p>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {item.description || "Sem descrição"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.features.length} característica(s) · {item.icon} ·{" "}
                  {item.color}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingId(item.id)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={loading}
                  onClick={async () => {
                    if (!window.confirm("Remover este serviço?")) return;
                    const next = items.filter((i) => i.id !== item.id);
                    if (editingId === item.id) setEditingId(null);
                    await save(next, "Serviço removido.");
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function ActivitiesContentManager() {
  const [items, setItems] = useState<CmsActivityCard[]>(
    DEFAULT_CMS_ACTIVITIES.map((i) => ({ ...i })),
  );
  const [status, setStatus] = useState("RASCUNHO");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    api
      .getCmsPage(CMS_ACTIVIDADES_SLUG)
      .then((page) => {
        setStatus(page.status || "RASCUNHO");
        const parsed = parseActivitiesJson(
          sectionValue(page, CMS_ACTIVIDADES_SECTION),
        );
        setItems(
          parsed?.length
            ? parsed
            : DEFAULT_CMS_ACTIVITIES.map((i) => ({ ...i })),
        );
      })
      .catch(() => {
        setStatus("RASCUNHO");
        setItems(DEFAULT_CMS_ACTIVITIES.map((i) => ({ ...i })));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (nextItems: CmsActivityCard[], notice: string) => {
    setLoading(true);
    setMessage("");
    try {
      const page = await api.saveCmsPage(CMS_ACTIVIDADES_SLUG, {
        title: "Actividades Extracurriculares",
        sections: [
          {
            key: CMS_ACTIVIDADES_SECTION,
            label: "Actividades do site",
            value: JSON.stringify(nextItems),
          },
        ],
      });
      setStatus(page.status || status);
      setItems(nextItems);
      setMessage(notice);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Erro ao guardar.");
    } finally {
      setLoading(false);
    }
  };

  const editing = items.find((i) => i.id === editingId) || null;

  const uploadImage = async (id: string, file: File) => {
    setUploadingId(id);
    setMessage("");
    try {
      const media = await api.uploadMedia(file, file.name, "actividades");
      const url = uploadPublicUrl(media.filePath);
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, imageUrl: url } : i)),
      );
      setMessage("Imagem carregada. Guarde para aplicar no site.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Upload falhou.");
    } finally {
      setUploadingId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-lg">Actividades Extracurriculares</CardTitle>
          <StatusPill status={status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Actividades da página /actividades: ver, editar, adicionar, remover e
          alterar imagens. Publique para actualizar o site.
        </p>

        {editing && (
          <div className="space-y-3 rounded-lg border p-4">
            <p className="text-sm font-medium">
              {editing.title.trim()
                ? `Editar: ${editing.title}`
                : "Nova actividade"}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Título">
                <Input
                  value={editing.title}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((i) =>
                        i.id === editing.id
                          ? { ...i, title: e.target.value }
                          : i,
                      ),
                    )
                  }
                />
              </Field>
              <Field label="Categoria">
                <Input
                  value={editing.category}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((i) =>
                        i.id === editing.id
                          ? { ...i, category: e.target.value }
                          : i,
                      ),
                    )
                  }
                  placeholder="Ex.: Artística"
                />
              </Field>
            </div>
            <Field label="Descrição">
              <Textarea
                rows={3}
                value={editing.description}
                onChange={(e) =>
                  setItems((prev) =>
                    prev.map((i) =>
                      i.id === editing.id
                        ? { ...i, description: e.target.value }
                        : i,
                    ),
                  )
                }
              />
            </Field>
            <IconColorSelects
              icon={editing.icon}
              color={editing.color}
              onIcon={(icon) =>
                setItems((prev) =>
                  prev.map((i) => (i.id === editing.id ? { ...i, icon } : i)),
                )
              }
              onColor={(color) =>
                setItems((prev) =>
                  prev.map((i) => (i.id === editing.id ? { ...i, color } : i)),
                )
              }
            />
            <Field label="Imagem">
              <div className="space-y-2">
                {editing.imageUrl ? (
                  <img
                    src={editing.imageUrl}
                    alt={editing.title || "Pré-visualização"}
                    className="h-28 w-full rounded-md object-cover"
                  />
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Sem imagem — o site usa uma imagem predefinida.
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted">
                    <Upload className="h-4 w-4" />
                    {uploadingId === editing.id
                      ? "A carregar…"
                      : "Carregar imagem"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingId === editing.id || loading}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        e.target.value = "";
                        if (file) void uploadImage(editing.id, file);
                      }}
                    />
                  </label>
                  {editing.imageUrl && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setItems((prev) =>
                          prev.map((i) =>
                            i.id === editing.id ? { ...i, imageUrl: "" } : i,
                          ),
                        )
                      }
                    >
                      Remover imagem
                    </Button>
                  )}
                </div>
              </div>
            </Field>
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={loading || uploadingId === editing.id}
                onClick={async () => {
                  if (!editing.title.trim()) {
                    setMessage("Indique o título da actividade.");
                    return;
                  }
                  await save(items, "Actividades guardadas.");
                  setEditingId(null);
                }}
              >
                Guardar actividade
              </Button>
              <Button
                variant="ghost"
                disabled={loading}
                onClick={() => setEditingId(null)}
              >
                Fechar
              </Button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            disabled={loading}
            onClick={() => {
              const created = createEmptyActivityCard();
              setItems((prev) => [...prev, created]);
              setEditingId(created.id);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar actividade
          </Button>
          <Button
            disabled={loading}
            onClick={() => save(items, "Actividades guardadas.")}
          >
            Guardar tudo
          </Button>
          {status !== "EM_REVISAO" && status !== "PUBLICADO" && (
            <Button
              variant="outline"
              disabled={loading}
              onClick={async () => {
                setLoading(true);
                try {
                  await save(items, "");
                  await api.submitCmsPage(CMS_ACTIVIDADES_SLUG);
                  setStatus("EM_REVISAO");
                  setMessage("Submetido para revisão.");
                } catch (err) {
                  setMessage(
                    err instanceof Error ? err.message : "Erro ao submeter.",
                  );
                } finally {
                  setLoading(false);
                }
              }}
            >
              <Send className="mr-2 h-4 w-4" />
              Rever
            </Button>
          )}
          {status !== "PUBLICADO" && (
            <Button
              variant="secondary"
              disabled={loading}
              onClick={async () => {
                setLoading(true);
                try {
                  await save(items, "");
                  await api.publishCmsPage(CMS_ACTIVIDADES_SLUG);
                  setStatus("PUBLICADO");
                  setMessage("Actividades publicadas no site.");
                } catch (err) {
                  setMessage(
                    err instanceof Error ? err.message : "Erro ao publicar.",
                  );
                } finally {
                  setLoading(false);
                }
              }}
            >
              Publicar
            </Button>
          )}
        </div>

        {message && <p className="text-sm text-muted-foreground">{message}</p>}

        <div className="divide-y rounded-lg border">
          {items.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">
              Ainda não há actividades no site.
            </p>
          )}
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-start justify-between gap-3 p-4"
            >
              <div className="flex min-w-0 flex-1 gap-3">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt=""
                    className="h-16 w-24 shrink-0 rounded object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded bg-muted text-xs text-muted-foreground">
                    Sem foto
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-semibold">
                    {item.title || "(sem título)"}{" "}
                    <span className="text-sm font-normal text-muted-foreground">
                      {item.category}
                    </span>
                  </p>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {item.description || "Sem descrição"}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingId(item.id)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={loading}
                  onClick={async () => {
                    if (!window.confirm("Remover esta actividade?")) return;
                    const next = items.filter((i) => i.id !== item.id);
                    if (editingId === item.id) setEditingId(null);
                    await save(next, "Actividade removida.");
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
