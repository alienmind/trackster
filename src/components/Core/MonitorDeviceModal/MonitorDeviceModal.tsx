import { useState, useEffect } from 'react';
import { useUIStore } from '../../../stores/useUIStore';
import { useAudioStore } from '../../../stores/useAudioStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../Core/ui/dialog';
import { Button } from '../../Core/ui/button';
import { ScrollArea } from '../../Core/ui/scroll-area';
import { Mic, Activity, Loader2 } from 'lucide-react';

export default function MonitorDeviceModal() {
  const isMonitorModalOpen = useUIStore((s) => s.isMonitorModalOpen);
  const setMonitorModalOpen = useUIStore((s) => s.setMonitorModalOpen);
  const startMonitoring = useAudioStore((s) => s.startMonitoring);

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isMonitorModalOpen) {
      setDevices([]);
      setSelectedDeviceId(null);
      setError(null);
      return;
    }

    let isMounted = true;
    setLoading(true);

    const initDevices = async () => {
      try {
        // Request generic audio permission to unmask device labels
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Immediately stop tracks to release hardware
        stream.getTracks().forEach(t => t.stop());

        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = allDevices.filter(d => d.kind === 'audioinput');
        
        if (isMounted) {
          setDevices(audioInputs);
          if (audioInputs.length > 0) {
            setSelectedDeviceId(audioInputs[0]!.deviceId);
          }
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError("Microphone permissions denied or not available. Please allow access to view audio inputs.");
          setLoading(false);
        }
      }
    };

    initDevices();

    return () => { isMounted = false; };
  }, [isMonitorModalOpen]);

  const handleStart = async () => {
    if (!selectedDeviceId) return;
    await startMonitoring(selectedDeviceId);
    setMonitorModalOpen(false);
  };

  return (
    <Dialog open={isMonitorModalOpen} onOpenChange={setMonitorModalOpen}>
      <DialogContent className="sm:max-w-2xl w-[90vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic className="w-5 h-5 text-primary" />
            Live Monitoring
          </DialogTitle>
          <DialogDescription>
            Select an audio input to live-monitor via the Oscilloscope.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-8 text-muted-foreground gap-4">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-sm">Requesting device access...</p>
            </div>
          ) : error ? (
            <div className="bg-destructive/10 text-destructive text-sm p-4 rounded-md">
              {error}
            </div>
          ) : devices.length === 0 ? (
            <div className="text-center p-4 text-muted-foreground text-sm">
              No audio input devices found.
            </div>
          ) : (
            <ScrollArea className="max-h-[60vh]">
              <div className={`grid gap-2 p-1 ${devices.length > 5 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                {devices.map((device) => (
                  <button
                    key={device.deviceId}
                    onClick={() => setSelectedDeviceId(device.deviceId)}
                    className={`flex items-start gap-3 p-3 text-left border rounded-md transition-all ${
                      selectedDeviceId === device.deviceId
                        ? 'border-primary bg-primary/10 text-primary font-medium shadow-sm'
                        : 'border-border hover:bg-muted/50 text-foreground hover:border-primary/50'
                    }`}
                  >
                    <Activity className={`w-4 h-4 mt-0.5 shrink-0 ${selectedDeviceId === device.deviceId ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div className="flex-1 text-sm break-all leading-tight">
                      {device.label || `Audio Input (${device.deviceId.slice(0, 5)}...)`}
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setMonitorModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleStart} disabled={loading || !!error || !selectedDeviceId}>
            Start Monitoring
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
