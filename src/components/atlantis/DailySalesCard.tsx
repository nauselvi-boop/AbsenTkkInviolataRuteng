import React from 'react';

export const DailySalesCard: React.FC = () => {
  // Smooth sine wave path across the card width
  const wavePath = "M 0 110 C 60 110, 100 80, 160 80 C 220 80, 260 120, 320 120 C 380 120, 420 85, 480 85 C 540 85, 580 115, 640 115";
  const waveFill = `${wavePath} L 640 160 L 0 160 Z`;

  return (
    <div className="bg-[#1269DB] text-white rounded-2xl shadow-md p-6 relative overflow-hidden flex flex-col justify-between h-full min-h-[300px]">
      {/* Card Header & Values */}
      <div className="relative z-10 space-y-1">
        <h3 className="text-base font-semibold text-white/95 tracking-wide">
          Daily Sales
        </h3>
        <p className="text-xs text-white/70 font-normal">
          March 25 - April 02
        </p>

        <div className="pt-6">
          <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            $4,578.58
          </p>
        </div>
      </div>

      {/* Decorative Wave Sparkline at the bottom */}
      <div className="absolute inset-x-0 bottom-0 h-32 pointer-events-none">
        <svg
          viewBox="0 0 640 160"
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          <defs>
            <linearGradient id="whiteWaveGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Area fill */}
          <path d={waveFill} fill="url(#whiteWaveGrad)" />

          {/* Glowing white curve line */}
          <path
            d={wavePath}
            fill="none"
            stroke="#ffffff"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
};
