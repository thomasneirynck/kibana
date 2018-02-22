import React, { Fragment } from 'react';

export const Snapshot = ({ isSnapshot, repo, snapshot }) => {
  return isSnapshot ? (
    <Fragment>
      Repo: {repo} / Snapshot: {snapshot}
    </Fragment>
  ) : null;
};
