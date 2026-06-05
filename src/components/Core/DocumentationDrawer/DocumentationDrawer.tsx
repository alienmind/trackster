import { useUIStore } from '../../../stores/useUIStore';
import DocumentViewer from '../DocumentViewer/DocumentViewer';
import { cn } from '../../../lib/utils';

export default function DocumentationDrawer() {
  const activeDoc = useUIStore((s) => s.activeDoc);
  const isOpen = activeDoc !== null;

  return (
    <div 
      className={cn(
        "absolute top-0 right-0 bottom-0 z-40 bg-card border-l border-border shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}
      style={{
        width: 'min(800px, 90vw)',
      }}
    >
      {isOpen && (
        <DocumentViewer />
      )}
    </div>
  );
}
