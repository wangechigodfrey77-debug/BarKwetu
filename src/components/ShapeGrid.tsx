import React, { useEffect, useRef } from 'react';

export interface ShapeGridProps {
  /** Speed of continuous movement */
  speed?: number;
  /** Size in pixels of each grid shape/cell */
  squareSize?: number;
  /** Direction of movement */
  direction?: 'up' | 'down' | 'left' | 'right' | 'diagonal';
  /** Grid border/stroke color (hex, rgb, rgba) */
  borderColor?: string;
  /** Fill color when hovered by cursor or trail */
  hoverFillColor?: string;
  /** Shape type */
  shape?: 'square' | 'hexagon' | 'circle' | 'triangle';
  /** Number of trailing hovered shapes */
  hoverTrailAmount?: number;
  /** Additional CSS classes */
  className?: string;
}

interface TrailNode {
  x: number;
  y: number;
  intensity: number;
  timestamp: number;
}

export const ShapeGrid: React.FC<ShapeGridProps> = ({
  speed = 0.5,
  squareSize = 40,
  direction = 'diagonal',
  borderColor = '#fff',
  hoverFillColor = '#222',
  shape = 'square',
  hoverTrailAmount = 5,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let offsetX = 0;
    let offsetY = 0;
    let lastTime = performance.now();

    // Mouse & Trail state
    let mousePos: { x: number; y: number } | null = null;
    let trail: TrailNode[] = [];

    const handleResize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      const now = performance.now();
      const newPos = { x: e.clientX, y: e.clientY };
      mousePos = newPos;

      if (hoverTrailAmount > 0) {
        trail.unshift({
          x: newPos.x,
          y: newPos.y,
          intensity: 1.0,
          timestamp: now,
        });
        if (trail.length > Math.max(hoverTrailAmount, 1) * 3) {
          trail.length = Math.max(hoverTrailAmount, 1) * 3;
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      const touch = e.touches[0];
      const now = performance.now();
      const newPos = { x: touch.clientX, y: touch.clientY };
      mousePos = newPos;

      if (hoverTrailAmount > 0) {
        trail.unshift({
          x: newPos.x,
          y: newPos.y,
          intensity: 1.0,
          timestamp: now,
        });
        if (trail.length > Math.max(hoverTrailAmount, 1) * 3) {
          trail.length = Math.max(hoverTrailAmount, 1) * 3;
        }
      }
    };

    const handleMouseLeave = () => {
      mousePos = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('touchend', handleMouseLeave);

    // Direction velocity factors
    let vx = 0;
    let vy = 0;
    switch (direction) {
      case 'up':
        vx = 0;
        vy = -1;
        break;
      case 'down':
        vx = 0;
        vy = 1;
        break;
      case 'left':
        vx = -1;
        vy = 0;
        break;
      case 'right':
        vx = 1;
        vy = 0;
        break;
      case 'diagonal':
      default:
        vx = -0.7071;
        vy = -0.7071;
        break;
    }

    // Hexagon helper
    const drawHexagon = (context: CanvasRenderingContext2D, cx: number, cy: number, radius: number) => {
      context.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        const x = cx + radius * Math.cos(angle);
        const y = cy + radius * Math.sin(angle);
        if (i === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.closePath();
    };

    // Triangle helper
    const drawTriangle = (context: CanvasRenderingContext2D, cx: number, cy: number, size: number) => {
      const h = (size * Math.sqrt(3)) / 2;
      context.beginPath();
      context.moveTo(cx, cy - h / 2);
      context.lineTo(cx + size / 2, cy + h / 2);
      context.lineTo(cx - size / 2, cy + h / 2);
      context.closePath();
    };

    // Render loop
    const render = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      // Update offsets for continuous seamless movement
      const step = speed * 60 * dt;
      offsetX = (offsetX + vx * step) % squareSize;
      offsetY = (offsetY + vy * step) % squareSize;

      if (offsetX > 0) offsetX -= squareSize;
      if (offsetY > 0) offsetY -= squareSize;

      // Update trail decay
      const now = currentTime;
      trail = trail
        .map((node) => {
          const age = (now - node.timestamp) / 1000;
          const maxAge = Math.max(hoverTrailAmount * 0.12, 0.25);
          const intensity = Math.max(0, 1 - age / maxAge);
          return { ...node, intensity };
        })
        .filter((node) => node.intensity > 0.01);

      ctx.clearRect(0, 0, width, height);

      const size = Math.max(squareSize, 10);
      const startX = Math.floor(-size * 2 + offsetX);
      const startY = Math.floor(-size * 2 + offsetY);
      const endX = width + size * 2;
      const endY = height + size * 2;

      // Render grid items based on shape
      if (shape === 'square') {
        for (let x = startX; x < endX; x += size) {
          for (let y = startY; y < endY; y += size) {
            const centerX = x + size / 2;
            const centerY = y + size / 2;

            // Calculate hover influence from mouse and trail
            let maxInfluence = 0;
            if (mousePos) {
              const dx = mousePos.x - centerX;
              const dy = mousePos.y - centerY;
              const distSq = dx * dx + dy * dy;
              const radius = size * 0.95;
              if (distSq < radius * radius) {
                maxInfluence = 1.0;
              }
            }

            if (maxInfluence < 1.0 && hoverTrailAmount > 0) {
              for (const node of trail) {
                const dx = node.x - centerX;
                const dy = node.y - centerY;
                const distSq = dx * dx + dy * dy;
                const radius = size * 0.9;
                if (distSq < radius * radius) {
                  const inf = node.intensity;
                  if (inf > maxInfluence) maxInfluence = inf;
                }
              }
            }

            // Fill when hovered
            if (maxInfluence > 0) {
              ctx.save();
              ctx.globalAlpha = maxInfluence * 0.9;
              ctx.fillStyle = hoverFillColor;
              ctx.fillRect(x, y, size, size);
              // Accent subtle gold/white border highlight on hover
              ctx.strokeStyle = '#d4af37';
              ctx.globalAlpha = maxInfluence * 0.4;
              ctx.lineWidth = 1;
              ctx.strokeRect(x, y, size, size);
              ctx.restore();
            }

            // Base Grid Stroke Border
            ctx.save();
            ctx.strokeStyle = borderColor;
            ctx.globalAlpha = 0.07;
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, size, size);
            ctx.restore();
          }
        }
      } else if (shape === 'circle') {
        const radius = size * 0.44;
        for (let x = startX; x < endX; x += size) {
          for (let y = startY; y < endY; y += size) {
            const centerX = x + size / 2;
            const centerY = y + size / 2;

            let maxInfluence = 0;
            if (mousePos) {
              const dx = mousePos.x - centerX;
              const dy = mousePos.y - centerY;
              if (dx * dx + dy * dy < radius * radius * 1.4) {
                maxInfluence = 1.0;
              }
            }

            if (maxInfluence < 1.0 && hoverTrailAmount > 0) {
              for (const node of trail) {
                const dx = node.x - centerX;
                const dy = node.y - centerY;
                if (dx * dx + dy * dy < radius * radius * 1.3) {
                  if (node.intensity > maxInfluence) maxInfluence = node.intensity;
                }
              }
            }

            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);

            if (maxInfluence > 0) {
              ctx.save();
              ctx.globalAlpha = maxInfluence * 0.9;
              ctx.fillStyle = hoverFillColor;
              ctx.fill();
              ctx.restore();
            }

            ctx.save();
            ctx.strokeStyle = borderColor;
            ctx.globalAlpha = 0.07;
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.restore();
          }
        }
      } else if (shape === 'hexagon') {
        const r = size * 0.52;
        const hexWidth = r * Math.sqrt(3);
        const hexHeight = r * 1.5;

        for (let y = startY, row = 0; y < endY + hexHeight; y += hexHeight, row++) {
          const xOffset = (row % 2) * (hexWidth / 2);
          for (let x = startX + xOffset; x < endX + hexWidth; x += hexWidth) {
            let maxInfluence = 0;
            if (mousePos) {
              const dx = mousePos.x - x;
              const dy = mousePos.y - y;
              if (dx * dx + dy * dy < r * r * 1.1) maxInfluence = 1.0;
            }

            if (maxInfluence < 1.0 && hoverTrailAmount > 0) {
              for (const node of trail) {
                const dx = node.x - x;
                const dy = node.y - y;
                if (dx * dx + dy * dy < r * r * 1.1) {
                  if (node.intensity > maxInfluence) maxInfluence = node.intensity;
                }
              }
            }

            drawHexagon(ctx, x, y, r);

            if (maxInfluence > 0) {
              ctx.save();
              ctx.globalAlpha = maxInfluence * 0.9;
              ctx.fillStyle = hoverFillColor;
              ctx.fill();
              ctx.restore();
            }

            ctx.save();
            ctx.strokeStyle = borderColor;
            ctx.globalAlpha = 0.07;
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.restore();
          }
        }
      } else if (shape === 'triangle') {
        const s = size * 0.85;
        for (let x = startX; x < endX; x += size) {
          for (let y = startY; y < endY; y += size) {
            const centerX = x + size / 2;
            const centerY = y + size / 2;

            let maxInfluence = 0;
            if (mousePos) {
              const dx = mousePos.x - centerX;
              const dy = mousePos.y - centerY;
              if (dx * dx + dy * dy < (s / 2) * (s / 2)) maxInfluence = 1.0;
            }

            if (maxInfluence < 1.0 && hoverTrailAmount > 0) {
              for (const node of trail) {
                const dx = node.x - centerX;
                const dy = node.y - centerY;
                if (dx * dx + dy * dy < (s / 2) * (s / 2)) {
                  if (node.intensity > maxInfluence) maxInfluence = node.intensity;
                }
              }
            }

            drawTriangle(ctx, centerX, centerY, s);

            if (maxInfluence > 0) {
              ctx.save();
              ctx.globalAlpha = maxInfluence * 0.9;
              ctx.fillStyle = hoverFillColor;
              ctx.fill();
              ctx.restore();
            }

            ctx.save();
            ctx.strokeStyle = borderColor;
            ctx.globalAlpha = 0.07;
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.restore();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('touchend', handleMouseLeave);
    };
  }, [
    speed,
    squareSize,
    direction,
    borderColor,
    hoverFillColor,
    shape,
    hoverTrailAmount,
  ]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 h-full w-full pointer-events-none z-0 ${className}`}
      style={{
        display: 'block',
      }}
    />
  );
};

export default ShapeGrid;
