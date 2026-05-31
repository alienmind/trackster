import { useState } from 'react';
import { useFileSystemStore } from '../../../stores/useFileSystemStore';
import PackPad from './PackPad';

export default function PackOrganizer() {
  const packSlots = useFileSystemStore((s) => s.packSlots);
  const [activePackPage, setActivePackPage] = useState(0);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-background overflow-hidden">
      <div className="h-12 flex-none bg-muted flex items-center px-4 space-x-1">
        {[0, 1].map((page) => {
          const isActive = activePackPage === page;
          return (
            <button
              key={page}
              onClick={() => setActivePackPage(page)}
              className={`
                h-full px-6 flex items-center justify-center gap-2 font-medium transition-colors
                ${isActive ? 'bg-background border-t-[3px] text-foreground' : 'text-muted-foreground hover:text-muted-foreground border-t-[3px] border-transparent'}
              `}
              style={{
                borderTopColor: isActive ? (page === 0 ? '#10b981' : '#f59e0b') : 'transparent',
              }}
            >
              <div 
                className="w-4 h-4 rounded-full flex-none"
                style={{ backgroundColor: page === 0 ? '#10b981' : '#f59e0b' }}
              />
              Packs {page + 1}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-auto p-6 pb-40">
        <div className="max-w-6xl mx-auto flex flex-col h-full">
          <div className="grid grid-cols-8 gap-3">
            {packSlots.slice(activePackPage * 32, (activePackPage + 1) * 32).map((slot) => (
              <PackPad key={slot.index} slot={slot} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
