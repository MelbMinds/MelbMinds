import Skeleton from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-soft-gray">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Skeleton */}
        <div className="mb-8">
          <Skeleton className="h-10 w-72 mb-2 rounded" />
          <Skeleton className="h-6 w-56 rounded" />
        </div>
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Filters Sidebar Skeleton in Card Box */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg border-0 p-6 space-y-6">
              <Skeleton className="h-10 w-full rounded mb-2" /> {/* Search */}
              <Skeleton className="h-6 w-24 mb-1 rounded" /> {/* Subject label */}
              <Skeleton className="h-10 w-full mb-2 rounded" /> {/* Subject dropdown */}
              <Skeleton className="h-6 w-24 mb-1 rounded" /> {/* Year label */}
              <Skeleton className="h-10 w-full mb-2 rounded" /> {/* Year dropdown */}
              <Skeleton className="h-6 w-32 mb-1 rounded" /> {/* Format label */}
              <Skeleton className="h-10 w-full mb-2 rounded" /> {/* Format dropdown */}
              <Skeleton className="h-6 w-28 mb-1 rounded" /> {/* Language label */}
              <Skeleton className="h-10 w-full mb-2 rounded" /> {/* Language dropdown */}
              <Skeleton className="h-6 w-32 mb-1 rounded" /> {/* Personality label */}
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-2 mb-1">
                  <Skeleton className="h-4 w-4 rounded" /> {/* Checkbox */}
                  <Skeleton className="h-4 w-20 rounded" /> {/* Tag */}
                </div>
              ))}
              <Skeleton className="h-10 w-full mt-4 rounded" /> {/* Clear All Filters button */}
            </div>
          </div>
          {/* Main Content Skeleton */}
          <div className="lg:col-span-3">
            <div className="flex justify-between items-center mb-6">
              <Skeleton className="h-6 w-40 rounded" /> {/* Showing X study groups */}
              <Skeleton className="h-10 w-48 rounded" /> {/* Sort dropdown */}
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="p-4 bg-white rounded-lg shadow border flex flex-col gap-3">
                  <div className="flex justify-between items-start mb-2">
                    <Skeleton className="h-6 w-20 rounded" /> {/* Subject badge */}
                    <Skeleton className="h-6 w-20 rounded" /> {/* Meeting format badge */}
                  </div>
                  <Skeleton className="h-6 w-32 mb-1 rounded" /> {/* Card title */}
                  <div className="flex gap-2 mb-1">
                    <Skeleton className="h-4 w-16 rounded" /> {/* Rating */}
                    <Skeleton className="h-4 w-16 rounded" /> {/* Study hours */}
                  </div>
                  <Skeleton className="h-4 w-40 mb-2 rounded" /> {/* Description */}
                  {[...Array(4)].map((_, j) => (
                    <Skeleton key={j} className="h-4 w-32 mb-1 rounded" />
                  ))} {/* Info rows */}
                  <div className="flex gap-2 mb-1">
                    <Skeleton className="h-4 w-16 rounded" />
                    <Skeleton className="h-4 w-12 rounded" />
                  </div> {/* Tags */}
                  <div className="flex gap-2 mb-2">
                    <Skeleton className="h-4 w-16 rounded" />
                    <Skeleton className="h-4 w-12 rounded" />
                  </div> {/* Personality tags */}
                  <div className="flex justify-between items-center mt-2">
                    <Skeleton className="h-4 w-20 rounded" /> {/* Year level */}
                    <Skeleton className="h-8 w-24 rounded" /> {/* Button */}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
