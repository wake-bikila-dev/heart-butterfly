import * as THREE from 'three';

export function createEnvironment(renderer, scene) {
  function makeEnvTexture() {
    const w = 512, h = 256;
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0.00, '#1a2740');
    grad.addColorStop(0.42, '#080c16');
    grad.addColorStop(1.00, '#000000');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    function blob(x, y, r, inner) {
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
      gradient.addColorStop(0, inner);
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }

    blob(150, 55, 150, 'rgba(255,248,235,1.0)');
    blob(390, 80, 120, 'rgba(120,160,255,0.42)');
    blob(250, 220, 170, 'rgba(28,42,72,0.35)');
    const tex = new THREE.CanvasTexture(c);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const envSource = makeEnvTexture();
  const envRT = pmrem.fromEquirectangular(envSource);
  scene.environment = envRT.texture;
  envSource.dispose();
  pmrem.dispose();

  const bgDome = new THREE.Mesh(
  new THREE.SphereGeometry(160, 32, 24),
  new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      uTop:    { value: new THREE.Color(0x0a1120) },
      uMid:    { value: new THREE.Color(0x03050b) },
      uBottom: { value: new THREE.Color(0x000000) }
    },
    vertexShader: `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uTop, uMid, uBottom;
      varying vec3 vDir;
      void main() {
        float h = vDir.y * 0.5 + 0.5;
        vec3 col = mix(uBottom, uMid, smoothstep(0.0, 0.5, h));
        col = mix(col, uTop, smoothstep(0.45, 1.0, h));
        col += vec3(0.006, 0.010, 0.020) * (1.0 - abs(vDir.y));
        gl_FragColor = vec4(col, 1.0);
      }
    `
  })
);
bgDome.frustumCulled = false;
  scene.add(bgDome);


  const ambient = new THREE.AmbientLight(0x1b2436, 0.85);
  scene.add(ambient);

  const keyLight = new THREE.DirectionalLight(0xfff3e2, 2.35);
keyLight.position.set(5.5, 9.0, 6.0);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.near = 1;
keyLight.shadow.camera.far = 40;
keyLight.shadow.camera.left = -12;
keyLight.shadow.camera.right = 12;
keyLight.shadow.camera.top = 12;
keyLight.shadow.camera.bottom = -12;
keyLight.shadow.bias = -0.0009;
keyLight.shadow.normalBias = 0.02;
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0x3c5c94, 0.85);
fillLight.position.set(-6.5, -2.5, 3.5);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xa8c8ff, 2.6);
rimLight.position.set(-4.0, 3.5, -7.5);
  scene.add(rimLight);

  const bounceLight = new THREE.PointLight(0x8fb4ff, 1.2, 6.0, 2.0);
  scene.add(bounceLight);

  const heartLight = new THREE.PointLight(0xffe6d0, 0.55, 1.8, 2.0);
  scene.add(heartLight);

  return { bgDome, ambient, keyLight, fillLight, rimLight, bounceLight, heartLight };
}
