import React from 'react';
import { STATUS } from '../../../constants';
import LoadingError from '../../shared/LoadingError';
import { getDisplayName } from '../HOCUtils';

function withErrorHandler(WrappedComponent, dataNames) {
  function WithErrorHandler(props) {
    const anyDataUnavailable = dataNames.some(
      name => props[name].status === STATUS.FAILURE
    );

    if (anyDataUnavailable) {
      return <LoadingError />;
    }

    return <WrappedComponent {...props} />;
  }

  WithErrorHandler.displayName = `WithErrorHandler(${getDisplayName(
    WrappedComponent
  )})`;

  return WithErrorHandler;
}

export default withErrorHandler;
