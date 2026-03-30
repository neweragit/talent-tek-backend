import { useEffect, useMemo, useState } from "react";
import TalentLayout from "@/components/layouts/TalentLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import {
  Briefcase,
  CalendarDays,
  Clock3,
  FileText as FileTextIcon,
  Inbox,
  MessageSquare,
  Plus,
  Search,
  Send,
  Settings,
  Sparkles,
  Ticket,
  User,
  X,
} from "lucide-react";

type TicketType = "General" | "Technical" | "Billing" | "Job Offer" | "Interview";
type TicketMailbox = "my" | "inbox";
type TicketPriority = "low" | "medium" | "high" | "urgent";

interface SupportTicket {
  id: string;
  subject: string;
  type: TicketType;
  message: string;
  createdAt: string;
  status: string;
  priority: TicketPriority;
  assignedTo?: string | null;
  senderName?: string | null;
}

const ticketPriorityOptions: Array<{ value: TicketPriority; label: string }> = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const getPriorityBadgeClassName = (priority: TicketPriority) => {
  switch (priority) {
    case "urgent":
      return "border border-red-200 bg-red-50 text-red-700";
    case "high":
      return "border border-orange-300 bg-orange-100 text-orange-800";
    case "medium":
      return "border border-orange-200 bg-orange-50 text-orange-700";
    default:
      return "border border-slate-200 bg-slate-50 text-slate-700";
  }
};

const ticketTypeOptions: Array<{ value: "all" | TicketType; label: string }> = [
  { value: "all", label: "All Types" },
  { value: "General", label: "General" },
  { value: "Technical", label: "Technical" },
  { value: "Billing", label: "Billing" },
  { value: "Job Offer", label: "Job Offer" },
  { value: "Interview", label: "Interview" },
];

const getTicketTypeMeta = (type: TicketType) => {
  switch (type) {
    case "Technical":
      return {
        label: "Technical",
        icon: Settings,
        badgeClassName: "border border-orange-200 bg-orange-50 text-orange-700",
      };
    case "Billing":
      return {
        label: "Billing",
        icon: FileTextIcon,
        badgeClassName: "border border-orange-200 bg-orange-100 text-orange-700",
      };
    case "Job Offer":
      return {
        label: "Job Offer",
        icon: Briefcase,
        badgeClassName: "border border-orange-200 bg-orange-50 text-orange-700",
      };
    case "Interview":
      return {
        label: "Interview",
        icon: CalendarDays,
        badgeClassName: "border border-orange-300 bg-orange-100 text-orange-800",
      };
    default:
      return {
        label: "General",
        icon: MessageSquare,
        badgeClassName: "border border-orange-200 bg-orange-50 text-orange-700",
      };
  }
};

type RecipientOption = {
  id: string;
  name: string;
  email?: string | null;
  kind: "owner" | "interview";
};

type RecipientInfo = {
  name: string;
  email: string | null;
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

const asString = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return String(value);
  return value ? String(value) : "";
};

const asNullableString = (value: unknown): string | null => {
  const str = asString(value).trim();
  return str.length > 0 ? str : null;
};

const normalizeTicketType = (ticketType: string | null | undefined): TicketType => {
  const normalized = (ticketType ?? "").toLowerCase();
  if (normalized === "technical" || normalized === "bug report") return "Technical";
  if (normalized === "billing") return "Billing";
  if (normalized === "interview") return "Interview";
  if (normalized === "job offer") return "Job Offer";
  return "General";
};

const mapDbTicket = (row: {
  id: string;
  subject: string;
  message: string;
  ticket_type: string;
  created_at: string;
  status: string;
  priority: string;
  assigned_to?: string | null;
  sender_name?: string | null;
}): SupportTicket => {
  const type = normalizeTicketType(row.ticket_type);
  const priority = (row.priority as TicketPriority) || "medium";

  return {
    id: row.id,
    subject: row.subject,
    message: row.message,
    type,
    createdAt: new Date(row.created_at).toLocaleDateString("en-GB"),
    status: row.status,
    priority,
    assignedTo: row.assigned_to ?? null,
    senderName: row.sender_name ?? null,
  };
};

