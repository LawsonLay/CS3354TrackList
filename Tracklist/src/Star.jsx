import React from 'react';

const Star = ({ filled, onClick }) => {
  return (
    <span onClick={onClick} style={{ cursor: 'pointer', color: filled ? 'gold' : 'gray' }}>
      ★
    </span>
  );
};

export default Star;