import React, { useState } from 'react';

interface BarData {
  day: string;
  value: number; // 0 to 100
  amount: string;
}

const DEFAULT_BARS: BarData[] = [
  { day: 'S', value: 48, amount: '$540' },
  { day: 'M', value: 24, amount: '$280' },
  { day: 'T', value: 88, amount: '$980' },
  { day: 'W', value: 42, amount: '$460' },
  { day: 'T', value: 22, amount: '$240' },
  { day: 'F', value: 54, amount: '$610' },
  { day: 'S', value: 28, amount: '$310' },
  { day: 'S', value: 16, amount: '$180' },
  { day: 'M', value: 72, amount: '$820' },
  { day: 'T', value: 94, amount: '$1,050' },
];

export const BarChart: React.FC = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="flex items-end justify-between gap-2 sm:gap-3 h-40 pt-4 px-2">
      {DEFAULT_BARS.map((item, index) => {
        const isHovered = hoveredIndex === index;
        return (
          <div
            key={index}
            className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {/* Tooltip on hover */}
            {isHovered && (
              <div className="absolute -top-7 bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-md pointer-events-none whitespace-nowrap z-20 animate-in fade-in">
                {item.amount}
              </div>
            )}

            {/* Vertical Bar */}
            <div className="w-full max-w-[16px] bg-slate-100 rounded-t-sm h-full flex items-end">
              <div
                className="w-full bg-[#FFA534] hover:bg-[#FF9E27] transition-all duration-300 rounded-t-sm"
                style={{
                  height: `${item.value}%`,
                }}
              />
            </div>

            {/* Day Label */}
            <span className="text-[11px] font-medium text-slate-500 mt-2">
              {item.day}
            </span>
          </div>
        );
      })}
    </div>
  );
};
