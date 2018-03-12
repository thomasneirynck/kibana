import React, { Fragment } from 'react';
import { EuiTitle } from '@elastic/eui';

export function WeTried() {
  return (
    <Fragment>
      <EuiTitle size="s">
        <h3>
          We tried looking for the reason that monitoring data is unavailable.
        </h3>
      </EuiTitle>
      <p>
        No Monitoring data could be found for the selected time period, but we
        could not find the cluster setting that makes the data unavailable.
      </p>
      <p>
        There may be data available for a different time period than we have
        selected. Try adjusting the time filter controls to a time range where
        the Monitoring data is expected.
      </p>
      <p>
        We are refreshing the search for data in the background. If cluster data
        is found, we well redirect to the cluster overview page.
      </p>
    </Fragment>
  );
}
