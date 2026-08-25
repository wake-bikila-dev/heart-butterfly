import * as THREE from 'three';
import { buildWingGeometry, mirrorGeometryX } from './wing-geometry.js';
import { makeWhiteWingTexture, makeBlueWingTexture } from './textures.js';

export function createButterfly(renderer, scene) {
  const whiteWingTexture = makeWhiteWingTexture(renderer);
  const blueWingTexture = makeBlueWingTexture(renderer);

  const butterfly = new THREE.Group();
  scene.add(butterfly);

  const core = new THREE.Group();
butterfly.add(core);

  const wingUniforms = {
  uMap2: { value: blueWingTexture },
  uMix:  { value: 0.0 }
};

  const wingMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  map: whiteWingTexture,
  roughness: 0.38,
  metalness: 0.0,
  clearcoat: 0.65,
  clearcoatRoughness: 0.32,
  sheen: 1.0,
  sheenColor: new THREE.Color(0xd8e6ff),
  sheenRoughness: 0.55,
  iridescence: 0.35,
  iridescenceIOR: 1.30,
  iridescenceThicknessRange: [120, 440],
  envMapIntensity: 0.85,
  side: THREE.DoubleSide
});

wingMaterial.onBeforeCompile = (shader) => {
  shader.uniforms.uMap2 = wingUniforms.uMap2;
  shader.uniforms.uMix  = wingUniforms.uMix;

  shader.fragmentShader = shader.fragmentShader.replace(
    '#include <common>',
    `#include <common>
     uniform sampler2D uMap2;
     uniform float uMix;`
  ).replace(
    '#include <map_fragment>',
    `#ifdef USE_MAP
       vec4 texWhite = texture2D( map, vMapUv );
       vec4 texBlue  = texture2D( uMap2, vMapUv );
       diffuseColor *= mix( texWhite, texBlue, uMix );
     #endif`
  );
};
wingMaterial.customProgramCacheKey = () => 'wingCrossfade';


  const heartGroup = new THREE.Group();
heartGroup.position.set(0, 0.055, 0.005);
core.add(heartGroup);

  const heartShape = new THREE.Shape();
heartShape.moveTo(0, -0.35);
heartShape.bezierCurveTo(-0.22, -0.15, -0.45,  0.10, -0.35,  0.28);
heartShape.bezierCurveTo(-0.26,  0.42, -0.10,  0.44,  0.00,  0.28);
heartShape.bezierCurveTo( 0.10,  0.44,  0.26,  0.42,  0.35,  0.28);
heartShape.bezierCurveTo( 0.45,  0.10,  0.22, -0.15,  0.00, -0.35);

  const heartGeo = new THREE.ExtrudeGeometry(heartShape, {
  depth: 0.20,
  bevelEnabled: true,
  bevelThickness: 0.065,
  bevelSize: 0.055,
  bevelSegments: 12,
  curveSegments: 48
});
heartGeo.center();
heartGeo.rotateX(Math.PI / 2);
heartGeo.scale(0.22, 0.22, 0.22);
heartGeo.computeVertexNormals();

  const heartMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xfff8f0,
  roughness: 0.24,
  metalness: 0.0,
  clearcoat: 1.0,
  clearcoatRoughness: 0.10,
  sheen: 0.9,
  sheenColor: new THREE.Color(0xffd0e0),
  sheenRoughness: 0.5,
  iridescence: 0.30,
  iridescenceIOR: 1.34,
  envMapIntensity: 1.20,
  emissive: 0x241018,
  emissiveIntensity: 0.20
});

  const heartMesh = new THREE.Mesh(heartGeo, heartMaterial);
heartMesh.castShadow = true;
heartGroup.add(heartMesh);

  const antennaMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xfff5ec,
  roughness: 0.40,
  metalness: 0.0,
  clearcoat: 0.75,
  clearcoatRoughness: 0.25,
  sheen: 1.0,
  sheenColor: new THREE.Color(0xf2e0f5),
  envMapIntensity: 1.05
});

  const antennae = [];
