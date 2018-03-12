import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import {
  EuiCode,
  EuiButton,
  EuiFlexGroup,
  EuiFlexItem,
  EuiLoadingSpinner
} from '@elastic/eui';

const WaitingIndicator = ({ isCollectionEnabledUpdating }) => {
  return isCollectionEnabledUpdating ? <EuiLoadingSpinner size="m" /> : null;
};

export class ExplainCollectionEnabled extends React.Component {
  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick() {
    const { enabler } = this.props;
    enabler.enableCollectionEnabled();
  }

  render() {
    const {
      context,
      property,
      data,
      isCollectionEnabledUpdated,
      isCollectionEnabledUpdating
    } = this.props;

    const renderButton = () => (
      <EuiFlexGroup alignItems="center" gutterSize="s">
        <EuiFlexItem grow={false}>
          <EuiButton
            fill={true}
            onClick={this.handleClick}
            type="button"
            data-test-subj="enableCollectionEnabled"
          >
            Enable Monitoring Collection
          </EuiButton>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <WaitingIndicator
            isCollectionEnabledUpdating={isCollectionEnabledUpdating}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    );
    const renderSuccess = () => (
      <Fragment>
        <p>
          Success! An acknowledgement came back from Elasticsearch that the
          setting was set in the cluster&apos;s persistent settings.
        </p>
        <p>
          You&apos;ll need to wait just few moments for monitoring data to start
          to appear in the cluster. As soon as as that happens, this page will
          automatically redirect to your cluster information.
        </p>
      </Fragment>
    );

    // prettier-ignore
    return (
      <Fragment>
        <p>
          We checked the {context} settings and found that <EuiCode>{property}</EuiCode>
          is set to <EuiCode>{data}</EuiCode>, which disables Monitoring.
        </p>
        <p>
          Monitoring is now disabled by default since it comes installed
          automatically. Not to worry! You can enable it right here.
        </p>

        {isCollectionEnabledUpdated ? renderSuccess() : renderButton()}
      </Fragment>
    );
  }
}

ExplainCollectionEnabled.propTypes = {
  enabler: PropTypes.object.isRequired,
  context: PropTypes.string.isRequired,
  property: PropTypes.string.isRequired,
  data: PropTypes.string.isRequired,
  isCollectionEnabledUpdated: PropTypes.bool,
  isCollectionEnabledUpdating: PropTypes.bool
};
