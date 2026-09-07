import React from 'react';

interface AbsenKuLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'dark';
  showSubtitle?: boolean;
  subtitleText?: string;
}

export const AbsenKuLogo: React.FC<AbsenKuLogoProps> = ({
  size = 'md',
  variant = 'dark',
  showSubtitle = true,
  subtitleText = 'TKK INVIOLATA RUTENG',
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-3xl',
    xl: 'text-4xl',
  };

  const subSizes = {
    sm: 'text-[9px]',
    md: 'text-[11px]',
    lg: 'text-xs',
    xl: 'text-sm',
  };

  const isLight = variant === 'light';

  return (
    <div className="flex items-center gap-2.5 select-none">
      {/* Fingerprint Swirl Spiral SVG Icon */}
      <div className={`${iconSizes[size]} shrink-0 flex items-center justify-center`}>
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full drop-shadow-xs"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer Spiral */}
          <path
            d="M50 10 C72 10 90 28 90 50 C90 72 72 90 50 90 C28 90 10 72 10 50 C10 36 17 24 28 17"
            stroke="#0088cc"
            strokeWidth="8"
            strokeLinecap="round"
          />
          {/* Middle Spiral Loop */}
          <path
            d="M32 30 C37 25 43 22 50 22 C65 22 78 35 78 50 C78 65 65 78 50 78 C35 78 22 65 22 50"
            stroke="#00a8e8"
            strokeWidth="8"
            strokeLinecap="round"
          />
          {/* Inner Swirl */}
          <path
            d="M35 50 C35 42 42 35 50 35 C58 35 65 42 65 50 C65 58 58 65 50 65 C45 65 40 60 40 55 C40 50 45 46 50 46"
            stroke="#38bdf8"
            strokeWidth="7"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Typography: absenKU + TKK Inviolata Ruteng */}
      <div className="flex flex-col leading-none">
        <div className="flex items-baseline">
          <span
            className={`font-normal tracking-tight ${textSizes[size]} ${
              isLight ? 'text-white' : 'text-[#334155]'
            }`}
          >
            absen
          </span>
          <span
            className={`font-extrabold tracking-tight ${textSizes[size]} ${
              isLight ? 'text-white' : 'text-[#0088cc]'
            }`}
          >
            KU
          </span>
        </div>

        {showSubtitle && (
          <span
            className={`font-bold tracking-wider uppercase mt-1 ${subSizes[size]} ${
              isLight ? 'text-white/80' : 'text-[#0088cc]'
            }`}
          >
            {subtitleText}
          </span>
        )}
      </div>
    </div>
  );
};
