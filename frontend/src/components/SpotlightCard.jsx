import React, { useState } from 'react';

// Luxurious Jet Black with Plum & Peach Spotlight Glow
export const SpotlightCard = ({ 
  children, 
  className = '', 
  spotlightColor = 'rgba(217, 70, 239, 0.15)', // Plum glow
  secondarySpotlight = 'rgba(251, 146, 60, 0.12)', // Peach glow
  style = {} 
}) => {
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
        border: '1px solid rgba(217, 70, 239, 0.15)',
        backgroundColor: '#070509', // Deep Jet Black with subtle plum undertone
        backdropFilter: 'blur(20px)',
        overflow: 'hidden',
        boxShadow: isHovered 
          ? '0 16px 45px -10px rgba(0, 0, 0, 0.9), 0 0 30px rgba(217, 70, 239, 0.18), 0 0 15px rgba(251, 146, 60, 0.12)' 
          : '0 8px 30px rgba(0, 0, 0, 0.75)',
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
          background: `radial-gradient(circle 380px at ${position.x}px ${position.y}px, ${spotlightColor}, ${secondarySpotlight} 40%, transparent 80%)`,
          zIndex: 1
        }}
      />
      <div style={{ position: 'relative', zIndex: 2 }}>{children}</div>
    </div>
  );
};
