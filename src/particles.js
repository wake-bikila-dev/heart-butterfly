import * as THREE from 'three';

export function createParticles(scene, core) {
  const particleSystems = [];

  function makeParticleSystem(count, spread, colorHex, opacity, pointScale) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const phase = new Float32Array(count);
  const size = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    pos[i * 3 + 0] = (Math.random() - 0.5) * spread.x;
    pos[i * 3 + 1] = (Math.random() - 0.5) * spread.y;
    pos[i * 3 + 2] = (Math.random() - 0.5) * spread.z;
    phase[i] = Math.random() * Math.PI * 2;
    size[i] = 0.45 + Math.random() * 1.4;
  }

  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));

  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      uColor: { value: new THREE.Color(colorHex) },
      uOpacity: { value: opacity },
      uScale: { value: pointScale }
    },
    vertexShader: `
      uniform float uTime;
      uniform float uPixelRatio;
      uniform float uScale;
      attribute float aPhase;
      attribute float aSize;
      varying float vTwinkle;
      void main() {
        vec3 p = position;
        p.x += sin(uTime * 0.11 + aPhase) * 0.85;
        p.y += sin(uTime * 0.15 + aPhase * 1.7) * 0.75;
        p.z += cos(uTime * 0.09 + aPhase * 0.7) * 0.85;

        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = aSize * uPixelRatio * uScale / max(-mv.z, 0.15);

        vTwinkle = 0.22 + 0.78 * pow(abs(sin(uTime * 0.35 + aPhase * 2.3)), 5.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uOpacity;
      varying float vTwinkle;
      void main() {
        vec2 c = gl_PointCoord - 0.5;
        float d = length(c);
        if (d > 0.5) discard;
        float a = smoothstep(0.5, 0.0, d);
        a *= a;
        gl_FragColor = vec4(uColor, a * vTwinkle * uOpacity);
      }
    `
  });

  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  particleSystems.push(points);
  return points;
}

  const dustEnv = makeParticleSystem(
  170,
  new THREE.Vector3(30, 18, 34),
  0x9dc0ff,
  0.34,
  16.0
);
  scene.add(dustEnv);

  const dustNear = makeParticleSystem(
  18,
  new THREE.Vector3(1.1, 0.75, 1.1),
  0xe6f0ff,
  0.13,
  11.0
);
  core.add(dustNear);

  return { particleSystems };
}
