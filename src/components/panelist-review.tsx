"use client";

import React, { useEffect, useState } from "react";
import { Lock, Edit3 } from "lucide-react";

interface Rubric {
  rubric_id: string;
  name: string;
  description?: string;
  type: string;
  out_of: number;
  criterion?: string | null;
}

interface ScoreEntry {
  rubric_id: string;
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
  rubrics?: Rubric[];
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

        // Simulated data for demonstration
        const data = {
          rubrics: [
            {"name":"Subject Knowledge","type":"numeric","out_of":10,"criterion":"subject-knowledge","rubric_id":"dc25a19d-1844-4c53-979d-0dfabfc2ffe8"},
            {"name":"Communication Clarity","type":"numeric","out_of":10,"criterion":"communication-clarity","rubric_id":"45d30a09-78b9-43d1-aac6-aa525b5db245"},
            {"name":"Pedagogical Approach","type":"numeric","out_of":10,"criterion":"pedagogical-approach","rubric_id":"32e24946-1f5c-4421-8fe5-b43aec4b2bf5"},
            {"name":"Engagement & Interaction","type":"numeric","out_of":10,"criterion":"engagement-interaction","rubric_id":"e9c2b9f9-93b3-4af5-818a-582a69af133f"},
            {"name":"Confidence & Professional Demeanor","type":"numeric","out_of":10,"criterion":"confidence-professionalism","rubric_id":"53703197-cd3f-48d3-9757-797679744363"},
            {"name":"Use of Teaching Aids / Technology","type":"numeric","out_of":10,"criterion":"teaching-aids","rubric_id":"4358352b-e5c7-492c-8a22-3f9abfd252a5"},
            {"name":"Language Proficiency","type":"numeric","out_of":10,"criterion":"language-proficiency","rubric_id":"fee52392-7954-4094-8dd6-fa6d27313b4e"},
            {"name":"Adaptability & Responsiveness","type":"numeric","out_of":10,"criterion":"adaptability-responsiveness","rubric_id":"4a2e9509-f630-433f-86e2-64d3131daa7d"},
            {"name":"Overall Teaching Effectiveness","type":"numeric","out_of":10,"criterion":"teaching-effectiveness","rubric_id":"81cde521-10d0-462b-9a59-a932c33de2ac"},
            {"name":"Classroom Management","type":"boolean","out_of":10,"criterion":"classroom-management","rubric_id":"1248fa4f-2269-4727-8dba-edb39396f513"},
            {"name":"Subject Knowledge","type":"numeric","out_of":10,"criterion":null,"rubric_id":"4f176c8b-d2e7-4097-9a09-741c3de0cc84"},
            {"name":"Communication Clarity","type":"numeric","out_of":10,"criterion":null,"rubric_id":"333fe8ca-8bca-4f35-9302-1153ed5329a4"},
            {"name":"Pedagogical Approach","type":"numeric","out_of":10,"criterion":null,"rubric_id":"8b1f0512-4963-4913-926c-4fdcddcace04"},
            {"name":"Engagement & Interaction","type":"numeric","out_of":10,"criterion":null,"rubric_id":"d3cd201c-15cc-4bfc-90ea-9055245f5e50"},
            {"name":"Confidence & Professional Demeanor","type":"numeric","out_of":10,"criterion":null,"rubric_id":"36013c8c-e1b2-47ec-8e6a-ca278df61667"},
            {"name":"Use of Teaching Aids / Technology","type":"numeric","out_of":10,"criterion":null,"rubric_id":"4a52faae-06cf-408b-a6aa-64ce307b8dea"},
            {"name":"Language Proficiency","type":"numeric","out_of":10,"criterion":null,"rubric_id":"e39c92ca-346c-4c50-974f-8783dfd378e3"},
            {"name":"Adaptability & Responsiveness","type":"numeric","out_of":10,"criterion":null,"rubric_id":"5f3ba42f-eed1-4314-9238-75214f53c528"},
            {"name":"Overall Teaching Effectiveness","type":"numeric","out_of":10,"criterion":null,"rubric_id":"dad9d687-7be9-4bf3-b5d2-f2138ef687dd"},
            {"name":"New","type":"numeric","out_of":10,"criterion":null,"rubric_id":"340ee5ac-b63a-405d-a810-b6c0326ad456"},
            {"name":"Classroom Management","type":"boolean","out_of":10,"criterion":null,"rubric_id":"2581c301-b3ba-41f8-9329-77c733c17c37"}
          ],
          panelists: [
            {
              scores: [
                {"score":9,"rubric_id":"4f176c8b-d2e7-4097-9a09-741c3de0cc84"},
                {"score":9,"rubric_id":"333fe8ca-8bca-4f35-9302-1153ed5329a4"},
                {"score":8,"rubric_id":"8b1f0512-4963-4913-926c-4fdcddcace04"},
                {"score":9,"rubric_id":"d3cd201c-15cc-4bfc-90ea-9055245f5e50"},
                {"score":10,"rubric_id":"36013c8c-e1b2-47ec-8e6a-ca278df61667"},
                {"score":10,"rubric_id":"4a52faae-06cf-408b-a6aa-64ce307b8dea"},
                {"score":10,"rubric_id":"e39c92ca-346c-4c50-974f-8783dfd378e3"},
                {"score":10,"rubric_id":"5f3ba42f-eed1-4314-9238-75214f53c528"},
                {"score":10,"rubric_id":"dad9d687-7be9-4bf3-b5d2-f2138ef687dd"},
                {"score":10,"rubric_id":"340ee5ac-b63a-405d-a810-b6c0326ad456"},
                {"score":1,"rubric_id":"2581c301-b3ba-41f8-9329-77c733c17c37"}
              ],
              comments: "Great presentation skills",
              strengths: "Excellent subject knowledge and communication",
              submitted: true,
              panelist_email: "rahuljainrj1329@gmail.com",
              recommendation: "strongly_recommend",
              areas_for_improvement: "Could improve on classroom management"
            }
          ]
        };

