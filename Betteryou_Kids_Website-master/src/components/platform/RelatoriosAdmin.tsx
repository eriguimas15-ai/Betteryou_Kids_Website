import { useState } from "react";
import { Download, FileSpreadsheet, Receipt, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

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

function currentMonthValue(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// ─────────────────────────────── Relatórios ───────────────────────────────

const RELATORIOS_FINANCE_ROLES = ["ADMIN", "DIRECAO"];
const RELATORIOS_OPERATIONAL_ROLES = ["ADMIN", "DIRECAO", "COORDENACAO"];

export function RelatoriosAdmin({
  needsLogin,
  userRole,
  onLogin,
}: {
  needsLogin: boolean;
  userRole: string;
  onLogin: () => void;
}) {
  const canFinance = RELATORIOS_FINANCE_ROLES.includes(userRole);
  const canOperational = RELATORIOS_OPERATIONAL_ROLES.includes(userRole);
  const [month, setMonth] = useState(currentMonthValue());
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const run = async (key: string, fn: () => Promise<void>) => {
    setMessage("");
    setBusy(key);
    try {
      await fn();
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Não foi possível gerar o ficheiro.",
      );
    } finally {
      setBusy(null);
    }
  };

  if (needsLogin) {
    return (
      <Card>
        <CardContent className="space-y-4 p-8">
          <h1 className="text-2xl font-bold">Relatórios</h1>
          <p className="text-muted-foreground">
            Inicie sessão para exportar mapas financeiros e listagens.
          </p>
          <Button onClick={onLogin}>Entrar</Button>
        </CardContent>
      </Card>
    );
  }

  if (!canFinance && !canOperational) {
    return (
      <Card>
        <CardContent className="space-y-2 p-8">
          <h1 className="text-2xl font-bold">Relatórios</h1>
          <p className="text-muted-foreground">
            Sem permissão para aceder aos relatórios.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <div className="mb-7">
        <p className="mb-2 text-sm font-medium text-secondary">GESTÃO</p>
        <h1 className="text-3xl font-bold">Relatórios</h1>
        <p className="mt-2 text-muted-foreground">
          Exporte mapas e listagens em Excel e PDF. Os relatórios financeiros
          estão reservados à administração/direcção. Valores em AKZ (Kwanza).
        </p>
      </div>

      {message && (
        <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {canFinance && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Mapa de propinas e dívidas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Por aluno: serviço, programa, faturado, pago, em dívida e estado.
                Filtre por mês ou deixe em branco para todo o histórico.
              </p>
              <Field label="Mês (AAAA-MM, opcional)">
                <Input
                  type="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                />
              </Field>
              <div className="flex flex-wrap gap-2">
                <Button
                  disabled={busy !== null}
                  onClick={() =>
                    run("mapa-xlsx", () =>
                      api.downloadMapaPropinasXlsx(month || undefined),
                    )
                  }
                >
                  <Download className="mr-2 h-4 w-4" />
                  {busy === "mapa-xlsx" ? "A gerar…" : "Excel"}
                </Button>
                <Button
                  variant="outline"
                  disabled={busy !== null}
                  onClick={() =>
                    run("mapa-pdf", () =>
                      api.downloadMapaFinanceiroPdf(month || undefined),
                    )
                  }
                >
                  <Download className="mr-2 h-4 w-4" />
                  {busy === "mapa-pdf" ? "A gerar…" : "Resumo PDF"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {canFinance && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Faturação e pagamentos por período
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Faturas emitidas e pagamentos recebidos entre duas datas (duas
                folhas Excel). Sem datas, exporta todo o histórico.
              </p>
              <div className="grid grid-cols-2 gap-3">
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
              </div>
              <Button
                disabled={busy !== null}
                onClick={() =>
                  run("faturacao", () =>
                    api.downloadFaturacaoXlsx(from || undefined, to || undefined),
                  )
                }
              >
                <Download className="mr-2 h-4 w-4" />
                {busy === "faturacao" ? "A gerar…" : "Excel"}
              </Button>
            </CardContent>
          </Card>
        )}

        {canOperational && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Matrículas e lista de espera
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Alunos matriculados e entradas em lista de espera (duas folhas
                Excel) para gestão operacional.
              </p>
              <Button
                disabled={busy !== null}
                onClick={() =>
                  run("matriculas", () => api.downloadMatriculasXlsx())
                }
              >
                <Download className="mr-2 h-4 w-4" />
                {busy === "matriculas" ? "A gerar…" : "Excel"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Os recibos individuais de pagamento descarregam-se no separador
        «Faturas e pagamentos» do módulo Financeiro, em cada pagamento
        registado.
      </p>
    </div>
  );
}
