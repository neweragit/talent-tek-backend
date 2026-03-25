import { useState } from "react";
import SettingsSidebar from "@/components/sidebar/SettingsSidebar";
import { Shield, Lock, Users, Mail } from "lucide-react";

function AccountTab() {
  return (
    <div className="p-8">
      <h2 className="text-xl font-bold mb-6">Security Settings</h2>
      <div className="mb-8">
        <h3 className="font-semibold mb-2 flex items-center gap-2"><Shield className="w-4 h-4" /> Security Settings</h3>
        <h3 className="font-semibold mb-2 flex items-center gap-2"><Lock className="w-4 h-4" /> Password Settings</h3>
        <form className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium mb-1">Current Password</label>
            <input type="password" className="w-full border rounded px-3 py-2" placeholder="Enter your current password" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">New Password</label>
            <input type="password" className="w-full border rounded px-3 py-2" placeholder="Enter new password" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Confirm New Password</label>
            <input type="password" className="w-full border rounded px-3 py-2" placeholder="Confirm new password" />
          </div>
          <button type="submit" className="bg-primary text-white px-4 py-2 rounded font-semibold">Update Password</button>
        </form>
      </div>
    </div>
  );
}

function TeamTab() {
  return (
    <div className="p-8">
      <h2 className="text-xl font-bold mb-6">Team Members</h2>
      <div className="mb-8">
        <button className="bg-primary text-white px-4 py-2 rounded font-semibold mb-4">Invite Member</button>
        <h3 className="font-semibold mb-2 flex items-center gap-2"><Users className="w-4 h-4" /> Active Members</h3>
        <div className="bg-white border rounded-lg p-4 flex items-center gap-4">
          <Mail className="w-6 h-6 text-primary" />
          <div>
            <div className="font-medium text-gray-900">hellotalenthub.tech@gmail.com</div>
            <div className="text-sm text-gray-500">Joined 9/16/2025</div>
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">owner</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState("account");
  return (
    <div className="flex min-h-screen">
      <SettingsSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 bg-gray-50">
        {activeTab === "account" && <AccountTab />}
        {activeTab === "team" && <TeamTab />}
      </main>
    </div>
  );
}
