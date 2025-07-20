import React from "react";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className = "", style, ...props }, ref) => (
    <div
      ref={ref}
      className={`bg-gray-200 rounded animate-pulse ${className}`}
      style={style}
      {...props}
    />
  )
);
Skeleton.displayName = "Skeleton";

export { Skeleton };
export default Skeleton;
