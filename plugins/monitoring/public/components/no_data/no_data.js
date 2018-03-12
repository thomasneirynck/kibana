import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { EuiTitle, EuiSpacer, EuiText } from '@elastic/eui';
import { CheckingSettings } from './checking_settings';
import { ReasonFound, WeTried } from './reasons';
import { CheckerErrors } from './checker_errors';

function NoDataBody(props) {
  const { isLoading, reason, checkMessage } = props;

  if (isLoading && checkMessage !== null) {
    return <CheckingSettings checkMessage={checkMessage} />;
  }

  if (reason) {
    return <ReasonFound {...props} />;
  }

  return <WeTried />;
}

export function NoData(props) {
  return (
    <Fragment>
      <EuiTitle size="l">
        <h1>No Monitoring Data Found</h1>
      </EuiTitle>
      <EuiSpacer size="m" />
      <EuiText>
        <NoDataBody {...props} />
      </EuiText>
      <EuiSpacer size="l" />
      <EuiText>
        <CheckerErrors errors={props.errors} />
      </EuiText>
    </Fragment>
  );
}

NoData.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  reason: PropTypes.object,
  checkMessage: PropTypes.string
};
