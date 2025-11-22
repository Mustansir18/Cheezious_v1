import * as React from 'react';

export function CheeziousLogo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
        viewBox="0 0 1024 1024"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Cheezious Logo"
        {...props}
    >
        <circle cx="512" cy="512" r="512" fill="currentColor" />
        <circle cx="512" cy="512" r="450" fill="var(--background, #fff)" stroke="currentColor" strokeWidth="20" />
        <circle cx="512" cy="512" r="320" fill="currentColor" />
        <circle cx="512" cy="512" r="270" fill="var(--background, #fff)" stroke="currentColor" strokeWidth="15" />
        <text
            x="512"
            y="525"
            fontFamily="var(--font-headline, Poppins), sans-serif"
            fontSize="140"
            fontWeight="bold"
            textAnchor="middle"
            alignmentBaseline="middle"
            fill="currentColor"
        >
            Cheezious
        </text>
    </svg>
  );
}
