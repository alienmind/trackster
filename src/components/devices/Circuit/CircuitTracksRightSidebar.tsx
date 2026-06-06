import { useState } from 'react';
import { useUIStore } from '../../../stores/useUIStore';
import { useCircuitTracksStore } from '../../../stores/useCircuitTracksStore';
import { SidebarGroup, SidebarGroupLabel, SidebarGroupContent } from '../../Core/ui/sidebar';
import * as Icons from 'lucide-react';
import { Button } from '../../Core/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '../../Core/ui/tooltip';
import PendingChangesPane from '../../Core/PendingChangesPane/PendingChangesPane';
import StagingArea from './StagingArea/StagingArea';
import FileInspector from '../../Core/FileInspector/FileInspector';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '../../Core/ui/collapsible';
import { HARDWARE_LIBRARY } from '../../../devices';
import clsx from 'clsx';
import DisclaimerModal from '../../Core/DisclaimerModal/DisclaimerModal';
import BrowserWarning from '../../Core/BrowserWarning/BrowserWarning';
import { ScrollArea } from '../../Core/ui/scroll-area';

export default function CircuitTracksRightSidebar() {
  const { autoTag, autoArrange, applyTagsToFilenames, setApplyTagsToFilenames, deviceMode } = useCircuitTracksStore();
  const scanDuplicates = useCircuitTracksStore((s) => s.scanDuplicates);
  const activeDoc = useUIStore((s) => s.activeDoc);
  
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false);
  const [isBrowserWarningOpen, setIsBrowserWarningOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  const activeMainView = useUIStore.getState().activeMainView;
  const longName = HARDWARE_LIBRARY[activeMainView]?.longName || 'Circuit Tracks';

  if (deviceMode !== 'packs' && deviceMode !== 'samples') return null;
  if (activeDoc !== null) return null;

  return (
    <div 
      className={clsx(
        "h-full flex flex-col bg-sidebar border-l border-border transition-[width] duration-300 ease-in-out relative z-10",
        isOpen ? "w-64" : "w-12"
      )}
    >
      <div className="flex items-center justify-between p-2 border-b border-sidebar-border h-14 shrink-0">
         {isOpen && <span className="font-semibold text-sm px-2 truncate">Management</span>}
         <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)} className={clsx(!isOpen && "mx-auto")}>
           {isOpen ? <Icons.PanelRightClose className="w-4 h-4" /> : <Icons.PanelRightOpen className="w-4 h-4" />}
         </Button>
      </div>

      {isOpen && (
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-2">
            <Collapsible defaultOpen={true} className="group/collapsible">
              <SidebarGroup>
                <SidebarGroupLabel render={<CollapsibleTrigger className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer flex items-center justify-between w-full" />}>
                  {longName} Actions
                  <Icons.ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                </SidebarGroupLabel>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <div className="flex flex-col gap-2 px-2 mt-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger render={<div className="w-full" />}>
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
                              <Icons.HardDrive className="mr-2 h-4 w-4" />
                              Mount SD Card
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="left">
                            Select the root directory of your SD Card.
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <Button variant="default" className="justify-start w-full" onClick={() => { autoTag(); autoArrange(); }}>
                        <Icons.Wand2 className="mr-2 h-4 w-4" />
                        Auto-Tag & Arrange
                      </Button>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger render={<div className="w-full" />}>
                            <Button variant="secondary" className="justify-start w-full" onClick={scanDuplicates}>
                              <Icons.Copy className="mr-2 h-4 w-4" />
                              Find Duplicates
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="left">
                            Scan assigned samples for identical files.
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <Button variant="state" data-state={applyTagsToFilenames ? 'active' : 'inactive'} className="justify-start w-full" onClick={() => setApplyTagsToFilenames(!applyTagsToFilenames)}>
                        <Icons.Tag className="mr-2 h-4 w-4" /> Tags in Filenames
                      </Button>
                    </div>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>

            <Collapsible defaultOpen={true} className="group/collapsible">
              <SidebarGroup>
                <SidebarGroupLabel render={<CollapsibleTrigger className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer flex items-center justify-between w-full" />}>
                  Pending Changes
                  <Icons.ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                </SidebarGroupLabel>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <div className="px-2 h-64 overflow-hidden mt-2">
                      <PendingChangesPane />
                    </div>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>

            <Collapsible defaultOpen={true} className="group/collapsible">
              <SidebarGroup>
                <SidebarGroupLabel render={<CollapsibleTrigger className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer flex items-center justify-between w-full" />}>
                  Staging Area
                  <Icons.ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                </SidebarGroupLabel>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <div className="px-2 h-64 overflow-hidden mt-2">
                      <StagingArea />
                    </div>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>

            <Collapsible defaultOpen={true} className="group/collapsible">
              <SidebarGroup>
                <SidebarGroupLabel render={<CollapsibleTrigger className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer flex items-center justify-between w-full" />}>
                  File Inspector
                  <Icons.ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                </SidebarGroupLabel>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <div className="px-2 mt-2">
                      <FileInspector />
                    </div>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>

          </div>
        </ScrollArea>
      )}

      <DisclaimerModal isOpen={isDisclaimerOpen} onClose={() => setIsDisclaimerOpen(false)} />
      {isBrowserWarningOpen && <BrowserWarning onClose={() => setIsBrowserWarningOpen(false)} />}
    </div>
  );
}