for (const s of [-1, 1]) {
  const pivot = new THREE.Object3D();
  pivot.position.set(0.042 * s, 0.008, 0.078);
  heartGroup.add(pivot);

  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.000 * s, 0.000, 0.000),
    new THREE.Vector3(0.020 * s, 0.048, 0.024),
    new THREE.Vector3(0.034 * s, 0.105, 0.044),
    new THREE.Vector3(0.044 * s, 0.158, 0.052),
    new THREE.Vector3(0.050 * s, 0.200, 0.042),
    new THREE.Vector3(0.046 * s, 0.224, 0.020)
  ]);

  const geo = new THREE.TubeGeometry(curve, 44, 0.0048, 8, false);
  const mesh = new THREE.Mesh(geo, antennaMaterial);
  pivot.add(mesh);

  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.0072, 14, 10), antennaMaterial);
  tip.position.copy(curve.getPoint(1));
  pivot.add(tip);

  antennae.push({ pivot, phase: s * 1.7 });
}


  const FORE_SECTIONS = [
  [ 0.090, -0.100],
  [ 0.220, -0.150],
  [ 0.340, -0.160],
  [ 0.420, -0.130],
  [ 0.460, -0.060],
  [ 0.470,  0.030],
  [ 0.435,  0.125],
  [ 0.355,  0.210],
  [ 0.240,  0.250]
];
  const HIND_SECTIONS = [
  [ 0.055, -0.120],
  [ 0.085, -0.220],
  [ 0.065, -0.320],
  [ 0.000, -0.400],
  [-0.090, -0.455],
  [-0.195, -0.485],
  [-0.290, -0.480],
  [-0.360, -0.445],
  [-0.405, -0.405]
];

  const foreGeoR = buildWingGeometry(FORE_SECTIONS, 0.85, { nu: 30, nv: 12, thickness: 0.0095 });
  const hindGeoR = buildWingGeometry(HIND_SECTIONS, 0.62, { nu: 24, nv: 11, thickness: 0.0085 });
  const foreGeoL = mirrorGeometryX(foreGeoR.clone());
  const hindGeoL = mirrorGeometryX(hindGeoR.clone());

  function createWingRig(side, geoFore, geoHind) {
  const s = side;

  const foreRoot = new THREE.Object3D();
  foreRoot.position.set(0.032 * s, 0.075, 0.055);
  foreRoot.rotation.y = 0.10 * s;

  const foreFlap = new THREE.Object3D();
  foreRoot.add(foreFlap);

  const foreTwist = new THREE.Object3D();
  foreFlap.add(foreTwist);
  const foreMesh = new THREE.Mesh(geoFore, wingMaterial);
  foreMesh.castShadow = true;
  foreTwist.add(foreMesh);

  core.add(foreRoot);

  const hindRoot = new THREE.Object3D();
  hindRoot.position.set(0.032 * s, 0.052, -0.048);
  hindRoot.rotation.y = 0.06 * s;

  const hindFlap = new THREE.Object3D();
  hindRoot.add(hindFlap);

  const hindTwist = new THREE.Object3D();
  hindFlap.add(hindTwist);
  const hindMesh = new THREE.Mesh(geoHind, wingMaterial);
  hindMesh.castShadow = true;
  hindTwist.add(hindMesh);

  core.add(hindRoot);

  return { foreFlap, foreTwist, hindFlap, hindTwist };
}

  const wingR = createWingRig( 1, foreGeoR, hindGeoR);
  const wingL = createWingRig(-1, foreGeoL, hindGeoL);

  let flapPhase = 0;
  let flapRate = 12.0;
  let flapRateTarget = 12.0;
  let flapRateTimer = 0;

  function updateWings(dt, restBlend) {

  flapRateTimer -= dt;
  if (flapRateTimer <= 0) {
    flapRateTimer = 1.8 + Math.random() * 3.6;
    flapRateTarget = 9.5 + Math.random() * 5.5;
  }
  flapRate += (flapRateTarget - flapRate) * Math.min(1, dt * 1.2);

  const rate = flapRate * (1 - 0.78 * restBlend);
  const advance = rate * (1.0 - 0.42 * Math.cos(flapPhase)) * dt;
  flapPhase += advance;
  if (flapPhase > Math.PI * 2) flapPhase -= Math.PI * 2;

  const s = Math.sin(flapPhase);

  const REST = 0.155;
  const AMP  = 0.60;

  const foreFly = REST + s * AMP;
  const hindFly = REST * 0.70 + Math.sin(flapPhase - 0.42) * AMP * 0.86;
  const twistForeFly = -0.30 * Math.cos(flapPhase);
  const twistHindFly = -0.26 * Math.cos(flapPhase - 0.42);

  const idle = s * 0.045;
  const foreRest = 1.05 + idle;
  const hindRest = 0.90 + idle * 0.8;

  const foreAngle = THREE.MathUtils.lerp(foreFly, foreRest, restBlend);
  const hindAngle = THREE.MathUtils.lerp(hindFly, hindRest, restBlend);
  const twistFore = THREE.MathUtils.lerp(twistForeFly, -0.12, restBlend);
  const twistHind = THREE.MathUtils.lerp(twistHindFly, -0.10, restBlend);

  wingR.foreFlap.rotation.z =  foreAngle;
  wingL.foreFlap.rotation.z = -foreAngle;
  wingR.hindFlap.rotation.z =  hindAngle;
  wingL.hindFlap.rotation.z = -hindAngle;

  wingR.foreTwist.rotation.x = twistFore;
  wingL.foreTwist.rotation.x = twistFore;
  wingR.hindTwist.rotation.x = twistHind;
  wingL.hindTwist.rotation.x = twistHind;
  }

  function updateBody(time, motionScale) {

  core.position.set(
    (Math.sin(time * 2.10) * 0.013 + Math.sin(time * 5.30 + 0.7) * 0.0045) * motionScale,
    (Math.sin(time * 2.70 + 0.6) * 0.021 + Math.sin(time * 6.10 + 1.9) * 0.0052) * motionScale,
    (Math.sin(time * 1.90 + 1.1) * 0.010) * motionScale
  );

  core.rotation.set(
    (Math.sin(time * 2.30 + 2.0) * 0.045 + Math.sin(time * 4.70) * 0.012) * motionScale,
    (Math.sin(time * 1.60 + 0.4) * 0.038) * motionScale,
    (Math.sin(time * 2.50 + 1.3) * 0.062) * motionScale
  );

  const pulse = 1.0 + Math.sin(time * 1.35) * 0.012;
  heartMesh.scale.setScalar(pulse);

  heartGroup.rotation.x = Math.sin(time * 1.40 + 0.5) * 0.035;
  heartGroup.rotation.z = Math.sin(time * 1.05 + 1.1) * 0.045;

  for (const a of antennae) {
    a.pivot.rotation.x = Math.sin(time * 1.55 + a.phase) * 0.10;
    a.pivot.rotation.z = Math.sin(time * 2.10 + a.phase * 0.8) * 0.07;
  }
  }

  return { butterfly, core, heartMaterial, heartMesh, wingMaterial, wingUniforms, antennae, heartGroup, updateWings, updateBody };
}
