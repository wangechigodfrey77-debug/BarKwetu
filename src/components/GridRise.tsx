import React, { useEffect, useRef } from 'react';

export interface GridRiseProps {
  /** Size of each grid block in 3D space */
  gridSize?: number;
  /** Height multiplier for tile elevations */
  liftHeight?: number;
  /** Wave oscillation speed */
  speed?: number;
  /** Radius of cursor mouse influence */
  mouseRadius?: number;
  /** Primary accent highlight color (Hex or RGB array) */
  accentColor?: string;
  /** Base tile color */
  baseColor?: string;
  /** Ambient tile background color */
  backgroundColor?: string;
  /** Overall opacity */
  opacity?: number;
  /** Additional CSS classes */
  className?: string;
  /** Enable or disable cursor interaction */
  interactive?: boolean;
}

export const GridRise: React.FC<GridRiseProps> = ({
  gridSize = 1.0,
  liftHeight = 1.2,
  speed = 1.0,
  mouseRadius = 2.5,
  accentColor = '#d4af37',
  baseColor = '#161822',
  backgroundColor = '#090a0d',
  opacity = 0.65,
  className = '',
  interactive = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', {
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });

    if (!gl) {
      console.warn('WebGL not supported for GridRise component');
      return;
    }

    // Helper: Hex to RGB 0..1
    const hexToRgb = (hex: string): [number, number, number] => {
      let c = hex.replace('#', '');
      if (c.length === 3) c = c.split('').map((x) => x + x).join('');
      const num = parseInt(c, 16);
      return [((num >> 16) & 255) / 255, ((num >> 8) & 255) / 255, (num & 255) / 255];
    };

    const accentRgb = hexToRgb(accentColor);
    const baseRgb = hexToRgb(baseColor);
    const bgRgb = hexToRgb(backgroundColor);

    // Vertex Shader
    const vsSource = `
      attribute vec2 a_position;
      varying vec2 v_uv;
      void main() {
        v_uv = (a_position + 1.0) * 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    // Fragment Shader: Raymarched Grid Elevation & Tile Field
    const fsSource = `
      precision highp float;
      uniform vec2 u_resolution;
      uniform float u_time;
      uniform vec2 u_mouse;
      uniform float u_gridSize;
      uniform float u_liftHeight;
      uniform float u_mouseRadius;
      uniform vec3 u_accentColor;
      uniform vec3 u_baseColor;
      uniform vec3 u_bgColor;
      uniform float u_opacity;

      varying vec2 v_uv;

      // 2D Rotation matrix
      mat2 rot2D(float a) {
        float c = cos(a), s = sin(a);
        return mat2(c, -s, s, c);
      }

      // Elevation height field function
      float getHeight(vec2 p, vec2 mousePos, float time) {
        // Base rhythmic ambient ripples
        float wave1 = sin(p.x * 0.45 + time * 1.2) * cos(p.y * 0.45 + time * 0.9);
        float wave2 = sin((p.x + p.y) * 0.25 - time * 0.7) * 0.6;
        float wave3 = cos(length(p * 0.3) - time * 1.5) * 0.4;
        float h = (wave1 + wave2 + wave3) * 0.35;

        // Interactive mouse lift & ripple
        float dMouse = length(p - mousePos);
        float mouseLift = exp(-pow(dMouse / max(u_mouseRadius, 0.1), 2.0));
        float mouseRipple = sin(max(0.0, dMouse * 3.5 - time * 4.0)) * exp(-dMouse * 0.5) * 0.4;
        
        h += (mouseLift * 1.4 + mouseRipple) * u_liftHeight;
        return max(0.0, h);
      }

      // Signed distance function to a single box
      float sdBox(vec3 p, vec3 b, float r) {
        vec3 q = abs(p) - b;
        return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r;
      }

      // Map entire 3D scene
      vec4 mapScene(vec3 p, vec2 mousePos, float time) {
        float gSize = u_gridSize;
        vec2 gridIndex = floor(p.xz / gSize);
        vec2 tileCenter = (gridIndex + 0.5) * gSize;
        
        float h = getHeight(tileCenter, mousePos, time);
        
        // Relative coordinates inside the tile cell
        vec3 localP = p;
        localP.xz = mod(p.xz, gSize) - (gSize * 0.5);
        
        // Box half-extents
        float halfW = (gSize * 0.45);
        float halfH = max(0.08, h * 0.5);
        vec3 b = vec3(halfW, halfH, halfW);
        
        // Offset Y so box sits on ground plane
        localP.y -= halfH;
        
        float d = sdBox(localP, b, 0.02);
        
        return vec4(d, h, gridIndex.x, gridIndex.y);
      }

      // Calculate Normal
      vec3 calcNormal(vec3 p, vec2 mousePos, float time) {
        vec2 e = vec2(0.002, 0.0);
        float d = mapScene(p, mousePos, time).x;
        vec3 n = d - vec3(
          mapScene(p - e.xyy, mousePos, time).x,
          mapScene(p - e.yxy, mousePos, time).x,
          mapScene(p - e.yyx, mousePos, time).x
        );
        return normalize(n);
      }

      void main() {
        vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / min(u_resolution.x, u_resolution.y);

        // Isometric Camera Setup
        vec3 ro = vec3(0.0, 7.5, -9.0);
        vec3 target = vec3(0.0, 0.0, 0.0);

        // Tilt and track slightly with mouse
        ro.xz *= rot2D(u_mouse.x * 0.15 + 0.35);

        vec3 fwd = normalize(target - ro);
        vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), fwd));
        vec3 up = cross(fwd, right);
        vec3 rd = normalize(fwd * 1.6 + uv.x * right + uv.y * up);

        // Raymarch
        float t = 0.5;
        float maxD = 32.0;
        vec4 hitData = vec4(100.0);
        vec3 p = ro;
        bool hit = false;

        for (int i = 0; i < 64; i++) {
          p = ro + rd * t;
          hitData = mapScene(p, u_mouse, u_time);
          float d = hitData.x;
          if (d < 0.003) {
            hit = true;
            break;
          }
          if (t > maxD) break;
          t += d * 0.75;
        }

        vec3 color = u_bgColor;

        if (hit) {
          vec3 n = calcNormal(p, u_mouse, u_time);
          vec3 lightDir = normalize(vec3(1.0, 2.5, -1.5));
          
          float diff = max(dot(n, lightDir), 0.0);
          float spec = pow(max(dot(reflect(-lightDir, n), -rd), 0.0), 32.0);
          
          // Edge and height accent
          float heightFactor = clamp(hitData.y / (u_liftHeight * 1.5 + 0.5), 0.0, 1.0);
          
          // Fresnel rim lighting
          float fresnel = pow(1.0 - max(dot(-rd, n), 0.0), 3.0);

          // Grid wireframe highlight effect on top bevels
          vec3 tileColor = mix(u_baseColor, u_accentColor * 1.2, heightFactor * 0.75);
          
          // Top face luminance boost
          if (n.y > 0.8) {
            tileColor += u_accentColor * (0.15 + heightFactor * 0.35);
          }

          vec3 finalColor = tileColor * (0.35 + 0.65 * diff) + (spec * 0.45 * u_accentColor) + (fresnel * 0.5 * u_accentColor);

          // Distance fog fading into deep darkness
          float fog = smoothstep(6.0, maxD - 2.0, t);
          color = mix(finalColor, u_bgColor, fog);
        } else {
          // Subtle background grid glow
          float bgGlow = max(0.0, 1.0 - length(uv) * 1.1) * 0.12;
          color += u_accentColor * bgGlow;
        }

        gl_FragColor = vec4(color, u_opacity);
      }
    `;

    // Compile Shader Helper
    const createShader = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('GridRise Shader Error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vs = createShader(gl.VERTEX_SHADER, vsSource);
    const fs = createShader(gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('GridRise Program Link Error:', gl.getProgramInfoLog(program));
      return;
    }

    // Geometry: Fullscreen Quad
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const aPosition = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    // Uniform Locations
    const uResolution = gl.getUniformLocation(program, 'u_resolution');
    const uTime = gl.getUniformLocation(program, 'u_time');
    const uMouse = gl.getUniformLocation(program, 'u_mouse');
    const uGridSize = gl.getUniformLocation(program, 'u_gridSize');
    const uLiftHeight = gl.getUniformLocation(program, 'u_liftHeight');
    const uMouseRadius = gl.getUniformLocation(program, 'u_mouseRadius');
    const uAccentColor = gl.getUniformLocation(program, 'u_accentColor');
    const uBaseColor = gl.getUniformLocation(program, 'u_baseColor');
    const uBgColor = gl.getUniformLocation(program, 'u_bgColor');
    const uOpacity = gl.getUniformLocation(program, 'u_opacity');

    // State
    let animationFrameId: number;
    let startTime = performance.now();
    let targetMouse = { x: 0, y: 0 };
    let currentMouse = { x: 0, y: 0 };

    const handleResize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = canvas.parentElement ? canvas.parentElement.clientWidth : window.innerWidth;
      const height = canvas.parentElement ? canvas.parentElement.clientHeight : window.innerHeight;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      const rect = canvas.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetMouse.x = nx * 5.0;
      targetMouse.y = ny * 5.0;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!interactive || e.touches.length === 0) return;
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const nx = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((touch.clientY - rect.top) / rect.height) * 2 - 1);
      targetMouse.x = nx * 5.0;
      targetMouse.y = ny * 5.0;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    // Render Loop
    const render = () => {
      const elapsedTime = (performance.now() - startTime) * 0.001 * speed;

      // Smooth mouse lerp
      currentMouse.x += (targetMouse.x - currentMouse.x) * 0.08;
      currentMouse.y += (targetMouse.y - currentMouse.y) * 0.08;

      gl.useProgram(program);

      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform1f(uTime, elapsedTime);
      gl.uniform2f(uMouse, currentMouse.x, currentMouse.y);
      gl.uniform1f(uGridSize, gridSize);
      gl.uniform1f(uLiftHeight, liftHeight);
      gl.uniform1f(uMouseRadius, mouseRadius);
      gl.uniform3f(uAccentColor, accentRgb[0], accentRgb[1], accentRgb[2]);
      gl.uniform3f(uBaseColor, baseRgb[0], baseRgb[1], baseRgb[2]);
      gl.uniform3f(uBgColor, bgRgb[0], bgRgb[1], bgRgb[2]);
      gl.uniform1f(uOpacity, opacity);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(positionBuffer);
    };
  }, [
    gridSize,
    liftHeight,
    speed,
    mouseRadius,
    accentColor,
    baseColor,
    backgroundColor,
    opacity,
    interactive,
  ]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      style={{ display: 'block' }}
    />
  );
};

export default GridRise;
