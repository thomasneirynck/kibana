import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import {
  EuiCode,
  EuiButton,
  EuiFlexGroup,
  EuiFlexItem,
  EuiLoadingSpinner,
  EuiText,
  EuiSpacer,
  EuiHorizontalRule,
  EuiTitle
} from '@elastic/eui';
import { WhatIs } from '../../blurbs';

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
      <Fragment>
        <WhatIs />
        <EuiHorizontalRule size="half" />
        <EuiText>
          <p>
            We checked the {context} settings and found that <EuiCode>{property}</EuiCode>
            is set to <EuiCode>{data}</EuiCode>.
          </p>
          <p>
            Would you like to turn it on?
          </p>
        </EuiText>
        <EuiSpacer />
        <EuiFlexGroup
          alignItems="center"
          justifyContent="spaceAround"
          gutterSize="s"
        >
          <EuiFlexItem grow={false}>
            <EuiButton
              fill={true}
              onClick={this.handleClick}
              type="button"
              data-test-subj="enableCollectionEnabled"
              isLoading={isCollectionEnabledUpdating}
            >
              Turn on monitoring
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      </Fragment>
    );
    const renderSuccess = () => (
      <Fragment>
        <EuiTitle size="l">
          <h2>Success! Wait a moment please.</h2>
        </EuiTitle>
        <EuiHorizontalRule size="half" />
        <EuiText>
          <p>
            As soon as monitoring data appears in your
            cluster the page will automatically refresh with your monitoring
            dashboard. This only takes a few seconds.
          </p>
        </EuiText>
        <EuiSpacer />
        <EuiLoadingSpinner size="l" />
      </Fragment>
    );

    // prettier-ignore
    return (
      <Fragment>
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
