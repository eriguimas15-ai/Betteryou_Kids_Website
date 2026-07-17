import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { format, parseISO, subYears } from "date-fns";
import { pt } from "date-fns/locale";
import {
  BarChart3,
  Bell,
  Briefcase,
  CalendarIcon,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  DoorOpen,
  FileText,
  FileUser,
  Home,
  Menu,
  Plus,
  Pencil,
  RefreshCw,
  School,
  Shield,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import logo from "@/assets/logoPNG.png";
import {
  api,
  SESSION_EXPIRED_EVENT,
  type AcademicYear,
  type AccessProfile,
  type ActivityOffering,
  type ActivityPayload,
  type AdminRoom,
  type ClassGroup,
  type DashboardOverview,
  type EnrollmentAdmin,
  type EnrollmentPayload,
  type EnrollmentResult,
  type EnrollmentRoom,
  type JobOpening,
  type PlatformUser,
  type PublicTestimonial,
  type RenewalItem,
  type RoomsForEnrollment,
  type ServiceItem,
  type Student,
  type StudentFichaPayload,
  type Unit,
  type WaitlistItem,
} from "@/lib/api";
import {
  ActivitiesPicker,
  EmergenciesEditor,
  GuardiansEditor,
} from "@/components/platform/PeopleAndActivitiesFields";
import {
  activitiesForService,
  activitiesFromStudent,
  emptyEmergency,
  emptyGuardian,
  emergenciesFromStudent,
  filterActivitiesForService,
  guardiansFromStudent,
  missingSharedFormFields,
  toApiEmergencies,
  toApiGuardians,
  type ActivityOption,
  type EmergencyForm,
  type GuardianForm,
} from "@/lib/shared-form";

function mapPublicActivities(
  list: Array<{
    name: string;
    pricing?: "INCLUDED" | "PAID";
    priceAkz?: number | null;
  }>,
): ActivityOption[] | null {
  if (
    list.length === 0 ||
    !list.every((item) => item.pricing === "INCLUDED" || item.pricing === "PAID")
  ) {
    return null;
  }
  return list.map((item) => ({
    name: item.name,
    pricing: item.pricing as "INCLUDED" | "PAID",
    priceAkz: item.priceAkz ?? null,
  }));
}

type View =
  | "dashboard"
  | "inscricoes"
  | "renovacoes"
  | "ficha"
  | "espera"
  | "salas"
  | "turmas"
  | "actividades"
  | "emprego"
  | "conteudo"
  | "acessos"
  | "login";

const YEAR = "2026/2027";

const PUBLIC_MODULES: View[] = ["inscricoes", "renovacoes", "emprego"];

function parseModules(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter((x): x is string => typeof x === "string");
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((x): x is string => typeof x === "string");
      }
    } catch {
      return [];
    }
  }
  return [];
}

function loadStoredModules(): string[] {
  try {
    return parseModules(JSON.parse(localStorage.getItem("by_user_modules") || "[]"));
  } catch {
    return [];
  }
}

function hasFichaAccess(modules: string[], role: string) {
  return modules.includes("ficha") || role === "ENCARREGADO";
}

function navItemsFor(modules: string[], loggedIn: boolean, role = "") {
  if (!loggedIn) {
    return nav.filter((item) =>
      ["inscricoes", "renovacoes", "emprego"].includes(item.id),
    );
  }
  return nav.filter((item) => {
    if (item.id === "ficha") return hasFichaAccess(modules, role);
    return modules.includes(item.id);
  });
}

function canAccessView(
  view: View,
  modules: string[],
  loggedIn: boolean,
  role = "",
) {
  if (view === "login") return true;
  if (PUBLIC_MODULES.includes(view)) return true;
  if (!loggedIn) return false;
  if (view === "ficha") return hasFichaAccess(modules, role);
  return modules.includes(view);
}

const nav = [
  { id: "dashboard" as View, label: "Visão geral", icon: BarChart3 },
  { id: "inscricoes" as View, label: "Inscrições", icon: ClipboardList },
  { id: "renovacoes" as View, label: "Renovações", icon: RefreshCw },
  { id: "ficha" as View, label: "Ficha do aluno", icon: FileUser },
  { id: "espera" as View, label: "Lista de espera", icon: Users },
  { id: "salas" as View, label: "Salas", icon: DoorOpen },
  { id: "turmas" as View, label: "Turmas", icon: Users },
  { id: "actividades" as View, label: "Actividades", icon: Sparkles },
  { id: "emprego" as View, label: "Vagas de emprego", icon: Briefcase },
  { id: "conteudo" as View, label: "Conteúdo do site", icon: FileText },
  { id: "acessos" as View, label: "Utilizadores e acessos", icon: Shield },
];

export function BirthDateField({
  value,
  onChange,
  required = false,
  id,
  label = "Data de nascimento",
}: {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  id?: string;
  label?: string;
}) {
  const selected = value
    ? (() => {
        try {
          return parseISO(value.length === 10 ? `${value}T12:00:00` : value);
        } catch {
          return undefined;
        }
      })()
    : undefined;

  const [month, setMonth] = useState<Date>(
    () => selected ?? subYears(new Date(), 4),
  );

  useEffect(() => {
    if (selected) setMonth(selected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2004 }, (_, i) => currentYear - i);
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: String(i),
    label: format(new Date(2020, i, 1), "MMMM", { locale: pt }),
  }));

  return (
    <Field label={label}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selected
              ? format(selected, "dd/MM/yyyy", { locale: pt })
              : "Seleccionar data (dd/mm/aaaa)"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="z-50 w-auto p-3" align="start">
          <div className="mb-3 flex gap-2">
            <Select
              value={String(month.getMonth())}
              onValueChange={(m) =>
                setMonth(new Date(month.getFullYear(), Number(m), 1))
              }
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={String(month.getFullYear())}
              onValueChange={(y) =>
                setMonth(new Date(Number(y), month.getMonth(), 1))
              }
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {years.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Calendar
            mode="single"
            month={month}
            onMonthChange={setMonth}
            selected={selected}
            onSelect={(date) => {
              if (!date) {
                onChange("");
                return;
              }
              onChange(format(date, "yyyy-MM-dd"));
            }}
            locale={pt}
            weekStartsOn={1}
            disabled={{ after: new Date() }}
            fromDate={new Date(2005, 0, 1)}
            toDate={new Date()}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      {required && (
        <input type="hidden" value={value} required readOnly aria-hidden />
      )}
    </Field>
  );
}

