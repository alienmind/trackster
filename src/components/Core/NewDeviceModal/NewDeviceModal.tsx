import { useState, useEffect } from 'react';
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
  ],
  "svgRender": "<svg viewBox=\\"0 0 300 200\\" xmlns=\\"http://www.w3.org/2000/svg\\"><!-- LLM generated SVG goes here --></svg>",
  "imageUrl": ""
}`;

export default function NewDeviceModal({ isOpen, onClose }: NewDeviceModalProps) {
  const [view, setView] = useState<'library' | 'custom'>('library');
  const [jsonContent, setJsonContent] = useState(DEFAULT_JSON);
  const [error, setError] = useState<string | null>(null);
  const [previewSvg, setPreviewSvg] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [parsedConfig, setParsedConfig] = useState<any>(null);
  const addNode = useOverviewStore((s) => s.addNode);
  const findNextFreeCell = useOverviewStore((s) => s.findNextFreeCell);

  // Parse config for model name
  useEffect(() => {
    try {
      setParsedConfig(JSON.parse(jsonContent));
    } catch {
      setParsedConfig(null);
    }
  }, [jsonContent]);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (view !== 'custom' || !isOpen) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item && item.type.indexOf('image') !== -1) {
          const blob = item.getAsFile();
          if (blob) {
            e.preventDefault();
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64String = reader.result as string;
              try {
                const currentParsed = JSON.parse(jsonContent);
                currentParsed.imageUrl = base64String;
                if (currentParsed.svgRender && typeof currentParsed.svgRender === 'string' && currentParsed.svgRender.includes('<!-- LLM generated SVG goes here -->')) {
                  currentParsed.svgRender = '';
                }
                setJsonContent(JSON.stringify(currentParsed, null, 2));
              } catch (err) {
                console.error("Could not parse JSON to inject image", err);
              }
            };
            reader.readAsDataURL(blob);
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [view, isOpen, jsonContent]);

  const handleSearchImages = () => {
    if (!parsedConfig?.brand && !parsedConfig?.model) return;
    const query = `${parsedConfig?.brand || ''} ${parsedConfig?.model || ''} top view`.trim();
    const googleUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}&tbs=ic:trans,isz:l`;
    window.open(googleUrl, '_blank', 'noopener,noreferrer');
  };

  useEffect(() => {
    if (view !== 'custom') return;
    const timer = setTimeout(() => {
      try {
        const parsed = JSON.parse(jsonContent);
        const isDefaultSvg = parsed.svgRender && typeof parsed.svgRender === 'string' && parsed.svgRender.includes('<!-- LLM generated SVG goes here -->');
        
        if (parsed.svgRender && typeof parsed.svgRender === 'string' && parsed.svgRender.trim() !== '' && !isDefaultSvg) {
          setPreviewSvg(parsed.svgRender);
          setPreviewImage(null);
        } else if (parsed.imageUrl && typeof parsed.imageUrl === 'string' && parsed.imageUrl.trim() !== '') {
          setPreviewImage(parsed.imageUrl);
          setPreviewSvg(null);
        } else {
          setPreviewSvg(null);
          setPreviewImage(null);
        }
        setError(null);
      } catch (e: any) {
        setError(e.message || "Invalid JSON format");
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [jsonContent, view]);

  const handleAddExisting = (deviceType: string) => {
    const id = `n_${deviceType}_${Math.random().toString(36).substring(2, 6)}`;
    const { gridX, gridY } = findNextFreeCell();
    addNode(id, {
      id,
      type: deviceType,
      gridX,
      gridY,
      zIndex: 100,
      isExpanded: true,
    });
    onClose();
  };

  const handleSubmit = () => {
    try {
      JSON.parse(jsonContent);
      setError(null);
      
      const fileName = `${parsedConfig?.model?.toLowerCase().replace(/\s+/g, '_') || 'new_device'}.json`;
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      onClose();
    } catch (e: any) {
      setError(e.message || "Invalid JSON format");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className={`bg-zinc-950 border border-zinc-800 text-white transition-all duration-300 ${view === 'custom' && showPreview ? 'sm:max-w-5xl' : 'sm:max-w-2xl'}`}>
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
                Once you define your device here, you can click "Download Device JSON" to save the file locally. After downloading, you can easily submit it by dragging the file into the <a href="https://github.com/alienmind/trackster/upload/main/src/devices" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline font-bold">GitHub Upload Page</a> to automatically open a Pull Request!
                <span className="block mt-2 text-indigo-300 text-xs">
                  <span className="font-bold text-indigo-400">Image Tip:</span> Use the "Search Images" button to find a transparent top-view. <strong>Open the full image in its original site</strong>, right-click, select <strong>Copy Image</strong>, and press <strong>Ctrl+V (or Cmd+V)</strong> anywhere in this window to instantly embed it!
                </span>
                <span className="block mt-2 text-cyan-300">
                  <span className="font-bold">JSON Tip:</span> Use an LLM to help you out here! Check out our <a href="https://github.com/alienmind/trackster/blob/main/doc/NEW_DEVICES.md" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline font-semibold">guide on adding new devices</a> for a prompt template that generates the JSON and the SVG render directly from a picture of your gear.
                </span>
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
                <a href="https://github.com/alienmind/trackster/issues" target="_blank" rel="noreferrer" className="text-xs text-neutral-500 hover:text-cyan-400 hover:underline transition-colors">Don't see your device?</a>
                <Button variant="outline" className="border-neutral-700 text-neutral-300 hover:text-white hover:bg-neutral-800" onClick={() => setView('custom')}>
                  <Icons.Plus size={16} className="mr-2" /> Create Custom Device
                </Button>
             </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 mt-4">
            <div className="flex justify-between items-center">
               <div className="text-sm text-zinc-400">Edit JSON configuration below:</div>
               <Button variant="outline" size="sm" className="border-neutral-700 text-neutral-300 hover:text-white hover:bg-neutral-800 h-8" onClick={() => setShowPreview(!showPreview)}>
                 {showPreview ? <Icons.EyeOff size={14} className="mr-2" /> : <Icons.Eye size={14} className="mr-2" />}
                 {showPreview ? "Hide Preview" : "Show Preview"}
               </Button>
               <Button variant="outline" size="sm" className="border-indigo-700 text-indigo-300 hover:text-white hover:bg-indigo-900/50 h-8 ml-2" onClick={handleSearchImages} disabled={!parsedConfig?.brand && !parsedConfig?.model}>
                 <Icons.Search size={14} className="mr-2" /> Search Images
               </Button>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4 h-[400px]">
              {/* Textarea */}
              <div className="flex-1 relative h-full">
                <textarea
                  className="w-full h-full bg-zinc-900 border border-zinc-700 text-zinc-300 p-4 rounded font-mono text-sm resize-none focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                  value={jsonContent}
                  onChange={(e) => setJsonContent(e.target.value)}
                  spellCheck={false}
                />
                {error && (
                  <div className="absolute bottom-4 left-4 text-red-400 text-xs font-bold bg-zinc-950 px-2 py-1 rounded border border-red-900/50 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap">
                    {error}
                  </div>
                )}
              </div>
              
              {/* Preview */}
              {showPreview && (
                <div className="flex-1 flex flex-col bg-zinc-900 border border-zinc-700 rounded items-center justify-center p-4 relative h-full overflow-hidden">
                  <span className="absolute top-2 left-2 text-xs font-bold text-zinc-500 uppercase">Live Preview</span>
                  {parsedConfig ? (
                    <div className={`hardware-node group relative bg-neutral-900 rounded-xl border-t-4 shadow-2xl flex flex-col w-[300px] transform scale-[0.85] origin-center ${parsedConfig.theme?.border || 'border-t-neutral-500'}`}>
                      {/* Header */}
                      <div className={`p-2 flex justify-between items-center rounded-t-lg ${parsedConfig.theme?.header || 'bg-neutral-900'}`}>
                        <div>
                          <h3 className={`font-black tracking-tight leading-none ${parsedConfig.theme?.title || 'text-white'}`}>{parsedConfig.model || 'Unknown Model'}</h3>
                          <span className="text-[10px] text-neutral-400">{parsedConfig.brand || 'Unknown Brand'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold tracking-widest whitespace-nowrap ${parsedConfig.theme?.badge || 'bg-neutral-800 text-neutral-400'}`}>{parsedConfig.tagline || 'NEW DEVICE'}</span>
                          <button className="text-neutral-400 hover:text-white transition-colors focus:outline-none ml-1">
                            <Icons.ChevronDown size={14}/>
                          </button>
                        </div>
                      </div>

                      {/* Graphic SVG Component */}
                      <div className="p-3 bg-neutral-800 flex justify-center items-center min-h-[120px]">
                        {previewSvg ? (
                          <div 
                            className="w-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:object-contain"
                            dangerouslySetInnerHTML={{ __html: previewSvg }} 
                          />
                        ) : previewImage ? (
                          <div className="w-full flex items-center justify-center p-2">
                            <img src={previewImage} alt="Device Preview" className="max-w-full max-h-[160px] object-contain" referrerPolicy="no-referrer" />
                          </div>
                        ) : (
                          <div className="text-zinc-600 text-sm text-center flex flex-col items-center gap-2 py-4">
                            <Icons.ImageOff size={24} className="opacity-50" />
                            <p>No valid visual</p>
                          </div>
                        )}
                      </div>

                      {/* Collapsible I/O Data */}
                      <div className="bg-neutral-950 flex flex-col rounded-b-xl">
                         <button className="w-full flex items-center justify-between p-2 px-3 text-[10px] text-neutral-400 hover:text-neutral-200 hover:bg-white/5 transition-colors border-t border-neutral-800 focus:outline-none">
                            <span className="font-bold uppercase tracking-wider">Routing & I/O Data</span>
                            <Icons.ChevronDown size={14}/>
                         </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-zinc-600 text-sm text-center flex flex-col items-center gap-2">
                      <Icons.AlertTriangle size={32} className="opacity-50" />
                      <p>Invalid JSON</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Actions */}
            <div className="flex justify-between items-center mt-2">
              <Button variant="ghost" className="text-neutral-400 hover:text-white hover:bg-neutral-900" onClick={() => setView('library')}>
                <Icons.ArrowLeft size={16} className="mr-2" /> Back to Library
              </Button>
              <Button variant="default" className="bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-2" onClick={handleSubmit} disabled={!!error}>
                <Icons.Download size={16} /> Download Device JSON
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
