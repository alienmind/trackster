import { HardwareBlueprint } from '../stores/useOverviewStore';
import React from 'react';

import data from '../../devices/minifreak/minifreak.json';

export const minifreak: HardwareBlueprint = {
  ...(data as unknown as HardwareBlueprint),
  layoutComponent: React.lazy(() => import('../components/devices/MiniFreak/ArturiaMiniFreak')),
};
