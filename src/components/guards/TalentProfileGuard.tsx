import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { calculateProfileCompletion } from "@/utils/talentProfile";
import { Loader2 } from "lucide-react";

interface TalentProfileGuardProps {
  children: React.ReactNode;
}

const TalentProfileGuard = ({ children }: TalentProfileGuardProps) => {
  const { user } = useAuth();
  const location = useLocation();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [completion, setCompletion] = useState<number | null>(null);

  useEffect(() => {
    let ignore = false;

    const checkProfileCompletion = async () => {
      if (!user) {
        if (!ignore) setLoading(false);
        return;
      }

      try {
        const { data: talent, error } = await supabase
          .from("talents")
          .select(
            "full_name, phone_number, city, current_position, years_of_experience, education_level, short_bio, linkedin_url, github_url, portfolio_url, skills"
          )
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) throw error;

        if (talent) {
          const [firstName = "", ...rest] = (talent.full_name || "").split(" ");
          const lastName = rest.join(" ");

          const profileData = {
            firstName: firstName || "",
            lastName: lastName || "",
            email: user.email || "",
            phone: talent.phone_number || "",
            city: talent.city || "",
            bio: talent.short_bio || "",
            title: talent.current_position || "",
            linkedin: talent.linkedin_url || "",
            github: talent.github_url || "",
            website: talent.portfolio_url || "",
            experience: talent.years_of_experience || "",
            education: talent.education_level || "",
            skills: (talent.skills as string[]) || [],
          };

          const pct = calculateProfileCompletion(profileData);
          if (!ignore) setCompletion(pct);
        } else {
          if (!ignore) setCompletion(0);
        }
      } catch (err) {
        console.error("Failed to check profile completion", err);
        if (!ignore) setCompletion(0);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    void checkProfileCompletion();

    return () => {
      ignore = true;
    };
  }, [user]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-orange-50/50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-orange-600" />
          <p className="font-semibold text-slate-700">Verifying profile...</p>
        </div>
      </div>
    );
  }

  // If completion is checked and is less than 100, and we are not already on the profile page, redirect.
  // Note: Overview and Support Tickets are excluded per requirements from wrapping, 
  // but if this guard is applied only to specific routes, this check might be redundant but safe.
  if (completion !== null && completion < 100) {
    if (location.pathname !== "/talent/profile") {
      // Defer toast to avoid state updates during render phase
      setTimeout(() => {
        toast({
          title: "Profile Incomplete",
          description: "Please complete your profile to 100% to access this feature.",
          variant: "default", // Can use destructive if preferred
        });
      }, 0);
      return <Navigate to="/talent/profile" replace />;
    }
  }

  return <>{children}</>;
};

export default TalentProfileGuard;
