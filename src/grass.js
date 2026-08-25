import * as THREE from 'three';
import { GRASS_SCALE, GRASS_MAX_HEIGHT, GRASS_TRANSITION_WIDTH, GRASS_REVEAL_NOISE_FREQUENCY, GRASS_REVEAL_NOISE_AMPLITUDE, LAND_LOCAL_X, LAND_LOCAL_Z, PERCH_HEIGHT, PERCH_BEND, PERCH_WIDTH } from './config.js';

export function createGrass(scene) {


  const grassGroup = new THREE.Group();
grassGroup.position.set(0, -1.0, -1.5);
grassGroup.scale.setScalar(GRASS_SCALE);
  scene.add(grassGroup);

  function getSoilElevation(x, z) {
  let elevation = Math.sin(x * 0.3) * Math.cos(z * 0.3) * 0.6;
  elevation += Math.sin(x * 1.5) * 0.15;
  elevation += Math.cos(z * 2.0) * 0.1;
  if (Math.abs(x) < 8 && Math.abs(z) < 4) elevation *= 0.2;
  return elevation;
}

  const soilMaterial = new THREE.MeshStandardMaterial({
  color: 0x3e2723,
  roughness: 1.0,
  metalness: 0.0
});

  const terrainGeo = new THREE.PlaneGeometry(64, 48, 80, 64);
{
  const p = terrainGeo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const gx = p.getX(i);
    const gz = -p.getY(i);
    p.setZ(i, getSoilElevation(gx, gz) - 0.2);
  }
  terrainGeo.computeVertexNormals();
}
  const terrainMesh = new THREE.Mesh(terrainGeo, soilMaterial);
terrainMesh.rotation.x = -Math.PI / 2;
terrainMesh.receiveShadow = true;
grassGroup.add(terrainMesh);

  const pebbleGeo = new THREE.DodecahedronGeometry(0.15, 0);
  const pebbleMaterial = new THREE.MeshStandardMaterial({
  color: 0x5d4037,
  roughness: 0.9,
  metalness: 0.1
});
  const pebbleCount = 220;
  const pebbles = new THREE.InstancedMesh(pebbleGeo, pebbleMaterial, pebbleCount);
{
  const dummy = new THREE.Object3D();
  for (let i = 0; i < pebbleCount; i++) {
    const px = (Math.random() - 0.5) * 34;
    const pz = (Math.random() - 0.5) * 26;
    const py = getSoilElevation(px, pz) - 0.2;
    dummy.position.set(px, py, pz);
    dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    const sc = 0.3 + Math.random() * 1.2;
    dummy.scale.set(sc, sc, sc);
    dummy.updateMatrix();
    pebbles.setMatrixAt(i, dummy.matrix);
  }
}
pebbles.receiveShadow = true;
grassGroup.add(pebbles);

  const grassMaterial = new THREE.MeshStandardMaterial({
  color: 0xaaaaaa,
  roughness: 0.7,
  metalness: 0.1
});

