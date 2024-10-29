import React from 'react';

const Star = ({ filled, hovered, onClick, onMouseEnter, onMouseLeave }) => {
  return (
    <span 
      onClick={onClick} 
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ 
        cursor: 'pointer', 
        color: filled ? 'gold' : hovered ? 'rgba(255, 215, 0, 0.5)' : 'gray',
        textShadow: '0 0 2px black',
        }}
    >
      ★
    </span>
  );
};

export default Star;