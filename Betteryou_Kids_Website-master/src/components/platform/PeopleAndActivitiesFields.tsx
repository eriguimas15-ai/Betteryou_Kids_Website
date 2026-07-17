import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import {
  emptyEmergency,
  emptyGuardian,
  formatActivityPriceLabel,
  type ActivityOption,
  type EmergencyForm,
  type GuardianForm,
} from "@/lib/shared-form";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}

export function GuardiansEditor({
  value,
  onChange,
}: {
  value: GuardianForm[];
  onChange: (next: GuardianForm[]) => void;
}) {
  const update = (index: number, patch: Partial<GuardianForm>) => {
    onChange(
      value.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle className="text-lg">Encarregados de educação</CardTitle>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...value, emptyGuardian()])}
        >
          <Plus className="mr-1 h-4 w-4" />
          Adicionar
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {value.map((guardian, index) => (
          <div
            key={index}
            className="space-y-4 rounded-lg border border-border/70 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold">
                Encarregado {index + 1}
                {index === 0 ? " (principal)" : ""}
              </p>
              {value.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    onChange(value.filter((_, i) => i !== index))
                  }
                  aria-label={`Remover encarregado ${index + 1}`}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome completo">
                <Input
                  required={index === 0}
                  value={guardian.fullName}
                  onChange={(e) => update(index, { fullName: e.target.value })}
                />
              </Field>
              <Field label="N.º de identificação">
                <Input
                  required={index === 0}
                  value={guardian.idNumber}
                  onChange={(e) => update(index, { idNumber: e.target.value })}
                />
              </Field>
              <Field label="Telefone">
                <Input
                  required={index === 0}
                  value={guardian.phone}
                  onChange={(e) => update(index, { phone: e.target.value })}
                />
              </Field>
              <Field label="Telefone alternactivo">
                <Input
                  value={guardian.altPhone}
                  onChange={(e) => update(index, { altPhone: e.target.value })}
                />
              </Field>
              <Field label="Email">
                <Input
                  required={index === 0}
                  type="email"
                  value={guardian.email}
                  onChange={(e) => update(index, { email: e.target.value })}
                />
              </Field>
              <Field label="Profissão">
                <Input
                  required={index === 0}
                  value={guardian.profession}
                  onChange={(e) =>
                    update(index, { profession: e.target.value })
                  }
                />
              </Field>
              <Field label="Parentesco">
                <Input
                  required={index === 0}
                  value={guardian.relationship}
                  onChange={(e) =>
                    update(index, { relationship: e.target.value })
                  }
                />
              </Field>
              <Field label="Morada">
                <Input
                  required={index === 0}
                  value={guardian.address}
                  onChange={(e) => update(index, { address: e.target.value })}
                />
              </Field>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function EmergenciesEditor({
  value,
  onChange,
}: {
  value: EmergencyForm[];
  onChange: (next: EmergencyForm[]) => void;
}) {
  const update = (index: number, patch: Partial<EmergencyForm>) => {
    onChange(
      value.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle className="text-lg">Contactos de emergência</CardTitle>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...value, emptyEmergency()])}
        >
          <Plus className="mr-1 h-4 w-4" />
          Adicionar
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {value.map((contact, index) => (
          <div
            key={index}
            className="space-y-4 rounded-lg border border-border/70 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold">Contacto {index + 1}</p>
              {value.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    onChange(value.filter((_, i) => i !== index))
                  }
                  aria-label={`Remover contacto ${index + 1}`}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome">
                <Input
                  required={index === 0}
                  value={contact.name}
                  onChange={(e) => update(index, { name: e.target.value })}
                />
              </Field>
              <Field label="Telefone">
                <Input
                  required={index === 0}
                  value={contact.phone}
                  onChange={(e) => update(index, { phone: e.target.value })}
                />
              </Field>
              <Field label="Relação">
                <Input
                  required={index === 0}
                  value={contact.relation}
                  onChange={(e) => update(index, { relation: e.target.value })}
                />
              </Field>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function ActivitiesPicker({
  options,
  value,
  onChange,
  serviceName,
}: {
  options: ActivityOption[];
  value: string[];
  onChange: (next: string[]) => void;
  /** Quando definido, mostra contexto do serviço seleccionado. */
  serviceName?: string;
}) {
  const toggle = (name: string) => {
    onChange(
      value.includes(name)
        ? value.filter((item) => item !== name)
        : [...value, name],
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Actividades extracurriculares</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-muted-foreground">
          {serviceName
            ? `Actividades disponíveis para ${serviceName}. Seleccione as pretendidas (opcional).`
            : "Seleccione as actividades pretendidas (opcional)."}
        </p>
        {options.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Não há actividades extracurriculares para o serviço seleccionado.
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {options.map((option) => {
              const checked = value.includes(option.name);
              const priceLabel = formatActivityPriceLabel(option);
              return (
                <label
                  key={option.name}
                  className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm transition ${
                    checked
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/40"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={checked}
                      onChange={() => toggle(option.name)}
                    />
                    <span>{option.name}</span>
                  </span>
                  {priceLabel && (
                    <span
                      className={`shrink-0 text-xs font-medium ${
                        option.pricing === "INCLUDED"
                          ? "text-green"
                          : "text-muted-foreground"
                      }`}
                    >
                      {priceLabel}
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
