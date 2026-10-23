import React, { useState } from 'react';

// Calm, eye-friendly card with soft borders and gentle illumination
export const SpotlightCard = ({ 
  children, 
  className = '', 
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
        border: '1px solid rgba(255, 255, 255, 0.08)',
        backgroundColor: '#0d1117', // Calm GitHub dark background (gentle on eyes)
        overflow: 'hidden',
        boxShadow: isHovered 
          ? '0 12px 35px -5px rgba(0, 0, 0, 0.6), 0 0 15px rgba(56, 189, 248, 0.08)' 
          : '0 4px 20px rgba(0, 0, 0, 0.4)',
        transition: 'all 0.25s ease',
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
          background: `radial-gradient(circle 320px at ${position.x}px ${position.y}px, rgba(56, 189, 248, 0.06), transparent 70%)`,
          zIndex: 1
        }}
      />
      <div style={{ position: 'relative', zIndex: 2 }}>{children}</div>
    </div>
  );
};
