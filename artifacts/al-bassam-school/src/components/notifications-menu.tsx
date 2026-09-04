import { useState, useMemo, useEffect } from "react";
import { getActionNotifications, READ_KEY, subscribeToActionNotifications, type ActionNotification } from "@/utils/action-notifications";
import {
  Bell,
  AlertTriangle,
  Clock3,
  CircleCheck,
  Package,
  ChevronRight,
} from "lucide-react";
import {
  useGetBorrows,
  useGetBooks,
  getGetBorrowsQueryKey,
  getGetBooksQueryKey,
} from "@workspace/api-client-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

export interface NotificationItem {
  id: string;
  type: "action" | "overdue" | "dueSoon" | "returned" | "stock";
  title: string;
  message: string;
  badgeText: string;
  date?: string;
  targetPath: string;
  severity: "danger" | "warning" | "info" | "success" | "neutral";
}

interface NotificationsMenuProps {
  t: (en: string, ar: string) => string;
  language: "en" | "ar";
  onNavigate: (path: string) => void;
}

export function NotificationsMenu({
  t,
  language,
  onNavigate,
}: NotificationsMenuProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "all" | "overdue" | "dueSoon" | "returned"
  >("all");

  const [readIds, setReadIds] = useState<Set<string>>(() => {
    try {
      const stored = JSON.parse(window.localStorage.getItem(READ_KEY) || "[]");
      return new Set(Array.isArray(stored) ? stored.filter((id): id is string => typeof id === "string") : []);
    } catch {
      return new Set();
    }
  });
  const [actionNotifications, setActionNotifications] = useState<ActionNotification[]>(() => getActionNotifications());

  useEffect(() => subscribeToActionNotifications((item) => setActionNotifications((current) => [item, ...current.filter((existing) => existing.id !== item.id)].slice(0, 50))), []);

  const saveReadIds = (newSet: Set<string>) => {
    setReadIds(newSet);
    window.localStorage.setItem(READ_KEY, JSON.stringify(Array.from(newSet).slice(-200)));
  };

  const markAllAsRead = () => {
    const next = new Set(readIds);
    allNotifications.forEach((n) => next.add(n.id));
    saveReadIds(next);
  };

  const markSingleAsRead = (id: string) => {
    if (!readIds.has(id)) {
      const next = new Set(readIds);
      next.add(id);
      saveReadIds(next);
    }
  };

  const borrowsQuery = useGetBorrows(undefined, {
    query: { queryKey: getGetBorrowsQueryKey(undefined), refetchInterval: 30000 },
  });
  const booksQuery = useGetBooks(undefined, {
    query: { queryKey: getGetBooksQueryKey(undefined), refetchInterval: 60000 },
  });

  const borrows = Array.isArray(borrowsQuery.data) ? borrowsQuery.data : [];
  const books = Array.isArray(booksQuery.data) ? booksQuery.data : [];

  const allNotifications = useMemo(() => {
    const items: NotificationItem[] = [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // 1. Active borrow deadlines (Overdue, Due Today, Due Soon)
    for (const b of borrows) {
      if (!b.returnedAt && b.dueDate) {
        const due = new Date(b.dueDate);
        due.setHours(0, 0, 0, 0);
        const diffMs = due.getTime() - now.getTime();
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
          // Overdue
          const daysOverdue = Math.abs(diffDays);
          items.push({
            id: `overdue-${b.id}`,
            type: "overdue",
            title: t("Overdue Return", "إعارة متأخرة"),
            message: t(
              `"${b.bookTitle || "Book"}" borrowed by ${b.borrowerName || "Borrower"} is ${daysOverdue} day(s) overdue.`,
              `كتاب "${b.bookTitle || "الكتاب"}" المستعار من ${b.borrowerName || "المستعير"} متأخر بمقدار ${daysOverdue} يوم.`,
            ),
            badgeText: t(`${daysOverdue}d overdue`, `متأخر ${daysOverdue} يوم`),
            date: b.dueDate,
            targetPath: "/library/borrows",
            severity: "danger",
          });
        } else if (diffDays === 0) {
          // Due Today
          items.push({
            id: `due-today-${b.id}`,
            type: "dueSoon",
            title: t("Return Due Today", "موعد الإرجاع اليوم"),
            message: t(
              `"${b.bookTitle || "Book"}" borrowed by ${b.borrowerName || "Borrower"} is due for return today.`,
              `كتاب "${b.bookTitle || "الكتاب"}" المستعار من ${b.borrowerName || "المستعير"} يستحق الإرجاع اليوم.`,
            ),
            badgeText: t("Due Today", "مستحق اليوم"),
            date: b.dueDate,
            targetPath: "/library/borrows",
            severity: "warning",
          });
        } else if (diffDays <= 3) {
          // Due Soon (within 1-3 days)
          items.push({
            id: `due-soon-${b.id}`,
            type: "dueSoon",
            title: t("Return Due Soon", "يقترب موعد الإرجاع"),
            message: t(
              `"${b.bookTitle || "Book"}" borrowed by ${b.borrowerName || "Borrower"} is due in ${diffDays} day(s).`,
              `كتاب "${b.bookTitle || "الكتاب"}" المستعار من ${b.borrowerName || "المستعير"} يستحق الإرجاع خلال ${diffDays} أيام.`,
            ),
            badgeText: t(`In ${diffDays}d`, `خلال ${diffDays} أيام`),
            date: b.dueDate,
            targetPath: "/library/borrows",
            severity: "info",
          });
        }
      }

      // 2. Recent returns (within last 7 days)
      if (b.returnedAt) {
        const retDate = new Date(b.returnedAt);
        retDate.setHours(0, 0, 0, 0);
        const diffMs = now.getTime() - retDate.getTime();
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays <= 7 && diffDays >= 0) {
          const isDamaged = b.condition === "damaged";
          const isLost = b.condition === "lost";

          items.push({
            id: `returned-${b.id}`,
            type: "returned",
            title: isDamaged
              ? t("Returned Damaged", "أُرجع بحالة تالفة")
              : isLost
                ? t("Marked as Lost", "سُجل كمفقود")
                : t("Book Returned", "تم إرجاع الكتاب"),
            message: t(
              `"${b.bookTitle || "Book"}" was returned by ${b.borrowerName || "Borrower"}${isDamaged ? " (damaged condition)" : isLost ? " (lost)" : ""}.`,
              `تم إرجاع كتاب "${b.bookTitle || "الكتاب"}" بواسطة ${b.borrowerName || "المستعير"}${isDamaged ? " (بحالة تالفة)" : isLost ? " (مفقود)" : ""}.`,
            ),
            badgeText: isDamaged
              ? t("Damaged", "تالف")
              : isLost
                ? t("Lost", "مفقود")
                : t("Returned", "تم الإرجاع"),
            date: b.returnedAt,
            targetPath: "/library/history",
            severity: isDamaged || isLost ? "warning" : "success",
          });
        }
      }
    }

    // 3. Out of stock / zero available books
    for (const bk of books) {
      if ((bk.availableCopies ?? bk.copies) === 0 && bk.copies > 0) {
        items.push({
          id: `stock-${bk.id}`,
          type: "stock",
          title: t("All Copies Loaned", "نفاد النسخ المتاحة"),
          message: t(
            `All ${bk.copies} copies of "${bk.title}" are currently borrowed.`,
            `جميع نسخ كتاب "${bk.title}" (${bk.copies} نسخ) معارة حالياً.`,
          ),
          badgeText: t("0 Available", "0 متاح"),
          targetPath: "/library",
          severity: "neutral",
        });
      }
    }

    const actions: NotificationItem[] = actionNotifications.map((item) => ({ ...item }));
    return [...actions, ...items].sort((a, b) => {
      if (a.type === "action" && b.type !== "action") return -1;
      if (b.type === "action" && a.type !== "action") return 1;
      return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
    });
  }, [borrows, books, t, actionNotifications]);

  const filteredNotifications = useMemo(() => {
    if (activeTab === "all") return allNotifications;
    if (activeTab === "overdue") return allNotifications.filter((n) => n.type === "overdue");
    if (activeTab === "dueSoon") return allNotifications.filter((n) => n.type === "dueSoon");
    if (activeTab === "returned") return allNotifications.filter((n) => n.type === "returned");
    return allNotifications;
  }, [allNotifications, activeTab]);

  const unreadCount = allNotifications.filter((n) => !readIds.has(n.id)).length;
  const overdueCount = allNotifications.filter((n) => n.type === "overdue").length;
  const dueSoonCount = allNotifications.filter((n) => n.type === "dueSoon").length;

  const handleItemClick = (item: NotificationItem) => {
    markSingleAsRead(item.id);
    setOpen(false);
    onNavigate(item.targetPath);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative rounded-lg p-2.5 text-muted-foreground transition-colors hover:bg-card hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          data-testid="button-notifications"
          aria-label={t("View notifications", "عرض الإشعارات")}
          title={t("View notifications", "عرض الإشعارات")}
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span
              className={`absolute top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold text-white shadow-sm ${
                overdueCount > 0
                  ? "bg-[#B92327] animate-pulse"
                  : "bg-[#DBB46C]"
              } ${language === "ar" ? "left-1" : "right-1"}`}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-80 max-w-[calc(100vw-1rem)] sm:w-96 p-0 shadow-xl border-border bg-card overflow-hidden"
        dir={language === "ar" ? "rtl" : "ltr"}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-[#263064]/5 px-4 py-3">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-[#263064]" />
            <h3 className="text-sm font-bold text-[#263064]">
              {t("Notifications", "الإشعارات")}
            </h3>
            {unreadCount > 0 && (
              <span className="rounded-full bg-[#263064] px-1.5 py-0.2 text-[10px] font-semibold text-[#FCFBF0]">
                {unreadCount} {t("new", "جديد")}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-[11px] font-medium text-primary hover:underline"
              data-testid="button-mark-all-read"
            >
              {t("Mark all read", "تحديد الكل كمقروء")}
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex border-b border-border bg-muted/20 px-2 pt-2 gap-1 text-[11px]">
          <button
            onClick={() => setActiveTab("all")}
            className={`rounded-t-md px-2.5 py-1.5 font-medium transition-colors ${
              activeTab === "all"
                ? "border-b-2 border-primary bg-card text-primary font-bold shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("All", "الكل")} ({allNotifications.length})
          </button>
          <button
            onClick={() => setActiveTab("overdue")}
            className={`rounded-t-md px-2.5 py-1.5 font-medium transition-colors ${
              activeTab === "overdue"
                ? "border-b-2 border-[#B92327] bg-card text-[#B92327] font-bold shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("Overdue", "متأخرة")} {overdueCount > 0 && `(${overdueCount})`}
          </button>
          <button
            onClick={() => setActiveTab("dueSoon")}
            className={`rounded-t-md px-2.5 py-1.5 font-medium transition-colors ${
              activeTab === "dueSoon"
                ? "border-b-2 border-[#DBB46C] bg-card text-[#DBB46C] font-bold shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("Due Soon", "تستحق قريباً")} {dueSoonCount > 0 && `(${dueSoonCount})`}
          </button>
          <button
            onClick={() => setActiveTab("returned")}
            className={`rounded-t-md px-2.5 py-1.5 font-medium transition-colors ${
              activeTab === "returned"
                ? "border-b-2 border-[#32B77E] bg-card text-[#32B77E] font-bold shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("Returned", "المُرجعة")}
          </button>
        </div>

        {/* Notifications List */}
        <div className="max-h-80 overflow-y-auto divide-y divide-border/60">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <CircleCheck size={32} className="mb-2 text-[#32B77E]/70" />
              <p className="text-xs font-semibold text-foreground">
                {t("All caught up!", "لا توجد إشعارات جديدة!")}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                {t(
                  "No pending return alerts or notices at this time.",
                  "لا توجد تنبيهات أو إعارات متأخرة في الوقت الحالي.",
                )}
              </p>
            </div>
          ) : (
            filteredNotifications.map((item) => {
              const isRead = readIds.has(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`flex w-full items-start gap-3 p-3.5 text-start transition-colors hover:bg-muted/50 ${
                    !isRead ? "bg-primary/[0.03]" : ""
                  }`}
                  data-testid={`notification-item-${item.id}`}
                >
                  {/* Icon */}
                  <div
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      item.severity === "danger"
                        ? "bg-[#B92327]/15 text-[#B92327]"
                        : item.severity === "warning"
                          ? "bg-[#DBB46C]/20 text-[#EC9F42]"
                          : item.severity === "success"
                            ? "bg-[#32B77E]/15 text-[#32B77E]"
                            : item.severity === "info"
                              ? "bg-[#14BAC6]/15 text-[#14BAC6]"
                              : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {item.severity === "danger" && <AlertTriangle size={15} />}
                    {item.severity === "warning" && <Clock3 size={15} />}
                    {item.severity === "success" && <CircleCheck size={15} />}
                    {item.severity === "info" && <Clock3 size={15} />}
                    {item.severity === "neutral" && <Package size={15} />}
                  </div>

                  {/* Body */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-foreground">
                        {item.title}
                      </span>
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${
                          item.severity === "danger"
                            ? "bg-[#B92327]/10 text-[#B92327]"
                            : item.severity === "warning"
                              ? "bg-[#DBB46C]/20 text-[#EC9F42]"
                              : item.severity === "success"
                                ? "bg-[#32B77E]/10 text-[#32B77E]"
                                : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {item.badgeText}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground leading-relaxed">
                      {item.message}
                    </p>
                  </div>

                  {/* Unread indicator */}
                  {!isRead && (
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border bg-muted/10 p-2 text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setOpen(false);
              onNavigate("/library/borrows");
            }}
            className="w-full text-xs font-semibold text-primary gap-1.5 h-8"
          >
            <span>{t("Go to Borrows Management", "الانتقال إلى إدارة الإعارات")}</span>
            <ChevronRight size={13} className={language === "ar" ? "rotate-180" : ""} />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
