import * as THREE from 'three';
import {
  PROP_PALETTE,
  addSocket,
  bolt,
  chamferedBox,
  extrudedSilhouette,
  finishHeroProp,
  makePropRoot,
  rectangularMemberBetween,
  registerNode,
  surfaceMaterial,
  torus,
  transformMaterialMaps,
  tubeFromPoints,
} from './shared.js';

const VERSION = 'img2threejs-apothecary-herb-rack-v1-pbr';

function createJarBodyGeometry({
  radius = 0.12,
  height = 0.28,
  seed = 0,
} = {}) {
  const points = [
    new THREE.Vector2(radius * 0.72, 0),
    new THREE.Vector2(radius * 0.94, height * 0.08),
    new THREE.Vector2(radius, height * 0.32),
    new THREE.Vector2(radius * 0.96, height * 0.68),
    new THREE.Vector2(radius * 0.75, height * 0.8),
    new THREE.Vector2(radius * 0.56, height * 0.84),
    new THREE.Vector2(radius * 0.55, height * 0.96),
    new THREE.Vector2(radius * 0.48, height),
  ];
  const geometry = new THREE.LatheGeometry(points, 20);
  const position = geometry.getAttribute('position');
  for (let index = 0; index < position.count; index += 1) {
    const x = position.getX(index);
    const y = position.getY(index);
    const z = position.getZ(index);
    const wobble = 1 + Math.sin(Math.atan2(z, x) * 4 + seed) * 0.008;
    position.setXYZ(index, x * wobble, y, z * wobble);
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

function createBasketGeometry(materials) {
  const basket = new THREE.Group();
  basket.name = 'herb-rack.tools.wicker-basket';
  const lower = torus(0.2, 0.018, materials.wickerDark, 6, 34);
  lower.name = 'herb-rack.tools.basket-lower-ring';
  lower.rotation.x = Math.PI * 0.5;
  lower.position.y = 0.05;
  basket.add(lower);
  for (const [index, y] of [0.12, 0.23, 0.34, 0.45].entries()) {
    const ring = torus(0.2 + index * 0.023, 0.014, index % 2 ? materials.wickerLight : materials.wicker, 6, 34);
    ring.name = 'herb-rack.tools.basket-woven-ring';
    ring.rotation.x = Math.PI * 0.5;
    ring.position.y = y;
    basket.add(ring);
  }
  for (let index = 0; index < 14; index += 1) {
    const angle = (index / 14) * Math.PI * 2;
    const rib = tubeFromPoints([
      new THREE.Vector3(Math.cos(angle) * 0.2, 0.04, Math.sin(angle) * 0.2),
      new THREE.Vector3(Math.cos(angle) * 0.215, 0.23, Math.sin(angle) * 0.215),
      new THREE.Vector3(Math.cos(angle) * 0.27, 0.48, Math.sin(angle) * 0.27),
    ], 0.009, index % 2 ? materials.wickerLight : materials.wickerDark, {
      tubularSegments: 12,
      radialSegments: 5,
    });
    rib.name = 'herb-rack.tools.basket-vertical-rib';
    basket.add(rib);
  }
  const handle = torus(0.31, 0.022, materials.wickerDark, 7, 36, Math.PI);
  handle.name = 'herb-rack.tools.basket-handle';
  handle.rotation.y = Math.PI * 0.5;
  handle.position.y = 0.44;
  basket.add(handle);
  return basket;
}

function createLeaf(material, scale = 1) {
  const leaf = extrudedSilhouette([
    [0, 0.105],
    [0.055, 0.056],
    [0.068, 0],
    [0.04, -0.065],
    [0, -0.105],
    [-0.04, -0.065],
    [-0.068, 0],
    [-0.055, 0.056],
  ], 0.009, material, {
    bevel: 0.006,
    bevelSegments: 2,
  });
  leaf.scale.setScalar(scale);
  return leaf;
}

function addHerbBundle(parent, materials, {
  id,
  position,
  length = 0.62,
  spread = 0.18,
  paletteIndex = 0,
  flower = false,
  garlic = false,
}) {
  const bundle = new THREE.Group();
  bundle.name = `herb-rack.herbs.bundle.${id}`;
  bundle.position.copy(position);
  parent.add(bundle);

  const loop = torus(0.055, 0.01, materials.twine, 6, 22);
  loop.name = `herb-rack.herbs.bundle.${id}.hanging-loop`;
  loop.position.y = 0.02;
  bundle.add(loop);
  const knot = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 5), materials.twine);
  knot.name = `herb-rack.herbs.bundle.${id}.knot`;
  knot.position.y = -0.06;
  bundle.add(knot);

  const stemCount = garlic ? 5 : 8;
  for (let stemIndex = 0; stemIndex < stemCount; stemIndex += 1) {
    const phase = stemIndex * 1.83 + paletteIndex * 0.7;
    const x = Math.cos(phase) * spread * (0.22 + (stemIndex % 3) * 0.11);
    const z = Math.sin(phase) * spread * (0.2 + (stemIndex % 4) * 0.08);
    const endY = -length * (0.72 + (stemIndex % 4) * 0.075);
    const stem = tubeFromPoints([
      new THREE.Vector3((stemIndex - stemCount * 0.5) * 0.006, -0.06, 0),
      new THREE.Vector3(x * 0.35, -length * 0.35, z * 0.25),
      new THREE.Vector3(x, endY, z),
    ], garlic ? 0.011 : 0.0075, materials.stem[paletteIndex % materials.stem.length], {
      tubularSegments: 12,
      radialSegments: 5,
    });
    stem.name = `herb-rack.herbs.bundle.${id}.stem`;
    bundle.add(stem);

    if (garlic) {
      const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.075, 12, 8),
        materials.garlic[stemIndex % materials.garlic.length],
      );
      bulb.name = `herb-rack.herbs.bundle.${id}.garlic-bulb`;
      bulb.scale.set(0.9, 1.08, 0.86);
      bulb.position.set(x, endY - 0.02, z);
      bundle.add(bulb);
      for (let lobeIndex = 0; lobeIndex < 4; lobeIndex += 1) {
        const lobe = new THREE.Mesh(
          new THREE.SphereGeometry(0.027, 8, 5),
          materials.garlic[(stemIndex + lobeIndex) % materials.garlic.length],
        );
        lobe.name = `herb-rack.herbs.bundle.${id}.garlic-lobe`;
        const angle = (lobeIndex / 4) * Math.PI * 2;
        lobe.position.set(
          x + Math.cos(angle) * 0.045,
          endY - 0.055,
          z + Math.sin(angle) * 0.045,
        );
        bundle.add(lobe);
      }
      continue;
    }

    const leafCount = 4 + (stemIndex % 3);
    for (let leafIndex = 0; leafIndex < leafCount; leafIndex += 1) {
      const t = 0.38 + (leafIndex / leafCount) * 0.55;
      const side = leafIndex % 2 ? 1 : -1;
      const leaf = createLeaf(
        materials.leaf[(paletteIndex + leafIndex) % materials.leaf.length],
        0.62 + (stemIndex % 3) * 0.08,
      );
      leaf.name = `herb-rack.herbs.bundle.${id}.leaf`;
      leaf.position.set(
        x * t + side * (0.035 + (leafIndex % 2) * 0.015),
        -length * t,
        z * t + side * 0.008,
      );
      leaf.rotation.set(
        -0.3 + (leafIndex % 3) * 0.18,
        phase + leafIndex * 0.65,
        side * (0.72 + leafIndex * 0.06),
      );
      bundle.add(leaf);
    }

    if (flower && stemIndex % 2 === 0) {
      for (let petalIndex = 0; petalIndex < 6; petalIndex += 1) {
        const petal = createLeaf(
          materials.flower[(paletteIndex + petalIndex) % materials.flower.length],
          0.24,
        );
        petal.name = `herb-rack.herbs.bundle.${id}.flower-petal`;
        const angle = (petalIndex / 6) * Math.PI * 2;
        petal.position.set(x, endY, z);
        petal.rotation.set(Math.PI * 0.5, angle, angle);
        petal.translateY(0.034);
        bundle.add(petal);
      }
    }
  }

  const wrap = torus(0.055, 0.015, materials.twine, 7, 24);
  wrap.name = `herb-rack.herbs.bundle.${id}.binding`;
  wrap.rotation.x = Math.PI * 0.5;
  wrap.position.y = -0.1;
  bundle.add(wrap);
  for (const side of [-1, 1]) {
    const tail = tubeFromPoints([
      new THREE.Vector3(side * 0.018, -0.11, 0),
      new THREE.Vector3(side * 0.055, -0.17, 0.012),
      new THREE.Vector3(side * 0.04, -0.25, 0.02),
    ], 0.006, materials.twine, {
      tubularSegments: 8,
      radialSegments: 4,
    });
    tail.name = `herb-rack.herbs.bundle.${id}.twine-tail`;
    bundle.add(tail);
  }
}

