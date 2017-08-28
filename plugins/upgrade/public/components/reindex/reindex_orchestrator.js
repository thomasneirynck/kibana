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
          if (error.statusCode === 403) {
            this.setState({
              loadingStatus: LOADING_STATUS.FORBIDDEN,
            });
          } else {
            this.setState({
              errorMessage: wrapErrorMessage(error.message, error),
              loadingStatus: LOADING_STATUS.FAILURE,

            });
          }

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

      attemptStep = ({
        stepName,
        performStep,
        handleSuccess = this.handleStepSuccess,
        handleError = this.handleStepError,
      }) => (
        // Partially apply all of the stuff which makes this step unique.
        async indexName => {
          try {
            await performStep(indexName);
            if (handleSuccess) {
              await handleSuccess(indexName, stepName);
            }
          } catch (error) {
            if (handleError) {
              await handleError(indexName, stepName, error, { indexName });
            }
          }
        }
      )

      reindexIndex = async (indexName) => {
        await this.stepCreateIndex(indexName);
        await this.stepSetReadOnly(indexName);
        await this.stepReindex(indexName);
        await this.stepRefreshIndex(indexName);
        await this.stepVerifyDocs(indexName);
        await this.stepReplaceIndex(indexName);
        await this.deleteReindexTask(indexName);
      }

      handleStepSuccess = async (indexName, stepName) => (
        this.addOrChangeStep(indexName, stepName, STEP_RESULTS.COMPLETED)
      )

      handleStepError = async (indexName, stepName, error, extra) => {
        if (!isCanceled(this.state.indices[indexName])) {
          this.addOrChangeStep(indexName, stepName, error, extra);
        }

        throw error;
      }

      stepCreateIndex = this.attemptStep({
        stepName: REINDEX_STEPS.CREATE_INDEX,
        performStep: async indexName => {
          const settings = await getMappingsAndSettings(indexName);
          await createIndex(indexName, settings);
        },
        handleError: async (indexName, stepName, error, extra) => {
          await this.handleStepError(indexName, stepName, error, {
            ...extra,
            taskId: error.taskId,
          });
        },
      });

      stepSetReadOnly = this.attemptStep({
        stepName: REINDEX_STEPS.SET_READONLY,
        performStep: async indexName => {
          await setReadOnly(indexName);
        }
      });

      stepReindex = this.attemptStep({
        stepName: REINDEX_STEPS.REINDEX,
        performStep: async indexName => {
          const { task } = await runReindex(indexName);
          await this.pollTask(indexName, task, REINDEX_STEPS.REINDEX);
        },
      });

      stepRefreshIndex = this.attemptStep({
        stepName: REINDEX_STEPS.REFRESH_INDEX,
        performStep: async indexName => {
          await refreshIndex(indexName);
        }
      });

      stepVerifyDocs = this.attemptStep({
        stepName: REINDEX_STEPS.VERIFY_DOCS,
        performStep: async indexName => {
          await verifyDocs(indexName);
        }
      });

      stepReplaceIndex = this.attemptStep({
        stepName: REINDEX_STEPS.REPLACE_INDEX,
        performStep: async indexName => {
          const response = await getSettingsAndAliases(indexName);
          const { settings, aliases } = response[indexName];
          await updateRefreshInterval(indexName, settings);
          await replaceIndex(indexName, aliases);
        }
      });

      deleteReindexTask = async (indexName) => {
        const taskId = this.findTaskId(indexName);
        await deleteTask(indexName, taskId);
      }

      upgradeIndex = async (indexName) => {
        await this.stepUpgrade(indexName);
        await this.deleteUpgradeTask(indexName);
      }

      stepUpgrade = this.attemptStep({
        stepName: UPGRADE_STEPS.UPGRADE,
        performStep: async indexName => {
          const { task } = await runUpgrade(indexName);
          await this.pollTask(indexName, task, UPGRADE_STEPS.UPGRADE);
        },
      });

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
        if (isCanceled(this.state.indices[indexName])) {
          throw new Error('Task canceled, stop polling');
        }

        this.addOrChangeStep(
          indexName,
          stepName,
          STEP_RESULTS.RUNNING,
          { taskId },
        );

        const details = await getTaskDetails(taskId);

        if (isCanceled(this.state.indices[indexName])) {
          throw new Error('Task canceled, stop polling');
        }

        if (details.completed) {
          return;
        }

        await timeout(HUMAN_READABLE_DELAY);
        await this.pollTask(indexName, taskId, stepName);
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
            cancelAction={this.cancelAction}
            indices={indices}
            loadingStatus={loadingStatus}
            errorMessage={errorMessage}
            progress={getProgress(indices)}
            resetAction={this.resetAction}
            processIndex={this.processIndex}
            loadIndices={this.loadIndices}
            {...this.props}
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
