import { SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarMenu, SidebarMenuItem } from '../../Core/ui/sidebar';
import { useCircuitTracksStore } from '../../../stores/useCircuitTracksStore';
import { useUIStore } from '../../../stores/useUIStore';
import * as Icons from 'lucide-react';
import { Button } from '../../Core/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../Core/ui/tooltip';
import PendingChangesPane from '../../Core/PendingChangesPane/PendingChangesPane';
import StagingArea from './StagingArea/StagingArea';
import FileInspector from '../../Core/FileInspector/FileInspector';
import DownloadsList from '../../Core/DownloadsList/DownloadsList';
import { useState } from 'react';
import DisclaimerModal from '../../Core/DisclaimerModal/DisclaimerModal';
import BrowserWarning from '../../Core/BrowserWarning/BrowserWarning';
import ConfirmModal from '../../Core/ConfirmModal/ConfirmModal';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '../../Core/ui/collapsible';
import { HARDWARE_LIBRARY } from '../../../devices';
import clsx from 'clsx';

export default function CircuitTracksSidebarContext() {
  const { autoTag, autoArrange, applyTagsToFilenames, setApplyTagsToFilenames, deviceMode, rootHandle, workspaceMode, setWorkspaceMode } = useCircuitTracksStore();
  const scanDuplicates = useCircuitTracksStore((s) => s.scanDuplicates);
  const { activePage, setActivePage } = useUIStore();
  
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false);
  const [isBrowserWarningOpen, setIsBrowserWarningOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean, title: string, description: React.ReactNode, onConfirm: () => void, destructive?: boolean }>({ isOpen: false, title: '', description: '', onConfirm: () => {} });

  const activeMainView = useUIStore.getState().activeMainView;
  const longName = HARDWARE_LIBRARY[activeMainView]?.longName || 'Circuit Tracks';

  return (
    <>
      <Collapsible defaultOpen={false} className="group/collapsible">
        <SidebarGroup>
          <SidebarGroupLabel render={<CollapsibleTrigger className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer flex items-center justify-between w-full" />}>
            {longName} Actions
            <Icons.ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
          </SidebarGroupLabel>
          <CollapsibleContent>
            <SidebarGroupContent>
              <div className="flex flex-col gap-2 px-2 mt-2">
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
                  <TooltipContent side="right">
                    Select the root directory of your SD Card (or the 'Tracks' folder directly).
                  </TooltipContent>
                </Tooltip>

                <Button variant="default" className="justify-start w-full" onClick={() => { autoTag(); autoArrange(); }}>
                  <Icons.Wand2 className="mr-2 h-4 w-4" />
                  Auto-Tag & Arrange
                </Button>

                <Tooltip>
                  <TooltipTrigger render={<div className="w-full" />}>
                    <Button variant="secondary" className="justify-start w-full" onClick={scanDuplicates}>
                      <Icons.Copy className="mr-2 h-4 w-4" />
                      Find Duplicates
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    Scan all assigned samples for identical audio files.
                  </TooltipContent>
                </Tooltip>

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
            {longName} Packs
            <Icons.ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
          </SidebarGroupLabel>
          <CollapsibleContent>
            <SidebarGroupContent>
              <div className="flex flex-col gap-2 px-2 mt-2">
                <Button variant="secondary" className="justify-start w-full" onClick={() => useCircuitTracksStore.getState().setDeviceMode('packs')}>
                  <Icons.Grid className="mr-2 h-4 w-4" />
                  All Packs
                </Button>
                
                {deviceMode === 'samples' && (
                  <div className="flex flex-col gap-2 mt-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">Pages</span>
                    <Button variant="state" data-state={activePage === 0 ? 'active' : 'inactive'} className="justify-start w-full" onClick={() => { setActivePage(0); useCircuitTracksStore.getState().setDeviceMode('samples'); }}>
                       Page A (1-32)
                    </Button>
                    <Button variant="state" data-state={activePage === 1 ? 'active' : 'inactive'} className="justify-start w-full" onClick={() => { setActivePage(1); useCircuitTracksStore.getState().setDeviceMode('samples'); }}>
                       Page B (33-64)
                    </Button>
                  </div>
                )}
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

      <Collapsible defaultOpen={false} className="group/collapsible">
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

      <Collapsible defaultOpen={false} className="group/collapsible">
        <SidebarGroup>
          <SidebarGroupLabel render={<CollapsibleTrigger className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer flex items-center justify-between w-full" />}>
            Resources
            <Icons.ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
          </SidebarGroupLabel>
          <CollapsibleContent>
            <SidebarGroupContent>
              <SidebarMenu className="mt-2">
                <SidebarMenuItem>
                  <a href="https://components.novationmusic.com/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-2 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
                    <Icons.ExternalLink className="h-4 w-4" />
                    <span>Novation Components</span>
                  </a>
                </SidebarMenuItem>
              </SidebarMenu>
              <div className="mt-4 px-2">
                <DownloadsList deviceId="circuit" />
              </div>
            </SidebarGroupContent>
          </CollapsibleContent>
        </SidebarGroup>
      </Collapsible>

      {rootHandle && workspaceMode && (
        <Collapsible defaultOpen={true} className="group/collapsible">
          <SidebarGroup>
            <SidebarGroupLabel render={<CollapsibleTrigger className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer flex items-center justify-between w-full" />}>
              Security
              <Icons.ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <div className="px-2 mt-2">
                  <Tooltip>
                    <TooltipTrigger render={<div className="w-full" />}>
                      <Button
                        variant="outline"
                        size="sm"
                        className={clsx(
                          "font-bold w-full justify-start overflow-hidden",
                          workspaceMode === 'read' ? "text-green-600 border-green-600 hover:bg-green-50" : "text-destructive border-destructive hover:bg-destructive/10"
                        )}
                        onClick={() => {
                          if (workspaceMode === 'read') {
                            setConfirmModal({
                              isOpen: true,
                              title: "Switch to Read/Write mode?",
                              description: "This is dangerous and allows modifying files on the SD card directly. Are you sure?",
                              destructive: true,
                              onConfirm: async () => {
                                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                                await setWorkspaceMode('readwrite');
                              }
                            });
                          } else {
                            setWorkspaceMode('read');
                          }
                        }}
                      >
                        {workspaceMode === 'read' ? (
                          <><Icons.ShieldCheck className="mr-2 h-4 w-4 shrink-0" /> <span>Read-Only</span></>
                        ) : (
                          <><Icons.AlertTriangle className="mr-2 h-4 w-4 shrink-0" /> <span>Read/Write</span></>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      {workspaceMode === 'read' 
                        ? "Currently in safe Read-Only mode. Click to enable Write access." 
                        : "Currently in dangerous Read/Write mode. Click to switch to safe Read-Only mode."}
                    </TooltipContent>
                  </Tooltip>
                </div>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
      )}

      <DisclaimerModal isOpen={isDisclaimerOpen} onClose={() => setIsDisclaimerOpen(false)} />
      {isBrowserWarningOpen && <BrowserWarning onClose={() => setIsBrowserWarningOpen(false)} />}
      <ConfirmModal 
        isOpen={confirmModal.isOpen} 
        title={confirmModal.title} 
        description={confirmModal.description} 
        destructive={confirmModal.destructive}
        onConfirm={confirmModal.onConfirm} 
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} 
      />
    </>
  );
}
