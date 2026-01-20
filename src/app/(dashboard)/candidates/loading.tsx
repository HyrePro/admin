export default function CandidatesLoading() {
  return (
    <div className="candidates-container">
      <div className="candidates-header">
        <h1 className="candidates-title">Candidates</h1>
        <button className="btn-invite inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="btn-icon"
          >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Invite Candidate
        </button>
      </div>
      
      <main className="flex-1 min-h-0 h-full overflow-hidden">
        <div className="candidates-table-container flex flex-col h-full min-h-0">
          {/* Search and filter skeleton */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4 flex-shrink-0">
            <div className="relative flex-1">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 bg-gray-300 rounded"></div>
              <div className="h-10 bg-gray-200 rounded pl-10 w-full"></div>
            </div>
            <div className="w-full sm:w-[180px] h-10 bg-gray-200 rounded"></div>
          </div>
          
          {/* Table skeleton */}
          <div className="flex-1 min-h-0 border rounded-md bg-white overflow-hidden mb-4">
            <div className="h-full overflow-auto">
              <table className="w-full caption-bottom text-sm relative">
                <thead className="sticky top-0 z-20 bg-white border-b">
                  <tr className="hover:bg-transparent">
                    <th className="table-head table-head-border table-head-first bg-white h-12 px-6 py-3 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px] border-l">
                      <div className="flex items-center gap-1 cell-content">
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                      </div>
                    </th>
                    <th className="table-head table-head-border bg-white h-12 px-6 py-3 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]">
                      <div className="flex items-center gap-1 cell-content">
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                      </div>
                    </th>
                    <th className="table-head table-head-border bg-white h-12 px-6 py-3 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]">
                      <div className="flex items-center gap-1 cell-content">
                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                      </div>
                    </th>
                    <th className="table-head table-head-border table-head-assessment bg-white h-12 px-6 py-3 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]">
                      <div className="assessment-header">
                        <div className="h-4 bg-gray-200 rounded w-20 mb-1"></div>
                      </div>
                      <div className="assessment-subheader flex gap-2">
                        <div className="assessment-col cell-content">
                          <div className="h-3 bg-gray-200 rounded w-3"></div>
                        </div>
                        <div className="assessment-col cell-content">
                          <div className="h-3 bg-gray-200 rounded w-3"></div>
                        </div>
                        <div className="assessment-col-last cell-content">
                          <div className="h-3 bg-gray-200 rounded w-2"></div>
                        </div>
                      </div>
                    </th>
                    <th className="table-head table-head-border bg-white h-12 px-6 py-3 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]">
                      <div className="flex items-center gap-1 cell-content">
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                      </div>
                    </th>
                    <th className="table-head table-head-actions bg-white h-12 px-6 py-3 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]">
                      <div className="table-head-content cell-content">
                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                      </div>
                    </th>
                  </tr>
                </thead>
                
                <tbody>
                  {[...Array(5)].map((_, i) => (
                    <tr key={i} className="table-row-hover border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <td className="table-cell-border p-4 align-middle [&:has([role=checkbox])]:pr-0">
                        <div className="cell-content">
                          <p className="candidate-name">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          </p>
                          <p className="candidate-email">
                            <div className="h-3 bg-gray-200 rounded w-1/2 mt-1"></div>
                          </p>
                        </div>
                      </td>
                      
                      <td className="table-cell-border candidate-job p-4 align-middle [&:has([role=checkbox])]:pr-0">
                        <div className="cell-content">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        </div>
                      </td>
                      
                      <td className="table-cell-border p-4 align-middle [&:has([role=checkbox])]:pr-0">
                        <div className="cell-content">
                          <div className="h-6 bg-gray-200 rounded-md w-1/3"></div>
                        </div>
                      </td>
                      
                      <td className="table-cell-border table-cell-assessment p-4 align-middle [&:has([role=checkbox])]:pr-0">
                        <div className="assessment-scores flex gap-2">
                          <span className="assessment-value">
                            <div className="h-4 bg-gray-200 rounded w-8"></div>
                          </span>
                          <span className="assessment-value">
                            <div className="h-4 bg-gray-200 rounded w-8"></div>
                          </span>
                          <span className="assessment-value-disabled">
                            <div className="h-4 bg-gray-200 rounded w-8"></div>
                          </span>
                        </div>
                        <div className="assessment-spacer">&nbsp;</div>
                      </td>
                      
                      <td className="table-cell-border candidate-date p-4 align-middle [&:has([role=checkbox])]:pr-0">
                        <div className="cell-content">
                          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </td>
                      
                      <td className="table-cell-actions p-4 align-middle [&:has([role=checkbox])]:pr-0">
                        <div className="cell-content">
                          <div className="flex gap-2">
                            <div className="h-8 w-8 bg-gray-200 rounded-md"></div>
                            <div className="h-8 w-8 bg-gray-200 rounded-md"></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Pagination skeleton */}
          <div className="pagination-container flex-shrink-0 w-full flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
            <div className="pagination-info">
              <div className="h-4 bg-gray-200 rounded w-48"></div>
            </div>
            
            <div className="pagination-controls flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <div className="flex items-center gap-2 flex-wrap justify-center">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-8 bg-gray-200 rounded w-20"></div>
              </div>
              
              <div className="flex gap-2 flex-wrap justify-center">
                <div className="h-8 bg-gray-200 rounded w-24"></div>
                <div className="h-8 bg-gray-200 rounded w-24"></div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}