import { SidebarGroup, SidebarGroupLabel, SidebarGroupContent } from '../../Core/ui/sidebar';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '../../Core/ui/collapsible';
import DownloadsList from '../../Core/DownloadsList/DownloadsList';

import { useUIStore } from '../../../stores/useUIStore';
import { HARDWARE_LIBRARY } from '../../../devices';
import * as Icons from 'lucide-react';

export default function GrindSidebarContext() {
  const { activeMainView } = useUIStore();
  const longName = HARDWARE_LIBRARY[activeMainView]?.longName || 'Behringer Grind';

  return (
    <>
      <Collapsible defaultOpen={true} className="group/collapsible">
        <SidebarGroup>
          <SidebarGroupLabel render={<CollapsibleTrigger className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer flex items-center justify-between w-full" />}>
            {longName} Utilities
            <Icons.ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
          </SidebarGroupLabel>
          <CollapsibleContent>
            <SidebarGroupContent>

              <div className="px-2">
                <DownloadsList deviceId="grind" />
              </div>
            </SidebarGroupContent>
          </CollapsibleContent>
        </SidebarGroup>
      </Collapsible>
    </>
  );
}
