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

import _ from 'lodash';

import listenerFactoryProvider from './listener_factory';

// A data store to be able to share persistent state across directives
// in services more conveniently when the structure of angular directives
// doesn't allow the use of controllers to share state.

// Offers set()/get() to store and fetch automatically persisted data
// Includes watch()/unwatch()/changed() to be able to subscribe to data changes
// Have a look at the unit tests which demonstrate basic usage.

export default (AppState) => {
  return function (stateName, defaultState) {
    if (typeof stateName !== 'string') {
      throw 'stateName needs to be of type `string`';
    }

    const appState = new AppState();
    appState.fetch();

    // Store the state to the AppState so that it's
    // restored on page refresh.
    if (appState[stateName] === undefined) {
      appState[stateName] = defaultState || {};
    }

    // If defaultState is defined, check if the keys of the defaultState
    // match the one from appState, if not, fall back to the defaultState.
    // If we didn't do this, the structure of an out-of-date appState
    // might break some follow up code. Note that this will not catch any
    // deeper nested inconsistencies.
    if (typeof defaultState !== 'undefined' && appState[stateName] !== defaultState) {
      if (!_.isEqual(
        Object.keys(defaultState).sort(),
        Object.keys(appState[stateName]).sort()
      )) {
        appState[stateName] = defaultState;
      }
    }

    const state = appState[stateName];

    const set = function (name, value) {
      state[name] = value;
      appState[stateName] = state;
      appState.save();
    };

    const get = function (name) {
      return state[name];
    };

    const listenerFactory = listenerFactoryProvider();

    // return the state's API: a getter/setter as well as the methods
    // watch/unwatch/changed to be able to create and use listeners
    // on the state.
    return {
      set,
      get,
      ...listenerFactory()
    };
  };
};
