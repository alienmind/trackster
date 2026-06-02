import * as Icons from 'lucide-react';
import { useUIStore } from '../../../stores/useUIStore';
import { Button } from '../ui/button';

export default function ManualsList({ devicePrefix }: { devicePrefix: string }) {
  const setActivePdfUrl = useUIStore((s) => s.setActivePdfUrl);
  const activePdfUrl = useUIStore((s) => s.activePdfUrl);

  // Dynamically import all PDFs in devices/*/doc
  const manualsGlob = import.meta.glob('/devices/*/doc/*.pdf', { query: '?url', import: 'default', eager: true });

  const matchedManuals = Object.entries(manualsGlob).map(([path, url]) => {
    // path is like "/devices/flow8/doc/behringer-flow8.pdf"
    const filename = path.split('/').pop() || '';
    return {
      filename,
      url: url as string
    };
  }).filter(m => m.filename.toLowerCase().startsWith(devicePrefix.toLowerCase()));

  if (matchedManuals.length === 0) return null;

  return (
    <div className="mt-8">
      <h3 className="text-sm font-semibold text-muted-foreground mb-2 px-1">Manuals</h3>
      <div className="flex flex-col gap-2">
        {matchedManuals.map((m) => {
          // Format name: remove .pdf, replace - and _ with spaces, Title Case
          const nameWithoutExt = m.filename.replace(/\.pdf$/i, '');
          const readableName = nameWithoutExt
            .replace(/[-_]/g, ' ')
            .replace(/\b\w/g, char => char.toUpperCase());

          const isActive = activePdfUrl === m.url;

          return (
            <Button 
              key={m.url}
              variant="state"
              data-state={isActive ? 'active' : 'inactive'}
              className="justify-start w-full text-left whitespace-normal h-auto py-2 px-3"
              onClick={() => setActivePdfUrl(m.url)}
            >
              <Icons.FileText className="mr-2 shrink-0" size={16} />
              <span className="truncate" title={readableName}>{readableName}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
