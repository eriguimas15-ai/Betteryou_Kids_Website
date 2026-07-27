import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { format, parseISO, subYears } from "date-fns";
import { pt } from "date-fns/locale";
import {
  Activity,
  BarChart3,
  Bell,
  Briefcase,
  BookOpen,
  Building2,
  CalendarDays,
  CalendarIcon,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  Clock,
  Database,
  DoorOpen,
  Download,
  FileSpreadsheet,
  FileText,
  FileUser,
  GraduationCap,
  HeartHandshake,
  History,
  Home,
  Image as ImageIcon,
  MapPin,
  Megaphone,
  Menu,
  PartyPopper,
  Plus,
  Pencil,
  Receipt,
  RefreshCw,
  School,
  Send,
  Shield,
  Sparkles,
  Ticket,
  TrendingUp,
  Trash2,
  Upload,
  Users,
  Wallet,
  X,
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
  uploadPublicUrl,
  type AcademicYear,
  type AccessProfile,
  type ActivityOffering,
  type ActivityPayload,
  type AdminRoom,
  type RoomDependencies,
  type RoomDeleteResult,
  type AttendanceStatus,
  type AttendanceStudentRow,
  type AttendanceTurma,
  type ClassGroup,
  type Communication,
  type CommunicationAudience,
  type CommunicationForMe,
  type CommunicationPayload,
  type EventItem,
  type EventPayload,
  type EventRegistration,
  type EventType,
  type MyEventRegistration,
  type PublicEvent,
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
  type Assessment,
  type AssessmentGradeType,
  type AssessmentPayload,
  type AssessmentPeriod,
  type AssessmentPeriodPayload,
  type ReportCard,
  type ReportCardStatus,
  type DashboardAcademico,
  type DashboardPedagogico,
  type LessonSummary,
  type LessonSummaryPayload,
  type ScheduleEntry,
  type ScheduleEntryPayload,
  type NeeProfile,
  type PeiPlan,
  type PeiPlanMine,
  type PeiPlanPayload,
  type PeiStatus,
  type CurriculumPlan,
  type CurriculumPlanPayload,
  type CurriculumArea,
  type DescriptiveReport,
  type DescriptiveReportPayload,
  type DescriptiveReportStatus,
  type Substitution,
  type SubstitutionPayload,
  type SubstitutionStatus,
  type SmsStatusInfo,
  type SmsLog,
  type NonTeachingActivity,
  type BehaviorRecord,
  type BehaviorType,
  type StudentQualification,
  type CurriculumMineEntry,
  type SchoolManual,
  type SchoolManualMineEntry,
  type MeetingMine,
  type StudentAttendance,
  type DashboardOverview,
  type EnrollmentAdmin,
  type EnrollmentPayload,
  type EnrollmentResult,
  type EnrollmentRoom,
  type GuardianEnrollment,
  type GuardianRenewal,
  type JobOpening,
  type PlatformUser,
  type PublicTestimonial,
  type ContentStatus,
  type MediaAsset,
  type GalleryAlbum,
  type GalleryItem,
  type CmsPage,
  type RenewalItem,
  type RoomsForEnrollment,
  type ServiceItem,
  type Student,
  type StudentFichaPayload,
  type Unit,
  type WaitlistItem,
  type PlatformSettings,
  type DashboardExecutivo,
  type AuditListResult,
  type AuditLogEntry,
  type BackupsResult,
} from "@/lib/api";
import {
  ActivitiesPicker,
  EmergenciesEditor,
  GuardiansEditor,
} from "@/components/platform/PeopleAndActivitiesFields";
import {
  ComportamentoTab,
  HabilitacoesTab,
  ManuaisTab,
  NleTab,
  ReunioesAdmin,
  behaviorTypeLabel,
  meetingTypeLabel,
} from "@/components/platform/CoverageExtras";
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

function isIncludedPublicActivity(item: {
  pricing?: "INCLUDED" | "PAID";
  included?: boolean;
  isIncluded?: boolean;
}): boolean {
  if (item.pricing === "INCLUDED") return true;
  if (item.pricing === "PAID") return false;
  if (item.included === true || item.isIncluded === true) return true;
  if (item.included === false || item.isIncluded === false) return false;
  return false;
}

function mapPublicActivities(
  list: Array<{
    name: string;
    pricing?: "INCLUDED" | "PAID";
    priceAkz?: number | null;
    included?: boolean;
    isIncluded?: boolean;
  }>,
): ActivityOption[] | null {
  // Resposta vazia é válida (serviço sem actividades na API).
  if (list.length === 0) return [];
  const hasPricing = list.every(
    (item) => item.pricing === "INCLUDED" || item.pricing === "PAID",
  );
  const hasIncludedFlag = list.every(
    (item) =>
      typeof item.included === "boolean" || typeof item.isIncluded === "boolean",
  );
  // Sem pricing / flags = API antiga — manter fallback local.
  if (!hasPricing && !hasIncludedFlag) {
    return null;
  }
  // Todas as actividades do serviço; incluídas vs pagas vêm no pricing.
  return list.map((item) => {
    const included = isIncludedPublicActivity(item);
    return {
      name: item.name,
      pricing: (included ? "INCLUDED" : "PAID") as "INCLUDED" | "PAID",
      priceAkz: included ? null : (item.priceAkz ?? null),
    };
  });
}

type View =
  | "dashboard"
  | "painel"
  | "portal"
  | "inscricoes"
  | "renovacoes"
  | "ficha"
  | "espera"
  | "salas"
  | "turmas"
  | "presencas"
  | "academico"
  | "curriculo"
  | "nee"
  | "reunioes"
  | "comunicados"
  | "eventos"
  | "financeiro"
  | "relatorios"
  | "actividades"
  | "emprego"
  | "conteudo"
  | "unidades"
  | "auditoria"
  | "backups"
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

function hasPortalAccess(modules: string[], role: string) {
  return modules.includes("portal") || role === "ENCARREGADO";
}

