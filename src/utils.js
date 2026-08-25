import * as THREE from 'three';

export const temporaries = {
  v1: new THREE.Vector3(),
  v2: new THREE.Vector3(),
  v3: new THREE.Vector3(),
  v4: new THREE.Vector3(),
  v5: new THREE.Vector3(),
  v6: new THREE.Vector3(),
  zero: new THREE.Vector3(0, 0, 0),
  up: new THREE.Vector3(0, 1, 0),
  axisZ: new THREE.Vector3(0, 0, 1),
  look: new THREE.Matrix4(),
  targetQuaternion: new THREE.Quaternion(),
  rollQuaternion: new THREE.Quaternion()
};

export const createLandingQuaternion = () => {
  const matrix = new THREE.Matrix4();
  matrix.set(...[-1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1]);
  return new THREE.Quaternion().setFromRotationMatrix(matrix);
};
