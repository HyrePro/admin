import { isWarm } from "@/lib/loading-gate";

export default async function CandidatesLoading() {
  if (await isWarm("warm_candidates")) {
    return null;
  }

  return (
    <div className="flex flex-col h-full p-4 bg-gray-50">
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="h-10 bg-gray-200 rounded-md flex-1 animate-pulse"></div>
        <div className="h-10 w-44 bg-gray-200 rounded-md animate-pulse"></div>
      </div>
      <div className="border rounded-lg p-4 space-y-3 bg-white">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="h-10 bg-gray-100 rounded animate-pulse"></div>
        ))}
      </div>
    </div>
  );
}