function navItemsFor(modules: string[], loggedIn: boolean, role = "") {
  if (!loggedIn) {
    return nav.filter((item) =>
      ["inscricoes", "renovacoes", "emprego"].includes(item.id),
    );
  }
  return nav.filter((item) => {
    if (item.id === "portal") return hasPortalAccess(modules, role);
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
  if (view === "portal") return hasPortalAccess(modules, role);
  if (view === "ficha") return hasFichaAccess(modules, role);
  return modules.includes(view);
}

const nav = [
  { id: "dashboard" as View, label: "Visão geral", icon: BarChart3 },
  { id: "painel" as View, label: "Painel executivo", icon: Activity },
  { id: "portal" as View, label: "Portal do encarregado", icon: School },
  { id: "inscricoes" as View, label: "Inscrições", icon: ClipboardList },
  { id: "renovacoes" as View, label: "Renovações", icon: RefreshCw },
  { id: "ficha" as View, label: "Ficha do aluno", icon: FileUser },
  { id: "espera" as View, label: "Lista de espera", icon: Users },
  { id: "salas" as View, label: "Salas", icon: DoorOpen },
  { id: "turmas" as View, label: "Turmas", icon: Users },
  { id: "presencas" as View, label: "Presenças", icon: ClipboardCheck },
  { id: "academico" as View, label: "Académico", icon: GraduationCap },
  { id: "curriculo" as View, label: "Currículo", icon: BookOpen },
  { id: "nee" as View, label: "NEE / PEI", icon: HeartHandshake },
  { id: "reunioes" as View, label: "Reuniões e actas", icon: CalendarDays },
  { id: "comunicados" as View, label: "Comunicados", icon: Megaphone },
  { id: "eventos" as View, label: "Eventos e festas", icon: PartyPopper },
  { id: "financeiro" as View, label: "Financeiro", icon: Wallet },
  { id: "relatorios" as View, label: "Relatórios", icon: FileSpreadsheet },
  { id: "actividades" as View, label: "Actividades", icon: Sparkles },
  { id: "emprego" as View, label: "Vagas de emprego", icon: Briefcase },
  { id: "conteudo" as View, label: "Conteúdo do site", icon: FileText },
  { id: "unidades" as View, label: "Unidades", icon: Building2 },
  { id: "auditoria" as View, label: "Auditoria", icon: History },
  { id: "backups" as View, label: "Cópias de segurança", icon: Database },
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
  const [units, setUnits] = useState<Unit[]>([]);
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

  const selectedUnit = units.find((u) => u.name === unit);
  const availableServices = enrollableServicesForUnit(selectedUnit, unit);

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
        (hasPortalAccess(modules, userRole)
          ? ("portal" as View)
          : undefined) ||
        (nav.find((item) => {
          if (item.id === "portal") return hasPortalAccess(modules, userRole);
          if (item.id === "ficha") return hasFichaAccess(modules, userRole);
          return modules.includes(item.id);
        })?.id as View) ||
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
    api
      .getUnits()
      .then((list) => {
        setUnits(list);
        setUnit((current) =>
          current && list.some((u) => u.name === current)
            ? current
            : list[0]?.name ?? current,
        );
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (availableServices.length > 0 && !availableServices.includes(service)) {
      setService(availableServices[0]);
    }
  }, [availableServices, service]);

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
      : hasPortalAccess(userModules, role)
        ? "portal"
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
          {view === "painel" && (
            <PainelExecutivo
              needsLogin={!token}
              userRole={userRole}
              onLogin={() => goTo("login")}
            />
          )}
          {view === "inscricoes" && (
            <>
              <Enrollment
                unit={unit}
                units={units}
                service={service}
                setUnit={setUnit}
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
          {view === "portal" && hasPortalAccess(modules, userRole) && (
            <PortalEncarregado
              needsLogin={!token}
              onLogin={() => {
                setLoginMode("login");
                goTo("login");
              }}
              onRegister={() => {
                setLoginMode("register");
                goTo("login");
              }}
              onOpenFicha={() => goTo("ficha")}
              onOpenInscricoes={() => goTo("inscricoes")}
              onOpenRenovacoes={() => goTo("renovacoes")}
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
          {view === "presencas" && (
            <PresencasAdmin needsLogin={!token} onLogin={() => goTo("login")} />
          )}
          {view === "academico" && (
            <AcademicoAdmin
              needsLogin={!token}
              userRole={userRole}
              onLogin={() => goTo("login")}
            />
          )}
          {view === "curriculo" && (
            <CurriculoAdmin
              needsLogin={!token}
              userRole={userRole}
              onLogin={() => goTo("login")}
            />
          )}
          {view === "nee" && (
            <NeeAdmin
              needsLogin={!token}
              userRole={userRole}
              onLogin={() => goTo("login")}
            />
          )}
          {view === "reunioes" && (
            <ReunioesAdmin
              needsLogin={!token}
              userRole={userRole}
              onLogin={() => goTo("login")}
            />
          )}
          {view === "comunicados" && (
            <ComunicadosAdmin
              needsLogin={!token}
              userRole={userRole}
              onLogin={() => goTo("login")}
            />
          )}
          {view === "eventos" && (
            <EventosAdmin
              needsLogin={!token}
              userRole={userRole}
              onLogin={() => goTo("login")}
            />
          )}
          {view === "financeiro" && (
            <FinanceiroAdmin
              needsLogin={!token}
              userRole={userRole}
              onLogin={() => goTo("login")}
            />
          )}
          {view === "relatorios" && (
            <RelatoriosAdmin
              needsLogin={!token}
              userRole={userRole}
              onLogin={() => goTo("login")}
            />
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
          {view === "unidades" && (
            <UnidadesAdmin
              needsLogin={!token}
              userRole={userRole}
              onLogin={() => goTo("login")}
            />
          )}
          {view === "auditoria" && (
            <AuditoriaAdmin
              needsLogin={!token}
              userRole={userRole}
              onLogin={() => goTo("login")}
            />
          )}
          {view === "backups" && (
            <BackupsAdmin
              needsLogin={!token}
              userRole={userRole}
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

function formatResponseWindow(hours: number): string {
  if (hours === 1) return "1 hora";
  if (hours % 24 === 0) {
    const days = hours / 24;
    return days === 1 ? "1 dia" : `${days} dias`;
  }
  return `${hours} horas`;
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
  const [responseHours, setResponseHours] = useState(48);
  const [deadlineEnabled, setDeadlineEnabled] = useState(true);

  useEffect(() => {
    if (needsLogin) return;
    api
      .getPlatformSettings()
      .then((settings) => {
        setResponseHours(settings.waitlistResponseHours);
        setDeadlineEnabled(settings.waitlistDeadlineEnabled);
      })
      .catch(() => {
        setResponseHours(48);
        setDeadlineEnabled(true);
      });
  }, [needsLogin]);

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
              text={
                deadlineEnabled
                  ? `Notifique as famílias quando houver vaga (${formatResponseWindow(responseHours)}).`
                  : "Notifique as famílias quando houver vaga (sem limite de tempo)."
              }
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

/**
 * Serviços que não são inscritíveis via formulário (não têm salas próprias).
 * Excluídos das listas de serviços das candidaturas/renovações.
 */
const NON_ENROLLABLE_SERVICES = new Set(["Festas e Eventos Infantis"]);

/**
 * Deriva os serviços inscritíveis de uma unidade a partir do registo (fonte
 * única). Quando a unidade ainda não carregou/o nome não corresponde, recorre
 * a uma lista de reserva razoável para não deixar o formulário vazio.
 */
function enrollableServicesForUnit(
  unit: Unit | undefined,
  fallbackUnitName?: string,
): string[] {
  if (unit) {
    const names = unit.services
      .filter(
        (s) => s.active !== false && !NON_ENROLLABLE_SERVICES.has(s.service.name),
      )
      .map((s) => s.service.name);
    if (names.length > 0) return names;
  }
  return fallbackUnitName && /patriota/i.test(fallbackUnitName)
    ? ["Creche", "Pré-Escolar", "Jardim de Infância", "ATL"]
    : ["Creche", "Pré-Escolar", "Jardim de Infância", "1.º Ciclo", "ATL"];
}

function Enrollment({
  unit,
  units,
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
  units: Unit[];
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
    activitiesForService(service, unit),
  );
  const [allergies, setAllergies] = useState("");
  const [medication, setMedication] = useState("");
  const [foodRestrictions, setFoodRestrictions] = useState("");
  const [medicalNotes, setMedicalNotes] = useState("");
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    let active = true;
    const fallback = activitiesForService(service, unit);
    setActivityOptions(fallback);
    setActivities((current) => filterActivitiesForService(current, fallback));
    api
      .getActivitiesPublic(service, unit)
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
  }, [service, unit]);

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
                    {units.map((u) => (
                      <SelectItem key={u.id} value={u.name}>
                        {u.name}
                      </SelectItem>
                    ))}
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
  const fallback: Record<string, string> = {
    bilhete: "Bilhete de identidade",
    cedula: "Cédula",
    vacinas: "Cartão de vacinas",
    foto: "Fotografia",
    outro: "Outro",
  };
  return (
    ENROLLMENT_DOC_TYPES.find((item) => item.value === type)?.label ??
    fallback[type] ??
    type
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
      setDocuments((list) => [...list, { ...doc, filePath: "" }]);
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

function waitlistStatusLabel(status: string) {
  switch (status) {
    case "NOTIFICADO":
      return "Vaga reservada";
    case "EXPIRADO":
      return "Expirado";
    case "CONFIRMADO":
      return "Confirmado";
    case "CANCELADO":
      return "Cancelado";
    default:
      return "A aguardar";
  }
}

function formatDeadline(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString("pt-PT");
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
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [processingExpired, setProcessingExpired] = useState(false);
  const [message, setMessage] = useState("");
  const [responseHours, setResponseHours] = useState(48);
  const [hoursDraft, setHoursDraft] = useState("48");
  const [deadlineEnabled, setDeadlineEnabled] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [togglingDeadline, setTogglingDeadline] = useState(false);

  const load = () => {
    setLoading(true);
    api
      .getWaitlist()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  const loadSettings = () => {
    api
      .getPlatformSettings()
      .then((settings: PlatformSettings) => {
        setResponseHours(settings.waitlistResponseHours);
        setHoursDraft(String(settings.waitlistResponseHours));
        setDeadlineEnabled(settings.waitlistDeadlineEnabled);
      })
      .catch(() => {
        setResponseHours(48);
        setHoursDraft("48");
        setDeadlineEnabled(true);
      });
  };

  useEffect(() => {
    if (needsLogin) return;
    load();
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsLogin]);

  const saveResponseWindow = async () => {
    const hours = Number(hoursDraft);
    if (!Number.isInteger(hours) || hours < 1 || hours > 720) {
      setMessage("Indique um prazo inteiro entre 1 e 720 horas.");
      return;
    }
    setSavingSettings(true);
    setMessage("");
    try {
      const settings = await api.updatePlatformSettings({
        waitlistResponseHours: hours,
      });
      setResponseHours(settings.waitlistResponseHours);
      setHoursDraft(String(settings.waitlistResponseHours));
      setMessage(
        `Prazo de resposta actualizado para ${formatResponseWindow(settings.waitlistResponseHours)}.`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível guardar o prazo de resposta.",
      );
    } finally {
      setSavingSettings(false);
    }
  };

  const toggleDeadline = async (enabled: boolean) => {
    setTogglingDeadline(true);
    setMessage("");
    try {
      const settings = await api.updatePlatformSettings({
        waitlistDeadlineEnabled: enabled,
      });
      setDeadlineEnabled(settings.waitlistDeadlineEnabled);
      setMessage(
        settings.waitlistDeadlineEnabled
          ? `Prazo de resposta activado (${formatResponseWindow(settings.waitlistResponseHours)}).`
          : "Prazo de resposta desactivado — as reservas não expiram automaticamente.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível actualizar o prazo de resposta.",
      );
    } finally {
      setTogglingDeadline(false);
    }
  };

  const notify = async (id: string) => {
    setActioningId(id);
    setMessage("");
    try {
      await api.notifyWaitlist(id);
      setMessage(
        deadlineEnabled
          ? `Encarregado notificado. A vaga ficou reservada durante ${formatResponseWindow(responseHours)}.`
          : "Encarregado notificado. A vaga ficou reservada sem limite de tempo.",
      );
      load();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Não foi possível notificar.",
      );
    } finally {
      setActioningId(null);
    }
  };

  const confirm = async (enrollmentId: string) => {
    setActioningId(enrollmentId);
    setMessage("");
    try {
      await api.confirmEnrollment(enrollmentId);
      setMessage("Inscrição confirmada. A reserva passou a matrícula.");
      load();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Não foi possível confirmar.",
      );
    } finally {
      setActioningId(null);
    }
  };

  const processExpired = async () => {
    setProcessingExpired(true);
    setMessage("");
    try {
      const result = await api.processExpiredWaitlist();
      setMessage(result.message);
      load();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível processar os prazos expirados.",
      );
    } finally {
      setProcessingExpired(false);
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

  const windowLabel = formatResponseWindow(responseHours);

  return (
    <div>
      <div className="mb-7 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-sm font-medium text-secondary">ADMISSÕES</p>
          <h1 className="text-3xl font-bold">Lista de espera</h1>
          <p className="mt-2 text-muted-foreground">
            {deadlineEnabled
              ? `Notificar reserva a vaga por ${windowLabel}; após o prazo, processe expirações para libertar e avançar a fila.`
              : "Sem limite de tempo — as reservas não expiram automaticamente. Liberte a vaga manualmente quando necessário."}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={processExpired}
          disabled={processingExpired || !deadlineEnabled}
        >
          {processingExpired ? "A processar…" : "Processar prazos expirados"}
        </Button>
      </div>

      <Card className="mb-5">
        <CardContent className="flex flex-col gap-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <Label htmlFor="waitlist-deadline-enabled">
                Prazo de resposta {deadlineEnabled ? "activo" : "desactivado"}
              </Label>
              <p className="text-xs text-muted-foreground">
                {deadlineEnabled
                  ? "As reservas expiram automaticamente após o prazo definido."
                  : "Sem limite de tempo — as reservas não expiram automaticamente."}
              </p>
            </div>
            <Switch
              id="waitlist-deadline-enabled"
              checked={deadlineEnabled}
              onCheckedChange={toggleDeadline}
              disabled={togglingDeadline}
            />
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="space-y-2 sm:max-w-xs">
              <Label htmlFor="waitlist-response-hours">Duração do prazo</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="waitlist-response-hours"
                  type="number"
                  min={1}
                  max={720}
                  step={1}
                  value={hoursDraft}
                  onChange={(e) => setHoursDraft(e.target.value)}
                  className="w-28"
                  disabled={!deadlineEnabled}
                />
                <span className="text-sm text-muted-foreground">horas</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {deadlineEnabled ? (
                  <>
                    Actual: {windowLabel}
                    {responseHours % 24 === 0
                      ? ""
                      : responseHours >= 24
                        ? ` (≈ ${(responseHours / 24).toFixed(1)} dias)`
                        : ""}
                    . Usado nas próximas notificações.
                  </>
                ) : (
                  "Sem limite de tempo — as reservas não expiram automaticamente."
                )}
              </p>
            </div>
            <Button
              onClick={saveResponseWindow}
              disabled={
                !deadlineEnabled ||
                savingSettings ||
                hoursDraft === String(responseHours)
              }
            >
              {savingSettings ? "A guardar…" : "Guardar prazo"}
            </Button>
          </div>
        </CardContent>
      </Card>

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
            {items.map((item, index) => {
              const deadlineLabel = formatDeadline(item.responseDeadline);
              const deadlinePassed =
                item.status === "NOTIFICADO" &&
                item.responseDeadline &&
                new Date(item.responseDeadline).getTime() < Date.now();
              return (
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
                        {item.enrollment.unit.name} ·{" "}
                        {item.enrollment.service.name}
                        {item.room ? ` · ${item.room.name}` : ""}
                      </p>
                      {item.status === "NOTIFICADO" &&
                        (deadlineLabel ? (
                          <p
                            className={`mt-1 text-xs ${
                              deadlinePassed
                                ? "font-medium text-destructive"
                                : "text-muted-foreground"
                            }`}
                          >
                            {deadlinePassed
                              ? `Prazo expirado em ${deadlineLabel}`
                              : `Resposta até ${deadlineLabel}`}
                          </p>
                        ) : (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Sem prazo — a reserva não expira automaticamente.
                          </p>
                        ))}
                      {item.status === "EXPIRADO" && deadlineLabel && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Expirou em {deadlineLabel}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        item.status === "EXPIRADO"
                          ? "bg-muted text-muted-foreground"
                          : item.status === "NOTIFICADO"
                            ? "bg-primary/10 text-primary"
                            : "bg-accent/15 text-amber-700"
                      }`}
                    >
                      {waitlistStatusLabel(item.status)}
                    </span>
                    {item.status === "AGUARDAR" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => notify(item.id)}
                        disabled={actioningId === item.id}
                      >
                        <Bell className="mr-1.5 h-4 w-4" />
                        Notificar e reservar
                      </Button>
                    )}
                    {item.status === "NOTIFICADO" && item.enrollment.id && (
                      <Button
                        size="sm"
                        onClick={() => confirm(item.enrollment.id)}
                        disabled={
                          actioningId === item.enrollment.id || !!deadlinePassed
                        }
                      >
                        Confirmar inscrição
                      </Button>
                    )}
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
            <SelectItem value="EXPIRADA">Expiradas</SelectItem>
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
  const [units, setUnits] = useState<Unit[]>([]);
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
    api
      .getUnits()
      .then((list) => {
        setUnits(list);
        setForm((f) =>
          f.unitName && list.some((u) => u.name === f.unitName)
            ? f
            : { ...f, unitName: list[0]?.name ?? f.unitName },
        );
      })
      .catch(() => undefined);
  }, []);

  const selectedUnit = units.find((u) => u.name === form.unitName);
  const services = enrollableServicesForUnit(selectedUnit, form.unitName);

  useEffect(() => {
    if (services.length > 0 && !services.includes(form.serviceName)) {
      setForm((f) => ({ ...f, serviceName: services[0] }));
    }
  }, [services, form.serviceName]);

  useEffect(() => {
    let active = true;
    const serviceName = form.serviceName;
    const unitName = form.unitName;
    const fallback = activitiesForService(serviceName, unitName);
    setActivityOptions(fallback);
    setActivities((current) => filterActivitiesForService(current, fallback));
    api
      .getActivitiesPublic(serviceName, unitName)
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
  }, [form.serviceName, form.unitName]);

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
                    setForm((f) => ({ ...f, unitName: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((u) => (
                      <SelectItem key={u.id} value={u.name}>
                        {u.name}
                      </SelectItem>
                    ))}
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

function enrollmentStatusLabel(status: string) {
  switch (status) {
    case "PENDENTE_VALIDACAO":
      return "Pendente de validação";
    case "LISTA_ESPERA":
      return "Lista de espera";
    case "CONFIRMADA":
      return "Confirmada";
    case "CANCELADA":
      return "Cancelada";
    case "EXPIRADA":
      return "Expirada";
    default:
      return status;
  }
}

function renewalStatusLabel(status: string) {
  switch (status) {
    case "PENDENTE":
      return "Pendente";
    case "CONFIRMADA":
      return "Confirmada";
    case "LISTA_ESPERA":
      return "Lista de espera";
    case "CANCELADA":
      return "Cancelada";
    default:
      return status;
  }
}

function PortalEncarregado({
  needsLogin,
  onLogin,
  onRegister,
  onOpenFicha,
  onOpenInscricoes,
  onOpenRenovacoes,
}: {
  needsLogin: boolean;
  onLogin: () => void;
  onRegister: () => void;
  onOpenFicha: () => void;
  onOpenInscricoes: () => void;
  onOpenRenovacoes: () => void;
}) {
  const [enrollments, setEnrollments] = useState<GuardianEnrollment[]>([]);
  const [renewals, setRenewals] = useState<GuardianRenewal[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceByStudent, setAttendanceByStudent] = useState<
    Record<string, StudentAttendance[]>
  >({});
  const [summariesByStudent, setSummariesByStudent] = useState<
    Record<string, LessonSummary[]>
  >({});
  const [assessmentsByStudent, setAssessmentsByStudent] = useState<
    Record<string, Assessment[]>
  >({});
  const [scheduleByStudent, setScheduleByStudent] = useState<
    Record<string, ScheduleEntry[]>
  >({});
  const [peiPlans, setPeiPlans] = useState<PeiPlanMine[]>([]);
  const [descriptiveReports, setDescriptiveReports] = useState<
    DescriptiveReport[]
  >([]);
  const [reportCards, setReportCards] = useState<ReportCard[]>([]);
  const [curriculumMine, setCurriculumMine] = useState<CurriculumMineEntry[]>(
    [],
  );
  const [behaviorMine, setBehaviorMine] = useState<BehaviorRecord[]>([]);
  const [manualsMine, setManualsMine] = useState<SchoolManualMineEntry[]>([]);
  const [qualificationsMine, setQualificationsMine] = useState<
    StudentQualification[]
  >([]);
  const [agendaMeetings, setAgendaMeetings] = useState<MeetingMine[]>([]);
  const [communications, setCommunications] = useState<CommunicationForMe[]>([]);
  const [myInvoices, setMyInvoices] = useState<Invoice[]>([]);
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [myEventRegistrations, setMyEventRegistrations] = useState<
    MyEventRegistration[]
  >([]);
  const [eventBusyId, setEventBusyId] = useState<string | null>(null);
  const [reportCardPdfBusyId, setReportCardPdfBusyId] = useState<string | null>(
    null,
  );
  const [eventMessage, setEventMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadPortal = () => {
    setLoading(true);
    setError("");
    Promise.all([
      api.getMyEnrollments(),
      api.getMyRenewals(),
      api.getStudents(),
    ])
      .then(([mine, mineRenewals, mineStudents]) => {
        setEnrollments(mine);
        setRenewals(mineRenewals);
        setStudents(mineStudents);
        api
          .getMyCommunications()
          .then(setCommunications)
          .catch(() => setCommunications([]));
        api.getMyPeiPlans().then(setPeiPlans).catch(() => setPeiPlans([]));
        api
          .getMyDescriptiveReports()
          .then(setDescriptiveReports)
          .catch(() => setDescriptiveReports([]));
        api
          .getMyReportCards()
          .then(setReportCards)
          .catch(() => setReportCards([]));
        api
          .getMyCurriculum()
          .then(setCurriculumMine)
          .catch(() => setCurriculumMine([]));
        api
          .getMyBehaviorRecords()
          .then(setBehaviorMine)
          .catch(() => setBehaviorMine([]));
        api
          .getMySchoolManuals()
          .then(setManualsMine)
          .catch(() => setManualsMine([]));
        api
          .getMyQualifications()
          .then(setQualificationsMine)
          .catch(() => setQualificationsMine([]));
        api
          .getMyMeetings()
          .then(setAgendaMeetings)
          .catch(() => setAgendaMeetings([]));
        api.getMyInvoices().then(setMyInvoices).catch(() => setMyInvoices([]));
        api.getPublicEvents().then(setEvents).catch(() => setEvents([]));
        api
          .getMyEventRegistrations()
          .then(setMyEventRegistrations)
          .catch(() => setMyEventRegistrations([]));
        Promise.all(
          mineStudents.map((student) =>
            api
              .getStudentAttendance(student.id)
              .then(
                (records) => [student.id, records] as [string, StudentAttendance[]],
              )
              .catch(() => [student.id, []] as [string, StudentAttendance[]]),
          ),
        ).then((entries) => setAttendanceByStudent(Object.fromEntries(entries)));
        Promise.all(
          mineStudents.map((student) =>
            api
              .getStudentSummaries(student.id)
              .then(
                (records) => [student.id, records] as [string, LessonSummary[]],
              )
              .catch(() => [student.id, []] as [string, LessonSummary[]]),
          ),
        ).then((entries) => setSummariesByStudent(Object.fromEntries(entries)));
        Promise.all(
          mineStudents.map((student) =>
            api
              .getStudentAssessments(student.id)
              .then(
                (records) => [student.id, records] as [string, Assessment[]],
              )
              .catch(() => [student.id, []] as [string, Assessment[]]),
          ),
        ).then((entries) => setAssessmentsByStudent(Object.fromEntries(entries)));
        Promise.all(
          mineStudents.map((student) =>
            api
              .getStudentSchedule(student.id)
              .then(
                (records) => [student.id, records] as [string, ScheduleEntry[]],
              )
              .catch(() => [student.id, []] as [string, ScheduleEntry[]]),
          ),
        ).then((entries) => setScheduleByStudent(Object.fromEntries(entries)));
      })
      .catch((err) => {
        setEnrollments([]);
        setRenewals([]);
        setStudents([]);
        setAttendanceByStudent({});
        setSummariesByStudent({});
        setAssessmentsByStudent({});
        setScheduleByStudent({});
        setPeiPlans([]);
        setDescriptiveReports([]);
        setReportCards([]);
        setCurriculumMine([]);
        setBehaviorMine([]);
        setManualsMine([]);
        setQualificationsMine([]);
        setAgendaMeetings([]);
        setCommunications([]);
        setMyInvoices([]);
        setEvents([]);
        setMyEventRegistrations([]);
        setError(
          err instanceof Error
            ? err.message
            : "Não foi possível carregar o portal.",
        );
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (needsLogin) return;
    loadPortal();
  }, [needsLogin]);

  if (needsLogin) {
    return (
      <Card>
        <CardContent className="space-y-4 p-8">
          <h1 className="text-2xl font-bold">Portal do encarregado</h1>
          <p className="text-muted-foreground">
            Entre com a conta de encarregado para ver o estado das matrículas,
            documentos e dados dos seus alunos.
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

  const orphanStudents = students.filter(
    (student) =>
      !enrollments.some((e) => e.student?.id === student.id) &&
      !renewals.some((r) => r.student?.id === student.id),
  );

  const unreadCommunications = communications.filter((c) => !c.readAt).length;

  const markCommunicationRead = async (id: string) => {
    try {
      const result = await api.markCommunicationRead(id);
      setCommunications((list) =>
        list.map((c) => (c.id === id ? { ...c, readAt: result.readAt } : c)),
      );
    } catch {
      // Silencioso — o encarregado pode tentar novamente.
    }
  };

  const registrationForEvent = (eventId: string) =>
    myEventRegistrations.find(
      (r) => r.eventId === eventId && r.status !== "CANCELADO",
    );

  const refreshMyRegistrations = () => {
    api
      .getMyEventRegistrations()
      .then(setMyEventRegistrations)
      .catch(() => setMyEventRegistrations([]));
    api.getPublicEvents().then(setEvents).catch(() => setEvents([]));
  };

  const registerForEvent = async (event: PublicEvent) => {
    setEventBusyId(event.id);
    setEventMessage("");
    try {
      const student = students[0];
      await api.registerForEvent(event.id, {
        studentId: student?.id ?? null,
        childName: student?.childFullName,
      });
      setEventMessage(`Inscrição registada para "${event.title}".`);
      refreshMyRegistrations();
    } catch (err) {
      setEventMessage(
        err instanceof Error
          ? err.message
          : "Não foi possível concluir a inscrição.",
      );
    } finally {
      setEventBusyId(null);
    }
  };

  const cancelEventRegistration = async (registrationId: string) => {
    setEventBusyId(registrationId);
    setEventMessage("");
    try {
      await api.cancelMyEventRegistration(registrationId);
      setEventMessage("Inscrição cancelada.");
      refreshMyRegistrations();
    } catch (err) {
      setEventMessage(
        err instanceof Error
          ? err.message
          : "Não foi possível cancelar a inscrição.",
      );
    } finally {
      setEventBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-sm font-medium text-secondary">FAMÍLIA</p>
          <h1 className="text-3xl font-bold">Portal do encarregado</h1>
          <p className="mt-2 text-muted-foreground">
            Consulte o estado das inscrições, renovações, documentos e fichas
            dos seus alunos.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={onOpenInscricoes}>
            Nova inscrição
          </Button>
          <Button variant="outline" onClick={onOpenRenovacoes}>
            Pedir renovação
          </Button>
          <Button onClick={onOpenFicha}>Completar ficha</Button>
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">A carregar...</p>
      ) : (
        <>
          <section className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold">Comunicados</h2>
              {unreadCommunications > 0 && (
                <Badge variant="default">
                  {unreadCommunications} por ler
                </Badge>
              )}
            </div>
            {communications.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-sm text-muted-foreground">
                  Ainda não há comunicados para si.
                </CardContent>
              </Card>
            ) : (
              communications.map((item) => (
                <Card
                  key={item.id}
                  className={item.readAt ? undefined : "border-primary/50"}
                >
                  <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        {!item.readAt && (
                          <span className="inline-block h-2 w-2 rounded-full bg-primary" />
                        )}
                        {item.title}
                      </CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.author?.name || "Escola"}
                        {item.publishedAt
                          ? ` · ${format(parseISO(item.publishedAt), "dd/MM/yyyy", { locale: pt })}`
                          : ""}
                      </p>
                    </div>
                    <Badge variant={item.readAt ? "outline" : "default"}>
                      {item.readAt ? "Lido" : "Novo"}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="whitespace-pre-line text-sm">{item.body}</p>
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
                    {!item.readAt && (
                      <div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markCommunicationRead(item.id)}
                        >
                          <Check className="mr-1 h-3.5 w-3.5" />
                          Marcar como lido
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </section>

          <section className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold">Agenda escolar</h2>
              {myEventRegistrations.filter((r) => r.status !== "CANCELADO")
                .length > 0 && (
                <Badge variant="outline">
                  {
                    myEventRegistrations.filter((r) => r.status !== "CANCELADO")
                      .length
                  }{" "}
                  inscrição(ões)
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Eventos, festas e reuniões partilhadas com a família.
            </p>
            {eventMessage && (
              <p className="text-sm text-muted-foreground">{eventMessage}</p>
            )}
            {agendaMeetings.length > 0 && (
              <div className="space-y-3">
                {agendaMeetings.map((meeting) => (
                  <Card key={`m-${meeting.id}`}>
                    <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <CalendarDays className="h-5 w-5 text-primary" />
                          {meeting.title}
                        </CardTitle>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {formatEventDateTime(meeting.dateTime)}
                          {meeting.location ? ` · ${meeting.location}` : ""}
                          {meeting.unit?.name ? ` · ${meeting.unit.name}` : ""}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {meetingTypeLabel(meeting.type)}
                      </Badge>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
            {events.length === 0 && agendaMeetings.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-sm text-muted-foreground">
                  De momento não há eventos, festas ou reuniões na agenda.
                </CardContent>
              </Card>
            ) : (
              events.map((event) => {
                const registration = registrationForEvent(event.id);
                const busy =
                  eventBusyId === event.id ||
                  (registration && eventBusyId === registration.id);
                return (
                  <Card key={event.id}>
                    <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <PartyPopper className="h-5 w-5 text-primary" />
                          {event.title}
                        </CardTitle>
                        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <CalendarIcon className="h-4 w-4" />
                            {formatEventDateTime(event.startAt)}
                          </span>
                          {event.location && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {event.location}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1">
                            <Ticket className="h-4 w-4" />
                            {formatEventPrice(event.priceAkz)}
                          </span>
                        </p>
                      </div>
                      <Badge variant="outline">
                        {eventTypeLabel(event.type)}
                      </Badge>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="whitespace-pre-line text-sm">
                        {event.description}
                      </p>
                      {registration ? (
                        <div className="flex flex-wrap items-center gap-3">
                          <Badge
                            variant={
                              registration.status === "INSCRITO"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {registration.status === "LISTA_ESPERA"
                              ? "Em lista de espera"
                              : "Inscrito"}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() =>
                              cancelEventRegistration(registration.id)
                            }
                          >
                            Cancelar inscrição
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center gap-3">
                          <Button
                            size="sm"
                            disabled={busy}
                            onClick={() => registerForEvent(event)}
                          >
                            {busy
                              ? "A inscrever…"
                              : event.isFull
                                ? "Entrar em lista de espera"
                                : "Inscrever criança"}
                          </Button>
                          {event.spotsRemaining != null && (
                            <span className="text-xs text-muted-foreground">
                              {event.isFull
                                ? "Lotação esgotada"
                                : `${event.spotsRemaining} vaga(s) disponível(is)`}
                            </span>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Inscrições</h2>
            {enrollments.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-sm text-muted-foreground">
                  Ainda não há inscrições associadas a este email. Pode iniciar
                  uma nova inscrição na área pública.
                </CardContent>
              </Card>
            ) : (
              enrollments.map((item) => {
                const pendingFicha =
                  item.student?.profileStatus === "PENDENTE_FICHA";
                const deadline = item.waitlistEntry?.responseDeadline;
                return (
                  <Card key={item.id}>
                    <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
                      <div>
                        <CardTitle className="text-lg">
                          {item.childFullName}
                        </CardTitle>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {item.unit.name} · {item.service.name} ·{" "}
                          {item.academicYear.label}
                          {item.room ? ` · ${item.room.name}` : ""}
                        </p>
                      </div>
                      <Badge
                        variant={
                          item.status === "CONFIRMADA" ? "default" : "secondary"
                        }
                      >
                        {enrollmentStatusLabel(item.status)}
                      </Badge>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-2 text-sm sm:grid-cols-2">
                        <p>
                          <span className="text-muted-foreground">
                            Encarregado:{" "}
                          </span>
                          {item.guardianFullName}
                        </p>
                        <p>
                          <span className="text-muted-foreground">
                            Contacto:{" "}
                          </span>
                          {item.guardianPhone}
                        </p>
                        {item.student && (
                          <p>
                            <span className="text-muted-foreground">
                              Ficha:{" "}
                            </span>
                            {item.student.profileStatus === "COMPLETA"
                              ? "Completa"
                              : "Pendente"}
                          </p>
                        )}
                        {deadline ? (
                          <p>
                            <span className="text-muted-foreground">
                              Prazo de resposta:{" "}
                            </span>
                            {format(parseISO(deadline), "dd/MM/yyyy HH:mm", {
                              locale: pt,
                            })}
                          </p>
                        ) : (
                          item.waitlistEntry?.status === "NOTIFICADO" && (
                            <p>
                              <span className="text-muted-foreground">
                                Prazo de resposta:{" "}
                              </span>
                              Sem prazo
                            </p>
                          )
                        )}
                      </div>

                      <div>
                        <p className="mb-2 text-sm font-medium">Documentos</p>
                        {item.documents.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            Ainda não há documentos carregados.
                          </p>
                        ) : (
                          <ul className="space-y-1">
                            {item.documents.map((doc) => (
                              <li key={doc.id}>
                                <a
                                  className="inline-flex items-center gap-2 text-sm text-primary underline-offset-2 hover:underline"
                                  href={uploadPublicUrl(doc.filePath)}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  <FileText className="h-4 w-4" />
                                  {documentTypeLabel(doc.type)} — {doc.fileName}
                                </a>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      {item.student && pendingFicha && (
                        <Button size="sm" onClick={onOpenFicha}>
                          Completar ficha do aluno
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Renovações</h2>
            {renewals.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-sm text-muted-foreground">
                  Ainda não há pedidos de renovação associados a este email.
                </CardContent>
              </Card>
            ) : (
              renewals.map((item) => (
                <Card key={item.id}>
                  <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
                    <div>
                      <CardTitle className="text-lg">
                        {item.childFullName}
                      </CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.unit.name} · {item.service.name} ·{" "}
                        {item.academicYear.label}
                      </p>
                    </div>
                    <Badge
                      variant={
                        item.status === "CONFIRMADA" ? "default" : "secondary"
                      }
                    >
                      {renewalStatusLabel(item.status)}
                    </Badge>
                  </CardHeader>
                  {item.student?.profileStatus === "PENDENTE_FICHA" && (
                    <CardContent>
                      <Button size="sm" onClick={onOpenFicha}>
                        Completar ficha do aluno
                      </Button>
                    </CardContent>
                  )}
                </Card>
              ))
            )}
          </section>

          {orphanStudents.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xl font-semibold">Fichas associadas</h2>
              {orphanStudents.map((student) => (
                <Card key={student.id}>
                  <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
                    <div>
                      <CardTitle className="text-lg">
                        {student.childFullName}
                      </CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {student.unit?.name || "—"} ·{" "}
                        {student.service?.name || "—"} ·{" "}
                        {student.academicYear?.label || "—"}
                      </p>
                    </div>
                    <Badge
                      variant={
                        student.profileStatus === "COMPLETA"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {student.profileStatus === "COMPLETA"
                        ? "Ficha completa"
                        : "Completar ficha"}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <Button size="sm" onClick={onOpenFicha}>
                      Abrir ficha
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </section>
          )}

          {myInvoices.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xl font-semibold">Situação financeira</h2>
              {students.map((student) => {
                const records = myInvoices.filter(
                  (inv) => inv.studentId === student.id,
                );
                if (records.length === 0) return null;
                const outstanding = records.reduce((sum, inv) => {
                  if (inv.status === "ANULADO" || inv.status === "PAGO")
                    return sum;
                  const paid = (inv.payments || []).reduce(
                    (s, p) => s + p.amountAkz,
                    0,
                  );
                  return sum + Math.max(inv.amountAkz - paid, 0);
                }, 0);
                return (
                  <Card key={student.id}>
                    <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
                      <div>
                        <CardTitle className="text-lg">
                          {student.childFullName}
                        </CardTitle>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {student.room?.name || "—"} ·{" "}
                          {student.academicYear?.label || "—"}
                        </p>
                      </div>
                      <Badge
                        variant={
                          outstanding > 0 ? "destructive" : "secondary"
                        }
                        className="text-base"
                      >
                        {outstanding > 0
                          ? `Em dívida ${formatAkz(outstanding)}`
                          : "Regularizado"}
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      <div className="divide-y rounded-lg border">
                        {records.map((inv) => {
                          const paid = (inv.payments || []).reduce(
                            (s, p) => s + p.amountAkz,
                            0,
                          );
                          return (
                            <div
                              key={inv.id}
                              className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 text-sm"
                            >
                              <div>
                                <p className="font-medium">
                                  {inv.description} · {inv.referenceMonth}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Vence {formatFinanceiroDate(inv.dueDate)}
                                  {paid > 0
                                    ? ` · Pago ${formatAkz(paid)}`
                                    : ""}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold">
                                  {formatAkz(inv.amountAkz)}
                                </p>
                                <Badge
                                  variant={invoiceStatusBadgeVariant(
                                    inv.status,
                                  )}
                                >
                                  {invoiceStatusLabel(inv.status)}
                                </Badge>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </section>
          )}

          {students.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xl font-semibold">Presenças</h2>
              {students.map((student) => {
                const records = attendanceByStudent[student.id] || [];
                const totals = records.reduce(
                  (acc, record) => {
                    acc[record.status] = (acc[record.status] || 0) + 1;
                    return acc;
                  },
                  {} as Record<string, number>,
                );
                return (
                  <Card key={student.id}>
                    <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
                      <div>
                        <CardTitle className="text-lg">
                          {student.childFullName}
                        </CardTitle>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {student.room?.name || "—"} ·{" "}
                          {student.academicYear?.label || "—"}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {ATTENDANCE_OPTIONS.map((opt) =>
                          totals[opt.value] ? (
                            <Badge
                              key={opt.value}
                              variant={attendanceBadgeVariant(opt.value)}
                            >
                              {opt.label}: {totals[opt.value]}
                            </Badge>
                          ) : null,
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {records.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Ainda não há presenças registadas.
                        </p>
                      ) : (
                        <div className="divide-y rounded-lg border">
                          {records.slice(0, 30).map((record) => (
                            <div
                              key={record.id}
                              className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm"
                            >
                              <span>
                                {format(
                                  parseISO(
                                    record.date.length === 10
                                      ? `${record.date}T12:00:00`
                                      : record.date,
                                  ),
                                  "dd/MM/yyyy",
                                  { locale: pt },
                                )}
                                {record.note ? (
                                  <span className="text-muted-foreground">
                                    {" "}
                                    — {record.note}
                                  </span>
                                ) : null}
                              </span>
                              <Badge
                                variant={attendanceBadgeVariant(record.status)}
                              >
                                {attendanceStatusLabel(record.status)}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </section>
          )}

          {students.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xl font-semibold">Sumários</h2>
              {students.map((student) => {
                const records = summariesByStudent[student.id] || [];
                return (
                  <Card key={student.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {student.childFullName}
                      </CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {student.room?.name || "—"} ·{" "}
                        {student.academicYear?.label || "—"}
                      </p>
                    </CardHeader>
                    <CardContent>
                      {records.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Ainda não há sumários registados.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {records.slice(0, 20).map((item) => (
                            <div
                              key={item.id}
                              className="space-y-1 rounded-lg border p-3"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="font-medium">
                                  {item.subject}
                                  {item.topic ? ` — ${item.topic}` : ""}
                                </p>
                                <span className="text-xs text-muted-foreground">
                                  {formatAcademicoDate(item.date)}
                                </span>
                              </div>
                              <p className="whitespace-pre-line text-sm text-muted-foreground">
                                {item.description}
                              </p>
                              {item.homework && (
                                <p className="text-sm">
                                  <span className="font-medium">
                                    Trabalho de casa:{" "}
                                  </span>
                                  <span className="text-muted-foreground">
                                    {item.homework}
                                  </span>
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </section>
          )}

          {students.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xl font-semibold">Avaliações</h2>
              {students.map((student) => {
                const records = assessmentsByStudent[student.id] || [];
                return (
                  <Card key={student.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {student.childFullName}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {records.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Ainda não há avaliações registadas.
                        </p>
                      ) : (
                        <div className="divide-y rounded-lg border">
                          {records.map((item) => (
                            <div
                              key={item.id}
                              className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 text-sm"
                            >
                              <div>
                                <p className="font-medium">
                                  {item.title} · {item.subject}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatAcademicoDate(item.date)}
                                  {item.note ? ` — ${item.note}` : ""}
                                </p>
                              </div>
                              <Badge variant="secondary" className="text-base">
                                {assessmentGradeDisplay(item)}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </section>
          )}

          {students.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xl font-semibold">Horário</h2>
              {students.map((student) => {
                const records = scheduleByStudent[student.id] || [];
                return (
                  <Card key={student.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {student.childFullName}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {records.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Ainda não há horário definido.
                        </p>
                      ) : (
                        WEEKDAYS.filter((d) =>
                          records.some((e) => e.weekday === d.value),
                        ).map((d) => (
                          <div key={d.value} className="space-y-2">
                            <p className="text-sm font-semibold">{d.label}</p>
                            <div className="divide-y rounded-lg border">
                              {records
                                .filter((e) => e.weekday === d.value)
                                .map((entry) => (
                                  <div
                                    key={entry.id}
                                    className="flex flex-wrap items-center gap-3 px-4 py-2 text-sm"
                                  >
                                    <span className="inline-flex items-center gap-1 font-medium">
                                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                      {entry.startTime}–{entry.endTime}
                                    </span>
                                    <span>{entry.subject}</span>
                                    {entry.room && (
                                      <span className="text-muted-foreground">
                                        · {entry.room}
                                      </span>
                                    )}
                                  </div>
                                ))}
                            </div>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </section>
          )}

          {peiPlans.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xl font-semibold">NEE / PEI</h2>
              <p className="text-sm text-muted-foreground">
                Resumo do Plano Educativo Individual dos seus educandos
                (consulta apenas).
              </p>
              {peiPlans.map((plan) => (
                <Card key={plan.id}>
                  <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
                    <div>
                      <CardTitle className="text-lg">
                        {plan.student.childFullName}
                        {plan.title ? ` · ${plan.title}` : ""}
                      </CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {plan.student.unit?.name || "—"}
                        {plan.student.room?.name
                          ? ` · ${plan.student.room.name}`
                          : ""}
                        {plan.academicYear?.label
                          ? ` · ${plan.academicYear.label}`
                          : ""}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {peiStatusLabel(plan.status)}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="whitespace-pre-line text-sm">{plan.summary}</p>
                    {plan.strategies && (
                      <p className="text-sm">
                        <span className="font-medium">Estratégias: </span>
                        <span className="text-muted-foreground">
                          {plan.strategies}
                        </span>
                      </p>
                    )}
                    {plan.supports && (
                      <p className="text-sm">
                        <span className="font-medium">Apoios: </span>
                        <span className="text-muted-foreground">
                          {plan.supports}
                        </span>
                      </p>
                    )}
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {plan.responsibleTeacher && (
                        <span>Responsável: {plan.responsibleTeacher}</span>
                      )}
                      {plan.reviewDate && (
                        <span>
                          Próxima revisão:{" "}
                          {formatAcademicoDate(plan.reviewDate)}
                        </span>
                      )}
                    </div>
                    {plan.recentReviews.length > 0 && (
                      <div className="space-y-2 border-t pt-3">
                        <p className="text-sm font-medium">
                          Acompanhamentos recentes
                        </p>
                        {plan.recentReviews.map((review) => (
                          <div
                            key={review.id}
                            className="rounded-lg border p-3 text-sm"
                          >
                            <p className="text-xs text-muted-foreground">
                              {formatAcademicoDate(review.date)}
                            </p>
                            <p className="mt-1 whitespace-pre-line text-muted-foreground">
                              {review.notes}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </section>
          )}

          {descriptiveReports.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xl font-semibold">Sínteses descritivas</h2>
              <p className="text-sm text-muted-foreground">
                Relatórios periódicos publicados pela equipa educativa.
              </p>
              {descriptiveReports.map((report) => (
                <Card key={report.id}>
                  <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
                    <div>
                      <CardTitle className="text-lg">
                        {report.student?.childFullName || "Aluno"}
                        {" · "}
                        {report.periodLabel}
                      </CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {report.areaFocus ? `${report.areaFocus} · ` : ""}
                        {report.academicYear?.label ||
                          report.student?.academicYear?.label ||
                          "—"}
                        {report.publishedAt
                          ? ` · ${formatAcademicoDate(report.publishedAt)}`
                          : ""}
                      </p>
                    </div>
                    <Badge variant="secondary">Publicado</Badge>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-line text-sm">{report.body}</p>
                    {report.author && (
                      <p className="mt-3 text-xs text-muted-foreground">
                        Autor: {report.author.name}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </section>
          )}

          {reportCards.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xl font-semibold">Boletins</h2>
              <p className="text-sm text-muted-foreground">
                Avaliações por período publicadas pela equipa educativa.
              </p>
              {reportCards.map((card) => (
                <Card key={card.id}>
                  <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
                    <div>
                      <CardTitle className="text-lg">
                        {card.student?.childFullName || "Aluno"}
                        {" · "}
                        {card.period?.name || "Período"}
                      </CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {card.classGroup?.name || "—"}
                        {card.period?.academicYear?.label
                          ? ` · ${card.period.academicYear.label}`
                          : ""}
                        {card.publishedAt
                          ? ` · ${formatAcademicoDate(card.publishedAt)}`
                          : ""}
                      </p>
                    </div>
                    <Badge variant="secondary">Publicado</Badge>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {(card.lines ?? []).length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Sem linhas de avaliação neste boletim.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {(card.lines ?? []).map((line) => (
                          <div
                            key={line.id}
                            className="rounded-lg border p-3 text-sm"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div>
                                <p className="font-medium">
                                  {line.subject} — {line.title}
                                </p>
                                {line.comment && (
                                  <p className="mt-1 whitespace-pre-line text-muted-foreground">
                                    {line.comment}
                                  </p>
                                )}
                              </div>
                              <Badge variant="outline">
                                {line.gradeType === "NUMERICA"
                                  ? line.gradeValue != null
                                    ? String(line.gradeValue)
                                    : "—"
                                  : line.gradeLabel ||
                                    (line.sourceType === "SINTESE"
                                      ? "Síntese"
                                      : "—")}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {card.overallComment && (
                      <div className="rounded-lg border bg-slate-50 p-3 text-sm">
                        <p className="font-medium">Comentário geral</p>
                        <p className="mt-1 whitespace-pre-line text-muted-foreground">
                          {card.overallComment}
                        </p>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={reportCardPdfBusyId === card.id}
                        onClick={async () => {
                          setReportCardPdfBusyId(card.id);
                          try {
                            await api.downloadReportCardPdf(card.id);
                          } catch (err) {
                            setError(
                              err instanceof Error
                                ? err.message
                                : "Não foi possível transferir o PDF.",
                            );
                          } finally {
                            setReportCardPdfBusyId(null);
                          }
                        }}
                      >
                        <Download className="mr-1 h-3.5 w-3.5" />
                        {reportCardPdfBusyId === card.id
                          ? "A transferir…"
                          : "Transferir PDF"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </section>
          )}

          {curriculumMine.some((e) => e.plans.length > 0) && (
            <section className="space-y-3">
              <h2 className="text-xl font-semibold">Currículo</h2>
              <p className="text-sm text-muted-foreground">
                Planos curriculares activos do serviço dos seus educandos.
              </p>
              {curriculumMine.map((entry) =>
                entry.plans.length === 0 ? null : (
                  <Card key={entry.student.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {entry.student.childFullName}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {entry.student.service?.name || "—"}
                        {entry.student.unit?.name
                          ? ` · ${entry.student.unit.name}`
                          : ""}
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {entry.plans.map((plan) => (
                        <div key={plan.id} className="rounded-lg border p-3">
                          <p className="font-medium">{plan.name}</p>
                          {plan.description && (
                            <p className="mt-1 text-sm text-muted-foreground">
                              {plan.description}
                            </p>
                          )}
                          {plan.areas && plan.areas.length > 0 && (
                            <ul className="mt-2 space-y-1 text-sm">
                              {plan.areas.map((area) => (
                                <li key={area.id}>
                                  <span className="font-medium">{area.name}</span>
                                  {area.objectives &&
                                    area.objectives.length > 0 && (
                                      <span className="text-muted-foreground">
                                        {" "}
                                        · {area.objectives.length} objectivo(s)
                                      </span>
                                    )}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ),
              )}
            </section>
          )}

          {behaviorMine.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xl font-semibold">Comportamento</h2>
              <p className="text-sm text-muted-foreground">
                Registos partilhados pela equipa educativa.
              </p>
              {behaviorMine.map((item) => (
                <Card key={item.id}>
                  <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
                    <div>
                      <CardTitle className="text-lg">
                        {item.student?.childFullName || "Aluno"}
                      </CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatAcademicoDate(item.date)}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {behaviorTypeLabel(item.type)}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-line text-sm">
                      {item.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </section>
          )}

          {manualsMine.some((e) => e.manuals.length > 0) && (
            <section className="space-y-3">
              <h2 className="text-xl font-semibold">Manuais escolares</h2>
              {manualsMine.map((entry) =>
                entry.manuals.length === 0 ? null : (
                  <Card key={entry.student.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {entry.student.childFullName}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {entry.student.service?.name || "—"}
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {entry.manuals.map((manual) => (
                        <div
                          key={manual.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm"
                        >
                          <div>
                            <p className="font-medium">{manual.title}</p>
                            <p className="text-muted-foreground">
                              {[manual.subjectArea, manual.publisher]
                                .filter(Boolean)
                                .join(" · ") || "—"}
                            </p>
                          </div>
                          {manual.mediaUrl && (
                            <a
                              className="text-primary underline-offset-2 hover:underline"
                              href={manual.mediaUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Abrir
                            </a>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ),
              )}
            </section>
          )}

          {qualificationsMine.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xl font-semibold">Habilitações</h2>
              <p className="text-sm text-muted-foreground">
                Certificados e habilitações dos seus educandos.
              </p>
              {qualificationsMine.map((item) => (
                <Card key={item.id}>
                  <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
                    <div>
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.student?.childFullName || "Aluno"}
                        {" · "}
                        {formatAcademicoDate(item.issuedAt)}
                        {item.issuer ? ` · ${item.issuer}` : ""}
                      </p>
                    </div>
                    {item.documentUrl && (
                      <a
                        className="text-sm text-primary underline-offset-2 hover:underline"
                        href={item.documentUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Documento
                      </a>
                    )}
                  </CardHeader>
                  {item.notes && (
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{item.notes}</p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </section>
          )}
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
    const unitName = student.unit?.name || "";
    const fallback = activitiesForService(serviceName, unitName);
    setActivityOptions(fallback);
    setActivities(
      filterActivitiesForService(activitiesFromStudent(student), fallback),
    );
    setMessage("");
    if (needsLogin || !serviceName) return;
    let active = true;
    api
      .getActivitiesPublic(serviceName, unitName)
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
    unitId: string;
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
  const [units, setUnits] = useState<Unit[]>([]);
  // Unidade em edição no formulário. "" = oferta global (todas as unidades).
  const [activeUnitId, setActiveUnitId] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState(emptyForm);

  const unitLabel = (unitId: string | null | undefined) =>
    unitId
      ? units.find((u) => u.id === unitId)?.name || "Unidade"
      : "Todas as unidades";

  const load = () => {
    if (needsLogin || !canManage) return;
    setLoading(true);
    Promise.all([
      api.getActivitiesAdmin(),
      api.getServices(),
      api.getUnitsAdmin().catch(() => [] as Unit[]),
    ])
      .then(([activities, serviceList, unitList]) => {
        setItems(activities);
        setServices(serviceList.filter((s) => s.active));
        setUnits(unitList);
      })
      .catch(() => {
        setItems([]);
        setServices([]);
        setUnits([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsLogin, canManage]);

  const startEdit = (activity: ActivityOffering) => {
    setEditingId(activity.id);
    setActiveUnitId("");
    setForm({
      name: activity.name,
      category: activity.category || "",
      active: activity.active,
      sortOrder: String(activity.sortOrder ?? 0),
      services: (activity.services || []).map((link) => ({
        unitId: link.unitId || link.unit?.id || "",
        serviceId: link.service.id,
        pricing: link.pricing,
        priceAkz: link.priceAkz != null ? String(link.priceAkz) : "",
      })),
    });
    setMessage("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setActiveUnitId("");
    setForm(emptyForm());
  };

  // Só as ligações da unidade actualmente em edição.
  const scopedServices = form.services.filter(
    (s) => (s.unitId || "") === activeUnitId,
  );

  const toggleService = (serviceId: string) => {
    setForm((current) => {
      const exists = current.services.some(
        (s) => s.serviceId === serviceId && (s.unitId || "") === activeUnitId,
      );
      if (exists) {
        return {
          ...current,
          services: current.services.filter(
            (s) =>
              !(s.serviceId === serviceId && (s.unitId || "") === activeUnitId),
          ),
        };
      }
      return {
        ...current,
        services: [
          ...current.services,
          { unitId: activeUnitId, serviceId, pricing: "PAID", priceAkz: "40000" },
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
        s.serviceId === serviceId && (s.unitId || "") === activeUnitId
          ? { ...s, ...patch }
          : s,
      ),
    }));
  };

  const toPayload = (): ActivityPayload => ({
    name: form.name.trim(),
    category: form.category.trim() || null,
    active: form.active,
    sortOrder: Number(form.sortOrder) || 0,
    services: form.services.map((s) => ({
      unitId: s.unitId || null,
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
                Escolha a unidade e seleccione os serviços em que a actividade
                está disponível, indicando se está incluída ou tem preço. A
                opção &quot;Todas as unidades&quot; define o preço global usado
                quando não existe valor específico da unidade.
              </p>
              <Field label="Unidade da oferta">
                <Select
                  value={activeUnitId || "none"}
                  onValueChange={(v) => setActiveUnitId(v === "none" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as unidades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      Todas as unidades (global)
                    </SelectItem>
                    {units.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <div className="space-y-2">
                {services.map((service) => {
                  const link = scopedServices.find(
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
                          {(link.unit?.name || link.unitId) && (
                            <span className="font-semibold">
                              {link.unit?.name || unitLabel(link.unitId)}
                              {" · "}
                            </span>
                          )}
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

function ComunicadosAdmin({
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

function EventosAdmin({
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

// ─────────────────────────────── Relatórios ───────────────────────────────

const RELATORIOS_FINANCE_ROLES = ["ADMIN", "DIRECAO"];
const RELATORIOS_OPERATIONAL_ROLES = ["ADMIN", "DIRECAO", "COORDENACAO"];

function RelatoriosAdmin({
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

// ─────────────────────────────── Financeiro ───────────────────────────────

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

function FinanceiroAdmin({
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

const CURRICULO_MANAGE_ROLES = ["ADMIN", "DIRECAO", "COORDENACAO"];

function CurriculoAdmin({
  needsLogin,
  userRole,
  onLogin,
}: {
  needsLogin: boolean;
  userRole: string;
  onLogin: () => void;
}) {
  const canManage = CURRICULO_MANAGE_ROLES.includes(userRole);
  const [plans, setPlans] = useState<CurriculumPlan[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [serviceFilter, setServiceFilter] = useState("all");
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [form, setForm] = useState({
    name: "",
    description: "",
    serviceId: "",
    academicYearId: "",
    unitId: "",
    levelLabel: "",
    classGroupId: "",
    active: true,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [areaName, setAreaName] = useState("");
  const [areaCode, setAreaCode] = useState("");
  const [objectiveTitle, setObjectiveTitle] = useState("");
  const [objectiveAreaId, setObjectiveAreaId] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [section, setSection] = useState<"planos" | "manuais">("planos");

  const loadPlans = () => {
    setLoading(true);
    api
      .getCurriculumPlans({
        serviceId: serviceFilter !== "all" ? serviceFilter : undefined,
      })
      .then((list) => {
        setPlans(list);
        setSelectedPlanId((cur) => cur || list[0]?.id || "");
      })
      .catch((err) =>
        setMessage(
          err instanceof Error
            ? err.message
            : "Não foi possível carregar o currículo.",
        ),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (needsLogin) return;
    loadPlans();
    api.getServices().then(setServices).catch(() => setServices([]));
    api.getAcademicYears().then(setYears).catch(() => setYears([]));
    api.getUnits().then(setUnits).catch(() => setUnits([]));
    api.getClasses().then(setClasses).catch(() => setClasses([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsLogin, serviceFilter]);

  if (needsLogin) {
    return (
      <Card>
        <CardContent className="space-y-4 p-8">
          <h1 className="text-2xl font-bold">Currículo</h1>
          <p className="text-muted-foreground">
            Inicie sessão para consultar e gerir planos curriculares.
          </p>
          <Button onClick={onLogin}>Entrar</Button>
        </CardContent>
      </Card>
    );
  }

  const selectedPlan =
    plans.find((p) => p.id === selectedPlanId) || plans[0] || null;

  const resetForm = () => {
    setEditingId(null);
    setForm({
      name: "",
      description: "",
      serviceId: services[0]?.id || "",
      academicYearId: years.find((y) => y.active)?.id || years[0]?.id || "",
      unitId: "",
      levelLabel: "",
      classGroupId: "",
      active: true,
    });
  };

  const startEdit = (plan: CurriculumPlan) => {
    setEditingId(plan.id);
    setSelectedPlanId(plan.id);
    setForm({
      name: plan.name,
      description: plan.description || "",
      serviceId: plan.serviceId,
      academicYearId: plan.academicYearId || "",
      unitId: plan.unitId || "",
      levelLabel: plan.levelLabel || "",
      classGroupId: plan.classGroupId || "",
      active: plan.active,
    });
  };

  const submitPlan = async () => {
    if (!form.name.trim() || !form.serviceId) {
      setMessage("Indique o nome e o serviço do plano.");
      return;
    }
    setSaving(true);
    setMessage("");
    const payload: CurriculumPlanPayload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      serviceId: form.serviceId,
      academicYearId: form.academicYearId || null,
      unitId: form.unitId || null,
      levelLabel: form.levelLabel.trim() || null,
      classGroupId: form.classGroupId || null,
      active: form.active,
    };
    try {
      const saved = editingId
        ? await api.updateCurriculumPlan(editingId, payload)
        : await api.createCurriculumPlan(payload);
      setMessage(editingId ? "Plano actualizado." : "Plano curricular criado.");
      setEditingId(saved.id);
      setSelectedPlanId(saved.id);
      loadPlans();
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Não foi possível guardar.",
      );
    } finally {
      setSaving(false);
    }
  };

  const removePlan = async (id: string) => {
    if (!confirm("Eliminar este plano curricular e as suas áreas?")) return;
    try {
      await api.deleteCurriculumPlan(id);
      if (selectedPlanId === id) setSelectedPlanId("");
      if (editingId === id) resetForm();
      loadPlans();
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Não foi possível eliminar.",
      );
    }
  };

  const addArea = async () => {
    if (!selectedPlan || !areaName.trim()) return;
    try {
      await api.createCurriculumArea({
        planId: selectedPlan.id,
        name: areaName.trim(),
        code: areaCode.trim() || null,
      });
      setAreaName("");
      setAreaCode("");
      loadPlans();
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Não foi possível criar a área.",
      );
    }
  };

  const addObjective = async () => {
    if (!objectiveAreaId || !objectiveTitle.trim()) return;
    try {
      await api.createCurriculumObjective({
        areaId: objectiveAreaId,
        title: objectiveTitle.trim(),
      });
      setObjectiveTitle("");
      loadPlans();
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : "Não foi possível criar o objectivo.",
      );
    }
  };

  return (
    <div>
      <div className="mb-7">
        <p className="mb-2 text-sm font-medium text-secondary">PEDAGÓGICO</p>
        <h1 className="text-3xl font-bold">Currículo</h1>
        <p className="mt-2 text-muted-foreground">
          Planos curriculares por serviço e manuais escolares. Encarregados
          consultam no portal os planos e manuais do serviço dos filhos.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={section === "planos" ? "default" : "outline"}
          onClick={() => setSection("planos")}
        >
          Planos curriculares
        </Button>
        <Button
          size="sm"
          variant={section === "manuais" ? "default" : "outline"}
          onClick={() => setSection("manuais")}
        >
          Manuais escolares
        </Button>
      </div>

      {section === "manuais" ? (
        <ManuaisTab canManage={canManage} />
      ) : (
        <>
      <Card className="mb-6">
        <CardContent className="flex flex-wrap gap-4 p-4">
          <div className="w-64">
            <Field label="Filtrar por serviço">
              <Select value={serviceFilter} onValueChange={setServiceFilter}>
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
          </div>
          {message && (
            <p className="self-end text-sm text-muted-foreground">{message}</p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {canManage && (
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">
                {editingId ? "Editar plano" : "Novo plano"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Field label="Nome">
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Ex.: Pré-escolar 2026/2027"
                />
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
              <Field label="Ano lectivo">
                <Select
                  value={form.academicYearId || "none"}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      academicYearId: v === "none" ? "" : v,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    {years.map((y) => (
                      <SelectItem key={y.id} value={y.id}>
                        {y.label}
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
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Todas</SelectItem>
                    {units.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Nível / faixa">
                <Input
                  value={form.levelLabel}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, levelLabel: e.target.value }))
                  }
                  placeholder="Ex.: Pré II, 1.ª Classe"
                />
              </Field>
              <Field label="Turma (opcional)">
                <Select
                  value={form.classGroupId || "none"}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      classGroupId: v === "none" ? "" : v,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
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
              <Field label="Descrição">
                <Textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                />
              </Field>
              <div className="flex flex-wrap gap-2">
                <Button onClick={submitPlan} disabled={saving}>
                  {saving ? "A guardar…" : editingId ? "Actualizar" : "Criar"}
                </Button>
                {editingId && (
                  <Button variant="ghost" onClick={resetForm}>
                    Cancelar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className={canManage ? "lg:col-span-2" : "lg:col-span-3"}>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
            <CardTitle className="text-lg">
              Planos ({plans.length})
              {loading ? "…" : ""}
            </CardTitle>
            {plans.length > 0 && (
              <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <SelectTrigger className="w-72">
                  <SelectValue placeholder="Seleccionar plano" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} · {p.service?.name || "—"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedPlan ? (
              <p className="text-sm text-muted-foreground">
                Ainda não há planos curriculares.
              </p>
            ) : (
              <>
                <div className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{selectedPlan.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedPlan.service?.name}
                        {selectedPlan.levelLabel
                          ? ` · ${selectedPlan.levelLabel}`
                          : ""}
                        {selectedPlan.academicYear?.label
                          ? ` · ${selectedPlan.academicYear.label}`
                          : ""}
                        {selectedPlan.unit?.name
                          ? ` · ${selectedPlan.unit.name}`
                          : ""}
                      </p>
                      {selectedPlan.description && (
                        <p className="mt-2 text-sm whitespace-pre-line">
                          {selectedPlan.description}
                        </p>
                      )}
                    </div>
                    {canManage && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEdit(selectedPlan)}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removePlan(selectedPlan.id)}
                        >
                          Eliminar
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {(selectedPlan.areas || []).map((area: CurriculumArea) => (
                  <div key={area.id} className="rounded-lg border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">
                        {area.code ? `${area.code} · ` : ""}
                        {area.name}
                      </p>
                      {canManage && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            if (!confirm("Eliminar área e objectivos?")) return;
                            await api.deleteCurriculumArea(area.id);
                            loadPlans();
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                    <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                      {(area.objectives || []).map((obj) => (
                        <li key={obj.id} className="flex justify-between gap-2">
                          <span>
                            {obj.code ? `[${obj.code}] ` : ""}
                            {obj.title}
                          </span>
                          {canManage && (
                            <button
                              type="button"
                              className="text-xs underline"
                              onClick={async () => {
                                await api.deleteCurriculumObjective(obj.id);
                                loadPlans();
                              }}
                            >
                              remover
                            </button>
                          )}
                        </li>
                      ))}
                      {(area.objectives || []).length === 0 && (
                        <li>Sem objectivos.</li>
                      )}
                    </ul>
                  </div>
                ))}

                {canManage && (
                  <div className="grid gap-3 rounded-lg border border-dashed p-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Nova área</p>
                      <Input
                        placeholder="Nome da área"
                        value={areaName}
                        onChange={(e) => setAreaName(e.target.value)}
                      />
                      <Input
                        placeholder="Código (opc.)"
                        value={areaCode}
                        onChange={(e) => setAreaCode(e.target.value)}
                      />
                      <Button size="sm" onClick={addArea}>
                        Adicionar área
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Novo objectivo</p>
                      <Select
                        value={objectiveAreaId}
                        onValueChange={setObjectiveAreaId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Área" />
                        </SelectTrigger>
                        <SelectContent>
                          {(selectedPlan.areas || []).map((a) => (
                            <SelectItem key={a.id} value={a.id}>
                              {a.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Título do objectivo"
                        value={objectiveTitle}
                        onChange={(e) => setObjectiveTitle(e.target.value)}
                      />
                      <Button size="sm" onClick={addObjective}>
                        Adicionar objectivo
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
        </>
      )}
    </div>
  );
}

const NEE_MANAGE_ROLES = [
  "ADMIN",
  "DIRECAO",
  "COORDENACAO",
  "PROFESSOR",
];

const PEI_STATUS_OPTIONS: Array<{ value: PeiStatus; label: string }> = [
  { value: "RASCUNHO", label: "Rascunho" },
  { value: "ACTIVO", label: "Activo" },
  { value: "EM_REVISAO", label: "Em revisão" },
  { value: "CONCLUIDO", label: "Concluído" },
  { value: "ARQUIVADO", label: "Arquivado" },
];

function peiStatusLabel(status: PeiStatus | string): string {
  return PEI_STATUS_OPTIONS.find((o) => o.value === status)?.label || status;
}

function peiStatusBadgeVariant(
  status: PeiStatus | string,
): "default" | "secondary" | "outline" | "destructive" {
  if (status === "ACTIVO") return "default";
  if (status === "EM_REVISAO") return "secondary";
  if (status === "ARQUIVADO" || status === "CONCLUIDO") return "outline";
  return "secondary";
}

type PeiFormState = {
  studentId: string;
  academicYearId: string;
  status: PeiStatus;
  title: string;
  objectives: string;
  strategies: string;
  supports: string;
  guardianSummary: string;
  responsibleTeacher: string;
  coordinatorNotes: string;
  reviewDate: string;
};

function emptyPeiForm(): PeiFormState {
  return {
    studentId: "",
    academicYearId: "",
    status: "RASCUNHO",
    title: "",
    objectives: "",
    strategies: "",
    supports: "",
    guardianSummary: "",
    responsibleTeacher: "",
    coordinatorNotes: "",
    reviewDate: "",
  };
}

function NeeAdmin({
  needsLogin,
  userRole,
  onLogin,
}: {
  needsLogin: boolean;
  userRole: string;
  onLogin: () => void;
}) {
  const canManage = NEE_MANAGE_ROLES.includes(userRole);
  const [units, setUnits] = useState<Unit[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [plans, setPlans] = useState<PeiPlan[]>([]);
  const [profiles, setProfiles] = useState<NeeProfile[]>([]);
  const [unitFilter, setUnitFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [form, setForm] = useState<PeiFormState>(emptyPeiForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PeiPlan | null>(null);
  const [reviewDate, setReviewDate] = useState(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [reviewNotes, setReviewNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadLists = () => {
    setLoading(true);
    setMessage("");
    const planParams: {
      unitId?: string;
      status?: PeiStatus;
      neeOnly?: boolean;
    } = {};
    if (unitFilter !== "all") planParams.unitId = unitFilter;
    if (statusFilter !== "all") planParams.status = statusFilter as PeiStatus;

    Promise.all([
      api.getPeiPlans(planParams),
      api.getNeeProfiles({
        unitId: unitFilter !== "all" ? unitFilter : undefined,
        activeOnly: true,
      }),
      api.getStudents(),
      api.getUnits(),
      api.getAcademicYears(),
    ])
      .then(([planList, profileList, studentList, unitList, yearList]) => {
        setPlans(planList);
        setProfiles(profileList);
        setStudents(studentList);
        setUnits(unitList);
        setYears(yearList);
        if (!form.academicYearId) {
          const active = yearList.find((y) => y.active) || yearList[0];
          if (active) {
            setForm((f) => ({ ...f, academicYearId: active.id }));
          }
        }
      })
      .catch((err) =>
        setMessage(
          err instanceof Error
            ? err.message
            : "Não foi possível carregar os dados NEE/PEI.",
        ),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (needsLogin) return;
    loadLists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsLogin, unitFilter, statusFilter]);

  if (needsLogin) {
    return (
      <Card>
        <CardContent className="space-y-4 p-8">
          <h1 className="text-2xl font-bold">NEE / PEI</h1>
          <p className="text-muted-foreground">
            Inicie sessão para gerir Necessidades Educativas Especiais e Planos
            Educativos Individuais.
          </p>
          <Button onClick={onLogin}>Entrar</Button>
        </CardContent>
      </Card>
    );
  }

  const resetForm = () => {
    const active = years.find((y) => y.active) || years[0];
    setForm({
      ...emptyPeiForm(),
      academicYearId: active?.id || "",
    });
    setEditingId(null);
  };

  const startEdit = (plan: PeiPlan) => {
    setEditingId(plan.id);
    setSelectedPlan(plan);
    setForm({
      studentId: plan.studentId,
      academicYearId: plan.academicYearId || "",
      status: plan.status,
      title: plan.title || "",
      objectives: plan.objectives,
      strategies: plan.strategies || "",
      supports: plan.supports || "",
      guardianSummary: plan.guardianSummary || "",
      responsibleTeacher: plan.responsibleTeacher || "",
      coordinatorNotes: plan.coordinatorNotes || "",
      reviewDate: plan.reviewDate ? plan.reviewDate.slice(0, 10) : "",
    });
    setMessage("");
  };

  const submitPlan = async () => {
    if (!form.studentId || !form.objectives.trim()) {
      setMessage("Seleccione o aluno e indique os objectivos do PEI.");
      return;
    }
    setSaving(true);
    setMessage("");
    const payload: PeiPlanPayload = {
      studentId: form.studentId,
      academicYearId: form.academicYearId || null,
      status: form.status,
      title: form.title.trim() || null,
      objectives: form.objectives.trim(),
      strategies: form.strategies.trim() || null,
      supports: form.supports.trim() || null,
      guardianSummary: form.guardianSummary.trim() || null,
      responsibleTeacher: form.responsibleTeacher.trim() || null,
      coordinatorNotes: form.coordinatorNotes.trim() || null,
      reviewDate: form.reviewDate || null,
    };
    try {
      const saved = editingId
        ? await api.updatePeiPlan(editingId, payload)
        : await api.createPeiPlan(payload);
      setMessage(
        editingId
          ? "PEI actualizado com sucesso."
          : "PEI criado e aluno marcado como NEE.",
      );
      setEditingId(saved.id);
      setSelectedPlan(saved);
      loadLists();
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Não foi possível guardar o PEI.",
      );
    } finally {
      setSaving(false);
    }
  };

  const removePlan = async (id: string) => {
    if (!confirm("Eliminar este PEI?")) return;
    setSaving(true);
    try {
      await api.deletePeiPlan(id);
      if (editingId === id) resetForm();
      if (selectedPlan?.id === id) setSelectedPlan(null);
      setMessage("PEI eliminado.");
      loadLists();
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Não foi possível eliminar.",
      );
    } finally {
      setSaving(false);
    }
  };

  const markNee = async (studentId: string) => {
    setSaving(true);
    try {
      await api.upsertNeeProfile({
        studentId,
        active: true,
        identifiedAt: format(new Date(), "yyyy-MM-dd"),
      });
      setMessage("Aluno marcado com Necessidades Educativas Especiais.");
      loadLists();
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : "Não foi possível marcar o aluno como NEE.",
      );
    } finally {
      setSaving(false);
    }
  };

  const addReview = async () => {
    if (!selectedPlan || !reviewNotes.trim()) {
      setMessage("Indique as notas do acompanhamento.");
      return;
    }
    setSaving(true);
    try {
      const updated = await api.addPeiReview(selectedPlan.id, {
        date: reviewDate,
        notes: reviewNotes.trim(),
      });
      setSelectedPlan(updated);
      setReviewNotes("");
      setMessage("Acompanhamento registado.");
      loadLists();
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : "Não foi possível registar o acompanhamento.",
      );
    } finally {
      setSaving(false);
    }
  };

  const removeReview = async (id: string) => {
    if (!confirm("Eliminar este registo de acompanhamento?")) return;
    setSaving(true);
    try {
      await api.deletePeiReview(id);
      if (selectedPlan) {
        const refreshed = await api.getPeiPlan(selectedPlan.id);
        setSelectedPlan(refreshed);
      }
      setMessage("Registo eliminado.");
      loadLists();
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Não foi possível eliminar.",
      );
    } finally {
      setSaving(false);
    }
  };

  const studentsWithoutNee = students.filter(
    (s) => !profiles.some((p) => p.studentId === s.id && p.active),
  );

  return (
    <div>
      <div className="mb-7">
        <p className="mb-2 text-sm font-medium text-secondary">NEE / PEI</p>
        <h1 className="text-3xl font-bold">Necessidades Educativas Especiais</h1>
        <p className="mt-2 text-muted-foreground">
          Identifique alunos com NEE, elabore o Plano Educativo Individual e
          registe o acompanhamento. Os encarregados consultam um resumo no
          portal.
        </p>
      </div>

      <Card className="mb-6">
        <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-end">
          <div className="lg:w-72">
            <Field label="Unidade">
              <Select value={unitFilter} onValueChange={setUnitFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as unidades</SelectItem>
                  {units.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="lg:w-56">
            <Field label="Estado do PEI">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {PEI_STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Button variant="outline" onClick={loadLists} disabled={loading}>
            Actualizar
          </Button>
        </CardContent>
      </Card>

      {message && (
        <p className="mb-4 text-sm text-muted-foreground">{message}</p>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {editingId ? "Editar PEI" : "Novo PEI"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!canManage ? (
              <p className="text-sm text-muted-foreground">
                O seu perfil tem acesso de consulta.
              </p>
            ) : (
              <>
                <Field label="Aluno">
                  <Select
                    value={form.studentId}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, studentId: v }))
                    }
                    disabled={!!editingId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar aluno" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.childFullName}
                          {s.unit?.name ? ` · ${s.unit.name}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Ano lectivo">
                    <Select
                      value={form.academicYearId}
                      onValueChange={(v) =>
                        setForm((f) => ({ ...f, academicYearId: v }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Ano lectivo" />
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
                  <Field label="Estado">
                    <Select
                      value={form.status}
                      onValueChange={(v) =>
                        setForm((f) => ({
                          ...f,
                          status: v as PeiStatus,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PEI_STATUS_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
                <Field label="Título (opcional)">
                  <Input
                    value={form.title}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, title: e.target.value }))
                    }
                    placeholder="Ex.: PEI 2026/2027"
                  />
                </Field>
                <Field label="Objectivos">
                  <Textarea
                    value={form.objectives}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, objectives: e.target.value }))
                    }
                    rows={3}
                  />
                </Field>
                <Field label="Estratégias">
                  <Textarea
                    value={form.strategies}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, strategies: e.target.value }))
                    }
                    rows={2}
                  />
                </Field>
                <Field label="Apoios / adaptações">
                  <Textarea
                    value={form.supports}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, supports: e.target.value }))
                    }
                    rows={2}
                  />
                </Field>
                <Field label="Resumo para o encarregado (opcional)">
                  <Textarea
                    value={form.guardianSummary}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        guardianSummary: e.target.value,
                      }))
                    }
                    rows={2}
                    placeholder="Se vazio, o portal mostra os objectivos."
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Educador(a) responsável">
                    <Input
                      value={form.responsibleTeacher}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          responsibleTeacher: e.target.value,
                        }))
                      }
                    />
                  </Field>
                  <Field label="Data de revisão">
                    <Input
                      type="date"
                      value={form.reviewDate}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          reviewDate: e.target.value,
                        }))
                      }
                    />
                  </Field>
                </div>
                <Field label="Notas da coordenação (apenas staff)">
                  <Textarea
                    value={form.coordinatorNotes}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        coordinatorNotes: e.target.value,
                      }))
                    }
                    rows={2}
                  />
                </Field>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={submitPlan} disabled={saving}>
                    {editingId ? "Actualizar PEI" : "Criar PEI"}
                  </Button>
                  {editingId && (
                    <Button variant="outline" onClick={resetForm}>
                      Novo
                    </Button>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Planos PEI ({plans.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">A carregar…</p>
              ) : plans.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Ainda não há planos PEI com estes filtros.
                </p>
              ) : (
                <div className="divide-y rounded-lg border">
                  {plans.map((plan) => (
                    <div
                      key={plan.id}
                      className="flex flex-wrap items-start justify-between gap-3 px-4 py-3"
                    >
                      <button
                        type="button"
                        className="min-w-0 flex-1 text-left"
                        onClick={() => startEdit(plan)}
                      >
                        <p className="font-medium">
                          {plan.student?.childFullName || "Aluno"}
                          {plan.title ? ` · ${plan.title}` : ""}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {plan.student?.unit?.name || "—"}
                          {plan.academicYear?.label
                            ? ` · ${plan.academicYear.label}`
                            : ""}
                          {plan.reviewDate
                            ? ` · Revisão ${formatAcademicoDate(plan.reviewDate)}`
                            : ""}
                        </p>
                      </button>
                      <div className="flex items-center gap-2">
                        <Badge variant={peiStatusBadgeVariant(plan.status)}>
                          {peiStatusLabel(plan.status)}
                        </Badge>
                        {canManage && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removePlan(plan.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Alunos com NEE ({profiles.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {profiles.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum aluno marcado como NEE. Ao criar um PEI o perfil é
                  criado automaticamente.
                </p>
              ) : (
                <div className="divide-y rounded-lg border">
                  {profiles.map((p) => (
                    <div
                      key={p.id}
                      className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm"
                    >
                      <div>
                        <p className="font-medium">
                          {p.student?.childFullName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {p.student?.unit?.name || "—"}
                          {p._count
                            ? ` · ${p._count.peiPlans} PEI(s)`
                            : ""}
                        </p>
                      </div>
                      <Badge variant={p.active ? "default" : "outline"}>
                        {p.active ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
              {canManage && studentsWithoutNee.length > 0 && (
                <Field label="Marcar aluno como NEE (sem PEI)">
                  <Select
                    onValueChange={(id) => {
                      if (id) void markNee(id);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar aluno" />
                    </SelectTrigger>
                    <SelectContent>
                      {studentsWithoutNee.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.childFullName}
                          {s.unit?.name ? ` · ${s.unit.name}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {selectedPlan && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">
              Acompanhamento — {selectedPlan.student?.childFullName}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedPlan.coordinatorNotes && (
              <p className="rounded-lg border bg-slate-50 p-3 text-sm">
                <span className="font-medium">Notas internas: </span>
                {selectedPlan.coordinatorNotes}
              </p>
            )}
            {canManage && (
              <div className="grid gap-3 sm:grid-cols-[10rem_1fr_auto]">
                <Input
                  type="date"
                  value={reviewDate}
                  onChange={(e) => setReviewDate(e.target.value)}
                />
                <Input
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Notas do acompanhamento / intervenção"
                />
                <Button onClick={addReview} disabled={saving}>
                  Registar
                </Button>
              </div>
            )}
            {(selectedPlan.reviews || []).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Ainda não há registos de acompanhamento.
              </p>
            ) : (
              <div className="divide-y rounded-lg border">
                {(selectedPlan.reviews || []).map((review) => (
                  <div
                    key={review.id}
                    className="flex flex-wrap items-start justify-between gap-3 px-4 py-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">
                        {formatAcademicoDate(review.date)}
                        {review.author?.name
                          ? ` · ${review.author.name}`
                          : ""}
                      </p>
                      <p className="mt-1 whitespace-pre-line text-muted-foreground">
                        {review.notes}
                      </p>
                    </div>
                    {canManage && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeReview(review.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
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

const ACADEMICO_MANAGE_ROLES = [
  "ADMIN",
  "DIRECAO",
  "COORDENACAO",
  "PROFESSOR",
];

type AcademicoTab =
  | "sumarios"
  | "avaliacoes"
  | "horarios"
  | "periodos"
  | "boletins"
  | "monitorizacao"
  | "sinteses"
  | "substituicoes"
  | "nle"
  | "comportamento"
  | "habilitacoes";

const ACADEMICO_TABS: Array<{ value: AcademicoTab; label: string }> = [
  { value: "sumarios", label: "Sumários" },
  { value: "avaliacoes", label: "Avaliações" },
  { value: "horarios", label: "Horários" },
  { value: "periodos", label: "Períodos" },
  { value: "boletins", label: "Boletins" },
  { value: "monitorizacao", label: "Monitorização" },
  { value: "sinteses", label: "Sínteses" },
  { value: "substituicoes", label: "Substituições" },
  { value: "nle", label: "Actividades NLE" },
  { value: "comportamento", label: "Comportamento" },
  { value: "habilitacoes", label: "Habilitações" },
];

const WEEKDAYS: Array<{ value: number; label: string; short: string }> = [
  { value: 1, label: "Segunda-feira", short: "Seg" },
  { value: 2, label: "Terça-feira", short: "Ter" },
  { value: 3, label: "Quarta-feira", short: "Qua" },
  { value: 4, label: "Quinta-feira", short: "Qui" },
  { value: 5, label: "Sexta-feira", short: "Sex" },
  { value: 6, label: "Sábado", short: "Sáb" },
  { value: 7, label: "Domingo", short: "Dom" },
];

function weekdayLabel(weekday: number): string {
  return WEEKDAYS.find((d) => d.value === weekday)?.label || "—";
}

function formatAcademicoDate(value: string): string {
  try {
    return format(
      parseISO(value.length === 10 ? `${value}T12:00:00` : value),
      "dd/MM/yyyy",
      { locale: pt },
    );
  } catch {
    return value.slice(0, 10);
  }
}

function assessmentGradeDisplay(item: Assessment): string {
  if (item.gradeType === "NUMERICA") {
    return item.gradeValue != null ? String(item.gradeValue) : "—";
  }
  return item.gradeLabel || "—";
}

function AcademicoAdmin({
  needsLogin,
  userRole,
  onLogin,
}: {
  needsLogin: boolean;
  userRole: string;
  onLogin: () => void;
}) {
  const canManage = ACADEMICO_MANAGE_ROLES.includes(userRole);
  const [turmas, setTurmas] = useState<AttendanceTurma[]>([]);
  const [selectedTurmaId, setSelectedTurmaId] = useState("");
  const [tab, setTab] = useState<AcademicoTab>("sumarios");

  useEffect(() => {
    if (needsLogin) return;
    api
      .getAcademicoTurmas()
      .then((list) => {
        setTurmas(list);
        setSelectedTurmaId((current) => current || list[0]?.id || "");
      })
      .catch(() => setTurmas([]));
  }, [needsLogin]);

  if (needsLogin) {
    return (
      <Card>
        <CardContent className="space-y-4 p-8">
          <h1 className="text-2xl font-bold">Académico</h1>
          <p className="text-muted-foreground">
            Inicie sessão para gerir sumários, avaliações e horários das turmas.
          </p>
          <Button onClick={onLogin}>Entrar</Button>
        </CardContent>
      </Card>
    );
  }

  const selectedTurma = turmas.find((t) => t.id === selectedTurmaId);

  return (
    <div>
      <div className="mb-7">
        <p className="mb-2 text-sm font-medium text-secondary">ACADÉMICO</p>
        <h1 className="text-3xl font-bold">Académico</h1>
        <p className="mt-2 text-muted-foreground">
          Registe sumários, avaliações, horários, períodos, boletins, sínteses,
          substituições, actividades não lectivas, comportamento e habilitações.
          Os encarregados consultam os dados partilhados no portal.
        </p>
      </div>

      <Card className="mb-6">
        <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-end">
          <div className="lg:w-96">
            <Field label="Turma">
              <Select value={selectedTurmaId} onValueChange={setSelectedTurmaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar turma" />
                </SelectTrigger>
                <SelectContent>
                  {turmas.map((turma) => (
                    <SelectItem key={turma.id} value={turma.id}>
                      {turma.name} · {turma.room.name} · {turma.room.unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          {selectedTurma && (
            <div className="rounded-lg border bg-slate-50 p-3 text-sm text-muted-foreground">
              <p>
                {selectedTurma.room.service.name} ·{" "}
                {selectedTurma.academicYear.label}
                {selectedTurma.teacherName
                  ? ` · Educador(a): ${selectedTurma.teacherName}`
                  : ""}
              </p>
              <p>{selectedTurma.studentCount} aluno(s) na turma</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mb-6 flex flex-wrap gap-2">
        {ACADEMICO_TABS.filter((t) => {
          if (t.value === "monitorizacao") {
            return ["ADMIN", "DIRECAO", "COORDENACAO"].includes(userRole);
          }
          return true;
        }).map((t) => (
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

      {!selectedTurmaId &&
      tab !== "sinteses" &&
      tab !== "substituicoes" &&
      tab !== "nle" &&
      tab !== "comportamento" &&
      tab !== "habilitacoes" &&
      tab !== "periodos" &&
      tab !== "boletins" &&
      tab !== "monitorizacao" ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Seleccione uma turma para começar.
          </CardContent>
        </Card>
      ) : tab === "sumarios" ? (
        <SumariosTab
          key={`sum-${selectedTurmaId}`}
          classGroupId={selectedTurmaId}
          canManage={canManage}
        />
      ) : tab === "avaliacoes" ? (
        <AvaliacoesTab
          key={`ava-${selectedTurmaId}`}
          classGroupId={selectedTurmaId}
          canManage={canManage}
        />
      ) : tab === "horarios" ? (
        <HorariosTab
          key={`hor-${selectedTurmaId}`}
          classGroupId={selectedTurmaId}
          canManage={canManage}
        />
      ) : tab === "periodos" ? (
        <PeriodosTab canManage={canManage} />
      ) : tab === "boletins" ? (
        <BoletinsTab
          canManage={canManage}
          turmas={turmas}
          selectedTurmaId={selectedTurmaId}
        />
      ) : tab === "monitorizacao" ? (
        <MonitorizacaoAcademicaTab userRole={userRole} />
      ) : tab === "sinteses" ? (
        <SintesesTab canManage={canManage} />
      ) : tab === "substituicoes" ? (
        <SubstituicoesTab
          canManage={["ADMIN", "DIRECAO", "COORDENACAO"].includes(userRole)}
          turmas={turmas}
          selectedTurmaId={selectedTurmaId}
        />
      ) : tab === "nle" ? (
        <NleTab
          canManage={canManage}
          turmas={turmas}
          selectedTurmaId={selectedTurmaId}
        />
      ) : tab === "comportamento" ? (
        <ComportamentoTab canManage={canManage} />
      ) : (
        <HabilitacoesTab canManage={canManage} />
      )}
    </div>
  );
}

type SumarioForm = {
  date: string;
  subject: string;
  topic: string;
  description: string;
  homework: string;
};

function PeriodosTab({ canManage }: { canManage: boolean }) {
  const [items, setItems] = useState<AssessmentPeriod[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [form, setForm] = useState({
    name: "",
    academicYearId: "",
    unitId: "",
    startDate: format(new Date(), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
    sortOrder: "0",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadList = () => {
    setLoading(true);
    api
      .getAssessmentPeriods()
      .then(setItems)
      .catch((err) =>
        setMessage(
          err instanceof Error
            ? err.message
            : "Não foi possível carregar os períodos.",
        ),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadList();
    api.getAcademicYears().then(setYears).catch(() => setYears([]));
    api.getUnits().then(setUnits).catch(() => setUnits([]));
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setForm({
      name: "",
      academicYearId: years.find((y) => y.active)?.id || years[0]?.id || "",
      unitId: "",
      startDate: format(new Date(), "yyyy-MM-dd"),
      endDate: format(new Date(), "yyyy-MM-dd"),
      sortOrder: "0",
    });
  };

  useEffect(() => {
    if (!form.academicYearId && years.length) {
      setForm((f) => ({
        ...f,
        academicYearId: years.find((y) => y.active)?.id || years[0].id,
      }));
    }
  }, [years, form.academicYearId]);

  const startEdit = (item: AssessmentPeriod) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      academicYearId: item.academicYearId,
      unitId: item.unitId ?? "",
      startDate: item.startDate.slice(0, 10),
      endDate: item.endDate.slice(0, 10),
      sortOrder: String(item.sortOrder ?? 0),
    });
    setMessage("");
  };

  const submit = async () => {
    if (!form.name.trim() || !form.academicYearId) {
      setMessage("Indique o nome e o ano lectivo.");
      return;
    }
    const payload: AssessmentPeriodPayload = {
      name: form.name.trim(),
      academicYearId: form.academicYearId,
      unitId: form.unitId || null,
      startDate: form.startDate,
      endDate: form.endDate,
      sortOrder: Number(form.sortOrder) || 0,
    };
    setSaving(true);
    setMessage("");
    try {
      if (editingId) {
        await api.updateAssessmentPeriod(editingId, payload);
        setMessage("Período actualizado.");
      } else {
        await api.createAssessmentPeriod(payload);
        setMessage("Período criado.");
      }
      resetForm();
      loadList();
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : "Não foi possível guardar o período.",
      );
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item: AssessmentPeriod) => {
    if (!window.confirm(`Remover o período «${item.name}»?`)) return;
    try {
      await api.deleteAssessmentPeriod(item.id);
      if (editingId === item.id) resetForm();
      loadList();
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Não foi possível remover.",
      );
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {canManage && (
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">
              {editingId ? "Editar período" : "Novo período"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Nome">
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="1.º Trimestre"
              />
            </Field>
            <Field label="Ano lectivo">
              <Select
                value={form.academicYearId}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, academicYearId: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar ano" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y.id} value={y.id}>
                      {y.label}
                      {y.active ? " (activo)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Unidade (opcional)">
              <Select
                value={form.unitId || "all"}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, unitId: v === "all" ? "" : v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as unidades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as unidades</SelectItem>
                  {units.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Início">
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, startDate: e.target.value }))
                  }
                />
              </Field>
              <Field label="Fim">
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, endDate: e.target.value }))
                  }
                />
              </Field>
            </div>
            <Field label="Ordem">
              <Input
                type="number"
                value={form.sortOrder}
                onChange={(e) =>
                  setForm((f) => ({ ...f, sortOrder: e.target.value }))
                }
              />
            </Field>
            {message && (
              <p className="text-sm text-muted-foreground">{message}</p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button onClick={submit} disabled={saving}>
                {saving ? "A guardar…" : editingId ? "Guardar" : "Criar"}
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
          <CardTitle className="text-lg">Períodos de avaliação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">A carregar…</p>
          ) : items.length === 0 ? (
            <p className="rounded-lg border p-5 text-sm text-muted-foreground">
              Ainda não existem períodos definidos.
            </p>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-lg border p-4"
              >
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.academicYear?.label || "—"}
                    {item.unit ? ` · ${item.unit.name}` : " · Toda a escola"}
                    {" · "}
                    {formatAcademicoDate(item.startDate)} –{" "}
                    {formatAcademicoDate(item.endDate)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item._count?.assessments ?? 0} avaliação(ões) ·{" "}
                    {item._count?.reportCards ?? 0} boletim(ns)
                  </p>
                </div>
                {canManage && (
                  <div className="flex flex-wrap gap-2">
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
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function BoletinsTab({
  canManage,
  turmas,
  selectedTurmaId,
}: {
  canManage: boolean;
  turmas: AttendanceTurma[];
  selectedTurmaId: string;
}) {
  const [periods, setPeriods] = useState<AssessmentPeriod[]>([]);
  const [periodId, setPeriodId] = useState("");
  const [classGroupId, setClassGroupId] = useState(selectedTurmaId);
  const [items, setItems] = useState<ReportCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [editCommentId, setEditCommentId] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState("");
  const [sendEmailOnPublish, setSendEmailOnPublish] = useState(true);
  const [pdfBusyId, setPdfBusyId] = useState<string | null>(null);

  useEffect(() => {
    setClassGroupId(selectedTurmaId);
  }, [selectedTurmaId]);

  useEffect(() => {
    api
      .getAssessmentPeriods()
      .then((list) => {
        setPeriods(list);
        setPeriodId((current) => current || list[0]?.id || "");
      })
      .catch(() => setPeriods([]));
  }, []);

  const loadList = () => {
    if (!periodId && !classGroupId) return;
    setLoading(true);
    api
      .getReportCards({
        periodId: periodId || undefined,
        classGroupId: classGroupId || undefined,
      })
      .then(setItems)
      .catch((err) =>
        setMessage(
          err instanceof Error
            ? err.message
            : "Não foi possível carregar os boletins.",
        ),
      )
      .finally(() => setLoading(false));
  };

  useEffect(loadList, [periodId, classGroupId]);

  const generate = async (overwriteDraft = false) => {
    if (!periodId || !classGroupId) {
      setMessage("Seleccione o período e a turma.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const result = await api.generateReportCards({
        periodId,
        classGroupId,
        overwriteDraft,
      });
      setMessage(
        `Geração: ${result.created} criado(s), ${result.updated} actualizado(s), ${result.skipped} ignorado(s).`,
      );
      setItems(result.cards);
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : "Não foi possível gerar os boletins.",
      );
    } finally {
      setBusy(false);
    }
  };

  const togglePublish = async (item: ReportCard) => {
    try {
      if (item.status === "PUBLICADO") {
        await api.unpublishReportCard(item.id);
        setMessage("Boletim reposto a rascunho.");
      } else {
        await api.publishReportCard(item.id, {
          sendEmail: sendEmailOnPublish,
        });
        setMessage(
          sendEmailOnPublish
            ? "Boletim publicado (com envio de email ao encarregado)."
            : "Boletim publicado.",
        );
      }
      loadList();
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Não foi possível actualizar.",
      );
    }
  };

  const exportPdf = async (item: ReportCard) => {
    setPdfBusyId(item.id);
    setMessage("");
    try {
      await api.downloadReportCardPdf(item.id);
      setMessage("PDF transferido com sucesso.");
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : "Não foi possível exportar o PDF.",
      );
    } finally {
      setPdfBusyId(null);
    }
  };

  const saveComment = async (id: string) => {
    try {
      await api.updateReportCard(id, {
        overallComment: commentDraft.trim() || null,
      });
      setEditCommentId(null);
      loadList();
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : "Não foi possível guardar o comentário.",
      );
    }
  };

  const remove = async (item: ReportCard) => {
    if (
      !window.confirm(
        `Remover o boletim de ${item.student?.childFullName || "aluno"}?`,
      )
    ) {
      return;
    }
    try {
      await api.deleteReportCard(item.id);
      loadList();
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Não foi possível remover.",
      );
    }
  };

  const lineGrade = (line: NonNullable<ReportCard["lines"]>[number]) => {
    if (line.gradeType === "NUMERICA") {
      return line.gradeValue != null ? String(line.gradeValue) : "—";
    }
    return line.gradeLabel || (line.sourceType === "SINTESE" ? "Síntese" : "—");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-end">
          <div className="lg:w-72">
            <Field label="Período">
              <Select value={periodId} onValueChange={setPeriodId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar período" />
                </SelectTrigger>
                <SelectContent>
                  {periods.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} · {p.academicYear?.label || "—"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="lg:w-96">
            <Field label="Turma">
              <Select value={classGroupId} onValueChange={setClassGroupId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar turma" />
                </SelectTrigger>
                <SelectContent>
                  {turmas.map((turma) => (
                    <SelectItem key={turma.id} value={turma.id}>
                      {turma.name} · {turma.room.unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          {canManage && (
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => generate(false)} disabled={busy}>
                  {busy ? "A gerar…" : "Gerar boletins"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => generate(true)}
                  disabled={busy}
                >
                  Regenerar rascunhos
                </Button>
              </div>
              <div className="flex items-center gap-3 rounded-lg border px-3 py-2">
                <div>
                  <p className="text-sm font-medium">Enviar também por email</p>
                  <p className="text-xs text-muted-foreground">
                    Ao publicar, notifica o encarregado com o PDF.
                  </p>
                </div>
                <Switch
                  checked={sendEmailOnPublish}
                  onCheckedChange={setSendEmailOnPublish}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {message && (
        <p className="text-sm text-muted-foreground">{message}</p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Boletins</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">A carregar…</p>
          ) : items.length === 0 ? (
            <p className="rounded-lg border p-5 text-sm text-muted-foreground">
              Ainda não há boletins para estes filtros. Gere a partir das
              avaliações e sínteses do período.
            </p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="space-y-3 rounded-lg border p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">
                      {item.student?.childFullName || "Aluno"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.period?.name || "—"} ·{" "}
                      {item.classGroup?.name || "—"}
                      {item.publishedAt
                        ? ` · ${formatAcademicoDate(item.publishedAt)}`
                        : ""}
                    </p>
                  </div>
                  <Badge
                    variant={
                      item.status === "PUBLICADO" ? "default" : "secondary"
                    }
                  >
                    {item.status === "PUBLICADO" ? "Publicado" : "Rascunho"}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {(item.lines ?? []).map((line) => (
                    <div
                      key={line.id}
                      className="flex flex-wrap items-start justify-between gap-2 rounded border p-2 text-sm"
                    >
                      <div>
                        <p className="font-medium">
                          {line.subject} — {line.title}
                        </p>
                        {line.comment && (
                          <p className="mt-1 whitespace-pre-line text-muted-foreground">
                            {line.comment.length > 180
                              ? `${line.comment.slice(0, 180)}…`
                              : line.comment}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline">{lineGrade(line)}</Badge>
                    </div>
                  ))}
                </div>
                {editCommentId === item.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={commentDraft}
                      onChange={(e) => setCommentDraft(e.target.value)}
                      rows={3}
                      placeholder="Comentário geral do boletim"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => saveComment(item.id)}>
                        Guardar comentário
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditCommentId(null)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : item.overallComment ? (
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">
                      Comentário:{" "}
                    </span>
                    {item.overallComment}
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportPdf(item)}
                    disabled={pdfBusyId === item.id}
                  >
                    <Download className="mr-1 h-3.5 w-3.5" />
                    {pdfBusyId === item.id ? "A exportar…" : "Exportar PDF"}
                  </Button>
                  {canManage && (
                    <>
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
                        onClick={() => {
                          setEditCommentId(item.id);
                          setCommentDraft(item.overallComment ?? "");
                        }}
                      >
                        Comentário
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(item)}
                      >
                        <Trash2 className="mr-1 h-3.5 w-3.5" />
                        Remover
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MonitorizacaoAcademicaTab({ userRole }: { userRole: string }) {
  const canAccess = ["ADMIN", "DIRECAO", "COORDENACAO"].includes(userRole);
  const [unitId, setUnitId] = useState("all");
  const [yearId, setYearId] = useState("");
  const [data, setData] = useState<DashboardAcademico | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!canAccess) return;
    let active = true;
    setLoading(true);
    setError("");
    api
      .getDashboardAcademico({
        unitId,
        academicYearId: yearId || undefined,
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
  }, [canAccess, unitId, yearId]);

  if (!canAccess) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Sem permissão. Reservado à administração, direcção e coordenação.
        </CardContent>
      </Card>
    );
  }

  const kpis = data?.kpis;
  const byUnit = data?.porUnidade ?? [];
  const byTurma = data?.porTurma ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4">
        <div className="w-56">
          <Field label="Unidade">
            <Select value={unitId} onValueChange={setUnitId}>
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
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
            <Select value={yearId || "none"} onValueChange={(v) => setYearId(v === "none" ? "" : v)}>
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
      </div>

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </div>
      )}
      {loading && !data && (
        <p className="text-muted-foreground">A carregar monitorização…</p>
      )}

      {data && kpis && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ExecKpiCard
              label="Alunos"
              value={String(kpis.alunos)}
              hint={`${kpis.turmas} turma(s)`}
              icon={GraduationCap}
            />
            <ExecKpiCard
              label="Assiduidade"
              value={
                kpis.taxaAssiduidade != null
                  ? `${kpis.taxaAssiduidade}%`
                  : "—"
              }
              icon={Activity}
            />
            <ExecKpiCard
              label="Cobertura de avaliações"
              value={
                kpis.coberturaAvaliacoes != null
                  ? `${kpis.coberturaAvaliacoes}%`
                  : "—"
              }
              hint={`${kpis.sumariosRegistados} sumário(s)`}
              icon={TrendingUp}
            />
            <ExecKpiCard
              label="NEE / PEI / Incidentes"
              value={`${kpis.neeActivos} / ${kpis.peiAbertos} / ${kpis.incidentesComportamento}`}
              hint="NEE activos · PEI abertos · incidentes"
              icon={Users}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Por unidade</CardTitle>
              </CardHeader>
              <CardContent>
                {byUnit.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem dados.</p>
                ) : (
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={byUnit}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="unit" fontSize={12} />
                        <YAxis fontSize={12} domain={[0, 100]} />
                        <RechartsTooltip />
                        <Legend />
                        <Bar
                          dataKey="attendanceRate"
                          name="Assiduidade %"
                          fill="#0d9488"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="assessmentCoverage"
                          name="Avaliações %"
                          fill="#0369a1"
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
                <CardTitle className="text-base">Turmas</CardTitle>
              </CardHeader>
              <CardContent className="max-h-[320px] space-y-2 overflow-y-auto">
                {byTurma.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem turmas.</p>
                ) : (
                  byTurma.map((row) => (
                    <div
                      key={row.classGroupId}
                      className="rounded-lg border p-3 text-sm"
                    >
                      <p className="font-medium">
                        {row.name} · {row.unit}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {row.service} · {row.studentCount} aluno(s)
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Assiduidade:{" "}
                        {row.attendanceRate != null
                          ? `${row.attendanceRate}%`
                          : "—"}
                        {" · "}
                        Avaliações:{" "}
                        {row.assessmentCoverage != null
                          ? `${row.assessmentCoverage}%`
                          : "—"}
                        {" · "}
                        Sumários: {row.lessonSummaries}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function emptySumarioForm(): SumarioForm {
  return {
    date: format(new Date(), "yyyy-MM-dd"),
    subject: "",
    topic: "",
    description: "",
    homework: "",
  };
}

function SumariosTab({
  classGroupId,
  canManage,
}: {
  classGroupId: string;
  canManage: boolean;
}) {
  const [items, setItems] = useState<LessonSummary[]>([]);
  const [form, setForm] = useState<SumarioForm>(emptySumarioForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadList = () => {
    setLoading(true);
    api
      .getLessonSummaries(classGroupId)
      .then(setItems)
      .catch((err) =>
        setMessage(
          err instanceof Error
            ? err.message
            : "Não foi possível carregar os sumários.",
        ),
      )
      .finally(() => setLoading(false));
  };

  useEffect(loadList, [classGroupId]);

  const resetForm = () => {
    setForm(emptySumarioForm());
    setEditingId(null);
  };

  const startEdit = (item: LessonSummary) => {
    setEditingId(item.id);
    setForm({
      date: item.date.slice(0, 10),
      subject: item.subject,
      topic: item.topic ?? "",
      description: item.description,
      homework: item.homework ?? "",
    });
    setMessage("");
  };

  const submit = async () => {
    if (!form.subject.trim() || !form.description.trim()) {
      setMessage("Indique a disciplina e a descrição do sumário.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      if (editingId) {
        await api.updateLessonSummary(editingId, {
          date: form.date,
          subject: form.subject.trim(),
          topic: form.topic.trim() || null,
          description: form.description.trim(),
          homework: form.homework.trim() || null,
        });
        setMessage("Sumário actualizado.");
      } else {
        const payload: LessonSummaryPayload = {
          classGroupId,
          date: form.date,
          subject: form.subject.trim(),
          topic: form.topic.trim() || null,
          description: form.description.trim(),
          homework: form.homework.trim() || null,
        };
        await api.createLessonSummary(payload);
        setMessage("Sumário registado.");
      }
      resetForm();
      loadList();
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : "Não foi possível guardar o sumário.",
      );
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item: LessonSummary) => {
    if (!window.confirm(`Remover o sumário de ${item.subject}?`)) return;
    try {
      await api.deleteLessonSummary(item.id);
      if (editingId === item.id) resetForm();
      loadList();
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Não foi possível remover.",
      );
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {canManage && (
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">
              {editingId ? "Editar sumário" : "Novo sumário"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Data">
              <Input
                type="date"
                value={form.date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, date: e.target.value }))
                }
              />
            </Field>
            <Field label="Disciplina">
              <Input
                value={form.subject}
                onChange={(e) =>
                  setForm((f) => ({ ...f, subject: e.target.value }))
                }
                placeholder="Ex.: Matemática"
              />
            </Field>
            <Field label="Tema (opcional)">
              <Input
                value={form.topic}
                onChange={(e) =>
                  setForm((f) => ({ ...f, topic: e.target.value }))
                }
                placeholder="Ex.: Números até 100"
              />
            </Field>
            <Field label="Descrição">
              <Textarea
                rows={5}
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="O que foi trabalhado na aula…"
              />
            </Field>
            <Field label="Trabalho de casa (opcional)">
              <Textarea
                rows={3}
                value={form.homework}
                onChange={(e) =>
                  setForm((f) => ({ ...f, homework: e.target.value }))
                }
                placeholder="Ex.: Ficha 3, exercícios 1 a 4"
              />
            </Field>
            {message && (
              <p className="text-sm text-muted-foreground">{message}</p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button onClick={submit} disabled={saving}>
                {saving ? "A guardar…" : editingId ? "Guardar" : "Registar"}
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
          <CardTitle className="text-lg">Sumários</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!canManage && message && (
            <p className="text-sm text-muted-foreground">{message}</p>
          )}
          {loading ? (
            <p className="text-sm text-muted-foreground">A carregar…</p>
          ) : items.length === 0 ? (
            <p className="rounded-lg border p-5 text-sm text-muted-foreground">
              Ainda não há sumários para esta turma.
            </p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="space-y-2 rounded-lg border p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">
                      {item.subject}
                      {item.topic ? ` — ${item.topic}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatAcademicoDate(item.date)}
                      {item.author ? ` · ${item.author.name}` : ""}
                    </p>
                  </div>
                  {canManage && (
                    <div className="flex flex-wrap gap-2">
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
                </div>
                <p className="whitespace-pre-line text-sm text-muted-foreground">
                  {item.description}
                </p>
                {item.homework && (
                  <p className="text-sm">
                    <span className="font-medium">Trabalho de casa: </span>
                    <span className="text-muted-foreground">
                      {item.homework}
                    </span>
                  </p>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

type AvaliacaoForm = {
  studentId: string;
  title: string;
  subject: string;
  date: string;
  gradeType: AssessmentGradeType;
  gradeValue: string;
  gradeLabel: string;
  note: string;
};

function emptyAvaliacaoForm(): AvaliacaoForm {
  return {
    studentId: "",
    title: "",
    subject: "",
    date: format(new Date(), "yyyy-MM-dd"),
    gradeType: "NUMERICA",
    gradeValue: "",
    gradeLabel: "",
    note: "",
  };
}

function AvaliacoesTab({
  classGroupId,
  canManage,
}: {
  classGroupId: string;
  canManage: boolean;
}) {
  const [items, setItems] = useState<Assessment[]>([]);
  const [roster, setRoster] = useState<AttendanceStudentRow[]>([]);
  const [form, setForm] = useState<AvaliacaoForm>(emptyAvaliacaoForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadList = () => {
    setLoading(true);
    api
      .getAssessmentsForTurma(classGroupId)
      .then(setItems)
      .catch((err) =>
        setMessage(
          err instanceof Error
            ? err.message
            : "Não foi possível carregar as avaliações.",
        ),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadList();
    // Roster da turma (mesma derivação das presenças: sala + ano lectivo).
    api
      .getAttendanceForTurma(classGroupId, format(new Date(), "yyyy-MM-dd"))
      .then((data) => setRoster(data.students))
      .catch(() => setRoster([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classGroupId]);

  const resetForm = () => {
    setForm(emptyAvaliacaoForm());
    setEditingId(null);
  };

  const startEdit = (item: Assessment) => {
    setEditingId(item.id);
    setForm({
      studentId: item.studentId,
      title: item.title,
      subject: item.subject,
      date: item.date.slice(0, 10),
      gradeType: item.gradeType,
      gradeValue: item.gradeValue != null ? String(item.gradeValue) : "",
      gradeLabel: item.gradeLabel ?? "",
      note: item.note ?? "",
    });
    setMessage("");
  };

  const submit = async () => {
    if (!form.studentId) {
      setMessage("Seleccione o aluno.");
      return;
    }
    if (!form.title.trim() || !form.subject.trim()) {
      setMessage("Indique o título e a disciplina.");
      return;
    }
    let gradeValue: number | null = null;
    let gradeLabel: string | null = null;
    if (form.gradeType === "NUMERICA") {
      const parsed = Number(form.gradeValue.replace(",", "."));
      if (form.gradeValue.trim() === "" || Number.isNaN(parsed)) {
        setMessage("Indique a nota numérica.");
        return;
      }
      gradeValue = parsed;
    } else {
      if (!form.gradeLabel.trim()) {
        setMessage("Indique a classificação qualitativa.");
        return;
      }
      gradeLabel = form.gradeLabel.trim();
    }

    setSaving(true);
    setMessage("");
    try {
      if (editingId) {
        await api.updateAssessment(editingId, {
          title: form.title.trim(),
          subject: form.subject.trim(),
          date: form.date,
          gradeType: form.gradeType,
          gradeValue,
          gradeLabel,
          note: form.note.trim() || null,
        });
        setMessage("Avaliação actualizada.");
      } else {
        const payload: AssessmentPayload = {
          studentId: form.studentId,
          classGroupId,
          title: form.title.trim(),
          subject: form.subject.trim(),
          date: form.date,
          gradeType: form.gradeType,
          gradeValue,
          gradeLabel,
          note: form.note.trim() || null,
        };
        await api.createAssessment(payload);
        setMessage("Avaliação registada.");
      }
      resetForm();
      loadList();
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : "Não foi possível guardar a avaliação.",
      );
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item: Assessment) => {
    if (!window.confirm(`Remover a avaliação "${item.title}"?`)) return;
    try {
      await api.deleteAssessment(item.id);
      if (editingId === item.id) resetForm();
      loadList();
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Não foi possível remover.",
      );
    }
  };

  const studentName = (item: Assessment) =>
    item.student?.childFullName ||
    roster.find((r) => r.studentId === item.studentId)?.childFullName ||
    "Aluno";

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {canManage && (
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">
              {editingId ? "Editar avaliação" : "Nova avaliação"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Aluno">
              <Select
                value={form.studentId}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, studentId: v }))
                }
                disabled={!!editingId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar aluno" />
                </SelectTrigger>
                <SelectContent>
                  {roster.map((s) => (
                    <SelectItem key={s.studentId} value={s.studentId}>
                      {s.childFullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {roster.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Esta turma ainda não tem alunos associados.
                </p>
              )}
            </Field>
            <Field label="Título">
              <Input
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                placeholder="Ex.: Teste 1.º período"
              />
            </Field>
            <Field label="Disciplina">
              <Input
                value={form.subject}
                onChange={(e) =>
                  setForm((f) => ({ ...f, subject: e.target.value }))
                }
                placeholder="Ex.: Português"
              />
            </Field>
            <Field label="Data">
              <Input
                type="date"
                value={form.date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, date: e.target.value }))
                }
              />
            </Field>
            <Field label="Tipo de classificação">
              <Select
                value={form.gradeType}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    gradeType: v as AssessmentGradeType,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NUMERICA">Numérica</SelectItem>
                  <SelectItem value="QUALITATIVA">Qualitativa</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            {form.gradeType === "NUMERICA" ? (
              <Field label="Nota">
                <Input
                  type="number"
                  step="0.1"
                  value={form.gradeValue}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, gradeValue: e.target.value }))
                  }
                  placeholder="Ex.: 16.5"
                />
              </Field>
            ) : (
              <Field label="Classificação">
                <Input
                  value={form.gradeLabel}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, gradeLabel: e.target.value }))
                  }
                  placeholder="Ex.: Muito Bom"
                />
              </Field>
            )}
            <Field label="Observação (opcional)">
              <Textarea
                rows={3}
                value={form.note}
                onChange={(e) =>
                  setForm((f) => ({ ...f, note: e.target.value }))
                }
                placeholder="Comentário sobre o desempenho…"
              />
            </Field>
            {message && (
              <p className="text-sm text-muted-foreground">{message}</p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button onClick={submit} disabled={saving}>
                {saving ? "A guardar…" : editingId ? "Guardar" : "Registar"}
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
          <CardTitle className="text-lg">Avaliações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!canManage && message && (
            <p className="text-sm text-muted-foreground">{message}</p>
          )}
          {loading ? (
            <p className="text-sm text-muted-foreground">A carregar…</p>
          ) : items.length === 0 ? (
            <p className="rounded-lg border p-5 text-sm text-muted-foreground">
              Ainda não há avaliações para esta turma.
            </p>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-lg border p-4"
              >
                <div className="space-y-1">
                  <p className="font-semibold">{studentName(item)}</p>
                  <p className="text-sm">
                    {item.title} · {item.subject}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatAcademicoDate(item.date)}
                    {item.author ? ` · ${item.author.name}` : ""}
                  </p>
                  {item.note && (
                    <p className="text-sm text-muted-foreground">{item.note}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant="secondary" className="text-base">
                    {assessmentGradeDisplay(item)}
                  </Badge>
                  {canManage && (
                    <div className="flex flex-wrap gap-2">
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
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

type HorarioForm = {
  weekday: number;
  startTime: string;
  endTime: string;
  subject: string;
  room: string;
};

function emptyHorarioForm(): HorarioForm {
  return {
    weekday: 1,
    startTime: "08:00",
    endTime: "09:00",
    subject: "",
    room: "",
  };
}

function HorariosTab({
  classGroupId,
  canManage,
}: {
  classGroupId: string;
  canManage: boolean;
}) {
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [form, setForm] = useState<HorarioForm>(emptyHorarioForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadList = () => {
    setLoading(true);
    api
      .getScheduleForTurma(classGroupId)
      .then(setEntries)
      .catch((err) =>
        setMessage(
          err instanceof Error
            ? err.message
            : "Não foi possível carregar o horário.",
        ),
      )
      .finally(() => setLoading(false));
  };

  useEffect(loadList, [classGroupId]);

  const resetForm = () => {
    setForm(emptyHorarioForm());
    setEditingId(null);
  };

  const startEdit = (item: ScheduleEntry) => {
    setEditingId(item.id);
    setForm({
      weekday: item.weekday,
      startTime: item.startTime,
      endTime: item.endTime,
      subject: item.subject,
      room: item.room ?? "",
    });
    setMessage("");
  };

  const submit = async () => {
    if (!form.subject.trim()) {
      setMessage("Indique a disciplina/actividade.");
      return;
    }
    if (form.endTime <= form.startTime) {
      setMessage("A hora de fim deve ser posterior à de início.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      if (editingId) {
        await api.updateScheduleEntry(editingId, {
          weekday: form.weekday,
          startTime: form.startTime,
          endTime: form.endTime,
          subject: form.subject.trim(),
          room: form.room.trim() || null,
        });
        setMessage("Entrada actualizada.");
      } else {
        const payload: ScheduleEntryPayload = {
          classGroupId,
          weekday: form.weekday,
          startTime: form.startTime,
          endTime: form.endTime,
          subject: form.subject.trim(),
          room: form.room.trim() || null,
        };
        await api.createScheduleEntry(payload);
        setMessage("Entrada adicionada ao horário.");
      }
      resetForm();
      loadList();
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : "Não foi possível guardar o horário.",
      );
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item: ScheduleEntry) => {
    if (
      !window.confirm(
        `Remover ${item.subject} (${weekdayLabel(item.weekday)})?`,
      )
    )
      return;
    try {
      await api.deleteScheduleEntry(item.id);
      if (editingId === item.id) resetForm();
      loadList();
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Não foi possível remover.",
      );
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {canManage && (
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">
              {editingId ? "Editar entrada" : "Nova entrada"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Dia da semana">
              <Select
                value={String(form.weekday)}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, weekday: Number(v) }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WEEKDAYS.map((d) => (
                    <SelectItem key={d.value} value={String(d.value)}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Início">
                <Input
                  type="time"
                  value={form.startTime}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, startTime: e.target.value }))
                  }
                />
              </Field>
              <Field label="Fim">
                <Input
                  type="time"
                  value={form.endTime}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, endTime: e.target.value }))
                  }
                />
              </Field>
            </div>
            <Field label="Disciplina/actividade">
              <Input
                value={form.subject}
                onChange={(e) =>
                  setForm((f) => ({ ...f, subject: e.target.value }))
                }
                placeholder="Ex.: Educação Física"
              />
            </Field>
            <Field label="Sala/local (opcional)">
              <Input
                value={form.room}
                onChange={(e) =>
                  setForm((f) => ({ ...f, room: e.target.value }))
                }
                placeholder="Ex.: Ginásio"
              />
            </Field>
            {message && (
              <p className="text-sm text-muted-foreground">{message}</p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button onClick={submit} disabled={saving}>
                {saving ? "A guardar…" : editingId ? "Guardar" : "Adicionar"}
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
          <CardTitle className="text-lg">Horário semanal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!canManage && message && (
            <p className="text-sm text-muted-foreground">{message}</p>
          )}
          {loading ? (
            <p className="text-sm text-muted-foreground">A carregar…</p>
          ) : entries.length === 0 ? (
            <p className="rounded-lg border p-5 text-sm text-muted-foreground">
              Ainda não há horário definido para esta turma.
            </p>
          ) : (
            WEEKDAYS.filter((d) =>
              entries.some((e) => e.weekday === d.value),
            ).map((d) => (
              <div key={d.value} className="space-y-2">
                <p className="text-sm font-semibold">{d.label}</p>
                <div className="divide-y rounded-lg border">
                  {entries
                    .filter((e) => e.weekday === d.value)
                    .map((entry) => (
                      <div
                        key={entry.id}
                        className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 text-sm"
                      >
                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center gap-1 font-medium">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                            {entry.startTime}–{entry.endTime}
                          </span>
                          <span>{entry.subject}</span>
                          {entry.room && (
                            <span className="text-muted-foreground">
                              · {entry.room}
                            </span>
                          )}
                        </div>
                        {canManage && (
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => startEdit(entry)}
                            >
                              <Pencil className="mr-1 h-3.5 w-3.5" />
                              Editar
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => remove(entry)}
                            >
                              <Trash2 className="mr-1 h-3.5 w-3.5" />
                              Remover
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SintesesTab({ canManage }: { canManage: boolean }) {
  const [reports, setReports] = useState<DescriptiveReport[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [form, setForm] = useState({
    studentId: "",
    academicYearId: "",
    periodLabel: "1.º Trimestre",
    areaFocus: "",
    body: "",
    status: "RASCUNHO" as DescriptiveReportStatus,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadList = () => {
    setLoading(true);
    api
      .getDescriptiveReports()
      .then(setReports)
      .catch((err) =>
        setMessage(
          err instanceof Error
            ? err.message
            : "Não foi possível carregar as sínteses.",
        ),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadList();
    api.getStudents().then(setStudents).catch(() => setStudents([]));
    api.getAcademicYears().then((list) => {
      setYears(list);
      const active = list.find((y) => y.active) || list[0];
      if (active) {
        setForm((f) => ({ ...f, academicYearId: f.academicYearId || active.id }));
      }
    });
  }, []);

  const resetForm = () => {
    const active = years.find((y) => y.active) || years[0];
    setEditingId(null);
    setForm({
      studentId: "",
      academicYearId: active?.id || "",
      periodLabel: "1.º Trimestre",
      areaFocus: "",
      body: "",
      status: "RASCUNHO",
    });
  };

  const startEdit = (item: DescriptiveReport) => {
    setEditingId(item.id);
    setForm({
      studentId: item.studentId,
      academicYearId: item.academicYearId || "",
      periodLabel: item.periodLabel,
      areaFocus: item.areaFocus || "",
      body: item.body,
      status: item.status,
    });
  };

  const submit = async () => {
    if (!form.studentId || !form.periodLabel.trim() || !form.body.trim()) {
      setMessage("Seleccione o aluno e preencha o período e o texto.");
      return;
    }
    setSaving(true);
    setMessage("");
    const payload: DescriptiveReportPayload = {
      studentId: form.studentId,
      academicYearId: form.academicYearId || null,
      periodLabel: form.periodLabel.trim(),
      areaFocus: form.areaFocus.trim() || null,
      body: form.body.trim(),
      status: form.status,
    };
    try {
      if (editingId) {
        await api.updateDescriptiveReport(editingId, payload);
        setMessage("Síntese actualizada.");
      } else {
        await api.createDescriptiveReport(payload);
        setMessage("Síntese criada.");
      }
      resetForm();
      loadList();
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Não foi possível guardar.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {canManage && (
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">
              {editingId ? "Editar síntese" : "Nova síntese"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field label="Aluno">
              <Select
                value={form.studentId}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, studentId: v }))
                }
                disabled={!!editingId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.childFullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Período">
              <Input
                value={form.periodLabel}
                onChange={(e) =>
                  setForm((f) => ({ ...f, periodLabel: e.target.value }))
                }
                placeholder="1.º Trimestre"
              />
            </Field>
            <Field label="Área / domínio (opc.)">
              <Input
                value={form.areaFocus}
                onChange={(e) =>
                  setForm((f) => ({ ...f, areaFocus: e.target.value }))
                }
              />
            </Field>
            <Field label="Ano lectivo">
              <Select
                value={form.academicYearId || "none"}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    academicYearId: v === "none" ? "" : v,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {years.map((y) => (
                    <SelectItem key={y.id} value={y.id}>
                      {y.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Estado">
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    status: v as DescriptiveReportStatus,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RASCUNHO">Rascunho</SelectItem>
                  <SelectItem value="PUBLICADO">Publicado</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Texto">
              <Textarea
                rows={8}
                value={form.body}
                onChange={(e) =>
                  setForm((f) => ({ ...f, body: e.target.value }))
                }
              />
            </Field>
            <div className="flex flex-wrap gap-2">
              <Button onClick={submit} disabled={saving}>
                {saving ? "A guardar…" : "Guardar"}
              </Button>
              {editingId && (
                <Button variant="ghost" onClick={resetForm}>
                  Cancelar
                </Button>
              )}
            </div>
            {message && (
              <p className="text-sm text-muted-foreground">{message}</p>
            )}
          </CardContent>
        </Card>
      )}
      <Card className={canManage ? "lg:col-span-2" : "lg:col-span-3"}>
        <CardHeader>
          <CardTitle className="text-lg">Sínteses descritivas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">A carregar…</p>
          ) : reports.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ainda não há sínteses registadas.
            </p>
          ) : (
            reports.map((item) => (
              <div key={item.id} className="rounded-lg border p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">
                      {item.student?.childFullName || "Aluno"} ·{" "}
                      {item.periodLabel}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.areaFocus ? `${item.areaFocus} · ` : ""}
                      {item.academicYear?.label || "—"}
                    </p>
                  </div>
                  <Badge
                    variant={
                      item.status === "PUBLICADO" ? "default" : "secondary"
                    }
                  >
                    {item.status === "PUBLICADO" ? "Publicado" : "Rascunho"}
                  </Badge>
                </div>
                <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
                  {item.body}
                </p>
                {canManage && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startEdit(item)}
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        if (item.status === "PUBLICADO") {
                          await api.unpublishDescriptiveReport(item.id);
                        } else {
                          await api.publishDescriptiveReport(item.id);
                        }
                        loadList();
                      }}
                    >
                      {item.status === "PUBLICADO"
                        ? "Repor rascunho"
                        : "Publicar"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        if (!confirm("Eliminar esta síntese?")) return;
                        await api.deleteDescriptiveReport(item.id);
                        loadList();
                      }}
                    >
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
  );
}

const SUBSTITUTION_STATUS_OPTIONS: Array<{
  value: SubstitutionStatus;
  label: string;
}> = [
  { value: "PLANEADA", label: "Planeada" },
  { value: "CONFIRMADA", label: "Confirmada" },
  { value: "CANCELADA", label: "Cancelada" },
  { value: "CONCLUIDA", label: "Concluída" },
];

function SubstituicoesTab({
  canManage,
  turmas,
  selectedTurmaId,
}: {
  canManage: boolean;
  turmas: AttendanceTurma[];
  selectedTurmaId: string;
}) {
  const [items, setItems] = useState<Substitution[]>([]);
  const [form, setForm] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    classGroupId: selectedTurmaId || "",
    absentTeacher: "",
    substituteTeacher: "",
    reason: "",
    notes: "",
    status: "PLANEADA" as SubstitutionStatus,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadList = () => {
    setLoading(true);
    api
      .getSubstitutions({
        classGroupId: selectedTurmaId || undefined,
      })
      .then(setItems)
      .catch((err) =>
        setMessage(
          err instanceof Error
            ? err.message
            : "Não foi possível carregar as substituições.",
        ),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadList();
    const turma = turmas.find((t) => t.id === selectedTurmaId);
    setForm((f) => ({
      ...f,
      classGroupId: selectedTurmaId || f.classGroupId,
      absentTeacher: f.absentTeacher || turma?.teacherName || "",
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTurmaId]);

  const resetForm = () => {
    const turma = turmas.find((t) => t.id === selectedTurmaId);
    setEditingId(null);
    setForm({
      date: format(new Date(), "yyyy-MM-dd"),
      classGroupId: selectedTurmaId || "",
      absentTeacher: turma?.teacherName || "",
      substituteTeacher: "",
      reason: "",
      notes: "",
      status: "PLANEADA",
    });
  };

  const startEdit = (item: Substitution) => {
    setEditingId(item.id);
    setForm({
      date: item.date.slice(0, 10),
      classGroupId: item.classGroupId,
      absentTeacher: item.absentTeacher,
      substituteTeacher: item.substituteTeacher,
      reason: item.reason || "",
      notes: item.notes || "",
      status: item.status,
    });
  };

  const submit = async () => {
    if (!form.classGroupId || !form.substituteTeacher.trim()) {
      setMessage("Indique a turma e o substituto.");
      return;
    }
    setSaving(true);
    setMessage("");
    const payload: SubstitutionPayload = {
      date: form.date,
      classGroupId: form.classGroupId,
      absentTeacher: form.absentTeacher.trim() || undefined,
      substituteTeacher: form.substituteTeacher.trim(),
      reason: form.reason.trim() || null,
      notes: form.notes.trim() || null,
      status: form.status,
    };
    try {
      if (editingId) {
        await api.updateSubstitution(editingId, payload);
        setMessage("Substituição actualizada.");
      } else {
        await api.createSubstitution(payload);
        setMessage("Substituição registada.");
      }
      resetForm();
      loadList();
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Não foi possível guardar.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {canManage && (
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">
              {editingId ? "Editar substituição" : "Nova substituição"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field label="Data">
              <Input
                type="date"
                value={form.date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, date: e.target.value }))
                }
              />
            </Field>
            <Field label="Turma">
              <Select
                value={form.classGroupId}
                onValueChange={(v) => {
                  const turma = turmas.find((t) => t.id === v);
                  setForm((f) => ({
                    ...f,
                    classGroupId: v,
                    absentTeacher: turma?.teacherName || f.absentTeacher,
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {turmas.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Ausente">
              <Input
                value={form.absentTeacher}
                onChange={(e) =>
                  setForm((f) => ({ ...f, absentTeacher: e.target.value }))
                }
              />
            </Field>
            <Field label="Substituto">
              <Input
                value={form.substituteTeacher}
                onChange={(e) =>
                  setForm((f) => ({ ...f, substituteTeacher: e.target.value }))
                }
              />
            </Field>
            <Field label="Motivo">
              <Input
                value={form.reason}
                onChange={(e) =>
                  setForm((f) => ({ ...f, reason: e.target.value }))
                }
              />
            </Field>
            <Field label="Estado">
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    status: v as SubstitutionStatus,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUBSTITUTION_STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Notas">
              <Textarea
                rows={3}
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
              />
            </Field>
            <div className="flex flex-wrap gap-2">
              <Button onClick={submit} disabled={saving}>
                {saving ? "A guardar…" : "Guardar"}
              </Button>
              {editingId && (
                <Button variant="ghost" onClick={resetForm}>
                  Cancelar
                </Button>
              )}
            </div>
            {message && (
              <p className="text-sm text-muted-foreground">{message}</p>
            )}
          </CardContent>
        </Card>
      )}
      <Card className={canManage ? "lg:col-span-2" : "lg:col-span-3"}>
        <CardHeader>
          <CardTitle className="text-lg">Substituições</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">A carregar…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Sem substituições para os filtros actuais.
            </p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="rounded-lg border p-4 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">
                      {formatAcademicoDate(item.date)} ·{" "}
                      {item.classGroup?.name || "Turma"}
                    </p>
                    <p className="text-muted-foreground">
                      Ausente: {item.absentTeacher} → Substituto:{" "}
                      {item.substituteTeacher}
                    </p>
                    {item.reason && (
                      <p className="text-muted-foreground">
                        Motivo: {item.reason}
                      </p>
                    )}
                  </div>
                  <Badge variant="secondary">
                    {SUBSTITUTION_STATUS_OPTIONS.find(
                      (o) => o.value === item.status,
                    )?.label || item.status}
                  </Badge>
                </div>
                {canManage && (
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startEdit(item)}
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        if (!confirm("Eliminar esta substituição?")) return;
                        await api.deleteSubstitution(item.id);
                        loadList();
                      }}
                    >
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
  );
}

const ATTENDANCE_OPTIONS: Array<{ value: AttendanceStatus; label: string }> = [
  { value: "PRESENTE", label: "Presente" },
  { value: "ATRASO", label: "Atraso" },
  { value: "FALTA", label: "Falta" },
  { value: "FALTA_JUSTIFICADA", label: "Falta justificada" },
];

function attendanceStatusLabel(status: AttendanceStatus | null): string {
  return (
    ATTENDANCE_OPTIONS.find((o) => o.value === status)?.label || "Por marcar"
  );
}

function attendanceBadgeVariant(
  status: AttendanceStatus | null,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "PRESENTE":
      return "default";
    case "ATRASO":
      return "secondary";
    case "FALTA":
      return "destructive";
    case "FALTA_JUSTIFICADA":
      return "outline";
    default:
      return "outline";
  }
}

function PresencasAdmin({
  needsLogin,
  onLogin,
}: {
  needsLogin: boolean;
  onLogin: () => void;
}) {
  const [turmas, setTurmas] = useState<AttendanceTurma[]>([]);
  const [selectedTurmaId, setSelectedTurmaId] = useState("");
  const [date, setDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [rows, setRows] = useState<AttendanceStudentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (needsLogin) return;
    api
      .getAttendanceTurmas()
      .then((list) => {
        setTurmas(list);
        setSelectedTurmaId((current) => current || list[0]?.id || "");
      })
      .catch(() => setTurmas([]));
  }, [needsLogin]);

  useEffect(() => {
    if (needsLogin || !selectedTurmaId || !date) {
      setRows([]);
      return;
    }
    setLoading(true);
    setMessage("");
    api
      .getAttendanceForTurma(selectedTurmaId, date)
      .then((data) => setRows(data.students))
      .catch((err) => {
        setRows([]);
        setMessage(
          err instanceof Error
            ? err.message
            : "Não foi possível carregar as presenças.",
        );
      })
      .finally(() => setLoading(false));
  }, [needsLogin, selectedTurmaId, date]);

  if (needsLogin) {
    return (
      <Card>
        <CardContent className="space-y-4 p-8">
          <h1 className="text-2xl font-bold">Presenças</h1>
          <p className="text-muted-foreground">
            Inicie sessão para registar as presenças das turmas.
          </p>
          <Button onClick={onLogin}>Entrar</Button>
        </CardContent>
      </Card>
    );
  }

  const setStatus = (studentId: string, status: AttendanceStatus) => {
    setRows((list) =>
      list.map((r) => (r.studentId === studentId ? { ...r, status } : r)),
    );
  };

  const setNote = (studentId: string, note: string) => {
    setRows((list) =>
      list.map((r) => (r.studentId === studentId ? { ...r, note } : r)),
    );
  };

  const markAllPresent = () => {
    setRows((list) => list.map((r) => ({ ...r, status: "PRESENTE" })));
  };

  const save = async () => {
    if (!selectedTurmaId || rows.length === 0) return;
    setSaving(true);
    setMessage("");
    try {
      const data = await api.saveAttendanceForTurma(selectedTurmaId, {
        date,
        records: rows.map((r) => ({
          studentId: r.studentId,
          status: (r.status ?? "PRESENTE") as AttendanceStatus,
          note: r.note?.trim() ? r.note.trim() : undefined,
        })),
      });
      setRows(data.students);
      setMessage("Presenças guardadas com sucesso.");
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : "Não foi possível guardar as presenças.",
      );
    } finally {
      setSaving(false);
    }
  };

  const selectedTurma = turmas.find((t) => t.id === selectedTurmaId);
  const summary = rows.reduce(
    (acc, row) => {
      const key = row.status ?? "POR_MARCAR";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div>
      <div className="mb-7">
        <p className="mb-2 text-sm font-medium text-secondary">
          ACOMPANHAMENTO
        </p>
        <h1 className="text-3xl font-bold">Presenças</h1>
        <p className="mt-2 text-muted-foreground">
          Seleccione a turma e a data, marque a presença de cada aluno e guarde.
          Pode voltar a editar no mesmo dia.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Turma e data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Turma">
              <Select
                value={selectedTurmaId}
                onValueChange={setSelectedTurmaId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar turma" />
                </SelectTrigger>
                <SelectContent>
                  {turmas.map((turma) => (
                    <SelectItem key={turma.id} value={turma.id}>
                      {turma.name} · {turma.room.name} · {turma.room.unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Data">
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </Field>
            {selectedTurma && (
              <div className="rounded-lg border bg-slate-50 p-3 text-sm text-muted-foreground">
                <p>
                  {selectedTurma.room.service.name} ·{" "}
                  {selectedTurma.academicYear.label}
                </p>
                {selectedTurma.teacherName && (
                  <p>Educador(a): {selectedTurma.teacherName}</p>
                )}
                <p>{selectedTurma.studentCount} aluno(s) na turma</p>
              </div>
            )}
            {rows.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {ATTENDANCE_OPTIONS.map((opt) => (
                  <Badge
                    key={opt.value}
                    variant={attendanceBadgeVariant(opt.value)}
                  >
                    {opt.label}: {summary[opt.value] || 0}
                  </Badge>
                ))}
                {summary["POR_MARCAR"] ? (
                  <Badge variant="outline">
                    Por marcar: {summary["POR_MARCAR"]}
                  </Badge>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
            <CardTitle className="text-lg">Alunos</CardTitle>
            {rows.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={markAllPresent}>
                  Marcar todos presentes
                </Button>
                <Button size="sm" onClick={save} disabled={saving}>
                  {saving ? "A guardar…" : "Guardar presenças"}
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {message && (
              <p className="text-sm text-muted-foreground">{message}</p>
            )}
            {loading ? (
              <p className="text-sm text-muted-foreground">A carregar…</p>
            ) : rows.length === 0 ? (
              <p className="rounded-lg border p-5 text-sm text-muted-foreground">
                {selectedTurmaId
                  ? "Esta turma ainda não tem alunos associados (por sala e ano letivo)."
                  : "Seleccione uma turma para começar."}
              </p>
            ) : (
              <div className="divide-y rounded-lg border">
                {rows.map((row) => (
                  <div key={row.studentId} className="space-y-3 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">{row.childFullName}</p>
                        <p className="text-xs text-muted-foreground">
                          Estado actual: {attendanceStatusLabel(row.status)}
                        </p>
                      </div>
                      <div className="w-48">
                        <Select
                          value={row.status ?? "PRESENTE"}
                          onValueChange={(v) =>
                            setStatus(row.studentId, v as AttendanceStatus)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ATTENDANCE_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Input
                      value={row.note ?? ""}
                      onChange={(e) => setNote(row.studentId, e.target.value)}
                      placeholder="Nota (opcional) — ex.: chegou às 9h15"
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

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

// ───────────────────────────── Painel executivo ─────────────────────────────

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

function PainelExecutivo({
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

function AuditoriaAdmin({
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

function BackupsAdmin({
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

function UnidadesAdmin({
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
