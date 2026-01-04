

export default function EvaluationSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white shadow-2xl rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-6">
          <div className="flex justify-center">
            <div className="bg-white rounded-full p-3">
              <svg 
                className="h-12 w-12 text-green-600" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="px-8 py-10 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Evaluation Submitted!
          </h1>
          <p className="text-gray-600 text-lg mb-6">
            Thank you for taking the time to evaluate the candidate. Your feedback has been successfully recorded and will be shared with the hiring team.
          </p>
          
          
          <div className="text-sm text-gray-500">
            <p>You can now safely close this window.</p>
          </div>
        </div>
        
        <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
          <p className="text-xs text-center text-gray-500">
            If you have any questions, please contact the hiring team.
          </p>
        </div>
      </div>
    </div>
  );
}