"use client";

import React, { useEffect, useState } from "react";
import { type ApplicationStage } from "@/lib/supabase/api/get-job-application";
import { getAssessmentMonitoringLogs, type AssessmentMonitoringLog } from "@/lib/supabase/api/get-assessment-monitoring-logs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  const getViolationBadgeColor = (violationType: string | null) => {
    switch (violationType?.toLowerCase()) {
      case 'tab_switch':
        return "bg-orange-50 text-orange-700 border-orange-200";
      case 'copy_paste':
        return "bg-red-50 text-red-700 border-red-200";
      case 'idle_time':
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case 'camera_capture':
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const formatViolationType = (violationType: string | null) => {
    if (!violationType) return "Unknown";
    return violationType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
          <span className="ml-2 text-gray-600">Loading assessment incidents...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 px-4">
        <div className="text-center py-8">
          <div className="bg-red-50 rounded-full p-4 inline-block mb-4">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Incidents</h3>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="space-y-4 px-4">
        <div className="text-center py-8">
          <div className="bg-green-50 rounded-full p-4 inline-block mb-4">
            <Eye className="h-8 w-8 text-green-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Incidents Detected</h3>
          <p className="text-gray-600 mb-4">
            Great! No irregularities or violations were detected during this assessment.
          </p>
          <div className="bg-gray-50 p-6 rounded-lg">
            <p className="text-sm text-gray-500">
              We monitor for incidents such as:
            </p>
            <ul className="text-sm text-gray-500 mt-2 space-y-1">
              <li>• Tab switching during assessment</li>
              <li>• Copy/paste attempts</li>
              <li>• Extended idle time</li>
              <li>• Browser focus loss</li>
              <li>• Suspicious activity patterns</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto space-y-4  px-4">
      <div className="flex items-center justify-between mb-6 mt-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Assessment Incidents</h3>
          <p className="text-gray-600">
            {logs.length} incident{logs.length !== 1 ? 's' : ''} detected during the assessment
          </p>
        </div>
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          {logs.length} Total
        </Badge>
      </div>

      <div className="space-y-3">
        {logs.map((log) => (
          <Card key={log.id} className="border-l-4 border-l-red-400">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getViolationIcon(log.violation_type)}
                  <CardTitle className="text-base font-medium">
                    {formatViolationType(log.violation_type)}
                  </CardTitle>
                </div>
                <Badge 
                  variant="outline" 
                  className={getViolationBadgeColor(log.violation_type)}
                >
                  {formatViolationType(log.violation_type)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>Captured at: {formatDate(log.captured_at)}</span>
                </div>
                {log.image_path && (
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <Camera className="h-4 w-4 mr-2" />
                      <span>Screenshot captured</span>
                    </div>
                    <div className="mt-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <div className="relative cursor-pointer group">
                            <img 
                              src={log.image_path} 
                              alt={`Assessment monitoring screenshot for ${formatViolationType(log.violation_type)}`}
                              className="max-w-full h-auto rounded-lg border border-gray-200 shadow-sm max-h-48 object-contain transition-opacity group-hover:opacity-75"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const errorDiv = document.createElement('div');
                                errorDiv.className = 'text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200';
                                errorDiv.textContent = 'Failed to load screenshot';
                                target.parentNode?.appendChild(errorDiv);
                              }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-lg">
                              <div className="bg-white/90 p-2 rounded-full">
                                <ZoomIn className="h-5 w-5 text-gray-700" />
                              </div>
                            </div>
                          </div>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
                          <DialogHeader className="p-6 pb-2">
                            <DialogTitle className="flex items-center gap-2">
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
                              className="w-full h-auto rounded-lg border border-gray-200 shadow-sm max-h-[70vh] object-contain"
                            />
                          </div>
                        </DialogContent>
                      </Dialog>
                      <p className="text-xs text-gray-500 mt-1">
                        Click to view full size
                      </p>
                    </div>
                  </div>
                )}
                <div className="text-xs text-gray-500">
                  Incident ID: {log.id}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}