function addFoundation(parent, materials) {
  for (const [index, x, z, yaw] of [
    [0, -1.08, -0.37, 0.045],
    [1, 1.08, -0.37, -0.035],
    [2, -1.08, 0.38, -0.025],
    [3, 1.08, 0.38, 0.04],
  ]) {
    const foot = chamferedBox(0.42, 0.22, 0.4, materials.stone[index % 3], 0.085);
    foot.name = 'herb-rack.foundation.limestone-foot';
    foot.position.set(x, 0.11, z);
    foot.rotation.y = yaw;
    parent.add(foot);
    if (index !== 1) {
      const moss = new THREE.Mesh(new THREE.SphereGeometry(0.1, 9, 5), materials.moss);
      moss.name = 'herb-rack.foundation.moss';
      moss.scale.set(1.35, 0.16, 0.65);
      moss.position.set(x + (x > 0 ? -0.08 : 0.08), 0.22, z + (z > 0 ? -0.07 : 0.07));
      parent.add(moss);
    }
  }
}

function addFrame(parent, materials) {
  for (const [index, x, z] of [
    [0, -1.05, -0.35],
    [1, 1.05, -0.35],
    [2, -1.05, 0.35],
    [3, 1.05, 0.35],
  ]) {
    const post = chamferedBox(0.15, 2.2, 0.15, materials.oak[index % 4], 0.035);
    post.name = 'herb-rack.frame.post';
    post.position.set(x, 1.3, z);
    post.rotation.z = (x > 0 ? -1 : 1) * 0.012;
    parent.add(post);
    const shoe = chamferedBox(0.21, 0.18, 0.21, materials.iron, 0.03);
    shoe.name = 'herb-rack.frame.post-shoe';
    shoe.position.set(x, 0.29, z);
    parent.add(shoe);
    for (const side of [-1, 1]) {
      const rivet = bolt(0.016, 0.04, materials.ironEdge);
      rivet.name = 'herb-rack.frame.post-shoe-rivet';
      rivet.rotation.x = Math.PI * 0.5;
      rivet.position.set(x + side * 0.045, 0.31, z + Math.sign(z || 1) * 0.12);
      parent.add(rivet);
    }
  }

  for (const z of [-0.38, 0.38]) {
    const lintel = chamferedBox(2.42, 0.16, 0.18, materials.oak[z > 0 ? 1 : 2], 0.04);
    lintel.name = 'herb-rack.frame.lintel';
    lintel.position.set(0, 2.35, z);
    parent.add(lintel);
  }
  for (const x of [-1.08, 1.08]) {
    const side = chamferedBox(0.18, 0.16, 0.92, materials.oak[x > 0 ? 0 : 3], 0.035);
    side.name = 'herb-rack.frame.side-lintel';
    side.position.set(x, 2.36, 0);
    parent.add(side);
  }

  for (const [x, z, tx] of [
    [-1.04, -0.38, -0.58],
    [1.04, -0.38, 0.58],
    [-1.04, 0.38, -0.58],
    [1.04, 0.38, 0.58],
  ]) {
    const brace = rectangularMemberBetween(
      new THREE.Vector3(x, 1.68, z),
      new THREE.Vector3(tx, 2.29, z),
      0.09,
      0.075,
      materials.oak[(x > 0 ? 1 : 2) + (z > 0 ? 1 : 0)],
      0.022,
    );
    brace.name = 'herb-rack.frame.diagonal-brace';
    parent.add(brace);
  }

  const shelfY = [0.52, 0.89];
  shelfY.forEach((y, row) => {
    for (let index = 0; index < 8; index += 1) {
      const x = -0.98 + index * 0.28;
      const plank = chamferedBox(0.24, 0.075, 0.69, materials.oakCross[(index + row) % 4], 0.022);
      plank.name = 'herb-rack.frame.shelf-plank';
      plank.position.set(x, y, 0);
      plank.rotation.y = ((index % 3) - 1) * 0.006;
      parent.add(plank);
    }
    for (const z of [-0.32, 0.32]) {
      const rail = chamferedBox(2.2, 0.13, 0.11, materials.oak[row ? 2 : 1], 0.03);
      rail.name = 'herb-rack.frame.shelf-rail';
      rail.position.set(0, y - 0.08, z);
      parent.add(rail);
    }
  });

  for (const y of [1.28, 1.66, 2.02]) {
    const rod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 2.05, 10),
      materials.iron,
    );
    rod.name = 'herb-rack.frame.hanging-rod';
    rod.rotation.z = Math.PI * 0.5;
    rod.position.set(0, y, 0.28);
    parent.add(rod);
    for (const x of [-1.02, 1.02]) {
      const eye = torus(0.05, 0.012, materials.ironEdge, 6, 20);
      eye.name = 'herb-rack.frame.rod-eye';
      eye.rotation.y = Math.PI * 0.5;
      eye.position.set(x, y, 0.28);
      parent.add(eye);
    }
  }
}

