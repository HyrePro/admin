"use client";

import React from "react";
import { Button } from "@/components/ui/button";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex h-full min-h-[240px] items-center justify-center p-6">
      <div className="max-w-md text-center space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Something went wrong</h2>
        <p className="text-sm text-gray-600">{error.message || "Please try again."}</p>
        <Button onClick={reset} variant="outline">
          Retry
        </Button>
      </div>
    </div>
  );
}
