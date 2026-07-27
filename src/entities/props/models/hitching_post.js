import * as THREE from 'three';
import {
  PROP_PALETTE,
  addSocket,
  bolt,
  chamferedBox,
  finishHeroProp,
  makePropRoot,
  rectangularMemberBetween,
  registerNode,
  surfaceMaterial,
  torus,
  transformMaterialMaps,
  tubeFromPoints,
} from './shared.js';

const VERSION = 'img2threejs-hitching-post-v1-pbr';

function addFoundation(parent, materials, x, side) {
  const stone = chamferedBox(0.4, 0.24, 0.42, materials.stone[side > 0 ? 1 : 0], 0.06);
  stone.name = `hitch.foundation.${side < 0 ? 'left' : 'right'}`;
  stone.position.set(x, 0.12, 0);
  stone.rotation.y = side * 0.026;
  parent.add(stone);
}

function addPost(parent, materials, x, side) {
  const post = chamferedBox(0.23, 1.16, 0.23, materials.oak[side > 0 ? 1 : 0], 0.04);
  post.name = `hitch.post.${side < 0 ? 'left' : 'right'}`;
  post.position.set(x, 0.81, 0);
  post.rotation.z = side * 0.006;
  parent.add(post);

  const capNeck = chamferedBox(0.27, 0.12, 0.27, materials.oakCross[side > 0 ? 2 : 3], 0.045);
  capNeck.name = 'hitch.post.cap-neck';
  capNeck.position.set(x, 1.43, 0);
  parent.add(capNeck);
  const cap = chamferedBox(0.23, 0.11, 0.23, materials.oakCross[side > 0 ? 3 : 2], 0.065);
  cap.name = 'hitch.post.cap';
  cap.position.set(x, 1.545, 0);
  cap.scale.set(0.82, 1, 0.82);
  parent.add(cap);
}

function addMountAndRing(parent, materials, x, y, index) {
  const plate = chamferedBox(0.15, 0.2, 0.038, materials.iron, 0.022);
  plate.name = `hitch.ring.${index}.plate`;
  plate.position.set(x, y, 0.14);
  parent.add(plate);

  const stud = bolt(0.034, 0.065, materials.ironEdge);
  stud.name = `hitch.ring.${index}.stud`;
  stud.rotation.x = Math.PI * 0.5;
  stud.position.set(x, y, 0.18);
  parent.add(stud);

  const link = torus(0.105, 0.022, materials.ironEdge, 8, 28);
  link.name = `hitch.ring.${index}`;
  link.scale.set(1, 1.16, 1);
  link.position.set(x, y - 0.125, 0.2);
  parent.add(link);
}

function addRopeCoil(parent, materials) {
  const anchor = new THREE.Vector3(0.62, 1.2, 0.23);
  const lead = tubeFromPoints([
    anchor,
    new THREE.Vector3(0.67, 1.08, 0.25),
    new THREE.Vector3(0.7, 0.94, 0.255),
    new THREE.Vector3(0.68, 0.82, 0.25),
  ], 0.019, materials.rope, { tubularSegments: 20, radialSegments: 7 });
  lead.name = 'hitch.rope.lead';
  parent.add(lead);

  for (let index = 0; index < 3; index += 1) {
    const xOffset = (index - 1) * 0.026;
    const loop = tubeFromPoints([
      new THREE.Vector3(0.68 + xOffset, 0.92, 0.25 + index * 0.008),
      new THREE.Vector3(0.78 + xOffset, 0.74, 0.255 + index * 0.008),
      new THREE.Vector3(0.7 + xOffset, 0.53, 0.25 + index * 0.008),
      new THREE.Vector3(0.58 + xOffset, 0.72, 0.245 + index * 0.008),
    ], 0.018, materials.ropeVariants[index], {
      tubularSegments: 26,
      radialSegments: 7,
      closed: true,
    });
    loop.name = `hitch.rope.coil.${index}`;
    parent.add(loop);
  }

  const knot = new THREE.Mesh(new THREE.IcosahedronGeometry(0.045, 1), materials.rope);
  knot.name = 'hitch.rope.knot';
  knot.scale.set(1.15, 0.75, 0.85);
  knot.position.set(0.68, 0.93, 0.26);
  parent.add(knot);
}

