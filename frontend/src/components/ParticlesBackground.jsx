import React, { useEffect, useRef } from 'react';

// Luxurious Jet Black with Plum & Peach Glitter Sparks and Neural Constellations
export const ParticlesBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Plum & Peach glitter palette
    const colors = [
      { r: 217, g: 70, b: 239, hex: '#d946ef' },  // Vivid Plum / Orchid
      { r: 251, g: 146, b: 60, hex: '#fb923c' },   // Radiant Peach
      { r: 244, g: 114, b: 182, hex: '#f472b6' }, // Peach Blossom Pink
      { r: 168, g: 85, b: 247, hex: '#a855f7' }   // Deep Royal Plum
    ];

    const particles = Array.from({ length: 65 }, () => {
      const color = colors[Math.floor(Math.random() * colors.length)];
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 2.2 + 0.9,
        alpha: Math.random() * 0.65 + 0.25,
        dAlpha: (Math.random() - 0.5) * 0.018,
        color
      };
    });

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Connecting neural filaments in subtle plum-peach
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 135) {
            ctx.beginPath();
            const grad = ctx.createLinearGradient(particles[i].x, particles[i].y, particles[j].x, particles[j].y);
            grad.addColorStop(0, `rgba(${particles[i].color.r}, ${particles[i].color.g}, ${particles[i].color.b}, ${0.14 * (1 - dist / 135)})`);
            grad.addColorStop(1, `rgba(${particles[j].color.r}, ${particles[j].color.g}, ${particles[j].color.b}, ${0.14 * (1 - dist / 135)})`);
            ctx.strokeStyle = grad;
            ctx.lineWidth = 0.75;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Glittery Plum & Peach stardust sparkles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha += p.dAlpha;
        if (p.alpha > 0.9 || p.alpha < 0.2) p.dAlpha = -p.dAlpha;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${p.alpha})`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color.hex;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
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
