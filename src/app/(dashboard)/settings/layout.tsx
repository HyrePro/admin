'use client'
import React from "react";
import '@/styles/settings.css';
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Extract the last segment of the pathname to determine active tab
  const activeTab = pathname.split("/").pop() || "account";

  const tabs = [
    { name: "Account", href: "/settings/account", value: "account" },
    { name: "School Information", href: "/settings/school-information", value: "school-information" },
    { name: "Interviews", href: "/settings/interviews", value: "interviews" },
    { name: "Users", href: "/settings/users", value: "users" },
  ];

  return (
    <div className="settings-container flex flex-col h-screen overflow-hidden">
      <div className="settings-header">
        <h1 className="settings-title">Settings</h1>
      </div>
      
      <div className="border-b border-gray-200">
        <nav className="flex overflow-x-auto px-2 hide-scrollbar" aria-label="Tabs">
          {tabs.map((tab) => (
            <Link
              key={tab.name}
              href={tab.href}
              className={`${
                activeTab === tab.value
                  ? 'border-blue-500 border-b text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap pb-4 px-3 border-b-2 font-medium text-sm flex-shrink-0`}
              scroll={false}
            >
              {tab.name}
            </Link>
          ))}
        </nav>
      </div>
        
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}