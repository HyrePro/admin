export default function SchoolInformationLoading() {
  return (
    <div className="space-y-4 p-4">
      <div className="bg-white rounded-lg border p-4">
        <div className="space-y-4">
          <div>
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-6 animate-pulse"></div>
            
            {/* Logo and School Name Skeleton */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mt-6">
              <div className="flex flex-col items-center justify-center space-y-2 mx-auto sm:mx-0">
                <div className="space-y-2">
                  <div className="block w-16 h-16 rounded-full border-2 border-gray-200 overflow-hidden bg-gray-100">
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-full h-full bg-gray-200 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
                </div>
              </div>
              
              <div className="flex-1 w-full space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>

            {/* Board and School Type Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>

            {/* Address Skeleton */}
            <div className="space-y-2 mt-4">
              <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
              <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
            </div>

            {/* Location Skeleton */}
            <div className="space-y-2 mt-4">
              <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
            </div>

            {/* Statistics Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>

            {/* Website Skeleton */}
            <div className="space-y-2 mt-4">
              <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
            </div>

            {/* Submit Button Skeleton */}
            <div className="pt-6 border-t mt-6">
              <div className="flex justify-end">
                <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}