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
  taperedBoxGeometry,
  torus,
  transformMaterialMaps,
  tubeFromPoints,
} from './shared.js';

const VERSION = 'img2threejs-village-dyeing-station-v1-pbr';

function createThickDrapeGeometry({
  width = 0.8,
  height = 1.25,
  foldAmplitude = 0.08,
  foldCount = 5,
  phase = 0,
  thickness = 0.025,
  segmentsX = 18,
  segmentsY = 20,
} = {}) {
  const positions = [];
  const uvs = [];
  const indices = [];
  const row = segmentsX + 1;
  const layerSize = row * (segmentsY + 1);

  for (const side of [-1, 1]) {
    for (let iy = 0; iy <= segmentsY; iy += 1) {
      const v = iy / segmentsY;
      for (let ix = 0; ix <= segmentsX; ix += 1) {
        const u = ix / segmentsX;
        const edgeTaper = Math.sin(u * Math.PI);
        const folds = Math.sin((u * foldCount + phase) * Math.PI * 2)
          * foldAmplitude
          * (0.44 + v * 0.56)
          * (0.35 + edgeTaper * 0.65);
        const broadSag = Math.sin(u * Math.PI) * height * 0.075;
        const hemIrregularity = Math.pow(v, 7) * (
          Math.sin(u * Math.PI * 5 + phase * 4) * 0.025
          + Math.sin(u * Math.PI * 9 + 0.7) * 0.012
        );
        positions.push(
          (u - 0.5) * width,
          -v * height - broadSag + hemIrregularity,
          folds + side * thickness * 0.5,
        );
        uvs.push(u, 1 - v);
      }
    }
  }

  for (let sideIndex = 0; sideIndex < 2; sideIndex += 1) {
    const offset = sideIndex * layerSize;
    for (let iy = 0; iy < segmentsY; iy += 1) {
      for (let ix = 0; ix < segmentsX; ix += 1) {
        const a = offset + iy * row + ix;
        const b = a + 1;
        const c = a + row;
        const d = c + 1;
        if (sideIndex === 0) indices.push(a, c, b, b, c, d);
        else indices.push(a, b, c, b, d, c);
      }
    }
  }

  for (const ix of [0, segmentsX]) {
    for (let iy = 0; iy < segmentsY; iy += 1) {
      const a = iy * row + ix;
      const b = (iy + 1) * row + ix;
      const c = a + layerSize;
      const d = b + layerSize;
      indices.push(a, c, b, b, c, d);
    }
  }
  for (const iy of [0, segmentsY]) {
    for (let ix = 0; ix < segmentsX; ix += 1) {
      const a = iy * row + ix;
      const b = a + 1;
      const c = a + layerSize;
      const d = b + layerSize;
      if (iy === 0) indices.push(a, b, c, b, d, c);
      else indices.push(a, c, b, b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createLathe(profile, material, segments = 24) {
  return new THREE.Mesh(
    new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), segments),
    material,
  );
}

function addRack(parent, materials) {
  for (const [index, x] of [[0, -1.58], [1, 1.58]]) {
    const post = rectangularMemberBetween(
      new THREE.Vector3(x - Math.sign(x) * 0.13, 0.05, -0.28),
      new THREE.Vector3(x, 2.82, -0.18),
      0.22,
      0.2,
      materials.oak[index],
      0.045,
    );
    post.name = 'dye.rack.heavy-post';
    parent.add(post);
    const foot = chamferedBox(0.68, 0.17, 0.54, materials.oak[(index + 2) % 4], 0.045);
    foot.name = 'dye.rack.base-shoe';
    foot.position.set(x - Math.sign(x) * 0.08, 0.085, -0.18);
    parent.add(foot);
    const rearFoot = chamferedBox(0.24, 0.17, 0.9, materials.oak[(index + 1) % 4], 0.04);
    rearFoot.name = 'dye.rack.cross-foot';
    rearFoot.position.set(x, 0.085, -0.18);
    parent.add(rearFoot);

    const brace = rectangularMemberBetween(
      new THREE.Vector3(x - Math.sign(x) * 0.04, 1.9, -0.18),
      new THREE.Vector3(x - Math.sign(x) * 0.52, 2.58, -0.18),
      0.11,
      0.1,
      materials.oakCross[index + 1],
      0.025,
    );
    brace.name = 'dye.rack.knee-brace';
    parent.add(brace);

    for (const y of [0.68, 1.72, 2.55]) {
      const peg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.045, 0.055, 0.42, 10),
        materials.oakCross[(index + 2) % 4],
      );
      peg.name = 'dye.rack.projecting-peg';
      peg.rotation.x = Math.PI * 0.5;
      peg.position.set(x, y, 0.02);
      parent.add(peg);
    }
    for (const y of [1.02, 2.36]) {
      for (let coil = 0; coil < 3; coil += 1) {
        const lashing = torus(0.145 + coil * 0.008, 0.017, materials.rope, 6, 28);
        lashing.name = 'dye.rack.post-lashing';
        lashing.rotation.x = Math.PI * 0.5;
        lashing.position.set(x, y + (coil - 1) * 0.035, -0.18);
        parent.add(lashing);
      }
    }
  }

  for (const [y, z, materialIndex] of [
    [2.72, -0.18, 1],
    [2.58, -0.23, 2],
  ]) {
    const beam = chamferedBox(3.62, 0.2, 0.18, materials.oakCross[materialIndex], 0.045);
    beam.name = 'dye.rack.top-beam';
    beam.position.set(0, y, z);
    parent.add(beam);
  }
  for (const x of [-1.37, 1.37]) {
    const cap = chamferedBox(0.34, 0.35, 0.31, materials.oak[x > 0 ? 0 : 3], 0.055);
    cap.name = 'dye.rack.post-cap';
    cap.position.set(x, 2.85, -0.18);
    parent.add(cap);
  }
}

