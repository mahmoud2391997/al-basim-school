import { useState } from "react";
import {
  ChevronDown,
  LogOut,
  Settings2,
  BookOpen,
  GraduationCap,
  FileSpreadsheet,
  Globe,
  Check,
  Shield,
  User,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserNavDropdownProps {
  t: (en: string, ar: string) => string;
  language: "en" | "ar";
  onLanguageChange: (lang: "en" | "ar") => void;
  onNavigate: (path: string) => void;
}

export function UserNavDropdown({
  t,
  language,
  onLanguageChange,
  onNavigate,
}: UserNavDropdownProps) {
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("school-auth-token") || ""}`,
        },
      });
    } catch {
      // ignore
    }
    localStorage.removeItem("school-auth-token");
    window.location.reload();
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} dir={language === "ar" ? "rtl" : "ltr"}>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 rounded-lg p-1.5 transition-all hover:bg-card focus:outline-none focus:ring-2 focus:ring-primary/20"
          data-testid="button-user-menu"
          aria-label={t("User profile & menu", "الملف الشخصي والقائمة")}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#14BAC6]/15 text-[11px] font-bold text-[#14BAC6] shadow-sm">
            LA
          </div>
          <div className="hidden text-start sm:block">
            <span className="block text-xs font-semibold text-foreground">
              {t("Library Admin", "أمين المكتبة")}
            </span>
          </div>
          <ChevronDown
            size={14}
            className={`hidden text-muted-foreground transition-transform duration-200 sm:block ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={language === "ar" ? "start" : "end"}
        sideOffset={8}
        className="w-64 p-1.5 shadow-xl border-border bg-card"
      >
        {/* Profile Info */}
        <DropdownMenuLabel className="p-2 font-normal">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#DBB46C]/20 text-sm font-bold text-[#263064]">
              LA
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-bold text-foreground">
                {t("Library Admin", "أمين المكتبة")}
              </div>
              <div className="truncate text-[11px] text-muted-foreground">
                admin@albassamschool.edu.sa
              </div>
              <div className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-[#14BAC6]">
                <Shield size={11} />
                <span>{t("System Administrator", "مسؤول النظام")}</span>
              </div>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Quick Navigation Items */}
        <DropdownMenuItem
          onClick={() => onNavigate("/library/analytics")}
          className="cursor-pointer gap-2.5 px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"
          data-testid="menu-item-analytics"
        >
          <FileSpreadsheet size={15} className="text-muted-foreground" />
          <span>{t("Library Analytics & Reports", "تحليلات وتقارير المكتبة")}</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => onNavigate("/library/borrows")}
          className="cursor-pointer gap-2.5 px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"
          data-testid="menu-item-borrows"
        >
          <BookOpen size={15} className="text-muted-foreground" />
          <span>{t("Manage Borrows", "إدارة الإعارات")}</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => onNavigate("/students")}
          className="cursor-pointer gap-2.5 px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"
          data-testid="menu-item-students"
        >
          <GraduationCap size={15} className="text-muted-foreground" />
          <span>{t("Student Directory", "دليل الطلاب")}</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => onNavigate("/settings")}
          className="cursor-pointer gap-2.5 px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"
          data-testid="menu-item-settings"
        >
          <Settings2 size={15} className="text-muted-foreground" />
          <span>{t("System Settings", "إعدادات النظام")}</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Language Selection */}
        <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Globe size={12} />
            <span>{t("Interface Language", "لغة الواجهة")}</span>
          </div>
        </div>

        <DropdownMenuItem
          onClick={() => onLanguageChange("ar")}
          className={`cursor-pointer justify-between px-3 py-1.5 text-xs ${
            language === "ar" ? "font-bold text-primary bg-primary/5" : "text-muted-foreground"
          }`}
          data-testid="menu-item-lang-ar"
        >
          <span>العربية (Arabic)</span>
          {language === "ar" && <Check size={14} className="text-primary" />}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => onLanguageChange("en")}
          className={`cursor-pointer justify-between px-3 py-1.5 text-xs ${
            language === "en" ? "font-bold text-primary bg-primary/5" : "text-muted-foreground"
          }`}
          data-testid="menu-item-lang-en"
        >
          <span>English (الإنجليزية)</span>
          {language === "en" && <Check size={14} className="text-primary" />}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Logout */}
        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer gap-2.5 px-3 py-2 text-xs font-semibold text-[#B92327] hover:bg-[#B92327]/10 focus:bg-[#B92327]/10 focus:text-[#B92327]"
          data-testid="menu-item-logout"
        >
          <LogOut size={15} />
          <span>{t("Log out", "تسجيل الخروج")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
