import classNames from 'classnames';
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
  children: React.PropTypes.node,
  className: React.PropTypes.string,
  isCollapsed: React.PropTypes.bool,
  onChangeCollapsed: React.PropTypes.func,
  title: React.PropTypes.node,
};

InfoGroup.defaultProps = {
  children: null,
  className: '',
  isCollapsed: false,
  onChangeCollapsed: () => {},
  title: null,
};