function addCloths(parent, materials) {
  const cloths = [
    {
      id: 'indigo',
      x: -0.93,
      width: 0.88,
      height: 1.45,
      phase: 0.15,
      foldCount: 5,
      amp: 0.085,
      material: materials.clothIndigo,
    },
    {
      id: 'madder',
      x: 0,
      width: 0.79,
      height: 1.55,
      phase: 0.42,
      foldCount: 4,
      amp: 0.095,
      material: materials.clothMadder,
    },
    {
      id: 'saffron',
      x: 0.86,
      width: 0.76,
      height: 1.38,
      phase: 0.72,
      foldCount: 5,
      amp: 0.075,
      material: materials.clothSaffron,
    },
  ];
  cloths.forEach((config, clothIndex) => {
    const cloth = new THREE.Mesh(
      createThickDrapeGeometry({
        width: config.width,
        height: config.height,
        foldAmplitude: config.amp,
        foldCount: config.foldCount,
        phase: config.phase,
        thickness: 0.035,
      }),
      config.material,
    );
    cloth.name = `dye.textile.${config.id}-drape`;
    cloth.position.set(config.x, 2.66, 0.05 + clothIndex * 0.014);
    parent.add(cloth);

    const hem = tubeFromPoints(
      Array.from({ length: 22 }, (_, index) => {
        const u = index / 21;
        return new THREE.Vector3(
          config.x + (u - 0.5) * config.width,
          2.66 - config.height - Math.sin(u * Math.PI) * config.height * 0.075
            + Math.sin(u * Math.PI * 5 + config.phase * 4) * 0.024,
          0.08 + Math.sin((u * config.foldCount + config.phase) * Math.PI * 2) * config.amp,
        );
      }),
      0.012,
      materials.thread[clothIndex],
      { tubularSegments: 34, radialSegments: 5 },
    );
    hem.name = `dye.textile.${config.id}-hem`;
    parent.add(hem);
    for (let index = 0; index < 7; index += 1) {
      const fringe = tubeFromPoints([
        new THREE.Vector3(
          config.x - config.width * 0.45 + index * config.width * 0.15,
          2.66 - config.height - 0.01 - (index % 2) * 0.015,
          0.08,
        ),
        new THREE.Vector3(
          config.x - config.width * 0.45 + index * config.width * 0.15 + (index % 2 ? 0.008 : -0.006),
          2.66 - config.height - 0.06 - (index % 3) * 0.012,
          0.08,
        ),
      ], 0.006, materials.thread[clothIndex], {
        tubularSegments: 3,
        radialSegments: 4,
      });
      fringe.name = `dye.textile.${config.id}-fringe`;
      parent.add(fringe);
    }
  });
}

