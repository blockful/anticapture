// Path: apps/dashboard/components/atoms/icons/StarOutlineIcon.tsx

interface StarOutlineIconProps {
  className?: string;
}

export const StarOutlineIcon = ({ className }: StarOutlineIconProps) => {
  return (
    <svg 
      width="16" 
      height="16" 
      viewBox="0 0 16 16" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path 
        d="M8 1.5L9.79611 5.11803L13.6085 5.68237L10.8042 8.41197L11.4721 12.2176L8 10.4L4.52786 12.2176L5.19577 8.41197L2.39155 5.68237L6.20389 5.11803L8 1.5Z" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
}; 