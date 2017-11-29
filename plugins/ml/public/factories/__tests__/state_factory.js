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

import expect from 'expect.js';
import ngMock from 'ng_mock';

import { stateFactoryProvider } from '../state_factory';

describe('ML - mlStateFactory', () => {
  let stateFactory;

  beforeEach(ngMock.module('kibana'));
  beforeEach(ngMock.inject(($injector) => {
    const Private = $injector.get('Private');
    stateFactory = Private(stateFactoryProvider);
  }));

  it('Throws an error when called without arguments.', () => {
    expect(() => stateFactory()).to.throwError();
  });

  it('Initializes a custom state store, sets and gets a test value.', () => {
    const state = stateFactory('testName');
    state.set('testValue', 10);
    expect(state.get('testValue')).to.be(10);
  });

  it('Initializes a custom state store, sets and gets a test value using events.', (done) => {
    const state = stateFactory('testName');
    console.log('state', state);

    state.watch(() => {
      expect(state.get('testValue')).to.be(10);
      done();
    });

    state.set('testValue', 10);
    state.changed();
  });
});
