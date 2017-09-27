import React from 'react';

export function Icon({ name, style }) {
  return <i style={style} className={`fa ${name}`} />;
}

export function Ellipsis({ horizontal, style }) {
  return (
    <Icon
      style={{
        transition: 'transform 0.1s',
        transform: `rotate(${horizontal ? 90 : 0}deg)`,
        ...style
      }}
      name="fa-ellipsis-v"
    />
  );
}
