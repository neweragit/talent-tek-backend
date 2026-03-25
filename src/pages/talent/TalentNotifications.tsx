import { useMemo, useState } from "react";
import { format } from "date-fns";
import TalentLayout from "@/components/layouts/TalentLayout";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bell,
  BellRing,
  CalendarDays,
  Gift,
  Search,
  User,
  Video,
} from "lucide-react";

type NotificationCategory = "interview" | "offer" | "profile" | "system";
type NotificationStatus = "unread" | "read";

type NotificationItem = {
  id: number;
  title: string;
  message: string;
  category: NotificationCategory;
  status: NotificationStatus;
  createdAt: string;
};

const notificationsSeed: NotificationItem[] = [
  {
    id: 1,
    title: "Interview Rescheduled",
    message: "Your TA interview with Horizon Labs is now Monday at 10:30 AM.",
    category: "interview",
    status: "unread",
    createdAt: "2026-03-14T10:30:00",
  },
  {
    id: 2,
    title: "New Offer Received",
    message: "Vertex Dynamics sent you an updated offer package for review.",
    category: "offer",
    status: "unread",
    createdAt: "2026-03-14T08:15:00",
  },
  {
    id: 3,
    title: "Profile Visibility Tip",
    message: "Add one more project link to improve employer profile discovery.",
    category: "profile",
    status: "read",
    createdAt: "2026-03-13T12:00:00",
  },
  {
    id: 4,
    title: "Interview Feedback Submitted",
    message: "Your technical interview notes are available from the interviewer panel.",
    category: "interview",
    status: "read",
    createdAt: "2026-03-12T16:45:00",
  },
  {
    id: 5,
    title: "Offer Deadline Reminder",
    message: "Your pending offer expires in 48 hours. Respond to secure the role.",
    category: "offer",
    status: "unread",
    createdAt: "2026-03-12T09:20:00",
  },
  {
    id: 6,
    title: "Platform Update",
    message: "We improved talent search ranking to better surface complete profiles.",
    category: "system",
    status: "read",
    createdAt: "2026-03-10T11:10:00",
  },
];

const statusOptions: Array<{ value: NotificationStatus; label: string }> = [
  { value: "unread", label: "Unread" },
  { value: "read", label: "Read" },
];

const getCategoryMeta = (category: NotificationCategory) => {
  switch (category) {
    case "interview":
      return {
        icon: Video,
      };
    case "offer":
      return {
        icon: Gift,
      };
    case "profile":
      return {
        icon: User,
      };
    default:
      return {
        icon: BellRing,
      };
  }
};

const TalentNotifications = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<NotificationStatus>("unread");
  const [notifications] = useState<NotificationItem[]>(notificationsSeed);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      const normalizedSearch = searchQuery.trim().toLowerCase();
      const matchesSearch =
        normalizedSearch.length === 0 ||
        notification.title.toLowerCase().includes(normalizedSearch) ||
        notification.message.toLowerCase().includes(normalizedSearch);
      const matchesStatus = notification.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [notifications, searchQuery, statusFilter]);

  const resultsLabel = `Showing ${filteredNotifications.length} notifications`;

  return (
    <TalentLayout>
      <div className="relative z-10 mx-auto max-w-7xl px-3 py-12 sm:px-4 sm:py-20">
        <section className="mb-8 overflow-hidden rounded-[2rem] border border-orange-100 bg-[radial-gradient(circle_at_top_left,_rgba(251,146,60,0.18),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(253,186,116,0.14),_transparent_32%),linear-gradient(135deg,_#fff7ed_0%,_#ffffff_58%,_#fff1e6_100%)] p-6 shadow-xl sm:p-8">
          <div>
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-orange-600 shadow-sm backdrop-blur-sm">
                <Bell className="h-3.5 w-3.5" />
                Notification Center
              </div>
              <h1 className="max-w-3xl text-4xl font-bold tracking-tighter leading-tight text-slate-900 sm:text-5xl lg:text-6xl">
                My Notifications
              </h1>
              <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-slate-600 sm:text-lg">
                Track interview updates, offer movements, and account signals in one timeline while keeping the same bold dashboard identity as your applications experience.
              </p>
              <div className="mt-6 inline-flex rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-orange-700 shadow-sm">
                {resultsLabel}
              </div>
            </div>
          </div>
        </section>

        <div className="mb-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
          <div className="rounded-3xl border border-orange-100 bg-white p-4 shadow-lg">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-orange-400" />
              <Input
                placeholder="Search by title or message..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="h-12 rounded-xl border-orange-200 pl-12 focus:border-orange-400 focus:ring-orange-400"
              />
            </div>
          </div>

          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as NotificationStatus)}>
            <SelectTrigger className="min-h-14 rounded-3xl border-orange-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-lg">
              <SelectValue placeholder="Unread" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {filteredNotifications.length > 0 ? (
          <div className="grid gap-5">
            {filteredNotifications.map((notification) => {
              const categoryMeta = getCategoryMeta(notification.category);
              const CategoryIcon = categoryMeta.icon;

              return (
                <article
                  key={notification.id}
                  className={`group relative overflow-hidden rounded-3xl border bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-2xl ${
                    notification.status === "unread"
                      ? "border-orange-300 shadow-2xl shadow-orange-200/50"
                      : "border-orange-100 shadow-lg"
                  }`}
                >
                  {notification.status === "unread" ? (
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-700 via-orange-600 to-orange-500" />
                  ) : null}

                  <div className="mb-6 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-lg">
                        <CategoryIcon className="h-6 w-6" />
                      </div>
                      <div>
                        {notification.status === "unread" ? (
                          <div className="mb-2 inline-flex rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-orange-600">
                            New Notification
                          </div>
                        ) : null}
                        <h2 className="text-xl font-bold leading-tight text-slate-900">{notification.title}</h2>
                        <p className="mt-1 text-xs text-gray-500">{format(new Date(notification.createdAt), "MMM d, yyyy 'at' h:mm a")}</p>
                      </div>
                    </div>
                  </div>

                  <p className="mb-5 text-sm leading-6 text-gray-600">{notification.message}</p>

                  <div className="mb-5 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-orange-600" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Date</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {format(new Date(notification.createdAt), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <BellRing className="h-4 w-4 text-orange-600" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Status</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {notification.status === "unread" ? "Unread" : "Read"}
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[2rem] border border-dashed border-orange-200 bg-orange-50/50 px-6 py-16 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-orange-500 shadow-md">
              <Search className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">No notifications match these filters</h2>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-slate-600">
              Try a different title keyword or switch between unread and read notifications.
            </p>
          </div>
        )}
      </div>
    </TalentLayout>
  );
};

export default TalentNotifications;
