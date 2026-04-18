import React from 'react';

export default function AlatKeluarIcon({ size = 24, color = "currentColor", className = "", ...props }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={`lucide ${className}`}
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M6 12a6 6 0 0 1 12 0" />
      <path d="M12 6v2" />
      <path d="M8 7.5l1.5 1.5" />
      <path d="M16 7.5l-1.5 1.5" />
      <path d="M12 17c-1.5 0-3-1.2-3-2.8 0-2 3-4.7 3-4.7s3 2.7 3 4.7c0 1.6-1.5 2.8-3 2.8z" />
    </svg>
  );
}