grassMaterial.onBeforeCompile = (shader) => {
  shader.uniforms.uMaxHeight = { value: GRASS_MAX_HEIGHT };
  shader.uniforms.uReveal    = { value: -0.5 };

  shader.vertexShader = shader.vertexShader.replace(
    '#include <common>',
    `#include <common>
     varying float vLocalY;
     varying float vLocalX;
     varying float vLocalZ;`
  ).replace(
    '#include <begin_vertex>',
    `#include <begin_vertex>
     vLocalY = position.y;
     vLocalX = position.x;
     vLocalZ = position.z;`
  );

  shader.fragmentShader = shader.fragmentShader.replace(
    '#include <common>',
    `#include <common>
     varying float vLocalY;
     varying float vLocalX;
     varying float vLocalZ;
     uniform float uMaxHeight;
     uniform float uReveal;`
  ).replace(
    '#include <color_fragment>',
    `#include <color_fragment>
     float noise = sin(vLocalX * ${GRASS_REVEAL_NOISE_FREQUENCY.toFixed(1)}) * ${GRASS_REVEAL_NOISE_AMPLITUDE.toFixed(2)} + cos(vLocalZ * ${GRASS_REVEAL_NOISE_FREQUENCY.toFixed(1)}) * ${GRASS_REVEAL_NOISE_AMPLITUDE.toFixed(2)};
     float normY = clamp((vLocalY / uMaxHeight) + noise, 0.0, 1.0);

     vec3 grayColor   = vec3(0.6, 0.6, 0.6);
     vec3 darkGreen   = vec3(0.05, 0.25, 0.05);
     vec3 brightGreen = vec3(0.4, 0.9, 0.1);
     vec3 grassGreen  = mix(darkGreen, brightGreen, normY);

     float transitionWidth = ${GRASS_TRANSITION_WIDTH.toFixed(1)};
     float blend = 1.0 - smoothstep(uReveal, uReveal + transitionWidth, normY);

     diffuseColor.rgb = mix(grayColor, grassGreen, blend);`
  );

  grassMaterial.userData.shader = shader;
};

  function createBlade(height, bend, width) {
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, 0);
  shape.quadraticCurveTo(-width * 1.5, height * 0.4, bend, height);
  shape.quadraticCurveTo(width * 1.5, height * 0.6, width / 2, 0);
  shape.lineTo(-width / 2, 0);

  const extrudeSettings = { depth: 0.05, bevelEnabled: false, curveSegments: 12 };
  const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geom.translate(0, 0, -0.025);

  const mesh = new THREE.Mesh(geom, grassMaterial);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

  const blades = [];

  function plantBlade(x, z, h, bend, w, rotZ) {
  const blade = createBlade(h, bend, w);
  const soilY = getSoilElevation(x, z) - 0.2;
  blade.position.set(x, soilY, z);
  blade.rotation.y = (Math.random() - 0.5) * 0.6;
  blade.rotation.z = rotZ;

  blade.userData = {
    baseRotationZ: rotZ,
    phase: Math.random() * Math.PI * 2,
    windAmplitude: 0.1 + Math.random() * 0.15,
    windSpeed: 0.8 + Math.random() * 0.6
  };

  blades.push(blade);
  grassGroup.add(blade);
}

  const heroConfigs = [
  { x: -4.5, h: 2.5, b: -2.0, w: 0.25, rot: -0.2 },
  { x: -3.8, h: 3.5, b: -1.5, w: 0.25, rot: -0.15 },
  { x: -3.0, h: 4.5, b: -1.0, w: 0.30, rot: -0.1 },
  { x: -2.2, h: 5.5, b: -0.6, w: 0.30, rot: -0.05 },
  { x: -1.2, h: 6.5, b: -0.3, w: 0.30, rot: 0 },
  { x:  4.5, h: 2.5, b:  2.0, w: 0.25, rot: 0.2 },
  { x:  3.8, h: 3.5, b:  1.5, w: 0.25, rot: 0.15 },
  { x:  3.0, h: 4.5, b:  1.0, w: 0.30, rot: 0.1 },
  { x:  2.2, h: 5.5, b:  0.6, w: 0.30, rot: 0.05 },
  { x:  1.2, h: 6.5, b:  0.3, w: 0.30, rot: 0 },
  { x:  0.0, h: 7.5, b:  0.1, w: 0.35, rot: 0 },
  { x: -0.5, h: 7.0, b: -0.2, w: 0.25, rot: -0.05 },
  { x:  0.5, h: 6.8, b:  0.2, w: 0.25, rot: 0.05 },
  { x: -2.6, h: 4.0, b: -1.2, w: 0.20, rot: -0.1 },
  { x:  2.6, h: 4.0, b:  1.2, w: 0.20, rot: 0.1 },
  { x: -1.7, h: 5.0, b: -0.8, w: 0.20, rot: -0.08 },
  { x:  1.7, h: 5.0, b:  0.8, w: 0.20, rot: 0.08 },
  { x: -5.2, h: 1.2, b: -1.5, w: 0.15, rot: -0.4 },
  { x:  5.2, h: 1.2, b:  1.5, w: 0.15, rot: 0.4 }
];
  heroConfigs.forEach(cfg => {
  const zDepth = (Math.random() - 0.5) * 2.0;
  plantBlade(cfg.x, zDepth, cfg.h, cfg.b, cfg.w, cfg.rot);
});



for (let i = 0; i < 110; i++) {
  const x = (Math.random() - 0.5) * 30;
  const z = (Math.random() - 0.5) * 24;
  if (Math.hypot(x - LAND_LOCAL_X, z - LAND_LOCAL_Z) < 3.0) continue;
  const h = 1.5 + Math.random() * 4.6;
  const bend = (Math.random() - 0.5) * h * 0.35;
  const w = 0.16 + Math.random() * 0.16;
  plantBlade(x, z, h, bend, w, (Math.random() - 0.5) * 0.5);
}



  const perchBlade = createBlade(PERCH_HEIGHT, PERCH_BEND, PERCH_WIDTH);
const perchSoilY = getSoilElevation(LAND_LOCAL_X, LAND_LOCAL_Z) - 0.2;
perchBlade.position.set(LAND_LOCAL_X, perchSoilY, LAND_LOCAL_Z);
perchBlade.rotation.y = 0.0;
perchBlade.rotation.z = 0.0;
perchBlade.userData = {
  baseRotationZ: 0.0,
  phase: 1.2,
  windAmplitude: 0.008,
  windSpeed: 0.65
};
blades.push(perchBlade);
  grassGroup.add(perchBlade);


  return { grassGroup, grassMaterial, blades, createBlade, getSoilElevation };
}
