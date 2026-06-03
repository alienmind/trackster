import { HardwareBlueprint } from '../stores/useOverviewStore';

import data from '../../devices/s1/s1.json';

export const s1: HardwareBlueprint = {
  ...(data as unknown as HardwareBlueprint),
};
