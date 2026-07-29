import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import { Trash2 } from "lucide-react";
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
  type FeePlan,
  type FeePlanPayload,
  type FeeKind,
  type FeeProgram,
  type Invoice,
  type InvoicePayload,
  type InvoiceStatus,
  type Payment,
  type PaymentMethod,
  type PaymentPayload,
  type GenerateInvoicesPayload,
  type FinanceiroOverview,
  type FinanceiroStudentBalance,
  type Student,
  type Unit,
  type AcademicYear,
  type ServiceItem,
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

const FINANCEIRO_MANAGE_ROLES = ["ADMIN", "DIRECAO"];

const INVOICE_STATUS_OPTIONS: Array<{ value: InvoiceStatus; label: string }> = [
  { value: "PENDENTE", label: "Pendente" },
  { value: "PAGO", label: "Pago" },
  { value: "VENCIDO", label: "Em atraso" },
  { value: "ANULADO", label: "Anulada" },
];

const PAYMENT_METHOD_OPTIONS: Array<{ value: PaymentMethod; label: string }> = [
  { value: "NUMERARIO", label: "Numerário" },
  { value: "TRANSFERENCIA", label: "Transferência" },
  { value: "MULTICAIXA", label: "Multicaixa" },
  { value: "TPA", label: "TPA" },
  { value: "OUTRO", label: "Outro" },
];

const FEE_KIND_OPTIONS: Array<{ value: FeeKind; label: string }> = [
  { value: "PROPINA", label: "Propina (mensal)" },
  { value: "TAXA", label: "Taxa (anual/inscrição)" },
  { value: "PRODUTO", label: "Produto/serviço" },
];

const FEE_PROGRAM_OPTIONS: Array<{ value: FeeProgram; label: string }> = [
  { value: "MEIO_TEMPO", label: "Meio tempo (sem alimentação)" },
  { value: "MEIO_TEMPO_ALIMENTACAO", label: "Meio tempo (com alimentação)" },
  { value: "TEMPO_INTEIRO", label: "Tempo inteiro" },
  { value: "REGULAR", label: "Regular (1.º Ciclo)" },
  { value: "INTEGRAL", label: "Integral (1.º Ciclo)" },
];

function feeKindLabel(kind: FeeKind): string {
  return FEE_KIND_OPTIONS.find((o) => o.value === kind)?.label || kind;
}

function feeProgramLabel(program: FeeProgram | null): string {
  if (!program) return "—";
  return (
    FEE_PROGRAM_OPTIONS.find((o) => o.value === program)?.label || program
  );
}

function formatAkz(n: number | null | undefined): string {
  if (n == null) return "—";
  return `${n.toLocaleString("pt-PT")} AKZ`;
}

function invoiceStatusLabel(status: InvoiceStatus): string {
  return (
    INVOICE_STATUS_OPTIONS.find((o) => o.value === status)?.label || status
  );
}

function invoiceStatusBadgeVariant(
  status: InvoiceStatus,
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "PAGO") return "default";
  if (status === "VENCIDO") return "destructive";
  if (status === "ANULADO") return "outline";
  return "secondary";
}

function paymentMethodLabel(method: PaymentMethod): string {
  return (
    PAYMENT_METHOD_OPTIONS.find((o) => o.value === method)?.label || method
  );
}

