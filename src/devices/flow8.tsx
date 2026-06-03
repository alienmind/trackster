import { HardwareBlueprint } from '../stores/useOverviewStore';

import data from '../../devices/flow8/flow8.json';

export const flow8: HardwareBlueprint = {
  ...(data as unknown as HardwareBlueprint),
};
