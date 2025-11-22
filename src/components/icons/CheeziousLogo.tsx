import * as React from 'react';

export function CheeziousLogo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      aria-label="Cheezious Logo"
      {...props}
    >
      <path
        fill="currentColor"
        d="M50 5 a 45 45 0 0 1 0 90 a 45 45 0 0 1 0 -90"
      />
      <path
        fill="#F5F5DC"
        d="M50,15 A35,35 0,1,0 50,85 A35,35 0,1,0 50,15 M50,25 A5,5 0,1,1 50,35 A5,5 0,1,1 50,25 M35,45 A5,5 0,1,1 35,55 A5,5 0,1,1 35,45 M65,45 A5,5 0,1,1 65,55 A5,5 0,1,1 65,45 M50,65 A7,7 0,1,1 50,79 A7,7 0,1,1 50,65"
      />
      <text
        x="50"
        y="55"
        fontFamily="Poppins, sans-serif"
        fontWeight="bold"
        fontSize="12"
        fill="currentColor"
        textAnchor="middle"
        dy="25"
      >
      </text>
    </svg>
  );
}
