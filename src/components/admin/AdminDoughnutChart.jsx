import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function AdminDoughnutChart({
  title,
  subtitle,
  data = [],
  centerLabel = "Total",
  centerValue,
  unit = "Supplements",
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const navigate = useNavigate();

  const totalValue = data.reduce((acc, item) => acc + (item.value || 0), 0);
  const radius = 36;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius; // ~226.19

  let cumulativeRatio = 0;

  const segments = data.map((item) => {
    const value = item.value || 0;
    const ratio = totalValue > 0 ? value / totalValue : 0;
    const strokeDasharray = `${ratio * circumference} ${circumference - ratio * circumference}`;
    const strokeDashoffset = -cumulativeRatio * circumference;

    cumulativeRatio += ratio;

    return {
      ...item,
      value,
      ratio,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  const activeSegment = hoveredIndex !== null ? segments[hoveredIndex] : null;

  const handleItemClick = (item) => {
    if (item.link) {
      navigate(item.link);
    }
  };

  return (
    <div className="bg-[#141813] border border-neutral-800 rounded-2xl p-3.5 sm:p-5 shadow-xl flex flex-col items-center justify-between space-y-3 sm:space-y-4 relative overflow-hidden h-full">
      {/* Header Bar */}
      <div className="w-full flex items-center justify-between border-b border-neutral-800/80 pb-2.5 sm:pb-3">
        <div>
          <h3 className="font-heading text-sm sm:text-base font-black text-white flex items-center gap-2">
            <span>{title}</span>
          </h3>
          <p className="text-[10px] sm:text-[11px] text-neutral-400 mt-0.5">{subtitle}</p>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-[9px] font-extrabold text-lime-400 uppercase tracking-wider shrink-0">
          Live Data
        </span>
      </div>

      {/* Doughnut Chart Display Centered */}
      <div className="flex flex-col items-center justify-center relative py-1 w-full flex-1">
        <div className="relative w-32 h-32 sm:w-44 sm:h-44 flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
            {/* Background ring */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke="#1f261e"
              strokeWidth={strokeWidth}
            />

            {totalValue === 0 ? (
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="transparent"
                stroke="#333333"
                strokeWidth={strokeWidth}
              />
            ) : (
              segments.map((seg, idx) => {
                if (seg.value === 0) return null;
                const isHovered = hoveredIndex === idx;

                return (
                  <circle
                    key={seg.label || idx}
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="transparent"
                    stroke={seg.color}
                    strokeWidth={isHovered ? strokeWidth + 2.5 : strokeWidth}
                    strokeDasharray={seg.strokeDasharray}
                    strokeDashoffset={seg.strokeDashoffset}
                    className="transition-all duration-300 cursor-pointer origin-center"
                    style={{
                      filter: isHovered
                        ? `drop-shadow(0px 0px 8px ${seg.color})`
                        : "none",
                      opacity: hoveredIndex !== null && !isHovered ? 0.35 : 1,
                    }}
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    onClick={() => handleItemClick(seg)}
                  />
                );
              })
            )}
          </svg>

          {/* Center Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2 pointer-events-none select-none">
            <AnimatePresence mode="wait">
              {activeSegment ? (
                <motion.div
                  key={activeSegment.label}
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.85, opacity: 0 }}
                  transition={{ duration: 0.12 }}
                  className="space-y-0.5 px-2"
                >
                  <span
                    className="text-[10px] sm:text-[11px] uppercase font-heading font-black tracking-wider block truncate max-w-[90px] sm:max-w-[110px]"
                    style={{ color: activeSegment.color }}
                  >
                    {activeSegment.label}
                  </span>
                  <span
                    className="font-heading font-black text-xl sm:text-2xl block leading-tight"
                    style={{ color: activeSegment.color }}
                  >
                    {activeSegment.value}
                  </span>
                  <span className="text-[8px] sm:text-[9px] font-bold text-neutral-300 block uppercase tracking-wider">
                    {activeSegment.value === 1 ? "Product" : "Products"}
                  </span>
                </motion.div>
              ) : (
                <motion.div
                  key="default-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.12 }}
                  className="space-y-0.5"
                >
                  <span className="text-[8px] sm:text-[9px] uppercase font-extrabold tracking-widest text-neutral-500 block">
                    {centerLabel}
                  </span>
                  <span className="font-heading font-black text-xl sm:text-3xl text-white block leading-tight">
                    {centerValue !== undefined ? centerValue : totalValue}
                  </span>
                  <span className="text-[8px] sm:text-[9px] font-bold text-lime-400 block uppercase tracking-wider">
                    {centerValue === 1 ? "Product" : unit}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Horizontal Flex Pill Legend with max height on mobile */}
      <div className="w-full flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 pt-2.5 sm:pt-3 border-t border-neutral-800/80 max-h-32 sm:max-h-48 overflow-y-auto pr-1">
        {segments.map((seg, idx) => {
          const isHovered = hoveredIndex === idx;

          return (
            <button
              key={seg.label || idx}
              type="button"
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => handleItemClick(seg)}
              className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded-full border transition-all duration-200 cursor-pointer flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] select-none ${
                isHovered
                  ? "bg-neutral-900 shadow-md scale-[1.03]"
                  : "bg-neutral-900/80 border-neutral-800 hover:bg-neutral-900 hover:border-neutral-700"
              }`}
              style={{
                borderColor: isHovered ? seg.color : undefined,
                boxShadow: isHovered ? `0 0 10px ${seg.color}35` : undefined,
              }}
              title={`Click to filter ${seg.label} supplements`}
            >
              {/* Left Color Dot */}
              <span
                className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shrink-0 shadow-sm"
                style={{ backgroundColor: seg.color }}
              />

              {/* Category / Status Name */}
              <span
                className={`font-bold transition-colors ${
                  isHovered ? "text-white" : "text-neutral-200"
                }`}
              >
                {seg.label}
              </span>

              {/* Right Circular/Pill Numeric Count Badge */}
              <span
                className="px-1.5 py-0.2 rounded-full text-[9px] sm:text-[10px] font-black font-mono shrink-0 transition-colors"
                style={{
                  backgroundColor: isHovered ? seg.color : `${seg.color}20`,
                  color: isHovered ? "#000000" : seg.color,
                }}
              >
                {seg.value}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
