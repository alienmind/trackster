import CircuitTracksDevice from './CircuitTracksDevice';
import StatusBar from '../../Core/StatusBar/StatusBar';
import { SidebarContextPortal } from '../../Core/AppSidebar/SidebarContextPortal';
import CircuitTracksSidebarContext from './CircuitTracksSidebarContext';
import DeviceHelpToggle from '../../Core/DeviceHelpToggle/DeviceHelpToggle';
import circuitGuideUrl from '../../../../doc/circuittracks/circuit-tracks-guide.md?url';

export default function CircuitTracksLayout() {
  return (
    <div className="flex flex-col flex-1 min-h-0 bg-background overflow-hidden relative">
      <SidebarContextPortal>
        <CircuitTracksSidebarContext />
      </SidebarContextPortal>
      
      <div className="flex flex-1 min-h-0">
        {/* Center Panel - Device */}
        <div className="flex-1 overflow-hidden flex flex-col bg-background relative">
          <DeviceHelpToggle guideUrl={circuitGuideUrl} />
          <div className="flex-1 overflow-y-auto flex items-center justify-center p-8">
            <CircuitTracksDevice />
          </div>
        </div>
      </div>

      <div className="hidden md:block">
        <StatusBar />
      </div>
    </div>
  );
}
