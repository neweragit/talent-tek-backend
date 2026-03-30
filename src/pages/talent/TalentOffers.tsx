import { useEffect, useMemo, useState } from "react";
import TalentLayout from "@/components/layouts/TalentLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Banknote,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  MapPin,
  Search,
  Sparkles,
  User,
  XCircle,
} from "lucide-react";

interface Offer {
  id: string;
  applicationId: string;
  company: string;
  companyLogo: string;
  jobTitle: string;
  status: "pending" | "accepted" | "rejected";
  location: string;
  sentDate: string;
  salary: string;
  employmentType: string;
  recruiter: string;
  decisionNote: string;
}

type OfferStatus = Offer["status"];

const offerStatusOptions: Array<{ value: "all" | OfferStatus; label: string }> = [
  { value: "all", label: "All Status" },
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
];

const getStatusMeta = (status: OfferStatus) => {
  switch (status) {
    case "pending":
      return {
        label: "Pending",
        badgeClassName: "border border-orange-200 bg-orange-50 text-orange-700",
        icon: Clock3,
      };
    case "accepted":
      return {
        label: "Accepted",
        badgeClassName: "border border-orange-200 bg-orange-100 text-orange-700",
        icon: CheckCircle2,
      };
    case "rejected":
      return {
        label: "Declined",
        badgeClassName: "border border-orange-300 bg-orange-100 text-orange-800",
        icon: XCircle,
      };
    default:
      return {
        label: "Offer",
        badgeClassName: "border border-orange-200 bg-orange-50 text-orange-700",
        icon: Briefcase,
      };
  }
};

const getOfferSummary = (offer: Offer) => {
  switch (offer.status) {
    case "pending":
      return `You have an active offer from ${offer.company}. Review the compensation and timeline to decide your next step.`;
    case "accepted":
      return `This offer has been accepted. Keep this record for onboarding reference and role details.`;
    case "rejected":
      return `This offer was declined. Keep the history for future negotiation and decision tracking.`;
    default:
      return `You received an offer from ${offer.company}.`;
  }
};

const getCompanyInitials = (company: string) => {
  const words = company
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);

  if (words.length === 0) {
    return "TT";
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
};

const toOfferStatus = (status: string | null | undefined): OfferStatus => {
  const normalized = (status ?? "").toLowerCase();
  if (normalized === "accepted") return "accepted";
  if (normalized === "refused" || normalized === "rejected" || normalized === "declined") return "rejected";
  return "pending";
};

