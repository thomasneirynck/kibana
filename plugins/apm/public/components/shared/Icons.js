import React from 'react';
import { px, units } from '../../style/variables';

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

export function Info({ style }) {
  return (
    <Icon
      style={{
        marginRight: `${px(units.half)}`,
        ...style
      }}
      name="fa-info-circle"
    />
  );
}
