import {
  Sidebar,
  useSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '../ui/sidebar';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '../ui/collapsible';
import { useUIStore } from '../../../stores/useUIStore';
import { HARDWARE_LIBRARY } from '../../../devices';
import { useOverviewStore } from '../../../stores/useOverviewStore';
import Logo from '../Logo';
import * as Icons from 'lucide-react';
import pkg from '../../../../package.json';
import { ThemeToggle } from '../ThemeToggle';
import { Button } from '../ui/button';
import { del } from 'idb-keyval';
import ConfirmModal from '../ConfirmModal/ConfirmModal';
import { useState } from 'react';

export function AppSidebar() {
  const { activeMainView, setActiveMainView, sidebarSectionStates, setSidebarSectionState, isOscilloscopeOpen, setOscilloscopeOpen } = useUIStore();
  const { toggleSidebar } = useSidebar();

  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean, title: string, description: React.ReactNode, onConfirm: () => void, destructive?: boolean }>({ isOpen: false, title: '', description: '', onConfirm: () => {} });

  // Devices in the navbar reflect the CURRENT profile (overview store nodes),
  // not the whole hardware library. Overview and Sound Toys are always present.
  const overviewNodes = useOverviewStore(state => state.nodes);
  const activeDeviceTypes = Array.from(new Set(Object.values(overviewNodes).map(n => n.type)));
  const hardwareDevices = activeDeviceTypes
    .map(type => HARDWARE_LIBRARY[type])
    .filter((bp): bp is NonNullable<typeof bp> => !!bp)
    .map(bp => ({ 
      id: bp.id, 
      label: bp.id === 'minifreak' ? (
        <>
          <span className="dark:hidden">Arturia MiniFreak</span>
          <span className="hidden dark:inline">Arturia MiniFreak Stellar</span>
        </>
      ) : bp.longName, 
      requiresMount: bp.requiresMount 
    }));

  const DEVICES = [
    { id: 'overview', label: 'Overview', icon: Icons.Activity },
    ...hardwareDevices.map(d => ({ ...d, icon: Icons.Cpu })),
    { id: 'soundtoys', label: 'Sound Toys', icon: Icons.AudioWaveform },
  ];

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="relative flex flex-col items-center justify-center py-4 border-b border-border group-data-[collapsible=icon]:pt-14">
        <Logo className="h-8 w-auto text-foreground mb-2 group-data-[collapsible=icon]:h-5 group-data-[collapsible=icon]:mb-0" />
        <div className="flex items-baseline space-x-1 group-data-[collapsible=icon]:hidden">
          <h1 className="text-xl font-bold tracking-tight text-foreground">Tracks(ter)</h1>
          <span className="text-[10px] text-muted-foreground font-mono font-bold">v{pkg.version}</span>
        </div>
        {/* Collapse button — visible only when sidebar is expanded (not in icon mode). */}
        <button
          type="button"
          aria-label="Collapse sidebar"
          title="Collapse sidebar (Ctrl/Cmd+B)"
          onClick={() => toggleSidebar()}
          className="absolute top-2 right-2 inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition group-data-[collapsible=icon]:hidden"
        >
          <Icons.PanelLeftClose className="h-4 w-4" />
        </button>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        <Collapsible 
          open={sidebarSectionStates['app-navigation'] ?? true}
          onOpenChange={(isOpen) => setSidebarSectionState('app-navigation', isOpen)}
          className="group/collapsible"
        >
          <SidebarGroup>
            <SidebarGroupLabel render={<CollapsibleTrigger className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer flex items-center justify-between w-full" />}>
              Navigation
              <Icons.ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {DEVICES.map((device) => (
                    <SidebarMenuItem key={device.id}>
                      <SidebarMenuButton 
                        isActive={activeMainView === device.id} 
                        onClick={() => setActiveMainView(device.id as any)}
                        tooltip={device.label}
                      >
                        <device.icon className="w-4 h-4" />
                        <span>{device.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        {/* Everything below is hidden when the sidebar is collapsed to icons,
            since secondary sections and per-device content don't fit reliably
            in the narrow icon rail. Re-expand the sidebar to access them. */}
        <div className="group-data-[collapsible=icon]:hidden">
          <SidebarSeparator />

          {/* Global Tools */}
          <Collapsible 
            open={sidebarSectionStates['global-tools'] ?? true}
            onOpenChange={(isOpen) => setSidebarSectionState('global-tools', isOpen)}
            className="group/collapsible"
          >
            <SidebarGroup>
              <SidebarGroupLabel render={<CollapsibleTrigger className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer flex items-center justify-between w-full" />}>
                Global Tools
                <Icons.ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton 
                        isActive={isOscilloscopeOpen}
                        onClick={() => setOscilloscopeOpen(!isOscilloscopeOpen)}
                        tooltip="Toggle Oscilloscope"
                      >
                        <Icons.Activity className="w-4 h-4" />
                        <span>Oscilloscope</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>

          <SidebarSeparator />

          {/* Contextual Device Tools Injected Here */}
          <div id="sidebar-context-portal-root"></div>
        </div>
        
      </SidebarContent>

      <SidebarFooter className="border-t border-border flex flex-col gap-2 p-2 group-data-[collapsible=icon]:hidden">
        {/* Action Buttons */}
        <div className="flex items-center gap-2 group-data-[collapsible=icon]:flex-col">
          <ThemeToggle />
          <a
            href="https://github.com/alienmind/trackster"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center p-2 text-muted-foreground hover:text-primary transition-colors bg-muted rounded-md hover:bg-secondary flex-1"
            title="GitHub"
          >
            <Icons.GitBranch size={16} />
          </a>
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
            className="text-muted-foreground hover:text-destructive transition-colors bg-muted flex-1"
            title="Clear Workspace Cache"
          >
            <Icons.Trash2 size={16} />
          </Button>
        </div>
      </SidebarFooter>

      <ConfirmModal 
        isOpen={confirmModal.isOpen} 
        title={confirmModal.title} 
        description={confirmModal.description} 
        destructive={confirmModal.destructive}
        onConfirm={confirmModal.onConfirm} 
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} 
      />
    </Sidebar>
  );
}
