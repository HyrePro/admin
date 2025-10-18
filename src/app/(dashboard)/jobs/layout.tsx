
import React from "react";

export default function JobsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  

  return (
    <div className="flex flex-col h-full">
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
