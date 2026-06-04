import CircuitTracksDevice from './CircuitTracksDevice';
import { useCircuitTracksStore } from '../../../stores/useCircuitTracksStore';
import { useUIStore } from '../../../stores/useUIStore';
import { Button } from '../../Core/ui/button';
import * as Icons from 'lucide-react';
import DisclaimerModal from '../../Core/DisclaimerModal/DisclaimerModal';
import { useEffect, useState } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../Core/ui/tooltip';
import ResponsiveDrawer from '../../Core/ui/ResponsiveDrawer';
import StatusBar from '../../Core/StatusBar/StatusBar';
import DownloadsList from '../../Core/DownloadsList/DownloadsList';
import BrowserWarning from '../../Core/BrowserWarning/BrowserWarning';

export default function CircuitTracksLayout() {
  const { autoTag, autoArrange, applyTagsToFilenames, setApplyTagsToFilenames, deviceMode } = useCircuitTracksStore();
  const scanDuplicates = useCircuitTracksStore((s) => s.scanDuplicates);
  const { activePage, setActivePage } = useUIStore();
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false);
  const [isBrowserWarningOpen, setIsBrowserWarningOpen] = useState(false);

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
            <TooltipTrigger render={<div className="focus:outline-none w-full" />}>
              <Button
                variant="success"
                onClick={() => {
                  if ('showDirectoryPicker' in window) {
                    setIsDisclaimerOpen(true);
                  } else {
                    setIsBrowserWarningOpen(true);
                  }
                }}
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
              <TooltipTrigger render={<div className="focus:outline-none w-full" />}>
                <Button variant="secondary" className="justify-start w-full" onClick={scanDuplicates}>
                  <Icons.Copy className="mr-2" size={16} />
                  Find Duplicates
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                Scan all assigned samples for identical audio files.
              </TooltipContent>
            </Tooltip>
            <Button variant="state" data-state={applyTagsToFilenames ? 'active' : 'inactive'} className="justify-start" onClick={() => setApplyTagsToFilenames(!applyTagsToFilenames)}>
              <Icons.Tag className="mr-2" size={16} /> Tags in Filenames
            </Button>
          </div>

          <div className="mt-8">
            <h3 className="text-sm font-semibold text-muted-foreground mb-2 px-1">Navigation</h3>
            <div className="flex flex-col gap-2 mb-4">
              <Button variant="secondary" className="justify-start" onClick={() => useCircuitTracksStore.getState().setDeviceMode('packs')}>
                <Icons.Grid className="mr-2" size={16} />
                All Packs
              </Button>
            </div>
            
            {deviceMode === 'samples' && (
              <>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2 px-1">Sample Pack Pages</h3>
                <div className="flex flex-col gap-2">
                  <Button variant="state" data-state={activePage === 0 ? 'active' : 'inactive'} className="justify-start" onClick={() => { setActivePage(0); useCircuitTracksStore.getState().setDeviceMode('samples'); }}>
                     Page A (1-32)
                  </Button>
                  <Button variant="state" data-state={activePage === 1 ? 'active' : 'inactive'} className="justify-start" onClick={() => { setActivePage(1); useCircuitTracksStore.getState().setDeviceMode('samples'); }}>
                     Page B (33-64)
                  </Button>
                </div>
              </>
            )}
          </div>
          
          <div className="mt-8">
            <h3 className="text-sm font-semibold text-muted-foreground mb-2 px-1">Links</h3>
            <div className="flex flex-col gap-2">
              <a
                href="https://components.novationmusic.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="group/button inline-flex h-8 shrink-0 items-center justify-start gap-1.5 rounded-lg px-2.5 text-sm font-medium whitespace-nowrap transition-all outline-none select-none text-neutral-400 hover:text-white hover:bg-neutral-800 w-full"
              >
                <Icons.ExternalLink size={14} />
                Novation Components
              </a>
            </div>
          </div>
          
          <DownloadsList deviceId="circuit" />
        </ResponsiveDrawer>

        {/* Center Panel - Device */}
        <div className="flex-1 overflow-hidden flex flex-col bg-neutral-950">
          <div className="flex-1 overflow-y-auto flex items-center justify-center p-8">
            <CircuitTracksDevice />
          </div>
        </div>
      </div>

      <div className="hidden md:block">
        <StatusBar />
      </div>

      <DisclaimerModal isOpen={isDisclaimerOpen} onClose={() => setIsDisclaimerOpen(false)} />
      {isBrowserWarningOpen && <BrowserWarning onClose={() => setIsBrowserWarningOpen(false)} />}
    </div>
  );
}
