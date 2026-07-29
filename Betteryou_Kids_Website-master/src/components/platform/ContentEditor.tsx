import { useEffect, useState } from "react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import {
  Clock,
  Image as ImageIcon,
  Pencil,
  Plus,
  Send,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  api,
  uploadPublicUrl,
  type CmsPage,
  type ContentStatus,
  type GalleryAlbum,
  type GalleryItem,
  type MediaAsset,
  type PublicTestimonial,
  type Unit,
} from "@/lib/api";

const CONTENT_STATUS_META: Record<
  ContentStatus,
  { label: string; className: string }
> = {
  RASCUNHO: { label: "Rascunho", className: "bg-muted text-muted-foreground" },
  EM_REVISAO: {
    label: "Em revisão",
    className: "bg-amber-100 text-amber-800",
  },
  PUBLICADO: { label: "Publicado", className: "bg-green-100 text-green-800" },
  ARQUIVADO: { label: "Arquivado", className: "bg-red-100 text-red-800" },
};

function StatusPill({ status }: { status: string }) {
  const meta =
    CONTENT_STATUS_META[status as ContentStatus] ?? CONTENT_STATUS_META.RASCUNHO;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        meta.className,
      )}
    >
      {meta.label}
    </span>
  );
}

/** Converte o valor de <input datetime-local> em ISO (ou null). */
function toIsoOrNull(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/** Formata uma data ISO em texto PT curto. */
function formatScheduleLabel(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return format(date, "dd/MM/yyyy HH:mm", { locale: pt });
}

export function ContentEditor({
  needsLogin,
  onLogin,
}: {
  needsLogin: boolean;
  onLogin: () => void;
}) {
  const [title, setTitle] = useState("Home");
  const [heroTitle, setHeroTitle] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [heroTitleColor, setHeroTitleColor] = useState("");
  const [heroSubtitleColor, setHeroSubtitleColor] = useState("");
  const [cta, setCta] = useState("");
  const [pageStatus, setPageStatus] = useState<string>("RASCUNHO");
  const [pagePublishAt, setPagePublishAt] = useState("");
  const [allPages, setAllPages] = useState<CmsPage[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [testimonials, setTestimonials] = useState<PublicTestimonial[]>([]);
  const [testimonialUnits, setTestimonialUnits] = useState<Unit[]>([]);
  const [editingTestimonialId, setEditingTestimonialId] = useState<
    string | null
  >(null);
  const [testimonialForm, setTestimonialForm] = useState({
    authorName: "",
    text: "",
    unitName: "",
  });
  const [testimonialSchedule, setTestimonialSchedule] = useState<
    Record<string, string>
  >({});
  const [testimonialMessage, setTestimonialMessage] = useState("");
  const [testimonialLoading, setTestimonialLoading] = useState(false);
  const [testimonialActionId, setTestimonialActionId] = useState<string | null>(
    null,
  );
  const [jobMessage, setJobMessage] = useState("");

  const loadTestimonials = () =>
    api
      .getAdminTestimonials()
      .then(setTestimonials)
      .catch(() => setTestimonials([]));

  const loadAllPages = () =>
    api
      .getCmsPages()
      .then(setAllPages)
      .catch(() => setAllPages([]));

  const loadPage = () =>
    api
      .getCmsPage("home")
      .then((page) => {
        setTitle(page.title);
        setPageStatus(page.status || "RASCUNHO");
        setHeroTitle(
          page.sections.find((s) => s.key === "hero_title")?.value || "",
        );
        setHeroSubtitle(
          page.sections.find((s) => s.key === "hero_subtitle")?.value || "",
        );
        setHeroTitleColor(
          page.sections.find((s) => s.key === "title_color")?.value || "",
        );
        setHeroSubtitleColor(
          page.sections.find((s) => s.key === "subtitle_color")?.value || "",
        );
        setCta(page.sections.find((s) => s.key === "cta_primary")?.value || "");
      })
      .catch(() => setMessage("Não foi possível carregar o conteúdo."));

  useEffect(() => {
    if (needsLogin) return;
    loadPage();
    loadAllPages();
    loadTestimonials();
    api.getUnits().then(setTestimonialUnits).catch(() => setTestimonialUnits([]));
  }, [needsLogin]);

  const savePage = () =>
    api.saveCmsPage("home", {
      title,
      sections: [
        { key: "hero_title", label: "Título principal", value: heroTitle },
        { key: "hero_subtitle", label: "Subtítulo", value: heroSubtitle },
        { key: "title_color", label: "Cor do título", value: heroTitleColor },
        {
          key: "subtitle_color",
          label: "Cor do subtítulo",
          value: heroSubtitleColor,
        },
        { key: "cta_primary", label: "Botão principal", value: cta },
      ],
    });

  if (needsLogin) {
    return (
      <Card>
        <CardContent className="space-y-4 p-8">
          <h1 className="text-2xl font-bold">Conteúdo do site</h1>
          <p className="text-muted-foreground">
            Inicie sessão com a conta de Comunicação para editar textos.
          </p>
          <Button onClick={onLogin}>Entrar</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="mb-2 text-sm font-medium text-secondary">COMUNICAÇÃO</p>
          <h1 className="text-3xl font-bold">Conteúdo do site</h1>
          <p className="mt-2 text-muted-foreground">
            Edite textos, galeria e depoimentos. Rascunho → revisão → publicado.
          </p>
        </div>
        <div className="text-right">
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              setJobMessage("A processar…");
              try {
                const res = await api.processScheduledContent();
                setJobMessage(res.message);
                loadPage();
                loadAllPages();
                loadTestimonials();
              } catch (err) {
                setJobMessage(
                  err instanceof Error ? err.message : "Erro ao processar",
                );
              }
            }}
          >
            <Clock className="mr-2 h-4 w-4" />
            Promover agendados
          </Button>
          {jobMessage && (
            <p className="mt-1 text-xs text-muted-foreground">{jobMessage}</p>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg">
            Conteúdo publicado (todas as páginas)
          </CardTitle>
          <Button variant="outline" size="sm" onClick={loadAllPages}>
            Actualizar
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            O site utiliza a página <strong>Home</strong>. Aqui vê todas as
            páginas de conteúdo e o respectivo estado, incluindo as já
            publicadas, com todas as secções.
          </p>
          {allPages.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Sem páginas de conteúdo.
            </p>
          ) : (
            <div className="space-y-3">
              {allPages.map((p) => (
                <div key={p.id} className="rounded-lg border p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{p.title}</span>
                    <span className="text-xs text-muted-foreground">
                      /{p.slug}
                    </span>
                    <StatusPill status={p.status} />
                  </div>
                  {p.sections.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {p.sections.map((s) => (
                        <li key={s.key} className="text-sm">
                          <span className="text-muted-foreground">
                            {s.label}:{" "}
                          </span>
                          <span>{s.value || "—"}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg">Página Home</CardTitle>
          <StatusPill status={pageStatus} />
        </CardHeader>
        <CardContent className="space-y-4 p-6 pt-0">
          <Field label="Título da página">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="Título principal">
            <Input
              value={heroTitle}
              onChange={(e) => setHeroTitle(e.target.value)}
            />
          </Field>
          <Field label="Subtítulo">
            <Input
              value={heroSubtitle}
              onChange={(e) => setHeroSubtitle(e.target.value)}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Cor do título">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  className="h-9 w-12 cursor-pointer rounded border"
                  value={heroTitleColor || "#1f2937"}
                  onChange={(e) => setHeroTitleColor(e.target.value)}
                  aria-label="Escolher cor do título"
                />
                <Input
                  value={heroTitleColor}
                  onChange={(e) => setHeroTitleColor(e.target.value)}
                  placeholder="Predefinida"
                  className="h-9"
                />
                {heroTitleColor && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setHeroTitleColor("")}
                  >
                    Repor
                  </Button>
                )}
              </div>
            </Field>
            <Field label="Cor do subtítulo">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  className="h-9 w-12 cursor-pointer rounded border"
                  value={heroSubtitleColor || "#374151"}
                  onChange={(e) => setHeroSubtitleColor(e.target.value)}
                  aria-label="Escolher cor do subtítulo"
                />
                <Input
                  value={heroSubtitleColor}
                  onChange={(e) => setHeroSubtitleColor(e.target.value)}
                  placeholder="Predefinida"
                  className="h-9"
                />
                {heroSubtitleColor && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setHeroSubtitleColor("")}
                  >
                    Repor
                  </Button>
                )}
              </div>
            </Field>
          </div>
          <p className="text-xs text-muted-foreground">
            Deixe a cor vazia para usar a cor predefinida do site.
          </p>
          <Field label="Texto do botão">
            <Input value={cta} onChange={(e) => setCta(e.target.value)} />
          </Field>
          <Field label="Agendar publicação (opcional)">
            <Input
              type="datetime-local"
              value={pagePublishAt}
              onChange={(e) => setPagePublishAt(e.target.value)}
            />
          </Field>
          {message && <p className="text-sm text-muted-foreground">{message}</p>}
          <div className="flex flex-wrap gap-3">
            <Button
              disabled={loading}
              onClick={async () => {
                setLoading(true);
                setMessage("");
                try {
                  await savePage();
                  setMessage("Guardado. Ainda não está publicado no site.");
                  loadPage();
                } catch (err) {
                  setMessage(
                    err instanceof Error ? err.message : "Erro ao guardar",
                  );
                } finally {
                  setLoading(false);
                }
              }}
            >
              Guardar rascunho
            </Button>
            <Button
              variant="secondary"
              disabled={loading}
              onClick={async () => {
                setLoading(true);
                setMessage("");
                try {
                  await savePage();
                  await api.submitCmsPage("home");
                  setMessage("Submetido para revisão.");
                  loadPage();
                } catch (err) {
                  setMessage(
                    err instanceof Error ? err.message : "Erro ao submeter",
                  );
                } finally {
                  setLoading(false);
                }
              }}
            >
              <Send className="mr-2 h-4 w-4" />
              Submeter para revisão
            </Button>
            <Button
              disabled={loading}
              onClick={async () => {
                setLoading(true);
                setMessage("");
                try {
                  await savePage();
                  await api.publishCmsPage("home", toIsoOrNull(pagePublishAt));
                  setMessage(
                    pagePublishAt
                      ? "Agendado/publicado conforme a data indicada."
                      : "Publicado com sucesso.",
                  );
                  loadPage();
                  loadAllPages();
                } catch (err) {
                  setMessage(
                    err instanceof Error ? err.message : "Erro ao publicar",
                  );
                } finally {
                  setLoading(false);
                }
              }}
            >
              {pagePublishAt ? "Agendar publicação" : "Publicar"}
            </Button>
            {pageStatus === "PUBLICADO" && (
              <Button
                variant="outline"
                disabled={loading}
                onClick={async () => {
                  setLoading(true);
                  setMessage("");
                  try {
                    await api.archiveCmsPage("home");
                    setMessage(
                      "Publicação desactivada. Já não aparece no site.",
                    );
                    loadPage();
                    loadAllPages();
                  } catch (err) {
                    setMessage(
                      err instanceof Error
                        ? err.message
                        : "Erro ao despublicar",
                    );
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                Despublicar
              </Button>
            )}
            <Button
              variant="ghost"
              className="text-destructive hover:text-destructive"
              disabled={loading}
              onClick={async () => {
                if (
                  !window.confirm(
                    "Remover definitivamente o conteúdo da página Home? Esta acção não pode ser anulada.",
                  )
                )
                  return;
                setLoading(true);
                setMessage("");
                try {
                  await api.deleteCmsPage("home");
                  setMessage("Conteúdo removido.");
                  loadPage();
                  loadAllPages();
                } catch (err) {
                  setMessage(
                    err instanceof Error ? err.message : "Erro ao remover",
                  );
                } finally {
                  setLoading(false);
                }
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Remover
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Publicar exige perfil de Direcção/Administração. Comunicação submete
            para revisão.
          </p>
        </CardContent>
      </Card>

      <MediaLibrarySection />

      <GalleryManager />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Depoimentos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Adicione testemunhos de encarregados para publicar no site.
          </p>
          <Field label="Nome">
            <Input
              value={testimonialForm.authorName}
              onChange={(e) =>
                setTestimonialForm((f) => ({
                  ...f,
                  authorName: e.target.value,
                }))
              }
              placeholder="Ex.: Maria Silva"
            />
          </Field>
          <Field label="Unidade">
            <Select
              value={testimonialForm.unitName || undefined}
              onValueChange={(value) =>
                setTestimonialForm((f) => ({ ...f, unitName: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione a unidade" />
              </SelectTrigger>
              <SelectContent>
                {testimonialForm.unitName &&
                  !testimonialUnits.some(
                    (u) => u.name === testimonialForm.unitName,
                  ) && (
                    <SelectItem value={testimonialForm.unitName}>
                      {testimonialForm.unitName} (actual)
                    </SelectItem>
                  )}
                {testimonialUnits.map((u) => (
                  <SelectItem key={u.id} value={u.name}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Texto">
            <Textarea
              value={testimonialForm.text}
              onChange={(e) =>
                setTestimonialForm((f) => ({ ...f, text: e.target.value }))
              }
              rows={4}
              placeholder="Depoimento do encarregado"
            />
          </Field>
          {testimonialMessage && (
            <p className="text-sm text-muted-foreground">{testimonialMessage}</p>
          )}
          <div className="flex flex-wrap gap-3">
            <Button
              disabled={testimonialLoading}
              onClick={async () => {
                if (
                  !testimonialForm.authorName.trim() ||
                  !testimonialForm.unitName.trim() ||
                  !testimonialForm.text.trim()
                ) {
                  setTestimonialMessage("Preencha nome, unidade e texto.");
                  return;
                }
                setTestimonialLoading(true);
                setTestimonialMessage("");
                try {
                  if (editingTestimonialId) {
                    await api.updateTestimonial(editingTestimonialId, {
                      authorName: testimonialForm.authorName.trim(),
                      text: testimonialForm.text.trim(),
                      unitName: testimonialForm.unitName.trim() || null,
                    });
                    setTestimonialMessage("Depoimento actualizado.");
                    setEditingTestimonialId(null);
                  } else {
                    await api.createTestimonial({
                      authorName: testimonialForm.authorName.trim(),
                      text: testimonialForm.text.trim(),
                      unitName: testimonialForm.unitName.trim() || undefined,
                    });
                    setTestimonialMessage("Depoimento adicionado (rascunho).");
                  }
                  setTestimonialForm({ authorName: "", text: "", unitName: "" });
                  loadTestimonials();
                } catch (err) {
                  setTestimonialMessage(
                    err instanceof Error ? err.message : "Erro ao guardar",
                  );
                } finally {
                  setTestimonialLoading(false);
                }
              }}
            >
              {editingTestimonialId
                ? "Guardar alterações"
                : "Adicionar depoimento"}
            </Button>
            {editingTestimonialId && (
              <Button
                variant="ghost"
                disabled={testimonialLoading}
                onClick={() => {
                  setEditingTestimonialId(null);
                  setTestimonialForm({ authorName: "", text: "", unitName: "" });
                  setTestimonialMessage("");
                }}
              >
                Cancelar edição
              </Button>
            )}
          </div>

          <div className="divide-y rounded-lg border">
            {testimonials.length === 0 && (
              <p className="p-4 text-sm text-muted-foreground">
                Ainda não há depoimentos.
              </p>
            )}
            {testimonials.map((item) => {
              const scheduleLabel = formatScheduleLabel(item.publishAt);
              return (
                <div
                  key={item.id}
                  className="flex flex-wrap items-start justify-between gap-3 p-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{item.authorName}</p>
                      <StatusPill status={item.status || "RASCUNHO"} />
                    </div>
                    {item.unitName ? (
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Unidade:</span>{" "}
                        {item.unitName}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Unidade:</span> —
                      </p>
                    )}
                    <p className="mt-1 text-sm">{item.text}</p>
                    {scheduleLabel && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Agendado para {scheduleLabel}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Input
                      type="datetime-local"
                      className="h-8 w-48 text-xs"
                      value={testimonialSchedule[item.id] || ""}
                      onChange={(e) =>
                        setTestimonialSchedule((s) => ({
                          ...s,
                          [item.id]: e.target.value,
                        }))
                      }
                    />
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={testimonialActionId === item.id}
                        onClick={() => {
                          setEditingTestimonialId(item.id);
                          setTestimonialForm({
                            authorName: item.authorName,
                            text: item.text,
                            unitName: item.unitName || "",
                          });
                          setTestimonialMessage("A editar depoimento.");
                        }}
                      >
                        <Pencil className="mr-1 h-3 w-3" />
                        Editar
                      </Button>
                      {item.status !== "EM_REVISAO" &&
                        item.status !== "PUBLICADO" && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={testimonialActionId === item.id}
                            onClick={async () => {
                              setTestimonialActionId(item.id);
                              setTestimonialMessage("");
                              try {
                                await api.submitTestimonial(item.id);
                                setTestimonialMessage("Enviado para revisão.");
                                loadTestimonials();
                              } catch (err) {
                                setTestimonialMessage(
                                  err instanceof Error
                                    ? err.message
                                    : "Erro ao submeter",
                                );
                              } finally {
                                setTestimonialActionId(null);
                              }
                            }}
                          >
                            <Send className="mr-1 h-3 w-3" />
                            Rever
                          </Button>
                        )}
                      {item.status === "PUBLICADO" && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={testimonialActionId === item.id}
                          onClick={async () => {
                            setTestimonialActionId(item.id);
                            setTestimonialMessage("");
                            try {
                              await api.updateTestimonial(item.id, {
                                status: "ARQUIVADO",
                              });
                              setTestimonialMessage(
                                "Publicação desactivada.",
                              );
                              loadTestimonials();
                            } catch (err) {
                              setTestimonialMessage(
                                err instanceof Error
                                  ? err.message
                                  : "Erro ao despublicar",
                              );
                            } finally {
                              setTestimonialActionId(null);
                            }
                          }}
                        >
                          Despublicar
                        </Button>
                      )}
                      {item.status !== "PUBLICADO" && (
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={testimonialActionId === item.id}
                          onClick={async () => {
                            setTestimonialActionId(item.id);
                            setTestimonialMessage("");
                            try {
                              await api.publishTestimonial(
                                item.id,
                                toIsoOrNull(testimonialSchedule[item.id] || ""),
                              );
                              setTestimonialMessage(
                                testimonialSchedule[item.id]
                                  ? "Depoimento agendado."
                                  : "Depoimento publicado.",
                              );
                              loadTestimonials();
                            } catch (err) {
                              setTestimonialMessage(
                                err instanceof Error
                                  ? err.message
                                  : "Erro ao publicar",
                              );
                            } finally {
                              setTestimonialActionId(null);
                            }
                          }}
                        >
                          {testimonialSchedule[item.id] ? "Agendar" : "Publicar"}
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={testimonialActionId === item.id}
                        onClick={async () => {
                          if (
                            !window.confirm(
                              `Remover o depoimento de "${item.authorName}"?`,
                            )
                          )
                            return;
                          setTestimonialActionId(item.id);
                          setTestimonialMessage("");
                          try {
                            await api.deleteTestimonial(item.id);
                            setTestimonials((list) =>
                              list.filter((t) => t.id !== item.id),
                            );
                            if (editingTestimonialId === item.id) {
                              setEditingTestimonialId(null);
                              setTestimonialForm({
                                authorName: "",
                                text: "",
                                unitName: "",
                              });
                            }
                            setTestimonialMessage("Depoimento removido.");
                          } catch (err) {
                            setTestimonialMessage(
                              err instanceof Error
                                ? err.message
                                : "Erro ao remover",
                            );
                          } finally {
                            setTestimonialActionId(null);
                          }
                        }}
                        aria-label="Remover depoimento"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const MEDIA_CATEGORIES = [
  { value: "galeria", label: "Galeria" },
  { value: "hero", label: "Hero / destaque" },
  { value: "servicos", label: "Serviços" },
  { value: "outros", label: "Outros" },
];

function MediaLibrarySection() {
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [uploadCategory, setUploadCategory] = useState("galeria");
  const [uploadAlt, setUploadAlt] = useState("");
  const [filter, setFilter] = useState("todas");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () =>
    api
      .getMediaLibrary(filter === "todas" ? undefined : filter)
      .then(setMedia)
      .catch(() => setMedia([]));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg">Biblioteca de media</CardTitle>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="h-8 w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas</SelectItem>
            {MEDIA_CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2">
          <Field label="Categoria do upload">
            <Select value={uploadCategory} onValueChange={setUploadCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MEDIA_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Texto alternativo (acessibilidade)">
            <Input
              value={uploadAlt}
              onChange={(e) => setUploadAlt(e.target.value)}
              placeholder="Ex.: Crianças na sala de arte"
            />
          </Field>
          <div className="sm:col-span-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-dashed px-4 py-2 text-sm hover:bg-muted">
              <Upload className="h-4 w-4" />
              {busy ? "A carregar…" : "Carregar imagem"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={busy}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setBusy(true);
                  setMessage("");
                  try {
                    await api.uploadMedia(
                      file,
                      uploadAlt.trim() || undefined,
                      uploadCategory,
                    );
                    setUploadAlt("");
                    setMessage("Imagem carregada.");
                    load();
                  } catch (err) {
                    setMessage(
                      err instanceof Error ? err.message : "Erro no upload",
                    );
                  } finally {
                    setBusy(false);
                    e.target.value = "";
                  }
                }}
              />
            </label>
          </div>
        </div>
        {message && (
          <p className="text-sm text-muted-foreground">{message}</p>
        )}
        {media.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Sem ficheiros nesta categoria.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {media.map((m) => (
              <div key={m.id} className="overflow-hidden rounded-lg border">
                <img
                  src={uploadPublicUrl(m.filePath)}
                  alt={m.altText || m.originalName}
                  className="h-28 w-full object-cover"
                />
                <div className="space-y-2 p-2">
                  <Select
                    value={m.category || "outros"}
                    onValueChange={async (value) => {
                      try {
                        await api.updateMedia(m.id, { category: value });
                        load();
                      } catch {
                        setMessage("Erro ao actualizar categoria.");
                      }
                    }}
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MEDIA_CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-full text-xs text-destructive"
                    onClick={async () => {
                      setMessage("");
                      try {
                        await api.deleteMedia(m.id);
                        load();
                      } catch (err) {
                        setMessage(
                          err instanceof Error ? err.message : "Erro ao remover",
                        );
                      }
                    }}
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    Remover
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function GalleryManager() {
  const [albums, setAlbums] = useState<GalleryAlbum[]>([]);
  const [newAlbumTitle, setNewAlbumTitle] = useState("");
  const [schedule, setSchedule] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () =>
    api
      .getGalleryAdmin()
      .then(setAlbums)
      .catch(() => setAlbums([]));

  useEffect(() => {
    load();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Galeria</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Organize álbuns (categorias) e imagens. Cada álbum segue o fluxo
          rascunho → revisão → publicado e pode ser agendado.
        </p>
        <div className="flex flex-wrap items-end gap-3 rounded-lg border p-4">
          <div className="flex-1">
            <Field label="Novo álbum / categoria">
              <Input
                value={newAlbumTitle}
                onChange={(e) => setNewAlbumTitle(e.target.value)}
                placeholder="Ex.: Instalações"
              />
            </Field>
          </div>
          <Button
            onClick={async () => {
              if (!newAlbumTitle.trim()) return;
              setMessage("");
              try {
                await api.createAlbum({ title: newAlbumTitle.trim() });
                setNewAlbumTitle("");
                load();
              } catch (err) {
                setMessage(
                  err instanceof Error ? err.message : "Erro ao criar álbum",
                );
              }
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Criar álbum
          </Button>
        </div>
        {message && <p className="text-sm text-muted-foreground">{message}</p>}

        {albums.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Ainda não há álbuns. Crie o primeiro acima.
          </p>
        )}

        <div className="space-y-4">
          {albums.map((album) => {
            const scheduleLabel = formatScheduleLabel(album.publishAt);
            return (
              <div key={album.id} className="rounded-lg border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{album.title}</span>
                    <span className="text-xs text-muted-foreground">
                      /{album.slug}
                    </span>
                    <StatusPill status={album.status} />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      type="datetime-local"
                      className="h-8 w-48 text-xs"
                      value={schedule[album.id] || ""}
                      onChange={(e) =>
                        setSchedule((s) => ({
                          ...s,
                          [album.id]: e.target.value,
                        }))
                      }
                    />
                    {album.status !== "EM_REVISAO" &&
                      album.status !== "PUBLICADO" && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyId === album.id}
                          onClick={async () => {
                            setBusyId(album.id);
                            try {
                              await api.submitAlbum(album.id);
                              load();
                            } catch (err) {
                              setMessage(
                                err instanceof Error
                                  ? err.message
                                  : "Erro ao submeter",
                              );
                            } finally {
                              setBusyId(null);
                            }
                          }}
                        >
                          <Send className="mr-1 h-3 w-3" />
                          Rever
                        </Button>
                      )}
                    {album.status !== "PUBLICADO" && (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={busyId === album.id}
                        onClick={async () => {
                          setBusyId(album.id);
                          try {
                            await api.publishAlbum(
                              album.id,
                              toIsoOrNull(schedule[album.id] || ""),
                            );
                            load();
                          } catch (err) {
                            setMessage(
                              err instanceof Error
                                ? err.message
                                : "Erro ao publicar",
                            );
                          } finally {
                            setBusyId(null);
                          }
                        }}
                      >
                        {schedule[album.id] ? "Agendar" : "Publicar"}
                      </Button>
                    )}
                    {album.status === "PUBLICADO" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === album.id}
                        onClick={async () => {
                          setBusyId(album.id);
                          try {
                            await api.archiveAlbum(album.id);
                            load();
                          } catch (err) {
                            setMessage(
                              err instanceof Error
                                ? err.message
                                : "Erro ao arquivar",
                            );
                          } finally {
                            setBusyId(null);
                          }
                        }}
                      >
                        Arquivar
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      disabled={busyId === album.id}
                      onClick={async () => {
                        setBusyId(album.id);
                        try {
                          await api.deleteAlbum(album.id);
                          load();
                        } catch (err) {
                          setMessage(
                            err instanceof Error
                              ? err.message
                              : "Erro ao remover",
                          );
                        } finally {
                          setBusyId(null);
                        }
                      }}
                      aria-label="Remover álbum"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                {scheduleLabel && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Agendado para {scheduleLabel}
                  </p>
                )}

                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {album.items.map((item) => (
                    <GalleryItemCard
                      key={item.id}
                      item={item}
                      onDone={load}
                      onMessage={setMessage}
                    />
                  ))}
                  <GalleryItemUpload albumId={album.id} onDone={load} />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function GalleryItemCard({
  item,
  onDone,
  onMessage,
}: {
  item: GalleryItem;
  onDone: () => void;
  onMessage: (m: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(item.title || "");
  const [caption, setCaption] = useState(item.caption || "");
  const [alt, setAlt] = useState(item.media?.altText || "");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const startEdit = () => {
    setTitle(item.title || "");
    setCaption(item.caption || "");
    setAlt(item.media?.altText || "");
    setFile(null);
    setEditing(true);
  };

  const save = async () => {
    setBusy(true);
    onMessage("");
    try {
      let mediaId: string | undefined;
      if (file) {
        const media = await api.uploadMedia(
          file,
          alt.trim() || undefined,
          item.media?.category || "galeria",
        );
        mediaId = media.id;
      } else if (item.mediaId && alt !== (item.media?.altText || "")) {
        await api.updateMedia(item.mediaId, { altText: alt.trim() || null });
      }
      await api.updateGalleryItem(item.id, {
        title: title.trim() || null,
        caption: caption.trim() || null,
        ...(mediaId ? { mediaId } : {}),
      });
      onMessage("Imagem actualizada.");
      setEditing(false);
      onDone();
    } catch (err) {
      onMessage(
        err instanceof Error ? err.message : "Erro ao actualizar imagem.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border">
      {item.media?.filePath ? (
        <img
          src={uploadPublicUrl(item.media.filePath)}
          alt={item.media.altText || item.title || item.caption || ""}
          className="h-24 w-full object-cover"
        />
      ) : (
        <div className="flex h-24 w-full items-center justify-center bg-muted">
          <ImageIcon className="h-6 w-6 text-muted-foreground" />
        </div>
      )}
      <div className="space-y-1 p-2">
        {!editing ? (
          <>
            {item.title && (
              <p className="truncate text-xs font-medium">{item.title}</p>
            )}
            {item.caption && (
              <p className="truncate text-xs text-muted-foreground">
                {item.caption}
              </p>
            )}
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                className="mt-1 h-6 flex-1 text-xs"
                onClick={startEdit}
              >
                <Pencil className="mr-1 h-3 w-3" />
                Editar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="mt-1 h-6 flex-1 text-xs text-destructive"
                disabled={busy}
                onClick={async () => {
                  if (!window.confirm("Remover esta imagem?")) return;
                  setBusy(true);
                  onMessage("");
                  try {
                    await api.removeGalleryItem(item.id);
                    onDone();
                  } catch {
                    onMessage("Erro ao remover imagem.");
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <Trash2 className="mr-1 h-3 w-3" />
                Remover
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-2">
            <Input
              className="h-7 text-xs"
              placeholder="Título"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Input
              className="h-7 text-xs"
              placeholder="Legenda / descrição"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
            <Input
              className="h-7 text-xs"
              placeholder="Texto alternativo"
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
            />
            <label className="inline-flex w-full cursor-pointer items-center justify-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-muted">
              <Upload className="h-3 w-3" />
              {file ? "Imagem seleccionada" : "Substituir imagem"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={busy}
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>
            <div className="flex gap-1">
              <Button
                size="sm"
                className="h-6 flex-1 text-xs"
                disabled={busy}
                onClick={save}
              >
                Guardar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 flex-1 text-xs"
                disabled={busy}
                onClick={() => {
                  setEditing(false);
                  setFile(null);
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function GalleryItemUpload({
  albumId,
  onDone,
}: {
  albumId: string;
  onDone: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState("");
  return (
    <div className="flex flex-col justify-center gap-2 rounded-lg border border-dashed p-2">
      <Input
        className="h-7 text-xs"
        placeholder="Legenda (opcional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <label className="inline-flex cursor-pointer items-center justify-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-muted">
        <Upload className="h-3 w-3" />
        {busy ? "…" : "Adicionar"}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          disabled={busy}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setBusy(true);
            try {
              const media = await api.uploadMedia(
                file,
                title.trim() || undefined,
                "galeria",
              );
              await api.addGalleryItem(albumId, {
                mediaId: media.id,
                title: title.trim() || undefined,
              });
              setTitle("");
              onDone();
            } catch {
              // silencioso; utilizador pode tentar de novo
            } finally {
              setBusy(false);
              e.target.value = "";
            }
          }}
        />
      </label>
    </div>
  );
}
