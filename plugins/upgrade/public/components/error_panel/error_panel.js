import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';


export function ErrorPanel({ children, className, title }) {
  const classes = classNames('kuiInfoPanel', 'kuiInfoPanel--error', className);

  return (
    <div className={ classes }>
      <div className="kuiInfoPanelHeader">
        <span className="kuiInfoPanelHeader__icon kuiIcon kuiIcon--error fa-warning" />
        <span className="kuiInfoPanelHeader__title">
          { title }
        </span>
      </div>

      <div className="kuiInfoPanelBody">
        <div className="kuiInfoPanelBody__message">
          { children }
        </div>
      </div>
    </div>
  );
}

ErrorPanel.propTypes = {
  children: PropTypes.node,
  classNames: PropTypes.string,
  title: PropTypes.string,
};

ErrorPanel.defaultProps = {
  children: null,
  classNames: '',
  title: 'An error occurred.',
};
