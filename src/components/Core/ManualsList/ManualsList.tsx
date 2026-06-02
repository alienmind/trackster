import * as Icons from 'lucide-react';
import { useUIStore } from '../../../stores/useUIStore';
import { Button } from '../ui/button';

export default function ManualsList({ devicePrefix }: { devicePrefix: string }) {
  const setActiveDoc = useUIStore((s) => s.setActiveDoc);
  const activeDoc = useUIStore((s) => s.activeDoc);

  // Dynamically import all PDFs and MDs in devices/*/doc
  const pdfGlob = import.meta.glob('/devices/*/doc/*.pdf', { query: '?url', import: 'default', eager: true });
  const mdGlob = import.meta.glob('/devices/*/doc/*.md', { query: '?url', import: 'default', eager: true });
  
  const manualsGlob = { ...pdfGlob, ...mdGlob };

  const matchedManuals = Object.entries(manualsGlob).map(([path, url]) => {
    // path is like "/devices/flow8/doc/behringer-flow8.pdf"
    const filename = path.split('/').pop() || '';
    const type = path.endsWith('.pdf') ? 'pdf' : 'md';
    return {
      filename,
      url: url as string,
      type: type as 'pdf' | 'md'
    };
  }).filter(m => m.filename.toLowerCase().startsWith(devicePrefix.toLowerCase()))
    .sort((a, b) => {
      // Prioritize markdown files (guides) over PDFs (manuals)
      if (a.type === 'md' && b.type === 'pdf') return -1;
      if (a.type === 'pdf' && b.type === 'md') return 1;
      return a.filename.localeCompare(b.filename);
    });

  if (matchedManuals.length === 0) return null;

  return (
    <div className="mt-8">
      <h3 className="text-sm font-semibold text-muted-foreground mb-2 px-1">Manuals</h3>
      <div className="flex flex-col gap-2">
        {matchedManuals.map((m) => {
          // Format name: remove .pdf or .md, replace - and _ with spaces, Title Case
          const nameWithoutExt = m.filename.replace(/\.(pdf|md)$/i, '');
          const readableName = nameWithoutExt
            .replace(/[-_]/g, ' ')
            .replace(/\b\w/g, char => char.toUpperCase());

          const isActive = activeDoc?.url === m.url;

          return (
            <Button 
              key={m.url}
              variant="state"
              data-state={isActive ? 'active' : 'inactive'}
              className="justify-start w-full text-left whitespace-normal h-auto py-2 px-3"
              onClick={() => setActiveDoc({ url: m.url, type: m.type })}
            >
              {m.type === 'pdf' ? (
                <Icons.FileText className="mr-2 shrink-0" size={16} />
              ) : (
                <Icons.FileCode2 className="mr-2 shrink-0" size={16} />
              )}
              <span className="truncate" title={readableName}>{readableName}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
