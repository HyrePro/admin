import { isWarm } from "@/lib/loading-gate";

export default async function InterviewsLoading() {
  if (await isWarm("warm_interviews")) {
    return null;
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50">
      <div className="flex justify-between items-center">
        <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse"></div>
        <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg border p-6">
          <div className="h-10 bg-gray-200 rounded mb-4 animate-pulse"></div>
          <div className="h-96 bg-gray-100 rounded animate-pulse"></div>
        </div>
        <div className="space-y-4">
          <div className="bg-white rounded-lg border p-4 h-40 animate-pulse"></div>
          <div className="bg-white rounded-lg border p-4 h-40 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}