function addVat(parent, materials, {
  id,
  x,
  z,
  radius,
  height,
  liquid,
  woodOffset = 0,
}) {
  const vat = new THREE.Group();
  vat.name = `dye.vat.${id}`;
  vat.position.set(x, 0, z);
  parent.add(vat);
  const staveCount = 20;
  for (let index = 0; index < staveCount; index += 1) {
    const angle = (index / staveCount) * Math.PI * 2;
    const stave = new THREE.Mesh(
      taperedBoxGeometry(
        radius * 0.39,
        0.12,
        radius * 0.35,
        0.108,
        height,
      ),
      materials.oak[(index + woodOffset) % materials.oak.length],
    );
    stave.name = `dye.vat.${id}.stave`;
    stave.position.set(
      Math.cos(angle) * radius,
      0.19 + height * 0.5,
      Math.sin(angle) * radius,
    );
    stave.rotation.y = -angle + Math.PI * 0.5;
    vat.add(stave);
  }
  for (const y of [0.29, 0.68, height + 0.12]) {
    const hoop = torus(radius + 0.025, 0.036, materials.iron, 7, 52);
    hoop.name = `dye.vat.${id}.iron-hoop`;
    hoop.rotation.x = Math.PI * 0.5;
    hoop.position.y = y;
    vat.add(hoop);
    for (const angle of [0.18, Math.PI + 0.18]) {
      const rivet = bolt(0.022, 0.04, materials.ironEdge);
      rivet.name = `dye.vat.${id}.hoop-rivet`;
      rivet.rotation.x = Math.PI * 0.5;
      rivet.position.set(
        Math.cos(angle) * (radius + 0.055),
        y,
        Math.sin(angle) * (radius + 0.055),
      );
      vat.add(rivet);
    }
  }
  const rim = torus(radius, 0.065, materials.oakCross[(woodOffset + 1) % 4], 9, 56);
  rim.name = `dye.vat.${id}.projected-rim`;
  rim.rotation.x = Math.PI * 0.5;
  rim.position.y = height + 0.19;
  vat.add(rim);
  const liquidPlane = new THREE.Mesh(
    new THREE.CircleGeometry(radius * 0.91, 52),
    liquid,
  );
  liquidPlane.name = `dye.vat.${id}.liquid`;
  liquidPlane.rotation.x = -Math.PI * 0.5;
  liquidPlane.position.y = height + 0.175;
  vat.add(liquidPlane);
  for (const side of [-1, 1]) {
    const handle = torus(0.15, 0.025, materials.ironEdge, 6, 32, Math.PI);
    handle.name = `dye.vat.${id}.side-handle`;
    handle.rotation.y = Math.PI * 0.5;
    handle.rotation.z = side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
    handle.position.set(side * (radius + 0.08), height * 0.7, 0);
    vat.add(handle);
  }
  for (const angle of [0.2, 1.75, 3.3, 4.85]) {
    const foot = chamferedBox(0.17, 0.25, 0.18, materials.iron, 0.03);
    foot.name = `dye.vat.${id}.iron-foot`;
    foot.position.set(
      Math.cos(angle) * radius * 0.72,
      0.13,
      Math.sin(angle) * radius * 0.72,
    );
    foot.rotation.y = -angle;
    vat.add(foot);
  }
  return vat;
}

