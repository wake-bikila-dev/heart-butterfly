import * as THREE from 'three';
import { createEnvironment } from './environment.js';
import { createButterfly } from './butterfly.js';
import { createGrass } from './grass.js';
import { createParticles } from './particles.js';
import { createFlight } from './flight.js';
import { createCameraController } from './camera.js';
import { createLandingQuaternion } from './utils.js';
import { DESCEND_DURATION, FLY_WHITE_DURATION, LANDED_DURATION, RECOLOR_DURATION, TAKEOFF_DURATION, REVEAL_DELAY, REVEAL_DURATION, GRASS_REVEAL_START, GRASS_REVEAL_RANGE, LAND_POS } from './config.js';

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.10;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x03050c, 0.013);
const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 400);
camera.position.set(1.6, 1.7, 5.4);
const environment = createEnvironment(renderer, scene);
const butterflyScene = createButterfly(renderer, scene);
const grass = createGrass(scene);
const particles = createParticles(scene, butterflyScene.core);

const LAND_QUAT = createLandingQuaternion();
const PHASE = { FLY_WHITE: 0, DESCEND: 1, LANDED: 2, RECOLOR: 3, TAKEOFF: 4, FLY_COLORED: 5 };
let phase = PHASE.FLY_WHITE;
let phaseTime = 0;
let descendT = 0;
const descendStartPos = new THREE.Vector3();
const descendStartQuat = new THREE.Quaternion();
let restBlend = 0;
let revealProgress = 0;
let recolorProgress = 0;

const C_WING_WHITE = new THREE.Color(0xffffff);
const C_WING_BLUE = new THREE.Color(0x4a90e2);
const C_SHEEN_WHITE = new THREE.Color(0xd8e6ff);
const C_SHEEN_BLUE = new THREE.Color(0xaaccff);
const C_HEART_WHITE = new THREE.Color(0xfff8f0);
const C_HEART_RED = new THREE.Color(0xff0022);
const C_HEART_EM_WHITE = new THREE.Color(0x241018);
const C_HEART_EM_RED = new THREE.Color(0x880011);
const C_HEART_SHEEN_WHITE = new THREE.Color(0xffd0e0);
const C_HEART_SHEEN_RED = new THREE.Color(0xff6688);
const C_HL_WHITE = new THREE.Color(0xffe6d0);
const C_HL_RED = new THREE.Color(0xff0033);

function applyRecolor(k) {
  const { wingMaterial, wingUniforms, heartMaterial } = butterflyScene;
  wingUniforms.uMix.value = k;
  wingMaterial.color.copy(C_WING_WHITE).lerp(C_WING_BLUE, k);
  wingMaterial.roughness = THREE.MathUtils.lerp(0.38, 0.32, k);
  wingMaterial.clearcoat = THREE.MathUtils.lerp(0.65, 0.80, k);
  wingMaterial.metalness = THREE.MathUtils.lerp(0.00, 0.05, k);
  wingMaterial.sheenColor.copy(C_SHEEN_WHITE).lerp(C_SHEEN_BLUE, k);
  wingMaterial.iridescence = THREE.MathUtils.lerp(0.35, 0.45, k);
  wingMaterial.envMapIntensity = THREE.MathUtils.lerp(0.85, 1.00, k);
  heartMaterial.color.copy(C_HEART_WHITE).lerp(C_HEART_RED, k);
  heartMaterial.emissive.copy(C_HEART_EM_WHITE).lerp(C_HEART_EM_RED, k);
  heartMaterial.emissiveIntensity = THREE.MathUtils.lerp(0.20, 0.60, k);
  heartMaterial.metalness = THREE.MathUtils.lerp(0.00, 0.10, k);
  heartMaterial.roughness = THREE.MathUtils.lerp(0.24, 0.18, k);
  heartMaterial.sheenColor.copy(C_HEART_SHEEN_WHITE).lerp(C_HEART_SHEEN_RED, k);
  heartMaterial.iridescence = THREE.MathUtils.lerp(0.30, 0.40, k);
  heartMaterial.envMapIntensity = THREE.MathUtils.lerp(1.20, 1.50, k);
  environment.heartLight.color.copy(C_HL_WHITE).lerp(C_HL_RED, k);
  environment.heartLight.intensity = THREE.MathUtils.lerp(0.55, 0.85, k);
}
applyRecolor(0);

const flightController = createFlight(butterflyScene.butterfly, environment.bounceLight, environment.heartLight);
const cameraController = createCameraController(camera, butterflyScene.butterfly, () => phase, { landing: [PHASE.DESCEND, PHASE.LANDED, PHASE.RECOLOR] });

function setPhase(nextPhase) {
  phase = nextPhase;
  phaseTime = 0;
  if (nextPhase === PHASE.DESCEND) {
    descendT = 0;
    descendStartPos.copy(butterflyScene.butterfly.position);
    descendStartQuat.copy(butterflyScene.butterfly.quaternion);
  }
  if (nextPhase === PHASE.TAKEOFF) {
    flightController.flight.pos.set(LAND_POS.x, LAND_POS.y, LAND_POS.z);
    flightController.flight.vel.set(0.35, 1.30, 0.55);
    flightController.flight.prevVel.copy(flightController.flight.vel);
    flightController.flight.bank = 0;
    flightController.pickTargetAir();
  }
}

