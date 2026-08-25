import * as THREE from 'three';
import { temporaries } from './utils.js';
import { AIR_MIN_Y, AIR_MAX_Y, FLIGHT_X_LIMIT, FLIGHT_Z_MIN, FLIGHT_Z_MAX, TAKEOFF_MIN_Y, LAND_POS } from './config.js';

export function createFlight(butterfly, bounceLight, heartLight) {
  const { v1, v2, v3, v4, v5, v6, zero, up, axisZ, look, targetQuaternion, rollQuaternion } = temporaries;
  const flight = {
  pos: new THREE.Vector3(0.5, 2.6, -4.0),
  vel: new THREE.Vector3(0.3, 0.15, 1.0).normalize().multiplyScalar(1.2),
  prevVel: new THREE.Vector3(),
  target: new THREE.Vector3(2.0, 3.0, -8.0),
  timer: 0,
  bank: 0
};
flight.prevVel.copy(flight.vel);



  function pickTarget() {
  const r = Math.random();
  let z;
  if (r < 0.22)      z = 0.4 + Math.random() * 1.7;
  else if (r < 0.45) z = -12.0 + Math.random() * 3.5;
  else               z = -6.5 + Math.random() * 7.0;

  flight.target.set(
    (Math.random() * 2 - 1) * 5.5,
    AIR_MIN_Y + 0.4 + Math.random() * (AIR_MAX_Y - AIR_MIN_Y - 0.8),
    z
  );
  flight.timer = 0;
}
pickTarget();

    function pickTargetAir() {
  flight.target.set(
    (Math.random() * 2 - 1) * 4.5,
    2.6 + Math.random() * 1.8,
    -6.0 + Math.random() * 6.0
  );
  flight.timer = 0;
}

  function updateFlight(dt, time, takeoff) {
  flight.timer += dt;

  const dist = v1.copy(flight.target).sub(flight.pos).length();
  if (dist < 1.4 || flight.timer > 11.0) pickTarget();

  const speed = THREE.MathUtils.clamp(1.75 - flight.pos.z * 0.055, 0.95, 2.35);
  const desired = v2.copy(flight.target).sub(flight.pos).normalize().multiplyScalar(speed);

  v3.set(
    Math.sin(time * 0.63 + 0.5) + 0.60 * Math.sin(time * 1.71 + 2.1),
    Math.sin(time * 0.81 + 1.9) + 0.60 * Math.sin(time * 1.33 + 0.3),
    Math.sin(time * 0.47 + 3.1) + 0.60 * Math.sin(time * 1.93 + 1.1)
  ).multiplyScalar(0.46);
  desired.add(v3);

  const steer = v4.copy(desired).sub(flight.vel).multiplyScalar(1.45);
  flight.vel.addScaledVector(steer, dt);
  flight.vel.clampLength(0.7, 2.7);

  flight.pos.addScaledVector(flight.vel, dt);

  const minY = takeoff ? TAKEOFF_MIN_Y : AIR_MIN_Y;

  if (flight.pos.x >  FLIGHT_X_LIMIT) { flight.pos.x =  FLIGHT_X_LIMIT; flight.vel.x = -Math.abs(flight.vel.x); flight.timer = 99; }
  if (flight.pos.x < -FLIGHT_X_LIMIT) { flight.pos.x = -FLIGHT_X_LIMIT; flight.vel.x =  Math.abs(flight.vel.x); flight.timer = 99; }
  if (flight.pos.y > AIR_MAX_Y) { flight.pos.y = AIR_MAX_Y; flight.vel.y = -Math.abs(flight.vel.y); flight.timer = 99; }
  if (flight.pos.y < minY) { flight.pos.y = minY; flight.vel.y = Math.abs(flight.vel.y); }
  if (flight.pos.z >  FLIGHT_Z_MAX)  { flight.pos.z =  FLIGHT_Z_MAX;  flight.vel.z = -Math.abs(flight.vel.z); flight.timer = 99; }
  if (flight.pos.z < FLIGHT_Z_MIN) { flight.pos.z = FLIGHT_Z_MIN; flight.vel.z =  Math.abs(flight.vel.z); flight.timer = 99; }

  const fwd = v5.copy(flight.vel).normalize();
  look.lookAt(fwd, zero, up);
  targetQuaternion.setFromRotationMatrix(look);

  const accel = v6.copy(flight.vel).sub(flight.prevVel).divideScalar(Math.max(dt, 1e-4));
  flight.prevVel.copy(flight.vel);

  const rightW = v1.set(1, 0, 0).applyQuaternion(targetQuaternion);
  const bankTarget = THREE.MathUtils.clamp(-accel.dot(rightW) * 0.17, -0.78, 0.78);
  flight.bank += (bankTarget - flight.bank) * (1 - Math.exp(-dt * 3.0));
  targetQuaternion.multiply(rollQuaternion.setFromAxisAngle(axisZ, flight.bank));

  butterfly.position.copy(flight.pos);
  butterfly.quaternion.slerp(targetQuaternion, 1 - Math.exp(-dt * 5.0));

  bounceLight.position.copy(flight.pos).add(v2.set(0.6, 0.9, 1.4));
  heartLight.position.copy(flight.pos).add(v2.set(0.0, 0.08, 0.02));
}

  function updateFlightForPhase(dt, time, takeoff) {
    updateFlight(dt, time, takeoff);
  }

  return { flight, pickTarget, pickTargetAir, updateFlight: updateFlightForPhase };
}
