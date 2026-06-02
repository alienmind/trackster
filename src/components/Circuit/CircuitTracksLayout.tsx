import CircuitTracksDevice from './CircuitTracksDevice';
import FileInspector from '../Core/FileInspector/FileInspector';
import Oscilloscope from '../Core/Oscilloscope/Oscilloscope';
import StagingArea from './StagingArea/StagingArea';
import { useFileSystemStore } from '../../stores/useFileSystemStore';
import { useAudioStore } from '../../stores/useAudioStore';
import { useUIStore } from '../../stores/useUIStore';
import { Button } from '../Core/ui/button';
import * as Icons from 'lucide-react';
import DisclaimerModal from '../Core/DisclaimerModal/DisclaimerModal';
import { useEffect, useState } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '../Core/ui/tooltip';
import ResponsiveDrawer from '../Core/ui/ResponsiveDrawer';
import PendingChangesPane from '../Core/PendingChangesPane/PendingChangesPane';
import StatusBar from '../Core/StatusBar/StatusBar';
import ManualsList from '../Core/ManualsList/ManualsList';
import PdfViewer from '../Core/PdfViewer/PdfViewer';

export default function CircuitTracksLayout() {
  const { autoTag, autoArrange, applyTagsToFilenames, setApplyTagsToFilenames } = useFileSystemStore();
  const scanDuplicates = useAudioStore((s) => s.scanDuplicates);
  const { activePage, setActivePage } = useUIStore();
  const activePdfUrl = useUIStore((s) => s.activePdfUrl);
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('autoOpenDisclaimer') === 'true') {
      sessionStorage.removeItem('autoOpenDisclaimer');
      setIsDisclaimerOpen(true);
    }
  }, []);

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-neutral-900 overflow-hidden">
      <div className="flex flex-1 min-h-0">
        
        {/* Left Panel */}
        <ResponsiveDrawer className="bg-card border-r border-border">
          <Tooltip>
            <TooltipTrigger className="focus:outline-none w-full">
              <Button
                variant="default"
                onClick={() => setIsDisclaimerOpen(true)}
                className="font-semibold shadow-md w-full justify-start"
              >
                <Icons.HardDrive className="mr-2" size={16} />
                Mount SD Card
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              Select the root directory of your SD Card (or the 'Tracks' folder directly).
            </TooltipContent>
          </Tooltip>


          <div className="flex flex-col gap-2">
            <Button variant="default" className="justify-start" onClick={() => { autoTag(); autoArrange(); }}>
              <Icons.Wand2 className="mr-2" size={16} />
              Auto-Tag & Arrange
            </Button>

            <Tooltip>
              <TooltipTrigger className="focus:outline-none w-full">
                <Button variant="secondary" className="justify-start w-full" onClick={scanDuplicates}>
                  <Icons.Copy className="mr-2" size={16} />
                  Find Duplicates
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                Scan all assigned samples for identical audio files.
              </TooltipContent>
            </Tooltip>
            <Button variant={applyTagsToFilenames ? "default" : "secondary"} className={`justify-start ${applyTagsToFilenames ? 'bg-primary font-bold shadow-sm' : ''}`} onClick={() => setApplyTagsToFilenames(!applyTagsToFilenames)}>
              <Icons.Tag className="mr-2" size={16} /> Tags in Filenames
            </Button>
          </div>

          <div className="mt-8">
            <h3 className="text-sm font-semibold text-muted-foreground mb-2 px-1">Pages</h3>
            <div className="flex flex-col gap-2">
              <Button variant={activePage === 0 ? 'default' : 'secondary'} className="justify-start" onClick={() => setActivePage(0)}>
                 Pack A (1-32)
              </Button>
              <Button variant={activePage === 1 ? 'default' : 'secondary'} className="justify-start" onClick={() => setActivePage(1)}>
                 Pack B (33-64)
              </Button>
            </div>
          </div>
          
          <div className="mt-8">
            <h3 className="text-sm font-semibold text-muted-foreground mb-2 px-1">Links</h3>
            <div className="flex flex-col gap-2">
              <a
                href="https://components.novationmusic.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors bg-secondary/50 px-3 py-2 rounded-md hover:bg-secondary whitespace-nowrap"
              >
                <Icons.ExternalLink size={14} />
                Novation Components
              </a>
            </div>
          </div>
          
          <ManualsList devicePrefix="circuit-tracks" />

          <StagingArea />
        </ResponsiveDrawer>

        {/* Center Panel - Device */}
        <div className="flex-1 overflow-hidden flex flex-col bg-neutral-950">
          {activePdfUrl ? (
            <PdfViewer />
          ) : (
            <div className="flex-1 overflow-y-auto flex items-center justify-center">
              <CircuitTracksDevice />
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div className="w-80 bg-card border-l border-border p-4 flex flex-col gap-4 overflow-y-auto shadow-xl z-10">
          <FileInspector />
          <div className="relative border border-border/50 rounded bg-black overflow-hidden shadow-inner h-48 flex-none">
            <Oscilloscope />
          </div>
        </div>

        <PendingChangesPane />
      </div>

      <div className="hidden md:block">
        <StatusBar />
      </div>

      <DisclaimerModal isOpen={isDisclaimerOpen} onClose={() => setIsDisclaimerOpen(false)} />
    </div>
  );
}
