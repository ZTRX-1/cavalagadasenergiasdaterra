import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Loader2 } from "lucide-react";

export function AdminUploader({
  onFiles,
  accept,
  multiple = true,
  hint,
}: {
  onFiles: (files: File[]) => Promise<void> | void;
  accept?: Record<string, string[]>;
  multiple?: boolean;
  hint?: string;
}) {
  const [busy, setBusy] = useState(false);

  const onDrop = useCallback(
    async (files: File[]) => {
      if (!files.length) return;
      setBusy(true);
      try {
        await onFiles(files);
      } finally {
        setBusy(false);
      }
    },
    [onFiles],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple,
    accept,
  });

  return (
    <div
      {...getRootProps()}
      className={`group relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-10 text-center transition-all ${
        isDragActive
          ? "border-[color:var(--admin-dourado)] bg-[color:var(--admin-dourado)]/8"
          : "border-[color:var(--admin-borda-strong)] hover:border-[color:var(--admin-dourado)]/60 hover:bg-[color:var(--admin-petroleo)]/30"
      }`}
    >
      <input {...getInputProps()} />
      {busy ? (
        <Loader2 className="h-7 w-7 animate-spin text-[color:var(--admin-dourado)]" />
      ) : (
        <Upload className="h-7 w-7 text-[color:var(--admin-dourado)]" strokeWidth={1.4} />
      )}
      <div className="space-y-1">
        <p className="text-sm font-medium text-[color:var(--admin-cinza-1)]">
          {busy ? "Enviando..." : "Arraste arquivos ou clique para selecionar"}
        </p>
        {hint ? <p className="text-xs text-[color:var(--admin-cinza-3)]">{hint}</p> : null}
      </div>
    </div>
  );
}
