import React from 'react';
import { MemoryRouter } from 'react-router';
import { mount } from 'enzyme';
import toDiffableHtml from 'diffable-html';
import {
  toQuery,
  fromQuery,
  KibanaLinkComponent,
  RelativeLinkComponent
} from '../url';

describe('toQuery', () => {
  it('should parse string to object', () => {
    expect(toQuery('?foo=bar&name=john%20doe')).toEqual({
      foo: 'bar',
      name: 'john doe'
    });
  });
});

describe('fromQuery', () => {
  it('should parse object to string', () => {
    expect(
      fromQuery({
        foo: 'bar',
        name: 'john doe'
      })
    ).toEqual('foo=bar&name=john%20doe');
  });

  it('should not encode _a and _g', () => {
    expect(
      fromQuery({
        g: 'john doe',
        _g: 'john doe',
        a: ":'",
        _a: ":'"
      })
    ).toEqual("g=john%20doe&_g=john doe&a=%3A'&_a=:'");
  });
});

describe('RelativeLinkComponent', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = mount(
      <MemoryRouter>
        <RelativeLinkComponent
          location={{
            pathname: '/opbeans-backend/transactions',
            search:
              '?_g=(refreshInterval:(display:Off,pause:!f,value:0),time:(from:now-2y,mode:quick,to:now))'
          }}
          path={'/opbeans-backend/errors'}
          query={{}}
        >
          Errors
        </RelativeLinkComponent>
      </MemoryRouter>
    );
  });

  it('should have correct url', () => {
    expect(wrapper.find('a').prop('href')).toBe(
      '/opbeans-backend/errors?_g=(refreshInterval:(display:Off,pause:!f,value:0),time:(from:now-2y,mode:quick,to:now))'
    );
  });

  it('should render correct markup', () => {
    expect(toDiffableHtml(wrapper.html())).toMatchSnapshot();
  });
});

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
