import React, { Component } from 'react';
import classNames from 'classnames';

const defaultIconClasses = ['kuiToggleButton__icon', 'kuiIcon'];

export class ToggleButton extends Component {
  constructor(props) {
    super(props);

    this.state = {
      collapsed: true
    };

    this.toggle = this.toggle.bind(this);
  }

  toggle() {
    this.setState((prevState) => ({
      collapsed: !prevState.collapsed
    }));
    this.props.onClick();
  }

  render() {
    const { children } = this.props;
    const { collapsed } = this.state;

    const iconClassName = classNames(defaultIconClasses, collapsed ? 'fa-caret-right' : 'fa-caret-down');

    return (
      <button className='kuiToggleButton' onClick={ this.toggle }>
        <span className={ iconClassName } />
        { children }
      </button>
    );
  }
}
