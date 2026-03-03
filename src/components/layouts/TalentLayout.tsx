import { Link, useLocation } from "react-router-dom";
import DashboardNavbar from "./DashboardNavbar";
import { Home, FileText, User, MessageSquare, Gift, Video, Briefcase } from "lucide-react";
import { useState } from "react";

interface TalentLayoutProps {
  children: React.ReactNode;
}

const TalentLayout = ({ children }: TalentLayoutProps) => {
  const location = useLocation();
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  
  const menuItems = [
    { label: "Overview", icon: Home, path: "/talent/overview" },
    {
      label: "Interviews",
      icon: Video,
      path: null,
      subItems: [
        { label: "TA Interviews", path: "/talent/interviews/ta" },
        { label: "Technical  Interviews", path: "/talent/interviews/it" },
        { label: "Leadership Interviews", path: "/talent/interviews/leadership" },
      ],
    },
    { label: "Applications", icon: FileText, path: "/talent/applications" },
    { label: "Offers", icon: Gift, path: "/talent/offers" },
    { label: "Profile", icon: User, path: "/talent/profile" },
    { label: "Support Tickets", icon: MessageSquare, path: "/talent/support-tickets" },
    { label: "My Services", icon: Briefcase, path: "/talent/services" },
  ];

  return (
    <div className="min-h-screen flex w-full">
      <aside className="w-64 border-r bg-card">
        <div className="p-6 border-b">
          <h2 className="text-lg font-bold">TalenTek Talent</h2>
        </div>
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isExpanded = expandedMenu === item.label;
            const isSubItemActive = hasSubItems && item.subItems.some(sub => location.pathname === sub.path);

            return (
              <div key={item.label}>
                {hasSubItems ? (
                  <button
                    onClick={() =>
                      setExpandedMenu(isExpanded ? null : item.label)
                    }
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                      isSubItemActive || isExpanded
                        ? "bg-primary/10 text-primary"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span className="flex-1 text-left font-medium">{item.label}</span>
                    <svg
                      className={`h-4 w-4 transition-transform duration-300 flex-shrink-0 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 14l-7 7m0 0l-7-7m7 7V3"
                      />
                    </svg>
                  </button>
                ) : (
                  <Link
                    to={item.path || "#"}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                )}
                {hasSubItems && isExpanded && (
                  <div className="mt-1 ml-4 space-y-1 border-l-2 border-primary/20 pl-3">
                    {item.subItems.map((subItem) => {
                      const isSubActive = location.pathname === subItem.path;
                      return (
                        <Link
                          key={subItem.path}
                          to={subItem.path}
                          className={`block px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                            isSubActive
                              ? "bg-primary/20 text-primary"
                              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                          }`}
                        >
                          {subItem.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>
      
      <div className="flex-1 flex flex-col">
        <DashboardNavbar title="TalenTek Talent" />
        <main className="flex-1 p-6 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
};

export default TalentLayout;
