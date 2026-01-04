export default function DashboardLoading() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header skeleton */}
      <div className="shrink-0 flex h-18 items-center gap-2 border-b border-gray-200">
        <div className="flex px-2 items-center ms-2 min-w-0">
          <div className="font-medium text-gray-900 text-md truncate h-4 bg-gray-200 rounded w-48"></div>
          <div className="text-xs ms-2 h-4 bg-gray-200 rounded w-20"></div>
        </div>
        <div className="ml-auto flex items-center gap-4 px-4">
          <div className="w-8 h-8 rounded-full bg-gray-200"></div>
        </div>
      </div>
      
      {/* Main content skeleton */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="border rounded-lg p-4 h-24">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
        
        <div className="mb-4 flex justify-between items-center">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="h-10 bg-gray-200 rounded w-40"></div>
        </div>
        
        <div className="border rounded-lg p-4 h-96">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 border rounded p-4">
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}