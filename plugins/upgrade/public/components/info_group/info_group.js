import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';


export function InfoGroup({
  children,
  className,
  isCollapsed,
  onChangeCollapsed,
  title,
}) {
  const infoToggleClasses = classNames('kuiIcon', {
    'fa-chevron-circle-down': isCollapsed,
    'fa-chevron-circle-up': !isCollapsed,
  });

  return (
    <div className={ className }>
      <div className="kuiBar kuiVerticalRhythm">
        <div className="kuiBarSection">
          <h2 className='kuiTitle'>{ title }</h2>
        </div>
        <div className="kuiBarSection">
          <button className="kuiCollapseButton" onClick={ onChangeCollapsed }>
            <div className={ infoToggleClasses } />
          </button>
        </div>
      </div>

      { isCollapsed ? null : children }
    </div>
  );
}

InfoGroup.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  isCollapsed: PropTypes.bool,
  onChangeCollapsed: PropTypes.func,
  title: PropTypes.node,
};

InfoGroup.defaultProps = {
  children: null,
  className: '',
  isCollapsed: false,
  onChangeCollapsed: () => {},
  title: null,
};
