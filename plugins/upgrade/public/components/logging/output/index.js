import React from 'react';

export function LoggingOutput({ output }) {
  return (
    <div className='LoggingOutput'>
      { output }
    </div>
  );
}

LoggingOutput.propTypes = {
  output: React.PropTypes.string,
};

LoggingOutput.defaultProps = {
  output: {},
};
