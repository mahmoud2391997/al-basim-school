import { useCallback, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  Upload,
  X,
} from "lucide-react";
import {
  type EntityType,
  type ImportRow,
  getSchema,
  parseImportFile,
} from "@/utils/import-export";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: EntityType;
  onImport: (rows: Record<string, any>[]) => Promise<void> | void;
  t: (en: string, ar: string) => string;
}

export function ImportDialog({
  open,
  onOpenChange,
  entityType,
  onImport,
  t,
}: ImportDialogProps) {
  const schema = getSchema(entityType);
  const fileRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<"pick" | "preview" | "importing" | "done">("pick");
  const [result, setResult] = useState<ImportRow[] | null>(null);
  const [error, setError] = useState("");
  const [imported, setImported] = useState(0);

  const reset = useCallback(() => {
    setStage("pick");
    setResult(null);
    setError("");
    setImported(0);
    if (fileRef.current) fileRef.current.value = "";
  }, []);

  const handleFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        setError("");
        const parsed = await parseImportFile(file, entityType);
        setResult(parsed.rows);
        setStage("preview");
      } catch {
        setError(t("Failed to parse file. Please use the template.", "فشل تحليل الملف. يرجى استخدام القالب."));
        setStage("pick");
      }
    },
    [entityType, t],
  );

  const handleConfirm = useCallback(async () => {
    if (!result) return;
    const valid = result
      .filter((r) => r.errors.length === 0)
      .map((r) => r.raw);
    if (!valid.length) return;
    setStage("importing");
    try {
      await onImport(valid);
      setImported(valid.length);
      setStage("done");
    } catch {
      setError(t("Import failed. Please try again.", "فشل الاستيراد. يرجى المحاولة مرة أخرى."));
      setStage("preview");
    }
  }, [result, onImport, t]);

  const handleClose = useCallback(
    (val: boolean) => {
      if (!val) reset();
      onOpenChange(val);
    },
    [onOpenChange, reset],
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload size={18} className="text-[#263064]" />
            {t("Import", "استيراد")} {schema.label}
          </DialogTitle>
          <DialogDescription>
            {t(
              "Upload a filled Excel file (.xlsx) to bulk-add records.",
              "ارفع ملف Excel (.xlsx) مملوء لإضافة سجلات بالجملة.",
            )}
          </DialogDescription>
        </DialogHeader>

        {stage === "pick" && (
          <div className="space-y-4">
            <div
              className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 px-6 py-12 text-center transition-colors hover:border-primary/50 hover:bg-muted/50 cursor-pointer"
              onClick={() => fileRef.current?.click()}
              data-testid={`dropzone-import-${entityType}`}
            >
              <Upload size={36} className="mb-3 text-muted-foreground/60" />
              <p className="text-sm font-medium text-foreground">
                {t("Click to browse or drag an .xlsx file here", "انقر للتصفح أو اسحب ملف .xlsx هنا")}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {schema.columns.filter((c) => c.required).length} {t("required fields", "حقول مطلوبة")} · {schema.columns.length} {t("total columns", "إجمالي الأعمدة")}
              </p>
              <p className="mt-3 text-[10px] text-muted-foreground">
                {t(
                  "Don't have a file? Use the Template button above to download one first.",
                  "ليس لديك ملف؟ استخدم زر القالب أعلاه لتحميل واحد أولاً.",
                )}
              </p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleFile}
              data-testid={`input-import-file-${entityType}`}
            />
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertTriangle size={14} />
                {error}
              </div>
            )}
          </div>
        )}

        {stage === "preview" && result && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <span className="flex items-center gap-1.5 text-[#32B77E]">
                <Check size={14} />
                {result.filter((r) => r.errors.length === 0).length} {t("valid", "صحيح")}
              </span>
              {result.filter((r) => r.errors.length > 0).length > 0 && (
                <span className="flex items-center gap-1.5 text-destructive">
                  <AlertTriangle size={14} />
                  {result.filter((r) => r.errors.length > 0).length} {t("with errors", "بهذا الخطأ")}
                </span>
              )}
            </div>

            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-[#263064]/5">
                    <th className="px-2 py-2 text-start font-bold uppercase tracking-wider text-muted-foreground w-8">#</th>
                    {schema.columns.slice(0, 6).map((col) => (
                      <th
                        key={col.key}
                        className="px-3 py-2 text-start font-bold uppercase tracking-wider text-muted-foreground"
                      >
                        {col.header}
                        {col.required && <span className="text-destructive">*</span>}
                      </th>
                    ))}
                    <th className="px-3 py-2 text-start font-bold uppercase tracking-wider text-muted-foreground">
                      {t("Issues", "المشكلات")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {result.slice(0, 50).map((row) => (
                    <tr
                      key={row.index}
                      className={`border-b border-border/50 ${row.errors.length ? "bg-destructive/5" : ""}`}
                    >
                      <td className="px-2 py-1.5 text-muted-foreground">{row.index + 1}</td>
                      {schema.columns.slice(0, 6).map((col) => (
                        <td key={col.key} className="px-3 py-1.5 max-w-[150px] truncate">
                          {String(row.raw[col.key] ?? "")}
                        </td>
                      ))}
                      <td className="px-3 py-1.5">
                        {row.errors.length > 0 && (
                          <span className="text-destructive" title={row.errors.join(", ")}>
                            {row.errors.length} {t("error(s)", "خطأ/أخطاء")}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {result.length > 50 && (
                <div className="px-3 py-2 text-xs text-muted-foreground border-t border-border/50">
                  {t(`Showing 50 of ${result.length} rows`, `عرض 50 من أصل ${result.length} صف`)}
                </div>
              )}
            </div>
          </div>
        )}

        {stage === "importing" && (
          <div className="flex items-center justify-center py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="ml-3 text-sm text-muted-foreground">{t("Importing…", "جارٍ الاستيراد…")}</span>
          </div>
        )}

        {stage === "done" && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#32B77E]/15">
              <Check size={24} className="text-[#32B77E]" />
            </div>
            <p className="text-sm font-medium">
              {t(`${imported} records imported successfully`, `تم استيراد ${imported} سجل بنجاح`)}
            </p>
          </div>
        )}

        <DialogFooter>
          {stage === "pick" && (
            <Button variant="outline" onClick={() => handleClose(false)} data-testid="button-cancel-import">
              {t("Cancel", "إلغاء")}
            </Button>
          )}
          {stage === "preview" && (
            <>
              <Button variant="outline" onClick={reset} data-testid="button-back-import">
                <X size={14} className="mr-1" />
                {t("Back", "رجوع")}
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={!result?.some((r) => r.errors.length === 0)}
                className="bg-[#263064] text-[#FCFBF0] hover:bg-[#263064]/85"
                data-testid="button-confirm-import"
              >
                {t("Import", "استيراد")} {result?.filter((r) => r.errors.length === 0).length ?? 0} {t("records", "سجل")}
              </Button>
            </>
          )}
          {stage === "done" && (
            <Button onClick={() => handleClose(false)} className="bg-[#263064] text-[#FCFBF0] hover:bg-[#263064]/85" data-testid="button-done-import">
              {t("Done", "تم")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
