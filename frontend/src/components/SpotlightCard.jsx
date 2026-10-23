import React, { useState } from 'react';

// Crisp Jet Black Card with distinct Plum border accent and Peach interactive glow
export const SpotlightCard = ({ 
  children, 
  className = '', 
  accentColor = '#00f0ff', // Plum structural border
  spotlightGlow = 'rgba(0, 240, 255, 0.14)', // Peach interactive hover
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
        border: '1px solid rgba(0, 240, 255, 0.2)', // Discrete plum border line
        backgroundColor: '#050407', // Jet black pure core
        backdropFilter: 'blur(20px)',
        overflow: 'hidden',
        boxShadow: isHovered 
          ? '0 16px 45px -10px rgba(0, 0, 0, 0.95), 0 0 25px rgba(0, 240, 255, 0.18)' 
          : '0 8px 30px rgba(0, 0, 0, 0.85)',
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
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
          transition: 'opacity 0.3s ease',
          background: `radial-gradient(circle 360px at ${position.x}px ${position.y}px, ${spotlightGlow}, transparent 75%)`,
          zIndex: 1
        }}
      />
      <div style={{ position: 'relative', zIndex: 2 }}>{children}</div>
    </div>
  );
};
