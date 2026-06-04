import { HARDWARE_LIBRARY } from '../../../devices';
import { useCircuitTracksStore } from '../../../stores/useCircuitTracksStore';
import { useUIStore } from '../../../stores/useUIStore';
import { Button } from '../../Core/ui/button';
import * as Icons from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../Core/ui/tooltip';
import ConfirmModal from '../ConfirmModal/ConfirmModal';
import InfoModal from '../InfoModal/InfoModal';
import NewDeviceModal from '../NewDeviceModal/NewDeviceModal';
import { useState } from 'react';

import clsx from 'clsx';
import { del } from 'idb-keyval';

export default function Toolbar() {
  const { rootHandle, workspaceMode, setWorkspaceMode } = useCircuitTracksStore();
  const { activeMainView, setActiveMainView } = useUIStore();
  
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean, title: string, description: React.ReactNode, onConfirm: () => void, destructive?: boolean }>({ isOpen: false, title: '', description: '', onConfirm: () => {} });
  const [infoModal, setInfoModal] = useState<{ isOpen: boolean, title: string, description: string }>({ isOpen: false, title: '', description: '' });
  const [newDeviceModalOpen, setNewDeviceModalOpen] = useState(false);

  const ALL_DEVICES: { id: string; label: string; requiresMount?: boolean }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'circuit', label: HARDWARE_LIBRARY['circuit']?.longName || 'Circuit Tracks', requiresMount: true },
    { id: 'grind', label: HARDWARE_LIBRARY['grind']?.longName || 'Behringer Grind' },
    { id: 's1', label: HARDWARE_LIBRARY['s1']?.longName || 'Roland S-1' },
    { id: 'minifreak', label: HARDWARE_LIBRARY['minifreak']?.longName || 'Arturia Minifreak' },
    { id: 'flow8', label: HARDWARE_LIBRARY['flow8']?.longName || 'Flow 8' },
    { id: 'ableton', label: HARDWARE_LIBRARY['ableton']?.longName || 'Ableton Live' },
    { id: 'soundtoys', label: 'Sound Toys' },
  ];

  const DEVICES = ALL_DEVICES.filter(device => {
     if (['overview', 'soundtoys'].includes(device.id)) return true;
     const bp = HARDWARE_LIBRARY[device.id];
     return !(bp && bp.hideFromToolbar);
  });
  

  return (
    <div className="flex flex-col flex-none w-full border-t md:border-t-0 md:border-b border-border bg-card shadow-[0_-4px_10px_rgba(0,0,0,0.2)] md:shadow-none relative z-50">
      <div className="h-12 md:h-14 lg:h-16 px-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">


          <div className="flex bg-muted p-1 rounded-md overflow-x-auto max-w-[60vw]">
            {DEVICES.map(device => (
              <button
                key={device.id}
                onClick={() => setActiveMainView(device.id as any)}
                className={clsx(
                  "px-4 py-1.5 text-sm font-medium rounded-sm transition-colors whitespace-nowrap",
                  activeMainView === device.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground disabled:opacity-50"
                )}
              >
                {device.label}
              </button>
            ))}
            
            <button
              onClick={() => setNewDeviceModalOpen(true)}
              className="px-4 py-1.5 text-sm font-medium rounded-sm transition-colors whitespace-nowrap text-muted-foreground hover:text-foreground ml-2 flex items-center"
            >
              <Icons.Plus size={14} className="mr-1" /> Add new device
            </button>
          </div>


          {rootHandle && workspaceMode && activeMainView === 'circuit' && (
            <div className="flex items-center ml-2">
              <Tooltip>
                <TooltipTrigger render={<div className="inline-flex focus:outline-none" />}>
                  <Button
                    variant="outline"
                    size="sm"
                    className={clsx(
                      "font-bold",
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
                      <><Icons.ShieldCheck className="mr-2 h-4 w-4" /> Read-Only</>
                    ) : (
                      <><Icons.AlertTriangle className="mr-2 h-4 w-4" /> Read/Write</>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {workspaceMode === 'read' 
                    ? "Currently in safe Read-Only mode. Click to enable Write access." 
                    : "Currently in dangerous Read/Write mode. Click to switch to safe Read-Only mode."}
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {useUIStore((s) => s.deferredPrompt) && (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                const promptEvent = useUIStore.getState().deferredPrompt;
                if (!promptEvent) return;
                promptEvent.prompt();
                const result = await promptEvent.userChoice;
                if (result.outcome === 'accepted') {
                  useUIStore.getState().setDeferredPrompt(null);
                }
              }}
              className="text-cyan-500 border-cyan-500 hover:bg-cyan-950/20 mr-2"
            >
              <Icons.Download className="mr-2 h-4 w-4" /> Install App
            </Button>
          )}
          <Tooltip>
            <TooltipTrigger render={<div className="inline-flex focus:outline-none" />}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setConfirmModal({
                    isOpen: true,
                    title: "Clear Workspace Cache?",
                    description: "Are you sure you want to clear your workspace cache? This will reset the app and reload.",
                    destructive: true,
                    onConfirm: async () => {
                      setConfirmModal(prev => ({ ...prev, isOpen: false }));
                      await del('trackster-storage');
                      await del('trackster-ui-storage');
                      sessionStorage.setItem('autoOpenDisclaimer', 'true');
                      window.location.reload();
                    }
                  });
                }}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <Icons.Trash2 size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              Clear Workspace Cache
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
      

      <ConfirmModal 
        isOpen={confirmModal.isOpen} 
        title={confirmModal.title} 
        description={confirmModal.description} 
        destructive={confirmModal.destructive}
        onConfirm={confirmModal.onConfirm} 
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} 
      />
      <InfoModal 
        isOpen={infoModal.isOpen} 
        title={infoModal.title} 
        description={infoModal.description} 
        onClose={() => setInfoModal(prev => ({ ...prev, isOpen: false }))} 
      />
      <NewDeviceModal
        isOpen={newDeviceModalOpen}
        onClose={() => setNewDeviceModalOpen(false)}
      />
      </div>
  );
}
