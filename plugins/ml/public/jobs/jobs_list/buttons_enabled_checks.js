/*
 * ELASTICSEARCH CONFIDENTIAL
 *
 * Copyright (c) 2017 Elasticsearch BV. All Rights Reserved.
 *
 * Notice: this software, and all information contained
 * therein, is the exclusive property of Elasticsearch BV
 * and its licensors, if any, and is protected under applicable
 * domestic and foreign law, and international treaties.
 *
 * Reproduction, republication or distribution without the
 * express written consent of Elasticsearch BV is
 * strictly prohibited.
 */

import { JOB_STATE, DATAFEED_STATE } from 'plugins/ml/../common/constants/states';

export function buttonsEnabledChecks(permissions, job, createPermissionFailureMessage, mlNodesAvailable) {
  const NO_ML_NODES_ERROR = 'No ML nodes available';

  function startButtonWrapperClass() {
    return (permissions.canStartStopDatafeed && mlNodesAvailable) ? 'button-wrapper' : ['button-wrapper', 'disabled'];
  }

  function startButtonWrapperTooltip() {
    let tooltip = undefined;
    if (permissions.canStartStopDatafeed === false) {
      tooltip = createPermissionFailureMessage('canStartStopDatafeed');
    } else if (mlNodesAvailable ===  false) {
      tooltip = NO_ML_NODES_ERROR;
    }
    return tooltip;
  }

  function startButtonVisible() {
    return (job.datafeed_config && job.datafeed_config.state !== DATAFEED_STATE.STOPPING &&
      job.datafeed_config.state !== DATAFEED_STATE.STARTING);
  }

  function startButtonTooltip() {
    return `${(job.datafeed_config && job.datafeed_config.state === DATAFEED_STATE.STARTED) ?
      'Stop datafeed for' : 'Start datafeed for'} job.job_id`;
  }

  function startButtonAriaLabel() {
    return `${(job.datafeed_config && job.datafeed_config.state === DATAFEED_STATE.STARTED) ? 'Stop' : 'Start'} datafeed`;
  }

  function startButtonDisabled() {
    return (
      (job.datafeed_config.datafeed_id === undefined || permissions.canStartStopDatafeed === false) ||
      job.state === JOB_STATE.CLOSING ||
      job.state === JOB_STATE.OPENING ||
      job.state === JOB_STATE.FAILED ||
      mlNodesAvailable === false
    );
  }

  function buttonIcon() {
    if (job.datafeed_config && job.datafeed_config.state === DATAFEED_STATE.STARTED && job.state !== JOB_STATE.FAILED) {
      return 'fa fa-stop';
    } else if (job.datafeed_config && job.datafeed_config.state === DATAFEED_STATE.STOPPED &&
      (job.state === JOB_STATE.OPENED || job.state === JOB_STATE.CLOSED)) {
      return 'fa fa-play';
    }else if (job.state === JOB_STATE.FAILED) {
      return 'fa fa-play';
    }else if (job.datafeed_config && job.datafeed_config.state === DATAFEED_STATE.STOPPED &&
      (job.state === JOB_STATE.CLOSING || job.state === JOB_STATE.OPENING)) {
      return 'fa fa-clock-o';
    }else if (job.datafeed_config && job.datafeed_config.state === undefined) {
      return 'fa fa-play';
    }
  }

  function loadingButtonVisible() {
    return (!job.datafeed_config) || (job.datafeed_config.state === DATAFEED_STATE.STOPPING ||
      job.datafeed_config.state === DATAFEED_STATE.STARTING);
  }

  function editButtonWrapperClass() {
    return permissions.canUpdateJob ? 'button-wrapper' : ['button-wrapper', 'disabled'];
  }

  function editButtonWrapperTooltip() {
    return permissions.canUpdateJob ? undefined : createPermissionFailureMessage('canUpdateJob');
  }

  function editButtonDisabled() {
    return permissions.canUpdateJob === false || permissions.canUpdateDatafeed === false;
  }

  function cloneButtonWrapperClass() {
    return (permissions.canCreateJob && mlNodesAvailable) ? 'button-wrapper' : ['button-wrapper', 'disabled'];
  }

  function cloneButtonWrapperTooltip() {
    let tooltip = undefined;
    if (permissions.canCreateJob === false) {
      tooltip = createPermissionFailureMessage('canCreateJob');
    } else if (mlNodesAvailable ===  false) {
      tooltip = NO_ML_NODES_ERROR;
    }
    return tooltip;
  }

  function cloneButtonDisabled() {
    return (permissions.canCreateJob === false || mlNodesAvailable === false);
  }

  function deleteButtonWrapperClass() {
    return permissions.canDeleteJob ? 'button-wrapper' : ['button-wrapper', 'disabled'];
  }

  function deleteButtonWrapperTooltip() {
    return permissions.canDeleteJob ? undefined : createPermissionFailureMessage('canDeleteJob');
  }

  function deleteButtonDisabled() {
    return permissions.canDeleteJob === false;
  }

  return {
    startButtonWrapperClass,
    startButtonWrapperTooltip,
    startButtonVisible,
    startButtonTooltip,
    startButtonAriaLabel,
    startButtonDisabled,
    buttonIcon,
    loadingButtonVisible,
    editButtonWrapperClass,
    editButtonWrapperTooltip,
    editButtonDisabled,
    cloneButtonWrapperClass,
    cloneButtonWrapperTooltip,
    cloneButtonDisabled,
    deleteButtonWrapperClass,
    deleteButtonWrapperTooltip,
    deleteButtonDisabled,
  };
}
