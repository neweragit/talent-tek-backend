import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

const FeatureCard = ({ icon: Icon, title, description }: FeatureCardProps) => {
  return (
    <Card className="rounded-lg sm:rounded-2xl border-2 border-orange-200 bg-white transition-all duration-300 hover:border-orange-500 hover:shadow-2xl hover:shadow-orange-100">
      <CardContent className="p-6">
        <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center mb-4">
          <Icon className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2">{title}</h3>
        <p className="text-sm sm:text-base leading-relaxed text-gray-700">{description}</p>
      </CardContent>
    </Card>
  );
};

export default FeatureCard;
