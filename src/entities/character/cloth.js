import { raw } from './pose.js';

/**
 * VRoid often skins sleeves/shorts to Aim/Roll bones that do not inherit arm/leg
 * rotation. Pin them every frame after humanoid.update().
 */
export function findClothDrivers(vrm) {
  const drivers = [];
  const scene = vrm.scene;

  for (const side of ['L', 'R']) {
    {
      let aimTops = null;
      let aimShoulder = null;
      let rollUpper = null;
      const upperRaw = raw(vrm, side === 'L' ? 'leftUpperArm' : 'rightUpperArm');
      const secNodes = [];
      scene.traverse((o) => {
        if (!o.name) return;
        if (o.name === `J_Aim_${side}_TopsUpperArm`) aimTops = o;
        if (o.name === `J_Aim_${side}_Shoulder`) aimShoulder = o;
        if (o.name === `J_Roll_${side}_UpperArm`) rollUpper = o;
        if (o.name.startsWith(`J_Sec_${side}_TopsUpperArm`)) secNodes.push(o);
      });
      if (upperRaw) {
        drivers.push({
          kind: 'sleeve',
          source: upperRaw,
          aims: [aimTops, aimShoulder].filter(Boolean),
          roll: rollUpper,
          rollRest: rollUpper ? rollUpper.quaternion.clone() : null,
          secRest: secNodes.map((n) => ({ node: n, q: n.quaternion.clone() })),
          freezeSec: true,
        });
      }
    }
    {
      let aimLeg = null;
      let rollLeg = null;
      const upperLeg = raw(vrm, side === 'L' ? 'leftUpperLeg' : 'rightUpperLeg');
      const secNodes = [];
      scene.traverse((o) => {
        if (!o.name) return;
        if (o.name === `J_Aim_${side}_UpperLeg`) aimLeg = o;
        if (o.name === `J_Roll_${side}_UpperLeg`) rollLeg = o;
        if (o.name.startsWith(`J_Sec_${side}_TopsUpperLeg`)) secNodes.push(o);
      });
      if (upperLeg && aimLeg) {
        drivers.push({
          kind: 'shorts',
          source: upperLeg,
          aims: [aimLeg],
          roll: rollLeg,
          rollRest: rollLeg ? rollLeg.quaternion.clone() : null,
          secRest: secNodes.map((n) => ({ node: n, q: n.quaternion.clone() })),
          freezeSec: false,
        });
      }
    }
  }
  return drivers;
}

export function pinCloth(drivers) {
  if (!drivers) return;
  for (const d of drivers) {
    const q = d.source.quaternion;
    for (const aim of d.aims) aim.quaternion.copy(q);
    if (d.roll && d.rollRest) d.roll.quaternion.copy(d.rollRest);
    if (d.freezeSec) {
      for (const { node, q: rest } of d.secRest) node.quaternion.copy(rest);
    }
  }
}