        const rawRubrics = data.rubrics || [];
        const p = data.panelists || [];

        // Get all rubric IDs that have scores
        const scoredRubricIds = new Set(
          p.flatMap(panelist => panelist.scores.map(s => s.rubric_id))
        );

        // Filter rubrics to only include those that have scores
        const filteredRubrics = rawRubrics.filter(r => scoredRubricIds.has(r.rubric_id));

        setRubrics(filteredRubrics);
        setPanelists(p);
      } catch (e: any) {
        setError(e.message);
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
    <div className="p-6">
      {noData ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No panelist review data available</p>
          <p className="text-gray-400 text-sm mt-2">
            Rubrics: {rubrics.length}, Panelists: {panelists.length}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <div className="overflow-x-auto relative">
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
                            const rubric = rubrics.find(r => r.rubric_id === scoreObj.rubric_id);
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
                      const rubric = rubrics.find(r => r.rubric_id === scoreObj.rubric_id);
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

                {/* Rubric Score Rows */}
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
                          const scoreObj = p.scores.find(s => s.rubric_id === rubric.rubric_id);
                          return scoreObj ? Number(scoreObj.score || 0) : 0;
                        });
                        
                        const averageScore = rubricScores.reduce((sum, score) => sum + score, 0) / submittedPanelists.length;
                        return `${averageScore.toFixed(1)} / ${rubric.out_of}`;
                      })()}
                    </td>
                    {panelists.map((p) => {
                      const scoreObj = p.scores.find(
                        (s) => s.rubric_id === rubric.rubric_id
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
                            .map(p => p[row.key as keyof Panelist])
                            .filter(Boolean)
                            .slice(0, 3)
                            .map((value, i) => (
                              <div key={i} className="truncate" title={String(value)}>
                                • {String(value)}
                              </div>
                            ))}
                          {panelists.filter(p => p.submitted && p[row.key as keyof Panelist]).length > 3 && (
                            <div>...and {panelists.filter(p => p.submitted && p[row.key as keyof Panelist]).length - 3} more</div>
                          )}
                          {panelists.filter(p => p.submitted && p[row.key as keyof Panelist]).length === 0 && '-'}
                        </div>
                      )}
                    </td>
                    {panelists.map((p) => {
                      let value = p[row.key as keyof Panelist];
                      
                      // Format recommendation
                      if (row.key === 'recommendation' && value) {
                        value = String(value).replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                      }
                      
                      return (
                        <td
                          key={`${p.panelist_email}-${row.key}`}
                          className="px-6 py-4 text-sm text-gray-600"
                        >
                          {Array.isArray(value) ? (
                            <span>{JSON.stringify(value)}</span>
                          ) : value ? (
                            String(value)
                          ) : (
                            '-'
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