function addCanopy(parent, materials) {
  const ridge = chamferedBox(2.55, 0.13, 0.13, materials.oak[0], 0.03);
  ridge.name = 'herb-rack.canopy.ridge-beam';
  ridge.position.set(0, 2.66, 0);
  parent.add(ridge);

  for (const side of [-1, 1]) {
    const roofBoard = chamferedBox(2.58, 0.08, 0.72, materials.oakCross[side > 0 ? 1 : 2], 0.025);
    roofBoard.name = 'herb-rack.canopy.roof-board';
    roofBoard.position.set(0, 2.51, side * 0.31);
    roofBoard.rotation.x = side * 0.42;
    parent.add(roofBoard);

    const tileRows = 4;
    const tileColumns = 11;
    for (let row = 0; row < tileRows; row += 1) {
      const z = side * (0.08 + row * 0.16);
      const y = 2.65 - row * 0.068;
      for (let column = 0; column < tileColumns; column += 1) {
        const tile = new THREE.Mesh(
          new THREE.CylinderGeometry(0.12, 0.13, 0.29, 7, 2, true, 0.18, Math.PI * 0.68),
          materials.tile[(column + row + (side > 0 ? 1 : 0)) % materials.tile.length],
        );
        tile.name = 'herb-rack.canopy.terracotta-tile';
        tile.rotation.set(Math.PI * 0.5 + side * 0.42, 0, Math.PI * 0.5);
        tile.position.set(-1.19 + column * 0.238, y, z);
        parent.add(tile);
      }
    }
  }

  for (let index = 0; index < 11; index += 1) {
    const ridgeTile = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 0.25, 9, 2, true, 0, Math.PI),
      materials.tile[(index + 1) % materials.tile.length],
    );
    ridgeTile.name = 'herb-rack.canopy.ridge-tile';
    ridgeTile.rotation.z = Math.PI * 0.5;
    ridgeTile.position.set(-1.2 + index * 0.24, 2.7, 0);
    parent.add(ridgeTile);
  }
}

