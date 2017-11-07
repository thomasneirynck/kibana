import React from 'react';
import { mount } from 'enzyme';
import toDiffableHtml from 'diffable-html';
import { KibanaLinkComponent } from '../url';

describe('KibanaLinkComponent', () => {
  let wrapper;

  beforeEach(() => {
    const discoverQuery = {
      _a: {
        interval: 'auto',
        query: {
          language: 'lucene',
          query: `context.app.name:myAppName AND error.grouping_key:myGroupId`
        },
        sort: { '@timestamp': 'desc' }
      }
    };

    wrapper = mount(
      <KibanaLinkComponent
        location={{ search: '' }}
        pathname={'/app/kibana'}
        hash={'/discover'}
        query={discoverQuery}
      >
        Go to Discover
      </KibanaLinkComponent>
    );
  });

  it('should have correct url', () => {
    expect(wrapper.find('a').prop('href')).toBe(
      "/app/kibana#/discover?_g=&_a=(interval:auto,query:(language:lucene,query:'context.app.name:myAppName AND error.grouping_key:myGroupId'),sort:('@timestamp':desc))"
    );
  });

  it('should render correct markup', () => {
    expect(toDiffableHtml(wrapper.html())).toMatchSnapshot();
  });
});