const TalentSupportTickets = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeMailbox, setActiveMailbox] = useState<TicketMailbox>("my");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | TicketType>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [myTickets, setMyTickets] = useState<SupportTicket[]>([]);
  const [inboxTickets, setInboxTickets] = useState<SupportTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [recipients, setRecipients] = useState<RecipientOption[]>([]);
  const [loadingRecipients, setLoadingRecipients] = useState(true);
  const [recipientDirectory, setRecipientDirectory] = useState<Record<string, RecipientInfo>>({});
  const [newTicket, setNewTicket] = useState({
    subject: "",
    type: "General" as TicketType,
    priority: "medium" as TicketPriority,
    message: "",
    assignedTo: "",
  });

  const selectedRecipient = useMemo(
    () => recipients.find((recipient) => recipient.id === newTicket.assignedTo) ?? null,
    [newTicket.assignedTo, recipients],
  );

  useEffect(() => {
    if (!showCreateModal) {
      return;
    }

    if (newTicket.assignedTo || recipients.length === 0) {
      return;
    }

    setNewTicket((previous) => ({ ...previous, assignedTo: recipients[0].id }));
  }, [newTicket.assignedTo, recipients, showCreateModal]);

  useEffect(() => {
    let ignore = false;

    const loadTickets = async () => {
      setLoadingTickets(true);

      if (!user) {
        setMyTickets([]);
        setInboxTickets([]);
        setLoadingTickets(false);
        return;
      }

      try {
        const [myResult, inboxResult] = await Promise.all([
          supabase
            .from("tickets")
            .select("id, subject, message, ticket_type, created_at, status, priority, assigned_to, sender_name")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("tickets")
            .select("id, subject, message, ticket_type, created_at, status, priority, assigned_to, sender_name")
            .eq("assigned_to", user.id)
            .order("created_at", { ascending: false }),
        ]);

        if (myResult.error) {
          throw myResult.error;
        }

        if (inboxResult.error) {
          throw inboxResult.error;
        }

        if (!ignore) {
          setMyTickets((myResult.data || []).map(mapDbTicket));
          setInboxTickets((inboxResult.data || []).map(mapDbTicket));
        }

        const outgoingRecipientIds = Array.from(
          new Set(
            (myResult.data || [])
              .map((row) => asNullableString(asRecord(row).assigned_to))
              .filter(Boolean) as string[],
          ),
        );

        if (outgoingRecipientIds.length > 0) {
          const [usersResult, ownersResult, teamMembersResult] = await Promise.all([
            supabase.from("users").select("id, email").in("id", outgoingRecipientIds),
            supabase.from("owners").select("user_id, full_name").in("user_id", outgoingRecipientIds),
            supabase
              .from("employer_team_members")
              .select("user_id, first_name, last_name")
              .in("user_id", outgoingRecipientIds),
          ]);

          const emailById = new Map<string, string | null>(
            (usersResult.data || []).map((row) => {
              const record = asRecord(row);
              return [asString(record.id), asNullableString(record.email)] as const;
            }),
          );

          const ownerNameById = new Map<string, string>(
            (ownersResult.data || [])
              .map((row) => {
                const record = asRecord(row);
                const id = asNullableString(record.user_id);
                const name = asNullableString(record.full_name);
                if (!id || !name) return null;
                return [id, name] as const;
              })
              .filter(Boolean) as Array<readonly [string, string]>,
          );

          const teamMemberNameById = new Map<string, string>(
            (teamMembersResult.data || [])
              .map((row) => {
                const record = asRecord(row);
                const id = asNullableString(record.user_id);
                if (!id) return null;
                const fullName = [asNullableString(record.first_name), asNullableString(record.last_name)]
                  .filter(Boolean)
                  .join(" ")
                  .trim();
                if (!fullName) return null;
                return [id, fullName] as const;
              })
              .filter(Boolean) as Array<readonly [string, string]>,
          );

          const directory: Record<string, RecipientInfo> = {};
          outgoingRecipientIds.forEach((id) => {
            const email = emailById.get(id) ?? null;
            const name =
              ownerNameById.get(id) ??
              teamMemberNameById.get(id) ??
              (email ? email.split("@")[0] : null) ??
              "Receiver";

            directory[id] = { name, email };
          });

          if (!ignore) setRecipientDirectory(directory);
        } else if (!ignore) {
          setRecipientDirectory({});
        }
      } catch (error) {
        console.error("Failed to load tickets", error);
        if (!ignore) {
          setMyTickets([]);
          setInboxTickets([]);
          setRecipientDirectory({});
        }
      } finally {
        if (!ignore) setLoadingTickets(false);
      }
    };

    loadTickets();
    return () => {
      ignore = true;
    };
  }, [user]);

  useEffect(() => {
    let ignore = false;

    const loadRecipients = async () => {
      setLoadingRecipients(true);

      if (!user) {
        setRecipients([]);
        setLoadingRecipients(false);
        return;
      }

      let ownerOptions: RecipientOption[] = [];

      try {
        const { data: talent, error: talentError } = await supabase
          .from("talents")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (talentError) {
          throw talentError;
        }

        try {
          const { data: owners, error: ownersError } = await supabase
            .from("owners")
            .select(
              `
                user_id,
                full_name,
                users ( email )
              `,
            );

          if (ownersError) {
            throw ownersError;
          }

          ownerOptions = (owners || [])
            .map((ownerRow) => {
              const owner = asRecord(ownerRow);
              const userId = asNullableString(owner.user_id);
              if (!userId) return null;
              const ownerName = asNullableString(owner.full_name) ?? "Owner";
              const ownerUser = asRecord(owner.users);
              const email = asNullableString(ownerUser.email);
              return { id: userId, name: ownerName, email, kind: "owner" } satisfies RecipientOption;
            })
            .filter(Boolean) as RecipientOption[];
        } catch (error) {
          const { data: owners, error: ownersError } = await supabase
            .from("users")
            .select("id, email, user_role")
            .eq("user_role", "owner");

          if (ownersError) {
            throw ownersError;
          }

          ownerOptions = (owners || [])
            .map((ownerRow) => {
              const owner = asRecord(ownerRow);
              const id = asNullableString(owner.id);
              if (!id) return null;
              const email = asNullableString(owner.email);
              return { id, name: "Owner", email, kind: "owner" } satisfies RecipientOption;
            })
            .filter(Boolean) as RecipientOption[];
        }

        if (!talent?.id) {
          if (!ignore) setRecipients(ownerOptions);
          return;
        }

        if (!ignore) setRecipients(ownerOptions);

        const { data: applications, error: applicationsError } = await supabase
          .from("applications")
          .select("id")
          .eq("talent_id", talent.id);

        if (applicationsError) {
          throw applicationsError;
        }

        const applicationIds = Array.from(
          new Set(
            (applications || [])
              .map((appRow) => asNullableString(asRecord(appRow).id))
              .filter(Boolean) as string[],
          ),
        );

        const { data: interviews, error: interviewsError } = await supabase
          .from("interviews")
          .select("created_by, application_id")
          .in("application_id", applicationIds.length > 0 ? applicationIds : ["00000000-0000-0000-0000-000000000000"])
          .not("created_by", "is", null);

        if (interviewsError) {
          throw interviewsError;
        }

        const interviewRows = (interviews || []) as unknown[];

        let createdByTeamMemberIds = Array.from(
          new Set(
            interviewRows
              .map((row) => asNullableString(asRecord(row).created_by))
              .filter(Boolean) as string[],
          ),
        );

        if (createdByTeamMemberIds.length === 0) {
          try {
            const { data: joinedInterviews, error: joinedInterviewsError } = await supabase
              .from("interviews")
              .select("created_by, application_id, applications!inner(talent_id)")
              .eq("applications.talent_id", talent.id)
              .not("created_by", "is", null);

            if (joinedInterviewsError) {
              throw joinedInterviewsError;
            }

            createdByTeamMemberIds = Array.from(
              new Set(
                (joinedInterviews || [])
                  .map((row) => asNullableString(asRecord(row).created_by))
                  .filter(Boolean) as string[],
              ),
            );
          } catch (error) {
            // ignore and keep createdByTeamMemberIds empty
          }
        }

        let teamMembers: unknown[] = [];
        const embeddedEmailByUserId = new Map<string, string | null>();

        if (createdByTeamMemberIds.length > 0) {
          try {
            const { data: teamMembersById, error: teamMembersByIdError } = await supabase
              .from("employer_team_members")
              .select("id, user_id, first_name, last_name")
              .in("id", createdByTeamMemberIds);

            if (!teamMembersByIdError) {
              teamMembers = teamMembersById || [];
            } else {
              console.warn("Failed to resolve interview schedulers by team_member_id", teamMembersByIdError);
            }

            if (teamMembers.length === 0) {
              const { data: teamMembersByUserId, error: teamMembersByUserIdError } = await supabase
                .from("employer_team_members")
                .select("id, user_id, first_name, last_name")
                .in("user_id", createdByTeamMemberIds);

              if (!teamMembersByUserIdError) {
                teamMembers = teamMembersByUserId || [];
              } else {
                console.warn("Failed to resolve interview schedulers by user_id", teamMembersByUserIdError);
              }
            }
          } catch (error) {
            console.warn("Failed to load employer team members for interview schedulers", error);
            teamMembers = [];
          }
        }

        if (teamMembers.length === 0 && applicationIds.length > 0) {
          try {
            const { data: embedded, error: embeddedError } = await supabase
              .from("interviews")
              .select(
                `
                  created_by,
                  employer_team_members!fk_interviews_created_by (
                    id,
                    user_id,
                    first_name,
                    last_name,
                    users ( email )
                  )
                `,
              )
              .in("application_id", applicationIds)
              .not("created_by", "is", null);

            if (embeddedError) {
              throw embeddedError;
            }

            const embeddedMembers = (embedded || [])
              .map((row) => {
                const record = asRecord(row);
                const member = asRecord(record.employer_team_members);
                const memberId = asNullableString(member.id);
                const userId = asNullableString(member.user_id);
                if (!memberId && !userId) return null;
                const memberUser = asRecord(member.users);
                if (userId) {
                  embeddedEmailByUserId.set(userId, asNullableString(memberUser.email));
                }
                return member;
              })
              .filter(Boolean) as unknown[];

            teamMembers = embeddedMembers;
          } catch (error) {
            // ignore
          }
        }

        const schedulerUserIds = Array.from(
          new Set(
            teamMembers
              .map((row) => asNullableString(asRecord(row).user_id))
              .filter(Boolean) as string[],
          ),
        );

        const { data: schedulerUsers, error: schedulerUsersError } =
          schedulerUserIds.length > 0
            ? await supabase.from("users").select("id, email").in("id", schedulerUserIds)
            : { data: [], error: null };

        if (schedulerUsersError) {
          console.warn("Failed to load scheduler emails from users table", schedulerUsersError);
        }

        const schedulerEmailByUserId = new Map<string, string | null>(
          (schedulerUsers || []).map((row) => {
            const userRow = asRecord(row);
            return [asString(userRow.id), asNullableString(userRow.email)] as const;
          }),
        );

        const schedulerOptions: RecipientOption[] = teamMembers
          .map((memberRow) => {
            const member = asRecord(memberRow);
            const userId = asNullableString(member.user_id);
            if (!userId) {
              return null;
            }

            const fullName = [asNullableString(member.first_name), asNullableString(member.last_name)]
              .filter(Boolean)
              .join(" ")
              .trim();

            return {
              id: userId,
              name: fullName || "Interview scheduler",
              email: embeddedEmailByUserId.get(userId) ?? schedulerEmailByUserId.get(userId) ?? null,
              kind: "interview",
            } satisfies RecipientOption;
          })
          .filter(Boolean) as RecipientOption[];

        let fallbackUserSchedulerOptions: RecipientOption[] = [];
        if (schedulerOptions.length === 0 && createdByTeamMemberIds.length > 0) {
          try {
            const { data: createdByUsers, error: createdByUsersError } = await supabase
              .from("users")
              .select("id, email")
              .in("id", createdByTeamMemberIds);

            if (createdByUsersError) {
              throw createdByUsersError;
            }

            fallbackUserSchedulerOptions = (createdByUsers || [])
              .map((row) => {
                const userRow = asRecord(row);
                const id = asNullableString(userRow.id);
                if (!id) return null;
                const email = asNullableString(userRow.email);
                return { id, name: "Interview scheduler", email, kind: "interview" } satisfies RecipientOption;
              })
              .filter(Boolean) as RecipientOption[];
          } catch (error) {
            fallbackUserSchedulerOptions = [];
          }
        }

        const combinedSchedulers = schedulerOptions.length > 0 ? schedulerOptions : fallbackUserSchedulerOptions;

        const uniqueSchedulers = Array.from(new Map(combinedSchedulers.map((r) => [r.id, r])).values()).filter(
          (r) => !ownerOptions.some((o) => o.id === r.id),
        );

        const merged = [...ownerOptions, ...uniqueSchedulers];
        if (!ignore) setRecipients(merged);
      } catch (error) {
        console.error("Failed to load recipients", error);
        if (!ignore) setRecipients(ownerOptions);
      } finally {
        if (!ignore) setLoadingRecipients(false);
      }
    };

    loadRecipients();
    return () => {
      ignore = true;
    };
  }, [user]);

  const sourceTickets = activeMailbox === "my" ? myTickets : inboxTickets;
  const mailboxCounts = {
    my: myTickets.length,
    inbox: inboxTickets.length,
  };

  const handleCreateTicket = async () => {
    if (!newTicket.subject.trim() || !newTicket.message.trim()) {
      toast({
        title: "Missing details",
        description: "Subject and message are required.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Not signed in",
        description: "Please sign in to create a ticket.",
        variant: "destructive",
      });
      return;
    }

    if (!newTicket.assignedTo) {
      toast({
        title: "Choose a receiver",
        description: "Select who should receive this ticket.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    const payload = {
      user_id: user.id,
      sender_name: user.name ?? "Talent",
      subject: newTicket.subject.trim(),
      message: newTicket.message.trim(),
      ticket_type: newTicket.type,
      priority: newTicket.priority,
      assigned_to: newTicket.assignedTo,
      status: "open",
    };

    const { data, error } = await supabase
      .from("tickets")
      .insert(payload)
      .select("id, subject, message, ticket_type, created_at, status, priority, assigned_to")
      .single();

    setSubmitting(false);

    if (error) {
      console.error("Failed to create ticket", error);
      toast({
        title: "Unable to send ticket",
        description: error.message ?? "Please try again.",
        variant: "destructive",
      });
      return;
    }

    if (!data) {
      toast({
        title: "Ticket creation failed",
        description: "Unable to create ticket.",
        variant: "destructive",
      });
      return;
    }

    setMyTickets((previous) => [mapDbTicket(data), ...previous]);
    setShowCreateModal(false);
    setActiveMailbox("my");
    setNewTicket({ subject: "", type: "General", priority: "medium", message: "", assignedTo: "" });
    toast({ title: "Ticket sent", description: "Your ticket has been delivered." });
  };

  const filteredTickets = useMemo(() => {
    const normalizedSearch = searchQuery.toLowerCase();

    if (filterType === "all") {
      return sourceTickets.filter((ticket) => {
        if (normalizedSearch.length === 0) {
          return true;
        }

        return (
          ticket.subject.toLowerCase().includes(normalizedSearch) ||
          ticket.message.toLowerCase().includes(normalizedSearch) ||
          ticket.type.toLowerCase().includes(normalizedSearch) ||
          ticket.createdAt.toLowerCase().includes(normalizedSearch)
        );
      });
    }

    return sourceTickets.filter((ticket) => {
      const typeMatches = ticket.type === filterType;
      if (!typeMatches) {
        return false;
      }

      if (normalizedSearch.length === 0) {
        return true;
      }

      return (
        ticket.subject.toLowerCase().includes(normalizedSearch) ||
        ticket.message.toLowerCase().includes(normalizedSearch) ||
        ticket.type.toLowerCase().includes(normalizedSearch) ||
        ticket.createdAt.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [filterType, searchQuery, sourceTickets]);

  const resultsLabel =
    filteredTickets.length === sourceTickets.length
      ? `Showing all ${sourceTickets.length} tickets`
      : `Showing ${filteredTickets.length} of ${sourceTickets.length} tickets`;

  const mailboxTitle = activeMailbox === "my" ? "My Tickets" : "Inbox";

  return (
    <TalentLayout>
      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-4 py-12 sm:py-20">
        <section className="mb-8 overflow-hidden rounded-[2rem] border border-orange-100 bg-[radial-gradient(circle_at_top_left,_rgba(251,146,60,0.18),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(253,186,116,0.14),_transparent_32%),linear-gradient(135deg,_#fff7ed_0%,_#ffffff_58%,_#fff1e6_100%)] p-6 shadow-xl sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-orange-600 shadow-sm backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Support Desk
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tighter leading-tight text-slate-900 mb-4">
                Support Tickets
              </h1>
              <p className="max-w-2xl text-base font-medium leading-7 text-slate-600 sm:text-lg">
                Reach support faster, track every request, and keep conversation history visible in one place.
              </p>
              <div className="mt-6 inline-flex rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-orange-700 shadow-sm">
                {resultsLabel}
              </div>
            </div>

            <Button
              onClick={() => setShowCreateModal(true)}
              className="h-12 gap-2 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 px-6 text-white shadow-lg hover:from-orange-700 hover:to-orange-600"
            >
              <Plus className="w-4 h-4" />
              Create New Ticket
            </Button>
          </div>
        </section>

        <div className="mb-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_320px]">
          <div className="rounded-3xl border border-orange-100 bg-white p-4 shadow-lg">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-orange-400" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by subject, message, type, or date..."
                className="h-12 rounded-xl border-orange-200 pl-12 focus:border-orange-400 focus:ring-orange-400"
              />
            </div>
          </div>

          <Select value={filterType} onValueChange={(value) => setFilterType(value as "all" | TicketType)}>
            <SelectTrigger className="h-full min-h-14 rounded-3xl border-orange-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-lg">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              {ticketTypeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center rounded-3xl border border-orange-100 bg-white p-4 shadow-lg">
            <div className="grid h-12 w-full grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setActiveMailbox("my")}
                className={`flex h-full items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 text-sm font-semibold transition-all ${
                  activeMailbox === "my"
                    ? "bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md"
                    : "text-orange-700 hover:bg-orange-50"
                }`}
              >
                <Ticket className="h-4 w-4" />
                My ({mailboxCounts.my})
              </button>
              <button
                type="button"
                onClick={() => setActiveMailbox("inbox")}
                className={`flex h-full items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 text-sm font-semibold transition-all ${
                  activeMailbox === "inbox"
                    ? "bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md"
                    : "text-orange-700 hover:bg-orange-50"
                }`}
              >
                <Inbox className="h-4 w-4" />
                Inbox ({mailboxCounts.inbox})
              </button>
            </div>
          </div>
        </div>

        {loadingTickets ? (
          <div className="rounded-[2rem] border border-orange-100 bg-white px-6 py-16 text-center shadow-sm">
            <p className="text-gray-600">Loading tickets...</p>
          </div>
        ) : filteredTickets.length > 0 ? (
          <div className="grid gap-5 xl:grid-cols-2">
            {filteredTickets.map((ticket) => {
              const typeMeta = getTicketTypeMeta(ticket.type);
              const TypeIcon = typeMeta.icon;
              const directionLabel = activeMailbox === "my" ? "To" : "From";
              const recipientInfo = ticket.assignedTo ? recipientDirectory[ticket.assignedTo] : undefined;
              const directionName =
                activeMailbox === "my" ? recipientInfo?.name || "Receiver" : ticket.senderName || "Sender";
              const directionEmail = activeMailbox === "my" ? recipientInfo?.email ?? null : null;

              return (
                <article
                  key={ticket.id}
                  className="group relative overflow-hidden rounded-3xl border border-orange-100 bg-white p-6 shadow-lg transition-all hover:-translate-y-1 hover:shadow-2xl"
                >
                  <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                      <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-orange-600">
                        <TypeIcon className="h-3.5 w-3.5" />
                        Ticket #{ticket.id.slice(0, 8)}
                      </div>
                      <h2 className="text-xl font-bold leading-tight text-slate-900">{ticket.subject}</h2>
                      <p className="mt-1 text-xs text-gray-500">Created {ticket.createdAt}</p>
                    </div>
                    <Badge className={typeMeta.badgeClassName}>{typeMeta.label}</Badge>
                  </div>

                  <p className="mb-5 text-sm leading-6 text-gray-600">{ticket.message}</p>

                  <div className="mb-5 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-orange-600" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Created</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{ticket.createdAt}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Ticket className="h-4 w-4 text-orange-600" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Mailbox</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{mailboxTitle}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <TypeIcon className="h-4 w-4 text-orange-600" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Type</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{typeMeta.label}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock3 className="h-4 w-4 text-orange-600" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Status</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{ticket.status}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-orange-600" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                          {directionLabel}
                        </p>
                        <p className="mt-1 truncate text-sm font-semibold text-slate-900">{directionName}</p>
                        {directionEmail ? <p className="truncate text-xs text-slate-500">{directionEmail}</p> : null}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityBadgeClassName(ticket.priority)}>Priority: {ticket.priority}</Badge>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[2rem] border border-dashed border-orange-200 bg-orange-50/50 px-6 py-16 text-center shadow-sm">
            {activeMailbox === "my" ? (
              <>
                <Ticket className="mx-auto mb-4 h-16 w-16 text-orange-300" />
                <p className="mb-2 text-xl font-semibold text-slate-900">No tickets yet</p>
                <p className="text-gray-600">Create a ticket to your receiver.</p>
              </>
            ) : (
              <>
                <Inbox className="mx-auto mb-4 h-16 w-16 text-orange-300" />
                <p className="mb-2 text-xl font-semibold text-slate-900">Inbox is empty</p>
                <p className="text-gray-600">Replies will appear here.</p>
              </>
            )}
          </div>
        )}

        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4">
            <div className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-orange-100 bg-white p-5 shadow-2xl sm:p-7">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Create New Ticket</h2>
                  <p className="mt-1 text-sm text-slate-600">This ticket will be sent to the selected receiver.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-orange-600 transition-colors hover:bg-orange-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="overflow-y-auto pr-1">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label className="text-sm font-semibold text-slate-700">Subject</Label>
                    <Input
                      value={newTicket.subject}
                      onChange={(event) => setNewTicket({ ...newTicket, subject: event.target.value })}
                      placeholder="Enter ticket subject"
                      className="rounded-xl border-orange-200 bg-orange-50 focus:border-orange-400 focus:ring-orange-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">Type</Label>
                    <Select
                      value={newTicket.type}
                      onValueChange={(value) => setNewTicket({ ...newTicket, type: value as TicketType })}
                    >
                      <SelectTrigger className="rounded-xl border-orange-200 bg-orange-50 focus:border-orange-400 focus:ring-orange-400">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ticketTypeOptions.filter((option) => option.value !== "all").map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">Priority</Label>
                    <Select
                      value={newTicket.priority}
                      onValueChange={(value) => setNewTicket({ ...newTicket, priority: value as TicketPriority })}
                    >
                      <SelectTrigger className="rounded-xl border-orange-200 bg-orange-50 focus:border-orange-400 focus:ring-orange-400">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ticketPriorityOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Select
                    value={newTicket.assignedTo}
                    onValueChange={(value) => setNewTicket({ ...newTicket, assignedTo: value })}
                    disabled={loadingRecipients || recipients.length === 0}
                  >
                    <SelectTrigger className="h-auto w-full items-start justify-between rounded-2xl border border-orange-200 bg-orange-50/70 p-3 text-sm text-slate-700 sm:col-span-2 [&>svg]:hidden">
                      <div className="min-w-0 text-left">
                        <p className="font-semibold text-orange-700">Receiver</p>
                        <p className="mt-1 truncate">
                          {selectedRecipient?.name || (loadingRecipients ? "Loading..." : "Select receiver")}
                        </p>
                        <p className="truncate text-slate-500">{selectedRecipient?.email || "No email available"}</p>
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {recipients.map((recipient) => (
                        <SelectItem key={recipient.id} value={recipient.id}>
                          <div className="flex w-full min-w-0 flex-col gap-0.5">
                            <span className="truncate text-sm font-semibold text-slate-900">{recipient.name}</span>
                            {recipient.email ? (
                              <span className="truncate text-xs text-slate-600">{recipient.email}</span>
                            ) : null}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="space-y-2 sm:col-span-2">
                    <Label className="text-sm font-semibold text-slate-700">Message</Label>
                    <Textarea
                      value={newTicket.message}
                      onChange={(event) => setNewTicket({ ...newTicket, message: event.target.value })}
                      placeholder="Describe your issue or question..."
                      rows={5}
                      className="resize-none rounded-xl border-orange-200 bg-orange-50 focus:border-orange-400 focus:ring-orange-400"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 flex gap-3 border-t border-orange-100 pt-4">
                <Button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 rounded-full bg-gradient-to-r from-orange-400 to-orange-300 text-white shadow-lg hover:from-orange-500 hover:to-orange-400"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleCreateTicket}
                  disabled={submitting || !newTicket.subject.trim() || !newTicket.message.trim() || !newTicket.assignedTo}
                  className="flex-1 gap-2 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-lg hover:from-orange-700 hover:to-orange-600 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  {submitting ? "Submitting..." : "Submit Ticket"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </TalentLayout>
  );
};

export default TalentSupportTickets;
