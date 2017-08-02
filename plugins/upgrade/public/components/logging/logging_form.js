import classNames from 'classnames';
import React from 'react';


export function LoggingForm({ className, isLoggingEnabled, onToggleLoggingEnabled }) {
  const classes = classNames('kuiCheckBoxLabel', 'kuiVerticalRhythm', className);

  return (
    <label className={ classes }>
      <input
        checked={ isLoggingEnabled }
        className="kuiCheckBox"
        onChange={ onToggleLoggingEnabled }
        type="checkbox"
      />
      <span className="kuiCheckBoxLabel__text">
        Enable Deprecation Logging
      </span>
    </label>
  );
}

LoggingForm.propTypes = {
  className: React.PropTypes.string,
  isLoggingEnabled: React.PropTypes.bool,
  onToggleLoggingEnabled: React.PropTypes.func,
};

LoggingForm.defaultProps = {
  className: '',
  isLoggingEnabled: false,
  onToggleLoggingEnabled: () => {},
};
