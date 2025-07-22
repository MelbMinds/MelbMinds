import React from "react";

const deepBlue = "#00274d"; // Matches --deep-blue

const LoadingSpinner: React.FC<{ size?: number; className?: string }> = ({ size = 32, className = "" }) => (
  <div
    className={`animate-spin rounded-full border-b-2 mx-auto ${className}`}
    style={{
      width: size,
      height: size,
      borderBottomColor: deepBlue,
      borderBottomWidth: 2,
      borderStyle: 'solid',
    }}
    aria-label="Loading"
    role="status"
  />
);

export default LoadingSpinner; 