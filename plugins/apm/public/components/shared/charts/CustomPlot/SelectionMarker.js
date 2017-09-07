import React from 'react';
import PropTypes from 'prop-types';

function DragMarker({ innerHeight, marginTop, start, end }) {
  const width = Math.abs(end - start);
  const x = start < end ? start : end;
  return (
    <rect
      pointerEvents="none"
      fill="black"
      opacity="0.2"
      x={x}
      y={marginTop}
      width={width}
      height={innerHeight}
    />
  );
}

DragMarker.requiresSVG = true;
DragMarker.propTypes = {
  start: PropTypes.number,
  end: PropTypes.number
};

export default DragMarker;
