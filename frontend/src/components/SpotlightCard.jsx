import React, { useState } from 'react';

// Glittery Black-Pink-Emerald Spotlight Card
export const SpotlightCard = ({ children, className = '', spotlightColor = 'rgba(255, 42, 133, 0.18)', style = {} }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'relative',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        backgroundColor: '#0c0d12',
        backdropFilter: 'blur(20px)',
        overflow: 'hidden',
        boxShadow: isHovered 
          ? '0 12px 40px -10px rgba(0, 0, 0, 0.8), 0 0 25px rgba(255, 42, 133, 0.12)' 
          : '0 8px 30px rgba(0, 0, 0, 0.6)',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        ...style
      }}
      className={className}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.35s ease',
          background: `radial-gradient(circle 380px at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 75%)`,
          zIndex: 1
        }}
      />
      <div style={{ position: 'relative', zIndex: 2 }}>{children}</div>
    </div>
  );
};
