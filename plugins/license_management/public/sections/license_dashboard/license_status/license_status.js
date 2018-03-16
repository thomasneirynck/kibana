import React from 'react';

import {
  EuiIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  EuiTitle,
  EuiSpacer
} from '@elastic/eui';

export class LicenseStatus extends React.PureComponent {
  render() {
    const { isExpired, status, type, expiryDate } = this.props;
    let icon;
    let title;
    let message;
    if (status === 'Active') {
      icon = <EuiIcon color="success" type="checkInCircleFilled" />;
      message = expiryDate ? (
        <span>
          Your license will expire on <strong>{expiryDate}</strong>
        </span>
      ) : (
        <span>
        Your license will never expire.
        </span>
      );
      title = `Your ${type} license is ${status.toLowerCase()}`;
    } else if(isExpired) {
      icon = <EuiIcon color="danger" type="alert" />;
      message = (
        <span>
          Your license expired on <strong>{expiryDate}</strong>
        </span>
      );
      title = `Your ${type} license has expired`;
    }
    return (
      <div>
        <EuiFlexGroup
          justifyContent="spaceAround"
          alignItems="center"
          gutterSize="s"
        >
          <EuiFlexItem grow={false}>
            {icon}
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiTitle size="l">
              <h2>
                {title}
              </h2>
            </EuiTitle>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiFlexGroup justifyContent="spaceAround">
          <EuiFlexItem grow={false}>
            <EuiText color="subdued">{message}</EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer />
      </div>
    );
  }
}
