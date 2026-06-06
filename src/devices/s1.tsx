import { HardwareBlueprint } from '../stores/useOverviewStore';
import React from 'react';

import data from '../../devices/s1/s1.json';

export const s1: HardwareBlueprint = {
  ...(data as unknown as HardwareBlueprint),
  layoutComponent: React.lazy(() => import('../components/devices/S1/RolandS1')),
};
