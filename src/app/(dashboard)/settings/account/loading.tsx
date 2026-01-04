export default function AccountSettingsLoading() {
  return (
    <div className="space-y-6">
      {/* Account settings form skeleton */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="space-y-6">
          <div>
            <div className="h-4 bg-gray-200 rounded w-1/5 mb-2"></div>
            <div className="h-10 bg-gray-200 rounded w-full"></div>
          </div>
          <div>
            <div className="h-4 bg-gray-200 rounded w-1/5 mb-2"></div>
            <div className="h-10 bg-gray-200 rounded w-full"></div>
          </div>
          <div>
            <div className="h-4 bg-gray-200 rounded w-1/5 mb-2"></div>
            <div className="h-32 bg-gray-200 rounded w-full"></div>
          </div>
          <div className="pt-4">
            <div className="h-10 bg-gray-200 rounded w-32"></div>
          </div>
        </div>
      </div>
    </div>
  );
}