export function createHitchingPostModel() {
  const root = makePropRoot('prop.hitching-post', VERSION);
  const oak = PROP_PALETTE.oak.map((color, index) => transformMaterialMaps(
    surfaceMaterial('wood', color, { name: `hitch-oak-${index}` }),
    {
      offset: [index * 0.157, index * 0.091],
      repeatScale: [0.74 + index * 0.055, 0.9 + (index % 2) * 0.09],
    },
  ));
  const rope = surfaceMaterial('rope', PROP_PALETTE.rope, { name: 'hitch-hemp-rope' });
  const materials = {
    oak,
    oakCross: oak.map((material) => transformMaterialMaps(material, {
      rotation: Math.PI * 0.5,
      offset: [0.1, 0.03],
    })),
    stone: PROP_PALETTE.limestone.slice(0, 2).map((color, index) => transformMaterialMaps(
      surfaceMaterial('stone', color, { name: `hitch-stone-${index}` }),
      { offset: [index * 0.23, index * 0.17], repeatScale: [0.8, 0.8] },
    )),
    iron: surfaceMaterial('forged-iron', 0x292725, { name: 'hitch-forged-iron' }),
    ironEdge: surfaceMaterial('worn-iron', 0x5b554e, { name: 'hitch-worn-ring' }),
    rope,
    ropeVariants: [0, 1, 2].map((index) => transformMaterialMaps(rope, {
      offset: [index * 0.21, index * 0.11],
      repeatScale: [0.92 + index * 0.05, 1],
    })),
  };

  const foundations = registerNode(root, 'hitch.foundations', new THREE.Group(), {
    collider: {
      type: 'compound-boxes',
      boxes: [
        { size: [0.42, 0.24, 0.44], offset: [-0.84, 0.12, 0] },
        { size: [0.42, 0.24, 0.44], offset: [0.84, 0.12, 0] },
      ],
    },
    destructionGroup: 'foundations',
  });
  root.add(foundations);
  addFoundation(foundations, materials, -0.84, -1);
  addFoundation(foundations, materials, 0.84, 1);

  const frame = registerNode(root, 'hitch.timber-frame', new THREE.Group(), {
    collider: { type: 'box', size: [1.92, 1.32, 0.28], offset: [0, 0.9, 0] },
    destructionGroup: 'frame',
  });
  root.add(frame);
  addPost(frame, materials, -0.84, -1);
  addPost(frame, materials, 0.84, 1);

  const upperRail = chamferedBox(1.7, 0.25, 0.18, materials.oakCross[2], 0.045);
  upperRail.name = 'hitch.upper-rail';
  upperRail.position.set(0, 1.25, 0);
  frame.add(upperRail);
  const lowerRail = chamferedBox(1.68, 0.12, 0.13, materials.oakCross[3], 0.03);
  lowerRail.name = 'hitch.lower-stretcher';
  lowerRail.position.set(0, 0.46, 0);
  frame.add(lowerRail);

  for (const side of [-1, 1]) {
    const brace = rectangularMemberBetween(
      new THREE.Vector3(side * 0.74, 0.66, 0.01),
      new THREE.Vector3(side * 0.48, 1.12, 0.01),
      0.13,
      0.13,
      materials.oak[side > 0 ? 3 : 1],
      0.028,
    );
    brace.name = `hitch.brace.${side < 0 ? 'left' : 'right'}`;
    frame.add(brace);
  }

  const ironwork = registerNode(root, 'hitch.ironwork', new THREE.Group(), {
    destructionGroup: 'ironwork',
  });
  root.add(ironwork);
  [-0.58, -0.2, 0.2, 0.58].forEach((x, index) => {
    addMountAndRing(ironwork, materials, x, 1.24, index);
    addSocket(root, ironwork, `socket.hitch-ring-${index}`, new THREE.Vector3(x, 1.11, 0.22));
  });
  for (const x of [-0.84, 0.84]) {
    const basePlate = chamferedBox(0.27, 0.17, 0.255, materials.iron, 0.025);
    basePlate.name = 'hitch.post.foot-collar';
    basePlate.position.set(x, 0.31, 0);
    ironwork.add(basePlate);
  }

  const ropeGroup = registerNode(root, 'hitch.rope', new THREE.Group(), {
    destructionGroup: 'rope',
  });
  root.add(ropeGroup);
  addRopeCoil(ropeGroup, materials);
  addSocket(root, ropeGroup, 'socket.hitch-rope-end', new THREE.Vector3(0.68, 0.53, 0.25));

  root.userData.materialFamilies = ['aged-oak', 'limestone', 'forged-iron', 'hemp-rope'];
  root.userData.referenceViews = {
    main: 'docs/references/props/hitching_post/ref_main.png',
  };
  root.userData.qualityTier = 'supporting-prop';
  return finishHeroProp(root);
}

export default createHitchingPostModel;
