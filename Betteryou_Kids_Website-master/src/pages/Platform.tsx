import { Suspense, lazy, useEffect, useState } from "react";
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
  RefreshCw,
  School,
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
  hasLocalSessionFlag,
  markLocalSession,
  uploadPublicUrl,
  downloadEnrollmentDocument,
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
  type CommunicationForMe,
  type EventType,
  type MyEventRegistration,
  type PublicEvent,
  type Invoice,
  type InvoiceStatus,
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
// ContentEditor + ops views: lazy-loaded from @/components/platform
const ContentEditor = lazy(() =>
  import("@/components/platform/ContentEditor").then((m) => ({
    default: m.ContentEditor,
  })),
);
const PainelExecutivo = lazy(() =>
  import("@/components/platform/PlatformOpsViews").then((m) => ({
    default: m.PainelExecutivo,
  })),
);
const AuditoriaAdmin = lazy(() =>
  import("@/components/platform/PlatformOpsViews").then((m) => ({
    default: m.AuditoriaAdmin,
  })),
);
const BackupsAdmin = lazy(() =>
  import("@/components/platform/PlatformOpsViews").then((m) => ({
    default: m.BackupsAdmin,
  })),
);
const UnidadesAdmin = lazy(() =>
  import("@/components/platform/PlatformOpsViews").then((m) => ({
    default: m.UnidadesAdmin,
  })),
);
const FinanceiroAdmin = lazy(() =>
  import("@/components/platform/FinanceiroAdmin").then((m) => ({
    default: m.FinanceiroAdmin,
  })),
);
const AcademicoAdmin = lazy(() =>
  import("@/components/platform/AcademicoAdmin").then((m) => ({
    default: m.AcademicoAdmin,
  })),
);
const SalasAdmin = lazy(() =>
  import("@/components/platform/TurmasSalasAdmin").then((m) => ({
    default: m.SalasAdmin,
  })),
);
const TurmasAdmin = lazy(() =>
  import("@/components/platform/TurmasSalasAdmin").then((m) => ({
    default: m.TurmasAdmin,
  })),
);
const CurriculoAdmin = lazy(() =>
  import("@/components/platform/CurriculoNeeAdmin").then((m) => ({
    default: m.CurriculoAdmin,
  })),
);
const NeeAdmin = lazy(() =>
  import("@/components/platform/CurriculoNeeAdmin").then((m) => ({
    default: m.NeeAdmin,
  })),
);
const ComunicadosAdmin = lazy(() =>
  import("@/components/platform/ComunicadosAdmin").then((m) => ({
    default: m.ComunicadosAdmin,
  })),
);
const RelatoriosAdmin = lazy(() =>
  import("@/components/platform/RelatoriosAdmin").then((m) => ({
    default: m.RelatoriosAdmin,
  })),
);
const EventosAdmin = lazy(() =>
  import("@/components/platform/EventosAdmin").then((m) => ({
    default: m.EventosAdmin,
  })),
);

