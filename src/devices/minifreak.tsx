import { HardwareBlueprint } from '../stores/useOverviewStore';

import data from '../../devices/minifreak/minifreak.json';

export const minifreak: HardwareBlueprint = {
  ...(data as unknown as HardwareBlueprint),
};
