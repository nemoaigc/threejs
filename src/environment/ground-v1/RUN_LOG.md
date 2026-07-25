# Ground — volumetric Three.js craft

## Intent
User wants **立体地表** (3D volume), not flat textured planes.

## Geometry

| layer | mesh |
|-------|------|
| meadow | PlaneGeometry 96×96 segs + multi-scale vertex height |
| dirt road | ExtrudeGeometry of cross-section: raised bed, dual rut trenches, shoulders |
| plaza | InstancedMesh of box stones with height/yaw jitter + rim boxes |
| apron | LatheGeometry low dirt dome |

Textures remain optional tint (procedural canvas preferred).

## API stable
`createMeadowGround` / `createDirtRoadTile` / `createCobblePlaza` / `createBuildingDirtApron`
