import * as THREE from 'three';

export function makeWhiteWingTexture(renderer) {

  const S = 1024;
  const c = document.createElement('canvas');
  c.width = S; c.height = S;
  const ctx = c.getContext('2d');

  ctx.fillStyle = '#fcfcfa';
  ctx.fillRect(0, 0, S, S);

  for (let i = 0; i < 260; i++) {
    const x = Math.random() * S;
    const y = Math.random() * S;
    const r = 10 + Math.random() * 55;
    const a = 0.015 + Math.random() * 0.030;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(186,196,214,${a})`);
    g.addColorStop(1, 'rgba(186,196,214,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  const rootX = -S * 0.02;
  const rootY = S * 0.50;

  const rg = ctx.createRadialGradient(rootX, rootY, 0, rootX, rootY, S * 0.55);
  rg.addColorStop(0.00, 'rgba(120,126,142,0.32)');
  rg.addColorStop(0.35, 'rgba(150,156,170,0.14)');
  rg.addColorStop(1.00, 'rgba(160,166,180,0)');
  ctx.fillStyle = rg;
  ctx.fillRect(0, 0, S, S);

  const veinCount = 8;
  const mainEnds = [];
  for (let k = 0; k < veinCount; k++) {
    const t = k / (veinCount - 1);
    const endY = S * (0.04 + t * 0.92);
    const endX = S * (0.88 + Math.random() * 0.14);
    const cx = S * 0.34;
    const cy = rootY + (endY - rootY) * 0.38 + (Math.random() - 0.5) * S * 0.06;
    mainEnds.push([cx, cy, endX, endY]);

    ctx.beginPath();
    ctx.moveTo(rootX, rootY);
    ctx.quadraticCurveTo(cx, cy, endX, endY);
    ctx.strokeStyle = 'rgba(112,120,138,0.30)';
    ctx.lineWidth = 3.2;
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(rootX, rootY);
    ctx.quadraticCurveTo(cx, cy, endX, endY);
    ctx.strokeStyle = 'rgba(255,255,255,0.42)';
    ctx.lineWidth = 1.1;
    ctx.stroke();
  }

  for (let k = 0; k < mainEnds.length - 1; k++) {
    const A = mainEnds[k];
    const B = mainEnds[k + 1];
    for (let m = 1; m <= 3; m++) {
      const f = m / 4;
      const ax2 = rootX + (A[2] - rootX) * f * 0.8;
      const ay2 = rootY + (A[3] - rootY) * f;
      const bx2 = rootX + (B[2] - rootX) * f * 0.8;
      const by2 = rootY + (B[3] - rootY) * f;

      ctx.beginPath();
      ctx.moveTo(ax2, ay2);
      ctx.quadraticCurveTo((ax2 + bx2) * 0.5, (ay2 + by2) * 0.5 + (Math.random() - 0.5) * 22, bx2, by2);
      ctx.strokeStyle = 'rgba(126,134,152,0.16)';
      ctx.lineWidth = 1.6;
      ctx.stroke();
    }
  }

  ctx.globalAlpha = 0.05;
  for (let i = 0; i < 700; i++) {
    const x = Math.random() * S;
    const y = Math.random() * S;
    const len = 8 + Math.random() * 40;
    const ang = Math.random() * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
    ctx.strokeStyle = Math.random() > 0.5 ? '#c8cede' : '#ffffff';
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return tex;
}

export function makeBlueWingTexture(renderer) {

  const S = 1024;
  const c = document.createElement('canvas');
  c.width = S; c.height = S;
  const ctx = c.getContext('2d');

  const baseGrad = ctx.createLinearGradient(0, 0, S, S);
  baseGrad.addColorStop(0, '#1b4b8a');
  baseGrad.addColorStop(0.5, '#2e6bc4');
  baseGrad.addColorStop(1, '#4a90e2');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, S, S);

  for (let i = 0; i < 260; i++) {
    const x = Math.random() * S;
    const y = Math.random() * S;
    const r = 10 + Math.random() * 55;
    const a = 0.015 + Math.random() * 0.030;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(160,200,255,${a})`);
    g.addColorStop(1, 'rgba(160,200,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  const rootX = -S * 0.02;
  const rootY = S * 0.50;

  const rg = ctx.createRadialGradient(rootX, rootY, 0, rootX, rootY, S * 0.55);
  rg.addColorStop(0.00, 'rgba(10,20,50,0.40)');
  rg.addColorStop(0.35, 'rgba(15,30,70,0.15)');
  rg.addColorStop(1.00, 'rgba(20,40,90,0)');
  ctx.fillStyle = rg;
  ctx.fillRect(0, 0, S, S);

  const veinCount = 7;
  const mainEnds = [];

  for (let k = 0; k < veinCount; k++) {
    const t = k / (veinCount - 1);
    const endY = S * (0.02 + t * 0.96);
    const endX = S * (0.85 + Math.random() * 0.15);
    const cx = S * 0.35;
    const cy = rootY + (endY - rootY) * 0.40 + (Math.random() - 0.5) * S * 0.08;
    mainEnds.push([cx, cy, endX, endY]);

    ctx.beginPath();
    ctx.moveTo(rootX, rootY);
    ctx.quadraticCurveTo(cx, cy, endX, endY);
    ctx.strokeStyle = 'rgba(8, 15, 35, 0.85)';
    ctx.lineWidth = 6.0;
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(rootX, rootY);
    ctx.quadraticCurveTo(cx, cy, endX, endY);
    ctx.strokeStyle = 'rgba(120, 180, 255, 0.40)';
    ctx.lineWidth = 2.0;
    ctx.stroke();
  }

  for (let k = 0; k < mainEnds.length - 1; k++) {
    const A = mainEnds[k];
    const B = mainEnds[k + 1];
    for (let m = 1; m <= 4; m++) {
      const f = m / 5;
      const ax2 = rootX + (A[2] - rootX) * f * 0.85;
      const ay2 = rootY + (A[3] - rootY) * f;
      const bx2 = rootX + (B[2] - rootX) * f * 0.85;
      const by2 = rootY + (B[3] - rootY) * f;

      ctx.beginPath();
      ctx.moveTo(ax2, ay2);
      ctx.quadraticCurveTo(
        (ax2 + bx2) * 0.5,
        (ay2 + by2) * 0.5 + (Math.random() - 0.5) * 30,
        bx2, by2
      );
      ctx.strokeStyle = 'rgba(10, 25, 55, 0.7)';
      ctx.lineWidth = 3.5;
      ctx.stroke();
    }
  }

  ctx.globalAlpha = 0.08;
  for (let i = 0; i < 800; i++) {
    const x = Math.random() * S;
    const y = Math.random() * S;
    const len = 10 + Math.random() * 50;
    const ang = Math.random() * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
    ctx.strokeStyle = Math.random() > 0.5 ? '#aaccff' : '#ffffff';
    ctx.lineWidth = 1.0;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return tex;
}
