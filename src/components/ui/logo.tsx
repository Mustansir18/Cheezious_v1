import { cn } from "@/lib/utils";

export function Logo({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-8 w-8", className)}
      {...props}
    >
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#FFD700', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#F5B700', stopOpacity: 1 }} />
        </linearGradient>
        <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#FFA500', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#E69500', stopOpacity: 1 }} />
        </linearGradient>
        <filter id="drop-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="1.5"/>
            <feOffset dx="1" dy="1" result="offsetblur"/>
            <feFlood floodColor="rgba(0,0,0,0.3)"/>
            <feComposite in2="offsetblur" operator="in"/>
            <feMerge>
                <feMergeNode/>
                <feMergeNode in="SourceGraphic"/>
            </feMerge>
        </filter>
      </defs>

      <g filter="url(#drop-shadow)">
        {/* Swirl Right */}
        <path d="M 88,25 C 110,40 110,60 88,75" stroke="#654321" strokeWidth="5" fill="none" strokeLinecap="round" transform="rotate(10 50 50)" />
        
        {/* Pizza Slice */}
        <path d="M 30,15 L 70,15 L 50,55 Z" fill="url(#grad1)" stroke="#5D4037" strokeWidth="2" />
        <circle cx="38" cy="23" r="3" fill="#BF360C" />
        <circle cx="50" cy="25" r="3.5" fill="#BF360C" />
        <circle cx="62" cy="23" r="3" fill="#BF360C" />

        {/* Drink */}
        <path d="M 60,50 C 60,45 85,45 85,50 L 82,85 C 82,90 58,90 58,85 Z" fill="url(#grad2)" stroke="#5D4037" strokeWidth="2"/>
        {/* Straws */}
        <line x1="72" y1="52" x2="75" y2="35" stroke="#5D4037" strokeWidth="2.5" />
        <line x1="75" y1="52" x2="78" y2="35" stroke="#5D4037" strokeWidth="2.5" />
        {/* Drink highlights */}
        <path d="M 65,60 C 70,62 70,68 65,70" fill="none" stroke="#FFF9C4" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M 75,75 C 80,77 80,83 75,85" fill="none" stroke="#FFF9C4" strokeWidth="1.5" strokeLinecap="round" />
        
        {/* Burger */}
        <path d="M 20,60 C 20,50 60,50 60,60" fill="#D2691E" stroke="#5D4037" strokeWidth="2" />
        <rect x="18" y="60" width="44" height="8" rx="2" fill="#2E7D32" />
        <rect x="18" y="62" width="44" height="4" fill="#4CAF50" />
        <path d="M 15,68 C 15,63 65,63 65,68 L 60,85 C 60,90 20,90 15,85 Z" fill="#D2691E" stroke="#5D4037" strokeWidth="2" />
        {/* Sesame seeds */}
        <circle cx="30" cy="56" r="1" fill="#FFFDE7" />
        <circle cx="40" cy="55" r="1.2" fill="#FFFDE7" />
        <circle cx="50" cy="56" r="1" fill="#FFFDE7" />

         {/* Swirl Left */}
        <path d="M 12,25 C -10,40 -10,60 12,75" stroke="#654321" strokeWidth="5" fill="none" strokeLinecap="round" transform="rotate(-10 50 50)" />
      </g>
    </svg>
  );
}
