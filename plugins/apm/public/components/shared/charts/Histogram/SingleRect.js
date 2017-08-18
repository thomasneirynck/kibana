import React from 'react';
import PropTypes from 'prop-types';

function SingleRect({ innerHeight, marginTop, style, x, width }) {
  return (
    <g transform={`translate(0, ${marginTop})`}>
      <rect
        style={style}
        height={innerHeight}
        width={width}
        rx={'2px'}
        ry={'2px'}
        x={x}
      />
    </g>
  );
}

SingleRect.requiresSVG = true;
SingleRect.propTypes = {
  x: PropTypes.number.isRequired
};

export default SingleRect;
