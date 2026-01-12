"use client";

import React, { useEffect, useState } from "react";
import { type ApplicationStage } from "@/lib/supabase/api/get-job-application";
import { getAssessmentMonitoringLogs, type AssessmentMonitoringLog } from "@/lib/supabase/api/get-assessment-monitoring-logs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertTriangle, Camera, Clock, Eye, Loader2, ZoomIn } from "lucide-react";

interface MCQIncidentsProps {
  applicationStage: ApplicationStage;
}

export function MCQIncidents({ applicationStage }: MCQIncidentsProps) {
  const [logs, setLogs] = useState<AssessmentMonitoringLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await getAssessmentMonitoringLogs(applicationStage.application_id);
        if (cancelled) return;
        if (result.error) {
          setError(
            typeof result.error === "string"
              ? result.error
              : "Failed to load incidents"
          );
        } else {
          setLogs(Array.isArray(result.data) ? result.data : []);
        }
      } catch {
        if (!cancelled) setError("Failed to load incidents");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applicationStage.application_id]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  const getViolationIcon = (violationType: string | null) => {
    switch (violationType?.toLowerCase()) {
      case 'tab_switch':
        return <Eye className="h-4 w-4" />;
      case 'copy_paste':
        return <AlertTriangle className="h-4 w-4" />;
      case 'idle_time':
        return <Clock className="h-4 w-4" />;
      case 'camera_capture':
        return <Camera className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getViolationColors = (violationType: string | null) => {
    switch (violationType?.toLowerCase()) {
      case 'tab_switch':
        return { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", icon: "text-orange-600" };
      case 'copy_paste':
        return { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", icon: "text-red-600" };
      case 'idle_time':
        return { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-700", icon: "text-yellow-600" };
      case 'camera_capture':
        return { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", icon: "text-blue-600" };
      default:
        return { bg: "bg-gray-50", border: "border-gray-200", text: "text-gray-700", icon: "text-gray-600" };
    }
  };

  const formatViolationType = (violationType: string | null) => {
    if (!violationType) return "Unknown";
    return violationType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="mx-auto px-6 py-12">
        <div className="flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
          <p className="text-sm text-gray-600">Loading assessment incidents...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto px-6 py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 p-2 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-red-800">Error Loading Incidents</h3>
              <p className="text-sm text-red-700 mt-0.5">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="mx-auto px-6 py-12">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <Eye className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-2">No Incidents Detected</h3>
          <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
            Great! No irregularities or violations were detected during this assessment.
          </p>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 max-w-md mx-auto text-left">
            <p className="text-sm font-medium text-gray-700 mb-3">We monitor for incidents such as:</p>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-gray-400 mt-0.5">•</span>
                <span>Tab switching during assessment</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-400 mt-0.5">•</span>
                <span>Copy/paste attempts</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-400 mt-0.5">•</span>
                <span>Extended idle time</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-400 mt-0.5">•</span>
                <span>Browser focus loss</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-400 mt-0.5">•</span>
                <span>Suspicious activity patterns</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto p-2 space-y-4">
      {/* Summary Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Assessment Incidents</h3>
            <p className="text-sm text-gray-600 mt-0.5">
              {logs.length} incident{logs.length !== 1 ? 's' : ''} detected during the assessment
            </p>
          </div>
          <span className="text-sm font-semibold text-red-600 bg-red-50 px-3 py-1.5 rounded-full border border-red-200">
            {logs.length} Total
          </span>
        </div>
      </div>

      {/* Incidents List */}
      <div className="space-y-3">
        {logs.map((log) => {
          const colors = getViolationColors(log.violation_type);
          return (
            <div key={log.id} className={`bg-white border ${colors.border} border-l-4 rounded-lg p-4`}>
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`${colors.bg} p-1.5 rounded`}>
                      {React.cloneElement(getViolationIcon(log.violation_type), {
                        className: `h-4 w-4 ${colors.icon}`
                      })}
                    </div>
                    <h4 className="text-sm font-semibold text-gray-900">
                      {formatViolationType(log.violation_type)}
                    </h4>
                  </div>
                  <span className={`text-xs font-medium ${colors.text} ${colors.bg} px-2 py-1 rounded border ${colors.border}`}>
                    {formatViolationType(log.violation_type)}
                  </span>
                </div>

                {/* Timestamp */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>Captured at: {formatDate(log.captured_at)}</span>
                </div>

                {/* Screenshot */}
                {log.image_path && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Camera className="h-4 w-4" />
                      <span>Screenshot captured</span>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <div className="relative cursor-pointer group">
                          <img 
                            src={log.image_path} 
                            alt={`Assessment monitoring screenshot for ${formatViolationType(log.violation_type)}`}
                            className="w-full h-auto rounded-lg border border-gray-200 max-h-48 object-contain transition-opacity group-hover:opacity-75"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const errorDiv = document.createElement('div');
                              errorDiv.className = 'text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200';
                              errorDiv.textContent = 'Failed to load screenshot';
                              target.parentNode?.appendChild(errorDiv);
                            }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-lg">
                            <div className="bg-white p-2 rounded-full shadow-lg">
                              <ZoomIn className="h-5 w-5 text-gray-700" />
                            </div>
                          </div>
                        </div>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
                        <DialogHeader className="p-6 pb-2">
                          <DialogTitle className="flex items-center gap-2 text-base">
                            <Camera className="h-5 w-5" />
                            Screenshot - {formatViolationType(log.violation_type)}
                          </DialogTitle>
                          <p className="text-sm text-gray-600">
                            Captured at: {formatDate(log.captured_at)}
                          </p>
                        </DialogHeader>
                        <div className="px-6 pb-6">
                          <img 
                            src={log.image_path} 
                            alt={`Full assessment monitoring screenshot for ${formatViolationType(log.violation_type)}`}
                            className="w-full h-auto rounded-lg border border-gray-200 max-h-[70vh] object-contain"
                          />
                        </div>
                      </DialogContent>
                    </Dialog>
                    <p className="text-xs text-gray-500">
                      Click to view full size
                    </p>
                  </div>
                )}

                {/* Incident ID */}
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500">Incident ID: {log.id}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}