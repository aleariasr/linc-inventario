"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FilePlus2,
  RefreshCw,
  Equal,
  Replace,
  PlusCircle,
} from "lucide-react";
import { applyImport, previewImport, type ImportPreview } from "@/server/actions/import";
import type { ImportMode } from "@/lib/inventory-import";
import { cn } from "@/lib/cn";
import { formatDelta, formatNumber } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { toast } from "@/components/ui/toaster";

const MODES: { value: ImportMode; title: string; description: string; icon: typeof Replace }[] = [
  {
    value: "replace",
    title: "Sincronizar cantidades",
    description: "El Excel es la verdad: las cantidades quedan igual que en el archivo.",
    icon: Replace,
  },
  {
    value: "add",
    title: "Sumar como entrada",
    description: "Las cantidades del archivo se suman a las existentes (ej. un pedido nuevo).",
    icon: PlusCircle,
  },
];

const PREVIEW_LIMIT = 100;

type Step =
  { name: "select" } | { name: "preview"; preview: ImportPreview } | { name: "done"; message: string };

export function ImportWizard() {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<ImportMode>("replace");
  const [step, setStep] = useState<Step>({ name: "select" });
  const [pending, startTransition] = useTransition();

  const formData = () => {
    const data = new FormData();
    data.set("file", file!);
    data.set("mode", mode);
    return data;
  };

  const analyze = () =>
    startTransition(async () => {
      const result = await previewImport(formData());
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setStep({ name: "preview", preview: result.data! });
    });

  const confirm = () =>
    startTransition(async () => {
      const result = await applyImport(formData());
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message);
      setStep({ name: "done", message: result.message });
    });

  const reset = () => {
    setFile(null);
    setStep({ name: "select" });
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={step.name}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
      >
        {step.name === "select" && (
          <Card>
            <CardBody className="space-y-6">
              <FileDropzone
                file={file}
                onFileChange={setFile}
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                hint="Archivo .xlsx de hasta 5 MB con columnas Código, Nombre, Cantidad y Ubicación."
                disabled={pending}
              />
              <fieldset className="space-y-3">
                <legend className="mb-3 text-[13px] font-medium text-fg">
                  ¿Qué hacer con los ítems que ya existen?
                </legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {MODES.map(({ value, title, description, icon: Icon }) => (
                    <label
                      key={value}
                      className={cn(
                        "flex cursor-pointer gap-3 rounded-lg border p-4 transition-colors",
                        mode === value
                          ? "border-primary bg-primary-soft/40 ring-1 ring-primary"
                          : "border-border hover:border-border-strong",
                      )}
                    >
                      <input
                        type="radio"
                        name="mode"
                        value={value}
                        checked={mode === value}
                        onChange={() => setMode(value)}
                        className="sr-only"
                      />
                      <Icon
                        className={cn(
                          "mt-0.5 size-5 shrink-0",
                          mode === value ? "text-primary" : "text-fg-subtle",
                        )}
                      />
                      <span className="space-y-1">
                        <span className="block text-sm font-medium text-fg">{title}</span>
                        <span className="block text-sm text-fg-muted">{description}</span>
                      </span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-fg-subtle">
                  Los ítems se identifican por su código. Los códigos nuevos se crean y las ubicaciones nuevas
                  se agregan automáticamente.
                </p>
              </fieldset>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                <a href="/api/export?template=1" className={buttonVariants({ variant: "ghost" })} download>
                  Descargar plantilla
                </a>
                <Button onClick={analyze} disabled={!file} loading={pending}>
                  Analizar archivo
                  <ArrowRight />
                </Button>
              </div>
            </CardBody>
          </Card>
        )}

        {step.name === "preview" && (
          <PreviewStep
            preview={step.preview}
            pending={pending}
            onBack={() => setStep({ name: "select" })}
            onConfirm={confirm}
          />
        )}

        {step.name === "done" && (
          <Card>
            <CardBody className="flex flex-col items-center gap-4 py-14 text-center">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", bounce: 0.5 }}
                className="grid size-14 place-items-center rounded-full bg-success-soft text-success-soft-fg"
              >
                <CheckCircle2 className="size-7" />
              </motion.div>
              <div className="space-y-1">
                <p className="text-lg font-semibold text-fg">¡Listo!</p>
                <p className="text-sm text-fg-muted">{step.message}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={reset}>
                  Importar otro archivo
                </Button>
                <Link href="/inventario" className={buttonVariants()}>
                  Ver inventario
                </Link>
              </div>
            </CardBody>
          </Card>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

function PreviewStep({
  preview,
  pending,
  onBack,
  onConfirm,
}: {
  preview: ImportPreview;
  pending: boolean;
  onBack: () => void;
  onConfirm: () => void;
}) {
  const { plan, errors } = preview;
  const changes = plan.creates.length + plan.updates.length;

  const summary = [
    {
      label: "Nuevos",
      value: plan.creates.length,
      icon: FilePlus2,
      tone: "text-primary-soft-fg bg-primary-soft",
    },
    {
      label: "Actualizados",
      value: plan.updates.length,
      icon: RefreshCw,
      tone: "text-warning-soft-fg bg-warning-soft",
    },
    { label: "Sin cambios", value: plan.unchanged, icon: Equal, tone: "text-fg-muted bg-surface-sunken" },
    {
      label: "Con errores",
      value: errors.length,
      icon: AlertTriangle,
      tone: "text-danger-soft-fg bg-danger-soft",
    },
  ];

  const rows = [
    ...plan.creates.map((r) => ({
      kind: "new" as const,
      ...r,
      before: null as number | null,
      after: r.quantity,
      delta: r.quantity,
    })),
    ...plan.updates.map((r) => ({
      kind: "update" as const,
      ...r,
      before: r.previous.quantity,
      after: r.nextQuantity,
    })),
  ].sort((a, b) => a.row - b.row);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Vista previa</CardTitle>
            <p className="mt-0.5 text-sm text-fg-muted">
              {preview.fileName} · {formatNumber(preview.totalRows)} filas ·{" "}
              {preview.mode === "add" ? "Sumar como entrada" : "Sincronizar cantidades"}
            </p>
          </div>
        </CardHeader>
        <CardBody className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {summary.map(({ label, value, icon: Icon, tone }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 rounded-lg border border-border p-3"
            >
              <span className={cn("grid size-9 place-items-center rounded-md", tone)}>
                <Icon className="size-4" aria-hidden />
              </span>
              <span>
                <span className="block text-xl font-semibold text-fg tabular">{formatNumber(value)}</span>
                <span className="block text-xs text-fg-muted">{label}</span>
              </span>
            </motion.div>
          ))}
        </CardBody>
      </Card>

      {errors.length > 0 && (
        <Card className="border-danger/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-danger">
              <AlertTriangle className="size-4" aria-hidden />
              Filas que no se importarán
            </CardTitle>
          </CardHeader>
          <ul className="max-h-56 divide-y divide-border overflow-y-auto text-sm">
            {errors.map((e) => (
              <li key={e.row} className="flex gap-3 px-5 py-2.5">
                <span className="w-16 shrink-0 text-fg-subtle tabular">Fila {e.row}</span>
                <span className="text-fg">{e.message}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {rows.length > 0 && (
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Cambios a aplicar</CardTitle>
            {rows.length > PREVIEW_LIMIT && (
              <span className="text-xs text-fg-subtle">
                Mostrando {PREVIEW_LIMIT} de {formatNumber(rows.length)}
              </span>
            )}
          </CardHeader>
          <div className="max-h-[28rem] overflow-y-auto">
            <Table>
              <THead className="sticky top-0 z-10 bg-surface-muted">
                <tr>
                  <TH>Fila</TH>
                  <TH>Código</TH>
                  <TH>Nombre</TH>
                  <TH className="hidden sm:table-cell">Ubicación</TH>
                  <TH className="text-right">Cantidad</TH>
                </tr>
              </THead>
              <TBody>
                {rows.slice(0, PREVIEW_LIMIT).map((r) => (
                  <TR key={r.code}>
                    <TD className="text-fg-subtle tabular">{r.row}</TD>
                    <TD className="font-mono text-[13px] text-fg-muted">{r.code}</TD>
                    <TD>
                      <span className="flex items-center gap-2">
                        <span className="text-fg">{r.name}</span>
                        {r.kind === "new" && <Badge tone="primary">Nuevo</Badge>}
                      </span>
                    </TD>
                    <TD className="hidden text-fg-muted sm:table-cell">{r.location ?? "—"}</TD>
                    <TD className="text-right whitespace-nowrap tabular">
                      {r.before !== null && r.before !== r.after ? (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="text-fg-subtle line-through">{formatNumber(r.before)}</span>
                          <span className="font-semibold text-fg">{formatNumber(r.after)}</span>
                          <span className={cn("text-xs", r.delta > 0 ? "text-success" : "text-danger")}>
                            ({formatDelta(r.delta)})
                          </span>
                        </span>
                      ) : (
                        <span className="font-semibold text-fg">{formatNumber(r.after)}</span>
                      )}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>
        </Card>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onBack} disabled={pending}>
          Volver
        </Button>
        <Button onClick={onConfirm} loading={pending} disabled={changes === 0}>
          {changes === 0 ? "No hay cambios que aplicar" : `Aplicar ${formatNumber(changes)} cambios`}
        </Button>
      </div>
    </div>
  );
}
