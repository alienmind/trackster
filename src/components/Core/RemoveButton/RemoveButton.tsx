import React from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/button';
import clsx from 'clsx';

interface RemoveButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: number;
}

export default function RemoveButton({ className, size = 12, ...props }: RemoveButtonProps) {
  return (
    <Button
      variant="destructive"
      size="icon"
      {...props}
      className={clsx(
        "absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center shadow-md transition-colors z-[110] opacity-0 group-hover:opacity-100",
        className
      )}
    >
      <X size={size} strokeWidth={3} />
    </Button>
  );
}
