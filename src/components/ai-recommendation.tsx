"use client";

import React, { useEffect, useState } from "react";
import { Sparkles, Loader2, AlertCircle, TrendingUp, TrendingDown, Target, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
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

        if (error && error.code !== 'PGRST116') {
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
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
          <p className="text-sm text-gray-600">Loading AI recommendation...</p>
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
              <h3 className="text-sm font-semibold text-red-800">Error Loading Recommendation</h3>
              <p className="text-sm text-red-700 mt-0.5">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!aiRecommendation) {
    return (
      <div className="mx-auto px-6 py-12">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            <Sparkles className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-2">No AI Recommendation Available</h3>
          <p className="text-sm text-gray-500">
            AI evaluation has not been generated for this application yet.
          </p>
        </div>
      </div>
    );
  }

  // Parse recommendation status
  const recommendation = aiRecommendation.final_recommendation?.toLowerCase() || '';
  const isStronglyRecommended = recommendation.includes('strongly_recommend') || recommendation.includes('highly_recommend');
  const isRecommended = recommendation.includes('recommend') && !recommendation.includes('not');
  const isNotRecommended = recommendation.includes('not_recommend') || recommendation.includes('reject');

  // Determine recommendation config
  let recommendationIcon = AlertTriangle;
  let recommendationLabel = 'Needs Review';
  let recommendationDescription = 'Further evaluation recommended';

  if (isStronglyRecommended) {
    recommendationIcon = CheckCircle;
    recommendationLabel = 'Strongly Recommended';
    recommendationDescription = 'Excellent candidate - Move to offer';
  } else if (isRecommended) {
    recommendationIcon = CheckCircle;
    recommendationLabel = 'Recommended';
    recommendationDescription = 'Good candidate - Proceed with next steps';
  } else if (isNotRecommended) {
    recommendationIcon = XCircle;
    recommendationLabel = 'Not Recommended';
    recommendationDescription = 'Does not meet requirements';
  }

  const RecommendationIcon = recommendationIcon;

  // Parse strengths and improvements
  const parseArray = (data: any): string[] => {
    if (Array.isArray(data)) return data;
    if (typeof data === 'object' && data !== null) {
      return Object.entries(data).map(([key, value]) => `${key}: ${value}`);
    }
    if (data && String(data).trim() !== '') return [String(data)];
    return [];
  };

  const strengths = parseArray(aiRecommendation.strengths);
  const improvements = parseArray(aiRecommendation.areas_for_improvement);

  return (
    <div className="mx-auto px-2 py-2 space-y-6">
      {/* AI Recommendation Header - Top Priority */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <h3 className="text-sm font-medium text-gray-600">AI-Powered Final Recommendation</h3>
          </div>
          <p className="text-xs text-gray-500">
            Generated {new Date(aiRecommendation.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <RecommendationIcon className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">{recommendationLabel}</h2>
            <p className="text-sm text-gray-700">{recommendationDescription}</p>
          </div>
        </div>
      </div>

      {/* Key Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <h3 className="text-base font-semibold text-gray-900">Key Strengths</h3>
            </div>
          </div>
          <div className="p-5">
            {strengths.length > 0 ? (
              <div className="space-y-2">
                {strengths.map((strength, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">•</span>
                    <p className="text-sm text-gray-700 flex-1">{strength}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No strengths identified</p>
            )}
          </div>
        </div>

        {/* Areas for Improvement */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-amber-600" />
              <h3 className="text-base font-semibold text-gray-900">Areas for Development</h3>
            </div>
          </div>
          <div className="p-5">
            {improvements.length > 0 ? (
              <div className="space-y-2">
                {improvements.map((area, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">•</span>
                    <p className="text-sm text-gray-700 flex-1">{area}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No areas for improvement identified</p>
            )}
          </div>
        </div>
      </div>

      {/* Suggested Next Steps */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-semibold text-gray-900">Suggested Next Steps</h3>
          </div>
        </div>
        <div className="p-5">
          <div className="space-y-3 text-sm text-gray-700">
            {isStronglyRecommended && (
              <>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <p><strong>Make an offer:</strong> This candidate exceeds requirements and shows strong potential.</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <p><strong>Priority:</strong> Consider expediting to avoid losing to competitors.</p>
                </div>
              </>
            )}
            {isRecommended && !isStronglyRecommended && (
              <>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p><strong>Schedule final interview:</strong> Candidate meets core requirements.</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p><strong>Reference check:</strong> Verify strengths and address any concerns.</p>
                </div>
              </>
            )}
            {!isRecommended && !isStronglyRecommended && !isNotRecommended && (
              <>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p><strong>Further evaluation needed:</strong> Mixed signals require additional assessment.</p>
                </div>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p><strong>Consider:</strong> Additional interview round or skill assessment to clarify fit.</p>
                </div>
              </>
            )}
            {isNotRecommended && (
              <>
                <div className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <p><strong>Send rejection:</strong> Candidate does not meet minimum requirements.</p>
                </div>
                <div className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <p><strong>Provide feedback:</strong> Offer constructive feedback for professional courtesy.</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-900">
            <strong>Note:</strong> This AI recommendation is based on automated analysis of assessment data. 
            Please use your professional judgment and consider all factors when making the final hiring decision.
          </p>
        </div>
      </div>
    </div>
  );
};