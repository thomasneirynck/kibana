import React from 'react';

import { EuiButton, EuiFlexItem, EuiCard, EuiLink } from '@elastic/eui';

export class StartTrial extends React.PureComponent {
  componentWillMount() {
    this.props.loadTrialStatus();
  }
  render() {
    const { shouldShowStartTrial } = this.props;
    if (!shouldShowStartTrial) {
      return null;
    }
    const description = (
      <span>
        Experience what Security, Machine Learning, and all our other{' '}
        <EuiLink
          href="https://www.elastic.co/subscriptions/xpack"
          target="_blank"
        >
          platinum features
        </EuiLink>{' '}
        have to offer.
      </span>
    );

    const footer = (
      <EuiButton onClick={this.props.startLicenseTrial}>Start trial</EuiButton>
    );
    return (
      <EuiFlexItem>
        <EuiCard
          title="Start a 30-day trial"
          description={description}
          footer={footer}
        />
      </EuiFlexItem>
    );
  }
}
