import * as Icons from 'lucide-react';
import { useUIStore } from '../../../stores/useUIStore';
import { Button } from '../ui/button';

export default function PdfViewer() {
  const activePdfUrl = useUIStore((s) => s.activePdfUrl);
  const setActivePdfUrl = useUIStore((s) => s.setActivePdfUrl);

  if (!activePdfUrl) return null;

  return (
    <div className="flex flex-col w-full h-full bg-neutral-900 overflow-hidden relative z-50">
      <div className="h-12 bg-card border-b border-border flex items-center justify-between px-4 shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Icons.FileText size={18} />
          <span className="font-semibold text-sm">Document Viewer</span>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setActivePdfUrl(null)}
          className="text-muted-foreground hover:text-foreground"
        >
          <Icons.X size={16} className="mr-1" /> Close
        </Button>
      </div>
      <div className="flex-1 w-full bg-[#333]">
        <iframe 
          src={activePdfUrl} 
          className="w-full h-full border-0" 
          title="PDF Manual"
        />
      </div>
    </div>
  );
}
