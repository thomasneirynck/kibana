import _ from 'lodash';
import React from 'react';
import { STEP_RESULTS } from '../constants';
import { ERR_CODES } from '../../../common/constants';

const messages = {};
messages.REINDEX = {};
messages.REINDEX.COMPLETED = {
  CREATE_INDEX:  () => 'Created new index.',
  SET_READONLY:  () => 'Made old index read-only.',
  REINDEX:       (extra) => {
    return <span>Completed reindex task <code>{ extra.taskId }</code></span>;
  },
  REFRESH_INDEX: () => 'Refreshed index.',
  VERIFY_DOCS:   () => 'Document counts are equal in old and new indices.',
  REPLACE_INDEX: () => 'Replaced old index with new index.',
};

messages.REINDEX.FAILED = {
  CREATE_INDEX: (error) => {
    if (error.code === ERR_CODES.ERR_INDEX_EXISTS) {
      return (
        <span>
          Index <code>{ error.reindexedIndexName }</code> already exists.
          There may be an unfinished task reindexing to this index,
          or this index may have not been cleaned up previously.
        </span>
      );
    }

    if (error.code === ERR_CODES.ERR_MAPPER_PARSING_EXCEPTION) {
      return <span>Edit your mappings for this index before proceeding.</span>;
    }

    return <span>Failed to create index.</span>;
  },


  SET_READONLY: () => {
    return <span>Failed to set index read-only.</span>;
  },


  REINDEX: (error) => {
    if (error.code === ERR_CODES.ERR_GET_TASK_FAILED) {
      return <span>Failed to get task details for <code>{ error.taskId }</code>.</span>;
    }

    return <span>Failed to reindex index.</span>;
  },


  REFRESH_INDEX: () => {
    return <span>Failed to refresh index.</span>;
  },


  VERIFY_DOCS: () => {
    return <span>Failed to verify document counts in old and new indices.</span>;
  },


  REPLACE_INDEX: () => {
    return <span>Failed to replace old index with new index.</span>;
  },
};

messages.REINDEX.RUNNING = {
  CREATE_INDEX:  () => 'Creating new index',
  SET_READONLY:  () => 'Making old index read-only',
  REINDEX:       (extra) => <span>Reindexing with task <code>{ extra.taskId }</code>.</span>,
  REFRESH_INDEX: () => 'Refreshing index.',
  VERIFY_DOCS:   () => 'Verifying equal document counts in old and new indices',
  REPLACE_INDEX: () => 'Replacing old index with new index',
};

messages.UPGRADE = {};
messages.UPGRADE.COMPLETED = {
  UPGRADE: () => 'Upgraded index.',
};

messages.UPGRADE.FAILED = {
  UPGRADE: (error) => {
    if (error.code === ERR_CODES.ERR_GET_TASK_FAILED) {
      return <span>Failed to get task details for <code>{ error.taskId }</code>.</span>;
    }

    return <span>Failed to upgrade index.</span>;
  },
};

messages.UPGRADE.RUNNING = {
  UPGRADE: (extra) => <span>Upgrading index with task <code>{ extra.taskId }</code>.</span>,
};



export function getStepMessage(actionType, result, stepName, extra) {
  let message;

  if (_.isObject(result)) {
    const errorMessage = messages[actionType][STEP_RESULTS.FAILED][stepName](result);
    message = wrapErrorMessage(errorMessage, result);

  } else {
    message = messages[actionType][result][stepName](extra);
  }

  return message;
}

export function wrapErrorMessage(message, error) {
  return (
    <div>
      <p>{ message }</p>
      <pre>{JSON.stringify(error, null, 2) }</pre>
    </div>
  );
}