function addHerbs(parent, materials) {
  const rows = [
    { y: 2.03, xs: [-0.86, -0.56, -0.24, 0.08, 0.42, 0.76], length: 0.62 },
    { y: 1.66, xs: [-0.74, -0.38, 0, 0.38, 0.75], length: 0.52 },
    { y: 1.29, xs: [-0.82, -0.45, -0.08, 0.3, 0.68], length: 0.4 },
  ];
  let bundleIndex = 0;
  for (const [rowIndex, row] of rows.entries()) {
    for (const x of row.xs) {
      addHerbBundle(parent, materials, {
        id: `${rowIndex}-${bundleIndex}`,
        position: new THREE.Vector3(x, row.y, 0.33 + ((bundleIndex % 3) - 1) * 0.012),
        length: row.length + (bundleIndex % 3) * 0.035,
        spread: 0.16 + (bundleIndex % 4) * 0.012,
        paletteIndex: bundleIndex,
        flower: bundleIndex % 4 === 1,
        garlic: bundleIndex === 4 || bundleIndex === 12,
      });
      bundleIndex += 1;
    }
  }
}

function addJar(parent, materials, {
  id,
  position,
  radius,
  height,
  materialIndex,
}) {
  const jar = new THREE.Group();
  jar.name = `herb-rack.tools.jar.${id}`;
  jar.position.copy(position);
  parent.add(jar);
  const body = new THREE.Mesh(
    createJarBodyGeometry({ radius, height, seed: materialIndex }),
    materials.jar[materialIndex % materials.jar.length],
  );
  body.name = `herb-rack.tools.jar.${id}.body`;
  jar.add(body);
  const rim = torus(radius * 0.58, radius * 0.08, materials.jarEdge[materialIndex % materials.jarEdge.length], 7, 28);
  rim.name = `herb-rack.tools.jar.${id}.rim`;
  rim.rotation.x = Math.PI * 0.5;
  rim.position.y = height * 0.95;
  jar.add(rim);
  const cork = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.47, radius * 0.5, height * 0.15, 12),
    materials.cork,
  );
  cork.name = `herb-rack.tools.jar.${id}.cork`;
  cork.position.y = height * 1.03;
  jar.add(cork);
  const label = chamferedBox(radius * 0.95, height * 0.27, 0.012, materials.parchment, 0.018);
  label.name = `herb-rack.tools.jar.${id}.parchment-label`;
  label.position.set(0, height * 0.48, radius * 0.98);
  jar.add(label);
  const mark = tubeFromPoints([
    new THREE.Vector3(-radius * 0.2, height * 0.48, radius * 1.05),
    new THREE.Vector3(0, height * 0.52, radius * 1.05),
    new THREE.Vector3(radius * 0.19, height * 0.46, radius * 1.05),
  ], 0.006, materials.ink, {
    tubularSegments: 8,
    radialSegments: 4,
  });
  mark.name = `herb-rack.tools.jar.${id}.ink-mark`;
  jar.add(mark);
}

