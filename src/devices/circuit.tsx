import { HardwareBlueprint } from '../stores/useOverviewStore';
import React from 'react';

import data from '../../devices/circuittracks/circuit.json';

export const circuit: HardwareBlueprint = {
  ...(data as unknown as HardwareBlueprint),
  assetFolder: 'circuittracks',
  layoutComponent: React.lazy(() => import('../components/devices/Circuit/CircuitTracksLayout')),
};
