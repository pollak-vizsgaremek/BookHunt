import React, { useEffect, useRef, useCallback } from 'react';
import './ElectricBorder.css';

interface ElectricBorderProps {
  children: React.ReactNode;
  color?: string;
  speed?: number;
  chaos?: number;
  borderRadius?: number;
  className?: string;
  style?: React.CSSProperties;
}

const ElectricBorder: React.FC<ElectricBorderProps> = ({
  children,
  color = '#5227FF',
  speed = 1,
  chaos = 0.12,
  borderRadius = 24,
  className,
  style
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);

  const random = useCallback((x: number) => {
    return (Math.sin(x * 12.9898) * 43758.5453) % 1;
  }, []);

  const noise2D = useCallback((x: number, y: number) => {
    const i = Math.floor(x);
    const j = Math.floor(y);
    const fx = x - i;
    const fy = y - j;
    const a = random(i + j * 57);
    const b = random(i + 1 + j * 57);
    const c = random(i + (j + 1) * 57);
    const d = random(i + 1 + (j + 1) * 57);
    const ux = fx * fx * (3.0 - 2.0 * fx);
    const uy = fy * fy * (3.0 - 2.0 * fy);
    return a * (1 - ux) * (1 - uy) + b * ux * (1 - uy) + c * (1 - ux) * uy + d * ux * uy;
  }, [random]);

  const octavedNoise = useCallback((x: number, octaves: number, lacunarity: number, gain: number, baseAmplitude: number, baseFrequency: number, time: number, seed: number, baseFlatness: number) => {
    let y = 0;
    let amplitude = baseAmplitude;
    let frequency = baseFrequency;
    for (let i = 0; i < octaves; i++) {
      let octaveAmplitude = amplitude;
      if (i === 0) octaveAmplitude *= baseFlatness;
      y += octaveAmplitude * noise2D(frequency * x + seed * 100, time * frequency * 0.3);
      frequency *= lacunarity;
      amplitude *= gain;
    }
    return y;
  }, [noise2D]);

  const getCornerPoint = useCallback((centerX: number, centerY: number, radius: number, startAngle: number, arcLength: number, progress: number) => {
    const angle = startAngle + progress * arcLength;
    return { x: centerX + radius * Math.cos(angle), y: centerY + radius * Math.sin(angle) };
  }, []);

  const getRoundedRectPoint = useCallback((t: number, left: number, top: number, width: number, height: number, radius: number) => {
    const straightWidth = width - 2 * radius;
    const straightHeight = height - 2 * radius;
    const cornerArc = (Math.PI * radius) / 2;
    const totalPerimeter = 2 * straightWidth + 2 * straightHeight + 4 * cornerArc;
    const distance = t * totalPerimeter;
    let accumulated = 0;

    if (distance <= accumulated + straightWidth) return { x: left + radius + (distance - accumulated), y: top };
    accumulated += straightWidth;
    if (distance <= accumulated + cornerArc) return getCornerPoint(left + width - radius, top + radius, radius, -Math.PI / 2, Math.PI / 2, (distance - accumulated) / cornerArc);
    accumulated += cornerArc;
    if (distance <= accumulated + straightHeight) return { x: left + width, y: top + radius + (distance - accumulated) };
    accumulated += straightHeight;
    if (distance <= accumulated + cornerArc) return getCornerPoint(left + width - radius, top + height - radius, radius, 0, Math.PI / 2, (distance - accumulated) / cornerArc);
    accumulated += cornerArc;
    if (distance <= accumulated + straightWidth) return { x: left + width - radius - (distance - accumulated), y: top + height };
    accumulated += straightWidth;
    if (distance <= accumulated + cornerArc) return getCornerPoint(left + radius, top + height - radius, radius, Math.PI / 2, Math.PI / 2, (distance - accumulated) / cornerArc);
    accumulated += cornerArc;
    if (distance <= accumulated + straightHeight) return { x: left, y: top + height - radius - (distance - accumulated) };
    accumulated += straightHeight;
    return getCornerPoint(left + radius, top + radius, radius, Math.PI, Math.PI / 2, (distance - accumulated) / cornerArc);
  }, [getCornerPoint]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = (rect.width + 120) * dpr;
      canvas.height = (rect.height + 120) * dpr;
      canvas.style.width = `${rect.width + 120}px`;
      canvas.style.height = `${rect.height + 120}px`;
      ctx.scale(dpr, dpr);
      return { width: rect.width + 120, height: rect.height + 120 };
    };

    let { width, height } = updateSize();

    const draw = (currentTime: number) => {
      const deltaTime = (currentTime - lastFrameTimeRef.current) / 1000;
      timeRef.current += deltaTime * speed;
      lastFrameTimeRef.current = currentTime;
      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      const borderWidth = width - 120;
      const borderHeight = height - 120;
      const radius = Math.min(borderRadius, Math.min(borderWidth, borderHeight) / 2);
      const sampleCount = Math.floor((2 * (borderWidth + borderHeight) + 2 * Math.PI * radius) / 2);

      ctx.beginPath();
      for (let i = 0; i <= sampleCount; i++) {
        const p = i / sampleCount;
        const pt = getRoundedRectPoint(p, 60, 60, borderWidth, borderHeight, radius);
        const xN = octavedNoise(p * 8, 10, 1.6, 0.7, chaos, 10, timeRef.current, 0, 0);
        const yN = octavedNoise(p * 8, 10, 1.6, 0.7, chaos, 10, timeRef.current, 1, 0);
        const dX = pt.x + xN * 60;
        const dY = pt.y + yN * 60;
        if (i === 0) ctx.moveTo(dX, dY); else ctx.lineTo(dX, dY);
      }
      ctx.closePath();
      ctx.stroke();
      animationRef.current = requestAnimationFrame(draw);
    };

    const ro = new ResizeObserver(() => {
        const size = updateSize();
        width = size.width;
        height = size.height;
    });
    ro.observe(container);
    animationRef.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(animationRef.current); ro.disconnect(); };
  }, [color, speed, chaos, borderRadius, octavedNoise, getRoundedRectPoint]);

  return (
    <div ref={containerRef} className={`electric-border ${className ?? ''}`} style={{ '--electric-border-color': color, borderRadius, ...style } as any}>
      <div className="eb-canvas-container"><canvas ref={canvasRef} className="eb-canvas" /></div>
      <div className="eb-layers">
        <div className="eb-glow-1" /><div className="eb-glow-2" /><div className="eb-background-glow" />
      </div>
      <div className="eb-content">{children}</div>
    </div>
  );
};

export default ElectricBorder;
