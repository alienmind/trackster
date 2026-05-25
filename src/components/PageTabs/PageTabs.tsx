import { useUIStore } from '../../stores/useUIStore';
import { PAGES } from '../../utils/constants';

export default function PageTabs() {
  const activePage = useUIStore((s) => s.activePage);
  const setActivePage = useUIStore((s) => s.setActivePage);

  return (
    <div className="h-12 flex-none bg-muted flex items-center px-4 space-x-1">
      {PAGES.map((page) => {
        const isActive = activePage === page.index;

        return (
          <button
            key={page.index}
            onClick={() => setActivePage(page.index)}
            className={`
              h-full px-6 flex items-center justify-center gap-2 font-medium transition-colors
              ${isActive ? 'bg-background border-t-[3px] text-foreground' : 'text-muted-foreground hover:text-muted-foreground border-t-[3px] border-transparent'}
            `}
            style={{
              borderTopColor: isActive ? page.color : 'transparent',
            }}
          >
            <div 
              className="w-4 h-4 rounded-full flex-none"
              style={{ backgroundColor: page.color }}
            />
            {page.label}
          </button>

        );
      })}
    </div>
  );
}
