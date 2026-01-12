"use client";

import React, { useEffect, useState } from "react";
import { Lock, Edit3, Users, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/api/client";

interface Rubric {
  rubric_id: string;
  name: string;
  description?: string;
  type: string;
  out_of: number;
  criterion?: string | null;
}

interface ScoreEntry {
  rubric_id?: string;
  id?: string;
  score: number | string;
}

interface Panelist {
  panelist_email: string;
  scores: ScoreEntry[];
  submitted: boolean;
  comments?: string;
  strengths?: string;
  areas_for_improvement?: string;
  recommendation?: string;
}

interface PanelistReviewProps {
  jobApplicationId: string;
}

export const PanelistReview: React.FC<PanelistReviewProps> = ({ jobApplicationId }) => {
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [panelists, setPanelists] = useState<Panelist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const supabase = createClient();
        
        const { data, error } = await supabase.rpc('get_panelist_review', {
          p_job_application_id: jobApplicationId
        });

        if (error) {
          throw new Error(error.message);
        }

        if (data?.panelists && data?.rubrics) {
          setRubrics(data.rubrics);
          setPanelists(data.panelists);
        } else {
          setRubrics([]);
          setPanelists([]);
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    if (jobApplicationId) load();
  }, [jobApplicationId]);

  if (loading) {
    return (
      <div className="mx-auto px-6 py-12">
        <div className="flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
          <p className="text-sm text-gray-600">Loading panelist reviews...</p>
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
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-red-800">Error Loading Reviews</h3>
              <p className="text-sm text-red-700 mt-0.5">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const noData = rubrics.length === 0 || panelists.length === 0;

  if (noData) {
    return (
      <div className="mx-auto px-6 py-12">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            <Users className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-2">No Panelist Reviews Available</h3>
          <p className="text-sm text-gray-500">
            Panelist evaluations have not been submitted for this application yet.
          </p>
        </div>
      </div>
    );
  }

  // Calculate overall metrics
  const submittedPanelists = panelists.filter(p => p.submitted);
  const numericRubrics = rubrics.filter(r => r.type === 'numeric');
  
  const totalScoreSum = panelists.reduce((sum, p) => {
    const panelistTotal = p.scores
      .filter(scoreObj => {
        const rubricId = scoreObj.rubric_id || scoreObj.id;
        const rubric = rubrics.find(r => r.rubric_id === rubricId);
        return rubric && rubric.type === 'numeric';
      })
      .reduce((scoreSum, s) => scoreSum + Number(s.score || 0), 0);
    return sum + panelistTotal;
  }, 0);
  
  const maxScore = numericRubrics.reduce((sum, r) => sum + r.out_of, 0);
  const averageScore = submittedPanelists.length > 0 ? totalScoreSum / submittedPanelists.length : 0;

  // Get most common recommendation
  const recommendations = submittedPanelists
    .map(p => p.recommendation)
    .filter(Boolean);
  
  let mostCommonRecommendation = '-';
  if (recommendations.length > 0) {
    const counts: Record<string, number> = {};
    recommendations.forEach(rec => {
      const recString = String(rec);
      counts[recString] = (counts[recString] || 0) + 1;
    });
    
    const entries = Object.entries(counts);
    if (entries.length > 0) {
      mostCommonRecommendation = entries.reduce((a, b) => 
        a[1] > b[1] ? a : b
      )[0].replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  }

  return (
    <div className="mx-auto px-6 py-6 space-y-6">
      {/* Summary Card */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Panel Assessment Summary</h3>
            <p className="text-sm text-gray-700">
              {submittedPanelists.length} of {panelists.length} panelists have submitted their reviews
            </p>
            <p className="text-sm text-gray-700 mt-2">
              <span className="font-medium">Consensus Recommendation:</span> {mostCommonRecommendation}
            </p>
          </div>
          <div className="text-center ml-6">
            <div className="text-5xl font-bold text-blue-600">
              {maxScore > 0 ? averageScore.toFixed(1) : '-'}
            </div>
            <div className="text-sm text-gray-600 mt-1">Average Score / {maxScore}</div>
          </div>
        </div>
      </div>

      {/* Panelist Status Cards */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">Panelist Reviews</h3>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {panelists.map((panelist) => {
              const numericScores = panelist.scores.filter(scoreObj => {
                const rubricId = scoreObj.rubric_id || scoreObj.id;
                const rubric = rubrics.find(r => r.rubric_id === rubricId);
                return rubric && rubric.type === 'numeric';
              });
              
              const totalScore = numericScores.reduce((sum, s) => sum + Number(s.score || 0), 0);
              
              return (
                <div 
                  key={panelist.panelist_email}
                  className={`border rounded-lg p-4 ${
                    panelist.submitted ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate" title={panelist.panelist_email}>
                        {panelist.panelist_email}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Score: {totalScore} / {maxScore}
                      </p>
                    </div>
                    {panelist.submitted ? (
                      <div className="flex items-center gap-1 text-green-700 flex-shrink-0 ml-2">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-xs font-medium">Submitted</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-amber-700 flex-shrink-0 ml-2">
                        <Edit3 className="h-4 w-4" />
                        <span className="text-xs font-medium">Pending</span>
                      </div>
                    )}
                  </div>
                  
                  {panelist.recommendation && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-600">Recommendation:</p>
                      <p className="text-sm font-medium text-gray-900 mt-0.5">
                        {String(panelist.recommendation).replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Detailed Scores Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">Detailed Evaluation</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Criteria
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Average
                </th>
                {panelists.map((p) => (
                  <th
                    key={p.panelist_email}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="truncate max-w-[150px]" title={p.panelist_email}>
                        {p.panelist_email.split('@')[0]}
                      </span>
                      {p.submitted ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <Lock className="h-3 w-3" />
                          <span className="text-[10px]">Submitted</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-amber-600">
                          <Edit3 className="h-3 w-3" />
                          <span className="text-[10px]">Pending</span>
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rubrics.map((rubric) => (
                <tr key={rubric.rubric_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900">{rubric.name}</span>
                      {rubric.criterion && (
                        <span className="text-xs text-gray-500 mt-1">{rubric.criterion}</span>
                      )}
                      <span className="text-xs text-gray-400 mt-1">
                        (Out of {rubric.out_of})
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {rubric.type === 'numeric' ? (
                      <span className="font-semibold text-blue-600">
                        {(() => {
                          if (submittedPanelists.length === 0) return '-';
                          
                          const rubricScores = submittedPanelists.map(p => {
                            const scoreObj = p.scores.find(
                              (s) => (s.rubric_id || s.id) === rubric.rubric_id
                            );
                            return scoreObj ? Number(scoreObj.score || 0) : 0;
                          });
                          
                          const avg = rubricScores.reduce((sum, score) => sum + score, 0) / submittedPanelists.length;
                          return `${avg.toFixed(1)} / ${rubric.out_of}`;
                        })()}
                      </span>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                  {panelists.map((p) => {
                    const scoreObj = p.scores.find(
                      (s) => (s.rubric_id || s.id) === rubric.rubric_id
                    );
                    const score = scoreObj?.score;
                  
                    return (
                      <td
                        key={`${p.panelist_email}-${rubric.rubric_id}`}
                        className="px-6 py-4 text-sm"
                      >
                        {rubric.type === 'boolean' ? (
                          <input
                            type="checkbox"
                            checked={Number(score) === 1}
                            readOnly
                            className="h-4 w-4 text-blue-600 rounded cursor-default"
                          />
                        ) : (
                          <span className="font-medium text-gray-900">
                            {score !== undefined ? score : "-"}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Feedback Section */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">Panelist Feedback</h3>
        </div>
        <div className="p-5 space-y-6">
          {panelists.filter(p => p.submitted).map((panelist) => (
            <div key={panelist.panelist_email} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-900">{panelist.panelist_email}</h4>
                {panelist.recommendation && (
                  <span className="text-xs font-medium px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    {String(panelist.recommendation).replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                )}
              </div>
              
              <div className="space-y-3">
                {panelist.strengths && (
                  <div>
                    <p className="text-xs font-medium text-green-700 mb-1">Strengths</p>
                    <p className="text-sm text-gray-700">{panelist.strengths}</p>
                  </div>
                )}
                
                {panelist.areas_for_improvement && (
                  <div>
                    <p className="text-xs font-medium text-amber-700 mb-1">Areas for Improvement</p>
                    <p className="text-sm text-gray-700">{panelist.areas_for_improvement}</p>
                  </div>
                )}
                
                {panelist.comments && (
                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-1">Additional Comments</p>
                    <p className="text-sm text-gray-700">{panelist.comments}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {submittedPanelists.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">
              No feedback available yet. Waiting for panelist submissions.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};