"use client";

import React, { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/api/client";

interface AIRecommendationProps {
  jobApplicationId: string;
}

interface AIRecommendationData {
  final_recommendation: string;
  strengths: string[];
  areas_for_improvement: string[];
  created_at: string;
}

export const AIRecommendation: React.FC<AIRecommendationProps> = ({ jobApplicationId }) => {
  const [aiRecommendation, setAiRecommendation] = useState<AIRecommendationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAIRecommendation = async () => {
      try {
        setLoading(true);
        setError(null);

        const supabase = createClient();
        const { data, error } = await supabase
          .from('application_ai_evaluations')
          .select('*')
          .eq('application_id', jobApplicationId)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows found"
          throw new Error(error.message);
        }

        if (data) {
          setAiRecommendation(data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch AI recommendation');
      } finally {
        setLoading(false);
      }
    };

    if (jobApplicationId) {
      fetchAIRecommendation();
    }
  }, [jobApplicationId]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-100 rounded" />
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

  if (!aiRecommendation) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No AI Recommendation Available</h3>
          <p className="text-gray-500">
            AI evaluation has not been generated for this application yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-white/20 p-2 rounded-lg">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">AI Recommendation</h2>
              <p className="text-blue-100">
                Generated on {new Date(aiRecommendation.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/10 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">Final Recommendation</h3>
              <p className="text-lg capitalize">
                {aiRecommendation.final_recommendation && aiRecommendation.final_recommendation.trim() !== '' 
                  ? aiRecommendation.final_recommendation.replace(/_/g, ' ')
                  : 'No recommendation provided'}
              </p>
            </div>

            <div className="bg-white/10 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">Strengths</h3>
              <div className="space-y-2">
                {Array.isArray(aiRecommendation.strengths) ? (
                  aiRecommendation.strengths.length > 0 ? (
                    aiRecommendation.strengths.map((strength: string, index: number) => (
                      <div key={index} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{strength}</span>
                      </div>
                    ))
                  ) : (
                    <p>No strengths provided</p>
                  )
                ) : typeof aiRecommendation.strengths === 'object' && aiRecommendation.strengths !== null ? (
                  Object.keys(aiRecommendation.strengths).length > 0 ? (
                    Object.entries(aiRecommendation.strengths).map(([key, value], index) => (
                      <div key={index} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span><span className="font-medium">{key}:</span> {String(value)}</span>
                      </div>
                    ))
                  ) : (
                    <p>No strengths provided</p>
                  )
                ) : (
                  aiRecommendation.strengths && String(aiRecommendation.strengths).trim() !== '' ? (
                    <p>{String(aiRecommendation.strengths)}</p>
                  ) : (
                    <p>No strengths provided</p>
                  )
                )}
              </div>
            </div>

            <div className="bg-white/10 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">Areas for Improvement</h3>
              <div className="space-y-2">
                {Array.isArray(aiRecommendation.areas_for_improvement) ? (
                  aiRecommendation.areas_for_improvement.length > 0 ? (
                    aiRecommendation.areas_for_improvement.map((area: string, index: number) => (
                      <div key={index} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{area}</span>
                      </div>
                    ))
                  ) : (
                    <p>No areas for improvement provided</p>
                  )
                ) : typeof aiRecommendation.areas_for_improvement === 'object' && aiRecommendation.areas_for_improvement !== null ? (
                  Object.keys(aiRecommendation.areas_for_improvement).length > 0 ? (
                    Object.entries(aiRecommendation.areas_for_improvement).map(([key, value], index) => (
                      <div key={index} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span><span className="font-medium">{key}:</span> {String(value)}</span>
                      </div>
                    ))
                  ) : (
                    <p>No areas for improvement provided</p>
                  )
                ) : (
                  aiRecommendation.areas_for_improvement && String(aiRecommendation.areas_for_improvement).trim() !== '' ? (
                    <p>{String(aiRecommendation.areas_for_improvement)}</p>
                  ) : (
                    <p>No areas for improvement provided</p>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};