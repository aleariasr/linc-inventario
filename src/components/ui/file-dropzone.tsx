"use client";

import { useId, useRef, useState } from "react";
import { motion } from "motion/react";
import { FileSpreadsheet, UploadCloud, X } from "lucide-react";
import { cn } from "@/lib/cn";

function formatBytes(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function FileDropzone({
  file,
  onFileChange,
  accept,
  hint,
  disabled,
}: {
  file: File | null;
  onFileChange: (file: File | null) => void;
  accept: string;
  hint?: string;
  disabled?: boolean;
}) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  if (file) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-4 rounded-lg border border-border bg-surface-muted/60 p-4"
      >
        <div className="grid size-11 shrink-0 place-items-center rounded-lg bg-success-soft text-success-soft-fg">
          <FileSpreadsheet className="size-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-fg">{file.name}</p>
          <p className="text-xs text-fg-subtle">{formatBytes(file.size)}</p>
        </div>
        <button
          type="button"
          onClick={() => onFileChange(null)}
          disabled={disabled}
          aria-label="Quitar archivo"
          className="grid size-8 place-items-center rounded-md text-fg-subtle transition-colors hover:bg-surface-sunken hover:text-fg disabled:opacity-50"
        >
          <X className="size-4" />
        </button>
      </motion.div>
    );
  }

  return (
    <label
      htmlFor={id}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const dropped = e.dataTransfer.files[0];
        if (dropped) onFileChange(dropped);
      }}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-6 py-12 text-center transition-colors",
        dragging
          ? "border-primary bg-primary-soft/50"
          : "border-border-strong hover:border-primary hover:bg-surface-muted/50",
      )}
    >
      <motion.div
        animate={dragging ? { y: -4, scale: 1.05 } : { y: 0, scale: 1 }}
        className="grid size-12 place-items-center rounded-xl bg-primary-soft text-primary-soft-fg"
      >
        <UploadCloud className="size-6" aria-hidden />
      </motion.div>
      <div className="space-y-1">
        <p className="font-medium text-fg">
          Arrastra tu archivo aquí o <span className="text-primary">búscalo en tu equipo</span>
        </p>
        {hint && <p className="text-sm text-fg-muted">{hint}</p>}
      </div>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        className="sr-only"
        disabled={disabled}
        onChange={(e) => {
          onFileChange(e.target.files?.[0] ?? null);
          e.target.value = "";
        }}
      />
    </label>
  );
}
