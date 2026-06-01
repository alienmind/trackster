import React from 'react';
import { useUIStore } from '../../../stores/useUIStore';
import * as Icons from 'lucide-react';
import { Button } from './button';
import { cn } from '../../../lib/utils';

interface ResponsiveDrawerProps {
  children: React.ReactNode;
  className?: string;
}

export default function ResponsiveDrawer({ children, className = '' }: ResponsiveDrawerProps) {
  const isMobileDrawerOpen = useUIStore((s) => s.isMobileDrawerOpen);
  const setMobileDrawerOpen = useUIStore((s) => s.setMobileDrawerOpen);
  const isLeftPaneCollapsed = useUIStore((s) => s.isLeftPaneCollapsed);
  const toggleLeftPane = useUIStore((s) => s.toggleLeftPane);

  // Strip fixed widths and padding from original class to handle collapse cleanly
  const baseClasses = className.replace(/\bw-\d+\b/g, '').replace(/\bp-\d+\b/g, '');

  return (
    <>
      {/* Mobile/Tablet Toggle Button (Floating) */}
      <div className="md:hidden absolute top-4 left-4 z-50">
        <Button 
          variant="secondary" 
          size="icon" 
          className="rounded-full shadow-xl bg-neutral-900 border border-neutral-700 text-white hover:bg-neutral-800"
          onClick={() => setMobileDrawerOpen(!isMobileDrawerOpen)}
        >
          {isMobileDrawerOpen ? <Icons.X size={20} /> : <Icons.Menu size={20} />}
        </Button>
      </div>

      {/* Desktop Sidebar (Persistent) */}
      <div className={cn(
        "hidden md:flex transition-all duration-300 ease-in-out relative flex-col",
        baseClasses,
        isLeftPaneCollapsed ? "w-16 p-2 items-center" : "w-64 p-4"
      )}>
        <div className={cn(
          "flex w-full mb-4 shrink-0",
          isLeftPaneCollapsed ? "justify-center" : "justify-end"
        )}>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleLeftPane} 
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title={isLeftPaneCollapsed ? "Expand panel" : "Collapse panel"}
          >
            {isLeftPaneCollapsed ? <Icons.PanelLeftOpen size={16} /> : <Icons.PanelLeftClose size={16} />}
          </Button>
        </div>
        
        <div className={cn(
          "flex-col gap-4 w-full h-full overflow-y-auto",
          isLeftPaneCollapsed ? "hidden" : "flex"
        )}>
           {children}
        </div>
      </div>

      {/* Mobile/Tablet Drawer (Overlay) */}
      {isMobileDrawerOpen && (
        <div className="md:hidden absolute inset-0 z-40 flex">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
            onClick={() => setMobileDrawerOpen(false)}
          />
          
          {/* Sliding Panel */}
          <div className={cn(
            "relative max-w-[80vw] h-full shadow-2xl flex flex-col animate-in slide-in-from-left duration-300 w-72 p-4",
            baseClasses
          )}>
             <div className="pt-16 pb-4 h-full overflow-y-auto flex flex-col gap-4">
               {children}
             </div>
          </div>
        </div>
      )}
    </>
  );
}
