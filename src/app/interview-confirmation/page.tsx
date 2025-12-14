import React, { Suspense } from 'react';
import PanelistConfirmationPageContent from '@/components/interview-confirmation-content';

// Loading component for suspense fallback
const LoadingScreen: React.FC = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <h1 className="text-2xl font-bold text-gray-900">Loading...</h1>
      <p className="mt-2 text-gray-600">Please wait while we load your interview details</p>
    </div>
  </div>
);

export default function PanelistConfirmationPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <PanelistConfirmationPageContent />
    </Suspense>
  );
}