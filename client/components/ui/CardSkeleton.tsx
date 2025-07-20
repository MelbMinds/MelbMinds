import Skeleton from "@/components/ui/Skeleton";

const CardSkeleton = () => (
  <div className="p-4 bg-white rounded-lg shadow border flex flex-col gap-3">
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
);

export default CardSkeleton; 