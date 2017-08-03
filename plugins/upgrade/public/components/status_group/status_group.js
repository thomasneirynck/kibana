import React, { Component } from 'react';
import classNames from 'classnames';


export class StatusGroup extends Component {
  static propTypes = {
    children: React.PropTypes.node,
    className: React.PropTypes.string,
    isInitiallyCollapsed: React.PropTypes.bool,
    status: React.PropTypes.node,
    title: React.PropTypes.node,
  }

  static defaultProps = {
    children: null,
    className: null,
    isInitiallyCollapsed: false,
    status: null,
    title: null,
  }

  constructor(props) {
    super(props);

    this.state = {
      isCollapsed: props.isInitiallyCollapsed,
    };
  }

  toggleIsCollapsed = () => {
    this.setState(({ isCollapsed }) => ({
      isCollapsed: !isCollapsed,
    }));
  }

  render() {
    const { children, className, status, title } = this.props;
    const { isCollapsed } = this.state;

    const toggleIconClasses = classNames('kuiIcon', 'kuiToggleButton__icon', {
      'fa-caret-right': isCollapsed,
      'fa-caret-down': !isCollapsed,
    });

    return (
      <div className={ className }>
        <div className="kuiTogglePanelHeader">
          <button className="kuiToggleButton" onClick={ this.toggleIsCollapsed }>
            <span className="upgradePluginPanelHeader">
              <span>
                <span className={ toggleIconClasses } />
                { title }
              </span>
              <span>
                { status }
              </span>
            </span>
          </button>
        </div>
        {
          isCollapsed
            ? null
            : <div className="kuiTogglePanelContent">{children}</div>
        }
      </div>
    );
  }
}
