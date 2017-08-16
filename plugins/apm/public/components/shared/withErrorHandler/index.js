import React from 'react';
import { STATUS } from '../../../constants';
import LoadingError from '../../shared/LoadingError';
import { getDisplayName } from '../HOCUtils';
import { isEmpty } from 'lodash';

function withErrorHandler(WrappedComponent, dataNames) {
  function WithErrorHandler(props) {
    const unavailableNames = dataNames.filter(
      name => props[name].status === STATUS.FAILURE
    );

    if (!isEmpty(unavailableNames)) {
      return <LoadingError names={unavailableNames} />;
    }

    return <WrappedComponent {...props} />;
  }

  WithErrorHandler.displayName = `WithErrorHandler(${getDisplayName(
    WrappedComponent
  )})`;

  return WithErrorHandler;
}

export default withErrorHandler;
