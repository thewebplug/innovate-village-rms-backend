import Trail from '../models/trailModel.js';

const TrailManager = async (actor, action, type) => {
  await new Trail({
    actor,
    action,
    type,
  }).save()
}

export default TrailManager;
