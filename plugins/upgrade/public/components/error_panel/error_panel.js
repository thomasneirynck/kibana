import classNames from 'classnames';
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
  children: React.PropTypes.node,
  classNames: React.PropTypes.string,
  title: React.PropTypes.string,
};

ErrorPanel.defaultProps = {
  children: null,
  classNames: '',
  title: 'An error occurred.',
};
