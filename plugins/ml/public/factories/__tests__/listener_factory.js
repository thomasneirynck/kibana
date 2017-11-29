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

import { listenerFactoryProvider } from '../listener_factory';

describe('ML - mlListenerFactory', () => {
  let listenerFactory;

  beforeEach(ngMock.module('kibana'));
  beforeEach(ngMock.inject(($injector) => {
    const Private = $injector.get('Private');
    listenerFactory = Private(listenerFactoryProvider);
  }));

  it('Calling factory doesn\'t throw.', () => {
    expect(() => listenerFactory()).to.not.throwError('Not initialized.');
  });

  it('Fires an event and listener receives value.', (done) => {
    const listener = listenerFactory();

    listener.watch((value) => {
      expect(value).to.be('test');
      done();
    });

    listener.changed('test');
  });
});
