import PropTypes from 'prop-types';
import React from 'react';

export function LoggingInfo({ className }) {
  return (
    <div className={className}>
      <p className="kuiText kuiVerticalRhythm">
        Deprecation logging is enabled by default in Elasticsearch 5.0+.
      </p>
    </div>
  );
}

LoggingInfo.propTypes = {
  className: PropTypes.string,
};

LoggingInfo.defaultProps = {
  className: '',
};
