import * as Icons from 'lucide-react';
import DownloadsList from '../DownloadsList/DownloadsList';
import { SidebarContextPortal } from '../AppSidebar/SidebarContextPortal';
import { SidebarGroup, SidebarGroupLabel, SidebarGroupContent } from '../ui/sidebar';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '../ui/collapsible';

const deviceImages = import.meta.glob('../../../../devices/*/device.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;


import { HARDWARE_LIBRARY } from '../../../devices';
import { useUIStore } from '../../../stores/useUIStore';

export default function WIPPage({ deviceId }: { deviceId: string }) {
  const device = HARDWARE_LIBRARY[deviceId];
  const longName = device?.longName || deviceId;
  const { sidebarSectionStates, setSidebarSectionState } = useUIStore();

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-neutral-900 overflow-hidden">
      <div className="flex flex-1 min-h-0">
        <SidebarContextPortal>
          <Collapsible 
            open={sidebarSectionStates[`${deviceId}-wip-actions`] ?? true}
            onOpenChange={(isOpen) => setSidebarSectionState(`${deviceId}-wip-actions`, isOpen)}
            className="group/collapsible"
          >
            <SidebarGroup>
              <SidebarGroupLabel render={<CollapsibleTrigger className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer flex items-center justify-between w-full" />}>
                {longName} Actions
                <Icons.ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <div className="px-2 mt-2">
                    <div className="text-xs text-neutral-400 p-2 border border-neutral-800 rounded bg-neutral-900/50">
                      Specific actions for {longName} will appear here.
                    </div>
                  </div>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
          <Collapsible 
            open={sidebarSectionStates[`${deviceId}-wip-resources`] ?? true}
            onOpenChange={(isOpen) => setSidebarSectionState(`${deviceId}-wip-resources`, isOpen)}
            className="group/collapsible"
          >
            <SidebarGroup>
              <SidebarGroupLabel render={<CollapsibleTrigger className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer flex items-center justify-between w-full" />}>
                Resources
                <Icons.ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <div className="mt-4 px-2">
                    <DownloadsList deviceId={deviceId} />
                  </div>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        </SidebarContextPortal>

        {/* Center Panel */}
        <div className="flex-1 min-h-0 h-full w-full bg-[#111] flex flex-col items-center justify-center p-8 text-center relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-neutral-800/20 via-neutral-900 to-black pointer-events-none" />
          
          <div className="max-w-md w-full text-center space-y-6 relative z-10 flex flex-col items-center">
            {(() => {
              const matchKey = Object.keys(deviceImages).find(key => key.includes(`/${deviceId}/`));
              if (matchKey && deviceImages[matchKey]) {
                return (
                  <div className="mb-8">
                    <img src={deviceImages[matchKey]} alt={longName} className="max-w-full max-h-64 object-contain drop-shadow-2xl filter brightness-110" />
                  </div>
                );
              }
              return (
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-neutral-800 border-4 border-neutral-700 mb-4">
                  <Icons.Wrench size={48} className="text-neutral-400" />
                </div>
              );
            })()}
            
            <div>
              <h1 className="text-3xl font-black tracking-tight mb-2">Work In Progress!</h1>
              <p className="text-neutral-400 text-lg">
                The dedicated page for <strong className="text-white">{longName}</strong> is currently under construction.
              </p>
            </div>

            <div className="p-4 bg-neutral-800/50 rounded-xl border border-neutral-700/50 mt-8 w-full">
              <p className="text-sm text-neutral-400">
                Check back later for features and integrations specific to this device.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