function addFireRing(parent, materials, centerX, centerZ) {
  for (let index = 0; index < 16; index += 1) {
    const angle = (index / 16) * Math.PI * 2;
    const stone = chamferedBox(
      0.25 + (index % 3) * 0.025,
      0.18 + (index % 2) * 0.025,
      0.22,
      materials.stone[index % materials.stone.length],
      0.07,
    );
    stone.name = 'dye.fire.ring-stone';
    stone.position.set(
      centerX + Math.cos(angle) * 0.64,
      0.09,
      centerZ + Math.sin(angle) * 0.64,
    );
    stone.rotation.y = -angle + (index % 2 ? 0.06 : -0.04);
    parent.add(stone);
  }
  const ash = new THREE.Mesh(
    new THREE.CircleGeometry(0.52, 40),
    materials.ash,
  );
  ash.name = 'dye.fire.ash-bed';
  ash.rotation.x = -Math.PI * 0.5;
  ash.position.set(centerX, 0.012, centerZ);
  parent.add(ash);
  for (let index = 0; index < 11; index += 1) {
    const coal = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.045 + (index % 3) * 0.012, 0),
      index % 4 === 0 ? materials.ember : materials.charcoal,
    );
    coal.name = 'dye.fire.coal';
    coal.position.set(
      centerX - 0.25 + (index % 5) * 0.12,
      0.045,
      centerZ - 0.16 + Math.floor(index / 5) * 0.13,
    );
    parent.add(coal);
  }
}

function addWringer(parent, materials) {
  for (const x of [0.52, 1.48]) {
    const post = chamferedBox(0.17, 1.24, 0.17, materials.oak[x < 1 ? 0 : 3], 0.035);
    post.name = 'dye.wringer.support-post';
    post.position.set(x, 1.08, 0.7);
    parent.add(post);
    const foot = chamferedBox(0.42, 0.14, 0.38, materials.oakCross[x < 1 ? 1 : 2], 0.035);
    foot.name = 'dye.wringer.foot';
    foot.position.set(x, 0.53, 0.7);
    parent.add(foot);
  }
  for (const [y, radius, mat] of [
    [1.55, 0.105, materials.oak[1]],
    [1.76, 0.09, materials.oak[2]],
  ]) {
    const roller = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, 1.18, 18),
      mat,
    );
    roller.name = 'dye.wringer.roller';
    roller.rotation.z = Math.PI * 0.5;
    roller.position.set(1.0, y, 0.7);
    parent.add(roller);
    for (const x of [0.42, 1.58]) {
      const collar = torus(radius + 0.015, 0.018, materials.iron, 6, 28);
      collar.name = 'dye.wringer.roller-collar';
      collar.rotation.y = Math.PI * 0.5;
      collar.position.set(x, y, 0.7);
      parent.add(collar);
    }
  }
  const crank = tubeFromPoints([
    new THREE.Vector3(1.58, 1.76, 0.7),
    new THREE.Vector3(1.82, 1.76, 0.7),
    new THREE.Vector3(1.82, 1.57, 0.78),
  ], 0.025, materials.ironEdge, {
    tubularSegments: 18,
    radialSegments: 7,
  });
  crank.name = 'dye.wringer.crank';
  parent.add(crank);
  const grip = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.055, 0.24, 10),
    materials.oak[0],
  );
  grip.name = 'dye.wringer.crank-grip';
  grip.rotation.x = Math.PI * 0.5;
  grip.position.set(1.82, 1.57, 0.89);
  parent.add(grip);

  const wetCloth = new THREE.Mesh(
    createThickDrapeGeometry({
      width: 0.68,
      height: 0.82,
      foldAmplitude: 0.055,
      foldCount: 6,
      phase: 0.33,
      thickness: 0.04,
      segmentsX: 16,
      segmentsY: 18,
    }),
    materials.wetMadder,
  );
  wetCloth.name = 'dye.wringer.wet-madder-cloth';
  wetCloth.position.set(1.0, 1.76, 0.81);
  parent.add(wetCloth);
  for (let index = 0; index < 8; index += 1) {
    const drop = new THREE.Mesh(
      new THREE.SphereGeometry(0.018 + (index % 3) * 0.006, 7, 5),
      materials.madderLiquid,
    );
    drop.name = 'dye.wringer.dye-drop';
    drop.scale.y = 1.7;
    drop.position.set(
      0.72 + index * 0.08,
      1.0 - (index % 3) * 0.12,
      0.83,
    );
    parent.add(drop);
  }
}

