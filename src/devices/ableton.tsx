import { HardwareBlueprint } from '../stores/useOverviewStore';
import { Laptop } from 'lucide-react';

import data from '../../devices/ableton.json';

export const ableton: HardwareBlueprint = {
  ...(data as unknown as HardwareBlueprint),
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
