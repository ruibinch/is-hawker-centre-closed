import { getStage, Stage } from '../utils/stage';

type Features = Record<string, Record<Stage, boolean>>;

const _features: Features = {
  ENABLE_WEBAPP: {
    dev: true,
    prod: false,
  },
};

export default function features(key: keyof Features) {
  const stage = getStage();
  return Boolean(_features[key]?.[stage]);
}
