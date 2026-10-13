import * as THREE from 'three';

/**
 * Generates an organic, realistic chalk ring CanvasTexture simulating
 * hand-drawn chalk on rough yard soil with chalk powder speckles,
 * stroke jitter, and subtle gap skips.
 *
 * @param worldRadius - Radius of the chalk ring in world meters (e.g. 1.2m)
 * @param planeSize - Width/height of the square plane mesh in world meters (e.g. 3.2m)
 * @param canvasSize - Canvas dimension in pixels (default: 1024)
 * @returns THREE.CanvasTexture configured with sRGB color space
 */
export function createChalkRingTexture(
  worldRadius: number,
  planeSize: number,
  canvasSize = 1024
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvasSize;
  canvas.height = canvasSize;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  const center = canvasSize / 2;
  const scale = canvasSize / planeSize;
  const pixelRadius = worldRadius * scale;

  ctx.clearRect(0, 0, canvasSize, canvasSize);

  // 1. Soft powdery chalk haze / dust halo around the line
  const haloPasses = 5;
  for (let p = 0; p < haloPasses; p++) {
    const spread = (p - 2) * 2.5;
    ctx.beginPath();
    ctx.arc(center, center, pixelRadius + spread, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 250, 240, 0.05)';
    ctx.lineWidth = 14 + p * 2;
    ctx.stroke();
  }

  // 2. Main multi-pass chalk stroke with organic jitter & pressure variation
  const strokePasses = 8;
  for (let s = 0; s < strokePasses; s++) {
    const jitterRadius = pixelRadius + Math.sin(s * 1.7) * 2.2;
    const strokeWidth = 3.5 + Math.random() * 2.5;
    const baseAlpha = 0.2 + Math.random() * 0.15;

    // Segmented drawing with micro-skips to simulate chalk hopping over pebbles
    const segments = 120;
    const step = (Math.PI * 2) / segments;

    for (let i = 0; i < segments; i++) {
      const startAngle = i * step;
      const endAngle = (i + 1) * step;

      // Occasional micro-skip on dry gravel
      const skipChance = (Math.sin(i * 0.43) + Math.cos(i * 1.1)) * 0.5;
      if (skipChance > 0.82 && s % 2 === 0) continue;

      const alphaMod = Math.max(0.08, baseAlpha + Math.sin(i * 0.25) * 0.12);

      ctx.beginPath();
      ctx.arc(center, center, jitterRadius, startAngle, endAngle);
      ctx.strokeStyle = `rgba(255, 252, 246, ${alphaMod.toFixed(3)})`;
      ctx.lineWidth = strokeWidth;
      ctx.stroke();
    }
  }

  // 3. Dense core line for strong visibility
  ctx.beginPath();
  ctx.arc(center, center, pixelRadius, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.lineWidth = 4;
  ctx.stroke();

  // 4. Chalk dust speckles & scattered powder particles
  const speckleCount = 1400;
  for (let i = 0; i < speckleCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    // Gaussian-like radial scatter centered at pixelRadius
    const offset = (Math.random() + Math.random() + Math.random() - 1.5) * 16;
    const r = pixelRadius + offset;
    const x = center + Math.cos(angle) * r;
    const y = center + Math.sin(angle) * r;

    const size = Math.random() < 0.85 ? 1.0 + Math.random() * 0.8 : 2.0 + Math.random() * 1.2;
    const alpha = (0.15 + Math.random() * 0.55) * (1 - Math.abs(offset) / 24);

    if (alpha > 0.05) {
      ctx.fillStyle = `rgba(255, 252, 245, ${alpha.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}
