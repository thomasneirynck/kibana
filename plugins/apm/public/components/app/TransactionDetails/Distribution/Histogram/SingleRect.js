import React from 'react';
import PropTypes from 'prop-types';

function SingleRect({
  innerWidth,
  onClick,
  innerHeight,
  numberOfBuckets,
  marginLeft,
  marginTop,
  style,
  x
}) {
  const bucketWidth = innerWidth / numberOfBuckets;
  return (
    <g
      transform={`translate(${marginLeft}, ${marginTop})`}
      onClick={() => onClick && onClick(x)}
    >
      <rect
        style={style}
        height={innerHeight}
        width={bucketWidth}
        rx={'2px'}
        ry={'2px'}
        x={x * bucketWidth}
      />
    </g>
  );
}

SingleRect.requiresSVG = true;

SingleRect.propTypes = {
  numberOfBuckets: PropTypes.number.isRequired,
  marginLeft: PropTypes.number.isRequired,
  x: PropTypes.number.isRequired
};

export default SingleRect;
