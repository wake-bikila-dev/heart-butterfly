import * as THREE from 'three';

export function createCameraController(camera, butterfly, phaseGetter, phaseValues) {
  const cameraBase = new THREE.Vector3(1.6, 1.7, 5.4);
  const cameraPosition = cameraBase.clone();
  const lookTarget = new THREE.Vector3(0, 2.5, -4);
  const lookPoint = new THREE.Vector3();
  const landingCameraPosition = new THREE.Vector3(1.30, 0.50, 2.20);
  const landingCameraLook = new THREE.Vector3(0.20, -0.05, 0.17);
  const cameraFollowPosition = new THREE.Vector3();
  const cameraDesiredPosition = new THREE.Vector3();
  const lookDesired = new THREE.Vector3();
  let cameraBlend = 0;

  function updateCamera(dt, time) {
  const driftX = Math.sin(time * 0.11) * 1.35 + Math.sin(time * 0.27 + 1.7) * 0.50;
  const driftY = Math.sin(time * 0.17 + 0.9) * 0.70 + Math.sin(time * 0.09 + 2.2) * 0.40;
  const driftZ = Math.sin(time * 0.13 + 0.4) * 1.05 + Math.sin(time * 0.05 + 3.0) * 0.45;

  cameraFollowPosition.set(
    cameraBase.x + driftX,
    cameraBase.y + driftY,
    cameraBase.z + driftZ
  ).addScaledVector(butterfly.position, 0.15);

  const camTarget = (phaseValues.landing.includes(phaseGetter())) ? 1 : 0;
  cameraBlend += (camTarget - cameraBlend) * (1 - Math.exp(-dt * 1.4));

  cameraDesiredPosition.lerpVectors(cameraFollowPosition, landingCameraPosition, cameraBlend);

  const posRate = 0.85 + cameraBlend * 2.6;
  cameraPosition.lerp(cameraDesiredPosition, 1 - Math.exp(-dt * posRate));

  lookDesired.lerpVectors(butterfly.position, landingCameraLook, cameraBlend);
  lookTarget.lerp(lookDesired, 1 - Math.exp(-dt * (1.55 + cameraBlend * 2.6)));

  lookPoint.copy(lookTarget);
  lookPoint.x += Math.sin(time * 0.23) * 0.26 * (1 - cameraBlend);
  lookPoint.y += Math.cos(time * 0.19) * 0.19 * (1 - cameraBlend);

  camera.position.copy(cameraPosition);
  camera.lookAt(lookPoint);
  camera.rotateZ(Math.sin(time * 0.07) * 0.030 * (1 - cameraBlend * 0.7));
}


  return { updateCamera };
}
