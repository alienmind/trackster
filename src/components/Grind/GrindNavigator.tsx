import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeRaw from 'rehype-raw';
import { useGrindStore } from '../../stores/useGrindStore';
import grindDocUrl from '@doc/GRIND.md?url';

import { useUIStore } from '../../stores/useUIStore';
import { Button } from '../Core/ui/button';
import { cn } from '../../lib/utils';
import * as Icons from 'lucide-react';

export default function GrindNavigator() {
  const activeDocSection = useGrindStore(s => s.activeDocSection);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [grindDoc, setGrindDoc] = useState<string>('');

  const isCollapsed = useUIStore((s) => s.isRightPaneCollapsed);
  const toggleCollapse = useUIStore((s) => s.toggleRightPane);
  const setRightPaneCollapsed = useUIStore((s) => s.setRightPaneCollapsed);

  useEffect(() => {
    fetch(grindDocUrl)
      .then(r => r.text())
      .then(setGrindDoc)
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (activeDocSection) {
      if (isCollapsed && setRightPaneCollapsed) {
        setRightPaneCollapsed(false);
      }
      
      // Wait a bit longer to allow for uncollapsing animation before trying to scroll
      setTimeout(() => {
        if (scrollRef.current) {
          // Find the element by ID
          const el = scrollRef.current?.querySelector(`#${activeDocSection}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Apply a highlight effect
            el.classList.add('bg-cyan-900/40', 'rounded', 'ring-2', 'ring-cyan-500', 'transition-all', 'duration-500');
            setTimeout(() => {
              el.classList.remove('bg-cyan-900/40', 'ring-2', 'ring-cyan-500');
            }, 3000);
          }
        }
      }, 150);
    }
  }, [activeDocSection, isCollapsed, setRightPaneCollapsed]);

  return (
    <>
      {/* Mobile Floating Toggle Button */}
      <div className="md:hidden absolute top-4 right-4 z-50">
        <Button 
          variant="secondary" 
          size="icon" 
          onClick={toggleCollapse}
          className="rounded-full shadow-xl bg-neutral-900 border border-neutral-700 text-white hover:bg-neutral-800 relative h-10 w-10"
        >
          {!isCollapsed ? (
            <Icons.X size={20} />
          ) : (
            <Icons.BookOpen size={20} />
          )}
        </Button>
      </div>

      {/* Mobile Backdrop */}
      {!isCollapsed && (
        <div 
          className="md:hidden absolute inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={toggleCollapse}
        />
      )}

      {/* Main Drawer Container */}
      <div className={cn(
        "bg-card flex flex-col h-full overflow-hidden flex-none transition-all duration-300 ease-in-out z-40",
        "border-l border-border md:relative",
        isCollapsed 
          ? "hidden md:flex md:w-16" 
          : "absolute right-0 top-0 bottom-0 w-96 md:w-96 max-w-[85vw] shadow-2xl md:shadow-none animate-in slide-in-from-right md:animate-none pt-16 md:pt-0"
      )}>
        <div className={cn(
          "flex-none border-b border-border/50 flex items-center bg-black/40",
          isCollapsed ? "flex-col justify-center gap-2 py-4 h-auto" : "justify-between px-4 py-4 h-auto min-h-[56px]"
        )}>
          <div className="flex items-center gap-2">
            <Icons.BookOpen size={16} className={cn("text-primary", isCollapsed && "mb-2")} />
            {!isCollapsed && (
              <div>
                <h2 className="text-lg font-bold text-foreground leading-tight">Grind Manual</h2>
              </div>
            )}
          </div>
          
          <div className={cn("flex items-center", isCollapsed ? "flex-col gap-2" : "gap-2")}>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleCollapse}
              className="flex-none h-8 w-8 hidden md:flex"
            >
              {isCollapsed ? <Icons.PanelRightOpen size={16} /> : <Icons.PanelRightClose size={16} />}
            </Button>
          </div>
        </div>

        {!isCollapsed && (
          <>
            <div className="px-4 pb-4 pt-1 border-b border-border/50 bg-black/40 shrink-0">
              <p className="text-xs text-muted-foreground">Interact with controls on the device to automatically jump to their documentation.</p>
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 prose prose-invert prose-sm max-w-none custom-scrollbar pb-32">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]} 
                rehypePlugins={[rehypeRaw, rehypeSlug]}
                components={{
                  h1: ({node, ...props}) => <h1 className="text-2xl font-black text-cyan-400 mt-6 mb-4" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-xl font-bold text-cyan-500 mt-8 mb-4 border-b border-neutral-800 pb-2" {...props} />,
                  h3: ({node, ...props}) => <h3 className="text-base font-bold text-neutral-200 mt-6 mb-2 py-1 px-2 -mx-2" {...props} />,
                  p: ({node, ...props}) => <p className="text-neutral-400 leading-relaxed mb-4" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc pl-5 text-neutral-400 mb-4" {...props} />,
                  li: ({node, ...props}) => <li className="mb-1" {...props} />,
                  code: ({node, ...props}) => <code className="bg-neutral-800 text-cyan-300 px-1 py-0.5 rounded text-xs font-mono" {...props} />,
                  table: ({node, ...props}) => <div className="overflow-x-auto my-6"><table className="min-w-full text-xs text-left" {...props} /></div>,
                  th: ({node, ...props}) => <th className="border-b border-neutral-700 bg-neutral-800/50 p-2 font-semibold text-neutral-300" {...props} />,
                  td: ({node, ...props}) => <td className="border-b border-neutral-800 p-2 text-neutral-400" {...props} />,
                }}
              >
                {grindDoc}
              </ReactMarkdown>
            </div>
          </>
        )}
      </div>
    </>
  );
}
