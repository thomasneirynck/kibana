import React from 'react';

export function LoggingInfo({ className }) {
  return (
    <div className={ className }>
      <p className="kuiText kuiVerticalRhythm">
        Deprecation logging is enabled by default, beginning in Elasticsearch 5.
      </p>
      <p className="kuiText kuiVerticalRhythm">
        You can toggle logging here.
      </p>
    </div>
  );
}

LoggingInfo.propTypes = {
  className: React.PropTypes.string,
};

LoggingInfo.defaultProps = {
  className: '',
};
