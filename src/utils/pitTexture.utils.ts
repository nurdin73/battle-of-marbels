import * as THREE from 'three';

/**
 * Creates an organic feathered depth mask for yard soil pit holes ("Lubang Eak").
 * Uses warm light-to-medium brown dirt excavation shades rather than pitch black,
 * keeping the pit looking like natural scooped garden soil.
 *
 * @param size - Pixel dimension of the mask canvas (default: 512)
 * @returns THREE.CanvasTexture configured with sRGB color space
 */
export function createPitDepthMask(size: number = 512): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  const center = size / 2;
  const maxRadius = size / 2;

  ctx.clearRect(0, 0, size, size);

  // 1. Organic soft feathered radial depth gradient in warm natural soil brown
  const grad = ctx.createRadialGradient(
    center,
    center,
    0,
    center,
    center,
    maxRadius
  );
  // Center: Warm rich excavated clay brown (not black!)
  grad.addColorStop(0.0, 'rgba(85, 45, 20, 0.72)');
  grad.addColorStop(0.38, 'rgba(115, 62, 28, 0.60)');
  // Pit walls: Warm terracotta/ochre dirt depression
  grad.addColorStop(0.65, 'rgba(155, 92, 42, 0.38)');
  // Outer feathered rim: Gently fades into surrounding yard ground
  grad.addColorStop(0.85, 'rgba(185, 118, 58, 0.14)');
  grad.addColorStop(0.96, 'rgba(185, 118, 58, 0.03)');
  grad.addColorStop(1.0, 'rgba(185, 118, 58, 0.0)');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(center, center, maxRadius, 0, Math.PI * 2);
  ctx.fill();

  // 2. Subtle organic irregular variation (breaks mechanical circular smoothness)
  const noiseBlobs = 28;
  for (let b = 0; b < noiseBlobs; b++) {
    const angle = (b / noiseBlobs) * Math.PI * 2 + (Math.random() - 0.5) * 0.28;
    const dist = maxRadius * (0.55 + Math.random() * 0.25);
    const x = center + Math.cos(angle) * dist;
    const y = center + Math.sin(angle) * dist;
    const blobRadius = 16 + Math.random() * 20;

    const blobGrad = ctx.createRadialGradient(x, y, 0, x, y, blobRadius);
    blobGrad.addColorStop(0, 'rgba(125, 70, 30, 0.16)');
    blobGrad.addColorStop(1, 'rgba(125, 70, 30, 0)');

    ctx.fillStyle = blobGrad;
    ctx.beginPath();
    ctx.arc(x, y, blobRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. Fine sandy micro-speckles in warm golden-brown tones
  const speckles = 350;
  for (let i = 0; i < speckles; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = maxRadius * (0.45 + Math.random() * 0.45);
    const x = center + Math.cos(angle) * dist;
    const y = center + Math.sin(angle) * dist;

    ctx.fillStyle = Math.random() > 0.4
      ? 'rgba(210, 150, 90, 0.25)'
      : 'rgba(95, 50, 22, 0.22)';
    ctx.beginPath();
    ctx.arc(x, y, 0.8 + Math.random() * 0.8, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}
