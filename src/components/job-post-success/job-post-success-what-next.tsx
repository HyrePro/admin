export default function JobPostSuccessWhatNext() {
  const steps = [
    {
      step: "1",
      title: "Teachers Apply",
      description: "Candidates complete assessments and submit demo videos.",
    },
    {
      step: "2",
      title: "AI Evaluation",
      description: "Applications are automatically scored and ranked.",
    },
    {
      step: "3",
      title: "You Review",
      description: "Access structured reports and shortlist candidates.",
    },
  ]

  return (
    <div className="border border-gray-200 rounded-lg bg-white">
      <div className="border-b border-gray-200 px-6 py-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">What Happens Next</h3>
      </div>

      <div className="p-6">
        <div className="space-y-5">
          {steps.map((item, idx) => (
            <div key={idx} className="flex items-start gap-4">
              <div className="w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center shrink-0 text-xs font-semibold">
                {item.step}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                <p className="text-sm text-gray-600 mt-0.5">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}