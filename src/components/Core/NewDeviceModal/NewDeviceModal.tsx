import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../Core/ui/dialog';
import * as Icons from 'lucide-react';
import { Button } from '../ui/button';
import { HARDWARE_LIBRARY } from '../../../devices';
import { useOverviewStore } from '../../../stores/useOverviewStore';


interface NewDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_JSON = `{
  "brand": "Manufacturer",
  "model": "Device Name",
  "tagline": "SHORT DESCRIPTION",
  "width": 300,
  "theme": {
    "border": "border-t-neutral-500",
    "header": "bg-neutral-900",
    "title": "text-white",
    "badge": "bg-neutral-800 text-neutral-400"
  },
  "ports": [
    { "id": "audioOut", "title": "Audio Out", "color": "#06b6d4", "side": "right", "offset": 50 },
    { "id": "midiIn", "title": "MIDI In", "color": "#10b981", "side": "left", "offset": 100 },
    { "id": "midiOut", "title": "MIDI Out", "color": "#3b82f6", "side": "right", "offset": 100 }
  ]
}`;

export default function NewDeviceModal({ isOpen, onClose }: NewDeviceModalProps) {
  const [view, setView] = useState<'library' | 'custom'>('library');
  const [jsonContent, setJsonContent] = useState(DEFAULT_JSON);
  const [error, setError] = useState<string | null>(null);
  const addNode = useOverviewStore((s) => s.addNode);

  const handleAddExisting = (deviceType: string) => {
    const id = `n_${deviceType}_${Math.random().toString(36).substring(2, 6)}`;
    
    // Determine screen center roughly (would be better to use viewport pan/zoom offsets, but simple for now)
    addNode(id, {
      id,
      type: deviceType,
      x: window.innerWidth / 2 - 150, // rough center based on typical device width
      y: window.innerHeight / 2 - 100,
      zIndex: 100,
      isExpanded: true,
    });
    onClose();
  };

  const handleSubmit = () => {
    try {
      // Validate JSON
      JSON.parse(jsonContent);
      setError(null);
      
      const fileName = `src/devices/new_device.json`;
      const githubUrl = `https://github.com/alienmind/trackster/new/main?filename=${encodeURIComponent(fileName)}&value=${encodeURIComponent(jsonContent)}&quick_pull=1`;
      
      window.open(githubUrl, '_blank', 'noopener,noreferrer');
      onClose();
    } catch (e: any) {
      setError(e.message || "Invalid JSON format");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-2xl bg-zinc-950 border border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white flex items-center justify-between">
            <span>{view === 'library' ? 'Add Device from Library' : 'Add Custom Device via GitHub'}</span>
          </DialogTitle>
          <DialogDescription className="text-zinc-400 text-sm pt-2">
            {view === 'library' ? 
              'Select an existing device from the hardware library to add to your grid.' :
              <>
                Trackster doesn't support generic runtime device loading yet. However, you can propose a new device configuration by creating a JSON file. 
                For reference on the expected structure, check out the <a href="https://github.com/alienmind/trackster/tree/main/src/devices" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">devices package on GitHub</a>.
                Once you define your device here, you can click "Submit via GitHub PR" to open a new Pull Request with this code!
              </>
            }
          </DialogDescription>
        </DialogHeader>

        {view === 'library' ? (
          <div className="flex flex-col gap-4 mt-4">
             <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto pr-2 pb-2">
                {Object.entries(HARDWARE_LIBRARY).map(([deviceType, blueprint]) => (
                  <div 
                    key={deviceType}
                    onClick={() => handleAddExisting(deviceType)}
                    className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 cursor-pointer hover:bg-neutral-800 hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all flex flex-col gap-1 group"
                  >
                     <div className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">{blueprint.brand}</div>
                     <div className="text-sm text-white font-bold group-hover:text-cyan-400 transition-colors">{blueprint.model}</div>
                     <div className="text-[10px] text-neutral-500 mt-1">{blueprint.tagline}</div>
                  </div>
                ))}
             </div>
             <div className="border-t border-neutral-800 pt-4 flex justify-between items-center mt-2">
                <span className="text-xs text-neutral-500">Don't see your device?</span>
                <Button variant="outline" className="border-neutral-700 text-neutral-300 hover:text-white hover:bg-neutral-800" onClick={() => setView('custom')}>
                  <Icons.Plus size={16} className="mr-2" /> Create Custom Device
                </Button>
             </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 relative mt-4">
            <textarea
              className="w-full h-80 bg-zinc-900 border border-zinc-700 text-zinc-300 p-4 rounded font-mono text-sm resize-none focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
              value={jsonContent}
              onChange={(e) => {
                setJsonContent(e.target.value);
                setError(null);
              }}
              spellCheck={false}
            />
            {error && (
              <div className="absolute bottom-4 left-4 text-red-400 text-xs font-bold bg-zinc-950 px-2 py-1 rounded border border-red-900/50">
                {error}
              </div>
            )}
            <div className="flex justify-between items-center mt-4">
              <Button variant="ghost" className="text-neutral-400 hover:text-white hover:bg-neutral-900" onClick={() => setView('library')}>
                <Icons.ArrowLeft size={16} className="mr-2" /> Back to Library
              </Button>
              <Button variant="default" className="bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-2" onClick={handleSubmit}>
                <Icons.Code size={16} /> Submit via GitHub PR
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
