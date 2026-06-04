import * as Icons from 'lucide-react';
import { useUIStore } from '../../../stores/useUIStore';
import { Button, buttonVariants } from '../ui/button';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '../ui/tooltip';
import { cn } from '@/lib/utils';

export default function DownloadsList({ deviceId }: { deviceId: string }) {
  const setActiveDoc = useUIStore((s) => s.setActiveDoc);
  const activeDoc = useUIStore((s) => s.activeDoc);

  // Dynamically import all files in devices/*/downloads
  const filesGlob = import.meta.glob('/devices/*/downloads/*.*', { query: '?url', import: 'default', eager: true });

  const extWeight: Record<string, number> = {
    md: 1,
    pdf: 2,
    apk: 3,
    exe: 4,
    dmg: 5,
    zip: 6,
  };

  const matchedFiles = Object.entries(filesGlob).map(([path, url]) => {
    // path is like "/devices/flow8/downloads/behringer-flow8.pdf"
    const filename = path.split('/').pop() || '';
    const extMatch = filename.match(/\.([^.]+)$/);
    const ext = extMatch?.[1]?.toLowerCase() || '';
    
    return {
      path,
      filename,
      url: url as string,
      ext,
    };
  }).filter(m => m.path.includes(`/devices/${deviceId}/downloads/`))
    .sort((a, b) => {
      
      const weightA = extWeight[a.ext] ?? 99;
      const weightB = extWeight[b.ext] ?? 99;
      
      if (weightA !== weightB) {
        return weightA - weightB;
      }
      return a.filename.localeCompare(b.filename);
    });

  if (matchedFiles.length === 0) return null;

  return (
    <div className="mt-8">
      <h3 className="text-sm font-semibold text-muted-foreground mb-2 px-1">Downloads</h3>
      <TooltipProvider>
        <div className="flex flex-col gap-2">
          {matchedFiles.map((m) => {
            // Format name: remove extension, replace - and _ with spaces, Title Case
            const nameWithoutExt = m.filename.replace(/\.[^.]+$/, '');
            const readableName = nameWithoutExt
              .replace(/[-_]/g, ' ')
              .replace(/\b\w/g, char => char.toUpperCase());

            const isViewable = m.ext === 'pdf' || m.ext === 'md';
            const isActive = isViewable && activeDoc?.url === m.url;

            let IconComponent = Icons.Download;
            if (m.ext === 'pdf') IconComponent = Icons.FileText;
            else if (m.ext === 'md') IconComponent = Icons.FileCode2;
            else if (m.ext === 'zip') IconComponent = Icons.FileArchive;
            else if (m.ext === 'apk') IconComponent = Icons.Package;
            else if (m.ext === 'exe' || m.ext === 'dmg') IconComponent = Icons.Binary;

            if (isViewable) {
              return (
                <Tooltip key={m.url}>
                  <TooltipTrigger render={<div className="focus:outline-none w-full" />}>
                    <Button 
                      variant="state"
                      data-state={isActive ? 'active' : 'inactive'}
                      className="justify-start w-full text-left whitespace-normal h-auto py-2 px-3"
                      onClick={() => setActiveDoc({ url: m.url, type: m.ext as 'pdf' | 'md' })}
                    >
                      <IconComponent className="mr-2 shrink-0" size={16} />
                      <span className="truncate">{readableName}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {readableName}
                  </TooltipContent>
                </Tooltip>
              );
            } else {
              return (
                <Tooltip key={m.url}>
                  <TooltipTrigger render={<div className="focus:outline-none w-full" />}>
                    <a 
                      href={m.url}
                      download={m.filename}
                      data-state="inactive"
                      className={cn(buttonVariants({ variant: 'state' }), "justify-start w-full text-left whitespace-normal h-auto py-2 px-3 flex items-center")}
                    >
                      <IconComponent className="mr-2 shrink-0" size={16} />
                      <span className="truncate">{readableName}</span>
                    </a>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {readableName}
                  </TooltipContent>
                </Tooltip>
              );
            }
          })}
        </div>
      </TooltipProvider>
    </div>
  );
}
