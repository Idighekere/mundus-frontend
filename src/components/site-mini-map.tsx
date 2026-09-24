export function SiteMiniMap({ name, lat, lng, pin = '#0B3D2C' }: { name: string; lat: number; lng: number; pin?: string }) {
  return (
    <div className="relative h-48 w-full overflow-hidden rounded-xl border border-hairline bg-[#F4F3F3]">
      <svg className="h-full w-full" fill="none" preserveAspectRatio="xMidYMid slice" viewBox="0 0 340 192" aria-hidden="true">
        <rect fill="#F4F3F3" height="192" width="340" />
        <path d="M-10 20 L90 5 L120 70 L20 90 Z" fill="#E3ECE4" stroke="#cfdccf" strokeWidth="1" />
        <path d="M220 110 L350 80 L360 180 L250 195 Z" fill="#E3ECE4" stroke="#cfdccf" strokeWidth="1" />
        <path d="M-20 60 L360 40" stroke="#FFFFFF" strokeLinecap="round" strokeWidth="6" />
        <path d="M-20 60 L360 40" stroke="#D0D5D8" strokeLinecap="round" strokeWidth="3" />
        <path d="M40 -10 L100 200" stroke="#FFFFFF" strokeLinecap="round" strokeWidth="5" />
        <path d="M40 -10 L100 200" stroke="#D0D5D8" strokeLinecap="round" strokeWidth="2.5" />
        <path d="M220 -10 L180 200" stroke="#FFFFFF" strokeLinecap="round" strokeWidth="5" />
        <path d="M220 -10 L180 200" stroke="#D0D5D8" strokeLinecap="round" strokeWidth="2.5" />
        <path d="M-20 120 C 80 110, 160 90, 360 70" stroke="#06170F" strokeLinecap="square" strokeWidth="7" />
        <path d="M-20 120 C 80 110, 160 90, 360 70" stroke="#FFFFFF" strokeDasharray="8 6" strokeWidth="1.5" />
        <circle cx="170" cy="92" fill={pin} fillOpacity="0.08" r="22" stroke={pin} strokeOpacity="0.3" strokeWidth="1.5" />
        <path d="M170 70 C163.373 70 158 75.373 158 82 C158 90 170 100 170 100 C170 100 182 90 182 82 C182 75.373 176.627 70 170 70 Z" fill={pin} />
        <circle cx="170" cy="81" fill="#FFFFFF" r="3.5" />
        <rect fill="#06170F" height="24" rx="4" width="118" x="186" y="68" />
        <text fill="#FFFFFF" fontFamily="Inter, sans-serif" fontSize="10" fontWeight="700" letterSpacing="0.02em" x="194" y="84">
          {name.slice(0, 14).toUpperCase()} PT
        </text>
      </svg>
      <div className="absolute bottom-2 left-2 rounded border border-hairline bg-paper/95 px-2 py-1 font-mono text-xs text-ink">
        {lat.toFixed(4)}° N, {lng.toFixed(4)}° E
      </div>
    </div>
  )
}
