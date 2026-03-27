export default function ContactsLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-40 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-4 w-64 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="h-10 w-36 bg-gray-200 rounded-lg animate-pulse" />
      </div>

      {/* Search skeleton */}
      <div className="h-10 w-80 bg-gray-100 rounded-lg animate-pulse" />

      {/* Table skeleton */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Header row */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-3 flex gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 rounded animate-pulse flex-1" />
          ))}
        </div>
        {/* Body rows */}
        {Array.from({ length: 5 }).map((_, row) => (
          <div
            key={row}
            className="px-6 py-4 flex gap-6 border-b border-gray-50"
          >
            {Array.from({ length: 6 }).map((_, col) => (
              <div
                key={col}
                className="h-4 bg-gray-100 rounded animate-pulse flex-1"
                style={{ animationDelay: `${(row * 6 + col) * 50}ms` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
