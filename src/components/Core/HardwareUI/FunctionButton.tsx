import React from 'react';

interface FunctionButtonProps {
  label?: string;
  topLabel?: string;
  bottomLabel?: string;
  icon?: React.ReactNode;
  labelColor?: string;
  className?: string;
  isActive?: boolean;
  onClick?: () => void;
}

export const FunctionButton = ({ label, topLabel, bottomLabel, icon, labelColor, className, isActive = false, onClick }: FunctionButtonProps) => {
  const handleClick = () => {
    if (onClick) onClick();
  };

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="h-5 flex items-end justify-center pb-1 w-full">
        {topLabel && <span className="text-[9px] text-gray-400 font-medium tracking-wide text-center leading-none">{topLabel}</span>}
      </div>
      <button
        onClick={handleClick}
        className={`w-full h-11 bg-[#1c1c1c] border-b-[3px] border-[#0a0a0a] rounded flex items-center justify-center shadow-[0_2px_4px_rgba(0,0,0,0.4)] hover:bg-[#252525] active:border-b-0 active:translate-y-[3px] active:shadow-none transition-all ${className || ''} ${isActive ? 'text-white drop-shadow-[0_0_3px_rgba(255,255,255,0.7)]' : ''}`}
      >
        {icon ? icon : (
          <span className={`text-[10px] font-semibold text-center leading-tight whitespace-pre-wrap ${isActive ? 'text-white' : (labelColor || 'text-gray-300')}`}>
            {label}
          </span>
        )}
      </button>
      <div className="h-6 flex items-start justify-center pt-1 w-full">
        {bottomLabel && <span className="text-[9px] text-gray-400 font-medium tracking-wide text-center leading-[1.1]">{bottomLabel}</span>}
      </div>
    </div>
  );
};
