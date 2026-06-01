import * as Icons from 'lucide-react';
import ResponsiveDrawer from '../ui/ResponsiveDrawer';

export default function WIPPage({ deviceName }: { deviceName: string }) {
  return (
    <div className="flex flex-col flex-1 min-h-0 bg-neutral-900 overflow-hidden">
      <div className="flex flex-1 min-h-0">
        {/* Left Panel */}
        <ResponsiveDrawer className="bg-card border-r border-border">
          <div className="mt-2 px-1 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">Actions</h3>
              <div className="text-xs text-neutral-400 p-2 border border-neutral-800 rounded bg-neutral-900/50">
                Specific actions for {deviceName} will appear here.
              </div>
            </div>
          </div>
        </ResponsiveDrawer>

        {/* Center Panel */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-neutral-900 text-neutral-200">
          <div className="max-w-md w-full text-center space-y-6">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-neutral-800 border-4 border-neutral-700">
          <Icons.Wrench size={48} className="text-neutral-400" />
        </div>
        
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-2">Work In Progress!</h1>
          <p className="text-neutral-400 text-lg">
            The dedicated page for <strong className="text-white">{deviceName}</strong> is currently under construction.
          </p>
        </div>

        <div className="p-4 bg-neutral-800/50 rounded-xl border border-neutral-700/50 mt-8">
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