function addMortar(parent, materials) {
  const mortar = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 20, 10, 0, Math.PI * 2, Math.PI * 0.47, Math.PI * 0.53),
    materials.brass,
  );
  mortar.name = 'herb-rack.tools.brass-mortar';
  mortar.scale.y = 0.72;
  mortar.position.set(0.72, 1.0, 0.09);
  parent.add(mortar);
  const rim = torus(0.2, 0.025, materials.brassEdge, 7, 32);
  rim.name = 'herb-rack.tools.mortar-rim';
  rim.rotation.x = Math.PI * 0.5;
  rim.position.set(0.72, 1.1, 0.09);
  parent.add(rim);
  const pestle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.07, 0.48, 12),
    materials.brass,
  );
  pestle.name = 'herb-rack.tools.brass-pestle';
  pestle.rotation.z = -0.55;
  pestle.position.set(0.84, 1.26, 0.09);
  parent.add(pestle);
  const end = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 8), materials.brassEdge);
  end.name = 'herb-rack.tools.pestle-end';
  end.position.set(0.71, 1.05, 0.09);
  parent.add(end);
}

function addParchments(parent, materials) {
  for (let index = 0; index < 5; index += 1) {
    const paper = extrudedSilhouette([
      [-0.22, 0.13],
      [0.19, 0.14],
      [0.23, 0.07],
      [0.2, -0.12],
      [-0.18, -0.14],
      [-0.24, -0.05],
    ], 0.008, materials.parchment, {
      bevel: 0.008,
    });
    paper.name = 'herb-rack.tools.folded-parchment';
    paper.rotation.x = -Math.PI * 0.5;
    paper.rotation.z = -0.1 + index * 0.04;
    paper.position.set(0.05 + index * 0.01, 1.0 + index * 0.012, 0.05);
    parent.add(paper);
  }
  const tie = torus(0.13, 0.012, materials.twine, 6, 26);
  tie.name = 'herb-rack.tools.parchment-tie';
  tie.rotation.x = Math.PI * 0.5;
  tie.scale.x = 1.6;
  tie.position.set(0.08, 1.06, 0.05);
  parent.add(tie);
}

