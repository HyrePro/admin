export default function SettingsLoading() {
  return (
    <div className="settings-container flex flex-col h-screen overflow-hidden">
      {/* Header skeleton */}
      <div className="settings-header p-6">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
      </div>
      
      <div className="border-b border-gray-200">
        <div className="flex overflow-x-auto px-2 hide-scrollbar" aria-label="Tabs">
          {/* Navigation tabs skeleton */}
          {[...Array(4)].map((_, i) => (
            <div key={i} className="whitespace-nowrap pb-4 px-3 border-b-2 font-medium text-sm flex-shrink-0">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
            </div>
          ))}
        </div>
      </div>
        
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Account settings form skeleton */}
        <div className="bg-white rounded-lg border p-4">
          <div className="space-y-4">
            <div>
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-6"></div>
              <div className="flex items-center gap-2 mt-4 mb-4">
                <div className="h-16 w-16 rounded-full bg-gray-200"></div>
                <div className="h-8 w-24 bg-gray-200 rounded"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="h-10 w-32 bg-gray-200 rounded"></div>
          </div>
        </div>
        
        {/* Other settings items skeleton */}
        <div className="bg-white rounded-lg border p-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="h-5 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
            <div className="h-8 w-24 bg-gray-200 rounded"></div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border p-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="h-5 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
            <div className="h-8 w-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      </main>
    </div>
  );
}