function updateDescend(dt) {
  descendT += dt;
  const t = THREE.MathUtils.clamp(descendT / DESCEND_DURATION, 0, 1);
  const e = t * t * (3 - 2 * t);
  butterflyScene.butterfly.position.lerpVectors(descendStartPos, new THREE.Vector3(LAND_POS.x, LAND_POS.y, LAND_POS.z), e);
  butterflyScene.butterfly.position.y += Math.sin(t * Math.PI) * 0.10;
  butterflyScene.butterfly.quaternion.slerpQuaternions(descendStartQuat, LAND_QUAT, e);
  environment.bounceLight.position.copy(butterflyScene.butterfly.position).add(new THREE.Vector3(0.6, 0.9, 1.4));
  environment.heartLight.position.copy(butterflyScene.butterfly.position).add(new THREE.Vector3(0.0, 0.08, 0.02));
}

function updateLanded(time) {
  butterflyScene.butterfly.position.set(LAND_POS.x, LAND_POS.y, LAND_POS.z);
  butterflyScene.butterfly.position.y += Math.sin(time * 1.6) * 0.003;
  butterflyScene.butterfly.quaternion.copy(LAND_QUAT);
  environment.bounceLight.position.copy(butterflyScene.butterfly.position).add(new THREE.Vector3(0.6, 0.9, 1.4));
  environment.heartLight.position.copy(butterflyScene.butterfly.position).add(new THREE.Vector3(0.0, 0.08, 0.02));
}

function updateResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  const pixelRatio = Math.min(window.devicePixelRatio, 2);
  renderer.setPixelRatio(pixelRatio);
  for (const particleSystem of particles.particleSystems) particleSystem.material.uniforms.uPixelRatio.value = pixelRatio;
}
window.addEventListener('resize', updateResize);

const clock = new THREE.Clock();
let elapsed = 0;
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  elapsed += dt;
  phaseTime += dt;
  if (phase === PHASE.FLY_WHITE && phaseTime > FLY_WHITE_DURATION) setPhase(PHASE.DESCEND);
  else if (phase === PHASE.DESCEND && phaseTime > DESCEND_DURATION) setPhase(PHASE.LANDED);
  else if (phase === PHASE.LANDED) {
    const revealT = phaseTime - REVEAL_DELAY;
    if (revealT > 0) revealProgress = Math.min(revealT / REVEAL_DURATION, 1);
    if (phaseTime > LANDED_DURATION) setPhase(PHASE.RECOLOR);
  } else if (phase === PHASE.RECOLOR) {
    recolorProgress = THREE.MathUtils.clamp(phaseTime / RECOLOR_DURATION, 0, 1);
    applyRecolor(recolorProgress * recolorProgress * (3 - 2 * recolorProgress));
    if (phaseTime > RECOLOR_DURATION) { applyRecolor(1); setPhase(PHASE.TAKEOFF); }
  } else if (phase === PHASE.TAKEOFF && phaseTime > TAKEOFF_DURATION) setPhase(PHASE.FLY_COLORED);
  if (phase === PHASE.FLY_WHITE || phase === PHASE.TAKEOFF || phase === PHASE.FLY_COLORED) flightController.updateFlight(dt, elapsed, phase === PHASE.TAKEOFF);
  else if (phase === PHASE.DESCEND) updateDescend(dt);
  else updateLanded(elapsed);
  const restTarget = (phase === PHASE.DESCEND && descendT > DESCEND_DURATION * 0.35) || phase === PHASE.LANDED || phase === PHASE.RECOLOR ? 1 : 0;
  const restRate = restTarget === 0 ? 3.2 : 2.2;
  restBlend += (restTarget - restBlend) * (1 - Math.exp(-dt * restRate));
  if (grass.grassMaterial.userData.shader) grass.grassMaterial.userData.shader.uniforms.uReveal.value = GRASS_REVEAL_START + revealProgress * GRASS_REVEAL_RANGE;
  butterflyScene.updateWings(dt, restBlend);
  butterflyScene.updateBody(elapsed, 1 - 0.80 * restBlend);
  for (const blade of grass.blades) {
    const windForce = Math.sin(elapsed * blade.userData.windSpeed + blade.userData.phase);
    blade.rotation.z = blade.userData.baseRotationZ + windForce * blade.userData.windAmplitude;
    const twistForce = Math.cos(elapsed * blade.userData.windSpeed * 1.3 + blade.userData.phase);
    blade.rotation.x = twistForce * (blade.userData.windAmplitude * 0.5);
  }
  cameraController.updateCamera(dt, elapsed);
  for (const particleSystem of particles.particleSystems) particleSystem.material.uniforms.uTime.value = elapsed;
  renderer.render(scene, camera);
}
animate();
