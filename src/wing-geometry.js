import * as THREE from 'three';

function camberFn(u, v) {
  const droop = 0.085 * u * u;
  const cup   = -0.020 * Math.sin(v * Math.PI) * (0.30 + 0.70 * u);
  const wave  = 0.010 * Math.sin(u * Math.PI * 1.6 + 0.4);
  return droop + cup + wave;
}

function buildWingGeometry(sections, span, opts = {}) {
  const nu = opts.nu ?? 26;
  const nv = opts.nv ?? 12;
  const thickness = opts.thickness ?? 0.0095;
  const nSec = sections.length;

  const leadPts = [];
  const trailPts = [];
  for (let i = 0; i < nSec; i++) {
    const x = span * (i / (nSec - 1));
    leadPts.push(new THREE.Vector3(x, sections[i][0], 0));
    trailPts.push(new THREE.Vector3(x, sections[i][1], 0));
  }
  const leadCurve = new THREE.CatmullRomCurve3(leadPts, false, 'catmullrom', 0.5);
  const trailCurve = new THREE.CatmullRomCurve3(trailPts, false, 'catmullrom', 0.5);

  const cols = nu + 1;
  const rows = nv + 1;
  const grid = [];
  for (let i = 0; i < cols; i++) {
    const u = i / nu;
    const L = leadCurve.getPoint(u);
    const T = trailCurve.getPoint(u);
    const row = [];
    for (let j = 0; j < rows; j++) {
      const v = j / nv;
      const x = T.x + (L.x - T.x) * v;
      const y = T.y + (L.y - T.y) * v;
      const z = camberFn(u, v);
      row.push(new THREE.Vector3(x, y, z));
    }
    grid.push(row);
  }

  const positions = [];
  const uvs = [];
  const indices = [];

  function addSurface(dz, flip) {
    const base = positions.length / 3;
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const p = grid[i][j];
        positions.push(p.x, p.y, p.z + dz);
        uvs.push(i / nu, j / nv);
      }
    }
    for (let i = 0; i < nu; i++) {
      for (let j = 0; j < nv; j++) {
        const a = base + i * rows + j;
        const b = base + (i + 1) * rows + j;
        const c = base + (i + 1) * rows + j + 1;
        const d = base + i * rows + j + 1;
        if (flip) indices.push(a, c, b, a, d, c);
        else      indices.push(a, b, c, a, c, d);
      }
    }
  }

  addSurface( thickness * 0.5, false);
  addSurface(-thickness * 0.5, true);

  const topCount = cols * rows;
  const boundary = [];
  for (let i = 0; i <= nu; i++) boundary.push([i, 0]);
  for (let i = nu; i >= 0; i--) boundary.push([i, nv]);

  for (let k = 0; k < boundary.length; k++) {
    const [i0, j0] = boundary[k];
    const [i1, j1] = boundary[(k + 1) % boundary.length];
    if (i0 === i1 && j0 === j1) continue;
    const t0 = i0 * rows + j0;
    const t1 = i1 * rows + j1;
    const b0 = topCount + t0;
    const b1 = topCount + t1;
    indices.push(t0, b1, t1, t0, b0, b1);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);

  geo.rotateX(Math.PI / 2);
  geo.computeVertexNormals();
  return geo;
}

function mirrorGeometryX(geo) {
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) pos.setX(i, -pos.getX(i));
  pos.needsUpdate = true;
  const idx = geo.index.array;
  for (let i = 0; i < idx.length; i += 3) {
    const t = idx[i]; idx[i] = idx[i + 2]; idx[i + 2] = t;
  }
  geo.index.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

export { camberFn, buildWingGeometry, mirrorGeometryX };