function addSideTools(parent, materials) {
  const basket = createBasketGeometry(materials);
  basket.position.set(-1.35, 0.03, 0.42);
  basket.rotation.y = -0.16;
  parent.add(basket);

  const pouch = extrudedSilhouette([
    [-0.15, 0.2],
    [0.15, 0.2],
    [0.18, 0.1],
    [0.14, -0.2],
    [-0.13, -0.2],
    [-0.18, 0.1],
  ], 0.1, materials.leather, {
    bevel: 0.035,
    bevelSegments: 2,
  });
  pouch.name = 'herb-rack.tools.leather-herb-pouch';
  pouch.position.set(1.12, 1.18, 0.38);
  pouch.rotation.z = -0.08;
  parent.add(pouch);
  const flap = extrudedSilhouette([
    [-0.15, 0.11],
    [0.15, 0.11],
    [0.11, -0.08],
    [0, -0.15],
    [-0.11, -0.08],
  ], 0.018, materials.leatherDark, {
    bevel: 0.012,
  });
  flap.name = 'herb-rack.tools.pouch-flap';
  flap.position.set(1.12, 1.3, 0.44);
  parent.add(flap);
  const clasp = bolt(0.025, 0.035, materials.brassEdge);
  clasp.name = 'herb-rack.tools.pouch-clasp';
  clasp.rotation.x = Math.PI * 0.5;
  clasp.position.set(1.12, 1.24, 0.47);
  parent.add(clasp);

  const pivot = bolt(0.052, 0.065, materials.brassEdge);
  pivot.name = 'herb-rack.tools.shears-pivot';
  pivot.rotation.x = Math.PI * 0.5;
  pivot.position.set(-1.12, 1.1, 0.43);
  parent.add(pivot);
  for (const side of [-1, 1]) {
    const handle = torus(0.1, 0.018, materials.ironEdge, 6, 28);
    handle.name = 'herb-rack.tools.shears-handle';
    handle.scale.y = 0.62;
    handle.position.set(-1.12 + side * 0.1, 0.97, 0.43);
    parent.add(handle);
    const blade = extrudedSilhouette([
      [-0.03, 0],
      [0.03, 0],
      [0.018, 0.36],
      [-0.018, 0.36],
    ], 0.025, materials.ironEdge, {
      bevel: 0.01,
    });
    blade.name = 'herb-rack.tools.shears-blade';
    blade.position.set(-1.12 + side * 0.025, 1.12, 0.43);
    blade.rotation.z = side * 0.23;
    parent.add(blade);
  }
}

function addShelfTools(parent, materials) {
  const jars = [
    ['amber', -0.82, 0.95, 0.12, 0.28, 0],
    ['green', -0.48, 0.95, 0.13, 0.32, 1],
    ['cream', -0.15, 0.95, 0.1, 0.25, 2],
    ['blue', 0.36, 0.95, 0.12, 0.3, 3],
    ['rust', 0.7, 0.95, 0.11, 0.26, 4],
  ];
  for (const [id, x, y, radius, height, materialIndex] of jars) {
    addJar(parent, materials, {
      id,
      position: new THREE.Vector3(x, y, 0.12),
      radius,
      height,
      materialIndex,
    });
  }
  addMortar(parent, materials);
  addParchments(parent, materials);
  addSideTools(parent, materials);
}

