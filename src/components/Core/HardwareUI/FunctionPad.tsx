import React from 'react';
import { useUIStore } from '../../../stores/useUIStore';
import { cn } from '../../../lib/utils';

interface FunctionPadProps {
  label?: string;
  subLabel?: string;
  icon?: React.ReactNode;
  labelColor?: string;
  subLabelColor?: string;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
  sectionId?: string;
}

export const FunctionPad = ({ label, subLabel, icon, labelColor, subLabelColor, isActive = false, onClick, className = '', sectionId }: FunctionPadProps) => {
  const { hoveredDocSection, setHoveredDocSection } = useUIStore();
  const handleClick = () => {
    if (onClick) onClick();
  };

  return (
    <div
      className={cn(
        "relative rounded-lg p-1 transition-all duration-300 w-full aspect-square",
        hoveredDocSection === sectionId && sectionId ? 'ring-2 ring-cyan-500 shadow-[0_0_15px_cyan]' : ''
      )}
      onPointerEnter={() => sectionId && setHoveredDocSection(sectionId)}
      onPointerLeave={() => sectionId && setHoveredDocSection(null)}
    >
      <button
        onClick={handleClick}
        className={`w-full h-full bg-[#2a2a2c] border-b-[3px] border-[#111] rounded-sm flex flex-col items-center justify-center shadow-[0_2px_4px_rgba(0,0,0,0.4)] hover:bg-[#333336] active:border-b-0 active:translate-y-[3px] active:shadow-none transition-all p-1 ${isActive ? 'text-white drop-shadow-[0_0_3px_rgba(255,255,255,0.7)]' : ''} ${className}`}
      >
      <div className="flex flex-col items-center justify-center gap-1">
        <div className="flex items-center gap-1">
          {icon}
          {label && <span className={`text-[10px] font-bold text-center leading-[1.1] ${isActive ? 'text-white' : (labelColor || 'text-gray-200')}`}>{label}</span>}
        </div>
        {subLabel && <span className={`text-[9px] font-medium text-center leading-[1.1] ${isActive ? 'text-white' : (subLabelColor || 'text-gray-400')}`}>{subLabel}</span>}
      </div>
    </button>
    </div>
  );
};
