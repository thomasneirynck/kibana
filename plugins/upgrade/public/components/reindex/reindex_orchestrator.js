import _, { get as resolve } from 'lodash';
import React, { Component } from 'react';
import { Notifier } from 'ui/notify/notifier';
import {
  HUMAN_READABLE_DELAY,
  REINDEX_STEPS,
  UPGRADE_STEPS,
  INDEX_ACTION,
  STEP_RESULTS,
  LOADING_STATUS,
} from '../../lib/constants';

import { ERR_CODES } from '../../../common/constants';

import {
  timeout,
  getAssistance,
  getMappingsAndSettings,
  createIndex,
  setReadOnly,
  runReindex,
  getTaskDetails,
  refreshIndex,
  verifyDocs,
  getSettingsAndAliases,
  updateRefreshInterval,
  replaceIndex,
  deleteTask,
  resetIndex,
  cancelTask,
  runUpgrade,
  isCompleted,
  isFailed,
  isNotStarted,
  isRunning,
  wrapErrorMessage,
} from '../../lib';

const notify = new Notifier({ location: 'Upgrade Assistant Reindex Helper' });

export function withReindexOrchestrator() {
  return function wrapComponentWithOrchestrator(WrappedComponent) {
    return class ReindexOrchestrator extends Component {
      state = {
        indices: {},
        errorMessage: null,
        loadingStatus: LOADING_STATUS.UNINITIALIZED,
      }

      componentDidMount() {
        this.loadIndices();
      }

      handleSuccess = () => {
        this.setState({
          loadingStatus: LOADING_STATUS.SUCCESS,
        });
      }

      handleFailure = (error) => {
        this.setState({
          errorMessage: wrapErrorMessage(error.message, error),
          loadingStatus: LOADING_STATUS.FAILURE,

        });
      }

      callAssistanceAPI = async () => {
        try {
          const response = await getAssistance();
          this.handleSuccess();
          return response;

        } catch (error) {
          this.handleFailure(error);
          throw error;
        }
      }

      loadIndices = async () => {
        try {
          const response = await this.callAssistanceAPI();
          const newIndices = _.reduce(response.indices, ((currentIndices, indexInfo, indexName) => ({
            ...currentIndices,
            [indexName]: resolve(currentIndices, indexName, createInitialIndexState(
              indexName,
              getActionType(indexInfo.action_required),
            )),
          })), this.state.indices);

          this.setState((state) => ({
            ...state,
            indices: {
              ...state.indices,
              ...newIndices,
            },
          }));

        } catch (error) {
          notify.error(error);
        }
      }

      processIndex = (indexName) => {
        const indexState = this.state.indices[indexName];

        switch (indexState.action) {
          case INDEX_ACTION.TYPE.REINDEX:
            return this.reindexIndex(indexName);
          case INDEX_ACTION.TYPE.UPGRADE:
            return this.upgradeIndex(indexName);
          default:
            throw new Error(`Invalid action type: ${ indexState.action }`);
        }
      }

      reindexIndex = async (indexName) => {
        try {
          await this.stepCreateIndex(indexName);
          await this.stepSetReadOnly(indexName);
          await this.stepReindex(indexName);
          await this.stepRefreshIndex(indexName);
          await this.stepVerifyDocs(indexName);
          await this.stepReplaceIndex(indexName);
          await this.deleteReindexTask(indexName);

        } catch (error) {
          // throw delete task errors but show success
          if (error.code === ERR_CODES.ERR_DELETE_TASK_FAILED) {
            throw error;
          } else {
            notify.error(error);
            throw error;
          }
        }
      }

      stepCreateIndex = async (indexName) => {
        try {
          const settings = await getMappingsAndSettings(indexName);
          await createIndex(indexName, settings);
          this.addOrChangeStep(
            indexName,
            REINDEX_STEPS.CREATE_INDEX,
            STEP_RESULTS.COMPLETED,
          );
        } catch (error) {
          this.addOrChangeStep(
            indexName,
            REINDEX_STEPS.CREATE_INDEX,
            error,
            { indexName },
          );
          throw error;
        }
      }

      stepSetReadOnly = async (indexName) => {
        try {
          await setReadOnly(indexName);
          this.addOrChangeStep(
            indexName,
            REINDEX_STEPS.SET_READONLY,
            STEP_RESULTS.COMPLETED,
          );
        } catch (error) {
          this.addOrChangeStep(
            indexName,
            REINDEX_STEPS.SET_READONLY,
            error,
            { indexName },
          );
          throw error;
        }
      }

      stepReindex = async (indexName) => {
        try {
          const { task } = await runReindex(indexName);
          await this.pollTask(indexName, task, REINDEX_STEPS.REINDEX);
        } catch (error) {
          this.addOrChangeStep(
            indexName,
            REINDEX_STEPS.REINDEX,
            error,
            { indexName },
          );
          throw error;
        }
      }

      stepRefreshIndex = async (indexName) => {
        try {
          await refreshIndex(indexName);
          this.addOrChangeStep(
            indexName,
            REINDEX_STEPS.REFRESH_INDEX,
            STEP_RESULTS.COMPLETED,
          );
        } catch (error) {
          this.addOrChangeStep(
            indexName,
            REINDEX_STEPS.REFRESH_INDEX,
            error,
            { indexName },
          );
          throw error;
        }
      }

      stepVerifyDocs = async (indexName) => {
        try {
          await verifyDocs(indexName);
          this.addOrChangeStep(
            indexName,
            REINDEX_STEPS.VERIFY_DOCS,
            STEP_RESULTS.COMPLETED,
          );
        } catch (error) {
          this.addOrChangeStep(
            indexName,
            REINDEX_STEPS.VERIFY_DOCS,
            error,
            { indexName },
          );
          throw error;
        }
      }

      stepReplaceIndex = async (indexName) => {
        try {
          const response = await getSettingsAndAliases(indexName);
          const { settings, aliases } = response[indexName];

          await updateRefreshInterval(indexName, settings);

          await replaceIndex(indexName, aliases);

          this.addOrChangeStep(
            indexName,
            REINDEX_STEPS.REPLACE_INDEX,
            STEP_RESULTS.COMPLETED,
          );
        } catch (error) {
          this.addOrChangeStep(
            indexName,
            REINDEX_STEPS.REPLACE_INDEX,
            error,
            { indexName },
          );
          throw error;
        }
      }

      deleteReindexTask = async (indexName) => {
        const { taskId } = _.find(
          this.state.indices[indexName].steps,
          { 'name': REINDEX_STEPS.REINDEX },
        );

        await deleteTask(indexName, taskId);
      }

      upgradeIndex = async (indexName) => {
        try {
          await this.stepUpgrade(indexName);
          await this.deleteUpgradeTask(indexName);

        } catch (error) {
          // catch delete task errors and show success
          if (error.code === ERR_CODES.ERR_DELETE_TASK_FAILED) {
            error.message += ' Unable to delete completed task, but upgrade successful.';
            notify.info(error);
          } else {
            notify.error(error);
            throw error;
          }
        }
      }

      stepUpgrade = async (indexName) => {
        try {
          const { task } = await runUpgrade(indexName);
          await this.pollTask(indexName, task, UPGRADE_STEPS.UPGRADE);
        } catch (error) {
          this.addOrChangeStep(
            indexName,
            UPGRADE_STEPS.UPGRADE,
            error,
            { indexName },
          );
          throw error;
        }
      }

      deleteUpgradeTask = async (indexName) => {
        const { taskId } = _.find(
          this.state.indices[indexName].steps,
          { 'name': UPGRADE_STEPS.UPGRADE },
        );

        await deleteTask(indexName, taskId);
      }

      cancelAction = async (indexName) => {
        try {
          const taskId = this.findTaskId(indexName);

          await cancelTask(taskId);
          await this.resetAction(indexName);

        } catch (error) {
          notify.error(error);
          throw error;
        }
      }

      resetAction = async (indexName) => {
        try {
          const taskId = this.findTaskId(indexName);

          await resetIndex(indexName, taskId);
          this.setState(state => ({
            ...state,
            indices: {
              ...state.indices,
              [indexName]: {
                ...state.indices[indexName],
                steps: [],
              },
            },
          }));

        } catch (error) {
          notify.error(error);
          throw error;
        }
      }

      pollTask = async (indexName, taskId, stepName) => {
        try {
          const details = await getTaskDetails(taskId);

          if (details.completed) {
            this.addOrChangeStep(
              indexName,
              stepName,
              STEP_RESULTS.COMPLETED,
              { taskId },
            );

          } else {
            this.addOrChangeStep(
              indexName,
              stepName,
              STEP_RESULTS.RUNNING,
              { taskId },
            );
            await timeout(HUMAN_READABLE_DELAY);
            await this.pollTask(indexName, taskId, stepName);
          }

        } catch (error) {
          this.addOrChangeStep(
            indexName,
            stepName,
            error,
            { taskId },
          );

          throw error;
        }
      }

      addOrChangeStep = (indexName, name, result, extra) => {
        const steps = [...this.state.indices[indexName].steps];
        const oldStep = _.find(steps, { 'name': name });
        let newSteps;
        let newStep;

        if (oldStep) {
          newStep = { ...oldStep, result, ...extra };
          newSteps = [..._.without(steps, oldStep), newStep];
        } else {
          newStep = { name, result, ...extra };
          newSteps = [...steps, newStep];
        }

        this.setState(state => ({
          ...state,
          indices: {
            ...state.indices,
            [indexName]: {
              ...state.indices[indexName],
              steps: [
                ...newSteps,
              ],
            },
          },
        }));
      }

      findTaskId = (indexName) => {
        const step =
          _.find(
            this.state.indices[indexName].steps,
            { 'name': REINDEX_STEPS.REINDEX },
          ) ||
          _.find(
            this.state.indices[indexName].steps,
            { 'name': UPGRADE_STEPS.UPGRADE },
          );

        return step ? step.taskId : undefined;
      }

      render() {
        const { indices, loadingStatus, errorMessage } = this.state;

        return (
          <WrappedComponent
            cancelAction={ this.cancelAction }
            indices={ indices }
            loadingStatus={ loadingStatus }
            errorMessage={ errorMessage }
            progress={ getProgress(indices) }
            resetAction={ this.resetAction }
            processIndex={ this.processIndex }
            loadIndices={ this.loadIndices }
            { ...this.props }
          />
        );
      }
    };
  };
}

function createInitialIndexState(indexName, action) {
  return {
    name: indexName,
    action,
    steps: [
    ],
  };
}

function getProgress(indices) {
  return {
    completed: 0,
    failed: 0,
    running: 0,
    notStarted: 0,
    unknown: 0,
    ...(_.countBy(indices, index => {
      if (isCompleted(index)) {
        return 'completed';
      } else if (isFailed(index)) {
        return 'failed';
      } else if (isRunning(index)) {
        return 'running';
      } else if (isNotStarted(index)) {
        return 'notStarted';
      } else {
        return 'unknown';
      }
    })),
  };
}

function getActionType(actionRequired) {
  switch (actionRequired) {
    case 'reindex':
      return INDEX_ACTION.TYPE.REINDEX;
    case 'upgrade':
      return INDEX_ACTION.TYPE.UPGRADE;
    default:
      return null;
  }
}