export default function Platform({
  initialView = "dashboard",
}: {
  initialView?: View;
}) {
  const [view, setView] = useState<View>(() => {
    const existingToken = localStorage.getItem("by_access_token");
    const existingModules = loadStoredModules();
    const existingRole = localStorage.getItem("by_user_role") || "";
    if (
      canAccessView(initialView, existingModules, !!existingToken, existingRole)
    ) {
      return initialView;
    }
    return "inscricoes";
  });
  const [mobileMenu, setMobileMenu] = useState(false);
  const [loginMode, setLoginMode] = useState<"login" | "register">("login");
  const [unit, setUnit] = useState("Gika");
  const [service, setService] = useState("Pré-Escolar");
  const [levelLabel, setLevelLabel] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [roomsResult, setRoomsResult] = useState<RoomsForEnrollment | null>(
    null,
  );
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [submitted, setSubmitted] = useState<EnrollmentResult | null>(null);
  const [submissionError, setSubmissionError] = useState("");
  const [child, setChild] = useState("");
  const [dashboard, setDashboard] = useState<DashboardOverview | null>(null);
  const [sessionNotice, setSessionNotice] = useState("");
  const [userName, setUserName] = useState(
    () => localStorage.getItem("by_user_name") || "Administração",
  );
  const [userRole, setUserRole] = useState(
    () => localStorage.getItem("by_user_role") || "",
  );
  const [modules, setModules] = useState<string[]>(() => loadStoredModules());
  const [token, setToken] = useState(
    () => localStorage.getItem("by_access_token"),
  );

  const clearAuth = () => {
    localStorage.removeItem("by_access_token");
    localStorage.removeItem("by_refresh_token");
    localStorage.removeItem("by_user_name");
    localStorage.removeItem("by_user_role");
    localStorage.removeItem("by_user_modules");
    setToken(null);
    setUserName("Visitante");
    setUserRole("");
    setModules([]);
    setDashboard(null);
  };

  const availableServices =
    unit === "Gika"
      ? ["Creche", "Pré-Escolar", "Jardim de Infância", "1.º Ciclo", "ATL"]
      : ["Creche", "Pré-Escolar", "Jardim de Infância", "ATL"];

  const goTo = (
    next: View,
    auth?: { modules?: string[]; loggedIn?: boolean; role?: string },
  ) => {
    const loggedIn =
      auth?.loggedIn ?? !!localStorage.getItem("by_access_token");
    const currentModules = auth?.modules ?? loadStoredModules();
    const currentRole =
      auth?.role ?? (localStorage.getItem("by_user_role") || userRole);
    if (!canAccessView(next, currentModules, loggedIn, currentRole)) {
      setView(loggedIn ? "inscricoes" : "login");
      setMobileMenu(false);
      return;
    }
    setView(next);
    setMobileMenu(false);
  };

  const forceLogoutToLogin = (notice?: string) => {
    clearAuth();
    setSessionNotice(
      notice || "Sessão expirada. Entre novamente para continuar.",
    );
    setView("login");
    setMobileMenu(false);
  };

  useEffect(() => {
    const onExpired = () => {
      forceLogoutToLogin();
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (view === "login") return;
    if (!token) {
      if (!PUBLIC_MODULES.includes(view)) setView("login");
      return;
    }
    // Ainda a carregar módulos após login — não redirecionar
    if (modules.length === 0) return;
    if (!canAccessView(view, modules, true, userRole)) {
      const fallback =
        (nav.find((item) => modules.includes(item.id))?.id as View) ||
        "inscricoes";
      setView(fallback);
    }
  }, [token, view, modules, userRole]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    api
      .me()
      .then((user) => {
        if (cancelled) return;
        const userModules = parseModules(user.modules);
        setUserName(user.name);
        setUserRole(user.role);
        if (userModules.length > 0) {
          setModules(userModules);
          localStorage.setItem(
            "by_user_modules",
            JSON.stringify(userModules),
          );
        }
        localStorage.setItem("by_user_name", user.name);
        localStorage.setItem("by_user_role", user.role);
      })
      .catch(() => {
        // 401 → SESSION_EXPIRED_EVENT → forceLogoutToLogin
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (service !== "1.º Ciclo") setLevelLabel("");
  }, [service]);

  useEffect(() => {
    if (!birthDate || !unit || !service) {
      setRoomsResult(null);
      setSelectedRoomId("");
      return;
    }
    let active = true;
    setRoomsLoading(true);
    api
      .getRoomsForEnrollment({
        unitName: unit,
        serviceName: service,
        yearLabel: YEAR,
        birthDate,
        levelLabel:
          service === "1.º Ciclo" && levelLabel ? levelLabel : undefined,
      })
      .then((result) => {
        if (!active) return;
        setRoomsResult(result);
        setSelectedRoomId((current) =>
          result.rooms.some((room) => room.id === current) ? current : "",
        );
      })
      .catch(() => {
        if (active) setRoomsResult(null);
      })
      .finally(() => {
        if (active) setRoomsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [unit, service, birthDate, levelLabel]);

  useEffect(() => {
    if (!token) return;
    if (view === "dashboard") {
      api.getDashboard().then(setDashboard).catch(() => setDashboard(null));
    }
  }, [view, token]);

  const submit = async (payload: EnrollmentPayload) => {
    setSubmissionError("");
    const rooms = roomsResult?.rooms ?? [];
    if (rooms.length > 0 && !selectedRoomId) {
      setSubmissionError("Seleccione uma sala, ou aguarde se não houver vagas.");
      return;
    }
    try {
      const result = await api.createEnrollment({
        ...payload,
        yearLabel: YEAR,
        unitName: unit,
        serviceName: service,
        roomId: selectedRoomId || undefined,
        childFullName: payload.childFullName || child,
        childBirthDate: payload.childBirthDate || birthDate,
      });
      setSubmitted(result);
    } catch (error) {
      setSubmissionError(
        error instanceof Error
          ? error.message
          : "Não foi possível submeter a candidatura.",
      );
    }
  };

  const onLogin = async (email: string, password: string) => {
    const result = await api.login(email, password);
    let userModules = parseModules(result.user.modules);
    let role = result.user.role;

    localStorage.setItem("by_access_token", result.accessToken);
    localStorage.setItem("by_refresh_token", result.refreshToken);
    localStorage.setItem("by_user_name", result.user.name);
    localStorage.setItem("by_user_role", role);
    localStorage.setItem("by_user_modules", JSON.stringify(userModules));

    if (userModules.length === 0) {
      try {
        const me = await api.me();
        userModules = parseModules(me.modules);
        role = me.role;
        localStorage.setItem("by_user_role", role);
        localStorage.setItem("by_user_modules", JSON.stringify(userModules));
      } catch {
        // mantém o que veio do login
      }
    }

    const firstView: View = userModules.includes("dashboard")
      ? "dashboard"
      : userModules.includes("ficha") || role === "ENCARREGADO"
        ? "ficha"
        : (nav.find((item) => userModules.includes(item.id))?.id as View) ||
          "inscricoes";

    setToken(result.accessToken);
    setUserName(result.user.name);
    setUserRole(role);
    setModules(userModules);
    setSessionNotice("");
    setLoginMode("login");
    setMobileMenu(false);
    setView(firstView);

    if (userModules.includes("dashboard")) {
      try {
        setDashboard(await api.getDashboard());
      } catch {
        setDashboard(null);
      }
    }
  };

  const visibleNav = navItemsFor(modules, !!token, userRole);

  return (
    <div className="min-h-screen bg-[#faf8fc] text-slate-800">
      <header className="sticky top-0 z-20 h-20 border-b bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <img src={logo} className="h-14 w-auto" alt="Betteryou Kids" />
            <div className="hidden border-l pl-3 text-sm md:block">
              <p className="font-semibold text-primary">Plataforma Escolar</p>
              <p className="text-muted-foreground">Ano letivo {YEAR}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild className="hidden sm:inline-flex">
              <Link to="/">
                <Home className="mr-1 h-4 w-4" />
                Site principal
              </Link>
            </Button>
            <Button variant="ghost" size="icon" aria-label="Notificações">
              <Bell className="h-5 w-5" />
            </Button>
            <div className="hidden text-right text-sm sm:block">
              <p className="font-semibold">
                {token ? userName : "Visitante"}
              </p>
              <p className="text-muted-foreground">
                {token
                  ? userRole || "Utilizador"
                  : "Acesso público a inscrições, renovações e emprego"}
              </p>
            </div>
            {!token ? (
              <Button variant="outline" size="sm" onClick={() => goTo("login")}>
                Entrar
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  clearAuth();
                  goTo("inscricoes");
                }}
              >
                Sair
              </Button>
            )}
            <Button
              className="md:hidden"
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenu(!mobileMenu)}
            >
              {mobileMenu ? <X /> : <Menu />}
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl">
        <aside
          className={`${mobileMenu ? "block" : "hidden"} fixed inset-x-0 top-20 z-10 border-b bg-white p-4 shadow-lg md:static md:block md:min-h-[calc(100vh-5rem)] md:w-60 md:border-b-0 md:border-r md:p-5 md:shadow-none`}
        >
          <nav className="space-y-1">
            {visibleNav.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => goTo(id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium transition ${
                  view === id
                    ? "bg-primary text-white shadow"
                    : "text-slate-600 hover:bg-primary/10 hover:text-primary"
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </button>
            ))}
          </nav>
          <div className="mt-7 border-t pt-5">
            <Link
              to="/"
              className="flex w-full items-center gap-3 rounded-lg bg-primary/10 px-3 py-3 text-sm font-medium text-primary hover:bg-primary/15"
            >
              <Home className="h-5 w-5" />
              Voltar ao site principal
            </Link>
          </div>
        </aside>

        <main className="min-w-0 flex-1 p-4 md:p-8">
          {view === "login" && (
            <LoginForm
              onLogin={onLogin}
              notice={sessionNotice}
              mode={loginMode}
              onModeChange={setLoginMode}
            />
          )}
          {view === "dashboard" && (
            <Dashboard
              data={dashboard}
              needsLogin={!token}
              onEnroll={() => goTo("inscricoes")}
              onLogin={() => goTo("login")}
            />
          )}
          {view === "inscricoes" && (
            <>
              <Enrollment
                unit={unit}
                service={service}
                setUnit={(next) => {
                  setUnit(next);
                  setService(next === "Gika" ? "Pré-Escolar" : "Creche");
                }}
                setService={setService}
                services={availableServices}
                levelLabel={levelLabel}
                setLevelLabel={setLevelLabel}
                birthDate={birthDate}
                setBirthDate={setBirthDate}
                roomsResult={roomsResult}
                roomsLoading={roomsLoading}
                selectedRoomId={selectedRoomId}
                setSelectedRoomId={setSelectedRoomId}
                child={child}
                setChild={setChild}
                submitted={submitted}
                submissionError={submissionError}
                onSubmit={submit}
              />
              {token &&
                modules.includes("inscricoes") &&
                ["ADMIN", "DIRECAO", "COORDENACAO"].includes(userRole) && (
                  <div className="mt-10">
                    <InscricoesGestao />
                  </div>
                )}
            </>
          )}
          {view === "espera" && (
            <Waitlist
              needsLogin={!token}
              onLogin={() => goTo("login")}
            />
          )}
          {view === "renovacoes" && (
            <Renovacoes
              loggedIn={!!token}
              canManage={
                modules.includes("renovacoes") &&
                !!token &&
                ["ADMIN", "DIRECAO", "COORDENACAO"].includes(userRole)
              }
              onLogin={() => {
                setLoginMode("login");
                goTo("login");
              }}
              onRegister={() => {
                setLoginMode("register");
                goTo("login");
              }}
            />
          )}
          {view === "ficha" && hasFichaAccess(modules, userRole) && (
            <FichaAluno
              needsLogin={!token}
              onLogin={() => {
                setLoginMode("login");
                goTo("login");
              }}
              onRegister={() => {
                setLoginMode("register");
                goTo("login");
              }}
            />
          )}
          {view === "emprego" && (
            <Emprego
              loggedIn={!!token}
              canManage={
                modules.includes("emprego") &&
                !!token &&
                ["ADMIN", "DIRECAO", "COMUNICACAO"].includes(userRole)
              }
            />
          )}
          {view === "salas" && (
            <SalasAdmin needsLogin={!token} onLogin={() => goTo("login")} />
          )}
          {view === "turmas" && (
            <TurmasAdmin needsLogin={!token} onLogin={() => goTo("login")} />
          )}
          {view === "actividades" && (
            <ActividadesAdmin
              needsLogin={!token}
              canManage={
                modules.includes("actividades") &&
                !!token &&
                ["ADMIN", "DIRECAO", "COORDENACAO"].includes(userRole)
              }
              onLogin={() => goTo("login")}
            />
          )}
          {view === "conteudo" && (
            <ContentEditor
              needsLogin={!token}
              onLogin={() => goTo("login")}
            />
          )}
          {view === "acessos" && modules.includes("acessos") && (
            <AcessosAdmin needsLogin={!token} onLogin={() => goTo("login")} />
          )}
        </main>
      </div>
    </div>
  );
}

function LoginForm({
  onLogin,
  notice = "",
  mode = "login",
  onModeChange,
}: {
  onLogin: (email: string, password: string) => Promise<void>;
  notice?: string;
  mode?: "login" | "register";
  onModeChange?: (mode: "login" | "register") => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const isRegister = mode === "register";

  return (
    <div className="mx-auto max-w-md py-10">
      <h1 className="text-3xl font-bold">
        {isRegister ? "Criar conta de encarregado" : "Entrar na plataforma"}
      </h1>
      <p className="mt-2 text-muted-foreground">
        {isRegister
          ? "Registe-se para pedir renovações e completar a ficha do aluno."
          : "Encarregados e equipa escolar — use a sua conta para aceder."}
      </p>
      <div className="mt-5 grid grid-cols-2 gap-2 rounded-lg bg-muted p-1">
        <Button
          type="button"
          variant={!isRegister ? "default" : "ghost"}
          size="sm"
          onClick={() => onModeChange?.("login")}
        >
          Entrar
        </Button>
        <Button
          type="button"
          variant={isRegister ? "default" : "ghost"}
          size="sm"
          onClick={() => onModeChange?.("register")}
        >
          Criar conta encarregado
        </Button>
      </div>
      {notice && (
        <p className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {notice}
        </p>
      )}
      <form
        className="mt-6 space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          setLoading(true);
          setError("");
          try {
            if (isRegister) {
              await api.register({ name, email, password });
            }
            await onLogin(email, password);
          } catch (err) {
            setError(
              err instanceof Error
                ? err.message
                : isRegister
                  ? "Falha no registo"
                  : "Falha no login",
            );
          } finally {
            setLoading(false);
          }
        }}
      >
        {isRegister && (
          <Field label="Nome completo">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Nome do encarregado"
            />
          </Field>
        )}
        <Field label="Email">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Field>
        <Field label="Palavra-passe">
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </Field>
        {error && (
          <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading
            ? isRegister
              ? "A criar conta..."
              : "A entrar..."
            : isRegister
              ? "Criar conta"
              : "Entrar"}
        </Button>
      </form>
    </div>
  );
}

function Dashboard({
  data,
  needsLogin,
  onEnroll,
  onLogin,
}: {
  data: DashboardOverview | null;
  needsLogin: boolean;
  onEnroll: () => void;
  onLogin: () => void;
}) {
  if (needsLogin) {
    return (
      <Card>
        <CardContent className="space-y-4 p-8">
          <h1 className="text-2xl font-bold">Visão geral</h1>
          <p className="text-muted-foreground">
            Inicie sessão para ver indicadores e ocupação das salas.
          </p>
          <Button onClick={onLogin}>Entrar</Button>
        </CardContent>
      </Card>
    );
  }

  const stats = [
    ["Alunos matriculados", String(data?.stats.alunosMatriculados ?? 0), Users, "text-primary"],
    ["Vagas disponíveis", String(data?.stats.vagasDisponiveis ?? 0), School, "text-secondary"],
    ["Renovações reservadas", String(data?.stats.renovacoesPendentes ?? 0), CalendarDays, "text-accent"],
    ["Lista de espera", String(data?.stats.listaEspera ?? 0), ClipboardList, "text-pink"],
  ] as const;

  const rooms = data?.rooms ?? [];

  return (
    <>
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-sm font-medium text-secondary">VISÃO GERAL</p>
          <h1 className="text-3xl font-bold tracking-tight">
            Bom dia, equipa Betteryou!
          </h1>
          <p className="mt-2 text-muted-foreground">
            Acompanhe a ocupação e as inscrições da instituição.
          </p>
        </div>
        <Button onClick={onEnroll} className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          Nova inscrição
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(([title, value, Icon, color]) => (
          <Card key={title} className="border-0 shadow-sm">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-muted-foreground">{title}</p>
                <p className="mt-1 text-3xl font-bold">{value}</p>
              </div>
              <div className={`rounded-xl bg-slate-50 p-3 ${color}`}>
                <Icon className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-7 grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle className="text-lg">Ocupação por sala</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {rooms.map((room) => {
              const used = room.enrolled + room.reserved;
              const percent = Math.round((used / room.capacity) * 100);
              return (
                <div key={room.id}>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="font-medium">
                      {room.name}{" "}
                      <span className="text-muted-foreground">· {room.unit}</span>
                    </span>
                    <span
                      className={
                        percent === 100
                          ? "font-semibold text-destructive"
                          : "text-muted-foreground"
                      }
                    >
                      {room.available} vagas
                    </span>
                  </div>
                  <Progress value={percent} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Atenção necessária</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert
              title={`${data?.stats[("candidat" + "urasPendentes") as keyof typeof data.stats] ?? 0} inscrições por validar`}
              text="Revise documentos e confirme matrículas."
            />
            <Alert
              title={`${data?.stats.listaEspera ?? 0} na lista de espera`}
              text="Notifique as famílias quando houver vaga (48h)."
            />
            <Alert
              title={`${data?.stats.renovacoesPendentes ?? 0} reservas de renovação`}
              text="As renovações têm prioridade absoluta."
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function Alert({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex gap-3 rounded-lg bg-accent/10 p-3">
      <Bell className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}

function Enrollment({
  unit,
  service,
  setUnit,
  setService,
  services,
  levelLabel,
  setLevelLabel,
  birthDate,
  setBirthDate,
  roomsResult,
  roomsLoading,
  selectedRoomId,
  setSelectedRoomId,
  child,
  setChild,
  submitted,
  submissionError,
  onSubmit,
}: {
  unit: string;
  service: string;
  setUnit: (value: string) => void;
  setService: (value: string) => void;
  services: string[];
  levelLabel: string;
  setLevelLabel: (value: string) => void;
  birthDate: string;
  setBirthDate: (value: string) => void;
  roomsResult: RoomsForEnrollment | null;
  roomsLoading: boolean;
  selectedRoomId: string;
  setSelectedRoomId: (value: string) => void;
  child: string;
  setChild: (value: string) => void;
  submitted: EnrollmentResult | null;
  submissionError: string;
  onSubmit: (payload: EnrollmentPayload) => void | Promise<void>;
}) {
  const [childSex, setChildSex] = useState("");
  const [childBirthPlace, setChildBirthPlace] = useState("");
  const [childNationality, setChildNationality] = useState("");
  const [childAddress, setChildAddress] = useState("");
  const [guardians, setGuardians] = useState<GuardianForm[]>([emptyGuardian()]);
  const [emergencies, setEmergencies] = useState<EmergencyForm[]>([
    emptyEmergency(),
  ]);
  const [activities, setActivities] = useState<string[]>([]);
  const [activityOptions, setActivityOptions] = useState<ActivityOption[]>(() =>
    activitiesForService(service),
  );
  const [allergies, setAllergies] = useState("");
  const [medication, setMedication] = useState("");
  const [foodRestrictions, setFoodRestrictions] = useState("");
  const [medicalNotes, setMedicalNotes] = useState("");
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    let active = true;
    const fallback = activitiesForService(service);
    setActivityOptions(fallback);
    setActivities((current) => filterActivitiesForService(current, fallback));
    api
      .getActivitiesPublic(service)
      .then((list) => {
        if (!active) return;
        const mapped = mapPublicActivities(list);
        if (!mapped) return;
        setActivityOptions(mapped);
        setActivities((current) =>
          filterActivitiesForService(current, mapped),
        );
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [service]);

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-green/15 text-green">
          <CheckCircle2 className="h-9 w-9" />
        </div>
        <h1 className="mt-6 text-3xl font-bold">
          {submitted.estado === "pendente_validacao"
            ? "Inscrição recebida"
            : "Em lista de espera"}
        </h1>
        <p className="mt-3 text-muted-foreground">{submitted.message}</p>
        {submitted.room && (
          <p className="mt-2 text-sm text-muted-foreground">
            Sala: {submitted.room.name}
          </p>
        )}
        <div className="mt-8 text-left">
          <EnrollmentDocumentsPanel enrollmentId={submitted.id} />
        </div>
        <Button className="mt-7" onClick={() => window.location.reload()}>
          Registar nova candidatura
        </Button>
      </div>
    );
  }

  const rooms = roomsResult?.rooms ?? [];
  const selectedRoom = rooms.find((room) => room.id === selectedRoomId);
  const showLevelSelect =
    service === "1.º Ciclo" && (roomsResult?.levels?.length ?? 0) > 0;
  const noRoomsAvailable =
    !!birthDate && !roomsLoading && rooms.length === 0;
  const waitlistSubmit =
    noRoomsAvailable ||
    (selectedRoom != null && selectedRoom.availableVacancies <= 0);
  const canSubmit =
    !!birthDate &&
    !!child.trim() &&
    (noRoomsAvailable || !!selectedRoomId || roomsLoading === false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError("");
    const missing = missingSharedFormFields({
      childFullName: child,
      childBirthDate: birthDate,
      childSex,
      childBirthPlace,
      childNationality,
      childAddress,
      allergies,
      medication,
      foodRestrictions,
      guardians,
      emergencyContacts: emergencies,
    });
    if (missing.length > 0) {
      setLocalError(`Dados em falta: ${missing.join("; ")}`);
      return;
    }
    const primary = guardians[0];
    const emergency = emergencies[0];
    await onSubmit({
      yearLabel: YEAR,
      unitName: unit,
      serviceName: service,
      childFullName: child,
      childBirthDate: birthDate,
      childSex,
      childBirthPlace,
      childNationality,
      childAddress,
      guardianFullName: primary.fullName,
      guardianIdNumber: primary.idNumber,
      guardianPhone: primary.phone,
      guardianAltPhone: primary.altPhone || undefined,
      guardianEmail: primary.email,
      guardianProfession: primary.profession,
      guardianRelationship: primary.relationship,
      guardianAddress: primary.address,
      emergencyName: emergency.name,
      emergencyPhone: emergency.phone,
      emergencyRelation: emergency.relation,
      allergies,
      medication,
      foodRestrictions,
      medicalNotes: medicalNotes || undefined,
      guardians: toApiGuardians(guardians),
      emergencyContacts: toApiEmergencies(emergencies),
      activities,
    });
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-7">
        <p className="mb-2 text-sm font-medium text-secondary">ADMISSÕES</p>
        <h1 className="text-3xl font-bold">Nova inscrição</h1>
        <p className="mt-2 text-muted-foreground">
          Preencha todos os dados. Sem salas disponíveis, a inscrição entra
          automaticamente na lista de espera.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <form onSubmit={handleSubmit} className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">1. Escolha do serviço</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Ano letivo">
                <Input value={YEAR} disabled />
              </Field>
              <Field label="Unidade">
                <Select value={unit} onValueChange={setUnit}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Gika">Gika</SelectItem>
                    <SelectItem value="Patriota">Patriota</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Serviço">
                <Select value={service} onValueChange={setService}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <div className="sm:col-span-2 lg:col-span-3">
                <BirthDateField
                  value={birthDate}
                  onChange={setBirthDate}
                  required
                  label="Data de nascimento da criança"
                />
              </div>
              {showLevelSelect && (
                <div className="sm:col-span-2 lg:col-span-3">
                  <Field label="Nível">
                    <Select value={levelLabel} onValueChange={setLevelLabel}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar nível" />
                      </SelectTrigger>
                      <SelectContent>
                        {(roomsResult?.levels ?? []).map((level) => (
                          <SelectItem key={level} value={level}>
                            {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">2. Escolha da sala</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!birthDate || !unit || !service ? (
                <p className="text-sm text-muted-foreground">
                  Indique a data de nascimento, a unidade e o serviço para ver
                  as salas disponíveis.
                </p>
              ) : roomsLoading ? (
                <p className="text-sm text-muted-foreground">
                  A procurar salas disponíveis...
                </p>
              ) : rooms.length === 0 ? (
                <div className="rounded-lg border border-amber-300/60 bg-amber-50 p-4 text-sm text-amber-950 dark:bg-amber-950/20 dark:text-amber-100">
                  Não há salas disponíveis para esta selecção. Ao submeter, a
                  inscrição será adicionada à lista de espera.
                </div>
              ) : (
                <>
                  {rooms.map((room) => (
                    <RoomOption
                      key={room.id}
                      room={room}
                      selected={room.id === selectedRoomId}
                      onSelect={() => setSelectedRoomId(room.id)}
                    />
                  ))}
                  {!selectedRoomId && (
                    <p className="text-xs text-muted-foreground">
                      Seleccione uma sala. Se estiver cheia, entra em lista de
                      espera.
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">3. Dados da criança</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome completo">
                <Input
                  required
                  value={child}
                  onChange={(event) => setChild(event.target.value)}
                  placeholder="Nome da criança"
                />
              </Field>
              <Field label="Sexo">
                <select
                  required
                  value={childSex}
                  onChange={(e) => setChildSex(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Seleccionar</option>
                  <option value="Feminino">Feminino</option>
                  <option value="Masculino">Masculino</option>
                </select>
              </Field>
              <Field label="Local de nascimento">
                <Input
                  required
                  value={childBirthPlace}
                  onChange={(e) => setChildBirthPlace(e.target.value)}
                  placeholder="Ex.: Luanda"
                />
              </Field>
              <Field label="Nacionalidade">
                <Input
                  required
                  value={childNationality}
                  onChange={(e) => setChildNationality(e.target.value)}
                  placeholder="Ex.: Angolana"
                />
              </Field>
              <Field label="Morada">
                <Input
                  required
                  value={childAddress}
                  onChange={(e) => setChildAddress(e.target.value)}
                  placeholder="Morada da criança"
                />
              </Field>
            </CardContent>
          </Card>
          <GuardiansEditor value={guardians} onChange={setGuardians} />
          <EmergenciesEditor value={emergencies} onChange={setEmergencies} />
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Saúde</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label='Alergias (use "Nenhuma" se não existir)'>
                <Textarea
                  required
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  rows={3}
                />
              </Field>
              <Field label='Medicação (use "Nenhuma" se não existir)'>
                <Textarea
                  required
                  value={medication}
                  onChange={(e) => setMedication(e.target.value)}
                  rows={3}
                />
              </Field>
              <Field label='Restrições alimentares (use "Nenhuma" se não existir)'>
                <Textarea
                  required
                  value={foodRestrictions}
                  onChange={(e) => setFoodRestrictions(e.target.value)}
                  rows={3}
                />
              </Field>
              <Field label="Notas médicas">
                <Textarea
                  value={medicalNotes}
                  onChange={(e) => setMedicalNotes(e.target.value)}
                  rows={3}
                />
              </Field>
            </CardContent>
          </Card>
          <ActivitiesPicker
            options={activityOptions}
            value={activities}
            onChange={setActivities}
            serviceName={service}
          />
          {(localError || submissionError) && (
            <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {localError || submissionError}
            </p>
          )}
          <Button
            type="submit"
            className="w-full bg-primary py-6 text-base hover:bg-primary/90"
            disabled={!canSubmit || (rooms.length > 0 && !selectedRoomId)}
          >
            {waitlistSubmit
              ? "Entrar na lista de espera"
              : "Submeter candidatura"}
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </form>
        <aside>
          <Card className="sticky top-28 border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg">Sala seleccionada</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedRoom ? (
                <>
                  <p className="font-semibold">{selectedRoom.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {unit} · {service}
                    {selectedRoom.levelLabel ? ` · ${selectedRoom.levelLabel}` : ""}
                  </p>
                  <div
                    className={`my-5 rounded-xl p-4 ${
                      selectedRoom.availableVacancies > 0
                        ? "bg-green/10"
                        : "bg-destructive/10"
                    }`}
                  >
                    <p
                      className={`text-3xl font-bold ${
                        selectedRoom.availableVacancies > 0
                          ? "text-green"
                          : "text-destructive"
                      }`}
                    >
                      {Math.max(selectedRoom.availableVacancies, 0)}
                    </p>
                    <p className="text-sm font-medium">
                      {selectedRoom.availableVacancies === 1
                        ? "vaga disponível"
                        : "vagas disponíveis"}
                    </p>
                  </div>
                  <dl className="space-y-3 text-sm">
                    <Row label="Capacidade" value={selectedRoom.capacity} />
                    <Row
                      label="Matriculados"
                      value={selectedRoom.enrolledCount}
                    />
                    <Row
                      label="Reservas (renovações)"
                      value={selectedRoom.renewalReserved}
                    />
                    <Row
                      label="Reservas (inscrições)"
                      value={selectedRoom.enrollmentReserved}
                    />
                  </dl>
                </>
              ) : noRoomsAvailable ? (
                <p className="text-sm text-muted-foreground">
                  Sem salas disponíveis — a inscrição irá para lista de espera.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Seleccione uma sala para ver os detalhes de disponibilidade.
                </p>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function RoomOption({
  room,
  selected,
  onSelect,
}: {
  room: EnrollmentRoom;
  selected: boolean;
  onSelect: () => void;
}) {
  const disabled = !room.ageEligible;
  const isWaitlist = !disabled && room.availableVacancies <= 0;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={`flex w-full items-center justify-between gap-4 rounded-xl border p-4 text-left transition ${
        disabled
          ? "cursor-not-allowed border-slate-100 bg-slate-50"
          : selected
            ? "border-primary bg-primary/5 ring-2 ring-primary/30"
            : "border-slate-200 hover:border-primary/40 hover:bg-primary/5"
      }`}
    >
      <div>
        <p className={`font-semibold ${disabled ? "text-slate-400" : ""}`}>
          {room.name}
        </p>
        <p className="text-sm text-muted-foreground">
          {room.ageLabel || "Idade não definida"}
          {room.levelLabel ? ` · ${room.levelLabel}` : ""}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <Badge
          variant="outline"
          className={
            disabled
              ? "border-slate-300 text-slate-400"
              : "border-green/30 bg-green/10 text-green"
          }
        >
          {disabled ? "Idade não elegível" : "Idade elegível"}
        </Badge>
        {!disabled && (
          <Badge
            variant="outline"
            className={
              isWaitlist
                ? "border-accent/30 bg-accent/15 text-amber-700"
                : "border-primary/30 bg-primary/10 text-primary"
            }
          >
            {isWaitlist ? "Lista de espera" : `${room.availableVacancies} vagas`}
          </Badge>
        )}
      </div>
    </button>
  );
}

const ENROLLMENT_DOC_TYPES = [
  { value: "certidao_nascimento", label: "Certidão de nascimento" },
  { value: "bi_encarregado", label: "BI do encarregado" },
  { value: "cartao_vacinas", label: "Cartão de vacinas" },
  { value: "foto", label: "Fotografia" },
  { value: "outro", label: "Outro" },
] as const;

function documentTypeLabel(type: string) {
  return (
    ENROLLMENT_DOC_TYPES.find((item) => item.value === type)?.label ?? type
  );
}

function EnrollmentDocumentsPanel({
  enrollmentId,
}: {
  enrollmentId: string;
}) {
  const [documents, setDocuments] = useState<
    Array<{
      id: string;
      type: string;
      fileName: string;
      filePath: string;
      mimeType?: string | null;
    }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState("certidao_nascimento");
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");

  const load = () => {
    setLoading(true);
    api
      .getEnrollmentDocuments(enrollmentId)
      .then(setDocuments)
      .catch(() => setDocuments([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enrollmentId]);

  const upload = async () => {
    if (!file) {
      setMessage("Seleccione um ficheiro.");
      return;
    }
    setUploading(true);
    setMessage("");
    try {
      const doc = await api.uploadEnrollmentDocument(
        enrollmentId,
        file,
        docType,
      );
      setDocuments((list) => [...list, doc]);
      setFile(null);
      setMessage("Documento carregado com sucesso.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Não foi possível carregar.",
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Documentos da inscrição</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Pode enviar vários documentos (certidão, BI, vacinas, fotografia,
          etc.).
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tipo de documento">
            <Select value={docType} onValueChange={setDocType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ENROLLMENT_DOC_TYPES.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Ficheiro">
            <Input
              type="file"
              onChange={(event) =>
                setFile(event.target.files?.[0] ?? null)
              }
            />
          </Field>
        </div>
        <Button onClick={upload} disabled={uploading || !file}>
          {uploading ? "A carregar…" : "Carregar documento"}
        </Button>
        {message && (
          <p className="text-sm text-muted-foreground">{message}</p>
        )}
        {loading && (
          <p className="text-sm text-muted-foreground">A carregar lista…</p>
        )}
        {!loading && documents.length > 0 && (
          <ul className="divide-y rounded-lg border text-sm">
            {documents.map((doc) => (
              <li
                key={doc.id}
                className="flex flex-wrap items-center justify-between gap-2 p-3"
              >
                <span>
                  <span className="font-medium">
                    {documentTypeLabel(doc.type)}
                  </span>
                  {" · "}
                  {doc.fileName}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function Waitlist({
  needsLogin,
  onLogin,
}: {
  needsLogin: boolean;
  onLogin: () => void;
}) {
  const [items, setItems] = useState<WaitlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [notifyingId, setNotifyingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const load = () => {
    setLoading(true);
    api
      .getWaitlist()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (needsLogin) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsLogin]);

  const notify = async (id: string) => {
    setNotifyingId(id);
    setMessage("");
    try {
      await api.notifyWaitlist(id);
      setMessage("Encarregado notificado com sucesso.");
      load();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Não foi possível notificar.",
      );
    } finally {
      setNotifyingId(null);
    }
  };

  if (needsLogin) {
    return (
      <Card>
        <CardContent className="space-y-4 p-8">
          <h1 className="text-2xl font-bold">Lista de espera</h1>
          <p className="text-muted-foreground">
            Inicie sessão para gerir a lista de espera.
          </p>
          <Button onClick={onLogin}>Entrar</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <div className="mb-7">
        <p className="mb-2 text-sm font-medium text-secondary">ADMISSÕES</p>
        <h1 className="text-3xl font-bold">Lista de espera</h1>
        <p className="mt-2 text-muted-foreground">
          Inscrições aguardando disponibilidade em sala.
        </p>
      </div>
      {message && (
        <p className="mb-3 rounded-lg bg-primary/10 p-3 text-sm text-primary">
          {message}
        </p>
      )}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {loading && (
              <p className="p-5 text-sm text-muted-foreground">A carregar…</p>
            )}
            {!loading && items.length === 0 && (
              <p className="p-5 text-sm text-muted-foreground">
                Não há inscrições em lista de espera.
              </p>
            )}
            {items.map((item, index) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 p-5"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 font-semibold text-primary">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold">
                      {item.enrollment.childFullName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {item.enrollment.unit.name} · {item.enrollment.service.name}
                      {item.room ? ` · ${item.room.name}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-amber-700">
                    {item.status === "NOTIFICADO" ? "Notificado" : "A aguardar"}
                  </span>
                  {item.status !== "NOTIFICADO" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => notify(item.id)}
                      disabled={notifyingId === item.id}
                    >
                      <Bell className="mr-1.5 h-4 w-4" />
                      Notificar
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function statusLabel(status: string) {
  switch (status) {
    case "PENDENTE_VALIDACAO":
      return "Pendente de validação";
    case "CONFIRMADA":
      return "Confirmada";
    case "CANCELADA":
      return "Cancelada";
    case "LISTA_ESPERA":
      return "Lista de espera";
    case "EXPIRADA":
      return "Expirada";
    case "PENDENTE":
      return "Pendente";
    default:
      return status;
  }
}

function InscricoesGestao() {
  const [items, setItems] = useState<EnrollmentAdmin[]>([]);
  const [statusFilter, setStatusFilter] = useState("PENDENTE_VALIDACAO");
  const [loading, setLoading] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [documentsForId, setDocumentsForId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const load = () => {
    setLoading(true);
    api
      .getEnrollments(statusFilter === "TODAS" ? undefined : statusFilter)
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const act = async (id: string, action: "confirm" | "reject" | "delete") => {
    setActioningId(id);
    setMessage("");
    try {
      if (action === "confirm") await api.confirmEnrollment(id);
      else if (action === "reject") await api.rejectEnrollment(id);
      else await api.deleteEnrollment(id);
      setItems((current) => current.filter((item) => item.id !== id));
      setMessage("Inscrição actualizada.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Não foi possível actualizar.",
      );
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div>
      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-xl font-semibold">Gestão de inscrições</h2>
          <p className="text-sm text-muted-foreground">
            Confirme, rejeite ou remova candidaturas recebidas.
          </p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PENDENTE_VALIDACAO">Pendentes</SelectItem>
            <SelectItem value="LISTA_ESPERA">Lista de espera</SelectItem>
            <SelectItem value="CONFIRMADA">Confirmadas</SelectItem>
            <SelectItem value="CANCELADA">Canceladas</SelectItem>
            <SelectItem value="TODAS">Todas</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {message && (
        <p className="mb-3 rounded-lg bg-primary/10 p-3 text-sm text-primary">
          {message}
        </p>
      )}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {!loading && items.length === 0 && (
              <p className="p-5 text-sm text-muted-foreground">
                Não há inscrições neste filtro.
              </p>
            )}
            {items.map((item) => (
              <div key={item.id} className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{item.childFullName}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.unit.name} · {item.service.name}
                      {item.room ? ` · ${item.room.name}` : ""}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {item.guardianFullName} · {item.guardianEmail}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-amber-700">
                      {statusLabel(item.status)}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setDocumentsForId((current) =>
                          current === item.id ? null : item.id,
                        )
                      }
                    >
                      Documentos
                    </Button>
                    {item.status === "PENDENTE_VALIDACAO" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => act(item.id, "confirm")}
                          disabled={actioningId === item.id}
                        >
                          Confirmar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => act(item.id, "reject")}
                          disabled={actioningId === item.id}
                        >
                          Rejeitar
                        </Button>
                      </>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => act(item.id, "delete")}
                      disabled={actioningId === item.id}
                      aria-label="Remover"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                {documentsForId === item.id && (
                  <div className="mt-4">
                    <EnrollmentDocumentsPanel enrollmentId={item.id} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Renovacoes({
  loggedIn,
  canManage,
  onLogin,
  onRegister,
}: {
  loggedIn: boolean;
  canManage: boolean;
  onLogin: () => void;
  onRegister: () => void;
}) {
  const [items, setItems] = useState<RenewalItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<"pendente" | "lista_espera" | null>(
    null,
  );
  const [roomsResult, setRoomsResult] = useState<RoomsForEnrollment | null>(
    null,
  );
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [levelLabel, setLevelLabel] = useState("");
  const [form, setForm] = useState({
    unitName: "Gika",
    serviceName: "Pré-Escolar",
    childFullName: "",
    childBirthDate: "",
    childSex: "",
    childBirthPlace: "",
    childNationality: "",
    childAddress: "",
    allergies: "",
    medication: "",
    foodRestrictions: "",
    medicalNotes: "",
    previousYearLabel: "2025/2026",
    notes: "",
  });
  const [guardians, setGuardians] = useState<GuardianForm[]>([emptyGuardian()]);
  const [emergencies, setEmergencies] = useState<EmergencyForm[]>([
    emptyEmergency(),
  ]);
  const [activities, setActivities] = useState<string[]>([]);
  const [activityOptions, setActivityOptions] = useState<ActivityOption[]>(() =>
    activitiesForService("Pré-Escolar"),
  );

  const setField =
    (key: keyof typeof form) => (value: string) =>
      setForm((current) => ({ ...current, [key]: value }));

  const loadItems = () => {
    if (!loggedIn || !canManage) return;
    setLoading(true);
    api
      .getRenewals()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedIn, canManage]);

  useEffect(() => {
    let active = true;
    const serviceName = form.serviceName;
    const fallback = activitiesForService(serviceName);
    setActivityOptions(fallback);
    setActivities((current) => filterActivitiesForService(current, fallback));
    api
      .getActivitiesPublic(serviceName)
      .then((list) => {
        if (!active) return;
        const mapped = mapPublicActivities(list);
        if (!mapped) return;
        setActivityOptions(mapped);
        setActivities((current) =>
          filterActivitiesForService(current, mapped),
        );
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [form.serviceName]);

  useEffect(() => {
    if (form.serviceName !== "1.º Ciclo") setLevelLabel("");
  }, [form.serviceName]);

  useEffect(() => {
    if (!form.childBirthDate || !form.unitName || !form.serviceName) {
      setRoomsResult(null);
      setSelectedRoomId("");
      return;
    }
    let active = true;
    setRoomsLoading(true);
    api
      .getRoomsForEnrollment({
        unitName: form.unitName,
        serviceName: form.serviceName,
        yearLabel: YEAR,
        birthDate: form.childBirthDate,
        levelLabel:
          form.serviceName === "1.º Ciclo" && levelLabel
            ? levelLabel
            : undefined,
      })
      .then((result) => {
        if (!active) return;
        setRoomsResult(result);
        setSelectedRoomId((current) =>
          result.rooms.some((room) => room.id === current) ? current : "",
        );
      })
      .catch(() => {
        if (active) setRoomsResult(null);
      })
      .finally(() => {
        if (active) setRoomsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [form.unitName, form.serviceName, form.childBirthDate, levelLabel]);

  const submitRenewal = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    const missing = missingSharedFormFields({
      childFullName: form.childFullName,
      childBirthDate: form.childBirthDate,
      childSex: form.childSex,
      childBirthPlace: form.childBirthPlace,
      childNationality: form.childNationality,
      childAddress: form.childAddress,
      allergies: form.allergies,
      medication: form.medication,
      foodRestrictions: form.foodRestrictions,
      guardians,
      emergencyContacts: emergencies,
    });
    if (missing.length > 0) {
      setMessage(`Dados em falta: ${missing.join("; ")}`);
      setSubmitting(false);
      return;
    }
    const rooms = roomsResult?.rooms ?? [];
    if (rooms.length > 0 && !selectedRoomId) {
      setMessage("Seleccione uma sala, ou aguarde se não houver vagas.");
      setSubmitting(false);
      return;
    }
    const primary = guardians[0];
    const emergency = emergencies[0];
    try {
      const result = await api.createRenewal({
        yearLabel: YEAR,
        unitName: form.unitName,
        serviceName: form.serviceName,
        roomId: selectedRoomId || undefined,
        childFullName: form.childFullName,
        childBirthDate: form.childBirthDate || undefined,
        childSex: form.childSex || undefined,
        childBirthPlace: form.childBirthPlace || undefined,
        childNationality: form.childNationality || undefined,
        childAddress: form.childAddress || undefined,
        guardianFullName: primary.fullName,
        guardianIdNumber: primary.idNumber || undefined,
        guardianPhone: primary.phone,
        guardianAltPhone: primary.altPhone || undefined,
        guardianEmail: primary.email,
        guardianProfession: primary.profession || undefined,
        guardianRelationship: primary.relationship || undefined,
        guardianAddress: primary.address || undefined,
        emergencyName: emergency.name || undefined,
        emergencyPhone: emergency.phone || undefined,
        emergencyRelation: emergency.relation || undefined,
        allergies: form.allergies || undefined,
        medication: form.medication || undefined,
        foodRestrictions: form.foodRestrictions || undefined,
        medicalNotes: form.medicalNotes || undefined,
        previousYearLabel: form.previousYearLabel || undefined,
        notes: form.notes || undefined,
        guardians: toApiGuardians(guardians),
        emergencyContacts: toApiEmergencies(emergencies),
        activities,
      });
      setSubmitted(
        result.estado === "lista_espera" ? "lista_espera" : "pendente",
      );
      setMessage(
        result.message || "Pedido de renovação submetido com sucesso.",
      );
      if (canManage) loadItems();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível submeter a renovação.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const act = async (id: string, action: "confirm" | "cancel" | "delete") => {
    setActioningId(id);
    setMessage("");
    try {
      if (action === "delete") {
        await api.deleteRenewal(id);
        setItems((current) => current.filter((item) => item.id !== id));
        setMessage("Renovação removida.");
      } else {
        const status = action === "confirm" ? "CONFIRMADA" : "CANCELADA";
        const updated = await api.setRenewalStatus(id, status);
        setItems((current) =>
          current.map((item) => (item.id === id ? updated : item)),
        );
        setMessage(
          action === "confirm"
            ? "Renovação confirmada."
            : "Renovação cancelada.",
        );
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível actualizar a renovação.",
      );
    } finally {
      setActioningId(null);
    }
  };

  const services =
    form.unitName === "Gika"
      ? ["Creche", "Pré-Escolar", "Jardim de Infância", "1.º Ciclo", "ATL"]
      : ["Creche", "Pré-Escolar", "Jardim de Infância", "ATL"];

  const rooms = roomsResult?.rooms ?? [];
  const selectedRoom = rooms.find((room) => room.id === selectedRoomId);
  const noRoomsAvailable =
    !!form.childBirthDate && !roomsLoading && rooms.length === 0;
  const waitlistSubmit =
    noRoomsAvailable ||
    (selectedRoom != null && selectedRoom.availableVacancies <= 0);
  const showLevelSelect =
    form.serviceName === "1.º Ciclo" && (roomsResult?.levels?.length ?? 0) > 0;

  const resetForm = () => {
    setSubmitted(null);
    setSelectedRoomId("");
    setGuardians([emptyGuardian()]);
    setEmergencies([emptyEmergency()]);
    setActivities([]);
    setForm((f) => ({
      ...f,
      childFullName: "",
      childBirthDate: "",
      childSex: "",
      childBirthPlace: "",
      childNationality: "",
      childAddress: "",
      allergies: "",
      medication: "",
      foodRestrictions: "",
      medicalNotes: "",
      notes: "",
    }));
  };

  return (
    <div className="space-y-6">
      <div className="mb-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-sm font-medium text-secondary">ADMISSÕES</p>
          <h1 className="text-3xl font-bold">Renovações</h1>
          <p className="mt-2 text-muted-foreground">
            {canManage
              ? "Gerir pedidos de renovação de matrícula."
              : "Submeta o pedido de renovação para o próximo ano letivo. Sem vagas, entra em lista de espera."}
          </p>
        </div>
      </div>

      {message && (
        <p
          className={`rounded-lg p-3 text-sm ${
            message.toLowerCase().includes("não") ||
            message.toLowerCase().includes("falh") ||
            message.toLowerCase().includes("seleccione")
              ? "bg-destructive/10 text-destructive"
              : "bg-green/10 text-green"
          }`}
        >
          {message}
        </p>
      )}

      {!loggedIn ? (
        <Card>
          <CardContent className="space-y-4 p-8">
            <h2 className="text-xl font-semibold">
              Para pedir renovação, entre com a conta de encarregado
            </h2>
            <p className="text-muted-foreground">
              Os pedidos de renovação estão disponíveis após autenticação.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button onClick={onLogin}>Entrar</Button>
              <Button variant="outline" onClick={onRegister}>
                Criar conta
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : submitted ? (
        <Card>
          <CardContent className="space-y-4 p-8 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-green/15 text-green">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-semibold">
              {submitted === "lista_espera"
                ? "Em lista de espera"
                : "Pedido recebido"}
            </h2>
            <p className="text-muted-foreground">
              {submitted === "lista_espera"
                ? "Não há vaga disponível. O pedido entrou na lista de espera."
                : "A equipa irá validar a renovação e contactar o encarregado."}
            </p>
            <Button variant="outline" onClick={resetForm}>
              Novo pedido
            </Button>
          </CardContent>
        </Card>
      ) : (
        <form className="space-y-6" onSubmit={submitRenewal}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">1. Serviço e sala</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Unidade">
                <Select
                  value={form.unitName}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      unitName: v,
                      serviceName: v === "Gika" ? "Pré-Escolar" : "Creche",
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Gika">Gika</SelectItem>
                    <SelectItem value="Patriota">Patriota</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Serviço">
                <Select
                  value={form.serviceName}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, serviceName: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Ano letivo anterior">
                <Input
                  value={form.previousYearLabel}
                  onChange={(e) => setField("previousYearLabel")(e.target.value)}
                />
              </Field>
              <div className="sm:col-span-2">
                <BirthDateField
                  value={form.childBirthDate}
                  onChange={setField("childBirthDate")}
                  required
                  label="Data de nascimento da criança"
                />
              </div>
              {showLevelSelect && (
                <div className="sm:col-span-2">
                  <Field label="Nível">
                    <Select value={levelLabel} onValueChange={setLevelLabel}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar nível" />
                      </SelectTrigger>
                      <SelectContent>
                        {(roomsResult?.levels ?? []).map((level) => (
                          <SelectItem key={level} value={level}>
                            {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              )}
              <div className="sm:col-span-2 space-y-3">
                {!form.childBirthDate ? (
                  <p className="text-sm text-muted-foreground">
                    Indique a data de nascimento para ver salas disponíveis.
                  </p>
                ) : roomsLoading ? (
                  <p className="text-sm text-muted-foreground">
                    A procurar salas...
                  </p>
                ) : rooms.length === 0 ? (
                  <div className="rounded-lg border border-amber-300/60 bg-amber-50 p-4 text-sm text-amber-950 dark:bg-amber-950/20 dark:text-amber-100">
                    Não há salas disponíveis. Ao submeter, o pedido entra na
                    lista de espera.
                  </div>
                ) : (
                  rooms.map((room) => (
                    <RoomOption
                      key={room.id}
                      room={room}
                      selected={room.id === selectedRoomId}
                      onSelect={() => setSelectedRoomId(room.id)}
                    />
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">2. Dados da criança</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome completo">
                <Input
                  required
                  value={form.childFullName}
                  onChange={(e) => setField("childFullName")(e.target.value)}
                />
              </Field>
              <Field label="Sexo">
                <select
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.childSex}
                  onChange={(e) => setField("childSex")(e.target.value)}
                >
                  <option value="">Seleccionar</option>
                  <option value="Feminino">Feminino</option>
                  <option value="Masculino">Masculino</option>
                </select>
              </Field>
              <Field label="Local de nascimento">
                <Input
                  required
                  value={form.childBirthPlace}
                  onChange={(e) => setField("childBirthPlace")(e.target.value)}
                />
              </Field>
              <Field label="Nacionalidade">
                <Input
                  required
                  value={form.childNationality}
                  onChange={(e) => setField("childNationality")(e.target.value)}
                />
              </Field>
              <Field label="Morada">
                <Input
                  required
                  value={form.childAddress}
                  onChange={(e) => setField("childAddress")(e.target.value)}
                />
              </Field>
            </CardContent>
          </Card>

          <GuardiansEditor value={guardians} onChange={setGuardians} />
          <EmergenciesEditor value={emergencies} onChange={setEmergencies} />
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Saúde</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label='Alergias (use "Nenhuma" se não existir)'>
                <Textarea
                  required
                  value={form.allergies}
                  onChange={(e) => setField("allergies")(e.target.value)}
                  rows={3}
                />
              </Field>
              <Field label='Medicação (use "Nenhuma" se não existir)'>
                <Textarea
                  required
                  value={form.medication}
                  onChange={(e) => setField("medication")(e.target.value)}
                  rows={3}
                />
              </Field>
              <Field label='Restrições alimentares (use "Nenhuma" se não existir)'>
                <Textarea
                  required
                  value={form.foodRestrictions}
                  onChange={(e) =>
                    setField("foodRestrictions")(e.target.value)
                  }
                  rows={3}
                />
              </Field>
              <Field label="Notas médicas">
                <Textarea
                  value={form.medicalNotes}
                  onChange={(e) => setField("medicalNotes")(e.target.value)}
                  rows={3}
                />
              </Field>
              <Field label="Notas do pedido">
                <Textarea
                  value={form.notes}
                  onChange={(e) => setField("notes")(e.target.value)}
                  rows={3}
                />
              </Field>
            </CardContent>
          </Card>
          <ActivitiesPicker
            options={activityOptions}
            value={activities}
            onChange={setActivities}
            serviceName={form.serviceName}
          />

          <Button
            type="submit"
            disabled={
              submitting || (rooms.length > 0 && !selectedRoomId)
            }
          >
            {submitting
              ? "A enviar..."
              : waitlistSubmit
                ? "Entrar na lista de espera"
                : "Submeter renovação"}
          </Button>
        </form>
      )}

      {canManage && (
        <>
          <h2 className="text-xl font-semibold">Lista de renovações</h2>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {!loading && items.length === 0 && (
                  <p className="p-5 text-sm text-muted-foreground">
                    Não há pedidos de renovação para mostrar.
                  </p>
                )}
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-3 p-5"
                  >
                    <div>
                      <p className="font-semibold">{item.childFullName}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.unit.name} · {item.service.name}
                        {item.room ? ` · ${item.room.name}` : ""}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Encarregado: {item.guardianFullName} ·{" "}
                        {item.guardianEmail}
                      </p>
                      {item.previousYearLabel && (
                        <p className="text-sm text-muted-foreground">
                          Ano anterior: {item.previousYearLabel}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-amber-700">
                        {statusLabel(item.status)}
                      </span>
                      {item.status !== "CONFIRMADA" &&
                        item.status !== "LISTA_ESPERA" && (
                        <Button
                          size="sm"
                          onClick={() => act(item.id, "confirm")}
                          disabled={actioningId === item.id}
                        >
                          <Check className="mr-1 h-4 w-4" />
                          Confirmar
                        </Button>
                      )}
                      {item.status === "LISTA_ESPERA" && (
                        <Button
                          size="sm"
                          onClick={() => act(item.id, "confirm")}
                          disabled={actioningId === item.id}
                        >
                          <Check className="mr-1 h-4 w-4" />
                          Confirmar (vaga)
                        </Button>
                      )}
                      {item.status !== "CANCELADA" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => act(item.id, "cancel")}
                          disabled={actioningId === item.id}
                        >
                          <X className="mr-1 h-4 w-4" />
                          Cancelar
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => act(item.id, "delete")}
                        disabled={actioningId === item.id}
                        aria-label="Remover renovação"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function toBirthDateInput(value: string | null | undefined) {
  if (!value) return "";
  try {
    const date = parseISO(
      value.length === 10 ? `${value}T12:00:00` : value,
    );
    return format(date, "yyyy-MM-dd");
  } catch {
    return value.slice(0, 10);
  }
}

function FichaAluno({
  needsLogin,
  onLogin,
  onRegister,
}: {
  needsLogin: boolean;
  onLogin: () => void;
  onRegister: () => void;
}) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState<StudentFichaPayload>({
    childFullName: "",
    childBirthDate: "",
    childSex: "",
    childBirthPlace: "",
    childNationality: "",
    childAddress: "",
    allergies: "",
    medication: "",
    foodRestrictions: "",
    medicalNotes: "",
  });
  const [guardians, setGuardians] = useState<GuardianForm[]>([emptyGuardian()]);
  const [emergencies, setEmergencies] = useState<EmergencyForm[]>([
    emptyEmergency(),
  ]);
  const [activities, setActivities] = useState<string[]>([]);
  const [activityOptions, setActivityOptions] = useState<ActivityOption[]>([]);

  const loadStudents = () => {
    setLoading(true);
    api
      .getStudents()
      .then((list) => {
        setStudents(list);
        setSelectedId((current) => {
          if (current && list.some((s) => s.id === current)) return current;
          const pending = list.find((s) => s.profileStatus === "PENDENTE_FICHA");
          return pending?.id || list[0]?.id || "";
        });
      })
      .catch(() => setStudents([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (needsLogin) return;
    loadStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsLogin]);

  useEffect(() => {
    const student = students.find((s) => s.id === selectedId);
    if (!student) return;
    setForm({
      childFullName: student.childFullName || "",
      childBirthDate: toBirthDateInput(student.childBirthDate),
      childSex: student.childSex || "",
      childBirthPlace: student.childBirthPlace || "",
      childNationality: student.childNationality || "",
      childAddress: student.childAddress || "",
      allergies: student.allergies || "",
      medication: student.medication || "",
      foodRestrictions: student.foodRestrictions || "",
      medicalNotes: student.medicalNotes || "",
    });
    setGuardians(guardiansFromStudent(student));
    setEmergencies(emergenciesFromStudent(student));
    const serviceName = student.service?.name || "";
    const fallback = activitiesForService(serviceName);
    setActivityOptions(fallback);
    setActivities(
      filterActivitiesForService(activitiesFromStudent(student), fallback),
    );
    setMessage("");
    if (needsLogin || !serviceName) return;
    let active = true;
    api
      .getActivitiesPublic(serviceName)
      .then((list) => {
        if (!active) return;
        const mapped = mapPublicActivities(list);
        if (!mapped) return;
        setActivityOptions(mapped);
        setActivities((current) =>
          filterActivitiesForService(current, mapped),
        );
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [selectedId, students, needsLogin]);

  const selected = students.find((s) => s.id === selectedId);
  const isComplete = selected?.profileStatus === "COMPLETA";

  const setField =
    (key: keyof StudentFichaPayload) =>
    (value: string) =>
      setForm((current) => ({ ...current, [key]: value }));

  const submitFicha = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedId) return;
    const missing = missingSharedFormFields({
      childFullName: form.childFullName,
      childBirthDate: form.childBirthDate,
      childSex: form.childSex,
      childBirthPlace: form.childBirthPlace,
      childNationality: form.childNationality,
      childAddress: form.childAddress,
      allergies: form.allergies,
      medication: form.medication,
      foodRestrictions: form.foodRestrictions,
      guardians,
      emergencyContacts: emergencies,
    });
    if (missing.length > 0) {
      setMessage(`Dados em falta: ${missing.join("; ")}`);
      return;
    }
    const primary = guardians[0];
    const emergency = emergencies[0];
    setSaving(true);
    setMessage("");
    try {
      const updated = await api.updateStudentFicha(selectedId, {
        ...form,
        guardianFullName: primary.fullName,
        guardianIdNumber: primary.idNumber || undefined,
        guardianPhone: primary.phone,
        guardianAltPhone: primary.altPhone || undefined,
        guardianEmail: primary.email,
        guardianProfession: primary.profession || undefined,
        guardianRelationship: primary.relationship || undefined,
        guardianAddress: primary.address || undefined,
        emergencyName: emergency.name,
        emergencyPhone: emergency.phone,
        emergencyRelation: emergency.relation || undefined,
        guardians: toApiGuardians(guardians),
        emergencyContacts: toApiEmergencies(emergencies),
        activities,
      });
      setStudents((list) =>
        list.map((item) => (item.id === updated.id ? updated : item)),
      );
      setMessage(
        updated.profileStatus === "COMPLETA"
          ? "Ficha completa e guardada com sucesso."
          : "Ficha guardada. Ainda faltam dados obrigatórios.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível guardar a ficha.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (needsLogin) {
    return (
      <Card>
        <CardContent className="space-y-4 p-8">
          <h1 className="text-2xl font-bold">Ficha do aluno</h1>
          <p className="text-muted-foreground">
            Entre com a conta de encarregado para completar a ficha do aluno.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button onClick={onLogin}>Entrar</Button>
            <Button variant="outline" onClick={onRegister}>
              Criar conta
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-sm font-medium text-secondary">ALUNOS</p>
        <h1 className="text-3xl font-bold">Ficha do aluno</h1>
        <p className="mt-2 text-muted-foreground">
          Complete os dados da criança, encarregado, emergência e saúde.
        </p>
      </div>

      {message && (
        <p
          className={`rounded-lg p-3 text-sm ${
            message.toLowerCase().includes("não") ||
            message.toLowerCase().includes("faltam") ||
            message.toLowerCase().includes("falh")
              ? "bg-destructive/10 text-destructive"
              : "bg-green/10 text-green"
          }`}
        >
          {message}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Alunos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">A carregar...</p>
          ) : students.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ainda não há fichas associadas a esta conta.
            </p>
          ) : (
            <div className="space-y-2">
              {students.map((student) => {
                const pending = student.profileStatus === "PENDENTE_FICHA";
                return (
                  <button
                    key={student.id}
                    type="button"
                    onClick={() => setSelectedId(student.id)}
                    className={`flex w-full items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left transition ${
                      selectedId === student.id
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50"
                    } ${pending ? "ring-1 ring-amber-400/60" : ""}`}
                  >
                    <div>
                      <p className="font-semibold">{student.childFullName}</p>
                      <p className="text-sm text-muted-foreground">
                        {student.unit?.name || "—"} ·{" "}
                        {student.service?.name || "—"}
                      </p>
                    </div>
                    <Badge variant={pending ? "secondary" : "default"}>
                      {pending ? "Completar ficha" : "Completa"}
                    </Badge>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {selected && (
        <>
          {isComplete && (
            <Card>
              <CardContent className="flex items-center gap-3 p-5 text-green">
                <CheckCircle2 className="h-6 w-6" />
                <div>
                  <p className="font-semibold">Ficha completa</p>
                  <p className="text-sm text-muted-foreground">
                    Os dados obrigatórios estão preenchidos.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <form className="space-y-6" onSubmit={submitFicha}>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Dados da criança</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <Field label="Nome completo">
                  <Input
                    required
                    value={form.childFullName || ""}
                    onChange={(e) => setField("childFullName")(e.target.value)}
                  />
                </Field>
                <div className="sm:col-span-2">
                  <BirthDateField
                    value={form.childBirthDate || ""}
                    onChange={setField("childBirthDate")}
                    required
                    label="Data de nascimento"
                  />
                </div>
                <Field label="Sexo">
                  <select
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={form.childSex || ""}
                    onChange={(e) => setField("childSex")(e.target.value)}
                  >
                    <option value="">Seleccionar</option>
                    <option value="Feminino">Feminino</option>
                    <option value="Masculino">Masculino</option>
                  </select>
                </Field>
                <Field label="Local de nascimento">
                  <Input
                    required
                    value={form.childBirthPlace || ""}
                    onChange={(e) =>
                      setField("childBirthPlace")(e.target.value)
                    }
                  />
                </Field>
                <Field label="Nacionalidade">
                  <Input
                    required
                    value={form.childNationality || ""}
                    onChange={(e) =>
                      setField("childNationality")(e.target.value)
                    }
                  />
                </Field>
                <Field label="Morada">
                  <Input
                    required
                    value={form.childAddress || ""}
                    onChange={(e) => setField("childAddress")(e.target.value)}
                  />
                </Field>
              </CardContent>
            </Card>

            <GuardiansEditor value={guardians} onChange={setGuardians} />
            <EmergenciesEditor value={emergencies} onChange={setEmergencies} />
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Saúde</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <Field label='Alergias (use "Nenhuma" se não existir)'>
                  <Textarea
                    required
                    value={form.allergies || ""}
                    onChange={(e) => setField("allergies")(e.target.value)}
                    rows={3}
                  />
                </Field>
                <Field label='Medicação (use "Nenhuma" se não existir)'>
                  <Textarea
                    required
                    value={form.medication || ""}
                    onChange={(e) => setField("medication")(e.target.value)}
                    rows={3}
                  />
                </Field>
                <Field label='Restrições alimentares (use "Nenhuma" se não existir)'>
                  <Textarea
                    required
                    value={form.foodRestrictions || ""}
                    onChange={(e) =>
                      setField("foodRestrictions")(e.target.value)
                    }
                    rows={3}
                  />
                </Field>
                <Field label="Notas médicas">
                  <Textarea
                    value={form.medicalNotes || ""}
                    onChange={(e) => setField("medicalNotes")(e.target.value)}
                    rows={3}
                  />
                </Field>
              </CardContent>
            </Card>
            <ActivitiesPicker
              options={activityOptions}
              value={activities}
              onChange={setActivities}
              serviceName={selected?.service?.name}
            />

            <Button type="submit" disabled={saving}>
              {saving ? "A guardar..." : "Guardar ficha"}
            </Button>
          </form>
        </>
      )}
    </div>
  );
}

function ActividadesAdmin({
  needsLogin,
  canManage,
  onLogin,
}: {
  needsLogin: boolean;
  canManage: boolean;
  onLogin: () => void;
}) {
  type ServiceLinkDraft = {
    serviceId: string;
    pricing: "INCLUDED" | "PAID";
    priceAkz: string;
  };

  const emptyForm = () => ({
    name: "",
    category: "",
    active: true,
    sortOrder: "0",
    services: [] as ServiceLinkDraft[],
  });

  const [items, setItems] = useState<ActivityOffering[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState(emptyForm);

  const load = () => {
    if (needsLogin || !canManage) return;
    setLoading(true);
    Promise.all([api.getActivitiesAdmin(), api.getServices()])
      .then(([activities, serviceList]) => {
        setItems(activities);
        setServices(serviceList.filter((s) => s.active));
      })
      .catch(() => {
        setItems([]);
        setServices([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsLogin, canManage]);

  const startEdit = (activity: ActivityOffering) => {
    setEditingId(activity.id);
    setForm({
      name: activity.name,
      category: activity.category || "",
      active: activity.active,
      sortOrder: String(activity.sortOrder ?? 0),
      services: (activity.services || []).map((link) => ({
        serviceId: link.service.id,
        pricing: link.pricing,
        priceAkz: link.priceAkz != null ? String(link.priceAkz) : "",
      })),
    });
    setMessage("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm());
  };

  const toggleService = (serviceId: string) => {
    setForm((current) => {
      const exists = current.services.some((s) => s.serviceId === serviceId);
      if (exists) {
        return {
          ...current,
          services: current.services.filter((s) => s.serviceId !== serviceId),
        };
      }
      return {
        ...current,
        services: [
          ...current.services,
          { serviceId, pricing: "PAID", priceAkz: "40000" },
        ],
      };
    });
  };

  const updateServiceLink = (
    serviceId: string,
    patch: Partial<ServiceLinkDraft>,
  ) => {
    setForm((current) => ({
      ...current,
      services: current.services.map((s) =>
        s.serviceId === serviceId ? { ...s, ...patch } : s,
      ),
    }));
  };

  const toPayload = (): ActivityPayload => ({
    name: form.name.trim(),
    category: form.category.trim() || null,
    active: form.active,
    sortOrder: Number(form.sortOrder) || 0,
    services: form.services.map((s) => ({
      serviceId: s.serviceId,
      pricing: s.pricing,
      priceAkz:
        s.pricing === "INCLUDED"
          ? null
          : s.priceAkz.trim()
            ? Number(s.priceAkz)
            : null,
    })),
  });

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setMessage("Indique o nome da actividade.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const payload = toPayload();
      if (editingId) {
        await api.updateActivity(editingId, payload);
        setMessage("Actividade actualizada.");
      } else {
        await api.createActivity(payload);
        setMessage("Actividade criada.");
      }
      cancelEdit();
      load();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível guardar a actividade.",
      );
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    setActioningId(id);
    setMessage("");
    try {
      await api.deleteActivity(id);
      if (editingId === id) cancelEdit();
      setMessage("Actividade removida.");
      load();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível remover a actividade.",
      );
    } finally {
      setActioningId(null);
    }
  };

  if (needsLogin) {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Actividades</h1>
        <p className="text-muted-foreground">
          Inicie sessão para gerir as actividades extracurriculares.
        </p>
        <Button onClick={onLogin}>Entrar</Button>
      </div>
    );
  }

  if (!canManage) {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Actividades</h1>
        <p className="text-muted-foreground">
          Não tem permissão para gerir actividades.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-sm font-medium text-secondary">OFERTA</p>
        <h1 className="text-3xl font-bold">Actividades</h1>
        <p className="mt-2 text-muted-foreground">
          Adicione ou remova actividades e associe-as aos serviços com preço ou
          &quot;Incluído&quot;.
        </p>
      </div>

      {message && (
        <p
          className={`rounded-lg p-3 text-sm ${
            message.toLowerCase().includes("não") ||
            message.toLowerCase().includes("falh") ||
            message.toLowerCase().includes("indique")
              ? "bg-destructive/10 text-destructive"
              : "bg-green/10 text-green"
          }`}
        >
          {message}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {editingId ? "Editar actividade" : "Nova actividade"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={submit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome">
                <Input
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                />
              </Field>
              <Field label="Categoria">
                <Input
                  value={form.category}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, category: e.target.value }))
                  }
                  placeholder="Ex.: Artística"
                />
              </Field>
              <Field label="Ordem">
                <Input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, sortOrder: e.target.value }))
                  }
                />
              </Field>
              <div className="flex items-end gap-3 pb-1">
                <Switch
                  checked={form.active}
                  onCheckedChange={(checked) =>
                    setForm((f) => ({ ...f, active: checked }))
                  }
                />
                <span className="text-sm">Activa (visível nas candidaturas)</span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Serviços associados</p>
              <p className="text-xs text-muted-foreground">
                Seleccione os serviços em que a actividade está disponível e
                indique se está incluída ou tem preço.
              </p>
              <div className="space-y-2">
                {services.map((service) => {
                  const link = form.services.find(
                    (s) => s.serviceId === service.id,
                  );
                  const checked = !!link;
                  return (
                    <div
                      key={service.id}
                      className="rounded-lg border border-border/70 p-3"
                    >
                      <label className="flex items-center gap-3 text-sm">
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={checked}
                          onChange={() => toggleService(service.id)}
                        />
                        <span className="font-medium">{service.name}</span>
                      </label>
                      {checked && link && (
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <Field label="Preço">
                            <Select
                              value={link.pricing}
                              onValueChange={(v) =>
                                updateServiceLink(service.id, {
                                  pricing: v as "INCLUDED" | "PAID",
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="INCLUDED">Incluído</SelectItem>
                                <SelectItem value="PAID">Pago (AKZ)</SelectItem>
                              </SelectContent>
                            </Select>
                          </Field>
                          {link.pricing === "PAID" && (
                            <Field label="Valor (AKZ)">
                              <Input
                                type="number"
                                min={0}
                                step={1000}
                                value={link.priceAkz}
                                onChange={(e) =>
                                  updateServiceLink(service.id, {
                                    priceAkz: e.target.value,
                                  })
                                }
                                placeholder="40000"
                              />
                            </Field>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={saving}>
                {saving
                  ? "A guardar..."
                  : editingId
                    ? "Guardar alterações"
                    : "Adicionar actividade"}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={cancelEdit}>
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Actividades registadas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">A carregar...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ainda não existem actividades.
            </p>
          ) : (
            items.map((activity) => (
              <div
                key={activity.id}
                className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{activity.name}</p>
                    {!activity.active && (
                      <Badge variant="secondary">Inactiva</Badge>
                    )}
                    {activity.category && (
                      <Badge variant="outline">{activity.category}</Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(activity.services || []).length === 0 ? (
                      <span className="text-sm text-muted-foreground">
                        Sem serviços associados
                      </span>
                    ) : (
                      (activity.services || []).map((link) => (
                        <Badge key={link.id} variant="secondary">
                          {link.service.name}
                          {": "}
                          {link.pricing === "INCLUDED"
                            ? "Incluído"
                            : link.priceAkz != null
                              ? `AKZ ${link.priceAkz.toLocaleString("pt-PT", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}`
                              : "Pago"}
                        </Badge>
                      ))
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => startEdit(activity)}
                  >
                    <Pencil className="mr-1 h-4 w-4" />
                    Editar
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={actioningId === activity.id}
                    onClick={() => remove(activity.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Emprego({
  loggedIn,
  canManage,
}: {
  loggedIn: boolean;
  canManage: boolean;
}) {
  const [publicJobs, setPublicJobs] = useState<JobOpening[]>([]);
  const [adminJobs, setAdminJobs] = useState<JobOpening[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    department: "",
    location: "",
    description: "",
    requirements: "",
    status: "RASCUNHO",
  });

  const loadPublic = () => {
    api
      .getJobsPublic()
      .then(setPublicJobs)
      .catch(() => setPublicJobs([]));
  };

  const loadAdmin = () => {
    if (!canManage) return;
    setLoading(true);
    api
      .getJobsAdmin()
      .then(setAdminJobs)
      .catch(() => setAdminJobs([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPublic();
  }, []);

  useEffect(() => {
    loadAdmin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canManage, loggedIn]);

  const createJob = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      await api.createJob({
        title: form.title,
        department: form.department || undefined,
        location: form.location || undefined,
        description: form.description,
        requirements: form.requirements || undefined,
        status: form.status,
      });
      setForm({
        title: "",
        department: "",
        location: "",
        description: "",
        requirements: "",
        status: "RASCUNHO",
      });
      setMessage("Vaga criada com sucesso.");
      loadAdmin();
      loadPublic();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível criar a vaga.",
      );
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (id: string, status: string) => {
    setActioningId(id);
    setMessage("");
    try {
      await api.updateJob(id, { status });
      setMessage(
        status === "PUBLICADA" ? "Vaga publicada." : "Estado actualizado.",
      );
      loadAdmin();
      loadPublic();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível actualizar a vaga.",
      );
    } finally {
      setActioningId(null);
    }
  };

  const removeJob = async (id: string) => {
    setActioningId(id);
    setMessage("");
    try {
      await api.deleteJob(id);
      setMessage("Vaga removida.");
      loadAdmin();
      loadPublic();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível remover a vaga.",
      );
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-sm font-medium text-secondary">RECURSOS HUMANOS</p>
        <h1 className="text-3xl font-bold">Vagas de emprego</h1>
        <p className="mt-2 text-muted-foreground">
          Consulte as oportunidades abertas na Betteryou Kids.
        </p>
      </div>

      {message && (
        <p
          className={`rounded-lg p-3 text-sm ${
            message.toLowerCase().includes("não") ||
            message.toLowerCase().includes("falh")
              ? "bg-destructive/10 text-destructive"
              : "bg-green/10 text-green"
          }`}
        >
          {message}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Vagas publicadas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {publicJobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Neste momento não há vagas publicadas.
            </p>
          ) : (
            publicJobs.map((job) => (
              <div key={job.id} className="rounded-lg border p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{job.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {[job.department, job.location].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <Badge variant="secondary">Publicada</Badge>
                </div>
                <p className="mt-3 text-sm whitespace-pre-wrap">{job.description}</p>
                {job.requirements && (
                  <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
                    Requisitos: {job.requirements}
                  </p>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {canManage && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Nova vaga</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4 sm:grid-cols-2" onSubmit={createJob}>
                <Field label="Título">
                  <Input
                    required
                    value={form.title}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, title: e.target.value }))
                    }
                  />
                </Field>
                <Field label="Departamento">
                  <Input
                    value={form.department}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, department: e.target.value }))
                    }
                  />
                </Field>
                <Field label="Localização">
                  <Input
                    value={form.location}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, location: e.target.value }))
                    }
                  />
                </Field>
                <Field label="Estado">
                  <Select
                    value={form.status}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, status: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RASCUNHO">Rascunho</SelectItem>
                      <SelectItem value="PUBLICADA">Publicada</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Descrição">
                    <Textarea
                      required
                      value={form.description}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, description: e.target.value }))
                      }
                      rows={4}
                    />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Field label="Requisitos">
                    <Textarea
                      value={form.requirements}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          requirements: e.target.value,
                        }))
                      }
                      rows={3}
                    />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Button type="submit" disabled={saving}>
                    {saving ? "A guardar..." : "Criar vaga"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Gestão de vagas</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {!loading && adminJobs.length === 0 && (
                  <p className="p-5 text-sm text-muted-foreground">
                    Ainda não existem vagas criadas.
                  </p>
                )}
                {adminJobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex flex-wrap items-center justify-between gap-3 p-5"
                  >
                    <div>
                      <p className="font-semibold">{job.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {[job.department, job.location]
                          .filter(Boolean)
                          .join(" · ") || "Sem detalhes"}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{job.status}</Badge>
                      {job.status !== "PUBLICADA" && (
                        <Button
                          size="sm"
                          onClick={() => setStatus(job.id, "PUBLICADA")}
                          disabled={actioningId === job.id}
                        >
                          Publicar
                        </Button>
                      )}
                      {job.status === "PUBLICADA" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setStatus(job.id, "RASCUNHO")}
                          disabled={actioningId === job.id}
                        >
                          Despublicar
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeJob(job.id)}
                        disabled={actioningId === job.id}
                        aria-label="Remover vaga"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function AcessosAdmin({
  needsLogin,
  onLogin,
}: {
  needsLogin: boolean;
  onLogin: () => void;
}) {
  const [profiles, setProfiles] = useState<AccessProfile[]>([]);
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [moduleOptions, setModuleOptions] = useState<
    Array<{ key: string; label: string }>
  >([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [newProfileModules, setNewProfileModules] = useState<string[]>([]);
  const [profileDrafts, setProfileDrafts] = useState<Record<string, string[]>>(
    {},
  );
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    password: "",
    accessProfileId: "",
  });

  const loadAll = () => {
    setLoading(true);
    Promise.all([
      api.getAccessProfiles(),
      api.getAccessModules(),
      api.getUsers(),
    ])
      .then(([nextProfiles, nextModules, nextUsers]) => {
        setProfiles(nextProfiles);
        setModuleOptions(nextModules);
        setUsers(nextUsers);
        const drafts: Record<string, string[]> = {};
        nextProfiles.forEach((profile) => {
          drafts[profile.id] = parseModules(profile.modules);
        });
        setProfileDrafts(drafts);
      })
      .catch((error) => {
        setMessage(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar acessos.",
        );
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!needsLogin) loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsLogin]);

  if (needsLogin) {
    return (
      <Card>
        <CardContent className="space-y-4 p-8">
          <h1 className="text-2xl font-bold">Utilizadores e acessos</h1>
          <p className="text-muted-foreground">
            Inicie sessão para gerir perfis e utilizadores.
          </p>
          <Button onClick={onLogin}>Entrar</Button>
        </CardContent>
      </Card>
    );
  }

  const toggleModule = (list: string[], key: string) =>
    list.includes(key) ? list.filter((m) => m !== key) : [...list, key];

  const createProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage("");
    try {
      await api.createAccessProfile({
        name: newProfileName,
        modules: newProfileModules,
      });
      setNewProfileName("");
      setNewProfileModules([]);
      setMessage("Perfil criado.");
      loadAll();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível criar o perfil.",
      );
    }
  };

  const saveProfileModules = async (id: string) => {
    setMessage("");
    try {
      await api.updateAccessProfile(id, {
        modules: profileDrafts[id] || [],
      });
      setMessage("Perfil actualizado.");
      loadAll();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível actualizar o perfil.",
      );
    }
  };

  const removeProfile = async (profile: AccessProfile) => {
    if (profile.systemKey === "ADMIN") return;
    setMessage("");
    try {
      await api.deleteAccessProfile(profile.id);
      setMessage("Perfil removido.");
      loadAll();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível remover o perfil.",
      );
    }
  };

  const createUser = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage("");
    try {
      await api.createUser({
        name: userForm.name,
        email: userForm.email,
        password: userForm.password,
        accessProfileId: userForm.accessProfileId || undefined,
      });
      setUserForm({
        name: "",
        email: "",
        password: "",
        accessProfileId: "",
      });
      setMessage("Utilizador criado.");
      loadAll();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível criar o utilizador.",
      );
    }
  };

  const toggleUserActive = async (user: PlatformUser) => {
    setMessage("");
    try {
      await api.updateUser(user.id, { active: !user.active });
      setMessage(user.active ? "Utilizador desactivado." : "Utilizador activado.");
      loadAll();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível actualizar o utilizador.",
      );
    }
  };

  const changeUserProfile = async (userId: string, accessProfileId: string) => {
    setMessage("");
    try {
      await api.updateUser(userId, {
        accessProfileId: accessProfileId || null,
      });
      setMessage("Perfil do utilizador actualizado.");
      loadAll();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível alterar o perfil.",
      );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-sm font-medium text-secondary">ADMINISTRAÇÃO</p>
        <h1 className="text-3xl font-bold">Utilizadores e acessos</h1>
        <p className="mt-2 text-muted-foreground">
          Defina perfis de acesso e associe utilizadores da plataforma.
        </p>
      </div>

      {message && (
        <p
          className={`rounded-lg p-3 text-sm ${
            message.toLowerCase().includes("não") ||
            message.toLowerCase().includes("falh")
              ? "bg-destructive/10 text-destructive"
              : "bg-green/10 text-green"
          }`}
        >
          {message}
        </p>
      )}

      {loading && (
        <p className="text-sm text-muted-foreground">A carregar...</p>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Perfis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <form className="space-y-3 rounded-lg border p-4" onSubmit={createProfile}>
              <Field label="Nome do perfil">
                <Input
                  required
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                />
              </Field>
              <div className="space-y-2">
                <Label>Módulos</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {moduleOptions.map((mod) => (
                    <label
                      key={mod.key}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={newProfileModules.includes(mod.key)}
                        onChange={() =>
                          setNewProfileModules((list) =>
                            toggleModule(list, mod.key),
                          )
                        }
                      />
                      {mod.label}
                    </label>
                  ))}
                </div>
              </div>
              <Button type="submit" size="sm">
                <Plus className="mr-1 h-4 w-4" />
                Criar perfil
              </Button>
            </form>

            <div className="space-y-4">
              {profiles.map((profile) => {
                const selected = profileDrafts[profile.id] || [];
                return (
                  <div key={profile.id} className="rounded-lg border p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold">{profile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {profile.systemKey
                            ? `Sistema: ${profile.systemKey}`
                            : "Perfil personalizado"}
                          {profile._count
                            ? ` · ${profile._count.users} utilizador(es)`
                            : ""}
                        </p>
                      </div>
                      {profile.systemKey !== "ADMIN" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeProfile(profile)}
                          aria-label="Remover perfil"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {moduleOptions.map((mod) => (
                        <label
                          key={mod.key}
                          className="flex items-center gap-2 text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={selected.includes(mod.key)}
                            onChange={() =>
                              setProfileDrafts((drafts) => ({
                                ...drafts,
                                [profile.id]: toggleModule(
                                  drafts[profile.id] || [],
                                  mod.key,
                                ),
                              }))
                            }
                          />
                          {mod.label}
                        </label>
                      ))}
                    </div>
                    <Button
                      className="mt-3"
                      size="sm"
                      variant="outline"
                      onClick={() => saveProfileModules(profile.id)}
                    >
                      Guardar módulos
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Utilizadores</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <form className="space-y-3 rounded-lg border p-4" onSubmit={createUser}>
              <Field label="Nome">
                <Input
                  required
                  value={userForm.name}
                  onChange={(e) =>
                    setUserForm((f) => ({ ...f, name: e.target.value }))
                  }
                />
              </Field>
              <Field label="Email">
                <Input
                  required
                  type="email"
                  value={userForm.email}
                  onChange={(e) =>
                    setUserForm((f) => ({ ...f, email: e.target.value }))
                  }
                />
              </Field>
              <Field label="Palavra-passe">
                <Input
                  required
                  type="password"
                  value={userForm.password}
                  onChange={(e) =>
                    setUserForm((f) => ({ ...f, password: e.target.value }))
                  }
                />
              </Field>
              <Field label="Perfil">
                <Select
                  value={userForm.accessProfileId || undefined}
                  onValueChange={(v) =>
                    setUserForm((f) => ({ ...f, accessProfileId: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Escolher perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Button type="submit" size="sm">
                <Plus className="mr-1 h-4 w-4" />
                Criar utilizador
              </Button>
            </form>

            <div className="divide-y rounded-lg border">
              {users.length === 0 && (
                <p className="p-4 text-sm text-muted-foreground">
                  Ainda não existem utilizadores.
                </p>
              )}
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-wrap items-center justify-between gap-3 p-4"
                >
                  <div>
                    <p className="font-semibold">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {user.accessProfile?.name || user.role}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Select
                      value={user.accessProfileId || undefined}
                      onValueChange={(v) => changeUserProfile(user.id, v)}
                    >
                      <SelectTrigger className="w-44">
                        <SelectValue placeholder="Perfil" />
                      </SelectTrigger>
                      <SelectContent>
                        {profiles.map((profile) => (
                          <SelectItem key={profile.id} value={profile.id}>
                            {profile.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={user.active}
                        onCheckedChange={() => toggleUserActive(user)}
                      />
                      <span className="text-sm">
                        {user.active ? "Activo" : "Inactivo"}
                      </span>
                    </div>
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

function SalasAdmin({
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
    await api.deleteRoom(room.id);
    if (editingId === room.id) resetForm(true);
    loadRooms();
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

function TurmasAdmin({
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
  const [message, setMessage] = useState("");
  const [filterYearId, setFilterYearId] = useState("all");
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

  const submitClass = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.roomId || !form.academicYearId) {
      setMessage("Seleccione sala e ano letivo.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      await api.createClass({
        name: form.name.trim(),
        roomId: form.roomId,
        academicYearId: form.academicYearId,
        teacherName: form.teacherName.trim() || undefined,
        notes: form.notes.trim() || undefined,
      });
      setMessage("Turma criada com sucesso.");
      resetForm();
      loadClasses(filterYearId !== "all" ? filterYearId : undefined);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
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
      setMessage(`Turma "${item.name}" removida.`);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível remover a turma.",
      );
    }
  };

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
            <CardTitle className="text-lg">Nova turma</CardTitle>
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
              <Button type="submit" disabled={loading}>
                {loading ? "A guardar…" : "Criar turma"}
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Turmas registadas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
            <div className="divide-y rounded-lg border">
              {classes.length === 0 && (
                <p className="p-5 text-sm text-muted-foreground">
                  Nenhuma turma encontrada.
                </p>
              )}
              {classes.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 p-5"
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

function ContentEditor({
  needsLogin,
  onLogin,
}: {
  needsLogin: boolean;
  onLogin: () => void;
}) {
  const [title, setTitle] = useState("Home");
  const [heroTitle, setHeroTitle] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [cta, setCta] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [testimonials, setTestimonials] = useState<PublicTestimonial[]>([]);
  const [testimonialForm, setTestimonialForm] = useState({
    authorName: "",
    text: "",
    unitName: "",
  });
  const [testimonialMessage, setTestimonialMessage] = useState("");
  const [testimonialLoading, setTestimonialLoading] = useState(false);
  const [testimonialActionId, setTestimonialActionId] = useState<string | null>(
    null,
  );

  const loadTestimonials = () =>
    api
      .getAdminTestimonials()
      .then(setTestimonials)
      .catch(() => setTestimonials([]));

  useEffect(() => {
    if (needsLogin) return;
    api
      .getCmsPage("home")
      .then((page) => {
        setTitle(page.title);
        setHeroTitle(
          page.sections.find((s) => s.key === "hero_title")?.value || "",
        );
        setHeroSubtitle(
          page.sections.find((s) => s.key === "hero_subtitle")?.value || "",
        );
        setCta(page.sections.find((s) => s.key === "cta_primary")?.value || "");
      })
      .catch(() => setMessage("Não foi possível carregar o conteúdo."));
    loadTestimonials();
  }, [needsLogin]);

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
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="mb-2 text-sm font-medium text-secondary">COMUNICAÇÃO</p>
        <h1 className="text-3xl font-bold">Editar página Home</h1>
        <p className="mt-2 text-muted-foreground">
          Altere o texto, guarde e publique. Não precisa de código.
        </p>
      </div>
      <Card>
        <CardContent className="space-y-4 p-6">
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
          <Field label="Texto do botão">
            <Input value={cta} onChange={(e) => setCta(e.target.value)} />
          </Field>
          {message && <p className="text-sm text-muted-foreground">{message}</p>}
          <div className="flex gap-3">
            <Button
              disabled={loading}
              onClick={async () => {
                setLoading(true);
                setMessage("");
                try {
                  await api.saveCmsPage("home", {
                    title,
                    sections: [
                      {
                        key: "hero_title",
                        label: "Título principal",
                        value: heroTitle,
                      },
                      {
                        key: "hero_subtitle",
                        label: "Subtítulo",
                        value: heroSubtitle,
                      },
                      {
                        key: "cta_primary",
                        label: "Botão principal",
                        value: cta,
                      },
                    ],
                  });
                  setMessage("Guardado. Ainda não está publicado no site.");
                } catch (err) {
                  setMessage(
                    err instanceof Error ? err.message : "Erro ao guardar",
                  );
                } finally {
                  setLoading(false);
                }
              }}
            >
              Guardar
            </Button>
            <Button
              variant="secondary"
              disabled={loading}
              onClick={async () => {
                setLoading(true);
                try {
                  await api.saveCmsPage("home", {
                    title,
                    sections: [
                      {
                        key: "hero_title",
                        label: "Título principal",
                        value: heroTitle,
                      },
                      {
                        key: "hero_subtitle",
                        label: "Subtítulo",
                        value: heroSubtitle,
                      },
                      {
                        key: "cta_primary",
                        label: "Botão principal",
                        value: cta,
                      },
                    ],
                  });
                  await api.publishCmsPage("home");
                  setMessage("Publicado com sucesso.");
                } catch (err) {
                  setMessage(
                    err instanceof Error ? err.message : "Erro ao publicar",
                  );
                } finally {
                  setLoading(false);
                }
              }}
            >
              Publicar
            </Button>
          </div>
        </CardContent>
      </Card>

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
            <Input
              value={testimonialForm.unitName}
              onChange={(e) =>
                setTestimonialForm((f) => ({ ...f, unitName: e.target.value }))
              }
              placeholder="Ex.: Gika"
            />
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
          <Button
            disabled={testimonialLoading}
            onClick={async () => {
              if (
                !testimonialForm.authorName.trim() ||
                !testimonialForm.text.trim()
              ) {
                setTestimonialMessage("Preencha nome e texto.");
                return;
              }
              setTestimonialLoading(true);
              setTestimonialMessage("");
              try {
                await api.createTestimonial({
                  authorName: testimonialForm.authorName.trim(),
                  text: testimonialForm.text.trim(),
                  unitName: testimonialForm.unitName.trim() || undefined,
                });
                setTestimonialForm({ authorName: "", text: "", unitName: "" });
                setTestimonialMessage("Depoimento adicionado (rascunho).");
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
            Adicionar depoimento
          </Button>

          <div className="divide-y rounded-lg border">
            {testimonials.length === 0 && (
              <p className="p-4 text-sm text-muted-foreground">
                Ainda não há depoimentos.
              </p>
            )}
            {testimonials.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-start justify-between gap-3 p-4"
              >
                <div>
                  <p className="font-semibold">{item.authorName}</p>
                  {item.unitName && (
                    <p className="text-sm text-muted-foreground">
                      {item.unitName}
                    </p>
                  )}
                  <p className="mt-1 text-sm">{item.text}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.status === "PUBLICADO" ? "Publicado" : "Rascunho"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {item.status !== "PUBLICADO" && (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={testimonialActionId === item.id}
                      onClick={async () => {
                        setTestimonialActionId(item.id);
                        setTestimonialMessage("");
                        try {
                          await api.updateTestimonial(item.id, {
                            status: "PUBLICADO",
                          });
                          setTestimonialMessage("Depoimento publicado.");
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
                      Publicar
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={testimonialActionId === item.id}
                    onClick={async () => {
                      setTestimonialActionId(item.id);
                      setTestimonialMessage("");
                      try {
                        await api.deleteTestimonial(item.id);
                        setTestimonials((list) =>
                          list.filter((t) => t.id !== item.id),
                        );
                        setTestimonialMessage("Depoimento removido.");
                      } catch (err) {
                        setTestimonialMessage(
                          err instanceof Error ? err.message : "Erro ao remover",
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
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
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
