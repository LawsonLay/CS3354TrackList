import React from 'react';

const Star = ({ filled, hovered, onClick, onMouseEnter, onMouseLeave, interactive = true }) => {
  return (
    <span 
      onClick={interactive ? onClick : undefined} 
      onMouseEnter={interactive ? onMouseEnter : undefined}
      onMouseLeave={interactive ? onMouseLeave : undefined}
      style={{ 
        cursor: interactive ? 'pointer' : 'default', 
        color: filled ? 'gold' : hovered ? 'rgba(255, 215, 0, 0.5)' : 'gray',
        textShadow: '0 0 2px black',
      }}
    >
      ★
    </span>
  );
};

export default Star;