const formatDate = (dateValue: string | null | undefined) => {
  if (!dateValue) return "Unknown";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

const TalentOffers = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | OfferStatus>("all");
  const [loading, setLoading] = useState(true);
  const [offers, setOffers] = useState<Offer[]>([]);

  useEffect(() => {
    let ignore = false;

    const loadOffers = async () => {
      setLoading(true);

      if (!user) {
        setOffers([]);
        setLoading(false);
        return;
      }

      try {
        const { data: talent, error: talentError } = await supabase
          .from("talents")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (talentError) {
          throw talentError;
        }

        if (!talent?.id) {
          if (!ignore) setOffers([]);
          return;
        }

        const { data: records, error: offersError } = await supabase
          .from("offers")
          .select(
            `
              id,
              status,
              position,
              salary,
              start_date,
              work_location,
              benefits_perks,
              created_at,
              applications!inner (
                id,
                talent_id,
                jobs (
                  title,
                  workplace,
                  employers ( company_name, logo_url )
                )
              )
            `,
          )
          .eq("applications.talent_id", talent.id)
          .order("created_at", { ascending: false });

        if (offersError) {
          throw offersError;
        }

        const mapped = (records || []).map((record: any) => {
          const companyName = record.applications?.jobs?.employers?.company_name || "Unknown Company";
          const startDate = formatDate(record.start_date);
          const createdAt = formatDate(record.created_at);
          const applicationId = String(record.applications?.id || "");

          return {
            id: String(record.id),
            applicationId,
            company: companyName,
            companyLogo: getCompanyInitials(companyName),
            jobTitle: record.position || record.applications?.jobs?.title || "Offer",
            status: toOfferStatus(record.status),
            location: record.work_location || record.applications?.jobs?.workplace || "Not specified",
            sentDate: createdAt,
            salary: record.salary || "Not specified",
            employmentType: startDate !== "Unknown" ? `Start date: ${startDate}` : "Start date: Not specified",
            recruiter: "Hiring team",
            decisionNote: record.benefits_perks ? String(record.benefits_perks) : "Review the offer details and respond when ready.",
          } satisfies Offer;
        });

        if (!ignore) setOffers(mapped);
      } catch (error) {
        console.error("Failed to load offers", error);
        if (!ignore) {
          setOffers([]);
          toast({
            title: "Unable to load offers",
            description: "Please try again later.",
            variant: "destructive",
          });
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadOffers();
    return () => {
      ignore = true;
    };
  }, [toast, user]);

  const filteredOffers = useMemo(() => {
    return offers.filter((offer) => {
      const matchesStatus = statusFilter === "all" || offer.status === statusFilter;
      const normalizedSearch = searchQuery.toLowerCase();
      const matchesSearch =
        normalizedSearch.length === 0 ||
        offer.company.toLowerCase().includes(normalizedSearch) ||
        offer.jobTitle.toLowerCase().includes(normalizedSearch) ||
        offer.recruiter.toLowerCase().includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [offers, searchQuery, statusFilter]);

  const resultsLabel =
    filteredOffers.length === offers.length
      ? `Showing all ${offers.length} offers`
      : `Showing ${filteredOffers.length} of ${offers.length} offers`;

  const handleOfferDecision = async (offerId: string, nextStatus: OfferStatus) => {
    const offer = offers.find((item) => item.id === offerId);
    const dbStatus = nextStatus === "rejected" ? "refused" : nextStatus;
    const { error } = await supabase.from("offers").update({ status: dbStatus }).eq("id", offerId);

    if (error) {
      console.error("Failed to update offer", error);
      toast({
        title: "Unable to update offer",
        description: error.message ?? "Please try again.",
        variant: "destructive",
      });
      return;
    }

    if (offer?.applicationId) {
      const nextStage = nextStatus === "accepted" ? "hired" : "rejected-offer";
      const { error: stageError } = await supabase.from("applications").update({ stage: nextStage }).eq("id", offer.applicationId);
      if (stageError) {
        console.warn("Failed to update application stage after offer decision", stageError);
      }
    }

    setOffers((currentOffers) =>
      currentOffers.map((offer) => {
        if (offer.id !== offerId) {
          return offer;
        }

        return {
          ...offer,
          status: nextStatus,
          decisionNote:
            nextStatus === "accepted"
              ? "Accepted. The employer will follow up with onboarding details."
              : "Declined. Keep an eye out for other opportunities that match your profile.",
        };
      }),
    );

    setStatusFilter(nextStatus);
    toast({
      title: nextStatus === "accepted" ? "Offer accepted" : "Offer declined",
      description: "Your response has been saved.",
    });
  };

  const handleViewOffer = (offer: Offer) => {
    toast({
      title: `${offer.company} offer`,
      description: `Offer for ${offer.jobTitle} is currently ${getStatusMeta(offer.status).label.toLowerCase()}.`,
    });
  };

  return (
    <TalentLayout>
      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-4 py-12 sm:py-20">
        <section className="mb-8 overflow-hidden rounded-[2rem] border border-orange-100 bg-[radial-gradient(circle_at_top_left,_rgba(251,146,60,0.18),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(253,186,116,0.14),_transparent_32%),linear-gradient(135deg,_#fff7ed_0%,_#ffffff_58%,_#fff1e6_100%)] p-6 shadow-xl sm:p-8">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-orange-600 shadow-sm backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Offer Pipeline
            </div>
            <h1 className="max-w-3xl text-4xl font-bold tracking-tighter leading-tight text-slate-900 sm:text-5xl lg:text-6xl">
              My Offers
            </h1>
            <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-slate-600 sm:text-lg">
              Review each offer with confidence, track your decisions, and keep all compensation conversations in one clean workspace.
            </p>
            <div className="mt-6 inline-flex rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-orange-700 shadow-sm">
              {resultsLabel}
            </div>
          </div>
        </section>

        <div className="mb-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
          <div className="rounded-3xl border border-orange-100 bg-white p-4 shadow-lg">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-orange-400" />
              <Input
                placeholder="Search by company, role, or recruiter..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="h-12 rounded-xl border-orange-200 pl-12 focus:border-orange-400 focus:ring-orange-400"
              />
            </div>
          </div>

          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "all" | OfferStatus)}>
            <SelectTrigger className="h-full min-h-14 rounded-3xl border-orange-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-lg">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              {offerStatusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="rounded-[2rem] border border-orange-100 bg-white/90 px-6 py-16 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 shadow-md">
              <Clock3 className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Loading offers</h2>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-slate-600">
              Fetching your current offers from the database.
            </p>
          </div>
        ) : filteredOffers.length > 0 ? (
          <div className="grid gap-5 xl:grid-cols-2">
            {filteredOffers.map((offer) => (
              <article
                key={offer.id}
                className="group relative overflow-hidden rounded-3xl border border-orange-100 bg-white p-6 shadow-lg transition-all hover:-translate-y-1 hover:shadow-2xl"
              >
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-lg font-bold text-white shadow-lg">
                      {offer.companyLogo}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold leading-tight text-slate-900">{offer.jobTitle}</h2>
                      <p className="mt-1 text-sm font-semibold text-orange-600">{offer.company}</p>
                      <p className="mt-1 text-xs text-gray-500">Offer sent {offer.sentDate}</p>
                    </div>
                  </div>
                  <Badge className={getStatusMeta(offer.status).badgeClassName}>{getStatusMeta(offer.status).label}</Badge>
                </div>

                <p className="mb-5 text-sm leading-6 text-gray-600">{getOfferSummary(offer)}</p>

                <div className="mb-5 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <CalendarDays className="h-4 w-4 text-orange-600" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Sent</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{offer.sentDate}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <MapPin className="h-4 w-4 text-orange-600" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Location</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{offer.location}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <Briefcase className="h-4 w-4 text-orange-600" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Employment</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{offer.employmentType}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <Banknote className="h-4 w-4 text-orange-600" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Compensation</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{offer.salary}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <User className="h-4 w-4 text-orange-600" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Recruiter</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{offer.recruiter}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    {(() => {
                      const StatusIcon = getStatusMeta(offer.status).icon;
                      return <StatusIcon className="h-4 w-4 text-orange-600" />;
                    })()}
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Status</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{getStatusMeta(offer.status).label}</p>
                    </div>
                  </div>
                </div>

                <div className="mb-5 flex flex-wrap gap-2">
                  <Badge className="border border-orange-200 bg-orange-50 text-orange-700">{offer.company}</Badge>
                  <Badge className="border border-orange-200 bg-orange-50 text-orange-700">{getStatusMeta(offer.status).label}</Badge>
                  <Badge variant="outline" className="border-orange-200 bg-white text-orange-700">
                    {offer.employmentType}
                  </Badge>
                </div>

                <div className="mb-5 rounded-2xl border border-orange-100 bg-orange-50/60 px-4 py-3 text-sm text-orange-700">
                  {offer.decisionNote}
                </div>

                <div className="flex justify-end border-t border-orange-100 pt-5">
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      onClick={() => handleViewOffer(offer)}
                      className="gap-2 whitespace-nowrap rounded-full bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md hover:from-orange-700 hover:to-orange-600"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View Offer
                    </Button>
                    {offer.status === "pending" ? (
                      <>
                        <Button
                          type="button"
                          onClick={() => handleOfferDecision(offer.id, "accepted")}
                          className="gap-2 whitespace-nowrap rounded-full bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md hover:from-orange-700 hover:to-orange-600"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Accept
                        </Button>
                        <Button
                          type="button"
                          onClick={() => handleOfferDecision(offer.id, "rejected")}
                          className="gap-2 whitespace-nowrap rounded-full bg-gradient-to-r from-orange-500 to-orange-400 text-white shadow-md hover:from-orange-600 hover:to-orange-500"
                        >
                          <XCircle className="h-4 w-4" />
                          Decline
                        </Button>
                      </>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-[2rem] border border-dashed border-orange-200 bg-orange-50/50 px-6 py-16 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-orange-500 shadow-md">
              <Search className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">No offers match these filters</h2>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-slate-600">
              Try a different company, role, recruiter, or status filter. Your offers will appear here as soon as they match.
            </p>
          </div>
        )}
      </div>
    </TalentLayout>
  );
};

export default TalentOffers;
