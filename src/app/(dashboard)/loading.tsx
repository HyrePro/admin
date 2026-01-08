export default function DashboardLoading() {
  return (
    <div className="flex flex-1 flex-col px-4 pb-8 pt-4">
      <div className="@container/main flex flex-1 flex-col gap-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Dashboard cards skeleton */}
          {[...Array(4)].map((_, i) => (
            <div key={i} className="border rounded-lg p-4 h-24">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
        
        {/* Active Job Campaigns section skeleton */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="h-6 bg-gray-200 rounded w-48"></div>
            <div className="h-10 bg-gray-200 rounded w-32"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg border p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
                <div className="h-6 bg-gray-200 rounded w-2/3 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-full mb-4" />
                <div className="flex gap-2 mb-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full" />
                  <div className="w-8 h-8 bg-gray-200 rounded-full" />
                  <div className="w-8 h-8 bg-gray-200 rounded-full" />
                </div>
                <div className="h-2 bg-gray-200 rounded w-full" />
              </div>
            ))}
          </div>
        </div>
        
        {/* Progress and Activity section skeleton */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="h-6 bg-gray-200 rounded w-48"></div>
            <div className="h-10 bg-gray-200 rounded w-40"></div>
          </div>
          
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="w-full lg:w-1/3">
              {/* HiringProgressChart loading skeleton */}
              <div className="border rounded-lg p-4">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4 animate-pulse"></div>
                <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="w-full lg:w-2/3">
              {/* WeeklyActivity loading skeleton */}
              <div className="border rounded-lg p-4">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4 animate-pulse"></div>
                <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}