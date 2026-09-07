import React, { useState } from 'react';

export const AreaWaveChart: React.FC = () => {
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; val: number } | null>(null);

  // Data points corresponding to the screenshot's curve
  const points = [
    { x: 0, y: 720, val: 580 },
    { x: 100, y: 840, val: 460 },
    { x: 200, y: 890, val: 410 },
    { x: 300, y: 810, val: 490 },
    { x: 400, y: 790, val: 510 },
    { x: 500, y: 870, val: 430 },
    { x: 600, y: 830, val: 470 },
    { x: 700, y: 720, val: 580 },
    { x: 800, y: 560, val: 740 },
    { x: 900, y: 380, val: 920 },
    { x: 1000, y: 220, val: 1080 },
  ];

  // Secondary lower orange wave points
  const orangePoints = [
    { x: 0, y: 960 },
    { x: 300, y: 970 },
    { x: 600, y: 950 },
    { x: 800, y: 920 },
    { x: 900, y: 870 },
    { x: 1000, y: 820 },
  ];

  // Generate smooth SVG path command
  const bluePath = "M 0 720 C 120 840, 220 900, 320 800 C 420 700, 520 890, 620 820 C 720 750, 780 600, 880 400 C 930 300, 970 240, 1000 220";
  const blueArea = `${bluePath} L 1000 1000 L 0 1000 Z`;

  const orangePath = "M 0 980 C 400 970, 700 950, 850 910 C 930 890, 970 850, 1000 820";
  const orangeArea = `${orangePath} L 1000 1000 L 0 1000 Z`;

  return (
    <div className="relative w-full h-72 sm:h-80 select-none">
      {/* Y-Axis Labels & Grid Lines */}
      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-slate-400 text-xs font-medium pr-2">
        <div className="flex items-center w-full">
          <span className="w-10 text-right pr-3 shrink-0">1000</span>
          <div className="flex-1 border-b border-slate-100" />
        </div>
        <div className="flex items-center w-full">
          <span className="w-10 text-right pr-3 shrink-0">800</span>
          <div className="flex-1 border-b border-slate-100" />
        </div>
        <div className="flex items-center w-full">
          <span className="w-10 text-right pr-3 shrink-0">600</span>
          <div className="flex-1 border-b border-slate-100" />
        </div>
        <div className="flex items-center w-full">
          <span className="w-10 text-right pr-3 shrink-0">400</span>
          <div className="flex-1 border-b border-slate-100" />
        </div>
        <div className="flex items-center w-full">
          <span className="w-10 text-right pr-3 shrink-0">200</span>
          <div className="flex-1 border-b border-slate-100" />
        </div>
      </div>

      {/* SVG Curve Canvas */}
      <div className="absolute inset-0 pl-10">
        <svg
          viewBox="0 0 1000 1000"
          preserveAspectRatio="none"
          className="w-full h-full overflow-visible"
        >
          <defs>
            {/* Blue Area Gradient */}
            <linearGradient id="atlantisBlueGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1572E8" stopOpacity="0.45" />
              <stop offset="75%" stopColor="#1572E8" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#1572E8" stopOpacity="0.0" />
            </linearGradient>

            {/* Orange Area Gradient */}
            <linearGradient id="atlantisOrangeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFA534" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#FFA534" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Secondary Orange Wave Area & Line */}
          <path d={orangeArea} fill="url(#atlantisOrangeGrad)" />
          <path d={orangePath} fill="none" stroke="#FFA534" strokeWidth="3" />

          {/* Primary Blue Wave Area & Line */}
          <path d={blueArea} fill="url(#atlantisBlueGrad)" />
          <path
            d={bluePath}
            fill="none"
            stroke="#1572E8"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Interactive hover points */}
          {points.map((p, idx) => (
            <circle
              key={idx}
              cx={p.x}
              cy={p.y}
              r={hoveredPoint?.x === p.x ? 7 : 4}
              fill="#1572E8"
              stroke="#ffffff"
              strokeWidth="2.5"
              className="transition-all duration-150 cursor-pointer hover:r-8"
              onMouseEnter={() => setHoveredPoint(p)}
              onMouseLeave={() => setHoveredPoint(null)}
            />
          ))}
        </svg>

        {/* Hover Tooltip */}
        {hoveredPoint && (
          <div
            className="absolute z-20 bg-slate-900 text-white text-[11px] font-bold px-2.5 py-1 rounded-md shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-9"
            style={{
              left: `${(hoveredPoint.x / 1000) * 100}%`,
              top: `${(hoveredPoint.y / 1000) * 100}%`,
            }}
          >
            {hoveredPoint.val} Users
          </div>
        )}
      </div>
    </div>
  );
};
