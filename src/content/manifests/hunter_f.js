/** Runtime manifest for actors.hunter_f — mirrors public/content/.../manifest.json */
export default {
  id: 'actors.hunter_f',
  kind: 'actor',
  displayName: '猎人·女',
  version: 1,
  source: {
    model: 'character.vrm',
    format: 'vrm',
  },
  scale: { targetHeight: 1.05 },
  locomotion: {
    walk: 'walking.fbx',
    stripRootPosition: true,
    armSwingMix: 0.42,
  },
  idle: {
    style: 'hands_down',
    preset: 'soft_hang',
  },
  springs: {
    profile: 'drape_idle',
    center: 'hips',
    hairColliders: 'torso_only',
    cloth: {
      sleeves: 'pin_to_upper_arm',
      shorts: 'pin_aim_to_upper_leg',
    },
  },
  tags: ['player', 'p0', 'mushoku'],
};
