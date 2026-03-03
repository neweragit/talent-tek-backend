import React, { useState, useEffect } from "react";
import TalentLayout from "@/components/layouts/TalentLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Clock, Calendar, MapPin, Briefcase } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

interface Offer {
  id: string; // Changed to string for UUID
  applicationId: string | null;
  company: string;
  companyLogoInitial: string;
  companyLogoUrl?: string | null;
  jobTitle: string;
  salary: string;
  location: string;
  jobType: string;
  startDate: string;
  benefits: string[];
  status: "pending" | "accepted" | "refused"; // Changed rejected to refused
  offerDate: string;
  expiryDate: string; // This might be calculated or null
}

const TalentOffers = () => {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOffers = async () => {
      if (!user) return;

      setLoading(true);
      try {
        // Step 1: Get the talent ID for the current user
        const { data: talentData, error: talentError } = await supabase
          .from('talents')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (talentError || !talentData) {
          throw talentError || new Error("Talent profile not found.");
        }
        const talentId = talentData.id;

        // Step 2: Fetch all applications for this talent
        const { data: applicationsData, error: applicationsError } = await supabase
          .from('applications')
          .select('id')
          .eq('talent_id', talentId);

        if (applicationsError) throw applicationsError;
        const applicationIds = applicationsData.map(app => app.id);

        if (applicationIds.length === 0) {
          setOffers([]);
          setLoading(false);
          return;
        }

        // Step 3: Fetch offers linked to those applications, along with job and employer details
        const { data: offerData, error: offerError } = await supabase
          .from('offers')
          .select(`
            id,
            application_id,
            status,
            position,
            salary,
            start_date,
            work_location,
            benefits_perks,
            created_at,
            applications (
              id,
              jobs (
                title,
                employment_type,
                employers (
                  company_name,
                  logo_url
                )
              )
            )
          `)
          .in('application_id', applicationIds);

        if (offerError) throw offerError;

        // Step 4: Transform the data into the format the component expects
        const transformedOffers = (offerData ?? []).map((offer: any) => {
          // Supabase returns related records as arrays by default even for one-to-one
          const application = Array.isArray(offer.applications) ? offer.applications[0] : offer.applications;
          const job = application && (Array.isArray(application.jobs) ? application.jobs[0] : application.jobs);
          const employer = job && (Array.isArray(job.employers) ? job.employers[0] : job.employers);
          const applicationId = application?.id || offer.application_id || null;

          const companyLogoUrl = employer?.logo_url || null;
          const companyLogoInitial = employer?.company_name?.charAt(0)?.toUpperCase() || '?';

          // Safely format dates
          const offerDate = offer.created_at ? new Date(offer.created_at).toLocaleDateString() : 'N/A';
          const startDate = offer.start_date ? new Date(offer.start_date).toLocaleDateString() : 'N/A';

          // Calculate expiry date (e.g., 7 days from offer date)
          const expiryDate = offer.created_at
            ? new Date(new Date(offer.created_at).getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()
            : 'N/A';

          const benefits = typeof offer.benefits_perks === 'string'
            ? offer.benefits_perks.split(',').map((b: string) => b.trim()).filter(Boolean)
            : Array.isArray(offer.benefits_perks)
              ? offer.benefits_perks
              : [];

          const rawSalary = typeof offer.salary === 'string' ? offer.salary.trim() : offer.salary;
          let formattedSalary = 'Not specified';

          if (typeof rawSalary === 'number' && !Number.isNaN(rawSalary)) {
            const formattedNumber = new Intl.NumberFormat('fr-DZ').format(rawSalary);
            formattedSalary = `${formattedNumber} DZD`;
          } else if (typeof rawSalary === 'string' && rawSalary.length > 0) {
            const numberMatch = rawSalary.match(/[\d]+([\s,.][\d]+)*/);
            if (numberMatch) {
              const numericPart = numberMatch[0];
              const compact = numericPart.replace(/\s/g, '');
              const lastComma = compact.lastIndexOf(',');
              const lastDot = compact.lastIndexOf('.');
              const lastSeparatorIndex = Math.max(lastComma, lastDot);
              let parsed = Number.NaN;

              if (lastSeparatorIndex === -1) {
                parsed = Number(compact);
              } else {
                const integerPart = compact.slice(0, lastSeparatorIndex).replace(/[.,]/g, '');
                const fractionalPart = compact.slice(lastSeparatorIndex + 1);

                if (fractionalPart.length > 0 && fractionalPart.length <= 2) {
                  parsed = Number(`${integerPart}.${fractionalPart}`);
                } else {
                  parsed = Number(`${integerPart}${fractionalPart}`);
                }

                if (Number.isNaN(parsed)) {
                  parsed = Number(compact.replace(/[.,]/g, ''));
                }
              }

              if (!Number.isNaN(parsed)) {
                const formattedNumber = new Intl.NumberFormat('fr-DZ').format(parsed);
                const prefix = rawSalary.slice(0, numberMatch.index ?? 0).trim();
                const suffixRaw = rawSalary.slice((numberMatch.index ?? 0) + numericPart.length).trim();
                const suffix = suffixRaw.replace(/^(DZD|DA)\b/i, '').trim();
                const parts = [prefix, `${formattedNumber} DZD`, suffix]
                  .filter(Boolean)
                  .join(' ')
                  .replace(/\s{2,}/g, ' ')
                  .trim();
                formattedSalary = parts.length > 0 ? parts : `${formattedNumber} DZD`;
              } else {
                formattedSalary = rawSalary;
              }
            } else {
              formattedSalary = rawSalary;
            }
          }

          return {
            id: offer.id,
            applicationId,
            company: employer?.company_name || 'Unknown Company',
            companyLogoInitial,
            companyLogoUrl,
            jobTitle: offer.position || job?.title || 'Unknown Position',
            salary: formattedSalary,
            location: offer.work_location || 'Not specified',
            jobType: job?.employment_type || 'Not specified',
            startDate,
            benefits,
            status: offer.status as "pending" | "accepted" | "refused",
            offerDate,
            expiryDate,
          } as Offer;
        });

        setOffers(transformedOffers);

      } catch (error) {
        console.error("Error fetching offers:", error);
        toast({
          title: "Error",
          description: "Failed to load your job offers. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchOffers();
    }
  }, [user, authLoading, toast]);

  const handleUpdateOfferStatus = async (id: string, newStatus: "accepted" | "refused") => {
    // Optimistically update the UI
    const originalOffers = [...offers];
    const targetOffer = offers.find(offer => offer.id === id);
    const applicationId = targetOffer?.applicationId || null;
    setOffers(prevOffers =>
      prevOffers.map(offer =>
        offer.id === id ? { ...offer, status: newStatus } : offer
      )
    );

    try {
      const { error } = await supabase
        .from('offers')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      if (applicationId) {
        const now = new Date().toISOString();
        const applicationUpdates: Record<string, string> = { updated_at: now };

        if (newStatus === 'accepted') {
          applicationUpdates.stage = 'hired';
          applicationUpdates.status = 'hired';
        } else if (newStatus === 'refused') {
          applicationUpdates.stage = 'rejected-offer';
          applicationUpdates.status = 'rejected';
        }

        const { error: applicationError } = await supabase
          .from('applications')
          .update(applicationUpdates)
          .eq('id', applicationId);

        if (applicationError) throw applicationError;
      }

      toast({
        title: `Offer ${newStatus === 'accepted' ? 'Accepted' : 'Rejected'}!`,
        description: `You have successfully ${newStatus === 'accepted' ? 'accepted' : 'rejected'} the job offer.`,
      });
    } catch (error) {
      // Revert UI on error
      setOffers(originalOffers);
      console.error(`Error updating offer status:`, error);
      toast({
        title: "Error",
        description: "Could not update the offer status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case "accepted":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "refused":
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "accepted":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "refused":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Pending";
      case "accepted":
        return "Accepted";
      case "refused":
        return "Rejected";
      default:
        return status;
    }
  };

  const pendingOffers = offers.filter((o) => o.status === "pending");
  const acceptedOffers = offers.filter((o) => o.status === "accepted");
  const rejectedOffers = offers.filter((o) => o.status === "refused");

  const OfferCard = ({ offer }: { offer: Offer }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-full overflow-hidden flex items-center justify-center ${offer.companyLogoUrl ? '' : 'bg-gradient-primary text-white font-semibold'}`}
              >
                {offer.companyLogoUrl ? (
                  <img
                    src={offer.companyLogoUrl}
                    alt={`${offer.company} logo`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  offer.companyLogoInitial
                )}
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white text-lg">
                  {offer.jobTitle}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {offer.company}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(offer.status)}
              <Badge className={getStatusColor(offer.status)}>
                {getStatusLabel(offer.status)}
              </Badge>
            </div>
          </div>

          {/* Salary */}
          <div className="bg-primary/5 dark:bg-primary/10 rounded-lg p-4 border border-primary/10">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold text-primary text-lg">
                {offer.salary}
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Annual salary range
            </p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-slate-500" />
              <span className="text-slate-700 dark:text-slate-300">{offer.location}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Briefcase className="w-4 h-4 text-slate-500" />
              <span className="text-slate-700 dark:text-slate-300">{offer.jobType}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span className="text-slate-700 dark:text-slate-300">
                Start: {offer.startDate}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-slate-500" />
              <span className="text-slate-700 dark:text-slate-300">
                Expires: {offer.expiryDate}
              </span>
            </div>
          </div>

          {/* Benefits */}
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
              Benefits
            </p>
            <div className="flex flex-wrap gap-2">
              {offer.benefits.map((benefit, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {benefit}
                </Badge>
              ))}
            </div>
          </div>

          {/* Actions */}
          {offer.status === "pending" && (
            <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <Button
                onClick={() => handleUpdateOfferStatus(offer.id, 'refused')}
                variant="outline"
                className="flex-1 gap-2"
              >
                <XCircle className="w-4 h-4" />
                Reject Offer
              </Button>
              <Button
                onClick={() => handleUpdateOfferStatus(offer.id, 'accepted')}
                className="flex-1 gap-2 bg-gradient-primary hover:opacity-90"
              >
                <CheckCircle className="w-4 h-4" />
                Accept Offer
              </Button>
            </div>
          )}

          {offer.status === "accepted" && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 text-sm text-green-800 dark:text-green-200">
              ✓ You have accepted this offer. The employer will contact you soon.
            </div>
          )}

          {offer.status === "refused" && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-800 dark:text-red-200">
              ✗ You have rejected this offer.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (loading || authLoading) {
    return (
      <TalentLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-600">Loading your offers...</div>
        </div>
      </TalentLayout>
    );
  }

  return (
    <TalentLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Job Offers
          </h1>
          <p className="text-muted-foreground">Review and respond to job offers</p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="w-4 h-4" />
              Pending ({pendingOffers.length})
            </TabsTrigger>
            <TabsTrigger value="accepted" className="gap-2">
              <CheckCircle className="w-4 h-4" />
              Accepted ({acceptedOffers.length})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="gap-2">
              <XCircle className="w-4 h-4" />
              Rejected ({rejectedOffers.length})
            </TabsTrigger>
          </TabsList>

          {/* Pending Offers */}
          <TabsContent value="pending" className="space-y-4">
            {pendingOffers.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {pendingOffers.map((offer) => (
                  <OfferCard key={offer.id} offer={offer} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-12 pb-12 text-center">
                  <p className="text-slate-500 dark:text-slate-400">
                    No pending offers at the moment
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Accepted Offers */}
          <TabsContent value="accepted" className="space-y-4">
            {acceptedOffers.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {acceptedOffers.map((offer) => (
                  <OfferCard key={offer.id} offer={offer} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-12 pb-12 text-center">
                  <p className="text-slate-500 dark:text-slate-400">
                    You haven't accepted any offers yet
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Rejected Offers */}
          <TabsContent value="rejected" className="space-y-4">
            {rejectedOffers.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {rejectedOffers.map((offer) => (
                  <OfferCard key={offer.id} offer={offer} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-12 pb-12 text-center">
                  <p className="text-slate-500 dark:text-slate-400">
                    No rejected offers
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </TalentLayout>
  );
};

export default TalentOffers;
