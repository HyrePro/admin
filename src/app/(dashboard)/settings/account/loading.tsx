export default function AccountSettingsLoading() {
  return (
    <div className="space-y-4 p-4">
      <div className="bg-white rounded-lg border p-4">
        <div className="space-y-4">
          <div>
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-6 animate-pulse"></div>
            <div className="flex items-center gap-2 mt-4 mb-4">
              <div className="h-16 w-16 rounded-full bg-gray-200 animate-pulse"></div>
              <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
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
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
      <div className="bg-white rounded-lg border p-4">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-5 bg-gray-200 rounded w-1/4 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
          </div>
          <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
      <div className="bg-white rounded-lg border p-4">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-5 bg-gray-200 rounded w-1/4 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
          </div>
          <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}