function addPaddle(parent, materials) {
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.028, 0.035, 1.55, 10),
    materials.oak[2],
  );
  shaft.name = 'dye.tools.stirring-paddle-shaft';
  shaft.position.set(-1.13, 1.38, 0.55);
  shaft.rotation.z = -0.31;
  parent.add(shaft);
  const blade = chamferedBox(0.22, 0.46, 0.055, materials.oakCross[1], 0.035);
  blade.name = 'dye.tools.stirring-paddle-blade';
  blade.position.set(-0.88, 0.68, 0.55);
  blade.rotation.z = -0.31;
  parent.add(blade);
}

function addBasket(parent, materials) {
  const x = 1.72;
  const z = 0.82;
  for (let ringIndex = 0; ringIndex < 9; ringIndex += 1) {
    const y = 0.15 + ringIndex * 0.075;
    const radius = 0.31 + ringIndex * 0.012;
    const ring = torus(radius, 0.014, materials.wicker[ringIndex % 3], 5, 40);
    ring.name = 'dye.tools.linen-basket.horizontal-weave';
    ring.rotation.x = Math.PI * 0.5;
    ring.position.set(x, y, z);
    parent.add(ring);
  }
  for (let index = 0; index < 16; index += 1) {
    const angle = (index / 16) * Math.PI * 2;
    const rib = rectangularMemberBetween(
      new THREE.Vector3(
        x + Math.cos(angle) * 0.3,
        0.11,
        z + Math.sin(angle) * 0.3,
      ),
      new THREE.Vector3(
        x + Math.cos(angle) * 0.4,
        0.79,
        z + Math.sin(angle) * 0.4,
      ),
      0.026,
      0.018,
      materials.wicker[index % 3],
      0.006,
    );
    rib.name = 'dye.tools.linen-basket.vertical-rib';
    parent.add(rib);
  }
  for (const [index, dx, dy, dz, sx, sy, sz] of [
    [0, -0.09, 0.72, 0.02, 0.32, 0.13, 0.22],
    [1, 0.12, 0.68, -0.04, 0.25, 0.12, 0.3],
    [2, 0.02, 0.79, 0.08, 0.3, 0.11, 0.22],
  ]) {
    const cloth = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 14, 8),
      materials.linen[index % materials.linen.length],
    );
    cloth.name = 'dye.tools.folded-undyed-linen';
    cloth.scale.set(sx / 0.3, sy / 0.3, sz / 0.3);
    cloth.position.set(x + dx, dy, z + dz);
    cloth.rotation.y = index * 0.7;
    parent.add(cloth);
  }
}

function addPigments(parent, materials) {
  const jars = [
    [-0.02, 0.42, 0.98, 0.16, 0.32, 0],
    [0.28, 0.25, 1.03, 0.12, 0.25, 1],
    [0.51, 0.2, 1.06, 0.1, 0.2, 2],
  ];
  jars.forEach(([x, y, z, r, h, index]) => {
    const jar = createLathe([
      [r * 0.65, 0],
      [r, h * 0.18],
      [r * 0.92, h * 0.72],
      [r * 0.55, h * 0.88],
      [r * 0.62, h],
    ], materials.pigmentJar[index], 24);
    jar.name = 'dye.tools.pigment-jar';
    jar.position.set(x, y, z);
    parent.add(jar);
    const rim = torus(r * 0.62, r * 0.08, materials.pigmentRim[index], 6, 28);
    rim.name = 'dye.tools.pigment-jar-rim';
    rim.rotation.x = Math.PI * 0.5;
    rim.position.set(x, y + h, z);
    parent.add(rim);
  });

  const ropePoints = [];
  for (let index = 0; index <= 90; index += 1) {
    const t = index / 90;
    const angle = t * Math.PI * 2 * 3.2;
    const radius = 0.3 - t * 0.07;
    ropePoints.push(new THREE.Vector3(
      0.77 + Math.cos(angle) * radius,
      0.045 + t * 0.012,
      1.08 + Math.sin(angle) * radius,
    ));
  }
  const ropeCoil = tubeFromPoints(ropePoints, 0.018, materials.rope, {
    tubularSegments: 90,
    radialSegments: 6,
  });
  ropeCoil.name = 'dye.tools.rope-coil';
  parent.add(ropeCoil);
}

