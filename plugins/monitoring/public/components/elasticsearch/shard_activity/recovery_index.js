import React, { Fragment } from 'react';
import { EuiLink } from '@elastic/eui';
import { Snapshot } from './snapshot';

export const RecoveryIndex = (props) => {
  const { name, shard, relocationType } = props;

  return (
    <Fragment>
      <EuiLink href={`#/elasticsearch/indices/${name}`}>{name}</EuiLink><br />
      Shard: {shard}<br />
      Recovery type: {relocationType}
      <div>
        <Snapshot {...props} />
      </div>
    </Fragment>
  );
};
