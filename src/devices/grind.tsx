import { HardwareBlueprint } from '../stores/useOverviewStore';
import React from 'react';

import data from '../../devices/grind/grind.json';

export const grind: HardwareBlueprint = {
  ...(data as unknown as HardwareBlueprint),
  layoutComponent: React.lazy(() => import('../components/devices/Grind/BehringerGrind')),
};