export function createVillageDyeingStationModel() {
  const root = makePropRoot('prop.village-dyeing-station', VERSION);
  const oak = PROP_PALETTE.oak.map((color, index) => transformMaterialMaps(
    surfaceMaterial('wood', color, { name: `dye-aged-oak-${index}` }),
    { offset: [index * 0.17, index * 0.11], repeatScale: [0.78, 0.9] },
  ));
  const materials = {
    oak,
    oakCross: oak.map((material, index) => transformMaterialMaps(material, {
      rotation: Math.PI * 0.5,
      offset: [0.05 + index * 0.03, 0.1],
    })),
    iron: surfaceMaterial('forged-iron', 0x292927, { name: 'dye-blackened-iron' }),
    ironEdge: surfaceMaterial('worn-iron', 0x625e57, { name: 'dye-worn-iron' }),
    rope: surfaceMaterial('rope', 0x89683b, { name: 'dye-hemp-rope' }),
    clothIndigo: surfaceMaterial('burlap', 0x28354f, {
      name: 'dye-dry-indigo-wool',
      side: THREE.DoubleSide,
      roughness: 0.94,
    }),
    clothMadder: surfaceMaterial('burlap', 0x7d3d32, {
      name: 'dye-dry-madder-wool',
      side: THREE.DoubleSide,
      roughness: 0.94,
    }),
    clothSaffron: surfaceMaterial('burlap', 0xa06e28, {
      name: 'dye-dry-saffron-wool',
      side: THREE.DoubleSide,
      roughness: 0.93,
    }),
    thread: [
      surfaceMaterial('rope', 0x20283b, { name: 'dye-indigo-thread' }),
      surfaceMaterial('rope', 0x5e2c27, { name: 'dye-madder-thread' }),
      surfaceMaterial('rope', 0x7e521e, { name: 'dye-saffron-thread' }),
    ],
    wetMadder: surfaceMaterial('burlap', 0x6e241f, {
      name: 'dye-wet-madder-cloth',
      side: THREE.DoubleSide,
      roughness: 0.34,
      clearcoat: 0.28,
      clearcoatRoughness: 0.2,
    }),
    indigoLiquid: surfaceMaterial('generic', 0x101d3d, {
      name: 'dye-indigo-liquid',
      roughness: 0.12,
      clearcoat: 0.75,
      clearcoatRoughness: 0.05,
    }),
    madderLiquid: surfaceMaterial('generic', 0x5d1718, {
      name: 'dye-madder-liquid',
      roughness: 0.13,
      clearcoat: 0.72,
      clearcoatRoughness: 0.06,
    }),
    stone: [0x82796b, 0x675f55, 0x9a8e7d, 0x544f48].map((color, index) => transformMaterialMaps(
      surfaceMaterial('stone', color, { name: `dye-fire-stone-${index}` }),
      { offset: [index * 0.17, index * 0.12], repeatScale: [0.75, 0.75] },
    )),
    ash: surfaceMaterial('soil', 0x393735, { name: 'dye-charcoal-ash' }),
    charcoal: surfaceMaterial('stone', 0x191817, { name: 'dye-charcoal' }),
    ember: new THREE.MeshStandardMaterial({
      name: 'dye-live-ember',
      color: 0x8b3517,
      emissive: 0xff6a18,
      emissiveIntensity: 1.2,
      roughness: 0.72,
      metalness: 0,
    }),
    wicker: [
      surfaceMaterial('rope', 0x7f5a2f, { name: 'dye-dark-wicker' }),
      surfaceMaterial('rope', 0xa27b43, { name: 'dye-wicker' }),
      surfaceMaterial('rope', 0xb28a52, { name: 'dye-light-wicker' }),
    ],
    linen: [
      surfaceMaterial('burlap', 0xc4b59d, { name: 'dye-undyed-linen-1' }),
      surfaceMaterial('burlap', 0xaea088, { name: 'dye-undyed-linen-2' }),
      surfaceMaterial('burlap', 0xd0c3aa, { name: 'dye-undyed-linen-3' }),
    ],
    pigmentJar: [
      surfaceMaterial('clay', 0x76533d, { name: 'dye-large-earth-jar' }),
      surfaceMaterial('clay', 0x4e5366, { name: 'dye-indigo-pigment-jar' }),
      surfaceMaterial('clay', 0x8b4738, { name: 'dye-madder-pigment-jar' }),
    ],
    pigmentRim: [
      surfaceMaterial('clay', 0x9a7253, { name: 'dye-large-earth-jar-rim' }),
      surfaceMaterial('clay', 0x687089, { name: 'dye-indigo-pigment-rim' }),
      surfaceMaterial('clay', 0xaa6250, { name: 'dye-madder-pigment-rim' }),
    ],
  };

  const rack = registerNode(root, 'dye.rack', new THREE.Group(), {
    collider: { type: 'box', size: [3.7, 2.95, 0.9], offset: [0, 1.47, -0.18] },
    destructionGroup: 'rack',
  });
  root.add(rack);
  addRack(rack, materials);

  const textiles = registerNode(root, 'dye.textile', new THREE.Group(), {
    collider: { type: 'box', size: [2.8, 1.65, 0.45], offset: [0, 1.83, 0.08] },
    destructionGroup: 'textiles',
  });
  root.add(textiles);
  addCloths(textiles, materials);

  const vats = registerNode(root, 'dye.vat', new THREE.Group(), {
    collider: { type: 'box', size: [3.1, 1.45, 1.55], offset: [0.1, 0.74, 0.45] },
    destructionGroup: 'vats',
  });
  root.add(vats);
  addVat(vats, materials, {
    id: 'indigo',
    x: -0.82,
    z: 0.42,
    radius: 0.62,
    height: 0.94,
    liquid: materials.indigoLiquid,
    woodOffset: 0,
  });
  addVat(vats, materials, {
    id: 'madder',
    x: 0.9,
    z: 0.42,
    radius: 0.58,
    height: 0.9,
    liquid: materials.madderLiquid,
    woodOffset: 2,
  });

  const fire = registerNode(root, 'dye.fire', new THREE.Group(), {
    collider: { type: 'cylinder', radius: 0.72, height: 0.25, offset: [-0.82, 0.125, 0.42] },
    destructionGroup: 'fire-foundation',
  });
  root.add(fire);
  addFireRing(fire, materials, -0.82, 0.42);

  const wringer = registerNode(root, 'dye.wringer', new THREE.Group(), {
    collider: { type: 'box', size: [1.45, 1.45, 0.55], offset: [1.0, 1.18, 0.7] },
    destructionGroup: 'wringer',
  });
  root.add(wringer);
  addWringer(wringer, materials);

  const tools = registerNode(root, 'dye.tools', new THREE.Group(), {
    collider: { type: 'box', size: [3.4, 0.95, 0.95], offset: [0.2, 0.48, 0.95] },
    destructionGroup: 'tools',
  });
  root.add(tools);
  addPaddle(tools, materials);
  addBasket(tools, materials);
  addPigments(tools, materials);

  addSocket(root, rack, 'socket.dye-rack-center', new THREE.Vector3(0, 2.65, -0.18));
  addSocket(root, vats, 'socket.dye-indigo-vat', new THREE.Vector3(-0.82, 1.1, 0.42));
  addSocket(root, vats, 'socket.dye-madder-vat', new THREE.Vector3(0.9, 1.06, 0.42));
  addSocket(root, wringer, 'socket.dye-wringer-crank', new THREE.Vector3(1.82, 1.57, 0.78));

  root.userData.materialFamilies = [
    'aged-oak',
    'dry-wool',
    'wet-cloth',
    'indigo-dye',
    'madder-dye',
    'blackened-iron',
    'hemp-rope',
    'wicker',
    'undyed-linen',
    'earthenware',
    'fieldstone',
    'ash-and-embers',
  ];
  root.userData.referenceViews = {
    main: 'docs/references/props/village_dyeing_station/ref_main.png',
  };
  root.userData.qualityTier = 'hero-prop';
  return finishHeroProp(root);
}

export default createVillageDyeingStationModel;