function PlatformViewFallback() {
  return (
    <p className="py-10 text-center text-muted-foreground">A carregar.</p>
  );
}

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
    const existingToken = hasLocalSessionFlag();
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
  /** Flag de sessão UI — JWT real está em cookies HttpOnly. */
  const [token, setToken] = useState<string | null>(() =>
    hasLocalSessionFlag() ? "1" : null,
  );

  const clearAuth = () => {
    void api.logout();
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
    const loggedIn = auth?.loggedIn ?? hasLocalSessionFlag();
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

    markLocalSession();
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

    setToken("1");
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
            <Suspense fallback={<PlatformViewFallback />}>
              <PainelExecutivo
              needsLogin={!token}
              userRole={userRole}
              onLogin={() => goTo("login")}
            />
            </Suspense>
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
            <Suspense fallback={<PlatformViewFallback />}>
              <SalasAdmin needsLogin={!token} onLogin={() => goTo("login")} />
            </Suspense>
          )}
          {view === "turmas" && (
            <Suspense fallback={<PlatformViewFallback />}>
              <TurmasAdmin needsLogin={!token} onLogin={() => goTo("login")} />
            </Suspense>
          )}
          {view === "presencas" && (
            <PresencasAdmin needsLogin={!token} onLogin={() => goTo("login")} />
          )}
          {view === "academico" && (
            <Suspense fallback={<PlatformViewFallback />}>
              <AcademicoAdmin
                needsLogin={!token}
                userRole={userRole}
                onLogin={() => goTo("login")}
              />
            </Suspense>
          )}
          {view === "curriculo" && (
            <Suspense fallback={<PlatformViewFallback />}>
              <CurriculoAdmin
                needsLogin={!token}
                userRole={userRole}
                onLogin={() => goTo("login")}
              />
            </Suspense>
          )}
          {view === "nee" && (
            <Suspense fallback={<PlatformViewFallback />}>
              <NeeAdmin
                needsLogin={!token}
                userRole={userRole}
                onLogin={() => goTo("login")}
              />
            </Suspense>
          )}
          {view === "reunioes" && (
            <ReunioesAdmin
              needsLogin={!token}
              userRole={userRole}
              onLogin={() => goTo("login")}
            />
          )}
          {view === "comunicados" && (
            <Suspense fallback={<PlatformViewFallback />}>
              <ComunicadosAdmin
                needsLogin={!token}
                userRole={userRole}
                onLogin={() => goTo("login")}
              />
            </Suspense>
          )}
          {view === "eventos" && (
            <Suspense fallback={<PlatformViewFallback />}>
              <EventosAdmin
                needsLogin={!token}
                userRole={userRole}
                onLogin={() => goTo("login")}
              />
            </Suspense>
          )}
          {view === "financeiro" && (
            <Suspense fallback={<PlatformViewFallback />}>
              <FinanceiroAdmin
              needsLogin={!token}
              userRole={userRole}
              onLogin={() => goTo("login")}
            />
            </Suspense>
          )}
          {view === "relatorios" && (
            <Suspense fallback={<PlatformViewFallback />}>
              <RelatoriosAdmin
                needsLogin={!token}
                userRole={userRole}
                onLogin={() => goTo("login")}
              />
            </Suspense>
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
            <Suspense fallback={<PlatformViewFallback />}>
              <ContentEditor
              needsLogin={!token}
              onLogin={() => goTo("login")}
            />
            </Suspense>
          )}
          {view === "unidades" && (
            <Suspense fallback={<PlatformViewFallback />}>
              <UnidadesAdmin
              needsLogin={!token}
              userRole={userRole}
              onLogin={() => goTo("login")}
            />
            </Suspense>
          )}
          {view === "auditoria" && (
            <Suspense fallback={<PlatformViewFallback />}>
              <AuditoriaAdmin
              needsLogin={!token}
              userRole={userRole}
              onLogin={() => goTo("login")}
            />
            </Suspense>
          )}
          {view === "backups" && (
            <Suspense fallback={<PlatformViewFallback />}>
              <BackupsAdmin
              needsLogin={!token}
              userRole={userRole}
              onLogin={() => goTo("login")}
            />
            </Suspense>
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
          <EnrollmentDocumentsPanel
            enrollmentId={submitted.id}
            uploadToken={submitted.uploadToken}
          />
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
  uploadToken,
}: {
  enrollmentId: string;
  uploadToken?: string;
}) {
  const [documents, setDocuments] = useState<
    Array<{
      id: string;
      type: string;
      fileName: string;
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
      .getEnrollmentDocuments(enrollmentId, uploadToken)
      .then(setDocuments)
      .catch(() => setDocuments([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enrollmentId, uploadToken]);

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
        uploadToken,
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

function peiStatusLabel(status: string): string {
  const map: Record<string, string> = {
    RASCUNHO: "Rascunho",
    ACTIVO: "Activo",
    EM_REVISAO: "Em revisão",
    CONCLUIDO: "Concluído",
    ARQUIVADO: "Arquivado",
  };
  return map[status] || status;
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
                                <button
                                  type="button"
                                  className="inline-flex items-center gap-2 text-sm text-primary underline-offset-2 hover:underline"
                                  onClick={() => {
                                    void downloadEnrollmentDocument(
                                      item.id,
                                      doc.id,
                                      doc.fileName,
                                    ).catch((err) => {
                                      window.alert(
                                        err instanceof Error
                                          ? err.message
                                          : "Não foi possível descarregar o documento.",
                                      );
                                    });
                                  }}
                                >
                                  <FileText className="h-4 w-4" />
                                  {documentTypeLabel(doc.type)} — {doc.fileName}
                                </button>
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

const EVENT_TYPE_OPTIONS: Array<{ value: EventType; label: string }> = [
  { value: "FESTA", label: "Festa" },
  { value: "EVENTO", label: "Evento" },
  { value: "PASSEIO", label: "Passeio" },
  { value: "WORKSHOP", label: "Workshop" },
];

function eventTypeLabel(type: string): string {
  return EVENT_TYPE_OPTIONS.find((o) => o.value === type)?.label || type;
}

function formatEventDateTime(value: string | null): string {
  if (!value) return "";
  try {
    return format(parseISO(value), "dd/MM/yyyy · HH:mm", { locale: pt });
  } catch {
    return value.slice(0, 16).replace("T", " ");
  }
}

function formatEventPrice(priceAkz: number | null): string {
  if (priceAkz == null || priceAkz <= 0) return "Gratuito";
  return `${priceAkz.toLocaleString("pt-PT")} AKZ`;
}

const INVOICE_STATUS_OPTIONS: Array<{ value: InvoiceStatus; label: string }> = [
  { value: "PENDENTE", label: "Pendente" },
  { value: "PAGO", label: "Pago" },
  { value: "VENCIDO", label: "Em atraso" },
  { value: "ANULADO", label: "Anulada" },
];

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

function formatFinanceiroDate(value: string): string {
  try {
    return format(parseISO(value), "dd/MM/yyyy", { locale: pt });
  } catch {
    return value;
  }
}

const WEEKDAYS: Array<{ value: number; label: string; short: string }> = [
  { value: 1, label: "Segunda-feira", short: "Seg" },
  { value: 2, label: "Terça-feira", short: "Ter" },
  { value: 3, label: "Quarta-feira", short: "Qua" },
  { value: 4, label: "Quinta-feira", short: "Qui" },
  { value: 5, label: "Sexta-feira", short: "Sex" },
  { value: 6, label: "Sábado", short: "Sáb" },
  { value: 7, label: "Domingo", short: "Dom" },
];

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

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const fieldId = `field-${label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48)}`;
  return (
    <div className="space-y-2">
      <Label htmlFor={fieldId}>{label}</Label>
      <div
        className="contents [&_input]:scroll-mt-20 [&_textarea]:scroll-mt-20 [&_button]:scroll-mt-20"
        // Associa o label ao primeiro controlo nativo / botão trigger.
        ref={(node) => {
          if (!node) return;
          const el = node.querySelector<HTMLElement>(
            "input, textarea, select, button",
          );
          if (el && !el.id) el.id = fieldId;
        }}
      >
        {children}
      </div>
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
