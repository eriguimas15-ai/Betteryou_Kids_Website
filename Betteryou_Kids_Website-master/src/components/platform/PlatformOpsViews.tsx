import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import {
  Activity,
  Building2,
  Check,
  Database,
  Download,
  Plus,
  RefreshCw,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  api,
  type AuditListResult,
  type BackupsResult,
  type DashboardExecutivo,
  type DashboardPedagogico,
  type ServiceItem,
  type Unit,
} from "@/lib/api";

function formatAkz(n: number | null | undefined): string {
  if (n == null) return "—";
  return `${n.toLocaleString("pt-PT")} AKZ`;
}

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

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}

const PAINEL_ROLES = ["ADMIN", "DIRECAO"];
const PAINEL_PEDAGOGICO_ROLES = ["ADMIN", "DIRECAO", "COORDENACAO"];
const AUDITORIA_ROLES = ["ADMIN", "DIRECAO"];
const BACKUP_ROLES = ["ADMIN"];
const UNIDADES_ROLES = ["ADMIN", "DIRECAO"];

const CHART_COLORS = [
  "#7c3aed",
  "#a78bfa",
  "#f472b6",
  "#34d399",
  "#fbbf24",
  "#60a5fa",
  "#c4b5fd",
];

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return format(parseISO(value), "dd/MM/yyyy HH:mm", { locale: pt });
  } catch {
    return value;
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function NoAccessCard({
  title,
  message,
  needsLogin,
  onLogin,
}: {
  title: string;
  message: string;
  needsLogin: boolean;
  onLogin: () => void;
}) {
  return (
    <Card>
      <CardContent className="space-y-4 p-8">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-muted-foreground">{message}</p>
        {needsLogin && <Button onClick={onLogin}>Entrar</Button>}
      </CardContent>
    </Card>
  );
}

function ExecKpiCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: typeof Activity;
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between p-5">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div className="rounded-lg bg-primary/10 p-2 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

function FinanceiroKpiBlock({
  title,
  kpi,
}: {
  title: string;
  kpi: DashboardExecutivo["financeiro"]["acumulado"];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Faturado</span>
          <span className="font-semibold">{formatAkz(kpi.faturadoAkz)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Recebido</span>
          <span className="font-semibold text-emerald-600">
            {formatAkz(kpi.recebidoAkz)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Em dívida</span>
          <span className="font-semibold text-destructive">
            {formatAkz(kpi.emDividaAkz)}
          </span>
        </div>
        <div className="mt-2 border-t pt-2">
          <div className="mb-1 flex justify-between">
            <span className="text-muted-foreground">Taxa de cobrança</span>
            <span className="font-semibold">{kpi.taxaCobranca}%</span>
          </div>
          <Progress value={Math.min(100, kpi.taxaCobranca)} />
        </div>
      </CardContent>
    </Card>
  );
}

function PedagogicoEstrategicoSection({
  userRole,
}: {
  userRole: string;
}) {
  const canAccess = PAINEL_PEDAGOGICO_ROLES.includes(userRole);
  const [unitId, setUnitId] = useState("all");
  const [yearId, setYearId] = useState("");
  const [periodId, setPeriodId] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<DashboardPedagogico | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!canAccess) return;
    let active = true;
    setLoading(true);
    setError("");
    api
      .getDashboardPedagogico({
        unitId,
        academicYearId: yearId || undefined,
        periodId: periodId === "all" ? undefined : periodId,
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
  }, [canAccess, unitId, yearId, periodId]);

  const exportCsv = async () => {
    setExporting(true);
    setError("");
    try {
      await api.downloadDashboardPedagogicoCsv({
        unitId,
        academicYearId: yearId || undefined,
        periodId: periodId === "all" ? undefined : periodId,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Não foi possível exportar CSV.",
      );
    } finally {
      setExporting(false);
    }
  };

  if (!canAccess) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Sem permissão. Reservado à administração, direcção e coordenação.
        </CardContent>
      </Card>
    );
  }

  const periodOptions = (data?.periods ?? []).filter(
    (p) => !yearId || p.academicYearId === yearId,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="w-56">
            <Field label="Unidade">
              <Select value={unitId} onValueChange={setUnitId}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as unidades" />
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
              <Select
                value={yearId || "none"}
                onValueChange={(v) => setYearId(v === "none" ? "" : v)}
              >
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
          <div className="w-56">
            <Field label="Período">
              <Select value={periodId} onValueChange={setPeriodId}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os períodos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os períodos</SelectItem>
                  {periodOptions.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={exportCsv}
          disabled={exporting || loading || !data}
        >
          <Download className="mr-2 h-4 w-4" />
          {exporting ? "A exportar…" : "Exportar CSV"}
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </div>
      )}
      {loading && !data && (
        <p className="text-muted-foreground">A carregar relatório pedagógico…</p>
      )}

      {data && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <ExecKpiCard
              label="Turmas / Alunos"
              value={`${data.kpis.turmas} / ${data.kpis.alunos}`}
              icon={GraduationCap}
            />
            <ExecKpiCard
              label="Cobertura de boletins"
              value={
                data.kpis.coberturaPublicacaoBoletins != null
                  ? `${data.kpis.coberturaPublicacaoBoletins}%`
                  : "—"
              }
              hint={`${data.kpis.boletinsPublicados}/${data.kpis.boletinsTotal} publicados`}
              icon={ClipboardCheck}
            />
            <ExecKpiCard
              label="NEE activos"
              value={String(data.kpis.neeActivos)}
              icon={Users}
            />
            <ExecKpiCard
              label="PEI revisão em dia"
              value={
                data.kpis.peiRevisaoEmDia != null
                  ? `${data.kpis.peiRevisaoEmDia}%`
                  : "—"
              }
              hint={`${data.kpis.peiActivos} PEI activo(s)`}
              icon={CheckCircle2}
            />
            <ExecKpiCard
              label="Substituições"
              value={String(data.kpis.substituicoesTotal)}
              hint={`${data.kpis.turmasComSubstituicoes} turma(s) afectada(s)`}
              icon={RefreshCw}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Assiduidade por turma
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.attendanceTrendByTurma.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem dados.</p>
                ) : (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.attendanceTrendByTurma.slice(0, 12)}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="turma" fontSize={12} />
                        <YAxis domain={[0, 100]} fontSize={12} />
                        <RechartsTooltip />
                        <Bar
                          dataKey="attendanceRate"
                          name="Assiduidade %"
                          fill="#0d9488"
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
                <CardTitle className="text-base">
                  Distribuição de avaliações
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.assessmentDistribution.numericBands}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="band" />
                      <YAxis allowDecimals={false} />
                      <RechartsTooltip />
                      <Bar
                        dataKey="count"
                        name="Avaliações numéricas"
                        fill="#7c3aed"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-sm">
                  <p className="mb-2 font-medium">Qualitativas</p>
                  {data.assessmentDistribution.qualitativeCounts.length === 0 ? (
                    <p className="text-muted-foreground">Sem registos qualitativos.</p>
                  ) : (
                    <div className="space-y-1">
                      {data.assessmentDistribution.qualitativeCounts
                        .slice(0, 6)
                        .map((q) => (
                          <p key={q.label} className="text-muted-foreground">
                            {q.label}:{" "}
                            <span className="font-semibold text-foreground">
                              {q.count}
                            </span>
                          </p>
                        ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Tendência comportamental
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.behaviorTrend.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem registos.</p>
                ) : (
                  <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.behaviorTrend}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="month" />
                        <YAxis allowDecimals={false} />
                        <Legend />
                        <RechartsTooltip />
                        <Bar
                          dataKey="positivos"
                          name="Positivos"
                          fill="#16a34a"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="incidentes"
                          name="Incidentes"
                          fill="#dc2626"
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
                <CardTitle className="text-base">
                  Substituições por turma
                </CardTitle>
              </CardHeader>
              <CardContent className="max-h-[320px] overflow-y-auto">
                {data.substitutions.byClass.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Sem substituições no período seleccionado.
                  </p>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="border-b text-left">
                      <tr>
                        <th className="py-2">Turma</th>
                        <th className="py-2">Ocorrências</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.substitutions.byClass.map((row) => (
                        <tr key={row.classGroupId} className="border-b last:border-0">
                          <td className="py-2">{row.turma}</td>
                          <td className="py-2 font-semibold">{row.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

export function PainelExecutivo({
  needsLogin,
  userRole,
  onLogin,
}: {
  needsLogin: boolean;
  userRole: string;
  onLogin: () => void;
}) {
  const [tab, setTab] = useState<"executivo" | "pedagogico">("executivo");
  const [unitId, setUnitId] = useState("all");
  const [data, setData] = useState<DashboardExecutivo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canExec = !needsLogin && PAINEL_ROLES.includes(userRole);
  const canPed = !needsLogin && PAINEL_PEDAGOGICO_ROLES.includes(userRole);
  const canAccess = canExec || canPed;

  useEffect(() => {
    if (!canExec && canPed) setTab("pedagogico");
  }, [canExec, canPed]);

  useEffect(() => {
    if (!canExec) return;
    let active = true;
    setLoading(true);
    setError("");
    api
      .getDashboardExecutivo(unitId)
      .then((result) => {
        if (active) setData(result);
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
  }, [canExec, unitId]);

  if (needsLogin) {
    return (
      <NoAccessCard
        title="Painel executivo"
        message="Inicie sessão para consultar os indicadores de gestão."
        needsLogin
        onLogin={onLogin}
      />
    );
  }
  if (!canAccess) {
    return (
      <NoAccessCard
        title="Painel executivo"
        message="Sem permissão. Reservado à administração, direcção e coordenação."
        needsLogin={false}
        onLogin={onLogin}
      />
    );
  }

  const occByUnit = data?.ocupacao.porUnidade ?? [];
  const occByService = data?.ocupacao.porServico ?? [];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-sm font-medium text-secondary">GESTÃO</p>
          <h1 className="text-3xl font-bold">Painel executivo</h1>
          <p className="mt-2 text-muted-foreground">
            Indicadores agregados de ocupação, admissões e financeiro. Valores em
            AKZ (Kwanza).
          </p>
        </div>
        <div className="flex gap-2">
          {canExec && (
            <Button
              variant={tab === "executivo" ? "default" : "outline"}
              onClick={() => setTab("executivo")}
            >
              Executivo
            </Button>
          )}
          {canPed && (
            <Button
              variant={tab === "pedagogico" ? "default" : "outline"}
              onClick={() => setTab("pedagogico")}
            >
              Pedagógico
            </Button>
          )}
        </div>
      </div>

      {tab === "pedagogico" ? (
        <PedagogicoEstrategicoSection userRole={userRole} />
      ) : (
        <div className="space-y-6">
          <div className="w-56">
            <Field label="Unidade">
              <Select value={unitId} onValueChange={setUnitId}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as unidades" />
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
          {error && (
            <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          {loading && !data && (
            <p className="text-muted-foreground">A carregar indicadores…</p>
          )}
          {data && (
            <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ExecKpiCard
              label="Alunos matriculados"
              value={String(data.admissoes.alunosMatriculados)}
              icon={GraduationCap}
            />
            <ExecKpiCard
              label="Taxa de ocupação"
              value={`${data.ocupacao.occupancyRate}%`}
              hint={`${data.ocupacao.totalEnrolled}/${data.ocupacao.totalCapacity} lugares`}
              icon={TrendingUp}
            />
            <ExecKpiCard
              label="Vagas disponíveis"
              value={String(data.ocupacao.totalAvailable)}
              icon={DoorOpen}
            />
            <ExecKpiCard
              label="Lista de espera"
              value={String(data.admissoes.listaEspera)}
              hint={`${data.admissoes.candidaturasPendentes} candidatura(s) por validar`}
              icon={Users}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <ExecKpiCard
              label="Renovações pendentes"
              value={String(data.admissoes.renovacoesPendentes)}
              hint={`${data.admissoes.renovacoesReservadas} vaga(s) reservada(s)`}
              icon={RefreshCw}
            />
            <FinanceiroKpiBlock
              title={`Financeiro — mês ${data.referenceMonth}`}
              kpi={data.financeiro.mesActual}
            />
            <FinanceiroKpiBlock
              title="Financeiro — acumulado"
              kpi={data.financeiro.acumulado}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Ocupação por unidade
                </CardTitle>
              </CardHeader>
              <CardContent>
                {occByUnit.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem dados.</p>
                ) : (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={occByUnit}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="unit" fontSize={12} />
                        <YAxis fontSize={12} allowDecimals={false} />
                        <RechartsTooltip />
                        <Legend />
                        <Bar
                          dataKey="enrolled"
                          name="Matriculados"
                          fill="#7c3aed"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="available"
                          name="Vagas"
                          fill="#a78bfa"
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
                <CardTitle className="text-base">
                  Matriculados por serviço
                </CardTitle>
              </CardHeader>
              <CardContent>
                {occByService.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem dados.</p>
                ) : (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={occByService}
                          dataKey="enrolled"
                          nameKey="service"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={(entry) => entry.service}
                        >
                          {occByService.map((_, index) => (
                            <Cell
                              key={index}
                              fill={CHART_COLORS[index % CHART_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Actividade recente</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div>
                <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <ClipboardList className="h-4 w-4" /> Inscrições
                </p>
                {data.actividadeRecente.inscricoes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem registos.</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {data.actividadeRecente.inscricoes.map((e) => (
                      <li key={e.id} className="border-b pb-2 last:border-0">
                        <p className="font-medium">{e.childFullName}</p>
                        <p className="text-xs text-muted-foreground">
                          {e.unit} · {e.service} · {formatDateTime(e.createdAt)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <Wallet className="h-4 w-4" /> Pagamentos
                </p>
                {data.actividadeRecente.pagamentos.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem registos.</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {data.actividadeRecente.pagamentos.map((p) => (
                      <li key={p.id} className="border-b pb-2 last:border-0">
                        <p className="font-medium">
                          {formatAkz(p.amountAkz)} · {p.childFullName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {p.referenceMonth} · {formatDateTime(p.createdAt)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <Megaphone className="h-4 w-4" /> Comunicados
                </p>
                {data.actividadeRecente.comunicados.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem registos.</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {data.actividadeRecente.comunicados.map((c) => (
                      <li key={c.id} className="border-b pb-2 last:border-0">
                        <p className="font-medium">{c.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {c.audience} · {formatDateTime(c.publishedAt)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────── Auditoria ───────────────────────────────

const AUDIT_ACTION_LABELS: Record<string, string> = {
  LOGIN: "Início de sessão",
  INVOICE_CREATED: "Fatura criada",
  INVOICE_CANCELLED: "Fatura anulada",
  PAYMENT_CREATED: "Pagamento registado",
  FEE_PLAN_CREATED: "Plano criado",
  FEE_PLAN_UPDATED: "Plano actualizado",
  FEE_PLAN_DELETED: "Plano removido",
  ENROLLMENT_CREATED: "Inscrição criada",
  ENROLLMENT_CONFIRMED: "Inscrição confirmada",
  ENROLLMENT_REJECTED: "Inscrição rejeitada",
  WAITLIST_NOTIFIED: "Lista de espera notificada",
  COMMUNICATION_PUBLISHED: "Comunicado publicado",
  COMMUNICATION_UNPUBLISHED: "Comunicado despublicado",
  EVENT_PUBLISHED: "Evento publicado",
  USER_CREATED: "Utilizador criado",
  USER_UPDATED: "Utilizador actualizado",
  ACCESS_PROFILE_CREATED: "Perfil criado",
  ACCESS_PROFILE_UPDATED: "Perfil actualizado",
  ACCESS_PROFILE_DELETED: "Perfil removido",
  UNIT_CREATED: "Unidade criada",
  UNIT_UPDATED: "Unidade actualizada",
  BACKUP_CREATED: "Cópia de segurança criada",
};

function auditActionLabel(action: string): string {
  return AUDIT_ACTION_LABELS[action] || action;
}

export function AuditoriaAdmin({
  needsLogin,
  userRole,
  onLogin,
}: {
  needsLogin: boolean;
  userRole: string;
  onLogin: () => void;
}) {
  const canAccess = !needsLogin && AUDITORIA_ROLES.includes(userRole);
  const [result, setResult] = useState<AuditListResult | null>(null);
  const [actions, setActions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

  const load = () => {
    setLoading(true);
    setError("");
    api
      .getAuditoria({
        action: actionFilter !== "all" ? actionFilter : undefined,
        entity: entityFilter.trim() || undefined,
        from: from || undefined,
        to: to || undefined,
        page,
        pageSize: 25,
      })
      .then(setResult)
      .catch((err) =>
        setError(
          err instanceof Error ? err.message : "Não foi possível carregar.",
        ),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!canAccess) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canAccess, page]);

  useEffect(() => {
    if (!canAccess) return;
    api
      .getAuditActions()
      .then(setActions)
      .catch(() => setActions([]));
  }, [canAccess]);

  if (needsLogin) {
    return (
      <NoAccessCard
        title="Auditoria"
        message="Inicie sessão para consultar o registo de auditoria."
        needsLogin
        onLogin={onLogin}
      />
    );
  }
  if (!AUDITORIA_ROLES.includes(userRole)) {
    return (
      <NoAccessCard
        title="Auditoria"
        message="Sem permissão. Reservado à administração e direcção."
        needsLogin={false}
        onLogin={onLogin}
      />
    );
  }

  const applyFilters = () => {
    setPage(1);
    load();
  };

  return (
    <div>
      <div className="mb-6">
        <p className="mb-2 text-sm font-medium text-secondary">GESTÃO</p>
        <h1 className="text-3xl font-bold">Auditoria</h1>
        <p className="mt-2 text-muted-foreground">
          Registo de acções sensíveis da plataforma (acessos, financeiro,
          admissões, comunicações e configurações).
        </p>
      </div>

      <Card className="mb-4">
        <CardContent className="grid grid-cols-1 gap-3 p-4 md:grid-cols-5">
          <Field label="Acção">
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {actions.map((a) => (
                  <SelectItem key={a} value={a}>
                    {auditActionLabel(a)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Entidade">
            <Input
              placeholder="Ex.: Invoice"
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
            />
          </Field>
          <Field label="De">
            <Input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </Field>
          <Field label="Até">
            <Input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </Field>
          <div className="flex items-end">
            <Button onClick={applyFilters} disabled={loading} className="w-full">
              Filtrar
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left">
                <tr>
                  <th className="p-3">Data</th>
                  <th className="p-3">Utilizador</th>
                  <th className="p-3">Acção</th>
                  <th className="p-3">Entidade</th>
                  <th className="p-3">Detalhe</th>
                </tr>
              </thead>
              <tbody>
                {(result?.items ?? []).map((entry) => (
                  <AuditRow key={entry.id} entry={entry} />
                ))}
                {result && result.items.length === 0 && (
                  <tr>
                    <td
                      className="p-6 text-center text-muted-foreground"
                      colSpan={5}
                    >
                      Sem registos para os filtros seleccionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {result && result.pageCount > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {result.total} registo(s) · página {result.page}/{result.pageCount}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= result.pageCount || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              Seguinte
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function AuditRow({ entry }: { entry: AuditLogEntry }) {
  const metaText = entry.metadata
    ? JSON.stringify(entry.metadata)
    : "";
  return (
    <tr className="border-b last:border-0 align-top">
      <td className="whitespace-nowrap p-3 text-muted-foreground">
        {formatDateTime(entry.createdAt)}
      </td>
      <td className="p-3">
        {entry.user ? (
          <>
            <p className="font-medium">{entry.user.name}</p>
            <p className="text-xs text-muted-foreground">{entry.user.email}</p>
          </>
        ) : (
          <span className="text-muted-foreground">Sistema</span>
        )}
      </td>
      <td className="p-3">
        <Badge variant="secondary">{auditActionLabel(entry.action)}</Badge>
      </td>
      <td className="p-3">
        <span className="font-medium">{entry.entity}</span>
        {entry.entityId && (
          <p className="text-xs text-muted-foreground">{entry.entityId}</p>
        )}
      </td>
      <td className="max-w-xs p-3">
        {metaText && (
          <code className="block truncate text-xs text-muted-foreground" title={metaText}>
            {metaText}
          </code>
        )}
      </td>
    </tr>
  );
}

// ───────────────────────────── Cópias de segurança ─────────────────────────

export function BackupsAdmin({
  needsLogin,
  userRole,
  onLogin,
}: {
  needsLogin: boolean;
  userRole: string;
  onLogin: () => void;
}) {
  const canAccess = !needsLogin && BACKUP_ROLES.includes(userRole);
  const [data, setData] = useState<BackupsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    api
      .getBackups()
      .then(setData)
      .catch((err) =>
        setError(
          err instanceof Error ? err.message : "Não foi possível carregar.",
        ),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!canAccess) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canAccess]);

  if (needsLogin) {
    return (
      <NoAccessCard
        title="Cópias de segurança"
        message="Inicie sessão para gerir as cópias de segurança."
        needsLogin
        onLogin={onLogin}
      />
    );
  }
  if (!BACKUP_ROLES.includes(userRole)) {
    return (
      <NoAccessCard
        title="Cópias de segurança"
        message="Sem permissão. Reservado à administração."
        needsLogin={false}
        onLogin={onLogin}
      />
    );
  }

  const createNow = async () => {
    setCreating(true);
    setMessage("");
    setError("");
    try {
      const res = await api.createBackup();
      setMessage(res.message);
      load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Não foi possível criar a cópia.",
      );
    } finally {
      setCreating(false);
    }
  };

  const download = async (name: string) => {
    setError("");
    try {
      await api.downloadBackup(name);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Não foi possível descarregar.",
      );
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-sm font-medium text-secondary">GESTÃO</p>
          <h1 className="text-3xl font-bold">Cópias de segurança</h1>
          <p className="mt-2 text-muted-foreground">
            Exporte a base de dados MySQL para um ficheiro .sql. As cópias são
            guardadas no servidor e podem ser descarregadas.
          </p>
        </div>
        <Button onClick={createNow} disabled={creating}>
          <Database className="mr-2 h-4 w-4" />
          {creating ? "A criar…" : "Criar cópia agora"}
        </Button>
      </div>

      {data && !data.status.available && (
        <div className="mb-4 rounded-md border border-amber-400/50 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <strong>mysqldump não encontrado.</strong> Instale o cliente MySQL ou
          defina <code>MYSQLDUMP_PATH</code> no ficheiro <code>.env</code> da API.
          Resolvido actualmente para: <code>{data.status.mysqldumpResolved}</code>.
        </div>
      )}

      {message && (
        <div className="mb-4 rounded-md border border-emerald-400/50 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Cópias existentes {data ? `(${data.backups.length})` : ""}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left">
                <tr>
                  <th className="p-3">Ficheiro</th>
                  <th className="p-3">Tamanho</th>
                  <th className="p-3">Data</th>
                  <th className="p-3 text-right">Acções</th>
                </tr>
              </thead>
              <tbody>
                {(data?.backups ?? []).map((b) => (
                  <tr key={b.name} className="border-b last:border-0">
                    <td className="p-3 font-medium">{b.name}</td>
                    <td className="p-3">{formatBytes(b.sizeBytes)}</td>
                    <td className="p-3 text-muted-foreground">
                      {formatDateTime(b.createdAt)}
                    </td>
                    <td className="p-3 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => download(b.name)}
                      >
                        <Download className="mr-1 h-4 w-4" />
                        Descarregar
                      </Button>
                    </td>
                  </tr>
                ))}
                {data && data.backups.length === 0 && (
                  <tr>
                    <td
                      className="p-6 text-center text-muted-foreground"
                      colSpan={4}
                    >
                      {loading ? "A carregar…" : "Ainda não há cópias."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <p className="mt-6 text-xs text-muted-foreground">
        Restauro (manual): pare a API, e execute no terminal —{" "}
        <code>mysql -u root betteryou_kids &lt; caminho\para\backup.sql</code>. É
        também criada automaticamente uma cópia diária às 03:00.
      </p>
    </div>
  );
}

// ─────────────────────────────── Unidades ───────────────────────────────

export function UnidadesAdmin({
  needsLogin,
  userRole,
  onLogin,
}: {
  needsLogin: boolean;
  userRole: string;
  onLogin: () => void;
}) {
  const canAccess = !needsLogin && UNIDADES_ROLES.includes(userRole);
  const [units, setUnits] = useState<Unit[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [newName, setNewName] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [editing, setEditing] = useState<Record<string, { name: string; address: string }>>({});

  const load = () => {
    setLoading(true);
    Promise.all([api.getUnitsAdmin(), api.getServices()])
      .then(([u, s]) => {
        setUnits(u);
        setServices(s);
      })
      .catch((err) =>
        setError(
          err instanceof Error ? err.message : "Não foi possível carregar.",
        ),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!canAccess) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canAccess]);

  if (needsLogin) {
    return (
      <NoAccessCard
        title="Unidades"
        message="Inicie sessão para gerir as unidades."
        needsLogin
        onLogin={onLogin}
      />
    );
  }
  if (!UNIDADES_ROLES.includes(userRole)) {
    return (
      <NoAccessCard
        title="Unidades"
        message="Sem permissão. Reservado à administração e direcção."
        needsLogin={false}
        onLogin={onLogin}
      />
    );
  }

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setMessage("");
    setError("");
    try {
      await fn();
      setMessage(ok);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Operação falhou.");
    }
  };

  const createUnit = () => {
    if (newName.trim().length < 2) {
      setError("Indique um nome válido para a unidade.");
      return;
    }
    run(
      () =>
        api.createUnit({
          name: newName.trim(),
          address: newAddress.trim() || undefined,
        }),
      "Unidade criada.",
    ).then(() => {
      setNewName("");
      setNewAddress("");
    });
  };

  return (
    <div>
      <div className="mb-6">
        <p className="mb-2 text-sm font-medium text-secondary">GESTÃO</p>
        <h1 className="text-3xl font-bold">Unidades</h1>
        <p className="mt-2 text-muted-foreground">
          Crie e faça a gestão das unidades da escola e dos serviços disponíveis
          em cada uma. Pronto para escalar para novas unidades.
        </p>
      </div>

      {message && (
        <div className="mb-4 rounded-md border border-emerald-400/50 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="h-4 w-4" /> Nova unidade
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <Field label="Nome">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ex.: Talatona"
            />
          </Field>
          <Field label="Morada (opcional)">
            <Input
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              placeholder="Endereço"
            />
          </Field>
          <Button onClick={createUnit}>Criar unidade</Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {units.map((unit) => {
          const edit = editing[unit.id] ?? {
            name: unit.name,
            address: unit.address ?? "",
          };
          const activeServiceIds = new Set(
            unit.services.filter((s) => s.active).map((s) => s.service.id),
          );
          return (
            <Card key={unit.id}>
              <CardContent className="space-y-4 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">{unit.name}</h3>
                    <Badge variant={unit.active === false ? "outline" : "default"}>
                      {unit.active === false ? "Inactiva" : "Activa"}
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      run(
                        () =>
                          api.updateUnit(unit.id, {
                            active: !(unit.active !== false),
                          }),
                        "Unidade actualizada.",
                      )
                    }
                  >
                    {unit.active === false ? "Reactivar" : "Desactivar"}
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
                  <Field label="Nome">
                    <Input
                      value={edit.name}
                      onChange={(e) =>
                        setEditing((prev) => ({
                          ...prev,
                          [unit.id]: { ...edit, name: e.target.value },
                        }))
                      }
                    />
                  </Field>
                  <Field label="Morada">
                    <Input
                      value={edit.address}
                      onChange={(e) =>
                        setEditing((prev) => ({
                          ...prev,
                          [unit.id]: { ...edit, address: e.target.value },
                        }))
                      }
                    />
                  </Field>
                  <Button
                    variant="secondary"
                    onClick={() =>
                      run(
                        () =>
                          api.updateUnit(unit.id, {
                            name: edit.name.trim(),
                            address: edit.address.trim() || undefined,
                          }),
                        "Unidade actualizada.",
                      )
                    }
                  >
                    Guardar
                  </Button>
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium">Serviços disponíveis</p>
                  <div className="flex flex-wrap gap-2">
                    {services.map((service) => {
                      const active = activeServiceIds.has(service.id);
                      return (
                        <Button
                          key={service.id}
                          type="button"
                          size="sm"
                          variant={active ? "default" : "outline"}
                          onClick={() =>
                            run(
                              () =>
                                api.setUnitService(
                                  unit.id,
                                  service.id,
                                  !active,
                                ),
                              "Serviços actualizados.",
                            )
                          }
                        >
                          {active ? (
                            <Check className="mr-1 h-3 w-3" />
                          ) : (
                            <Plus className="mr-1 h-3 w-3" />
                          )}
                          {service.name}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {units.length === 0 && (
          <p className="text-muted-foreground">
            {loading ? "A carregar…" : "Ainda não há unidades."}
          </p>
        )}
      </div>
    </div>
  );
}
