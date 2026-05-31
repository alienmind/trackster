import React, { useState } from 'react';

interface FunctionPadProps {
  label?: string;
  subLabel?: string;
  icon?: React.ReactNode;
  labelColor?: string;
  subLabelColor?: string;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
}

export const FunctionPad = ({ label, subLabel, icon, labelColor, subLabelColor, isActive: externalIsActive, onClick, className = '' }: FunctionPadProps) => {
  const [internalIsActive, setInternalIsActive] = useState(false);

  const isActive = externalIsActive !== undefined ? externalIsActive : internalIsActive;
  
  const handleClick = () => {
    if (onClick) onClick();
    if (externalIsActive === undefined) {
      setInternalIsActive(!internalIsActive);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`w-full aspect-square bg-[#2a2a2c] border-b-[3px] border-[#111] rounded-sm flex flex-col items-center justify-center shadow-[0_2px_4px_rgba(0,0,0,0.4)] hover:bg-[#333336] active:border-b-0 active:translate-y-[3px] active:shadow-none transition-all p-1 ${isActive ? 'text-white drop-shadow-[0_0_3px_rgba(255,255,255,0.7)]' : ''} ${className}`}
    >
      <div className="flex flex-col items-center justify-center gap-1">
        <div className="flex items-center gap-1">
          {icon}
          {label && <span className={`text-[10px] font-bold text-center leading-[1.1] ${isActive ? 'text-white' : (labelColor || 'text-gray-200')}`}>{label}</span>}
        </div>
        {subLabel && <span className={`text-[9px] font-medium text-center leading-[1.1] ${isActive ? 'text-white' : (subLabelColor || 'text-gray-400')}`}>{subLabel}</span>}
      </div>
    </button>
  );
};
