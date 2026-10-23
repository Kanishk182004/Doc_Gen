import React, { useEffect, useRef } from 'react';

/**
 * Aurora & Interactive Waves Background (Inspired by ReactBits.dev)
 * 
 * Features:
 * 1. High-tech isometric perspective grid with radial horizon fade.
 * 2. Drifting northern-lights Aurora silk ribbons reacting to cursor position.
 * 3. Fluid interactive wave lines that ripple when the mouse moves across the canvas.
 * 4. Zero eye strain: gentle contrast, midnight slate base, soft blue/cyan light.
 */
export const ParticlesBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    let mouse = {
      x: width * 0.5,
      y: height * 0.35,
      targetX: width * 0.5,
      targetY: height * 0.35
    };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);

    let time = 0;

    const render = () => {
      time += 0.012;

      // Smooth mouse interpolation
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      ctx.clearRect(0, 0, width, height);

      // --- Layer 1: ReactBits Ambient Aurora Glow (Atmospheric silk ribbon) ---
      const auroraGradient1 = ctx.createRadialGradient(
        mouse.x,
        mouse.y * 0.8,
        50,
        mouse.x,
        mouse.y * 0.8,
        width * 0.65
      );
      auroraGradient1.addColorStop(0, 'rgba(56, 189, 248, 0.12)'); // Sky Blue glow
      auroraGradient1.addColorStop(0.4, 'rgba(99, 102, 241, 0.06)'); // Indigo aura
      auroraGradient1.addColorStop(1, 'transparent');
      ctx.fillStyle = auroraGradient1;
      ctx.fillRect(0, 0, width, height);

      // Secondary floating aurora orb
      const orbX = width * 0.3 + Math.sin(time * 0.5) * (width * 0.2);
      const orbY = height * 0.25 + Math.cos(time * 0.4) * (height * 0.15);
      const auroraGradient2 = ctx.createRadialGradient(orbX, orbY, 40, orbX, orbY, width * 0.45);
      auroraGradient2.addColorStop(0, 'rgba(129, 140, 248, 0.09)');
      auroraGradient2.addColorStop(1, 'transparent');
      ctx.fillStyle = auroraGradient2;
      ctx.fillRect(0, 0, width, height);

      // --- Layer 2: ReactBits Geometric Perspective Grid ---
      const gridSpacing = 42;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
      ctx.lineWidth = 1;

      // Vertical grid lines
      for (let x = 0; x < width; x += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Horizontal grid lines
      for (let y = 0; y < height; y += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Grid illumination beam tracking the cursor (ReactBits interactive grid highlight)
      const gridBeam = ctx.createRadialGradient(mouse.x, mouse.y, 10, mouse.x, mouse.y, 240);
      gridBeam.addColorStop(0, 'rgba(56, 189, 248, 0.09)');
      gridBeam.addColorStop(1, 'transparent');
      ctx.fillStyle = gridBeam;
      ctx.fillRect(0, 0, width, height);

      // --- Layer 3: ReactBits Organic Sine Waves (Dense flowing silk ribbons) ---
      const waveCount = 5;
      for (let w = 0; w < waveCount; w++) {
        ctx.beginPath();
        const baseHeight = height * 0.65 + w * 28;
        const waveFreq = 0.0022 + w * 0.0004;
        const waveAmp = 38 + w * 12;
        const speed = time * (0.8 + w * 0.2);

        ctx.moveTo(0, baseHeight);
        for (let x = 0; x <= width; x += 12) {
          // Calculate distance to mouse for interactive ripple
          const distToMouse = Math.abs(x - mouse.x);
          const mouseInfluence = Math.max(0, 1 - distToMouse / 220) * 35;
          const yOffset = Math.sin(x * waveFreq + speed) * waveAmp + Math.cos(x * 0.001 - speed) * 15 - mouseInfluence;
          ctx.lineTo(x, baseHeight + yOffset);
        }

        ctx.strokeStyle = `rgba(56, 189, 248, ${0.12 - w * 0.018})`;
        ctx.lineWidth = 1.3;
        ctx.stroke();
      }

      // --- Layer 4: Floating Constellation Particles ---
      const dotCount = 28;
      for (let i = 0; i < dotCount; i++) {
        const pX = (Math.sin(time * 0.25 + i * 1.8) * 0.5 + 0.5) * width;
        const pY = (Math.cos(time * 0.2 + i * 2.3) * 0.5 + 0.5) * height;
        const radius = (Math.sin(time + i) * 0.5 + 0.5) * 1.5 + 1;

        ctx.beginPath();
        ctx.arc(pX, pY, radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 0
      }}
    />
  );
};