export function createApothecaryHerbRackModel() {
  const root = makePropRoot('prop.apothecary-herb-rack', VERSION);
  const oak = PROP_PALETTE.oak.map((color, index) => transformMaterialMaps(
    surfaceMaterial('wood', color, { name: `herb-rack-aged-oak-${index}` }),
    { offset: [index * 0.17, index * 0.11], repeatScale: [0.74, 0.9] },
  ));
  const materials = {
    oak,
    oakCross: oak.map((material, index) => transformMaterialMaps(material, {
      rotation: Math.PI * 0.5,
      offset: [0.06 + index * 0.025, 0.12],
    })),
    iron: surfaceMaterial('forged-iron', 0x292927, { name: 'herb-rack-blackened-iron' }),
    ironEdge: surfaceMaterial('worn-iron', 0x5c5a55, { name: 'herb-rack-worn-iron' }),
    brass: surfaceMaterial('brass', 0x896531, { name: 'herb-rack-aged-brass' }),
    brassEdge: surfaceMaterial('brass', 0xad8847, { name: 'herb-rack-polished-brass' }),
    twine: surfaceMaterial('rope', 0x8f7040, { name: 'herb-rack-hemp-twine' }),
    stone: [0x9a8467, 0x826f58, 0xac9978].map((color, index) => transformMaterialMaps(
      surfaceMaterial('stone', color, { name: `herb-rack-limestone-${index}` }),
      { offset: [index * 0.18, index * 0.1], repeatScale: [0.8, 0.8] },
    )),
    moss: surfaceMaterial('moss', 0x4a5f34, { name: 'herb-rack-foundation-moss' }),
    tile: [0x8d392d, 0xa54a37, 0x733027, 0xb55a42].map((color, index) => transformMaterialMaps(
      surfaceMaterial('clay', color, { name: `herb-rack-terracotta-tile-${index}` }),
      { offset: [index * 0.16, index * 0.12], repeatScale: [0.88, 0.88] },
    )),
    stem: [
      surfaceMaterial('leaf', 0x435d31, { name: 'herb-rack-sage-stem' }),
      surfaceMaterial('leaf', 0x665b2f, { name: 'herb-rack-dry-stem' }),
      surfaceMaterial('leaf', 0x35543a, { name: 'herb-rack-mint-stem' }),
      surfaceMaterial('leaf', 0x6d4b2a, { name: 'herb-rack-thyme-stem' }),
    ],
    leaf: [
      surfaceMaterial('leaf', 0x48663e, { name: 'herb-rack-sage-leaf' }),
      surfaceMaterial('leaf', 0x6d6b38, { name: 'herb-rack-dry-gold-leaf' }),
      surfaceMaterial('leaf', 0x355f44, { name: 'herb-rack-mint-leaf' }),
      surfaceMaterial('leaf', 0x58422d, { name: 'herb-rack-brown-herb-leaf' }),
      surfaceMaterial('leaf', 0x79713a, { name: 'herb-rack-olive-leaf' }),
    ],
    flower: [
      surfaceMaterial('petal', 0x7d5579, { name: 'herb-rack-lavender-petal' }),
      surfaceMaterial('petal', 0xa56f75, { name: 'herb-rack-rose-petal' }),
      surfaceMaterial('petal', 0xd0ad68, { name: 'herb-rack-chamomile-petal' }),
    ],
    garlic: [
      surfaceMaterial('burlap', 0xd2c3a5, { name: 'herb-rack-garlic-cream' }),
      surfaceMaterial('burlap', 0xbda98c, { name: 'herb-rack-garlic-shadow' }),
    ],
    jar: [
      surfaceMaterial('clay', 0x8b5634, { name: 'herb-rack-amber-jar' }),
      surfaceMaterial('clay', 0x4e7060, { name: 'herb-rack-green-jar' }),
      surfaceMaterial('clay', 0xa49375, { name: 'herb-rack-cream-jar' }),
      surfaceMaterial('clay', 0x496b79, { name: 'herb-rack-blue-jar' }),
      surfaceMaterial('clay', 0x925540, { name: 'herb-rack-rust-jar' }),
    ],
    jarEdge: [
      surfaceMaterial('clay', 0xa8754d, { name: 'herb-rack-amber-jar-rim' }),
      surfaceMaterial('clay', 0x6c8b79, { name: 'herb-rack-green-jar-rim' }),
      surfaceMaterial('clay', 0xb7a78d, { name: 'herb-rack-cream-jar-rim' }),
      surfaceMaterial('clay', 0x6b8d99, { name: 'herb-rack-blue-jar-rim' }),
      surfaceMaterial('clay', 0xaf725d, { name: 'herb-rack-rust-jar-rim' }),
    ],
    cork: surfaceMaterial('cork', 0x92714d, { name: 'herb-rack-cork-stopper' }),
    parchment: surfaceMaterial('parchment', 0xc4ae83, {
      name: 'herb-rack-parchment',
      side: THREE.DoubleSide,
    }),
    ink: surfaceMaterial('burlap', 0x3e342a, { name: 'herb-rack-label-ink' }),
    leather: surfaceMaterial('leather', 0x654128, { name: 'herb-rack-herb-pouch-leather' }),
    leatherDark: surfaceMaterial('leather', 0x43291c, { name: 'herb-rack-pouch-flap-leather' }),
    wicker: surfaceMaterial('rope', 0x9c7440, { name: 'herb-rack-wicker' }),
    wickerLight: surfaceMaterial('rope', 0xb08a51, { name: 'herb-rack-light-wicker' }),
    wickerDark: surfaceMaterial('rope', 0x74512f, { name: 'herb-rack-dark-wicker' }),
  };

  const foundation = registerNode(root, 'herb-rack.foundation', new THREE.Group(), {
    collider: { type: 'box', size: [2.55, 0.25, 1.0], offset: [0, 0.125, 0] },
    destructionGroup: 'foundation',
  });
  root.add(foundation);
  addFoundation(foundation, materials);

  const frame = registerNode(root, 'herb-rack.frame', new THREE.Group(), {
    collider: { type: 'box', size: [2.35, 2.4, 0.9], offset: [0, 1.35, 0] },
    destructionGroup: 'frame',
  });
  root.add(frame);
  addFrame(frame, materials);

  const canopy = registerNode(root, 'herb-rack.canopy', new THREE.Group(), {
    collider: { type: 'box', size: [2.75, 0.45, 1.2], offset: [0, 2.55, 0] },
    destructionGroup: 'canopy',
  });
  root.add(canopy);
  addCanopy(canopy, materials);

  const herbs = registerNode(root, 'herb-rack.herbs', new THREE.Group(), {
    destructionGroup: 'herbs',
  });
  root.add(herbs);
  addHerbs(herbs, materials);

  const tools = registerNode(root, 'herb-rack.tools', new THREE.Group(), {
    destructionGroup: 'tools',
  });
  root.add(tools);
  addShelfTools(tools, materials);

  addSocket(root, herbs, 'socket.herb-rack-center-bundle', new THREE.Vector3(0, 2.02, 0.33));
  addSocket(root, tools, 'socket.herb-rack-mortar', new THREE.Vector3(0.72, 1.35, 0.09));
  addSocket(root, tools, 'socket.herb-rack-basket', new THREE.Vector3(-1.35, 0.54, 0.42));
  addSocket(root, canopy, 'socket.herb-rack-canopy', new THREE.Vector3(0, 2.76, 0));

  root.userData.materialFamilies = [
    'aged-oak',
    'terracotta-tile',
    'blackened-iron',
    'limestone',
    'dried-herbs',
    'garlic',
    'ceramic-jars',
    'aged-brass',
    'parchment',
    'wicker',
    'leather',
  ];
  root.userData.referenceViews = {
    main: 'docs/references/props/apothecary_herb_rack/ref_main.png',
  };
  root.userData.qualityTier = 'hero-prop';
  return finishHeroProp(root);
}

export default createApothecaryHerbRackModel;
