export default function JobsLoading() {
  return (
    <div className="flex flex-col h-full">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="relative flex-1">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 bg-gray-200 rounded-full"></div>
          <div className="h-10 pl-10 bg-gray-200 rounded-md w-full"></div>
        </div>
        <div className="flex gap-4">
          <div className="flex-grow sm:w-[180px] h-10 bg-gray-200 rounded-md"></div>
          <div className="h-10 w-10 bg-gray-200 rounded-md"></div>
        </div>
      </div>
      
      {/* Table skeleton */}
      <div className="table-container">
        <div className="table-scroll">
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-100 border-b p-3 h-12 flex items-center">
              <div className="h-4 bg-gray-300 rounded w-1/4"></div>
            </div>
            
            <div className="divide-y">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="p-3 grid grid-cols-8 gap-4 items-center">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-8 w-16 bg-gray-200 rounded ml-auto"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Pagination skeleton */}
      <div className="pagination-container mt-4">
        <div className="flex justify-between items-center">
          <div className="h-4 bg-gray-200 rounded w-32"></div>
          <div className="flex gap-2">
            <div className="h-8 w-20 bg-gray-200 rounded"></div>
            <div className="h-8 w-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
}