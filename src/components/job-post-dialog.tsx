import React from 'react';

interface JobPostDialogProps {
  open: boolean;
  type: 'progress' | 'success' | 'error' | null;
  error?: string | null;
  onClose: () => void;
}

export const JobPostDialog: React.FC<JobPostDialogProps> = ({ open, type, error, onClose }) => {
  if (!open || !type) return null;

  let bgColor = 'bg-white';
  let borderColor = 'border-gray-300';
  let textColor = 'text-gray-900';
  if (type === 'success') {
    bgColor = 'bg-green-50';
    borderColor = 'border-green-400';
    textColor = 'text-green-800';
  } else if (type === 'error') {
    bgColor = 'bg-red-50';
    borderColor = 'border-red-400';
    textColor = 'text-red-800';
  } else if (type === 'progress') {
    bgColor = 'bg-blue-50';
    borderColor = 'border-blue-400';
    textColor = 'text-blue-800';
  }

  return (
    <div
      className={`fixed top-6 left-1/2 z-50 transform -translate-x-1/2 min-w-[320px] max-w-[90vw] shadow-lg border ${bgColor} ${borderColor} ${textColor} rounded-lg px-6 py-4 flex flex-col items-center animate-fade-in`}
      style={{ transition: 'all 0.3s' }}
    >
      {type === 'progress' && (
        <>
          <div className="font-semibold text-lg mb-1">Publishing Job...</div>
          <div className="text-sm mb-2">Please wait while we publish your job post.</div>
          <div className="mt-2 animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
        </>
      )}
      {type === 'success' && (
        <>
          <div className="font-semibold text-lg mb-1">Success!</div>
          <div className="text-sm">Your job post has been published.</div>
        </>
      )}
      {type === 'error' && (
        <>
          <div className="font-semibold text-lg mb-1">Something went wrong</div>
          <div className="text-sm mb-2">{error}</div>
          <button
            className="mt-2 bg-primary text-white px-4 py-2 rounded-md"
            onClick={onClose}
          >
            Close
          </button>
        </>
      )}
    </div>
  );
};

// Optional: Add a simple fade-in animation
// In your global CSS (e.g., globals.css), add:
// @keyframes fade-in { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
// .animate-fade-in { animation: fade-in 0.3s ease; } 