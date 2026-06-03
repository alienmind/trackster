import { HardwareBlueprint } from '../stores/useOverviewStore';


import data from '../../devices/grind/grind.json';

export const grind: HardwareBlueprint = {
  ...(data as unknown as HardwareBlueprint),
};
