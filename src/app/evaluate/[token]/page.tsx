'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";

// Define proper interfaces for the data structures
interface Job {
  id: string;
  title: string;
  description: string;
}

interface Application {
  id: string;
  job_id: string;
  applicant_id: string;
  applicant_info: {
    first_name: string;
    email: string;
    last_name: string;
  };
  jobs: Job;
}

interface School {
  id: string;
  name: string;
  logo_url: string;
}

// Updated RubricCriterion interface to match the new structure
interface RubricCriterion {
  id: string;
  school_id: string;
  criterion_id: string | null;
  name: string;
  description: string;
  type: string;
  out_of: number;
  value: boolean;
  text: string;
}

interface TokenData {
  valid: boolean;
  token: string;
  application: Application;
  school: School;
  rubric: RubricCriterion[];
  panelist_email: string;
}

// Define the structure of our scores object
interface Score {
  id: string;
  score: number | string;
}

interface Scores {
  [key: string]: Score;
}

// Force dynamic rendering to prevent serialization issues during build
export const dynamic = 'force-dynamic';

export default function EvaluatePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [scores, setScores] = useState<Scores>({});
  const [comments, setComments] = useState('');
  const [strengths, setStrengths] = useState('');
  const [areasForImprovement, setAreasForImprovement] = useState('');
  const [recommendation, setRecommendation] = useState('');

  useEffect(() => {
    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      const response = await fetch('/api/validate-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Token validation failed:', data);
        setError(data.error || 'Invalid or expired token');
        setLoading(false);
        return;
      }

      console.log('Token validated successfully:', data);
      setTokenData(data);
      
      // Initialize scores based on rubric criteria
      if (data.rubric) {
        const initialScores: Scores = {};
        data.rubric.forEach((criterion: RubricCriterion) => {
          initialScores[criterion.name] = { id: criterion.id, score: 0 };
        });
        setScores(initialScores);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Token validation error:', err);
      setError('Failed to validate token');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    // Convert scores object to array format
    const scoresArray = Object.values(scores).map(scoreObj => ({
      id: scoreObj.id,
      score: scoreObj.score
    }));

    try {
      const response = await fetch('/api/validate-token', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          evaluation_data: {
            job_id: tokenData?.application?.jobs?.id,
            scores: scoresArray,
            comments,
            strengths,
            areas_for_improvement: areasForImprovement,
            recommendation,
            panelist_email: tokenData?.panelist_email,
            submitted_at: new Date().toISOString(),
            school_id: tokenData?.school?.id,
          },
        }),
      });

      if (response.ok) {
        router.push('/evaluate/success');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to submit evaluation');
      }
    } catch (err) {
      console.error('Submission error:', err);
      setError('Failed to submit evaluation');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Validating token...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  const application = tokenData?.application;
  const school = tokenData?.school;
  const rubric = tokenData?.rubric;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="bg-white shadow-xl rounded-lg overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
            <h1 className="text-3xl font-bold text-white">Candidate Evaluation</h1>
            <p className="text-indigo-100 mt-2">Please complete this evaluation form</p>
          </div>
          
          <div className="px-8 py-6 bg-gray-50 border-b">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-500">Candidate</p>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  {application?.applicant_info?.first_name || 'Not Available'} {application?.applicant_info?.last_name || 'Not Available'}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-500">Position</p>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  {application?.jobs?.title || 'Not Available'}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-500">School</p>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  {school?.name || 'Not Available'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Evaluation Form */}
        <form onSubmit={handleSubmit} className="bg-white shadow-xl rounded-lg overflow-hidden">
          <div className="px-8 py-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Evaluation Rubrics</h2>
            </div>
            
            {/* Dynamic Rubrics */}
            <div className="space-y-6">
              {(() => {
                const criteria = tokenData?.rubric || [];
                const elements = [];
                for (let i = 0; i < criteria.length; i++) {
                  const criterion = criteria[i];
                  const score = scores[criterion.name] || 0;
                  elements.push(
                    <div key={criterion.id}>
                      {criterion.type === 'boolean' ? (
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <label className="block text-sm font-semibold text-gray-700 mb-1 capitalize">
                              {criterion.name.replace(/_/g, ' ')}
                            </label>
                            <p className="text-sm text-gray-600 mb-3">{criterion.description}</p>
                          </div>
                          <Checkbox
                            checked={scores[criterion.name]?.score === 1}
                            onCheckedChange={(checked) => setScores({ 
                              ...scores, 
                              [criterion.name]: { 
                                id: criterion.id, 
                                score: checked ? 1 : 0 
                              } 
                            })}
                            className="h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"
                          />
                        </div>
                      ) : (
                        <>
                          <label className="block text-sm font-semibold text-gray-700 mb-1 capitalize">
                            {criterion.name.replace(/_/g, ' ')}
                          </label>
                          <p className="text-sm text-gray-600 mb-3">{criterion.description}</p>
                          <div className="flex items-center space-x-4">
                            <div className="flex-1 pt-2">
                              {criterion.type === 'text' ? (
                                <textarea
                                  value={scores[criterion.name]?.score || ''}
                                  onChange={(e) => setScores({ 
                                    ...scores, 
                                    [criterion.name]: { 
                                      id: criterion.id, 
                                      score: e.target.value 
                                    } 
                                  })}
                                  rows={3}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                  placeholder="Enter your feedback..."
                                />
                              ) : (
                                <>
                                  <Slider
                                    min={0}
                                    max={criterion.out_of || 10}
                                    step={1}
                                    value={[typeof scores[criterion.name]?.score === 'number' ? scores[criterion.name]?.score as number : 0]}
                                    onValueChange={(value) => setScores({ 
                                      ...scores, 
                                      [criterion.name]: { 
                                        id: criterion.id, 
                                        score: value[0] || 0 
                                      } 
                                    })}
                                    className="w-full mb-1"
                                  />
                                  <div className="flex justify-between text-xs text-gray-500">
                                    <span>0</span>
                                    <span>{criterion.out_of || 10}</span>
                                  </div>
                                </>
                              )}
                            </div>
                            {criterion.type === 'numeric' && (
                              <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 font-bold text-lg">
                                {typeof scores[criterion.name]?.score === 'number' ? scores[criterion.name]?.score as number : 0}
                              </span>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                }
                return elements;
              })()}
            </div>

            {/* Additional Feedback Sections */}
            <div className="mt-10 space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  Key Strengths
                </label>
                <textarea
                  value={strengths}
                  onChange={(e) => setStrengths(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  placeholder="What are the candidate's main strengths?"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  Areas for Improvement
                </label>
                <textarea
                  value={areasForImprovement}
                  onChange={(e) => setAreasForImprovement(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  placeholder="What areas could the candidate develop further?"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  Overall Comments
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  placeholder="Share your detailed feedback about the candidate..."
                  
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  Hiring Recommendation
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { value: 'strongly_recommend', label: 'Strongly Recommend', color: 'green' },
                    { value: 'recommend', label: 'Recommend', color: 'blue' },
                    { value: 'neutral', label: 'Neutral', color: 'yellow' },
                    { value: 'not_recommend', label: 'Do Not Recommend', color: 'red' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setRecommendation(option.value)}
                      className={`px-4 py-3 rounded-lg border-2 font-semibold transition ${
                        recommendation === option.value
                          ? `border-${option.color}-600 bg-${option.color}-50 text-${option.color}-700`
                          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="px-8 py-6 bg-gray-50 border-t flex justify-end space-x-4">
            <button
              type="submit"
              disabled={submitting || !recommendation}
              className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </>
              ) : (
                'Submit Evaluation'
              )}
            </button>
          </div>
        </form>

        {/* Info Box */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Note:</strong> This evaluation link expires in 24 hours from receipt. Your feedback is confidential and will only be shared with the hiring team.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}