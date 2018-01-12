import React from 'react';
import { DetailDrawer } from '../detail_drawer';
import { shallow } from 'enzyme';

describe('DetailDrawer component', () => {
  let onHide;
  beforeEach(() => {
    onHide = jest.fn();
  });

  test('shows vertex title', () => {
    const vertex = {
      title: 'grok'
    };

    const component = (
      <DetailDrawer
        vertex={vertex}
        onHide={onHide}
      />
    );
    const renderedComponent = shallow(component);
    expect(renderedComponent).toMatchSnapshot();
  });

  test('calls onHide function when close button is clicked', () => {
    const vertex = {
      title: 'grok'
    };

    const component = (
      <DetailDrawer
        vertex={vertex}
        onHide={onHide}
      />
    );
    const renderedComponent = shallow(component);
    renderedComponent.find('EuiButtonIcon').simulate('click');
    expect(onHide.mock.calls.length).toEqual(1);
  });

  describe('Plugin vertices', () => {
    describe('Plugin has explicit ID', () => {
      test('shows basic info and stats for plugin, including explicit ID', () => {
        const vertex = {
          title: 'grok',
          typeString: 'plugin',
          pluginType: 'filter',
          hasExplicitId: true,
          id: 'parse_apache_logline',
          stats: {
            events_in: 200,
            events_out: 200,
            millis_per_event: 0.21
          },
          eventsPerSecond: 32
        };

        const component = (
          <DetailDrawer
            vertex={vertex}
            onHide={onHide}
          />
        );
        const renderedComponent = shallow(component);
        expect(renderedComponent).toMatchSnapshot();
      });
    });

    describe('Plugin does not have explicit ID', () => {
      test('shows basic info and stats for plugin, suggesting that user set explicit ID', () => {
        const vertex = {
          title: 'grok',
          typeString: 'plugin',
          pluginType: 'filter',
          hasExplicitId: false,
          id: 'foobarbazqux',
          stats: {
            events_in: 200,
            events_out: 200,
            millis_per_event: 0.21
          },
          eventsPerSecond: 32
        };

        const component = (
          <DetailDrawer
            vertex={vertex}
            onHide={onHide}
          />
        );
        const renderedComponent = shallow(component);
        expect(renderedComponent).toMatchSnapshot();
      });
    });
  });

  describe('If vertices', () => {
    test('shows basic info and no stats for if', () => {
      const vertex = {
        title: 'if',
        typeString: 'if',
        subtitle: {
          complete: '[type] == "apache_log"'
        }
      };

      const component = (
        <DetailDrawer
          vertex={vertex}
          onHide={onHide}
        />
      );
      const renderedComponent = shallow(component);
      expect(renderedComponent).toMatchSnapshot();
    });
  });

  describe('Queue vertices', () => {
    test('shows basic info and no stats for queue', () => {
      const vertex = {
        title: 'queue',
        typeString: 'queue'
      };

      const component = (
        <DetailDrawer
          vertex={vertex}
          onHide={onHide}
        />
      );
      const renderedComponent = shallow(component);
      expect(renderedComponent).toMatchSnapshot();
    });
  });
});
