import { SidebarGroup, SidebarGroupLabel, SidebarGroupContent } from '../../Core/ui/sidebar';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '../../Core/ui/collapsible';
import DownloadsList from '../../Core/DownloadsList/DownloadsList';

import { useUIStore } from '../../../stores/useUIStore';
import * as Icons from 'lucide-react';

export default function MiniFreakSidebarContext() {
  const { sidebarSectionStates, setSidebarSectionState } = useUIStore();

  return (
    <>
      <Collapsible 
        open={sidebarSectionStates['minifreak-utilities'] ?? true}
        onOpenChange={(isOpen) => setSidebarSectionState('minifreak-utilities', isOpen)}
        className="group/collapsible"
      >
        <SidebarGroup>
          <SidebarGroupLabel render={<CollapsibleTrigger className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer flex items-center justify-between w-full" />}>
            <>
              <span className="dark:hidden">Arturia MiniFreak</span>
              <span className="hidden dark:inline">Arturia MiniFreak Stellar</span>
            </> Utilities
            <Icons.ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
          </SidebarGroupLabel>
          <CollapsibleContent>
            <SidebarGroupContent>

              <div className="px-2">
                <DownloadsList deviceId="minifreak" />
              </div>
            </SidebarGroupContent>
          </CollapsibleContent>
        </SidebarGroup>
      </Collapsible>
    </>
  );
}
