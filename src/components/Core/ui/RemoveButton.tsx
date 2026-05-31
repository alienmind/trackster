import React from 'react';
import { X } from 'lucide-react';
import clsx from 'clsx';

interface RemoveButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: number;
}

export default function RemoveButton({ className, size = 12, ...props }: RemoveButtonProps) {
  return (
    <button
      {...props}
      className={clsx(
        "absolute -top-2 -right-2 w-5 h-5 bg-neutral-900 border-2 border-neutral-700 rounded-full flex items-center justify-center text-neutral-400 hover:text-white hover:bg-red-600 hover:border-red-500 shadow-md transition-colors z-[110] opacity-0 group-hover:opacity-100",
        className
      )}
    >
      <X size={size} strokeWidth={3} />
    </button>
  );
}
