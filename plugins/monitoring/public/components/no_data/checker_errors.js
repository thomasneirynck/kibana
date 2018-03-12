import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import {
  EuiTitle,
  EuiTextColor,
  EuiIcon,
  EuiFlexGroup,
  EuiFlexItem
} from '@elastic/eui';

const ErrorList = ({ errors }) => {
  return errors.map((error, errorIndex) => {
    const { message, statusCode, error: friendlyName } = error;
    return (
      <div key={`checker-error-${errorIndex}`}>
        <EuiTextColor color="danger">
          <EuiFlexGroup alignItems="center" gutterSize="s">
            <EuiFlexItem grow={false}>
              <EuiIcon type="alert" color="danger" aria-label="alert" />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              {statusCode} {friendlyName}
            </EuiFlexItem>
            <EuiFlexItem grow={false}>{message}</EuiFlexItem>
          </EuiFlexGroup>
        </EuiTextColor>
      </div>
    );
  });
};

export function CheckerErrors(props) {
  if (props.errors === undefined || props.errors.length === 0) {
    return null;
  }

  return (
    <Fragment>
      <EuiTitle size="s">
        <h2>Errors</h2>
      </EuiTitle>

      <p>
        There were some errors encountered in trying to check Elasticsearch
        settings. You need administrator rights to check the settings and, if
        needed, to enable the monitoring collection setting.
      </p>

      <ErrorList {...props} />
    </Fragment>
  );
}

CheckerErrors.propTypes = {
  errors: PropTypes.array
};
