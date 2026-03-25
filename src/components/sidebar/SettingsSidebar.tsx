import { useState } from "react";
import { User, Shield, Lock, Users, Mail } from "lucide-react";

const tabs = [
  { id: "account", label: "Account", icon: <User className="w-5 h-5" /> },
  { id: "team", label: "Team Members", icon: <Users className="w-5 h-5" /> },
];

export default function SettingsSidebar({ activeTab, setActiveTab }) {
  return (
    <aside className="w-64 bg-white border-r min-h-screen p-6 flex flex-col gap-6">
      <h2 className="text-lg font-bold mb-4">Settings</h2>
      <nav className="flex flex-col gap-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-left font-medium transition-colors ${activeTab === tab.id ? "bg-primary/10 text-primary" : "text-gray-700 hover:bg-gray-50"}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
