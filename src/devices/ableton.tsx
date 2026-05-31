import { HardwareBlueprint } from '../stores/useOverviewStore';
import { Laptop } from 'lucide-react';

export const ableton: HardwareBlueprint = {
  brand: "Ableton", model: "Live 12", tagline: "DAW / MASTERING", width: 200,
  theme: { border: "border-t-neutral-100", header: "bg-neutral-800", title: "text-white", badge: "bg-neutral-700 text-neutral-300" },
  ports: [
    { id: 'usbIn', title: 'USB In', color: '#a855f7', side: 'left', offset: 140 },
    { id: 'usbOut', title: 'USB Out', color: '#f472b6', side: 'right', offset: 140 }
  ],
  visual: () => (
    <div className="w-full flex flex-col items-center justify-center py-6 pointer-events-none bg-neutral-900 rounded shadow-inner border border-neutral-800 gap-3">
      <Laptop size={32} className="text-neutral-500" />
      <div className="flex gap-1.5 items-center">
          <div className="flex gap-1">
              {[...Array(4)].map((_,i) => <div key={`v-${i}`} className="w-1.5 h-9 bg-white rounded-sm"></div>)}
          </div>
          <div className="flex flex-col gap-1">
              {[...Array(4)].map((_,i) => <div key={`h-${i}`} className="w-6 h-1.5 bg-white rounded-sm"></div>)}
          </div>
      </div>
    </div>
  )
};
