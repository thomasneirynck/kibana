import _ from 'lodash';
import React, { Component } from 'react';
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
  isCanceled,
  wrapErrorMessage,
} from '../../lib';


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

      fetchIndices = async () => {
        try {
          const response = await getAssistance();
          this.setState({
            loadingStatus: LOADING_STATUS.SUCCESS,
          });
          return response;

        } catch (error) {
          this.setState({
            errorMessage: wrapErrorMessage(error.message, error),
            loadingStatus: LOADING_STATUS.FAILURE,

          });

          throw error;
        }
      }

      loadIndices = async () => {
        const indices = await this.fetchIndices();

        const newIndexStates = _.reduce(indices, ((acc, indexInfo, indexName) => ({
          ...acc,
          [indexName]: _.get(acc, indexName, createInitialIndexState(
            indexName,
            getActionType(indexInfo.action_required),
            indexInfo.taskId,
          )),
        })), {});

        this.setState((state) => ({
          ...state,
          indices: newIndexStates,
        }));
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
        await this.stepCreateIndex(indexName);
        await this.stepSetReadOnly(indexName);
        await this.stepReindex(indexName);
        await this.stepRefreshIndex(indexName);
        await this.stepVerifyDocs(indexName);
        await this.stepReplaceIndex(indexName);
        await this.deleteReindexTask(indexName);
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
          let stepPayload = {};
          if (error.code === ERR_CODES.ERR_REINDEX_IN_PROGRESS) {
            stepPayload = { taskId: error.taskId };
          }

          this.addOrChangeStep(
            indexName,
            REINDEX_STEPS.CREATE_INDEX,
            error,
            stepPayload,
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
          );

          throw error;
        }
      }

      stepReindex = async (indexName) => {
        try {
          const { task } = await runReindex(indexName);
          await this.pollTask(indexName, task, REINDEX_STEPS.REINDEX);
        } catch (error) {
          if (!isCanceled(this.state.indices[indexName])) {
            this.addOrChangeStep(
              indexName,
              REINDEX_STEPS.REINDEX,
              error,
            );
          }

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
          );

          throw error;
        }
      }

      deleteReindexTask = async (indexName) => {
        const taskId = this.findTaskId(indexName);
        await deleteTask(indexName, taskId);
      }

      upgradeIndex = async (indexName) => {
        await this.stepUpgrade(indexName);
        await this.deleteUpgradeTask(indexName);
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
          );

          throw error;
        }
      }

      deleteUpgradeTask = async (indexName) => {
        const taskId = this.findTaskId(indexName);
        await deleteTask(indexName, taskId);
      }

      cancelAction = async (indexName) => {
        const taskId = this.findTaskId(indexName);
        await cancelTask(taskId);
        const lastStepName = _.last(this.state.indices[indexName].steps).name;

        this.addOrChangeStep(
          indexName,
          lastStepName,
          STEP_RESULTS.CANCELED,
          { taskId },
        );

        await resetIndex(indexName, taskId);
      }

      resetAction = async (indexName) => {
        const taskId = this.findTaskId(indexName);
        await resetIndex(indexName, taskId);
        this.setState(state => ({
          ...state,
          indices: {
            ...state.indices,
            [indexName]: {
              ...state.indices[indexName],
              taskId: undefined,
              steps: [],
            },
          },
        }));
      }

      pollTask = async (indexName, taskId, stepName) => {
        try {
          if (isCanceled(this.state.indices[indexName])) {
            throw new Error('Task canceled, stop polling');
          }

          const details = await getTaskDetails(taskId);

          if (isCanceled(this.state.indices[indexName])) {
            throw new Error('Task canceled, stop polling');
          }

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
          if (!isCanceled(this.state.indices[indexName])) {
            this.addOrChangeStep(
              indexName,
              stepName,
              error,
              { taskId },
            );
          }

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
              ...extra,
              steps: [
                ...newSteps,
              ],
            },
          },
        }));
      }

      findTaskId = (indexName) => {
        return this.state.indices[indexName].taskId;
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

function createInitialIndexState(indexName, action, taskId) {
  let step;

  if (taskId) {
    step = {
      result: {
        code: ERR_CODES.ERR_REINDEX_IN_PROGRESS,
        taskId,
      },
      name: REINDEX_STEPS.CREATE_INDEX,
    };
  }

  return {
    name: indexName,
    action,
    taskId: taskId,
    steps: taskId ? [ step ] : [],
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
