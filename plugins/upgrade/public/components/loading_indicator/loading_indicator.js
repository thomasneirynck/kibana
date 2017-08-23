import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';


export function LoadingIndicator({ className }) {
  const classes = classNames('kuiText', className);

  return (
    <div className={ classes }>
      <span className="kuiStatusText">
        <span className="kuiStatusText__icon kuiIcon fa-spinner fa-spin" />
        Loading...
      </span>
    </div>
  );
}

LoadingIndicator.propTypes = {
  classNames: PropTypes.string,
};

LoadingIndicator.defaultProps = {
  classNames: '',
};
