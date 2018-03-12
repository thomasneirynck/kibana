import React from 'react';
import sinon from 'sinon';
import { mount } from 'enzyme';
import { ExplainCollectionEnabled } from '../collection_enabled';
import { findTestSubject } from '@elastic/eui/lib/test';

const enabler = {};
let component;

describe('ExplainCollectionEnabled', () => {
  beforeEach(() => {
    enabler.enableCollectionEnabled = sinon.spy();
    component = (
      <ExplainCollectionEnabled
        context="cluster"
        property="xpack.monitoring.collection.enabled"
        data="-1"
        enabler={enabler}
      />
    );
  });

  test('should explain about xpack.monitoring.collection.enabled setting', () => {
    const rendered = mount(component);
    expect(rendered).toMatchSnapshot();
  });

  test('should have a button that triggers ajax action', () => {
    const rendered = mount(component);
    const actionButton = findTestSubject(rendered, 'enableCollectionEnabled');
    actionButton.simulate('click');
    expect(enabler.enableCollectionEnabled.calledOnce).toBe(true);
  });
});
