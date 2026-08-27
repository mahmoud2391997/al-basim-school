import { Download, FileSpreadsheet, FileText, FileType, Upload, Database } from "lucide-react";
import {
  type EntityType,
  exportToExcel,
  exportToPDF,
  exportToDOCX,
  downloadTemplate,
  downloadSampleData,
} from "@/utils/import-export";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface ExportMenuProps {
  entityType: EntityType;
  data: Record<string, any>[];
  t: (en: string, ar: string) => string;
}

export function ExportMenu({ entityType, data, t }: ExportMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          data-testid={`button-export-${entityType}`}
        >
          <Download size={14} />
          {t("Export", "تصدير")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => exportToExcel(data, entityType)}
          className="gap-2 cursor-pointer"
          data-testid={`button-export-${entityType}-excel`}
        >
          <FileSpreadsheet size={14} className="text-[#32B77E]" />
          {t("Export as Excel", "تصدير كملف Excel")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => exportToPDF(data, entityType)}
          className="gap-2 cursor-pointer"
          data-testid={`button-export-${entityType}-pdf`}
        >
          <FileText size={14} className="text-[#E53935]" />
          {t("Export as PDF", "تصدير كملف PDF")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => exportToDOCX(data, entityType)}
          className="gap-2 cursor-pointer"
          data-testid={`button-export-${entityType}-docx`}
        >
          <FileType size={14} className="text-[#263064]" />
          {t("Export as Word", "تصدير كملف Word")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => downloadTemplate(entityType)}
          className="gap-2 cursor-pointer"
          data-testid={`button-download-template-${entityType}`}
        >
          <Upload size={14} className="text-[#EC9F42]" />
          {t("Download import template", "تحميل قالب الاستيراد")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => downloadSampleData(entityType)}
          className="gap-2 cursor-pointer"
          data-testid={`button-download-sample-${entityType}`}
        >
          <Database size={14} className="text-[#14BAC6]" />
          {t("Download sample data", "تحميل بيانات تجريبية")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
