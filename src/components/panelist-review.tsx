"use client";

import React, { useEffect, useState } from "react";
import { Lock, Edit3, Users } from "lucide-react";
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

        // Create Supabase client
        const supabase = createClient();
        
        // Fetch panelist review data using RPC
        const { data, error } = await supabase.rpc('get_panelist_review', {
          p_job_application_id: jobApplicationId
        });

        if (error) {
          throw new Error(error.message);
        }

        console.log(data?.panelists); // For debugging
        console.log(data?.rubrics); // For debugging

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
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6" />
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  const noData = rubrics.length === 0 || panelists.length === 0;

  // Additional rows for comments
  const commentRows = [
    { key: 'recommendation', label: 'Recommendation' },
    { key: 'strengths', label: 'Strengths' },
    { key: 'areas_for_improvement', label: 'Areas for Improvement' },
    { key: 'comments', label: 'Additional Comments' }
  ];

  return (
    <div className="flex flex-col h-full">
      {noData ? (
        <div className="p-6">
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No Panelist Reviews Available</h3>
            <p className="text-gray-500">
              Panelist evaluations have not been submitted for this application yet.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg flex-1 overflow-y-auto p-6">
          <div className="overflow-x-auto relative h-full">
            <table className="min-w-full divide-y divide-gray-200" style={{ width: 'max-content' }}>
              <thead className="bg-gray-50">
                <tr>
                  <th className="sticky left-0 z-10 bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r-2 border-gray-300">
                    Criteria
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">
                    Overall
                  </th>
                  {panelists.map((p) => (
                    <th
                      key={p.panelist_email}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]"
                    >
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <span className="truncate" title={p.panelist_email}>
                            {p.panelist_email}
                          </span>
                          {p.submitted ? (
                            <Lock className="h-4 w-4 text-gray-500 flex-shrink-0" />
                          ) : (
                            <Edit3 className="h-4 w-4 text-blue-500 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {/* Total Score Row */}
                <tr className="bg-blue-50 font-semibold">
                  <td className="sticky left-0 z-10 bg-blue-50 px-6 py-4 text-sm text-gray-900 border-r-1 border-gray-300">
                    Total Score
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {(() => {
                      // Calculate overall score: sum of all panelist totals / number of submitted panelists
                      // Only consider numeric type rubrics for average calculation
                      const submittedPanelists = panelists.filter(p => p.submitted);
                      if (submittedPanelists.length === 0) return '-';
                      
                      const numericRubrics = rubrics.filter(r => r.type === 'numeric');
                      
                      const totalScoreSum = panelists.reduce((sum, p) => {
                        // Only sum scores from numeric rubrics
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
                      
                      return maxScore > 0 ? `${averageScore.toFixed(1)} / ${maxScore}` : '-';
                    })()}
                  </td>
                  {panelists.map((p) => {
                    // Calculate total score only for numeric rubrics
                    const numericScores = p.scores.filter(scoreObj => {
                      const rubricId = scoreObj.rubric_id || scoreObj.id;
                      const rubric = rubrics.find(r => r.rubric_id === rubricId);
                      return rubric && rubric.type === 'numeric';
                    });
                    
                    const totalScore = numericScores.reduce((sum, s) => sum + Number(s.score || 0), 0);
                    const maxScore = rubrics.filter(r => r.type === 'numeric').reduce((sum, r) => sum + r.out_of, 0);
                    
                    return (
                      <td
                        key={`total-${p.panelist_email}`}
                        className="px-6 py-4 text-sm text-gray-900"
                      >
                        {totalScore} / {maxScore}
                      </td>
                    );
                  })}
                </tr>

                {/* Rubric Score Rows - Only show rubrics from the main rubrics array */}
                {rubrics.map((rubric) => (
                  <tr key={rubric.rubric_id} className="hover:bg-gray-50">
                    <td className="sticky left-0 z-10 bg-white hover:bg-gray-50 px-6 py-4 text-sm font-medium text-gray-900 border-r-2 border-gray-300">
                      <div className="flex flex-col">
                        <span>{rubric.name}</span>
                        {rubric.criterion && (
                          <span className="text-xs text-gray-500 mt-1">{rubric.criterion}</span>
                        )}
                        <span className="text-xs text-gray-400 mt-1">
                          (Out of {rubric.out_of})
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {(() => {
                        // Only calculate average for numeric type rubrics
                        if (rubric.type !== 'numeric') {
                          return '-';
                        }
                        
                        // Calculate average score for this rubric across submitted panelists
                        const submittedPanelists = panelists.filter(p => p.submitted);
                        if (submittedPanelists.length === 0) return '-';
                        
                        const rubricScores = submittedPanelists.map(p => {
                          // Find score by either rubric_id or id field
                          const scoreObj = p.scores.find(
                            (s) => (s.rubric_id || s.id) === rubric.rubric_id
                          );
                          return scoreObj ? Number(scoreObj.score || 0) : 0;
                        });
                        
                        const averageScore = rubricScores.reduce((sum, score) => sum + score, 0) / submittedPanelists.length;
                        return `${averageScore.toFixed(1)} / ${rubric.out_of}`;
                      })()}
                    </td>
                    {panelists.map((p) => {
                      // Find score by either rubric_id or id field
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
                              className="h-5 w-5 text-blue-600 rounded cursor-default"
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

                {/* Comment Rows */}
                {commentRows.map((row) => (
                  <tr key={row.key} className="bg-gray-50">
                    <td className="sticky left-0 z-10 bg-gray-50 px-6 py-4 text-sm font-medium text-gray-700 border-r-2 border-gray-300">
                      {row.label}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {row.key === 'recommendation' ? (
                        // Show most common recommendation
                        (() => {
                          const submittedPanelists = panelists.filter(p => p.submitted);
                          const recommendations = submittedPanelists
                            .map(p => p.recommendation)
                            .filter(Boolean);
                            
                            if (recommendations.length === 0) return '-';
                            
                            // Count occurrences of each recommendation
                            const counts: Record<string, number> = {};
                            recommendations.forEach(rec => {
                              const recString = String(rec);
                              counts[recString] = (counts[recString] || 0) + 1;
                            });
                            
                            // Find the most common recommendation
                            const entries = Object.entries(counts);
                            if (entries.length === 0) return '-';
                            
                            const mostCommon = entries.reduce((a, b) => 
                              a[1] > b[1] ? a : b
                            )[0];
                            
                            return mostCommon.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                          })()
                      ) : (
                        // For other comment fields, show a summary
                        <div className="max-w-xs text-xs">
                          {panelists
                            .filter(p => p.submitted && p[row.key as keyof Panelist])
                            .filter(p => {
                              const value = p[row.key as keyof Panelist];
                              return value !== undefined && value !== null && value !== '';
                            })
                            .slice(0, 3)
                            .map((p, i) => {
                              const value = p[row.key as keyof Panelist];
                              return (
                                <div key={i} className="truncate" title={String(value)}>
                                  • {String(value)}
                                </div>
                              );
                            })}
                          {panelists.filter(p => p.submitted && p[row.key as keyof Panelist]).filter(p => {
                            const value = p[row.key as keyof Panelist];
                            return value !== undefined && value !== null && value !== '';
                          }).length > 3 && (
                            <div>...and {panelists.filter(p => p.submitted && p[row.key as keyof Panelist]).filter(p => {
                              const value = p[row.key as keyof Panelist];
                              return value !== undefined && value !== null && value !== '';
                            }).length - 3} more</div>
                          )}
                          {panelists.filter(p => p.submitted && p[row.key as keyof Panelist]).filter(p => {
                            const value = p[row.key as keyof Panelist];
                            return value !== undefined && value !== null && value !== '';
                          }).length === 0 && '-'}
                        </div>
                      )}
                    </td>
                    {panelists.map((p) => {
                      let value = p[row.key as keyof Panelist];
                      
                      // Format recommendation
                      if (row.key === 'recommendation' && value) {
                        value = String(value).replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                      }
                      
                      // Handle empty string values
                      const isEmpty = value === undefined || value === null || value === '';
                      
                      return (
                        <td
                          key={`${p.panelist_email}-${row.key}`}
                          className="px-6 py-4 text-sm text-gray-600"
                        >
                          {Array.isArray(value) ? (
                            <span>{JSON.stringify(value)}</span>
                          ) : isEmpty ? (
                            '-'
                          ) : (
                            String(value)
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
      )}
    </div>
  );
};