function currentMonthValue(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function todayValue(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatFinanceiroDate(value: string): string {
  try {
    return format(parseISO(value), "dd/MM/yyyy", { locale: pt });
  } catch {
    return value;
  }
}

function invoicePaidTotal(invoice: Invoice): number {
  return (invoice.payments || []).reduce((sum, p) => sum + p.amountAkz, 0);
}

type FinanceiroTab = "resumo" | "faturas" | "propinas";

const FINANCEIRO_TABS: Array<{ value: FinanceiroTab; label: string }> = [
  { value: "resumo", label: "Visão geral" },
  { value: "faturas", label: "Faturas e pagamentos" },
  { value: "propinas", label: "Planos de propina" },
];

export function FinanceiroAdmin({
  needsLogin,
  userRole,
  onLogin,
}: {
  needsLogin: boolean;
  userRole: string;
  onLogin: () => void;
}) {
  const canManage = FINANCEIRO_MANAGE_ROLES.includes(userRole);
  const [tab, setTab] = useState<FinanceiroTab>("resumo");

  if (needsLogin) {
    return (
      <Card>
        <CardContent className="space-y-4 p-8">
          <h1 className="text-2xl font-bold">Financeiro</h1>
          <p className="text-muted-foreground">
            Inicie sessão para gerir propinas, faturação e pagamentos.
          </p>
          <Button onClick={onLogin}>Entrar</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <div className="mb-7">
        <p className="mb-2 text-sm font-medium text-secondary">GESTÃO</p>
        <h1 className="text-3xl font-bold">Financeiro</h1>
        <p className="mt-2 text-muted-foreground">
          Defina planos de propina, gere as mensalidades por mês, registe
          pagamentos e acompanhe os saldos em atraso. Valores em AKZ (Kwanza).
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {FINANCEIRO_TABS.map((t) => (
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

      {tab === "resumo" ? (
        <FinanceiroResumoTab />
      ) : tab === "faturas" ? (
        <FinanceiroFaturasTab canManage={canManage} />
      ) : (
        <FinanceiroPropinasTab canManage={canManage} />
      )}
    </div>
  );
}

function FinanceiroResumoTab() {
  const [overview, setOverview] = useState<FinanceiroOverview | null>(null);
  const [students, setStudents] = useState<FinanceiroStudentBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.all([api.getFinanceiroOverview(), api.getFinanceiroStudents()])
      .then(([ov, st]) => {
        setOverview(ov);
        setStudents(st);
      })
      .catch((err) =>
        setMessage(
          err instanceof Error
            ? err.message
            : "Não foi possível carregar o resumo financeiro.",
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  const withDebt = students
    .filter((s) => s.outstandingAkz > 0)
    .sort((a, b) => b.outstandingAkz - a.outstandingAkz);

  return (
    <div className="space-y-6">
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Total recebido</p>
            <p className="mt-1 text-2xl font-bold">
              {formatAkz(overview?.totalReceivedAkz ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">
              Faturas por regularizar
            </p>
            <p className="mt-1 text-2xl font-bold">
              {overview?.outstandingCount ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Faturas pagas</p>
            <p className="mt-1 text-2xl font-bold">
              {overview?.byStatus?.PAGO?.count ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Alunos</p>
            <p className="mt-1 text-2xl font-bold">
              {overview?.studentsCount ?? 0}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Saldos em dívida</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">A carregar…</p>
          ) : withDebt.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Sem saldos por regularizar.
            </p>
          ) : (
            <div className="divide-y rounded-lg border">
              {withDebt.map((s) => (
                <div
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium">{s.childFullName}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.service?.name || "—"}
                      {s.unit?.name ? ` · ${s.unit.name}` : ""} ·{" "}
                      {s.guardianFullName}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="destructive" className="text-sm">
                      {formatAkz(s.outstandingAkz)}
                    </Badge>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Pago {formatAkz(s.paidAkz)} de {formatAkz(s.billedAkz)}
                    </p>
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

type GenerateForm = {
  referenceMonth: string;
  dueDate: string;
  feePlanId: string;
  amountAkz: string;
};

type PaymentForm = {
  amountAkz: string;
  paidAt: string;
  method: PaymentMethod;
  reference: string;
  receiptRef: string;
};

function emptyPaymentForm(amountAkz: number): PaymentForm {
  return {
    amountAkz: amountAkz > 0 ? String(amountAkz) : "",
    paidAt: todayValue(),
    method: "NUMERARIO",
    reference: "",
    receiptRef: "",
  };
}

function FinanceiroFaturasTab({ canManage }: { canManage: boolean }) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [feePlans, setFeePlans] = useState<FeePlan[]>([]);
  const [students, setStudents] = useState<FinanceiroStudentBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [filterStudent, setFilterStudent] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [genForm, setGenForm] = useState<GenerateForm>({
    referenceMonth: currentMonthValue(),
    dueDate: todayValue(),
    feePlanId: "",
    amountAkz: "",
  });
  const [generating, setGenerating] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payForm, setPayForm] = useState<PaymentForm>(emptyPaymentForm(0));
  const [savingPayment, setSavingPayment] = useState(false);

  const loadInvoices = () => {
    setLoading(true);
    api
      .getInvoices({
        studentId: filterStudent || undefined,
        status: (filterStatus as InvoiceStatus) || undefined,
        month: filterMonth || undefined,
      })
      .then(setInvoices)
      .catch((err) =>
        setMessage(
          err instanceof Error
            ? err.message
            : "Não foi possível carregar as faturas.",
        ),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    api.getFeePlans().then(setFeePlans).catch(() => setFeePlans([]));
    api
      .getFinanceiroStudents()
      .then(setStudents)
      .catch(() => setStudents([]));
  }, []);

  useEffect(() => {
    loadInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStudent, filterStatus, filterMonth]);

  const reloadStudents = () => {
    api
      .getFinanceiroStudents()
      .then(setStudents)
      .catch(() => setStudents([]));
  };

  const changeStudentProgram = async (
    studentId: string,
    program: FeeProgram | null,
  ) => {
    try {
      await api.setStudentProgram(studentId, program);
      reloadStudents();
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : "Não foi possível actualizar o programa do aluno.",
      );
    }
  };

  const generate = async () => {
    if (!genForm.referenceMonth || !genForm.dueDate) {
      setMessage("Indique o mês de referência e a data de vencimento.");
      return;
    }
    setGenerating(true);
    setMessage("");
    try {
      const payload: GenerateInvoicesPayload = {
        referenceMonth: genForm.referenceMonth,
        dueDate: genForm.dueDate,
        feePlanId: genForm.feePlanId || null,
        amountAkz: genForm.amountAkz ? Number(genForm.amountAkz) : undefined,
      };
      const result = await api.generateInvoices(payload);
      setMessage(result.message);
      loadInvoices();
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : "Não foi possível gerar as mensalidades.",
      );
    } finally {
      setGenerating(false);
    }
  };

  const openPayment = (invoice: Invoice) => {
    if (payingId === invoice.id) {
      setPayingId(null);
      return;
    }
    const outstanding = Math.max(
      invoice.amountAkz - invoicePaidTotal(invoice),
      0,
    );
    setPayingId(invoice.id);
    setPayForm(emptyPaymentForm(outstanding));
    setMessage("");
  };

  const submitPayment = async (invoiceId: string) => {
    if (!payForm.amountAkz || Number(payForm.amountAkz) <= 0) {
      setMessage("Indique o valor pago.");
      return;
    }
    if (!payForm.paidAt) {
      setMessage("Indique a data do pagamento.");
      return;
    }
    setSavingPayment(true);
    setMessage("");
    try {
      const payload: PaymentPayload = {
        amountAkz: Number(payForm.amountAkz),
        paidAt: payForm.paidAt,
        method: payForm.method,
        reference: payForm.reference.trim() || null,
        receiptRef: payForm.receiptRef.trim() || null,
      };
      await api.createPayment(invoiceId, payload);
      setMessage("Pagamento registado.");
      setPayingId(null);
      loadInvoices();
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : "Não foi possível registar o pagamento.",
      );
    } finally {
      setSavingPayment(false);
    }
  };

  const cancelInvoice = async (id: string) => {
    if (!window.confirm("Anular esta fatura?")) return;
    try {
      await api.cancelInvoice(id);
      loadInvoices();
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Não foi possível anular a fatura.",
      );
    }
  };

  const removeInvoice = async (id: string) => {
    if (!window.confirm("Eliminar definitivamente esta fatura?")) return;
    try {
      await api.deleteInvoice(id);
      loadInvoices();
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : "Não foi possível eliminar a fatura.",
      );
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {canManage && (
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Gerar mensalidades</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Mês de referência">
              <Input
                type="month"
                value={genForm.referenceMonth}
                onChange={(e) =>
                  setGenForm((f) => ({ ...f, referenceMonth: e.target.value }))
                }
              />
            </Field>
            <Field label="Data de vencimento">
              <Input
                type="date"
                value={genForm.dueDate}
                onChange={(e) =>
                  setGenForm((f) => ({ ...f, dueDate: e.target.value }))
                }
              />
            </Field>
            <Field label="Plano (opcional)">
              <Select
                value={genForm.feePlanId || "none"}
                onValueChange={(v) =>
                  setGenForm((f) => ({
                    ...f,
                    feePlanId: v === "none" ? "" : v,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Automático" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    Automático (serviço + programa)
                  </SelectItem>
                  {feePlans
                    .filter((p) => p.active && p.kind === "PROPINA")
                    .map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} · {formatAkz(p.amountAkz)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Valor AKZ (força valor fixo)">
              <Input
                type="number"
                min={0}
                value={genForm.amountAkz}
                onChange={(e) =>
                  setGenForm((f) => ({ ...f, amountAkz: e.target.value }))
                }
                placeholder="Deixe vazio para automático"
              />
            </Field>
            <p className="text-xs text-muted-foreground">
              Sem plano nem valor, a propina é resolvida pela unidade + serviço
              + programa de cada aluno (com recurso por serviço se a unidade não
              tiver plano). Aplica-se o desconto de irmãos (2.º 10%, seguintes
              5%). Alunos já faturados no mês são ignorados.
            </p>
            {message && (
              <p className="text-sm text-muted-foreground">{message}</p>
            )}
            <Button onClick={generate} disabled={generating}>
              {generating ? "A gerar…" : "Gerar mensalidades"}
            </Button>

            <div className="space-y-2 border-t pt-4">
              <p className="text-sm font-medium">Programa por aluno</p>
              <p className="text-xs text-muted-foreground">
                Define o tempo/programa de cada aluno para a resolução
                automática da propina.
              </p>
              {students.length === 0 ? (
                <p className="text-xs text-muted-foreground">Sem alunos.</p>
              ) : (
                <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                  {students.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium">
                          {s.childFullName}
                        </p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {s.service?.name || "—"}
                        </p>
                      </div>
                      <Select
                        value={s.program || "none"}
                        onValueChange={(v) =>
                          changeStudentProgram(
                            s.id,
                            v === "none" ? null : (v as FeeProgram),
                          )
                        }
                      >
                        <SelectTrigger className="h-8 w-40 text-xs">
                          <SelectValue placeholder="Sem programa" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sem programa</SelectItem>
                          {FEE_PROGRAM_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className={canManage ? "lg:col-span-2" : "lg:col-span-3"}>
        <CardHeader>
          <CardTitle className="text-lg">Faturas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="Aluno">
              <Select
                value={filterStudent || "all"}
                onValueChange={(v) =>
                  setFilterStudent(v === "all" ? "" : v)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os alunos</SelectItem>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.childFullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Estado">
              <Select
                value={filterStatus || "all"}
                onValueChange={(v) => setFilterStatus(v === "all" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {INVOICE_STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Mês">
              <Input
                type="month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
              />
            </Field>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">A carregar…</p>
          ) : invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Sem faturas para os filtros seleccionados.
            </p>
          ) : (
            <div className="space-y-3">
              {invoices.map((invoice) => {
                const paid = invoicePaidTotal(invoice);
                const outstanding = Math.max(invoice.amountAkz - paid, 0);
                return (
                  <div
                    key={invoice.id}
                    className="rounded-lg border p-4 text-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">
                          {invoice.student?.childFullName || "Aluno"} ·{" "}
                          {invoice.referenceMonth}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {invoice.description} · Vence{" "}
                          {formatFinanceiroDate(invoice.dueDate)}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Pago {formatAkz(paid)} de{" "}
                          {formatAkz(invoice.amountAkz)}
                          {outstanding > 0
                            ? ` · Em dívida ${formatAkz(outstanding)}`
                            : ""}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge
                          variant={invoiceStatusBadgeVariant(invoice.status)}
                        >
                          {invoiceStatusLabel(invoice.status)}
                        </Badge>
                        {canManage && (
                          <div className="flex flex-wrap justify-end gap-2">
                            {invoice.status !== "ANULADO" &&
                              invoice.status !== "PAGO" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openPayment(invoice)}
                                >
                                  Registar pagamento
                                </Button>
                              )}
                            {invoice.status !== "ANULADO" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => cancelInvoice(invoice.id)}
                              >
                                Anular
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeInvoice(invoice.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    {(invoice.payments?.length ?? 0) > 0 && (
                      <div className="mt-3 divide-y rounded-md border bg-muted/30">
                        {invoice.payments!.map((p) => (
                          <div
                            key={p.id}
                            className="flex items-center justify-between px-3 py-2 text-xs"
                          >
                            <span>
                              {formatFinanceiroDate(p.paidAt)} ·{" "}
                              {paymentMethodLabel(p.method)}
                              {p.receiptRef ? ` · Recibo ${p.receiptRef}` : ""}
                            </span>
                            <span className="flex items-center gap-2">
                              <span className="font-medium">
                                {formatAkz(p.amountAkz)}
                              </span>
                              {canManage && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2"
                                  onClick={() =>
                                    api
                                      .downloadReciboPdf(p.id)
                                      .catch((err) =>
                                        setMessage(
                                          err instanceof Error
                                            ? err.message
                                            : "Não foi possível gerar o recibo.",
                                        ),
                                      )
                                  }
                                >
                                  <Receipt className="mr-1 h-3 w-3" />
                                  Recibo
                                </Button>
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {canManage && payingId === invoice.id && (
                      <div className="mt-3 space-y-3 rounded-md border p-3">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <Field label="Valor pago (AKZ)">
                            <Input
                              type="number"
                              min={1}
                              value={payForm.amountAkz}
                              onChange={(e) =>
                                setPayForm((f) => ({
                                  ...f,
                                  amountAkz: e.target.value,
                                }))
                              }
                            />
                          </Field>
                          <Field label="Data">
                            <Input
                              type="date"
                              value={payForm.paidAt}
                              onChange={(e) =>
                                setPayForm((f) => ({
                                  ...f,
                                  paidAt: e.target.value,
                                }))
                              }
                            />
                          </Field>
                          <Field label="Método">
                            <Select
                              value={payForm.method}
                              onValueChange={(v) =>
                                setPayForm((f) => ({
                                  ...f,
                                  method: v as PaymentMethod,
                                }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {PAYMENT_METHOD_OPTIONS.map((o) => (
                                  <SelectItem key={o.value} value={o.value}>
                                    {o.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </Field>
                          <Field label="Referência / recibo (opcional)">
                            <Input
                              value={payForm.receiptRef}
                              onChange={(e) =>
                                setPayForm((f) => ({
                                  ...f,
                                  receiptRef: e.target.value,
                                }))
                              }
                              placeholder="Ex.: REC-2026-001"
                            />
                          </Field>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => submitPayment(invoice.id)}
                            disabled={savingPayment}
                          >
                            {savingPayment ? "A guardar…" : "Guardar pagamento"}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setPayingId(null)}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

type FeePlanForm = {
  name: string;
  kind: FeeKind;
  amountAkz: string;
  unitId: string;
  serviceId: string;
  program: string;
  description: string;
};

const emptyFeePlanForm: FeePlanForm = {
  name: "",
  kind: "PROPINA",
  amountAkz: "",
  unitId: "",
  serviceId: "",
  program: "",
  description: "",
};

function FinanceiroPropinasTab({ canManage }: { canManage: boolean }) {
  const [plans, setPlans] = useState<FeePlan[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [form, setForm] = useState<FeePlanForm>(emptyFeePlanForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadPlans = () => {
    setLoading(true);
    api
      .getFeePlans()
      .then(setPlans)
      .catch((err) =>
        setMessage(
          err instanceof Error
            ? err.message
            : "Não foi possível carregar os planos.",
        ),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPlans();
    api.getServices().then(setServices).catch(() => setServices([]));
    api.getUnitsAdmin().then(setUnits).catch(() => setUnits([]));
  }, []);

  const resetForm = () => {
    setForm(emptyFeePlanForm);
    setEditingId(null);
  };

  const startEdit = (plan: FeePlan) => {
    setEditingId(plan.id);
    setForm({
      name: plan.name,
      kind: plan.kind,
      amountAkz: String(plan.amountAkz),
      unitId: plan.unitId || "",
      serviceId: plan.serviceId || "",
      program: plan.program || "",
      description: plan.description || "",
    });
  };

  const submit = async () => {
    if (!form.name.trim() || !form.amountAkz) {
      setMessage("Indique o nome e o valor da propina.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const payload: FeePlanPayload = {
        name: form.name.trim(),
        kind: form.kind,
        amountAkz: Number(form.amountAkz),
        unitId: form.unitId || null,
        serviceId: form.serviceId || null,
        program:
          form.kind === "PROPINA" && form.program
            ? (form.program as FeeProgram)
            : null,
        description: form.description.trim() || null,
      };
      if (editingId) {
        await api.updateFeePlan(editingId, payload);
        setMessage("Plano actualizado.");
      } else {
        await api.createFeePlan(payload);
        setMessage("Plano criado.");
      }
      resetForm();
      loadPlans();
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Não foi possível guardar o plano.",
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (plan: FeePlan) => {
    try {
      await api.updateFeePlan(plan.id, { active: !plan.active });
      loadPlans();
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Não foi possível actualizar.",
      );
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Eliminar este plano de propina?")) return;
    try {
      await api.deleteFeePlan(id);
      loadPlans();
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Não foi possível eliminar.",
      );
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {canManage && (
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">
              {editingId ? "Editar plano" : "Novo plano / taxa / produto"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Nome">
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Ex.: Creche — Tempo inteiro"
              />
            </Field>
            <Field label="Natureza">
              <Select
                value={form.kind}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, kind: v as FeeKind }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FEE_KIND_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Valor (AKZ)">
              <Input
                type="number"
                min={0}
                value={form.amountAkz}
                onChange={(e) =>
                  setForm((f) => ({ ...f, amountAkz: e.target.value }))
                }
                placeholder="Ex.: 295000"
              />
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
            <Field label="Serviço (opcional)">
              <Select
                value={form.serviceId || "none"}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, serviceId: v === "none" ? "" : v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os serviços" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Todos os serviços</SelectItem>
                  {services.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            {form.kind === "PROPINA" && (
              <Field label="Programa/tempo">
                <Select
                  value={form.program || "none"}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, program: v === "none" ? "" : v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sem programa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem programa</SelectItem>
                    {FEE_PROGRAM_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
            <Field label="Descrição (opcional)">
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={2}
              />
            </Field>
            {message && (
              <p className="text-sm text-muted-foreground">{message}</p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button onClick={submit} disabled={saving}>
                {saving ? "A guardar…" : editingId ? "Guardar" : "Criar plano"}
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
          <CardTitle className="text-lg">Preçário (propinas, taxas, produtos)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">A carregar…</p>
          ) : plans.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ainda não há itens no preçário.
            </p>
          ) : (
            <div className="divide-y rounded-lg border">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium">
                      {plan.name}{" "}
                      <Badge variant="secondary" className="ml-1">
                        {feeKindLabel(plan.kind)}
                      </Badge>
                      {plan.unit?.name && (
                        <Badge variant="outline" className="ml-1">
                          {plan.unit.name}
                        </Badge>
                      )}
                      {!plan.active && (
                        <Badge variant="outline" className="ml-1">
                          Inactivo
                        </Badge>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatAkz(plan.amountAkz)}
                      {plan.service?.name ? ` · ${plan.service.name}` : ""}
                      {plan.program
                        ? ` · ${feeProgramLabel(plan.program)}`
                        : ""}
                    </p>
                  </div>
                  {canManage && (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEdit(plan)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleActive(plan)}
                      >
                        {plan.active ? "Desactivar" : "Activar"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => remove(plan.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
